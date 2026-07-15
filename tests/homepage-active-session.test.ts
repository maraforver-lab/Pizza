import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import {
  deriveActiveSessionResumeRoute,
  resolveHomepageActiveSession,
} from "@/lib/homepage-active-session";
import { createPizzaSession, type PizzaSession } from "@/lib/pizza-session";

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
    expect(resolveHomepageActiveSession(null, null)).toEqual({
      state: "empty",
      session: null,
      source: null,
      href: "/session/start",
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

    const decision = resolveHomepageActiveSession(null, row);

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.href).toBe("/session/shopping");
  });

  it("does not let stale cloud data override a newer local active session", () => {
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

    const decision = resolveHomepageActiveSession(local, cloudRowFor(staleCloud));

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("local");
    expect(decision.session.id).toBe("newer-local-homepage");
    expect(decision.href).toBe("/session/kitchen");
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

    const decision = resolveHomepageActiveSession(local, cloudRowFor(cloud));

    expect(decision.state).toBe("active");
    expect(decision.source).toBe("cloud");
    expect(decision.session.id).toBe("newer-cloud-homepage");
    expect(decision.href).toBe("/session/review");
  });

  it("keeps homepage mobile and desktop actions on one shared resolver and confirmation contract", () => {
    const homepage = source("app/page.tsx");
    const actions = source("components/HomepageSessionActions.tsx");

    expect(homepage).toContain("HomepageSessionActions");
    expect(homepage).toContain("includeWorkflowLink");
    expect(homepage).toContain('variant="hero"');
    expect(homepage).toContain('variant="final"');
    expect(homepage).not.toContain("ContinuePizzaSessionCard");
    expect(actions).toContain("resolveHomepageActiveSession(localSession, cloudRow)");
    expect(actions).toContain("resolveHomepageActiveSession(localSession, null)");
    expect(actions).toContain("Checking your pizza");
    expect(actions).toContain("hasActiveSession && !showChecking");
    expect(actions).toContain("Continue my pizza");
    expect(actions).toContain("Plan my new pizza");
    expect(actions).toContain("Start a new pizza");
    expect(actions).toContain("Start a new pizza?");
    expect(actions).toContain("Keep current session");
    expect(actions).toContain("Start new pizza");
    expect(actions).toContain("restoreCloudPizzaSessionToLocal(decision.cloudRow)");
    expect(actions).toContain("data-homepage-session-source");
    expect(actions).not.toMatch(/matchMedia|innerWidth|innerHeight/);
  });

  it("keeps cloud fetch errors from destroying a local homepage continuation", () => {
    const actions = source("components/HomepageSessionActions.tsx");
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");

    expect(actions).toContain("setDecision(resolveHomepageActiveSession(localSession, null))");
    expect(continueCard).toContain("setSession(localSession)");
    expect(continueCard).toContain("resolveHomepageActiveSession(localSession, row)");
    expect(continueCard).toContain("clearCloudBackedPizzaSession()");
    expect(continueCard).not.toContain("clearCloudBackedActivePizzaSessionPointer");
  });
});
