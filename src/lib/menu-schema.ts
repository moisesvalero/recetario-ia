import { z } from "zod";
import { recipeSchema } from "./recipe-schema";

export const menuSlotSchema = z.enum(["desayuno", "comida", "cena"]);
export const menuDaySchema = z.number().int().min(0).max(6);

export const recipeSnapshotSchema = recipeSchema;

export const menuEntrySchema = z.object({
  id: z.string(),
  weekStart: z.string(),
  day: menuDaySchema,
  slot: menuSlotSchema,
  recipeId: z.string(),
  recipeSnapshot: recipeSnapshotSchema,
  createdAt: z.string(),
});

export type MenuSlot = z.infer<typeof menuSlotSchema>;
export type MenuDay = z.infer<typeof menuDaySchema>;
export type RecipeSnapshot = z.infer<typeof recipeSnapshotSchema>;

export interface MenuEntryInput {
  weekStart: string;
  day: MenuDay;
  slot: MenuSlot;
  recipeId: string;
  recipeSnapshot: RecipeSnapshot;
}

export interface MenuEntry extends MenuEntryInput {
  id: string;
  createdAt: string;
}

export const MENU_SLOTS: MenuSlot[] = ["desayuno", "comida", "cena"];
export const MENU_DAYS: MenuDay[] = [0, 1, 2, 3, 4, 5, 6];

const MENU_DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const MENU_SLOT_LABELS: Record<MenuSlot, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
};

export function getWeekStart(date?: Date): string {
  const ref = date ?? new Date();
  const day = ref.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(ref);
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return toISODate(monday);
}

export function addWeeks(weekStart: string, weeks: number): string {
  const date = parseISODate(weekStart);
  date.setDate(date.getDate() + weeks * 7);
  return toISODate(date);
}

export function formatWeekRange(weekStart: string): string {
  const start = parseISODate(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleDateString("es-ES", { month: "long" });
  const endMonth = end.toLocaleDateString("es-ES", { month: "long" });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
  }
  if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

export function getDayLabel(day: number): string {
  return MENU_DAY_LABELS[day] ?? "";
}

export function getSlotLabel(slot: string): string {
  if (slot === "desayuno" || slot === "comida" || slot === "cena") {
    return MENU_SLOT_LABELS[slot];
  }
  return "";
}

export function formatTotalMinutes(
  prepMinutes: number,
  cookMinutes: number,
): string {
  const total = prepMinutes + cookMinutes;
  if (total <= 0) return "0 min";
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
