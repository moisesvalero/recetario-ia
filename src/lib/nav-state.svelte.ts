class NavState {
  activeTab = $state<
    | "generar"
    | "mis-recetas"
    | "favoritos"
    | "historial"
    | "lista-compras"
    | "ajustes"
    | "inicio"
    | "menu-semanal"
  >("generar");

  mobileMenuOpen = $state(false);

  constructor() {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let tab = params.get("tab");
      if (tab === "mis-recetas") {
        tab = "favoritos";
      }
      if (tab) {
        // Validar que sea un tab válido
        const validTabs = [
          "generar",
          "mis-recetas",
          "favoritos",
          "historial",
          "lista-compras",
          "ajustes",
          "inicio",
          "menu-semanal",
        ];
        if (validTabs.includes(tab)) {
          this.activeTab = tab as any;
        }
      }
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  setTab(
    tab:
      | "generar"
      | "mis-recetas"
      | "favoritos"
      | "historial"
      | "lista-compras"
      | "ajustes"
      | "inicio"
      | "menu-semanal",
  ) {
    const targetTab = tab === "mis-recetas" ? "favoritos" : tab;
    this.activeTab = targetTab;
    this.closeMobileMenu();
    // Si estamos en otra página de Astro y queremos ir a la raíz
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/?tab=" + targetTab;
    }
  }
}

export const navState = new NavState();
