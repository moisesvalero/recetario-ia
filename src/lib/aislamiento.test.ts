/**
 * Aislamiento entre usuarios.
 *
 * Los tests existentes simulan Appwrite desactivado, así que solo cubren el
 * respaldo en localStorage. Estos activan Appwrite para comprobar lo que de
 * verdad importa: que cada usuario solo ve y toca lo suyo.
 *
 * Cubren dos fallos que había en producción:
 *  - las recetas guardadas se listaban todas y se le asignaba el id del usuario
 *    actual a cada una, así que cada uno veía las de los demás como suyas;
 *  - ni las recetas ni el menú guardaban dueño ni permisos por documento, con lo
 *    que la lectura general de la colección era lo único que los hacía visibles.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const USUARIO = {
  $id: "usuario-a",
  name: "Usuario A",
  email: "a@ejemplo.com",
  registration: "2026-01-01T00:00:00.000Z",
};

const espia = vi.hoisted(() => ({
  consultas: [] as unknown[],
  documentos: [] as Record<string, unknown>[],
  creado: { datos: {} as Record<string, unknown>, permisos: [] as unknown[] },
  documentoLeido: { $id: "doc-1", userId: "usuario-a" } as Record<
    string,
    unknown
  >,
  borrados: [] as string[],
  actualizado: { id: "", datos: {} as Record<string, unknown> },
  prefs: null as Record<string, unknown> | null,
}));

vi.mock("./appwrite", () => ({
  APPWRITE_CONFIG: {
    isConfigured: true,
    databaseId: "recetario",
    collectionRecetas: "recetas_guardadas",
    collectionMenu: "menu_semanal",
  },
  account: {
    get: vi.fn(async () => USUARIO),
    // Un favorito, para que editar una receta tenga algo que actualizar. En la
    // nube las favoritas se guardan planas (con `title` en la raíz), no envueltas
    // en `recipe`: así las mete `toggleFavorite`.
    getPrefs: vi.fn(async () => ({
      favorites: [{ title: "Tortilla", ingredientes: [] }],
    })),
    updatePrefs: vi.fn(async (prefs: Record<string, unknown>) => {
      espia.prefs = prefs;
      return {};
    }),
  },
  databases: {
    listDocuments: vi.fn(
      async (_db: string, _col: string, consultas: unknown[]) => {
        espia.consultas = consultas ?? [];
        return { documents: espia.documentos };
      },
    ),
    createDocument: vi.fn(
      async (
        _db: string,
        _col: string,
        _id: string,
        datos: Record<string, unknown>,
        permisos: unknown[],
      ) => {
        espia.creado = { datos, permisos: permisos ?? [] };
        return { $id: "creado-1", $createdAt: "2026-01-01T00:00:00.000Z" };
      },
    ),
    updateDocument: vi.fn(
      async (
        _db: string,
        _col: string,
        id: string,
        datos: Record<string, unknown>,
      ) => {
        espia.actualizado = { id, datos };
        return {
          $id: id,
          weekStart: "2026-01-05",
          day: datos.day ?? 1,
          slot: datos.slot ?? "comida",
          recipeId: "r1",
          recipeSnapshotJson: "{}",
          $createdAt: "2026-01-01T00:00:00.000Z",
        };
      },
    ),
    getDocument: vi.fn(async () => espia.documentoLeido),
    deleteDocument: vi.fn(async (_db: string, _col: string, id: string) => {
      espia.borrados.push(id);
      return {};
    }),
  },
}));

import {
  initAuth,
  getSavedRecipes,
  saveRecipe,
  deleteSavedRecipe,
  updateFavoriteRecipe,
} from "./auth";
import {
  getWeekMenu,
  addToMenu,
  removeFromMenu,
  moveEntry,
  clearWeek,
} from "./menu-storage";

/** ¿Se filtró la consulta por el dueño indicado? */
function filtraPorDueno(idEsperado: string): boolean {
  return espia.consultas.some((consulta) => {
    const texto = String(consulta);
    return texto.includes('"attribute":"userId"') && texto.includes(idEsperado);
  });
}

beforeEach(async () => {
  espia.consultas = [];
  espia.documentos = [];
  espia.creado = { datos: {}, permisos: [] };
  espia.borrados = [];
  espia.actualizado = { id: "", datos: {} };
  espia.prefs = null;
  espia.documentoLeido = { $id: "doc-1", userId: "usuario-a" };
  await initAuth();
});

describe("recetas guardadas", () => {
  it("pide a la nube solo las recetas del usuario actual", async () => {
    await getSavedRecipes();
    expect(filtraPorDueno("usuario-a")).toBe(true);
  });

  it("el dueño de cada receta es el del documento, no el usuario que mira", async () => {
    // Si la nube devolviera una receta ajena, la app no debe decir que es mía:
    // antes le estampaba el id del usuario actual a todo lo que listaba.
    espia.documentos = [
      {
        $id: "doc-ajeno",
        recipeJson: '{"title":"De otro"}',
        userId: "usuario-b",
        $createdAt: "x",
      },
    ];

    const recetas = await getSavedRecipes();

    expect(recetas).toHaveLength(1);
    expect(recetas[0]!.userId).toBe("usuario-b");
  });

  it("guardar registra el dueño y le da los permisos del documento", async () => {
    await saveRecipe({ title: "Tortilla" });

    expect(espia.creado.datos.userId).toBe("usuario-a");
    expect(JSON.stringify(espia.creado.datos)).toContain("Tortilla");
    expect(espia.creado.permisos).toContain('read("user:usuario-a")');
    expect(espia.creado.permisos).toContain('delete("user:usuario-a")');
  });

  it("no borra una receta que es de otro", async () => {
    espia.documentoLeido = { $id: "doc-ajeno", userId: "usuario-b" };

    await expect(deleteSavedRecipe("doc-ajeno")).rejects.toThrow(/no es tuya/i);
    expect(espia.borrados).toHaveLength(0);
  });

  it("borra la suya", async () => {
    await deleteSavedRecipe("doc-1");
    expect(espia.borrados).toEqual(["doc-1"]);
  });
});

describe("menú semanal", () => {
  it("pide solo las entradas del usuario actual", async () => {
    await getWeekMenu("2026-01-05");
    expect(filtraPorDueno("usuario-a")).toBe(true);
  });

  it("guardar registra el dueño y le da los permisos del documento", async () => {
    await addToMenu({
      weekStart: "2026-01-05",
      day: 1,
      slot: "comida",
      recipeId: "r1",
      recipeSnapshot: { title: "Paella" } as never,
    });

    expect(espia.creado.datos.userId).toBe("usuario-a");
    expect(espia.creado.permisos).toContain('read("user:usuario-a")');
  });
});

describe("menú semanal: mover, borrar y vaciar", () => {
  it("mover una entrada actualiza su día y su hueco", async () => {
    await moveEntry("doc-1", 3, "cena");

    expect(espia.actualizado.id).toBe("doc-1");
    expect(espia.actualizado.datos).toMatchObject({ day: 3, slot: "cena" });
  });

  it("mover a un hueco que no existe no toca nada", async () => {
    await moveEntry("doc-1", 3, "merienda");

    expect(espia.actualizado.id).toBe("");
  });

  it("quitar una entrada la borra por su id", async () => {
    await removeFromMenu("doc-9");

    expect(espia.borrados).toEqual(["doc-9"]);
  });

  it("vaciar la semana pide solo las entradas del dueño y borra esas", async () => {
    espia.documentos = [{ $id: "mia-1" }, { $id: "mia-2" }];

    await clearWeek("2026-03-02");

    expect(filtraPorDueno("usuario-a")).toBe(true);
    expect([...espia.borrados].sort()).toEqual(["mia-1", "mia-2"]);
  });
});

describe("editar una receta favorita", () => {
  it("actualiza las preferencias con la receta nueva", async () => {
    await updateFavoriteRecipe("Tortilla", { title: "Tortilla nueva" });

    expect(espia.prefs).not.toBeNull();
    expect(JSON.stringify(espia.prefs)).toContain("Tortilla nueva");
  });

  it("filtra por dueño antes de tocar la copia guardada", async () => {
    await updateFavoriteRecipe("Tortilla", { title: "Tortilla nueva" });

    expect(filtraPorDueno("usuario-a")).toBe(true);
  });

  it("actualiza la copia que coincide, no otra", async () => {
    espia.documentos = [
      { $id: "otra", recipeJson: '{"title":"Otra"}' },
      { $id: "esta", recipeJson: '{"title":"Tortilla"}' },
    ];

    await updateFavoriteRecipe("Tortilla", { title: "Tortilla nueva" });

    expect(espia.actualizado.id).toBe("esta");
  });

  it("no toca ninguna copia si no hay ninguna que coincida", async () => {
    espia.documentos = [{ $id: "otra", recipeJson: '{"title":"Otra"}' }];

    await updateFavoriteRecipe("Tortilla", { title: "Tortilla nueva" });

    expect(espia.actualizado.id).toBe("");
  });
});
