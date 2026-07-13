import { getExperienceLevelConfig, normalizeExperienceLevel, type ExperienceLevel } from "@/lib/experience-levels";
import type { DoughToolsIconName } from "@/components/icons";

export type PizzaTroubleshootingTopicId =
  | "dough-not-rising"
  | "dough-too-sticky"
  | "dough-dry-skin"
  | "dough-balls-spread-flat"
  | "dough-underproofed"
  | "dough-overproofed"
  | "dough-too-cold"
  | "dough-too-warm"
  | "weak-gluten-structure"
  | "dough-collapses-after-rising"
  | "dough-springs-back"
  | "dough-tears"
  | "dough-sticks-to-work-surface"
  | "pizza-center-too-thin"
  | "pizza-loses-round-shape"
  | "rim-flattened-during-shaping"
  | "dough-stretches-unevenly"
  | "dough-tears-moving-to-peel"
  | "pizza-sticks-to-peel"
  | "pizza-folds-during-launch"
  | "toppings-slide-during-launch"
  | "too-much-flour-under-pizza"
  | "pizza-stretches-on-peel"
  | "launch-takes-too-long"
  | "pizza-soggy-middle"
  | "crust-burns-middle-doughy"
  | "base-burns-underneath"
  | "gummy-layer-under-toppings"
  | "top-burns-before-bottom"
  | "rim-does-not-rise"
  | "pizza-bakes-unevenly"
  | "center-raw-or-doughy"
  | "oven-loses-heat-between-pizzas"
  | "toppings-release-water"
  | "cheese-burns-too-early"
  | "cheese-releases-oil"
  | "toppings-slide-after-baking"
  | "sauce-makes-center-watery"
  | "mozzarella-releases-water"
  | "pizza-overloaded-with-toppings"
  | "toppings-cook-unevenly"
  | "rim-scorched-by-sauce-or-cheese"
  | "home-oven-pale-soft";

export type PizzaTroubleshootingCategoryId =
  | "dough-fermentation"
  | "shaping"
  | "launching"
  | "baking"
  | "toppings";

export type PizzaTroubleshootingProblem = {
  id: PizzaTroubleshootingTopicId;
  title: string;
  shortSymptom: string;
  symptomDetails?: string;
  likelyCauses: string[];
  fixNow: string[];
  preventNextTime: string[];
  quickCheck?: string;
  severity?: "common" | "advanced";
  image: PizzaTroubleshootingImage;
  relatedTopicIds?: PizzaTroubleshootingTopicId[];
};

export type PizzaTroubleshootingImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: "symptom" | "comparison" | "corrected-result";
  caption?: string;
  comparisonLabels?: {
    problem: string;
    better: string;
  };
};

export type PizzaTroubleshootingSection = {
  id: PizzaTroubleshootingCategoryId;
  title: string;
  intro: string;
  visual: {
    label: string;
    accent: string;
    motif: string;
  };
  problems: PizzaTroubleshootingProblem[];
};

export type PizzaTroubleshootingCategoryMeta = {
  id: PizzaTroubleshootingCategoryId;
  icon: DoughToolsIconName;
  plainDescription: string;
};

export type PizzaTroubleshootingSearchResult = {
  section: PizzaTroubleshootingSection;
  problem: PizzaTroubleshootingProblem;
};

export type PizzaTroubleshootingLevelPresentation = {
  level: ExperienceLevel;
  levelLabel: string;
  modeLabel: string;
  likelyCauses: string[];
  fixNow: string[];
  preventNextTime: string[];
  quickCheck?: string;
  diagnosticNote?: string;
  relatedTopicIds: PizzaTroubleshootingTopicId[];
  showMoreDetail: boolean;
  hiddenDetailCount: number;
};

function takeBeginnerItems<T>(items: T[], count: number): T[] {
  return items.slice(0, Math.min(count, items.length));
}

export function getPizzaTroubleshootingLevelPresentation(
  problem: PizzaTroubleshootingProblem,
  level: unknown,
): PizzaTroubleshootingLevelPresentation {
  const normalized = normalizeExperienceLevel(level);
  const config = getExperienceLevelConfig(normalized);

  if (normalized === "beginner") {
    const likelyCauses = takeBeginnerItems(problem.likelyCauses, 3);
    const fixNow = takeBeginnerItems(problem.fixNow, 3);
    const preventNextTime = takeBeginnerItems(problem.preventNextTime, 3);
    const relatedTopicIds = takeBeginnerItems(problem.relatedTopicIds ?? [], 3);
    const hiddenDetailCount =
      Math.max(problem.likelyCauses.length - likelyCauses.length, 0) +
      Math.max(problem.fixNow.length - fixNow.length, 0) +
      Math.max(problem.preventNextTime.length - preventNextTime.length, 0) +
      (problem.symptomDetails ? 1 : 0) +
      Math.max((problem.relatedTopicIds?.length ?? 0) - relatedTopicIds.length, 0);

    return {
      level: normalized,
      levelLabel: config.label,
      modeLabel: "Beginner view",
      likelyCauses,
      fixNow,
      preventNextTime,
      quickCheck: problem.quickCheck,
      relatedTopicIds,
      showMoreDetail: hiddenDetailCount > 0,
      hiddenDetailCount,
    };
  }

  if (normalized === "enthusiast") {
    return {
      level: normalized,
      levelLabel: config.label,
      modeLabel: "Enthusiast view",
      likelyCauses: problem.likelyCauses,
      fixNow: problem.fixNow,
      preventNextTime: problem.preventNextTime,
      quickCheck: problem.quickCheck,
      diagnosticNote: problem.symptomDetails,
      relatedTopicIds: problem.relatedTopicIds ?? [],
      showMoreDetail: false,
      hiddenDetailCount: 0,
    };
  }

  return {
    level: normalized,
    levelLabel: config.label,
    modeLabel: "Pizza Nerd view",
    likelyCauses: problem.likelyCauses,
    fixNow: problem.fixNow,
    preventNextTime: problem.preventNextTime,
    quickCheck: problem.quickCheck,
    diagnosticNote: problem.symptomDetails,
    relatedTopicIds: problem.relatedTopicIds ?? [],
    showMoreDetail: false,
    hiddenDetailCount: 0,
  };
}

export const troubleshootingCategories: Array<Pick<PizzaTroubleshootingSection, "id" | "title" | "intro">> = [
  {
    id: "dough-fermentation",
    title: "Dough & fermentation",
    intro: "Problems that start with yeast activity, time, temperature, hydration or dough strength.",
  },
  {
    id: "shaping",
    title: "Stretching & shaping",
    intro: "Problems that show up when the dough ball is opened, stretched or handled.",
  },
  {
    id: "launching",
    title: "Launching",
    intro: "Problems that happen when a topped pizza needs to slide cleanly into the oven.",
  },
  {
    id: "baking",
    title: "Baking",
    intro: "Problems caused by heat balance, oven recovery, bake time or baking surface setup.",
  },
  {
    id: "toppings",
    title: "Toppings & cheese",
    intro: "Problems caused by wet toppings, cheese moisture or too much weight in the center.",
  },
];

export const troubleshootingCategoryMeta: Record<PizzaTroubleshootingCategoryId, PizzaTroubleshootingCategoryMeta> = {
  "dough-fermentation": {
    id: "dough-fermentation",
    icon: "yeast",
    plainDescription:
      "The dough did not rise, spread too far, feels too warm, too cold, too sticky, or has weak structure.",
  },
  shaping: {
    id: "shaping",
    icon: "mixing-bowl",
    plainDescription:
      "The dough springs back, tears, sticks, stretches unevenly, or loses its shape while opening.",
  },
  launching: {
    id: "launching",
    icon: "forward",
    plainDescription:
      "The topped pizza will not slide cleanly, folds, stretches on the peel, or loses toppings during launch.",
  },
  baking: {
    id: "baking",
    icon: "oven",
    plainDescription:
      "The base, top, rim or center bakes unevenly, stays pale, burns, or changes between pizzas.",
  },
  toppings: {
    id: "toppings",
    icon: "pizza",
    plainDescription:
      "Sauce, cheese or toppings release moisture, burn, slide, overload the pizza, or cook unevenly.",
  },
};

export const troubleshootingSections: PizzaTroubleshootingSection[] = [
  {
    id: "dough-fermentation",
    title: "Dough & fermentation",
    intro: troubleshootingCategories[0].intro,
    visual: {
      label: "Time, temperature and dough strength",
      accent: "bg-leaf",
      motif: "Dough",
    },
    problems: [
      {
        id: "dough-not-rising",
        title: "Dough is not rising",
        shortSymptom:
          "The dough looks almost the same after resting, with little volume increase and few signs of fermentation.",
        quickCheck: "Look for bubbles, volume increase and a softer feel before moving on.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-not-rising.webp",
          alt: "Two covered dough containers showing a low, tight dough next to a more expanded fermented dough.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "Compare volume, bubbles and surface softness before deciding whether the dough is ready.",
          comparisonLabels: {
            problem: "Low volume and few bubbles",
            better: "Expanded and visibly fermented",
          },
        },
        likelyCauses: [
          "yeast is old or inactive",
          "room temperature is too cold",
          "dough needs more time",
          "water was too hot and weakened the yeast",
          "yeast type or amount was not matched to the fermentation plan",
        ],
        fixNow: [
          "give the dough more time",
          "move it to a slightly warmer place",
          "keep it covered so it does not dry out",
          "continue the session only when the dough shows signs of fermentation",
        ],
        preventNextTime: [
          "use fresh yeast",
          "match yeast type to the recipe",
          "plan around the real room or fridge temperature",
          "avoid very hot water when mixing",
        ],
      },
      {
        id: "dough-too-sticky",
        title: "Dough is too sticky",
        shortSymptom:
          "The dough sticks heavily to your hands, bench, container or peel and is difficult to shape.",
        quickCheck: "If it smears instead of stretching, give it rest and use only light flour or oil.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-too-sticky.webp",
          alt: "Sticky pizza dough stretching from a hand and bench scraper on a lightly floured counter.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Sticky dough often smears, clings and stretches in strands instead of releasing cleanly.",
        },
        likelyCauses: [
          "hydration is high for the flour",
          "flour is too weak for the hydration",
          "dough is too warm",
          "dough is underdeveloped",
          "not enough rest",
          "too much water was added by feel",
        ],
        fixNow: [
          "rest the dough before shaping",
          "use lightly floured or lightly oiled hands",
          "keep the bench lightly floured",
          "chill briefly if the dough is very warm",
          "avoid adding too much extra flour at once",
        ],
        preventNextTime: [
          "lower hydration slightly",
          "use stronger flour",
          "measure water accurately",
          "give the dough enough rest and structure",
        ],
      },
      {
        id: "dough-dry-skin",
        title: "Dough develops a dry skin",
        shortSymptom:
          "The dough surface turns dry, matte or leathery while the inside may still feel soft.",
        symptomDetails:
          "The outer layer can resist stretching, crack during opening or create tough patches in the dough.",
        quickCheck: "Does the surface feel leathery while the inside still feels soft?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-dry-skin.webp",
          alt: "A dough ball with a dry matte surface and small cracks next to a smoother covered dough ball.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A dry skin is usually a surface problem from airflow or uncovered bench time.",
        },
        likelyCauses: [
          "dough balls were left uncovered",
          "container was not airtight",
          "too much airflow reached the dough",
          "flour dust dried the surface",
          "long bench rest happened without cover",
        ],
        fixNow: [
          "rest the dough briefly under cover",
          "lightly moisten your hands rather than soaking the dough",
          "turn the dry side inward where practical",
          "avoid pulling directly through the dried surface",
        ],
        preventNextTime: [
          "use an airtight dough box or covered containers",
          "cover dough immediately after balling",
          "minimize open-air exposure",
          "lightly oil the container only when it fits your workflow",
        ],
        relatedTopicIds: ["dough-tears"],
      },
      {
        id: "dough-balls-spread-flat",
        title: "Dough balls spread flat",
        shortSymptom:
          "Dough balls lose their rounded shape, spread outward in the box and become difficult to lift cleanly.",
        symptomDetails:
          "They may merge into neighboring balls or spread again quickly after gentle reshaping.",
        quickCheck: "Does the dough spread again quickly after being gently reshaped?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-balls-spread-flat.webp",
          alt: "Several dough balls spreading outward and nearly touching inside a proofing box.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Flat dough balls can come from fermentation, warmth, weak structure, hydration or loose balling.",
        },
        likelyCauses: [
          "fermentation has progressed too far",
          "dough fermented too warm",
          "hydration is high for the flour strength",
          "gluten structure is weak",
          "balling was too loose or spacing was too tight",
        ],
        fixNow: [
          "handle gently with a dough scraper",
          "reduce handling and avoid tearing the dough",
          "reball only if enough structure and fermentation time remain",
          "chill briefly only when the dough is clearly too warm",
        ],
        preventNextTime: [
          "use flour strength that fits the fermentation plan",
          "lower fermentation temperature or shorten fermentation",
          "tighten balling without overworking the dough",
          "leave more spacing in the dough box",
          "lower hydration if the flour cannot support it",
        ],
        relatedTopicIds: ["dough-overproofed", "dough-too-warm", "weak-gluten-structure", "dough-collapses-after-rising"],
      },
      {
        id: "dough-underproofed",
        title: "Dough is underproofed",
        shortSymptom:
          "The dough feels tight, springs back strongly and is difficult to stretch into an open pizza base.",
        symptomDetails:
          "The rim may bake dense because the dough has limited gas expansion and relaxation.",
        quickCheck: "Does an indentation spring back almost immediately?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-underproofed.webp",
          alt: "A tight smaller dough ball beside a softer expanded dough ball with visible fermentation bubbles.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "Underproofed dough is usually tight and resistant; ready dough looks softer and more active.",
          comparisonLabels: {
            problem: "Tight and fast rebound",
            better: "Softer and visibly active",
          },
        },
        likelyCauses: [
          "fermentation time was too short",
          "dough temperature was too low",
          "yeast amount was too low or inactive",
          "dough was used too soon after refrigeration",
          "room temperature was lower than expected",
        ],
        fixNow: [
          "allow more covered resting time",
          "move the dough to a slightly warmer stable area",
          "avoid forcing the stretch",
          "reassess readiness after the dough relaxes",
        ],
        preventNextTime: [
          "start earlier",
          "track dough temperature as well as room temperature",
          "confirm yeast measurement and freshness",
          "allow adequate warm-up after cold fermentation",
          "follow the timeline as a guide, then check the dough condition",
        ],
        relatedTopicIds: ["dough-springs-back", "dough-not-rising", "dough-too-cold"],
      },
      {
        id: "dough-overproofed",
        title: "Dough is overproofed",
        shortSymptom:
          "The dough becomes very loose, fragile and hard to transfer because structure has weakened.",
        symptomDetails:
          "It may spread excessively, release gas easily, smell strongly fermented or lose shape during handling.",
        quickCheck: "Does a finger indentation remain while the dough feels fragile rather than elastic?",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/dough-overproofed.webp",
          alt: "Overproofed dough balls spreading low and wide with a fragile bubbly surface in a proofing box.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Overproofed dough often looks slack, fragile and over-expanded rather than simply relaxed.",
        },
        likelyCauses: [
          "fermentation ran too long",
          "fermentation temperature was too warm",
          "too much yeast was used",
          "flour was too weak for the schedule",
          "dough stayed warm before refrigeration or the fridge was warmer than expected",
        ],
        fixNow: [
          "handle as little as possible",
          "use a scraper and bake promptly",
          "make a smaller, less aggressively stretched pizza",
          "reball only when enough structure and time remain",
        ],
        preventNextTime: [
          "shorten fermentation",
          "reduce yeast for the same schedule",
          "lower fermentation temperature and verify fridge temperature",
          "use flour strength that fits the plan",
          "refrigerate at the planned point",
        ],
        relatedTopicIds: ["dough-balls-spread-flat", "dough-too-warm", "dough-collapses-after-rising"],
      },
      {
        id: "dough-too-cold",
        title: "Dough is too cold to stretch",
        shortSymptom:
          "The dough feels firm, stiff and resistant even when the fermentation time seems reasonable.",
        symptomDetails:
          "The center may resist thinning and spring back because the dough has not tempered enough after refrigeration.",
        quickCheck: "Does the dough feel cold in the center and spring back despite adequate fermentation time?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-too-cold.webp",
          alt: "Hands pressing a firm cold dough ball that stays thick and resists opening near a covered dough box.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Cold stiffness can look like underproofing, but the dough may simply need covered tempering time.",
        },
        likelyCauses: [
          "warm-up after refrigeration was too short",
          "dough box was very cold",
          "work surface or room was cold",
          "large dough balls needed more tempering time",
        ],
        fixNow: [
          "keep the dough covered and allow more tempering",
          "avoid direct heat or microwaving",
          "stretch gradually after rest",
          "separate dough balls only if your workflow allows it",
        ],
        preventNextTime: [
          "remove dough from refrigeration earlier",
          "plan around dough temperature, not clock time alone",
          "avoid placing dough on a very cold surface",
          "use Kitchen Mode timing where relevant",
        ],
        relatedTopicIds: ["dough-underproofed", "dough-springs-back"],
      },
      {
        id: "dough-too-warm",
        title: "Dough is too warm and loose",
        shortSymptom:
          "The dough feels soft, slack and sticky, stretches too fast and loses shape within minutes.",
        symptomDetails:
          "It may become difficult to transfer because warmth accelerates fermentation and weakens handling.",
        quickCheck: "Does the dough feel noticeably warm and lose shape within minutes of handling?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-too-warm.webp",
          alt: "Very warm slack dough losing shape and sticking to a bench scraper on a lightly floured counter.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Warm loose dough needs gentle handling and less bench exposure, not repeated flour folding.",
        },
        likelyCauses: [
          "room or dough box was too warm",
          "dough stayed out of refrigeration too long",
          "fermentation progressed too far",
          "hydration is high for the conditions",
          "mixing added too much friction heat",
        ],
        fixNow: [
          "work gently and efficiently",
          "use a scraper",
          "move to a cooler work area",
          "reduce bench exposure",
          "use only a light dusting of flour",
        ],
        preventNextTime: [
          "control final dough temperature",
          "reduce warm bench time",
          "use cooler mixing water when appropriate",
          "verify fermentation temperature",
          "match hydration to flour strength and room conditions",
        ],
        relatedTopicIds: ["dough-overproofed", "dough-too-sticky", "dough-balls-spread-flat"],
      },
      {
        id: "weak-gluten-structure",
        title: "Weak gluten structure",
        shortSymptom:
          "The dough tears before it can stretch thin, spreads instead of holding shape and retains gas poorly.",
        symptomDetails:
          "The rim may lack structure even when the dough has fermented.",
        quickCheck: "Does the dough tear before it can form a thin, elastic membrane?",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/weak-gluten-structure.webp",
          alt: "Hands stretching a small dough membrane that tears before it becomes thin and elastic.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Weak gluten shows up as tearing, poor gas retention and dough that spreads instead of stretching.",
        },
        likelyCauses: [
          "mixing or folding did not build enough structure",
          "flour is too weak for the hydration or fermentation",
          "hydration is too high for the flour",
          "fermentation has weakened the structure",
          "dough was handled too aggressively",
        ],
        fixNow: [
          "rest the dough",
          "use gentler stretching",
          "make a smaller pizza",
          "avoid repeated reshaping",
          "add a fold only if the fermentation stage safely allows it",
        ],
        preventNextTime: [
          "improve mixing or folding schedule",
          "use suitable flour strength",
          "lower hydration when needed",
          "allow proper rest after mixing",
          "avoid overfermentation and rough handling",
        ],
        relatedTopicIds: ["dough-tears", "dough-balls-spread-flat"],
      },
      {
        id: "dough-collapses-after-rising",
        title: "Dough collapses after rising",
        shortSymptom:
          "The dough rises first, then sinks, wrinkles and becomes noticeably weaker.",
        symptomDetails:
          "Gas escapes and the structure no longer supports the expansion it built earlier.",
        quickCheck: "Did the dough rise well first, then become wrinkled and noticeably weaker?",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/dough-collapses-after-rising.webp",
          alt: "A risen dough mass in a container with a wrinkled sunken surface after collapse.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Collapsed dough is different from simple spreading because it rose first, then lost support.",
        },
        likelyCauses: [
          "fermentation progressed too far",
          "gluten structure was too weak",
          "too much yeast was used",
          "dough temperature was too high",
          "abrupt handling or temperature change released gas",
        ],
        fixNow: [
          "handle as little as possible",
          "bake promptly",
          "avoid trying to rebuild all lost gas",
          "reball only when enough fermentation time remains",
          "use a smaller format if needed",
        ],
        preventNextTime: [
          "shorten fermentation",
          "lower yeast for the same schedule",
          "control dough temperature",
          "strengthen mixing or folding",
          "avoid rough movement and use flour suited to the schedule",
        ],
        relatedTopicIds: ["dough-overproofed", "dough-balls-spread-flat", "weak-gluten-structure"],
      },
    ],
  },
  {
    id: "shaping",
    title: "Stretching & shaping",
    intro: troubleshootingCategories[1].intro,
    visual: {
      label: "Relaxed dough and gentle handling",
      accent: "bg-tomato",
      motif: "Shape",
    },
    problems: [
      {
        id: "dough-springs-back",
        title: "Dough springs back",
        shortSymptom: "The dough stretches, then quickly pulls back and refuses to stay open.",
        quickCheck: "Cover it and wait before forcing the shape wider.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-springs-back.webp",
          alt: "A tight dough round beside a relaxed stretched dough disk that holds its shape.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "A tight dough ball resists opening; a rested dough disk stays wider without snapping back.",
          comparisonLabels: {
            problem: "Tight and recoiling",
            better: "Relaxed and holding shape",
          },
        },
        likelyCauses: [
          "dough is too cold",
          "gluten is too tight",
          "dough has not rested enough",
          "dough balls were shaped too tightly",
          "the dough was handled too aggressively",
        ],
        fixNow: [
          "cover the dough and rest it for 10–20 minutes",
          "let cold dough warm up before shaping",
          "stretch in stages instead of forcing it",
          "keep the rim intact and work gently from the center outward",
        ],
        preventNextTime: [
          "take dough balls out early enough before baking",
          "allow enough final rest after balling",
          "avoid over-tightening the dough balls",
        ],
      },
      {
        id: "dough-tears",
        title: "Dough tears or gets holes",
        shortSymptom:
          "The dough rips during shaping, becomes very thin in the center, or develops holes.",
        quickCheck: "Stop stretching as soon as a weak spot appears.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-tears.webp",
          alt: "Pizza dough stretched thin with a small hole forming in the center.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A small tear usually means the dough needs gentler handling or more rest before continuing.",
        },
        likelyCauses: [
          "gluten is underdeveloped",
          "dough has not rested enough",
          "dough is too dry",
          "dough is too cold",
          "the center was stretched too thin",
          "shaping was too aggressive",
        ],
        fixNow: [
          "stop stretching and let the dough rest",
          "pinch small holes closed",
          "use gentler movements",
          "avoid pressing all air out of the rim",
        ],
        preventNextTime: [
          "develop the dough better during mixing or folding",
          "give it enough rest",
          "handle the center gently",
          "keep dough covered so it does not dry out",
        ],
      },
      {
        id: "dough-sticks-to-work-surface",
        title: "Dough sticks to the work surface",
        shortSymptom:
          "The dough adheres to the bench, drags when rotated, or tears when you try to lift it.",
        symptomDetails:
          "This happens before peel transfer: the underside is gripping the work surface instead of sliding freely as you shape.",
        quickCheck: "Can the dough rotate freely after each few presses?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-sticks-to-work-surface.webp",
          alt: "Raw pizza dough sticking to a work surface while a dough scraper loosens one edge.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Bench sticking shows up while shaping, before the pizza ever reaches the peel.",
        },
        likelyCauses: [
          "too little bench flour",
          "dough is very warm, wet or high hydration",
          "the bench material grips the dough",
          "dough sat too long in one position",
          "too much pressure was used while opening",
        ],
        fixNow: [
          "loosen the stuck area carefully with a bench scraper",
          "add a small amount of flour only under the sticky section",
          "rotate the dough frequently",
          "reduce pressure and avoid folding excess flour into the dough",
        ],
        preventNextTime: [
          "lightly flour the bench before placing the dough down",
          "keep dough temperature under control",
          "work efficiently and keep the dough moving",
          "use a smooth opening surface",
          "adjust hydration if the flour consistently cannot support it",
        ],
        relatedTopicIds: ["dough-too-sticky", "dough-too-warm", "dough-tears-moving-to-peel"],
      },
      {
        id: "pizza-center-too-thin",
        title: "Center becomes too thin",
        shortSymptom:
          "The center turns translucent, weak or tear-prone while the rim remains much thicker.",
        symptomDetails:
          "The pizza may leak sauce or toppings through the middle if that weak area is topped heavily.",
        quickCheck: "Can you see the bench clearly through one central area while the rest remains thicker?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-center-too-thin.webp",
          alt: "Raw pizza dough with a translucent thin center and a thicker rim during shaping.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A thin center is a local weak spot, not the same as a dough with weak structure everywhere.",
        },
        likelyCauses: [
          "too much pressure was placed in the middle",
          "the dough was lifted or stretched from the center",
          "hand pressure was uneven",
          "the target diameter is too large for the dough-ball weight",
          "dough is too warm, weak or aggressively gravity-stretched",
        ],
        fixNow: [
          "stop stretching and reduce the final diameter",
          "move the dough carefully to the peel",
          "pinch only a tiny hole closed if practical",
          "avoid heavy wet toppings over the weak area",
        ],
        preventNextTime: [
          "press from the center outward without over-thinning the final center",
          "leave the rim untouched",
          "rotate during opening",
          "match diameter to dough-ball weight",
          "use gentler hand pressure",
        ],
        relatedTopicIds: ["dough-tears", "dough-tears-moving-to-peel", "weak-gluten-structure"],
      },
      {
        id: "pizza-loses-round-shape",
        title: "Pizza loses its round shape",
        shortSymptom:
          "The dough becomes oval or irregular, with one side stretching more than the other.",
        symptomDetails:
          "A slightly rustic shape is fine; the problem is when uneven handling keeps making the dough weaker or harder to transfer.",
        quickCheck: "Does one side remain visibly shorter before the dough reaches the peel?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-loses-round-shape.webp",
          alt: "Raw pizza dough stretched into an uneven oval shape on a floured work surface.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Correct shape gently from the shorter side; do not chase perfect roundness until the dough weakens.",
        },
        likelyCauses: [
          "uneven pressure during shaping",
          "not rotating the dough often enough",
          "pulling from one edge",
          "dough sticking to the bench",
          "dough is too soft, warm or roughly transferred",
        ],
        fixNow: [
          "correct gently from the thicker or shorter edge",
          "rotate and stretch only the short side",
          "stop before overworking the dough",
          "accept a slightly irregular shape rather than weakening it further",
        ],
        preventNextTime: [
          "rotate continuously while opening",
          "use even hand pressure",
          "keep the dough moving on the bench",
          "transfer with both hands or forearms evenly",
          "avoid stretching after toppings are added",
        ],
        relatedTopicIds: ["dough-stretches-unevenly", "pizza-stretches-on-peel"],
      },
      {
        id: "rim-flattened-during-shaping",
        title: "Rim gets flattened during shaping",
        shortSymptom:
          "The edge looks pressed, dense or deflated and loses the gas that would normally help it lift.",
        symptomDetails:
          "This matters most for pizza styles that rely on an aerated rim; flatter styles may intentionally use less rim height.",
        quickCheck: "Is the outer 1–2 cm visibly flatter than it was before shaping?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/rim-flattened-during-shaping.webp",
          alt: "Hands pressing too close to the rim of a raw pizza dough base on a floured bench.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "For airy-rim styles, keep pressure inside the rim rather than flattening the perimeter.",
        },
        likelyCauses: [
          "pressing all the way to the edge",
          "pinching or squeezing the rim",
          "using a rolling pin for a style that needs an aerated rim",
          "aggressive handling after fermentation",
          "transferring by gripping the outer edge",
        ],
        fixNow: [
          "stop pressing the outer edge",
          "continue stretching from inside the rim",
          "handle the perimeter minimally",
          "make a slightly smaller pizza if needed",
        ],
        preventNextTime: [
          "leave a clear untouched rim",
          "press from the center outward",
          "avoid rolling pins for styles that rely on an aerated rim",
          "lift from under the dough rather than squeezing the edge",
          "transfer gently",
        ],
        relatedTopicIds: ["dough-not-rising", "dough-underproofed"],
      },
      {
        id: "dough-stretches-unevenly",
        title: "Dough stretches unevenly",
        shortSymptom:
          "One section stays thick while another thins quickly, leaving uneven patches in the base.",
        symptomDetails:
          "This is about inconsistent thickness during shaping, not a single tear or a general lack of gluten strength.",
        quickCheck: "Does the same section repeatedly stay thick while the opposite side thins?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-stretches-unevenly.webp",
          alt: "Raw pizza dough with thick and thin patches while hands work the thicker area only.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Work the thicker areas and stop stretching the parts that are already thin.",
        },
        likelyCauses: [
          "dough temperature is uneven",
          "outer surface is warm while the center is cold",
          "pressing pressure is inconsistent",
          "flour lumps or dry skin resist stretching",
          "dough structure is stronger on one side or it needed more rest after reballing",
        ],
        fixNow: [
          "pause and rest the dough briefly under cover",
          "work only the thicker areas",
          "rotate frequently",
          "reduce the final diameter",
          "avoid repeatedly stretching the thinnest section",
        ],
        preventNextTime: [
          "allow even dough temperature",
          "ball consistently",
          "cover dough properly",
          "use uniform pressing",
          "avoid cold spots and give reballed dough enough rest",
        ],
        relatedTopicIds: ["pizza-loses-round-shape", "dough-dry-skin", "dough-too-cold"],
      },
      {
        id: "dough-tears-moving-to-peel",
        title: "Dough tears while moving to the peel",
        shortSymptom:
          "The dough rips as it is lifted from the bench or transferred toward the peel.",
        symptomDetails:
          "Unlike general tearing during shaping, this problem starts during the transfer from work surface to peel.",
        quickCheck: "Did the tear begin where the dough was sticking or visibly thinnest?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/dough-tears-moving-to-peel.webp",
          alt: "Raw stretched pizza dough tearing while being moved from the work surface to a wooden peel.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Transfer tears usually begin at a stuck underside or a center that was already too thin.",
        },
        likelyCauses: [
          "dough stuck to the bench",
          "center was stretched too thin",
          "gluten structure is weak",
          "transfer was too slow or unsupported",
          "fingers gripped through the dough or the peel was too far away",
        ],
        fixNow: [
          "stop and support the torn area",
          "place the dough back down carefully",
          "pinch a small tear closed if practical",
          "reduce the final size",
          "discard only when the base cannot be restored safely",
        ],
        preventNextTime: [
          "confirm the dough moves freely before lifting",
          "place the peel close to the bench",
          "use both hands or forearms evenly",
          "avoid gripping the center",
          "keep the center slightly thicker and work faster after final shaping",
        ],
        relatedTopicIds: ["dough-sticks-to-work-surface", "pizza-center-too-thin", "dough-tears"],
      },
    ],
  },
  {
    id: "launching",
    title: "Launching",
    intro: troubleshootingCategories[2].intro,
    visual: {
      label: "Quick topping and clean release",
      accent: "bg-tomato",
      motif: "Launch",
    },
    problems: [
      {
        id: "pizza-sticks-to-peel",
        title: "Pizza sticks to the peel",
        shortSymptom:
          "The topped pizza will not slide from the peel into the oven, or one section stays attached and stretches.",
        symptomDetails:
          "This is a peel-stage problem: the pizza should move freely before you approach the oven.",
        quickCheck: "Does the pizza move freely with a short forward-and-back shake before launch?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-sticks-to-peel.webp",
          alt: "A raw topped pizza stuck to a wooden peel while a hand lifts the edge with a small spatula.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Before launch, the topped pizza should slide freely when the peel is shaken gently.",
        },
        likelyCauses: [
          "peel is not dusted lightly and evenly",
          "dough is too wet or thin",
          "sauce or moisture leaked through the base",
          "pizza sat too long on the peel",
          "toppings are too heavy or the peel surface is rough or damp",
        ],
        fixNow: [
          "gently lift the stuck edge and add a small amount of flour",
          "use a thin spatula only when practical and safe",
          "shake lightly to confirm movement",
          "remove excess wet topping if necessary",
          "launch promptly once the pizza moves freely",
        ],
        preventNextTime: [
          "dust the peel lightly and evenly",
          "build the pizza quickly",
          "confirm the base is intact",
          "use controlled topping amounts",
          "shake-test before approaching the oven and keep the peel clean and dry",
        ],
        relatedTopicIds: ["launch-takes-too-long", "toppings-slide-during-launch", "toppings-release-water", "pizza-stretches-on-peel"],
      },
      {
        id: "pizza-folds-during-launch",
        title: "Pizza folds during launch",
        shortSymptom:
          "The leading edge folds under, one side overlaps, or the pizza lands partly doubled on the baking surface.",
        quickCheck: "Does the leading edge begin moving while the rear remains stuck?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-folds-during-launch.webp",
          alt: "A topped raw pizza folding at the leading edge while sliding from a wooden peel toward the oven floor.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Folding usually starts when the front releases but the rear remains stuck or the launch motion hesitates.",
        },
        likelyCauses: [
          "launch motion was hesitant",
          "peel angle was too steep",
          "pizza was not moving freely before launch",
          "launch started too far from the baking surface",
          "pizza is overloaded, too large for the peel or withdrawn unevenly",
        ],
        fixNow: [
          "unfold carefully with a turning peel only if safe and accessible",
          "avoid aggressive correction near flame or heating elements",
          "continue baking if recovery is unsafe",
          "remove a severely folded pizza only when safe to do so",
        ],
        preventNextTime: [
          "confirm free movement before launch",
          "use one smooth forward-and-back motion",
          "launch close to the baking surface",
          "align the peel with the intended landing spot",
          "make the pizza slightly smaller and reduce topping weight",
        ],
        relatedTopicIds: ["pizza-sticks-to-peel", "pizza-stretches-on-peel", "launch-takes-too-long"],
      },
      {
        id: "toppings-slide-during-launch",
        title: "Toppings slide during launch",
        shortSymptom:
          "Cheese, sauce or toppings move toward one side or pile at the front as the pizza is launched.",
        symptomDetails:
          "This is launch-specific movement, not the same as toppings releasing water during the bake.",
        quickCheck: "Do the toppings move when you perform the shake-test?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/toppings-slide-during-launch.webp",
          alt: "Toppings and sauce sliding toward the front of a raw pizza on a tilted peel before launch.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "If toppings move during the shake-test, reduce load and correct the distribution before launch.",
        },
        likelyCauses: [
          "launch was too abrupt or the peel angle was too steep",
          "pizza is overloaded",
          "toppings are wet or unevenly distributed",
          "pizza was stuck before release",
          "sauce was spread too close to the edge",
        ],
        fixNow: [
          "correct only if safe before launch",
          "remove excess wet topping",
          "redistribute toppings while the pizza is still on the peel",
          "clean sauce from peel edges",
          "launch with a smoother motion",
        ],
        preventNextTime: [
          "use less topping",
          "drain wet ingredients",
          "distribute toppings evenly",
          "leave a clean border",
          "confirm the pizza slides before approaching the oven",
        ],
        relatedTopicIds: ["pizza-sticks-to-peel", "toppings-release-water", "pizza-folds-during-launch"],
      },
      {
        id: "too-much-flour-under-pizza",
        title: "Too much flour or semolina burns underneath",
        shortSymptom:
          "Loose flour or semolina under the pizza burns into bitter specks, smoke or a gritty scorched base.",
        symptomDetails:
          "The visible symptom may appear after baking, but the cause often starts during bench and peel preparation.",
        quickCheck: "Can you see loose flour or semolina moving under the pizza before launch?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/too-much-flour-under-pizza.webp",
          alt: "A raw topped pizza lifted on a peel with excess flour and semolina visible underneath.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Use only enough dusting flour for release; loose buildup can scorch on a hot oven floor.",
        },
        likelyCauses: [
          "too much bench flour",
          "too much peel dusting",
          "flour collected under the center",
          "repeated launches happened without cleaning",
          "very hot oven floor or heavy coarse semolina use",
        ],
        fixNow: [
          "brush loose flour from the peel before topping",
          "lift the dough and remove excess flour when practical",
          "clean the oven floor between pizzas using safe equipment",
          "reduce peel dusting for the next pizza",
        ],
        preventNextTime: [
          "use only enough flour for release",
          "shake off excess before transferring",
          "keep bench and peel clean",
          "use an appropriate dusting flour",
          "monitor oven-floor buildup",
        ],
        relatedTopicIds: ["base-burns-underneath", "pizza-sticks-to-peel"],
      },
      {
        id: "pizza-stretches-on-peel",
        title: "Pizza stretches out of shape on the peel",
        shortSymptom:
          "The pizza becomes longer or wider after transfer, thins in the center, or hangs over the peel edge.",
        symptomDetails:
          "This happens after bench shaping: the peel stage keeps deforming the pizza before launch.",
        quickCheck: "Does the pizza continue changing shape while it sits on the peel?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-stretches-on-peel.webp",
          alt: "A topped raw pizza stretched into a long distorted shape while sitting on a wooden peel.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Once the pizza is on the peel, repeated shaking and slow topping can keep stretching the base.",
        },
        likelyCauses: [
          "dough is too warm or weak",
          "peel is too small",
          "transfer was rough",
          "shake-tests were repeated too aggressively",
          "topping took too long or toppings are heavy",
        ],
        fixNow: [
          "stop further stretching",
          "adjust the edge gently",
          "remove toppings from overhanging areas",
          "launch promptly",
          "reduce size only before topping when practical",
        ],
        preventNextTime: [
          "use a suitably sized peel",
          "make a smaller pizza",
          "top quickly",
          "control dough temperature",
          "transfer evenly and avoid repeated aggressive shake-tests",
        ],
        relatedTopicIds: ["pizza-loses-round-shape", "pizza-sticks-to-peel", "dough-too-warm"],
      },
      {
        id: "launch-takes-too-long",
        title: "Launch takes too long",
        shortSymptom:
          "The pizza sits on the peel while the base absorbs moisture, begins sticking or deforms before baking.",
        quickCheck: "Has the pizza been sitting on the peel long enough for the base to absorb moisture?",
        severity: "common",
        image: {
          src: "/images/troubleshooting/launch-takes-too-long.webp",
          alt: "A topped raw pizza waiting on a peel beside prepared toppings and a hot oven.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Once the pizza is on the peel, the safest path is a simple topping plan and a prompt shake-test.",
        },
        likelyCauses: [
          "toppings were not prepared beforehand",
          "too many toppings or repeated adjustments slowed the workflow",
          "oven was not ready",
          "peel is too small or the pizza was built on the peel too slowly",
          "launch technique feels uncertain",
        ],
        fixNow: [
          "stop adding toppings",
          "confirm the oven is ready",
          "shake-test immediately",
          "remove excess wet ingredients",
          "launch once the pizza moves freely",
        ],
        preventNextTime: [
          "prepare toppings before shaping",
          "keep the topping plan simple",
          "preheat fully",
          "practice the launch motion with an untopped dough or cloth outside the oven",
          "use a clear sequence and minimize time on the peel",
        ],
        relatedTopicIds: ["pizza-sticks-to-peel", "toppings-slide-during-launch", "pizza-stretches-on-peel"],
      },
    ],
  },
  {
    id: "baking",
    title: "Baking",
    intro: troubleshootingCategories[3].intro,
    visual: {
      label: "Heat balance and oven recovery",
      accent: "bg-orange",
      motif: "Bake",
    },
    problems: [
      {
        id: "pizza-soggy-middle",
        title: "Pizza is soggy in the middle",
        shortSymptom: "The center is wet, soft or doughy even when the rim looks baked.",
        symptomDetails:
          "This is a broad moisture and bake-balance problem. If only the layer under the toppings is gummy, compare it with the gummy-layer topic before changing the whole dough.",
        quickCheck: "Check whether the center is overloaded or the baking surface has cooled down.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-soggy-middle.webp",
          alt: "A baked pizza with a wet, soft center and a lifted slice drooping from the middle.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A soggy center often shows as pooled moisture or a slice that droops despite a baked rim.",
        },
        likelyCauses: [
          "too much sauce",
          "wet mozzarella or toppings",
          "too many toppings",
          "dough center is too thick",
          "stone or steel is not hot enough",
          "oven has not recovered between pizzas",
        ],
        fixNow: [
          "bake slightly longer if the top is not burning",
          "use less sauce next time",
          "drain mozzarella well",
          "keep the center lighter",
          "let the stone or steel reheat before the next pizza",
        ],
        preventNextTime: [
          "stretch the center thinner",
          "use less wet topping load",
          "preheat the oven, stone or steel fully",
          "give the oven time to recover between pizzas",
        ],
        relatedTopicIds: [
          "gummy-layer-under-toppings",
          "center-raw-or-doughy",
          "sauce-makes-center-watery",
          "mozzarella-releases-water",
          "pizza-overloaded-with-toppings",
        ],
      },
      {
        id: "crust-burns-middle-doughy",
        title: "Crust burns but middle is doughy",
        shortSymptom: "The rim gets dark or burns before the center and base are fully cooked.",
        symptomDetails:
          "This is a heat-balance issue: the outside is racing ahead while the center still needs time.",
        quickCheck: "Compare top heat with bottom heat before changing the dough.",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/crust-burns-middle-doughy.webp",
          alt: "A pizza with a dark burned rim and a pale undercooked-looking center near an oven flame.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "This points to too much top heat or flame before the center and base have cooked through.",
        },
        likelyCauses: [
          "top heat or flame is too strong",
          "stone is not heat-soaked enough",
          "pizza is too close to the flame",
          "dough is too thick",
          "toppings are too heavy or wet",
        ],
        fixNow: [
          "rotate the pizza more often",
          "move it away from the strongest flame if possible",
          "reduce flame after launch in a pizza oven",
          "give the base more time if the top can handle it",
        ],
        preventNextTime: [
          "preheat the stone properly",
          "manage flame during the bake",
          "stretch thinner",
          "use fewer wet toppings",
          "avoid overloading the center",
        ],
        relatedTopicIds: ["top-burns-before-bottom", "center-raw-or-doughy", "pizza-bakes-unevenly"],
      },
      {
        id: "base-burns-underneath",
        title: "Base burns underneath",
        shortSymptom: "The bottom burns before the top is ready, often with bitter black flour spots.",
        symptomDetails:
          "This is mostly bottom-heat and launch-flour management, not the same as a pale home-oven base.",
        quickCheck: "Look for loose burnt flour and a baking surface that is too hot for the dough.",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/base-burns-underneath.webp",
          alt: "The underside of a pizza base with black burned flour spots and over-dark patches.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Burned flour spots underneath usually mean excess launch flour or an overly hot surface.",
        },
        likelyCauses: [
          "too much flour or semolina under the pizza",
          "stone is too hot for the dough style",
          "pizza stayed too long in one spot",
          "dough has sugar or oil and is baked too hot",
          "the oven is not managed between pizzas",
        ],
        fixNow: [
          "rotate earlier",
          "move the pizza to a slightly cooler area if possible",
          "remove loose burnt flour from the oven floor between pizzas",
        ],
        preventNextTime: [
          "use less launch flour",
          "brush off excess flour before launch",
          "match dough style to oven temperature",
          "avoid sugar/oil-rich doughs at very high heat",
        ],
        relatedTopicIds: ["home-oven-pale-soft", "too-much-flour-under-pizza", "top-burns-before-bottom"],
      },
      {
        id: "home-oven-pale-soft",
        title: "Home oven pizza is pale or soft",
        shortSymptom: "The pizza bakes slowly, the crust stays pale, or the base lacks crispness.",
        symptomDetails:
          "This covers the bottom staying pale and soft in a lower-power oven, usually from limited surface heat or too much moisture.",
        quickCheck: "Check preheat time, surface heat and whether the oven is at its hottest safe setting.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/home-oven-pale-soft.webp",
          alt: "A home oven pizza slice with a pale, soft underside held in front of the oven.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A pale soft base usually needs stronger surface heat, longer preheating or a thinner center.",
        },
        likelyCauses: [
          "oven is not hot enough",
          "stone or steel was not preheated long enough",
          "no stone, steel or hot baking surface is used",
          "too much moisture from sauce or toppings",
          "dough is too thick",
        ],
        fixNow: [
          "bake longer if needed",
          "move the pizza closer to stronger heat if safe",
          "finish briefly under the grill or broiler if appropriate for the oven",
        ],
        preventNextTime: [
          "preheat longer",
          "use a pizza stone, steel or hot tray if available",
          "use the hottest safe oven setting",
          "reduce wet toppings",
          "stretch the base thinner",
        ],
        relatedTopicIds: ["base-burns-underneath", "oven-loses-heat-between-pizzas", "pizza-soggy-middle"],
      },
      {
        id: "gummy-layer-under-toppings",
        title: "Gummy layer under the toppings",
        shortSymptom: "A sticky, dense layer forms just below the sauce, cheese or toppings.",
        symptomDetails:
          "This is unlike a center that is raw all the way through: the gummy layer is concentrated under the toppings while other parts may look baked.",
        quickCheck: "Lift a slice and look for a translucent sticky band directly under the toppings.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/gummy-layer-under-toppings.webp",
          alt: "A pizza slice cross-section showing a sticky gummy layer directly beneath the toppings.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A gummy band under the toppings usually points to moisture load or a center that cannot finish baking quickly enough.",
        },
        likelyCauses: [
          "too much sauce or wet cheese",
          "toppings are concentrated in the center",
          "center was stretched too thick",
          "baking surface is not hot enough",
        ],
        fixNow: [
          "bake a little longer if the top can handle it",
          "keep the next pizza lighter in the center",
          "let the baking surface recover before launching again",
        ],
        preventNextTime: [
          "use a thinner sauce layer",
          "drain wet cheese and toppings",
          "stretch the center evenly",
          "preheat the stone or steel fully",
        ],
        relatedTopicIds: ["pizza-soggy-middle", "center-raw-or-doughy", "sauce-makes-center-watery"],
      },
      {
        id: "top-burns-before-bottom",
        title: "Top burns before the bottom is ready",
        shortSymptom: "Cheese, toppings or the rim darken while the underside still needs more bake time.",
        symptomDetails:
          "This is the opposite of a base that burns first: the top heat is ahead of the bottom heat.",
        quickCheck: "If the top already dark but the underside is still pale, rebalance top and bottom heat.",
        severity: "advanced",
        image: {
          src: "/images/troubleshooting/top-burns-before-bottom.webp",
          alt: "A pizza with a dark burned top and a pale soft underside visible near the oven.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "When the top races ahead, the pizza needs more bottom heat or gentler top heat.",
          comparisonLabels: {
            problem: "Top is dark before the base is ready",
            better: "Top and bottom finish together",
          },
        },
        likelyCauses: [
          "too much top heat or broiler heat",
          "baking surface was not heat-soaked",
          "pizza is too close to flame",
          "wet or heavy toppings slow the base",
        ],
        fixNow: [
          "move away from the strongest top heat if possible",
          "reduce flame after launch in a pizza oven",
          "finish longer only if the top is not getting worse",
        ],
        preventNextTime: [
          "preheat the stone or steel longer",
          "use less top heat at launch",
          "stretch thinner and top lighter",
          "give the oven time to recover between pizzas",
        ],
        relatedTopicIds: ["base-burns-underneath", "crust-burns-middle-doughy", "oven-loses-heat-between-pizzas"],
      },
      {
        id: "rim-does-not-rise",
        title: "Rim does not rise",
        shortSymptom: "The cornicione stays flat, dense or bready instead of puffing in the oven.",
        symptomDetails:
          "This is not the same as dough that never fermented; it can also happen when gas is pressed out of the rim during shaping.",
        quickCheck: "Check whether the rim was compressed while opening the dough.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/rim-does-not-rise.webp",
          alt: "A baked pizza with a flat dense rim that did not puff in the oven.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A flat rim can come from shaping pressure, weak fermentation or a bake that does not give enough oven spring.",
        },
        likelyCauses: [
          "rim was pressed flat during shaping",
          "dough was underproofed or overproofed",
          "gluten structure is weak",
          "oven was not hot enough for strong oven spring",
        ],
        fixNow: [
          "there is little to fix once baked",
          "use the next dough ball with gentler rim handling",
          "avoid pressing the outer edge while stretching",
        ],
        preventNextTime: [
          "preserve gas in the rim",
          "ferment until the dough is relaxed and lively",
          "preheat the oven fully",
          "handle the dough ball gently",
        ],
        relatedTopicIds: ["rim-flattened-during-shaping", "dough-underproofed", "weak-gluten-structure"],
      },
      {
        id: "pizza-bakes-unevenly",
        title: "Pizza bakes unevenly",
        shortSymptom: "One side is dark or cooked while another side stays pale, soft or underbaked.",
        symptomDetails:
          "Uneven baking usually comes from heat zones, rotation timing or uneven pizza thickness.",
        quickCheck: "Compare the side nearest the heat source with the side that stayed pale.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-bakes-unevenly.webp",
          alt: "A pizza with one side dark and blistered while the opposite side remains pale.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "Uneven color is a strong clue that rotation, heat zones or thickness need attention.",
          comparisonLabels: {
            problem: "One side bakes much faster",
            better: "Pizza browns evenly after rotation",
          },
        },
        likelyCauses: [
          "pizza was not rotated often enough",
          "oven has a strong hot spot",
          "pizza thickness is uneven",
          "stone or steel has uneven heat",
        ],
        fixNow: [
          "rotate toward the pale side",
          "move the pizza to a more balanced zone if possible",
          "finish the pale side gently without burning the dark side",
        ],
        preventNextTime: [
          "rotate earlier and more predictably",
          "learn the oven hot spots",
          "stretch to an even thickness",
          "preheat the baking surface fully",
        ],
        relatedTopicIds: ["top-burns-before-bottom", "base-burns-underneath", "toppings-cook-unevenly"],
      },
      {
        id: "center-raw-or-doughy",
        title: "Center stays raw or doughy",
        shortSymptom: "The dough itself stays raw, dense or pasty in the center after baking.",
        symptomDetails:
          "Here the dough itself is underbaked, not just a wet sauce or cheese layer.",
        quickCheck: "Cut the center and check whether the crumb is raw rather than simply wet from toppings.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/center-raw-or-doughy.webp",
          alt: "A cut pizza center showing raw doughy crumb beneath the toppings.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A doughy center needs a thinner center, better surface heat or a lighter topping load.",
        },
        likelyCauses: [
          "center was left too thick",
          "pizza was overloaded",
          "bake was too short",
          "stone or steel was not hot enough",
        ],
        fixNow: [
          "return to the oven if the top is not burned",
          "finish with gentler heat if needed",
          "make the next pizza thinner in the center",
        ],
        preventNextTime: [
          "stretch the center evenly",
          "use fewer wet toppings",
          "preheat the baking surface fully",
          "allow oven recovery between pizzas",
        ],
        relatedTopicIds: ["pizza-soggy-middle", "gummy-layer-under-toppings", "pizza-overloaded-with-toppings"],
      },
      {
        id: "oven-loses-heat-between-pizzas",
        title: "Oven loses heat between pizzas",
        shortSymptom: "The first pizza bakes well, but later pizzas turn pale, soft or slower.",
        symptomDetails:
          "This is an oven recovery problem: the baking surface and oven air have not rebuilt enough heat between launches.",
        quickCheck: "Compare the first pizza with the second or third pizza from the same oven session.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/oven-loses-heat-between-pizzas.webp",
          alt: "Two pizzas from the same bake session, one well browned and one paler from oven heat loss.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "If later pizzas get paler, give the oven or baking surface time to recover.",
          comparisonLabels: {
            problem: "Later pizza bakes pale after heat loss",
            better: "Oven recovers before the next launch",
          },
        },
        likelyCauses: [
          "stone or steel lost heat after launch",
          "door was open too long",
          "pizzas were baked too close together",
          "oven thermostat cycles slowly",
        ],
        fixNow: [
          "pause before the next pizza",
          "let the oven return to temperature",
          "use a simpler topping load while heat is lower",
        ],
        preventNextTime: [
          "preheat longer",
          "wait between pizzas when needed",
          "keep oven-door openings short",
          "use a steel or stone that stores enough heat",
        ],
        relatedTopicIds: ["home-oven-pale-soft", "top-burns-before-bottom", "pizza-soggy-middle"],
      },
    ],
  },
  {
    id: "toppings",
    title: "Toppings & cheese",
    intro: troubleshootingCategories[4].intro,
    visual: {
      label: "Moisture control and lighter topping load",
      accent: "bg-ink",
      motif: "Toppings",
    },
    problems: [
      {
        id: "toppings-release-water",
        title: "Toppings release too much water",
        shortSymptom:
          "The pizza looks watery, cheese slides, the center softens, or toppings pool liquid during baking.",
        symptomDetails:
          "This is the general wet-topping problem. Use the sauce and mozzarella topics when the moisture source is clearly one ingredient.",
        quickCheck: "Look for wet cheese, watery vegetables, thin sauce or too much topping in the center.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/toppings-release-water.webp",
          alt: "A pizza with vegetables and cheese releasing liquid into the center during baking.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Watery toppings can pool liquid in the center and make cheese or vegetables slide.",
        },
        likelyCauses: [
          "mozzarella was too wet",
          "mushrooms, vegetables or fresh toppings released water",
          "sauce was too thin",
          "too many toppings were used",
          "toppings were concentrated in the center",
        ],
        fixNow: [
          "use less wet topping on the next pizza",
          "drain mozzarella",
          "keep the center lighter",
          "bake watery vegetables first if needed",
        ],
        preventNextTime: [
          "drain or dry wet ingredients",
          "use thicker sauce",
          "pre-cook watery vegetables when needed",
          "use fewer toppings per pizza",
          "spread toppings evenly and lightly",
        ],
        relatedTopicIds: [
          "sauce-makes-center-watery",
          "mozzarella-releases-water",
          "pizza-overloaded-with-toppings",
          "toppings-slide-after-baking",
        ],
      },
      {
        id: "cheese-burns-too-early",
        title: "Cheese burns before the pizza is ready",
        shortSymptom: "Cheese browns, blisters or burns before the crust and base finish baking.",
        symptomDetails:
          "This is a topping timing and heat-balance issue, not necessarily a problem with the dough.",
        quickCheck: "If the cheese dark while the base is pale, the top is ahead of the bake.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/cheese-burns-too-early.webp",
          alt: "A pizza with cheese browned and burned before the base looks fully baked.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Cheese that burns early often needs gentler top heat, less cheese or later cheese placement.",
        },
        likelyCauses: [
          "top heat is too strong",
          "cheese pieces are too small or dry",
          "too much cheese is exposed to intense heat",
          "base needs longer than the cheese can tolerate",
        ],
        fixNow: [
          "move away from direct top heat if possible",
          "finish the base gently",
          "use less cheese on the next pizza",
        ],
        preventNextTime: [
          "use larger cheese pieces",
          "add delicate cheese later when appropriate",
          "balance top and bottom heat",
          "avoid burying the center in cheese",
        ],
        relatedTopicIds: ["top-burns-before-bottom", "cheese-releases-oil", "home-oven-pale-soft"],
      },
      {
        id: "cheese-releases-oil",
        title: "Cheese releases oil",
        shortSymptom: "The cheese separates into greasy pools instead of melting cleanly.",
        symptomDetails:
          "Oil release is usually a cheese and heat issue rather than a sauce-water issue.",
        quickCheck: "Look for clear orange or yellow oil pooling on top of the cheese.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/cheese-releases-oil.webp",
          alt: "A pizza with visible oily pools separating from melted cheese.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Greasy cheese can come from high heat, too much cheese or a cheese that separates easily.",
        },
        likelyCauses: [
          "cheese is too oily for the bake style",
          "too much cheese was used",
          "top heat is too intense",
          "cheese was grated too finely",
        ],
        fixNow: [
          "blot excess oil only if serving presentation matters",
          "use less cheese on the next pizza",
          "reduce direct top heat if possible",
        ],
        preventNextTime: [
          "use a cheese that melts cleanly",
          "use larger pieces instead of fine shreds",
          "reduce cheese quantity",
          "balance heat so the cheese does not overcook",
        ],
        relatedTopicIds: ["cheese-burns-too-early", "mozzarella-releases-water", "top-burns-before-bottom"],
      },
      {
        id: "toppings-slide-after-baking",
        title: "Toppings slide off after baking",
        shortSymptom: "Toppings or cheese slide off the slice when the pizza is cut or lifted.",
        symptomDetails:
          "This happens after baking and serving, unlike launch-specific topping slide before the pizza reaches the oven.",
        quickCheck: "Lift a slice and watch whether the topping layer moves as one sheet.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/toppings-slide-after-baking.webp",
          alt: "A slice lifted from a pizza with toppings sliding off after baking.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Sliding after baking usually means too much moisture, too much topping weight or not enough cooling time.",
        },
        likelyCauses: [
          "too much sauce or cheese",
          "wet toppings created a slippery layer",
          "pizza was cut immediately while very hot",
          "toppings were not anchored by a balanced cheese layer",
        ],
        fixNow: [
          "let the pizza rest briefly before cutting",
          "cut with a sharp wheel or knife",
          "serve with support under the slice",
        ],
        preventNextTime: [
          "use less sauce and cheese",
          "drain wet toppings",
          "spread toppings evenly",
          "let the pizza rest briefly before slicing",
        ],
        relatedTopicIds: ["toppings-slide-during-launch", "sauce-makes-center-watery", "mozzarella-releases-water"],
      },
      {
        id: "sauce-makes-center-watery",
        title: "Sauce makes the center watery",
        shortSymptom: "The center turns wet or soupy where the sauce sits.",
        symptomDetails:
          "This points to the sauce layer itself, not the cheese or the dough formula.",
        quickCheck: "Look for loose red sauce pooling in the center after baking.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/sauce-makes-center-watery.webp",
          alt: "A pizza center with loose watery tomato sauce pooling under the toppings.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A watery sauce layer can keep the center soft even when the rest of the pizza bakes well.",
        },
        likelyCauses: [
          "sauce is too thin",
          "too much sauce was used",
          "sauce was concentrated in the center",
          "wet toppings added more moisture on top",
        ],
        fixNow: [
          "use less sauce on the next pizza",
          "spread sauce thinner and leave the center lighter",
          "avoid adding more wet toppings",
        ],
        preventNextTime: [
          "use thicker sauce",
          "drain watery tomatoes",
          "apply sauce in a thin even layer",
          "keep the center light",
        ],
        relatedTopicIds: ["pizza-soggy-middle", "gummy-layer-under-toppings", "toppings-release-water"],
      },
      {
        id: "mozzarella-releases-water",
        title: "Fresh mozzarella releases too much water",
        shortSymptom: "Milky water pools around mozzarella and softens the pizza during baking.",
        symptomDetails:
          "This is cheese moisture specifically, not a general topping-load or sauce problem.",
        quickCheck: "Check whether the liquid is collecting around mozzarella pieces.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/mozzarella-releases-water.webp",
          alt: "Fresh mozzarella pieces releasing milky water onto a pizza during baking.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Fresh mozzarella needs draining, drying or a lighter hand to avoid flooding the center.",
        },
        likelyCauses: [
          "fresh mozzarella was not drained",
          "cheese pieces were too large or too many",
          "mozzarella was added too early for the oven style",
          "pizza was topped heavily in the center",
        ],
        fixNow: [
          "remove excess water if possible before serving",
          "use less mozzarella on the next pizza",
          "place cheese away from the very center",
        ],
        preventNextTime: [
          "drain and pat mozzarella dry",
          "tear into moderate pieces",
          "use less fresh mozzarella",
          "add delicate cheese later when appropriate",
        ],
        relatedTopicIds: ["toppings-release-water", "sauce-makes-center-watery", "cheese-releases-oil"],
      },
      {
        id: "pizza-overloaded-with-toppings",
        title: "Pizza is overloaded with toppings",
        shortSymptom: "The pizza feels heavy, bakes slowly, sags or stays wet in the center.",
        symptomDetails:
          "Overloading can cause several symptoms at once: soggy center, sliding toppings, pale base and uneven bake.",
        quickCheck: "If the base stops moving freely or the slice collapses under the toppings, reduce the load.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/pizza-overloaded-with-toppings.webp",
          alt: "A raw pizza overloaded with heavy toppings concentrated in the center.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "A lighter topping load helps the base bake and keeps the slice easier to handle.",
        },
        likelyCauses: [
          "too many topping types",
          "too much cheese or sauce",
          "heavy toppings concentrated in the center",
          "dough base is too thin for the load",
        ],
        fixNow: [
          "remove excess toppings before launch if possible",
          "bake longer only if the top can handle it",
          "make the next pizza simpler",
        ],
        preventNextTime: [
          "use fewer toppings",
          "keep the center light",
          "spread toppings evenly",
          "match topping load to dough size and oven power",
        ],
        relatedTopicIds: ["pizza-soggy-middle", "toppings-slide-after-baking", "pizza-sticks-to-peel"],
      },
      {
        id: "toppings-cook-unevenly",
        title: "Toppings cook unevenly",
        shortSymptom: "Some toppings burn or dry out while others stay raw, wet or firm.",
        symptomDetails:
          "This is a topping-size and topping-prep issue, not the same as the whole pizza baking unevenly.",
        quickCheck: "Compare larger or denser toppings with small delicate toppings after the bake.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/toppings-cook-unevenly.webp",
          alt: "A pizza with small toppings burned while larger vegetable pieces remain undercooked.",
          width: 1200,
          height: 800,
          kind: "comparison",
          caption: "Toppings cook best when size, moisture and placement match the bake time.",
          comparisonLabels: {
            problem: "Some toppings burn while others stay raw",
            better: "Toppings are cut and placed for even cooking",
          },
        },
        likelyCauses: [
          "topping pieces are different sizes",
          "dense vegetables were not pre-cooked",
          "delicate toppings were added too early",
          "toppings were piled unevenly",
        ],
        fixNow: [
          "remove badly burned delicate toppings if needed",
          "cut dense toppings smaller next time",
          "add delicate toppings after baking when appropriate",
        ],
        preventNextTime: [
          "cut toppings to similar sizes",
          "pre-cook dense or watery vegetables",
          "add delicate toppings later",
          "spread toppings evenly",
        ],
        relatedTopicIds: ["pizza-bakes-unevenly", "toppings-release-water", "pizza-overloaded-with-toppings"],
      },
      {
        id: "rim-scorched-by-sauce-or-cheese",
        title: "Rim is scorched by sauce or cheese",
        shortSymptom: "Dark bitter spots appear where sauce or cheese touches the rim.",
        symptomDetails:
          "This is a placement problem at the edge, not the same as a rim that burns evenly from too much heat.",
        quickCheck: "Look for scorch marks exactly where sauce, cheese or toppings crossed onto the rim.",
        severity: "common",
        image: {
          src: "/images/troubleshooting/rim-scorched-by-sauce-or-cheese.webp",
          alt: "A pizza rim with localized scorch marks where sauce and cheese reached the edge.",
          width: 1200,
          height: 800,
          kind: "symptom",
          caption: "Keeping wet or fatty toppings off the rim prevents bitter localized scorching.",
        },
        likelyCauses: [
          "sauce was spread onto the rim",
          "cheese was placed over the edge",
          "toppings touched the hottest exposed rim",
          "pizza was rotated too late near strong flame",
        ],
        fixNow: [
          "trim or avoid the scorched edge if bitter",
          "keep the next pizza's rim cleaner",
          "rotate before edge toppings burn",
        ],
        preventNextTime: [
          "leave a clean rim border",
          "keep cheese and sauce inside the rim",
          "avoid toppings hanging over the edge",
          "rotate predictably in strong heat",
        ],
        relatedTopicIds: ["cheese-burns-too-early", "crust-burns-middle-doughy", "rim-flattened-during-shaping"],
      },
    ],
  },
];

export const pizzaTroubleshootingTopicIds = troubleshootingSections.flatMap((section) =>
  section.problems.map((problem) => problem.id),
);

export const pizzaTroubleshootingSearchAliases: Partial<Record<PizzaTroubleshootingTopicId, string[]>> = {
  "dough-not-rising": ["no rise", "flat dough", "yeast not working", "dough stayed small"],
  "dough-too-sticky": ["sticky dough", "wet dough", "dough smears", "dough clings", "too much water"],
  "dough-dry-skin": ["dry dough", "skin on dough", "crust on dough ball", "uncovered dough"],
  "dough-balls-spread-flat": ["flat dough balls", "dough spreads", "balls collapse", "dough puddles"],
  "dough-underproofed": ["underproofed", "tight dough", "dense crust", "not fermented enough"],
  "dough-overproofed": ["overproofed", "collapsed dough", "weak dough", "too fermented"],
  "dough-too-cold": ["cold dough", "will not stretch", "tight from fridge", "stiff dough"],
  "dough-too-warm": ["warm dough", "loose dough", "slack dough", "dough melts"],
  "weak-gluten-structure": ["weak gluten", "no strength", "tears easily", "no structure"],
  "dough-collapses-after-rising": ["collapses", "falls after rising", "deflates", "lost volume"],
  "dough-springs-back": ["springs back", "will not open", "elastic dough", "keeps shrinking"],
  "dough-tears": ["holes", "dough tears", "rips", "thin spots"],
  "dough-sticks-to-work-surface": ["sticks to table", "stuck to counter", "work surface", "bench sticking"],
  "pizza-center-too-thin": ["center too thin", "middle thin", "transparent center", "weak middle"],
  "pizza-loses-round-shape": ["not round", "oval pizza", "odd shape", "misshapen"],
  "rim-flattened-during-shaping": ["flat rim", "no cornicione", "rim pressed", "edge flattened"],
  "dough-stretches-unevenly": ["uneven stretch", "one side thin", "thick and thin", "uneven dough"],
  "dough-tears-moving-to-peel": ["tears on peel", "transfer tear", "rips moving", "breaks on peel"],
  "pizza-sticks-to-peel": ["stuck to peel", "will not launch", "launch stuck", "pizza stuck"],
  "pizza-folds-during-launch": ["folds", "folded launch", "pizza folded", "launch fold"],
  "toppings-slide-during-launch": ["toppings slide", "cheese slides", "sauce slides", "launch toppings"],
  "too-much-flour-under-pizza": ["burnt flour", "semolina burns", "bitter bottom", "dusty base"],
  "pizza-stretches-on-peel": ["stretches on peel", "long pizza", "deforms on peel", "pizza elongates"],
  "launch-takes-too-long": ["slow launch", "takes too long", "topping while waiting", "peel delay"],
  "pizza-soggy-middle": ["soggy middle", "wet center", "soft center", "soupy middle"],
  "crust-burns-middle-doughy": ["burnt crust raw middle", "burns but doughy", "rim burned center raw"],
  "base-burns-underneath": ["burnt base", "black bottom", "bottom burns", "base burned"],
  "home-oven-pale-soft": ["pale base", "soft base", "home oven pale", "not brown"],
  "gummy-layer-under-toppings": ["gummy layer", "gum line", "wet layer", "dense layer"],
  "top-burns-before-bottom": ["top burns", "burnt cheese pale base", "top ahead", "bottom not ready"],
  "rim-does-not-rise": ["rim not rising", "flat crust", "no oven spring", "dense rim"],
  "pizza-bakes-unevenly": ["uneven bake", "one side burns", "hot spot", "uneven oven"],
  "center-raw-or-doughy": ["raw center", "doughy center", "raw dough", "undercooked middle"],
  "oven-loses-heat-between-pizzas": ["oven recovery", "later pizzas pale", "stone temperature drops", "loses heat"],
  "toppings-release-water": ["watery toppings", "vegetables watery", "liquid toppings", "water on pizza"],
  "cheese-burns-too-early": ["cheese burns", "burnt cheese", "cheese too dark", "cheese burned"],
  "cheese-releases-oil": ["greasy cheese", "oil pools", "cheese oil", "orange oil"],
  "toppings-slide-after-baking": ["toppings slide off", "slice toppings slide", "cheese sheet", "after baking slide"],
  "sauce-makes-center-watery": ["watery sauce", "sauce too thin", "red liquid", "sauce pool"],
  "mozzarella-releases-water": ["mozzarella water", "fresh mozzarella wet", "milky water", "wet mozzarella"],
  "pizza-overloaded-with-toppings": ["too many toppings", "overloaded", "heavy pizza", "too much cheese"],
  "toppings-cook-unevenly": ["toppings uneven", "vegetables raw", "some toppings burn", "uneven toppings"],
  "rim-scorched-by-sauce-or-cheese": ["scorched rim", "cheese on rim burns", "sauce on rim", "burnt edge spots"],
};

export function isPizzaTroubleshootingTopicId(value: unknown): value is PizzaTroubleshootingTopicId {
  return typeof value === "string" && pizzaTroubleshootingTopicIds.includes(value as PizzaTroubleshootingTopicId);
}

export function findPizzaTroubleshootingProblem(topicId: unknown) {
  if (!isPizzaTroubleshootingTopicId(topicId)) return undefined;
  for (const section of troubleshootingSections) {
    const problem = section.problems.find((item) => item.id === topicId);
    if (problem) return { section, problem };
  }
  return undefined;
}

export function getAllPizzaTroubleshootingProblems(): PizzaTroubleshootingSearchResult[] {
  return troubleshootingSections.flatMap((section) =>
    section.problems.map((problem) => ({
      section,
      problem,
    })),
  );
}

function normalizeTroubleshootingSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchPizzaTroubleshootingProblems(
  query: string,
  categoryId?: PizzaTroubleshootingCategoryId | null,
): PizzaTroubleshootingSearchResult[] {
  const normalizedQuery = normalizeTroubleshootingSearchText(query);
  const words = normalizedQuery.split(" ").filter(Boolean);
  const scopedProblems = getAllPizzaTroubleshootingProblems().filter((result) =>
    categoryId ? result.section.id === categoryId : true,
  );

  if (!words.length) return scopedProblems;

  return scopedProblems.filter(({ section, problem }) => {
    const searchable = normalizeTroubleshootingSearchText(
      [
        section.title,
        section.intro,
        problem.title,
        problem.shortSymptom,
        problem.symptomDetails,
        problem.quickCheck,
        ...(problem.likelyCauses ?? []),
        ...(pizzaTroubleshootingSearchAliases[problem.id] ?? []),
      ]
        .filter(Boolean)
        .join(" "),
    );

    return words.every((word) => searchable.includes(word));
  });
}

export function getPizzaTroubleshootingCategoryForProblem(topicId: unknown) {
  return findPizzaTroubleshootingProblem(topicId)?.section.id ?? null;
}

export function getSafeDoughGuideReturnPath(value: string | string[] | null | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/guides/dough")) return null;
  if (decoded.startsWith("//")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return null;
  return decoded;
}
