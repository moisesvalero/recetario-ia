<script lang="ts">
  import type { Recipe } from "../lib/recipe-schema";
  import { getRecipeImageUrl } from "../lib/recipe-image";

  let {
    recipe,
    viewMode = "steps",
    onViewModeChange,
    onStartCooking,
    onSave,
  }: {
    recipe: Recipe;
    viewMode?: "steps" | "cook";
    onViewModeChange?: (mode: "steps" | "cook") => void;
    onStartCooking?: () => void;
    onSave?: () => void;
  } = $props();

  const totalMinutes = $derived(recipe.prepMinutes + recipe.cookMinutes);
  const imageUrl = $derived(
    getRecipeImageUrl(
      recipe.title,
      recipe.ingredients.map((i) => i.item),
    ),
  );

  function shareRecipe() {
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    }
  }
</script>

<article
  class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-[var(--shadow-md)]"
>
  <div class="grid lg:grid-cols-[340px_1fr]">
    <div class="relative min-h-[220px] lg:min-h-full">
      <img
        src={imageUrl}
        alt={recipe.title}
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/5"
      ></div>
    </div>

    <div class="flex flex-col p-6 lg:p-8">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span
              class="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
              >IA</span
            >
            <span class="text-xs font-medium text-[var(--muted)]"
              >Receta generada</span
            >
          </div>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--text)]">
            {recipe.title}
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            {recipe.description}
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          ⏱ {totalMinutes} min
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
        >
          ✓ {recipe.difficulty}
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
        >
          🍽 {recipe.servings} porciones
        </span>
      </div>

      <div class="mt-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          class={`rounded-lg px-4 py-2 text-sm font-semibold transition ${viewMode === "steps" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--muted)]"}`}
          onclick={() => onViewModeChange?.("steps")}
        >
          Paso a paso
        </button>
        <button
          type="button"
          class={`rounded-lg px-4 py-2 text-sm font-semibold transition ${viewMode === "cook" ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--muted)]"}`}
          onclick={() => {
            onViewModeChange?.("cook");
            onStartCooking?.();
          }}
        >
          Cocción guiada
        </button>
      </div>

      {#if viewMode === "steps"}
        <ol class="mt-5 space-y-3">
          {#each recipe.steps as step, index}
            <li class="flex gap-3 text-sm leading-relaxed">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]"
              >
                {index + 1}
              </span>
              <span class="pt-0.5 text-[var(--text)]">{step.text}</span>
            </li>
          {/each}
        </ol>

        <details
          class="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
        >
          <summary class="cursor-pointer px-4 py-3 text-sm font-semibold">
            Ver ingredientes ({recipe.ingredients.length})
          </summary>
          <ul class="space-y-2 border-t border-[var(--border)] px-4 py-3">
            {#each recipe.ingredients as ingredient}
              <li class="flex justify-between gap-4 text-sm">
                <span>{ingredient.item}</span>
                <span class="text-[var(--muted)]">{ingredient.amount}</span>
              </li>
            {/each}
          </ul>
        </details>
      {/if}

      <div
        class="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-5"
      >
        <button
          type="button"
          class="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
          onclick={() => onSave?.()}
        >
          Guardar receta
        </button>
        <button
          type="button"
          class="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
          onclick={shareRecipe}
        >
          Compartir
        </button>
        <button
          type="button"
          class="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
          onclick={() => onStartCooking?.()}
        >
          Modo cocinar →
        </button>
      </div>
    </div>
  </div>
</article>
