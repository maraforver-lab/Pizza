import type { RecipeIngredients, RecipeSettings } from "@/lib/saved-recipes";

const fermentationHours = { "6h-room": 6, "12h-room": 12, "24h-room": 24, "24h-cold": 24, "48h-cold": 48 } as const;

export function calculateDoughIngredients(settings: RecipeSettings): RecipeIngredients {
  const total = settings.pizzas * settings.ballWeight * (1 + settings.waste / 100);
  const effectiveHours = fermentationHours[settings.fermentation] * Math.pow(2, (settings.temperature - 22) / 10);
  const cyPercent = 0.14335 * (12 / Math.max(effectiveHours, 0.25));
  const isSourdough = settings.yeastType === "ssd" || settings.yeastType === "lsd";

  if (isSourdough) {
    const totalFlour = total / (1 + settings.hydration / 100 + settings.salt / 100);
    const referenceStarterPercent = settings.yeastType === "ssd" ? 11 : 8.39;
    const starterPercent = referenceStarterPercent * (cyPercent / 0.14335);
    const starterHydration = settings.yeastType === "ssd" ? 0.5 : 1;
    const leavener = totalFlour * starterPercent / 100;
    const starterFlour = leavener / (1 + starterHydration);
    const starterWater = leavener - starterFlour;
    return { total, flour: Math.max(0, totalFlour - starterFlour), water: Math.max(0, totalFlour * settings.hydration / 100 - starterWater), salt: totalFlour * settings.salt / 100, leavener };
  }

  const factors = { cy: 1, ady: 0.52, idy: 0.414, ssd: 0, lsd: 0 } as const;
  const yeastPercent = cyPercent * factors[settings.yeastType];
  const flour = total / (1 + settings.hydration / 100 + settings.salt / 100 + yeastPercent / 100);
  return { total, flour, water: flour * settings.hydration / 100, salt: flour * settings.salt / 100, leavener: flour * yeastPercent / 100 };
}
