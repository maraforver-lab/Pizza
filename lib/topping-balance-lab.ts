import type { OvenType, PizzaStyleId } from "@/lib/saved-recipes";
import {
  calculateToppingLoad,
  toppingArea,
  pizzaArea,
  toppingDefaults,
  toppingProfiles,
  type CheeseType,
  type DrainState,
  type PizzaGeometry,
  type ToppingId,
  type ToppingSelection,
} from "@/lib/topping-calculator";

export type ToppingLoadTeachingLevel = "none" | "light" | "moderate" | "heavy";
export type ToppingBalancePreset = "too-little" | "balanced" | "too-much" | "wet-overload" | "heavy-toppings";
export type ToppingBalanceState = {
  style: PizzaStyleId;
  oven: OvenType;
  geometry: PizzaGeometry;
  sauceGrams: number;
  cheeseType: CheeseType;
  cheeseGrams: number;
  drainState: DrainState;
  toppingLoad: ToppingLoadTeachingLevel;
};

export type BalanceLevel = "very-light" | "light" | "balanced" | "heavy" | "overloaded";
export type MoistureLevel = "low" | "medium" | "high";

export type ToppingBalanceResult = {
  fullArea: number;
  usableArea: number;
  sauceDensity: number;
  cheeseDensity: number;
  extraToppingDensity: number;
  combinedDensity: number;
  sauceLevel: BalanceLevel;
  cheeseLevel: BalanceLevel;
  combinedLevel: BalanceLevel;
  moistureLevel: MoistureLevel;
  extraToppingGrams: number;
  totalPreBakeGrams: number;
  recommendedSauceRange: [number, number];
  recommendedCheeseRange: [number, number];
  headline: string;
  likelyEffect: string;
  recommendedAdjustment: string;
};

const cheeseTypes: readonly CheeseType[] = ["fior-di-latte", "buffalo", "low-moisture", "none"];
const drainStates: readonly DrainState[] = ["undrained", "under-1h", "1-3h", "4-8h", "overnight"];
const loadLevels: readonly ToppingLoadTeachingLevel[] = ["none", "light", "moderate", "heavy"];

export const toppingBalanceDefaultState: ToppingBalanceState = {
  style: "neapolitan",
  oven: "gas",
  geometry: { shape: "round", diameter: 32, rim: 2 },
  sauceGrams: 75,
  cheeseType: "fior-di-latte",
  cheeseGrams: 88,
  drainState: "4-8h",
  toppingLoad: "none",
};

export const toppingBalancePresets: Record<ToppingBalancePreset, Pick<ToppingBalanceState, "sauceGrams" | "cheeseGrams" | "drainState" | "toppingLoad">> = {
  "too-little": { sauceGrams: 45, cheeseGrams: 55, drainState: "4-8h", toppingLoad: "none" },
  balanced: { sauceGrams: 75, cheeseGrams: 88, drainState: "4-8h", toppingLoad: "light" },
  "too-much": { sauceGrams: 115, cheeseGrams: 135, drainState: "under-1h", toppingLoad: "moderate" },
  "wet-overload": { sauceGrams: 78, cheeseGrams: 92, drainState: "undrained", toppingLoad: "moderate" },
  "heavy-toppings": { sauceGrams: 82, cheeseGrams: 98, drainState: "4-8h", toppingLoad: "heavy" },
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseNumber(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  return clamp(Number(raw), min, max);
}

function parseLegacyToppingLoad(params: URLSearchParams): ToppingLoadTeachingLevel {
  const explicit = params.get("toppingLoad");
  if (loadLevels.includes(explicit as ToppingLoadTeachingLevel)) {
    return explicit as ToppingLoadTeachingLevel;
  }

  const totalLegacyToppingGrams = (params.get("toppings") ?? "")
    .split(",")
    .map((item) => Number(item.split(":")[1]))
    .filter((value) => Number.isFinite(value) && value > 0)
    .reduce((sum, value) => sum + value, 0);

  if (totalLegacyToppingGrams >= 80) return "heavy";
  if (totalLegacyToppingGrams >= 45) return "moderate";
  if (totalLegacyToppingGrams > 0) return "light";
  return "none";
}

export function normalizeToppingGeometry(geometry: PizzaGeometry): PizzaGeometry {
  if (geometry.shape === "rectangle") {
    const width = clamp(geometry.width, 12, 60);
    const length = clamp(geometry.length, 12, 80);
    const rim = clamp(geometry.rim, 0, Math.max(0, Math.min(width, length) / 2 - 1));
    return { shape: "rectangle", width, length, rim };
  }

  const diameter = clamp(geometry.diameter, 18, 45);
  const rim = clamp(geometry.rim, 0, diameter / 2 - 1);
  return { shape: "round", diameter, rim };
}

export function parseToppingBalanceSearch(search: string, base: Partial<ToppingBalanceState> = {}): ToppingBalanceState {
  const params = new URLSearchParams(search);
  const state = { ...toppingBalanceDefaultState, ...base };
  const defaults = toppingDefaults(state.style);
  const shape = params.get("pizzaShape") === "rectangle" ? "rectangle" : "round";
  const fallbackGeometry = base.geometry ?? defaults.geometry;
  const geometry = shape === "rectangle"
    ? normalizeToppingGeometry({
        shape,
        width: parseNumber(params, "pizzaWidth", fallbackGeometry.shape === "rectangle" ? fallbackGeometry.width : 20, 12, 60),
        length: parseNumber(params, "pizzaLength", fallbackGeometry.shape === "rectangle" ? fallbackGeometry.length : 25, 12, 80),
        rim: parseNumber(params, "rim", fallbackGeometry.rim, 0, 12),
      })
    : normalizeToppingGeometry({
        shape,
        diameter: parseNumber(params, "diameter", fallbackGeometry.shape === "round" ? fallbackGeometry.diameter : 32, 18, 45),
        rim: parseNumber(params, "rim", fallbackGeometry.rim, 0, 12),
      });

  const cheese = params.get("cheese");
  const drain = params.get("drain");

  return {
    ...state,
    geometry,
    sauceGrams: parseNumber(params, "sauceGrams", state.sauceGrams, 0, 220),
    cheeseType: cheeseTypes.includes(cheese as CheeseType) ? cheese as CheeseType : state.cheeseType,
    cheeseGrams: parseNumber(params, "cheeseGrams", state.cheeseGrams, 0, 260),
    drainState: drainStates.includes(drain as DrainState) ? drain as DrainState : state.drainState,
    toppingLoad: parseLegacyToppingLoad(params),
  };
}

export function buildToppingBalanceSearch(state: ToppingBalanceState) {
  const params = new URLSearchParams();
  const geometry = normalizeToppingGeometry(state.geometry);
  params.set("pizzaShape", geometry.shape);
  params.set("rim", formatQueryNumber(geometry.rim));
  if (geometry.shape === "rectangle") {
    params.set("pizzaWidth", formatQueryNumber(geometry.width));
    params.set("pizzaLength", formatQueryNumber(geometry.length));
  } else {
    params.set("diameter", formatQueryNumber(geometry.diameter));
  }
  params.set("cheese", state.cheeseType);
  params.set("drain", state.drainState);
  params.set("cheeseGrams", formatQueryNumber(state.cheeseType === "none" ? 0 : state.cheeseGrams));
  params.set("sauceGrams", formatQueryNumber(state.sauceGrams));
  if (state.toppingLoad !== "none") params.set("toppingLoad", state.toppingLoad);
  return params.toString();
}

function formatQueryNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

export function extraToppingGramsForArea(area: number, load: ToppingLoadTeachingLevel) {
  const densityByLoad: Record<ToppingLoadTeachingLevel, number> = {
    none: 0,
    light: 3.5,
    moderate: 7.5,
    heavy: 13,
  };
  return Math.round((area / 100) * densityByLoad[load]);
}

function classifyDensity(value: number, [lightMax, balancedMax, heavyMax, overloadMax]: [number, number, number, number]): BalanceLevel {
  if (value < lightMax * 0.72) return "very-light";
  if (value < lightMax) return "light";
  if (value <= balancedMax) return "balanced";
  if (value <= heavyMax || value <= overloadMax) return "heavy";
  return "overloaded";
}

function moistureScore(state: ToppingBalanceState, extraToppingDensity: number) {
  let points = 0;
  if (state.cheeseType === "fior-di-latte" || state.cheeseType === "buffalo") {
    points += ({ undrained: 3, "under-1h": 2, "1-3h": 1, "4-8h": 0, overnight: 0 } as const)[state.drainState];
  }
  if (state.cheeseType === "buffalo") points += 1;
  if (state.oven === "home" && (state.cheeseType === "fior-di-latte" || state.cheeseType === "buffalo")) points += 1;
  if (extraToppingDensity >= 10) points += 3;
  else if (extraToppingDensity >= 6) points += 2;
  else if (extraToppingDensity >= 3) points += 1;
  return points;
}

function moistureLevelForScore(score: number): MoistureLevel {
  if (score >= 5) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function levelOrder(level: BalanceLevel) {
  return ["very-light", "light", "balanced", "heavy", "overloaded"].indexOf(level);
}

function maxLevel(...levels: BalanceLevel[]): BalanceLevel {
  return levels.reduce((max, level) => levelOrder(level) > levelOrder(max) ? level : max, "very-light" as BalanceLevel);
}

export function calculateToppingBalance(state: ToppingBalanceState): ToppingBalanceResult {
  const geometry = normalizeToppingGeometry(state.geometry);
  const usableArea = toppingArea(geometry);
  const fullArea = pizzaArea(geometry);
  const extraToppingGrams = extraToppingGramsForArea(usableArea, state.toppingLoad);
  const cheeseGrams = state.cheeseType === "none" ? 0 : state.cheeseGrams;
  const sauceDensity = roundOne(state.sauceGrams / usableArea * 100);
  const cheeseDensity = roundOne(cheeseGrams / usableArea * 100);
  const extraToppingDensity = roundOne(extraToppingGrams / usableArea * 100);
  const combinedDensity = roundOne((state.sauceGrams + cheeseGrams + extraToppingGrams) / usableArea * 100);
  const sauceLevel = classifyDensity(sauceDensity, [9, 14, 17, 20]);
  const cheeseRange = state.cheeseType === "low-moisture" ? [10, 20, 25, 30] as [number, number, number, number] : [9, 16, 20, 24] as [number, number, number, number];
  const cheeseLevel = state.cheeseType === "none" ? "very-light" : classifyDensity(cheeseDensity, cheeseRange);
  const moisturePoints = moistureScore(state, extraToppingDensity);
  const moistureLevel = moistureLevelForScore(moisturePoints);
  const combinedLevel = moistureLevel === "high" && maxLevel(sauceLevel, cheeseLevel) === "heavy"
    ? "overloaded"
    : classifyDensity(combinedDensity + (moistureLevel === "high" ? 5 : moistureLevel === "medium" ? 2 : 0), [20, 34, 44, 52]);

  const legacyResult = calculateToppingLoad({
    style: state.style,
    oven: state.oven,
    geometry,
    sauceGrams: state.sauceGrams,
    cheeseType: state.cheeseType,
    cheeseGrams: state.cheeseGrams,
    drainState: state.drainState,
    toppings: legacyToppingsForLoad(state.toppingLoad),
  });

  const normalizedCombined = maxLevel(combinedLevel, legacyResult.load === "light" ? "light" : legacyResult.load);
  const recommendedSauceRange: [number, number] = [Math.round(usableArea * 0.11), Math.round(usableArea * 0.14)];
  const recommendedCheeseRange: [number, number] = state.cheeseType === "low-moisture"
    ? [Math.round(usableArea * 0.15), Math.round(usableArea * 0.2)]
    : [Math.round(usableArea * 0.12), Math.round(usableArea * 0.16)];

  return {
    fullArea: roundOne(fullArea),
    usableArea: roundOne(usableArea),
    sauceDensity,
    cheeseDensity,
    extraToppingDensity,
    combinedDensity,
    sauceLevel,
    cheeseLevel,
    combinedLevel: normalizedCombined,
    moistureLevel,
    extraToppingGrams,
    totalPreBakeGrams: state.sauceGrams + cheeseGrams + extraToppingGrams,
    recommendedSauceRange,
    recommendedCheeseRange,
    ...copyForLevel(normalizedCombined, moistureLevel),
  };
}

function legacyToppingsForLoad(load: ToppingLoadTeachingLevel): Partial<Record<ToppingId, ToppingSelection>> {
  if (load === "none") return {};
  const grams = load === "light" ? 20 : load === "moderate" ? 45 : 80;
  const mushroom = toppingProfiles.find((profile) => profile.id === "mushroom");
  if (!mushroom) return {};
  return { mushroom: { grams, preparation: load === "heavy" ? "raw" : "prepared" } };
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function copyForLevel(level: BalanceLevel, moisture: MoistureLevel) {
  if (level === "very-light" || level === "light") {
    return {
      headline: "Visually light",
      likelyEffect: "The pizza may bake easily, but the bite can feel dry or under-topped if the sauce and cheese disappear.",
      recommendedAdjustment: "Add sauce or cheese gradually until coverage looks intentional while the rim stays clear.",
    };
  }

  if (level === "balanced" && moisture !== "high") {
    return {
      headline: "Practical starting balance",
      likelyEffect: "Coverage is controlled, sauce remains visible, and the topping load should be easier to bake cleanly.",
      recommendedAdjustment: "Bake this as your reference pizza, then adjust one variable at a time next bake.",
    };
  }

  if (level === "heavy" || moisture === "medium") {
    return {
      headline: "Heavy but still adjustable",
      likelyEffect: "The pizza may work, but the center has less margin if cheese moisture, sauce texture or oven heat are not controlled.",
      recommendedAdjustment: "Reduce either sauce, cheese or extra toppings before adding more ingredients.",
    };
  }

  return {
    headline: "Likely overloaded",
    likelyEffect: "A continuous cheese blanket, deep sauce layer or wet toppings can trap steam, soften the center and make launch harder.",
    recommendedAdjustment: "Reset to balanced, then add only the topping that matters most.",
  };
}

