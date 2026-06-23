import type { FlourId } from "@/lib/flours";
import type {
  Fermentation,
  OvenType,
  PizzaGoal,
  PizzaStyleId,
  RecipeIngredients,
  RecipeSettings,
  YeastType,
} from "@/lib/saved-recipes";

export const BAKE_RESULT_SCHEMA_VERSION = 1;

export type BakeVisibility = "private" | "unlisted" | "public";
export type ShareTemplate = "classic-card" | "minimal-card" | "technical-card";

export type RecipeSnapshot = Readonly<{
  capturedAt: string;
  pizzas: number;
  ballWeight: number;
  waste: number;
  hydration: number;
  salt: number;
  yeastType: YeastType;
  fermentation: Fermentation;
  fermentationLabel: string;
  temperature: number;
  goal: PizzaGoal;
  ovenType: OvenType;
  flourId: FlourId;
  pizzaStyleId?: PizzaStyleId;
  totalDough: number;
  flour: number;
  water: number;
  saltAmount: number;
  leavener: number;
  sourdough?: Readonly<{
    type: Extract<YeastType, "ssd" | "lsd">;
    starterHydration: 50 | 100;
  }>;
}>;

export type PreparationSnapshot = Readonly<{
  sauceStyle?: string;
  sauceAmount?: number;
  cheeseAmount?: number;
  toppingLoad?: string;
  toppingMoistureWarning?: string;
  plannedFermentationSteps?: readonly string[];
  plannerSummary?: string;
  notes?: string;
}>;

export type BakingSnapshot = Readonly<{
  ovenType?: OvenType;
  ovenTemperatureCelsius?: number;
  stoneTemperatureCelsius?: number;
  bakeTimeSeconds?: number;
  turnSchedule?: readonly string[];
  timerPreset?: string;
  bakeNotes?: string;
}>;

export type ResultSnapshot = Readonly<{
  overallRating?: number;
  crustRating?: number;
  bottomRating?: number;
  textureRating?: number;
  flavorRating?: number;
  resultNotes?: string;
  problemTags?: readonly string[];
  photoReference?: string;
}>;

export type ShareFieldVisibility = Readonly<{
  hydration: boolean;
  fermentation: boolean;
  ballWeight: boolean;
  flour: boolean;
  ovenTemperature: boolean;
  bakeTime: boolean;
  rating: boolean;
  branding: boolean;
}>;

export type SharePreferences = Readonly<{
  template: ShareTemplate;
  fields: ShareFieldVisibility;
}>;

export type BakeResult = Readonly<{
  id: string;
  schemaVersion: typeof BAKE_RESULT_SCHEMA_VERSION;
  recipeSnapshot: RecipeSnapshot;
  preparationSnapshot?: PreparationSnapshot;
  bakingSnapshot?: BakingSnapshot;
  resultSnapshot?: ResultSnapshot;
  sharePreferences: SharePreferences;
  visibility: BakeVisibility;
  createdAt: string;
  updatedAt: string;
}>;

type CreateBakeResultInput = {
  id?: string;
  recipeSnapshot: RecipeSnapshot;
  preparationSnapshot?: PreparationSnapshot;
  bakingSnapshot?: BakingSnapshot;
  resultSnapshot?: ResultSnapshot;
  sharePreferences?: SharePreferences;
  visibility?: string;
  createdAt?: string;
  updatedAt?: string;
};

const visibilityValues = ["private", "unlisted", "public"] as const;

function freezeObject<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value);
}

function copyStringArray(value?: readonly string[]) {
  return value ? Object.freeze([...value]) : undefined;
}

function cloneRecipeSnapshot(snapshot: RecipeSnapshot): RecipeSnapshot {
  return freezeObject({
    ...snapshot,
    ...(snapshot.sourdough ? { sourdough: freezeObject({ ...snapshot.sourdough }) } : {}),
  });
}

function cloneSharePreferences(preferences: SharePreferences): SharePreferences {
  return freezeObject({
    template: preferences.template,
    fields: freezeObject({ ...preferences.fields }),
  });
}

function normalizeSharePreferences(value: unknown): SharePreferences {
  if (!isRecord(value) || !isRecord(value.fields)) return createDefaultSharePreferences();
  const defaults = createDefaultSharePreferences();
  const template = value.template === "minimal-card" || value.template === "technical-card" || value.template === "classic-card"
    ? value.template
    : defaults.template;

  return freezeObject({
    template,
    fields: freezeObject({
      hydration: typeof value.fields.hydration === "boolean" ? value.fields.hydration : defaults.fields.hydration,
      fermentation: typeof value.fields.fermentation === "boolean" ? value.fields.fermentation : defaults.fields.fermentation,
      ballWeight: typeof value.fields.ballWeight === "boolean" ? value.fields.ballWeight : defaults.fields.ballWeight,
      flour: typeof value.fields.flour === "boolean" ? value.fields.flour : defaults.fields.flour,
      ovenTemperature: typeof value.fields.ovenTemperature === "boolean" ? value.fields.ovenTemperature : defaults.fields.ovenTemperature,
      bakeTime: typeof value.fields.bakeTime === "boolean" ? value.fields.bakeTime : defaults.fields.bakeTime,
      rating: typeof value.fields.rating === "boolean" ? value.fields.rating : defaults.fields.rating,
      branding: typeof value.fields.branding === "boolean" ? value.fields.branding : defaults.fields.branding,
    }),
  });
}

export function newBakeResultId(now = new Date()) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bake-${now.getTime()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeBakeVisibility(value: unknown): BakeVisibility {
  return typeof value === "string" && visibilityValues.includes(value as BakeVisibility)
    ? value as BakeVisibility
    : "private";
}

export function createRecipeSnapshot(
  settings: RecipeSettings,
  ingredients: RecipeIngredients,
  options: { capturedAt?: string } = {},
): RecipeSnapshot {
  const yeastType = settings.yeastType;
  const sourdough = yeastType === "ssd" || yeastType === "lsd"
    ? freezeObject({
        type: yeastType,
        starterHydration: yeastType === "ssd" ? 50 : 100,
      } as const)
    : undefined;

  return freezeObject({
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    pizzas: settings.pizzas,
    ballWeight: settings.ballWeight,
    waste: settings.waste,
    hydration: settings.hydration,
    salt: settings.salt,
    yeastType,
    fermentation: settings.fermentation,
    fermentationLabel: settings.fermentation.replace("-", " "),
    temperature: settings.temperature,
    goal: settings.goal,
    ovenType: settings.ovenType,
    flourId: settings.flourId,
    ...(settings.pizzaStyleId ? { pizzaStyleId: settings.pizzaStyleId } : {}),
    totalDough: ingredients.total,
    flour: ingredients.flour,
    water: ingredients.water,
    saltAmount: ingredients.salt,
    leavener: ingredients.leavener,
    ...(sourdough ? { sourdough } : {}),
  });
}

export function createPreparationSnapshot(value: PreparationSnapshot = {}): PreparationSnapshot {
  return freezeObject({
    ...value,
    plannedFermentationSteps: copyStringArray(value.plannedFermentationSteps),
  });
}

export function createBakingSnapshot(value: BakingSnapshot = {}): BakingSnapshot {
  return freezeObject({
    ...value,
    turnSchedule: copyStringArray(value.turnSchedule),
  });
}

export function createResultSnapshot(value: ResultSnapshot = {}): ResultSnapshot {
  return freezeObject({
    ...value,
    problemTags: copyStringArray(value.problemTags),
  });
}

export function createDefaultSharePreferences(): SharePreferences {
  return freezeObject({
    template: "classic-card",
    fields: freezeObject({
      hydration: true,
      fermentation: true,
      ballWeight: true,
      flour: true,
      ovenTemperature: false,
      bakeTime: false,
      rating: false,
      branding: true,
    }),
  });
}

export function createBakeResult(input: CreateBakeResultInput): BakeResult {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return freezeObject({
    id: input.id ?? newBakeResultId(new Date(createdAt)),
    schemaVersion: BAKE_RESULT_SCHEMA_VERSION,
    recipeSnapshot: cloneRecipeSnapshot(input.recipeSnapshot),
    ...(input.preparationSnapshot ? { preparationSnapshot: createPreparationSnapshot(input.preparationSnapshot) } : {}),
    ...(input.bakingSnapshot ? { bakingSnapshot: createBakingSnapshot(input.bakingSnapshot) } : {}),
    ...(input.resultSnapshot ? { resultSnapshot: createResultSnapshot(input.resultSnapshot) } : {}),
    sharePreferences: input.sharePreferences ? cloneSharePreferences(input.sharePreferences) : createDefaultSharePreferences(),
    visibility: normalizeBakeVisibility(input.visibility),
    createdAt,
    updatedAt: input.updatedAt ?? createdAt,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasValidRecipeSnapshot(value: unknown): value is RecipeSnapshot {
  if (!isRecord(value)) return false;
  return (
    typeof value.capturedAt === "string"
    && typeof value.pizzas === "number"
    && typeof value.ballWeight === "number"
    && typeof value.hydration === "number"
    && typeof value.totalDough === "number"
    && typeof value.flour === "number"
    && typeof value.water === "number"
    && typeof value.saltAmount === "number"
    && typeof value.leavener === "number"
    && typeof value.yeastType === "string"
    && typeof value.fermentation === "string"
    && typeof value.ovenType === "string"
    && typeof value.flourId === "string"
  );
}

export function migrateBakeResult(value: unknown): BakeResult | undefined {
  if (!isRecord(value)) return undefined;
  if (value.schemaVersion !== BAKE_RESULT_SCHEMA_VERSION) return undefined;
  if (typeof value.id !== "string" || !hasValidRecipeSnapshot(value.recipeSnapshot)) return undefined;

  return createBakeResult({
    id: value.id,
    recipeSnapshot: value.recipeSnapshot,
    preparationSnapshot: isRecord(value.preparationSnapshot) ? value.preparationSnapshot : undefined,
    bakingSnapshot: isRecord(value.bakingSnapshot) ? value.bakingSnapshot : undefined,
    resultSnapshot: isRecord(value.resultSnapshot) ? value.resultSnapshot : undefined,
    sharePreferences: normalizeSharePreferences(value.sharePreferences),
    visibility: typeof value.visibility === "string" ? value.visibility : undefined,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
  });
}

export function validateBakeResult(value: unknown): value is BakeResult {
  return migrateBakeResult(value) !== undefined;
}

export function isBakeResult(value: unknown): value is BakeResult {
  return validateBakeResult(value);
}

export function serializeBakeResult(result: BakeResult): string {
  return JSON.stringify(result);
}

export function deserializeBakeResult(value: string): BakeResult | undefined {
  try {
    return migrateBakeResult(JSON.parse(value));
  } catch {
    return undefined;
  }
}
