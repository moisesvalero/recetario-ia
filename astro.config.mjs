// @ts-check
import { defineConfig, envField } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      GOOGLE_GENERATIVE_AI_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      PUBLIC_APPWRITE_ENDPOINT: envField.string({
        context: "client",
        access: "public",
        optional: true,
        default: "https://cloud.appwrite.io/v1",
      }),
      PUBLIC_APPWRITE_PROJECT_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_APPWRITE_DATABASE_ID: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_APPWRITE_COLLECTION_RECETAS: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
});
