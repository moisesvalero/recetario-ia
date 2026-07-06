import { Client, Account, Databases } from "appwrite";
import {
  PUBLIC_APPWRITE_ENDPOINT,
  PUBLIC_APPWRITE_PROJECT_ID,
  PUBLIC_APPWRITE_DATABASE_ID,
  PUBLIC_APPWRITE_COLLECTION_RECETAS,
} from "astro:env/client";

const client = new Client();

const endpoint = PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
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
  isConfigured: !!projectId,
};
