import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PIZZA_CATALOG_IDS,
  PIZZA_CATALOG_OPTIONS,
  normalizePizzaCatalogIds,
} from "@/lib/pizza-catalog";
import {
  normalizePublicPartyOrder,
  normalizePartyOrderRow,
  isPartyOrderOpen,
  partyOrderAllowedPizzaOptions,
  partyOrderInvitationText,
  summarizePartyOrderActivity,
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

  it("adds a secure owner-only party_orders persistence model", () => {
    const migration = source("supabase/migrations/20260705200000_create_party_orders.sql");
    expect(migration).toContain("create table if not exists public.party_orders");
    expect(migration).toContain("public_token text not null unique");
    expect(migration).toContain("allowed_pizza_ids text[] not null default '{}'");
    expect(migration).toContain("constraint party_orders_allowed_pizzas_check check (cardinality(allowed_pizza_ids) > 0)");
    expect(migration).toContain("constraint party_orders_close_before_pizza_check check (orders_close_at <= pizza_datetime)");
    expect(migration).toContain("alter table public.party_orders enable row level security");
    expect(migration).toContain("auth.uid() = user_id");
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
    expect(list).toContain("Open");

    const detail = source("components/account/PartyOrderDetail.tsx");
    const invitation = source("components/account/PartyOrderInvitationCard.tsx");
    expect(detail).toContain("PartyOrderInvitationCard");
    expect(detail).toContain("/order/${event.public_token}");
    expect(invitation).toContain("Public guest link");
    expect(detail).toContain("Guest orders:");
    expect(detail).toContain("Total pizzas:");
    expect(detail).toContain("Pizza mix");
    expect(detail).toContain("Comment:");
    expect(detail).toContain("Share the public guest link to start collecting pizza choices.");
    expect(invitation).toContain("Guests can open this link to choose pizzas and send their order without signing in.");
    expect(detail).toContain("Selected allowed pizzas");
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

  it("renders a shareable invitation card with QR code, background image, and copy actions", () => {
    const invitation = source("components/account/PartyOrderInvitationCard.tsx");

    expect(invitation).toContain("QRCode.toDataURL(shareLink");
    expect(invitation).toContain("data-qr-url={shareLink}");
    expect(invitation).toContain("QR code for public pizza order link");
    expect(invitation).toContain("DoughTools · Pizza Party");
    expect(invitation).toContain("Pizza time:");
    expect(invitation).toContain("Order by:");
    expect(invitation).toContain("Scan to choose");
    expect(invitation).toContain("Public guest link");
    expect(invitation).toContain("Copy link");
    expect(invitation).toContain("Copy invitation text");
    expect(invitation).toContain("partyOrderInvitationText(event, shareLink)");
    expect(invitation).toContain("navigator.clipboard.writeText");
    expect(invitation).toContain("/images/homepage/hero-desktop-bg.png");
    expect(invitation).toContain("linear-gradient");
    expect(invitation).toContain("Guests can open this link to choose pizzas and send their order without signing in.");
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

  it("adds a public guest order route by token with an order form", () => {
    const page = source("app/order/[publicToken]/page.tsx");
    expect(page).toContain("params: Promise<{ publicToken: string }>");
    expect(page).toContain(".rpc(\"get_public_party_order\", { token_value: publicToken })");
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
