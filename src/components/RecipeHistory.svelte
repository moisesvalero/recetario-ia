<script lang="ts">
  import type { StoredRecipe } from "../lib/recipe-schema";

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
    class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
  >
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">Historial</h2>
      <span class="text-sm text-[var(--muted)]">{items.length} recetas</span>
    </div>
    <ul class="space-y-2">
      {#each items as item}
        <li>
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3 text-left hover:bg-stone-50"
            onclick={() => onSelect(item)}
          >
            <span>
              <span class="block font-medium">{item.title}</span>
              <span class="text-sm text-[var(--muted)]">
                {new Date(item.createdAt).toLocaleString("es-ES")}
              </span>
            </span>
            <span class="text-sm text-[var(--muted)]">{item.difficulty}</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/if}
