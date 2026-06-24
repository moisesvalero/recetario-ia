import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const recipes = defineCollection({
  loader: glob({ base: "./src/content/recipes", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    prepMinutes: z.number(),
    cookMinutes: z.number(),
    servings: z.number(),
    difficulty: z.enum(["fácil", "media", "difícil"]),
    tags: z.array(z.string()).default([]),
    ingredients: z.array(
      z.object({
        item: z.string(),
        amount: z.string(),
      }),
    ),
  }),
});

export const collections = { recipes };
