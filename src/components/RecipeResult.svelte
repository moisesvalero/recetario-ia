<script lang="ts">
  import type { Recipe, StoredRecipe } from "../lib/recipe-schema";
  import CookMode from "./CookMode.svelte";
  import RecipeCard from "./RecipeCard.svelte";

  let { recipe }: { recipe: Recipe } = $props();

  let cooking = $state(false);
</script>

<section class="space-y-4">
  {#if cooking}
    <CookMode steps={recipe.steps} onClose={() => (cooking = false)} />
  {:else}
    <RecipeCard {recipe} />
    <button
      type="button"
      class="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      onclick={() => (cooking = true)}
    >
      Modo cocinar
    </button>
  {/if}
</section>
