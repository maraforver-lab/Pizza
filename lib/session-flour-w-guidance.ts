import type { PizzaSessionFlourSituation, PizzaSessionFlourWRange } from "@/lib/pizza-session";

export type SessionFlourWGuidanceInput = {
  fermentationHours: number | null;
  fermentationMode: "room" | "cold" | null;
  flourSituation?: PizzaSessionFlourSituation;
  availableFlourWRanges?: PizzaSessionFlourWRange[];
  selectedFlourLabel: string;
};

export type SessionFlourWGuidance = {
  status: "ok" | "long_horizon" | "not_enough_information";
  title: string;
  recommendationLabel: string;
  saferChoiceLabel?: string;
  availableFlourLabel: string;
  fitLevel: "suitable" | "caution" | "buy_recommended" | "unknown" | "long_horizon" | "not_enough_information";
  summary: string;
  availableFlourSummary: string;
  recommendedBuySummary: string;
  cautions: string[];
};

const W_RANGE_LABELS: Record<PizzaSessionFlourWRange, string> = {
  w_180_220: "W 180–220",
  w_220_260: "W 220–260",
  w_260_300: "W 260–300",
  w_300_340: "W 300–340",
  w_340_plus: "W 340+",
};

type WindowRecommendation = {
  recommendationLabel: string;
  saferChoiceLabel?: string;
  idealRanges: PizzaSessionFlourWRange[];
  workableRanges: PizzaSessionFlourWRange[];
  buySummary: string;
  cautions: string[];
};

export function buildSessionFlourWGuidance(input: SessionFlourWGuidanceInput): SessionFlourWGuidance {
  if (
    input.fermentationHours === null
    || !Number.isFinite(input.fermentationHours)
    || input.fermentationHours <= 0
    || !input.fermentationMode
  ) {
    return {
      status: "not_enough_information",
      title: "Recommended flour strength needs timing",
      recommendationLabel: "Add bake timing for W-value guidance",
      availableFlourLabel: availableFlourLabel(input),
      fitLevel: "not_enough_information",
      summary: "DoughTools needs a valid dough start and bake target before recommending a W-value range.",
      availableFlourSummary: availableFlourSummary(input),
      recommendedBuySummary: "Set the bake time first, then choose or buy flour by the recommended W-value range.",
      cautions: ["W-value guidance is not changing the recipe formula."],
    };
  }

  if (input.fermentationHours > 72) {
    return {
      status: "long_horizon",
      title: "Use flour guidance for the shorter start plan",
      recommendationLabel: "Use the 24h / 48h / 72h long-horizon options",
      availableFlourLabel: availableFlourLabel(input),
      fitLevel: "long_horizon",
      summary: `Do not choose flour for a full ${formatHours(input.fermentationHours)} fermentation. Use the 24h / 48h / 72h cold-fermentation plan closer to bake day.`,
      availableFlourSummary: availableFlourSummary(input),
      recommendedBuySummary: "Use the long-horizon start options: 24h around W 220–260, 48h around W 260–300, or 72h around W 300–340.",
      cautions: ["DoughTools is not recommending flour for the full long-horizon fermentation window."],
    };
  }

  const recommendation = recommendationForWindow(input.fermentationHours, input.fermentationMode);
  const selectedRanges = normalizedRanges(input.availableFlourWRanges);
  const availableLabel = availableFlourLabel(input);
  const availableSummary = buildAvailableFitSummary(input, recommendation, selectedRanges);
  const fitLevel = getFitLevel(input, recommendation, selectedRanges);

  return {
    status: "ok",
    title: "Recommended flour strength",
    recommendationLabel: recommendation.recommendationLabel,
    saferChoiceLabel: recommendation.saferChoiceLabel,
    availableFlourLabel: availableLabel,
    fitLevel,
    summary: `Recommended flour strength: ${recommendation.recommendationLabel} for about ${formatHours(input.fermentationHours)} ${input.fermentationMode} fermentation.`,
    availableFlourSummary: availableSummary,
    recommendedBuySummary: recommendation.buySummary,
    cautions: buildCautions(input, recommendation, fitLevel),
  };
}

function recommendationForWindow(hours: number, mode: "room" | "cold"): WindowRecommendation {
  if (mode === "room" && hours <= 8) {
    return {
      recommendationLabel: "W 180–260",
      saferChoiceLabel: "W 220–260",
      idealRanges: ["w_220_260"],
      workableRanges: ["w_180_220"],
      buySummary: "Buy flour around W 220–260 for a safer same-day dough.",
      cautions: ["W 180–220 can work for short same-day dough, but W 220–260 is the safer general recommendation."],
    };
  }

  if (mode === "room" && hours <= 18) {
    return {
      recommendationLabel: "W 220–280",
      saferChoiceLabel: "W 220–260",
      idealRanges: ["w_220_260"],
      workableRanges: ["w_260_300"],
      buySummary: "Buy flour around W 220–260 for this room-temperature plan.",
      cautions: ["For longer room fermentation, watch dough strength and room temperature."],
    };
  }

  if (hours < 24) {
    return {
      recommendationLabel: mode === "room" ? "W 220–260 or W 260–300" : "W 220–260 or W 260–300",
      saferChoiceLabel: mode === "room" ? "W 220–260" : "W 260–300",
      idealRanges: mode === "room" ? ["w_220_260"] : ["w_260_300"],
      workableRanges: mode === "room" ? ["w_260_300"] : ["w_220_260"],
      buySummary: mode === "room"
        ? "Buy flour around W 220–260, or use W 260–300 if the dough needs more strength."
        : "Buy flour around W 260–300 if this is moving toward cold fermentation.",
      cautions: mode === "room"
        ? ["18–24h room fermentation is borderline; keep the dough cooler and watch its condition."]
        : ["This is a borderline window; W 260–300 is the safer cold-fermentation choice."],
    };
  }

  if (hours <= 48) {
    return {
      recommendationLabel: "W 260–300",
      idealRanges: ["w_260_300"],
      workableRanges: [],
      buySummary: "Buy flour around W 260–300 for this cold-fermentation plan.",
      cautions: [],
    };
  }

  return {
    recommendationLabel: "W 300–340",
    idealRanges: ["w_300_340"],
    workableRanges: ["w_340_plus"],
    buySummary: "Buy flour around W 300–340 for this longer cold fermentation.",
    cautions: ["48–72h cold fermentation benefits from stronger flour; weaker flour may lose structure."],
  };
}

function getFitLevel(
  input: SessionFlourWGuidanceInput,
  recommendation: WindowRecommendation,
  ranges: PizzaSessionFlourWRange[],
): SessionFlourWGuidance["fitLevel"] {
  if (input.flourSituation === "recommend") return "buy_recommended";
  if (input.flourSituation === "unknown_w") return "unknown";
  if (ranges.some((range) => recommendation.idealRanges.includes(range))) return "suitable";
  if (ranges.some((range) => recommendation.workableRanges.includes(range))) return "caution";
  if (ranges.length) return "caution";
  return "unknown";
}

function buildAvailableFitSummary(
  input: SessionFlourWGuidanceInput,
  recommendation: WindowRecommendation,
  ranges: PizzaSessionFlourWRange[],
) {
  if (input.flourSituation === "recommend") {
    return `No flour selected: ${recommendation.buySummary}`;
  }

  if (input.flourSituation === "unknown_w") {
    return `W-value unknown. ${recommendation.buySummary} If possible, check the W-value on the flour package.`;
  }

  if (ranges.some((range) => recommendation.idealRanges.includes(range))) {
    return `Available flour: ${formatRanges(ranges)} — suitable for this fermentation window.`;
  }

  if (ranges.some((range) => recommendation.workableRanges.includes(range))) {
    return `Available flour: ${formatRanges(ranges)} — workable with caution for this plan.`;
  }

  if (ranges.length) {
    return `Available flour: ${formatRanges(ranges)} — caution for this fermentation window. ${recommendation.buySummary}`;
  }

  return `Selected flour: ${input.selectedFlourLabel}. W-value was not provided, so ${recommendation.buySummary.toLowerCase()}`;
}

function buildCautions(
  input: SessionFlourWGuidanceInput,
  recommendation: WindowRecommendation,
  fitLevel: SessionFlourWGuidance["fitLevel"],
) {
  const cautions = [...recommendation.cautions];

  if (fitLevel === "caution") {
    cautions.push("Keep the flour you have separate from the recommended W-value range; DoughTools is not changing your selected flour.");
  }

  if (input.flourSituation === "unknown_w") {
    cautions.push("If the package does not show W-value, use the recommendation as buying guidance rather than exact flour science.");
  }

  return cautions;
}

function normalizedRanges(ranges?: PizzaSessionFlourWRange[]) {
  return [...new Set(ranges ?? [])];
}

function availableFlourLabel(input: SessionFlourWGuidanceInput) {
  if (input.flourSituation === "recommend") return "No flour selected — recommend what to buy";
  if (input.flourSituation === "unknown_w") return "Available flour W-value unknown";
  const ranges = normalizedRanges(input.availableFlourWRanges);
  if (ranges.length) return formatRanges(ranges);
  return input.selectedFlourLabel;
}

function availableFlourSummary(input: SessionFlourWGuidanceInput) {
  if (input.flourSituation === "recommend") return "No flour selected yet.";
  if (input.flourSituation === "unknown_w") return "The flour W-value is unknown.";
  const ranges = normalizedRanges(input.availableFlourWRanges);
  if (ranges.length) return `Available flour: ${formatRanges(ranges)}.`;
  return `Selected flour: ${input.selectedFlourLabel}.`;
}

function formatRanges(ranges: PizzaSessionFlourWRange[]) {
  return ranges.map((range) => W_RANGE_LABELS[range]).join(", ");
}

function formatHours(hours: number) {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h`;
}
