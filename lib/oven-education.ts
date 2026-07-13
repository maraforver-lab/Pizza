import type { DoughToolsIconName } from "@/components/icons";

export type OvenEnvironmentId =
  | "home-oven"
  | "home-oven-steel"
  | "home-oven-stone"
  | "high-heat-pizza-oven"
  | "pan-baking"
  | "indoor-high-heat";

export type OvenPlannerSupport = "supported" | "education";

export type OvenEnvironment = {
  id: OvenEnvironmentId;
  name: string;
  icon: DoughToolsIconName;
  plannerSupport: OvenPlannerSupport;
  supportNote: string;
  summary: string;
  heatIntensity: string;
  topHeat: string;
  bottomHeat: string;
  preheatBehavior: string;
  bakeCharacter: string;
  heatRecovery: string;
  learningCurve: string;
  suitableStyles: string;
  toppingMoistureTolerance: string;
  operationalDifficulty: string;
  context: string;
  advantages: readonly string[];
  limitations: readonly string[];
  lesson: string;
};

export type OvenProblem = {
  id: string;
  title: string;
  sees: string;
  likelyCauses: readonly string[];
  doNow: string;
  nextBake: string;
  relatedHref: string;
};

export const pizzaSessionOvenSupportSummary =
  "DoughTools Pizza Session currently uses two broad oven choices: Home oven and Pizza oven. This guide explains what those two environments change without adding brands, models or extra planner presets.";

export const ovenEnvironments: readonly OvenEnvironment[] = [
  {
    id: "home-oven",
    name: "Conventional home oven",
    icon: "oven",
    plannerSupport: "supported",
    supportNote: "Supported as Home oven",
    summary: "The most accessible setup, strongest when the dough and toppings are suited to a longer bake.",
    heatIntensity: "Moderate",
    topHeat: "Often gentler than pizza ovens",
    bottomHeat: "Depends heavily on tray, stone, steel and rack position",
    preheatBehavior: "Air reaches set temperature before the baking surface is fully saturated",
    bakeCharacter: "Longer, more controlled bake",
    heatRecovery: "Door openings and multiple pizzas can cool the surface",
    learningCurve: "Approachable but sensitive to moisture and surface heat",
    suitableStyles: "New York-style, thin crisp pizza, pan pizza and home-adapted round pizza",
    toppingMoistureTolerance: "Medium; wet sauce and cheese can soften the center",
    operationalDifficulty: "Low",
    context: "Indoor",
    advantages: ["Predictable controls", "Year-round indoor use", "Good for longer-baked styles", "Easier repeatability"],
    limitations: ["Lower maximum heat", "Weaker direct top heat in many ovens", "Needs patient preheating", "Wet toppings can overwhelm the bake"],
    lesson:
      "A home oven can make excellent pizza when the recipe matches the heat. Use the highest safe setting, manage moisture and preheat the baking surface thoroughly.",
  },
  {
    id: "home-oven-steel",
    name: "Home oven with baking steel",
    icon: "flame",
    plannerSupport: "education",
    supportNote: "Learning guide",
    summary: "A steel stores heat and transfers it quickly into the dough, improving base browning in many home ovens.",
    heatIntensity: "High bottom heat for a home oven",
    topHeat: "Still limited by the oven and rack position",
    bottomHeat: "Fast and aggressive",
    preheatBehavior: "Needs time to store heat despite fast transfer during baking",
    bakeCharacter: "Strong bottom browning with a shorter home-oven bake",
    heatRecovery: "Good thermal mass, but still cools across repeated pizzas",
    learningCurve: "Moderate; base can burn before the top catches up",
    suitableStyles: "New York-style, thin artisan pizza and many home-adapted round styles",
    toppingMoistureTolerance: "Medium; heavy toppings still slow the top",
    operationalDifficulty: "Medium",
    context: "Indoor",
    advantages: ["Fast base browning", "Useful for crisp underside", "Durable", "Strong home-oven upgrade"],
    limitations: ["Can burn the base", "Heavy", "Needs safe handling", "May need rack and broiler balance"],
    lesson:
      "A thick surface can store heat. Steel also releases that heat into the dough very quickly, so bottom heat can outrun top heat if the setup is unbalanced.",
  },
  {
    id: "home-oven-stone",
    name: "Home oven with baking stone",
    icon: "oven",
    plannerSupport: "education",
    supportNote: "Learning guide",
    summary: "A stone provides stored heat and a masonry-like surface with gentler transfer than steel.",
    heatIntensity: "Moderate bottom heat",
    topHeat: "Controlled by oven elements, broiler/grill and rack position",
    bottomHeat: "Gentler than steel, material-dependent",
    preheatBehavior: "Usually benefits from a long full preheat",
    bakeCharacter: "Balanced, less aggressive base heat",
    heatRecovery: "Can recover more slowly than steel depending on thickness and material",
    learningCurve: "Low to medium",
    suitableStyles: "Home-adapted round pizza, thin pizza and bread-like bakes",
    toppingMoistureTolerance: "Medium-low if the stone is underheated",
    operationalDifficulty: "Low",
    context: "Indoor",
    advantages: ["Balanced bottom heat", "Classic baking surface", "Useful beyond pizza", "Less aggressive than steel"],
    limitations: ["Can crack from thermal shock", "Needs careful cleaning and cooling", "Slower heat transfer", "Thickness and material matter"],
    lesson:
      "Stone is not automatically worse than steel. It can be preferable when you want a gentler, more balanced bottom bake.",
  },
  {
    id: "high-heat-pizza-oven",
    name: "Dedicated high-heat pizza oven",
    icon: "flame",
    plannerSupport: "supported",
    supportNote: "Supported as Pizza oven",
    summary: "A very hot floor and strong top heat create fast oven spring and a short bake.",
    heatIntensity: "Very high",
    topHeat: "Strong radiant or flame heat",
    bottomHeat: "Hot oven floor",
    preheatBehavior: "Floor readiness matters as much as air or flame intensity",
    bakeCharacter: "Short, intense bake",
    heatRecovery: "Critical during multi-pizza sessions",
    learningCurve: "High; turning and placement matter quickly",
    suitableStyles: "Neapolitan and high-heat contemporary round pizza",
    toppingMoistureTolerance: "Low; overloaded toppings do not have time to dry",
    operationalDifficulty: "High",
    context: "Usually outdoor unless the appliance is explicitly indoor-rated",
    advantages: ["Rapid rim expansion", "Short bake", "Strong top heat", "Classic high-heat pizza behavior"],
    limitations: ["Easy to burn one side", "Launch and turning skill required", "Limited tolerance for wet toppings", "Floor can cool during service"],
    lesson:
      "A pizza oven is powerful, not automatic. Monitor floor heat, flame balance, pizza placement and recovery between pizzas.",
  },
  {
    id: "pan-baking",
    name: "Pan baking",
    icon: "pizza",
    plannerSupport: "education",
    supportNote: "Learning guide",
    summary: "The pan is part of the oven system: it supports the dough, conducts heat and shapes the edge.",
    heatIntensity: "Moderate to high through pan contact",
    topHeat: "Depends on oven and rack position",
    bottomHeat: "Pan, oil and material drive base texture",
    preheatBehavior: "May use a preheated or room-temperature pan depending on style",
    bakeCharacter: "Longer bake with intentional edge and base development",
    heatRecovery: "Less floor-recovery sensitive than direct stone baking",
    learningCurve: "Approachable but style-specific",
    suitableStyles: "Detroit, Sicilian-style pan pizza and Roman pan formats",
    toppingMoistureTolerance: "Higher than thin round pizza, but still not unlimited",
    operationalDifficulty: "Low to medium",
    context: "Indoor or deck oven",
    advantages: ["No launch stress", "Supports higher hydration", "Creates crisp edges", "Good for sharing"],
    limitations: ["Pan material matters", "Oil level changes texture", "Longer bake can dry toppings", "Can become heavy if overloaded"],
    lesson:
      "Pan pizza is not a fallback for weak ovens. It is an intentional method where pan, oil, proofing and bake time create a different result.",
  },
  {
    id: "indoor-high-heat",
    name: "Indoor high-heat electric oven",
    icon: "thermometer",
    plannerSupport: "education",
    supportNote: "Learning guide",
    summary: "A specialist indoor category with stronger heat than a normal home oven, but still not a generic product promise.",
    heatIntensity: "High",
    topHeat: "Can be strong and adjustable depending on appliance",
    bottomHeat: "Dedicated deck or stone surface",
    preheatBehavior: "Follows appliance-specific instructions",
    bakeCharacter: "Shorter than a normal home oven, appliance-dependent",
    heatRecovery: "Model-dependent",
    learningCurve: "Medium to high",
    suitableStyles: "High-heat round pizza where the appliance is designed for it",
    toppingMoistureTolerance: "Lower than long-bake styles",
    operationalDifficulty: "Medium",
    context: "Indoor only when explicitly approved by the manufacturer",
    advantages: ["Indoor high heat", "Year-round use", "Potential top/bottom control", "No outdoor fuel setup"],
    limitations: ["Specialist appliance", "Electrical and placement requirements", "Not a universal oven replacement", "No model presets in DoughTools"],
    lesson:
      "Indoor high-heat electric ovens are a distinct learning category, but DoughTools does not generate model-specific settings for them.",
  },
] as const;

export const ovenProblems: readonly OvenProblem[] = [
  {
    id: "base-pale",
    title: "Base is pale",
    sees: "The underside stays blond, soft or bread-like while the top may look done.",
    likelyCauses: ["baking surface not fully preheated", "weak bottom heat", "wet toppings slowing the bake"],
    doNow: "Finish a little longer if the top allows it, or move the pizza lower when safe for your oven.",
    nextBake: "Preheat the surface longer, use a hotter stone/steel/tray setup and reduce topping moisture.",
    relatedHref: "/guide/pizza-troubleshooting#home-oven-pale-soft",
  },
  {
    id: "base-burns-top-pale",
    title: "Base burns before the top cooks",
    sees: "The underside darkens fast while cheese and upper crust lag behind.",
    likelyCauses: ["steel too low or too hot", "weak top heat", "style needs a gentler surface"],
    doNow: "Move the pizza to a cooler zone or finish higher in the oven if safe.",
    nextBake: "Raise the rack, reduce surface aggression, or use stone when steel is too forceful.",
    relatedHref: "/guide/pizza-troubleshooting#base-burns-underneath",
  },
  {
    id: "top-burns-base-pale",
    title: "Top burns before the base cooks",
    sees: "Rim, cheese or toppings char while the underside stays pale.",
    likelyCauses: ["surface underheated", "too much broiler or flame", "stone cooled between pizzas"],
    doNow: "Move away from the strongest top heat and allow the base more time if the top is not ruined.",
    nextBake: "Preheat the surface longer and reduce top heat after launch.",
    relatedHref: "/guide/pizza-troubleshooting#top-burns-before-bottom",
  },
  {
    id: "wet-center",
    title: "Center stays wet",
    sees: "The middle feels soupy or soft even when the rim has color.",
    likelyCauses: ["too much sauce", "wet cheese", "heavy toppings", "oven heat too weak for the load"],
    doNow: "Finish longer only if the top can take it.",
    nextBake: "Use less sauce, drain wet cheese, reduce toppings and match sauce to the oven.",
    relatedHref: "/guide/pizza-troubleshooting#pizza-soggy-middle",
  },
  {
    id: "rim-burns-fast",
    title: "Rim burns too fast",
    sees: "The cornicione chars before the center and toppings finish.",
    likelyCauses: ["pizza too close to flame or broiler", "turning too slowly", "toppings too wet for the short bake"],
    doNow: "Turn sooner and move the pizza away from the hottest top zone.",
    nextBake: "Launch into a more balanced spot and keep toppings restrained.",
    relatedHref: "/guide/pizza-troubleshooting#crust-burns-middle-doughy",
  },
  {
    id: "sticks",
    title: "Pizza sticks during launch",
    sees: "The topped pizza will not slide cleanly from the peel.",
    likelyCauses: ["too much time on the peel", "wet dough underside", "too little release flour", "overloaded toppings"],
    doNow: "Lift the stuck edge gently, add a little release flour and launch only when it moves freely.",
    nextBake: "Top faster, keep the peel dry and do a shake-test before approaching the oven.",
    relatedHref: "/guide/pizza-troubleshooting#pizza-sticks-to-peel",
  },
  {
    id: "surface-drops",
    title: "Stone temperature drops between pizzas",
    sees: "Later pizzas bake paler or softer than the first.",
    likelyCauses: ["surface lost heat", "door open too long", "oven air recovered faster than the floor"],
    doNow: "Pause and let the baking surface recover before launching the next pizza.",
    nextBake: "Check the launch area between pizzas and pace the bake.",
    relatedHref: "/guide/pizza-troubleshooting#oven-loses-heat-between-pizzas",
  },
  {
    id: "uneven-bake",
    title: "Pizza bakes unevenly",
    sees: "One side burns while the other stays pale.",
    likelyCauses: ["hot spot", "uneven flame", "uneven surface heat", "slow turning"],
    doNow: "Rotate sooner and move through the oven’s zones intentionally.",
    nextBake: "Map the hot spots and use a consistent turning rhythm.",
    relatedHref: "/guide/pizza-troubleshooting#pizza-bakes-unevenly",
  },
  {
    id: "dries-out",
    title: "Home-oven pizza dries out",
    sees: "The crust becomes tough or dry before the base is satisfying.",
    likelyCauses: ["long bake for a dough built for high heat", "too little browning support", "overly lean formula for the oven"],
    doNow: "Remove when edible rather than chasing Neapolitan-style color.",
    nextBake: "Use a dough and topping plan suited to longer home-oven baking.",
    relatedHref: "/guide/pizza-troubleshooting#home-oven-pale-soft",
  },
  {
    id: "wont-hold-heat",
    title: "Oven will not maintain expected heat",
    sees: "The oven display or surface reading drops and results become inconsistent.",
    likelyCauses: ["door openings", "thin baking surface", "wind outdoors", "fuel or thermostat cycling"],
    doNow: "Pause, close the oven and let the surface recover safely.",
    nextBake: "Preheat more thoroughly, reduce door-open time and plan a slower pizza rhythm.",
    relatedHref: "/guide/pizza-troubleshooting#oven-loses-heat-between-pizzas",
  },
] as const;

export const heatFeedbackPatterns = [
  {
    title: "Pale base and pale top",
    imbalance: "Not enough overall heat or not enough preheat.",
    correction: "Preheat longer, reduce topping load and confirm the baking surface is ready.",
  },
  {
    title: "Burnt base and pale top",
    imbalance: "Bottom heat is outrunning top heat.",
    correction: "Move higher, reduce surface aggression or choose a gentler stone for that dough.",
  },
  {
    title: "Pale base and burnt top",
    imbalance: "Top heat is outrunning surface heat.",
    correction: "Let the stone or steel recover and reduce flame or broiler intensity after launch.",
  },
  {
    title: "Balanced bake",
    imbalance: "Top and bottom finish together.",
    correction: "Keep notes: rack, surface, preheat, dough, topping load and bake time.",
  },
] as const;

export const ovenUserFeedbackThemes = [
  "confusing air temperature with stone or floor temperature",
  "insufficient preheating",
  "poor heat recovery between pizzas",
  "launching difficulty",
  "too much flour on the peel",
  "overloaded toppings",
  "poor top/bottom balance",
  "trying one dough formula in every oven",
  "expecting a pizza oven to remove the learning curve",
  "buying equipment before choosing the desired pizza style",
] as const;
