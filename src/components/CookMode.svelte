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
    if (currentStep < steps.length - 1) {
      currentStep += 1;
    }
  }

  function goPrev() {
    clearTimer();
    if (currentStep > 0) {
      currentStep -= 1;
    }
  }
</script>

<section
  class="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
>
  <div class="mb-6 flex items-center justify-between gap-3">
    <div>
      <p class="text-sm text-[var(--muted)]">Modo cocinar</p>
      <h2 class="text-xl font-semibold">
        Paso {currentStep + 1} de {steps.length}
      </h2>
    </div>
    <button
      type="button"
      class="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-stone-50"
      onclick={onClose}
    >
      Salir
    </button>
  </div>

  <div class="mb-6 h-2 overflow-hidden rounded-full bg-stone-100">
    <div
      class="h-full bg-[var(--accent)] transition-all"
      style={`width: ${progress}%`}
    ></div>
  </div>

  <p class="text-lg leading-relaxed">{step.text}</p>

  {#if step.timerMinutes}
    <div class="mt-6 rounded-xl bg-stone-50 p-4">
      <p class="text-sm text-[var(--muted)]">Temporizador</p>
      <p class="mt-1 text-3xl font-semibold tabular-nums">
        {formatTime(remainingSeconds || step.timerMinutes * 60)}
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
          onclick={() => startTimer(step.timerMinutes ?? 0)}
        >
          {timerRunning ? "Reiniciar" : "Iniciar"}
        </button>
        <button
          type="button"
          class="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
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
      class="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-40"
      disabled={currentStep === 0}
      onclick={goPrev}
    >
      Anterior
    </button>
    {#if currentStep < steps.length - 1}
      <button
        type="button"
        class="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        onclick={goNext}
      >
        Siguiente
      </button>
    {:else}
      <button
        type="button"
        class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        onclick={onClose}
      >
        Terminar
      </button>
    {/if}
  </div>
</section>
