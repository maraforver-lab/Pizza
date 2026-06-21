import type { RecipeSettings } from "@/lib/saved-recipes";

const fermentations = ["6h-room", "12h-room", "24h-room", "24h-cold", "48h-cold"] as const;
const yeastTypes = ["cy", "ady", "idy", "ssd", "lsd"] as const;
const goals = ["balanced", "airy", "crispy", "pan"] as const;
const ovens = ["home", "gas"] as const;

const numberValue = (params: URLSearchParams, key: string, min: number, max: number) => {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= min && value <= max ? value : undefined;
};

const optionValue = <T extends string>(params: URLSearchParams, key: string, options: readonly T[]) => {
  const value = params.get(key);
  return value && options.includes(value as T) ? value as T : undefined;
};

export function recipeParams(settings: RecipeSettings) {
  return new URLSearchParams({
    balls: String(settings.pizzas),
    ballWeight: String(settings.ballWeight),
    waste: String(settings.waste),
    hydration: String(settings.hydration),
    salt: String(settings.salt),
    yeastType: settings.yeastType,
    fermentation: settings.fermentation,
    temperature: String(settings.temperature),
    style: settings.goal,
    oven: settings.ovenType,
  });
}

export function recipeUrl(settings: RecipeSettings) {
  const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const base = localHost && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : window.location.origin;
  const url = new URL(base);
  url.pathname = "/";
  url.search = recipeParams(settings).toString();
  url.hash = "";
  return url.toString();
}

export function settingsFromUrl(search: string): Partial<RecipeSettings> {
  const params = new URLSearchParams(search);
  return {
    pizzas: numberValue(params, "balls", 1, 50),
    ballWeight: numberValue(params, "ballWeight", 100, 1000),
    waste: numberValue(params, "waste", 0, 25),
    hydration: numberValue(params, "hydration", 40, 100),
    salt: numberValue(params, "salt", 0, 10),
    temperature: numberValue(params, "temperature", 0, 30),
    yeastType: optionValue(params, "yeastType", yeastTypes),
    fermentation: optionValue(params, "fermentation", fermentations),
    goal: optionValue(params, "style", goals),
    ovenType: optionValue(params, "oven", ovens),
  };
}
