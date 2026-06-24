import { z } from "zod";

export const recipeDifficultySchema = z.enum(["fácil", "media", "difícil"]);

export const recipeIngredientSchema = z.object({
  item: z.string(),
  amount: z.string(),
});

export const recipeStepSchema = z.object({
  text: z.string(),
  timerMinutes: z.number().optional(),
});

export const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  prepMinutes: z.number(),
  cookMinutes: z.number(),
  servings: z.number(),
  difficulty: recipeDifficultySchema,
  ingredients: z.array(recipeIngredientSchema),
  steps: z.array(recipeStepSchema),
  tips: z.array(z.string()).optional(),
});

export const recipeConstraintsSchema = z.object({
  maxMinutes: z.number().optional(),
  servings: z.number().optional(),
  diet: z.string().optional(),
  difficulty: recipeDifficultySchema.optional(),
});

export const generateRecipeRequestSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1),
  constraints: recipeConstraintsSchema.optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;
export type RecipeStep = z.infer<typeof recipeStepSchema>;
export type RecipeDifficulty = z.infer<typeof recipeDifficultySchema>;
export type RecipeConstraints = z.infer<typeof recipeConstraintsSchema>;
export type GenerateRecipeRequest = z.infer<typeof generateRecipeRequestSchema>;

export type StoredRecipe = Recipe & {
  id: string;
  createdAt: string;
};

export const HISTORY_STORAGE_KEY = "recetario:history";

export function buildRecipePrompt(
  ingredients: string[],
  constraints?: RecipeConstraints,
): string {
  const lines = [
    "Genera una receta en español usando principalmente estos ingredientes:",
    ingredients.map((item) => `- ${item}`).join("\n"),
    "",
    "Puedes asumir básicos de despensa: sal, pimienta, aceite, agua.",
    "No inventes utensilios raros ni ingredientes que no estén listados salvo los básicos.",
    "Devuelve cantidades claras y pasos accionables.",
  ];

  if (constraints?.maxMinutes) {
    lines.push(`Tiempo máximo total: ${constraints.maxMinutes} minutos.`);
  }
  if (constraints?.servings) {
    lines.push(`Porciones: ${constraints.servings}.`);
  }
  if (constraints?.diet) {
    lines.push(`Dieta o restricción: ${constraints.diet}.`);
  }
  if (constraints?.difficulty) {
    lines.push(`Dificultad deseada: ${constraints.difficulty}.`);
  }

  return lines.join("\n");
}

export function createStoredRecipe(recipe: Recipe): StoredRecipe {
  return {
    ...recipe,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
