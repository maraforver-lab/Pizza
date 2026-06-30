import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { createPlanningFoundationResult, type PlanningResult } from "@/lib/planning-result";
import type { PlanningWarning } from "@/lib/planning-types";

export const PLANNING_ENGINE_VERSION = 1;

export function buildPlanningResult(input: PlanningInput): PlanningResult {
  const availableFermentationHours = calculateAvailableFermentationHours(input);
  const warnings: PlanningWarning[] = [];

  if (availableFermentationHours === 0) {
    warnings.push({
      id: "no-positive-fermentation-window",
      severity: "high_risk",
      userMessage: "The desired bake time does not leave a positive fermentation window.",
      technicalReason: "desiredBakeDateTime is not later than currentDateTime.",
      suggestedFix: "Choose a later bake time before applying fermentation planning rules.",
      visibleForLevels: ["beginner", "enthusiast", "pizza_nerd"],
    });
  }

  return createPlanningFoundationResult({
    planningInput: input,
    availableFermentationHours,
    warnings,
  });
}
