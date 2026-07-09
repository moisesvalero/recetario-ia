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
  import WeeklyMenu from "./WeeklyMenu.svelte";
  import { getWeekStart } from "../lib/menu-schema";

  let ingredientInput = $state("");
  let ingredients = $state<string[]>(["Pollo", "Arroz", "Limón"]);
  let mealType = $state("Comida");
  let dietType = $state("");
  let maxMinutes = $state("60");
  let servings = $state("4");
  let difficulty = $state<"fácil" | "media" | "difícil" | "">("fácil");

  let loading = $state(false);
  let error = $state("");
  let recipe = $state<Recipe | null>(null);
  let history = $state<StoredRecipe[]>([]);

  // Chips sugeridos rápidos de la nevera
  const commonIngredients = [
    "Pollo",
    "Arroz",
    "Tomate",
    "Huevo",
    "Cebolla",
    "Ajo",
    "Patata",
    "Pimiento",
    "Queso",
    "Zanahoria",
  ];

  function addCommonIngredient(item: string) {
    if (!ingredients.some((i) => i.toLowerCase() === item.toLowerCase())) {
      ingredients = [...ingredients, item];
    }
  }

  // Estados para otras pestañas
  let savedRecipes = $state<SavedRecipe[]>([]);
  let favoriteRecipes = $state<FavoriteRecipe[]>([]);
  let shoppingList = $state<ShoppingItem[]>([]);

  // Control de visibilidad del formulario de generación
  let showGeneratorForm = $state(true);

  // Estado del menú semanal: semana actualmente visualizada
  let currentWeekStart = $state(getWeekStart());
  let openedFromMenu = $state(false);

  function handleWeekChange(next: string) {
    currentWeekStart = next;
  }

  function handleOpenRecipeFromMenu(recipe: Recipe) {
    openedFromMenu = true;
    openHistoryItem(recipe);
  }

  function handleBackToMenu() {
    openedFromMenu = false;
    navState.setTab("menu-semanal");
  }

  // Estados para deshacer (Undo Toast)
  let showUndoToast = $state(false);
  let undoMessage = $state("");
  let undoAction = $state<(() => void) | null>(null);
  let undoTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let undoPendingCommit = $state<(() => Promise<void>) | null>(null);

  async function commitPendingUndo() {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      undoTimeoutId = null;
    }
    if (undoPendingCommit) {
      const commit = undoPendingCommit;
      undoPendingCommit = null;
      await commit();
    }
    showUndoToast = false;
    undoAction = null;
  }

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
    commitPendingUndo().then(() => {
      refreshTabData();
    });
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

    // Fusionar mealType y dietType en la propiedad diet
    const dietParts = [];
    if (mealType) dietParts.push(mealType);
    if (dietType) dietParts.push(dietType);
    if (dietParts.length > 0) constraints.diet = dietParts.join(", ");

    if (difficulty) constraints.difficulty = difficulty;

    return Object.keys(constraints).length > 0 ? constraints : undefined;
  }

  async function generateRecipe() {
    error = "";
    recipe = null;

    // Guardado automático del ingrediente escrito en el búfer si el usuario no pulsó '+'
    const value = ingredientInput.trim();
    if (value) {
      const normalized =
        value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      if (
        !ingredients.some((i) => i.toLowerCase() === normalized.toLowerCase())
      ) {
        ingredients = [...ingredients, normalized];
      }
      ingredientInput = "";
    }

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
      showGeneratorForm = false;
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
    showGeneratorForm = false;
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
    await commitPendingUndo();

    const previousList = [...shoppingList];
    shoppingList = [];

    undoMessage = "Lista de compras vaciada.";
    showUndoToast = true;

    undoAction = () => {
      shoppingList = previousList;
      showUndoToast = false;
      undoAction = null;
      undoPendingCommit = null;
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        undoTimeoutId = null;
      }
    };

    undoPendingCommit = async () => {
      await clearShoppingList();
      await refreshTabData();
    };

    undoTimeoutId = setTimeout(async () => {
      const commit = undoPendingCommit;
      undoPendingCommit = null;
      if (commit) {
        await commit();
      }
      showUndoToast = false;
      undoAction = null;
      undoTimeoutId = null;
    }, 5000);
  }

  async function handleDeleteRecipe(id: string, e: Event) {
    e.stopPropagation();
    await commitPendingUndo();

    const recipeToDelete = savedRecipes.find((r) => r.id === id);
    if (!recipeToDelete) return;

    const previousRecipes = [...savedRecipes];
    savedRecipes = savedRecipes.filter((r) => r.id !== id);

    undoMessage = "Receta eliminada.";
    showUndoToast = true;

    undoAction = () => {
      savedRecipes = previousRecipes;
      showUndoToast = false;
      undoAction = null;
      undoPendingCommit = null;
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        undoTimeoutId = null;
      }
    };

    undoPendingCommit = async () => {
      await deleteSavedRecipe(id);
      await refreshTabData();
    };

    undoTimeoutId = setTimeout(async () => {
      const commit = undoPendingCommit;
      undoPendingCommit = null;
      if (commit) {
        await commit();
      }
      showUndoToast = false;
      undoAction = null;
      undoTimeoutId = null;
    }, 5000);
  }

  let recipeEl = $state<HTMLDivElement | undefined>(undefined);
</script>

<div class="pb-16">
  {#if navState.activeTab === "generar" || navState.activeTab === "inicio"}
    <div class="animate-fade-in-up">
      {#if showGeneratorForm}
        <div
          class="max-w-5xl mx-auto grid grid-cols-12 gap-8 px-6 pt-8 lg:px-12"
        >
          <!-- Left Column: The Interactive Lined Notebook -->
          <section
            class="col-span-12 lg:col-span-8 notebook-paper p-4 sm:p-8 pt-6 sm:pt-10 relative"
          >
            <!-- Header Section -->
            <div class="mb-10 pl-6">
              <h2
                class="font-handwritten text-4xl font-black text-[var(--text)] leading-tight"
              >
                ¡Hola, {authState.currentUser
                  ? authState.currentUser.name
                  : "Invitado"}!
              </h2>
              <h3
                class="font-handwritten text-2xl font-bold text-[var(--text)]/80 mt-1"
              >
                ¿Qué te gustaría cocinar hoy?
              </h3>
              <p
                class="font-handwritten text-base text-[var(--muted)] mt-4 max-w-lg leading-relaxed"
              >
                Cuéntanos con qué ingredientes cuentas o qué se te antoja y la
                IA creará la receta perfecta para ti.
              </p>
            </div>

            <!-- Ingredients Input -->
            <div class="mb-10 pl-6">
              <label
                class="font-handwritten text-xl font-bold text-[var(--text)] mb-4 block"
              >
                Cuéntanos tus ingredientes principales
              </label>

              <div
                class="flex flex-wrap items-center min-h-[60px] p-2 gap-x-6 gap-y-4"
              >
                <!-- Taped Ingredient Tags -->
                {#each ingredients as item, idx}
                  {@const rotation = ((idx % 3) - 1.2) * 1.5}
                  <div
                    class="relative px-4 py-1.5 text-[var(--text)] font-handwritten text-lg rotate-[{rotation}deg] tape shadow-[0_1px_3px_rgba(0,0,0,0.06)] select-none flex items-center gap-2"
                  >
                    <div
                      class="absolute -top-2.5 left-1/2 -translate-x-1/2 w-8 h-3.5 bg-white/40 border border-black/5"
                    ></div>
                    <span>{item}</span>
                    <button
                      type="button"
                      onclick={() => removeIngredient(item)}
                      class="text-xs opacity-50 hover:opacity-100 transition-opacity font-bold cursor-pointer"
                      aria-label={`Eliminar ${item}`}
                    >
                      ×
                    </button>
                  </div>
                {/each}

                <div class="flex-1 min-w-[200px]">
                  <input
                    bind:value={ingredientInput}
                    onkeydown={handleIngredientKeydown}
                    class="hand-drawn-border w-full font-handwritten text-lg text-[var(--text)] focus:outline-none placeholder:text-[var(--text)]/50 px-4 py-1.5 bg-white/30"
                    placeholder="Escribe un ingrediente..."
                    type="text"
                    aria-label="Escribe un ingrediente para añadir"
                  />
                </div>

                <button
                  type="button"
                  onclick={addIngredient}
                  class="font-handwritten text-[var(--text)]/70 border border-dashed border-[var(--text)]/30 px-4 py-2 rounded bg-white/20 hover:bg-[var(--accent-soft)]/20 transition-all text-sm font-bold active:scale-95"
                >
                  + Agregar ingrediente
                </button>
              </div>
            </div>

            <!-- Suggestions -->
            <div class="mb-6 pl-6">
              <span
                class="text-[0.625rem] font-mono font-bold tracking-wider text-[var(--muted)] mb-3 block"
                >SUGERENCIAS RÁPIDAS:</span
              >
              <div class="flex flex-wrap gap-x-4 gap-y-2">
                {#each commonIngredients as chip}
                  {@const present = ingredients.some(
                    (i) => i.toLowerCase() === chip.toLowerCase(),
                  )}
                  <button
                    type="button"
                    disabled={present}
                    onclick={() => addCommonIngredient(chip)}
                    class="font-handwritten text-[var(--muted)] hover:text-[var(--text)] hover:underline transition-colors disabled:opacity-30 disabled:no-underline font-bold text-base cursor-pointer"
                  >
                    + {chip}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Empty State Preview -->
            {#if !recipe && !loading}
              <div
                class="mt-12 mx-6 p-10 border-2 border-dashed border-[var(--border)] rounded-lg bg-[var(--surface)]/10 flex flex-col items-center text-center opacity-45"
              >
                <span
                  class="material-symbols-outlined text-5xl text-[var(--muted)] mb-3"
                  >search_gear</span
                >
                <h4
                  class="font-handwritten text-lg font-bold text-[var(--text)]"
                >
                  Tu receta aparecerá aquí
                </h4>
                <p
                  class="font-handwritten text-sm text-[var(--muted)] mt-1 max-w-xs leading-normal"
                >
                  Con foto, ingredientes correctos, pasos numerados y
                  temporizadores interactivos.
                </p>
              </div>
            {/if}

            {#if error}
              <div
                class="mt-6 mx-6 rounded border border-red-200 bg-red-50/50 p-4 text-xs font-bold text-red-700 font-mono"
              >
                ⚠️ {error}
              </div>
            {/if}
          </section>

          <!-- Right Column: Preferences Sticky Note & CTA -->
          <aside
            class="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start"
          >
            <!-- Polaroid Frame -->
            <div
              class="polaroid w-full max-w-xs mx-auto lg:max-w-none rotate-[1.5deg] order-3 lg:order-1"
            >
              <img
                class="w-full aspect-square object-cover grayscale-[15%] sepia-[8%]"
                src={HERO_IMAGE}
                alt="Inspiración culinaria del día"
              />
              <p
                class="font-handwritten text-center mt-3.5 text-[var(--text)]/70 text-sm font-bold"
              >
                Inspiración del día
              </p>
            </div>

            <!-- Sticky Note Preferences (Bug-free alignment) -->
            <div
              class="post-it p-6 relative rotate-[-1deg] flex flex-col justify-between order-1 lg:order-2"
            >
              <div>
                <h4
                  class="font-handwritten text-xl font-bold text-[var(--text)] border-b border-[var(--text)]/20 pb-2 mb-5"
                >
                  Ajustes de Receta
                </h4>

                <div class="space-y-5">
                  <!-- Momento del Día -->
                  <div>
                    <p
                      class="font-handwritten text-xs text-[var(--muted)] font-black tracking-wider mb-1.5 uppercase"
                    >
                      MOMENTO DEL DÍA
                    </p>
                    <select
                      bind:value={mealType}
                      class="w-full bg-transparent border-b border-[var(--text)]/20 font-handwritten text-base py-1 text-[var(--text)] focus:outline-none cursor-pointer"
                    >
                      <option value="">Cualquiera</option>
                      <option value="Desayuno">Desayuno</option>
                      <option value="Comida">Comida</option>
                      <option value="Almuerzo">Almuerzo</option>
                      <option value="Cena">Cena</option>
                      <option value="Merienda">Merienda</option>
                    </select>
                  </div>

                  <!-- Dieta / Restricción con checkboxes limpios -->
                  <div>
                    <p
                      class="font-handwritten text-xs text-[var(--muted)] font-black tracking-wider mb-2.5 uppercase"
                    >
                      DIETA / RESTRICCIÓN
                    </p>
                    <div class="space-y-2.5">
                      <label
                        class="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={dietType === "Vegetariano"}
                          onchange={(e) =>
                            (dietType = e.currentTarget.checked
                              ? "Vegetariano"
                              : "")}
                          class="w-4 h-4 border-2 border-[var(--text)] rounded-sm bg-transparent checked:bg-[var(--text)] checked:border-[var(--text)] transition-all cursor-pointer"
                        />
                        <span
                          class="font-handwritten text-base text-[var(--text)] group-hover:underline"
                          >Vegetariano</span
                        >
                      </label>
                      <label
                        class="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={dietType === "Sin gluten"}
                          onchange={(e) =>
                            (dietType = e.currentTarget.checked
                              ? "Sin gluten"
                              : "")}
                          class="w-4 h-4 border-2 border-[var(--text)] rounded-sm bg-transparent checked:bg-[var(--text)] checked:border-[var(--text)] transition-all cursor-pointer"
                        />
                        <span
                          class="font-handwritten text-base text-[var(--text)] group-hover:underline"
                          >Sin gluten</span
                        >
                      </label>
                      <label
                        class="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={dietType === "Sin lactosa"}
                          onchange={(e) =>
                            (dietType = e.currentTarget.checked
                              ? "Sin lactosa"
                              : "")}
                          class="w-4 h-4 border-2 border-[var(--text)] rounded-sm bg-transparent checked:bg-[var(--text)] checked:border-[var(--text)] transition-all cursor-pointer"
                        />
                        <span
                          class="font-handwritten text-base text-[var(--text)] group-hover:underline"
                          >Sin lactosa</span
                        >
                      </label>
                    </div>
                  </div>

                  <!-- Tiempo Máximo -->
                  <div>
                    <p
                      class="font-handwritten text-xs text-[var(--muted)] font-black tracking-wider mb-1.5 uppercase"
                    >
                      TIEMPO MÁXIMO
                    </p>
                    <div class="flex items-center gap-3">
                      <input
                        type="range"
                        min="15"
                        max="120"
                        step="15"
                        bind:value={maxMinutes}
                        class="w-full accent-[var(--text)] bg-[var(--text)]/15 h-1 rounded appearance-none cursor-pointer"
                      />
                      <span
                        class="font-handwritten font-black text-[var(--text)] w-10 text-right"
                        >{maxMinutes}'</span
                      >
                    </div>
                  </div>
                </div>
              </div>
              <!-- Post-it Corner Fold Effect -->
              <div
                class="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-tl from-black/10 to-transparent pointer-events-none"
              ></div>
            </div>

            <!-- CTA Button Section (Marker effect) -->
            <div class="order-2 lg:order-3">
              <button
                onclick={generateRecipe}
                disabled={loading}
                class="marker-btn w-full py-5 px-6 text-white text-lg flex items-center justify-center gap-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
              >
                {#if loading}
                  <span
                    class="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  ></span>
                  <span>Cocinando...</span>
                {:else}
                  <span>Generar receta</span>
                  <span
                    class="material-symbols-outlined font-variation-settings: 'FILL' 1"
                    style="font-variation-settings: 'FILL' 1">auto_awesome</span
                  >
                {/if}
              </button>
              <p
                class="text-center font-handwritten text-[var(--muted)]/70 mt-3 text-xs leading-normal"
              >
                La IA está lista para cocinar...
              </p>
            </div>
          </aside>
        </div>
      {:else}
        <!-- Barra de Retorno de Generación (cuando se lee la receta activa) -->
        <div class="px-6 py-6 lg:px-12 max-w-5xl mx-auto flex flex-wrap gap-3">
          {#if openedFromMenu}
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded border border-dashed border-[var(--accent-hover)] bg-white px-5 py-3 text-xs font-bold text-[var(--accent-hover)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all print-hidden cursor-pointer"
              onclick={handleBackToMenu}
            >
              ← Volver al menú semanal (Calendario)
            </button>
          {/if}
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-5 py-3 text-xs font-bold text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all print-hidden cursor-pointer"
            onclick={() => {
              showGeneratorForm = true;
              openedFromMenu = false;
            }}
          >
            ← Generar otra receta / Modificar ingredientes
          </button>
        </div>
      {/if}

      <!-- Contenedor para Resultados e Historial (Siempre visible abajo) -->
      <div class="px-6 lg:px-12 mt-6 space-y-8 max-w-5xl mx-auto">
        <!-- Visor de Resultados -->
        <div bind:this={recipeEl} class="scroll-mt-6">
          {#if recipe}
            <RecipeResult {recipe} />
          {/if}
        </div>

        <!-- Historial local (oculto al leer receta activa para evitar ruido) -->
        {#if showGeneratorForm && history.length > 0}
          <RecipeHistory items={history} onSelect={openHistoryItem} />
        {/if}
      </div>
    </div>
  {:else if navState.activeTab === "mis-recetas"}
    <div class="px-6 py-10 lg:px-12 animate-fade-in-up">
      <h2 class="text-2xl font-black text-[var(--text)]">
        Mis recetas guardadas
      </h2>
      <p class="text-xs text-[var(--muted)] font-semibold mt-1 tracking-wide">
        Tu biblioteca personal de cocina
      </p>

      {#if savedRecipes.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">📂</span>
          <p class="font-bold text-[var(--text)] text-sm">
            No tienes recetas guardadas todavía.
          </p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Genera una receta y pulsa en "Guardar receta" para guardarla aquí.
          </p>
          <button
            onclick={() => navState.setTab("generar")}
            class="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[var(--accent-hover)] transition"
          >
            Comenzar a cocinar
          </button>
        </div>
      {:else}
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          {#each savedRecipes as item}
            <div
              role="button"
              tabindex="0"
              onclick={() => openHistoryItem(item.recipe)}
              onkeydown={(e) =>
                e.key === "Enter" && openHistoryItem(item.recipe)}
              class="flex items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-sm hover:border-[var(--accent)] transition-all cursor-pointer"
            >
              <div
                class="h-16 w-16 shrink-0 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center text-xl font-bold border border-[var(--accent-ring)]"
              >
                🍳
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-[var(--text)] text-sm truncate">
                  {item.recipe.title}
                </h4>
                <p class="text-xs text-[var(--muted)] truncate mt-0.5">
                  {item.recipe.description}
                </p>
                <span
                  class="inline-block mt-2 text-[0.625rem] font-bold text-[var(--accent-hover)] bg-[var(--accent-soft)] rounded-full px-2 py-0.5"
                >
                  ⏱ {item.recipe.prepMinutes + item.recipe.cookMinutes} min
                </span>
              </div>
              <button
                type="button"
                class="rounded-xl p-2 text-[var(--muted)] hover:bg-red-50 hover:text-red-500 transition"
                onclick={(e) => handleDeleteRecipe(item.id, e)}
                title="Eliminar receta"
                aria-label="Eliminar receta"
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
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else if navState.activeTab === "favoritos"}
    <div class="px-6 py-10 lg:px-12 animate-fade-in-up">
      <h2 class="text-2xl font-black text-[var(--text)]">
        Mis recetas favoritas
      </h2>
      <p class="text-xs text-[var(--muted)] font-semibold mt-1 tracking-wide">
        Tus platos preferidos
      </p>

      {#if favoriteRecipes.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">💖</span>
          <p class="font-bold text-[var(--text)] text-sm">
            No tienes recetas favoritas marcadas.
          </p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Haz clic en el corazón flotante de la receta para marcarla.
          </p>
        </div>
      {:else}
        <div class="mt-8 grid gap-6 sm:grid-cols-2">
          {#each favoriteRecipes as fav}
            <button
              type="button"
              onclick={() => openHistoryItem(fav.recipe)}
              class="flex items-center gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-sm hover:border-[var(--accent)] transition-all"
            >
              <div
                class="h-16 w-16 shrink-0 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-xl font-bold border border-red-100"
              >
                ❤️
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-[var(--text)] text-sm truncate">
                  {fav.recipe.title}
                </h4>
                <p class="text-xs text-[var(--muted)] truncate mt-0.5">
                  {fav.recipe.description}
                </p>
                <span
                  class="inline-block mt-2 text-[0.625rem] font-bold text-red-600 bg-red-50 rounded-full px-2 py-0.5"
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
    <div class="px-6 py-10 lg:px-12 animate-fade-in-up">
      <div
        class="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-5"
      >
        <div>
          <h2 class="text-2xl font-black text-[var(--text)]">
            Lista de compras
          </h2>
          <p
            class="text-xs text-[var(--muted)] font-semibold mt-1 tracking-wide"
          >
            Ingredientes para tu compra
          </p>
        </div>
        {#if shoppingList.length > 0}
          <button
            type="button"
            class="rounded-xl border border-[var(--border)] hover:border-red-200 px-4 py-2 text-xs font-bold text-[var(--muted)] hover:text-red-500 transition-all"
            onclick={handleClearShopping}
          >
            Limpiar lista
          </button>
        {/if}
      </div>

      {#if shoppingList.length === 0}
        <div
          class="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center"
        >
          <span class="text-4xl block mb-3">🧺</span>
          <p class="font-bold text-[var(--text)] text-sm">
            Tu lista de compras está vacía.
          </p>
          <p class="text-xs text-[var(--muted)] mt-1">
            Pulsa en "Agregar a la lista de compras" en cualquier receta.
          </p>
        </div>
      {:else}
        <div
          class="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm divide-y divide-[var(--border)]/70"
        >
          {#each shoppingList as item}
            <button
              type="button"
              onclick={() => handleToggleShopping(item.id)}
              class="flex w-full items-center gap-3 py-3.5 text-left text-sm transition hover:bg-[var(--surface-muted)] px-2 rounded-xl"
            >
              <div
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all {item.checked
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                  : 'border-[var(--border)] bg-[var(--surface)]'}"
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
                    ? 'text-[var(--muted)] line-through'
                    : 'text-[var(--text)]'}"
                >
                  {item.item}
                </span>
                <span
                  class="text-xs font-bold text-[var(--muted)] bg-[var(--surface-muted)] px-2 py-0.5 rounded-lg border border-[var(--border)]"
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
    <div class="px-6 py-10 lg:px-12 animate-fade-in-up">
      <h2 class="text-2xl font-black text-[var(--text)]">
        Historial de recetas
      </h2>
      <p class="text-xs text-[var(--muted)] font-semibold mt-1 tracking-wide">
        Recetas generadas recientemente
      </p>

      <div class="mt-6">
        {#if history.length === 0}
          <div
            class="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-12 text-center"
          >
            <span class="text-4xl block mb-3">⏳</span>
            <p class="font-bold text-[var(--text)] text-sm">
              Tu historial está vacío.
            </p>
            <p class="text-xs text-[var(--muted)] mt-1">
              Genera recetas y se listarán automáticamente aquí.
            </p>
          </div>
        {:else}
          <RecipeHistory items={history} onSelect={openHistoryItem} />
        {/if}
      </div>
    </div>
  {:else if navState.activeTab === "menu-semanal"}
    <div
      class="px-4 py-8 sm:px-6 lg:px-12 max-w-6xl mx-auto animate-fade-in-up"
    >
      <WeeklyMenu
        weekStart={currentWeekStart}
        onWeekChange={handleWeekChange}
        onOpenRecipe={handleOpenRecipeFromMenu}
      />
    </div>
  {/if}

  <!-- Toast de Deshacer (Undo Toast) -->
  {#if showUndoToast}
    <div
      class="fixed bottom-6 left-6 z-50 flex items-center justify-between gap-6 rounded-2xl bg-[var(--text)] text-[var(--surface)] px-5 py-3.5 shadow-lg max-w-sm w-auto animate-toast-in"
    >
      <span class="text-xs font-semibold">{undoMessage}</span>
      <button
        type="button"
        class="text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition active:scale-95"
        onclick={undoAction}
      >
        Deshacer
      </button>
    </div>
  {/if}
</div>
