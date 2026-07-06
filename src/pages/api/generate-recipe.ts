import type { APIRoute } from "astro";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import {
  GOOGLE_GENERATIVE_AI_API_KEY,
  OPENROUTER_API_KEY,
} from "astro:env/server";
import {
  buildRecipePrompt,
  generateRecipeRequestSchema,
  recipeSchema,
  type RecipeConstraints,
} from "../../lib/recipe-schema";

export const prerender = false;

const openrouter = createOpenAI({
  apiKey: OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM_PROMPT =
  "Eres un cocinero casero práctico. Respondes siempre en español con recetas realistas, claras y ejecutables en una cocina doméstica.";

type ProviderName = "google" | "openrouter";

function buildProviderChain(): ProviderName[] {
  const chain: ProviderName[] = [];
  if (GOOGLE_GENERATIVE_AI_API_KEY) chain.push("google");
  if (OPENROUTER_API_KEY) chain.push("openrouter");
  return chain;
}

function resolveModel(provider: ProviderName): LanguageModel {
  switch (provider) {
    case "google":
      return google("gemini-1.5-flash");
    case "openrouter":
      return openrouter("google/gemini-2.0-flash-exp:free");
  }
}

async function tryGenerate(
  provider: ProviderName,
  ingredients: string[],
  constraints: RecipeConstraints | undefined,
) {
  const { object } = await generateObject({
    model: resolveModel(provider),
    schema: recipeSchema,
    system: SYSTEM_PROMPT,
    prompt: buildRecipePrompt(ingredients, constraints),
  });
  return { provider, object };
}

export const POST: APIRoute = async ({ request }) => {
  const chain = buildProviderChain();

  if (chain.length === 0) {
    return new Response(
      JSON.stringify({
        error:
          "Falta GOOGLE_GENERATIVE_AI_API_KEY y OPENROUTER_API_KEY. Configura al menos una en .env.",
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

  const errors: Record<string, string> = {};

  for (const provider of chain) {
    try {
      const { object } = await tryGenerate(provider, ingredients, constraints);

      if (!object) {
        errors[provider] = "El modelo no devolvió una receta válida";
        continue;
      }

      return new Response(JSON.stringify({ recipe: object, provider }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      errors[provider] = message;
    }
  }

  return new Response(
    JSON.stringify({
      error: "Todos los proveedores fallaron",
      providers: errors,
    }),
    { status: 502, headers: { "Content-Type": "application/json" } },
  );
};
