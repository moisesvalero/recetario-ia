<script lang="ts">
  import type { StoredRecipe } from "../lib/recipe-schema";
  import { getRecipeImageUrl } from "../lib/recipe-image";

  let {
    items,
    onSelect,
  }: {
    items: StoredRecipe[];
    onSelect: (recipe: StoredRecipe) => void;
  } = $props();
</script>

{#if items.length > 0}
  <section
    id="historial"
    class="scroll-mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-lg font-bold">Historial</h2>
      <span
        class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-[var(--muted)]"
        >{items.length}</span
      >
    </div>
    <ul class="grid gap-3 sm:grid-cols-2 min-w-0">
      {#each items as item}
        <li class="min-w-0">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50"
            onclick={() => onSelect(item)}
          >
            <img
              src={getRecipeImageUrl(
                item.title,
                item.ingredients.map((i) => i.item),
              )}
              alt=""
              class="h-14 w-14 shrink-0 rounded-lg object-cover"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate font-semibold text-sm"
                >{item.title}</span
              >
              <span class="text-xs text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleDateString("es-ES")}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/if}
