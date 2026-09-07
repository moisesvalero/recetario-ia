/**
 * Database Keep-Alive Script for Appwrite Cloud.
 * Performs authenticated ping (if API key available), database read, and database write+delete mutation
 * to ensure Appwrite Cloud registers active project usage and prevents 7-day inactivity pause.
 */

const endpoint =
  process.env.PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId =
  process.env.PUBLIC_APPWRITE_PROJECT_ID || "6a4b6de7000edc879709";
const databaseId = process.env.PUBLIC_APPWRITE_DATABASE_ID || "recetario";
const collectionId =
  process.env.PUBLIC_APPWRITE_COLLECTION_RECETAS || "recetas_guardadas";
const apiKey = process.env.APPWRITE_API_KEY || "";

async function runKeepAlive() {
  console.log("--- Iniciando Keep-Alive de Appwrite Cloud ---");
  console.log(`Endpoint: ${endpoint} | Proyecto: ${projectId}`);

  // 1. Si hay API Key disponible, consultar /v1/project para actualizar accessedAt del proyecto
  if (apiKey) {
    try {
      console.log("1. Consultando /v1/project con API Key...");
      const projRes = await fetch(`${endpoint}/project`, {
        headers: {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
        },
      });
      console.log(
        `Respuesta /project: ${projRes.status} ${projRes.statusText}`,
      );
      if (projRes.ok) {
        const projData = await projRes.json();
        console.log(
          `✅ Proyecto activo verificado: "${projData.name}" (${projData.$id})`,
        );
      } else {
        console.warn(
          `⚠️ Aviso al consultar /project con API Key: ${projRes.status}`,
        );
      }
    } catch (err) {
      console.warn("⚠️ Error en verificación de API Key:", err.message);
    }
  } else {
    console.log("1. Sin APPWRITE_API_KEY (omitiendo /project)");
  }

  // 2. Ping a la API de Appwrite
  try {
    console.log("2. Ping a /v1/ping...");
    const pingRes = await fetch(`${endpoint}/ping`, {
      headers: {
        "X-Appwrite-Project": projectId,
      },
    });
    const pingText = await pingRes.text();
    console.log(`Respuesta ping: ${pingRes.status} -> ${pingText.trim()}`);
  } catch (err) {
    console.warn("⚠️ Error en /ping:", err.message);
  }

  // 3. Mutación de base de datos: Crear documento de latido y borrarlo inmediatamente
  console.log(
    "3. Ejecutando mutación de base de datos (escritura + borrado)...",
  );
  try {
    const createRes = await fetch(
      `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": projectId,
          ...(apiKey ? { "X-Appwrite-Key": apiKey } : {}),
        },
        body: JSON.stringify({
          documentId: "unique()",
          data: {
            recipeJson: JSON.stringify({
              _heartbeat: true,
              timestamp: new Date().toISOString(),
            }),
          },
        }),
      },
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(
        `Error en creación de documento (${createRes.status}): ${errText}`,
      );
    }

    const createdDoc = await createRes.json();
    console.log(`Documento de latido creado con éxito: ${createdDoc.$id}`);

    // Borrado inmediato
    const delRes = await fetch(
      `${endpoint}/databases/${databaseId}/collections/${collectionId}/documents/${createdDoc.$id}`,
      {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": projectId,
          ...(apiKey ? { "X-Appwrite-Key": apiKey } : {}),
        },
      },
    );

    console.log(
      `Borrado de documento de latido: ${delRes.status} ${delRes.statusText}`,
    );
    console.log(
      "✅ Transacción de base de datos completada (Create + Delete).",
    );
  } catch (err) {
    console.error("❌ Error en mutación de base de datos:", err.message);
    process.exitCode = 1;
  }

  // 4. Ping a la web en Vercel
  console.log("4. Ping al endpoint web de producción...");
  try {
    const webRes = await fetch(
      "https://recetario.moisesvalero.es/api/keep-alive",
    );
    console.log(
      `Respuesta endpoint web: ${webRes.status} ${webRes.statusText}`,
    );
    if (webRes.ok) {
      const webJson = await webRes.json().catch(() => null);
      console.log(
        "Estado reportado por la web:",
        webJson?.status,
        webJson?.database?.message,
      );
    }
  } catch (err) {
    console.warn("⚠️ Aviso al pinguear endpoint web:", err.message);
  }

  console.log("--- Keep-Alive Finalizado ---");
}

runKeepAlive();
