import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  cloudBackedPizzaSessionRowId,
  clearCloudBackedPizzaSession,
  CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY,
  completeCloudBackedPizzaSession,
  isCloudBackedPizzaSession,
  markCloudBackedPizzaSession,
  syncCloudBackedPizzaSession,
} from "@/lib/cloud-pizza-session-client";
import {
  cloudPizzaSessionCompletedLabel,
  cloudPizzaSessionDoughSummary,
  cloudPizzaSessionHistorySummary,
  cloudPizzaSessionPayload,
  cloudPizzaSessionSummary,
  cloudPizzaSessionUpdatedLabel,
  normalizeCloudPizzaSessionHistoryRow,
  normalizeCloudPizzaSessionRow,
  sortCloudPizzaSessionHistoryRows,
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

  it("normalizes active API session rows without completed-history parsing assumptions", () => {
    const activeSession = createPizzaSession({
      id: "active-normalized-cloud-session",
      status: "planning",
      currentStep: "shopping",
      pizzaCount: 6,
      doughBallWeight: 260,
      targetEatTime: "2026-07-04T17:00:00.000Z",
      recipeSnapshot: {
        balls: 6,
        ballWeight: 260,
        hydration: 65,
        fermentation: "12h-room",
      },
    });

    const active = normalizeCloudPizzaSessionRow({
      id: "active-row",
      userId: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      currentStep: "shopping",
      sessionData: activeSession,
      createdAt: "2026-07-04T09:00:00.000Z",
      updatedAt: "2026-07-04T10:00:00.000Z",
      completedAt: null,
    });
    const completed = normalizeCloudPizzaSessionHistoryRow({
      id: "active-row",
      userId: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      currentStep: "shopping",
      sessionData: activeSession,
      createdAt: "2026-07-04T09:00:00.000Z",
      updatedAt: "2026-07-04T10:00:00.000Z",
      completedAt: null,
    });

    expect(active).toBeTruthy();
    expect(completed).toBeUndefined();
    expect(cloudPizzaSessionSummary(active!, new Date("2026-07-04T12:00:00.000Z"))).toMatchObject({
      title: "Active pizza session",
      statusLine: "In progress · Updated today",
      doughLine: "6 dough balls · 260 g each",
      bakeLine: "Bake time: Saturday 20:00",
      stepLine: "Current step: Shopping list",
    });
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
    expect(route).toContain("Saved pizza session could not be verified.");
  });

  it("syncs saved cloud sessions without creating cloud rows for local-only sessions", () => {
    const route = source("app/api/pizza-sessions/active/route.ts");

    expect(route).toContain("export async function PATCH");
    expect(route).toContain("requestedCloudSessionId");
    expect(route).toContain("record.cloudSessionId ?? record.cloud_session_id");
    expect(route).toContain(".eq(\"id\", requestedCloudSessionId)");
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
    markCloudBackedPizzaSession(session.id, "cloud-row-1", storage);
    expect(JSON.parse(storage.getItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY) ?? "{}")).toMatchObject({
      sessionId: session.id,
      cloudSessionId: "cloud-row-1",
    });
    expect(isCloudBackedPizzaSession(session, storage)).toBe(true);
    expect(cloudBackedPizzaSessionRowId(session, storage)).toBe("cloud-row-1");
    expect(isCloudBackedPizzaSession(createPizzaSession({ id: "different-session" }), storage)).toBe(false);
    clearCloudBackedPizzaSession(storage);
    expect(isCloudBackedPizzaSession(session, storage)).toBe(false);
    expect(storage.getItem("unrelated-key")).toBe("untouched");
  });

  it("keeps legacy cloud-backed local session markers readable", () => {
    const storage = new MemoryStorage();
    const session = createPizzaSession({ id: "legacy-cloud-backed-local", currentStep: "recipe" });

    storage.setItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY, session.id);

    expect(isCloudBackedPizzaSession(session, storage)).toBe(true);
    expect(cloudBackedPizzaSessionRowId(session, storage)).toBeUndefined();
  });

  it("does not treat completed cloud sessions as active account sessions", () => {
    const completedRow = {
      id: "row-completed",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "completed-cloud",
        currentStep: "review",
        status: "completed",
        pizzaCount: 6,
        doughBallWeight: 260,
        targetEatTime: "2026-07-04T17:00:00.000Z",
        plannedFermentationHours: 24,
        fermentationTemperatureCOverride: 4,
        rating: 5,
        notes: "Best batch so far.",
        review: {
          whatWorked: "Long preheat.",
          improveNextTime: "Try less salami.",
          nextTimeTry: "Bake one pizza hotter.",
          savedAt: "2026-07-04T09:45:00.000Z",
        },
        recipeSnapshot: { balls: 6, ballWeight: 260, hydration: 65, fermentation: "24h-cold" },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    };
    const completed = normalizeCloudPizzaSessionRow(completedRow);
    const history = normalizeCloudPizzaSessionHistoryRow(completedRow);

    expect(completed).toBeUndefined();
    expect(history).toBeTruthy();
    expect(cloudPizzaSessionHistorySummary(history!, new Date("2026-07-04T12:00:00.000Z"))).toMatchObject({
      title: "Completed pizza session",
      statusLine: "Completed today",
      doughLine: "6 dough balls · 260 g each",
      hydrationLine: "Hydration: 65%",
      fermentationLine: "Fermentation: 24h cold fermentation · fridge 4 °C",
      reviewLine: "Review: 5/5 · Notes saved",
      bakeLine: "Bake time: Saturday 20:00",
    });
    expect(cloudPizzaSessionCompletedLabel("2026-07-03T10:00:00.000Z", new Date("2026-07-04T12:00:00.000Z"))).toBe("Completed 3 Jul 2026");
  });

  it("uses the selected completed-session fermentation plan instead of stale recipe defaults", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-selected-fermentation",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "selected-fermentation-history",
        status: "completed",
        currentStep: "review",
        plannedFermentationHours: 48,
        fermentationTemperatureCOverride: 4,
        recipeSnapshot: {
          balls: 4,
          ballWeight: 260,
          hydration: 65,
          fermentation: "12h-room",
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const summary = cloudPizzaSessionHistorySummary(history, new Date("2026-07-04T12:00:00.000Z"));

    expect(summary.fermentationLine).toBe("Fermentation: 48h cold fermentation · fridge 4 °C");
    expect(summary.fermentationLine).not.toContain("12h room fermentation");
    expect(summary.hydrationLine).toBe("Hydration: 65%");
  });

  it("uses persisted timeline timing as completed-session fermentation display basis when no selected duration is stored", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-timeline-fermentation",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "timeline-fermentation-history",
        status: "completed",
        currentStep: "review",
        fermentationTemperatureCOverride: 5,
        targetEatTime: "2026-07-04T12:00:00.000Z",
        recipeSnapshot: {
          balls: 4,
          ballWeight: 260,
          hydration: 66,
          fermentation: "12h-room",
        },
        timeline: {
          targetEatTime: "2026-07-04T12:00:00.000Z",
          steps: [
            { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-02T20:00:00.000Z", status: "todo", kind: "active" },
            { id: "cold-ferment", label: "Cold ferment", scheduledAt: "2026-07-02T21:00:00.000Z", status: "todo", kind: "passive" },
            { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-04T12:00:00.000Z", status: "todo", kind: "active" },
          ],
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const summary = cloudPizzaSessionHistorySummary(history, new Date("2026-07-04T12:00:00.000Z"));

    expect(summary.fermentationLine).toBe("Fermentation: 40h cold fermentation · fridge 5 °C");
    expect(summary.fermentationLine).not.toContain("12h room fermentation");
  });

  it("summarizes completed review notes alongside rating only when meaningful notes exist", () => {
    const rowFor = (sessionData: ReturnType<typeof createPizzaSession>) => normalizeCloudPizzaSessionHistoryRow({
      id: sessionData.id,
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: sessionData,
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const ratingAndNotes = cloudPizzaSessionHistorySummary(rowFor(createPizzaSession({
      id: "review-rating-and-notes",
      status: "completed",
      currentStep: "review",
      rating: 3,
      review: { improveNextTime: "Dry mushrooms better." },
    })));
    const ratingOnly = cloudPizzaSessionHistorySummary(rowFor(createPizzaSession({
      id: "review-rating-only",
      status: "completed",
      currentStep: "review",
      rating: 3,
      notes: "   ",
      review: { whatWorked: "  " },
    })));
    const notesOnly = cloudPizzaSessionHistorySummary(rowFor(createPizzaSession({
      id: "review-notes-only",
      status: "completed",
      currentStep: "review",
      review: { nextTimeTry: "Use stronger flour." },
    })));
    const emptyNotes = cloudPizzaSessionHistorySummary(rowFor(createPizzaSession({
      id: "review-empty-notes",
      status: "completed",
      currentStep: "review",
      notes: "",
      review: { improveNextTime: " " },
    })));

    expect(ratingAndNotes.reviewLine).toBe("Review: 3/5 · Notes saved");
    expect(ratingOnly.reviewLine).toBe("Review: 3/5");
    expect(notesOnly.reviewLine).toBe("Review: Notes saved");
    expect(emptyNotes.reviewLine).toBeUndefined();
  });

  it("sends completed review data to the existing cloud session row", async () => {
    const storage = new MemoryStorage();
    const completed = createPizzaSession({
      id: "review-cloud-backed",
      status: "completed",
      currentStep: "review",
      rating: 4,
      notes: "Bottom was crisp.",
      review: {
        whatWorked: "Timing worked well.",
        improveNextTime: "Dry mushrooms better.",
        nextTimeTry: "Use a hotter oven.",
        savedAt: "2026-07-04T11:00:00.000Z",
      },
    });
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
    });
    markCloudBackedPizzaSession(completed.id, "cloud-row-review", storage);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => (
      new Response(JSON.stringify({ completed: true, session: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await completeCloudBackedPizzaSession(completed);
    } finally {
      globalThis.fetch = originalFetch;
      if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/pizza-sessions/active");
    expect(init?.method).toBe("PATCH");
    const body = JSON.parse(String(init?.body));
    expect(body.complete).toBe(true);
    expect(body.cloudSessionId).toBe("cloud-row-review");
    expect(body.sessionData).toMatchObject({
      id: completed.id,
      status: "completed",
      currentStep: "review",
      rating: 4,
      notes: "Bottom was crisp.",
      review: {
        whatWorked: "Timing worked well.",
        improveNextTime: "Dry mushrooms better.",
        nextTimeTry: "Use a hotter oven.",
        savedAt: "2026-07-04T11:00:00.000Z",
      },
    });
    expect(storage.getItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("does not create a cloud row when a local-only session completes review", async () => {
    const storage = new MemoryStorage();
    const completed = createPizzaSession({
      id: "review-local-only",
      status: "completed",
      currentStep: "review",
      rating: 5,
      notes: "Stayed local.",
    });
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
    });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    let result: unknown;
    try {
      result = await syncCloudBackedPizzaSession(completed, { complete: true });
    } finally {
      globalThis.fetch = originalFetch;
      if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    }

    expect(result).toEqual({ skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sorts completed cloud history newest first with updated_at fallback", () => {
    const older = normalizeCloudPizzaSessionHistoryRow({
      id: "older",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({ id: "older-session", status: "completed", currentStep: "review" }),
      created_at: "2026-07-01T10:00:00.000Z",
      updated_at: "2026-07-01T12:00:00.000Z",
      completed_at: "2026-07-01T12:00:00.000Z",
    })!;
    const newerWithFallback = normalizeCloudPizzaSessionHistoryRow({
      id: "newer",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({ id: "newer-session", status: "completed", currentStep: "review" }),
      created_at: "2026-07-02T10:00:00.000Z",
      updated_at: "2026-07-03T12:00:00.000Z",
      completed_at: null,
    })!;

    expect(sortCloudPizzaSessionHistoryRows([older, newerWithFallback]).map((row) => row.id)).toEqual(["newer", "older"]);
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
    expect(saveComponent).toContain("normalizeCloudPizzaSessionRow(payload.session)");
    expect(saveComponent).toContain("Saved pizza session could not be verified.");
    expect(saveComponent).toContain("markCloudBackedPizzaSession(session.id, savedSession.id)");
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
    expect(restore).toContain("markCloudBackedPizzaSession(restored.id, row.id)");
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

  it("shows completed Pizza Session history on the Account page", () => {
    const accountPage = source("app/account/page.tsx");
    const historyRoute = source("app/api/pizza-sessions/history/route.ts");
    const historyComponent = source("components/account/AccountPizzaSessionHistory.tsx");

    expect(accountPage).toContain("AccountPizzaSessionHistory");
    expect(accountPage).toContain("<AccountPizzaSessionHistory enabled={Boolean(user)} />");
    expect(historyRoute).toContain("supabase.auth.getUser()");
    expect(historyRoute).toContain(".eq(\"user_id\", user.id)");
    expect(historyRoute).toContain(".eq(\"status\", \"completed\")");
    expect(historyRoute).toContain("sortCloudPizzaSessionHistoryRows");
    expect(historyRoute).toContain("slice(0, 5)");
    expect(historyComponent).toContain("fetch(\"/api/pizza-sessions/history\"");
    expect(historyComponent).toContain("Pizza session history");
    expect(source("lib/cloud-pizza-sessions.ts")).toContain('title: "Completed pizza session"');
    expect(historyComponent).toContain("summary.doughLine");
    expect(historyComponent).toContain("summary.hydrationLine");
    expect(historyComponent).toContain("summary.fermentationLine");
    expect(historyComponent).toContain("summary.reviewLine");
    expect(historyComponent).toContain("summary.bakeLine");
    expect(historyComponent).toContain("No completed pizza sessions yet");
    expect(historyComponent).toContain("Finish a Pizza Session to save it here.");
    expect(historyComponent).toContain("if (!enabled) return null");
  });
});
