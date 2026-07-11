export type PizzaTroubleshootingTopicId =
  | "dough-not-rising"
  | "dough-too-sticky"
  | "dough-springs-back"
  | "dough-tears"
  | "pizza-sticks-to-peel"
  | "pizza-soggy-middle"
  | "crust-burns-middle-doughy"
  | "base-burns-underneath"
  | "toppings-release-water"
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
          "The topped pizza will not slide from the peel into the oven, or it stretches and deforms when launched.",
        quickCheck: "Shake the peel gently before launching; the pizza should move freely.",
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
          "dough is too sticky",
          "peel is not floured enough",
          "pizza sat too long on the peel",
          "sauce or toppings made the base wet",
          "the pizza is overloaded",
          "a hole in the dough allowed moisture through",
        ],
        fixNow: [
          "gently shake the peel before launching",
          "lift an edge and add a little flour if needed",
          "launch quickly after topping",
          "if it is badly stuck, rescue it before forcing the launch",
        ],
        preventNextTime: [
          "build one pizza at a time",
          "keep toppings light",
          "use a small amount of flour or semolina on the peel",
          "avoid wet toppings leaking into the base",
          "check that the dough moves before going to the oven",
        ],
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
      },
      {
        id: "crust-burns-middle-doughy",
        title: "Crust burns but middle is doughy",
        shortSymptom: "The rim gets dark or burns before the center and base are fully cooked.",
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
      },
      {
        id: "base-burns-underneath",
        title: "Base burns underneath",
        shortSymptom: "The bottom burns before the top is ready, often with bitter black flour spots.",
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
      },
      {
        id: "home-oven-pale-soft",
        title: "Home oven pizza is pale or soft",
        shortSymptom: "The pizza bakes slowly, the crust stays pale, or the base lacks crispness.",
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
      },
    ],
  },
];

export const pizzaTroubleshootingTopicIds = troubleshootingSections.flatMap((section) =>
  section.problems.map((problem) => problem.id),
);

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
