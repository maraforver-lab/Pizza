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

export type PizzaTroubleshootingProblem = {
  id: PizzaTroubleshootingTopicId;
  title: string;
  whatYouSee: string;
  likelyCauses: string[];
  fixNow: string[];
  preventNextTime: string[];
};

export type PizzaTroubleshootingSection = {
  id: string;
  title: string;
  intro: string;
  visual: {
    label: string;
    accent: string;
    motif: string;
  };
  problems: PizzaTroubleshootingProblem[];
};

export const troubleshootingSections: PizzaTroubleshootingSection[] = [
  {
    id: "dough-and-fermentation",
    title: "Dough and fermentation",
    intro: "Most dough problems come from time, temperature, yeast activity, hydration or gluten development.",
    visual: {
      label: "Time, temperature and dough strength",
      accent: "bg-leaf",
      motif: "Dough",
    },
    problems: [
      {
        id: "dough-not-rising",
        title: "Dough is not rising",
        whatYouSee:
          "The dough looks almost the same after resting, with little volume increase and few signs of fermentation.",
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
        whatYouSee:
          "The dough sticks heavily to your hands, bench, container or peel and is difficult to shape.",
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
        id: "dough-springs-back",
        title: "Dough springs back",
        whatYouSee: "The dough stretches, then quickly pulls back and refuses to stay open.",
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
        whatYouSee:
          "The dough rips during shaping, becomes very thin in the center, or develops holes.",
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
    id: "shaping-and-launching",
    title: "Shaping and launching",
    intro:
      "Many pizza problems happen after the dough is ready: stretching, topping and launching need a light touch and good timing.",
    visual: {
      label: "Gentle handling and quick launch",
      accent: "bg-tomato",
      motif: "Launch",
    },
    problems: [
      {
        id: "pizza-sticks-to-peel",
        title: "Pizza sticks to the peel",
        whatYouSee:
          "The topped pizza will not slide from the peel into the oven, or it stretches and deforms when launched.",
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
    id: "baking-and-toppings",
    title: "Baking and toppings",
    intro:
      "A good bake depends on heat balance, topping moisture and how much weight is placed on the center of the pizza.",
    visual: {
      label: "Heat balance and topping moisture",
      accent: "bg-orange",
      motif: "Bake",
    },
    problems: [
      {
        id: "pizza-soggy-middle",
        title: "Pizza is soggy in the middle",
        whatYouSee: "The center is wet, soft or doughy even when the rim looks baked.",
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
        whatYouSee: "The rim gets dark or burns before the center and base are fully cooked.",
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
        whatYouSee: "The bottom burns before the top is ready, often with bitter black flour spots.",
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
        id: "toppings-release-water",
        title: "Toppings release too much water",
        whatYouSee:
          "The pizza looks watery, cheese slides, the center softens, or toppings pool liquid during baking.",
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
  {
    id: "home-oven-problems",
    title: "Home oven problems",
    intro:
      "Home ovens usually need more heat management, longer preheating and a good baking surface to get closer to pizza-oven results.",
    visual: {
      label: "Heat-soaked stone, steel or tray",
      accent: "bg-ink",
      motif: "Home oven",
    },
    problems: [
      {
        id: "home-oven-pale-soft",
        title: "Home oven pizza is pale or soft",
        whatYouSee: "The pizza bakes slowly, the crust stays pale, or the base lacks crispness.",
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
