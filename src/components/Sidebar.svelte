<script lang="ts">
  import { authState } from "../lib/auth-state.svelte";
  import { navState } from "../lib/nav-state.svelte";

  function handleProfileClick() {
    if (authState.currentUser) {
      authState.openProfile();
    } else {
      authState.openLogin();
    }
  }

  function handleRegisterBannerClick() {
    authState.openRegister();
  }
</script>

<!-- Backdrop para móvil (hace click fuera para cerrar) -->
{#if navState.mobileMenuOpen}
  <button
    type="button"
    onclick={() => navState.closeMobileMenu()}
    class="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden border-none outline-none w-full h-full cursor-default"
    aria-label="Cerrar menú"
  ></button>
{/if}

<aside
  class="
    fixed lg:static inset-y-0 left-0 z-50
    w-64 shrink-0 flex flex-col border-r border-dashed border-[var(--border)] bg-[var(--surface-muted)]
    h-dvh lg:min-h-dvh justify-between py-6 transition-transform duration-300 ease-in-out
    overflow-y-auto
    {navState.mobileMenuOpen
    ? 'translate-x-0'
    : '-translate-x-full lg:translate-x-0'}
  "
>
  <!-- Header / Logo -->
  <div>
    <a
      href="/"
      onclick={(e) => {
        e.preventDefault();
        navState.setTab("generar");
        navState.closeMobileMenu();
      }}
      class="flex items-center gap-3 px-6 pb-6 mb-4 border-b border-dashed border-[var(--border)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
    >
      <span class="text-3xl">🍳</span>
      <div>
        <p
          class="font-display font-extrabold text-xl text-[var(--text)] leading-none tracking-tight"
        >
          Umami
        </p>
        <p
          class="text-[0.625rem] font-handwritten text-[var(--muted)] mt-1 uppercase tracking-wider"
        >
          Chef inteligente
        </p>
      </div>
    </a>

    <!-- Navigation Menu -->
    <nav class="flex flex-col gap-2">
      <button
        type="button"
        onclick={() => navState.setTab("inicio")}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'inicio'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Mi Diario
      </button>

      <button
        type="button"
        onclick={() => navState.setTab("generar")}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'generar'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <path
            d="m12 3-1.912 5.886a1 1 0 0 1-.95.69H2.93a1 1 0 0 0-.588 1.814l5.022 3.616a1 1 0 0 1 .364 1.118L5.816 22a1 1 0 0 0 1.54 1.118l5.022-3.616a1 1 0 0 1 1.244 0l5.022 3.616a1 1 0 0 0 1.54-1.118l-1.912-5.886a1 1 0 0 1 .364-1.118l5.022-3.616a1 1 0 0 0-.588-1.814h-6.206a1 1 0 0 1-.95-.69Z"
          />
        </svg>
        Generar receta
      </button>

      <button
        type="button"
        onclick={() => navState.setTab("menu-semanal")}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'menu-semanal'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        Menú semanal
      </button>

      <button
        type="button"
        onclick={() => {
          if (authState.currentUser) navState.setTab("favoritos");
          else authState.openLogin();
        }}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'favoritos'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          />
        </svg>
        Favoritos
      </button>

      <button
        type="button"
        onclick={() => navState.setTab("historial")}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'historial'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        Historial
      </button>

      <button
        type="button"
        onclick={() => {
          if (authState.currentUser) navState.setTab("lista-compras");
          else authState.openLogin();
        }}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'lista-compras'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <path
            d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"
          />
          <path d="M18 8h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4V8Z" />
          <path d="M10 8V5" />
          <path d="M10 16v-3" />
          <path d="m14 8 2-3" />
          <path d="m14 16 2 3" />
        </svg>
        Lista de compras
      </button>

      <button
        type="button"
        onclick={handleProfileClick}
        class="flex w-[calc(100%-16px)] items-center gap-3 rounded-r-2xl pl-6 pr-4 py-3 text-sm font-semibold transition-all select-none {navState.activeTab ===
        'ajustes'
          ? 'bg-[var(--accent-soft)] text-[var(--text)] font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] border-y border-r border-[var(--border)]'
          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)]/20 hover:text-[var(--text)]'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-4 w-4"
        >
          <path
            d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Ajustes
      </button>
    </nav>
  </div>

  <!-- Banner & User Profile Footer -->
  <div class="px-4 flex flex-col gap-4">
    <!-- Registration Benefits Banner (Show if not logged in) -->
    {#if !authState.currentUser}
      <div
        class="rounded bg-[var(--accent-soft)] p-4 border border-dashed border-[var(--text)]/20 shadow-sm flex flex-col gap-2.5"
      >
        <div>
          <p
            class="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 font-display"
          >
            ✨ Ventajas gratis
          </p>
          <p
            class="mt-1 text-[0.6875rem] text-[var(--muted)] leading-normal font-medium"
          >
            Regístrate para guardar tus recetas y descargarlas en PDF de forma
            100% gratuita.
          </p>
        </div>
        <button
          type="button"
          onclick={handleRegisterBannerClick}
          class="w-full rounded bg-[var(--text)] py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition active:scale-95"
        >
          Crear cuenta gratis
        </button>
      </div>
    {:else}
      <div
        class="rounded bg-[var(--accent-soft)]/30 p-4 border border-dashed border-[var(--text)]/10 flex flex-col gap-1.5"
      >
        <p
          class="text-xs font-bold text-[var(--text)] flex items-center gap-1.5 font-display"
        >
          🎉 ¡Sesión Activa!
        </p>
        <p
          class="text-[0.6875rem] text-[var(--muted)] leading-normal font-medium"
        >
          Ya puedes guardar tus recetas y descargarlas en PDF desde la ficha de
          cada receta.
        </p>
      </div>
    {/if}

    <!-- User Profile Widget -->
    <button
      type="button"
      onclick={handleProfileClick}
      class="flex w-full items-center gap-3 rounded border border-[var(--border)] bg-white p-3 text-left shadow-sm hover:bg-[var(--accent-soft)]/20 transition-all active:scale-[0.98]"
    >
      <span
        class="flex h-10 w-10 items-center justify-center rounded bg-[var(--accent-soft)] text-xl border border-[var(--border)]"
      >
        {authState.currentUser ? authState.currentUser.avatarUrl : "👨‍🍳"}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold text-[var(--text)] truncate font-display">
          {authState.currentUser ? authState.currentUser.name : "Invitado"}
        </p>
        <p class="text-[0.625rem] text-[var(--muted)] truncate font-medium">
          {authState.currentUser ? "Cuenta gratuita" : "Inicia sesión →"}
        </p>
      </div>
      <svg
        class="h-4 w-4 text-[var(--muted)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Enlaces Legales discretos -->
    <div
      class="flex flex-col items-center gap-2 mt-2 text-[0.625rem] font-mono font-bold text-[var(--muted)]/60 pb-1"
    >
      <div class="flex items-center gap-3">
        <a
          href="/privacidad"
          onclick={() => navState.closeMobileMenu()}
          class="hover:text-[var(--text)] transition-colors">Privacidad</a
        >
        <span>·</span>
        <a
          href="/terminos"
          onclick={() => navState.closeMobileMenu()}
          class="hover:text-[var(--text)] transition-colors">Términos</a
        >
        <span>·</span>
        <a
          href="/cookies"
          onclick={() => navState.closeMobileMenu()}
          class="hover:text-[var(--text)] transition-colors">Cookies</a
        >
      </div>
      <div class="text-[0.5625rem] text-[var(--muted)]/50 mt-0.5">
        Desarrollado por <a
          href="https://github.com/moisesvalero"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-[var(--accent)] underline transition-colors"
          >Moisés Valero</a
        >
      </div>
    </div>
  </div>
</aside>
