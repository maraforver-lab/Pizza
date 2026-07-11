import type { DoughGuideStepId } from "@/lib/dough-guide";
import type { PizzaSession, PizzaSessionTimelineStep } from "@/lib/pizza-session";
import type { ExperienceLevel } from "@/lib/experience-levels";
import type { SessionFlourWGuidance } from "@/lib/session-flour-w-guidance";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { yeastTypeLabel } from "@/lib/yeast-types";

export type DoughGuideFermentationType = "room" | "cold";

export type DoughGuideFact = {
  label: string;
  value: string;
};

export type DoughGuideFlourContext = {
  flourName?: string;
  flourW?: string;
  recommendationLabel?: string;
  compatibilityLabel?: string;
  compatibilityCategory?: SessionFlourWGuidance["fitLevel"];
  status?: SessionFlourWGuidance["status"];
  availableFlourSummary?: string;
  recommendedBuySummary?: string;
  recommendationReason?: string;
  caution?: string;
  fermentationHours?: number;
  fermentationType?: DoughGuideFermentationType;
  hydrationPercent?: number;
};

export type DoughGuideFlourGuidance = {
  heading: string;
  facts: DoughGuideFact[];
  explanation: string;
  payAttentionTo: string[];
  levelDetails: string[];
  caution?: string;
};

export type DoughGuideSessionContext = {
  hasActiveSession: boolean;
  pizzaCount?: number;
  doughBallCount?: number;
  doughBallWeightGrams?: number;
  totalDoughWeightGrams?: number;
  flourGrams?: number;
  waterGrams?: number;
  saltGrams?: number;
  yeastGrams?: number;
  yeastTypeLabel?: string;
  hydrationPercent?: number;
  flourName?: string;
  flourW?: string;
  fermentationType?: DoughGuideFermentationType;
  totalFermentationHours?: number;
  fermentationLabel?: string;
  fermentationTemperatureCelsius?: number;
  roomTemperatureCelsius?: number;
  coldTemperatureCelsius?: number;
  restDurationLabel?: string;
  roomTemperatureFinishLabel?: string;
  bulkScheduledAtLabel?: string;
  bakeTargetLabel?: string;
  flourContext?: DoughGuideFlourContext;
  summaryRows: DoughGuideFact[];
  ingredientRows: DoughGuideFact[];
};

const flourLabels: Record<string, string> = {
  plain: "All-purpose flour",
  bread: "Bread flour / strong flour",
  "tipo-00": "Pizza flour / Tipo 00",
  "not-sure": "Flour not specified",
  "caputo-classica": "Caputo Classica",
  "caputo-pizzeria": "Caputo Pizzeria",
  "caputo-nuvola": "Caputo Nuvola",
  "caputo-nuvola-super": "Caputo Nuvola Super",
  "caputo-manitoba": "Caputo Manitoba Oro",
  "caputo-cuoco": "Caputo Cuoco",
};

function finitePositive(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function formatGram(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  if (value < 10) return `${value.toFixed(2)} g`;
  return `${Math.round(value)} g`;
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}%`;
}

function formatHours(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return undefined;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} h`;
}

function formatTemperature(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < -5 || value > 45) return undefined;
  return `${Math.round(value * 10) / 10}°C`;
}

function formatDateTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function durationBetween(start?: string, end?: string) {
  if (!start || !end) return undefined;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return undefined;
  const hours = (endDate.getTime() - startDate.getTime()) / 3_600_000;
  return formatHours(hours);
}

function findStep(steps: PizzaSessionTimelineStep[] | undefined, ids: string[]) {
  return steps?.find((step) => ids.includes(step.id));
}

function addFact(rows: DoughGuideFact[], label: string, value?: string) {
  if (!value || !value.trim()) return;
  if (/NaN|Infinity|undefined|null/.test(value)) return;
  rows.push({ label, value });
}

function selectedFlourName(session: PizzaSession, snapshotFlour?: string) {
  const value = session.flour ?? snapshotFlour;
  if (!value) return undefined;
  return flourLabels[value] ?? value;
}

function isDisplayableFlourW(value?: string) {
  return Boolean(value && /^W\s/.test(value));
}

function planKind(context: DoughGuideFlourContext) {
  const hours = context.fermentationHours;
  if (typeof hours !== "number" || !Number.isFinite(hours)) return "unknown";
  if (hours < 24) return "short";
  if (hours >= 72) return "extended";
  return "long";
}

function isKnownCompatibility(context: DoughGuideFlourContext) {
  return context.compatibilityCategory
    && context.compatibilityCategory !== "unknown"
    && context.compatibilityCategory !== "not_enough_information";
}

function guideCompatibilityLabel(fitLevel?: SessionFlourWGuidance["fitLevel"]) {
  if (!fitLevel) return undefined;
  if (fitLevel === "suitable") return "Matches the active plan";
  if (fitLevel === "caution") return "Pay closer attention";
  if (fitLevel === "buy_recommended") return "DoughTools recommends a flour for this plan";
  if (fitLevel === "long_horizon") return "Use the existing long-horizon flour guidance";
  return undefined;
}

export function getDoughGuideSessionContext(
  session: PizzaSession | null | undefined,
  now = new Date(),
): DoughGuideSessionContext {
  if (!session) {
    return {
      hasActiveSession: false,
      summaryRows: [],
      ingredientRows: [],
    };
  }

  const recipe = buildSessionRecipe(session, now);
  const snapshot = recipe.ok ? recipe.recipeSnapshot : session.recipeSnapshot;
  const ingredients = recipe.ok ? recipe.ingredients : undefined;
  const fermentationDisplay = buildSessionFermentationDisplay({
    session,
    snapshot,
    basis: recipe.ok ? recipe.continuousYeast?.recommendation : undefined,
  });
  const timelineSteps = session.timeline?.steps;
  const mixStep = findStep(timelineSteps, ["mix-dough"]);
  const restStep = findStep(timelineSteps, ["rest-dough"]);
  const fermentStep = findStep(timelineSteps, ["cold-ferment", "room-ferment", "ferment-dough"]);
  const roomRestStep = findStep(timelineSteps, ["room-temperature-rest"]);
  const bakeStep = findStep(timelineSteps, ["bake-pizza"]);

  const doughBallCount = finitePositive(snapshot?.balls ?? session.pizzaCount);
  const doughBallWeightGrams = finitePositive(snapshot?.ballWeight ?? session.doughBallWeight);
  const hydrationPercent = finitePositive(snapshot?.hydration ?? session.hydrationPercentOverride);
  const totalDoughWeightGrams = finitePositive(snapshot?.totalDough ?? ingredients?.total);
  const flourGrams = finitePositive(snapshot?.flourAmount ?? ingredients?.flour);
  const waterGrams = finitePositive(snapshot?.waterAmount ?? ingredients?.water);
  const saltGrams = finitePositive(snapshot?.saltAmount ?? ingredients?.salt);
  const yeastGrams = finitePositive(snapshot?.leavenerAmount ?? ingredients?.leavener);
  const yeastLabel = snapshot?.yeastType || session.yeastType ? yeastTypeLabel(snapshot?.yeastType ?? session.yeastType) : undefined;
  const fermentationType = fermentationDisplay.mode;
  const fermentationTemperatureCelsius = finiteNumber(fermentationDisplay.temperatureC);
  const flourName = selectedFlourName(session, snapshot?.flour);
  const flourW = recipe.ok && isDisplayableFlourW(recipe.flourWGuidance?.recommendationLabel)
    ? recipe.flourWGuidance?.recommendationLabel
    : undefined;
  const totalFermentationHours = finitePositive(fermentationDisplay.durationHours);
  const roomTemperatureFinishLabel = durationBetween(roomRestStep?.scheduledAt, bakeStep?.scheduledAt);

  const summaryRows: DoughGuideFact[] = [];
  if (doughBallCount && doughBallWeightGrams) {
    addFact(summaryRows, "Dough balls", `${Math.round(doughBallCount)} × ${Math.round(doughBallWeightGrams)} g`);
  } else {
    addFact(summaryRows, "Dough balls", doughBallCount ? `${Math.round(doughBallCount)} pieces` : undefined);
    addFact(summaryRows, "Dough-ball weight", formatGram(doughBallWeightGrams));
  }
  addFact(summaryRows, "Hydration", formatPercent(hydrationPercent));
  addFact(summaryRows, "Flour", flourName);
  addFact(summaryRows, "Flour strength", flourW);
  addFact(summaryRows, "Yeast", yeastGrams && yeastLabel ? `${formatGram(yeastGrams)} ${yeastLabel}` : undefined);
  addFact(summaryRows, "Fermentation", fermentationDisplay.mode && totalFermentationHours ? fermentationDisplay.label : undefined);
  if (fermentationType === "cold") addFact(summaryRows, "Cold temperature", formatTemperature(fermentationTemperatureCelsius));
  if (fermentationType === "room") addFact(summaryRows, "Room temperature", formatTemperature(fermentationTemperatureCelsius));
  if (fermentationType === "cold") addFact(summaryRows, "Room-temperature finish", roomTemperatureFinishLabel);

  const ingredientRows: DoughGuideFact[] = [];
  addFact(ingredientRows, "Flour", formatGram(flourGrams));
  addFact(ingredientRows, "Water", formatGram(waterGrams));
  addFact(ingredientRows, "Salt", formatGram(saltGrams));
  addFact(ingredientRows, yeastLabel ? `Yeast — ${yeastLabel}` : "Yeast", formatGram(yeastGrams));
  addFact(ingredientRows, "Total dough", formatGram(totalDoughWeightGrams));

  const flourContext: DoughGuideFlourContext | undefined = recipe.ok && recipe.flourWGuidance
    ? {
      flourName,
      flourW,
      recommendationLabel: recipe.flourWGuidance.recommendationLabel,
      compatibilityLabel: guideCompatibilityLabel(recipe.flourWGuidance.fitLevel),
      compatibilityCategory: recipe.flourWGuidance.fitLevel,
      status: recipe.flourWGuidance.status,
      availableFlourSummary: recipe.flourWGuidance.availableFlourSummary,
      recommendedBuySummary: recipe.flourWGuidance.recommendedBuySummary,
      recommendationReason: recipe.flourWGuidance.summary,
      caution: recipe.flourWGuidance.cautions[0],
      fermentationHours: totalFermentationHours,
      fermentationType,
      hydrationPercent,
    }
    : flourName || flourW
      ? {
        flourName,
        flourW,
        fermentationHours: totalFermentationHours,
        fermentationType,
        hydrationPercent,
      }
      : undefined;

  return {
    hasActiveSession: true,
    pizzaCount: finitePositive(session.pizzaCount),
    doughBallCount,
    doughBallWeightGrams,
    totalDoughWeightGrams,
    flourGrams,
    waterGrams,
    saltGrams,
    yeastGrams,
    yeastTypeLabel: yeastLabel,
    hydrationPercent,
    flourName,
    flourW,
    fermentationType,
    totalFermentationHours,
    fermentationLabel: fermentationDisplay.mode && totalFermentationHours ? fermentationDisplay.label : undefined,
    fermentationTemperatureCelsius,
    roomTemperatureCelsius: fermentationType === "room" ? fermentationTemperatureCelsius : undefined,
    coldTemperatureCelsius: fermentationType === "cold" ? fermentationTemperatureCelsius : undefined,
    restDurationLabel: durationBetween(mixStep?.scheduledAt, restStep?.scheduledAt),
    roomTemperatureFinishLabel,
    bulkScheduledAtLabel: formatDateTime(fermentStep?.scheduledAt),
    bakeTargetLabel: formatDateTime(session.timeline?.targetEatTime ?? session.targetEatTime ?? session.targetBakeTime),
    flourContext,
    summaryRows,
    ingredientRows,
  };
}

export function getDoughGuideFlourGuidance(
  context: DoughGuideFlourContext | undefined,
  level: ExperienceLevel,
): DoughGuideFlourGuidance | undefined {
  if (!context || (!context.flourName && !context.flourW && !context.recommendationLabel && !context.compatibilityLabel)) {
    return undefined;
  }

  const kind = planKind(context);
  const facts: DoughGuideFact[] = [];
  addFact(facts, "Flour", context.flourName);
  addFact(facts, "Flour strength", context.flourW ?? context.recommendationLabel);
  addFact(facts, "Fit", context.compatibilityLabel);
  addFact(facts, "Fermentation", context.fermentationHours && context.fermentationType
    ? `${formatHours(context.fermentationHours)} ${context.fermentationType} fermentation`
    : undefined);

  const compatible = context.compatibilityCategory === "suitable";
  const caution = context.compatibilityCategory === "caution" ? "Pay closer attention" : context.compatibilityLabel;
  const unknown = !isKnownCompatibility(context);

  const explanation = unknown
    ? "Flour-specific fit is not fully available for this dough plan. Use the dough’s behavior as your guide: whether it holds shape, develops gas, relaxes and stretches without tearing."
    : compatible
      ? "This flour is within the range DoughTools uses for the active fermentation plan. It still needs normal dough-condition checks before opening."
      : context.compatibilityCategory === "buy_recommended"
        ? "DoughTools is using its existing recommendation for this plan. Treat the recommendation as guidance for flour choice, not as a change to the dough formula."
        : context.compatibilityCategory === "long_horizon"
          ? "DoughTools uses the existing 24h / 48h / 72h long-horizon flour guidance for this plan instead of inventing a new full-window flour target."
          : "The existing DoughTools flour guidance asks for closer attention on this plan. The Guide does not change the recipe; it highlights what to observe.";

  const payAttentionTo = kind === "short"
    ? [
      "dough balls beginning to spread",
      "increasing stickiness late in fermentation",
      "fragile surface or tearing during handling",
      "extending the process beyond the active plan",
    ]
    : [
      "strong spring-back",
      "insufficient relaxation",
      "unnecessary additional mixing",
      "forcing the dough during handling",
    ];

  const levelDetails = level === "pizza_nerd"
    ? [
      "W is an alveographic strength indicator, but it is not the same thing as protein percentage.",
      "P/L balance, water absorption, mixing tolerance and fermentation tolerance can differ between flours with similar W labels.",
      context.hydrationPercent ? `At ${formatPercent(context.hydrationPercent)} hydration, evaluate both gas retention and extensibility before opening.` : "Use hydration as context, not as a Guide-only flour classification.",
    ]
    : level === "enthusiast"
      ? [
        kind === "short"
          ? "Shorter-process flour can become usable sooner, but it may lose structure faster if the process is pushed beyond the plan."
          : "Long-process flour can tolerate a more demanding plan, but it may stay tight until it has rested and fermented sufficiently.",
        "Use the clock as a prompt to check the dough, not as the only readiness signal.",
      ]
      : [
        kind === "short"
          ? "Follow the active plan and check that the dough balls still hold their shape."
          : "Give the dough enough planned rest before forcing it open.",
        "If the dough feels wrong, slow down and use the readiness checks.",
      ];

  return {
    heading: "For your flour",
    facts,
    explanation,
    payAttentionTo,
    levelDetails,
    caution: context.compatibilityCategory === "caution" ? (context.caution ?? caution) : undefined,
  };
}

export function getDoughGuideStepFlourGuidance(
  stepId: DoughGuideStepId,
  flourContext: DoughGuideFlourContext | undefined,
): DoughGuideFact[] {
  if (!flourContext || !isKnownCompatibility(flourContext)) return [];
  const kind = planKind(flourContext);
  const rows: DoughGuideFact[] = [];

  if (stepId === "measure") {
    addFact(rows, "Flour reminder", "Use the calculated ingredient quantities. Do not change water or flour from this Guide.");
  }
  if (stepId === "mix-dough") {
    addFact(rows, "Flour handling", kind === "short"
      ? "Avoid unnecessary prolonged mixing once the dough has the required structure."
      : "Strong dough may initially feel resistant; rest can help more than extra mixing.");
  }
  if (stepId === "rest-dough") {
    addFact(rows, "Rest cue", kind === "short"
      ? "Let the planned rest happen before adding bench flour for stickiness."
      : "Rest can help a tight dough become more extensible before more development.");
  }
  if (stepId === "develop-dough") {
    addFact(rows, "Development cue", kind === "short"
      ? "Use controlled development and stop if the dough begins losing cohesion."
      : "Distinguish flour strength from readiness; avoid making the dough unnecessarily tight.");
  }
  if (stepId === "bulk-ferment") {
    addFact(rows, "Flour watch", kind === "short"
      ? "Watch for flattening, spreading and increased stickiness."
      : "Expect better tolerance for the planned process, but still verify gas development and relaxation.");
  }
  if (stepId === "divide-dough") {
    addFact(rows, "Dividing cue", kind === "short"
      ? "Handle gently if the dough is already soft and complete weight corrections before final balling."
      : "If pieces resist rounding, use the planned rest rather than forcing the dough.");
  }
  if (stepId === "ball-dough") {
    addFact(rows, "Balling cue", kind === "short"
      ? "Create only enough tension for a cohesive ball and monitor rapid spreading."
      : "Avoid excessive tightening; persistent spring-back can mean the dough needs more relaxation.");
  }
  if (stepId === "proof-dough-balls") {
    addFact(rows, "Proof cue", kind === "short"
      ? "Watch for loss of height, spreading, fragile skin and excessive stickiness."
      : "Watch for persistent tightness, limited relaxation and insufficient gas development.");
  }
  if (stepId === "warm-dough") {
    addFact(rows, "Working-temperature cue", kind === "short"
      ? "Do not leave the dough warm unnecessarily if it is already loose and ready."
      : "Make sure the planned final relaxation has happened; use dough condition as well as time.");
  }
  if (stepId === "check-readiness") {
    addFact(rows, "Flour readiness cue", kind === "short"
      ? "Rapid spreading, weak surface and tearing can point to loss of structure."
      : "Strong spring-back, tight structure and resistance to opening can point to insufficient relaxation.");
  }
  if (stepId === "release-dough-ball") {
    addFact(rows, "Release cue", kind === "short"
      ? "Support soft dough with the scraper and avoid stretching it during release."
      : "If the dough still resists, return to condition-based readiness checks instead of forcing it.");
  }

  return rows;
}

export function getDoughGuideStepPersonalization(
  stepId: DoughGuideStepId,
  context: DoughGuideSessionContext,
): DoughGuideFact[] {
  if (!context.hasActiveSession) return [];

  const rows: DoughGuideFact[] = [];
  const ballWeight = formatGram(context.doughBallWeightGrams);
  const ballCount = context.doughBallCount ? `${Math.round(context.doughBallCount)}` : undefined;
  const hydration = formatPercent(context.hydrationPercent);
  const fermentation = context.fermentationLabel;
  const temperature = formatTemperature(context.fermentationTemperatureCelsius);

  if (stepId === "prepare") {
    addFact(rows, "Session setup", context.doughBallCount && context.doughBallCount > 1 ? `${Math.round(context.doughBallCount)} covered dough-ball spaces needed` : undefined);
    addFact(rows, "Fermentation storage", context.fermentationType === "cold" ? "Use covered refrigerator-safe storage for the cold phase." : undefined);
    addFact(rows, "Yeast precision", context.yeastGrams && context.yeastGrams < 1 ? "Use an accurate scale for the small yeast amount." : undefined);
  }

  if (stepId === "measure") {
    rows.push(...context.ingredientRows);
  }

  if (stepId === "mix-dough") {
    addFact(rows, "Hydration", hydration);
    addFact(rows, "Yeast", context.yeastGrams && context.yeastTypeLabel ? `${formatGram(context.yeastGrams)} ${context.yeastTypeLabel}` : undefined);
    addFact(rows, "Total dough", formatGram(context.totalDoughWeightGrams));
  }

  if (stepId === "rest-dough") {
    addFact(rows, "Planned rest", context.restDurationLabel);
  }

  if (stepId === "develop-dough") {
    addFact(rows, "Hydration context", hydration ? `${hydration} hydration affects how firm or sticky the dough feels.` : undefined);
  }

  if (stepId === "bulk-ferment") {
    addFact(rows, "Fermentation", fermentation);
    addFact(rows, "Environment", context.fermentationType === "cold" ? "Fridge / cold fermentation" : context.fermentationType === "room" ? "Room-temperature fermentation" : undefined);
    addFact(rows, "Temperature", temperature);
    addFact(rows, "Timeline context", context.bulkScheduledAtLabel);
  }

  if (stepId === "divide-dough") {
    if (ballCount && ballWeight) addFact(rows, "Divide", `Divide into ${ballCount} pieces of ${ballWeight}.`);
    else {
      addFact(rows, "Dough pieces", ballCount ? `${ballCount} pieces` : undefined);
      addFact(rows, "Target weight", ballWeight);
    }
  }

  if (stepId === "ball-dough") {
    addFact(rows, "Target ball weight", ballWeight);
    addFact(rows, "Number of balls", ballCount);
  }

  if (stepId === "proof-dough-balls") {
    addFact(rows, "Plan", fermentation);
    addFact(rows, "Environment", context.fermentationType === "cold" ? "Cold fermentation: keep refrigerator-specific guidance from your dough plan." : context.fermentationType === "room" ? "Room-temperature proof: no refrigerator step is needed." : undefined);
    addFact(rows, "Temperature", temperature);
  }

  if (stepId === "warm-dough") {
    if (context.fermentationType === "cold") {
      addFact(rows, "Room-temperature finish", context.roomTemperatureFinishLabel);
      addFact(rows, "Timeline reminder", "Move the dough from the refrigerator according to your Timeline.");
    }
    if (context.fermentationType === "room") {
      addFact(rows, "Room-temperature plan", "Keep following the room-temperature proof in your plan.");
      addFact(rows, "Temperature", temperature);
    }
  }

  if (stepId === "check-readiness") {
    addFact(rows, "Plan timing", fermentation);
    addFact(rows, "Bake target", context.bakeTargetLabel);
    addFact(rows, "Reminder", "Use the schedule as a guide, then check the dough condition before opening.");
  }

  if (stepId === "release-dough-ball") {
    addFact(rows, "Dough ball", ballWeight ? `Release one ${ballWeight} dough ball gently.` : undefined);
  }

  return rows;
}
