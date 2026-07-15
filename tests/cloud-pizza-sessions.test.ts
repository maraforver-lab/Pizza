import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  cloudBackedPizzaSessionRowId,
  clearCloudBackedActivePizzaSessionPointer,
  clearCloudBackedPizzaSession,
  CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY,
  completeCloudBackedPizzaSession,
  isCloudBackedPizzaSession,
  latestActivePizzaSessionForCloudSync,
  markCloudBackedPizzaSession,
  queueCloudActivePizzaSessionSave,
  syncCloudBackedPizzaSession,
} from "@/lib/cloud-pizza-session-client";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import {
  ACTIVE_PIZZA_SESSION_DEFAULT_TITLE,
  COMPLETED_PIZZA_SESSION_DEFAULT_TITLE,
  COMPLETED_PIZZA_SESSION_TITLE_MAX_LENGTH,
  cloudPizzaSessionCompletedLabel,
  completedPizzaSessionCustomTitle,
  completedPizzaSessionDisplayTitle,
  cloudPizzaSessionDetailSummary,
  cloudPizzaSessionDoughSummary,
  cloudPizzaSessionHistorySummary,
  cloudPizzaSessionPayload,
  cloudPizzaSessionSummary,
  cloudPizzaSessionUpdatedLabel,
  normalizeCloudPizzaSessionHistoryRow,
  normalizeCompletedPizzaSessionTitleInput,
  normalizeCloudPizzaSessionRow,
  sortCloudPizzaSessionHistoryRows,
} from "@/lib/cloud-pizza-sessions";
import {
  PIZZA_PHOTO_OVERLAY_FILE_NAME,
  PIZZA_PHOTO_OVERLAY_HEIGHT,
  PIZZA_PHOTO_OVERLAY_WIDTH,
  buildPizzaPhotoOverlayModel,
} from "@/lib/pizza-photo-overlay";
import {
  PIZZA_PHOTO_MODERATION_ERROR,
  PIZZA_PHOTO_MODERATION_MODEL,
  PIZZA_PHOTO_UNSAFE_ERROR,
  moderatePizzaPhotoImage,
} from "@/lib/pizza-photo-moderation";
import {
  PIZZA_PHOTO_RELEVANCE_CHECK_ERROR,
  PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD,
  PIZZA_PHOTO_RELEVANCE_ERROR,
  PIZZA_PHOTO_RELEVANCE_MODEL,
  validatePizzaPhotoRelevance,
} from "@/lib/pizza-photo-relevance";
import { createPizzaSession } from "@/lib/pizza-session";
import { getKitchenModeState } from "@/lib/pizza-session-kitchen";
import {
  getActivePizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import { EXPERIENCE_LEVEL_STORAGE_KEY } from "@/lib/experience-levels";
import {
  PIZZA_SESSION_PHOTO_HEIC_ERROR,
  PIZZA_SESSION_PHOTO_TYPE_ERROR,
  isUnsupportedHeicPizzaSessionPhoto,
  pizzaSessionPhotoTypeErrorFor,
} from "@/lib/pizza-session-photo";
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
      pizzaMenuLine: "Pizza menu: Pizza menu not ready",
      bakeLine: "Bake time: Bake time not set",
      stepLine: "Current step: Setup",
    });
    expect(cloudPizzaSessionUpdatedLabel("2026-07-03T10:00:00.000Z", new Date("2026-07-04T12:00:00.000Z"))).toContain("Updated");
  });

  it("summarizes the active-session pizza menu for the Account card", () => {
    const session = createPizzaSession({
      id: "active-account-menu-summary",
      currentStep: "shopping",
      pizzaCount: 4,
      pizzaMix: { margherita: 2, diavola: 2 },
      recipeSnapshot: { balls: 4, ballWeight: 260 },
    });
    const row = normalizeCloudPizzaSessionRow({
      id: "row-active-menu",
      user_id: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      current_step: "shopping",
      session_data: session,
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: null,
    })!;

    expect(cloudPizzaSessionSummary(row).pizzaMenuLine).toBe("Pizza menu: 2 Margherita · 2 Diavola");
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

  it("preserves the cloud-selected experience level when restoring an active cloud session locally", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "beginner");
    const cloudSession = createPizzaSession({
      id: "cloud-pizza-nerd-session",
      status: "planning",
      currentStep: "prep",
      experienceLevel: "pizza_nerd",
      pizzaCount: 4,
      doughBallWeight: 260,
      timeline: {
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    });
    const row = normalizeCloudPizzaSessionRow({
      id: "cloud-row-pizza-nerd",
      user_id: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      current_step: "prep",
      session_data: cloudSession,
      created_at: "2026-07-10T09:00:00.000Z",
      updated_at: "2026-07-10T10:00:00.000Z",
      completed_at: null,
    })!;

    const restored = restoreCloudPizzaSessionToLocal(row, storage);

    expect(restored?.experienceLevel).toBe("pizza_nerd");
    expect(getActivePizzaSession(storage)?.experienceLevel).toBe("pizza_nerd");
    expect(cloudBackedPizzaSessionRowId(restored, storage)).toBe("cloud-row-pizza-nerd");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("beginner");
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

  it("adds a private pizza session photos storage bucket with owner-only policies", () => {
    const migration = source("supabase/migrations/20260705113000_create_pizza_session_photos_bucket.sql");

    expect(migration).toContain("pizza-session-photos");
    expect(migration).toContain("public = false");
    expect(migration).toContain("file_size_limit = 5242880");
    expect(migration).toContain("array['image/jpeg', 'image/png', 'image/webp']");
    expect(migration).toContain("Users can read their own pizza session photos");
    expect(migration).toContain("Users can upload their own pizza session photos");
    expect(migration).toContain("Users can replace their own pizza session photos");
    expect(migration).toContain("Users can delete their own pizza session photos");
    expect(migration).toContain("auth.uid()::text = (storage.foldername(name))[1]");
  });

  it("uses the signed-in Supabase user for save and fetch API access", () => {
    const route = source("app/api/pizza-sessions/active/route.ts");
    const server = source("lib/supabase/server.ts");

    expect(route).toContain("getSupabaseRouteClient(request)");
    expect(server).toContain("getSupabaseBearerClient(request)");
    expect(server).toContain("Authorization: `Bearer ${token}`");
    expect(server).toContain("cookieClient.auth.getUser()");
    expect(server).toContain("bearerClient.auth.getUser()");
    expect(route).toContain("status\", \"in_progress\"");
    expect(route).toContain(".eq(\"user_id\", user.id)");
    expect(route).toContain("migratePizzaSession(record.sessionData ?? record.session_data)");
    expect(route).toContain(".insert({ ...payload, user_id: user.id");
    expect(route).toContain(".update({ ...payload, updated_at: updatedAt })");
    expect(route).toContain("normalizeCloudPizzaSessionRow(data)");
    expect(route).toContain("Saved pizza session could not be verified.");
    expect(route).toContain("export async function DELETE");
    expect(route).toContain("Sign in to delete this saved pizza session.");
    expect(route).toContain(".update({ status: \"archived\", updated_at: updatedAt })");
    expect(route).toContain(".eq(\"status\", \"in_progress\")");
    expect(route).toContain("return NextResponse.json({ archived: true");
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

  it("clears stale cloud-backed active pointers without removing unrelated local sessions", () => {
    const storage = new MemoryStorage();
    const cloudBacked = createPizzaSession({ id: "stale-cloud-backed-local", currentStep: "recipe" });
    const localOnly = createPizzaSession({ id: "local-only-session", currentStep: "shopping" });
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify([cloudBacked, localOnly]));
    setActivePizzaSession(cloudBacked.id, storage);
    markCloudBackedPizzaSession(cloudBacked.id, "missing-cloud-row", storage);

    clearCloudBackedActivePizzaSessionPointer(storage);

    expect(getActivePizzaSession(storage)).toBeUndefined();
    expect(isCloudBackedPizzaSession(cloudBacked, storage)).toBe(false);
    const savedSessions = JSON.parse(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY) ?? "[]") as Array<{ id: string; status: string }>;
    expect(savedSessions.find((session) => session.id === cloudBacked.id)?.status).toBe("archived");
    expect(savedSessions.find((session) => session.id === localOnly.id)?.status).toBe(localOnly.status);
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
        ovenType: "gas",
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
        recipeSnapshot: { balls: 6, ballWeight: 260, hydration: 65, fermentation: "24h-cold", oven: "gas" },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    };
    const completed = normalizeCloudPizzaSessionRow(completedRow);
    const history = normalizeCloudPizzaSessionHistoryRow(completedRow);
    const archived = normalizeCloudPizzaSessionHistoryRow({
      ...completedRow,
      id: "row-archived",
      status: "archived",
    });

    expect(completed).toBeUndefined();
    expect(history).toBeTruthy();
    expect(archived).toBeUndefined();
    expect(cloudPizzaSessionHistorySummary(history!, new Date("2026-07-04T12:00:00.000Z"))).toMatchObject({
      title: "Completed pizza session",
      statusLine: "Completed today",
      doughLine: "6 dough balls · 260 g each",
      hydrationLine: "Hydration: 65%",
      fermentationLine: "Fermentation: 24h cold fermentation · fridge 4 °C",
      reviewLine: "Review: 5/5 · Notes saved",
      bakeLine: "Bake time: Saturday 20:00",
      bakeProfileLine: "Oven: Pizza oven · 60–90 sec",
    });
    expect(cloudPizzaSessionCompletedLabel("2026-07-03T10:00:00.000Z", new Date("2026-07-04T12:00:00.000Z"))).toBe("Completed 3 Jul 2026");
  });

  it("uses custom completed-session titles while preserving generic legacy titles", () => {
    const row = normalizeCloudPizzaSessionHistoryRow({
      id: "row-custom-title",
      user_id: "user-1",
      status: "completed",
      title: "  Kesäillan   pizzat  ",
      current_step: "review",
      session_data: createPizzaSession({
        id: "custom-title-session",
        status: "completed",
        currentStep: "review",
        recipeSnapshot: { balls: 4, ballWeight: 260, hydration: 65, fermentation: "24h-cold" },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const activeTitleRow = { ...row, title: ACTIVE_PIZZA_SESSION_DEFAULT_TITLE };
    const completedTitleRow = { ...row, title: COMPLETED_PIZZA_SESSION_DEFAULT_TITLE };
    const longTitle = "Pizza ".repeat(30);

    expect(completedPizzaSessionCustomTitle(row)).toBe("Kesäillan pizzat");
    expect(completedPizzaSessionDisplayTitle(row)).toBe("Kesäillan pizzat");
    expect(cloudPizzaSessionHistorySummary(row).title).toBe("Kesäillan pizzat");
    expect(cloudPizzaSessionDetailSummary(row).title).toBe("Kesäillan pizzat");
    expect(completedPizzaSessionCustomTitle(activeTitleRow)).toBeUndefined();
    expect(completedPizzaSessionCustomTitle(completedTitleRow)).toBeUndefined();
    expect(cloudPizzaSessionHistorySummary(activeTitleRow).title).toBe(COMPLETED_PIZZA_SESSION_DEFAULT_TITLE);
    expect(normalizeCompletedPizzaSessionTitleInput("   ")).toBeNull();
    expect(normalizeCompletedPizzaSessionTitleInput(longTitle)?.length).toBe(COMPLETED_PIZZA_SESSION_TITLE_MAX_LENGTH);
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

  it("builds completed session detail review notes from saved review fields", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-detail-review",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "detail-review-session",
        status: "completed",
        currentStep: "review",
        rating: 4,
        notes: "Crust had good color.",
        review: {
          whatWorked: "Long preheat helped.",
          improveNextTime: "Use less sauce.",
          nextTimeTry: "Try 48h cold fermentation.",
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const detail = cloudPizzaSessionDetailSummary(history, new Date("2026-07-04T12:00:00.000Z"));

    expect(detail.review.ratingLine).toBe("Rating: 4/5");
    expect(detail.review.notes).toEqual([
      { label: "General notes", value: "Crust had good color." },
      { label: "What worked", value: "Long preheat helped." },
      { label: "Improve next time", value: "Use less sauce." },
      { label: "Next time try", value: "Try 48h cold fermentation." },
    ]);
    expect(detail.review.hasReview).toBe(true);
  });

  it("preserves completed session photo metadata without requiring a public URL", () => {
    const session = createPizzaSession({
      id: "detail-photo-session",
      status: "completed",
      currentStep: "review",
      photo: {
        path: "user-1/row-detail-photo/photo.webp",
        uploadedAt: "2026-07-04T12:00:00.000Z",
        contentType: "image/webp",
        size: 123456,
        originalFileName: "phone-pizza.jpg",
        originalContentType: "image/jpeg",
        originalSize: 4_500_000,
        optimizedSize: 123456,
        width: 1600,
        height: 1200,
        compressionQuality: 0.7,
        maxDimensionUsed: 1200,
      },
    });

    expect(session.photo).toMatchObject({
      path: "user-1/row-detail-photo/photo.webp",
      uploadedAt: "2026-07-04T12:00:00.000Z",
      contentType: "image/webp",
      size: 123456,
      originalFileName: "phone-pizza.jpg",
      originalContentType: "image/jpeg",
      originalSize: 4_500_000,
      optimizedSize: 123456,
      width: 1600,
      height: 1200,
      compressionQuality: 0.7,
      maxDimensionUsed: 1200,
    });
  });

  it("builds branded pizza photo overlay fields from reliable completed-session data", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-photo",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-photo-session",
        status: "completed",
        currentStep: "review",
        plannedFermentationHours: 48,
        fermentationTemperatureCOverride: 4,
        ovenType: "gas",
        pizzaCount: 4,
        doughBallWeight: 260,
        flourSituation: "has_w_range",
        availableFlourWRanges: ["w_260_300"],
        rating: 5,
        recipeSnapshot: {
          balls: 4,
          ballWeight: 260,
          hydration: 64,
          fermentation: "12h-room",
        },
        photo: {
          path: "user-1/row-overlay-photo/photo.webp",
          url: "https://example.test/pizza.webp",
          uploadedAt: "2026-07-04T12:00:00.000Z",
          contentType: "image/webp",
          size: 123456,
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    expect(buildPizzaPhotoOverlayModel(history)).toEqual({
      brand: "DOUGHTOOLS",
      title: "BAKE LOG",
      footerLabel: "PLANNED, BAKED, DELIVERED",
      footerMain: "WITH DOUGHTOOLS.APP",
      footerWebsite: "doughtools.app",
      fields: [
        { label: "HYDRATION", value: "64%" },
        { label: "FERMENTATION", value: "48H COLD" },
        { label: "FRIDGE", value: "4°C" },
        { label: "FLOUR", value: "W 260–300" },
        { label: "BAKE", value: "90 SEC" },
      ],
    });
    expect(buildPizzaPhotoOverlayModel(history)?.fields.some((field) => field.label === "Dough balls")).toBe(false);
    expect(buildPizzaPhotoOverlayModel(history)?.fields.find((field) => field.label === "FLOUR")?.value).toBe("W 260–300");
  });

  it("builds room-temperature overlay fields from selected fermentation data", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-room-photo",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-room-photo-session",
        status: "completed",
        currentStep: "review",
        fermentationTemperatureCOverride: 22,
        ovenType: "home",
        recipeSnapshot: {
          hydration: 62,
          fermentation: "12h-room",
        },
        photo: {
          path: "user-1/row-overlay-room-photo/photo.webp",
          url: "https://example.test/room.webp",
          uploadedAt: "2026-07-04T12:00:00.000Z",
          contentType: "image/webp",
          size: 123456,
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    expect(buildPizzaPhotoOverlayModel(history)?.fields).toEqual([
      { label: "HYDRATION", value: "62%" },
      { label: "FERMENTATION", value: "12H ROOM" },
      { label: "ROOM", value: "22°C" },
      { label: "BAKE", value: "5 MIN" },
    ]);
  });

  it("shows overlay flour W when a stored used W range exists", () => {
    const session = createPizzaSession({
      id: "overlay-stored-w-session",
      status: "completed",
      currentStep: "review",
      plannedFermentationHours: 72,
      fermentationTemperatureCOverride: 4,
      flourSituation: "recommend",
      recipeSnapshot: {
        hydration: 65,
        fermentation: "12h-room",
      },
      photo: {
        path: "user-1/row-overlay-stored-w/photo.webp",
        url: "https://example.test/stored-w.webp",
        uploadedAt: "2026-07-04T12:00:00.000Z",
        contentType: "image/webp",
        size: 123456,
      },
    });

    const model = buildPizzaPhotoOverlayModel({
      id: "row-overlay-stored-w",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: {
        ...session,
        usedFlourWRanges: ["w_300_340"],
      },
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    });

    expect(model?.fields.find((field) => field.label === "FLOUR")?.value).toBe("W 300–340");
  });

  it("shows overlay flour W from the followed system recommendation", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-recommended-w",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-recommended-w-session",
        status: "completed",
        currentStep: "review",
        plannedFermentationHours: 48,
        fermentationTemperatureCOverride: 4,
        flourSituation: "recommend",
        recipeSnapshot: {
          hydration: 65,
          fermentation: "12h-room",
        },
        photo: {
          path: "user-1/row-overlay-recommended-w/photo.webp",
          url: "https://example.test/recommended-w.webp",
          uploadedAt: "2026-07-04T12:00:00.000Z",
          contentType: "image/webp",
          size: 123456,
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    expect(buildPizzaPhotoOverlayModel(history)?.fields.find((field) => field.label === "FLOUR")?.value).toBe("W 260–300");
  });

  it("omits optional overlay flour W and bake time when session data cannot determine them", () => {
    const history = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-optional-fields",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-optional-fields-session",
        status: "completed",
        currentStep: "review",
        ovenType: "pan",
        recipeSnapshot: {
          hydration: 63,
          fermentation: "12h-room",
        },
        photo: {
          path: "user-1/row-overlay-optional-fields/photo.webp",
          url: "https://example.test/optional.webp",
          uploadedAt: "2026-07-04T12:00:00.000Z",
          contentType: "image/webp",
          size: 123456,
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    const fields = buildPizzaPhotoOverlayModel(history)?.fields ?? [];

    expect(fields.some((field) => field.label === "FLOUR")).toBe(false);
    expect(fields.some((field) => field.label === "BAKE")).toBe(false);
  });

  it("omits missing optional overlay fields and does not render without a photo URL", () => {
    const withoutPhoto = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-no-photo",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-no-photo-session",
        status: "completed",
        currentStep: "review",
        recipeSnapshot: { balls: 2, ballWeight: 260 },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;
    const minimal = normalizeCloudPizzaSessionHistoryRow({
      id: "row-overlay-minimal",
      user_id: "user-1",
      status: "completed",
      title: "Active pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        id: "overlay-minimal-session",
        status: "completed",
        currentStep: "review",
        recipeSnapshot: { balls: 2, ballWeight: 260 },
        photo: {
          path: "user-1/row-overlay-minimal/photo.webp",
          url: "https://example.test/minimal.webp",
          uploadedAt: "2026-07-04T12:00:00.000Z",
          contentType: "image/webp",
          size: 123456,
        },
      }),
      created_at: "2026-07-04T09:00:00.000Z",
      updated_at: "2026-07-04T10:00:00.000Z",
      completed_at: "2026-07-04T10:00:00.000Z",
    })!;

    expect(buildPizzaPhotoOverlayModel(withoutPhoto)).toBeNull();
    expect(buildPizzaPhotoOverlayModel(minimal)?.fields).toEqual([]);
  });

  it("detects unsupported iPhone HEIC and HEIF photo inputs", () => {
    expect(isUnsupportedHeicPizzaSessionPhoto({ name: "pizza.heic", type: "" })).toBe(true);
    expect(isUnsupportedHeicPizzaSessionPhoto({ name: "pizza.HEIF", type: "" })).toBe(true);
    expect(isUnsupportedHeicPizzaSessionPhoto({ name: "pizza", type: "image/heic" })).toBe(true);
    expect(isUnsupportedHeicPizzaSessionPhoto({ name: "pizza", type: "image/heif" })).toBe(true);
    expect(isUnsupportedHeicPizzaSessionPhoto({ name: "pizza.jpg", type: "image/jpeg" })).toBe(false);
    expect(pizzaSessionPhotoTypeErrorFor({ name: "pizza.heic", type: "" })).toBe(PIZZA_SESSION_PHOTO_HEIC_ERROR);
    expect(pizzaSessionPhotoTypeErrorFor({ name: "pizza.bmp", type: "image/bmp" })).toBe(PIZZA_SESSION_PHOTO_TYPE_ERROR);
  });

  it("moderates optimized pizza photos server-side and approves only unflagged images", async () => {
    const file = new File(["safe-webp"], "pizza.webp", { type: "image/webp" });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe(PIZZA_PHOTO_MODERATION_MODEL);
      expect(body.input[0].type).toBe("image_url");
      expect(body.input[0].image_url.url).toMatch(/^data:image\/webp;base64,/);
      expect(String(init?.headers)).not.toContain("test-key");
      return new Response(JSON.stringify({ results: [{ flagged: false }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    await expect(moderatePizzaPhotoImage(file, { apiKey: "test-key", fetcher: fetchMock as unknown as typeof fetch })).resolves.toMatchObject({
      approved: true,
      flagged: false,
      reasonCode: "safe",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects flagged pizza photo moderation results without exposing moderation labels", async () => {
    const file = new File(["unsafe-webp"], "pizza.webp", { type: "image/webp" });
    const fetchMock = vi.fn(async () => (
      new Response(JSON.stringify({
        results: [{
          flagged: true,
          categories: { violence: true },
          category_scores: { violence: 0.99 },
        }],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));

    await expect(moderatePizzaPhotoImage(file, { apiKey: "test-key", fetcher: fetchMock as unknown as typeof fetch })).resolves.toMatchObject({
      approved: false,
      flagged: true,
      reasonCode: "unsafe_content",
    });
    expect(PIZZA_PHOTO_UNSAFE_ERROR).not.toMatch(/violence|category|score/i);
  });

  it("fails closed when pizza photo moderation fails or has no API key", async () => {
    const file = new File(["photo-webp"], "pizza.webp", { type: "image/webp" });
    const failingFetch = vi.fn(async () => new Response("{}", { status: 500 }));

    await expect(moderatePizzaPhotoImage(file, { apiKey: "test-key", fetcher: failingFetch as unknown as typeof fetch })).resolves.toMatchObject({
      approved: false,
      flagged: false,
      reasonCode: "moderation_failed",
    });
    await expect(moderatePizzaPhotoImage(file, { apiKey: "", fetcher: failingFetch as unknown as typeof fetch })).resolves.toMatchObject({
      approved: false,
      flagged: false,
      reasonCode: "moderation_failed",
    });
    expect(PIZZA_PHOTO_MODERATION_ERROR).not.toMatch(/category|score|OPENAI_API_KEY/i);
  });

  it("approves clear pizza, slice, dough and pizza-prep images after safety moderation passes", async () => {
    const cases = [
      "clear_pizza_photo",
      "pizza_slice_photo",
      "pizza_dough_photo",
      "pizza_prep_photo",
    ] as const;

    for (const reasonCode of cases) {
      const file = new File([reasonCode], "pizza.webp", { type: "image/webp" });
      const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe(PIZZA_PHOTO_RELEVANCE_MODEL);
        expect(body.input[0].content[0].text).toContain("Return JSON only");
        expect(body.input[0].content[1].type).toBe("input_image");
        expect(body.input[0].content[1].image_url).toMatch(/^data:image\/webp;base64,/);
        expect(body.text.format.type).toBe("json_schema");
        expect(body.text.format.strict).toBe(true);
        return new Response(JSON.stringify({
          output_text: JSON.stringify({
            isPizzaRelated: true,
            confidence: PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD,
            reasonCode,
          }),
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      await expect(validatePizzaPhotoRelevance(file, {
        apiKey: "test-key",
        fetcher: fetchMock as unknown as typeof fetch,
      })).resolves.toMatchObject({
        approved: true,
        isPizzaRelated: true,
        confidence: PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD,
        reasonCode,
      });
    }
  });

  it("rejects safe but non-pizza or uncertain images with generic relevance copy", async () => {
    const cases = [
      "not_pizza_related",
      "uncertain",
    ] as const;

    for (const reasonCode of cases) {
      const file = new File([reasonCode], "safe-non-pizza.webp", { type: "image/webp" });
      const fetchMock = vi.fn(async () => (
        new Response(JSON.stringify({
          output: [{
            content: [{
              text: JSON.stringify({
                isPizzaRelated: false,
                confidence: 0.95,
                reasonCode,
              }),
            }],
          }],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      ));

      await expect(validatePizzaPhotoRelevance(file, {
        apiKey: "test-key",
        fetcher: fetchMock as unknown as typeof fetch,
      })).resolves.toMatchObject({
        approved: false,
        isPizzaRelated: false,
        reasonCode,
      });
    }

    expect(PIZZA_PHOTO_RELEVANCE_ERROR).toBe("We couldn’t verify this as a pizza photo. Please upload a clear photo of your pizza.");
    expect(PIZZA_PHOTO_RELEVANCE_ERROR).not.toMatch(/confidence|reasonCode|not_pizza_related|uncertain|model/i);
  });

  it("rejects low-confidence, malformed, failed or missing-key pizza relevance checks", async () => {
    const file = new File(["maybe-pizza"], "maybe-pizza.webp", { type: "image/webp" });
    const lowConfidence = vi.fn(async () => (
      new Response(JSON.stringify({
        output_text: JSON.stringify({
          isPizzaRelated: true,
          confidence: 0.69,
          reasonCode: "clear_pizza_photo",
        }),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));
    const malformed = vi.fn(async () => (
      new Response(JSON.stringify({ output_text: "{not json" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    ));
    const failing = vi.fn(async () => new Response("{}", { status: 500 }));

    await expect(validatePizzaPhotoRelevance(file, {
      apiKey: "test-key",
      fetcher: lowConfidence as unknown as typeof fetch,
    })).resolves.toMatchObject({
      approved: false,
      isPizzaRelated: true,
      confidence: 0.69,
      reasonCode: "clear_pizza_photo",
    });
    await expect(validatePizzaPhotoRelevance(file, {
      apiKey: "test-key",
      fetcher: malformed as unknown as typeof fetch,
    })).resolves.toMatchObject({
      approved: false,
      reasonCode: "validation_failed",
    });
    await expect(validatePizzaPhotoRelevance(file, {
      apiKey: "test-key",
      fetcher: failing as unknown as typeof fetch,
    })).resolves.toMatchObject({
      approved: false,
      reasonCode: "validation_failed",
    });
    await expect(validatePizzaPhotoRelevance(file, {
      apiKey: "",
      fetcher: failing as unknown as typeof fetch,
    })).resolves.toMatchObject({
      approved: false,
      reasonCode: "validation_failed",
    });
    expect(PIZZA_PHOTO_RELEVANCE_CHECK_ERROR).not.toMatch(/confidence|reasonCode|OPENAI_API_KEY/i);
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

  it("serializes Kitchen Mode progress into cloud session rows and local restore", () => {
    const kitchenSession = createPizzaSession({
      id: "kitchen-cloud-latest",
      currentStep: "prep",
      status: "preparing",
      timeline: {
        generatedAt: "2026-07-04T10:00:00.000Z",
        targetEatTime: "2026-07-04T20:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active" },
          { id: "ball-dough", label: "Ball dough", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-04T10:05:00.000Z",
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
      updatedAt: "2026-07-04T10:15:00.000Z",
      lastSavedAt: "2026-07-04T10:15:00.000Z",
    });
    const row = normalizeCloudPizzaSessionRow({
      id: "cloud-kitchen-latest",
      user_id: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      current_step: "prep",
      session_data: kitchenSession,
      created_at: "2026-07-04T10:00:00.000Z",
      updated_at: "2026-07-04T10:16:00.000Z",
      completed_at: null,
    })!;
    const storage = new MemoryStorage();
    const restored = restoreCloudPizzaSessionToLocal(row, storage);

    expect((row.session_data as typeof kitchenSession).timeline?.steps[0].status).toBe("done");
    expect((row.session_data as typeof kitchenSession).stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
    expect(restored?.timeline?.steps[0].status).toBe("done");
    expect(restored?.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
    expect(getActivePizzaSession(storage)?.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
  });

  it("restores effective Kitchen countdowns from cloud timeline and stepRuntime without new persisted fields", () => {
    const kitchenSession = createPizzaSession({
      id: "kitchen-cloud-effective-countdown",
      currentStep: "prep",
      status: "preparing",
      timeline: {
        generatedAt: "2026-07-04T10:00:00.000Z",
        targetEatTime: "2026-07-04T20:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active", scheduledAt: "2026-07-04T10:00:00.000Z" },
          { id: "rest-dough", label: "Rest dough", status: "todo", kind: "passive", scheduledAt: "2026-07-04T10:30:00.000Z" },
          { id: "room-ferment", label: "Room temperature ferment", status: "todo", kind: "passive", scheduledAt: "2026-07-04T11:00:00.000Z" },
          { id: "ball-dough", label: "Ball dough", status: "todo", kind: "active", scheduledAt: "2026-07-04T18:00:00.000Z" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-04T10:05:00.000Z",
          actualCompletedAt: "2026-07-04T10:20:00.000Z",
        },
      },
      updatedAt: "2026-07-04T10:20:00.000Z",
      lastSavedAt: "2026-07-04T10:20:00.000Z",
    });
    const row = normalizeCloudPizzaSessionRow({
      id: "cloud-kitchen-effective-countdown",
      user_id: "user-1",
      status: "in_progress",
      title: "Active pizza session",
      current_step: "prep",
      session_data: kitchenSession,
      created_at: "2026-07-04T10:00:00.000Z",
      updated_at: "2026-07-04T10:21:00.000Z",
      completed_at: null,
    })!;
    const storage = new MemoryStorage();
    const restored = restoreCloudPizzaSessionToLocal(row, storage);
    const state = getKitchenModeState(restored, new Date("2026-07-04T10:25:00.000Z"));

    expect(state.ok).toBe(true);
    if (!state.ok || !state.currentStep) throw new Error("Expected restored Kitchen state");
    expect(state.currentStep.id).toBe("rest-dough");
    expect(state.currentStep.runtimeStartsAt).toBe("2026-07-04T10:20:00.000Z");
    expect(state.currentStep.scheduledAt).toBe("2026-07-04T10:50:00.000Z");
    expect(restored?.timeline?.steps.find((step) => step.id === "rest-dough")?.scheduledAt).toBe("2026-07-04T10:30:00.000Z");
  });

  it("does not let a Back-restored route snapshot overwrite newer Kitchen progress in the cloud queue", async () => {
    const storage = new MemoryStorage();
    const staleTimelineSnapshot = createPizzaSession({
      id: "back-navigation-session",
      currentStep: "timeline",
      status: "planning",
      lastRoute: "/session/timeline",
      updatedAt: "2026-07-04T10:00:00.000Z",
      lastSavedAt: "2026-07-04T10:00:00.000Z",
      timeline: {
        generatedAt: "2026-07-04T09:30:00.000Z",
        targetEatTime: "2026-07-04T20:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" },
          { id: "ball-dough", label: "Ball dough", status: "todo", kind: "active" },
        ],
      },
    }, new Date("2026-07-04T09:30:00.000Z"));
    const newerKitchenSnapshot = createPizzaSession({
      ...staleTimelineSnapshot,
      currentStep: "prep",
      status: "preparing",
      lastRoute: "/session/kitchen",
      updatedAt: "2026-07-04T10:15:00.000Z",
      lastSavedAt: "2026-07-04T10:15:00.000Z",
      timeline: {
        ...staleTimelineSnapshot.timeline,
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active" },
          { id: "ball-dough", label: "Ball dough", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-04T10:05:00.000Z",
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
    }, new Date("2026-07-04T09:30:00.000Z"));
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify([newerKitchenSnapshot]));
    setActivePizzaSession(newerKitchenSnapshot.id, storage);
    markCloudBackedPizzaSession(newerKitchenSnapshot.id, "cloud-row-back-navigation", storage);
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    const originalFetch = globalThis.fetch;
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
    });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        session: {
          id: "cloud-row-back-navigation",
          user_id: "user-1",
          status: "in_progress",
          title: "Active pizza session",
          current_step: body.sessionData.currentStep,
          session_data: body.sessionData,
          created_at: "2026-07-04T09:30:00.000Z",
          updated_at: "2026-07-04T10:15:00.000Z",
          completed_at: null,
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await queueCloudActivePizzaSessionSave(staleTimelineSnapshot, { storage });
    } finally {
      globalThis.fetch = originalFetch;
      if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
      else Reflect.deleteProperty(globalThis, "window");
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(init?.body));
    expect(body.sessionData).toMatchObject({
      id: "back-navigation-session",
      currentStep: "prep",
      status: "preparing",
      lastRoute: "/session/kitchen",
      updatedAt: "2026-07-04T10:15:00.000Z",
      stepRuntime: {
        "mix-dough": {
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
    });
    expect(body.sessionData.timeline.steps.find((step: { id: string }) => step.id === "mix-dough")?.status).toBe("done");
  });

  it("chooses the canonical active session for equal-timestamp route snapshots", () => {
    const storage = new MemoryStorage();
    const staleTimelineSnapshot = createPizzaSession({
      id: "equal-timestamp-session",
      currentStep: "timeline",
      status: "planning",
      lastRoute: "/session/timeline",
      updatedAt: "2026-07-04T10:15:00.000Z",
      lastSavedAt: "2026-07-04T10:15:00.000Z",
      timeline: {
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" },
        ],
      },
    });
    const canonicalKitchenSnapshot = createPizzaSession({
      ...staleTimelineSnapshot,
      currentStep: "prep",
      status: "preparing",
      lastRoute: "/session/kitchen",
      timeline: {
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
    });
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify([canonicalKitchenSnapshot]));
    setActivePizzaSession(canonicalKitchenSnapshot.id, storage);

    const selected = latestActivePizzaSessionForCloudSync(staleTimelineSnapshot, storage);

    expect(selected.currentStep).toBe("prep");
    expect(selected.lastRoute).toBe("/session/kitchen");
    expect(selected.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
  });

  it("does not replace a newer incoming Kitchen snapshot with older active storage", () => {
    const storage = new MemoryStorage();
    const olderStoredSession = createPizzaSession({
      id: "newer-incoming-session",
      currentStep: "timeline",
      status: "planning",
      updatedAt: "2026-07-04T10:00:00.000Z",
      lastSavedAt: "2026-07-04T10:00:00.000Z",
    });
    const newerIncomingKitchenSession = createPizzaSession({
      ...olderStoredSession,
      currentStep: "prep",
      status: "preparing",
      updatedAt: "2026-07-04T10:15:00.000Z",
      lastSavedAt: "2026-07-04T10:15:00.000Z",
      stepRuntime: {
        "mix-dough": {
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
    });
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify([olderStoredSession]));
    setActivePizzaSession(olderStoredSession.id, storage);

    const selected = latestActivePizzaSessionForCloudSync(newerIncomingKitchenSession, storage);

    expect(selected.currentStep).toBe("prep");
    expect(selected.updatedAt).toBe("2026-07-04T10:15:00.000Z");
    expect(selected.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
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

  it("auto-saves signed-in Dough Plan sessions while preserving manual fallback", () => {
    const recipePage = source("app/session/recipe/page.tsx");
    const saveComponent = source("components/session/SavePizzaSessionToAccount.tsx");

    expect(recipePage).toContain("SavePizzaSessionToAccount");
    expect(recipePage).toContain("<SavePizzaSessionToAccount session={session} />");
    expect(saveComponent).toContain("doughPlanAccountSaveSnapshotKey");
    expect(saveComponent).toContain("DOUGH_PLAN_AUTO_SAVE_SNAPSHOT_KEY");
    expect(saveComponent).toContain("readAutoSavedSnapshotKey() === snapshotKey");
    expect(saveComponent).toContain("lastAutoSavedKey.current === snapshotKey");
    expect(saveComponent).toContain("inFlightSaveKey.current === snapshotKey");
    expect(saveComponent).toContain("void saveToAccount(\"auto\")");
    expect(saveComponent).toContain("Saving to your account…");
    expect(saveComponent).toContain("Save to account");
    expect(saveComponent).toContain("Saved to your account.");
    expect(saveComponent).toContain("You can continue from your account later.");
    expect(saveComponent).toContain("We could not auto-save this session. You can try saving it manually.");
    expect(saveComponent).toContain("Sign in to save this session across devices.");
    expect(saveComponent).toContain('fetch("/api/pizza-sessions/active"');
    expect(saveComponent).toContain("normalizeCloudPizzaSessionRow(payload.session)");
    expect(saveComponent).toContain("Saved pizza session could not be verified.");
    expect(saveComponent).toContain("markCloudBackedPizzaSession(session.id, savedSession.id)");
    expect(saveComponent).not.toContain("Cloud sync is active");
  });

  it("prioritizes cloud Active Pizza Sessions for signed-in continuation", () => {
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");
    const resolver = source("lib/canonical-active-pizza-session.ts");
    const restore = source("lib/cloud-pizza-session-restore.ts");

    expect(continueCard).toContain("resolveCanonicalActivePizzaSession()");
    expect(continueCard).toContain("setSession(decision.state === \"active\" ? decision.session : null)");
    expect(continueCard).toContain("setCloudSession(decision.state === \"active\" ? decision.cloudRow : null)");
    expect(resolver).toContain("fetchActiveCloudPizzaSession");
    expect(resolver).toContain("chooseCanonicalActivePizzaSession");
    expect(resolver).toContain("local?.id === cloud.id");
    expect(resolver).toContain("restoreCloudPizzaSessionToLocal");
    expect(resolver).toContain("promoteLocalPizzaSessionToCloud");
    expect(continueCard).toContain("Active pizza session");
    expect(continueCard).toContain("summary.statusLine");
    expect(continueCard).toContain("Continue Pizza Session");
    expect(restore).toContain("savePizzaSession(session, storage)");
    expect(restore).toContain("setActivePizzaSession(restored.id, storage)");
    expect(restore).toContain("markCloudBackedPizzaSession(restored.id, row.id, storage)");
    expect(continueCard).toContain("router.push(deriveActiveSessionResumeRoute(session))");
  });

  it("promotes signed-in Start Pizza Session changes to cloud without changing guest-local storage", () => {
    const startPage = source("app/session/start/page.tsx");
    const client = source("lib/cloud-pizza-session-client.ts");
    const activeRoute = source("app/api/pizza-sessions/active/route.ts");

    expect(startPage).toContain("queueCloudActivePizzaSessionSave");
    expect(startPage).toContain("materializeCloudBackedPizzaSession");
    expect(startPage).toContain("lastCloudSaveKey");
    expect(startPage).toContain("void queueCloudActivePizzaSessionSave(session).then");
    expect(startPage).toContain('result.reason !== "unauthenticated"');
    expect(startPage).toContain("await materializeCloudBackedPizzaSession(saved,");
    expect(startPage.indexOf("const saved = savePizzaSession(readyForRecipe)")).toBeLessThan(startPage.indexOf("await materializeCloudBackedPizzaSession(saved,"));
    expect(startPage.indexOf("await materializeCloudBackedPizzaSession(saved,")).toBeLessThan(startPage.indexOf("router.push(\"/session/recipe\")"));
    expect(startPage).toContain("setCreationError(\"We could not save this pizza plan to your account yet.");
    expect(startPage).toContain("if (getActivePizzaSession()?.id !== session.id) return");
    expect(client).toContain("getCloudActivePizzaSessionAuthState");
    expect(client).toContain("headers.set(\"Authorization\", `Bearer ${token}`)");
    expect(client).toContain("if (!auth.signedIn) return { skipped: true, reason: \"unauthenticated\" as const }");
    expect(client).toContain('fetch("/api/pizza-sessions/active"');
    expect(client).toContain("method: \"POST\"");
    expect(client).toContain("headers: auth.headers");
    expect(client).toContain("headers,");
    expect(client).toContain("ActiveCloudPizzaSessionConflictError");
    expect(client).toContain("active_session_exists");
    expect(client).toContain("replaceActiveSession: options.replaceActiveSession === true");
    expect(client).toContain("return saveCloudActivePizzaSession(session, options)");
    expect(client).toContain("queueCloudActivePizzaSessionSave");
    expect(client).toContain("export async function materializeCloudBackedPizzaSession");
    expect(client).toContain("status: \"cloud-backed\"");
    expect(client).toContain("status: \"local-only\"");
    expect(client).toContain("drainCloudSaveQueue");
    expect(client).toContain("markCloudBackedPizzaSession(session.id, savedSession.id)");
    expect(activeRoute).toContain('.select("id,session_data,updated_at")');
    expect(activeRoute).toContain("existingSession.id !== session.id");
    expect(activeRoute).toContain("activeSessionConflictResponse");
    expect(activeRoute).toContain('error: "active_session_exists"');
    expect(activeRoute).toContain("resumeRoute: pizzaSessionContinueHref(existingSession)");
    expect(activeRoute).toContain("conflict: true");
    expect(activeRoute).toContain("{ status: 409 }");
    expect(activeRoute).toContain("const replaceActiveSession = record.replaceActiveSession === true || record.replace_active_session === true");
    expect(activeRoute).toContain("if (!replaceActiveSession) return activeSessionConflictResponse(existing, existingSession, session)");
    expect(activeRoute).toContain("!replaceActiveSession && targetExisting?.id");
    expect(activeRoute).toContain("cloudSessionIsNewer(existingSession, session)");
    expect(activeRoute).toContain('reason: "stale-session"');
  });

  it("shows a safe Session Start choice for existing active cloud-session conflicts", () => {
    const startPage = source("app/session/start/page.tsx");

    expect(startPage).toContain("isActiveCloudPizzaSessionConflictError");
    expect(startPage).toContain("setActiveCloudConflict(error.conflict)");
    expect(startPage).toContain("You already have an active pizza session.");
    expect(startPage).toContain("ActiveCloudSessionConflictChoice");
    expect(startPage).toContain("Continue existing session");
    expect(startPage).toContain("Keep setup");
    expect(startPage).toContain("Start new pizza");
    expect(startPage).toContain("This will replace the active pizza session in your account with this setup.");
    expect(startPage).toContain("continueToRecipe({ replaceActiveCloudSession: true })");
    expect(startPage).toContain("resolveCanonicalActivePizzaSession()");
    expect(startPage).toContain("clearActivePizzaSession()");
  });

  it("keeps canonical active-session requests on the authenticated browser token path", () => {
    const resolver = source("lib/canonical-active-pizza-session.ts");
    const client = source("lib/cloud-pizza-session-client.ts");
    const accountCard = source("components/account/AccountActivePizzaSessionCard.tsx");

    expect(resolver).toContain("getCloudActivePizzaSessionAuthState");
    expect(resolver).toContain("headers: requestHeaders(headers)");
    expect(resolver).toContain("headers: jsonRequestHeaders(headers)");
    expect(resolver).toContain("fetchActiveCloudPizzaSession(fetcher, authHeaders)");
    expect(resolver).toContain("promoteLocalPizzaSessionToCloud(decision.session, fetcher, authHeaders)");
    expect(client).toContain("export async function cloudActivePizzaSessionRequestHeaders");
    expect(client).toContain("Authorization");
    expect(accountCard).toContain("cloudActivePizzaSessionRequestHeaders");
    expect(accountCard).toContain("fetch(\"/api/pizza-sessions/active\", { method: \"DELETE\", headers })");
  });

  it("syncs cloud-backed sessions from the major Pizza Session step pages", () => {
    const syncComponent = source("components/session/CloudPizzaSessionSync.tsx");
    const recipePage = source("app/session/recipe/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const timelinePage = source("app/session/timeline/page.tsx");
    const kitchenPage = source("app/session/kitchen/page.tsx");
    const reviewPage = source("app/session/review/page.tsx");

    expect(syncComponent).toContain("queueCloudActivePizzaSessionSave(session)");
    expect(syncComponent).toContain('result.reason !== "unauthenticated"');
    expect(syncComponent).toContain("lastSyncedKey");
    expect(syncComponent).toContain("session.updatedAt");
    expect(syncComponent).toContain("session.lastSavedAt");
    [recipePage, shoppingPage, timelinePage, kitchenPage].forEach((page) => {
      expect(page).toContain("resolveCanonicalActivePizzaSession");
      expect(page).toContain("CloudPizzaSessionSync");
      expect(page).toContain("<CloudPizzaSessionSync session={session} />");
    });
    expect(reviewPage).toContain("resolveCanonicalActivePizzaSession");
    expect(reviewPage).toContain('session.status !== "completed" && <CloudPizzaSessionSync session={session} />');
    expect(reviewPage).not.toContain("saveCloudActivePizzaSession(completed)");
    expect(reviewPage).toContain("mustCompleteCloud");
    expect(reviewPage).toContain("completeCloudBackedPizzaSession(completed)");
  });

  it("queues the latest Kitchen mutation snapshot before immediate navigation can unmount the sync effect", () => {
    const kitchenPage = source("app/session/kitchen/page.tsx");

    expect(kitchenPage).toContain("queueCloudActivePizzaSessionSave");
    expect(kitchenPage).toContain("queueCloudActivePizzaSessionSave(updated).catch");
    const syncCalls = [...kitchenPage.matchAll(/queueKitchenProgressSync\(updated\)/g)].map((match) => match.index ?? -1);
    expect(syncCalls).toHaveLength(2);

    const completeMutation = kitchenPage.indexOf("const updated = completeKitchenTimelineStep(session, currentStep.id, undefined, now)");
    const completeSetSession = kitchenPage.indexOf("setSession(updated)", syncCalls[0]);
    expect(completeMutation).toBeLessThan(syncCalls[0]);
    expect(syncCalls[0]).toBeLessThan(completeSetSession);

    const startMutation = kitchenPage.indexOf("const updated = startPizzaSessionTimelineStep(session, currentStep.id, undefined, now)");
    const startSetSession = kitchenPage.indexOf("setSession(updated)", syncCalls[1]);
    expect(startMutation).toBeLessThan(syncCalls[1]);
    expect(syncCalls[1]).toBeLessThan(startSetSession);
  });

  it("documents active-session cloud queue behavior for newest update wins", () => {
    const client = source("lib/cloud-pizza-session-client.ts");
    const route = source("app/api/pizza-sessions/active/route.ts");

    expect(queueCloudActivePizzaSessionSave).toBeTypeOf("function");
    expect(client).toContain("let queuedCloudSave");
    expect(client).toContain("let activeCloudSave");
    expect(client).toContain("queuedCloudSave = {");
    expect(client).toContain("session,");
    expect(client).toContain("startCloudSaveDrain()");
    expect(client).toContain("if (queuedCloudSave) startCloudSaveDrain()");
    expect(route).toContain("cloudSessionIsNewer(existingSession, session)");
    expect(route).toContain("return NextResponse.json({ session: normalizedExisting, skipped: true, reason: \"stale-session\" })");
  });

  it("shows saved active sessions on the Account page with an empty state", () => {
    const accountPage = source("app/account/page.tsx");
    const accountCard = source("components/account/AccountActivePizzaSessionCard.tsx");

    expect(accountPage).toContain("AccountActivePizzaSessionCard");
    expect(accountPage).toContain("<AccountActivePizzaSessionCard enabled");
    expect(accountPage).toContain("Your DoughTools workspace.");
    expect(accountPage).toContain("Back to homepage");
    expect(accountPage).toContain('href="/"');
    expect(accountPage).toContain("t.signedIn");
    expect(accountPage).toContain("user.email");
    expect(accountPage).toContain("t.signOut");
    expect(accountPage).not.toContain("Your password is handled by Supabase and is not stored in DoughTools code.");
    expect(accountCard).toContain("resolveCanonicalActivePizzaSession()");
    expect(accountCard).toContain("summary.title");
    expect(accountCard).toContain("summary.doughLine");
    expect(accountCard).toContain("summary.bakeLine");
    expect(accountCard).toContain("summary.stepLine");
    expect(accountCard).toContain("Continue Pizza Session");
    expect(accountCard).toContain("restoreCloudPizzaSessionToLocal(cloudSession)");
    expect(accountCard).toContain("router.push(pizzaSessionContinueHref(restored))");
    expect(accountCard).toContain("Delete pizza session");
    expect(accountCard).toContain("Delete pizza session?");
    expect(accountCard).toContain("This will remove your active in-progress Pizza Session. This cannot be undone.");
    expect(accountCard).toContain("Delete session");
    expect(accountCard).toContain("Cancel");
    expect(accountCard).toContain('fetch("/api/pizza-sessions/active", { method: "DELETE", headers })');
    expect(accountCard).toContain("clearMatchingLocalActiveSession(cloudSession)");
    expect(accountCard).toContain("setCloudSession(null)");
    expect(accountCard).toContain("archivePizzaSession(localSession.id)");
    expect(accountCard).toContain("clearActivePizzaSession()");
    expect(accountCard).toContain("clearCloudBackedPizzaSession()");
    expect(accountCard).toContain("No active pizza session");
    expect(accountCard).toContain("Start a new Pizza Session from the homepage.");
    expect(accountCard).toContain("Back to homepage");
    expect(accountCard).toContain('href="/"');
    expect(accountCard).toContain("if (!enabled) return null");
  });

  it("shows completed Pizza Session history on the Account page", () => {
    const accountPage = source("app/account/page.tsx");
    const historyRoute = source("app/api/pizza-sessions/history/route.ts");
    const detailRoute = source("app/api/pizza-sessions/history/[id]/route.ts");
    const photoRoute = source("app/api/pizza-sessions/history/[id]/photo/route.ts");
    const historyComponent = source("components/account/AccountPizzaSessionHistory.tsx");
    const detailPage = source("app/account/pizza-sessions/[id]/page.tsx");
    const detailComponent = source("components/account/CompletedPizzaSessionDetail.tsx");
    const overlayComponent = source("components/account/PizzaPhotoOverlayGenerator.tsx");
    const overlayHelper = source("lib/pizza-photo-overlay.ts");
    const photoHelper = source("lib/pizza-session-photo.ts");
    const photoOptimizer = source("lib/pizza-session-photo-optimizer.ts");
    const moderationHelper = source("lib/pizza-photo-moderation.ts");
    const relevanceHelper = source("lib/pizza-photo-relevance.ts");

    expect(accountPage).toContain("AccountPizzaSessionHistory");
    expect(accountPage).toContain("<AccountPizzaSessionHistory enabled");
    expect(historyRoute).toContain("supabase.auth.getUser()");
    expect(historyRoute).toContain("withSignedPizzaPhotoUrl");
    expect(historyRoute).toContain("createSignedUrl(session.photo.path");
    expect(historyRoute).toContain(".eq(\"user_id\", user.id)");
    expect(historyRoute).toContain(".eq(\"status\", \"completed\")");
    expect(historyRoute).toContain("sortCloudPizzaSessionHistoryRows");
    expect(historyRoute).toContain("slice(0, 5)");
    expect(historyComponent).toContain("fetch(\"/api/pizza-sessions/history\"");
    expect(historyComponent).toContain("migratePizzaSession(session.session_data)");
    expect(historyComponent).toContain("Completed pizza session thumbnail");
    expect(historyComponent).toContain("loading=\"lazy\"");
    expect(historyComponent).toContain("Delete");
    expect(historyComponent).toContain("Delete this pizza session?");
    expect(historyComponent).toContain("This removes the completed session from your account history. This cannot be undone.");
    expect(historyComponent).toContain("Cancel");
    expect(historyComponent).toContain("Delete session");
    expect(historyComponent).toContain("{!isConfirmingDelete && (");
    expect(historyComponent).toContain("fetch(`/api/pizza-sessions/history/${sessionId}`");
    expect(historyComponent).toContain("method: \"DELETE\"");
    expect(historyComponent).toContain("method: \"PATCH\"");
    expect(historyComponent).toContain("Edit title");
    expect(historyComponent).toContain("Save title");
    expect(historyComponent).toContain("Remove title");
    expect(historyComponent).toContain("completedPizzaSessionCustomTitle");
    expect(historyComponent).toContain("current.filter((session) => session.id !== sessionId)");
    expect(historyComponent).toContain("Pizza session history");
    expect(source("lib/cloud-pizza-sessions.ts")).toContain("COMPLETED_PIZZA_SESSION_DEFAULT_TITLE");
    expect(source("lib/cloud-pizza-sessions.ts")).toContain("completedPizzaSessionDisplayTitle(row)");
    expect(historyComponent).toContain("summary.doughLine");
    expect(historyComponent).toContain("summary.hydrationLine");
    expect(historyComponent).toContain("summary.fermentationLine");
    expect(historyComponent).toContain("summary.reviewLine");
    expect(historyComponent).toContain("summary.bakeLine");
    expect(historyComponent).toContain("summary.bakeProfileLine");
    expect(historyComponent).toContain("View session");
    expect(historyComponent).toContain("href={`/account/pizza-sessions/${session.id}`}");
    expect(historyComponent).toContain("No completed pizza sessions yet");
    expect(historyComponent).toContain("Finish a Pizza Session to save it here.");
    expect(historyComponent).toContain("if (!enabled) return null");
    expect(detailRoute).toContain(".eq(\"id\", id)");
    expect(detailRoute).toContain(".eq(\"user_id\", user.id)");
    expect(detailRoute).toContain(".eq(\"status\", \"completed\")");
    expect(detailRoute).toContain("normalizeCloudPizzaSessionHistoryRow(await withSignedPizzaPhotoUrl(data, supabase))");
    expect(detailRoute).toContain("createSignedUrl(session.photo.path");
    expect(detailRoute).toContain("export async function PATCH");
    expect(detailRoute).toContain("normalizeCompletedPizzaSessionTitleInput(record.title)");
    expect(detailRoute).toContain("title: customTitle ?? COMPLETED_PIZZA_SESSION_DEFAULT_TITLE");
    expect(detailRoute).toContain(".eq(\"status\", \"completed\")");
    expect(detailRoute).toContain("export async function DELETE");
    expect(detailRoute).toContain("Sign in to delete this pizza session.");
    expect(detailRoute).toContain("status: \"archived\"");
    expect(detailRoute).toContain(".eq(\"id\", id)");
    expect(detailRoute).toContain(".eq(\"user_id\", user.id)");
    expect(detailRoute).toContain(".eq(\"status\", \"completed\")");
    expect(detailRoute).toContain("Completed pizza session not found.");
    expect(detailRoute).toContain("archived: true");
    expect(detailPage).toContain("CompletedPizzaSessionDetail");
    expect(detailComponent).toContain("fetch(`/api/pizza-sessions/history/${sessionId}`");
    expect(detailComponent).toContain("method: \"PATCH\"");
    expect(detailComponent).toContain("Add an event name");
    expect(detailComponent).toContain("Event name saved");
    expect(detailComponent).toContain("Remove title");
    expect(detailComponent).toContain("cloudPizzaSessionDetailSummary(session)");
    expect(detailComponent).toContain("summary.bakeProfileLine");
    expect(detailComponent).toContain("Pizza photo");
    expect(detailComponent).toContain("Add a photo of your finished pizza to remember this bake.");
    expect(detailComponent).toContain("Upload pizza photo");
    expect(detailComponent).toContain("Pizza photo saved");
    expect(detailComponent).toContain("buildPizzaPhotoOverlayModel(session)");
    expect(detailComponent).toContain("PizzaPhotoOverlayGenerator");
    expect(detailComponent).toContain("photo?.url && overlayModel");
    expect(detailComponent).toContain("optimizePizzaSessionPhotoForUpload(file)");
    expect(detailComponent).toContain("formData.set(\"originalFileName\", optimizedPhoto.originalFileName)");
    expect(detailComponent).toContain("formData.set(\"optimizedSize\", String(optimizedPhoto.optimizedSize))");
    expect(detailComponent).toContain("formData.set(\"width\", String(optimizedPhoto.width))");
    expect(detailComponent).toContain("formData.set(\"height\", String(optimizedPhoto.height))");
    expect(detailComponent).toContain("formData.set(\"compressionQuality\", String(optimizedPhoto.compressionQuality))");
    expect(detailComponent).toContain("formData.set(\"maxDimensionUsed\", String(optimizedPhoto.maxDimensionUsed))");
    expect(detailComponent).toContain("PIZZA_SESSION_PHOTO_PROCESS_ERROR");
    expect(detailComponent).toContain("pizzaSessionPhotoTypeErrorFor(file)");
    expect(detailComponent).toContain("Finished pizza photo");
    expect(detailComponent).toContain("Review notes");
    expect(detailComponent).toContain("What happened");
    expect(detailComponent).toContain("summary.review.ratingLine");
    expect(detailComponent).toContain("summary.review.notes.map");
    expect(detailComponent).toContain("No review notes were saved for this session.");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_BUCKET = \"pizza-session-photos\"");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_MAX_BYTES = 5 * 1024 * 1024");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_OUTPUT_TYPE = \"image/webp\"");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES = 800 * 1024");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_MAX_DIMENSION = 1200");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_MIN_DIMENSION = 600");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_WEBP_QUALITY = 0.70");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_MIN_WEBP_QUALITY = 0.40");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_DIMENSION_STEPS = [1200, 1000, 900, 800, 700, 600]");
    expect(photoHelper).toContain("PIZZA_SESSION_PHOTO_QUALITY_STEPS = [0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40]");
    expect(photoHelper).toContain("Please upload a JPG, PNG or WebP image.");
    expect(photoHelper).toContain("Please choose a photo under 5 MB, or reduce the photo size before uploading.");
    expect(photoHelper).toContain("Please upload a JPG, PNG or WebP image. iPhone HEIC photos are not supported yet.");
    expect(photoHelper).toContain("Could not process this photo. Please try a JPG version or a smaller image.");
    expect(photoHelper).toContain("Could not compress pizza photo enough. Please try a smaller image.");
    expect(photoHelper).toContain("isUnsupportedHeicPizzaSessionPhoto");
    expect(photoOptimizer).toContain("canvas.toBlob");
    expect(photoOptimizer).toContain("PIZZA_SESSION_PHOTO_OUTPUT_TYPE");
    expect(photoOptimizer).toContain("PIZZA_SESSION_PHOTO_QUALITY_STEPS");
    expect(photoOptimizer).toContain("PIZZA_SESSION_PHOTO_DIMENSION_STEPS");
    expect(photoOptimizer).toContain("PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES");
    expect(photoOptimizer).toContain("blob.size <= PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES");
    expect(photoOptimizer).toContain("throw new Error(PIZZA_SESSION_PHOTO_COMPRESS_ERROR)");
    expect(photoRoute).toContain("supabase.auth.getUser()");
    expect(photoRoute).toContain(".eq(\"id\", id)");
    expect(photoRoute).toContain(".eq(\"user_id\", user.id)");
    expect(photoRoute).toContain(".eq(\"status\", \"completed\")");
    expect(photoRoute).toContain("formData.get(\"photo\")");
    expect(photoRoute).toContain("file instanceof File");
    expect(photoRoute).toContain("isAcceptedPizzaSessionPhotoType(originalContentType)");
    expect(photoRoute).toContain("file.type !== PIZZA_SESSION_PHOTO_OUTPUT_TYPE");
    expect(photoRoute).toContain("pizzaSessionPhotoTypeErrorFor({ name: originalFileName, type: originalContentType })");
    expect(photoRoute).toContain("file.size > PIZZA_SESSION_PHOTO_MAX_BYTES");
    expect(photoRoute).toContain("originalSize > PIZZA_SESSION_PHOTO_MAX_BYTES");
    expect(photoRoute).toContain("reason: \"unsupported_type\"");
    expect(photoRoute).toContain("reason: \"original_too_large\"");
    expect(photoRoute).toContain("reason: \"optimized_too_large\"");
    expect(photoRoute).toContain("file.size > PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES");
    expect(photoRoute).toContain("optimizedSize > PIZZA_SESSION_PHOTO_HARD_MAX_OPTIMIZED_BYTES");
    expect(photoRoute).toContain("PIZZA_SESSION_PHOTO_COMPRESS_ERROR");
    expect(photoRoute).toContain("moderatePizzaPhotoImage(file)");
    expect(photoRoute).toContain("PIZZA_PHOTO_UNSAFE_ERROR");
    expect(photoRoute).toContain("PIZZA_PHOTO_MODERATION_ERROR");
    expect(photoRoute).toContain("reason: moderation.reasonCode");
    expect(photoRoute).toContain("validatePizzaPhotoRelevance(file)");
    expect(photoRoute).toContain("PIZZA_PHOTO_RELEVANCE_ERROR");
    expect(photoRoute).toContain("PIZZA_PHOTO_RELEVANCE_CHECK_ERROR");
    expect(photoRoute.indexOf("moderatePizzaPhotoImage(file)")).toBeGreaterThan(-1);
    expect(photoRoute.indexOf("moderatePizzaPhotoImage(file)")).toBeLessThan(photoRoute.indexOf(".upload(path, file"));
    expect(photoRoute.indexOf("moderatePizzaPhotoImage(file)")).toBeLessThan(photoRoute.indexOf("session_data: sessionWithPhoto"));
    expect(photoRoute.indexOf("moderatePizzaPhotoImage(file)")).toBeLessThan(photoRoute.indexOf("validatePizzaPhotoRelevance(file)"));
    expect(photoRoute.indexOf("validatePizzaPhotoRelevance(file)")).toBeLessThan(photoRoute.indexOf(".upload(path, file"));
    expect(photoRoute.indexOf("validatePizzaPhotoRelevance(file)")).toBeLessThan(photoRoute.indexOf("session_data: sessionWithPhoto"));
    expect(photoRoute).not.toContain("reason: relevance.reasonCode");
    expect(photoRoute).not.toContain("confidence: relevance.confidence");
    expect(photoRoute).toContain(".from(PIZZA_SESSION_PHOTO_BUCKET)");
    expect(photoRoute).toContain(".upload(path, file");
    expect(photoRoute).toContain("contentType: PIZZA_SESSION_PHOTO_OUTPUT_TYPE");
    expect(photoRoute).toContain("const originalFileName = formText(formData, \"originalFileName\") ?? file.name");
    expect(photoRoute).toContain("originalFileName,");
    expect(photoRoute).toContain("originalContentType");
    expect(photoRoute).toContain("originalSize");
    expect(photoRoute).toContain("optimizedSize,");
    expect(photoRoute).toContain("width: formPositiveNumber(formData, \"width\")");
    expect(photoRoute).toContain("height: formPositiveNumber(formData, \"height\")");
    expect(photoRoute).toContain("compressionQuality: formPositiveNumber(formData, \"compressionQuality\")");
    expect(photoRoute).toContain("maxDimensionUsed: formPositiveNumber(formData, \"maxDimensionUsed\")");
    expect(photoRoute).toContain("session_data: sessionWithPhoto");
    expect(photoRoute).toContain("oldPhotoPath && oldPhotoPath !== path");
    expect(photoRoute).toContain(".remove([oldPhotoPath])");
    expect(moderationHelper).toContain("PIZZA_PHOTO_MODERATION_MODEL = \"omni-moderation-latest\"");
    expect(moderationHelper).toContain("process.env.OPENAI_API_KEY");
    expect(moderationHelper).toContain("https://api.openai.com/v1/moderations");
    expect(moderationHelper).toContain("type: \"image_url\"");
    expect(moderationHelper).toContain("data:${file.type};base64");
    expect(moderationHelper).toContain("approved: reasonCode === \"safe\"");
    expect(moderationHelper).toContain("reasonCode === \"unsafe_content\"");
    expect(moderationHelper).toContain("moderation_failed");
    expect(moderationHelper).toContain("AbortController");
    expect(moderationHelper).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(moderationHelper).not.toContain("console.log");
    expect(relevanceHelper).toContain("PIZZA_PHOTO_RELEVANCE_MODEL = \"gpt-4.1-mini\"");
    expect(relevanceHelper).toContain("PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD = 0.70");
    expect(relevanceHelper).toContain("process.env.OPENAI_API_KEY");
    expect(relevanceHelper).toContain("https://api.openai.com/v1/responses");
    expect(relevanceHelper).toContain("type: \"input_image\"");
    expect(relevanceHelper).toContain("type: \"json_schema\"");
    expect(relevanceHelper).toContain("Return JSON only");
    expect(relevanceHelper).toContain("finished pizza, pizza slice, pizza in oven");
    expect(relevanceHelper).toContain("dough balls, dough preparation");
    expect(relevanceHelper).toContain("people/selfies/fashion/underwear/model photos");
    expect(relevanceHelper).toContain("animals, screenshots, documents, receipts, memes");
    expect(relevanceHelper).toContain("approvedReasonCodes");
    expect(relevanceHelper).toContain("confidence >= PIZZA_PHOTO_RELEVANCE_CONFIDENCE_THRESHOLD");
    expect(relevanceHelper).toContain("validation_failed");
    expect(relevanceHelper).toContain("AbortController");
    expect(relevanceHelper).not.toContain("NEXT_PUBLIC_OPENAI");
    expect(relevanceHelper).not.toContain("console.log");
    expect(overlayHelper).toContain("PIZZA_PHOTO_OVERLAY_WIDTH = 1080");
    expect(overlayHelper).toContain("PIZZA_PHOTO_OVERLAY_HEIGHT = 1350");
    expect(PIZZA_PHOTO_OVERLAY_WIDTH).toBe(1080);
    expect(PIZZA_PHOTO_OVERLAY_HEIGHT).toBe(1350);
    expect(PIZZA_PHOTO_OVERLAY_FILE_NAME).toBe("doughtools-pizza-bake.png");
    expect(overlayHelper).toContain("buildPizzaPhotoOverlayModel");
    expect(overlayHelper).toContain("cloudPizzaSessionDetailSummary(row)");
    expect(overlayHelper).toContain("PLANNED, BAKED, DELIVERED");
    expect(overlayHelper).toContain("WITH DOUGHTOOLS.APP");
    expect(overlayHelper).toContain("doughtools.app");
    expect(overlayHelper).not.toContain("CREATED WITH DOUGHTOOLS");
    expect(overlayHelper).not.toContain("Plan your ingredients, hydration and bake with DoughTools");
    expect(overlayHelper).not.toContain("www.doughtools.app");
    expect(overlayHelper).not.toContain("BAKED WITH A DOUGHTOOLS PLAN");
    expect(overlayHelper).not.toContain("Want to make pizza like this?");
    expect(overlayHelper).not.toContain("Plan your dough, fermentation and bake at doughtools.app");
    expect(overlayHelper).toContain("HYDRATION");
    expect(overlayHelper).toContain("FERMENTATION");
    expect(overlayHelper).toContain("FRIDGE");
    expect(overlayHelper).toContain("ROOM");
    expect(overlayHelper).toContain("FLOUR");
    expect(overlayHelper).toContain("`W ${flourW}`");
    expect(overlayHelper).toContain("BAKE");
    expect(overlayHelper).toContain("resolvePizzaSessionBakeProfile(session.ovenType ?? session.recipeSnapshot?.oven)?.overlayBakeTime");
    expect(overlayHelper).not.toContain("function bakeTimeValue");
    expect(overlayHelper).not.toContain("RATING");
    expect(overlayHelper).not.toContain("Dough balls");
    expect(overlayComponent).toContain("document.createElement(\"canvas\")");
    expect(overlayComponent).toContain("PIZZA_PHOTO_OVERLAY_WIDTH");
    expect(overlayComponent).toContain("PIZZA_PHOTO_OVERLAY_HEIGHT");
    expect(overlayComponent).toContain("drawCoverImage");
    expect(overlayComponent).toContain("leftGradient");
    expect(overlayComponent).toContain("footerGradient");
    expect(overlayComponent).toContain("strokeIcon");
    expect(overlayComponent).not.toContain("roundedRect");
    expect(overlayComponent).not.toContain("panelWidth = 318");
    expect(overlayComponent).toContain("model.fields.slice(0, 5)");
    expect(overlayComponent).toContain("rowHeight = 123");
    expect(overlayComponent).toContain("rgba(0, 0, 0, 0.58)");
    expect(overlayComponent).not.toContain("rgba(8, 24, 20, 0.52)");
    expect(overlayComponent).not.toContain("rgba(8, 24, 20, 0.48)");
    expect(overlayComponent).toContain("model.brand");
    expect(overlayComponent).toContain("model.title");
    expect(overlayComponent).toContain("footerY = 1188");
    expect(overlayComponent).toContain("model.footerLabel");
    expect(overlayComponent).toContain("model.footerMain");
    expect(overlayComponent).toContain("model.footerWebsite");
    expect(overlayComponent).not.toContain("model.footerQuestion");
    expect(overlayComponent).not.toContain("model.footerAction");
    expect(overlayComponent).not.toContain("model.ctaQuestion");
    expect(overlayComponent).not.toContain("model.ctaAction");
    expect(overlayComponent).not.toContain("cardY = 678");
    expect(overlayComponent).toContain("Preview share image");
    expect(overlayComponent).toContain("Download image");
    expect(overlayComponent).toContain("Share image");
    expect(overlayComponent).toContain("navigator.share");
    expect(overlayComponent).toContain("navigator.canShare");
    expect(overlayHelper).toContain("Download the image and upload it to Instagram.");
    expect(overlayComponent).toContain("PIZZA_PHOTO_OVERLAY_SHARE_FALLBACK");
    expect(overlayComponent).toContain("DoughTools branded pizza bake image");
    expect(overlayComponent).not.toContain("api.instagram");
    expect(overlayComponent).not.toContain("graph.instagram");
    expect(overlayComponent).not.toContain("supabase.storage");
  });
});
