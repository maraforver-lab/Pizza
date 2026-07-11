import type { ExperienceLevel } from "@/lib/experience-levels";

export const DOUGH_GUIDE_STEP_IDS = [
  "prepare",
  "measure",
  "mix-dough",
  "rest-dough",
  "develop-dough",
  "bulk-ferment",
  "divide-dough",
  "ball-dough",
  "proof-dough-balls",
  "warm-dough",
  "check-readiness",
  "release-dough-ball",
] as const;

export type DoughGuideStepId = (typeof DOUGH_GUIDE_STEP_IDS)[number];

export type DoughGuideImage = {
  src: string;
  alt: string;
};

export type DoughReadinessState = {
  label: "Underproofed" | "Ready" | "Overproofed";
  signs: string[];
};

export type DoughGuideStep = {
  id: DoughGuideStepId;
  title: string;
  actionName: string;
  summary: string;
  doThisNow: string[];
  readyWhen: string[];
  commonMistake: string;
  howToFix: string;
  whyItMatters: string;
  beginnerGuidance: string[];
  enthusiastGuidance: string[];
  nerdGuidance: string[];
  readinessStates?: DoughReadinessState[];
  image?: DoughGuideImage;
};

export const DOUGH_GUIDE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner guidance",
  enthusiast: "Enthusiast guidance",
  pizza_nerd: "Pizza Nerd guidance",
};

export const doughGuideSteps = [
  {
    id: "prepare",
    title: "Prepare ingredients and tools",
    actionName: "Prepare",
    summary: "Set up the bench before any flour gets wet.",
    doThisNow: [
      "Read your recipe or dough plan once from start to finish.",
      "Clear a clean work surface and prepare a bowl, scraper, scale, cover and containers.",
      "Keep flour, water, salt and leavening close, but separate until the recipe tells you to combine them.",
    ],
    readyWhen: [
      "The work surface is clear.",
      "Tools are within reach.",
      "Your recipe is open and easy to follow.",
    ],
    commonMistake: "Starting to mix before the tools and cover are ready.",
    howToFix: "Pause before mixing, gather what is missing, then continue. A short pause is safer than rushing with wet dough on your hands.",
    whyItMatters: "Good setup prevents accidental flour additions, uncovered dough and rushed handling.",
    beginnerGuidance: [
      "Think of this as mise en place for dough: everything ready before the sticky part starts.",
      "Use the ingredient amounts from your recipe rather than estimating by eye.",
    ],
    enthusiastGuidance: [
      "A prepared bench makes it easier to notice how the dough changes instead of fighting clutter.",
      "Have a cover ready so the dough surface does not dry while you decide the next move.",
    ],
    nerdGuidance: [
      "Clean setup reduces uncontrolled variables: bench flour, evaporation, temperature drift and handling time.",
      "Keep salt and yeast organized so concentrated contact only happens according to the recipe method.",
    ],
    image: { src: "/dough-guide/01-weigh.webp", alt: "Measured dough ingredients prepared on a work surface." },
  },
  {
    id: "measure",
    title: "Measure the ingredients",
    actionName: "Measure",
    summary: "Weigh everything accurately before the dough comes together.",
    doThisNow: [
      "Use a scale for flour, water, salt and leavening.",
      "Measure all ingredients into separate containers unless your recipe says otherwise.",
      "Check that the scale is tared before each ingredient.",
    ],
    readyWhen: [
      "All ingredients are measured.",
      "Nothing has been guessed by volume.",
      "The recipe amounts are still visible for a final check.",
    ],
    commonMistake: "Adding extra flour or water by feel before the dough has rested.",
    howToFix: "Return to the measured recipe. If the dough feels sticky, wait until after the rest step before judging it.",
    whyItMatters: "Small measuring errors can change hydration, salt level and fermentation speed.",
    beginnerGuidance: [
      "A kitchen scale is your friend here. Cups and spoons can vary a lot.",
      "If something looks odd, re-check the amount before mixing.",
    ],
    enthusiastGuidance: [
      "Accurate measuring makes future bakes repeatable and helps you understand what actually changed.",
      "Separate containers make it easier to avoid forgetting salt or adding yeast twice.",
    ],
    nerdGuidance: [
      "Measurement accuracy protects baker’s percentages and keeps hydration, salt and leavening in the intended relationship.",
      "Treat the recipe as the controlled setup before technique variables enter.",
    ],
    image: { src: "/dough-guide/01-weigh.webp", alt: "Ingredients being weighed for pizza dough." },
  },
  {
    id: "mix-dough",
    title: "Mix dough",
    actionName: "Mix dough",
    summary: "Combine the measured ingredients until no dry flour remains.",
    doThisNow: [
      "Combine ingredients in the order your recipe uses.",
      "Mix until the flour is hydrated and no dry patches remain.",
      "Stop when the dough is rough but combined; it can become smoother after resting.",
      "Avoid prolonged direct contact between concentrated salt and yeast when your method separates them.",
    ],
    readyWhen: [
      "No dry flour remains in the bowl.",
      "The dough looks shaggy but unified.",
      "The bowl sides are mostly cleared of loose flour.",
    ],
    commonMistake: "Adding flour immediately because the dough feels sticky.",
    howToFix: "Cover and rest the dough first. Stickiness often improves as flour hydrates.",
    whyItMatters: "Mixing hydrates the flour and starts gluten development without overworking the dough too early.",
    beginnerGuidance: [
      "Sticky at this stage is normal. Rough dough is not a failure.",
      "Use a scraper or wet hands instead of burying the dough in extra flour.",
    ],
    enthusiastGuidance: [
      "A rough mix gives flour time to absorb water, which can make later handling much easier.",
      "Different recipes use different mixing orders, so follow the plan rather than forcing one universal method.",
    ],
    nerdGuidance: [
      "Early mixing starts gluten formation, but hydration and rest can build structure with less mechanical work.",
      "Excessive mixing can warm the dough and change the fermentation path before the plan really begins.",
    ],
    image: { src: "/dough-guide/02-mix.webp", alt: "Hands mixing pizza dough in a bowl." },
  },
  {
    id: "rest-dough",
    title: "Rest dough",
    actionName: "Rest dough",
    summary: "Cover the dough and let it relax before more handling.",
    doThisNow: [
      "Cover the dough so the surface stays moist.",
      "Let the flour finish absorbing water.",
      "After the rest, reassess stickiness and texture before changing anything.",
    ],
    readyWhen: [
      "The surface has not dried out.",
      "The dough feels more cohesive than immediately after mixing.",
      "It stretches a little more easily than before.",
    ],
    commonMistake: "Leaving dough uncovered so a dry skin forms.",
    howToFix: "Cover it immediately. If a dry patch forms, fold it inside gently and avoid tearing the surface.",
    whyItMatters: "Resting lets hydration and relaxation do work that kneading alone cannot do gently.",
    beginnerGuidance: [
      "Covering matters more than doing anything fancy.",
      "If the dough seems calmer after resting, you are on the right path.",
    ],
    enthusiastGuidance: [
      "Rest improves extensibility, so the dough can stretch without fighting back as much.",
      "This is where a sticky rough mass often starts becoming manageable.",
    ],
    nerdGuidance: [
      "Rest shifts the dough toward extensibility by allowing hydration and reducing immediate elastic resistance.",
      "The goal is not inactivity; structure is changing while the dough sits covered.",
    ],
    image: { src: "/dough-guide/03-rest-v2.webp", alt: "Covered dough resting on a warm kitchen surface." },
  },
  {
    id: "develop-dough",
    title: "Develop the dough",
    actionName: "Develop dough",
    summary: "Build enough structure for the dough to hold gas later.",
    doThisNow: [
      "Use the method your recipe calls for: kneading, folding or gentle strengthening.",
      "Work until the dough feels more cohesive and smoother.",
      "Stop before the surface tears or the dough becomes tight and stressed.",
    ],
    readyWhen: [
      "The dough holds together as one mass.",
      "It stretches more smoothly than before.",
      "It shows controlled resistance without tearing immediately.",
    ],
    commonMistake: "Working the dough harder because it is not perfectly smooth yet.",
    howToFix: "Rest briefly, then continue gently. Time and short folds often solve more than force.",
    whyItMatters: "Dough strength helps trap fermentation gas and makes balling and stretching easier.",
    beginnerGuidance: [
      "You are looking for smoother and stronger, not perfect.",
      "If the dough tears quickly, rest it instead of forcing it.",
    ],
    enthusiastGuidance: [
      "Development is a balance: enough strength for gas retention, enough relaxation for later stretching.",
      "A dough that tightens too much can be rested before the next handling pass.",
    ],
    nerdGuidance: [
      "Gluten development changes elasticity and extensibility. Excessive mechanical work can tighten the network and warm the dough.",
      "Controlled folds can strengthen high-hydration dough while limiting oxidation and heat gain.",
    ],
    image: { src: "/dough-guide/04-fold-v2.webp", alt: "Hands folding pizza dough to develop structure." },
  },
  {
    id: "bulk-ferment",
    title: "Bulk fermentation",
    actionName: "Bulk fermentation",
    summary: "Follow your dough plan while the dough ferments as a mass or before balling.",
    doThisNow: [
      "Keep the dough covered during the planned fermentation.",
      "Use your recipe’s planned room-temperature or cold-fermentation method.",
      "Watch for dough condition as well as the clock.",
    ],
    readyWhen: [
      "The dough shows signs of gas development.",
      "It still has enough strength to handle.",
      "It follows the room-temperature or cold plan in your recipe.",
    ],
    commonMistake: "Assuming every long plan means the same handling order.",
    howToFix: "Follow your dough plan: some doughs bulk ferment first, some are balled before cold fermentation, and some stay at room temperature.",
    whyItMatters: "Fermentation creates gas, flavor and dough maturity, but the right handling order depends on the plan.",
    beginnerGuidance: [
      "Keep it covered and follow your recipe’s time and place.",
      "Do not panic if it does not double. Pizza dough readiness is not judged by doubling alone.",
    ],
    enthusiastGuidance: [
      "Room temperature speeds fermentation; cold fermentation slows it and gives more scheduling control.",
      "Clock time helps, but dough feel, gas and strength tell you whether the plan is on track.",
    ],
    nerdGuidance: [
      "Bulk and ball fermentation affect gas distribution, strength and later extensibility differently.",
      "Cold fermentation can preserve strength while allowing flavor development; room fermentation progresses faster and needs closer observation.",
    ],
    image: { src: "/dough-guide/05-bulk-v2.webp", alt: "Pizza dough bulk fermenting in a covered container." },
  },
  {
    id: "divide-dough",
    title: "Divide the dough",
    actionName: "Divide dough",
    summary: "Cut the dough into planned portions before final balling.",
    doThisNow: [
      "Turn the dough out gently.",
      "Use a scale and divide according to your planned dough-ball weight.",
      "Cut pieces cleanly instead of pulling long strands.",
      "Make weight corrections before final balling.",
    ],
    readyWhen: [
      "Each piece matches the planned ball weight closely enough.",
      "Pieces are handled gently.",
      "The dough has not been heavily degassed.",
    ],
    commonMistake: "Estimating by eye and stretching the dough pieces apart.",
    howToFix: "Use a scale, cut cleanly, and move small corrections between pieces before shaping.",
    whyItMatters: "Even portions bake and stretch more predictably, and gentle dividing protects gas.",
    beginnerGuidance: [
      "A scale makes this step much less stressful.",
      "Do not worry if the pieces look rough; balling comes next.",
    ],
    enthusiastGuidance: [
      "Correct weights before balling so you do not have to reopen a tightened dough ball.",
      "Use only enough bench flour to prevent sticking; avoid trapping lots of dry flour inside the ball.",
    ],
    nerdGuidance: [
      "Clean cuts preserve strand structure better than pulling and tearing.",
      "Minimizing degassing keeps fermentation gas available for the final bake structure.",
    ],
    image: { src: "/dough-guide/06-ball-new.webp", alt: "Dough pieces being divided before balling." },
  },
  {
    id: "ball-dough",
    title: "Ball dough",
    actionName: "Ball dough",
    summary: "Shape each piece into a smooth dough ball with controlled surface tension.",
    doThisNow: [
      "Tuck and rotate the dough to create a smooth outer surface.",
      "Place the seam underneath.",
      "Stop before the surface tears.",
      "Cover the dough balls immediately after shaping.",
    ],
    readyWhen: [
      "Each ball has a smooth top.",
      "The seam sits underneath.",
      "The surface is gently tight but not torn.",
    ],
    commonMistake: "Tightening the ball until the surface rips.",
    howToFix: "Stop earlier, rest the dough, and reshape gently only if needed.",
    whyItMatters: "Good balling organizes the dough for final proofing and later stretching.",
    beginnerGuidance: [
      "Smooth and covered is the main goal.",
      "A slightly imperfect ball is better than a torn overworked one.",
    ],
    enthusiastGuidance: [
      "Surface tension helps the ball hold shape, but too much tension makes stretching harder later.",
      "Keep bench flour light so the seam can seal and the surface stays supple.",
    ],
    nerdGuidance: [
      "Balling redistributes tension and sets the final proof geometry. Excess tension can reduce extensibility and encourage tearing.",
      "A damaged surface can leak gas and dry faster during proofing.",
    ],
    image: { src: "/dough-guide/06-ball-new.webp", alt: "Smooth pizza dough balls on a floured surface." },
  },
  {
    id: "proof-dough-balls",
    title: "Proof the dough balls",
    actionName: "Proof dough balls",
    summary: "Let the shaped balls ferment and relax according to your plan.",
    doThisNow: [
      "Place dough balls in a covered tray or container.",
      "Follow the room-temperature or cold proof in your dough plan.",
      "Keep enough space so the dough can expand without tearing against the container.",
    ],
    readyWhen: [
      "The dough balls look relaxed and slightly expanded.",
      "The surface is moist, not crusted.",
      "They still hold their shape.",
    ],
    commonMistake: "Leaving dough balls uncovered or crowded.",
    howToFix: "Cover them and give them room. If they touch, separate gently before they fuse together.",
    whyItMatters: "Ball proofing prepares each portion to open into a pizza base without fighting you.",
    beginnerGuidance: [
      "Covered dough balls should look calm, not dry.",
      "If they spring back hard later, they may need more rest.",
    ],
    enthusiastGuidance: [
      "Final proof is where strength, gas and relaxation meet. The dough should soften without collapsing.",
      "Cold proofing and room proofing can both be valid when they match the plan.",
    ],
    nerdGuidance: [
      "Ball fermentation affects gas retention, surface integrity and extensibility at opening.",
      "Overproofed balls spread and weaken; underproofed balls resist opening and bake denser.",
    ],
    image: { src: "/dough-guide/08-ready-v3.webp", alt: "Proofed pizza dough balls resting in a tray." },
  },
  {
    id: "warm-dough",
    title: "Bring the dough to working temperature",
    actionName: "Prepare for stretching",
    summary: "Let cold dough relax when your plan calls for it.",
    doThisNow: [
      "If your dough has been cold, follow your plan for bringing it toward working temperature.",
      "Keep it covered while it warms.",
      "Do not force open a dough ball that is still tight and cold.",
    ],
    readyWhen: [
      "The dough feels relaxed enough to handle.",
      "The surface is not dry.",
      "It no longer feels stiff from the fridge if it was cold fermented.",
    ],
    commonMistake: "Trying to stretch cold dough immediately.",
    howToFix: "Cover it and wait until it relaxes. Stretching in stages is better than forcing it.",
    whyItMatters: "Temperature affects elasticity, extensibility and how easily the dough opens.",
    beginnerGuidance: [
      "Cold dough fights back. Give it time before stretching.",
      "Keep the cover on so warming does not dry the surface.",
    ],
    enthusiastGuidance: [
      "Warmer dough usually moves faster and stretches more easily, but too warm can become sticky and fragile.",
      "The goal is workable dough, not a fixed universal warm-up time.",
    ],
    nerdGuidance: [
      "Dough temperature changes gluten relaxation and fermentation rate. Working temperature is a handling state, not just a clock target.",
      "Excessive warming can accelerate fermentation and reduce strength before opening.",
    ],
    image: { src: "/dough-guide/08-ready-new.webp", alt: "Dough balls coming to working temperature before stretching." },
  },
  {
    id: "check-readiness",
    title: "Check dough readiness",
    actionName: "Check readiness",
    summary: "Compare dough feel, gas and relaxation before opening.",
    doThisNow: [
      "Look at the dough ball before touching it.",
      "Check whether it is relaxed, gassy and still holding shape.",
      "Use a gentle indentation as one clue, not the only decision.",
    ],
    readyWhen: [
      "The dough feels soft and relaxed.",
      "It stretches without immediate tearing.",
      "It shows visible gas development and manageable stickiness.",
    ],
    commonMistake: "Trusting the finger-poke test alone.",
    howToFix: "Use the poke as one signal alongside shape, gas, surface strength and how the dough handles.",
    whyItMatters: "Readiness is a balance between fermentation, strength and relaxation.",
    beginnerGuidance: [
      "Ready dough feels soft but not like soup.",
      "If it springs back hard, rest it. If it spreads fast and tears, handle it very gently.",
    ],
    enthusiastGuidance: [
      "The clock tells you when to check; the dough tells you whether to continue.",
      "Evaluate relaxation, visible gas and whether the ball still has structure.",
    ],
    nerdGuidance: [
      "Under-fermentation, over-fermentation and gluten degradation can look different but all affect opening behavior.",
      "The best readiness check combines gas retention, extensibility, surface integrity and recovery after gentle pressure.",
    ],
    readinessStates: [
      {
        label: "Underproofed",
        signs: ["tight structure", "strong immediate spring-back", "difficult to stretch", "limited visible gas", "dense feel"],
      },
      {
        label: "Ready",
        signs: ["soft and relaxed", "still holds its shape", "stretches without immediate tearing", "visible gas development", "gentle indentation returns slowly", "manageable stickiness"],
      },
      {
        label: "Overproofed",
        signs: ["very loose structure", "rapid spreading", "fragile or tearing surface", "excessive stickiness", "indentation does not recover", "collapse during handling"],
      },
    ],
    image: { src: "/dough-guide/08-ready-v3.webp", alt: "A proofed dough ball ready to be checked before opening." },
  },
  {
    id: "release-dough-ball",
    title: "Release the dough ball for stretching",
    actionName: "Prepare for stretching",
    summary: "Move one dough ball safely onto the work surface so it is ready to open.",
    doThisNow: [
      "Lightly flour the top and edges only as needed.",
      "Use a scraper or gentle hands to release the dough from its container.",
      "Place it seam-side down on the work surface.",
      "Stop here: the next action is stretching, which is outside this guide.",
    ],
    readyWhen: [
      "The dough ball is on the work surface.",
      "It is not torn or heavily degassed.",
      "It is ready to stretch into a pizza base.",
    ],
    commonMistake: "Pulling the dough out so it tears or loses most of its gas.",
    howToFix: "Release around the edges first, support the dough from underneath, and move slowly.",
    whyItMatters: "A gentle release preserves gas and structure right before stretching.",
    beginnerGuidance: [
      "Move one dough ball at a time.",
      "Gentle is better than fast. If it sticks, use the scraper instead of pulling harder.",
    ],
    enthusiastGuidance: [
      "This is the handoff from fermentation to shaping. The dough should arrive intact and relaxed.",
      "Use flour as a release tool, not as a new ingredient mixed into the dough.",
    ],
    nerdGuidance: [
      "The goal is to preserve gas cells and surface integrity before opening. Rough release can erase fermentation gains in seconds.",
      "Excess bench flour can dry the surface and interfere with the final base texture.",
    ],
    image: { src: "/dough-guide/09-open.webp", alt: "A dough ball released onto a floured surface before stretching." },
  },
] as const satisfies readonly DoughGuideStep[];

export function isDoughGuideStepId(value: unknown): value is DoughGuideStepId {
  return typeof value === "string" && DOUGH_GUIDE_STEP_IDS.includes(value as DoughGuideStepId);
}

export function getDoughGuideStepById(value: unknown): DoughGuideStep {
  if (isDoughGuideStepId(value)) {
    return doughGuideSteps.find((step) => step.id === value) ?? doughGuideSteps[0];
  }
  return doughGuideSteps[0];
}

export function getDoughGuideStepIndex(value: unknown): number {
  const step = getDoughGuideStepById(value);
  return doughGuideSteps.findIndex((item) => item.id === step.id);
}

export function getDoughGuideLevelDetails(step: DoughGuideStep, level: ExperienceLevel): string[] {
  if (level === "pizza_nerd") return step.nerdGuidance;
  if (level === "enthusiast") return step.enthusiastGuidance;
  return step.beginnerGuidance;
}
