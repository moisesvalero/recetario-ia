const FOOD_IMAGES = [
  "/images/default.jpg",
  "/images/pasta.jpg",
  "/images/ensalada.jpg",
  "/images/arroz.jpg",
  "/images/pollo.jpg",
];

const KEYWORD_IMAGE: Record<string, string> = {
  pollo: "/images/pollo.jpg",
  arroz: "/images/arroz.jpg",
  pasta: "/images/pasta.jpg",
  ensalada: "/images/ensalada.jpg",
  chocolate: "/images/default.jpg",
  tortilla: "/images/default.jpg",
  pescado: "/images/default.jpg",
  postre: "/images/default.jpg",
};

export const HERO_IMAGE = "/images/hero.jpg";

export function getRecipeImageUrl(
  title: string,
  ingredients: string[],
): string {
  const haystack = (title + " " + ingredients.join(" ")).toLowerCase();

  for (const [keyword, url] of Object.entries(KEYWORD_IMAGE)) {
    if (haystack.includes(keyword)) return url;
  }

  let hash = 0;
  for (const char of title)
    hash = (hash + char.charCodeAt(0)) % FOOD_IMAGES.length;
  return FOOD_IMAGES[hash] ?? FOOD_IMAGES[0];
}
