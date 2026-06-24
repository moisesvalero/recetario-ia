import { describe, expect, it } from "vitest";
import { buildRecipePrompt, recipeSchema } from "./recipe-schema";

describe("recipeSchema", () => {
  it("valida una receta completa", () => {
    const result = recipeSchema.safeParse({
      title: "Tortilla rápida",
      description: "Una tortilla sencilla para cenar.",
      prepMinutes: 10,
      cookMinutes: 15,
      servings: 2,
      difficulty: "fácil",
      ingredients: [{ item: "huevos", amount: "4" }],
      steps: [{ text: "Batir los huevos", timerMinutes: 2 }],
      tips: ["Usa fuego medio"],
    });

    expect(result.success).toBe(true);
  });
});

describe("buildRecipePrompt", () => {
  it("incluye ingredientes y restricciones", () => {
    const prompt = buildRecipePrompt(["pollo", "arroz"], {
      maxMinutes: 30,
      servings: 4,
      diet: "sin gluten",
      difficulty: "media",
    });

    expect(prompt).toContain("pollo");
    expect(prompt).toContain("arroz");
    expect(prompt).toContain("30 minutos");
    expect(prompt).toContain("sin gluten");
  });
});
