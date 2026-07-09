import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  addToMenu,
  getWeekMenu,
  removeFromMenu,
  moveEntry,
  clearWeek,
} from "./menu-storage";

// ── Mocks ────────────────────────────────────────────────

// Desactivamos Appwrite para que todas las operaciones usen localStorage
vi.mock("./appwrite", () => ({
  APPWRITE_CONFIG: {
    isConfigured: false,
    databaseId: "",
    collectionMenu: "",
  },
  account: {},
  databases: {},
}));

// Usuario mockeado para getCurrentUser
const mockUser = {
  id: "test-user-1",
  name: "Test",
  email: "test@test.com",
  avatarUrl: "🥑",
  createdAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("./auth", () => ({
  getCurrentUser: vi.fn(() => mockUser),
}));

// localStorage simulado con Map
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string): string | null => store.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    store.set(key, value);
  },
  removeItem: (key: string): void => {
    store.delete(key);
  },
  clear: (): void => {
    store.clear();
  },
  get length(): number {
    return store.size;
  },
  key: (index: number): string | null =>
    Array.from(store.keys())[index] ?? null,
};

vi.stubGlobal("localStorage", localStorageMock);

// ── Helpers ──────────────────────────────────────────────

const SAMPLE_SNAPSHOT = {
  title: "Tortilla de patatas",
  description: "Receta clásica",
  prepMinutes: 10,
  cookMinutes: 20,
  servings: 4,
  difficulty: "fácil" as const,
  ingredients: [{ item: "huevos", amount: "4" }],
  steps: [{ text: "Batir", timerMinutes: 2 }],
};

const WEEK_A = "2026-07-06";
const WEEK_B = "2026-07-13";

// ── Tests ────────────────────────────────────────────────

describe("menu-storage (localStorage)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("addToMenu → getWeekMenu roundtrip", async () => {
    const entry = await addToMenu({
      weekStart: WEEK_A,
      day: 0,
      slot: "comida",
      recipeId: "rec-1",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });

    expect(entry.id).toBeTruthy();
    expect(entry.weekStart).toBe(WEEK_A);
    expect(entry.day).toBe(0);
    expect(entry.slot).toBe("comida");
    expect(entry.createdAt).toBeTruthy();

    const weekMenu = await getWeekMenu(WEEK_A);
    expect(weekMenu).toHaveLength(1);
    expect(weekMenu[0]!.id).toBe(entry.id);
  });

  it("getWeekMenu solo devuelve entradas de la semana pedida", async () => {
    await addToMenu({
      weekStart: WEEK_A,
      day: 1,
      slot: "cena",
      recipeId: "rec-1",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });
    await addToMenu({
      weekStart: WEEK_B,
      day: 2,
      slot: "desayuno",
      recipeId: "rec-2",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });

    const weekAEntries = await getWeekMenu(WEEK_A);
    expect(weekAEntries).toHaveLength(1);
    expect(weekAEntries[0]!.weekStart).toBe(WEEK_A);
  });

  it("removeFromMenu borra una entrada", async () => {
    const entry = await addToMenu({
      weekStart: WEEK_A,
      day: 0,
      slot: "comida",
      recipeId: "rec-1",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });

    await removeFromMenu(entry.id);

    const weekMenu = await getWeekMenu(WEEK_A);
    expect(weekMenu).toHaveLength(0);
  });

  it("removeFromMenu no falla si el id no existe", async () => {
    await expect(removeFromMenu("id-inexistente")).resolves.toBeUndefined();
  });

  it("moveEntry cambia day y slot", async () => {
    const entry = await addToMenu({
      weekStart: WEEK_A,
      day: 0,
      slot: "comida",
      recipeId: "rec-1",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });

    const moved = await moveEntry(entry.id, 3, "cena");
    expect(moved).not.toBeNull();
    expect(moved!.day).toBe(3);
    expect(moved!.slot).toBe("cena");

    // Verificar persistencia
    const weekMenu = await getWeekMenu(WEEK_A);
    expect(weekMenu).toHaveLength(1);
    expect(weekMenu[0]!.day).toBe(3);
    expect(weekMenu[0]!.slot).toBe("cena");
  });

  it("moveEntry devuelve null si no existe", async () => {
    const result = await moveEntry("id-inexistente", 0, "desayuno");
    expect(result).toBeNull();
  });

  it("clearWeek elimina solo la semana indicada", async () => {
    await addToMenu({
      weekStart: WEEK_A,
      day: 0,
      slot: "desayuno",
      recipeId: "rec-1",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });
    await addToMenu({
      weekStart: WEEK_A,
      day: 0,
      slot: "comida",
      recipeId: "rec-2",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });
    await addToMenu({
      weekStart: WEEK_B,
      day: 0,
      slot: "cena",
      recipeId: "rec-3",
      recipeSnapshot: SAMPLE_SNAPSHOT,
    });

    await clearWeek(WEEK_A);

    const weekAEntries = await getWeekMenu(WEEK_A);
    expect(weekAEntries).toHaveLength(0);

    // WEEK_B debe seguir intacta
    const weekBEntries = await getWeekMenu(WEEK_B);
    expect(weekBEntries).toHaveLength(1);
  });

  it("clearWeek no falla si la semana está vacía", async () => {
    await expect(clearWeek(WEEK_A)).resolves.toBeUndefined();
  });
});
