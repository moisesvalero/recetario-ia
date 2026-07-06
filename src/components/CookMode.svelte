<script lang="ts">
  import type { RecipeStep, Recipe } from "../lib/recipe-schema";

  let {
    steps,
    ingredients = [],
    onClose,
  }: {
    steps: RecipeStep[];
    ingredients?: Recipe["ingredients"];
    onClose: () => void;
  } = $props();

  let currentStep = $state(0);
  let remainingSeconds = $state(0);
  let timerRunning = $state(false);
  let timerId: ReturnType<typeof setInterval> | null = null;

  const step = $derived(steps[currentStep]);
  const progress = $derived(((currentStep + 1) / steps.length) * 100);

  // Variables para gestos swipe táctiles
  let touchStartX = 0;
  let touchEndX = 0;

  function removeAccents(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Identifica qué ingredientes se mencionan en el paso actual
  const currentStepIngredients = $derived(
    ingredients.filter((ing) => {
      const cleanText = removeAccents(step.text.toLowerCase());
      const cleanItem = removeAccents(ing.item.toLowerCase());
      return (
        cleanText.includes(cleanItem) ||
        cleanItem
          .split(" ")
          .some((word) => word.length > 3 && cleanText.includes(word))
      );
    }),
  );

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    timerRunning = false;
  }

  function startTimer(minutes: number) {
    clearTimer();
    remainingSeconds = minutes * 60;
    timerRunning = true;
    timerId = setInterval(() => {
      if (remainingSeconds <= 1) {
        remainingSeconds = 0;
        clearTimer();
        return;
      }
      remainingSeconds -= 1;
    }, 1000);
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function goNext() {
    clearTimer();
    if (currentStep < steps.length - 1) currentStep += 1;
  }

  function goPrev() {
    clearTimer();
    if (currentStep > 0) currentStep -= 1;
  }

  function handleCloseConfirm() {
    if (
      confirm(
        "¿Quieres salir del modo cocina? Se reiniciará tu progreso del paso.",
      )
    ) {
      clearTimer();
      onClose();
    }
  }

  // Gestos swipe
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].clientX;
  }

  function handleTouchEnd(e: TouchEvent) {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  }

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    if (Math.abs(diffX) > 60) {
      if (diffX < 0) {
        if (currentStep < steps.length - 1) goNext();
      } else {
        if (currentStep > 0) goPrev();
      }
    }
  }
</script>

<section
  class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-md select-none"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <!-- Cabecera de Cocción -->
  <div
    class="border-b border-[var(--border)] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] px-6 py-5 text-white"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm opacity-90">Modo Cocinar</p>
        <h2 class="text-xl font-bold">
          Paso {currentStep + 1} de {steps.length}
        </h2>
      </div>
      <button
        type="button"
        class="h-10 rounded-xl bg-white/15 px-4 text-xs font-bold backdrop-blur transition hover:bg-white/25 active:scale-95"
        onclick={handleCloseConfirm}
      >
        Salir
      </button>
    </div>
    <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
      <div
        class="h-full rounded-full bg-white transition-all duration-300"
        style={`width: ${progress}%`}
      ></div>
    </div>
  </div>

  <div class="grid lg:grid-cols-[1fr_280px] gap-6 p-6 sm:p-8">
    <!-- Columna Principal (Instrucciones de Cocción) -->
    <div class="flex flex-col justify-between min-w-0">
      <div>
        <!-- Ingredientes activos del paso siempre visibles en móvil (oculto en escritorio) -->
        {#if currentStepIngredients.length > 0}
          <div
            class="lg:hidden mb-4 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 p-4"
          >
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-hover)]"
            >
              Ingredientes para este paso:
            </span>
            <div class="mt-2 flex flex-wrap gap-2">
              {#each currentStepIngredients as ing}
                <span
                  class="inline-flex items-center rounded-xl bg-[var(--surface)] px-3 py-1 text-xs font-bold text-[var(--text)] border border-[var(--border)]/70 shadow-sm"
                >
                  {ing.item}
                  <span class="text-[var(--muted)] font-semibold ml-1.5"
                    >({ing.amount})</span
                  >
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <p class="text-lg leading-relaxed text-[var(--text)] font-semibold">
          {step.text}
        </p>

        {#if step.timerMinutes}
          <div
            class="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
          >
            <p
              class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]"
            >
              Temporizador
            </p>
            <p
              class="mt-1.5 text-4xl font-bold tabular-nums text-[var(--accent)]"
            >
              {formatTime(remainingSeconds || step.timerMinutes * 60)}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="h-11 rounded-xl bg-[var(--accent)] px-5 text-xs font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] transition active:scale-95"
                onclick={() => startTimer(step.timerMinutes ?? 0)}
              >
                {timerRunning ? "Reiniciar" : "Iniciar"}
              </button>
              <button
                type="button"
                class="h-11 border border-[var(--border)] bg-[var(--surface)] px-5 text-xs font-bold text-[var(--text)] shadow-sm hover:bg-[var(--surface-muted)] transition active:scale-95"
                onclick={clearTimer}
              >
                Parar
              </button>
            </div>
          </div>
        {/if}

        <!-- Cajón Colapsable de Ingredientes Generales para Móvil (Oculto en LG) -->
        {#if ingredients.length > 0}
          <details
            class="lg:hidden mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden transition-all duration-300"
          >
            <summary
              class="cursor-pointer px-5 py-4 text-xs font-bold text-[var(--text)] flex items-center justify-between select-none"
            >
              Ver todos los ingredientes ({ingredients.length})
              <svg
                class="h-4 w-4 text-[var(--muted)]"
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
              class="space-y-2 border-t border-[var(--border)]/70 px-5 py-4 bg-[var(--surface)]"
            >
              {#each ingredients as ing}
                {@const active = currentStepIngredients.some(
                  (c) => c.item === ing.item,
                )}
                <li
                  class="flex justify-between gap-4 text-xs font-semibold rounded-lg p-1.5 transition {active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-hover)] font-bold'
                    : 'text-[var(--text)]'}"
                >
                  <span>{ing.item}</span>
                  <span class="text-[var(--muted)]">{ing.amount}</span>
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </div>

      <!-- Botones de Navegación Sobredimensionados (48px / 56px de alto) -->
      <div
        class="mt-8 flex items-center justify-between gap-3 border-t border-[var(--border)]/30 pt-6"
      >
        <button
          type="button"
          class="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-xs sm:text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-muted)] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={currentStep === 0}
          onclick={goPrev}
        >
          ← Anterior
        </button>

        <span class="text-xs font-semibold text-[var(--muted)] lg:hidden">
          Desliza para cambiar de paso
        </span>

        {#if currentStep < steps.length - 1}
          <button
            type="button"
            class="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-[var(--accent)] text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[var(--accent-hover)] active:scale-95 transition"
            onclick={goNext}
          >
            Siguiente →
          </button>
        {:else}
          <button
            type="button"
            class="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-emerald-600 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
            onclick={onClose}
          >
            ¡Listo!
          </button>
        {/if}
      </div>
    </div>

    <!-- Columna Lateral Derecha (Ingredientes en Escritorio) -->
    {#if ingredients.length > 0}
      <div class="hidden lg:block border-l border-[var(--border)] pl-6">
        <h3
          class="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4"
        >
          Ingredientes
        </h3>
        <ul
          class="space-y-2.5 max-h-[360px] overflow-y-auto pr-1"
          style="contain: content;"
        >
          {#each ingredients as ing}
            {@const active = currentStepIngredients.some(
              (c) => c.item === ing.item,
            )}
            <li
              class="flex flex-col rounded-2xl p-3 transition border {active
                ? 'bg-[var(--accent-soft)] border-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--surface-muted)]/50'}"
            >
              <span
                class="text-xs font-bold {active
                  ? 'text-[var(--accent-hover)]'
                  : 'text-[var(--text)]'}"
              >
                {ing.item}
              </span>
              <span
                class="text-[10px] font-semibold text-[var(--muted)] mt-0.5"
              >
                {ing.amount}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</section>
