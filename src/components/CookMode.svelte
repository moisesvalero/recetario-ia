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
  class="overflow-hidden rounded border border-dashed border-[var(--border)] bg-white shadow-md select-none"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <!-- Cabecera de Cocción -->
  <div
    class="border-b border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-6 py-5 text-[var(--text)]"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p
          class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)]"
        >
          Modo Cocinar
        </p>
        <h2 class="font-handwritten text-3xl font-black mt-1">
          Paso {currentStep + 1} de {steps.length}
        </h2>
      </div>
      <button
        type="button"
        class="h-10 rounded border border-dashed border-[var(--border)] bg-white px-4 text-xs font-mono font-bold uppercase hover:bg-[var(--accent-soft)]/20 active:scale-95 cursor-pointer"
        onclick={handleCloseConfirm}
      >
        Salir
      </button>
    </div>
    <div
      class="mt-4 h-2.5 overflow-hidden rounded bg-[var(--border)]/40 relative"
    >
      <div
        class="h-full bg-emerald-500/80 transition-all duration-300"
        style={`width: ${progress}%; clip-path: polygon(0% 0%, 100% 5%, 98% 95%, 1% 100%);`}
      ></div>
    </div>
  </div>

  <div
    class="grid lg:grid-cols-[1fr_260px] divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[var(--border)] notebook-paper p-6 sm:p-8 min-h-[400px]"
  >
    <!-- Columna Principal (Instrucciones de Cocción) -->
    <div class="flex flex-col justify-between min-w-0 pr-0 lg:pr-6">
      <div>
        <!-- Ingredientes activos del paso siempre visibles en móvil (oculto en escritorio) -->
        {#if currentStepIngredients.length > 0}
          <div
            class="lg:hidden mb-5 rounded bg-[var(--accent-soft)]/45 border border-dashed border-[var(--text)]/10 p-4"
          >
            <span
              class="text-[0.625rem] font-mono font-bold uppercase tracking-wider text-[var(--text)]"
            >
              Ingredientes para este paso:
            </span>
            <div class="mt-2.5 flex flex-wrap gap-2">
              {#each currentStepIngredients as ing}
                <span
                  class="inline-flex items-center rounded bg-white px-3 py-1 text-xs font-handwritten font-bold text-[var(--text)] border border-[var(--border)] shadow-sm"
                >
                  {ing.item}
                  <span
                    class="text-[var(--muted)] font-mono text-[0.625rem] ml-1.5"
                    >({ing.amount})</span
                  >
                </span>
              {/each}
            </div>
          </div>
        {/if}

        <p
          class="font-handwritten text-2xl font-black leading-relaxed text-[var(--text)]"
        >
          {step.text}
        </p>

        <!-- Timer as a Post-it Note -->
        {#if step.timerMinutes}
          <div
            class="mt-8 relative post-it p-5 rotate-[1deg] max-w-xs shadow-[4px_4px_0px_rgba(0,0,0,0.1)] border border-[var(--text)]/5 select-none"
          >
            <p
              class="font-handwritten text-xs font-black tracking-wider text-[var(--text)]/60"
            >
              TEMPORIZADOR
            </p>
            <p
              class="font-mono text-4xl font-black mt-1.5 tabular-nums text-[var(--text)]"
            >
              {formatTime(remainingSeconds || step.timerMinutes * 60)}
            </p>
            <div class="mt-4 flex flex-wrap gap-2 select-none">
              <button
                type="button"
                class="rounded bg-[var(--text)] px-4 py-2 text-xs font-mono font-bold uppercase text-white shadow-sm hover:opacity-90 transition active:scale-95 cursor-pointer"
                onclick={() => startTimer(step.timerMinutes ?? 0)}
              >
                {timerRunning ? "Reiniciar" : "Iniciar"}
              </button>
              <button
                type="button"
                class="rounded border border-dashed border-[var(--border)] bg-white px-4 py-2 text-xs font-mono font-bold uppercase text-[var(--text)] shadow-sm hover:bg-[var(--surface-muted)] transition active:scale-95 cursor-pointer"
                onclick={clearTimer}
              >
                Parar
              </button>
            </div>
            <!-- Corner fold decoration -->
            <div
              class="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-tl from-black/5 to-transparent pointer-events-none"
            ></div>
          </div>
        {/if}

        <!-- Cajón Colapsable de Ingredientes Generales para Móvil (Oculto en LG) -->
        {#if ingredients.length > 0}
          <details
            class="lg:hidden mt-6 rounded border border-dashed border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden transition-all duration-300"
          >
            <summary
              class="cursor-pointer px-5 py-4 text-xs font-mono font-bold uppercase text-[var(--text)] flex items-center justify-between select-none"
            >
              Ver ingredientes necesarios ({ingredients.length})
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
              class="space-y-2 border-t border-dashed border-[var(--border)] px-5 py-4 bg-white/80 font-handwritten text-base text-[var(--text)]/90"
            >
              {#each ingredients as ing}
                {@const active = currentStepIngredients.some(
                  (c) => c.item === ing.item,
                )}
                <li
                  class="flex justify-between gap-4 py-1 border-b border-dashed border-black/5 transition {active
                    ? 'font-bold text-[var(--accent-hover)]'
                    : ''}"
                >
                  <span class="flex items-center gap-2">
                    <span
                      class="inline-block w-3.5 h-3.5 border border-[var(--text)] flex items-center justify-center text-[0.5rem] font-mono select-none"
                    >
                      {active ? "✓" : ""}
                    </span>
                    <span>{ing.item}</span>
                  </span>
                  <span class="text-sm text-[var(--muted)] font-mono"
                    >{ing.amount}</span
                  >
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </div>

      <!-- Botones de Navegación Sobredimensionados (48px / 56px de alto) -->
      <div
        class="mt-8 flex items-center justify-between gap-3 border-t border-dashed border-[var(--border)] pt-6 select-none"
      >
        <button
          type="button"
          class="h-12 px-6 rounded border border-dashed border-[var(--border)] bg-white text-xs font-mono font-bold uppercase text-[var(--text)] hover:bg-[var(--accent-soft)]/20 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          disabled={currentStep === 0}
          onclick={goPrev}
        >
          ← Anterior
        </button>

        <span
          class="text-xs font-handwritten font-bold text-[var(--muted)] lg:hidden"
        >
          Desliza para cambiar de paso
        </span>

        {#if currentStep < steps.length - 1}
          <button
            type="button"
            class="marker-btn h-12 px-6 text-xs text-white shadow-md cursor-pointer"
            onclick={goNext}
          >
            Siguiente →
          </button>
        {:else}
          <button
            type="button"
            class="h-12 px-6 rounded bg-emerald-600 text-xs font-mono font-bold uppercase text-white shadow-md hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
            onclick={onClose}
          >
            ¡Listo!
          </button>
        {/if}
      </div>
    </div>

    <!-- Columna Lateral Derecha (Ingredientes en Escritorio) -->
    {#if ingredients.length > 0}
      <div class="hidden lg:block pl-6">
        <h3
          class="font-mono text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4"
        >
          Ingredientes
        </h3>
        <ul
          class="space-y-2 max-h-[360px] overflow-y-auto pr-1"
          style="contain: content;"
        >
          {#each ingredients as ing}
            {@const active = currentStepIngredients.some(
              (c) => c.item === ing.item,
            )}
            <li
              class="flex flex-col rounded p-2.5 transition border border-dashed {active
                ? 'bg-[var(--accent-soft)]/40 border-[var(--text)]/20'
                : 'border-[var(--border)] bg-[var(--surface-muted)]/40'}"
            >
              <span
                class="font-handwritten text-base font-bold {active
                  ? 'text-[var(--accent-hover)]'
                  : 'text-[var(--text)]'}"
              >
                {ing.item}
              </span>
              <span
                class="text-[0.625rem] font-mono font-semibold text-[var(--muted)] mt-0.5"
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
