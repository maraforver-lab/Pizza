import type { ExperienceLevel } from "@/lib/experience-levels";
import { recipeParams } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";

export type StartHerePathId = "home-oven" | "pizza-oven" | "pan-tray";

export type StartHerePath = {
  id: StartHerePathId;
  title: string;
  shortTitle: string;
  marker: string;
  description: string;
  bestFor: string;
  whyItWorks: string;
  dontWorryAboutYet: string;
  beginnerGuidance: string;
  steps: readonly string[];
  primaryCta: string;
  secondaryCta: string;
  relatedTools: readonly { label: string; href: string; description: string }[];
  levelNotes: Record<ExperienceLevel, readonly string[]>;
  settings: RecipeSettings;
};

const baseSettings = {
  waste: 3,
  salt: 2.8,
  yeastType: "idy",
} as const;

export const startHerePaths = [
  {
    id: "home-oven",
    title: "Home oven pizza",
    shortTitle: "Home oven",
    marker: "🏠",
    description:
      "A simple path for a regular kitchen oven, especially with a baking steel, stone, or sturdy tray.",
    bestFor: "Your first reliable pizza at home.",
    whyItWorks:
      "It keeps the dough easier to handle and focuses on timing, preheating, and not overloading the pizza.",
    dontWorryAboutYet:
      "Do not worry about perfect Neapolitan results, advanced flour specs, or very high hydration.",
    beginnerGuidance:
      "Start with a manageable dough, preheat well, use moderate toppings, and focus on repeatability.",
    steps: [
      "Choose the home oven path.",
      "Calculate a simple dough.",
      "Plan when to mix, rest, shape and bake.",
      "Preheat your oven properly.",
      "Keep toppings light.",
      "Bake, then note one thing to improve.",
    ],
    primaryCta: "Calculate home oven dough",
    secondaryCta: "Plan this home bake",
    relatedTools: [
      { label: "Dough Doctor", href: "/doctor", description: "Use if the dough tears, sticks or bakes pale." },
      { label: "Oven Guide", href: "/ovens", description: "Understand heat, stone, steel and preheating tradeoffs." },
    ],
    levelNotes: {
      beginner: [
        "Use the suggested numbers first. The goal is a calm first bake, not a perfect pizzeria copy.",
        "If something feels hard to stretch, rest the dough before forcing it.",
      ],
      enthusiast: [
        "This path uses moderate hydration so handling stays predictable in a longer electric-oven bake.",
        "Topping load matters more in a home oven because the pizza spends more time releasing moisture.",
      ],
      pizza_nerd: [
        "The preset favors repeatability over maximal openness: moderate hydration, controlled ball weight and a cold-ferment schedule.",
        "Heat transfer is the main constraint. Steel or stone temperature and topping water activity will dominate the final base texture.",
      ],
    },
    settings: {
      ...baseSettings,
      pizzas: 4,
      ballWeight: 270,
      hydration: 64,
      fermentation: "24h-cold",
      temperature: 4,
      goal: "balanced",
      ovenType: "home",
      flourId: "caputo-pizzeria",
      pizzaStyleId: "new-york",
    },
  },
  {
    id: "pizza-oven",
    title: "Pizza oven pizza",
    shortTitle: "Pizza oven",
    marker: "🔥",
    description:
      "A path for high-heat outdoor pizza ovens such as Ooni, Gozney, Roccbox-style ovens, or similar.",
    bestFor: "Fast, hot bakes when you already have or plan to use a pizza oven.",
    whyItWorks:
      "It focuses on heat control, launch confidence, light toppings, and fast bake timing.",
    dontWorryAboutYet:
      "Do not chase perfect leopard spotting or extreme hydration on the first try.",
    beginnerGuidance:
      "Use a forgiving dough, avoid overloaded toppings, and focus on launching and turning the pizza calmly.",
    steps: [
      "Choose the pizza oven path.",
      "Calculate dough for high heat.",
      "Plan fermentation and dough ball timing.",
      "Heat the oven and check the floor.",
      "Launch with light toppings.",
      "Turn, finish, and learn from the bake.",
    ],
    primaryCta: "Calculate pizza oven dough",
    secondaryCta: "Plan this pizza oven bake",
    relatedTools: [
      { label: "Dough Doctor", href: "/doctor", description: "Use if dough sticks, tears or overproofs before launch." },
      { label: "Baking Timer", href: "/timer", description: "Use a focused timer for fast high-heat bakes." },
    ],
    levelNotes: {
      beginner: [
        "Keep the toppings light and practice the launch calmly. The oven moves fast, so simple is safer.",
        "Turn the pizza before one side gets too dark.",
      ],
      enthusiast: [
        "High heat shortens bake time, so dough strength, fermentation readiness and topping moisture become more visible.",
        "Floor temperature matters: a hot dome with a cool stone can still make a pale or soft base.",
      ],
      pizza_nerd: [
        "This preset avoids very high hydration because launch risk rises faster than rim benefit for a first high-heat bake.",
        "Repeatability comes from tracking stone recovery, flame position, turning cadence and dough-ball temperature.",
      ],
    },
    settings: {
      ...baseSettings,
      pizzas: 6,
      ballWeight: 260,
      hydration: 64,
      fermentation: "12h-room",
      temperature: 22,
      goal: "balanced",
      ovenType: "gas",
      flourId: "caputo-pizzeria",
      pizzaStyleId: "neapolitan",
    },
  },
  {
    id: "pan-tray",
    title: "Pan / tray pizza",
    shortTitle: "Pan / tray",
    marker: "▭",
    description: "A forgiving path for pizza baked in a pan or tray.",
    bestFor: "An easier first success when shaping and launching pizza feels stressful.",
    whyItWorks:
      "The pan supports the dough, so you can focus on fermentation, topping balance, and baking instead of perfect hand-stretching.",
    dontWorryAboutYet:
      "Do not worry about launching with a peel, round shaping, or matching pizzeria-style crust on the first try.",
    beginnerGuidance:
      "Use the pan as support, give the dough time, oil the pan properly, and avoid too much wet topping.",
    steps: [
      "Choose the pan / tray path.",
      "Calculate dough for a pan or tray bake.",
      "Plan enough rest time.",
      "Oil the pan and let the dough relax.",
      "Top carefully.",
      "Bake until the base and edges are done.",
    ],
    primaryCta: "Calculate pan dough",
    secondaryCta: "Plan this pan bake",
    relatedTools: [
      { label: "Dough Doctor", href: "/doctor", description: "Use if the dough feels dense, sticky or overproofed." },
      { label: "Toppings Calculator", href: "/toppings", description: "Keep sauce, cheese and wet toppings under control." },
    ],
    levelNotes: {
      beginner: [
        "This is the least stressful path because the pan supports the dough.",
        "Let the dough relax before spreading it all the way to the edges.",
      ],
      enthusiast: [
        "Pan pizza can handle higher hydration because the pan supports the dough during proofing and baking.",
        "Oil, rest time and topping moisture have a strong effect on the base and edge texture.",
      ],
      pizza_nerd: [
        "This preset favors high hydration and stronger flour because the pan reduces launch risk while supporting gas retention.",
        "Base texture depends on pan material, oil level, dough thickness, topping water load and oven heat saturation.",
      ],
    },
    settings: {
      ...baseSettings,
      pizzas: 1,
      ballWeight: 650,
      hydration: 75,
      fermentation: "48h-cold",
      temperature: 4,
      goal: "pan",
      ovenType: "home",
      flourId: "caputo-nuvola-super",
      pizzaStyleId: "detroit",
    },
  },
] as const satisfies readonly StartHerePath[];

export function startHerePathById(id: unknown): StartHerePath {
  return startHerePaths.find((path) => path.id === id) ?? startHerePaths[0];
}

export function startHerePathQuery(path: StartHerePath): string {
  return recipeParams(path.settings).toString();
}

export function startHerePathHref(path: StartHerePath, route: "/" | "/plan" | "/doctor" | "/timer" | "/toppings" = "/"): string {
  return `${route}?${startHerePathQuery(path)}`;
}
