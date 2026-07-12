import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeCloudPizzaSessionHistoryRow } from "@/lib/cloud-pizza-sessions";
import { buildPizzaPhotoOverlayModel } from "@/lib/pizza-photo-overlay";
import { createPizzaSession, migratePizzaSession, serializePizzaSession } from "@/lib/pizza-session";
import { createAndSavePizzaSession, getActivePizzaSession, setActivePizzaSession } from "@/lib/pizza-session-storage";
import { generatePizzaSessionTimeline } from "@/lib/pizza-session-timeline";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function minutesBetween(a: string, b: string) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 60_000);
}

function baseSessionInput(ovenType: "home" | "gas", pizzaStyle: "home-oven" | "pizza-oven") {
  return {
    id: `${ovenType}-audit-session`,
    currentStep: "recipe" as const,
    pizzaStyle,
    pizzaPreset: "margherita",
    pizzaCount: 4,
    targetEatTime: "2026-07-18T18:00:00.000Z",
    ovenType,
    flour: "tipo-00",
    experienceLevel: "enthusiast" as const,
  };
}

describe("Patch 309 Home oven behavior audit anchors", () => {
  it("persists and migrates the selected Home oven path without rewriting it", () => {
    const storage = new MemoryStorage();
    const saved = createAndSavePizzaSession(baseSessionInput("home", "home-oven"), storage);
    setActivePizzaSession(saved.id, storage);

    const active = getActivePizzaSession(storage);
    expect(active?.pizzaStyle).toBe("home-oven");
    expect(active?.ovenType).toBe("home");

    const migrated = migratePizzaSession(JSON.parse(serializePizzaSession(saved)));
    expect(migrated?.pizzaStyle).toBe("home-oven");
    expect(migrated?.ovenType).toBe("home");
  });

  it("maps Home oven into existing recipe defaults while Pizza oven keeps gas defaults", () => {
    const homeRecipe = buildSessionRecipe(createPizzaSession(baseSessionInput("home", "home-oven")));
    const gasRecipe = buildSessionRecipe(createPizzaSession(baseSessionInput("gas", "pizza-oven")));

    expect(homeRecipe.ok).toBe(true);
    expect(gasRecipe.ok).toBe(true);
    if (!homeRecipe.ok || !gasRecipe.ok) return;

    expect(homeRecipe.settings.ovenType).toBe("home");
    expect(homeRecipe.settings.ballWeight).toBe(270);
    expect(homeRecipe.settings.fermentation).toBe("24h-cold");
    expect(homeRecipe.recipeSnapshot.oven).toBe("home");

    expect(gasRecipe.settings.ovenType).toBe("gas");
    expect(gasRecipe.settings.ballWeight).toBe(260);
    expect(gasRecipe.settings.fermentation).toBe("12h-room");
    expect(gasRecipe.recipeSnapshot.oven).toBe("gas");
  });

  it("keeps Timeline preheat and bake offsets generic for Home and Pizza oven sessions", () => {
    const now = new Date("2026-07-15T09:00:00.000Z");
    const homeTimeline = generatePizzaSessionTimeline(createPizzaSession(baseSessionInput("home", "home-oven")), now);
    const gasTimeline = generatePizzaSessionTimeline(createPizzaSession(baseSessionInput("gas", "pizza-oven")), now);

    expect(homeTimeline.ok).toBe(true);
    expect(gasTimeline.ok).toBe(true);
    if (!homeTimeline.ok || !gasTimeline.ok) return;

    for (const timeline of [homeTimeline.timeline, gasTimeline.timeline]) {
      const target = timeline.targetEatTime!;
      expect(minutesBetween(timeline.steps.find((step) => step.id === "preheat-oven")!.scheduledAt, target)).toBe(-60);
      expect(minutesBetween(timeline.steps.find((step) => step.id === "bake-pizza")!.scheduledAt, target)).toBe(-15);
    }
  });

  it("documents that Kitchen Mode oven service copy is generic rather than oven-type specific", () => {
    const kitchen = source("lib/pizza-session-kitchen.ts");

    expect(kitchen).toContain("Preheat the oven, stone, steel or pizza oven before opening the dough.");
    expect(kitchen).toContain("Open, top and bake one pizza at a time. Watch color and rotate if needed.");
    expect(kitchen).not.toContain("session.ovenType === \"home\"");
    expect(kitchen).not.toContain("session.ovenType === \"gas\"");
  });

  it("documents current overlay bake-time values as a separate hard-coded source", () => {
    const home = normalizeCloudPizzaSessionHistoryRow({
      id: "home-overlay-audit",
      user_id: "user-1",
      status: "completed",
      title: "Completed pizza session",
      current_step: "review",
      session_data: createPizzaSession({
        ...baseSessionInput("home", "home-oven"),
        status: "completed",
        currentStep: "review",
        recipeSnapshot: { hydration: 64, fermentation: "24h-cold", oven: "home" },
        photo: {
          path: "user-1/home-overlay-audit/photo.webp",
          url: "https://example.test/home.webp",
          uploadedAt: "2026-07-18T18:30:00.000Z",
          contentType: "image/webp",
          size: 100_000,
        },
      }),
      created_at: "2026-07-18T18:00:00.000Z",
      updated_at: "2026-07-18T18:30:00.000Z",
      completed_at: "2026-07-18T18:30:00.000Z",
    })!;

    const fields = buildPizzaPhotoOverlayModel(home)?.fields ?? [];
    expect(fields.find((field) => field.label === "BAKE")?.value).toBe("5 MIN");

    const overlaySource = source("lib/pizza-photo-overlay.ts");
    expect(overlaySource).toContain("return \"5 MIN\"");
    expect(overlaySource).toContain("return \"90 SEC\"");
  });
});
