import { account, databases, APPWRITE_CONFIG } from "./appwrite";
import { ID, Query } from "appwrite";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
}

export interface SavedRecipe {
  id: string;
  userId: string;
  recipe: any;
  savedAt: string;
}

export interface FavoriteRecipe {
  userId: string;
  recipeId: string;
  title: string;
  recipe: any;
}

export interface ShoppingItem {
  id: string;
  userId: string;
  item: string;
  amount: string;
  checked: boolean;
}

const STORAGE_KEYS = {
  USERS: "recetario:users",
  CURRENT_USER: "recetario:current_user",
  SAVED_RECIPES: "recetario:saved_recipes",
  FAVORITES: "recetario:favorites",
  SHOPPING_LIST: "recetario:shopping_list",
};

const AVATARS = [
  "🥑",
  "🍳",
  "🍕",
  "🍰",
  "🍣",
  "🥗",
  "🌮",
  "🧁",
  "🍉",
  "🍪",
  "🍔",
  "🍜",
  "☕",
  "🍎",
  "🍩",
];

function getRandomAvatar() {
  const idx = Math.floor(Math.random() * AVATARS.length);
  return AVATARS[idx] ?? "👨‍🍳";
}

let appwriteUserCache: User | null = null;
let appwritePrefsCache: any = {};

export function isAppwriteActive(): boolean {
  return APPWRITE_CONFIG.isConfigured;
}

// INICIALIZACIÓN
export async function initAuth(): Promise<User | null> {
  if (!isAppwriteActive()) {
    return getCurrentUser();
  }

  try {
    const user = await account.get();
    const prefs = await account.getPrefs();
    appwritePrefsCache = prefs || {};
    appwriteUserCache = {
      id: user.$id,
      name: user.name,
      email: user.email,
      avatarUrl: prefs.avatar || "🥑",
      createdAt: user.registration,
    };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(appwriteUserCache),
      );
    }
    return appwriteUserCache;
  } catch {
    const cached = getCurrentUser();
    if (cached) {
      appwriteUserCache = cached;
      return cached;
    }
    appwriteUserCache = null;
    appwritePrefsCache = {};
    return null;
  }
}

// Síncrona para renderizado rápido
export function getCurrentUser(): User | null {
  if (appwriteUserCache) {
    return appwriteUserCache;
  }

  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (isAppwriteActive() && !appwriteUserCache) {
      appwriteUserCache = parsed;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getUsers(): Promise<User[]> {
  if (isAppwriteActive()) return [];
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function registerUser(
  name: string,
  email: string,
  password?: string,
): Promise<User> {
  if (isAppwriteActive()) {
    if (!password || password.length < 8) {
      throw new Error(
        "La contraseña debe tener al menos 8 caracteres para Appwrite Cloud",
      );
    }

    const userId = ID.unique();
    await account.create(userId, email, password, name);
    await account.createEmailPasswordSession(email, password);

    const avatar = getRandomAvatar();
    await account.updatePrefs({ avatar, favorites: [], shoppingList: [] });

    const user = await account.get();
    appwritePrefsCache = { avatar, favorites: [], shoppingList: [] };
    appwriteUserCache = {
      id: user.$id,
      name: user.name,
      email: user.email,
      avatarUrl: avatar,
      createdAt: user.registration,
    };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(appwriteUserCache),
      );
    }
    return appwriteUserCache;
  }

  // Local
  const users = await getUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) {
    throw new Error("El correo electrónico ya está registrado");
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    email,
    avatarUrl: getRandomAvatar(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  return newUser;
}

export async function loginUser(
  email: string,
  password?: string,
): Promise<User> {
  if (isAppwriteActive()) {
    if (!password) {
      throw new Error(
        "Se requiere la contraseña para iniciar sesión en Appwrite Cloud",
      );
    }

    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    const prefs = await account.getPrefs();
    appwritePrefsCache = prefs || {};
    appwriteUserCache = {
      id: user.$id,
      name: user.name,
      email: user.email,
      avatarUrl: prefs.avatar || "🥑",
      createdAt: user.registration,
    };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(appwriteUserCache),
      );
    }
    return appwriteUserCache;
  }

  // Local
  const users = await getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("Usuario no encontrado. Asegúrate de registrarte primero.");
  }

  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isAppwriteActive()) {
    try {
      await account.deleteSession("current");
    } catch {}
    appwriteUserCache = null;
    appwritePrefsCache = {};
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    return;
  }

  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export async function updateCurrentUser(
  name: string,
  email: string,
  avatarUrl: string,
): Promise<User> {
  if (isAppwriteActive()) {
    await account.updateName(name);

    const currentPrefs = await account.getPrefs();
    const newPrefs = { ...currentPrefs, avatar: avatarUrl };
    await account.updatePrefs(newPrefs);

    appwritePrefsCache = newPrefs;
    const user = await account.get();
    appwriteUserCache = {
      id: user.$id,
      name: user.name,
      email: user.email,
      avatarUrl,
      createdAt: user.registration,
    };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(appwriteUserCache),
      );
    }
    return appwriteUserCache;
  }

  // Local
  const currentUser = getCurrentUser();
  if (!currentUser) throw new Error("No hay un usuario autenticado");

  const users = await getUsers();
  const updatedUsers = users.map((u) => {
    if (u.id === currentUser.id) {
      return { ...u, name, email, avatarUrl };
    }
    return u;
  });

  const updatedUser = { ...currentUser, name, email, avatarUrl };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  return updatedUser;
}

// RECETAS GUARDADAS POR USUARIO
export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  if (isAppwriteActive()) {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionRecetas,
        [Query.limit(100)],
      );

      return response.documents.map((doc) => {
        const recipeData = JSON.parse(doc.recipeJson);
        return {
          id: doc.$id,
          userId: currentUser.id,
          recipe: recipeData,
          savedAt: doc.$createdAt,
        };
      });
    } catch (err) {
      console.error("Error al obtener recetas de Appwrite:", err);
      return [];
    }
  }

  // Local
  if (typeof localStorage === "undefined") return [];
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
  if (!raw) return [];
  try {
    const allSaved: SavedRecipe[] = JSON.parse(raw);
    return allSaved.filter((r) => r.userId === currentUser.id);
  } catch {
    return [];
  }
}

export async function saveRecipe(recipe: any): Promise<SavedRecipe> {
  const currentUser = getCurrentUser();
  if (!currentUser)
    throw new Error("Debes registrarte o iniciar sesión para guardar recetas");

  if (isAppwriteActive()) {
    const doc = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionRecetas,
      ID.unique(),
      {
        recipeJson: JSON.stringify(recipe),
      },
    );

    return {
      id: doc.$id,
      userId: currentUser.id,
      recipe,
      savedAt: doc.$createdAt,
    };
  }

  // Local
  if (typeof localStorage === "undefined")
    throw new Error("Almacenamiento no disponible");
  const savedRecipes = await getSavedRecipes();
  const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
  let allSaved: SavedRecipe[] = [];
  if (raw) {
    try {
      allSaved = JSON.parse(raw);
    } catch {}
  }

  const exists = savedRecipes.some((r) => r.recipe.title === recipe.title);
  if (exists) {
    throw new Error("La receta ya está en tu lista de guardadas");
  }

  const newSaved: SavedRecipe = {
    id: crypto.randomUUID(),
    userId: currentUser.id,
    recipe,
    savedAt: new Date().toISOString(),
  };

  allSaved.push(newSaved);
  localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(allSaved));
  return newSaved;
}

export async function deleteSavedRecipe(id: string): Promise<void> {
  if (isAppwriteActive()) {
    await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionRecetas,
      id,
    );
    return;
  }

  // Local
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
  if (!raw) return;
  try {
    const allSaved: SavedRecipe[] = JSON.parse(raw);
    const filtered = allSaved.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(filtered));
  } catch {}
}

// FAVORITOS
export async function getFavorites(): Promise<FavoriteRecipe[]> {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  if (isAppwriteActive()) {
    const favs = appwritePrefsCache.favorites || [];
    return favs.map((recipe: any) => ({
      userId: currentUser.id,
      recipeId: recipe.title,
      title: recipe.title,
      recipe,
    }));
  }

  // Local
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  if (!raw) return [];
  try {
    const allFavs: FavoriteRecipe[] = JSON.parse(raw);
    return allFavs.filter((f) => f.userId === currentUser.id);
  } catch {
    return [];
  }
}

export async function toggleFavorite(recipe: any): Promise<boolean> {
  const currentUser = getCurrentUser();
  if (!currentUser)
    throw new Error(
      "Debes registrarte o iniciar sesión para guardar favoritos",
    );

  if (isAppwriteActive()) {
    const favs = appwritePrefsCache.favorites || [];
    const index = favs.findIndex((f: any) => f.title === recipe.title);
    let isFav = false;

    if (index === -1) {
      favs.push(recipe);
      isFav = true;
    } else {
      favs.splice(index, 1);
      isFav = false;
    }

    const newPrefs = { ...appwritePrefsCache, favorites: favs };
    await account.updatePrefs(newPrefs);
    appwritePrefsCache = newPrefs;
    return isFav;
  }

  // Local
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  let allFavs: FavoriteRecipe[] = [];
  if (raw) {
    try {
      allFavs = JSON.parse(raw);
    } catch {}
  }

  const index = allFavs.findIndex(
    (f) => f.userId === currentUser.id && f.recipe.title === recipe.title,
  );
  let isFav = false;

  if (index === -1) {
    allFavs.push({
      userId: currentUser.id,
      recipeId: recipe.id || crypto.randomUUID(),
      title: recipe.title,
      recipe,
    });
    isFav = true;
  } else {
    allFavs.splice(index, 1);
    isFav = false;
  }

  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(allFavs));
  return isFav;
}

export async function isFavorite(title: string): Promise<boolean> {
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  const favs = await getFavorites();
  return favs.some((f) => f.title === title);
}

export async function updateFavoriteRecipe(
  oldTitle: string,
  updatedRecipe: any,
): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("Debes iniciar sesión para editar recetas");
  }

  if (isAppwriteActive()) {
    // 1. Actualizar favoritos en las preferencias de Appwrite
    const favs = appwritePrefsCache.favorites || [];
    const index = favs.findIndex((f: any) => f.title === oldTitle);
    if (index !== -1) {
      favs[index] = updatedRecipe;
    }
    const newPrefs = { ...appwritePrefsCache, favorites: favs };
    await account.updatePrefs(newPrefs);
    appwritePrefsCache = newPrefs;

    // 2. Si también está en la base de datos de recetas guardadas, la actualizamos
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionRecetas,
        [Query.limit(100)],
      );

      const docToUpdate = response.documents.find((doc) => {
        try {
          const r = JSON.parse(doc.recipeJson);
          return r.title === oldTitle;
        } catch {
          return false;
        }
      });

      if (docToUpdate) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collectionRecetas,
          docToUpdate.$id,
          {
            recipeJson: JSON.stringify(updatedRecipe),
          },
        );
      }
    } catch (err) {
      console.error("Error al actualizar receta guardada en Appwrite:", err);
    }
    return;
  }

  // Local
  if (typeof localStorage === "undefined") return;

  // 1. Actualizar en favoritos
  const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
  if (rawFavs) {
    try {
      const allFavs: FavoriteRecipe[] = JSON.parse(rawFavs);
      const updatedFavs = allFavs.map((f) => {
        if (f.userId === currentUser.id && f.recipe.title === oldTitle) {
          return {
            ...f,
            title: updatedRecipe.title,
            recipe: updatedRecipe,
          };
        }
        return f;
      });
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavs));
    } catch (err) {
      console.error("Error al actualizar favoritos en localStorage:", err);
    }
  }

  // 2. Actualizar en biblioteca de recetas guardadas (SavedRecipe)
  const rawSaved = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
  if (rawSaved) {
    try {
      const allSaved: SavedRecipe[] = JSON.parse(rawSaved);
      const updatedSaved = allSaved.map((r) => {
        if (r.userId === currentUser.id && r.recipe.title === oldTitle) {
          return {
            ...r,
            recipe: updatedRecipe,
          };
        }
        return r;
      });
      localStorage.setItem(
        STORAGE_KEYS.SAVED_RECIPES,
        JSON.stringify(updatedSaved),
      );
    } catch (err) {
      console.error(
        "Error al actualizar recetas guardadas en localStorage:",
        err,
      );
    }
  }
}

// LISTA DE COMPRAS
export async function getShoppingList(): Promise<ShoppingItem[]> {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  if (isAppwriteActive()) {
    return appwritePrefsCache.shoppingList || [];
  }

  // Local
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
  if (!raw) return [];
  try {
    const allItems: ShoppingItem[] = JSON.parse(raw);
    return allItems.filter((i) => i.userId === currentUser.id);
  } catch {
    return [];
  }
}

export async function addToShoppingList(
  ingredients: { item: string; amount: string }[],
): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser)
    throw new Error("Inicia sesión para usar la lista de compras");

  if (isAppwriteActive()) {
    const list: ShoppingItem[] = appwritePrefsCache.shoppingList || [];

    ingredients.forEach((ing) => {
      const exists = list.some(
        (i) => i.item.toLowerCase() === ing.item.toLowerCase() && !i.checked,
      );
      if (!exists) {
        list.push({
          id: crypto.randomUUID(),
          userId: currentUser.id,
          item: ing.item,
          amount: ing.amount,
          checked: false,
        });
      }
    });

    const newPrefs = { ...appwritePrefsCache, shoppingList: list };
    await account.updatePrefs(newPrefs);
    appwritePrefsCache = newPrefs;
    return;
  }

  // Local
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
  let allItems: ShoppingItem[] = [];
  if (raw) {
    try {
      allItems = JSON.parse(raw);
    } catch {}
  }

  ingredients.forEach((ing) => {
    const exists = allItems.some(
      (i) =>
        i.userId === currentUser.id &&
        i.item.toLowerCase() === ing.item.toLowerCase() &&
        !i.checked,
    );
    if (!exists) {
      allItems.push({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        item: ing.item,
        amount: ing.amount,
        checked: false,
      });
    }
  });

  localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(allItems));
}

export async function toggleShoppingItem(id: string): Promise<void> {
  if (isAppwriteActive()) {
    const list: ShoppingItem[] = appwritePrefsCache.shoppingList || [];
    const updated = list.map((i) => {
      if (i.id === id) {
        return { ...i, checked: !i.checked };
      }
      return i;
    });

    const newPrefs = { ...appwritePrefsCache, shoppingList: updated };
    await account.updatePrefs(newPrefs);
    appwritePrefsCache = newPrefs;
    return;
  }

  // Local
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
  if (!raw) return;
  try {
    const allItems: ShoppingItem[] = JSON.parse(raw);
    const updated = allItems.map((i) => {
      if (i.id === id) {
        return { ...i, checked: !i.checked };
      }
      return i;
    });
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(updated));
  } catch {}
}

export async function clearShoppingList(): Promise<void> {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  if (isAppwriteActive()) {
    const newPrefs = { ...appwritePrefsCache, shoppingList: [] };
    await account.updatePrefs(newPrefs);
    appwritePrefsCache = newPrefs;
    return;
  }

  // Local
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
  if (!raw) return;
  try {
    const allItems: ShoppingItem[] = JSON.parse(raw);
    const filtered = allItems.filter((i) => i.userId !== currentUser.id);
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(filtered));
  } catch {}
}

export async function loginWithOAuth(provider: "google"): Promise<void> {
  if (!isAppwriteActive()) {
    throw new Error(
      "El inicio de sesión social solo está disponible cuando Appwrite Cloud está configurado.",
    );
  }

  const successRedirect = window.location.origin + "/?oauth=success";
  const failureRedirect = window.location.origin + "/?oauth_error=true";

  account.createOAuth2Session(OAuthProvider.Google, successRedirect, failureRedirect);
}

export async function handleOAuthCallback(): Promise<User | null> {
  if (!isAppwriteActive()) return null;
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId");
  const secret = params.get("secret");
  const oauthError = params.get("oauth_error");
  const oauthSuccess = params.get("oauth");

  const hasOAuthParams = userId && secret;
  const hasOAuthFlag = oauthError || oauthSuccess;

  if (!hasOAuthParams && !hasOAuthFlag) return null;

  if (oauthError) {
    cleanOAuthUrl();
    throw new Error(
      "El inicio de sesión con Google fue cancelado o falló. Inténtalo de nuevo.",
    );
  }

  if (hasOAuthParams) {
    try {
      await account.createSession(userId!, secret!);
      cleanOAuthUrl();
      const user = await initAuth();
      if (user && typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      }
      return user;
    } catch (err: any) {
      cleanOAuthUrl();
      throw new Error(
        "No se pudo completar el inicio de sesión con Google: " +
          (err?.message || "Inténtalo de nuevo."),
      );
    }
  }

  if (oauthSuccess) {
    cleanOAuthUrl();
    const user = await initAuth();
    if (user && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
    return user;
  }

  return null;
}

function cleanOAuthUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("userId");
  url.searchParams.delete("secret");
  url.searchParams.delete("oauth");
  url.searchParams.delete("oauth_error");
  window.history.replaceState({}, document.title, url.pathname);
}
