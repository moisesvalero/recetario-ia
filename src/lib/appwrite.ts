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
  if (typeof window !== "undefined") {
    client
      .ping()
      .then(() => console.log("Appwrite setup verified successfully."))
      .catch((err) => console.warn("Appwrite setup verification failed:", err));
  }
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
