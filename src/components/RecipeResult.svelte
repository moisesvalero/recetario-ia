<script lang="ts">
  import type { Recipe } from "../lib/recipe-schema";
  import CookMode from "./CookMode.svelte";
  import RecipeCard from "./RecipeCard.svelte";

  let { recipe }: { recipe: Recipe } = $props();

  let viewMode = $state<"steps" | "cook">("steps");
  let cooking = $state(false);

  function startCooking() {
    cooking = true;
    viewMode = "cook";
  }
</script>

<section class="space-y-4">
  {#if cooking}
    <CookMode steps={recipe.steps} onClose={() => (cooking = false)} />
  {:else}
    <RecipeCard
      {recipe}
      {viewMode}
      onViewModeChange={(mode) => (viewMode = mode)}
      onStartCooking={startCooking}
    />
  {/if}
</section>
