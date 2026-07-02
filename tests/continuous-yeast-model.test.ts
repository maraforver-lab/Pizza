import { describe, expect, it } from "vitest";
import {
  calculateContinuousYeastRecommendation,
  CONTINUOUS_YEAST_MAX_HOURS,
  CONTINUOUS_YEAST_MIN_HOURS,
} from "@/lib/continuous-yeast-model";
import type {
  ContinuousYeastFermentationMode,
  ContinuousYeastModelInput,
  ContinuousYeastType,
} from "@/lib/continuous-yeast-model";

const baseInput: ContinuousYeastModelInput = {
  flourGrams: 1000,
  fermentationHours: 24,
  fermentationMode: "cold",
  temperatureC: 4,
  yeastType: "instant_dry_yeast",
};

function resultFor(
  fermentationHours: number,
  fermentationMode: ContinuousYeastFermentationMode = "cold",
  temperatureC = fermentationMode === "cold" ? 4 : 22,
  yeastType: ContinuousYeastType = "instant_dry_yeast",
) {
  return calculateContinuousYeastRecommendation({
    ...baseInput,
    fermentationHours,
    fermentationMode,
    temperatureC,
    yeastType,
  });
}

describe("continuous yeast model helper", () => {
  it("returns unsupported high-risk behavior below the 3 hour direct-scaling minimum", () => {
    const result = resultFor(CONTINUOUS_YEAST_MIN_HOURS - 0.5, "room", 22);

    expect(result).toMatchObject({
      status: "too_short",
      riskLevel: "high_risk",
      directScalingApplied: false,
      longHorizonFallbackRequired: false,
      yeastAmountGrams: null,
      yeastPercentOfFlour: null,
    });
    expect(result.warnings.join(" ")).toContain("below the 3 h minimum");
  });

  it("calculates a direct recommendation at the 3 hour lower bound", () => {
    const result = resultFor(CONTINUOUS_YEAST_MIN_HOURS, "room", 22);

    expect(result).toMatchObject({
      status: "ok",
      directScalingApplied: true,
      longHorizonFallbackRequired: false,
      fermentationHours: 3,
      yeastType: "instant_dry_yeast",
    });
    expect(result.freshYeastEquivalentPercent).toBeCloseTo(0.3, 5);
    expect(result.yeastPercentOfFlour).toBeCloseTo(0.3 * 0.414, 5);
    expect(result.yeastAmountGrams).toBeCloseTo(1.242, 3);
  });

  it("produces room fermentation recommendations for 6h and 12h windows", () => {
    const sixHour = resultFor(6, "room", 22);
    const twelveHour = resultFor(12, "room", 22);

    expect(sixHour.status).toBe("ok");
    expect(twelveHour.status).toBe("ok");
    expect(sixHour.yeastAmountGrams).toBeGreaterThan(twelveHour.yeastAmountGrams ?? 0);
    expect(sixHour.freshYeastEquivalentPercent).toBeCloseTo(0.2, 5);
    expect(twelveHour.freshYeastEquivalentPercent).toBeCloseTo(0.1, 5);
  });

  it("keeps cold fermentation yeast monotonic across 24h, 40h, 48h and 72h", () => {
    const twentyFourHour = resultFor(24);
    const fortyHour = resultFor(40);
    const fortyEightHour = resultFor(48);
    const seventyTwoHour = resultFor(72);

    expect(twentyFourHour.yeastAmountGrams).toBeGreaterThan(fortyHour.yeastAmountGrams ?? 0);
    expect(fortyHour.yeastAmountGrams).toBeGreaterThan(fortyEightHour.yeastAmountGrams ?? 0);
    expect(fortyEightHour.yeastAmountGrams).toBeGreaterThan(seventyTwoHour.yeastAmountGrams ?? 0);
    expect(fortyHour.yeastAmountGrams).toBeLessThan(twentyFourHour.yeastAmountGrams ?? 0);
    expect(fortyHour.yeastAmountGrams).toBeGreaterThan(fortyEightHour.yeastAmountGrams ?? 0);
  });

  it("treats 72h cold fermentation as direct but cautionary", () => {
    const result = resultFor(CONTINUOUS_YEAST_MAX_HOURS);

    expect(result).toMatchObject({
      status: "ok",
      riskLevel: "caution",
      directScalingApplied: true,
      longHorizonFallbackRequired: false,
    });
    expect(result.freshYeastEquivalentPercent).toBeCloseTo(0.0125, 5);
    expect(result.cautions.join(" ")).toContain("upper direct-scaling limit");
  });

  it("returns long-horizon fallback instead of calculating yeast over more than 72h", () => {
    const result = resultFor(CONTINUOUS_YEAST_MAX_HOURS + 1);

    expect(result).toMatchObject({
      status: "long_horizon_required",
      riskLevel: "not_enough_information",
      directScalingApplied: false,
      longHorizonFallbackRequired: true,
      yeastAmountGrams: null,
      yeastPercentOfFlour: null,
    });
    expect(result.longHorizonRecommendedWindowsHours).toEqual([24, 48, 72]);
    expect(result.warnings.join(" ")).toContain("longer than the 72 h direct yeast-scaling limit");
  });

  it("does not produce full-horizon yeast for an 8-10 day bake horizon", () => {
    const eightDays = resultFor(8 * 24);
    const tenDays = resultFor(10 * 24);

    expect(eightDays.status).toBe("long_horizon_required");
    expect(tenDays.status).toBe("long_horizon_required");
    expect(eightDays.yeastAmountGrams).toBeNull();
    expect(tenDays.yeastAmountGrams).toBeNull();
    expect(eightDays.assumptions.join(" ")).toContain("did not calculate yeast from the full long horizon");
  });

  it("reduces room-temperature yeast recommendation for warm rooms and flags warm-room risk", () => {
    const normal = resultFor(12, "room", 22);
    const warm = resultFor(12, "room", 27);

    expect(warm.yeastAmountGrams).toBeLessThan(normal.yeastAmountGrams ?? 0);
    expect(warm.riskLevel).toBe("high_risk");
    expect(warm.cautions.join(" ")).toContain("Warm room temperature");
  });

  it("treats cool rooms as slower fermentation context", () => {
    const normal = resultFor(12, "room", 22);
    const cool = resultFor(12, "room", 18);

    expect(cool.yeastAmountGrams).toBeGreaterThan(normal.yeastAmountGrams ?? 0);
    expect(cool.riskLevel).toBe("caution");
    expect(cool.cautions.join(" ")).toContain("Cool room temperature");
  });

  it("adds risk for warm fridge long cold fermentation", () => {
    const normal = resultFor(48, "cold", 4);
    const warmFridge = resultFor(48, "cold", 8);

    expect(warmFridge.yeastAmountGrams).toBeLessThan(normal.yeastAmountGrams ?? 0);
    expect(warmFridge.riskLevel).toBe("high_risk");
    expect(warmFridge.cautions.join(" ")).toContain("Warm fridge temperature");
  });

  it("treats very cold fridge as slower fermentation context", () => {
    const normal = resultFor(48, "cold", 4);
    const coldFridge = resultFor(48, "cold", 2);

    expect(coldFridge.yeastAmountGrams).toBeGreaterThan(normal.yeastAmountGrams ?? 0);
    expect(coldFridge.riskLevel).toBe("caution");
    expect(coldFridge.cautions.join(" ")).toContain("Very cold fridge temperature");
  });

  it("uses explicit production-compatible commercial yeast conversion factors", () => {
    const fresh = resultFor(24, "cold", 4, "fresh_yeast");
    const instantDry = resultFor(24, "cold", 4, "instant_dry_yeast");
    const activeDry = resultFor(24, "cold", 4, "active_dry_yeast");

    expect(fresh.conversionFactorFromFresh).toBe(1);
    expect(instantDry.conversionFactorFromFresh).toBe(0.414);
    expect(activeDry.conversionFactorFromFresh).toBe(0.52);
    expect(instantDry.yeastPercentOfFlour).toBeCloseTo((fresh.yeastPercentOfFlour ?? 0) * 0.414, 5);
    expect(activeDry.yeastPercentOfFlour).toBeCloseTo((fresh.yeastPercentOfFlour ?? 0) * 0.52, 5);
  });

  it("returns a stable structured output shape", () => {
    const result = resultFor(40);

    expect(Object.keys(result).sort()).toEqual([
      "assumptions",
      "cautions",
      "conversionFactorFromFresh",
      "directScalingApplied",
      "fermentationHours",
      "fermentationMode",
      "flourGrams",
      "freshYeastEquivalentPercent",
      "longHorizonFallbackRequired",
      "longHorizonRecommendedWindowsHours",
      "riskLevel",
      "status",
      "temperatureC",
      "warnings",
      "yeastAmountGrams",
      "yeastPercentOfFlour",
      "yeastType",
    ]);
  });

  it("returns not-enough-information without false confidence for invalid flour or time input", () => {
    const result = calculateContinuousYeastRecommendation({
      ...baseInput,
      flourGrams: 0,
    });

    expect(result).toMatchObject({
      status: "not_enough_information",
      riskLevel: "not_enough_information",
      directScalingApplied: false,
      yeastAmountGrams: null,
    });
    expect(result.warnings.join(" ")).toContain("positive flour amount");
  });
});
