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
export const PARTY_ORDER_TITLE_MAX_LENGTH = 120;
export const PARTY_ORDER_GUEST_NOTE_MAX_LENGTH = 500;

export type PartyOrderActivity = {
  submissionCount: number;
  totalPizzaCount: number;
  latestGuestNames: string[];
  pizzaMix: PartyOrderPizzaMixItem[];
  guestOrders: PartyOrderGuestOrderSummary[];
};

export type PartyOrderSubmissionItem = {
  pizza_id: string;
  pizza_name_snapshot: string;
  quantity: number;
};

export type PartyOrderSubmissionSummary = {
  guest_name: string;
  guest_comment: string | null;
  items: PartyOrderSubmissionItem[];
  totalQuantity: number;
};

export type PartyOrderPizzaMixItem = PartyOrderSubmissionItem;

export type PartyOrderGuestOrderSummary = PartyOrderSubmissionSummary & {
  id: string;
  created_at: string;
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

function normalizePositiveInteger(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : undefined;
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
  if (title.length > PARTY_ORDER_TITLE_MAX_LENGTH) return { ok: false as const, error: "Event title must be 120 characters or fewer." };
  if (!pizzaDateTime) return { ok: false as const, error: "Pizza date and time is required." };
  if (!ordersCloseAt) return { ok: false as const, error: "Orders close date and time is required." };
  if (guestNote.length > PARTY_ORDER_GUEST_NOTE_MAX_LENGTH) return { ok: false as const, error: "Guest note must be 500 characters or fewer." };
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

export function partyOrderDeadlineHasPassed(order: Pick<PartyOrderRow | PublicPartyOrder, "orders_close_at">, now = new Date()) {
  const closeTime = new Date(order.orders_close_at).getTime();
  return Number.isFinite(closeTime) && closeTime < now.getTime();
}

export function partyOrderOwnerStatusSummary(order: Pick<PartyOrderRow | PublicPartyOrder, "status" | "orders_close_at">, now = new Date()) {
  const expired = partyOrderDeadlineHasPassed(order, now);
  if (expired) {
    return {
      label: "Orders closed by deadline",
      helper: "The order deadline has passed.",
      canClose: false,
      canReopen: false,
    };
  }
  if (order.status === "closed") {
    return {
      label: "Orders closed",
      helper: "Guests cannot submit new orders while this is closed.",
      canClose: false,
      canReopen: true,
    };
  }
  return {
    label: "Orders open",
    helper: "Guests can still submit pizza orders until the deadline unless you close orders now.",
    canClose: true,
    canReopen: false,
  };
}

export function validatePartyOrderStatusUpdate(
  value: unknown,
  order: Pick<PartyOrderRow, "orders_close_at">,
  now = new Date(),
) {
  const record = isRecord(value) ? value : {};
  const status = normalizeStatus(record.status);
  if (!status) return { ok: false as const, error: "Party Order status is invalid." };
  if (status === "open" && partyOrderDeadlineHasPassed(order, now)) {
    return { ok: false as const, error: "Orders cannot be reopened after the deadline." };
  }
  return { ok: true as const, value: { status } };
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

export function partyOrderEmptyActivity(): PartyOrderActivity {
  return {
    submissionCount: 0,
    totalPizzaCount: 0,
    latestGuestNames: [],
    pizzaMix: [],
    guestOrders: [],
  };
}

export function summarizePartyOrderActivity(submissionRows: unknown[], itemRows: unknown[]): PartyOrderActivity {
  const submissions = submissionRows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const id = typeof row.id === "string" ? row.id : "";
    const guestName = typeof row.guest_name === "string" && row.guest_name.trim() ? row.guest_name.trim() : "";
    const guestComment = typeof row.guest_comment === "string" && row.guest_comment.trim() ? row.guest_comment.trim() : null;
    const createdAt = validDateTime(stringField(row, "created_at", "createdAt"));
    if (!id || !guestName || !createdAt) return [];
    return [{
      id,
      guest_name: guestName,
      guest_comment: guestComment,
      created_at: createdAt,
      items: [] as PartyOrderSubmissionItem[],
      totalQuantity: 0,
    }];
  });

  const bySubmissionId = new Map(submissions.map((submission) => [submission.id, submission]));
  const catalogOrder = new Map(PIZZA_CATALOG_OPTIONS.map((option, index) => [option.id, index]));
  const catalogNameById = new Map(PIZZA_CATALOG_OPTIONS.map((option) => [option.id, option.name]));
  const pizzaMixById = new Map<string, PartyOrderPizzaMixItem>();

  for (const row of itemRows) {
    if (!isRecord(row)) continue;
    const submissionId = typeof row.submission_id === "string" ? row.submission_id : "";
    const submission = bySubmissionId.get(submissionId);
    if (!submission) continue;
    const pizzaId = typeof row.pizza_id === "string" && row.pizza_id.trim() ? row.pizza_id.trim() : "";
    const snapshot = typeof row.pizza_name_snapshot === "string" && row.pizza_name_snapshot.trim()
      ? row.pizza_name_snapshot.trim()
      : "";
    const quantity = normalizePositiveInteger(row.quantity);
    if (!pizzaId || !snapshot || !quantity) continue;
    const item: PartyOrderSubmissionItem = {
      pizza_id: pizzaId,
      pizza_name_snapshot: snapshot,
      quantity,
    };
    submission.items.push(item);
    submission.totalQuantity += quantity;

    const existing = pizzaMixById.get(pizzaId);
    pizzaMixById.set(pizzaId, {
      pizza_id: pizzaId,
      pizza_name_snapshot: catalogNameById.get(pizzaId as PizzaSessionPizzaMixType) ?? existing?.pizza_name_snapshot ?? snapshot,
      quantity: (existing?.quantity ?? 0) + quantity,
    });
  }

  const guestOrders = submissions
    .map((submission) => ({
      ...submission,
      items: submission.items.sort((a, b) => {
        const aOrder = catalogOrder.get(a.pizza_id as PizzaSessionPizzaMixType) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = catalogOrder.get(b.pizza_id as PizzaSessionPizzaMixType) ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.pizza_name_snapshot.localeCompare(b.pizza_name_snapshot);
      }),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pizzaMix = [...pizzaMixById.values()].sort((a, b) => {
    const aOrder = catalogOrder.get(a.pizza_id as PizzaSessionPizzaMixType) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = catalogOrder.get(b.pizza_id as PizzaSessionPizzaMixType) ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.pizza_name_snapshot.localeCompare(b.pizza_name_snapshot);
  });

  return {
    submissionCount: guestOrders.length,
    totalPizzaCount: pizzaMix.reduce((total, item) => total + item.quantity, 0),
    latestGuestNames: guestOrders.map((submission) => submission.guest_name).slice(0, 3),
    pizzaMix,
    guestOrders,
  };
}

export function normalizePartyOrderActivity(value: unknown): PartyOrderActivity {
  if (!isRecord(value)) return partyOrderEmptyActivity();
  const guestOrders = Array.isArray(value.guestOrders)
    ? value.guestOrders.flatMap((order) => {
      if (!isRecord(order)) return [];
      const id = typeof order.id === "string" ? order.id : "";
      const guestName = typeof order.guest_name === "string" && order.guest_name.trim() ? order.guest_name.trim() : "";
      const guestComment = typeof order.guest_comment === "string" && order.guest_comment.trim() ? order.guest_comment.trim() : null;
      const createdAt = validDateTime(stringField(order, "created_at", "createdAt"));
      const items = Array.isArray(order.items)
        ? order.items.flatMap((item) => {
          if (!isRecord(item)) return [];
          const pizzaId = typeof item.pizza_id === "string" && item.pizza_id.trim() ? item.pizza_id.trim() : "";
          const snapshot = typeof item.pizza_name_snapshot === "string" && item.pizza_name_snapshot.trim()
            ? item.pizza_name_snapshot.trim()
            : "";
          const quantity = normalizePositiveInteger(item.quantity);
          return pizzaId && snapshot && quantity ? [{ pizza_id: pizzaId, pizza_name_snapshot: snapshot, quantity }] : [];
        })
        : [];
      if (!id || !guestName || !createdAt) return [];
      return [{
        id,
        guest_name: guestName,
        guest_comment: guestComment,
        created_at: createdAt,
        items,
        totalQuantity: items.reduce((total, item) => total + item.quantity, 0),
      }];
    })
    : [];

  const pizzaMix = Array.isArray(value.pizzaMix)
    ? value.pizzaMix.flatMap((item) => {
      if (!isRecord(item)) return [];
      const pizzaId = typeof item.pizza_id === "string" && item.pizza_id.trim() ? item.pizza_id.trim() : "";
      const snapshot = typeof item.pizza_name_snapshot === "string" && item.pizza_name_snapshot.trim()
        ? item.pizza_name_snapshot.trim()
        : "";
      const quantity = normalizePositiveInteger(item.quantity);
      return pizzaId && snapshot && quantity ? [{ pizza_id: pizzaId, pizza_name_snapshot: snapshot, quantity }] : [];
    })
    : [];

  const totalPizzaCount = typeof value.totalPizzaCount === "number" && Number.isFinite(value.totalPizzaCount)
    ? value.totalPizzaCount
    : pizzaMix.reduce((total, item) => total + item.quantity, 0);

  return {
    submissionCount: typeof value.submissionCount === "number" && Number.isFinite(value.submissionCount)
      ? value.submissionCount
      : guestOrders.length,
    totalPizzaCount,
    latestGuestNames: Array.isArray(value.latestGuestNames)
      ? value.latestGuestNames.flatMap((name) => typeof name === "string" && name.trim() ? [name.trim()] : []).slice(0, 3)
      : guestOrders.map((order) => order.guest_name).slice(0, 3),
    pizzaMix,
    guestOrders,
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

export function partyOrderInvitationText(
  order: Pick<PartyOrderRow, "title" | "pizza_datetime" | "orders_close_at" | "guest_note">,
  publicGuestLink: string,
) {
  const lines = [
    `You're invited to ${order.title} 🍕`,
    "",
    `Pizza time: ${partyOrderDateTimeLabel(order.pizza_datetime)}`,
    `Please order by: ${partyOrderDateTimeLabel(order.orders_close_at)}`,
  ];

  if (order.guest_note?.trim()) {
    lines.push("", order.guest_note.trim());
  }

  lines.push("", "Choose your pizza here:", publicGuestLink);
  return lines.join("\n");
}

export function partyOrderAllowedPizzaOptions(order: Pick<PartyOrderRow, "allowed_pizza_ids">) {
  return pizzaCatalogOptionsForIds(order.allowed_pizza_ids);
}
