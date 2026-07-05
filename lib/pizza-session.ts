import {
  DEFAULT_EXPERIENCE_LEVEL,
  normalizeExperienceLevel,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { normalizePizzaSessionPhoto } from "@/lib/pizza-session-photo";
import { normalizeSessionYeastType } from "@/lib/yeast-types";

export const PIZZA_SESSION_SCHEMA_VERSION = 1;

export const PIZZA_SESSION_STATUSES = [
  "draft",
  "planning",
  "preparing",
  "baking",
  "reviewing",
  "completed",
  "archived",
] as const;

export const PIZZA_SESSION_STEPS = [
  "style",
  "time",
  "quantity",
  "oven",
  "flour",
  "recipe",
  "timeline",
  "shopping",
  "prep",
  "bake",
  "review",
] as const;

export type PizzaSessionStatus = (typeof PIZZA_SESSION_STATUSES)[number];
export type PizzaSessionStep = (typeof PIZZA_SESSION_STEPS)[number];
export type PizzaSessionDoughStartMode = "now" | "later" | "recommend";
export type PizzaSessionFlourSituation = "recommend" | "unknown_w" | "has_w_range";
export type PizzaSessionFlourWRange = "w_180_220" | "w_220_260" | "w_260_300" | "w_300_340" | "w_340_plus";
export type PizzaSessionPizzaMixType = "margherita" | "marinara" | "diavola" | "funghi" | "prosciutto" | "quattro-formaggi";
export type PizzaSessionPizzaMix = Partial<Record<PizzaSessionPizzaMixType, number>>;

export type PizzaSessionRecipeParams = Record<string, string | number | boolean>;

export type PizzaSessionRecipeSnapshot = {
  balls?: number;
  ballWeight?: number;
  hydration?: number;
  salt?: number;
  waste?: number;
  yeastType?: string;
  fermentation?: string;
  flour?: string;
  oven?: string;
  pizzaStyle?: string;
  pizzaPreset?: string;
  totalDough?: number;
  flourAmount?: number;
  waterAmount?: number;
  saltAmount?: number;
  leavenerAmount?: number;
};

export type PizzaSessionTimelineStep = {
  id: string;
  label: string;
  description?: string;
  scheduledAt?: string;
  status: "todo" | "done" | "skipped";
  kind?: "active" | "passive";
  quietHoursWarning?: string;
  helperCopy?: string;
  beginnerNote?: string;
  enthusiastNote?: string;
  pizzaNerdNote?: string;
};

export type PizzaSessionTimeline = {
  generatedAt?: string;
  targetEatTime?: string;
  assumptions?: string[];
  steps: PizzaSessionTimelineStep[];
};

export type PizzaSessionShoppingGroup = "Dough" | "Sauce" | "Cheese" | "Toppings" | "Gear";

export type PizzaSessionShoppingItem = {
  id: string;
  label: string;
  amount?: string;
  status: "already_have" | "need_to_buy" | "bought";
};

export type PizzaSessionShoppingList = {
  presetId?: string;
  presetName?: string;
  generatedAt?: string;
  pizzaCount?: number;
  groups: Array<{
    group: PizzaSessionShoppingGroup;
    items: PizzaSessionShoppingItem[];
  }>;
};

export type PizzaSessionPhoto = {
  path: string;
  uploadedAt: string;
  contentType: string;
  size: number;
  url?: string;
};

export type PizzaSession = {
  id: string;
  schemaVersion: typeof PIZZA_SESSION_SCHEMA_VERSION;
  status: PizzaSessionStatus;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  lastSavedAt: string;
  currentStep: PizzaSessionStep;
  experienceLevel: ExperienceLevel;
  pizzaStyle?: string;
  pizzaPreset?: string;
  pizzaMix?: PizzaSessionPizzaMix;
  targetEatTime?: string;
  targetBakeTime?: string;
  doughStartMode?: PizzaSessionDoughStartMode;
  doughEarliestStartTime?: string;
  plannedFermentationHours?: number;
  hydrationPercentOverride?: number;
  fermentationTemperatureCOverride?: number;
  yeastType?: string;
  pizzaCount?: number;
  doughBallWeight?: number;
  ovenType?: string;
  flour?: string;
  flourSituation?: PizzaSessionFlourSituation;
  availableFlourWRanges?: PizzaSessionFlourWRange[];
  recipeParams?: PizzaSessionRecipeParams;
  recipeSnapshot?: PizzaSessionRecipeSnapshot;
  timeline?: PizzaSessionTimeline;
  shoppingList?: PizzaSessionShoppingList;
  notes?: string;
  rating?: number;
  photo?: PizzaSessionPhoto;
  review?: {
    whatWorked?: string;
    improveNextTime?: string;
    nextTimeTry?: string;
    savedAt?: string;
  };
};

type CreatePizzaSessionInput = Partial<Omit<PizzaSession, "schemaVersion" | "createdAt" | "updatedAt" | "lastOpenedAt" | "lastSavedAt">> & {
  createdAt?: string;
  updatedAt?: string;
  lastOpenedAt?: string;
  lastSavedAt?: string;
};

const statusSet = new Set<string>(PIZZA_SESSION_STATUSES);
const stepSet = new Set<string>(PIZZA_SESSION_STEPS);
const timelineStatusSet = new Set(["todo", "done", "skipped"]);
const timelineKindSet = new Set(["active", "passive"]);
const shoppingGroupSet = new Set(["Dough", "Sauce", "Cheese", "Toppings", "Gear"]);
const shoppingStatusSet = new Set(["already_have", "need_to_buy", "bought"]);
const doughStartModeSet = new Set(["now", "later", "recommend"]);
const flourSituationSet = new Set(["recommend", "unknown_w", "has_w_range"]);
const flourWRangeSet = new Set(["w_180_220", "w_220_260", "w_260_300", "w_300_340", "w_340_plus"]);
const pizzaMixTypeSet = new Set(["margherita", "marinara", "diavola", "funghi", "prosciutto", "quattro-formaggi"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function positiveNumberValue(value: unknown): number | undefined {
  const number = numberValue(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function doughBallWeightValue(value: unknown): number | undefined {
  const number = positiveNumberValue(value);
  return number !== undefined && number >= 180 && number <= 350 ? number : undefined;
}

function plannedFermentationHoursValue(value: unknown): number | undefined {
  const number = positiveNumberValue(value);
  return number !== undefined && number >= 24 && number <= 72 ? number : undefined;
}

function hydrationPercentOverrideValue(value: unknown): number | undefined {
  const number = numberValue(value);
  return number !== undefined && number >= 50 && number <= 80 ? number : undefined;
}

function fermentationTemperatureCOverrideValue(value: unknown): number | undefined {
  const number = numberValue(value);
  return number !== undefined && number >= 2 && number <= 26 ? number : undefined;
}

function normalizeStatus(value: unknown): PizzaSessionStatus {
  return typeof value === "string" && statusSet.has(value) ? value as PizzaSessionStatus : "draft";
}

function normalizeStep(value: unknown): PizzaSessionStep {
  return typeof value === "string" && stepSet.has(value) ? value as PizzaSessionStep : "style";
}

function normalizeDoughStartMode(value: unknown): PizzaSessionDoughStartMode | undefined {
  return typeof value === "string" && doughStartModeSet.has(value)
    ? value as PizzaSessionDoughStartMode
    : undefined;
}

function normalizeFlourSituation(value: unknown): PizzaSessionFlourSituation | undefined {
  if (value === "unknown_w") return "recommend";
  return typeof value === "string" && flourSituationSet.has(value)
    ? value as PizzaSessionFlourSituation
    : undefined;
}

function normalizeFlourWRanges(value: unknown): PizzaSessionFlourWRange[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ranges = [...new Set(value.filter((item): item is PizzaSessionFlourWRange => (
    typeof item === "string" && flourWRangeSet.has(item)
  )))];
  return ranges.length ? ranges : undefined;
}

function normalizePizzaMix(value: unknown): PizzaSessionPizzaMix | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).flatMap(([key, raw]) => {
    if (!pizzaMixTypeSet.has(key)) return [];
    const count = numberValue(raw);
    if (count === undefined || count <= 0) return [];
    return [[key, Math.floor(count)] as const];
  });
  return entries.length ? Object.fromEntries(entries) as PizzaSessionPizzaMix : undefined;
}

function cloneRecipeParams(params?: PizzaSessionRecipeParams): PizzaSessionRecipeParams | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter((entry): entry is [string, string | number | boolean] => {
    const [key, value] = entry;
    return Boolean(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean");
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function cloneRecipeSnapshot(snapshot?: PizzaSessionRecipeSnapshot): PizzaSessionRecipeSnapshot | undefined {
  if (!snapshot) return undefined;
  const next: PizzaSessionRecipeSnapshot = {
    balls: positiveNumberValue(snapshot.balls),
    ballWeight: positiveNumberValue(snapshot.ballWeight),
    hydration: numberValue(snapshot.hydration),
    salt: numberValue(snapshot.salt),
    waste: numberValue(snapshot.waste),
    yeastType: stringValue(snapshot.yeastType),
    fermentation: stringValue(snapshot.fermentation),
    flour: stringValue(snapshot.flour),
    oven: stringValue(snapshot.oven),
    pizzaStyle: stringValue(snapshot.pizzaStyle),
    pizzaPreset: stringValue(snapshot.pizzaPreset),
    totalDough: positiveNumberValue(snapshot.totalDough),
    flourAmount: positiveNumberValue(snapshot.flourAmount),
    waterAmount: positiveNumberValue(snapshot.waterAmount),
    saltAmount: positiveNumberValue(snapshot.saltAmount),
    leavenerAmount: positiveNumberValue(snapshot.leavenerAmount),
  };
  return Object.values(next).some((value) => value !== undefined) ? next : undefined;
}

function cloneTimeline(timeline?: PizzaSessionTimeline): PizzaSessionTimeline | undefined {
  if (!timeline || !Array.isArray(timeline.steps)) return undefined;
  const steps = timeline.steps.flatMap((step) => {
    if (!step || typeof step !== "object") return [];
    const record = step as Record<string, unknown>;
    const id = stringValue(record.id);
    const label = stringValue(record.label);
    if (!id || !label) return [];
    return [{
      id,
      label,
      description: stringValue(record.description),
      scheduledAt: stringValue(record.scheduledAt),
      status: typeof record.status === "string" && timelineStatusSet.has(record.status) ? record.status as PizzaSessionTimelineStep["status"] : "todo",
      kind: typeof record.kind === "string" && timelineKindSet.has(record.kind) ? record.kind as PizzaSessionTimelineStep["kind"] : undefined,
      quietHoursWarning: stringValue(record.quietHoursWarning),
      helperCopy: stringValue(record.helperCopy),
      beginnerNote: stringValue(record.beginnerNote),
      enthusiastNote: stringValue(record.enthusiastNote),
      pizzaNerdNote: stringValue(record.pizzaNerdNote),
    }];
  });
  return steps.length ? {
    generatedAt: stringValue(timeline.generatedAt),
    targetEatTime: stringValue(timeline.targetEatTime),
    assumptions: Array.isArray(timeline.assumptions)
      ? timeline.assumptions.flatMap((item) => {
        const assumption = stringValue(item);
        return assumption ? [assumption] : [];
      })
      : undefined,
    steps,
  } : undefined;
}

function cloneShoppingList(list?: PizzaSessionShoppingList): PizzaSessionShoppingList | undefined {
  if (!list || !Array.isArray(list.groups)) return undefined;
  const groups = list.groups.flatMap((group) => {
    if (!group || typeof group !== "object") return [];
    const record = group as Record<string, unknown>;
    if (typeof record.group !== "string" || !shoppingGroupSet.has(record.group) || !Array.isArray(record.items)) return [];
    const items = record.items.flatMap((item) => {
      if (!isRecord(item)) return [];
      const id = stringValue(item.id);
      const label = stringValue(item.label);
      if (!id || !label) return [];
      return [{
        id,
        label,
        amount: stringValue(item.amount),
        status: typeof item.status === "string" && shoppingStatusSet.has(item.status) ? item.status as PizzaSessionShoppingItem["status"] : "need_to_buy",
      }];
    });
    return items.length ? [{ group: record.group as PizzaSessionShoppingGroup, items }] : [];
  });
  return groups.length ? {
    presetId: stringValue(list.presetId),
    presetName: stringValue(list.presetName),
    generatedAt: stringValue(list.generatedAt),
    pizzaCount: positiveNumberValue(list.pizzaCount),
    groups,
  } : undefined;
}

function cloneReview(review?: PizzaSession["review"]): PizzaSession["review"] | undefined {
  if (!review) return undefined;
  const next = {
    whatWorked: stringValue(review.whatWorked),
    improveNextTime: stringValue(review.improveNextTime),
    nextTimeTry: stringValue(review.nextTimeTry),
    savedAt: stringValue(review.savedAt),
  };
  return next.whatWorked || next.improveNextTime || next.nextTimeTry || next.savedAt ? next : undefined;
}

export function newPizzaSessionId(now = new Date()) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${now.getTime()}-${Math.random().toString(36).slice(2)}`;
}

export function createPizzaSession(input: CreatePizzaSessionInput = {}, now = new Date()): PizzaSession {
  const timestamp = now.toISOString();
  return {
    id: input.id ?? newPizzaSessionId(now),
    schemaVersion: PIZZA_SESSION_SCHEMA_VERSION,
    status: normalizeStatus(input.status),
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp,
    lastOpenedAt: input.lastOpenedAt ?? timestamp,
    lastSavedAt: input.lastSavedAt ?? timestamp,
    currentStep: normalizeStep(input.currentStep),
    experienceLevel: normalizeExperienceLevel(input.experienceLevel ?? DEFAULT_EXPERIENCE_LEVEL),
    pizzaStyle: stringValue(input.pizzaStyle),
    pizzaPreset: stringValue(input.pizzaPreset),
    pizzaMix: normalizePizzaMix(input.pizzaMix),
    targetEatTime: stringValue(input.targetEatTime),
    targetBakeTime: stringValue(input.targetBakeTime),
    doughStartMode: normalizeDoughStartMode(input.doughStartMode),
    doughEarliestStartTime: normalizeDoughStartMode(input.doughStartMode) === "later"
      ? stringValue(input.doughEarliestStartTime)
      : undefined,
    plannedFermentationHours: plannedFermentationHoursValue(input.plannedFermentationHours),
    hydrationPercentOverride: hydrationPercentOverrideValue(input.hydrationPercentOverride),
    fermentationTemperatureCOverride: fermentationTemperatureCOverrideValue(input.fermentationTemperatureCOverride),
    yeastType: normalizeSessionYeastType(input.yeastType),
    pizzaCount: positiveNumberValue(input.pizzaCount),
    doughBallWeight: doughBallWeightValue(input.doughBallWeight),
    ovenType: stringValue(input.ovenType),
    flour: stringValue(input.flour),
    flourSituation: normalizeFlourSituation(input.flourSituation),
    availableFlourWRanges: normalizeFlourWRanges(input.availableFlourWRanges),
    recipeParams: cloneRecipeParams(input.recipeParams),
    recipeSnapshot: cloneRecipeSnapshot(input.recipeSnapshot),
    timeline: cloneTimeline(input.timeline),
    shoppingList: cloneShoppingList(input.shoppingList),
    notes: stringValue(input.notes),
    rating: numberValue(input.rating),
    photo: normalizePizzaSessionPhoto(input.photo),
    review: cloneReview(input.review),
  };
}

export function createSessionFromRecipeParams(
  params: URLSearchParams | string | PizzaSessionRecipeParams,
  options: Partial<Pick<PizzaSession, "id" | "experienceLevel">> = {},
  now = new Date(),
): PizzaSession {
  const searchParams = params instanceof URLSearchParams
    ? params
    : typeof params === "string"
      ? new URLSearchParams(params.startsWith("?") ? params.slice(1) : params)
      : new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  const recipeParams = Object.fromEntries(searchParams.entries());
  const numberFromParam = (key: string) => {
    const value = Number(searchParams.get(key));
    return Number.isFinite(value) ? value : undefined;
  };

  return createPizzaSession({
    id: options.id,
    status: "planning",
    currentStep: "recipe",
    experienceLevel: options.experienceLevel ?? DEFAULT_EXPERIENCE_LEVEL,
    pizzaCount: numberFromParam("balls"),
    yeastType: searchParams.get("yeastType") ?? undefined,
    doughBallWeight: numberFromParam("ballWeight"),
    ovenType: searchParams.get("oven") ?? undefined,
    flour: searchParams.get("flour") ?? undefined,
    pizzaStyle: searchParams.get("pizzaStyle") ?? searchParams.get("style") ?? undefined,
    pizzaPreset: searchParams.get("pizzaPreset") ?? undefined,
    recipeParams,
    recipeSnapshot: {
      balls: numberFromParam("balls"),
      ballWeight: numberFromParam("ballWeight"),
      hydration: numberFromParam("hydration"),
      salt: numberFromParam("salt"),
      waste: numberFromParam("waste"),
      yeastType: searchParams.get("yeastType") ?? undefined,
      fermentation: searchParams.get("fermentation") ?? undefined,
      flour: searchParams.get("flour") ?? undefined,
      oven: searchParams.get("oven") ?? undefined,
      pizzaStyle: searchParams.get("pizzaStyle") ?? undefined,
      pizzaPreset: searchParams.get("pizzaPreset") ?? undefined,
    },
  }, now);
}

export function migratePizzaSession(value: unknown): PizzaSession | undefined {
  if (!isRecord(value)) return undefined;
  if (value.schemaVersion !== PIZZA_SESSION_SCHEMA_VERSION) return undefined;
  const id = stringValue(value.id);
  const createdAt = stringValue(value.createdAt);
  if (!id || !createdAt) return undefined;
  return createPizzaSession({
    ...(value as Partial<PizzaSession>),
    id,
    createdAt,
    updatedAt: stringValue(value.updatedAt) ?? createdAt,
    lastOpenedAt: stringValue(value.lastOpenedAt) ?? createdAt,
    lastSavedAt: stringValue(value.lastSavedAt) ?? createdAt,
  }, new Date(createdAt));
}

export function validatePizzaSession(value: unknown): value is PizzaSession {
  return migratePizzaSession(value) !== undefined;
}

export function isPizzaSession(value: unknown): value is PizzaSession {
  return validatePizzaSession(value);
}

export function serializePizzaSession(session: PizzaSession) {
  return JSON.stringify(createPizzaSession(session));
}

export function deserializePizzaSession(value: string) {
  try {
    return migratePizzaSession(JSON.parse(value));
  } catch {
    return undefined;
  }
}

export function pizzaSessionRecipeQuery(session: PizzaSession) {
  const params = cloneRecipeParams(session.recipeParams);
  return params ? new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString() : "";
}

export function pizzaSessionContinueHref(session: PizzaSession) {
  const query = pizzaSessionRecipeQuery(session);
  const hasActiveTimelineTask = session.timeline?.steps.some((step) => step.status === "todo") ?? false;
  if (hasActiveTimelineTask && ["timeline", "prep", "bake"].includes(session.currentStep)) return "/session/kitchen";
  if (session.currentStep === "timeline") return "/session/timeline";
  if (session.currentStep === "shopping") return "/session/shopping";
  if (session.currentStep === "review") return "/session/review";
  if (session.currentStep === "recipe") return "/session/recipe";
  if (["prep", "bake"].includes(session.currentStep)) return "/session/kitchen";
  return "/session/start";
}

