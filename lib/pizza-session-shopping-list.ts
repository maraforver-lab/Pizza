import {
  type PizzaSession,
  type PizzaSessionPizzaMix,
  type PizzaSessionPizzaMixType,
  type PizzaSessionShoppingItem,
  type PizzaSessionShoppingList,
  type PizzaSessionShoppingGroup,
} from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  PIZZA_CATALOG_IDS,
  PIZZA_CATALOG_OPTIONS,
} from "@/lib/pizza-catalog";
import {
  findPizzaSessionPreset,
  pizzaSessionPresets,
} from "@/lib/pizza-session-presets";
import {
  calculateSessionPizzaSauce,
  formatSauceCanPurchase,
  formatGrams as formatSauceGrams,
} from "@/lib/pizza-sauce-calculator";
import { flourById, flourIds, type FlourId } from "@/lib/flours";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { yeastTypeLabel } from "@/lib/yeast-types";

export const SHOPPING_LIST_LOCAL_ONLY_COPY = "Shopping lists are saved locally in this browser on this device.";

export const PIZZA_MIX_TYPES: PizzaSessionPizzaMixType[] = [...PIZZA_CATALOG_IDS];

export type PizzaMixAllocation = Record<PizzaSessionPizzaMixType, number>;

export const PIZZA_MIX_OPTIONS = PIZZA_CATALOG_OPTIONS;

export type ShoppingListGenerationResult =
  | { ok: true; shoppingList: PizzaSessionShoppingList; pizzaMix: PizzaMixAllocation }
  | { ok: false; missingReason: "no-session" | "missing-pizza-count" | "missing-preset" };

export type ShoppingItemStatus = PizzaSessionShoppingItem["status"];

export type ShoppingFlourDisplay = {
  label: string;
  recommendation: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type QuantifiedShoppingIngredient = {
  group: PizzaSessionShoppingGroup;
  id: string;
  label: string;
  amount: (pizzaCount: number) => string;
};

type ToppingQuantityIngredient = {
  group: PizzaSessionShoppingGroup;
  id: string;
  label: string;
  gramsPerPizza?: number;
  tspPerPizza?: number;
  text?: (pizzaTypeCount: number) => string;
};

const flourChoiceToProfileId: Record<string, FlourId> = {
  plain: "caputo-classica",
  bread: "caputo-cuoco",
  "tipo-00": "caputo-pizzeria",
};

const statusLabels: Record<ShoppingItemStatus, string> = {
  already_have: "Already have",
  need_to_buy: "Need to buy",
  bought: "Bought",
};

function formatGrams(value: number) {
  if (value < 10) return `${Math.round(value * 100) / 100} g`;
  if (value < 100) return `${Math.round(value * 10) / 10} g`;
  return `${Math.round(value)} g`;
}

function formatTsp(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} tsp`;
}

function selectedPizzaEstimateLabel(pizzaCount: number) {
  return `estimate for ${pizzaCount} selected pizza${pizzaCount === 1 ? "" : "s"}`;
}

function doughPlanAmount(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? `${formatGrams(value)} · from Dough Plan`
    : "from Dough Plan when available";
}

function isFlourId(value: string | undefined): value is FlourId {
  return Boolean(value && flourIds.includes(value as FlourId));
}

function selectedShoppingFlourLabel(session: PizzaSession) {
  const value = session.recipeSnapshot?.flour ?? session.flour;
  if (isFlourId(value)) {
    const flour = flourById(value);
    return `${flour.brand} ${flour.name}`;
  }
  if (value === "plain") return "All-purpose flour";
  if (value === "bread") return "Bread flour / strong flour";
  if (value === "tipo-00") return "Pizza flour / Tipo 00";
  return "Flour";
}

function selectedShoppingFlourProfile(session: PizzaSession) {
  const value = session.recipeSnapshot?.flour ?? session.flour;
  if (isFlourId(value)) return flourById(value);
  const profileId = value ? flourChoiceToProfileId[value] : undefined;
  return profileId ? flourById(profileId) : undefined;
}

function isDisplayableShoppingWRecommendation(value: string | undefined) {
  return Boolean(value && /^≈?\s*W\s/i.test(value.trim()));
}

export function formatShoppingFlourRecommendation({
  canonicalStrength,
  selectedStrength,
  selectedProtein,
}: {
  canonicalStrength?: string;
  selectedStrength?: string;
  selectedProtein?: string;
}) {
  if (isDisplayableShoppingWRecommendation(canonicalStrength)) {
    return `Recommended strength: ${canonicalStrength}`;
  }
  if (isDisplayableShoppingWRecommendation(selectedStrength)) {
    return `Recommended strength: ${selectedStrength}`;
  }
  if (selectedProtein?.trim()) {
    return `Recommended protein: ${selectedProtein.trim()}`;
  }
  return "Use the flour recommended in your Dough Plan";
}

export function getShoppingFlourDisplay(session: PizzaSession, now = new Date()): ShoppingFlourDisplay {
  const recipe = buildSessionRecipe(session, now);
  const profile = selectedShoppingFlourProfile(session);
  const canonicalStrength = recipe.ok ? recipe.flourWGuidance?.recommendationLabel : undefined;

  return {
    label: selectedShoppingFlourLabel(session),
    recommendation: formatShoppingFlourRecommendation({
      canonicalStrength,
      selectedStrength: profile?.strength,
      selectedProtein: profile?.protein,
    }),
  };
}

function doughIngredients(session: PizzaSession): QuantifiedShoppingIngredient[] {
  const snapshot = session.recipeSnapshot;
  const yeastLabel = `Yeast — ${yeastTypeLabel(snapshot?.yeastType)}`;
  return [
    { group: "Dough", id: "flour", label: "Flour", amount: () => doughPlanAmount(snapshot?.flourAmount) },
    { group: "Dough", id: "water", label: "Water", amount: () => doughPlanAmount(snapshot?.waterAmount) },
    { group: "Dough", id: "salt", label: "Salt", amount: () => doughPlanAmount(snapshot?.saltAmount) },
    { group: "Dough", id: "yeast", label: yeastLabel, amount: () => doughPlanAmount(snapshot?.leavenerAmount) },
  ];
}

const pizzaMixTypeSet = new Set<string>(PIZZA_MIX_TYPES);

function isPizzaMixType(value: string | undefined): value is PizzaSessionPizzaMixType {
  return typeof value === "string" && pizzaMixTypeSet.has(value);
}

function emptyPizzaMix(): PizzaMixAllocation {
  return {
    margherita: 0,
    marinara: 0,
    diavola: 0,
    funghi: 0,
    prosciutto: 0,
    "quattro-formaggi": 0,
  };
}

function pizzaMixSum(mix: PizzaMixAllocation) {
  return PIZZA_MIX_TYPES.reduce((total, type) => total + mix[type], 0);
}

function pizzaMixPresetName(type: PizzaSessionPizzaMixType) {
  return PIZZA_MIX_OPTIONS.find((option) => option.id === type)?.name ?? "Pizza";
}

export function normalizePizzaMixForCount(
  pizzaCount: number,
  mix?: PizzaSessionPizzaMix,
  legacyPreset?: string,
): PizzaMixAllocation {
  const count = Math.max(0, Math.floor(pizzaCount));
  const normalized = emptyPizzaMix();
  if (count < 1) return normalized;

  if (!mix || !Object.keys(mix).length) {
    const legacyType = isPizzaMixType(legacyPreset) ? legacyPreset : "margherita";
    normalized[legacyType] = count;
    return normalized;
  }

  let nonMargheritaTotal = 0;
  for (const type of PIZZA_MIX_TYPES.filter((entry) => entry !== "margherita")) {
    const requested = Math.max(0, Math.floor(mix[type] ?? 0));
    const available = count - nonMargheritaTotal;
    const next = Math.min(requested, available);
    normalized[type] = next;
    nonMargheritaTotal += next;
  }

  if (nonMargheritaTotal === 0 && Math.max(0, Math.floor(mix.margherita ?? 0)) === 0) {
    const legacyType = isPizzaMixType(legacyPreset) ? legacyPreset : "margherita";
    normalized[legacyType] = count;
    return normalized;
  }

  normalized.margherita = Math.max(0, count - nonMargheritaTotal);
  return normalized;
}

export function adjustPizzaMixAllocation(
  currentMix: PizzaSessionPizzaMix | undefined,
  pizzaType: PizzaSessionPizzaMixType,
  delta: number,
  pizzaCount: number,
): PizzaMixAllocation {
  const next = normalizePizzaMixForCount(pizzaCount, currentMix);
  if (pizzaCount < 1 || delta === 0) return next;

  if (pizzaType === "margherita") {
    if (delta > 0) {
      const donor = PIZZA_MIX_TYPES.find((type) => type !== "margherita" && next[type] > 0);
      if (donor) {
        next[donor] -= 1;
        next.margherita += 1;
      }
    }
    return normalizePizzaMixForCount(pizzaCount, next);
  }

  if (delta > 0) {
    if (next.margherita > 0) {
      next.margherita -= 1;
      next[pizzaType] += 1;
    }
  } else if (delta < 0 && next[pizzaType] > 0) {
    next[pizzaType] -= 1;
    next.margherita += 1;
  }

  return normalizePizzaMixForCount(pizzaCount, next);
}

export function primaryPizzaTypeFromMix(mix: PizzaMixAllocation): PizzaSessionPizzaMixType {
  const active = PIZZA_MIX_TYPES
    .filter((type) => mix[type] > 0)
    .sort((a, b) => mix[b] - mix[a]);
  return active[0] ?? "margherita";
}

function shoppingListIdFromMix(mix: PizzaMixAllocation) {
  const active = PIZZA_MIX_TYPES.filter((type) => mix[type] > 0);
  return active.length === 1 ? active[0] : "pizza-mix";
}

function shoppingListNameFromMix(mix: PizzaMixAllocation) {
  const active = PIZZA_MIX_TYPES.filter((type) => mix[type] > 0);
  if (active.length === 1) return pizzaMixPresetName(active[0]);
  return "Pizza mix";
}

const toppingQuantityPlans: Record<PizzaSessionPizzaMixType, ToppingQuantityIngredient[]> = {
  margherita: [
    { group: "Cheese", id: "mozzarella", label: "Mozzarella", gramsPerPizza: 80 },
    { group: "Toppings", id: "basil", label: "Fresh basil", text: (count) => `${count === 1 ? "small handful" : "small handfuls"} · ${selectedPizzaEstimateLabel(count)}` },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
  marinara: [
    { group: "Toppings", id: "garlic", label: "Garlic", text: (count) => `${Math.max(1, Math.ceil(count / 2))} clove${Math.ceil(count / 2) === 1 ? "" : "s"} · ${selectedPizzaEstimateLabel(count)}` },
    { group: "Toppings", id: "oregano", label: "Oregano", text: (count) => `${count === 1 ? "small pinch" : "small pinches"} · ${selectedPizzaEstimateLabel(count)}` },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
  diavola: [
    { group: "Cheese", id: "mozzarella", label: "Mozzarella", gramsPerPizza: 75 },
    { group: "Toppings", id: "spicy-salami", label: "Spicy salami or pepperoni", gramsPerPizza: 35 },
    { group: "Toppings", id: "basil-or-oregano", label: "Basil or oregano", text: (count) => `${count === 1 ? "small pinch or few leaves" : "small pinches or a handful of leaves"} · ${selectedPizzaEstimateLabel(count)}` },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
  funghi: [
    { group: "Cheese", id: "mozzarella", label: "Mozzarella", gramsPerPizza: 75 },
    { group: "Toppings", id: "mushrooms", label: "Mushrooms", gramsPerPizza: 60 },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
  prosciutto: [
    { group: "Cheese", id: "mozzarella", label: "Mozzarella", gramsPerPizza: 75 },
    { group: "Toppings", id: "prosciutto", label: "Prosciutto", gramsPerPizza: 40 },
    { group: "Toppings", id: "basil-or-arugula", label: "Basil or arugula", text: (count) => `${count === 1 ? "small handful" : "small handfuls"} · ${selectedPizzaEstimateLabel(count)}` },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
  "quattro-formaggi": [
    { group: "Cheese", id: "mozzarella", label: "Mozzarella", gramsPerPizza: 50 },
    { group: "Cheese", id: "gorgonzola", label: "Gorgonzola or blue cheese", gramsPerPizza: 25 },
    { group: "Cheese", id: "parmesan", label: "Parmesan or pecorino", gramsPerPizza: 15 },
    { group: "Cheese", id: "fontina", label: "Fontina or mild melting cheese", gramsPerPizza: 40 },
    { group: "Toppings", id: "olive-oil", label: "Extra virgin olive oil", tspPerPizza: 1 },
  ],
};

function sauceIngredientForMix(mix: PizzaMixAllocation, session: PizzaSession): QuantifiedShoppingIngredient[] {
  const summary = calculateSessionPizzaSauce({
    pizzaMix: mix,
    ovenType: session.recipeSnapshot?.oven ?? session.ovenType,
    pizzaStyle: session.pizzaStyle,
  });

  if (summary.finishedSauceGrams <= 0 || summary.cansNeeded <= 0) return [];

  return [{
    group: "Sauce",
    id: "tomato-sauce",
    label: "Tomato sauce or crushed tomatoes",
    amount: () => [
      `${formatSauceGrams(summary.finishedSauceGrams)} to use`,
      `buy ${formatSauceCanPurchase(summary.cansNeeded, summary.canSizeGrams)}`,
      selectedPizzaEstimateLabel(pizzaMixSum(mix)),
    ].join(" · "),
  }];
}

function toppingIngredientsForMix(mix: PizzaMixAllocation): QuantifiedShoppingIngredient[] {
  const combined = new Map<string, {
    group: PizzaSessionShoppingGroup;
    id: string;
    label: string;
    grams: number;
    tsp: number;
    textAmounts: string[];
  }>();

  for (const pizzaType of PIZZA_MIX_TYPES) {
    const count = mix[pizzaType];
    if (count < 1) continue;
    for (const ingredient of toppingQuantityPlans[pizzaType]) {
      const key = `${ingredient.group}:${ingredient.id}`;
      const entry = combined.get(key) ?? {
        group: ingredient.group,
        id: ingredient.id,
        label: ingredient.label,
        grams: 0,
        tsp: 0,
        textAmounts: [],
      };
      if (ingredient.gramsPerPizza) entry.grams += ingredient.gramsPerPizza * count;
      if (ingredient.tspPerPizza) entry.tsp += ingredient.tspPerPizza * count;
      if (ingredient.text) entry.textAmounts.push(ingredient.text(count));
      combined.set(key, entry);
    }
  }

  return [...combined.values()].map((entry) => ({
    group: entry.group,
    id: entry.id,
    label: entry.label,
    amount: () => {
      const parts = [];
      if (entry.grams > 0) parts.push(`${formatGrams(entry.grams)} · ${selectedPizzaEstimateLabel(pizzaMixSum(mix))}`);
      if (entry.tsp > 0) parts.push(`${formatTsp(entry.tsp)} · ${selectedPizzaEstimateLabel(pizzaMixSum(mix))}`);
      parts.push(...entry.textAmounts);
      return parts.join(" + ");
    },
  }));
}

function shoppingItemStableKey(itemId: string) {
  const parts = itemId.split(":");
  return parts.length >= 3 ? parts.slice(1).join(":") : itemId;
}

function existingStatusMap(session: PizzaSession | undefined) {
  const map = new Map<string, ShoppingItemStatus>();
  if (!session?.shoppingList) return map;
  for (const group of session.shoppingList.groups) {
    for (const item of group.items) {
      map.set(item.id, item.status);
      map.set(shoppingItemStableKey(item.id), item.status);
    }
  }
  return map;
}

export function generatePizzaSessionShoppingList(
  session: PizzaSession | undefined,
  presetId?: string,
  now = new Date(),
  pizzaMixOverride?: PizzaSessionPizzaMix,
): ShoppingListGenerationResult {
  if (!session) return { ok: false, missingReason: "no-session" };
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;
  if (!pizzaCount || pizzaCount < 1) return { ok: false, missingReason: "missing-pizza-count" };

  if (presetId && !isPizzaMixType(presetId) && !findPizzaSessionPreset(presetId)) {
    return { ok: false, missingReason: "missing-preset" };
  }

  const explicitPresetMix = isPizzaMixType(presetId) ? { [presetId]: pizzaCount } : undefined;
  const pizzaMix = normalizePizzaMixForCount(
    pizzaCount,
    pizzaMixOverride ?? explicitPresetMix ?? session.pizzaMix,
    presetId ?? session.shoppingList?.presetId ?? session.pizzaPreset ?? pizzaSessionPresets[0].id,
  );
  const listId = shoppingListIdFromMix(pizzaMix);
  const statuses = existingStatusMap(session);
  const quantifiedIngredients = [
    ...doughIngredients(session),
    ...sauceIngredientForMix(pizzaMix, session),
    ...toppingIngredientsForMix(pizzaMix),
  ];
  const groupOrder: PizzaSessionShoppingGroup[] = ["Dough", "Sauce", "Cheese", "Toppings", "Gear"];
  const groups = groupOrder.flatMap((group) => {
    const items = quantifiedIngredients.filter((item) => item.group === group).map((item) => {
      const id = `${listId}:${group.toLowerCase()}:${item.id}`;
      return {
        id,
        label: item.label,
        amount: item.amount(pizzaCount),
        status: statuses.get(id) ?? statuses.get(`${group.toLowerCase()}:${item.id}`) ?? "need_to_buy" as const,
      };
    });

    return items.length ? [{ group, items }] : [];
  });

  return {
    ok: true,
    pizzaMix,
    shoppingList: {
      presetId: listId,
      presetName: shoppingListNameFromMix(pizzaMix),
      generatedAt: now.toISOString(),
      pizzaCount,
      groups,
    },
  };
}

export function savePizzaSessionMenuMix(
  session: PizzaSession,
  pizzaMixOverride: PizzaSessionPizzaMix,
  storage?: StorageLike,
  now = new Date(),
) {
  const result = generatePizzaSessionShoppingList(session, undefined, now, pizzaMixOverride);
  if (!result.ok) return { session, result };

  const updatedSession = updatePizzaSession(
    session.id,
    {
      pizzaMix: result.pizzaMix,
      pizzaPreset: primaryPizzaTypeFromMix(result.pizzaMix),
      shoppingList: result.shoppingList,
    },
    storage,
    now,
  );

  return { session: updatedSession, result };
}

export function generateAndSaveActiveShoppingList(
  presetId?: string,
  storage?: StorageLike,
  now = new Date(),
  pizzaMixOverride?: PizzaSessionPizzaMix,
) {
  const session = getActivePizzaSession(storage);
  const selectedPresetId = presetId ?? (session?.pizzaMix ? undefined : session?.shoppingList?.presetId ?? session?.pizzaPreset ?? pizzaSessionPresets[0].id);
  const result = generatePizzaSessionShoppingList(session, selectedPresetId, now, pizzaMixOverride);
  if (!session || !result.ok) return { session, result };

  const updatedSession = updatePizzaSession(
    session.id,
    {
      pizzaMix: result.pizzaMix,
      pizzaPreset: primaryPizzaTypeFromMix(result.pizzaMix),
      shoppingList: result.shoppingList,
      currentStep: "shopping",
    },
    storage,
    now,
  );

  return { session: updatedSession, result };
}

export function updateShoppingItemStatus(
  session: PizzaSession,
  itemId: string,
  status: ShoppingItemStatus,
  storage?: StorageLike,
  now = new Date(),
) {
  if (!session.shoppingList) return undefined;
  const groups = session.shoppingList.groups.map((group) => ({
    ...group,
    items: group.items.map((item) => item.id === itemId ? { ...item, status } : item),
  }));

  return updatePizzaSession(
    session.id,
    {
      shoppingList: {
        ...session.shoppingList,
        groups,
      },
      currentStep: "shopping",
    },
    storage,
    now,
  );
}

export function formatShoppingListPlainText(session: PizzaSession, shoppingList: PizzaSessionShoppingList) {
  const lines = [
    `DoughTools shopping list`,
    `Preset: ${shoppingList.presetName ?? "Pizza"}`,
    `Pizza count: ${shoppingList.pizzaCount ?? session.pizzaCount ?? "not set"}`,
    "",
  ];

  for (const group of shoppingList.groups) {
    lines.push(`${group.group}`);
    for (const item of group.items) {
      lines.push(`- [${statusLabels[item.status]}] ${item.label}${item.amount ? ` — ${item.amount}` : ""}`);
    }
    lines.push("");
  }

  lines.push("Saved locally on this device. No cloud sync or public sharing is active.");
  return lines.join("\n").trim();
}
