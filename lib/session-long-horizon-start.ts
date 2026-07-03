import type { PlanningResult } from "@/lib/planning-result";

export type LongHorizonFermentationOption = {
  durationHours: 24 | 48 | 72;
  label: string;
  startIso: string;
  wValueGuidance: string;
  flourGuidance: string;
  recommendedFlourLabel: string;
  isRecommended: boolean;
};

export type LongHorizonStartRecommendation = {
  status: "long_horizon";
  title: string;
  summary: string;
  recommendedDurationHours: 48;
  recommendedStartIso: string;
  selectedFlourLabel: string;
  recommendedFlourLabel: string;
  recommendedFlourStrengthGuidance: string;
  flourGuidance: string;
  options: LongHorizonFermentationOption[];
};

type LongHorizonStartInput = {
  planningResult?: PlanningResult | null;
  selectedFlourLabel: string;
};

function parseDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function subtractHours(date: Date, hours: number) {
  return new Date(date.getTime() - hours * 60 * 60_000);
}

function optionFlourGuidance(durationHours: 24 | 48 | 72) {
  if (durationHours === 24) {
    const wValueGuidance = "approx. W 220–260";
    return {
      recommendedFlourLabel: "Pizza flour / Tipo 00",
      wValueGuidance,
      flourGuidance: `Pizza flour / Tipo 00 is likely suitable for a 24h cold fermentation (${wValueGuidance}).`,
    };
  }
  if (durationHours === 48) {
    const wValueGuidance = "approx. W 260–300";
    return {
      recommendedFlourLabel: "Bread flour / strong flour",
      wValueGuidance,
      flourGuidance: `For 48h cold fermentation, stronger Tipo 00 or bread flour may be safer (${wValueGuidance}).`,
    };
  }
  const wValueGuidance = "approx. W 300–330+";
  return {
    recommendedFlourLabel: "Strong flour / higher-protein flour",
    wValueGuidance,
    flourGuidance: `For 72h cold fermentation, strong flour or higher-protein flour is recommended (${wValueGuidance}).`,
  };
}

export function buildLongHorizonStartRecommendation({
  planningResult,
  selectedFlourLabel,
}: LongHorizonStartInput): LongHorizonStartRecommendation | null {
  if (!planningResult || planningResult.availableFermentationHours <= 72) return null;

  const target = parseDate(planningResult.technicalDetails.selectedTimeWindow.desiredBakeDateTime);
  const current = parseDate(planningResult.technicalDetails.selectedTimeWindow.currentDateTime);
  if (!target || !current || target.getTime() <= current.getTime()) return null;

  const options = ([24, 48, 72] as const).map((durationHours) => {
    const flour = optionFlourGuidance(durationHours);
    return {
      durationHours,
      label: `${durationHours}h cold fermentation`,
      startIso: subtractHours(target, durationHours).toISOString(),
      wValueGuidance: flour.wValueGuidance,
      flourGuidance: flour.flourGuidance,
      recommendedFlourLabel: flour.recommendedFlourLabel,
      isRecommended: durationHours === 48,
    };
  });
  const recommended = options.find((option) => option.isRecommended) ?? options[1];

  return {
    status: "long_horizon",
    title: "Do not start immediately",
    summary: "Use one of the planned cold-fermentation start times below. Start at the selected option’s start time, not before.",
    recommendedDurationHours: 48,
    recommendedStartIso: recommended.startIso,
    selectedFlourLabel,
    recommendedFlourLabel: recommended.recommendedFlourLabel,
    recommendedFlourStrengthGuidance: "approx. W 260–330+",
    flourGuidance: recommended.flourGuidance,
    options,
  };
}
