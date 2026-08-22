import type { PizzaSessionFermentationChoice } from "@/lib/pizza-session";

export function sessionFermentationChoiceOptions(availableHours?: number): PizzaSessionFermentationChoice[] {
  if (typeof availableHours !== "number" || !Number.isFinite(availableHours) || availableHours <= 0) return [];
  if (availableHours < 24) return ["start_now"];
  if (availableHours <= 72) return ["start_now", "twenty_four_hour_room", "twenty_four_hour_cold"];
  return [];
}

export function fermentationModeForStartNow(availableHours: number): "room" | "cold" {
  return availableHours <= 24 ? "room" : "cold";
}
