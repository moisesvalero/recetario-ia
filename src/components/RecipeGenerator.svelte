<script lang="ts">
  import {
    createStoredRecipe,
    HISTORY_STORAGE_KEY,
    type Recipe,
    type RecipeConstraints,
    type StoredRecipe,
  } from "../lib/recipe-schema";
  import RecipeHistory from "./RecipeHistory.svelte";
  import RecipeResult from "./RecipeResult.svelte";

  let ingredientInput = $state("");
  let ingredients = $state<string[]>([]);
  let maxMinutes = $state("30");
  let servings = $state("2");
  let diet = $state("");
  let difficulty = $state<"fácil" | "media" | "difícil" | "">("");
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
    if (!ingredients.includes(value)) {
      ingredients = [...ingredients, value];
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
    if (diet.trim()) constraints.diet = diet.trim();
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
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Error inesperado";
    } finally {
      loading = false;
    }
  }

  function openHistoryItem(item: StoredRecipe) {
    recipe = item;
    error = "";
  }
</script>

<div class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
  <section
    class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
  >
    <div class="mb-6">
      <p
        class="text-sm font-medium uppercase tracking-[0.2em] text-[var(--accent)]"
      >
        Generador
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">
        ¿Qué tienes en la nevera?
      </h1>
      <p class="mt-2 text-[var(--muted)]">
        Añade ingredientes, elige restricciones y genera una receta estructurada
        lista para cocinar.
      </p>
    </div>

    <label class="block text-sm font-medium" for="ingredient-input"
      >Ingredientes</label
    >
    <div class="mt-2 flex gap-2">
      <input
        id="ingredient-input"
        class="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none ring-[var(--accent)] focus:ring-2"
        placeholder="Ej: pollo, arroz, limón"
        bind:value={ingredientInput}
        onkeydown={handleIngredientKeydown}
      />
      <button
        type="button"
        class="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:bg-stone-50"
        onclick={addIngredient}
      >
        Añadir
      </button>
    </div>

    {#if ingredients.length > 0}
      <div class="mt-3 flex flex-wrap gap-2">
        {#each ingredients as item}
          <button
            type="button"
            class="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm text-[var(--accent)]"
            onclick={() => removeIngredient(item)}
          >
            {item} ×
          </button>
        {/each}
      </div>
    {/if}

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      <label class="block text-sm">
        <span class="font-medium">Tiempo máximo (min)</span>
        <input
          class="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"
          type="number"
          min="5"
          bind:value={maxMinutes}
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Porciones</span>
        <input
          class="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"
          type="number"
          min="1"
          bind:value={servings}
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Dieta / restricción</span>
        <input
          class="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"
          placeholder="vegetariano, sin gluten..."
          bind:value={diet}
        />
      </label>
      <label class="block text-sm">
        <span class="font-medium">Dificultad</span>
        <select
          class="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"
          bind:value={difficulty}
        >
          <option value="">Cualquiera</option>
          <option value="fácil">Fácil</option>
          <option value="media">Media</option>
          <option value="difícil">Difícil</option>
        </select>
      </label>
    </div>

    <button
      type="button"
      class="mt-6 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
      onclick={generateRecipe}
    >
      {loading ? "Generando receta..." : "Generar receta"}
    </button>

    {#if error}
      <p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    {/if}
  </section>

  <div class="space-y-6">
    <RecipeHistory items={history} onSelect={openHistoryItem} />
    {#if recipe}
      <RecipeResult {recipe} />
    {:else}
      <section
        class="rounded-2xl border border-dashed border-[var(--border)] bg-white/60 p-6 text-[var(--muted)]"
      >
        Tu receta aparecerá aquí con ingredientes, pasos, tiempos y modo
        cocinar.
      </section>
    {/if}
  </div>
</div>
