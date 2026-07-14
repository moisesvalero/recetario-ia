<script lang="ts">
  import type { Recipe } from "../lib/recipe-schema";
  import { getRecipeImageUrl } from "../lib/recipe-image";
  import { authState } from "../lib/auth-state.svelte";
  import {
    isFavorite as checkFavorite,
    toggleFavorite as saveFavorite,
    saveRecipe,
    addToShoppingList,
    updateFavoriteRecipe,
  } from "../lib/auth";
  import { exportToPdf } from "../lib/pdf-generator";
  import { addToMenu } from "../lib/menu-storage";
  import { getWeekStart } from "../lib/menu-schema";

  let {
    recipe: initialRecipe,
    viewMode = "steps",
    onViewModeChange,
    onStartCooking,
  }: {
    recipe: Recipe;
    viewMode?: "steps" | "cook";
    onViewModeChange?: (mode: "steps" | "cook") => void;
    onStartCooking?: () => void;
  } = $props();

  let localRecipe = $state(initialRecipe);
  $effect(() => {
    localRecipe = initialRecipe;
  });
  const recipe = $derived(localRecipe);

  let isFav = $state(false);
  let statusMessage = $state("");
  let statusType = $state<"success" | "error">("success");
  let showMoreActions = $state(false);
  let showAuthPrompt = $state(false);
  let authPromptReason = $state("");
  let favoriteAnimate = $state(false);
  let showMenuPopover = $state(false);

  // Reactividad para el botón de favorito
  $effect(() => {
    const user = authState.currentUser;
    checkFavorite(recipe.title).then((val) => {
      isFav = val;
    });
  });

  const totalMinutes = $derived(recipe.prepMinutes + recipe.cookMinutes);
  const imageUrl = $derived(
    recipe.customImage ||
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

  // ── Menú semanal: popover día × slot ────────────────────
  const dayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const slotLabels: Record<"desayuno" | "comida" | "cena", string> = {
    desayuno: "Desayuno",
    comida: "Comida",
    cena: "Cena",
  };

  function toggleMenuPopover() {
    if (!authState.currentUser) {
      authPromptReason = "planificar tus recetas en el menú semanal";
      showAuthPrompt = true;
      return;
    }
    showMenuPopover = !showMenuPopover;
  }

  async function addToMenuSlot(
    day: number,
    slot: "desayuno" | "comida" | "cena",
  ) {
    try {
      await addToMenu({
        weekStart: getWeekStart(),
        day,
        slot,
        recipeId: recipe.title,
        recipeSnapshot: {
          title: recipe.title,
          description: recipe.description,
          prepMinutes: recipe.prepMinutes,
          cookMinutes: recipe.cookMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tips: recipe.tips,
        },
      });
      showStatus(`Añadido a ${dayLabels[day]} ${slotLabels[slot]}`, "success");
      showMenuPopover = false;
    } catch (err: any) {
      showStatus(err?.message || "Error al añadir al menú", "error");
    }
  }

  // ── Edición de receta favorita y Webcam ────────────────
  let isEditing = $state(false);
  let editTitle = $state("");
  let editImage = $state<string | null>(null);
  let isCameraActive = $state(false);
  let cameraStream = $state<MediaStream | null>(null);
  let videoElement = $state<HTMLVideoElement | null>(null);
  let cameraError = $state("");

  function resizeAndCompressImage(
    fileOrDataUrl: File | string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(dataUrl);
        } else {
          reject(new Error("No se pudo obtener el contexto del canvas"));
        }
      };

      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));

      if (fileOrDataUrl instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
        reader.readAsDataURL(fileOrDataUrl);
      } else {
        img.src = fileOrDataUrl;
      }
    });
  }

  function openEditModal() {
    editTitle = recipe.title;
    editImage = recipe.customImage || null;
    isEditing = true;
    cameraError = "";
  }

  function closeEditModal() {
    stopCamera();
    isEditing = false;
  }

  async function startCamera() {
    cameraError = "";
    isCameraActive = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      cameraStream = stream;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error al acceder a la cámara:", err);
      cameraError = "No se pudo acceder a la cámara. Comprueba los permisos.";
      isCameraActive = false;
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    isCameraActive = false;
  }

  async function capturePhoto() {
    if (!videoElement) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        editImage = await resizeAndCompressImage(dataUrl);
      }
      stopCamera();
    } catch (err: any) {
      console.error("Error al capturar foto:", err);
      cameraError = "Error al capturar la foto.";
    }
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      editImage = await resizeAndCompressImage(file);
    } catch (err: any) {
      showStatus("Error al procesar la imagen seleccionada", "error");
    }
  }

  async function handleSaveEdit() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      showStatus("El título no puede estar vacío", "error");
      return;
    }

    try {
      const updatedRecipe = {
        ...recipe,
        title: trimmedTitle,
        customImage: editImage,
      };

      await updateFavoriteRecipe(recipe.title, updatedRecipe);
      localRecipe = updatedRecipe;
      showStatus("¡Receta editada con éxito! ✏️", "success");
      closeEditModal();
    } catch (err: any) {
      showStatus(err.message || "Error al guardar los cambios", "error");
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
    class="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[var(--border)] notebook-paper p-4 sm:p-8 min-h-[500px]"
  >
    <!-- Left Page of the open book: Image and Ingredients -->
    <div class="p-4 pl-6 pr-2 sm:p-6 flex flex-col gap-6">
      <!-- Polaroid Image -->
      <div class="relative polaroid w-full rotate-[-1.5deg] max-w-sm mx-auto">
        {#if isFav}
          <button
            type="button"
            onclick={openEditModal}
            class="absolute top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--text)] shadow-md transition-all hover:scale-105 active:scale-95 print-hidden border border-black/5 cursor-pointer"
            aria-label="Editar receta favorita"
          >
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
        {/if}
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
              class="flex justify-between items-start gap-4 py-1 border-b border-dashed border-[var(--text)]/10"
            >
              <span class="flex items-start gap-2 min-w-0 flex-1">
                <!-- Checkbox hand drawn -->
                <span
                  class="inline-block w-4 h-4 border border-[var(--text)] flex items-center justify-center text-[0.625rem] font-mono text-[var(--text)] font-extrabold select-none bg-white/20 shrink-0 mt-1"
                >
                  ✓
                </span>
                <span class="break-words">{ingredient.item}</span>
              </span>
              <span
                class="text-sm text-[var(--muted)] font-mono text-right break-words max-w-[45%]"
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
            class="font-handwritten text-3xl font-black text-[var(--text)] leading-tight break-words"
          >
            {recipe.title}
          </h2>
          <p
            class="font-handwritten text-base text-[var(--muted)] mt-2 leading-relaxed break-words"
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
                class="rounded px-2.5 py-1 text-[0.625rem] font-mono font-bold uppercase transition-all cursor-pointer {viewMode ===
                'steps'
                  ? 'bg-white text-[var(--text)] shadow-sm'
                  : 'text-[var(--muted)]'}"
                onclick={() => onViewModeChange?.("steps")}
              >
                Paso a paso
              </button>
              <button
                type="button"
                class="rounded px-2.5 py-1 text-[0.625rem] font-mono font-bold uppercase transition-all cursor-pointer {viewMode ===
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
                <span class="pt-0.5 flex-1 min-w-0 break-words"
                  >{step.text}</span
                >
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
            class="flex items-center gap-2 rounded border border-dashed border-[var(--border)] bg-white px-4 py-2.5 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
            onclick={toggleMenuPopover}
            aria-haspopup="dialog"
            aria-expanded={showMenuPopover}
            aria-label="Añadir al menú semanal"
          >
            <span class="material-symbols-outlined text-base"
              >calendar_month</span
            >
            Añadir al menú
          </button>

          {#if showMenuPopover}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="absolute bottom-full left-0 mb-2 z-30 w-[320px] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-lg animate-fade-in-up"
              role="dialog"
              aria-label="Selecciona día y comida"
              onclick={(e) => e.stopPropagation()}
            >
              <div class="flex items-center justify-between mb-2">
                <p
                  class="font-mono text-[0.625rem] font-bold tracking-wider text-[var(--muted)] uppercase"
                >
                  Semana actual
                </p>
                <button
                  type="button"
                  onclick={() => (showMenuPopover = false)}
                  class="flex h-6 w-6 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-all cursor-pointer"
                  aria-label="Cerrar"
                >
                  <span class="material-symbols-outlined text-base">close</span>
                </button>
              </div>
              <div
                class="grid gap-1"
                style="grid-template-columns: 60px repeat(7, minmax(0, 1fr));"
              >
                <div></div>
                {#each dayLabels as dayLabel, dayIdx}
                  <div
                    class="text-center font-mono text-[0.5625rem] font-bold tracking-wider text-[var(--muted)] uppercase py-1"
                  >
                    {dayLabel}
                  </div>
                {/each}

                {#each ["desayuno", "comida", "cena"] as slot (slot)}
                  <div
                    class="flex items-center font-mono text-[0.5625rem] font-bold tracking-wider text-[var(--muted)] uppercase pr-1"
                  >
                    {slotLabels[slot as "desayuno" | "comida" | "cena"]}
                  </div>
                  {#each dayLabels as _day, dayIdx}
                    <button
                      type="button"
                      onclick={() =>
                        addToMenuSlot(
                          dayIdx,
                          slot as "desayuno" | "comida" | "cena",
                        )}
                      class="aspect-square flex items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--accent)] active:scale-95 transition-all cursor-pointer"
                      aria-label={`Añadir a ${dayLabels[dayIdx]} ${slotLabels[slot as "desayuno" | "comida" | "cena"]}`}
                    >
                      <span class="material-symbols-outlined text-sm">add</span>
                    </button>
                  {/each}
                {/each}
              </div>
            </div>
          {/if}
        </div>

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
              class="mt-1 text-[0.625rem] font-bold text-[var(--muted)] hover:text-[var(--text)] transition"
              onclick={() => (showAuthPrompt = false)}
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if isEditing}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        onclick={closeEditModal}
      >
        <div
          class="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl notebook-paper"
          onclick={(e) => e.stopPropagation()}
        >
          <h3
            class="font-handwritten text-2xl font-bold text-[var(--text)] mb-4"
          >
            Editar Receta Favorita
          </h3>

          <div class="space-y-4">
            <!-- Campo Título -->
            <div>
              <label
                class="block font-mono text-[0.625rem] font-bold text-[var(--muted)] uppercase tracking-wider mb-1"
                for="edit-title"
              >
                Nombre de la receta
              </label>
              <input
                id="edit-title"
                type="text"
                bind:value={editTitle}
                class="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-handwritten text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="Ej. Tacos de Pollo"
              />
            </div>

            <!-- Campo Foto/Cámara -->
            <div>
              <label
                class="block font-mono text-[0.625rem] font-bold text-[var(--muted)] uppercase tracking-wider mb-2"
              >
                Foto de la receta
              </label>

              {#if isCameraActive}
                <div
                  class="relative overflow-hidden rounded-2xl bg-black aspect-[4/3] flex items-center justify-center mb-3"
                >
                  <!-- svelte-ignore a11y_media_has_caption -->
                  <video
                    bind:this={videoElement}
                    autoplay
                    playsinline
                    class="w-full h-full object-cover"
                  ></video>
                  <div
                    class="absolute bottom-4 left-0 right-0 flex justify-center gap-3"
                  >
                    <button
                      type="button"
                      onclick={capturePhoto}
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-md hover:bg-[var(--accent-hover)] transition active:scale-95 cursor-pointer"
                      aria-label="Capturar foto"
                    >
                      <span class="material-symbols-outlined text-xl"
                        >photo_camera</span
                      >
                    </button>
                    <button
                      type="button"
                      onclick={stopCamera}
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-md hover:bg-slate-700 transition active:scale-95 cursor-pointer"
                      aria-label="Cancelar cámara"
                    >
                      <span class="material-symbols-outlined text-xl"
                        >close</span
                      >
                    </button>
                  </div>
                </div>
              {:else}
                <div
                  class="relative polaroid w-48 mx-auto rotate-[-0.5deg] mb-3"
                >
                  <img
                    src={editImage ||
                      getRecipeImageUrl(
                        recipe.title,
                        recipe.ingredients.map((i) => i.item),
                      )}
                    alt="Vista previa"
                    class="w-full aspect-[4/3] object-cover rounded"
                  />
                </div>

                {#if cameraError}
                  <p class="text-red-500 text-xs font-mono mb-2 text-center">
                    {cameraError}
                  </p>
                {/if}

                <div class="flex justify-center gap-2">
                  <!-- Botón de subir archivo -->
                  <label
                    class="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 transition cursor-pointer active:scale-95"
                  >
                    <span class="material-symbols-outlined text-base"
                      >image</span
                    >
                    Galería
                    <input
                      type="file"
                      accept="image/*"
                      onchange={handleFileSelect}
                      class="hidden"
                    />
                  </label>

                  <!-- Botón de cámara -->
                  <button
                    type="button"
                    onclick={startCamera}
                    class="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] bg-white px-3 py-2 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 transition active:scale-95 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-base"
                      >photo_camera</span
                    >
                    Cámara
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="mt-6 flex gap-2">
            <button
              type="button"
              onclick={handleSaveEdit}
              class="h-10 flex-1 rounded-xl bg-[var(--accent)] text-xs font-mono font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[var(--accent-hover)] transition active:scale-95 cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onclick={closeEditModal}
              class="h-10 flex-1 rounded-xl border border-[var(--border)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--text)] hover:bg-[var(--surface-muted)] transition active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</article>
