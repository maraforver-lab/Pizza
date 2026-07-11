import type { RecipeIngredients } from "@/lib/saved-recipes";

export type QuickPrefermentMethod = "direct" | "poolish" | "biga" | "levain";

export type QuickPrefermentPreset = {
  id: QuickPrefermentMethod;
  label: string;
  description: string;
  defaultPrefermentedFlourPercent: number;
  defaultHydrationPercent: number;
  defaultInoculationPercent: number;
};

export type QuickPrefermentInput = {
  method: QuickPrefermentMethod;
  prefermentedFlourPercent: number;
  prefermentHydrationPercent: number;
  prefermentInoculationPercent: number;
};

export type QuickPrefermentBuild = {
  flourGrams: number;
  waterGrams: number;
  commercialYeastGrams: number;
  starterGrams: number;
  totalGrams: number;
};

export type QuickFinalDoughAdditions = {
  flourGrams: number;
  waterGrams: number;
  saltGrams: number;
  commercialYeastGrams: number;
};

export type QuickPrefermentResult = {
  method: QuickPrefermentMethod;
  label: string;
  prefermentedFlourPercent: number;
  prefermentHydrationPercent: number;
  prefermentInoculationPercent: number;
  build: QuickPrefermentBuild;
  finalDough: QuickFinalDoughAdditions;
  totalFormula: {
    flourGrams: number;
    waterGrams: number;
    saltGrams: number;
    leavenerGrams: number;
    doughGrams: number;
  };
};

export const quickPrefermentPresets: QuickPrefermentPreset[] = [
  {
    id: "direct",
    label: "Direct dough",
    description: "No preferment. Add all flour, water, salt and leavening directly to the final dough.",
    defaultPrefermentedFlourPercent: 0,
    defaultHydrationPercent: 0,
    defaultInoculationPercent: 0,
  },
  {
    id: "poolish",
    label: "Poolish",
    description: "A loose 100% hydration preferment using part of the flour and water.",
    defaultPrefermentedFlourPercent: 30,
    defaultHydrationPercent: 100,
    defaultInoculationPercent: 0,
  },
  {
    id: "biga",
    label: "Biga",
    description: "A firmer preferment with lower hydration and a larger flour share.",
    defaultPrefermentedFlourPercent: 40,
    defaultHydrationPercent: 50,
    defaultInoculationPercent: 0,
  },
  {
    id: "levain",
    label: "Sourdough / levain",
    description: "A levain build using part of the flour and water as the active starter build.",
    defaultPrefermentedFlourPercent: 25,
    defaultHydrationPercent: 100,
    defaultInoculationPercent: 20,
  },
];

const clamp = (value: number, min: number, max: number) => (
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
);

export function quickPrefermentPresetById(method: QuickPrefermentMethod | undefined) {
  return quickPrefermentPresets.find((preset) => preset.id === method) ?? quickPrefermentPresets[0];
}

export function normalizeQuickPrefermentInput(input: QuickPrefermentInput): QuickPrefermentInput {
  const preset = quickPrefermentPresetById(input.method);

  return {
    method: preset.id,
    prefermentedFlourPercent: preset.id === "direct" ? 0 : clamp(input.prefermentedFlourPercent, 5, 80),
    prefermentHydrationPercent: preset.id === "direct" ? 0 : clamp(input.prefermentHydrationPercent, 40, 125),
    prefermentInoculationPercent: preset.id === "levain" ? clamp(input.prefermentInoculationPercent, 1, 60) : 0,
  };
}

export function applyQuickPrefermentPreset(input: QuickPrefermentInput, method: QuickPrefermentMethod): QuickPrefermentInput {
  const preset = quickPrefermentPresetById(method);
  return normalizeQuickPrefermentInput({
    ...input,
    method: preset.id,
    prefermentedFlourPercent: preset.defaultPrefermentedFlourPercent,
    prefermentHydrationPercent: preset.defaultHydrationPercent,
    prefermentInoculationPercent: preset.defaultInoculationPercent,
  });
}

export function calculateQuickPreferment(
  ingredients: RecipeIngredients,
  input: QuickPrefermentInput,
): QuickPrefermentResult {
  const normalized = normalizeQuickPrefermentInput(input);
  const preset = quickPrefermentPresetById(normalized.method);

  if (normalized.method === "direct") {
    return {
      method: "direct",
      label: preset.label,
      prefermentedFlourPercent: 0,
      prefermentHydrationPercent: 0,
      prefermentInoculationPercent: 0,
      build: {
        flourGrams: 0,
        waterGrams: 0,
        commercialYeastGrams: 0,
        starterGrams: 0,
        totalGrams: 0,
      },
      finalDough: {
        flourGrams: ingredients.flour,
        waterGrams: ingredients.water,
        saltGrams: ingredients.salt,
        commercialYeastGrams: ingredients.leavener,
      },
      totalFormula: {
        flourGrams: ingredients.flour,
        waterGrams: ingredients.water,
        saltGrams: ingredients.salt,
        leavenerGrams: ingredients.leavener,
        doughGrams: ingredients.total,
      },
    };
  }

  const prefermentFlour = Math.min(ingredients.flour, ingredients.flour * normalized.prefermentedFlourPercent / 100);
  const prefermentWater = Math.min(ingredients.water, prefermentFlour * normalized.prefermentHydrationPercent / 100);
  const commercialYeast = normalized.method === "poolish" || normalized.method === "biga" ? ingredients.leavener : 0;
  const starter = normalized.method === "levain" ? prefermentFlour + prefermentWater : 0;

  return {
    method: normalized.method,
    label: preset.label,
    prefermentedFlourPercent: normalized.prefermentedFlourPercent,
    prefermentHydrationPercent: normalized.prefermentHydrationPercent,
    prefermentInoculationPercent: normalized.prefermentInoculationPercent,
    build: {
      flourGrams: prefermentFlour,
      waterGrams: prefermentWater,
      commercialYeastGrams: commercialYeast,
      starterGrams: starter,
      totalGrams: prefermentFlour + prefermentWater + commercialYeast,
    },
    finalDough: {
      flourGrams: Math.max(0, ingredients.flour - prefermentFlour),
      waterGrams: Math.max(0, ingredients.water - prefermentWater),
      saltGrams: ingredients.salt,
      commercialYeastGrams: normalized.method === "levain" ? 0 : 0,
    },
    totalFormula: {
      flourGrams: ingredients.flour,
      waterGrams: ingredients.water,
      saltGrams: ingredients.salt,
      leavenerGrams: ingredients.leavener,
      doughGrams: ingredients.total,
    },
  };
}
