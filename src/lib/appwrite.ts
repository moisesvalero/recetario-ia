import { Client, Account, Databases } from "appwrite";
import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
  PUBLIC_APPWRITE_DATABASE_ID,
  PUBLIC_APPWRITE_COLLECTION_RECETAS,
  PUBLIC_APPWRITE_COLLECTION_MENU,
} from "astro:env/client";

export const client = new Client();

/** Endpoint directo de Appwrite. Solo lo usa el arranque del login (ver abajo). */
export const endpointDirecto =
  PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";

/**
 * Las llamadas van por **nuestro propio dominio** (proxy en `src/pages/appwrite`)
 * para que la cookie de sesión sea de primera parte. Appwrite la marca con su
 * dominio, y Safari, iOS y Chrome con el bloqueo activado la descartan: sin esto,
 * el login se queda en bucle.
 */
const endpoint =
  typeof window === "undefined"
    ? endpointDirecto
    : `${window.location.origin}/appwrite`;

const projectId = PUBLIC_APPWRITE_PROJECT_ID || "";

if (projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
  endpoint,
  projectId,
  databaseId: PUBLIC_APPWRITE_DATABASE_ID || "",
  collectionRecetas: PUBLIC_APPWRITE_COLLECTION_RECETAS || "",
  collectionMenu: PUBLIC_APPWRITE_COLLECTION_MENU || "",
  isConfigured: !!projectId,
};

/**
 * Lanza el login social **directamente contra Appwrite**, sin el proxy.
 *
 * Es la única llamada que no puede pasar por nuestro dominio, y el motivo es una
 * cookie: al empezar el login, Appwrite deja `a_oauth2_<proyecto>` con el estado
 * de la operación, y esa cookie **no lleva `domain=`**, así que el navegador la
 * asigna al host que responde. Si la petición saliera por el proxy, la cookie se
 * quedaría en nuestro dominio; la vuelta desde Google llega a Appwrite, que no la
 * recibiría, no podría validar el estado y mandaría al usuario al aviso de fallo.
 *
 * El resto de llamadas sí van por el proxy, que es lo que hace que la cookie de
 * sesión sea de primera parte.
 */
export function abrirLogin(
  proveedor: "google",
  exito: string,
  fallo: string,
): void {
  const anterior = client.config.endpoint;
  client.setEndpoint(endpointDirecto);
  try {
    account.createOAuth2Token(proveedor as never, exito, fallo);
  } finally {
    client.setEndpoint(anterior);
  }
}
