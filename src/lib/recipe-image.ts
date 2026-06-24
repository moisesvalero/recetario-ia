const FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
  "https://images.unsplash.com/photo-1565958011703-44f982e81b98?w=800&q=80",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  "https://images.unsplash.com/photo-1598103442097-8b74394dd95f?w=800&q=80",
];

const KEYWORD_IMAGE: Record<string, string> = {
  pollo:
    "https://images.unsplash.com/photo-1598103442097-8b74394dd95f?w=800&q=80",
  arroz:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=80",
  pasta:
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
  ensalada:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  chocolate:
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
  tortilla:
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
  pescado:
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b779?w=800&q=80",
  postre:
    "https://images.unsplash.com/photo-1464307895906-6b8c016125da?w=800&q=80",
};

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1556911222-bff31c812dba?w=1600&q=80";

export function getRecipeImageUrl(
  title: string,
  ingredients: string[],
): string {
  const haystack = `${title} ${ingredients.join(" ")}`.toLowerCase();

  for (const [keyword, url] of Object.entries(KEYWORD_IMAGE)) {
    if (haystack.includes(keyword)) return url;
  }

  let hash = 0;
  for (const char of title)
    hash = (hash + char.charCodeAt(0)) % FOOD_IMAGES.length;
  return FOOD_IMAGES[hash] ?? FOOD_IMAGES[0];
}
