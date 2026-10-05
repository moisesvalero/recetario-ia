/**
 * Proxy hacia Appwrite.
 *
 * Por qué existe: Appwrite guarda la sesión en una cookie marcada con **su**
 * dominio:
 *
 *   set-cookie: a_session_xxx=...; domain=.fra.cloud.appwrite.io; secure; HttpOnly
 *
 * Para la app esa cookie es de terceros, así que Safari, iOS y Chrome (con el
 * bloqueo de cookies de terceros activado) la descartan, y el login se queda en
 * bucle: entras con Google y vuelves a la pantalla de inicio.
 *
 * Con este proxy todas las llamadas salen por nuestro propio dominio y vuelven
 * con el `domain=` quitado, así que la cookie se guarda como de primera parte.
 * Un `rewrite` de Vercel no sirve para esto: reenvía la cabecera tal cual, y hay
 * que reescribirla.
 *
 * Ojo con dos cosas que ya costaron un rato:
 *
 * 1. Solo se reubica la cookie **de sesión** (`a_session_*`). Las demás se dejan
 *    intactas: las que no llevan `domain=` se guardan en el host que responde, y
 *    eso importa para `a_oauth2_<proyecto>`, que valida la vuelta del login. Por
 *    eso el arranque del login no pasa por aquí (ver `abrirLoginConGoogle`).
 * 2. El service worker no debe interceptar `/appwrite` (ver `public/sw.js`), o se
 *    comerá la navegación del login y devolverá el HTML de la app.
 *
 * No hay ningún secreto aquí: es el mismo endpoint público y el mismo project ID.
 * Los permisos se deciden, como antes, documento a documento con `user:<id>`.
 */
import type { APIRoute } from "astro";
import { PUBLIC_APPWRITE_ENDPOINT } from "astro:env/client";

export const prerender = false;

const APPWRITE = (
  PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"
).replace(/\/+$/, "");

/** Cabeceras que no deben reenviarse tal cual. */
const A_QUITAR = new Set([
  "host",
  "content-length",
  "accept-encoding",
  "connection",
]);

/** Devuelve todas las `Set-Cookie` de una respuesta, con o sin `getSetCookie`. */
function galletasDe(cabeceras: Headers): string[] {
  if (typeof cabeceras.getSetCookie === "function")
    return cabeceras.getSetCookie();
  const suelta = cabeceras.get("set-cookie");
  return suelta ? [suelta] : [];
}

export const ALL: APIRoute = async ({ request, params }) => {
  const ruta = (params.ruta ?? "").replace(/^\/+/, "");
  const entrada = new URL(request.url);
  const destino = `${APPWRITE}/${ruta}${entrada.search}`;

  const cabeceras = new Headers();
  for (const [nombre, valor] of request.headers) {
    if (!A_QUITAR.has(nombre.toLowerCase())) cabeceras.set(nombre, valor);
  }
  // Sin compresión: así el cuerpo se reenvía tal cual y no hay dudas sobre si
  // hay que tocar `content-encoding`.
  cabeceras.set("accept-encoding", "identity");

  const tieneCuerpo = request.method !== "GET" && request.method !== "HEAD";

  const respuesta = await fetch(destino, {
    method: request.method,
    headers: cabeceras,
    body: tieneCuerpo ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const salida = new Headers(respuesta.headers);
  salida.delete("content-length");
  salida.delete("content-encoding");

  const galletas = galletasDe(respuesta.headers);
  if (galletas.length > 0) {
    salida.delete("set-cookie");
    for (const galleta of galletas) {
      salida.append(
        "set-cookie",
        /^\s*a_session_/i.test(galleta)
          ? galleta.replace(/;\s*domain=[^;]*/gi, "")
          : galleta,
      );
    }
  }

  return new Response(respuesta.body, {
    status: respuesta.status,
    headers: salida,
  });
};
