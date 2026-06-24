<script lang="ts">
  import type { Recipe } from "../lib/recipe-schema";

  let { recipe }: { recipe: Recipe } = $props();
</script>

<article
  class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 class="text-2xl font-semibold tracking-tight">{recipe.title}</h2>
      <p class="mt-2 max-w-2xl text-[var(--muted)]">{recipe.description}</p>
    </div>
    <span
      class="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
    >
      {recipe.difficulty}
    </span>
  </div>

  <dl class="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
    <div class="rounded-xl bg-stone-50 p-3">
      <dt class="text-[var(--muted)]">Prep</dt>
      <dd class="font-semibold">{recipe.prepMinutes} min</dd>
    </div>
    <div class="rounded-xl bg-stone-50 p-3">
      <dt class="text-[var(--muted)]">Cocción</dt>
      <dd class="font-semibold">{recipe.cookMinutes} min</dd>
    </div>
    <div class="rounded-xl bg-stone-50 p-3">
      <dt class="text-[var(--muted)]">Total</dt>
      <dd class="font-semibold">
        {recipe.prepMinutes + recipe.cookMinutes} min
      </dd>
    </div>
    <div class="rounded-xl bg-stone-50 p-3">
      <dt class="text-[var(--muted)]">Porciones</dt>
      <dd class="font-semibold">{recipe.servings}</dd>
    </div>
  </dl>

  <div class="mt-8 grid gap-8 md:grid-cols-2">
    <section>
      <h3 class="text-lg font-semibold">Ingredientes</h3>
      <ul class="mt-3 space-y-2">
        {#each recipe.ingredients as ingredient}
          <li
            class="flex items-start justify-between gap-4 rounded-lg border border-[var(--border)] px-3 py-2"
          >
            <span>{ingredient.item}</span>
            <span class="text-sm text-[var(--muted)]">{ingredient.amount}</span>
          </li>
        {/each}
      </ul>
    </section>

    <section>
      <h3 class="text-lg font-semibold">Pasos</h3>
      <ol class="mt-3 space-y-3">
        {#each recipe.steps as step, index}
          <li class="rounded-lg border border-[var(--border)] px-3 py-3">
            <span class="mr-2 font-semibold text-[var(--accent)]"
              >{index + 1}.</span
            >
            {step.text}
            {#if step.timerMinutes}
              <span class="mt-2 block text-sm text-[var(--muted)]">
                Temporizador sugerido: {step.timerMinutes} min
              </span>
            {/if}
          </li>
        {/each}
      </ol>
    </section>
  </div>

  {#if recipe.tips?.length}
    <section class="mt-8 rounded-xl bg-amber-50 p-4">
      <h3 class="font-semibold text-amber-900">Tips</h3>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
        {#each recipe.tips as tip}
          <li>{tip}</li>
        {/each}
      </ul>
    </section>
  {/if}
</article>
