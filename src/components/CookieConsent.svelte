<script lang="ts">
  import { onMount } from "svelte";

  let visible = $state(false);

  onMount(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookie-consent");
      if (!consent) {
        // Retrasar la visualización del banner un segundo para una experiencia más limpia
        setTimeout(() => {
          visible = true;
        }, 1000);
      }
    }
  });

  function acceptCookies() {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie-consent", "accepted");
      visible = false;
    }
  }
</script>

{#if visible}
  <div
    class="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 bg-[var(--text)] text-white p-5 rounded-2xl shadow-lg border border-white/10 flex flex-col gap-3.5 animate-toast-in select-none"
  >
    <div class="flex items-start gap-3">
      <span class="text-2xl mt-0.5 shrink-0">🍪</span>
      <div>
        <p class="text-xs font-bold font-display tracking-wide">
          CONSENTIMIENTO DE COOKIES
        </p>
        <p
          class="text-[0.6875rem] text-slate-300 leading-relaxed mt-1 font-medium"
        >
          Utilizamos cookies esenciales y almacenamiento local para recordar tus
          preferencias de cocina, ingredientes comunes e inicio de sesión.
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-end gap-4 border-t border-white/10 pt-3"
    >
      <a
        href="/cookies"
        class="text-[0.625rem] font-bold font-mono text-slate-400 hover:text-white transition-colors"
      >
        MÁS INFORMACIÓN
      </a>
      <button
        type="button"
        onclick={acceptCookies}
        class="rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer"
      >
        Aceptar
      </button>
    </div>
  </div>
{/if}
