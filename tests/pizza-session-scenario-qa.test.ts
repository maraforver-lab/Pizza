import { describe, expect, it } from "vitest";
import { calculateContinuousYeastRecommendation } from "@/lib/continuous-yeast-model";
import { createPizzaSession, type PizzaSession } from "@/lib/pizza-session";
import { generatePizzaSessionTimeline } from "@/lib/pizza-session-timeline";
import { timelineStepsForPlanningSummaryDisplay } from "@/lib/pizza-session-timeline-display";
import { buildSessionRecipe } from "@/lib/session-recipe";

const baseSession = {
  status: "planning" as const,
  currentStep: "recipe" as const,
  experienceLevel: "enthusiast" as const,
  pizzaStyle: "home-oven",
  pizzaPreset: "margherita",
  pizzaCount: 4,
  ovenType: "home",
  flour: "tipo-00",
};

function buildScenario(input: Partial<PizzaSession>, now: Date) {
  const session = createPizzaSession({
    ...baseSession,
    ...input,
  }, now);
  const recipe = buildSessionRecipe(session, now);
  expect(recipe.ok).toBe(true);
  if (!recipe.ok || !recipe.planningInfo.ok) throw new Error(`Expected recipe and planning info for ${session.id}`);

  const generated = generatePizzaSessionTimeline(session, now);
  expect(generated.ok).toBe(true);
  if (!generated.timeline) throw new Error(`Expected generated timeline for ${session.id}`);

  const displayedSteps = timelineStepsForPlanningSummaryDisplay({
    steps: generated.timeline.steps,
    planningResult: recipe.planningInfo.result,
    session,
  });

  return { session, recipe, generatedTimeline: generated.timeline, displayedSteps };
}

function stepTime(steps: Array<{ id: string; scheduledAt?: string }>, id: string) {
  const value = steps.find((step) => step.id === id)?.scheduledAt;
  if (!value) throw new Error(`Expected ${id} to have a scheduled time`);
  return value;
}

describe("Pizza Session scenario QA", () => {
  it("keeps same-day room planning aligned across Dough Plan and Timeline", () => {
    const now = new Date("2026-07-02T14:00:00");
    const { recipe, displayedSteps } = buildScenario({
      id: "qa-same-day-room",
      pizzaStyle: "pizza-oven",
      ovenType: "gas",
      doughStartMode: "now",
      targetEatTime: "2026-07-02T20:00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_220_260"],
    }, now);

    expect(recipe.planningInfo.result.availableFermentationHours).toBe(6);
    expect(recipe.planningInfo.result.fermentationSetupRecommendation?.recommendedFermentationMode).toBe("room");
    expect(recipe.continuousYeast?.basisLabel).toBe("6 h room fermentation");
    expect(recipe.flourWGuidance).toMatchObject({
      recommendationLabel: "W 180–260",
      saferChoiceLabel: "W 220–260",
    });
    expect(displayedSteps.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(stepTime(displayedSteps, "mix-dough")).toBe(now.toISOString());
  });

  it("keeps 24h cold planning cautious and avoids past displayed dough actions", () => {
    const now = new Date("2026-07-02T09:00:00");
    const { recipe, displayedSteps } = buildScenario({
      id: "qa-24h-cold",
      doughStartMode: "now",
      targetEatTime: "2026-07-03T09:00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
    }, now);

    expect(recipe.continuousYeast?.basisLabel).toBe("24 h cold fermentation");
    expect(recipe.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(displayedSteps.some((step) => step.id === "cold-ferment")).toBe(true);
    expect(new Date(stepTime(displayedSteps, "mix-dough")).getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it("uses the actual 40h cold window for yeast and W guidance", () => {
    const now = new Date("2026-07-02T20:00:00");
    const { recipe, displayedSteps } = buildScenario({
      id: "qa-40h-cold",
      doughStartMode: "now",
      targetEatTime: "2026-07-04T12:00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
    }, now);

    const twentyFourHour = calculateContinuousYeastRecommendation({
      flourGrams: recipe.ingredients.flour,
      fermentationHours: 24,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });
    const fortyEightHour = calculateContinuousYeastRecommendation({
      flourGrams: recipe.ingredients.flour,
      fermentationHours: 48,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });

    expect(recipe.continuousYeast?.basisLabel).toBe("40 h cold fermentation");
    expect(recipe.ingredients.leavener).toBeLessThan(twentyFourHour.yeastAmountGrams ?? 0);
    expect(recipe.ingredients.leavener).toBeGreaterThan(fortyEightHour.yeastAmountGrams ?? 0);
    expect(recipe.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(stepTime(displayedSteps, "mix-dough")).toBe(now.toISOString());
  });

  it("uses later dough start availability for Dough Plan yeast, W guidance and Timeline display", () => {
    const now = new Date("2026-07-02T09:00:00");
    const laterStart = new Date("2026-07-03T09:00:00");
    const { recipe, displayedSteps } = buildScenario({
      id: "qa-later-start",
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-03T09:00",
      targetEatTime: "2026-07-04T21:00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
    }, now);

    expect(recipe.planningInfo.result.availableFermentationHours).toBe(60);
    expect(recipe.continuousYeast?.basisLabel).toBe("36 h cold fermentation");
    expect(recipe.flourWGuidance?.summary).toContain("36 h cold fermentation");
    expect(stepTime(displayedSteps, "mix-dough")).toBe(laterStart.toISOString());
  });

  it("keeps 72h cold direct scaling cautionary with stronger W guidance", () => {
    const now = new Date("2026-07-02T09:00:00");
    const { recipe } = buildScenario({
      id: "qa-72h-cold",
      doughStartMode: "now",
      targetEatTime: "2026-07-05T09:00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_300_340"],
    }, now);

    const fortyEightHour = calculateContinuousYeastRecommendation({
      flourGrams: recipe.ingredients.flour,
      fermentationHours: 48,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });

    expect(recipe.continuousYeast?.basisLabel).toBe("72 h cold fermentation");
    expect(recipe.continuousYeast?.recommendation.riskLevel).toBe("caution");
    expect(recipe.ingredients.leavener).toBeLessThan(fortyEightHour.yeastAmountGrams ?? 0);
    expect(recipe.flourWGuidance?.recommendationLabel).toBe("W 300–340");
  });

  it("keeps over-72h targets in long-horizon planning instead of full-horizon yeast or W guidance", () => {
    const now = new Date("2026-07-02T09:00:00");
    const { recipe } = buildScenario({
      id: "qa-long-horizon",
      doughStartMode: "now",
      targetEatTime: "2026-07-10T09:00",
      flourSituation: "recommend",
    }, now);

    expect(recipe.continuousYeast?.appliedToIngredients).toBe(false);
    expect(recipe.continuousYeast?.recommendation.status).toBe("long_horizon_required");
    expect(recipe.continuousYeast?.recommendation.yeastAmountGrams).toBeNull();
    expect(recipe.flourWGuidance).toMatchObject({
      status: "long_horizon",
      recommendationLabel: "Use the 24h / 48h / 72h long-horizon options",
    });
  });

  it("keeps temperature variation cautionary and monotonic in the isolated continuous yeast helper", () => {
    const normalRoom = calculateContinuousYeastRecommendation({
      flourGrams: 600,
      fermentationHours: 12,
      fermentationMode: "room",
      temperatureC: 22,
      yeastType: "instant_dry_yeast",
    });
    const warmRoom = calculateContinuousYeastRecommendation({
      flourGrams: 600,
      fermentationHours: 12,
      fermentationMode: "room",
      temperatureC: 27,
      yeastType: "instant_dry_yeast",
    });
    const warmFridge = calculateContinuousYeastRecommendation({
      flourGrams: 600,
      fermentationHours: 48,
      fermentationMode: "cold",
      temperatureC: 8,
      yeastType: "instant_dry_yeast",
    });

    expect(warmRoom.yeastAmountGrams ?? 0).toBeLessThan(normalRoom.yeastAmountGrams ?? 0);
    expect(warmRoom.cautions.join(" ")).toContain("Warm room temperature");
    expect(warmFridge.riskLevel).toBe("high_risk");
    expect(warmFridge.cautions.join(" ")).toContain("Warm fridge temperature");
  });
});
