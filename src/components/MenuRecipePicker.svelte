<script lang="ts">
  import {
    getSavedRecipes,
    getFavorites,
    type SavedRecipe,
    type FavoriteRecipe,
  } from "../lib/auth";
  import type { Recipe } from "../lib/recipe-schema";

  let {
    open,
    dayLabel,
    dayDate,
    slotLabel,
    existingRecipeIds,
    onClose,
    onSelect,
  }: {
    open: boolean;
    dayLabel: string;
    dayDate: number;
    slotLabel: string;
    existingRecipeIds: Set<string>;
    onClose: () => void;
    onSelect: (recipe: {
      id: string;
      title: string;
      description: string;
      prepMinutes: number;
      cookMinutes: number;
      servings: number;
      difficulty: "fácil" | "media" | "difícil";
      ingredients: { item: string; amount: string }[];
      steps: { text: string; timerMinutes?: number }[];
      tips?: string[];
    }) => void;
  } = $props();

  let query = $state("");
  let loading = $state(true);
  let savedRecipes = $state<SavedRecipe[]>([]);
  let favoriteRecipes = $state<FavoriteRecipe[]>([]);

  let searchInput = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    if (!open) return;
    let cancelled = false;
    loading = true;
    Promise.all([getSavedRecipes(), getFavorites()])
      .then(([saved, favs]) => {
        if (cancelled) return;
        savedRecipes = saved;
        favoriteRecipes = favs;
        loading = false;
      })
      .catch(() => {
        if (cancelled) return;
        loading = false;
      });
    // Autofocus en el input
    setTimeout(() => searchInput?.focus(), 50);
    return () => {
      cancelled = true;
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  // Combina favoritos primero, luego guardadas, deduplicando por título de receta
  const allRecipes = $derived.by(() => {
    const byTitle = new Map<
      string,
      {
        id: string;
        title: string;
        description: string;
        prepMinutes: number;
        cookMinutes: number;
        servings: number;
        difficulty: "fácil" | "media" | "difícil";
        ingredients: { item: string; amount: string }[];
        steps: { text: string; timerMinutes?: number }[];
        tips?: string[];
        isFavorite: boolean;
      }
    >();
    for (const fav of favoriteRecipes) {
      const r = fav.recipe as Recipe;
      byTitle.set(fav.title, {
        id: fav.recipeId,
        title: fav.title,
        description: r.description,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        servings: r.servings,
        difficulty: r.difficulty,
        ingredients: r.ingredients,
        steps: r.steps,
        tips: r.tips,
        isFavorite: true,
      });
    }
    for (const saved of savedRecipes) {
      if (!byTitle.has(saved.recipe.title)) {
        const r = saved.recipe as Recipe;
        byTitle.set(saved.recipe.title, {
          id: saved.id,
          title: saved.recipe.title,
          description: r.description,
          prepMinutes: r.prepMinutes,
          cookMinutes: r.cookMinutes,
          servings: r.servings,
          difficulty: r.difficulty,
          ingredients: r.ingredients,
          steps: r.steps,
          tips: r.tips,
          isFavorite: false,
        });
      }
    }
    return Array.from(byTitle.values());
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter((r) => r.title.toLowerCase().includes(q));
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in-up"
    role="dialog"
    aria-modal="true"
    aria-labelledby="picker-title"
    onclick={onClose}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <header
        class="flex items-start justify-between gap-3 p-5 border-b border-dashed border-[var(--border)]"
      >
        <div>
          <p
            class="font-mono text-[0.625rem] font-bold tracking-wider text-[var(--muted)] uppercase"
          >
            {dayLabel}
            {dayDate} · {slotLabel}
          </p>
          <h3
            id="picker-title"
            class="font-handwritten text-2xl font-black text-[var(--text)] mt-1 leading-tight"
          >
            Elige una receta
          </h3>
        </div>
        <button
          type="button"
          onclick={onClose}
          class="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)] active:scale-95 transition-all cursor-pointer"
          aria-label="Cerrar selector"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </header>

      <!-- Búsqueda -->
      <div class="px-5 pt-4">
        <label class="block">
          <span class="sr-only">Buscar receta</span>
          <div class="relative">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-lg pointer-events-none"
            >
              search
            </span>
            <input
              bind:this={searchInput}
              bind:value={query}
              type="text"
              placeholder="Buscar receta..."
              class="w-full rounded-2xl border border-[var(--border)] bg-white pl-10 pr-4 py-2.5 text-sm font-body text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft-opacity)] transition-all"
            />
          </div>
        </label>
      </div>

      <!-- Lista -->
      <div class="flex-1 overflow-y-auto p-5 space-y-2">
        {#if loading}
          <div
            class="flex flex-col items-center justify-center py-12 text-[var(--muted)]"
          >
            <span
              class="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
            ></span>
            <p class="font-mono text-xs mt-3">Cargando recetas...</p>
          </div>
        {:else if filtered.length === 0}
          <div
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <span
              class="material-symbols-outlined text-5xl text-[var(--muted)]"
            >
              restaurant_menu
            </span>
            {#if allRecipes.length === 0}
              <p
                class="font-handwritten text-base font-bold text-[var(--text)] mt-3"
              >
                No tienes recetas guardadas todavía
              </p>
              <p class="font-mono text-xs text-[var(--muted)] mt-1 max-w-xs">
                Genera una receta con tus ingredientes y guárdala en tu
                biblioteca para poder añadirla a tu menú.
              </p>
            {:else}
              <p
                class="font-handwritten text-base font-bold text-[var(--text)] mt-3"
              >
                Sin resultados
              </p>
              <p class="font-mono text-xs text-[var(--muted)] mt-1">
                Prueba con otro término de búsqueda
              </p>
            {/if}
          </div>
        {:else}
          {#each filtered as recipe (recipe.id)}
            <button
              type="button"
              onclick={() => onSelect(recipe)}
              class="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 text-left hover:border-[var(--accent)] hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {recipe.isFavorite
                  ? 'bg-red-50 text-red-500'
                  : 'bg-[var(--accent-soft)] text-[var(--accent)]'} text-xl border border-[var(--border)]"
              >
                {recipe.isFavorite ? "❤️" : "🍳"}
              </div>
              <div class="flex-1 min-w-0">
                <h4
                  class="font-handwritten text-base font-bold text-[var(--text)] truncate"
                >
                  {recipe.title}
                </h4>
                <p
                  class="font-mono text-[0.625rem] text-[var(--muted)] truncate mt-0.5"
                >
                  ⏱ {recipe.prepMinutes + recipe.cookMinutes} min · {recipe.servings}
                  porciones · {recipe.difficulty}
                </p>
                {#if existingRecipeIds.has(recipe.id)}
                  <p
                    class="font-mono text-[0.5625rem] text-[var(--accent)] mt-0.5 font-bold"
                  >
                    Ya está en tu menú esta semana
                  </p>
                {/if}
              </div>
              <span
                class="material-symbols-outlined text-[var(--muted)] group-hover:text-[var(--accent)]"
              >
                add_circle
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
