import { Client, Account, Databases } from "appwrite";
import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
  PUBLIC_APPWRITE_DATABASE_ID,
  PUBLIC_APPWRITE_COLLECTION_RECETAS,
  PUBLIC_APPWRITE_COLLECTION_MENU,
} from "astro:env/client";

export const client = new Client();

const endpoint =
  PUBLIC_APPWRITE_ENDPOINT ||
  (typeof process !== "undefined"
    ? process.env?.PUBLIC_APPWRITE_ENDPOINT
    : undefined) ||
  "https://fra.cloud.appwrite.io/v1";

const projectId =
  PUBLIC_APPWRITE_PROJECT_ID ||
  (typeof process !== "undefined"
    ? process.env?.PUBLIC_APPWRITE_PROJECT_ID
    : undefined) ||
  "6a4b6de7000edc879709";

const databaseId =
  PUBLIC_APPWRITE_DATABASE_ID ||
  (typeof process !== "undefined"
    ? process.env?.PUBLIC_APPWRITE_DATABASE_ID
    : undefined) ||
  "recetario";

const collectionRecetas =
  PUBLIC_APPWRITE_COLLECTION_RECETAS ||
  (typeof process !== "undefined"
    ? process.env?.PUBLIC_APPWRITE_COLLECTION_RECETAS
    : undefined) ||
  "recetas_guardadas";

const collectionMenu =
  PUBLIC_APPWRITE_COLLECTION_MENU ||
  (typeof process !== "undefined"
    ? process.env?.PUBLIC_APPWRITE_COLLECTION_MENU
    : undefined) ||
  "menu_semanal";

if (projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
  if (typeof window !== "undefined") {
    client.ping().catch(() => {});
  }
}

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
  endpoint,
  projectId,
  databaseId,
  collectionRecetas,
  collectionMenu,
  isConfigured: !!projectId,
};
