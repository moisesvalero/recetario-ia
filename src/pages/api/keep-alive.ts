import type { APIRoute } from "astro";
import { APPWRITE_CONFIG, databases, client } from "../../lib/appwrite";

export const prerender = false;

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString();
  let dbStatus = "skipped";
  let message = "Appwrite no configurado (fallback local)";
  let pingStatus = "unknown";

  if (APPWRITE_CONFIG.isConfigured && APPWRITE_CONFIG.databaseId) {
    try {
      // 1. Ping directo a la API de Appwrite Cloud
      try {
        const pingRes = await client.ping();
        pingStatus = (pingRes as any)?.message || "Pong!";
      } catch (pingErr: any) {
        pingStatus = `Error ping: ${pingErr?.message || "Desconocido"}`;
      }

      // 2. Consulta a colección de base de datos para mantener activa la BD
      if (APPWRITE_CONFIG.collectionRecetas) {
        const docs = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collectionRecetas,
          [],
        );
        dbStatus = "active";
        message = `Ping exitoso a Appwrite Cloud (${docs.total} recetas encontradas, ping: ${pingStatus})`;
      } else {
        dbStatus = "active";
        message = `Conexión a Appwrite Cloud verificada (ping: ${pingStatus})`;
      }
    } catch (err: any) {
      dbStatus = "error";
      message = `Error en ping de base de datos: ${err?.message || "Error desconocido"}`;
    }
  }

  const isHealthy = dbStatus === "active";

  return new Response(
    JSON.stringify({
      ok: isHealthy,
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      appwrite: {
        endpoint: APPWRITE_CONFIG.endpoint,
        projectId: APPWRITE_CONFIG.projectId,
        ping: pingStatus,
      },
      database: {
        status: dbStatus,
        message,
      },
    }),
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
};
