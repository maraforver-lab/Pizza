import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { buildPlanningResult, PLANNING_ENGINE_VERSION } from "@/lib/planning-engine";
import {
  getPlanningFlourProfile,
  planningFlourProfiles,
  resolvePlanningFlourProfile,
} from "@/lib/planning-flour-profiles";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { FERMENTATION_MODES, OVEN_TYPES, USER_LEVELS, type FlourSelection } from "@/lib/planning-types";
import {
  ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR,
  INSTANT_DRY_YEAST_FROM_FRESH_FACTOR,
} from "@/lib/planning-yeast-model";
import { PLANNING_MIXING_METHODS, buildPlanningMixingGuidance } from "@/lib/planning-mixing-guidance";
import { baseSettings } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const basePlanningInput: PlanningInput = {
  currentDateTime: new Date("2026-06-30T09:00:00.000Z"),
  desiredBakeDateTime: new Date("2026-07-01T21:00:00.000Z"),
  userLevel: "enthusiast",
  ovenType: "pizza_oven",
  roomTemperature: 22,
  fridgeTemperature: 4,
  flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
  doughBallCount: 6,
  doughBallWeight: 260,
};

function planningInputWithHours(
  hours: number,
  overrides: Partial<PlanningInput> = {},
): PlanningInput {
  const currentDateTime = overrides.currentDateTime ?? basePlanningInput.currentDateTime;
  return {
    ...basePlanningInput,
    ...overrides,
    currentDateTime,
    desiredBakeDateTime: overrides.desiredBakeDateTime
      ?? new Date(currentDateTime.getTime() + hours * 3_600_000),
  };
}

describe("Planning Engine fermentation rules v1", () => {
  it("defines the supported v1 planning domain values", () => {
    expect(USER_LEVELS).toEqual(["beginner", "enthusiast", "pizza_nerd"]);
    expect(OVEN_TYPES).toEqual(["home_oven", "pizza_oven"]);
    expect(FERMENTATION_MODES).toEqual(["room", "cold", "hybrid", "not_recommended"]);
    expect(PLANNING_MIXING_METHODS).toEqual(["hand_mixing", "stand_mixer", "spiral_mixer"]);
  });

  it("defines the initial background flour profiles without exposing them to UI", () => {
    expect(planningFlourProfiles.map((profile) => profile.flourId)).toEqual([
      "unknown_basic_flour",
      "standard_pizza_flour",
      "medium_strong_pizza_flour",
      "strong_pizza_flour",
      "caputo_pizzeria",
      "caputo_nuvola",
      "caputo_saccorosso",
      "pirkka_w260",
      "pirkka_w350",
    ]);
    expect(getPlanningFlourProfile("unknown_basic_flour")).toMatchObject({
      category: "unknown",
      sourceConfidence: "inferred",
      beginnerSafe: true,
    });
  });

  it("accepts every supported user level and oven type through PlanningInput", () => {
    for (const userLevel of USER_LEVELS) {
      for (const ovenType of OVEN_TYPES) {
        const result = buildPlanningResult({
          ...basePlanningInput,
          userLevel,
          ovenType,
        });

        expect(result.availableFermentationHours).toBe(36);
        expect(result.recommendedFermentationMode).toMatch(/cold|hybrid/);
        expect(result.technicalDetails.engineVersion).toBe(PLANNING_ENGINE_VERSION);
      }
    }
  });

  it("represents every supported flour selection shape with a broad v1 flour assumption category", () => {
    const selections: Array<[FlourSelection, string]> = [
      [{ type: "unknown" }, "unknown"],
      [{ type: "standard_pizza_flour" }, "standard"],
      [{ type: "medium_strong_pizza_flour" }, "medium_strong"],
      [{ type: "strong_pizza_flour" }, "strong"],
      [{ type: "known_flour_id", flourId: "caputo-pizzeria" }, "medium_strong"],
      [{ type: "known_flour_id", flourId: "caputo-nuvola-super" }, "very_strong"],
    ];

    for (const [flourSelection, expectedCategory] of selections) {
      const result = buildPlanningResult({ ...basePlanningInput, flourSelection });

      expect(result.technicalDetails.flourAssumptions.flourSelection).toEqual(flourSelection);
      expect(result.technicalDetails.flourAssumptions.category).toBe(expectedCategory);
      expect(result.technicalDetails.flourAssumptions.profileId).toBeTruthy();
      expect(result.technicalDetails.flourAssumptions.displayName).toBeTruthy();
      expect(result.technicalDetails.flourAssumptions.sourceConfidence).toMatch(/official|trusted_secondary|inferred/);
    }
  });

  it("resolves known planning flour profiles and legacy app flour ids safely", () => {
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "pirkka_w260" })).toMatchObject({
      flourId: "pirkka_w260",
      category: "medium_strong",
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "pirkka_w350" })).toMatchObject({
      flourId: "pirkka_w350",
      category: "very_strong",
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo_pizzeria" })).toMatchObject({
      flourId: "caputo_pizzeria",
      category: "medium_strong",
      wMin: 260,
      wMax: 280,
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo_saccorosso" })).toMatchObject({
      flourId: "caputo_saccorosso",
      category: "strong",
      wMin: 300,
      wMax: 320,
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo-pizzeria" })).toMatchObject({
      flourId: "caputo_pizzeria",
      category: "medium_strong",
    });
  });

  it("falls back safely when a known flour id is not in the planning profile registry", () => {
    const profile = resolvePlanningFlourProfile({
      type: "known_flour_id",
      flourId: "mystery-local-flour",
    });
    const result = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "mystery-local-flour" },
    }));

    expect(profile).toMatchObject({
      flourId: "unknown_basic_flour",
      category: "unknown",
      sourceConfidence: "inferred",
    });
    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "unknown_basic_flour",
      category: "unknown",
      displayName: "Unknown basic flour",
    });
  });

  it("calculates available fermentation hours from current time to desired bake time", () => {
    expect(calculateAvailableFermentationHours(basePlanningInput)).toBe(36);
    expect(calculateAvailableFermentationHours({
      currentDateTime: new Date("2026-06-30T09:15:00.000Z"),
      desiredBakeDateTime: new Date("2026-06-30T15:45:00.000Z"),
    })).toBe(6.5);
  });

  it("returns not_recommended and a high-risk warning when the fermentation window is zero or negative", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("2026-06-30T08:00:00.000Z"),
    });

    expect(result.availableFermentationHours).toBe(0);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.qualityScore).toMatchObject({ score: 5, label: "low" });
    expect(result.warnings).toEqual([expect.objectContaining({
      id: "no-positive-fermentation-window",
      severity: "high_risk",
    })]);
    expect(result.recommendedYeast.placeholderPercent).toBeNull();
  });

  it("returns not_recommended and a high-risk warning for the 0-3 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(2));

    expect(result.availableFermentationHours).toBe(2);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.qualityScore).toMatchObject({ score: 10, label: "low" });
    expect(result.warnings).toEqual([expect.objectContaining({
      id: "insufficient-fermentation-window",
      severity: "high_risk",
      userMessage: expect.stringContaining("not enough time"),
    })]);
  });

  it("recommends a fast room-temperature dough for 5 hours with beginner-safe hydration", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      userLevel: "beginner",
      ovenType: "home_oven",
      flourSelection: { type: "unknown" },
    }));

    expect(result.recommendedFermentationMode).toBe("room");
    expect(result.recommendedFlourCategory).toBe("standard");
    expect(result.recommendedHydration).toBe(60);
    expect(result.recommendedSalt).toBe(2.8);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.25);
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "fast-dough-compromise",
      severity: "caution",
    }));
    expect(result.qualityScore).toMatchObject({ score: 45, label: "moderate_low" });
  });

  it("recommends room fermentation and medium-strong flour for a 10 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(10));

    expect(result.recommendedFermentationMode).toBe("room");
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.recommendedHydration).toBe(64);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.14);
    expect(result.qualityScore).toMatchObject({ score: 60, label: "moderate" });
  });

  it("marks the 18 hour window as the best classic v1 time window with a good score", () => {
    const result = buildPlanningResult(planningInputWithHours(18));

    expect(["room", "hybrid"]).toContain(result.recommendedFermentationMode);
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.recommendedHydration).toBe(64);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.08);
    expect(result.qualityScore).toMatchObject({ score: 82, label: "good" });
    expect(result.qualityScore.reasons.join(" ")).toContain("best classic v1");
    expect(result.technicalDetails.assumptions.join(" ")).toContain("best classic v1");
  });

  it("recommends hybrid or cold fermentation and strong flour for a 36 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(36));

    expect(["hybrid", "cold"]).toContain(result.recommendedFermentationMode);
    expect(result.recommendedFlourCategory).toBe("strong");
    expect(result.recommendedYeast.placeholderPercent).toBe(0.04);
    expect(result.qualityScore.label).toBe("good");
  });

  it("recommends cold or hybrid fermentation and strong flour for a 60 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(["hybrid", "cold"]).toContain(result.recommendedFermentationMode);
    expect(["strong", "very_strong"]).toContain(result.recommendedFlourCategory);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.02);
    expect(result.qualityScore).toMatchObject({ score: 78, label: "good" });
  });

  it("warns when 48-72 hour fermentation uses unknown or weak flour", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "unknown" },
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "weak-or-unknown-flour-long-fermentation",
      severity: "caution",
    }));
    expect(result.qualityScore).toMatchObject({ score: 58, label: "moderate" });
  });

  it("creates a high-risk warning for standard flour in a 60 hour fermentation window", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "standard_pizza_flour" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "standard_pizza_flour",
      category: "standard",
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "standard-flour-too-weak-for-long-fermentation",
      severity: "high_risk",
    }));
  });

  it("creates a caution warning for very strong flour in a 5 hour fast dough window", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      flourSelection: { type: "known_flour_id", flourId: "pirkka_w350" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "pirkka_w350",
      category: "very_strong",
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "very-strong-flour-fast-dough",
      severity: "caution",
    }));
  });

  it("treats medium-strong flour as a good fit for an 18 hour planning window", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "pirkka_w260" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "pirkka_w260",
      category: "medium_strong",
    });
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.qualityScore.label).toBe("good");
    expect(result.warnings).toEqual([]);
  });

  it("returns cautious not_recommended behavior above 72 hours", () => {
    const beginnerResult = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "beginner",
    }));
    const nerdResult = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "pizza_nerd",
    }));

    expect(beginnerResult.recommendedFermentationMode).toBe("not_recommended");
    expect(beginnerResult.warnings).toContainEqual(expect.objectContaining({
      id: "advanced-long-fermentation-window",
      severity: "high_risk",
    }));
    expect(beginnerResult.qualityScore).toMatchObject({ score: 25, label: "low" });

    expect(nerdResult.recommendedFermentationMode).toBe("not_recommended");
    expect(nerdResult.warnings).toContainEqual(expect.objectContaining({
      id: "advanced-long-fermentation-window",
      severity: "caution",
    }));
    expect(nerdResult.warnings).toContainEqual(expect.objectContaining({
      id: "pizza-nerd-long-fermentation-note",
      severity: "info",
      visibleForLevels: ["pizza_nerd"],
    }));
  });

  it("adds a warm-fridge warning for long cold or hybrid planning windows", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      fridgeTemperature: 9,
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "warm-fridge-long-fermentation",
      severity: "caution",
      userMessage: expect.stringContaining("fridge temperature is warm"),
    }));
  });

  it("keeps yeast placeholder percentages monotonic as fermentation time increases", () => {
    const yeastPercentages = [5, 10, 18, 36, 60, 96].map((hours) => {
      const result = buildPlanningResult(planningInputWithHours(hours, {
        userLevel: "pizza_nerd",
        flourSelection: { type: "strong_pizza_flour" },
      }));

      return result.recommendedYeast.placeholderPercent;
    });

    expect(yeastPercentages).toEqual([0.25, 0.14, 0.08, 0.04, 0.02, 0.01]);
  });

  it("uses the v1 yeast model so shorter plans recommend more yeast than longer plans", () => {
    const fiveHour = buildPlanningResult(planningInputWithHours(5));
    const eighteenHour = buildPlanningResult(planningInputWithHours(18));
    const fortyEightHour = buildPlanningResult(planningInputWithHours(48, {
      flourSelection: { type: "strong_pizza_flour" },
    }));
    const seventyTwoHour = buildPlanningResult(planningInputWithHours(72, {
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(fiveHour.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      eighteenHour.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(eighteenHour.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      fortyEightHour.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(fortyEightHour.recommendedYeast.recommendedFreshYeastPercent).toBe(
      seventyTwoHour.recommendedYeast.recommendedFreshYeastPercent,
    );
    expect(fortyEightHour.recommendedYeast.note).toContain("fresh yeast equivalent");
  });

  it("reduces yeast for a warm room and increases yeast for a cool room", () => {
    const defaultRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 22 }));
    const warmRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 26 }));
    const coolRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 18 }));

    expect(warmRoom.recommendedYeast.recommendedFreshYeastPercent).toBeLessThan(
      defaultRoom.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(coolRoom.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      defaultRoom.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
  });

  it("returns stable fresh, instant dry and active dry yeast equivalent percentages", () => {
    const result = buildPlanningResult(planningInputWithHours(18));
    const fresh = result.recommendedYeast.recommendedFreshYeastPercent ?? 0;

    expect(result.recommendedYeast.placeholderPercent).toBe(fresh);
    expect(result.recommendedYeast.instantDryYeastEquivalentPercent).toBeCloseTo(
      fresh * INSTANT_DRY_YEAST_FROM_FRESH_FACTOR,
      4,
    );
    expect(result.recommendedYeast.activeDryYeastEquivalentPercent).toBeCloseTo(
      fresh * ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR,
      4,
    );
    expect(result.technicalDetails.yeastAssumptions.supportedYeastTypes).toEqual([
      "fresh_yeast",
      "instant_dry_yeast",
      "active_dry_yeast",
    ]);
    expect(result.technicalDetails.yeastAssumptions.yeastConfidence).toBe("medium");
  });

  it("returns safe yeast recommendation fields for not_recommended short windows", () => {
    const result = buildPlanningResult(planningInputWithHours(2));

    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedYeast).toMatchObject({
      placeholderPercent: null,
      recommendedFreshYeastPercent: null,
      instantDryYeastEquivalentPercent: null,
      activeDryYeastEquivalentPercent: null,
      yeastConfidence: "none",
    });
  });

  it("keeps over-72-hour yeast cautious and low confidence", () => {
    const result = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "pizza_nerd",
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedYeast.recommendedFreshYeastPercent).toBe(0.01);
    expect(result.recommendedYeast.instantDryYeastEquivalentPercent).toBeCloseTo(0.01 / 3, 4);
    expect(result.recommendedYeast.yeastConfidence).toBe("low");
  });

  it("records yeast model assumptions and warm-fridge warnings for long plans", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      fridgeTemperature: 9,
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "warm-fridge-long-fermentation",
    }));
    expect(result.technicalDetails.yeastAssumptions.yeastModelAssumptions.join(" ")).toContain(
      "Fresh yeast equivalent",
    );
    expect(result.technicalDetails.yeastAssumptions.yeastModelAssumptions.join(" ")).toContain(
      "Instant dry yeast equivalent",
    );
    expect(result.technicalDetails.yeastAssumptions.yeastConfidence).toBe("low");
  });

  it("keeps planning warning ids stable and visibility levels populated", () => {
    const scenarios = [
      buildPlanningResult(planningInputWithHours(-1)),
      buildPlanningResult(planningInputWithHours(2)),
      buildPlanningResult(planningInputWithHours(5, {
        flourSelection: { type: "known_flour_id", flourId: "pirkka_w350" },
      })),
      buildPlanningResult(planningInputWithHours(36, {
        fridgeTemperature: 9,
      })),
      buildPlanningResult(planningInputWithHours(60, {
        flourSelection: { type: "standard_pizza_flour" },
      })),
      buildPlanningResult(planningInputWithHours(96, {
        userLevel: "pizza_nerd",
      })),
    ];
    const warnings = scenarios.flatMap((scenario) => scenario.warnings);
    const warningIds = new Set(warnings.map((warning) => warning.id));

    expect(warningIds).toEqual(new Set([
      "no-positive-fermentation-window",
      "insufficient-fermentation-window",
      "fast-dough-compromise",
      "very-strong-flour-fast-dough",
      "warm-fridge-long-fermentation",
      "standard-flour-too-weak-for-long-fermentation",
      "low-confidence-yeast-recommendation",
      "advanced-long-fermentation-window",
      "pizza-nerd-long-fermentation-note",
    ]));

    for (const warning of warnings) {
      expect(warning.visibleForLevels.length).toBeGreaterThan(0);
      expect(warning.userMessage.length).toBeGreaterThan(0);
      expect(warning.technicalReason.length).toBeGreaterThan(0);
      expect(warning.suggestedFix.length).toBeGreaterThan(0);
    }
  });

  it("adds default hand mixing guidance to planning results", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      userLevel: "beginner",
    }));

    expect(result.mixingGuidance).toMatchObject({
      method: "hand_mixing",
      userLevel: "beginner",
      title: "Hand mixing",
      summary: expect.stringContaining("learning"),
      doughFeel: expect.stringContaining("hydrated"),
      stopWhen: expect.stringContaining("no dry flour pockets"),
    });
    expect(result.mixingGuidance?.recommendedOrder.join(" ")).toContain("Add water");
    expect(result.mixingGuidance?.avoid.join(" ")).toContain("extra flour");
    expect(result.mixingGuidance?.avoid.join(" ")).toContain("salt and yeast");
    expect(result.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "hand-mixing-extra-flour",
      severity: "caution",
    }));
  });

  it("distinguishes hand mixing, stand mixer and spiral mixer guidance", () => {
    const hand = buildPlanningMixingGuidance({
      method: "hand_mixing",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const stand = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const spiral = buildPlanningMixingGuidance({
      method: "spiral_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });

    expect(hand.title).toBe("Hand mixing");
    expect(stand.title).toBe("Stand mixer / kitchen machine");
    expect(spiral.title).toBe("Spiral mixer");
    expect(stand.summary).toContain("Machine mixing is not wrong");
    expect(spiral.summary).toContain("repeatability");
    expect(stand.cautions).toContainEqual(expect.objectContaining({
      id: "stand-mixer-overmixing-heat",
      severity: "caution",
    }));
    expect(spiral.cautions).toContainEqual(expect.objectContaining({
      id: "spiral-mixer-watch-temperature",
      severity: "caution",
    }));
  });

  it("varies mixing guidance by experience level", () => {
    const beginner = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "beginner",
      recommendedHydration: 64,
    });
    const enthusiast = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const nerd = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "pizza_nerd",
      recommendedHydration: 66,
    });

    expect(beginner.levelNotes.join(" ")).toContain("Mix until everything is combined");
    expect(enthusiast.levelNotes.join(" ")).toContain("gluten");
    expect(nerd.levelNotes.join(" ")).toContain("friction");
    expect(nerd.technicalNotes.join(" ")).toContain("Target dough temperature");
    expect(nerd.cautions).toContainEqual(expect.objectContaining({
      id: "mixing-hydration-sensitivity",
      severity: "info",
      visibleForLevels: ["pizza_nerd"],
    }));
  });

  it("uses the requested mixing method when provided in PlanningInput", () => {
    const standMixer = buildPlanningResult(planningInputWithHours(18, {
      mixingMethod: "stand_mixer",
    }));
    const spiralMixer = buildPlanningResult(planningInputWithHours(36, {
      mixingMethod: "spiral_mixer",
    }));

    expect(standMixer.mixingGuidance?.method).toBe("stand_mixer");
    expect(standMixer.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "stand-mixer-overmixing-heat",
    }));
    expect(spiralMixer.mixingGuidance?.method).toBe("spiral_mixer");
    expect(spiralMixer.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "spiral-mixer-watch-temperature",
    }));
  });

  it("returns a stable quality score and technical details shape", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.qualityScore).toMatchObject({
      score: 80,
      label: "good",
      reasons: [expect.stringContaining("Long fermentation")],
    });
    expect(result.technicalDetails).toMatchObject({
      engineVersion: 1,
      selectedTimeWindow: {
        currentDateTime: "2026-06-30T09:00:00.000Z",
        desiredBakeDateTime: "2026-07-01T21:00:00.000Z",
      },
      availableFermentationHours: 36,
      sourceConfidence: {
        fermentation: "placeholder",
        flour: "placeholder",
        yeast: "placeholder",
        schedule: "placeholder",
      },
      temperatureAssumptions: {
        roomTemperature: 22,
        fridgeTemperature: 4,
      },
      flourAssumptions: {
        flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
        category: "medium_strong",
      },
      yeastAssumptions: {
        yeastType: null,
      },
    });
    expect(result.technicalDetails.assumptions.join(" ")).toContain("conservative broad fermentation time windows");
    expect(result.technicalDetails.assumptions.join(" ")).toContain("not gram calculations");
  });

  it("keeps existing dough calculator gram calculations untouched", () => {
    const ingredients = calculateDoughIngredients(baseSettings);

    expect(ingredients.total).toBeCloseTo(1606.8, 3);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
  });

  it("keeps the Planning Engine isolated from existing production UI and recipe logic", () => {
    const calculator = source("lib/dough-calculator.ts");
    const homepageWorkspace = source("components/HomeCalculatorWorkspace.tsx");
    const sessionRecipe = source("lib/session-recipe.ts");
    const sessionTimeline = source("lib/pizza-session-timeline.ts");
    const plannerPage = source("app/plan/page.tsx");

    const planningImports = /planning-engine|planning-flour-profiles|planning-input|planning-mixing-guidance|planning-result|planning-types|planning-yeast-model|planning-warning-engine/;

    expect(calculator).not.toMatch(planningImports);
    expect(homepageWorkspace).not.toMatch(planningImports);
    expect(sessionRecipe).not.toMatch(planningImports);
    expect(sessionTimeline).not.toMatch(planningImports);
    expect(plannerPage).not.toMatch(planningImports);
  });
});
