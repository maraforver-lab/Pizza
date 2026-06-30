import type { PlanningFlourSelection, PlanningOvenType, PlanningUserLevel } from "@/lib/planning-types";

export type PlanningInput = {
  currentDateTime: Date;
  desiredBakeDateTime: Date;
  userLevel: PlanningUserLevel;
  ovenType: PlanningOvenType;
  roomTemperature: number;
  fridgeTemperature: number;
  flourSelection: PlanningFlourSelection;
  doughBallCount: number;
  doughBallWeight: number;
};

export function calculateAvailableFermentationHours(input: Pick<PlanningInput, "currentDateTime" | "desiredBakeDateTime">) {
  const currentTime = input.currentDateTime.getTime();
  const desiredTime = input.desiredBakeDateTime.getTime();
  if (!Number.isFinite(currentTime) || !Number.isFinite(desiredTime)) return 0;
  return Math.max(0, (desiredTime - currentTime) / 3_600_000);
}
