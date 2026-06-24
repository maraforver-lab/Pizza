import type { ExperienceLevel } from "@/lib/experience-levels";

export type CalculatorControlGroupId = "essential" | "recommended" | "advanced";

export type CalculatorControlGroup = {
  id: CalculatorControlGroupId;
  title: string;
  description: string;
  fields: string[];
};

export const calculatorControlGroups: CalculatorControlGroup[] = [
  {
    id: "essential",
    title: "Essential choices",
    description: "The minimum decisions needed to create a practical dough recipe.",
    fields: [
      "pizza style",
      "fermentation time and environment",
      "pizza count",
      "oven type",
    ],
  },
  {
    id: "recommended",
    title: "Recommended settings",
    description: "Helpful choices that improve repeatability without requiring formula work.",
    fields: [
      "flour profile",
      "baking recommendation",
      "recommended ball weight",
      "flour strength",
    ],
  },
  {
    id: "advanced",
    title: "Advanced settings",
    description: "Detailed dough controls for tuning baker’s percentages and fermentation assumptions.",
    fields: [
      "dough ball weight",
      "hydration",
      "salt",
      "extra for waste",
      "leavening type",
      "fermentation preset",
      "room or fridge temperature",
    ],
  },
];

export type CalculatorDisclosureMode = {
  level: ExperienceLevel;
  statusLabel: string;
  intro: string;
  showRecommendedByDefault: boolean;
  showAdvancedByDefault: boolean;
  disclosureLabel: string;
  collapsedHelp: string;
  expandedHelp: string;
  resultHeading: string;
  nextStep: string;
  causeAndEffect: string[];
  technicalNotes: string[];
};

export function getCalculatorDisclosureMode(level: ExperienceLevel): CalculatorDisclosureMode {
  if (level === "pizza_nerd") {
    return {
      level,
      statusLabel: "Guidance mode: Pizza Nerd",
      intro:
        "All calculator controls are visible. Use the formula assumptions, flour profile and fermentation settings as tuning variables.",
      showRecommendedByDefault: true,
      showAdvancedByDefault: true,
      disclosureLabel: "Technical dough controls",
      collapsedHelp: "Technical dough controls are available.",
      expandedHelp: "All available dough controls are visible for formula tuning.",
      resultHeading: "Formula result and next actions",
      nextStep: "Next: plan the timeline, then compare the bake result against the formula assumptions.",
      causeAndEffect: [
        "Hydration changes handling, openness and how much strength the flour needs.",
        "Fermentation time and temperature change the leavening estimate and flavour development.",
        "Oven heat changes bake time, drying and how much topping load the dough can carry.",
      ],
      technicalNotes: [
        "Baker’s percentages are calculated from flour weight.",
        "Yeast is estimated from time and temperature, not guaranteed readiness.",
        "Sourdough starter flour and water are counted back into the dough balance.",
      ],
    };
  }

  if (level === "enthusiast") {
    return {
      level,
      statusLabel: "Guidance mode: Enthusiast",
      intro:
        "Start with the essential recipe, then use flour, hydration and fermentation guidance to understand what each change affects.",
      showRecommendedByDefault: true,
      showAdvancedByDefault: false,
      disclosureLabel: "Advanced settings",
      collapsedHelp: "Open advanced settings when you want to tune hydration, salt, yeast or temperature directly.",
      expandedHelp: "Advanced settings are open. Change one variable at a time so the result stays understandable.",
      resultHeading: "Here is your dough recipe",
      nextStep: "Next: plan when to mix, rest and bake, then save notes after the bake.",
      causeAndEffect: [
        "Hydration affects stickiness, openness and handling.",
        "Flour strength affects how well the dough tolerates water and longer fermentation.",
        "Oven type affects bake strategy, preheat time and how fast the pizza dries.",
      ],
      technicalNotes: [],
    };
  }

  return {
    level,
    statusLabel: "Guidance mode: Beginner",
    intro:
      "Start with the essentials. DoughTools keeps safe defaults for the technical settings, and you can open more settings whenever you want.",
    showRecommendedByDefault: false,
    showAdvancedByDefault: false,
    disclosureLabel: "Show more settings",
    collapsedHelp: "Advanced settings are hidden for a calmer first recipe, but they are still preserved and available.",
    expandedHelp: "More settings are open. You can adjust them now, or keep the suggested defaults.",
    resultHeading: "Here is your dough recipe",
    nextStep: "Next: plan when to mix, rest and bake.",
    causeAndEffect: [
      "Keep the defaults for your first bake unless you already know what you want to change.",
    ],
    technicalNotes: [],
  };
}

export function hasAdvancedCalculatorValues(settings: {
  ballWeight: number;
  waste: number;
  hydration: number;
  salt: number;
  yeastType: string;
  temperature: number;
  flourId?: string;
}, recommended: { ballWeight: number; hydration: number; salt: number; temperature: number }) {
  return settings.ballWeight !== recommended.ballWeight
    || settings.waste !== 3
    || settings.hydration !== recommended.hydration
    || settings.salt !== recommended.salt
    || settings.yeastType !== "idy"
    || settings.temperature !== recommended.temperature
    || Boolean(settings.flourId && settings.flourId !== "caputo-pizzeria");
}
