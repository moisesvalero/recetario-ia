import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Configuración de cabeceras HTTP de seguridad
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.appwrite.io https://fra.cloud.appwrite.io https://cloud.appwrite.io https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: https://*.googleusercontent.com https://*.appwrite.io; connect-src 'self' https://*.appwrite.io https://fra.cloud.appwrite.io https://cloud.appwrite.io https://generativelanguage.googleapis.com https://openrouter.ai https://accounts.google.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://*.appwrite.io https://fra.cloud.appwrite.io https://cloud.appwrite.io https://accounts.google.com;",
  );
  if (!response.headers.has("Cache-Control")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    );
  }

  if (response.headers.get("content-type")?.includes("text/html")) {
    const html = await response.text();
    const transformed = html.replace(/<script>(?!<\/script>)/gi, '<script type="module">');
    return new Response(transformed, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return response;
});
