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
  cloudPizzaSessionDetailSummary,
  cloudPizzaSessionDoughSummary,
  cloudPizzaSessionHistorySummary,
  cloudPizzaSessionPayload,
  cloudPizzaSessionSummary,
  cloudPizzaSessionUpdatedLabel,
  normalizeCloudPizzaSessionHistoryRow,
  normalizeCloudPizzaSessionRow,
  sortCloudPizzaSessionHistoryRows,
} from "@/lib/cloud-pizza-sessions";
import {
  PIZZA_PHOTO_OVERLAY_FILE_NAME,
  PIZZA_PHOTO_OVERLAY_SIZE,
  buildPizzaPhotoOverlayModel,
} from "@/lib/pizza-photo-overlay";
import { createPizzaSession } from "@/lib/pizza-session";
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
      title: "PIZZA BAKE LOG",
      footerLabel: "BAKED WITH A DOUGHTOOLS PLAN",
      footerQuestion: "Want to make pizza like this?",
      footerAction: "Plan your dough, fermentation and bake at doughtools.app",
      fields: [
        { label: "HYDRATION", value: "64%" },
        { label: "FERMENTATION", value: "48H COLD" },
        { label: "FRIDGE", value: "4°C" },
        { label: "FLOUR W", value: "260–300" },
        { label: "RATING", value: "5/5" },
      ],
    });
    expect(buildPizzaPhotoOverlayModel(history)?.fields.some((field) => field.label === "Dough balls")).toBe(false);
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
    ]);
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
    const detailRoute = source("app/api/pizza-sessions/history/[id]/route.ts");
    const photoRoute = source("app/api/pizza-sessions/history/[id]/photo/route.ts");
    const historyComponent = source("components/account/AccountPizzaSessionHistory.tsx");
    const detailPage = source("app/account/pizza-sessions/[id]/page.tsx");
    const detailComponent = source("components/account/CompletedPizzaSessionDetail.tsx");
    const overlayComponent = source("components/account/PizzaPhotoOverlayGenerator.tsx");
    const overlayHelper = source("lib/pizza-photo-overlay.ts");
    const photoHelper = source("lib/pizza-session-photo.ts");
    const photoOptimizer = source("lib/pizza-session-photo-optimizer.ts");

    expect(accountPage).toContain("AccountPizzaSessionHistory");
    expect(accountPage).toContain("<AccountPizzaSessionHistory enabled={Boolean(user)} />");
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
    expect(historyComponent).toContain("current.filter((session) => session.id !== sessionId)");
    expect(historyComponent).toContain("Pizza session history");
    expect(source("lib/cloud-pizza-sessions.ts")).toContain('title: "Completed pizza session"');
    expect(historyComponent).toContain("summary.doughLine");
    expect(historyComponent).toContain("summary.hydrationLine");
    expect(historyComponent).toContain("summary.fermentationLine");
    expect(historyComponent).toContain("summary.reviewLine");
    expect(historyComponent).toContain("summary.bakeLine");
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
    expect(detailComponent).toContain("cloudPizzaSessionDetailSummary(session)");
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
    expect(overlayHelper).toContain("PIZZA_PHOTO_OVERLAY_SIZE = 1080");
    expect(PIZZA_PHOTO_OVERLAY_SIZE).toBe(1080);
    expect(PIZZA_PHOTO_OVERLAY_FILE_NAME).toBe("doughtools-pizza-bake.png");
    expect(overlayHelper).toContain("buildPizzaPhotoOverlayModel");
    expect(overlayHelper).toContain("cloudPizzaSessionDetailSummary(row)");
    expect(overlayHelper).toContain("BAKED WITH A DOUGHTOOLS PLAN");
    expect(overlayHelper).toContain("Want to make pizza like this?");
    expect(overlayHelper).toContain("Plan your dough, fermentation and bake at doughtools.app");
    expect(overlayHelper).toContain("HYDRATION");
    expect(overlayHelper).toContain("FERMENTATION");
    expect(overlayHelper).toContain("FRIDGE");
    expect(overlayHelper).toContain("ROOM");
    expect(overlayHelper).toContain("FLOUR W");
    expect(overlayHelper).toContain("RATING");
    expect(overlayHelper).not.toContain("Dough balls");
    expect(overlayComponent).toContain("document.createElement(\"canvas\")");
    expect(overlayComponent).toContain("PIZZA_PHOTO_OVERLAY_SIZE");
    expect(overlayComponent).toContain("drawCoverImage");
    expect(overlayComponent).toContain("leftGradient");
    expect(overlayComponent).toContain("panelWidth = 286");
    expect(overlayComponent).toContain("panelHeight = 908");
    expect(overlayComponent).toContain("rgba(9, 29, 23, 0.48)");
    expect(overlayComponent).toContain("rgba(9, 41, 31, 0.18)");
    expect(overlayComponent).toContain("model.brand");
    expect(overlayComponent).toContain("model.title");
    expect(overlayComponent).toContain("footerY = 900");
    expect(overlayComponent).toContain("footerHeight = 118");
    expect(overlayComponent).toContain("model.footerLabel");
    expect(overlayComponent).toContain("model.footerQuestion");
    expect(overlayComponent).toContain("model.footerAction");
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
