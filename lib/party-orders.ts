import type { PizzaSessionPizzaMixType } from "@/lib/pizza-session";
import {
  PIZZA_CATALOG_OPTIONS,
  isPizzaCatalogId,
  normalizePizzaCatalogIds,
  pizzaCatalogOptionsForIds,
} from "@/lib/pizza-catalog";

export type PartyOrderStatus = "open" | "closed";

export type PartyOrderRow = {
  id: string;
  user_id: string;
  public_token: string;
  title: string;
  pizza_datetime: string;
  orders_close_at: string;
  guest_note: string | null;
  allowed_pizza_ids: PizzaSessionPizzaMixType[];
  status: PartyOrderStatus;
  created_at: string;
  updated_at: string;
};

export type PublicPartyOrder = Pick<PartyOrderRow,
  "public_token"
  | "title"
  | "pizza_datetime"
  | "orders_close_at"
  | "guest_note"
  | "allowed_pizza_ids"
  | "status"
  | "updated_at"
>;

export const PARTY_ORDER_SELECT = "id,user_id,public_token,title,pizza_datetime,orders_close_at,guest_note,allowed_pizza_ids,status,created_at,updated_at";

export type PartyOrderActivity = {
  submissionCount: number;
  totalPizzaCount: number;
  latestGuestNames: string[];
};

export type PartyOrderSubmissionItem = {
  pizza_id: PizzaSessionPizzaMixType;
  pizza_name_snapshot: string;
  quantity: number;
};

export type PartyOrderSubmissionSummary = {
  guest_name: string;
  guest_comment: string | null;
  items: PartyOrderSubmissionItem[];
  totalQuantity: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, snakeKey: string, camelKey: string) {
  const value = record[snakeKey] ?? record[camelKey];
  return typeof value === "string" ? value : undefined;
}

function validDateTime(value: string | undefined) {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? value : undefined;
}

function normalizeStatus(value: unknown): PartyOrderStatus | undefined {
  return value === "open" || value === "closed" ? value : undefined;
}

export function normalizePartyOrderRow(value: unknown): PartyOrderRow | undefined {
  if (!isRecord(value)) return undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const userId = stringField(value, "user_id", "userId");
  const publicToken = stringField(value, "public_token", "publicToken");
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : undefined;
  const pizzaDateTime = validDateTime(stringField(value, "pizza_datetime", "pizzaDateTime"));
  const ordersCloseAt = validDateTime(stringField(value, "orders_close_at", "ordersCloseAt"));
  const createdAt = validDateTime(stringField(value, "created_at", "createdAt"));
  const updatedAt = validDateTime(stringField(value, "updated_at", "updatedAt"));
  const status = normalizeStatus(value.status);
  const allowedPizzaIds = normalizePizzaCatalogIds(value.allowed_pizza_ids ?? value.allowedPizzaIds);
  if (!id || !userId || !publicToken || !title || !pizzaDateTime || !ordersCloseAt || !createdAt || !updatedAt || !status) return undefined;
  if (allowedPizzaIds.length === 0) return undefined;
  return {
    id,
    user_id: userId,
    public_token: publicToken,
    title,
    pizza_datetime: pizzaDateTime,
    orders_close_at: ordersCloseAt,
    guest_note: typeof value.guest_note === "string" ? value.guest_note : null,
    allowed_pizza_ids: allowedPizzaIds,
    status,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export function normalizePublicPartyOrder(value: unknown): PublicPartyOrder | undefined {
  if (!isRecord(value)) return undefined;
  const publicToken = stringField(value, "public_token", "publicToken");
  const title = typeof value.title === "string" && value.title.trim() ? value.title.trim() : undefined;
  const pizzaDateTime = validDateTime(stringField(value, "pizza_datetime", "pizzaDateTime"));
  const ordersCloseAt = validDateTime(stringField(value, "orders_close_at", "ordersCloseAt"));
  const updatedAt = validDateTime(stringField(value, "updated_at", "updatedAt"));
  const status = normalizeStatus(value.status);
  const allowedPizzaIds = normalizePizzaCatalogIds(value.allowed_pizza_ids ?? value.allowedPizzaIds);
  if (!publicToken || !title || !pizzaDateTime || !ordersCloseAt || !updatedAt || !status) return undefined;
  if (allowedPizzaIds.length === 0) return undefined;
  return {
    public_token: publicToken,
    title,
    pizza_datetime: pizzaDateTime,
    orders_close_at: ordersCloseAt,
    guest_note: typeof value.guest_note === "string" ? value.guest_note : null,
    allowed_pizza_ids: allowedPizzaIds,
    status,
    updated_at: updatedAt,
  };
}

export function validatePartyOrderInput(value: unknown) {
  const record = isRecord(value) ? value : {};
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const pizzaDateTime = validDateTime(stringField(record, "pizza_datetime", "pizzaDateTime"));
  const ordersCloseAt = validDateTime(stringField(record, "orders_close_at", "ordersCloseAt"));
  const guestNote = typeof (record.guest_note ?? record.guestNote) === "string"
    ? String(record.guest_note ?? record.guestNote).trim()
    : "";
  const allowedPizzaIds = normalizePizzaCatalogIds(record.allowed_pizza_ids ?? record.allowedPizzaIds);

  if (!title) return { ok: false as const, error: "Event title is required." };
  if (!pizzaDateTime) return { ok: false as const, error: "Pizza date and time is required." };
  if (!ordersCloseAt) return { ok: false as const, error: "Orders close date and time is required." };
  if (allowedPizzaIds.length === 0) return { ok: false as const, error: "Choose at least one pizza option." };
  if (new Date(ordersCloseAt).getTime() > new Date(pizzaDateTime).getTime()) {
    return { ok: false as const, error: "Orders must close before or at the pizza date and time." };
  }

  return {
    ok: true as const,
    value: {
      title,
      pizza_datetime: pizzaDateTime,
      orders_close_at: ordersCloseAt,
      guest_note: guestNote || null,
      allowed_pizza_ids: allowedPizzaIds,
    },
  };
}

export function isPartyOrderOpen(order: Pick<PublicPartyOrder, "status" | "orders_close_at">, now = new Date()) {
  if (order.status !== "open") return false;
  const closeTime = new Date(order.orders_close_at).getTime();
  return Number.isFinite(closeTime) && closeTime >= now.getTime();
}

export function validatePublicPartyOrderSubmissionInput(
  value: unknown,
  order: Pick<PublicPartyOrder, "allowed_pizza_ids">,
) {
  const record = isRecord(value) ? value : {};
  const guestName = typeof record.guestName === "string" ? record.guestName.trim() : "";
  const guestComment = typeof record.guestComment === "string" ? record.guestComment.trim() : "";
  const submittedItems = Array.isArray(record.items) ? record.items : [];
  const allowedPizzaIds = new Set(order.allowed_pizza_ids);
  const catalogById = new Map(PIZZA_CATALOG_OPTIONS.map((option) => [option.id, option]));

  if (!guestName) return { ok: false as const, error: "Your name is required." };
  if (guestName.length > 80) return { ok: false as const, error: "Your name must be 80 characters or fewer." };
  if (guestComment.length > 500) return { ok: false as const, error: "Comments must be 500 characters or fewer." };

  const items: PartyOrderSubmissionItem[] = [];
  let totalQuantity = 0;
  for (const item of submittedItems) {
    if (!isRecord(item)) return { ok: false as const, error: "Order items are invalid." };
    const pizzaId = typeof item.pizzaId === "string" ? item.pizzaId : typeof item.pizza_id === "string" ? item.pizza_id : "";
    if (!isPizzaCatalogId(pizzaId)) return { ok: false as const, error: "Choose a pizza from this party menu." };
    if (!allowedPizzaIds.has(pizzaId)) return { ok: false as const, error: "Choose a pizza from this party menu." };

    const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    if (!Number.isInteger(quantity)) return { ok: false as const, error: "Pizza quantities must be whole numbers." };
    if (quantity <= 0) return { ok: false as const, error: "Choose at least one pizza." };
    if (quantity > 10) return { ok: false as const, error: "Please keep each pizza choice to 10 or fewer." };

    totalQuantity += quantity;
    const pizza = catalogById.get(pizzaId);
    if (!pizza) return { ok: false as const, error: "Choose a pizza from this party menu." };
    items.push({
      pizza_id: pizzaId,
      pizza_name_snapshot: pizza.name,
      quantity,
    });
  }

  if (items.length === 0 || totalQuantity <= 0) return { ok: false as const, error: "Choose at least one pizza." };
  if (totalQuantity > 20) return { ok: false as const, error: "Please keep the total order to 20 pizzas or fewer." };

  return {
    ok: true as const,
    value: {
      guest_name: guestName,
      guest_comment: guestComment || null,
      items,
      totalQuantity,
    },
  };
}

export function partyOrderDateTimeLabel(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function partyOrderAllowedPizzaOptions(order: Pick<PartyOrderRow, "allowed_pizza_ids">) {
  return pizzaCatalogOptionsForIds(order.allowed_pizza_ids);
}
