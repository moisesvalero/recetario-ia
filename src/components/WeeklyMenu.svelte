<script lang="ts">
  import {
    addToMenu,
    getWeekMenu,
    moveEntry,
    removeFromMenu,
    clearWeek,
  } from "../lib/menu-storage";
  import type {
    MenuDay,
    MenuEntry,
    MenuSlot,
    RecipeSnapshot,
  } from "../lib/menu-schema";
  import { addWeeks, formatWeekRange, getWeekStart } from "../lib/menu-schema";
  import MenuRecipePicker from "./MenuRecipePicker.svelte";

  let {
    weekStart,
    onWeekChange,
    onOpenRecipe,
  }: {
    weekStart: string;
    onWeekChange: (next: string) => void;
    onOpenRecipe: (recipe: RecipeSnapshot) => void;
  } = $props();

  let entries = $state<MenuEntry[]>([]);
  let loading = $state(true);
  let picker = $state<{ day: MenuDay; slot: MenuSlot } | null>(null);
  let statusMessage = $state("");
  let statusType = $state<"success" | "error">("success");
  let confirmClear = $state(false);
  let confirmTimeout: ReturnType<typeof setTimeout> | null = null;

  const today = getWeekStart();
  const isCurrentWeek = $derived(weekStart === today);

  // Carga entradas cada vez que cambia la semana
  $effect(() => {
    let cancelled = false;
    const target = weekStart;
    loading = true;
    getWeekMenu(target).then((result) => {
      if (cancelled) return;
      entries = result;
      loading = false;
    });
    return () => {
      cancelled = true;
    };
  });

  // Mapa rápido (day,slot) -> entry
  const entriesByCell = $derived.by(() => {
    const map = new Map<string, MenuEntry>();
    for (const e of entries) {
      map.set(`${e.day}:${e.slot}`, e);
    }
    return map;
  });

  const dayHeaders = $derived.by(() => {
    const out: {
      label: string;
      day: number;
      date: number;
      isToday: boolean;
    }[] = [];
    const start = new Date(weekStart + "T12:00:00");
    const todayDate = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      out.push({
        label: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i],
        day: i,
        date: d.getDate(),
        isToday:
          d.getFullYear() === todayDate.getFullYear() &&
          d.getMonth() === todayDate.getMonth() &&
          d.getDate() === todayDate.getDate(),
      });
    }
    return out;
  });

  const slotRows: { slot: MenuSlot; label: string; icon: string }[] = [
    { slot: "desayuno", label: "Desayuno", icon: "free_breakfast" },
    { slot: "comida", label: "Comida", icon: "restaurant" },
    { slot: "cena", label: "Cena", icon: "dinner_dining" },
  ];

  function showStatus(msg: string, type: "success" | "error" = "success") {
    statusMessage = msg;
    statusType = type;
    setTimeout(() => {
      statusMessage = "";
    }, 3000);
  }

  function handlePrevWeek() {
    onWeekChange(addWeeks(weekStart, -1));
  }

  function handleNextWeek() {
    onWeekChange(addWeeks(weekStart, 1));
  }

  function handleToday() {
    onWeekChange(getWeekStart());
  }

  function openPicker(day: MenuDay, slot: MenuSlot) {
    picker = { day, slot };
  }

  function closePicker() {
    picker = null;
  }

  async function handlePick(recipe: {
    id: string;
    title: string;
    description: string;
    prepMinutes: number;
    cookMinutes: number;
    servings: number;
    difficulty: "fácil" | "media" | "difícil";
    ingredients: { item: string; amount: string }[];
    steps: { text: string; timerMinutes?: number }[];
    tips?: string[];
  }) {
    if (!picker) return;
    const target = picker;
    // Reemplaza si ya hay una entrada en esa celda
    const existing = entriesByCell.get(`${target.day}:${target.slot}`);
    if (existing) {
      await removeFromMenu(existing.id);
    }
    try {
      const newEntry = await addToMenu({
        weekStart,
        day: target.day,
        slot: target.slot,
        recipeId: recipe.id,
        recipeSnapshot: {
          title: recipe.title,
          description: recipe.description,
          prepMinutes: recipe.prepMinutes,
          cookMinutes: recipe.cookMinutes,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tips: recipe.tips,
        },
      });

      // Actualizar estado local reactivo
      if (existing) {
        entries = entries.filter((e) => e.id !== existing.id);
      }
      entries = [...entries, newEntry];

      const dayLabel = dayHeaders[target.day]?.label ?? "";
      const slotLabel =
        slotRows.find((s) => s.slot === target.slot)?.label ?? "";
      showStatus(`Añadido a ${dayLabel} ${slotLabel}`, "success");
      closePicker();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al añadir";
      showStatus(msg, "error");
    }
  }

  async function handleRemove(entry: MenuEntry, e: Event) {
    e.stopPropagation();
    try {
      await removeFromMenu(entry.id);
      // Actualizar estado local reactivo
      entries = entries.filter((item) => item.id !== entry.id);
      showStatus("Receta quitada del menú", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al quitar";
      showStatus(msg, "error");
    }
  }

  async function handleMove(entry: MenuEntry, e: Event) {
    e.stopPropagation();
    closePicker();
    openPicker(entry.day, entry.slot);
  }

  function handleClearClick() {
    if (!confirmClear) {
      confirmClear = true;
      if (confirmTimeout) clearTimeout(confirmTimeout);
      confirmTimeout = setTimeout(() => {
        confirmClear = false;
      }, 3000);
      return;
    }
    confirmClear = false;
    if (confirmTimeout) clearTimeout(confirmTimeout);
    void doClearWeek();
  }

  async function doClearWeek() {
    try {
      await clearWeek(weekStart);
      // Actualizar estado local reactivo
      entries = [];
      showStatus("Semana limpiada", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al limpiar";
      showStatus(msg, "error");
    }
  }

  const hasEntries = $derived(entries.length > 0);
</script>

<section class="w-full" aria-label="Menú semanal">
  <!-- Header -->
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border)] pb-5"
  >
    <div>
      <h2
        class="font-handwritten text-3xl font-black text-[var(--text)] leading-tight"
      >
        Menú semanal
      </h2>
      <p class="font-mono text-xs text-[var(--muted)] mt-1 tracking-wide">
        Planifica desayuno, comida y cena de la semana
      </p>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onclick={handlePrevWeek}
        aria-label="Semana anterior"
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
      >
        <span class="material-symbols-outlined text-lg">chevron_left</span>
      </button>

      <div
        class="px-4 py-2 rounded-xl border border-dashed border-[var(--border)] bg-white font-mono text-xs font-bold text-[var(--text)] min-w-[200px] text-center"
      >
        {formatWeekRange(weekStart)}
      </div>

      <button
        type="button"
        onclick={handleNextWeek}
        aria-label="Semana siguiente"
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
      >
        <span class="material-symbols-outlined text-lg">chevron_right</span>
      </button>

      {#if !isCurrentWeek}
        <button
          type="button"
          onclick={handleToday}
          class="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs font-mono font-bold text-[var(--text)] shadow-sm hover:bg-[var(--accent-soft)]/20 active:scale-95 transition-all cursor-pointer"
        >
          Hoy
        </button>
      {/if}

      {#if hasEntries}
        <button
          type="button"
          onclick={handleClearClick}
          class="rounded-xl border border-dashed border-red-200 px-3 py-2 text-xs font-mono font-bold {confirmClear
            ? 'bg-red-50 text-red-600'
            : 'text-[var(--muted)] hover:text-red-500'} transition-all cursor-pointer"
        >
          {confirmClear ? "¿Confirmar?" : "Limpiar semana"}
        </button>
      {/if}
    </div>
  </header>

  <!-- Grid -->
  <div
    class="mt-6 overflow-x-auto -mx-4 px-4 pb-2"
    role="grid"
    aria-label="Cuadrícula de menú semanal"
  >
    <div
      class="grid min-w-[820px] gap-2"
      style="grid-template-columns: 110px repeat(7, minmax(0, 1fr));"
    >
      <!-- Esquina vacía encima de las filas de slots -->
      <div></div>

      {#each dayHeaders as header}
        <div
          class="flex flex-col items-center justify-center py-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]"
        >
          <span
            class="font-mono text-[0.625rem] font-bold tracking-wider text-[var(--muted)] uppercase"
          >
            {header.label}
          </span>
          <span
            class="font-handwritten text-lg font-black {header.isToday
              ? 'text-[var(--accent)]'
              : 'text-[var(--text)]'}"
          >
            {header.date}
          </span>
        </div>
      {/each}

      {#each slotRows as row}
        <!-- Etiqueta del slot -->
        <div
          class="flex flex-col items-center justify-center py-3 px-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]"
        >
          <span class="material-symbols-outlined text-xl text-[var(--accent)]">
            {row.icon}
          </span>
          <span
            class="font-mono text-[0.625rem] font-bold tracking-wider text-[var(--text)] uppercase mt-1"
          >
            {row.label}
          </span>
        </div>

        {#each dayHeaders as header}
          {@const entry = entriesByCell.get(`${header.day}:${row.slot}`)}
          <div
            class="relative min-h-[88px] rounded-xl border {entry
              ? 'border-[var(--border)] bg-white shadow-sm'
              : 'border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/15'} transition-all group"
            role="gridcell"
            aria-rowindex={row.slot === "desayuno"
              ? 2
              : row.slot === "comida"
                ? 3
                : 4}
            aria-colindex={header.day + 2}
          >
            {#if entry}
              <button
                type="button"
                onclick={() => onOpenRecipe(entry.recipeSnapshot)}
                class="flex w-full h-full flex-col items-start text-left p-2.5 pr-7 cursor-pointer rounded-xl"
                aria-label="Receta: {entry.recipeSnapshot.title}. {entry
                  .recipeSnapshot.prepMinutes +
                  entry.recipeSnapshot
                    .cookMinutes} minutos. Pulsa Enter para abrir."
              >
                <span
                  class="font-handwritten text-sm font-bold text-[var(--text)] leading-tight line-clamp-2"
                >
                  {entry.recipeSnapshot.title}
                </span>
                <span
                  class="mt-1 font-mono text-[0.625rem] font-bold text-[var(--muted)] flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-xs">schedule</span
                  >
                  {entry.recipeSnapshot.prepMinutes +
                    entry.recipeSnapshot.cookMinutes} min
                </span>
              </button>

              <button
                type="button"
                onclick={(e) => handleRemove(entry, e)}
                class="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-red-500 transition-all opacity-60 group-hover:opacity-100 cursor-pointer"
                aria-label="Quitar {entry.recipeSnapshot.title} del menú"
              >
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            {:else}
              <button
                type="button"
                onclick={() => openPicker(header.day, row.slot)}
                class="flex w-full h-full flex-col items-center justify-center gap-1 text-[var(--muted)] hover:text-[var(--accent)] transition-all cursor-pointer rounded-xl p-2"
                aria-label="Añadir receta a {header.label} {row.label}"
              >
                <span class="material-symbols-outlined text-2xl">add</span>
                <span
                  class="font-mono text-[0.5625rem] font-bold tracking-wider uppercase"
                >
                  Añadir
                </span>
              </button>
            {/if}
          </div>
        {/each}
      {/each}
    </div>
  </div>

  <!-- Estado vacío general -->
  {#if !loading && !hasEntries}
    <div
      class="mt-8 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-8 text-center"
    >
      <span
        class="material-symbols-outlined text-5xl text-[var(--muted)] block mb-2"
        >calendar_month</span
      >
      <p class="font-handwritten text-base font-bold text-[var(--text)]">
        Esta semana está vacía
      </p>
      <p class="font-mono text-xs text-[var(--muted)] mt-1">
        Pulsa cualquier celda para empezar a planificar tu semana
      </p>
    </div>
  {/if}

  <!-- Toast -->
  {#if statusMessage}
    <div
      class="fixed bottom-6 right-6 z-50 rounded bg-[var(--text)] p-4 text-xs font-bold text-white shadow-lg flex items-center gap-2 animate-fade-in-up"
      role="status"
      aria-live="polite"
    >
      {#if statusType === "success"}
        <span class="material-symbols-outlined text-base">check_circle</span>
      {:else}
        <span class="material-symbols-outlined text-base">error</span>
      {/if}
      {statusMessage}
    </div>
  {/if}
</section>

<!-- Modal picker -->
{#if picker}
  <MenuRecipePicker
    open={true}
    dayLabel={dayHeaders[picker.day]?.label ?? ""}
    dayDate={dayHeaders[picker.day]?.date ?? 0}
    slotLabel={slotRows.find((s) => s.slot === picker!.slot)?.label ?? ""}
    existingRecipeIds={new Set(entries.map((e) => e.recipeId))}
    onClose={closePicker}
    onSelect={handlePick}
  />
{/if}
