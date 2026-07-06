export type ImageCategory =
  | "pollo_limon"
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
  | "marisco"
  | "pizza"
  | "hamburguesa"
  | "patatas"
  | "queso"
  | "fruta"
  | "desayuno"
  | "bebida"
  | "default";

/** Palabras clave → imagen local. Orden: más específicas primero. */
const RULES: { keywords: string[]; image: string }[] = [
  {
    keywords: [
      "pollo al limon",
      "pollo al limón",
      "lemon chicken",
      "chicken lemon",
      "pollo con limon",
      "pollo con limón",
    ],
    image: "/images/pollo_limon.jpg",
  },
  {
    keywords: [
      "brownie",
      "chocolate",
      "postre",
      "tarta",
      "bizcocho",
      "galleta",
      "tiramisu",
      "tiramisú",
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
      "poché",
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
      "ramen",
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
      "lentejas",
    ],
    image: "/images/legumbres.jpg",
  },
  {
    keywords: ["ensalada", "bowl", "verde", "salad"],
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
      "trucha",
    ],
    image: "/images/pescado.jpg",
  },
  {
    keywords: [
      "gamba",
      "gambas",
      "camarón",
      "camaron",
      "langostino",
      "mejillón",
      "mejillon",
      "pulpo",
      "calamar",
      "marisco",
    ],
    image: "/images/marisco.jpg",
  },
  {
    keywords: ["pollo", "muslo", "pechuga", "pavo", "pato", "ave"],
    image: "/images/pollo.jpg",
  },
  {
    keywords: [
      "ternera",
      "cerdo",
      "carne",
      "solomillo",
      "chuleta",
      "cordero",
      "bistec",
      "entrecot",
    ],
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
      "tallarines",
    ],
    image: "/images/pasta.jpg",
  },
  {
    keywords: ["arroz", "risotto", "paella", "wok", "salteado", "pilaf"],
    image: "/images/arroz.jpg",
  },
  {
    keywords: ["pizza", "focaccia", "calzone"],
    image: "/images/pizza.jpg",
  },
  {
    keywords: ["hamburguesa", "burger"],
    image: "/images/hamburguesa.jpg",
  },
  {
    keywords: [
      "patata",
      "patatas",
      "papas",
      "patatas fritas",
      "papas fritas",
      "boniato",
    ],
    image: "/images/patatas.jpg",
  },
  {
    keywords: [
      "queso",
      "quesos",
      "cheese",
      "fondue",
      "mozzarella",
      "parmesano",
    ],
    image: "/images/queso.jpg",
  },
  {
    keywords: [
      "fruta",
      "frutas",
      "manzana",
      "plátano",
      "platano",
      "fresa",
      "naranja",
      "limón",
      "limon",
    ],
    image: "/images/fruta.jpg",
  },
  {
    keywords: [
      "desayuno",
      "tostada",
      "avena",
      "pancake",
      "pancakes",
      "waffle",
      "crepe",
    ],
    image: "/images/desayuno.jpg",
  },
  {
    keywords: [
      "bebida",
      "zumo",
      "jugo",
      "smoothie",
      "batido",
      "té",
      "te",
      "café",
      "cafe",
      "cóctel",
      "coctel",
    ],
    image: "/images/bebida.jpg",
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
];

const ALL_IMAGES = [
  "/images/pollo_limon.jpg",
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
  "/images/marisco.jpg",
  "/images/pizza.jpg",
  "/images/hamburguesa.jpg",
  "/images/patatas.jpg",
  "/images/queso.jpg",
  "/images/fruta.jpg",
  "/images/desayuno.jpg",
  "/images/bebida.jpg",
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
