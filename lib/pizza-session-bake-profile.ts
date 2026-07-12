export type PizzaSessionOvenType = "home" | "pizza";

export type PizzaSessionBakeProfile = {
  ovenType: PizzaSessionOvenType;
  label: string;
  preheatDurationMinutes: number;
  bakeDurationSeconds: number;
  bakeTimeLabel: string;
  temperatureLabel: string;
  surfaceGuidance?: string;
  preheatInstruction: string;
  bakeInstruction: string;
  rotationGuidance?: string;
  overlayBakeTime: string;
};

export function normalizePizzaSessionOvenType(value?: string | null): PizzaSessionOvenType {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "gas" || normalized === "pizza_oven" || normalized === "pizza") return "pizza";
  return "home";
}

export function resolvePizzaSessionOvenType(value?: string | null): PizzaSessionOvenType | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "gas" || normalized === "pizza_oven" || normalized === "pizza") return "pizza";
  if (normalized === "home" || normalized === "home_oven") return "home";
  return undefined;
}

const homeOvenBakeProfile: PizzaSessionBakeProfile = {
  ovenType: "home",
  label: "Home oven",
  preheatDurationMinutes: 75,
  bakeDurationSeconds: 5 * 60,
  bakeTimeLabel: "about 5 min",
  temperatureLabel: "highest practical heat",
  surfaceGuidance: "Use a fully heated stone, steel or tray.",
  preheatInstruction: "Preheat the home oven and baking surface until they are fully saturated with heat.",
  bakeInstruction: "Bake one pizza at a time and watch the rim, bottom and cheese closely.",
  rotationGuidance: "Rotate once or twice for even color if your oven has hot spots.",
  overlayBakeTime: "5 MIN",
};

const pizzaOvenBakeProfile: PizzaSessionBakeProfile = {
  ovenType: "pizza",
  label: "Pizza oven",
  preheatDurationMinutes: 60,
  bakeDurationSeconds: 90,
  bakeTimeLabel: "60–90 sec",
  temperatureLabel: "high-heat pizza oven",
  surfaceGuidance: "Heat the pizza oven floor fully before launch.",
  preheatInstruction: "Preheat the oven, stone, steel or pizza oven before opening the dough.",
  bakeInstruction: "Open, top and bake one pizza at a time. Watch color and rotate if needed.",
  rotationGuidance: "Rotate as needed for even color.",
  overlayBakeTime: "90 SEC",
};

export function getPizzaSessionBakeProfile(
  ovenType?: string | null,
): PizzaSessionBakeProfile {
  return normalizePizzaSessionOvenType(ovenType) === "pizza"
    ? pizzaOvenBakeProfile
    : homeOvenBakeProfile;
}

export function resolvePizzaSessionBakeProfile(
  ovenType?: string | null,
): PizzaSessionBakeProfile | undefined {
  const normalized = resolvePizzaSessionOvenType(ovenType);
  return normalized ? getPizzaSessionBakeProfile(normalized) : undefined;
}

export function getPizzaSessionBakeProfileForSession(
  session?: {
    ovenType?: string;
    recipeSnapshot?: { oven?: string };
  } | null,
) {
  return getPizzaSessionBakeProfile(session?.recipeSnapshot?.oven ?? session?.ovenType);
}
