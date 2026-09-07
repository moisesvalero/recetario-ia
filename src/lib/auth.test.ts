import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getFavorites,
  toggleFavorite,
  updateFavoriteRecipe,
  getShoppingList,
  addToShoppingList,
  toggleShoppingItem,
  deleteShoppingItem,
  clearShoppingList,
} from "./auth";

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

describe("auth shopping list (localStorage)", () => {
  beforeEach(() => {
    store.clear();
    localStorageMock.setItem(
      "recetario:current_user",
      JSON.stringify(mockUser),
    );
  });

  it("debería devolver una lista vacía si no hay ingredientes guardados", async () => {
    const list = await getShoppingList();
    expect(list).toEqual([]);
  });

  it("debería añadir productos con y sin cantidad a la lista", async () => {
    await addToShoppingList([
      { item: "Leche", amount: "1 litro" },
      { item: "Pan", amount: "" },
    ]);

    const list = await getShoppingList();
    expect(list).toHaveLength(2);
    expect(list[0].item).toBe("Leche");
    expect(list[0].amount).toBe("1 litro");
    expect(list[0].checked).toBe(false);
    expect(list[1].item).toBe("Pan");
    expect(list[1].amount).toBe("");
    expect(list[1].checked).toBe(false);
  });

  it("debería cambiar el estado checked con toggleShoppingItem", async () => {
    await addToShoppingList([{ item: "Huevos", amount: "6 uds" }]);
    let list = await getShoppingList();
    const itemId = list[0].id;

    await toggleShoppingItem(itemId);
    list = await getShoppingList();
    expect(list[0].checked).toBe(true);

    await toggleShoppingItem(itemId);
    list = await getShoppingList();
    expect(list[0].checked).toBe(false);
  });

  it("debería eliminar un producto específico con deleteShoppingItem", async () => {
    await addToShoppingList([
      { item: "Manzanas", amount: "1 kg" },
      { item: "Plátanos", amount: "500g" },
    ]);

    let list = await getShoppingList();
    expect(list).toHaveLength(2);

    const appleItem = list.find((i) => i.item === "Manzanas")!;
    await deleteShoppingItem(appleItem.id);

    list = await getShoppingList();
    expect(list).toHaveLength(1);
    expect(list[0].item).toBe("Plátanos");
  });

  it("debería vaciar la lista completa con clearShoppingList", async () => {
    await addToShoppingList([
      { item: "Café", amount: "250g" },
      { item: "Azúcar", amount: "1 kg" },
    ]);

    let list = await getShoppingList();
    expect(list).toHaveLength(2);

    await clearShoppingList();

    list = await getShoppingList();
    expect(list).toEqual([]);
  });
});

