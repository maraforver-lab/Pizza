import {
  normalizeQuickCalculatorInput,
  quickCalculatorDefaults,
  type QuickCalculatorInput,
} from "@/lib/quick-calculator/quick-dough-calculator";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY = "doughtools.quick-calculator.recipes.v1";
export const QUICK_CALCULATOR_SHARE_PARAM = "quick";
export const QUICK_CALCULATOR_MAX_SAVED_RECIPES = 20;

export type QuickCalculatorSavedRecipeV1 = {
  id: string;
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: QuickCalculatorInput;
};

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function newQuickCalculatorRecipeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `quick-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanName(value: unknown, fallback = "Untitled quick recipe") {
  const name = typeof value === "string" ? value.trim() : "";
  return name.length > 0 ? name.slice(0, 80) : fallback;
}

function normalizeSavedRecipe(value: unknown): QuickCalculatorSavedRecipeV1 | undefined {
  if (!isRecord(value)) return undefined;
  if (value.version !== 1) return undefined;
  if (typeof value.id !== "string" || value.id.trim() === "") return undefined;

  const createdAt = typeof value.createdAt === "string" && Number.isFinite(Date.parse(value.createdAt))
    ? value.createdAt
    : nowIso();
  const updatedAt = typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt))
    ? value.updatedAt
    : createdAt;

  return {
    id: value.id,
    version: 1,
    name: cleanName(value.name),
    createdAt,
    updatedAt,
    input: normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      ...(isRecord(value.input) ? value.input : {}),
    } as QuickCalculatorInput),
  };
}

export function loadQuickCalculatorSavedRecipes(storage?: StorageLike): QuickCalculatorSavedRecipeV1[] {
  try {
    const target = getBrowserStorage(storage);
    const raw = target?.getItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const normalized = normalizeSavedRecipe(item);
      return normalized ? [normalized] : [];
    }).slice(0, QUICK_CALCULATOR_MAX_SAVED_RECIPES);
  } catch {
    return [];
  }
}

export function storeQuickCalculatorSavedRecipes(
  recipes: readonly QuickCalculatorSavedRecipeV1[],
  storage?: StorageLike,
) {
  const target = getBrowserStorage(storage);
  target?.setItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY, JSON.stringify(recipes.slice(0, QUICK_CALCULATOR_MAX_SAVED_RECIPES)));
}

export function createQuickCalculatorSavedRecipe(
  input: QuickCalculatorInput,
  name: string,
  id = newQuickCalculatorRecipeId(),
  timestamp = nowIso(),
): QuickCalculatorSavedRecipeV1 {
  return {
    id,
    version: 1,
    name: cleanName(name),
    createdAt: timestamp,
    updatedAt: timestamp,
    input: normalizeQuickCalculatorInput(input),
  };
}

export function saveQuickCalculatorRecipe(
  recipes: readonly QuickCalculatorSavedRecipeV1[],
  input: QuickCalculatorInput,
  name: string,
  existingId?: string | null,
): QuickCalculatorSavedRecipeV1[] {
  const timestamp = nowIso();
  const current = existingId ? recipes.find((recipe) => recipe.id === existingId) : undefined;
  const nextRecipe: QuickCalculatorSavedRecipeV1 = current
    ? {
        ...current,
        name: cleanName(name),
        updatedAt: timestamp,
        input: normalizeQuickCalculatorInput(input),
      }
    : createQuickCalculatorSavedRecipe(input, name, undefined, timestamp);

  return current
    ? recipes.map((recipe) => recipe.id === current.id ? nextRecipe : recipe)
    : [nextRecipe, ...recipes].slice(0, QUICK_CALCULATOR_MAX_SAVED_RECIPES);
}

export function renameQuickCalculatorSavedRecipe(
  recipes: readonly QuickCalculatorSavedRecipeV1[],
  id: string,
  name: string,
): QuickCalculatorSavedRecipeV1[] {
  const timestamp = nowIso();
  return recipes.map((recipe) => recipe.id === id
    ? { ...recipe, name: cleanName(name), updatedAt: timestamp }
    : recipe);
}

export function duplicateQuickCalculatorSavedRecipe(
  recipes: readonly QuickCalculatorSavedRecipeV1[],
  id: string,
): QuickCalculatorSavedRecipeV1[] {
  const source = recipes.find((recipe) => recipe.id === id);
  if (!source) return [...recipes];
  const duplicate = createQuickCalculatorSavedRecipe(source.input, `${source.name} copy`);
  return [duplicate, ...recipes].slice(0, QUICK_CALCULATOR_MAX_SAVED_RECIPES);
}

export function deleteQuickCalculatorSavedRecipe(
  recipes: readonly QuickCalculatorSavedRecipeV1[],
  id: string,
): QuickCalculatorSavedRecipeV1[] {
  return recipes.filter((recipe) => recipe.id !== id);
}

export function quickCalculatorInputToShareParams(input: QuickCalculatorInput) {
  return new URLSearchParams({
    [QUICK_CALCULATOR_SHARE_PARAM]: JSON.stringify(normalizeQuickCalculatorInput(input)),
  });
}

export function quickCalculatorInputFromSearch(search: string): QuickCalculatorInput | undefined {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get(QUICK_CALCULATOR_SHARE_PARAM);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return undefined;
    return normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      ...parsed,
    } as QuickCalculatorInput);
  } catch {
    return undefined;
  }
}

export function buildQuickCalculatorShareUrl(input: QuickCalculatorInput, baseUrl?: string) {
  const url = new URL(baseUrl ?? (typeof window !== "undefined" ? window.location.href : "https://doughtools.local/calculator/quick"));
  url.pathname = "/calculator/quick";
  url.search = quickCalculatorInputToShareParams(input).toString();
  url.hash = "";
  return url.toString();
}
