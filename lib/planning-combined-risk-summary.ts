import type {
  FermentationMode,
  PlanningCombinedRiskLevel,
  PlanningCombinedRiskSummary,
  PlanningDoughTypeGuidance,
  PlanningFermentationSetupRecommendation,
  PlanningFlourGuidance,
  PlanningFormulaFitGuidance,
  PlanningMixingGuidance,
  PlanningStartWindowRecommendation,
  PlanningTemperatureGuidance,
  PlanningWarning,
  PlanningYeastGuidance,
  UserLevel,
} from "@/lib/planning-types";

type RiskSignal = {
  source:
    | "warning"
    | "fermentation_setup"
    | "start_window"
    | "yeast"
    | "flour"
    | "dough_type"
    | "formula"
    | "temperature"
    | "mixing";
  level: PlanningCombinedRiskLevel;
  reason: string;
  adjustment: string | null;
  priority: number;
};

type PlanningCombinedRiskSummaryInput = {
  warnings: PlanningWarning[];
  fermentationSetupRecommendation?: PlanningFermentationSetupRecommendation | null;
  yeastGuidance?: PlanningYeastGuidance | null;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
  formulaFitGuidance?: PlanningFormulaFitGuidance | null;
  temperatureGuidance?: PlanningTemperatureGuidance | null;
  startWindowRecommendation?: PlanningStartWindowRecommendation | null;
  mixingGuidance?: PlanningMixingGuidance | null;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  userLevel: UserLevel;
};

export function buildPlanningCombinedRiskSummary(
  input: PlanningCombinedRiskSummaryInput,
): PlanningCombinedRiskSummary {
  const signals = sortSignals(buildSignals(input));
  const hasNotEnoughInformation = signals.some((signal) => signal.level === "not_enough_information");
  const hasHighRisk = signals.some((signal) => signal.level === "high_risk");
  const cautionCount = signals.filter((signal) => signal.level === "caution").length;
  const overallRiskLevel: PlanningCombinedRiskLevel = hasNotEnoughInformation
    ? "not_enough_information"
    : hasHighRisk
      ? "high_risk"
      : cautionCount > 0
        ? "caution"
        : "low";
  const primarySignal = signals.find((signal) => signal.level === overallRiskLevel)
    ?? signals[0]
    ?? null;
  const primaryRiskReason = primarySignal?.reason ?? "No major risk signals were detected.";
  const secondaryRiskReasons = unique(
    signals
      .filter((signal) => signal !== primarySignal)
      .filter((signal) => signal.level === "high_risk" || signal.level === "caution")
      .filter((signal) => signal.reason !== primaryRiskReason)
      .map((signal) => signal.reason),
  ).slice(0, 4);
  const adjustments = unique(
    signals
      .map((signal) => signal.adjustment)
      .filter((adjustment): adjustment is string => Boolean(adjustment)),
  );

  return {
    version: 1,
    overallRiskLevel,
    primaryRiskReason,
    secondaryRiskReasons,
    summary: buildSummary({
      overallRiskLevel,
      primaryRiskReason,
      secondaryRiskReasons,
      cautionCount,
    }),
    suggestedFirstAdjustment: adjustments[0] ?? defaultAdjustment(overallRiskLevel),
    additionalAdjustments: adjustments.slice(1, 4),
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      signals,
      availableFermentationHours: input.availableFermentationHours,
      selectedFermentationMode: input.selectedFermentationMode,
      roomTemperature: input.roomTemperature,
      fridgeTemperature: input.fridgeTemperature,
    }),
  };
}

function buildSignals(input: PlanningCombinedRiskSummaryInput): RiskSignal[] {
  return [
    ...warningSignals(input.warnings),
    fermentationSetupSignal(input.fermentationSetupRecommendation),
    startWindowSignal(input.startWindowRecommendation),
    yeastSignal(input.yeastGuidance, input),
    flourSignal(input.flourGuidance),
    doughTypeSignal(input.doughTypeGuidance),
    formulaFitSignal(input.formulaFitGuidance),
    temperatureSignal(input.temperatureGuidance),
    mixingSignal(input.mixingGuidance),
  ].filter((signal): signal is RiskSignal => signal !== null);
}

function warningSignals(warnings: PlanningWarning[]): RiskSignal[] {
  return warnings
    .filter((warning) => warning.severity === "high_risk" || warning.severity === "caution")
    .map((warning) => ({
      source: "warning" as const,
      level: warning.severity === "high_risk" ? "high_risk" : "caution",
      reason: warning.userMessage,
      adjustment: warning.suggestedFix,
      priority: warning.severity === "high_risk" ? 80 : 35,
    }));
}

function fermentationSetupSignal(
  guidance?: PlanningFermentationSetupRecommendation | null,
): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "not_recommended") {
    return {
      source: "fermentation_setup",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "The selected fermentation setup is not recommended for this time window.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Choose a later bake target or a simpler fermentation setup.",
      priority: 95,
    };
  }
  if (guidance.riskLevel === "high_risk") {
    return {
      source: "fermentation_setup",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "The fermentation setup has a high-risk mismatch.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Adjust the fermentation setup before trusting the plan.",
      priority: 90,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "fermentation_setup",
      level: "caution",
      reason: guidance.cautions[0] ?? "The fermentation setup has practical cautions.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Align the selected setup with the recommended setup.",
      priority: 50,
    };
  }
  return null;
}

function startWindowSignal(
  guidance?: PlanningStartWindowRecommendation | null,
): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "not_enough_information") {
    return {
      source: "start_window",
      level: "not_enough_information",
      reason: "Add a valid bake date and time to get a stronger planning risk summary.",
      adjustment: "Set the bake target first.",
      priority: 100,
    };
  }
  if (guidance.riskLevel === "high_risk") {
    return {
      source: "start_window",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "The start window is high risk for the selected plan.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Choose a later bake target or a simpler setup.",
      priority: 92,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "start_window",
      level: "caution",
      reason: guidance.cautions[0] ?? "The start window has timing cautions.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Use a broader, safer start window.",
      priority: 48,
    };
  }
  return null;
}

function yeastSignal(
  guidance: PlanningYeastGuidance | null | undefined,
  context: PlanningCombinedRiskSummaryInput,
): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "not_enough_information") {
    return null;
  }
  if (guidance.riskLevel === "high_risk") {
    const warmConditions = context.roomTemperature >= 25 || context.fridgeTemperature > 6;
    return {
      source: "yeast",
      level: "high_risk",
      reason: warmConditions
        ? "Yeast guidance is high risk and warm conditions may make the dough move faster."
        : guidance.cautions[0] ?? "Yeast guidance is high risk for this plan.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Review yeast amount/type before relying on this plan.",
      priority: warmConditions ? 94 : 88,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "yeast",
      level: "caution",
      reason: guidance.cautions[0] ?? "Yeast guidance has cautions for this time window.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Compare the yeast amount with the conservative v1 reference.",
      priority: 45,
    };
  }
  return null;
}

function flourSignal(guidance?: PlanningFlourGuidance | null): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "not_enough_information") {
    return null;
  }
  if (guidance.riskLevel === "high_risk") {
    return {
      source: "flour",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "Flour strength may be a poor fit for this plan.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Use a stronger flour or lower-risk fermentation window.",
      priority: 72,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "flour",
      level: "caution",
      reason: guidance.cautions[0] ?? "Flour guidance has handling cautions.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Use a safer flour/hydration combination.",
      priority: 42,
    };
  }
  return null;
}

function doughTypeSignal(guidance?: PlanningDoughTypeGuidance | null): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "not_enough_information") {
    return null;
  }
  if (guidance.riskLevel === "high_risk") {
    return {
      source: "dough_type",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "Dough style guidance is high risk for this timing.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Adjust dough style or available fermentation time.",
      priority: 75,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "dough_type",
      level: "caution",
      reason: guidance.cautions[0] ?? "Dough style guidance has cautions.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Choose a timing window that better fits the dough style.",
      priority: 40,
    };
  }
  return null;
}

function formulaFitSignal(guidance?: PlanningFormulaFitGuidance | null): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.overallFit === "not_enough_information") return null;
  if (guidance.overallFit === "high_risk") {
    return {
      source: "formula",
      level: "high_risk",
      reason: guidance.cautions[0] ?? "Formula fit has a high-risk hydration, salt or oven signal.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Review hydration, salt and oven fit together.",
      priority: 74,
    };
  }
  if (guidance.overallFit === "caution") {
    return {
      source: "formula",
      level: "caution",
      reason: guidance.cautions[0] ?? "Formula fit has a hydration, salt or oven caution.",
      adjustment: guidance.suggestedAdjustments[0] ?? "Adjust one formula variable at a time.",
      priority: 44,
    };
  }
  return null;
}

function temperatureSignal(guidance?: PlanningTemperatureGuidance | null): RiskSignal | null {
  if (!guidance) return null;
  if (guidance.riskLevel === "high_risk") {
    return {
      source: "temperature",
      level: "high_risk",
      reason: highRiskTemperatureReason(guidance),
      adjustment: guidance.userFacingGuidance.at(-1) ?? "Use cooler, more controlled temperatures.",
      priority: 86,
    };
  }
  if (guidance.riskLevel === "caution") {
    return {
      source: "temperature",
      level: "caution",
      reason: guidance.userFacingGuidance[0] ?? "Temperature may noticeably change fermentation speed.",
      adjustment: guidance.userFacingGuidance.at(-1) ?? "Check dough condition earlier than the clock.",
      priority: 46,
    };
  }
  return null;
}

function highRiskTemperatureReason(guidance: PlanningTemperatureGuidance): string {
  if (guidance.fridgeCategory === "warm_fridge") return guidance.fridgeTemperatureNote;
  if (guidance.roomCategory === "hot_room") return guidance.roomTemperatureNote;
  return guidance.summary;
}

function mixingSignal(guidance?: PlanningMixingGuidance | null): RiskSignal | null {
  if (!guidance || guidance.cautions.length === 0) return null;
  if (guidance.method === "hand_mixing") return null;

  return {
    source: "mixing",
    level: "caution",
    reason: guidance.cautions[0].userMessage,
    adjustment: guidance.cautions[0].suggestedFix,
    priority: 20,
  };
}

function sortSignals(signals: RiskSignal[]): RiskSignal[] {
  return [...signals].sort((a, b) => b.priority - a.priority);
}

function buildSummary(input: {
  overallRiskLevel: PlanningCombinedRiskLevel;
  primaryRiskReason: string;
  secondaryRiskReasons: string[];
  cautionCount: number;
}): string {
  if (input.overallRiskLevel === "not_enough_information") {
    return "Add a bake date and time to get a stronger planning risk summary.";
  }

  if (input.overallRiskLevel === "high_risk") {
    return `This setup is risky because ${lowercaseFirst(input.primaryRiskReason)} Keep this as cautionary guidance, not a guarantee.`;
  }

  if (input.overallRiskLevel === "caution") {
    const multiple = input.secondaryRiskReasons.length > 0 || input.cautionCount > 1;
    return multiple
      ? `This plan can work, but multiple caution signals are present. Main issue: ${input.primaryRiskReason}`
      : `This plan can work, but ${lowercaseFirst(input.primaryRiskReason)}`;
  }

  return "This plan looks broadly balanced. No major risk signals were detected.";
}

function defaultAdjustment(level: PlanningCombinedRiskLevel): string | null {
  if (level === "low") return "Keep the plan as-is, then judge the dough by condition instead of the clock alone.";
  if (level === "not_enough_information") return "Set a valid bake target first.";
  return "Adjust the highest-risk planning variable first, then re-check the summary.";
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  signals: RiskSignal[];
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  const signalList = input.signals.length === 0
    ? "none"
    : input.signals.map((signal) => `${signal.source}:${signal.level}`).join(", ");

  return [
    "Pizza Nerd note: combined risk summary v1 only ranks existing guidance signals; it does not create new fermentation science.",
    `Signals: ${signalList}.`,
    `Available time: ${input.availableFermentationHours} h.`,
    `Selected mode: ${input.selectedFermentationMode ?? "not selected"}.`,
    `Room/fridge: ${input.roomTemperature}°C / ${input.fridgeTemperature}°C.`,
  ].join(" ");
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function lowercaseFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLowerCase() + value.slice(1);
}
