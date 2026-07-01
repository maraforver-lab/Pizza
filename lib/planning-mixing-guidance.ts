import type {
  PlanningMixingGuidance,
  PlanningMixingMethod,
  PlanningWarning,
  UserLevel,
} from "@/lib/planning-types";

export const PLANNING_MIXING_METHODS = [
  "hand_mixing",
  "stand_mixer",
  "spiral_mixer",
] as const satisfies readonly PlanningMixingMethod[];

type PlanningMixingGuidanceInput = {
  method?: PlanningMixingMethod;
  userLevel: UserLevel;
  recommendedHydration: number | null;
};

type MixingMethodCopy = {
  title: string;
  summary: string;
  recommendedOrder: string[];
  doughFeel: string;
  stopWhen: string;
  methodCaution: PlanningWarning;
};

const ALL_LEVELS: UserLevel[] = ["beginner", "enthusiast", "pizza_nerd"];
const PRACTICAL_LEVELS: UserLevel[] = ["enthusiast", "pizza_nerd"];
const TECHNICAL_LEVELS: UserLevel[] = ["pizza_nerd"];

export function buildPlanningMixingGuidance(input: PlanningMixingGuidanceInput): PlanningMixingGuidance {
  const method = input.method ?? "hand_mixing";
  const copy = getMixingMethodCopy(method);

  return {
    method,
    userLevel: input.userLevel,
    title: copy.title,
    summary: copy.summary,
    recommendedOrder: copy.recommendedOrder,
    doughFeel: copy.doughFeel,
    stopWhen: copy.stopWhen,
    avoid: [
      "Do not add lots of extra flour just because the dough feels sticky.",
      "Do not let salt and yeast sit together directly for a long time before mixing.",
      "Do not judge mixing only by minutes. Stop by dough condition.",
      "Avoid overheating or overmixing the dough.",
    ],
    cautions: [
      copy.methodCaution,
      buildHydrationSensitivityCaution(input.recommendedHydration),
    ].filter((warning): warning is PlanningWarning => warning !== null),
    levelNotes: getLevelNotes(input.userLevel, method),
    technicalNotes: getTechnicalNotes(input.userLevel, method, input.recommendedHydration),
  };
}

function getMixingMethodCopy(method: PlanningMixingMethod): MixingMethodCopy {
  switch (method) {
    case "hand_mixing":
      return {
        title: "Hand mixing",
        summary: "Best for learning how dough should feel as flour hydrates and gluten starts forming.",
        recommendedOrder: [
          "Add water to the bowl first, then dissolve or disperse the yeast.",
          "Add most of the flour and mix until no dry pockets remain.",
          "Add salt after the flour has started hydrating, then finish mixing.",
          "Rest briefly if the dough feels tight or sticky, then fold until it becomes smoother.",
        ],
        doughFeel: "The dough should feel evenly hydrated, slightly tacky and more elastic after a short rest.",
        stopWhen: "Stop when there are no dry flour pockets and the dough holds together without tearing apart immediately.",
        methodCaution: {
          id: "hand-mixing-extra-flour",
          severity: "caution",
          userMessage: "Hand-mixed dough can feel sticky before it is ready.",
          technicalReason: "Early stickiness often means flour is still hydrating, not that the recipe needs more flour.",
          suggestedFix: "Rest the dough before adding flour. Use damp hands or light oil if needed.",
          visibleForLevels: ALL_LEVELS,
        },
      };
    case "stand_mixer":
      return {
        title: "Stand mixer / kitchen machine",
        summary: "Useful and repeatable when used gently. Machine mixing is not wrong; overheating and overmixing are the risks.",
        recommendedOrder: [
          "Add water and yeast first, then flour.",
          "Mix on low speed until the dough comes together.",
          "Add salt once the dough is roughly mixed.",
          "Keep the speed gentle and pause if the dough or bowl gets warm.",
        ],
        doughFeel: "The dough should look cohesive and elastic, not whipped, shiny-hot or tearing from too much mixing.",
        stopWhen: "Stop when the dough clears most of the bowl and stretches a little without feeling hot.",
        methodCaution: {
          id: "stand-mixer-overmixing-heat",
          severity: "caution",
          userMessage: "A stand mixer can overheat or overmix pizza dough.",
          technicalReason: "Small kitchen machines add friction and can raise dough temperature quickly.",
          suggestedFix: "Use low speed, short mixing, and stop by dough feel instead of time alone.",
          visibleForLevels: ALL_LEVELS,
        },
      };
    case "spiral_mixer":
      return {
        title: "Spiral mixer",
        summary: "Best for repeatability and larger batches when you want consistent gluten development.",
        recommendedOrder: [
          "Add water and yeast, then flour.",
          "Mix until the dough is evenly hydrated before adding salt.",
          "Add salt and continue until the dough becomes smooth and elastic.",
          "Watch dough temperature, especially with longer mixes or larger batches.",
        ],
        doughFeel: "The dough should become smooth, elastic and structured without becoming warm or overly tight.",
        stopWhen: "Stop when gluten is developed enough for the dough to stretch and hold shape without excessive heat.",
        methodCaution: {
          id: "spiral-mixer-watch-temperature",
          severity: "caution",
          userMessage: "A spiral mixer is repeatable, but dough temperature still matters.",
          technicalReason: "Efficient gluten development can still add friction heat during longer mixes.",
          suggestedFix: "Track dough temperature and shorten mixing if the dough warms faster than expected.",
          visibleForLevels: PRACTICAL_LEVELS,
        },
      };
  }
}

function getLevelNotes(userLevel: UserLevel, method: PlanningMixingMethod): string[] {
  if (userLevel === "beginner") {
    return [
      "Mix until everything is combined.",
      "Rest the dough if it feels sticky before deciding it needs more flour.",
      "The dough does not need to look perfect immediately.",
    ];
  }

  if (userLevel === "enthusiast") {
    return [
      "A short rest helps flour hydrate and makes gluten easier to develop.",
      "The dough should become smoother and more elastic as mixing and resting work together.",
      method === "hand_mixing"
        ? "Hand mixing gives the clearest feedback about hydration and dough strength."
        : "Machine mixing gives repeatability, but dough feel and temperature still matter.",
    ];
  }

  return [
    "Track dough condition, friction and temperature instead of relying only on fixed mixing time.",
    "Higher hydration doughs can look underdeveloped before rest and folds finish gluten organization.",
    "Use the tool for consistency, but treat final dough temperature and gluten development as the control points.",
  ];
}

function getTechnicalNotes(
  userLevel: UserLevel,
  method: PlanningMixingMethod,
  recommendedHydration: number | null,
): string[] {
  if (userLevel !== "pizza_nerd") return [];

  const hydrationNote = recommendedHydration === null
    ? "Hydration sensitivity should be assessed once the final dough formula is known."
    : `At ${recommendedHydration}% hydration, judge gluten development after hydration/rest, not only during the first mix.`;

  return [
    "Target dough temperature is a future planning variable; avoid friction heat until that model is connected.",
    hydrationNote,
    method === "stand_mixer"
      ? "Stand mixers can add heat quickly because bowl geometry and hook action are less gentle than a spiral mixer."
      : "Mixer friction and batch size should eventually feed target dough temperature assumptions.",
  ];
}

function buildHydrationSensitivityCaution(recommendedHydration: number | null): PlanningWarning | null {
  if (recommendedHydration === null || recommendedHydration < 65) return null;

  return {
    id: "mixing-hydration-sensitivity",
    severity: "info",
    userMessage: "Higher hydration dough may feel sticky before it strengthens.",
    technicalReason: `Recommended hydration is ${recommendedHydration}%, so early dough feel may be loose before rest and gluten development.`,
    suggestedFix: "Use rest and folds before adding flour.",
    visibleForLevels: TECHNICAL_LEVELS,
  };
}
