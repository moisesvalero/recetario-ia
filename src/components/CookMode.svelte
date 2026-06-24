<script lang="ts">
  import type { RecipeStep } from "../lib/recipe-schema";

  let {
    steps,
    onClose,
  }: {
    steps: RecipeStep[];
    onClose: () => void;
  } = $props();

  let currentStep = $state(0);
  let remainingSeconds = $state(0);
  let timerRunning = $state(false);
  let timerId: ReturnType<typeof setInterval> | null = null;

  const step = $derived(steps[currentStep]);
  const progress = $derived(((currentStep + 1) / steps.length) * 100);

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
</script>

<section
  class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
>
  <div
    class="border-b border-[var(--border)] bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm text-orange-100">Cocción guiada</p>
        <h2 class="text-xl font-bold">
          Paso {currentStep + 1} de {steps.length}
        </h2>
      </div>
      <button
        type="button"
        class="rounded-xl bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
        onclick={onClose}
      >
        Salir
      </button>
    </div>
    <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/25">
      <div
        class="h-full rounded-full bg-white transition-all duration-300"
        style={`width: ${progress}%`}
      ></div>
    </div>
  </div>

  <div class="p-6 sm:p-8">
    <p class="text-lg leading-relaxed text-[var(--text)]">{step.text}</p>

    {#if step.timerMinutes}
      <div
        class="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
      >
        <p class="text-sm font-medium text-[var(--muted)]">Temporizador</p>
        <p class="mt-1 text-4xl font-bold tabular-nums text-[var(--accent)]">
          {formatTime(remainingSeconds || step.timerMinutes * 60)}
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            onclick={() => startTimer(step.timerMinutes ?? 0)}
          >
            {timerRunning ? "Reiniciar" : "Iniciar"}
          </button>
          <button
            type="button"
            class="rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-semibold"
            onclick={clearTimer}
          >
            Parar
          </button>
        </div>
      </div>
    {/if}

    <div class="mt-8 flex items-center justify-between gap-3">
      <button
        type="button"
        class="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
        disabled={currentStep === 0}
        onclick={goPrev}
      >
        ← Anterior
      </button>
      {#if currentStep < steps.length - 1}
        <button
          type="button"
          class="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          onclick={goNext}
        >
          Siguiente →
        </button>
      {:else}
        <button
          type="button"
          class="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
          onclick={onClose}
        >
          ¡Listo!
        </button>
      {/if}
    </div>
  </div>
</section>
