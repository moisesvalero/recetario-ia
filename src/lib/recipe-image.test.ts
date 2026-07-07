import { describe, expect, it } from "vitest";
import { getRecipeImageUrl } from "./recipe-image";

describe("getRecipeImageUrl", () => {
  it("mapea recetas estáticas del catálogo", () => {
    expect(
      getRecipeImageUrl("Tortilla de patatas", ["patatas", "huevos"]),
    ).toBe("/images/huevo.jpg");
    expect(getRecipeImageUrl("Brownies de chocolate", ["chocolate"])).toBe(
      "/images/postre.jpg",
    );
    expect(getRecipeImageUrl("Crema de calabacín", ["calabacín"])).toBe(
      "/images/sopa.jpg",
    );
    expect(getRecipeImageUrl("Ensalada de garbanzos", ["garbanzos"])).toBe(
      "/images/legumbres.jpg",
    );
    expect(getRecipeImageUrl("Pollo al horno", ["pollo"])).toBe(
      "/images/pollo.jpg",
    );
    expect(getRecipeImageUrl("Pasta al limón", ["espaguetis"])).toBe(
      "/images/pasta.jpg",
    );
    expect(getRecipeImageUrl("Arroz salteado", ["arroz", "verduras"])).toBe(
      "/images/arroz.jpg",
    );
    expect(
      getRecipeImageUrl("Arroz con Pollo Express, Tomate y Huevo Frito", [
        "arroz",
        "pollo",
        "huevo",
        "tomate",
      ]),
    ).toBe("/images/arroz.jpg");
  });

  it("usa fallback variado si no hay match", () => {
    const a = getRecipeImageUrl("Misterio xyz", ["ingrediente raro"]);
    expect(a.startsWith("/images/")).toBe(true);
  });
});
