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

<aside
  class="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex min-h-screen justify-between"
>
  <!-- Header / Logo -->
  <div>
    <div class="flex items-center gap-3 px-6 py-6 border-b border-slate-50">
      <!-- Chef Hat Logo -->
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500 border border-orange-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-6 w-6"
        >
          <path d="M6 18V13c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4v5" />
          <path
            d="M3 18h18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Z"
          />
          <path d="M12 9V5a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4" />
          <path d="M12 9V5a3 3 0 0 1 3-3 3 3 0 0 1 3 3v4" />
        </svg>
      </div>
      <div>
        <p class="font-bold text-slate-800 leading-tight tracking-tight">
          Umami
        </p>
        <p
          class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
        >
          Tu chef inteligente
        </p>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex flex-col gap-1.5 p-4">
      <button
        type="button"
        onclick={() => navState.setTab("inicio")}
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'inicio'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Inicio
      </button>

      <button
        type="button"
        onclick={() => navState.setTab("generar")}
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'generar'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
        >
          <path
            d="m12 3-1.912 5.886a1 1 0 0 1-.95.69H2.93a1 1 0 0 0-.588 1.814l5.022 3.616a1 1 0 0 1 .364 1.118L5.816 22a1 1 0 0 0 1.54 1.118l5.022-3.616a1 1 0 0 1 1.244 0l5.022 3.616a1 1 0 0 0 1.54-1.118l-1.912-5.886a1 1 0 0 1 .364-1.118l5.022-3.616a1 1 0 0 0-.588-1.814h-6.206a1 1 0 0 1-.95-.69Z"
          />
        </svg>
        Generar receta
      </button>

      <button
        type="button"
        onclick={() => {
          if (authState.currentUser) navState.setTab("mis-recetas");
          else authState.openLogin();
        }}
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'mis-recetas'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
        >
          <path
            d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"
          />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
        Mis recetas
      </button>

      <button
        type="button"
        onclick={() => {
          if (authState.currentUser) navState.setTab("favoritos");
          else authState.openLogin();
        }}
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'favoritos'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
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
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'historial'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
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
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'lista-compras'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
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
        class="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all {navState.activeTab ===
        'ajustes'
          ? 'bg-orange-50 text-orange-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="h-5 w-5"
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
  <div class="p-4 flex flex-col gap-4">
    <!-- Registration Benefits Banner (Show if not logged in) -->
    {#if !authState.currentUser}
      <div
        class="rounded-2xl bg-gradient-to-br from-orange-50 via-orange-50/55 to-amber-50/50 p-4 border border-orange-100 flex flex-col gap-2.5"
      >
        <div>
          <p
            class="text-xs font-bold text-orange-800 flex items-center gap-1.5"
          >
            ✨ Ventajas gratis
          </p>
          <p class="mt-1 text-[11px] text-slate-500 leading-normal">
            Regístrate para guardar tus recetas y descargarlas en PDF de forma
            100% gratuita.
          </p>
        </div>
        <button
          type="button"
          onclick={handleRegisterBannerClick}
          class="w-full rounded-xl bg-orange-500 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/10 hover:bg-orange-600 transition"
        >
          Crear cuenta gratis
        </button>
      </div>
    {:else}
      <div
        class="rounded-2xl bg-orange-50/20 p-4 border border-orange-100/50 flex flex-col gap-1.5"
      >
        <p class="text-xs font-bold text-orange-700 flex items-center gap-1.5">
          🎉 ¡Sesión Activa!
        </p>
        <p class="text-[11px] text-slate-500 leading-normal">
          Ya puedes guardar tus recetas y descargarlas en PDF desde la ficha de
          cada receta.
        </p>
      </div>
    {/if}

    <!-- User Profile Widget -->
    <button
      type="button"
      onclick={handleProfileClick}
      class="flex w-full items-center gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/50 p-3 text-left hover:bg-orange-50/30 hover:border-orange-200/50 transition-all"
    >
      <span
        class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl border border-orange-200/40"
      >
        {authState.currentUser ? authState.currentUser.avatarUrl : "👨‍🍳"}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold text-slate-700 truncate">
          {authState.currentUser ? authState.currentUser.name : "Invitado"}
        </p>
        <p class="text-[10px] text-slate-400 truncate">
          {authState.currentUser ? "Cuenta gratuita" : "Inicia sesión →"}
        </p>
      </div>
      <svg
        class="h-4 w-4 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</aside>
