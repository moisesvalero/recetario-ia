export function exportToPdf(recipe: any) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  const ingredientsHtml = recipe.ingredients
    .map(
      (ing: any) => `
      <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
        <span style="font-weight: 500; color: #334155;">${ing.item}</span>
        <span style="color: #64748b; font-weight: 600;">${ing.amount}</span>
      </li>
    `,
    )
    .join("");

  const stepsHtml = recipe.steps
    .map(
      (step: any, idx: number) => `
      <li style="display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start; font-size: 13px; line-height: 1.6;">
        <span style="display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f97316; color: white; font-weight: bold; font-size: 11px; shrink: 0;">
          ${idx + 1}
        </span>
        <span style="color: #475569; font-weight: 500;">${step.text}</span>
      </li>
    `,
    )
    .join("");

  const tipsHtml =
    recipe.tips && recipe.tips.length > 0
      ? `
      <div style="margin-top: 24px; padding: 16px; background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px;">
        <h3 style="margin-top: 0; color: #c2410c; font-size: 14px; font-weight: bold;">💡 Consejos útiles</h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #7c2d12; line-height: 1.6;">
          ${recipe.tips.map((t: string) => `<li>${t}</li>`).join("")}
        </ul>
      </div>
    `
      : "";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${recipe.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          margin: 40px;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @page {
          size: A4;
          margin: 20mm;
        }
        h1 {
          font-size: 26px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .description {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .meta-row {
          display: flex;
          gap: 24px;
          border-bottom: 2px solid #f1f5f9;
          border-top: 2px solid #f1f5f9;
          padding: 12px 0;
          margin-bottom: 24px;
        }
        .meta-item {
          font-size: 12px;
          font-weight: 700;
          color: #475569;
        }
        .section-title {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #c2410c;
          margin: 0 0 14px 0;
          border-bottom: 1px solid #fed7aa;
          padding-bottom: 6px;
        }
        .columns {
          display: grid;
          grid-template-cols: 1fr 1.5fr;
          gap: 32px;
        }
        ul, ol {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <span style="font-size: 24px;">👨‍🍳</span>
        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8;">Recetario IA - PDF</span>
      </div>
      <h1>${recipe.title}</h1>
      <p class="description">${recipe.description}</p>
      
      <div class="meta-row">
        <span class="meta-item">⏱ Tiempo total: ${totalMinutes} min</span>
        <span class="meta-item">✓ Dificultad: ${recipe.difficulty}</span>
        <span class="meta-item">🍽 Porciones: ${recipe.servings} porciones</span>
      </div>

      <div class="columns">
        <div>
          <h2 class="section-title">Ingredientes</h2>
          <ul>
            ${ingredientsHtml}
          </ul>
        </div>
        <div>
          <h2 class="section-title">Pasos de preparación</h2>
          <ol>
            ${stepsHtml}
          </ol>
          ${tipsHtml}
        </div>
      </div>

      <div class="footer">
        Generado con Recetario IA - Tu chef inteligente · © 2026
      </div>
    </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();

    // Esperar a que cargue la fuente de Google
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Quitar el iframe después de imprimir
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    }, 500);
  }
}
