import { describe, expect, it, vi, beforeEach } from "vitest";
import { getFavorites, toggleFavorite, updateFavoriteRecipe } from "./auth";

// Desactivar Appwrite
vi.mock("./appwrite", () => ({
  APPWRITE_CONFIG: {
    isConfigured: false,
    databaseId: "",
    collectionRecetas: "",
  },
  account: {},
  databases: {},
}));

const mockUser = {
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  avatarUrl: "🥑",
  createdAt: "2026-01-01T00:00:00.000Z",
};

// Mockear localStorage
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

describe("auth favorites (localStorage)", () => {
  beforeEach(() => {
    store.clear();
    // Establecer usuario logueado en localStorage
    localStorageMock.setItem(
      "recetario:current_user",
      JSON.stringify(mockUser),
    );
  });

  it("debería devolver una lista vacía si no hay favoritos", async () => {
    const favs = await getFavorites();
    expect(favs).toEqual([]);
  });

  it("debería añadir y remover un favorito usando toggleFavorite", async () => {
    const recipe = {
      title: "Arroz con Pollo",
      description: "Delicioso plato tradicional",
      prepMinutes: 15,
      cookMinutes: 30,
      ingredients: [{ item: "arroz", amount: "200g" }],
      steps: [{ text: "Cocinar arroz" }],
    };

    // Añadir
    const added = await toggleFavorite(recipe);
    expect(added).toBe(true);

    let favs = await getFavorites();
    expect(favs).toHaveLength(1);
    expect(favs[0].title).toBe("Arroz con Pollo");
    expect(favs[0].recipe.title).toBe("Arroz con Pollo");
    expect(favs[0].userId).toBe(mockUser.id);

    // Quitar
    const removed = await toggleFavorite(recipe);
    expect(removed).toBe(false);

    favs = await getFavorites();
    expect(favs).toHaveLength(0);
  });

  it("debería actualizar el título de una receta favorita con updateFavoriteRecipe", async () => {
    const recipe = {
      title: "Pasta Carbonara",
      description: "Pasta italiana deliciosa",
      prepMinutes: 10,
      cookMinutes: 15,
      ingredients: [{ item: "pasta", amount: "150g" }],
      steps: [{ text: "Hervir pasta" }],
    };

    // Añadir a favoritos
    await toggleFavorite(recipe);

    // Receta modificada con nuevo título
    const updatedRecipe = {
      ...recipe,
      title: "Pasta Carbonara Auténtica",
      description: "Pasta italiana deliciosa sin nata",
    };

    // Actualizar
    await updateFavoriteRecipe(recipe.title, updatedRecipe);

    const favs = await getFavorites();
    expect(favs).toHaveLength(1);
    expect(favs[0].title).toBe("Pasta Carbonara Auténtica");
    expect(favs[0].recipe.title).toBe("Pasta Carbonara Auténtica");
    expect(favs[0].recipe.description).toBe(
      "Pasta italiana deliciosa sin nata",
    );
  });
});
