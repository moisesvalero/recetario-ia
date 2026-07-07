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
  let showMoreActions = $state(false);
  let showAuthPrompt = $state(false);
  let authPromptReason = $state("");
  let favoriteAnimate = $state(false);

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
    favoriteAnimate = true;
    setTimeout(() => {
      favoriteAnimate = false;
    }, 300);
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
    if (!authState.currentUser) {
      authPromptReason = "guardar esta receta en tu biblioteca personal";
      showAuthPrompt = true;
      return;
    }
    try {
      await saveRecipe(recipe);
      showStatus("¡Receta guardada en tu biblioteca! 📖", "success");
    } catch (err: any) {
      showStatus(err.message || "Error al guardar receta", "error");
    }
  }

  async function handleAddShopping() {
    if (!authState.currentUser) {
      authPromptReason = "sincronizar tus ingredientes en la lista de compras";
      showAuthPrompt = true;
      return;
    }
    try {
      await addToShoppingList(recipe.ingredients);
      showStatus("¡Ingredientes añadidos a tu lista de compras! 🛒", "success");
    } catch (err: any) {
      showStatus(
        err.message || "Error al agregar a la lista de compras",
        "error",
      );
    }
  }

  function handleDownloadPdf() {
    if (!authState.currentUser) {
      authPromptReason = "descargar esta receta en un formato PDF limpio";
      showAuthPrompt = true;
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
  class="overflow-hidden rounded border border-dashed border-[var(--border)] bg-white shadow-md print-recipe"
>
  <!-- Mensaje de estado -->
  {#if statusMessage}
    <div
      class="fixed bottom-6 right-6 z-50 rounded bg-[var(--text)] p-4 text-xs font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2"
    >
      {#if statusType === "success"}
        ✓
      {:else}
        ⚠️
      {/if}
      {statusMessage}
    </div>
  {/if}

  <div
    class="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[var(--border)] notebook-paper p-6 sm:p-8 min-h-[500px]"
  >
    <!-- Left Page of the open book: Image and Ingredients -->
    <div class="p-4 sm:p-6 flex flex-col gap-6">
      <!-- Polaroid Image -->
      <div class="relative polaroid w-full rotate-[-1.5deg] max-w-sm mx-auto">
        <img
          src={imageUrl}
          alt={recipe.title}
          class="w-full aspect-[4/3] object-cover grayscale-[10%] sepia-[5%]"
          loading="lazy"
        />
        <!-- Favorite Heart Icon overlay on Polaroid -->
        <button
          type="button"
          onclick={handleToggleFavorite}
          class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--muted)] shadow-md transition-all hover:scale-105 active:scale-95 print-hidden border border-black/5"
          aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFav ? "currentColor" : "none"}
            stroke={isFav ? "currentColor" : "currentColor"}
            stroke-width="2.2"
            class="h-4.5 w-4.5 transition-transform duration-300 {isFav
              ? 'text-red-500'
              : 'text-[var(--muted)]'} {favoriteAnimate
              ? 'scale-125 rotate-12'
              : ''}"
          >
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            />
          </svg>
        </button>
        <p
          class="font-handwritten text-center mt-3 text-[var(--text)]/80 text-sm font-bold truncate px-2"
        >
          {recipe.title}
        </p>
      </div>

      <!-- Lined paper block for Ingredients -->
      <div class="flex-1 mt-4">
        <h3
          class="font-handwritten text-2xl font-bold text-[var(--text)] mb-4 border-b border-[var(--text)]/15 pb-1"
        >
          Ingredientes
        </h3>
        <ul class="space-y-2 font-handwritten text-base text-[var(--text)]/90">
          {#each recipe.ingredients as ingredient}
            <li
              class="flex justify-between items-center gap-4 py-1 border-b border-dashed border-[var(--text)]/10"
            >
              <span class="flex items-center gap-2">
                <!-- Checkbox hand drawn -->
                <span
                  class="inline-block w-4 h-4 border border-[var(--text)] flex items-center justify-center text-[10px] font-mono text-[var(--text)] font-extrabold select-none bg-white/20"
                >
                  ✓
                </span>
                <span>{ingredient.item}</span>
              </span>
              <span class="text-sm text-[var(--muted)] font-mono"
                >{ingredient.amount}</span
              >
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Right Page: Details, Info and Steps -->
    <div class="p-4 sm:p-6 flex flex-col justify-between gap-6 lg:pl-10">
      <div>
        <!-- Title and description -->
        <div>
          <h2
            class="font-handwritten text-3xl font-black text-[var(--text)] leading-tight"
          >
            {recipe.title}
          </h2>
          <p
            class="font-handwritten text-base text-[var(--muted)] mt-2 leading-relaxed"
          >
            {recipe.description}
          </p>
        </div>

        <!-- Masking Tapes for cooking metadata -->
        <div class="mt-6 flex flex-wrap gap-4 select-none">
          <span
            class="relative px-4 py-1.5 text-[var(--text)] font-handwritten text-sm rotate-[-1deg] tape shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-black/5 flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">schedule</span>
            Listo en {totalMinutes} min
          </span>
          <span
            class="relative px-4 py-1.5 text-[var(--text)] font-handwritten text-sm rotate-[1.2deg] tape shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-black/5 flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base"
              >restaurant_menu</span
            >
            Dificultad: {recipe.difficulty}
          </span>
          <span
            class="relative px-4 py-1.5 text-[var(--text)] font-handwritten text-sm rotate-[-0.8deg] tape shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-black/5 flex items-center gap-1.5"
          >
            <span class="material-symbols-outlined text-base">group</span>
            {recipe.servings} porciones
          </span>
        </div>

        <!-- Cooking Steps -->
        <div class="mt-8">
          <div
            class="flex items-center justify-between gap-4 border-b border-[var(--text)]/15 pb-2 mb-4"
          >
            <h3 class="font-handwritten text-xl font-bold text-[var(--text)]">
              Preparación
            </h3>

            <!-- View mode selectors -->
            <div
              class="inline-flex rounded border border-[var(--border)] bg-[var(--surface-muted)] p-0.5 scale-90 origin-right"
            >
              <button
                type="button"
                class="rounded px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer {viewMode ===
                'steps'
                  ? 'bg-white text-[var(--text)] shadow-sm'
                  : 'text-[var(--muted)]'}"
                onclick={() => onViewModeChange?.("steps")}
              >
                Paso a paso
              </button>
              <button
                type="button"
                class="rounded px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer {viewMode ===
                'cook'
                  ? 'bg-white text-[var(--text)] shadow-sm'
                  : 'text-[var(--muted)]'}"
                onclick={() => {
                  onViewModeChange?.("cook");
                  onStartCooking?.();
                }}
              >
                Cocina guiada
              </button>
            </div>
          </div>

          <!-- Lined steps -->
          <ol
            class="space-y-4 font-handwritten text-base leading-relaxed text-[var(--text)]/90"
          >
            {#each recipe.steps as step, index}
              <li
                class="flex gap-4 items-start py-1 border-b border-dashed border-[var(--text)]/5"
              >
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--text)]/10 text-xs font-mono font-bold text-[var(--text)]"
                >
                  {index + 1}
                </span>
                <span class="pt-0.5">{step.text}</span>
              </li>
            {/each}
          </ol>
        </div>
      </div>

      <!-- Action buttons -->
      <div
        class="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t border-dashed border-[var(--border)] print-hidden select-none"
      >
        <button
          type="button"
          class="flex items-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-4 py-2.5 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
          onclick={handleToggleFavorite}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFav ? "currentColor" : "none"}
            stroke="currentColor"
            stroke-width="2.2"
            class="h-4 w-4 transition-transform {isFav
              ? 'text-red-500'
              : 'text-[var(--text)]'}"
          >
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
            />
          </svg>
          {isFav ? "Quitar de favoritos" : "Favorito"}
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-4 py-2.5 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
          onclick={handleAddShopping}
        >
          <span class="material-symbols-outlined text-base">shopping_cart</span>
          Agregar a compras
        </button>

        <div class="relative">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded border border-dashed border-[var(--border)] bg-white text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
            onclick={() => (showMoreActions = !showMoreActions)}
            aria-label="Más opciones de la receta"
          >
            <span class="material-symbols-outlined text-lg">more_vert</span>
          </button>

          {#if showMoreActions}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="absolute bottom-full left-0 mb-2 z-20 w-40 rounded border border-[var(--border)] bg-white p-1 shadow-md animate-fade-in-up"
              onclick={() => (showMoreActions = false)}
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-mono font-bold uppercase text-[var(--text)] hover:bg-[var(--accent-soft)]/20 transition-all cursor-pointer"
                onclick={(e) => {
                  e.stopPropagation();
                  shareRecipe();
                  showMoreActions = false;
                }}
              >
                <span class="material-symbols-outlined text-base">share</span>
                Compartir
              </button>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-mono font-bold uppercase text-[var(--text)] hover:bg-[var(--accent-soft)]/20 transition-all cursor-pointer"
                onclick={(e) => {
                  e.stopPropagation();
                  handleDownloadPdf();
                  showMoreActions = false;
                }}
              >
                <span class="material-symbols-outlined text-base"
                  >picture_as_pdf</span
                >
                Descargar PDF
              </button>
            </div>
          {/if}
        </div>

        <button
          type="button"
          class="marker-btn ml-auto flex items-center gap-1.5 py-3 px-5 text-xs text-white shadow-md cursor-pointer select-none"
          onclick={onStartCooking}
        >
          <span>Modo cocinar</span>
          <span class="material-symbols-outlined text-base">arrow_forward</span>
        </button>
      </div>
    </div>

    {#if showAuthPrompt}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        onclick={() => (showAuthPrompt = false)}
      >
        <div
          class="w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg text-center"
          onclick={(e) => e.stopPropagation()}
        >
          <p class="text-2xl mb-2">📖</p>
          <h4 class="text-sm font-extrabold text-[var(--text)]">
            Únete a nuestro recetario
          </h4>
          <p class="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Crea una cuenta gratuita o inicia sesión para poder {authPromptReason}.
          </p>
          <div class="mt-5 flex flex-col gap-2">
            <button
              type="button"
              class="h-10 w-full rounded-xl bg-[var(--accent)] text-xs font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] transition active:scale-95"
              onclick={() => {
                showAuthPrompt = false;
                authState.openRegister();
              }}
            >
              Crear cuenta gratis
            </button>
            <button
              type="button"
              class="h-10 w-full rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-muted)] transition active:scale-95"
              onclick={() => {
                showAuthPrompt = false;
                authState.openLogin();
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              class="mt-1 text-[10px] font-bold text-[var(--muted)] hover:text-[var(--text)] transition"
              onclick={() => (showAuthPrompt = false)}
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</article>
