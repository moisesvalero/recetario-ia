const API_KEY = process.env.SYRAX_API_KEY || "";
const ENDPOINT = "https://syrax-analyzer.moisesvalero.es/api/web-audit/cli-analyze";

export async function runSyraxAudit({ url, html, headers }) {
  if (!API_KEY) {
    throw new Error("SYRAX_API_KEY no está configurada. Define la variable de entorno SYRAX_API_KEY.");
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-syrax-api-key": API_KEY,
    },
    body: JSON.stringify({
      url,
      html,
      headers: headers || {},
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Syrax API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.audit;
}

export function printAuditSummary(audit) {
  console.log("==================================================");
  console.log(`PUNTUACIÓN GLOBAL: ${audit.overallScore}/100 | Veredicto: ${audit.verdict}`);
  console.log("==================================================");
  
  audit.categories.forEach((cat) => {
    const status = cat.score === 100 ? "✅" : cat.score >= 80 ? "⚠️" : "❌";
    console.log(`${status} ${cat.label.padEnd(30)} ${cat.score}/100 (${cat.issues.length} issues)`);
  });

  if (audit.issues.length > 0) {
    console.log("\n--- DETALLE DE ISSUES PENDIENTES ---");
    audit.issues.forEach((issue, idx) => {
      console.log(`[${idx + 1}] [${issue.severity.toUpperCase()}] [${issue.category}] ${issue.id}: ${issue.title}`);
      console.log(`    Por qué: ${issue.why}`);
      console.log(`    Solución: ${issue.fix}`);
      if (issue.evidence) console.log(`    Evidencia: ${issue.evidence}`);
    });
  } else {
    console.log("\n🎉 ¡0 ISSUES DETECTADOS! PUNTUACIÓN PERFECTA.");
  }
}

async function main() {
  const targetUrl = process.argv[2] || "https://recetario.moisesvalero.es/";
  console.log(`Obteniendo HTML de: ${targetUrl}`);
  
  const liveRes = await fetch(targetUrl);
  const html = await liveRes.text();
  const rawHeaders = Object.fromEntries(liveRes.headers.entries());

  console.log(`Analizando con Syrax Analyzer...`);
  const audit = await runSyraxAudit({
    url: targetUrl,
    html,
    headers: rawHeaders,
  });

  printAuditSummary(audit);
}

if (process.argv[1] && process.argv[1].endsWith("audit-runner.mjs")) {
  main().catch(console.error);
}
