import type {
  FermentationMode,
  FlourCategory,
  FlourSelection,
  OvenType,
  PlanningFlourId,
} from "@/lib/planning-types";

export type PlanningFlourSourceConfidence = "official" | "trusted_secondary" | "inferred";

export type PlanningFlourProfile = {
  flourId: PlanningFlourId;
  displayName: string;
  category: FlourCategory;
  wMin: number | null;
  wMax: number | null;
  proteinPercent: number | null;
  bestTimeMinHours: number;
  bestTimeMaxHours: number;
  suitableFermentationModes: FermentationMode[];
  suitableOvenTypes: OvenType[];
  beginnerSafe: boolean;
  sourceConfidence: PlanningFlourSourceConfidence;
  notes: string[];
  warnings: string[];
};

export const planningFlourProfiles: PlanningFlourProfile[] = [
  {
    flourId: "unknown_basic_flour",
    displayName: "Unknown basic flour",
    category: "unknown",
    wMin: null,
    wMax: null,
    proteinPercent: null,
    bestTimeMinHours: 3,
    bestTimeMaxHours: 12,
    suitableFermentationModes: ["room"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: true,
    sourceConfidence: "inferred",
    notes: ["Conservative fallback when flour strength is unknown."],
    warnings: ["Avoid very long fermentation unless flour strength is known."],
  },
  {
    flourId: "standard_pizza_flour",
    displayName: "Standard pizza flour",
    category: "standard",
    wMin: null,
    wMax: null,
    proteinPercent: null,
    bestTimeMinHours: 3,
    bestTimeMaxHours: 12,
    suitableFermentationModes: ["room"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: true,
    sourceConfidence: "inferred",
    notes: ["Suitable for shorter and same-day doughs."],
    warnings: ["Not recommended for 48–72 hour fermentation."],
  },
  {
    flourId: "medium_strong_pizza_flour",
    displayName: "Medium-strong pizza flour",
    category: "medium_strong",
    wMin: null,
    wMax: null,
    proteinPercent: null,
    bestTimeMinHours: 6,
    bestTimeMaxHours: 24,
    suitableFermentationModes: ["room", "hybrid"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: true,
    sourceConfidence: "inferred",
    notes: ["Good fit for 6–24 hour doughs and cautious 24 hour planning."],
    warnings: ["Use stronger flour for very long cold fermentation."],
  },
  {
    flourId: "strong_pizza_flour",
    displayName: "Strong pizza flour",
    category: "strong",
    wMin: null,
    wMax: null,
    proteinPercent: null,
    bestTimeMinHours: 24,
    bestTimeMaxHours: 72,
    suitableFermentationModes: ["cold", "hybrid"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: true,
    sourceConfidence: "inferred",
    notes: ["Suitable for longer hybrid or cold fermentation."],
    warnings: ["May be more flour strength than needed for very fast doughs."],
  },
  {
    flourId: "caputo_pizzeria",
    displayName: "Caputo Pizzeria",
    category: "medium_strong",
    wMin: 260,
    wMax: 280,
    proteinPercent: 12.5,
    bestTimeMinHours: 8,
    bestTimeMaxHours: 24,
    suitableFermentationModes: ["room", "hybrid"],
    suitableOvenTypes: ["pizza_oven", "home_oven"],
    beginnerSafe: true,
    sourceConfidence: "official",
    notes: ["Classic Neapolitan-style flour for shorter to medium fermentation."],
    warnings: ["Use a stronger flour for very long cold fermentation."],
  },
  {
    flourId: "caputo_nuvola",
    displayName: "Caputo Nuvola",
    category: "strong",
    wMin: 270,
    wMax: 290,
    proteinPercent: 12.5,
    bestTimeMinHours: 12,
    bestTimeMaxHours: 48,
    suitableFermentationModes: ["hybrid", "cold"],
    suitableOvenTypes: ["pizza_oven", "home_oven"],
    beginnerSafe: true,
    sourceConfidence: "official",
    notes: ["Useful for airier contemporary-style doughs and longer hybrid fermentation."],
    warnings: ["May be unnecessary for very fast doughs."],
  },
  {
    flourId: "caputo_saccorosso",
    displayName: "Caputo Saccorosso / Cuoco",
    category: "strong",
    wMin: 300,
    wMax: 320,
    proteinPercent: 13,
    bestTimeMinHours: 24,
    bestTimeMaxHours: 72,
    suitableFermentationModes: ["cold", "hybrid"],
    suitableOvenTypes: ["pizza_oven", "home_oven"],
    beginnerSafe: false,
    sourceConfidence: "official",
    notes: ["Strong flour for longer fermentation and higher tolerance."],
    warnings: ["Can be more strength than needed for short same-day doughs."],
  },
  {
    flourId: "pirkka_w260",
    displayName: "Pirkka W260",
    category: "medium_strong",
    wMin: 260,
    wMax: 260,
    proteinPercent: null,
    bestTimeMinHours: 6,
    bestTimeMaxHours: 24,
    suitableFermentationModes: ["room", "hybrid"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: true,
    sourceConfidence: "trusted_secondary",
    notes: ["Medium-strong profile for 6–24 hour planning."],
    warnings: ["Prefer stronger flour for 48–72 hour cold fermentation."],
  },
  {
    flourId: "pirkka_w350",
    displayName: "Pirkka W350",
    category: "very_strong",
    wMin: 350,
    wMax: 350,
    proteinPercent: null,
    bestTimeMinHours: 24,
    bestTimeMaxHours: 72,
    suitableFermentationModes: ["cold", "hybrid"],
    suitableOvenTypes: ["home_oven", "pizza_oven"],
    beginnerSafe: false,
    sourceConfidence: "trusted_secondary",
    notes: ["Very strong profile for long fermentation windows."],
    warnings: ["Likely too strong for short fast doughs."],
  },
];

const profileById = new Map(planningFlourProfiles.map((profile) => [profile.flourId, profile]));

const profileAliases: Record<string, PlanningFlourId> = {
  "caputo-pizzeria": "caputo_pizzeria",
  "caputo-nuvola": "caputo_nuvola",
  "caputo-cuoco": "caputo_saccorosso",
  "le5-napoletana": "strong_pizza_flour",
  "petra-5037": "strong_pizza_flour",
  "caputo-classica": "standard_pizza_flour",
  "caputo-nuvola-super": "pirkka_w350",
};

export function resolvePlanningFlourProfile(selection: FlourSelection): PlanningFlourProfile {
  switch (selection.type) {
    case "unknown":
      return getPlanningFlourProfile("unknown_basic_flour");
    case "standard_pizza_flour":
      return getPlanningFlourProfile("standard_pizza_flour");
    case "medium_strong_pizza_flour":
      return getPlanningFlourProfile("medium_strong_pizza_flour");
    case "strong_pizza_flour":
      return getPlanningFlourProfile("strong_pizza_flour");
    case "known_flour_id":
      return getPlanningFlourProfile(selection.flourId);
  }
}

export function getPlanningFlourProfile(flourId: PlanningFlourId): PlanningFlourProfile {
  const directMatch = profileById.get(flourId);
  if (directMatch) return directMatch;

  if (flourId === "caputo-nuvola-super") {
    return {
      ...getPlanningFlourProfile("pirkka_w350"),
      flourId,
      displayName: "Caputo Nuvola Super",
      sourceConfidence: "official",
      notes: ["Very strong flour profile for long fermentation windows."],
      warnings: ["Likely too strong for short fast doughs."],
    };
  }

  const alias = profileAliases[flourId];
  if (alias) return profileById.get(alias) ?? getUnknownBasicFlourProfile();

  return getUnknownBasicFlourProfile();
}

function getUnknownBasicFlourProfile(): PlanningFlourProfile {
  const profile = profileById.get("unknown_basic_flour");
  if (!profile) {
    throw new Error("Planning flour profile registry is missing unknown_basic_flour.");
  }
  return profile;
}
