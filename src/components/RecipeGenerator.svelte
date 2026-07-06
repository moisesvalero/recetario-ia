<script lang="ts">
  import {
    createStoredRecipe,
    HISTORY_STORAGE_KEY,
    type Recipe,
    type RecipeConstraints,
    type StoredRecipe,
  } from "../lib/recipe-schema";
  import { HERO_IMAGE } from "../lib/recipe-image";
  import { authState } from "../lib/auth-state.svelte";
  import { navState } from "../lib/nav-state.svelte";
  import {
    getSavedRecipes,
    getFavorites,
    getShoppingList,
    toggleShoppingItem,
    clearShoppingList,
    deleteSavedRecipe,
    type SavedRecipe,
    type FavoriteRecipe,
    type ShoppingItem,
  } from "../lib/auth";
  import RecipeHistory from "./RecipeHistory.svelte";
  import RecipeResult from "./RecipeResult.svelte";

  let ingredientInput = $state("");
  let ingredients = $state<string[]>(["Pollo", "Arroz", "Limón"]);
  let mealType = $state("Comida");
  let maxMinutes = $state("60");
  let servings = $state("4");
  let difficulty = $state<"fácil" | "media" | "difícil" | "">("fácil");

  let loading = $state(false);
  let error = $state("");
  let recipe = $state<Recipe | null>(null);
  let history = $state<StoredRecipe[]>([]);

  // Estados para otras pestañas
  let savedRecipes = $state<SavedRecipe[]>([]);
  let favoriteRecipes = $state<FavoriteRecipe[]>([]);
  let shoppingList = $state<ShoppingItem[]>([]);

  // Efecto para sincronizar el historial
  $effect(() => {
    if (typeof localStorage === "undefined") return;
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return;
    try {
      history = JSON.parse(raw) as StoredRecipe[];
    } catch {
      history = [];
    }
  });

  // Efecto para refrescar datos según la pestaña activa o el usuario actual
  $effect(() => {
    const tab = navState.activeTab;
    const user = authState.currentUser;
    refreshTabData();
  });

  async function refreshTabData() {
    if (typeof window === "undefined") return;
    savedRecipes = await getSavedRecipes();
    favoriteRecipes = await getFavorites();
    shoppingList = await getShoppingList();
  }

  function saveHistory(entry: StoredRecipe) {
    const next = [
      entry,
      ...history.filter((item) => item.id !== entry.id),
    ].slice(0, 20);
    history = next;
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  }

  function addIngredient() {
    const value = ingredientInput.trim();
    if (!value) return;
    const normalized =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    if (
      !ingredients.some((i) => i.toLowerCase() === normalized.toLowerCase())
    ) {
      ingredients = [...ingredients, normalized];
    }
    ingredientInput = "";
  }

  function removeIngredient(item: string) {
    ingredients = ingredients.filter((value) => value !== item);
  }

  function handleIngredientKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      addIngredient();
    }
  }

  function buildConstraints(): RecipeConstraints | undefined {
    const constraints: RecipeConstraints = {};
    const minutes = Number(maxMinutes);
    const portionCount = Number(servings);

    if (minutes > 0) constraints.maxMinutes = minutes;
    if (portionCount > 0) constraints.servings = portionCount;
    if (mealType) constraints.diet = mealType;
    if (difficulty) constraints.difficulty = difficulty;

    return Object.keys(constraints).length > 0 ? constraints : undefined;
  }

  async function generateRecipe() {
    error = "";
    recipe = null;

    if (ingredients.length === 0) {
      error = "Añade al menos un ingrediente.";
      return;
    }

    loading = true;

    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients,
          constraints: buildConstraints(),
        }),
      });

      const data = (await response.json()) as {
        recipe?: Recipe;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo generar la receta");
      }

      if (!data.recipe) {
        throw new Error("La respuesta no incluyó una receta válida");
      }

      recipe = data.recipe;
      saveHistory(createStoredRecipe(data.recipe));
      refreshTabData();
      setTimeout(() => {
        recipeEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Error inesperado";
    } finally {
      loading = false;
    }
  }

  function openHistoryItem(item: StoredRecipe | Recipe) {
    recipe = item;
    error = "";
    navState.setTab("generar");
    setTimeout(() => {
      recipeEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  async function handleToggleShopping(id: string) {
    await toggleShoppingItem(id);
    await refreshTabData();
  }

  async function handleClearShopping() {
    await clearShoppingList();
    await refreshTabData();
  }

  async function handleDeleteRecipe(id: string, e: Event) {
    e.stopPropagation();
    await deleteSavedRecipe(id);
    await refreshTabData();
  }

  let recipeEl = $state<HTMLDivElement | undefined>(undefined);
</script>

<div class="pb-16">
  {#if navState.activeTab === "generar" || navState.activeTab === "inicio"}
    <!-- Hero Header -->
    <section
      class="relative overflow-hidden bg-gradient-to-r from-orange-50/70 to-amber-50/30 border-b border-orange-100/30"
    >
      <!-- Background kitchen image on the right -->
      <div
        class="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-center hidden md:block opacity-75"
        style={`background-image: url('${HERO_IMAGE}')`}
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-orange-50/95 via-orange-50/90 to-transparent"
      ></div>

      <div class="relative px-6 py-12 md:py-16 lg:px-12 max-w-4xl">
        <h1
          class="text-3xl font-bold tracking-tight text-slate-800 md:text-4xl"
        >
          ¡Hola, {authState.currentUser ? authState.currentUser.name : "María"}!
          👋
        </h1>
        <h2 class="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
          ¿Qué te gustaría cocinar hoy?
        </h2>
        <p
          class="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 font-medium"
        >
          Cuéntanos con qué ingredientes cuentas o qué se te antoja y la IA
          creará la receta perfecta para ti.
        </p>
      </div>
    </section>

    <div class="space-y-8 px-6 lg:px-12 -mt-6">
      <!-- Input Panel / Form -->
      <section
        class="relative rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-100/50 sm:p-8"
      >
        <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">
          Cuéntanos tus ingredientes principales
        </h3>

        <!-- Píldoras de Ingredientes -->
        <div class="mt-4 flex flex-wrap gap-2.5 items-center">
          {#each ingredients as item}
            <button
              type="button"
              class="inline-flex items-center gap-2.5 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100/80"
              onclick={() => removeIngredient(item)}
            >
              {item}
              <span class="text-orange-400 font-extrabold text-sm">×</span>
            </button>
          {/each}

          <!-- Input Inline con botón punteado -->
          <div class="flex items-center gap-2 min-w-[220px] flex-1">
            <input
              class="h-11 flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-orange-500/20 transition focus:border-orange-300 focus:bg-white focus:ring-4"
              placeholder="Escribe un ingrediente..."
              bind:value={ingredientInput}
              onkeydown={handleIngredientKeydown}
            />
            <button
              type="button"
              class="shrink-0 h-11 rounded-2xl border-2 border-dashed border-slate-200 px-4 text-xs font-bold text-slate-500 hover:border-orange-300 hover:text-orange-600 transition"
              onclick={addIngredient}
            >
              + Agregar ingrediente
            </button>
          </div>
        </div>

        <!-- Selectores Inferiores -->
        <div
          class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end border-t border-slate-50 pt-6"
        >
          <label class="block">
            <span
              class="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400"
              >Tipo de comida</span
            >
            <select
              class="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/30 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
              bind:value={mealType}
            >
              <option value="">Cualquiera</option>
              <option value="Comida">Comida</option>
              <option value="Almuerzo">Almuerzo</option>
              <option value="Cena">Cena</option>
              <option value="Vegetariano">Vegetariano</option>
              <option value="Sin gluten">Sin gluten</option>
            </select>
          </label>

          <label class="block">
            <span
              class="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400"
              >Número de porciones</span
            >
            <select
              class="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/30 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
              bind:value={servings}
            >
              <option value="1">1 porción</option>
              <option value="2">2 porciones</option>
              <option value="4">4 porciones</option>
              <option value="6">6 porciones</option>
            </select>
          </label>

          <label class="block">
            <span
              class="mb-2.5 block text-xs font-bold uppercase tracking-wider text-slate-400"
              >Tiempo máximo</span
            >
            <select
              class="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/30 px-4 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-300 focus:bg-white"
              bind:value={maxMinutes}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="120">120 minutos</option>
            </select>
          </label>

          <button
            type="button"
            class="flex h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-7 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            onclick={generateRecipe}
          >
            {#if loading}
              <span
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              ></span>
              Generando...
            {:else}
              Generar receta <span class="text-sm">✨</span>
            {/if}
          </button>
        </div>

        {#if error}
          <div
            class="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-semibold text-red-600"
          >
            ⚠️ {error}
          </div>
        {/if}
      </section>

      <!-- Visor de Resultados -->
      <div bind:this={recipeEl} class="scroll-mt-6">
        {#if recipe}
          <RecipeResult {recipe} />
        {:else if !loading}
          <!-- Card de estado vacío -->
          <section
            class="rounded-3xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center shadow-sm"
          >
            <span class="text-4xl block mb-4">🍳</span>
            <h4 class="font-extrabold text-slate-700 text-base">
              Tu receta aparecerá aquí
            </h4>
            <p class="mt-1.5 text-xs text-slate-400 font-medium">
              Con foto, ingredientes correctos, pasos numerados y temporizadores
              interactivos.
            </p>
          </section>
        {/if}
      </div>

      <!-- Historial local -->
      {#if history.length > 0}
        <RecipeHistory items={history} onSelect={openHistoryItem} />
      {/if}
    </div>
  {:else if navState.activeTab === "mis-recetas"}
    <div class="px-6 py-10 lg:px-12">
      <h2 class="text-2xl font-black text-slate-800">
        📖 Mis recetas guardadas
      </h2>
      <p
        class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider"
      >
        Tu biblioteca personal de cocina
      </p>

      {#if savedRecipes.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">📂</span>
          <p class="font-bold text-slate-700 text-sm">
            No tienes recetas guardadas todavía.
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Genera una receta y pulsa en "Guardar receta" para guardarla aquí.
          </p>
          <button
            onclick={() => navState.setTab("generar")}
            class="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:bg-orange-600 transition"
          >
            Comenzar a cocinar
          </button>
        </div>
      {:else}
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          {#each savedRecipes as item}
            <button
              type="button"
              onclick={() => openHistoryItem(item.recipe)}
              class="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-orange-200 transition-all"
            >
              <div
                class="h-16 w-16 shrink-0 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-bold border border-orange-100"
              >
                🍳
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate">
                  {item.recipe.title}
                </h4>
                <p class="text-xs text-slate-400 truncate mt-0.5">
                  {item.recipe.description}
                </p>
                <span
                  class="inline-block mt-2 text-[10px] font-bold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5"
                >
                  ⏱ {item.recipe.prepMinutes + item.recipe.cookMinutes} min
                </span>
              </div>
              <button
                type="button"
                class="rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
                onclick={(e) => handleDeleteRecipe(item.id, e)}
                title="Eliminar receta"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else if navState.activeTab === "favoritos"}
    <div class="px-6 py-10 lg:px-12">
      <h2 class="text-2xl font-black text-slate-800">
        ❤️ Mis recetas favoritas
      </h2>
      <p
        class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider"
      >
        Tus platos preferidos
      </p>

      {#if favoriteRecipes.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">💖</span>
          <p class="font-bold text-slate-700 text-sm">
            No tienes recetas favoritas marcadas.
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Haz clic en el corazón flotante de la receta para marcarla.
          </p>
        </div>
      {:else}
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          {#each favoriteRecipes as fav}
            <button
              type="button"
              onclick={() => openHistoryItem(fav.recipe)}
              class="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-orange-200 transition-all"
            >
              <div
                class="h-16 w-16 shrink-0 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl font-bold border border-red-100"
              >
                ❤️
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate">
                  {fav.recipe.title}
                </h4>
                <p class="text-xs text-slate-400 truncate mt-0.5">
                  {fav.recipe.description}
                </p>
                <span
                  class="inline-block mt-2 text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5"
                >
                  ⏱ {fav.recipe.prepMinutes + fav.recipe.cookMinutes} min
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else if navState.activeTab === "lista-compras"}
    <div class="px-6 py-10 lg:px-12">
      <div
        class="flex items-center justify-between gap-3 border-b border-slate-100 pb-5"
      >
        <div>
          <h2 class="text-2xl font-black text-slate-800">
            🛒 Lista de compras
          </h2>
          <p
            class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider"
          >
            Ingredientes para tu compra
          </p>
        </div>
        {#if shoppingList.length > 0}
          <button
            type="button"
            class="rounded-xl border border-slate-200 hover:border-red-200 px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-500 transition-all"
            onclick={handleClearShopping}
          >
            Limpiar lista
          </button>
        {/if}
      </div>

      {#if shoppingList.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">🧺</span>
          <p class="font-bold text-slate-700 text-sm">
            Tu lista de compras está vacía.
          </p>
          <p class="text-xs text-slate-400 mt-1">
            Pulsa en "Agregar a la lista de compras" en cualquier receta.
          </p>
        </div>
      {:else}
        <div
          class="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm divide-y divide-slate-100"
        >
          {#each shoppingList as item}
            <button
              type="button"
              onclick={() => handleToggleShopping(item.id)}
              class="flex w-full items-center gap-3 py-3.5 text-left text-sm transition hover:bg-slate-50/50 px-2 rounded-xl"
            >
              <div
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all {item.checked
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-slate-300 bg-white'}"
              >
                {#if item.checked}
                  <svg
                    class="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                {/if}
              </div>
              <div class="flex-1 flex items-center justify-between gap-4">
                <span
                  class="font-semibold transition-all {item.checked
                    ? 'text-slate-400 line-through'
                    : 'text-slate-700'}"
                >
                  {item.item}
                </span>
                <span
                  class="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100"
                >
                  {item.amount}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {:else if navState.activeTab === "historial"}
    <div class="px-6 py-10 lg:px-12">
      <h2 class="text-2xl font-black text-slate-800">
        🕐 Historial de recetas
      </h2>
      <p
        class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wider"
      >
        Recetas generadas recientemente
      </p>

      <div class="mt-6">
        {#if history.length === 0}
          <div
            class="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center"
          >
            <span class="text-4xl block mb-3">⏳</span>
            <p class="font-bold text-slate-700 text-sm">
              Tu historial está vacío.
            </p>
            <p class="text-xs text-slate-400 mt-1">
              Genera recetas y se listarán automáticamente aquí.
            </p>
          </div>
        {:else}
          <RecipeHistory items={history} onSelect={openHistoryItem} />
        {/if}
      </div>
    </div>
  {/if}
</div>
