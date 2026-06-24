import type { ExperienceLevel } from "@/lib/experience-levels";

export type HomepageExperienceCopy = {
  heroIntro: string;
  workflowHint: string;
  calculatorIntro: string;
  quickIntro: string;
  flourIntro: string;
  resultNote: string;
  resultDetails: string[];
  saveBakeHelp: string;
};

export const homepageExperienceCopy: Record<ExperienceLevel, HomepageExperienceCopy> = {
  beginner: {
    heroIntro:
      "Start with the suggested defaults, choose your oven and let DoughTools give you a practical dough recipe. After that, open the planner and follow the steps.",
    workflowHint:
      "Start with the calculator, keep the suggested defaults, then use the planner to know what to do next.",
    calculatorIntro:
      "Choose a pizza style, oven and fermentation. DoughTools calculates a sensible starting recipe for you.",
    quickIntro:
      "Pick the pizza you want, when it will ferment and which oven you use. The defaults are designed to be a safe first try.",
    flourIntro:
      "Choose a flour if you know it. If not, keep the suggestion and adjust later after one bake.",
    resultNote:
      "Leavening is an estimate. If this is your first bake, follow the planner and write down what happened.",
    resultDetails: [
      "Use these grams as your mixing list.",
      "Open the planner next so the dough has enough time before baking.",
    ],
    saveBakeHelp: "Save this bake so you can compare next time.",
  },
  intermediate: {
    heroIntro:
      "Build a recipe from style, oven and schedule, then learn how hydration, fermentation, flour strength and saved bakes shape the result.",
    workflowHint:
      "Carry the same recipe through planning, flour choices, sauce, toppings and saved bakes so each pizza night teaches you something.",
    calculatorIntro:
      "Choose a pizza style, oven and fermentation. DoughTools calculates the batch and keeps hydration, flour strength and oven context visible.",
    quickIntro:
      "Choose the result, fermentation time and environment, and oven. Use the recommendation, then fine-tune hydration, salt, flour and leavening if needed.",
    flourIntro:
      "The flour profile suggests hydration and fermentation ranges so you can match stronger flour with longer or wetter dough.",
    resultNote:
      "Leavening is estimated from time and temperature. Flour strength, fermentation schedule and dough handling can require adjustment.",
    resultDetails: [
      "Hydration, flour choice and fermentation time work together.",
      "Save the bake with its recipe snapshot so you can compare the next version.",
    ],
    saveBakeHelp: "Save this bake with the recipe snapshot for comparison.",
  },
  advanced: {
    heroIntro:
      "Use baker’s percentages, recipe variables and methodology notes to optimize dough around flour strength, fermentation, oven heat and repeatable results.",
    workflowHint:
      "Treat every bake as a controlled setup: formula, fermentation, flour, oven, result and next adjustment.",
    calculatorIntro:
      "Choose a pizza style, oven and fermentation. DoughTools exposes the baker’s-percentage setup so you can inspect the assumptions behind the batch.",
    quickIntro:
      "Select the target profile, fermentation environment and oven, then tune ball weight, hydration, salt, leavening type, flour profile and temperature.",
    flourIntro:
      "Use the flour profile as a W/protein/hydration constraint, not a guarantee. Compare it with your actual bag and dough temperature.",
    resultNote:
      "Leavening estimate depends on time, temperature, flour strength, starter activity and actual dough temperature.",
    resultDetails: [
      "The formula is solved from total dough weight using baker’s percentages.",
      "Yeast is an estimate calibrated by fermentation activity, not a guarantee of readiness.",
      "For sourdough, starter flour and starter water are counted back into the flour/water balance.",
    ],
    saveBakeHelp: "Save the immutable recipe snapshot and local bake result for later analysis.",
  },
};

export function getHomepageExperienceCopy(level: ExperienceLevel): HomepageExperienceCopy {
  return homepageExperienceCopy[level] ?? homepageExperienceCopy.intermediate;
}
