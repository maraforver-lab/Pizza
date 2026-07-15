import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import {
  cloudBackedPizzaSessionRowId,
} from "@/lib/cloud-pizza-session-client";
import {
  chooseCanonicalActivePizzaSession,
  deriveActiveSessionResumeRoute,
  resolveCanonicalActivePizzaSession,
} from "@/lib/canonical-active-pizza-session";
import { createPizzaSession, type PizzaSession } from "@/lib/pizza-session";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function cloudRowFor(session: PizzaSession) {
  return normalizeCloudPizzaSessionRow({
    id: `row-${session.id}`,
    user_id: "user-homepage",
    status: "in_progress",
    title: "Active pizza session",
    current_step: session.currentStep,
    session_data: session,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    completed_at: null,
  });
}

describe("homepage active Pizza Session resume", () => {
  it("uses the same pure helper to map active sessions to canonical resume routes", () => {
    const recipe = createPizzaSession({ id: "home-recipe", currentStep: "recipe" });
    const shopping = createPizzaSession({ id: "home-shopping", currentStep: "shopping" });
    const timeline = createPizzaSession({ id: "home-timeline", currentStep: "timeline" });
    const kitchen = createPizzaSession({
      id: "home-kitchen",
      currentStep: "prep",
      timeline: {
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    });
    const review = createPizzaSession({ id: "home-review", currentStep: "review" });

    expect(deriveActiveSessionResumeRoute(recipe)).toBe("/session/recipe");
    expect(deriveActiveSessionResumeRoute(shopping)).toBe("/session/shopping");
    expect(deriveActiveSessionResumeRoute(timeline)).toBe("/session/timeline");
    expect(deriveActiveSessionResumeRoute(kitchen)).toBe("/session/kitchen");
    expect(deriveActiveSessionResumeRoute(review)).toBe("/session/review");
  });

  it("returns the new-plan homepage action when no active local or cloud session exists", () => {
    expect(chooseCanonicalActivePizzaSession(null, null, false)).toEqual({
      state: "empty",
      session: null,
      source: "none",
      cloudRow: null,
    });
  });

  it("resolves cloud-only active sessions to their real progress route", () => {
    const cloudSession = createPizzaSession({
      id: "cloud-only-homepage",
      currentStep: "shopping",
      updatedAt: "2026-07-15T09:30:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    });
    const row = cloudRowFor(cloudSession);

    const decision = chooseCanonicalActivePizzaSession(null, row, true);

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.session?.currentStep).toBe("shopping");
  });

  it("does not let a newer unrelated local session override a signed-in cloud active session", () => {
    const local = createPizzaSession({
      id: "newer-local-homepage",
      currentStep: "prep",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
      timeline: {
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    });
    const staleCloud = createPizzaSession({
      id: "older-cloud-homepage",
      currentStep: "recipe",
      updatedAt: "2026-07-15T09:30:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    });

    const decision = chooseCanonicalActivePizzaSession(local, cloudRowFor(staleCloud), true);

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.session?.id).toBe("older-cloud-homepage");
    expect(decision.session?.currentStep).toBe("recipe");
  });

  it("allows a newer local cache only when it is the same logical cloud session", () => {
    const local = createPizzaSession({
      id: "same-canonical-session",
      currentStep: "prep",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
      timeline: {
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    });
    const staleCloud = createPizzaSession({
      ...local,
      currentStep: "recipe",
      updatedAt: "2026-07-15T09:30:00.000Z",
    });

    const decision = chooseCanonicalActivePizzaSession(local, cloudRowFor(staleCloud), true);

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("local-cache");
    expect(decision.session?.id).toBe("same-canonical-session");
    expect(decision.session?.currentStep).toBe("prep");
  });

  it("restores a signed-in cloud active session over a newer unrelated local session", async () => {
    const storage = new MemoryStorage();
    const local = createAndSavePizzaSession({
      id: "newer-unrelated-local",
      currentStep: "prep",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
      timeline: {
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    }, storage, new Date("2026-07-15T10:00:00.000Z"));
    setActivePizzaSession(local.id, storage);
    const cloud = createPizzaSession({
      id: "older-cloud-authority",
      currentStep: "shopping",
      updatedAt: "2026-07-15T09:30:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    });
    const row = cloudRowFor(cloud)!;
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ session: row }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;

    const decision = await resolveCanonicalActivePizzaSession({
      fetcher,
      getSignedInUser: async () => true,
      storage,
    });

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.session?.id).toBe("older-cloud-authority");
    expect(getActivePizzaSession(storage)?.id).toBe("older-cloud-authority");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("promotes an anonymous local session when a signed-in user has no cloud active session", async () => {
    const storage = new MemoryStorage();
    const local = createAndSavePizzaSession({
      id: "local-promote-authority",
      currentStep: "timeline",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    }, storage, new Date("2026-07-15T10:00:00.000Z"));
    setActivePizzaSession(local.id, storage);
    const row = cloudRowFor(local)!;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ session: row }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ session: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const decision = await resolveCanonicalActivePizzaSession({
      fetcher,
      getSignedInUser: async () => true,
      storage,
    });

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("promoted-local");
    expect(decision.session?.id).toBe("local-promote-authority");
    expect(cloudBackedPizzaSessionRowId(decision.session, storage)).toBe(row.id);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("uses the authenticated browser token for cloud lookup and local promotion", async () => {
    const storage = new MemoryStorage();
    const local = createAndSavePizzaSession({
      id: "local-promote-with-token",
      currentStep: "recipe",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    }, storage, new Date("2026-07-15T10:00:00.000Z"));
    setActivePizzaSession(local.id, storage);
    const row = cloudRowFor(local)!;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer signed-in-token");
      if (init?.method === "POST") {
        expect(headers.get("Content-Type")).toBe("application/json");
        return new Response(JSON.stringify({ session: row }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ session: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const decision = await resolveCanonicalActivePizzaSession({
      fetcher,
      getSignedInUser: async () => ({
        headers: { Authorization: "Bearer signed-in-token" },
        signedIn: true,
      }),
      storage,
    });

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("promoted-local");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("lets a fresher cloud active session replace the homepage resume target", () => {
    const local = createPizzaSession({
      id: "older-local-homepage",
      currentStep: "recipe",
      updatedAt: "2026-07-15T09:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    });
    const cloud = createPizzaSession({
      id: "newer-cloud-homepage",
      currentStep: "review",
      updatedAt: "2026-07-15T10:00:00.000Z",
      createdAt: "2026-07-15T09:00:00.000Z",
    });

    const decision = chooseCanonicalActivePizzaSession(local, cloudRowFor(cloud), true);

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.session?.id).toBe("newer-cloud-homepage");
    expect(decision.session?.currentStep).toBe("review");
  });

  it("keeps homepage mobile and desktop actions on one shared resolver and confirmation contract", () => {
    const homepage = source("app/page.tsx");
    const actions = source("components/HomepageSessionActions.tsx");

    expect(homepage).toContain("HomepageSessionActions");
    expect(homepage).toContain("includeWorkflowLink");
    expect(homepage).toContain('variant="hero"');
    expect(homepage).toContain('variant="final"');
    expect(homepage).not.toContain("ContinuePizzaSessionCard");
    expect(actions).toContain("resolveCanonicalActivePizzaSession");
    expect(actions).toContain("Checking your pizza");
    expect(actions).toContain("hasActiveSession && !showChecking");
    expect(actions).toContain("Continue my pizza");
    expect(actions).toContain("Plan my new pizza");
    expect(actions).toContain("Start a new pizza");
    expect(actions).toContain("Start a new pizza?");
    expect(actions).toContain("Keep current session");
    expect(actions).toContain("Start new pizza");
    expect(actions).toContain("data-homepage-session-source");
    expect(actions).not.toMatch(/matchMedia|innerWidth|innerHeight/);
  });

  it("keeps homepage and calculator cards on the shared canonical resolver", () => {
    const actions = source("components/HomepageSessionActions.tsx");
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");

    expect(actions).toContain("resolveCanonicalActivePizzaSession()");
    expect(actions).toContain('data-homepage-primary-session-action="error"');
    expect(continueCard).toContain("resolveCanonicalActivePizzaSession()");
    expect(continueCard).not.toContain("resolveHomepageActiveSession");
  });
});
