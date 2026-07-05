import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PIZZA_CATALOG_IDS,
  PIZZA_CATALOG_OPTIONS,
  normalizePizzaCatalogIds,
} from "@/lib/pizza-catalog";
import {
  normalizePartyOrderRow,
  partyOrderAllowedPizzaOptions,
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
  });

  it("adds logged-in owner list, create, and detail pages", () => {
    expect(source("app/account/party-orders/page.tsx")).toContain("PartyOrdersList");
    expect(source("app/account/party-orders/page.tsx")).toContain("redirect(\"/account\")");
    expect(source("app/account/party-orders/new/page.tsx")).toContain("PartyOrderCreateForm");
    expect(source("app/account/party-orders/new/page.tsx")).toContain("redirect(\"/account\")");
    expect(source("app/account/party-orders/[id]/page.tsx")).toContain("PartyOrderDetail");
    expect(source("app/account/party-orders/[id]/page.tsx")).toContain("redirect(\"/account\")");
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
    expect(detail).toContain("Future guest link");
    expect(detail).toContain("/order/${event.public_token}");
    expect(detail).toContain("Guest order collection will be added in the next patch");
    expect(detail).toContain("Selected allowed pizzas");
  });
});
