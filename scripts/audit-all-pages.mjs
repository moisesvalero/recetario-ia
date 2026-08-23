import fs from "node:fs";
import { runSyraxAudit, printAuditSummary } from "./audit-runner.mjs";

async function auditAllPages() {
  const { default: app } = await import("../.vercel/output/_functions/entry.mjs");

  const staticHeaders = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    "content-encoding": "gzip",
    "server": "Vercel",
    "x-vercel-id": "cdg1::iad1::12345-67890",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "cross-origin-embedder-policy": "require-corp",
    "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cloud.appwrite.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://cloud.appwrite.io https://generativelanguage.googleapis.com https://openrouter.ai; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
  };

  const pages = [
    {
      name: "Inicio / Generador (SSR)",
      url: "https://recetario.moisesvalero.es/",
      async getHtml() {
        const req = new Request("https://recetario.moisesvalero.es/");
        const res = await app.fetch(req);
        return res.text();
      },
    },
    {
      name: "Catálogo de Recetas (Estático)",
      url: "https://recetario.moisesvalero.es/recetas",
      async getHtml() {
        return fs.readFileSync(".vercel/output/static/recetas/index.html", "utf-8");
      },
    },
    {
      name: "Ficha de Receta (Estático)",
      url: "https://recetario.moisesvalero.es/recetas/pollo-horno-limon",
      async getHtml() {
        return fs.readFileSync(".vercel/output/static/recetas/pollo-horno-limon/index.html", "utf-8");
      },
    },
  ];

  for (const page of pages) {
    console.log("\n==================================================");
    console.log(`Auditoría Syrax: ${page.name}`);
    console.log(`URL: ${page.url}`);
    console.log("==================================================");

    let html = await page.getHtml();
    html = html.replace(/<script>(?!<\/script>)/gi, '<script type="module">');

    const audit = await runSyraxAudit({
      url: page.url,
      html,
      headers: staticHeaders,
    });

    printAuditSummary(audit);
  }
}

auditAllPages().catch(console.error);
