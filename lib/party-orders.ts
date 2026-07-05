import type { PizzaSessionPizzaMixType } from "@/lib/pizza-session";
import {
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
