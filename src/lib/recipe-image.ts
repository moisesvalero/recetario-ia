export type ImageCategory =
  | "pollo"
  | "arroz"
  | "pasta"
  | "ensalada"
  | "pescado"
  | "carne"
  | "huevo"
  | "postre"
  | "sopa"
  | "verduras"
  | "legumbres"
  | "default";

/** Palabras clave → imagen local. Orden: más específicas primero. */
const RULES: { keywords: string[]; image: string }[] = [
  {
    keywords: [
      "brownie",
      "chocolate",
      "postre",
      "tarta",
      "bizcocho",
      "galleta",
    ],
    image: "/images/postre.jpg",
  },
  {
    keywords: [
      "tortilla",
      "huevos",
      "huevo",
      "revuelto",
      "omelette",
      "frittata",
    ],
    image: "/images/huevo.jpg",
  },
  {
    keywords: [
      "crema",
      "sopa",
      "calabacín",
      "calabacin",
      "puré",
      "pure",
      "gazpacho",
      "caldo",
    ],
    image: "/images/sopa.jpg",
  },
  {
    keywords: [
      "garbanzo",
      "lenteja",
      "alubia",
      "judía",
      "judia",
      "habas",
      "legumbre",
    ],
    image: "/images/legumbres.jpg",
  },
  {
    keywords: ["ensalada", "bowl", "verde"],
    image: "/images/ensalada.jpg",
  },
  {
    keywords: [
      "salmón",
      "salmon",
      "atún",
      "atun",
      "pescado",
      "bacalao",
      "merluza",
      "gambas",
      "marisco",
    ],
    image: "/images/pescado.jpg",
  },
  {
    keywords: ["pollo", "muslo", "pechuga", "pavo", "pato", "ave"],
    image: "/images/pollo.jpg",
  },
  {
    keywords: ["ternera", "cerdo", "carne", "solomillo", "chuleta", "cordero"],
    image: "/images/carne.jpg",
  },
  {
    keywords: [
      "espagueti",
      "espaguetis",
      "macarrones",
      "fideos",
      "lasaña",
      "lasana",
      "pasta",
      "ravioli",
      "ñoqui",
    ],
    image: "/images/pasta.jpg",
  },
  {
    keywords: ["arroz", "risotto", "paella", "wok", "salteado", "pilaf"],
    image: "/images/arroz.jpg",
  },
  {
    keywords: [
      "verdura",
      "verduras",
      "brócoli",
      "brocoli",
      "espinaca",
      "zanahoria",
      "pimiento",
      "berenjena",
      "calabaza",
      "champiñón",
      "seta",
    ],
    image: "/images/verduras.jpg",
  },
  {
    keywords: ["patata", "patatas", "boniato"],
    image: "/images/huevo.jpg",
  },
];

const ALL_IMAGES = [
  "/images/pollo.jpg",
  "/images/arroz.jpg",
  "/images/pasta.jpg",
  "/images/ensalada.jpg",
  "/images/pescado.jpg",
  "/images/carne.jpg",
  "/images/huevo.jpg",
  "/images/postre.jpg",
  "/images/sopa.jpg",
  "/images/verduras.jpg",
  "/images/legumbres.jpg",
  "/images/default.jpg",
];

export const HERO_IMAGE = "/images/hero.jpg";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function getRecipeImageUrl(
  title: string,
  ingredients: string[],
): string {
  const haystack = normalize(`${title} ${ingredients.join(" ")}`);

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (haystack.includes(normalize(keyword))) {
        return rule.image;
      }
    }
  }

  let hash = 0;
  for (const char of title)
    hash = (hash + char.charCodeAt(0)) % ALL_IMAGES.length;
  return ALL_IMAGES[hash] ?? "/images/default.jpg";
}
