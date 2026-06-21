import type { RecipeSettings } from "@/lib/saved-recipes";

export type PizzaStyleId = "neapolitan" | "contemporary" | "new-york" | "roman-thin" | "detroit" | "sicilian";

export type PizzaStyleProfile = {
  id: PizzaStyleId;
  image: string;
  settings: RecipeSettings;
  diameter: string;
  bake: string;
};

const base = { waste: 3, salt: 2.8, yeastType: "idy" as const, temperature: 4 };

export const pizzaStyles: PizzaStyleProfile[] = [
  { id: "neapolitan", image: "/pizza-styles/neapolitan.webp", diameter: "30–32 cm", bake: "430–450 °C · 60–90 s", settings: { ...base, pizzas: 6, ballWeight: 260, hydration: 64, fermentation: "12h-room", temperature: 22, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria" } },
  { id: "contemporary", image: "/pizza-styles/contemporary.webp", diameter: "30–32 cm", bake: "420–440 °C · 75–110 s", settings: { ...base, pizzas: 6, ballWeight: 260, hydration: 70, fermentation: "48h-cold", goal: "airy", ovenType: "gas", flourId: "caputo-nuvola-super" } },
  { id: "new-york", image: "/pizza-styles/new-york.webp", diameter: "35–40 cm", bake: "260–300 °C · 5–8 min", settings: { ...base, pizzas: 6, ballWeight: 320, hydration: 65, salt: 2.5, fermentation: "48h-cold", goal: "balanced", ovenType: "home", flourId: "caputo-cuoco" } },
  { id: "roman-thin", image: "/pizza-styles/roman-thin.webp", diameter: "30–32 cm", bake: "280–320 °C · 4–7 min", settings: { ...base, pizzas: 6, ballWeight: 220, hydration: 58, salt: 2.5, fermentation: "24h-cold", goal: "crispy", ovenType: "home", flourId: "caputo-pizzeria" } },
  { id: "detroit", image: "/pizza-styles/detroit.webp", diameter: "25 × 35 cm", bake: "230–260 °C · 12–16 min", settings: { ...base, pizzas: 1, ballWeight: 650, hydration: 75, salt: 2.5, fermentation: "48h-cold", goal: "pan", ovenType: "home", flourId: "caputo-nuvola-super" } },
  { id: "sicilian", image: "/pizza-styles/sicilian.webp", diameter: "30 × 40 cm", bake: "230–260 °C · 14–18 min", settings: { ...base, pizzas: 1, ballWeight: 750, hydration: 70, salt: 2.5, fermentation: "24h-room", temperature: 22, goal: "pan", ovenType: "home", flourId: "caputo-cuoco" } },
];
