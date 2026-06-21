import type { OvenType, PizzaGoal } from "@/lib/saved-recipes";

const recommendations = {
  home: {
    balanced: { temperature: 250, time: "6–9 min" }, airy: { temperature: 250, time: "7–10 min" },
    crispy: { temperature: 250, time: "8–12 min" }, pan: { temperature: 240, time: "14–18 min" },
  },
  gas: {
    balanced: { temperature: 450, time: "60–90 s" }, airy: { temperature: 430, time: "75–110 s" },
    crispy: { temperature: 400, time: "2–3 min" }, pan: { temperature: 380, time: "5–7 min" },
  },
} as const;

export const bakeFor = (goal: PizzaGoal, oven: OvenType) => recommendations[oven][goal];
