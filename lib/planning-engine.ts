import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { createPlanningFoundationResult, type PlanningResult } from "@/lib/planning-result";
import type { PlanningWarning } from "@/lib/planning-types";

export const PLANNING_ENGINE_VERSION = 1;

export function buildPlanningResult(input: PlanningInput): PlanningResult {
  const availableFermentationHours = calculateAvailableFermentationHours(input);
  const warnings: PlanningWarning[] = [];

  if (availableFermentationHours === 0) {
    warnings.push({
      code: "no-positive-fermentation-window",
      message: "The desired bake time does not leave a positive fermentation window.",
      severity: "warning",
    });
  }

  return createPlanningFoundationResult({
    availableFermentationHours,
    warnings,
  });
}
