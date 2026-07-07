<script lang="ts">
  import { navState } from "../lib/nav-state.svelte";
  import { authState } from "../lib/auth-state.svelte";

  let dropdownOpen = $state(false);

  function toggleDropdown(e: MouseEvent) {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
  }

  function closeDropdown() {
    dropdownOpen = false;
  }

  function handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (dropdownOpen && !target.closest(".dropdown-container")) {
      closeDropdown();
    }
  }

  // Escuchar clics fuera para cerrar el menú dropdown
  $effect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("click", handleOutsideClick);
      return () => {
        window.removeEventListener("click", handleOutsideClick);
      };
    }
  });

  function handleTabClick(tab: any) {
    navState.setTab(tab);
    closeDropdown();
  }
</script>

<header
  class="flex items-center justify-between border-b border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3 lg:hidden z-30 relative select-none"
>
  <!-- Hamburguesa (Izquierda) -->
  <button
    type="button"
    onclick={() => navState.toggleMobileMenu()}
    class="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text)] shadow-xs active:scale-95 transition-all cursor-pointer"
    aria-label="Abrir menú de navegación"
  >
    <span class="material-symbols-outlined text-2xl">
      {navState.mobileMenuOpen ? "close" : "menu"}
    </span>
  </button>

  <!-- Logo (Centro) -->
  <a
    href="/"
    onclick={() => navState.setTab("generar")}
    class="font-handwritten text-3xl font-black text-[var(--text)] hover:opacity-90 active:scale-98 transition-all"
  >
    Umami
  </a>

  <!-- Menú Web Dropdown (Derecha) -->
  <div class="relative dropdown-container">
    <button
      type="button"
      onclick={toggleDropdown}
      class="flex h-10 px-3 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white text-xs font-bold font-mono text-[var(--text)] shadow-xs active:scale-95 transition-all cursor-pointer"
      aria-label="Menú de opciones"
      aria-expanded={dropdownOpen}
    >
      <span>MENÚ</span>
      <span class="material-symbols-outlined text-sm leading-none">
        {dropdownOpen ? "keyboard_arrow_up" : "keyboard_arrow_down"}
      </span>
    </button>

    {#if dropdownOpen}
      <div
        class="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--border)] bg-white p-2 shadow-md z-40 animate-fade-in-up"
      >
        <div class="flex flex-col gap-1">
          <button
            type="button"
            onclick={() => handleTabClick("generar")}
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold font-mono rounded-lg hover:bg-[var(--accent-soft)]/30 text-[var(--text)] transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">auto_awesome</span
            >
            Generar Receta
          </button>

          <a
            href="/recetas"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold font-mono rounded-lg hover:bg-[var(--accent-soft)]/30 text-[var(--text)] transition-colors"
          >
            <span class="material-symbols-outlined text-base">menu_book</span>
            Recetas de Ejemplo
          </a>

          <div class="border-t border-dashed border-[var(--border)] my-1"></div>

          <a
            href="/privacidad"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold font-mono rounded-lg hover:bg-[var(--accent-soft)]/30 text-[var(--muted)] transition-colors"
          >
            <span class="material-symbols-outlined text-base">security</span>
            Privacidad
          </a>

          <a
            href="/terminos"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold font-mono rounded-lg hover:bg-[var(--accent-soft)]/30 text-[var(--muted)] transition-colors"
          >
            <span class="material-symbols-outlined text-base">gavel</span>
            Términos de Uso
          </a>

          <a
            href="/cookies"
            class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-bold font-mono rounded-lg hover:bg-[var(--accent-soft)]/30 text-[var(--muted)] transition-colors"
          >
            <span class="material-symbols-outlined text-base">cookie</span>
            Cookies
          </a>
        </div>
      </div>
    {/if}
  </div>
</header>
