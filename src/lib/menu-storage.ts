import type { MenuEntry, MenuEntryInput } from "./menu-schema";
import { menuEntrySchema } from "./menu-schema";
import { APPWRITE_CONFIG, databases } from "./appwrite";
import { ID, Query } from "appwrite";

/**
 * Persistencia para el Menú Semanal.
 * Si Appwrite está configurado y se provee la colección del menú, guarda en la nube.
 * De lo contrario, utiliza localStorage como fallback.
 */
const STORAGE_KEY = "recetario:menu";

function isAppwriteActive(): boolean {
  return APPWRITE_CONFIG.isConfigured && !!APPWRITE_CONFIG.collectionMenu;
}

function readEntries(): MenuEntry[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is MenuEntry => {
      const result = menuEntrySchema.safeParse(item);
      return result.success;
    });
  } catch {
    return [];
  }
}

function writeEntries(entries: MenuEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function getWeekMenu(weekStart: string): Promise<MenuEntry[]> {
  if (isAppwriteActive()) {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionMenu,
        [Query.equal("weekStart", weekStart), Query.limit(100)],
      );
      return response.documents.map((doc) => {
        return {
          id: doc.$id,
          weekStart: doc.weekStart,
          day: doc.day,
          slot: doc.slot as any,
          recipeId: doc.recipeId,
          recipeSnapshot: JSON.parse(doc.recipeSnapshotJson),
          createdAt: doc.$createdAt,
        };
      });
    } catch (err) {
      console.error("Error al obtener menú semanal de Appwrite:", err);
      return [];
    }
  }

  return readEntries()
    .filter((entry) => entry.weekStart === weekStart)
    .sort((a, b) => a.day - b.day || a.slot.localeCompare(b.slot));
}

export async function addToMenu(input: MenuEntryInput): Promise<MenuEntry> {
  if (isAppwriteActive()) {
    const doc = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionMenu,
      ID.unique(),
      {
        weekStart: input.weekStart,
        day: input.day,
        slot: input.slot,
        recipeId: input.recipeId,
        recipeSnapshotJson: JSON.stringify(input.recipeSnapshot),
      },
    );
    return {
      ...input,
      id: doc.$id,
      createdAt: doc.$createdAt,
    };
  }

  const entries = readEntries();
  const entry: MenuEntry = {
    ...input,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  entries.push(entry);
  writeEntries(entries);
  return entry;
}

export async function removeFromMenu(entryId: string): Promise<void> {
  if (isAppwriteActive()) {
    await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionMenu,
      entryId,
    );
    return;
  }

  const entries = readEntries().filter((entry) => entry.id !== entryId);
  writeEntries(entries);
}

export async function moveEntry(
  entryId: string,
  day: number,
  slot: string,
): Promise<MenuEntry | null> {
  const parsedSlot = parseSlot(slot);
  if (!parsedSlot) return null;

  if (isAppwriteActive()) {
    const doc = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionMenu,
      entryId,
      {
        day,
        slot: parsedSlot,
      },
    );
    return {
      id: doc.$id,
      weekStart: doc.weekStart,
      day: doc.day,
      slot: doc.slot as any,
      recipeId: doc.recipeId,
      recipeSnapshot: JSON.parse(doc.recipeSnapshotJson),
      createdAt: doc.$createdAt,
    };
  }

  const entries = readEntries();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return null;

  entry.day = day;
  entry.slot = parsedSlot;
  writeEntries(entries);
  return entry;
}

export async function clearWeek(weekStart: string): Promise<void> {
  if (isAppwriteActive()) {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionMenu,
        [Query.equal("weekStart", weekStart), Query.limit(100)],
      );
      await Promise.all(
        response.documents.map((doc) =>
          databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collectionMenu,
            doc.$id,
          ),
        ),
      );
    } catch (err) {
      console.error("Error al limpiar semana en Appwrite:", err);
      throw err;
    }
    return;
  }

  const entries = readEntries().filter(
    (entry) => entry.weekStart !== weekStart,
  );
  writeEntries(entries);
}

function parseSlot(slot: string): "desayuno" | "comida" | "cena" | null {
  if (slot === "desayuno" || slot === "comida" || slot === "cena") return slot;
  return null;
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
