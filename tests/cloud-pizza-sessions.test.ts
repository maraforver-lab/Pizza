import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  clearCloudBackedPizzaSession,
  CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY,
  isCloudBackedPizzaSession,
  markCloudBackedPizzaSession,
} from "@/lib/cloud-pizza-session-client";
import {
  cloudPizzaSessionDoughSummary,
  cloudPizzaSessionPayload,
  cloudPizzaSessionSummary,
  cloudPizzaSessionUpdatedLabel,
  normalizeCloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { createPizzaSession } from "@/lib/pizza-session";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("cloud pizza session foundation", () => {
  it("builds an in-progress cloud payload from the active local session shape", () => {
    const session = createPizzaSession({
      id: "cloud-save-session",
      currentStep: "shopping",
      status: "planning",
      pizzaCount: 6,
      doughBallWeight: 260,
      targetEatTime: "2026-07-04T20:00:00.000Z",
    });

    expect(cloudPizzaSessionPayload(session)).toMatchObject({
      status: "in_progress",
      title: "Active pizza session",
      current_step: "shopping",
      session_data: session,
    });
    expect(cloudPizzaSessionDoughSummary(session)).toBe("6 dough balls · 260 g each");
  });

  it("summarizes saved in-progress sessions with graceful fallbacks", () => {
    const incomplete = createPizzaSession({ id: "incomplete-cloud-session" }, new Date("2026-07-04T09:00:00.000Z"));
    const row = normalizeCloudPizzaSessionRow({
      id: "row-1",
      user_id: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      current_step: "style",
      session_data: incomplete,
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: null,
    });

    expect(row).toBeTruthy();
    expect(cloudPizzaSessionSummary(row!, new Date("2026-07-04T12:00:00.000Z"))).toMatchObject({
      title: "Active pizza session",
      statusLine: "In progress · Updated today",
      doughLine: "Dough plan not complete",
      bakeLine: "Bake time: Bake time not set",
      stepLine: "Current step: Setup",
    });
    expect(cloudPizzaSessionUpdatedLabel("2026-07-03T10:00:00.000Z", new Date("2026-07-04T12:00:00.000Z"))).toContain("Updated");
  });

  it("adds a pizza_sessions table with owner-only RLS policies", () => {
    const migration = source("supabase/migrations/20260704183000_create_pizza_sessions.sql");

    expect(migration).toContain("create table if not exists public.pizza_sessions");
    expect(migration).toContain("user_id uuid not null references auth.users(id) on delete cascade");
    expect(migration).toContain("status text not null default 'in_progress'");
    expect(migration).toContain("session_data jsonb not null");
    expect(migration).toContain("alter table public.pizza_sessions enable row level security");
    expect(migration).toContain("auth.uid() = user_id");
  });

  it("uses the signed-in Supabase user for save and fetch API access", () => {
    const route = source("app/api/pizza-sessions/active/route.ts");

    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("status\", \"in_progress\"");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain("migratePizzaSession(record.sessionData ?? record.session_data)");
    expect(route).toContain(".insert({ ...payload, user_id: user.id");
    expect(route).toContain(".update({ ...payload, updated_at: updatedAt })");
    expect(route).toContain("normalizeCloudPizzaSessionRow(data)");
  });

  it("syncs saved cloud sessions without creating cloud rows for local-only sessions", () => {
    const route = source("app/api/pizza-sessions/active/route.ts");

    expect(route).toContain("export async function PATCH");
    expect(route).toContain('record.complete === true || record.status === "completed"');
    expect(route).toContain("if (!existing?.id) return NextResponse.json({ session: null, skipped: true })");
    expect(route).toContain("completed_at: shouldComplete ? updatedAt : null");
    expect(route).toContain("status: shouldComplete ? \"completed\" : \"in_progress\"");
    expect(route).not.toMatch(/export async function PATCH[\s\S]*\.insert/);
  });

  it("tracks cloud-backed local sessions separately from unrelated storage", () => {
    const storage = new MemoryStorage();
    const session = createPizzaSession({ id: "cloud-backed-local", currentStep: "recipe" });
    storage.setItem("unrelated-key", "untouched");

    expect(isCloudBackedPizzaSession(session, storage)).toBe(false);
    markCloudBackedPizzaSession(session.id, storage);
    expect(storage.getItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY)).toBe(session.id);
    expect(isCloudBackedPizzaSession(session, storage)).toBe(true);
    expect(isCloudBackedPizzaSession(createPizzaSession({ id: "different-session" }), storage)).toBe(false);
    clearCloudBackedPizzaSession(storage);
    expect(isCloudBackedPizzaSession(session, storage)).toBe(false);
    expect(storage.getItem("unrelated-key")).toBe("untouched");
  });

  it("does not treat completed cloud sessions as active account sessions", () => {
    const completed = normalizeCloudPizzaSessionRow({
      id: "row-completed",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({ id: "completed-cloud", currentStep: "review", status: "completed" }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    });

    expect(completed).toBeUndefined();
  });

  it("renders account save UI on Dough Plan without changing calculations", () => {
    const recipePage = source("app/session/recipe/page.tsx");
    const saveComponent = source("components/session/SavePizzaSessionToAccount.tsx");

    expect(recipePage).toContain("SavePizzaSessionToAccount");
    expect(recipePage).toContain("<SavePizzaSessionToAccount session={session} />");
    expect(saveComponent).toContain("Save to account");
    expect(saveComponent).toContain("Saved to your account");
    expect(saveComponent).toContain("Sign in to save this session across devices.");
    expect(saveComponent).toContain('fetch("/api/pizza-sessions/active"');
    expect(saveComponent).toContain("markCloudBackedPizzaSession(session.id)");
  });

  it("shows a cloud Active Pizza Session card without breaking local continuation", () => {
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");
    const restore = source("lib/cloud-pizza-session-restore.ts");

    expect(continueCard).toContain("const localSession = getActivePizzaSession() ?? null");
    expect(continueCard).toContain("if (localSession)");
    expect(continueCard).toContain("fetch(\"/api/pizza-sessions/active\"");
    expect(continueCard).toContain("Active pizza session");
    expect(continueCard).toContain("summary.statusLine");
    expect(continueCard).toContain("Continue Pizza Session");
    expect(continueCard).toContain("restoreCloudPizzaSessionToLocal(cloudSession)");
    expect(restore).toContain("savePizzaSession(session)");
    expect(restore).toContain("setActivePizzaSession(restored.id)");
    expect(restore).toContain("markCloudBackedPizzaSession(restored.id)");
    expect(continueCard).toContain("router.push(pizzaSessionContinueHref(restored))");
  });

  it("syncs cloud-backed sessions from the major Pizza Session step pages", () => {
    const syncComponent = source("components/session/CloudPizzaSessionSync.tsx");
    const recipePage = source("app/session/recipe/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const timelinePage = source("app/session/timeline/page.tsx");
    const kitchenPage = source("app/session/kitchen/page.tsx");
    const reviewPage = source("app/session/review/page.tsx");

    expect(syncComponent).toContain("syncCloudBackedPizzaSession(session)");
    expect(syncComponent).toContain("lastSyncedKey");
    [recipePage, shoppingPage, timelinePage, kitchenPage, reviewPage].forEach((page) => {
      expect(page).toContain("CloudPizzaSessionSync");
      expect(page).toContain("<CloudPizzaSessionSync session={session} />");
    });
    expect(reviewPage).toContain("completeCloudBackedPizzaSession(completed)");
  });

  it("shows saved active sessions on the Account page with an empty state", () => {
    const accountPage = source("app/account/page.tsx");
    const accountCard = source("components/account/AccountActivePizzaSessionCard.tsx");

    expect(accountPage).toContain("AccountActivePizzaSessionCard");
    expect(accountPage).toContain("<AccountActivePizzaSessionCard enabled={Boolean(user)} />");
    expect(accountCard).toContain("fetch(\"/api/pizza-sessions/active\"");
    expect(accountCard).toContain("summary.title");
    expect(accountCard).toContain("summary.statusLine");
    expect(accountCard).toContain("summary.doughLine");
    expect(accountCard).toContain("summary.bakeLine");
    expect(accountCard).toContain("summary.stepLine");
    expect(accountCard).toContain("Continue Pizza Session");
    expect(accountCard).toContain("restoreCloudPizzaSessionToLocal(cloudSession)");
    expect(accountCard).toContain("router.push(pizzaSessionContinueHref(restored))");
    expect(accountCard).toContain("No active pizza session");
    expect(accountCard).toContain("Start a new Pizza Session and save it to your account to continue later.");
    expect(accountCard).toContain("Start Pizza Session");
    expect(accountCard).toContain('href="/session/start"');
    expect(accountCard).toContain("if (!enabled) return null");
  });
});
