import type {
  FermentationMode,
  PlanningDoughTypeGuidance,
  PlanningFermentationSetupRecommendation,
  PlanningFlourGuidance,
  PlanningStartWindowCategory,
  PlanningStartWindowFitLevel,
  PlanningStartWindowRecommendation,
  PlanningYeastGuidance,
  UserLevel,
} from "@/lib/planning-types";

type PlanningStartWindowInput = {
  currentDateTime: Date;
  desiredBakeDateTime: Date;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  recommendedFermentationMode: FermentationMode;
  fermentationSetupRecommendation?: PlanningFermentationSetupRecommendation | null;
  yeastGuidance?: PlanningYeastGuidance | null;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
  roomTemperature: number;
  fridgeTemperature: number;
  userLevel: UserLevel;
};

type StartWindowSignal = {
  type: "note" | "caution" | "high_risk";
  message: string;
};

export function buildPlanningStartWindowRecommendation(
  input: PlanningStartWindowInput,
): PlanningStartWindowRecommendation {
  const currentDate = validDateOrNull(input.currentDateTime);
  const bakeDate = validDateOrNull(input.desiredBakeDateTime);
  const availableFermentationHours = normalizeHours(input.availableFermentationHours);
  const selectedFermentationMode = input.selectedFermentationMode ?? null;
  const hasUsableDates = currentDate !== null && bakeDate !== null && bakeDate.getTime() > currentDate.getTime();
  const category = hasUsableDates
    ? chooseCategory(availableFermentationHours)
    : "not_enough_information";
  const windowBounds = hasUsableDates
    ? buildWindowBounds(category, currentDate, bakeDate, availableFermentationHours)
    : { earliest: null, latest: null };
  const signals = buildSignals({
    category,
    availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    fermentationSetupRecommendation: input.fermentationSetupRecommendation,
    yeastGuidance: input.yeastGuidance,
    flourGuidance: input.flourGuidance,
    doughTypeGuidance: input.doughTypeGuidance,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const riskLevel = chooseRiskLevel(category, signals);
  const fitLevel = chooseFitLevel({
    category,
    riskLevel,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
  });

  return {
    version: 1,
    category,
    startWindowLabel: startWindowLabel(category),
    relativeStartRecommendation: relativeRecommendation(category),
    currentDateTimeIso: currentDate ? currentDate.toISOString() : null,
    desiredBakeDateTimeIso: bakeDate ? bakeDate.toISOString() : null,
    availableFermentationHours,
    earliestRecommendedStartIso: windowBounds.earliest?.toISOString() ?? null,
    latestRecommendedStartIso: windowBounds.latest?.toISOString() ?? null,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    fitLevel,
    riskLevel,
    summary: buildSummary({
      category,
      availableFermentationHours,
      selectedFermentationMode,
      recommendedFermentationMode: input.recommendedFermentationMode,
      riskLevel,
    }),
    cautions: signals.filter((signal) => signal.type === "caution" || signal.type === "high_risk").map((signal) => signal.message),
    suggestedAdjustments: buildSuggestedAdjustments({
      category,
      riskLevel,
      selectedFermentationMode,
      recommendedFermentationMode: input.recommendedFermentationMode,
      fridgeTemperature: input.fridgeTemperature,
      roomTemperature: input.roomTemperature,
      yeastGuidance: input.yeastGuidance,
    }),
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      category,
      availableFermentationHours,
      selectedFermentationMode,
      recommendedFermentationMode: input.recommendedFermentationMode,
      earliest: windowBounds.earliest,
      latest: windowBounds.latest,
    }),
  };
}

function chooseCategory(hours: number): PlanningStartWindowCategory {
  if (hours <= 0) return "too_late";
  if (hours < 3) return "too_late";
  if (hours < 8) return "start_now";
  if (hours < 18) return "same_day_window";
  if (hours < 24) return "evening_before";
  if (hours < 48) return "day_before";
  if (hours <= 72) return "one_to_three_days_before";
  return "not_enough_information";
}

function buildWindowBounds(
  category: PlanningStartWindowCategory,
  currentDate: Date,
  bakeDate: Date,
  hours: number,
): { earliest: Date | null; latest: Date | null } {
  switch (category) {
    case "start_now":
      return {
        earliest: currentDate,
        latest: minDate(addHours(currentDate, 1), bakeDate),
      };
    case "same_day_window":
      return {
        earliest: maxDate(currentDate, addHours(bakeDate, -12)),
        latest: maxDate(currentDate, addHours(bakeDate, -6)),
      };
    case "evening_before":
      return {
        earliest: maxDate(currentDate, addHours(bakeDate, -18)),
        latest: maxDate(currentDate, addHours(bakeDate, -12)),
      };
    case "day_before":
      return {
        earliest: maxDate(currentDate, addHours(bakeDate, -36)),
        latest: maxDate(currentDate, addHours(bakeDate, -18)),
      };
    case "one_to_three_days_before":
      return {
        earliest: maxDate(currentDate, addHours(bakeDate, -72)),
        latest: maxDate(currentDate, addHours(bakeDate, -24)),
      };
    case "too_late":
      return {
        earliest: currentDate,
        latest: hours > 0 ? minDate(addHours(currentDate, Math.max(0.5, hours / 3)), bakeDate) : currentDate,
      };
    case "not_enough_information":
      return { earliest: null, latest: null };
  }
}

function buildSignals(input: {
  category: PlanningStartWindowCategory;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  fermentationSetupRecommendation?: PlanningFermentationSetupRecommendation | null;
  yeastGuidance?: PlanningYeastGuidance | null;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
  roomTemperature: number;
  fridgeTemperature: number;
}): StartWindowSignal[] {
  const signals: StartWindowSignal[] = [];
  const longWindow = input.availableFermentationHours >= 24;
  const coldOrHybrid = input.selectedFermentationMode === "cold"
    || input.selectedFermentationMode === "hybrid"
    || input.recommendedFermentationMode === "cold"
    || input.recommendedFermentationMode === "hybrid";

  if (input.category === "too_late") {
    signals.push({ type: "high_risk", message: "Bake time is very soon, so the start window is already compressed." });
  }

  if (input.category === "not_enough_information") {
    signals.push({ type: "caution", message: "The v1 planner cannot safely derive a start window for this bake target." });
  }

  if (input.selectedFermentationMode === "cold" && input.availableFermentationHours < 8) {
    signals.push({ type: "high_risk", message: "Cold fermentation is selected, but there is not enough time for a reliable cold setup." });
  }

  if (input.selectedFermentationMode === "room" && longWindow && input.roomTemperature >= 25) {
    signals.push({ type: input.roomTemperature >= 28 ? "high_risk" : "caution", message: "A long room-temperature plan may need an earlier or cooler start window." });
  }

  if (coldOrHybrid && longWindow && input.fridgeTemperature > 6) {
    signals.push({ type: input.fridgeTemperature >= 8 ? "high_risk" : "caution", message: "Warm fridge temperature may shorten the safe cold or hybrid start window." });
  }

  if (input.fermentationSetupRecommendation?.riskLevel === "high_risk" || input.fermentationSetupRecommendation?.riskLevel === "not_recommended") {
    signals.push({ type: "high_risk", message: "The fermentation setup recommendation is high risk, so the start window is less reliable." });
  } else if (input.fermentationSetupRecommendation?.riskLevel === "caution") {
    signals.push({ type: "caution", message: "The fermentation setup recommendation has cautions that affect the start window." });
  }

  if (input.yeastGuidance?.riskLevel === "high_risk") {
    signals.push({ type: "high_risk", message: "Yeast guidance is high risk, so the dough may move faster or slower than the broad window suggests." });
  } else if (input.yeastGuidance?.riskLevel === "caution") {
    signals.push({ type: "caution", message: "Yeast guidance has cautions that may shift the practical start window." });
  }

  if (input.flourGuidance?.riskLevel === "high_risk") {
    signals.push({ type: "caution", message: "Flour guidance is high risk, so dough strength may narrow the useful window." });
  }

  if (input.doughTypeGuidance?.riskLevel === "high_risk") {
    signals.push({ type: "high_risk", message: "Dough style guidance is high risk for this timing." });
  } else if (input.doughTypeGuidance?.riskLevel === "caution") {
    signals.push({ type: "caution", message: "Dough style guidance has cautions for this timing." });
  }

  return signals;
}

function chooseRiskLevel(
  category: PlanningStartWindowCategory,
  signals: StartWindowSignal[],
): PlanningStartWindowFitLevel {
  if (category === "not_enough_information") return "not_enough_information";
  if (signals.some((signal) => signal.type === "high_risk")) return "high_risk";
  if (signals.some((signal) => signal.type === "caution")) return "caution";
  return "workable";
}

function chooseFitLevel(input: {
  category: PlanningStartWindowCategory;
  riskLevel: PlanningStartWindowFitLevel;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
}): PlanningStartWindowFitLevel {
  if (input.riskLevel === "not_enough_information" || input.riskLevel === "high_risk") return input.riskLevel;
  if (input.riskLevel === "caution") return "caution";
  if (input.category === "too_late") return "high_risk";
  if (!input.selectedFermentationMode) return "workable";
  if (input.selectedFermentationMode === input.recommendedFermentationMode) return "good_fit";
  if (
    (input.selectedFermentationMode === "cold" && input.recommendedFermentationMode === "hybrid")
    || (input.selectedFermentationMode === "hybrid" && input.recommendedFermentationMode === "cold")
  ) {
    return "workable";
  }
  return "caution";
}

function buildSummary(input: {
  category: PlanningStartWindowCategory;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  riskLevel: PlanningStartWindowFitLevel;
}): string {
  const hours = `${input.availableFermentationHours} h`;

  if (input.category === "not_enough_information") {
    return "DoughTools needs a valid bake target before it can suggest a broad start window.";
  }

  if (input.category === "too_late") {
    return `There is about ${hours} before baking. Start now if you continue, but fermentation may be rushed.`;
  }

  const selected = input.selectedFermentationMode
    ? ` Selected setup is ${input.selectedFermentationMode.replaceAll("_", " ")}.`
    : "";

  return `There is about ${hours} before baking. ${relativeRecommendation(input.category)}${selected} This is a broad calculator recommendation, not a fixed workflow.`;
}

function buildSuggestedAdjustments(input: {
  category: PlanningStartWindowCategory;
  riskLevel: PlanningStartWindowFitLevel;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  fridgeTemperature: number;
  roomTemperature: number;
  yeastGuidance?: PlanningYeastGuidance | null;
}): string[] {
  const adjustments: string[] = [];

  if (input.category === "too_late") {
    adjustments.push("Start now or choose a later bake target for a more reliable dough.");
  }

  if (input.selectedFermentationMode === "cold" && (input.category === "too_late" || input.category === "start_now")) {
    adjustments.push("Switch toward a room-temperature same-day setup or move the bake time later.");
  }

  if (input.selectedFermentationMode && input.recommendedFermentationMode !== "not_recommended" && input.selectedFermentationMode !== input.recommendedFermentationMode) {
    adjustments.push(`Consider aligning the selected setup closer to ${input.recommendedFermentationMode.replaceAll("_", " ")}.`);
  }

  if (input.fridgeTemperature > 6) {
    adjustments.push("Use a colder fridge or avoid stretching the cold window too far.");
  }

  if (input.roomTemperature >= 25) {
    adjustments.push("Use a cooler room or shorten room-temperature time.");
  }

  if (input.yeastGuidance?.riskLevel === "high_risk") {
    adjustments.push("Review yeast amount/type before relying on this start window.");
  }

  if (adjustments.length === 0) {
    adjustments.push("Use this broad window, then judge dough condition instead of following the clock blindly.");
  }

  return adjustments;
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  category: PlanningStartWindowCategory;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  earliest: Date | null;
  latest: Date | null;
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  return [
    "Pizza Nerd note: start window v1 derives a broad start range from bake target, available hours, selected/recommended fermentation mode and existing risk guidance.",
    `Category: ${input.category}.`,
    `Available time: ${input.availableFermentationHours} h.`,
    `Selected mode: ${input.selectedFermentationMode ?? "not selected"}.`,
    `Recommended mode: ${input.recommendedFermentationMode}.`,
    `Earliest: ${input.earliest?.toISOString() ?? "not derived"}.`,
    `Latest: ${input.latest?.toISOString() ?? "not derived"}.`,
  ].join(" ");
}

function startWindowLabel(category: PlanningStartWindowCategory): string {
  switch (category) {
    case "start_now":
      return "Start now";
    case "same_day_window":
      return "Same-day start window";
    case "evening_before":
      return "Evening-before window";
    case "day_before":
      return "Day-before window";
    case "one_to_three_days_before":
      return "One to three days before";
    case "too_late":
      return "Start now, but timing is tight";
    case "not_enough_information":
      return "Start window not available";
  }
}

function relativeRecommendation(category: PlanningStartWindowCategory): string {
  switch (category) {
    case "start_now":
      return "Start now and keep the plan simple.";
    case "same_day_window":
      return "Start earlier the same day.";
    case "evening_before":
      return "Start the evening before or early enough to allow a controlled room plan.";
    case "day_before":
      return "Start around the day before baking.";
    case "one_to_three_days_before":
      return "Start one to three days before baking for a cold or hybrid-friendly window.";
    case "too_late":
      return "Start immediately if you continue.";
    case "not_enough_information":
      return "Set a valid bake date and time first.";
  }
}

function validDateOrNull(date: Date): Date | null {
  return Number.isFinite(date.getTime()) ? date : null;
}

function normalizeHours(hours: number): number {
  if (!Number.isFinite(hours) || hours < 0) return 0;
  return Number(hours.toFixed(1));
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

function maxDate(first: Date, second: Date): Date {
  return first.getTime() >= second.getTime() ? first : second;
}

function minDate(first: Date, second: Date): Date {
  return first.getTime() <= second.getTime() ? first : second;
}
