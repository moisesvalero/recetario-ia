class NavState {
  activeTab = $state<
    | "generar"
    | "mis-recetas"
    | "favoritos"
    | "historial"
    | "lista-compras"
    | "ajustes"
    | "inicio"
  >("generar");

  setTab(
    tab:
      | "generar"
      | "mis-recetas"
      | "favoritos"
      | "historial"
      | "lista-compras"
      | "ajustes"
      | "inicio",
  ) {
    this.activeTab = tab;
    // Si estamos en otra página de Astro y queremos ir a la raíz
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.href = "/?tab=" + tab;
    }
  }
}

export const navState = new NavState();
