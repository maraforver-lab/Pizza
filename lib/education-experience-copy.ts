import type { ExperienceLevel } from "@/lib/experience-levels";

export type PlannerExperienceCopy = {
  intro: string;
  visualIntro: string;
  estimated: string;
  nextAdvice: string;
  timelineNote: string;
};

export type GuideExperienceCopy = {
  intro: string;
  basicsNote: string;
  settingsNote: string;
  accuracyNote: string;
  technicalDetails: string[];
};

export type DoctorExperienceCopy = {
  intro: string;
  verifyBody: string;
  note: string;
  diagnosisDetailTitle: string;
  diagnosisDetails: string[];
};

export type EducationExperienceCopy = {
  planner: PlannerExperienceCopy;
  guide: GuideExperienceCopy;
  doctor: DoctorExperienceCopy;
};

export const educationExperienceCopy: Record<ExperienceLevel, EducationExperienceCopy> = {
  beginner: {
    planner: {
      intro:
        "Start now or choose when you want to bake. Follow the next highlighted step and keep the dough covered between actions.",
      visualIntro:
        "Use the pictures as your main guide. Open one step at a time and compare your dough with the target texture.",
      estimated:
        "Clock times are practical estimates. If the dough looks slower or faster than the picture, follow the dough before the clock.",
      nextAdvice:
        "Focus on the next step only. You do not need to understand every variable to make a good first bake.",
      timelineNote:
        "Keep the dough covered, avoid drying the surface, and use the timer as a gentle guide.",
    },
    guide: {
      intro:
        "Learn the simple rules first: weigh accurately, give the dough enough time, and match the recipe to your oven.",
      basicsNote:
        "Start with ball weight, hydration, salt and fermentation time. Those four choices explain most beginner results.",
      settingsNote:
        "If something goes wrong, change one thing next time instead of changing the whole recipe.",
      accuracyNote:
        "The grams are calculated precisely, but fermentation readiness still needs your eyes and hands.",
      technicalDetails: [
        "Use the calculator values as a starting recipe.",
        "Record one observation after baking so the next pizza is easier to improve.",
      ],
    },
    doctor: {
      intro:
        "Choose the picture that looks closest to your dough. The Doctor will explain the likely cause and one simple next step.",
      verifyBody:
        "First check that the recipe below matches the dough you made. If not, edit the calculator before using the diagnosis.",
      note:
        "The diagnosis is a practical comparison, not a laboratory result. Start with the simplest fix first.",
      diagnosisDetailTitle: "Simple next check",
      diagnosisDetails: [
        "Check whether the dough was too cold, too warm, too wet or handled too roughly.",
        "Change one variable next time and write down what happened.",
      ],
    },
  },
  intermediate: {
    planner: {
      intro:
        "Use the schedule to balance room-temperature activity, cold time and final warm-up before baking.",
      visualIntro:
        "Compare both timing and texture. The same clock time can behave differently with stronger flour, warmer dough or more hydration.",
      estimated:
        "Clock times are estimates based on the selected fermentation. Use growth, relaxation and handling feel to adjust the final timing.",
      nextAdvice:
        "Use saved bakes to compare how room time, fridge time and flour choice change the finished pizza.",
      timelineNote:
        "Room temperature builds activity quickly; the fridge slows fermentation and gives you scheduling control.",
    },
    guide: {
      intro:
        "Use the guide to understand why hydration, flour strength, salt, fermentation and oven heat affect the same dough.",
      basicsNote:
        "Baker's percentages let you compare recipes even when batch size changes.",
      settingsNote:
        "Hydration, flour strength and fermentation time should move together instead of being tuned in isolation.",
      accuracyNote:
        "Ingredient math is precise; leavening and readiness are estimates affected by temperature and handling.",
      technicalDetails: [
        "Longer fermentation usually needs stronger flour or less yeast.",
        "Higher hydration can create a softer crumb only if gluten development and handling preserve the gas.",
      ],
    },
    doctor: {
      intro:
        "Choose the closest dough state. The Doctor connects the symptom to fermentation, hydration, flour strength and handling.",
      verifyBody:
        "Confirm the recipe first because the advice changes with pizza style, flour range, hydration and fermentation environment.",
      note:
        "Use the diagnosis as a process clue. Compare the symptom with your actual dough temperature, rest time and handling.",
      diagnosisDetailTitle: "Process clues",
      diagnosisDetails: [
        "Sticky, tight or collapsed dough can come from more than one variable.",
        "Compare flour strength, hydration, rest time and the actual temperature of the dough.",
      ],
    },
  },
  advanced: {
    planner: {
      intro:
        "Treat the planner as a fermentation model: time, dough temperature, flour tolerance and leavening activity interact.",
      visualIntro:
        "Use the pictures with the timestamps, but verify against dough temperature, extensibility, gas retention and surface activity.",
      estimated:
        "Schedule output is deterministic, but fermentation is sensitive to dough temperature, yeast activity, inoculation and flour strength.",
      nextAdvice:
        "Use each bake as a calibration run: compare planned offsets with actual dough maturity and adjust the next formula.",
      timelineNote:
        "Cold fermentation slows activity; warm-up time changes extensibility, gas pressure and final proof readiness.",
    },
    guide: {
      intro:
        "Use the guide as the technical map behind the calculator: baker's percentages, flour strength and process variables define the starting model.",
      basicsNote:
        "The formula solves total dough mass from baker's percentages; sourdough flour and water must be counted back into the balance.",
      settingsNote:
        "Hydration, salt, gluten development, fermentation temperature and oven energy create the final texture together.",
      accuracyNote:
        "The ingredient equation is exact, while yeast growth, starter activity and flour absorption remain model assumptions.",
      technicalDetails: [
        "W strength and protein are useful constraints, but batch behavior still depends on milling, absorption and P/L balance.",
        "A recipe becomes repeatable only when dough temperature, fermentation endpoint and bake environment are recorded.",
        "Edge cases such as high hydration, long cold fermentation and sourdough need more observation than a fixed clock time.",
      ],
    },
    doctor: {
      intro:
        "Choose the visual symptom, then interpret it as an interaction between gluten development, enzymatic activity, hydration, temperature and handling.",
      verifyBody:
        "Confirm the exact setup first. Diagnostic advice assumes the shown flour, hydration, fermentation, pizza style and temperature inputs.",
      note:
        "The Doctor is a structured hypothesis, not an absolute measurement. Treat the result as a variable map for your next controlled bake.",
      diagnosisDetailTitle: "Technical interpretation",
      diagnosisDetails: [
        "Multiple variables can create the same symptom, so avoid changing hydration, yeast and time all at once.",
        "Dough temperature and flour tolerance often explain why the same recipe behaves differently between kitchens.",
        "For sourdough, starter maturity and acidity can change gluten strength even when baker's percentages are unchanged.",
      ],
    },
  },
};

export function getEducationExperienceCopy(level: ExperienceLevel): EducationExperienceCopy {
  return educationExperienceCopy[level] ?? educationExperienceCopy.intermediate;
}
