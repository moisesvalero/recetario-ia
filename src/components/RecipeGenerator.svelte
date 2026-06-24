<script lang="ts">
  import {
    createStoredRecipe,
    HISTORY_STORAGE_KEY,
    type Recipe,
    type RecipeConstraints,
    type StoredRecipe,
  } from "../lib/recipe-schema";
  import { HERO_IMAGE } from "../lib/recipe-image";
  import RecipeHistory from "./RecipeHistory.svelte";
  import RecipeResult from "./RecipeResult.svelte";

  let ingredientInput = $state("");
  let ingredients = $state<string[]>(["Pollo", "Arroz", "Limón"]);
  let mealType = $state("");
  let maxMinutes = $state("45");
  let servings = $state("4");
  let diet = $state("");
  let difficulty = $state<"fácil" | "media" | "difícil" | "">("fácil");
  let loading = $state(false);
  let error = $state("");
  let recipe = $state<Recipe | null>(null);
  let history = $state<StoredRecipe[]>([]);

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
    const dietParts = [mealType, diet].filter(Boolean);

    if (minutes > 0) constraints.maxMinutes = minutes;
    if (portionCount > 0) constraints.servings = portionCount;
    if (dietParts.length) constraints.diet = dietParts.join(", ");
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
      recipeEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Error inesperado";
    } finally {
      loading = false;
    }
  }

  function openHistoryItem(item: StoredRecipe) {
    recipe = item;
    error = "";
    recipeEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  let recipeEl: HTMLDivElement | undefined;
</script>

<div class="pb-10">
  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div
      class="absolute inset-0 bg-cover bg-center"
      style={`background-image: url('${HERO_IMAGE}')`}
    ></div>
    <div
      class="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40"
    ></div>
    <div class="relative px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
      <p class="text-sm font-semibold text-[var(--accent)]">Recetario IA</p>
      <h1 class="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
        ¿Qué te gustaría cocinar hoy?
      </h1>
      <p class="mt-3 max-w-xl text-base text-[var(--muted)]">
        Cuéntanos qué tienes en la nevera y generamos una receta estructurada
        con pasos, tiempos y modo cocinar.
      </p>
    </div>
  </section>

  <div class="space-y-6 px-4 sm:px-8 lg:px-10">
    <!-- Formulario -->
    <section
      class="relative -mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8"
    >
      <h2 class="text-lg font-bold">Cuéntanos tus ingredientes principales</h2>
      <p class="mt-1 text-sm text-[var(--muted)]">
        Pulsa Enter o el botón para añadir cada ingrediente
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        {#each ingredients as item}
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-orange-100"
            onclick={() => removeIngredient(item)}
          >
            {item}
            <span class="text-orange-400">×</span>
          </button>
        {/each}
        <div class="flex min-w-[200px] flex-1 items-center gap-2">
          <input
            class="h-10 flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            placeholder="+ Agregar ingrediente"
            bind:value={ingredientInput}
            onkeydown={handleIngredientKeydown}
          />
          <button
            type="button"
            class="shrink-0 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            onclick={addIngredient}
          >
            Añadir
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label class="block text-sm">
          <span class="mb-2 block font-semibold text-[var(--text)]"
            >Tipo de comida</span
          >
          <select
            class="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            bind:value={mealType}
          >
            <option value="">Cualquiera</option>
            <option value="almuerzo">Almuerzo</option>
            <option value="cena">Cena</option>
            <option value="vegetariano">Vegetariano</option>
            <option value="sin gluten">Sin gluten</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="mb-2 block font-semibold text-[var(--text)]"
            >Número de porciones</span
          >
          <select
            class="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            bind:value={servings}
          >
            <option value="1">1 porción</option>
            <option value="2">2 porciones</option>
            <option value="4">4 porciones</option>
            <option value="6">6 porciones</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="mb-2 block font-semibold text-[var(--text)]"
            >Tiempo máximo</span
          >
          <select
            class="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            bind:value={maxMinutes}
          >
            <option value="15">15 minutos</option>
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">1 hora</option>
          </select>
        </label>
        <button
          type="button"
          class="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 lg:mb-0"
          disabled={loading}
          onclick={generateRecipe}
        >
          {#if loading}
            <span
              class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            ></span>
            Generando...
          {:else}
            ✨ Generar receta
          {/if}
        </button>
      </div>

      {#if error}
        <p
          class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      {/if}
    </section>

    <!-- Resultado -->
    <div bind:this={recipeEl}>
      {#if recipe}
        <RecipeResult {recipe} />
      {:else if !loading}
        <section
          class="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-white/70 px-6 py-12 text-center"
        >
          <p class="text-4xl">🍳</p>
          <p class="mt-3 font-semibold text-[var(--text)]">
            Tu receta aparecerá aquí
          </p>
          <p class="mt-1 text-sm text-[var(--muted)]">
            Con foto, pasos numerados y modo cocción guiada
          </p>
        </section>
      {/if}
    </div>

    <RecipeHistory items={history} onSelect={openHistoryItem} />
  </div>
</div>
