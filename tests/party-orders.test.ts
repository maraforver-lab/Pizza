import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PIZZA_CATALOG_IDS,
  PIZZA_CATALOG_OPTIONS,
  normalizePizzaCatalogIds,
} from "@/lib/pizza-catalog";
import {
  buildPartyOrderPizzaSessionHandoff,
  normalizePublicPartyOrder,
  normalizePublicPartyOrderEditableSubmission,
  normalizePartyOrderRow,
  isPartyOrderOpen,
  partyOrderAllowedPizzaOptions,
  partyOrderInvitationText,
  partyOrderOwnerStatusSummary,
  partyOrderPrepSummaryText,
  restorePartyOrderStatus,
  summarizePartyOrderActivity,
  validatePartyOrderStatusUpdate,
  validatePublicPartyOrderSubmissionInput,
  validatePartyOrderInput,
} from "@/lib/party-orders";
import { PIZZA_MIX_OPTIONS } from "@/lib/pizza-session-shopping-list";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Party Orders foundation", () => {
  it("uses the same pizza catalog options as Pizza Session shopping", () => {
    expect(PIZZA_MIX_OPTIONS).toBe(PIZZA_CATALOG_OPTIONS);
    expect(PIZZA_CATALOG_IDS).toEqual([
      "margherita",
      "marinara",
      "diavola",
      "funghi",
      "prosciutto",
      "quattro-formaggi",
    ]);
    expect(PIZZA_CATALOG_OPTIONS.map((option) => option.name)).toEqual([
      "Margherita",
      "Marinara",
      "Diavola",
      "Funghi",
      "Prosciutto",
      "Quattro Formaggi",
    ]);
  });

  it("normalizes allowed pizza ids against the shared catalog", () => {
    expect(normalizePizzaCatalogIds([
      "margherita",
      "not-a-pizza",
      "diavola",
      "diavola",
      null,
    ])).toEqual(["margherita", "diavola"]);
  });

  it("validates event creation input and stores allowed pizza ids", () => {
    const result = validatePartyOrderInput({
      title: "Friday pizza party",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      guestNote: "Choose before Friday afternoon.",
      allowedPizzaIds: ["margherita", "diavola", "invalid"],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      title: "Friday pizza party",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-10T15:00:00.000Z",
      guest_note: "Choose before Friday afternoon.",
      allowed_pizza_ids: ["margherita", "diavola"],
    });
  });

  it("requires a title, event times, at least one pizza, and a valid close time", () => {
    expect(validatePartyOrderInput({
      title: "",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Event title is required." });

    expect(validatePartyOrderInput({
      title: "Party",
      pizzaDateTime: "",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Pizza date and time is required." });

    expect(validatePartyOrderInput({
      title: "Party",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "",
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Orders close date and time is required." });

    expect(validatePartyOrderInput({
      title: "Party",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      allowedPizzaIds: [],
    })).toMatchObject({ ok: false, error: "Choose at least one pizza option." });

    expect(validatePartyOrderInput({
      title: "Party",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T19:00:00.000Z",
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Orders must close before or at the pizza date and time." });

    expect(validatePartyOrderInput({
      title: "x".repeat(121),
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Event title must be 120 characters or fewer." });

    expect(validatePartyOrderInput({
      title: "Party",
      pizzaDateTime: "2026-07-10T18:00:00.000Z",
      ordersCloseAt: "2026-07-10T15:00:00.000Z",
      guestNote: "x".repeat(501),
      allowedPizzaIds: ["margherita"],
    })).toMatchObject({ ok: false, error: "Guest note must be 500 characters or fewer." });
  });

  it("normalizes event rows and resolves selected allowed pizzas", () => {
    const event = normalizePartyOrderRow({
      id: "event-1",
      user_id: "user-1",
      public_token: "secure-token",
      title: "Saturday party",
      pizza_datetime: "2026-07-11T18:00:00.000Z",
      orders_close_at: "2026-07-11T15:00:00.000Z",
      guest_note: "Bring appetite.",
      allowed_pizza_ids: ["funghi", "prosciutto", "not-real"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });

    expect(event).toBeTruthy();
    if (!event) return;
    expect(event.allowed_pizza_ids).toEqual(["funghi", "prosciutto"]);
    expect(partyOrderAllowedPizzaOptions(event).map((option) => option.name)).toEqual([
      "Funghi",
      "Prosciutto",
    ]);
  });

  it("normalizes public party order rows without owner-only fields", () => {
    const event = normalizePublicPartyOrder({
      id: "hidden-owner-row",
      user_id: "hidden-user",
      public_token: "public-token",
      title: "Guest pizza night",
      pizza_datetime: "2026-07-11T18:00:00.000Z",
      orders_close_at: "2026-07-11T15:00:00.000Z",
      guest_note: "Pick your pizza.",
      allowed_pizza_ids: ["margherita", "funghi", "not-real"],
      status: "open",
      updated_at: "2026-07-05T11:00:00.000Z",
    });

    expect(event).toEqual({
      public_token: "public-token",
      title: "Guest pizza night",
      pizza_datetime: "2026-07-11T18:00:00.000Z",
      orders_close_at: "2026-07-11T15:00:00.000Z",
      guest_note: "Pick your pizza.",
      allowed_pizza_ids: ["margherita", "funghi"],
      status: "open",
      updated_at: "2026-07-05T11:00:00.000Z",
    });
    expect(JSON.stringify(event)).not.toContain("hidden-user");
  });

  it("normalizes a private editable guest submission without exposing other guest data", () => {
    const editable = normalizePublicPartyOrderEditableSubmission({
      public_token: "public-token",
      title: "Guest pizza night",
      pizza_datetime: "2026-07-11T18:00:00.000Z",
      orders_close_at: "2026-07-11T15:00:00.000Z",
      guest_note: "Pick your pizza.",
      allowed_pizza_ids: ["margherita", "funghi"],
      status: "open",
      updated_at: "2026-07-05T11:00:00.000Z",
      submission_id: "submission-1",
      guest_name: "Mara",
      guest_comment: "No onions",
      submission_updated_at: "2026-07-05T12:00:00.000Z",
      items: [
        { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 2 },
        { pizza_id: "funghi", pizza_name_snapshot: "Funghi", quantity: 1 },
      ],
      other_guest_name: "Hidden",
    });

    expect(editable).toBeTruthy();
    if (!editable) return;
    expect(editable.event.public_token).toBe("public-token");
    expect(editable.submission).toMatchObject({
      id: "submission-1",
      guest_name: "Mara",
      guest_comment: "No onions",
      totalQuantity: 3,
      updated_at: "2026-07-05T12:00:00.000Z",
    });
    expect(editable.submission.items).toEqual([
      { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 2 },
      { pizza_id: "funghi", pizza_name_snapshot: "Funghi", quantity: 1 },
    ]);
    expect(JSON.stringify(editable)).not.toContain("Hidden");
  });

  const openPublicEvent = {
    public_token: "public-token",
    title: "Guest pizza night",
    pizza_datetime: "2026-07-11T18:00:00.000Z",
    orders_close_at: "2026-07-11T15:00:00.000Z",
    guest_note: "Pick your pizza.",
    allowed_pizza_ids: ["margherita", "funghi"],
    status: "open" as const,
    updated_at: "2026-07-05T11:00:00.000Z",
  };

  it("validates guest party order submissions", () => {
    const result = validatePublicPartyOrderSubmissionInput({
      guestName: "  Mara  ",
      guestComment: " No onions please. ",
      items: [
        { pizzaId: "margherita", quantity: 2 },
        { pizzaId: "funghi", quantity: 1 },
      ],
    }, openPublicEvent);

    expect(result).toMatchObject({
      ok: true,
      value: {
        guest_name: "Mara",
        guest_comment: "No onions please.",
        totalQuantity: 3,
        items: [
          { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 2 },
          { pizza_id: "funghi", pizza_name_snapshot: "Funghi", quantity: 1 },
        ],
      },
    });
  });

  it("rejects invalid guest party order submissions", () => {
    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "",
      items: [{ pizzaId: "margherita", quantity: 1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Your name is required." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "x".repeat(81),
      items: [{ pizzaId: "margherita", quantity: 1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Your name must be 80 characters or fewer." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      guestComment: "x".repeat(501),
      items: [{ pizzaId: "margherita", quantity: 1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Comments must be 500 characters or fewer." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Choose at least one pizza." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [{ pizzaId: "diavola", quantity: 1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Choose a pizza from this party menu." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [{ pizzaId: "not-real", quantity: 1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Choose a pizza from this party menu." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [{ pizzaId: "margherita", quantity: 0 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Choose at least one pizza." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [{ pizzaId: "margherita", quantity: -1 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Choose at least one pizza." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [{ pizzaId: "margherita", quantity: 11 }],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Please keep each pizza choice to 10 or fewer." });

    expect(validatePublicPartyOrderSubmissionInput({
      guestName: "Mara",
      items: [
        { pizzaId: "margherita", quantity: 10 },
        { pizzaId: "funghi", quantity: 11 },
      ],
    }, openPublicEvent)).toMatchObject({ ok: false, error: "Please keep each pizza choice to 10 or fewer." });
  });

  it("detects open and closed party order windows", () => {
    expect(isPartyOrderOpen(openPublicEvent, new Date("2026-07-11T14:00:00.000Z"))).toBe(true);
    expect(isPartyOrderOpen(openPublicEvent, new Date("2026-07-11T16:00:00.000Z"))).toBe(false);
    expect(isPartyOrderOpen({ ...openPublicEvent, status: "closed" }, new Date("2026-07-11T14:00:00.000Z"))).toBe(false);
  });

  it("summarizes owner close/reopen/archive status states and validates transitions", () => {
    const futureOrder = {
      orders_close_at: "2026-07-11T15:00:00.000Z",
      status: "open" as const,
    };
    const closedFutureOrder = { ...futureOrder, status: "closed" as const };
    const expiredOrder = {
      orders_close_at: "2026-07-11T15:00:00.000Z",
      status: "closed" as const,
    };
    const archivedFutureOrder = { ...futureOrder, status: "archived" as const };
    const nowBeforeDeadline = new Date("2026-07-11T14:00:00.000Z");
    const nowAfterDeadline = new Date("2026-07-11T16:00:00.000Z");

    expect(partyOrderOwnerStatusSummary(futureOrder, nowBeforeDeadline)).toMatchObject({
      label: "Orders open",
      canClose: true,
      canReopen: false,
      canArchive: true,
      canRestore: false,
    });
    expect(partyOrderOwnerStatusSummary(closedFutureOrder, nowBeforeDeadline)).toMatchObject({
      label: "Orders closed",
      canClose: false,
      canReopen: true,
      canArchive: true,
      canRestore: false,
    });
    expect(partyOrderOwnerStatusSummary(archivedFutureOrder, nowBeforeDeadline)).toMatchObject({
      label: "Archived",
      canClose: false,
      canReopen: false,
      canArchive: false,
      canRestore: true,
    });
    expect(partyOrderOwnerStatusSummary(expiredOrder, nowAfterDeadline)).toMatchObject({
      label: "Orders closed by deadline",
      canClose: false,
      canReopen: false,
      canArchive: true,
      canRestore: false,
    });
    expect(validatePartyOrderStatusUpdate({ status: "closed" }, futureOrder, nowBeforeDeadline)).toMatchObject({
      ok: true,
      value: { status: "closed" },
    });
    expect(validatePartyOrderStatusUpdate({ status: "open" }, closedFutureOrder, nowBeforeDeadline)).toMatchObject({
      ok: true,
      value: { status: "open" },
    });
    expect(validatePartyOrderStatusUpdate({ status: "archived" }, futureOrder, nowBeforeDeadline)).toMatchObject({
      ok: true,
      value: { status: "archived" },
    });
    expect(validatePartyOrderStatusUpdate({ status: "open" }, expiredOrder, nowAfterDeadline)).toMatchObject({
      ok: false,
      error: "Orders cannot be reopened after the deadline.",
    });
    expect(validatePartyOrderStatusUpdate({ status: "deleted" }, futureOrder, nowBeforeDeadline)).toMatchObject({
      ok: false,
      error: "Party Order status is invalid.",
    });
    expect(restorePartyOrderStatus(archivedFutureOrder, nowBeforeDeadline)).toBe("open");
    expect(restorePartyOrderStatus(archivedFutureOrder, nowAfterDeadline)).toBe("closed");
  });

  it("adds a secure owner-only party_orders persistence model", () => {
    const migration = source("supabase/migrations/20260705200000_create_party_orders.sql");
    expect(migration).toContain("create table if not exists public.party_orders");
    expect(migration).toContain("public_token text not null unique");
    expect(migration).toContain("allowed_pizza_ids text[] not null default '{}'");
    expect(migration).toContain("constraint party_orders_allowed_pizzas_check check (cardinality(allowed_pizza_ids) > 0)");
    expect(migration).toContain("constraint party_orders_close_before_pizza_check check (orders_close_at <= pizza_datetime)");
    expect(migration).toContain("alter table public.party_orders enable row level security");
    expect(migration).toContain("auth.uid() = user_id");

    const archiveMigration = source("supabase/migrations/20260706093000_allow_archived_party_orders.sql");
    expect(archiveMigration).toContain("drop constraint if exists party_orders_status_check");
    expect(archiveMigration).toContain("check (status in ('open', 'closed', 'archived'))");
  });

  it("adds a token-only public lookup function without relaxing table RLS", () => {
    const migration = source("supabase/migrations/20260705203000_create_public_party_order_lookup.sql");
    expect(migration).toContain("create or replace function public.get_public_party_order(token_value text)");
    expect(migration).toContain("security definer");
    expect(migration).toContain("where party_orders.public_token = token_value");
    expect(migration).toContain("grant execute on function public.get_public_party_order(text) to anon, authenticated");
    expect(migration).not.toContain("user_id");
    expect(migration).not.toContain("alter table public.party_orders disable row level security");
  });

  it("adds guest order tables, RLS, grants, owner reads, and a public submit RPC", () => {
    const migration = source("supabase/migrations/20260705210000_create_party_order_submissions.sql");
    expect(migration).toContain("create table if not exists public.party_order_submissions");
    expect(migration).toContain("create table if not exists public.party_order_items");
    expect(migration).toContain("party_order_id uuid not null references public.party_orders(id) on delete cascade");
    expect(migration).toContain("submission_id uuid not null references public.party_order_submissions(id) on delete cascade");
    expect(migration).toContain("constraint party_order_items_quantity_check check (quantity between 1 and 10)");
    expect(migration).toContain("alter table public.party_order_submissions enable row level security");
    expect(migration).toContain("alter table public.party_order_items enable row level security");
    expect(migration).toContain("grant usage on schema public to anon, authenticated");
    expect(migration).toContain("grant select, insert on public.party_order_submissions to anon, authenticated");
    expect(migration).toContain("grant select, insert on public.party_order_items to anon, authenticated");
    expect(migration).toContain("Owners can read their party order submissions");
    expect(migration).toContain("Owners can read their party order items");
    expect(migration).toContain("create or replace function public.submit_public_party_order");
    expect(migration).toContain("security definer");
    expect(migration).toContain("party_orders.public_token = token_value");
    expect(migration).toContain("party_orders.status = 'open'");
    expect(migration).toContain("party_orders.orders_close_at >= timezone('utc', now())");
    expect(migration).toContain("not (item.pizza_id = any(allowed_ids))");
    expect(migration).toContain("grant execute on function public.submit_public_party_order(text, text, text, jsonb) to anon, authenticated");

    const deleteMigration = source("supabase/migrations/20260707103000_allow_owner_delete_party_order_submissions.sql");
    expect(deleteMigration).toContain("grant delete on public.party_order_submissions to authenticated");
    expect(deleteMigration).toContain("Owners can delete their party order submissions");
    expect(deleteMigration).toContain("party_orders.user_id = auth.uid()");

    const editMigration = source("supabase/migrations/20260707110000_add_party_order_submission_edit_tokens.sql");
    expect(editMigration).toContain("add column if not exists edit_token text");
    expect(editMigration).toContain("set edit_token = encode(gen_random_bytes(24), 'hex')");
    expect(editMigration).toContain("party_order_submissions_edit_token_idx");
    expect(editMigration).toContain("drop function if exists public.submit_public_party_order(text, text, text, jsonb)");
    expect(editMigration).toContain("edit_token text");
    expect(editMigration).toContain("next_edit_token text := encode(gen_random_bytes(24), 'hex')");
    expect(editMigration).toContain("party_order_submissions.edit_token");
    expect(editMigration).toContain("create or replace function public.get_public_party_order_submission");
    expect(editMigration).toContain("party_order_submissions.edit_token = edit_token_value");
    expect(editMigration).toContain("create or replace function public.update_public_party_order_submission");
    expect(editMigration).toContain("party_orders.status = 'open'");
    expect(editMigration).toContain("party_orders.orders_close_at >= timezone('utc', now())");
    expect(editMigration).toContain("delete from public.party_order_items");
    expect(editMigration).toContain("grant execute on function public.get_public_party_order_submission(text, text) to anon, authenticated");
    expect(editMigration).toContain("grant execute on function public.update_public_party_order_submission(text, text, text, text, jsonb) to anon, authenticated");
  });

  it("wires authenticated list and create API routes with ownership filtering", () => {
    const route = source("app/api/party-orders/route.ts");
    expect(route).toContain("randomBytes(24).toString(\"base64url\")");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain(".from(\"party_orders\")");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain("validatePartyOrderInput(body)");
    expect(route).toContain("public_token: publicToken()");
    expect(route).toContain("status: \"open\"");
  });

  it("wires authenticated owner detail fetching by id and user", () => {
    const route = source("app/api/party-orders/[id]/route.ts");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain(".from(\"party_orders\")");
    expect(route).toContain(".eq(\"id\", id)");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain("maybeSingle()");
    expect(route).toContain(".from(\"party_order_submissions\")");
    expect(route).toContain(".from(\"party_order_items\")");
    expect(route).toContain("guest_comment");
    expect(route).toContain("pizza_name_snapshot");
    expect(route).toContain("summarizePartyOrderActivity(submissions, itemRows)");
    expect(route).toContain("export async function PATCH");
    expect(route).toContain("validatePartyOrderStatusUpdate(body, existing)");
    expect(route).toContain("restorePartyOrderStatus(existing)");
    expect(route).toContain("validatePartyOrderInput(body)");
    expect(route).toContain("title: validation.value.title");
    expect(route).toContain("pizza_datetime: validation.value.pizza_datetime");
    expect(route).toContain("orders_close_at: validation.value.orders_close_at");
    expect(route).toContain("guest_note: validation.value.guest_note");
    expect(route).toContain("allowed_pizza_ids: validation.value.allowed_pizza_ids");
    expect(route).toContain(".update(updateValues)");
    expect(route).toContain("validation.value.status === \"open\"");
    expect(route).toContain(": validation.value.status");
    expect(source("lib/party-orders.ts")).toContain("Orders cannot be reopened after the deadline.");
    expect(source("lib/party-orders.ts")).toContain("Archived party orders are hidden from the active list");
  });

  it("wires owner-only guest submission deletion without exposing public deletes", () => {
    const route = source("app/api/party-orders/[id]/submissions/[submissionId]/route.ts");
    const detail = source("components/account/PartyOrderDetail.tsx");
    const publicRoute = source("app/api/party-orders/public/[publicToken]/submissions/route.ts");
    const publicPage = source("app/order/[publicToken]/page.tsx");

    expect(route).toContain("export async function DELETE");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain(".from(\"party_orders\")");
    expect(route).toContain(".eq(\"id\", id)");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain(".from(\"party_order_submissions\")");
    expect(route).toContain(".eq(\"id\", submissionId)");
    expect(route).toContain(".eq(\"party_order_id\", event.id)");
    expect(route).toContain(".delete()");
    expect(route).toContain("Sign in to delete this guest order.");
    expect(route).toContain("Guest order could not be found.");

    expect(detail).toContain("Delete order");
    expect(detail).toContain("Delete this guest order?");
    expect(detail).toContain("This will remove the guest’s pizzas from the party summary. This cannot be undone.");
    expect(detail).toContain("Cancel");
    expect(detail).toContain("loadPartyOrderDetail(event.id)");
    expect(detail).toContain("setActivity(nextDetail.activity)");
    expect(detail).toContain("Guest order deleted.");

    expect(publicRoute).not.toContain("export async function DELETE");
    expect(publicPage).not.toContain("Delete order");
    expect(publicPage).not.toContain("party_order_submissions");
  });

  it("wires guest self-edit through private edit tokens", () => {
    const submitRoute = source("app/api/party-orders/public/[publicToken]/submissions/route.ts");
    const editRoute = source("app/api/party-orders/public/[publicToken]/submissions/[editToken]/route.ts");
    const editPage = source("app/order/[publicToken]/edit/[submissionToken]/page.tsx");
    const submitForm = source("components/party-orders/PublicPartyOrderForm.tsx");
    const editForm = source("components/party-orders/PublicPartyOrderEditForm.tsx");

    expect(submitRoute).toContain("edit_token");
    expect(submitRoute).toContain("editToken");
    expect(submitRoute).toContain("editPath: editToken ? `/order/${partyOrder.public_token}/edit/${editToken}` : undefined");

    expect(submitForm).toContain("Keep this private edit link if you need to change your order:");
    expect(submitForm).toContain("Copy edit link");
    expect(submitForm).toContain("navigator.clipboard.writeText(editLink)");

    expect(editRoute).toContain("export async function GET");
    expect(editRoute).toContain("export async function PATCH");
    expect(editRoute).toContain(".rpc(\"get_public_party_order_submission\"");
    expect(editRoute).toContain(".rpc(\"update_public_party_order_submission\"");
    expect(editRoute).toContain("normalizePublicPartyOrderEditableSubmission");
    expect(editRoute).toContain("isPartyOrderOpen(existing.event)");
    expect(editRoute).toContain("validatePublicPartyOrderSubmissionInput(body, existing.event)");
    expect(editRoute).toContain("Orders are closed for this party.");
    expect(editRoute).not.toContain("supabase.auth.getUser()");

    expect(editPage).toContain("params: Promise<{ publicToken: string; submissionToken: string }>");
    expect(editPage).toContain("get_public_party_order_submission");
    expect(editPage).toContain("PublicPartyOrderEditForm");
    expect(editPage).not.toContain("party_order_submissions");

    expect(editForm).toContain("Edit your pizza order");
    expect(editForm).toContain("Save changes");
    expect(editForm).toContain("Your pizza order was updated.");
    expect(editForm).toContain("Only the currently available party menu can be saved.");
    expect(editForm).toContain("Saving replaces your previous pizza quantities.");
    expect(editForm).toContain("method: \"PATCH\"");
    expect(editForm).toContain("disabled={saving || totalQuantity < 1}");
  });

  it("adds logged-in owner list, create, and detail pages", () => {
    expect(source("app/account/party-orders/page.tsx")).toContain("PartyOrdersList");
    expect(source("app/account/party-orders/page.tsx")).toContain("redirect(\"/account\")");
    expect(source("app/account/party-orders/new/page.tsx")).toContain("PartyOrderCreateForm");
    expect(source("app/account/party-orders/new/page.tsx")).toContain("redirect(\"/account\")");
    expect(source("app/account/party-orders/[id]/page.tsx")).toContain("PartyOrderDetail");
    expect(source("app/account/party-orders/[id]/page.tsx")).toContain("redirect(\"/account\")");
  });

  it("adds a signed-in Account page entry card for Party Orders discovery", () => {
    const accountPage = source("app/account/page.tsx");
    const card = source("components/account/PartyOrdersAccountEntryCard.tsx");

    expect(accountPage).toContain("PartyOrdersAccountEntryCard");
    expect(accountPage).toContain("<AccountActivePizzaSessionCard enabled={Boolean(user)} />");
    expect(accountPage).toContain("<PartyOrdersAccountEntryCard enabled={Boolean(user)} />");
    expect(card).toContain("if (!enabled) return null");
    expect(card).toContain("PIZZA PARTY ORDERS");
    expect(card).toContain("Collect pizza orders from guests");
    expect(card).toContain("Create a party order link, choose which DoughTools pizzas guests can order");
    expect(card).toContain("href=\"/account/party-orders\"");
    expect(card).toContain("Open Party Orders →");
    expect(card).toContain("href=\"/account/party-orders/new\"");
    expect(card).toContain("Create party order →");
  });

  it("renders the owner create form with event details and shared pizza options", () => {
    const form = source("components/account/PartyOrderCreateForm.tsx");
    expect(form).toContain("Event title");
    expect(form).toContain("Pizza date/time");
    expect(form).toContain("Orders close date/time");
    expect(form).toContain("Guest note / instructions");
    expect(form).toContain("Allowed pizzas");
    expect(form).toContain("PIZZA_CATALOG_OPTIONS.map");
    expect(form).toContain("fetch(\"/api/party-orders\"");
    expect(form).toContain("router.push(`/account/party-orders/${created.id}`)");
  });

  it("shows owner list cards and the future public share link shell", () => {
    const list = source("components/account/PartyOrdersList.tsx");
    expect(list).toContain("Party Orders");
    expect(list).toContain("Create party order");
    expect(list).toContain("fetch(\"/api/party-orders\")");
    expect(list).toContain("activeEvents");
    expect(list).toContain("archivedEvents");
    expect(list).toContain("Active Party Orders");
    expect(list).toContain("Archived Party Orders");
    expect(list).toContain("Restore");
    expect(list).toContain("Open");

    const detail = source("components/account/PartyOrderDetail.tsx");
    const editForm = source("components/account/PartyOrderSettingsEditForm.tsx");
    const invitation = source("components/account/PartyOrderInvitationCard.tsx");
    const prepSummary = source("components/account/PartyOrderPrepSummaryCard.tsx");
    expect(detail).toContain("Edit party details");
    expect(detail).toContain("PartyOrderSettingsEditForm");
    expect(detail).toContain("PartyOrderSessionHandoff");
    expect(detail).toContain("PartyOrderPrepSummaryCard");
    expect(editForm).toContain("Event title");
    expect(editForm).toContain("Pizza date/time");
    expect(editForm).toContain("Orders close date/time");
    expect(editForm).toContain("Guest note / invitation text");
    expect(editForm).toContain("Allowed pizzas");
    expect(editForm).toContain("PIZZA_CATALOG_OPTIONS.map");
    expect(editForm).toContain("Save changes");
    expect(editForm).toContain("Cancel");
    expect(editForm).toContain("fetch(`/api/party-orders/${event.id}`");
    expect(editForm).toContain("method: \"PATCH\"");
    expect(editForm).toContain("allowedPizzaIds");
    expect(detail).toContain("PartyOrderInvitationCard");
    expect(detail).toContain("/order/${event.public_token}");
    expect(invitation).toContain("Public guest link");
    expect(detail).toContain("Guest orders:");
    expect(detail).toContain("Total pizzas:");
    expect(detail).toContain("Order status");
    expect(detail).toContain("Close orders");
    expect(detail).toContain("Reopen orders");
    expect(detail).toContain("Archive party order");
    expect(detail).toContain("Restore party order");
    expect(detail).toContain("This Party Order is archived, so the public link is visible but not accepting guest orders.");
    expect(source("lib/party-orders.ts")).toContain("Orders closed by deadline");
    expect(detail).toContain("Pizza mix");
    expect(detail).toContain("Comment:");
    expect(detail).toContain("Share the public guest link to start collecting pizza choices.");
    expect(invitation).toContain("Guests can open this link to choose pizzas and send their order without signing in.");
    expect(detail).toContain("Selected allowed pizzas");
    expect(prepSummary).toContain("Prep summary");
    expect(prepSummary).toContain("Copy prep summary");
    expect(prepSummary).toContain("partyOrderPrepSummaryText(event, activity, shareLink)");
    expect(prepSummary).toContain("navigator.clipboard.writeText");
  });

  it("adds an owner-only Pizza Session handoff without mutating Party Orders", () => {
    const route = source("app/api/party-orders/[id]/session-handoff/route.ts");
    const handoff = source("components/account/PartyOrderSessionHandoff.tsx");
    const detail = source("components/account/PartyOrderDetail.tsx");

    expect(route).toContain("export async function POST");
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain(".from(\"party_orders\")");
    expect(route).toContain(".eq(\"id\", id)");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain(".from(\"party_order_submissions\")");
    expect(route).toContain(".from(\"party_order_items\")");
    expect(route).toContain("summarizePartyOrderActivity(submissions, itemRows)");
    expect(route).toContain("buildPartyOrderPizzaSessionHandoff(event, activity)");
    expect(route).toContain("Collect at least one guest order before creating a Pizza Session.");
    expect(route).not.toContain(".update(");

    expect(detail).toContain("<PartyOrderSessionHandoff event={event} activity={activity} />");
    expect(handoff).toContain("Plan production");
    expect(handoff).toContain("Create Pizza Session from this order");
    expect(handoff).toContain("Collect at least one guest order before creating a Pizza Session.");
    expect(handoff).toContain("Total pizzas:");
    expect(handoff).toContain("Pizza time:");
    expect(handoff).toContain("Review these older pizza names in the normal Pizza Session flow:");
    expect(handoff).toContain("fetch(`/api/party-orders/${event.id}/session-handoff`");
    expect(handoff).toContain("method: \"POST\"");
    expect(handoff).toContain("createAndSavePizzaSession");
    expect(handoff).toContain("targetEatTime: handoff.pizzaTime");
    expect(handoff).toContain("pizzaCount: handoff.pizzaCount");
    expect(handoff).toContain("pizzaMix: handoff.pizzaMix");
    expect(handoff).toContain("setActivePizzaSession(session.id)");
    expect(handoff).toContain("clearCloudBackedPizzaSession()");
    expect(handoff).toContain("router.push(\"/session/start\")");
  });

  it("builds plain-text invitation copy for WhatsApp and messages", () => {
    const event = normalizePartyOrderRow({
      id: "event-1",
      user_id: "user-1",
      public_token: "public-token",
      title: "Friday pizza party",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-09T20:00:00.000Z",
      guest_note: "Bring appetite.",
      allowed_pizza_ids: ["margherita"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });

    expect(event).toBeTruthy();
    if (!event) return;
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("You're invited to Friday pizza party 🍕");
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("Pizza time: Fri 10 Jul, 21:00");
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("Please order by: Thu 9 Jul, 23:00");
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("Bring appetite.");
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("Choose your pizza here:");
    expect(partyOrderInvitationText(event, "https://doughtools.app/order/public-token")).toContain("https://doughtools.app/order/public-token");
  });

  it("builds a kitchen-ready prep summary with totals, pizza mix, guest orders, comments, and link", () => {
    const event = normalizePartyOrderRow({
      id: "prep-summary-event",
      user_id: "user-1",
      public_token: "prep-summary-token",
      title: "Friday pizza party",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-09T20:00:00.000Z",
      guest_note: "Pick your pizza.",
      allowed_pizza_ids: ["margherita", "diavola", "marinara"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });
    const activity = summarizePartyOrderActivity([
      { id: "submission-1", guest_name: "Anna", guest_comment: "No mushrooms", created_at: "2026-07-05T12:00:00.000Z" },
      { id: "submission-2", guest_name: "Mikko", guest_comment: null, created_at: "2026-07-05T13:00:00.000Z" },
      { id: "submission-3", guest_name: "Laura", guest_comment: "Less cheese", created_at: "2026-07-05T14:00:00.000Z" },
    ], [
      { submission_id: "submission-1", pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { submission_id: "submission-1", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
      { submission_id: "submission-2", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 2 },
      { submission_id: "submission-3", pizza_id: "marinara", pizza_name_snapshot: "Marinara Snapshot", quantity: 1 },
    ]);

    expect(event).toBeTruthy();
    if (!event) return;
    const summary = partyOrderPrepSummaryText(
      event,
      activity,
      "https://doughtools.app/order/prep-summary-token",
      new Date("2026-07-09T18:00:00.000Z"),
    );

    expect(summary).toContain("Pizza Party: Friday pizza party");
    expect(summary).toContain("Pizza time:");
    expect(summary).toContain("Orders close:");
    expect(summary).toContain("Status:\nopen");
    expect(summary).toContain("- Guest orders: 3");
    expect(summary).toContain("- Pizzas: 5");
    expect(summary).toContain("Pizza mix:");
    expect(summary).toContain("- Margherita: 1");
    expect(summary).toContain("- Diavola: 3");
    expect(summary).toContain("- Marinara: 1");
    expect(summary).toContain("Guest orders:");
    expect(summary).toContain("- Laura: 1 × Marinara Snapshot");
    expect(summary).toContain("  Note: Less cheese");
    expect(summary).toContain("- Mikko: 2 × Diavola");
    expect(summary).toContain("- Anna: 1 × Margherita, 1 × Diavola");
    expect(summary).toContain("  Note: No mushrooms");
    expect(summary).toContain("Public guest link:");
    expect(summary).toContain("https://doughtools.app/order/prep-summary-token");
    expect(summary).not.toContain("user-1");
  });

  it("marks prep summaries as closed by deadline when the order window has passed", () => {
    const event = normalizePartyOrderRow({
      id: "prep-expired-event",
      user_id: "user-1",
      public_token: "prep-expired-token",
      title: "Expired pizza party",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-09T20:00:00.000Z",
      guest_note: null,
      allowed_pizza_ids: ["margherita"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });

    expect(event).toBeTruthy();
    if (!event) return;
    expect(partyOrderPrepSummaryText(
      event,
      summarizePartyOrderActivity([], []),
      undefined,
      new Date("2026-07-09T21:00:00.000Z"),
    )).toContain("Status:\nclosed by deadline");
  });

  it("keeps public and invitation surfaces bound to current Party Order fields", () => {
    const publicPage = source("app/order/[publicToken]/page.tsx");
    const invitation = source("components/account/PartyOrderInvitationCard.tsx");
    const detail = source("components/account/PartyOrderDetail.tsx");

    expect(publicPage).toContain("event.title");
    expect(publicPage).toContain("event.guest_note");
    expect(publicPage).toContain("partyOrderDateTimeLabel(event.pizza_datetime)");
    expect(publicPage).toContain("partyOrderDateTimeLabel(event.orders_close_at)");
    expect(publicPage).toContain("partyOrderAllowedPizzaOptions(event)");
    expect(publicPage).toContain("order.status === \"closed\" || order.status === \"archived\"");
    expect(publicPage).toContain("const token = publicToken.trim()");
    expect(publicPage).toContain("if (!token) return undefined");
    expect(publicPage).toContain("if (error) return undefined");
    expect(publicPage).toContain("} catch {");
    expect(publicPage).not.toContain("if (error) throw");
    expect(publicPage).not.toContain("party_order_submissions");
    expect(publicPage).not.toContain("Copy prep summary");
    expect(publicPage).not.toContain("Prep summary");
    expect(invitation).toContain("{event.title}");
    expect(invitation).toContain("event.guest_note");
    expect(invitation).toContain("partyOrderDateTimeLabel(event.pizza_datetime)");
    expect(invitation).toContain("partyOrderDateTimeLabel(event.orders_close_at)");
    expect(detail).toContain("setEvent(updatedEvent)");
  });

  it("renders a shareable invitation card with QR code, background image, and copy actions", () => {
    const invitation = source("components/account/PartyOrderInvitationCard.tsx");
    const exportHelper = source("lib/party-order-invitation-export.ts");

    expect(invitation).toContain("normalizePublicGuestUrl(shareLink)");
    expect(invitation).toContain("value.trim().replace(/\\s+/g, \"\")");
    expect(invitation).toContain("const publicGuestUrl = useMemo(() => normalizePublicGuestUrl(shareLink), [shareLink])");
    expect(invitation).toContain("QRCode.toDataURL(publicGuestUrl");
    expect(invitation).toContain("data-qr-url={publicGuestUrl}");
    expect(invitation).toContain("href={publicGuestUrl || \"#\"}");
    expect(invitation).toContain("copyText(publicGuestUrl, setCopyLinkState)");
    expect(invitation).toContain("QR code for public pizza order link");
    expect(invitation).toContain("DoughTools · Pizza Party");
    expect(invitation).toContain("Pizza time:");
    expect(invitation).toContain("Order by:");
    expect(invitation).toContain("Scan to choose your pizza");
    expect(invitation).toContain("Open the menu, pick your pizzas, and send your order.");
    expect(invitation).toContain("displayShareLink(publicGuestUrl)");
    expect(invitation).not.toContain("QRCode.toDataURL(displayedShareLink");
    expect(invitation).not.toContain("data-qr-url={displayedShareLink}");
    expect(invitation).not.toContain("copyText(displayedShareLink");
    expect(invitation).toContain("data-invitation-lower-layout=\"separate\"");
    expect(invitation).toContain("data-invitation-lower-panel=\"true\"");
    expect(invitation).toContain("Public guest link");
    expect(invitation).toContain("Copy link");
    expect(invitation).toContain("Copy invitation text");
    expect(invitation).toContain("partyOrderInvitationText(event, publicGuestUrl)");
    expect(invitation).toContain("navigator.clipboard.writeText");
    expect(invitation).toContain("PartyOrderInvitationExportCard");
    expect(invitation).toContain("Download invitation image");
    expect(invitation).toContain("Download invitation PDF");
    expect(invitation).toContain("downloadPartyOrderInvitationImage(exportCardRef.current)");
    expect(invitation).toContain("downloadPartyOrderInvitationPdf(exportCardRef.current)");
    expect(invitation).toContain("/images/homepage/hero-desktop-bg.png");
    expect(invitation).toContain("linear-gradient");
    expect(invitation).toContain("bg-[#fff8f1]");
    expect(invitation).toContain("data-qr-container=\"true\"");
    expect(invitation).toContain("relative z-10 rounded-[34px]");
    expect(invitation).toContain("relative z-10 rounded-[1.35rem]");
    expect(invitation).not.toContain("shadow-[0_30px_100px_rgba(0,0,0,.26)]");
    expect(invitation).toContain("margin: 4");
    expect(invitation).toContain("width: 640");
    expect(invitation).toContain("imageRendering: \"pixelated\"");
    expect(invitation).toContain("Guests can open this link to choose pizzas and send their order without signing in.");
    expect(exportHelper).toContain("INVITATION_EXPORT_WIDTH = 1080");
    expect(exportHelper).toContain("INVITATION_EXPORT_HEIGHT = 1350");
    expect(exportHelper).toContain("toPng(element");
    expect(exportHelper).toContain("doughtools-party-invitation.png");
    expect(exportHelper).toContain("toJpeg(element");
    expect(exportHelper).toContain("%PDF-1.4");
    expect(exportHelper).toContain("doughtools-party-invitation.pdf");
  });

  it("summarizes owner party orders by pizza type and guest order details", () => {
    const activity = summarizePartyOrderActivity([
      { id: "submission-1", guest_name: "Anna", guest_comment: "No mushrooms", created_at: "2026-07-05T12:00:00.000Z" },
      { id: "submission-2", guest_name: "Mikko", guest_comment: null, created_at: "2026-07-05T13:00:00.000Z" },
      { id: "submission-3", guest_name: "Laura", guest_comment: "Less cheese if possible", created_at: "2026-07-05T14:00:00.000Z" },
    ], [
      { submission_id: "submission-1", pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { submission_id: "submission-1", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
      { submission_id: "submission-2", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 2 },
      { submission_id: "submission-3", pizza_id: "quattro-formaggi", pizza_name_snapshot: "Four Cheese Snapshot", quantity: 1 },
      { submission_id: "submission-3", pizza_id: "old-special", pizza_name_snapshot: "Old Special", quantity: 2 },
    ]);

    expect(activity.submissionCount).toBe(3);
    expect(activity.totalPizzaCount).toBe(7);
    expect(activity.pizzaMix).toEqual([
      { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 3 },
      { pizza_id: "quattro-formaggi", pizza_name_snapshot: "Quattro Formaggi", quantity: 1 },
      { pizza_id: "old-special", pizza_name_snapshot: "Old Special", quantity: 2 },
    ]);
    expect(activity.guestOrders.map((order) => order.guest_name)).toEqual(["Laura", "Mikko", "Anna"]);
    expect(activity.guestOrders[0]).toMatchObject({
      guest_name: "Laura",
      guest_comment: "Less cheese if possible",
      totalQuantity: 3,
    });
    expect(activity.guestOrders[2].items).toEqual([
      { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
    ]);
  });

  it("updates party order summaries when a guest submission is removed", () => {
    const remainingActivity = summarizePartyOrderActivity([
      { id: "submission-1", guest_name: "Anna", guest_comment: "No mushrooms", created_at: "2026-07-05T12:00:00.000Z" },
      { id: "submission-3", guest_name: "Laura", guest_comment: "Less cheese if possible", created_at: "2026-07-05T14:00:00.000Z" },
    ], [
      { submission_id: "submission-1", pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { submission_id: "submission-1", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
      { submission_id: "submission-3", pizza_id: "quattro-formaggi", pizza_name_snapshot: "Four Cheese Snapshot", quantity: 1 },
    ]);

    expect(remainingActivity.submissionCount).toBe(2);
    expect(remainingActivity.totalPizzaCount).toBe(3);
    expect(remainingActivity.pizzaMix).toEqual([
      { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 1 },
      { pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
      { pizza_id: "quattro-formaggi", pizza_name_snapshot: "Quattro Formaggi", quantity: 1 },
    ]);
    expect(remainingActivity.guestOrders.map((order) => order.guest_name)).toEqual(["Laura", "Anna"]);
  });

  it("shows empty summaries and disables handoff when the last guest submission is removed", () => {
    const event = normalizePartyOrderRow({
      id: "event-empty-after-delete",
      user_id: "user-1",
      public_token: "empty-after-delete-token",
      title: "Friday production",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-10T15:00:00.000Z",
      guest_note: null,
      allowed_pizza_ids: ["margherita"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });
    const emptyActivity = summarizePartyOrderActivity([], []);

    expect(emptyActivity.submissionCount).toBe(0);
    expect(emptyActivity.totalPizzaCount).toBe(0);
    expect(emptyActivity.pizzaMix).toEqual([]);
    expect(emptyActivity.guestOrders).toEqual([]);
    expect(event).toBeTruthy();
    if (!event) return;
    expect(buildPartyOrderPizzaSessionHandoff(event, emptyActivity)).toBeUndefined();
    expect(partyOrderPrepSummaryText(event, emptyActivity)).toContain("- No guest orders yet.");
  });

  it("builds a Pizza Session handoff from Party Order pizza time, total count, and supported pizza mix", () => {
    const event = normalizePartyOrderRow({
      id: "event-handoff",
      user_id: "user-1",
      public_token: "handoff-token",
      title: "Friday production",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-10T15:00:00.000Z",
      guest_note: null,
      allowed_pizza_ids: ["margherita", "diavola", "quattro-formaggi"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });
    const activity = summarizePartyOrderActivity([
      { id: "submission-1", guest_name: "Anna", guest_comment: null, created_at: "2026-07-05T12:00:00.000Z" },
      { id: "submission-2", guest_name: "Mikko", guest_comment: null, created_at: "2026-07-05T13:00:00.000Z" },
    ], [
      { submission_id: "submission-1", pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 2 },
      { submission_id: "submission-1", pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
      { submission_id: "submission-2", pizza_id: "quattro-formaggi", pizza_name_snapshot: "Four Cheese Snapshot", quantity: 2 },
      { submission_id: "submission-2", pizza_id: "old-party-special", pizza_name_snapshot: "Old Party Special", quantity: 1 },
    ]);

    expect(event).toBeTruthy();
    if (!event) return;
    expect(buildPartyOrderPizzaSessionHandoff(event, activity)).toEqual({
      partyOrderId: "event-handoff",
      title: "Friday production",
      pizzaTime: "2026-07-10T18:00:00.000Z",
      pizzaCount: 6,
      pizzaMix: {
        margherita: 2,
        diavola: 1,
        "quattro-formaggi": 2,
      },
      pizzaMixRows: [
        { pizza_id: "margherita", pizza_name_snapshot: "Margherita", quantity: 2 },
        { pizza_id: "diavola", pizza_name_snapshot: "Diavola", quantity: 1 },
        { pizza_id: "quattro-formaggi", pizza_name_snapshot: "Quattro Formaggi", quantity: 2 },
      ],
      skippedPizzaNames: ["Old Party Special"],
    });
  });

  it("does not build a Pizza Session handoff before guest orders exist", () => {
    const event = normalizePartyOrderRow({
      id: "event-empty-handoff",
      user_id: "user-1",
      public_token: "empty-handoff-token",
      title: "Friday production",
      pizza_datetime: "2026-07-10T18:00:00.000Z",
      orders_close_at: "2026-07-10T15:00:00.000Z",
      guest_note: null,
      allowed_pizza_ids: ["margherita"],
      status: "open",
      created_at: "2026-07-05T10:00:00.000Z",
      updated_at: "2026-07-05T11:00:00.000Z",
    });

    expect(event).toBeTruthy();
    if (!event) return;
    expect(buildPartyOrderPizzaSessionHandoff(event, summarizePartyOrderActivity([], []))).toBeUndefined();
  });

  it("adds a public guest order route by token with an order form", () => {
    const page = source("app/order/[publicToken]/page.tsx");
    expect(page).toContain("params: Promise<{ publicToken: string }>");
    expect(page).toContain(".rpc(\"get_public_party_order\", { token_value: token })");
    expect(page).toContain("normalizePublicPartyOrder(data)");
    expect(page).toContain("DoughTools Party Order");
    expect(page).toContain("Choose from these pizzas");
    expect(page).toContain("partyOrderAllowedPizzaOptions(event)");
    expect(page).toContain("PublicPartyOrderForm");
    expect(page).not.toContain("supabase.auth.getUser()");
    expect(page).not.toContain("Guest orders");
    expect(page).not.toContain("party_order_submissions");

    const form = source("components/party-orders/PublicPartyOrderForm.tsx");
    expect(form).toContain("Your name");
    expect(form).toContain("Choose your pizzas");
    expect(form).toContain("Comments");
    expect(form).toContain("Send order");
    expect(form).toContain("Thanks, your pizza order was received.");
    expect(form).toContain("Remove one");
    expect(form).toContain("Add one");
    expect(form).toContain("disabled={quantity === 0}");
    expect(form).toContain("disabled={quantity >= MAX_QUANTITY_PER_PIZZA}");
    expect(form).toContain("Orders are closed");
    expect(form).not.toContain("supabase.auth.getUser()");
  });

  it("wires public guest submission through server-side validation and RPC", () => {
    const route = source("app/api/party-orders/public/[publicToken]/submissions/route.ts");
    expect(route).toContain(".rpc(\"get_public_party_order\", { token_value: publicToken })");
    expect(route).toContain("isPartyOrderOpen(partyOrder)");
    expect(route).toContain("validatePublicPartyOrderSubmissionInput(body, partyOrder)");
    expect(route).toContain(".rpc(\"submit_public_party_order\"");
    expect(route).toContain("guest_name_value: validation.value.guest_name");
    expect(route).toContain("items_value: validation.value.items");
    expect(route).not.toContain("supabase.auth.getUser()");
    expect(route).not.toContain(".from(\"party_order_submissions\").select");
  });
});
