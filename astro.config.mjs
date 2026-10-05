// @ts-check
import { defineConfig, envField } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { readFileSync } from "node:fs";

/**
 * Lee una variable del .env sin depender de `vite` (no es dependencia directa de
 * este proyecto, así que no se puede importar `loadEnv`).
 *
 * @param {string} nombre
 * @returns {string | undefined}
 */
function leerDeEnv(nombre) {
  for (const fichero of [".env.local", ".env"]) {
    try {
      const linea = readFileSync(fichero, "utf8")
        .split("\n")
        .find((fila) => fila.startsWith(`${nombre}=`));
      if (linea)
        return linea
          .slice(nombre.length + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
    } catch {
      // El fichero no existe: se prueba con el siguiente.
    }
  }
  return undefined;
}

/**
 * Deja la cookie de sesión sin `domain=`, para que el navegador la acepte como
 * propia. Las demás cookies se dejan intactas: la que valida la vuelta del login
 * (`a_oauth2_<proyecto>`) tiene que seguir siendo de Appwrite.
 *
 * @param {string} galleta
 * @returns {string}
 */
function reubicarCookie(galleta) {
  return /^\s*a_session_/i.test(galleta)
    ? galleta.replace(/;\s*domain=[^;]*/gi, "")
    : galleta;
}

/** Endpoint directo de Appwrite, solo para el proxy de desarrollo. En producción
 *  lo lee el propio proxy desde `astro:env`. */
const appwriteDirecto =
  process.env.PUBLIC_APPWRITE_ENDPOINT || leerDeEnv("PUBLIC_APPWRITE_ENDPOINT");

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // En desarrollo, el mismo proxy que en producción (src/pages/appwrite). Sin
      // él, la cookie de sesión sería de terceros también en local. Si no se sabe
      // el endpoint, no se monta nada y todo sigue como antes.
      proxy: appwriteDirecto
        ? {
            "/appwrite": {
              target: appwriteDirecto,
              changeOrigin: true,
              rewrite: (ruta) => ruta.replace(/^\/appwrite/, ""),
              configure: (proxy) => {
                proxy.on("proxyRes", (respuesta) => {
                  const cabeceras =
                    /** @type {Record<string, string | string[] | undefined>} */ (
                      respuesta.headers
                    );
                  const galletas = cabeceras["set-cookie"];
                  if (typeof galletas === "string") {
                    cabeceras["set-cookie"] = reubicarCookie(galletas);
                  } else if (Array.isArray(galletas)) {
                    cabeceras["set-cookie"] = galletas.map(reubicarCookie);
                  }
                });
              },
            },
          }
        : undefined,
    },
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
      PUBLIC_APPWRITE_COLLECTION_MENU: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
});
