import { describe, expect, it } from "vitest";
import {
  menuEntrySchema,
  getWeekStart,
  addWeeks,
  formatWeekRange,
  getDayLabel,
  getSlotLabel,
} from "./menu-schema";

// ── getWeekStart ─────────────────────────────────────────

describe("getWeekStart", () => {
  it("lunes → el mismo día", () => {
    // 2026-07-06 es lunes
    const result = getWeekStart(new Date(2026, 6, 6));
    expect(result).toBe("2026-07-06");
  });

  it("martes → lunes anterior", () => {
    // 2026-07-07 es martes
    const result = getWeekStart(new Date(2026, 6, 7));
    expect(result).toBe("2026-07-06");
  });

  it("domingo → lunes anterior (6 días atrás)", () => {
    // 2026-07-12 es domingo
    const result = getWeekStart(new Date(2026, 6, 12));
    expect(result).toBe("2026-07-06");
  });

  it("borde de mes: lunes 31 ago → 31 ago", () => {
    // 2026-08-31 es lunes
    const result = getWeekStart(new Date(2026, 7, 31));
    expect(result).toBe("2026-08-31");
  });

  it("borde de mes: miércoles 2 sep → lunes 31 ago", () => {
    // 2026-09-02 es miércoles
    const result = getWeekStart(new Date(2026, 8, 2));
    expect(result).toBe("2026-08-31");
  });

  it("borde de año: enero temprano", () => {
    // 2026-01-01 es jueves → lunes 29 dic 2025
    const result = getWeekStart(new Date(2026, 0, 1));
    expect(result).toBe("2025-12-29");
  });
});

// ── addWeeks ─────────────────────────────────────────────

describe("addWeeks", () => {
  it("suma 1 semana", () => {
    expect(addWeeks("2026-07-06", 1)).toBe("2026-07-13");
  });

  it("resta 1 semana", () => {
    expect(addWeeks("2026-07-06", -1)).toBe("2026-06-29");
  });

  it("suma 0 semanas = mismo día", () => {
    expect(addWeeks("2026-07-06", 0)).toBe("2026-07-06");
  });

  it("cruza borde de año", () => {
    expect(addWeeks("2025-12-29", 1)).toBe("2026-01-05");
  });
});

// ── formatWeekRange ──────────────────────────────────────

describe("formatWeekRange", () => {
  it("formatea una semana completa", () => {
    const result = formatWeekRange("2026-07-06");
    expect(result).toBe("6 - 12 julio 2026");
  });

  it("formatea con día de 2 dígitos", () => {
    const result = formatWeekRange("2026-09-28");
    expect(result).toBe("28 septiembre - 4 octubre 2026");
  });

  it("usa mes en español minúscula", () => {
    const result = formatWeekRange("2026-02-02");
    expect(result).toContain("febrero");
  });

  it("cruza de año", () => {
    // 2025-12-29 es lunes, domingo es 2026-01-04
    const result = formatWeekRange("2025-12-29");
    expect(result).toBe("29 diciembre 2025 - 4 enero 2026");
  });
});

// ── getDayLabel ──────────────────────────────────────────

describe("getDayLabel", () => {
  it("devuelve etiqueta correcta para cada día", () => {
    expect(getDayLabel(0)).toBe("Lunes");
    expect(getDayLabel(1)).toBe("Martes");
    expect(getDayLabel(2)).toBe("Miércoles");
    expect(getDayLabel(3)).toBe("Jueves");
    expect(getDayLabel(4)).toBe("Viernes");
    expect(getDayLabel(5)).toBe("Sábado");
    expect(getDayLabel(6)).toBe("Domingo");
  });

  it("devuelve string vacío para día inválido", () => {
    expect(getDayLabel(-1)).toBe("");
    expect(getDayLabel(7)).toBe("");
  });
});

// ── getSlotLabel ─────────────────────────────────────────

describe("getSlotLabel", () => {
  it("devuelve etiqueta capitalizada", () => {
    expect(getSlotLabel("desayuno")).toBe("Desayuno");
    expect(getSlotLabel("comida")).toBe("Comida");
    expect(getSlotLabel("cena")).toBe("Cena");
  });
});

// ── menuEntrySchema ──────────────────────────────────────

describe("menuEntrySchema", () => {
  const validEntry = {
    id: "abc-123",
    weekStart: "2026-07-06",
    day: 0,
    slot: "comida",
    recipeId: "rec-456",
    recipeSnapshot: {
      title: "Tortilla",
      description: "Receta fácil",
      prepMinutes: 10,
      cookMinutes: 15,
      servings: 2,
      difficulty: "fácil",
      ingredients: [{ item: "huevos", amount: "4" }],
      steps: [{ text: "Batir", timerMinutes: 2 }],
      tips: ["Usa fuego medio"],
    },
    createdAt: "2026-07-09T12:00:00.000Z",
  };

  it("acepta entrada válida", () => {
    const result = menuEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("rechaza day < 0", () => {
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      day: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza day > 6", () => {
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      day: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rechaza slot inválido", () => {
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      slot: "merienda",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza slot con mayúscula", () => {
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      slot: "Comida",
    });
    expect(result.success).toBe(false);
  });

  it("acepta snapshot sin tips", () => {
    const { tips: _, ...snapshotSinTips } = validEntry.recipeSnapshot;
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      recipeSnapshot: snapshotSinTips,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza snapshot sin title", () => {
    const { title: __, ...sinTitle } = validEntry.recipeSnapshot;
    const result = menuEntrySchema.safeParse({
      ...validEntry,
      recipeSnapshot: sinTitle,
    });
    expect(result.success).toBe(false);
  });
});
