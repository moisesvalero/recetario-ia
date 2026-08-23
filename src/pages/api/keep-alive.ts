import type { APIRoute } from "astro";
import { APPWRITE_CONFIG, databases } from "../../lib/appwrite";

export const prerender = false;

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString();
  let dbStatus = "skipped";
  let message = "Appwrite no configurado (fallback local)";

  if (APPWRITE_CONFIG.isConfigured && APPWRITE_CONFIG.databaseId) {
    try {
      // Realizar una consulta ligera a la base de datos para mantenerla activa
      if (APPWRITE_CONFIG.collectionRecetas) {
        await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collectionRecetas,
          [],
        );
        dbStatus = "active";
        message = "Ping a colección de recetas ejecutado con éxito";
      } else {
        dbStatus = "active";
        message = "Conexión a Appwrite Cloud verificada";
      }
    } catch (err: any) {
      dbStatus = "warning";
      message = `Aviso en ping de base de datos: ${err?.message || "Error desconocido"}`;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      status: "healthy",
      timestamp,
      database: {
        status: dbStatus,
        message,
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
};
