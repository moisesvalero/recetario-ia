<script lang="ts">
  import type { Recipe } from "../lib/recipe-schema";
  import { getRecipeImageUrl } from "../lib/recipe-image";
  import { authState } from "../lib/auth-state.svelte";
  import {
    isFavorite as checkFavorite,
    toggleFavorite as saveFavorite,
    saveRecipe,
    addToShoppingList,
  } from "../lib/auth";
  import { exportToPdf } from "../lib/pdf-generator";

  let {
    recipe,
    viewMode = "steps",
    onViewModeChange,
    onStartCooking,
  }: {
    recipe: Recipe;
    viewMode?: "steps" | "cook";
    onViewModeChange?: (mode: "steps" | "cook") => void;
    onStartCooking?: () => void;
  } = $props();

  let isFav = $state(false);
  let statusMessage = $state("");
  let statusType = $state<"success" | "error">("success");

  // Reactividad para el botón de favorito
  $effect(() => {
    const user = authState.currentUser;
    checkFavorite(recipe.title).then((val) => {
      isFav = val;
    });
  });

  const totalMinutes = $derived(recipe.prepMinutes + recipe.cookMinutes);
  const imageUrl = $derived(
    getRecipeImageUrl(
      recipe.title,
      recipe.ingredients.map((i) => i.item),
    ),
  );

  async function handleToggleFavorite() {
    try {
      const nextFav = await saveFavorite(recipe);
      isFav = nextFav;
      showStatus(
        nextFav ? "¡Guardada en favoritos! ❤️" : "Eliminada de favoritos 💔",
        "success",
      );
    } catch (err: any) {
      showStatus(err.message || "Regístrate para marcar favoritos", "error");
      authState.openLogin();
    }
  }

  async function handleSaveRecipe() {
    try {
      await saveRecipe(recipe);
      showStatus("¡Receta guardada en tu biblioteca! 📖", "success");
    } catch (err: any) {
      showStatus(err.message || "Regístrate para guardar la receta", "error");
      if (!authState.currentUser) {
        authState.openLogin();
      }
    }
  }

  async function handleAddShopping() {
    try {
      await addToShoppingList(recipe.ingredients);
      showStatus("¡Ingredientes añadidos a tu lista de compras! 🛒", "success");
    } catch (err: any) {
      showStatus(
        err.message || "Regístrate para usar la lista de compras",
        "error",
      );
      authState.openLogin();
    }
  }

  function handleDownloadPdf() {
    if (!authState.currentUser) {
      showStatus(
        "Regístrate gratis para descargar la receta en PDF bonito 📄",
        "error",
      );
      authState.openRegister();
      return;
    }
    try {
      exportToPdf(recipe);
      showStatus("Generando PDF... 📄", "success");
    } catch (err: any) {
      showStatus("Error al generar PDF", "error");
    }
  }

  function showStatus(msg: string, type: "success" | "error" = "success") {
    statusMessage = msg;
    statusType = type;
    setTimeout(() => {
      statusMessage = "";
    }, 3500);
  }

  function shareRecipe() {
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href,
      });
    } else {
      // Fallback
      if (typeof navigator !== "undefined") {
        navigator.clipboard.writeText(window.location.href);
        showStatus("¡Enlace copiado al portapapeles! 🔗", "success");
      }
    }
  }
</script>

<article
  class="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-100/40"
>
  <!-- Mensaje de estado -->
  {#if statusMessage}
    <div
      class="fixed bottom-6 right-6 z-50 rounded-2xl p-4 text-xs font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 {statusType ===
      'success'
        ? 'bg-slate-800'
        : 'bg-orange-600'}"
    >
      {#if statusType === "success"}
        ✓
      {:else}
        ⚠️
      {/if}
      {statusMessage}
    </div>
  {/if}

  <div class="grid lg:grid-cols-[380px_1fr]">
    <!-- Columna Izquierda (Imagen de plato) -->
    <div class="relative min-h-[260px] lg:min-h-full">
      <img
        src={imageUrl}
        alt={recipe.title}
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <!-- Corazón de Favorito Flotante -->
      <button
        type="button"
        onclick={handleToggleFavorite}
        class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-md transition-all hover:scale-105 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFav ? "currentColor" : "none"}
          stroke={isFav ? "currentColor" : "currentColor"}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5 {isFav ? 'text-red-500' : 'text-slate-400'}"
        >
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          />
        </svg>
      </button>

      <!-- Badge Listo en X min Flotante -->
      <div
        class="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-2xl bg-white/95 px-4 py-2 text-xs font-bold text-slate-800 shadow-md backdrop-blur-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-3.5 w-3.5 text-slate-500"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Listo en {totalMinutes} min
      </div>
    </div>

    <!-- Columna Derecha (Contenido de Receta) -->
    <div class="flex flex-col p-6 sm:p-8 lg:p-10 justify-between">
      <div>
        <!-- Título e insignia IA -->
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2
              class="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex flex-wrap items-center gap-2 leading-tight"
            >
              {recipe.title}
              <span
                class="inline-flex items-center rounded-lg bg-orange-100/80 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 tracking-wider"
              >
                IA
              </span>
            </h2>
            <p
              class="mt-2 text-xs sm:text-sm text-slate-400 font-semibold leading-relaxed max-w-2xl"
            >
              {recipe.description}
            </p>
          </div>
        </div>

        <!-- Metadata de Cocina -->
        <div class="mt-5 flex flex-wrap gap-4 border-b border-slate-50 pb-5">
          <span
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-slate-400"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {totalMinutes} min
          </span>
          <span
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 capitalize"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-slate-400"
            >
              <path d="M6 18V13c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v5" />
              <path
                d="M3 18h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Z"
              />
            </svg>
            {recipe.difficulty}
          </span>
          <span
            class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4 text-slate-400"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {recipe.servings} porciones
          </span>
        </div>

        <!-- Modo de cocción & Pasos -->
        <div class="mt-6">
          <div class="flex items-center justify-between gap-4">
            <h3
              class="text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Pasos de preparación
            </h3>

            <!-- Selector de modo -->
            <div
              class="inline-flex rounded-xl bg-slate-100 p-1 scale-90 origin-right"
            >
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all {viewMode ===
                'steps'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400'}"
                onclick={() => onViewModeChange?.("steps")}
              >
                Paso a paso
              </button>
              <button
                type="button"
                class="rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all {viewMode ===
                'cook'
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400'}"
                onclick={() => {
                  onViewModeChange?.("cook");
                  onStartCooking?.();
                }}
              >
                Cocción guiada
              </button>
            </div>
          </div>

          <!-- Pasos numerados con círculos naranjas -->
          <ol class="mt-5 space-y-4">
            {#each recipe.steps as step, index}
              <li class="flex gap-4 text-xs sm:text-sm leading-relaxed">
                <span
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-extrabold text-white"
                >
                  {index + 1}
                </span>
                <span class="pt-0.5 text-slate-600 font-medium"
                  >{step.text}</span
                >
              </li>
            {/each}
          </ol>

          <!-- Ingredientes colapsables -->
          <details
            class="mt-6 rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden transition-all duration-300"
          >
            <summary
              class="cursor-pointer px-5 py-4 text-xs font-bold text-slate-700 flex items-center justify-between select-none"
            >
              Ver ingredientes necesarios ({recipe.ingredients.length})
              <svg
                class="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <ul
              class="space-y-2.5 border-t border-slate-100/80 px-5 py-4 bg-white/80"
            >
              {#each recipe.ingredients as ingredient}
                <li
                  class="flex justify-between gap-4 text-xs font-semibold text-slate-600"
                >
                  <span>{ingredient.item}</span>
                  <span
                    class="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100"
                    >{ingredient.amount}</span
                  >
                </li>
              {/each}
            </ul>
          </details>
        </div>
      </div>

      <!-- Pie de tarjeta: Botones de Acción -->
      <div
        class="mt-8 flex flex-wrap gap-2.5 border-t border-slate-100/70 pt-6"
      >
        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          onclick={handleSaveRecipe}
        >
          <svg
            class="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          Guardar receta
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          onclick={handleAddShopping}
        >
          <svg
            class="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Agregar a la lista
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          onclick={shareRecipe}
        >
          <svg
            class="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.684 10.742l4.63-2.316a3 3 0 11.83 1.666l-4.63 2.316a3 3 0 11-.83-1.666z"
            />
          </svg>
          Compartir
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
          onclick={handleDownloadPdf}
        >
          <svg
            class="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Descargar PDF
        </button>

        <!-- Botón Modo Cocinar Principal -->
        <button
          type="button"
          class="ml-auto flex items-center gap-1.5 rounded-2xl bg-orange-500 px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/10 hover:bg-orange-600 active:scale-95 transition-all"
          onclick={onStartCooking}
        >
          Modo cocinar
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</article>
