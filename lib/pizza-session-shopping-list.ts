import {
  type PizzaSession,
  type PizzaSessionShoppingItem,
  type PizzaSessionShoppingList,
} from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  findPizzaSessionPreset,
  pizzaSessionPresets,
} from "@/lib/pizza-session-presets";

export const SHOPPING_LIST_LOCAL_ONLY_COPY = "Shopping lists are saved locally in this browser on this device.";

export type ShoppingListGenerationResult =
  | { ok: true; shoppingList: PizzaSessionShoppingList }
  | { ok: false; missingReason: "no-session" | "missing-pizza-count" | "missing-preset" };

export type ShoppingItemStatus = PizzaSessionShoppingItem["status"];

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const statusLabels: Record<ShoppingItemStatus, string> = {
  already_have: "Already have",
  need_to_buy: "Need to buy",
  bought: "Bought",
};

function itemAmount(amountHint: string | undefined, pizzaCount: number) {
  if (!amountHint) return `for ${pizzaCount} pizza${pizzaCount === 1 ? "" : "s"}`;
  if (amountHint.includes("dough recipe")) return amountHint;
  return `${amountHint} · for ${pizzaCount} pizza${pizzaCount === 1 ? "" : "s"}`;
}

function existingStatusMap(session: PizzaSession | undefined, presetId: string) {
  const map = new Map<string, ShoppingItemStatus>();
  if (session?.shoppingList?.presetId !== presetId) return map;
  for (const group of session.shoppingList.groups) {
    for (const item of group.items) {
      map.set(item.id, item.status);
    }
  }
  return map;
}

export function generatePizzaSessionShoppingList(
  session: PizzaSession | undefined,
  presetId: string = pizzaSessionPresets[0].id,
  now = new Date(),
): ShoppingListGenerationResult {
  if (!session) return { ok: false, missingReason: "no-session" };
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;
  if (!pizzaCount || pizzaCount < 1) return { ok: false, missingReason: "missing-pizza-count" };

  const preset = findPizzaSessionPreset(presetId);
  if (!preset) return { ok: false, missingReason: "missing-preset" };

  const statuses = existingStatusMap(session, preset.id);
  const groups = preset.ingredientGroups.flatMap((group) => {
    const items = group.items.map((item) => ({
      id: `${preset.id}:${group.group.toLowerCase()}:${item.id}`,
      label: item.label,
      amount: itemAmount(item.amountHint, pizzaCount),
      status: statuses.get(`${preset.id}:${group.group.toLowerCase()}:${item.id}`) ?? "need_to_buy" as const,
    }));

    return items.length ? [{ group: group.group, items }] : [];
  });

  return {
    ok: true,
    shoppingList: {
      presetId: preset.id,
      presetName: preset.name,
      generatedAt: now.toISOString(),
      pizzaCount,
      groups,
    },
  };
}

export function generateAndSaveActiveShoppingList(
  presetId?: string,
  storage?: StorageLike,
  now = new Date(),
) {
  const session = getActivePizzaSession(storage);
  const selectedPresetId = presetId ?? session?.shoppingList?.presetId ?? pizzaSessionPresets[0].id;
  const result = generatePizzaSessionShoppingList(session, selectedPresetId, now);
  if (!session || !result.ok) return { session, result };

  const updatedSession = updatePizzaSession(
    session.id,
    {
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
