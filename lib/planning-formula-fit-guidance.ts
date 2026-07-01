import type { PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import type {
  FermentationMode,
  OvenType,
  PlanningDoughTypeGuidance,
  PlanningFlourGuidance,
  PlanningFormulaFitGuidance,
  PlanningFormulaFitLevel,
  UserLevel,
} from "@/lib/planning-types";

type PlanningFormulaFitGuidanceInput = {
  hydration?: number;
  salt?: number;
  ovenType: OvenType;
  doughStyle?: string;
  flourProfile: PlanningFlourProfile;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
  userLevel: UserLevel;
};

type FormulaSignal = {
  area: "hydration" | "salt" | "oven";
  level: PlanningFormulaFitLevel;
  message: string;
  adjustment: string | null;
};

export function buildPlanningFormulaFitGuidance(
  input: PlanningFormulaFitGuidanceInput,
): PlanningFormulaFitGuidance {
  const hydration = normalizeOptionalNumber(input.hydration);
  const salt = normalizeOptionalNumber(input.salt);
  const signals = buildSignals({
    hydration,
    salt,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle,
    flourProfile: input.flourProfile,
    availableFermentationHours: normalizeHours(input.availableFermentationHours),
    selectedFermentationMode: input.selectedFermentationMode,
    flourGuidance: input.flourGuidance,
    doughTypeGuidance: input.doughTypeGuidance,
  });
  const hydrationFit = fitForArea(signals, "hydration", hydration === null);
  const saltFit = fitForArea(signals, "salt", salt === null);
  const ovenFit = fitForArea(signals, "oven", false);
  const overallFit = chooseOverallFit([hydrationFit, saltFit, ovenFit]);
  const cautions = signals
    .filter((signal) => signal.level === "caution" || signal.level === "high_risk")
    .map((signal) => signal.message);
  const suggestedAdjustments = unique(
    signals
      .map((signal) => signal.adjustment)
      .filter((adjustment): adjustment is string => Boolean(adjustment)),
  );

  return {
    version: 1,
    hydration,
    salt,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle ?? null,
    flourCategory: input.flourProfile.category,
    hydrationFit,
    saltFit,
    ovenFit,
    overallFit,
    title: buildTitle(overallFit),
    summary: buildSummary({
      overallFit,
      hydration,
      salt,
      ovenType: input.ovenType,
      doughStyle: input.doughStyle,
      flourName: input.flourProfile.displayName,
    }),
    cautions,
    suggestedAdjustments: suggestedAdjustments.length > 0
      ? suggestedAdjustments
      : ["Keep the formula as-is, then judge dough handling and bake result before changing several variables at once."],
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      hydration,
      salt,
      ovenType: input.ovenType,
      flourName: input.flourProfile.displayName,
      flourCategory: input.flourProfile.category,
      availableFermentationHours: normalizeHours(input.availableFermentationHours),
      selectedFermentationMode: input.selectedFermentationMode,
      signals,
    }),
  };
}

function buildSignals(input: {
  hydration: number | null;
  salt: number | null;
  ovenType: OvenType;
  doughStyle?: string;
  flourProfile: PlanningFlourProfile;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
}): FormulaSignal[] {
  const signals: FormulaSignal[] = [];
  const category = input.flourProfile.category;
  const isNeapolitan = (input.doughStyle ?? "").includes("neapolitan");
  const isPizzaFlour = input.flourProfile.displayName.toLowerCase().includes("pizzeria")
    || input.flourProfile.displayName.toLowerCase().includes("pizza")
    || category === "medium_strong";

  if (input.hydration === null) {
    signals.push({
      area: "hydration",
      level: "not_enough_information",
      message: "Hydration is needed before DoughTools can judge formula fit.",
      adjustment: "Set hydration first.",
    });
  } else {
    if (input.hydration < 58 && isNeapolitan) {
      signals.push({
        area: "hydration",
        level: "caution",
        message: "Very low hydration may make Neapolitan-style dough less extensible.",
        adjustment: "Consider a moderate hydration before chasing a very dry formula.",
      });
    }

    if (input.hydration >= 68 && (category === "standard" || category === "unknown")) {
      signals.push({
        area: "hydration",
        level: input.hydration >= 72 ? "high_risk" : "caution",
        message: "High hydration with all-purpose or weaker flour may be sticky and harder to handle.",
        adjustment: "Lower hydration or use a stronger flour if the dough feels too slack.",
      });
    }

    if (input.hydration >= 70 && input.ovenType === "home_oven") {
      signals.push({
        area: "hydration",
        level: "caution",
        message: "High hydration can be less forgiving in a home oven.",
        adjustment: "Consider moderate hydration for home-oven handling and browning.",
      });
    }

    if (input.hydration >= 60 && input.hydration <= 68 && signals.every((signal) => signal.area !== "hydration")) {
      signals.push({
        area: "hydration",
        level: "good_fit",
        message: "Moderate hydration is broadly workable for a v1 pizza dough plan.",
        adjustment: null,
      });
    }
  }

  if (input.salt === null) {
    signals.push({
      area: "salt",
      level: "not_enough_information",
      message: "Salt percentage is needed before DoughTools can judge salt fit.",
      adjustment: "Set salt percentage first.",
    });
  } else if (input.salt < 2) {
    signals.push({
      area: "salt",
      level: "caution",
      message: "Low salt may taste flat and can let fermentation move faster.",
      adjustment: "Consider moving salt closer to the normal pizza-dough range unless you have a reason not to.",
    });
  } else if (input.salt > 3.4) {
    signals.push({
      area: "salt",
      level: "caution",
      message: "High salt may taste salty and can slow fermentation.",
      adjustment: "Consider lowering salt toward a more typical range before adjusting yeast or timing.",
    });
  } else {
    signals.push({
      area: "salt",
      level: "good_fit",
      message: "Salt percentage is in a broadly workable pizza-dough range.",
      adjustment: null,
    });
  }

  if (isNeapolitan && input.ovenType === "pizza_oven" && isPizzaFlour) {
    signals.push({
      area: "oven",
      level: "good_fit",
      message: "Neapolitan-style dough, pizza flour and a pizza oven are a strong broad fit.",
      adjustment: null,
    });
  } else if (isNeapolitan && input.ovenType === "home_oven") {
    signals.push({
      area: "oven",
      level: "workable",
      message: "Neapolitan-style dough can work in a home oven, but expectations differ from a high-heat pizza oven.",
      adjustment: "Focus on preheating, bake surface and browning instead of chasing exact pizza-oven texture.",
    });
  } else if (input.ovenType === "home_oven") {
    signals.push({
      area: "oven",
      level: "workable",
      message: "Home oven planning is workable when hydration and bake setup stay forgiving.",
      adjustment: null,
    });
  } else {
    signals.push({
      area: "oven",
      level: "workable",
      message: "Pizza oven planning can work well, but dough strength and launch handling still matter.",
      adjustment: null,
    });
  }

  if (input.flourGuidance?.riskLevel === "high_risk") {
    signals.push({
      area: "hydration",
      level: "high_risk",
      message: "Existing flour guidance marks this formula/flour combination as high risk.",
      adjustment: input.flourGuidance.suggestedAdjustments[0] ?? "Review flour and hydration together.",
    });
  }

  if (input.doughTypeGuidance?.riskLevel === "high_risk") {
    signals.push({
      area: "oven",
      level: "high_risk",
      message: "Existing dough style guidance marks this formula/oven context as high risk.",
      adjustment: input.doughTypeGuidance.suggestedAdjustments[0] ?? "Review dough style, timing and oven context together.",
    });
  }

  return signals;
}

function fitForArea(
  signals: FormulaSignal[],
  area: FormulaSignal["area"],
  missing: boolean,
): PlanningFormulaFitLevel {
  const areaSignals = signals.filter((signal) => signal.area === area);
  if (missing || areaSignals.some((signal) => signal.level === "not_enough_information")) return "not_enough_information";
  if (areaSignals.some((signal) => signal.level === "high_risk")) return "high_risk";
  if (areaSignals.some((signal) => signal.level === "caution")) return "caution";
  if (areaSignals.some((signal) => signal.level === "good_fit")) return "good_fit";
  return "workable";
}

function chooseOverallFit(levels: PlanningFormulaFitLevel[]): PlanningFormulaFitLevel {
  if (levels.some((level) => level === "not_enough_information")) return "not_enough_information";
  if (levels.some((level) => level === "high_risk")) return "high_risk";
  if (levels.some((level) => level === "caution")) return "caution";
  if (levels.every((level) => level === "good_fit")) return "good_fit";
  return "workable";
}

function buildTitle(level: PlanningFormulaFitLevel): string {
  switch (level) {
    case "good_fit":
      return "Formula and oven look like a good fit";
    case "workable":
      return "Formula and oven look workable";
    case "caution":
      return "Formula fit needs caution";
    case "high_risk":
      return "Formula fit may be risky";
    case "not_enough_information":
      return "Formula fit needs more context";
  }
}

function buildSummary(input: {
  overallFit: PlanningFormulaFitLevel;
  hydration: number | null;
  salt: number | null;
  ovenType: OvenType;
  doughStyle?: string;
  flourName: string;
}): string {
  if (input.overallFit === "not_enough_information") {
    return "DoughTools needs hydration, salt and oven context before it can judge formula fit.";
  }

  const hydration = input.hydration === null ? "the selected hydration" : `${input.hydration}% hydration`;
  const salt = input.salt === null ? "the selected salt" : `${input.salt}% salt`;
  const oven = input.ovenType === "pizza_oven" ? "pizza oven" : "home oven";
  const style = input.doughStyle?.includes("neapolitan") ? "Neapolitan-style" : "selected";

  if (input.overallFit === "good_fit") {
    return `${style} dough with ${hydration}, ${salt}, ${input.flourName} and a ${oven} is a strong broad v1 fit.`;
  }

  if (input.overallFit === "high_risk") {
    return `${style} dough with ${hydration}, ${salt} and a ${oven} has a high-risk fit signal. Treat this as cautious guidance, not an exact correction.`;
  }

  if (input.overallFit === "caution") {
    return `${style} dough with ${hydration}, ${salt} and a ${oven} can work, but one or more formula choices need caution.`;
  }

  return `${style} dough with ${hydration}, ${salt} and a ${oven} looks broadly workable in v1.`;
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  hydration: number | null;
  salt: number | null;
  ovenType: OvenType;
  flourName: string;
  flourCategory: PlanningFlourProfile["category"];
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  signals: FormulaSignal[];
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  const signals = input.signals.map((signal) => `${signal.area}:${signal.level}`).join(", ");
  return [
    "Pizza Nerd note: formula fit v1 ranks hydration, salt and oven context only; it does not change ingredient formulas.",
    `Hydration/salt: ${input.hydration ?? "unknown"}% / ${input.salt ?? "unknown"}%.`,
    `Oven: ${input.ovenType}.`,
    `Flour: ${input.flourName} (${input.flourCategory}).`,
    `Window/mode: ${input.availableFermentationHours} h / ${input.selectedFermentationMode ?? "not selected"}.`,
    `Signals: ${signals || "none"}.`,
  ].join(" ");
}

function normalizeOptionalNumber(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

function normalizeHours(hours: number): number {
  if (!Number.isFinite(hours) || hours < 0) return 0;
  return Number(hours.toFixed(1));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
