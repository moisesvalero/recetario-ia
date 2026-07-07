<script lang="ts">
  import { onMount } from "svelte";

  let visible = $state(false);
  let isIOS = $state(false);
  let isAndroid = $state(false);
  let deferredPrompt = $state<any>(null);
  let showInstructions = $state(false);

  onMount(() => {
    if (typeof window === "undefined") return;

    // 1. Comprobar si ya está instalada o en ejecución standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Comprobar si el usuario la descartó recientemente
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      // Expirar descarte a los 7 días
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // 3. Detectar plataforma
    const ua = navigator.userAgent.toLowerCase();
    isIOS = /iphone|ipad|ipod/.test(ua);
    isAndroid = /android/.test(ua);

    // Solo mostrar el banner en dispositivos móviles o tablets
    if (!isIOS && !isAndroid) return;

    // 4. Capturar el evento de instalación nativa para Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      visible = true;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Para iOS, no existe 'beforeinstallprompt', mostramos el banner tras unos segundos
    if (isIOS) {
      setTimeout(() => {
        visible = true;
      }, 3000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  });

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        visible = false;
      }
      deferredPrompt = null;
    } else if (isIOS) {
      showInstructions = !showInstructions;
    }
  }

  function dismissBanner() {
    if (typeof window !== "undefined") {
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
      visible = false;
    }
  }
</script>

{#if visible}
  <div
    class="fixed bottom-6 left-6 right-6 md:left-6 md:right-auto md:max-w-sm z-40 bg-[var(--surface-muted)] text-[var(--text)] p-5 rounded-2xl shadow-lg border border-dashed border-[var(--border)] animate-toast-in select-none"
  >
    <!-- Botón cerrar -->
    <button
      type="button"
      onclick={dismissBanner}
      class="absolute top-3 right-3 text-[var(--muted)] hover:text-[var(--text)] transition cursor-pointer font-bold text-xs"
      aria-label="Cerrar sugerencia"
    >
      ×
    </button>

    <div class="flex items-start gap-3.5 pr-4">
      <span class="text-3xl shrink-0">📱</span>
      <div>
        <p
          class="text-xs font-mono font-bold tracking-wider text-[var(--accent)] uppercase"
        >
          APLICACIÓN MÓVIL
        </p>
        <p class="text-sm font-bold font-display leading-tight mt-0.5">
          Instala Umami en tu pantalla
        </p>
        <p
          class="text-[11px] text-[var(--muted)] leading-relaxed mt-1 font-medium"
        >
          Accede instantáneamente y úsala a pantalla completa como una app
          nativa, con mejor velocidad y rendimiento.
        </p>
      </div>
    </div>

    <!-- Acciones -->
    <div class="mt-4 flex flex-col gap-2.5">
      <button
        type="button"
        onclick={handleInstallClick}
        class="w-full rounded-xl bg-[var(--text)] hover:opacity-90 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span class="material-symbols-outlined text-base">install_mobile</span>
        {#if isIOS}
          ¿Cómo instalar en iPhone/iPad?
        {:else}
          Instalar App Gratis
        {/if}
      </button>

      {#if showInstructions && isIOS}
        <div
          class="bg-white/80 p-3.5 rounded-xl border border-[var(--border)] text-[10.5px] leading-relaxed text-[var(--muted)] font-mono space-y-2 animate-fade-in-up"
        >
          <p class="font-bold text-[var(--text)]">
            Sigue estos pasos en Safari:
          </p>
          <div class="flex items-start gap-2">
            <span
              class="bg-[var(--accent-soft)] px-1.5 py-0.5 rounded font-black"
              >1</span
            >
            <p>
              Pulsa el botón de <strong>Compartir</strong>
              <span class="text-xs">⎋</span> (el cuadro con la flecha arriba) en la
              barra inferior.
            </p>
          </div>
          <div class="flex items-start gap-2">
            <span
              class="bg-[var(--accent-soft)] px-1.5 py-0.5 rounded font-black"
              >2</span
            >
            <p>
              Haz scroll hacia abajo en la lista y selecciona <strong
                >"Añadir a la pantalla de inicio"</strong
              > <span class="text-xs">⊞</span>.
            </p>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
