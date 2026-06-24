import type { APIRoute } from "astro";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { OPENAI_API_KEY } from "astro:env/server";
import {
  buildRecipePrompt,
  generateRecipeRequestSchema,
  recipeSchema,
} from "../../lib/recipe-schema";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Falta OPENAI_API_KEY. Copia .env.example a .env y añade tu clave.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = generateRecipeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Petición inválida",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { ingredients, constraints } = parsed.data;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: recipeSchema,
      system:
        "Eres un cocinero casero práctico. Respondes siempre en español con recetas realistas, claras y ejecutables en una cocina doméstica.",
      prompt: buildRecipePrompt(ingredients, constraints),
    });

    if (!object) {
      return new Response(
        JSON.stringify({ error: "No se pudo generar la receta" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ recipe: object }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";

    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
