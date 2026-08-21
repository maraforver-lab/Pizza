import type { RecipeIngredients, RecipeSettings } from "@/lib/saved-recipes";
import {
  calculateCanonicalYeastRequirement,
  canonicalYeastTypeFromRecipeYeastType,
  type CanonicalFermentationProcess,
} from "@/lib/yeast-fermentation-model";

const fermentationMinutes = { "6h-room": 360, "12h-room": 720, "24h-room": 1440, "24h-cold": 1440, "48h-cold": 2880 } as const;

function fermentationProcessFromPreset(fermentation: RecipeSettings["fermentation"]): CanonicalFermentationProcess {
  return fermentation.endsWith("cold") ? "cold" : "room";
}

function canonicalCommercialYeastPercent(settings: RecipeSettings) {
  const result = calculateCanonicalYeastRequirement({
    flourGrams: 100,
    hydrationPercent: settings.hydration,
    saltPercent: settings.salt,
    fermentationMinutes: fermentationMinutes[settings.fermentation],
    fermentationTemperatureC: settings.temperature,
    fermentationProcess: fermentationProcessFromPreset(settings.fermentation),
    yeastType: canonicalYeastTypeFromRecipeYeastType(settings.yeastType as "cy" | "idy" | "ady"),
  });

  return result.status === "ok" ? result.yeastPercentOfFlour : 0;
}

function legacySourdoughReferenceFreshYeastPercent(settings: RecipeSettings) {
  const hours = fermentationMinutes[settings.fermentation] / 60;
  const effectiveHours = hours * Math.pow(2, (settings.temperature - 22) / 10);
  return 0.14335 * (12 / Math.max(effectiveHours, 0.25));
}

export function calculateDoughIngredients(settings: RecipeSettings): RecipeIngredients {
  const total = settings.pizzas * settings.ballWeight * (1 + settings.waste / 100);
  const isSourdough = settings.yeastType === "ssd" || settings.yeastType === "lsd";

  if (isSourdough) {
    const totalFlour = total / (1 + settings.hydration / 100 + settings.salt / 100);
    const cyPercent = legacySourdoughReferenceFreshYeastPercent(settings);
    const referenceStarterPercent = settings.yeastType === "ssd" ? 11 : 8.39;
    const starterPercent = referenceStarterPercent * (cyPercent / 0.14335);
    const starterHydration = settings.yeastType === "ssd" ? 0.5 : 1;
    const leavener = totalFlour * starterPercent / 100;
    const starterFlour = leavener / (1 + starterHydration);
    const starterWater = leavener - starterFlour;
    return { total, flour: Math.max(0, totalFlour - starterFlour), water: Math.max(0, totalFlour * settings.hydration / 100 - starterWater), salt: totalFlour * settings.salt / 100, leavener };
  }

  const yeastPercent = canonicalCommercialYeastPercent(settings);
  const flour = total / (1 + settings.hydration / 100 + settings.salt / 100 + yeastPercent / 100);
  return { total, flour, water: flour * settings.hydration / 100, salt: flour * settings.salt / 100, leavener: flour * yeastPercent / 100 };
}
