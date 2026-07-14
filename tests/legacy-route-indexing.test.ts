import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("legacy predecessor route indexing", () => {
  it("has retired all rendered predecessor utility pages from legacy noindex layouts", () => {
    expect(existsSync(join(process.cwd(), "app", "coach", "layout.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib", "pizza-coach.ts"))).toBe(false);
  });

  it("keeps retired history as a server-side redirect without the old editorial page or metadata layout", () => {
    const page = source("app", "history", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "history", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "history", "layout.tsx"))).toBe(false);
    expect(page).toContain('permanentRedirect("/about")');
    expect(page).not.toContain("pizza-history");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("keeps retired gear as a server-side redirect without the old equipment page or metadata layout", () => {
    const page = source("app", "gear", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "gear", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "gear", "layout.tsx"))).toBe(false);
    expect(page).toContain('permanentRedirect("/ovens#other-equipment")');
    expect(page).not.toContain("doughtools-gear-v1");
    expect(page).not.toContain("gearItems");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("keeps retired doctor as a server-side redirect without the old diagnostic page or metadata layout", () => {
    const page = source("app", "doctor", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "doctor", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "doctor", "layout.tsx"))).toBe(false);
    expect(page).toContain('permanentRedirect("/guide/pizza-troubleshooting")');
    expect(page).not.toContain("diagnoseDough");
    expect(page).not.toContain("dough-doctor");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("keeps retired plan as a server-side redirect without the old planner page, storage or metadata layout", () => {
    const page = source("app", "plan", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "plan", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "plan", "layout.tsx"))).toBe(false);
    expect(page).toContain('permanentRedirect("/session/start")');
    expect(page).not.toContain("doughtools-active-plan-v1");
    expect(page).not.toContain("scheduleInstructions");
    expect(page).not.toContain("nextScheduledStep");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("keeps retired coach as a server-side redirect without the old advice page or metadata layout", () => {
    const page = source("app", "coach", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "coach", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "coach", "layout.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib", "pizza-coach.ts"))).toBe(false);
    expect(page).toContain('permanentRedirect("/guide/pizza-troubleshooting")');
    expect(page).not.toContain("buildCoachAdvice");
    expect(page).not.toContain("CoachGoal");
    expect(page).not.toContain("CoachIssue");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("removes normal product links to the retired history route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/history"');
    expect(linkedSurfaces).not.toContain('href: "/history"');
  });

  it("removes normal product links to the retired gear route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
      source("components", "guide", "PizzaTroubleshootingGuideClient.tsx"),
      source("lib", "pizza-style-education.ts"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/gear"');
    expect(linkedSurfaces).not.toContain('href: "/gear"');
    expect(linkedSurfaces).toContain("/ovens#other-equipment");
  });

  it("removes normal product links to the retired doctor route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
      source("lib", "recipe-workflow.ts"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/doctor"');
    expect(linkedSurfaces).not.toContain('href: "/doctor"');
    expect(linkedSurfaces).not.toContain("/doctor?");
    expect(linkedSurfaces).not.toContain("Dough Doctor");
    expect(linkedSurfaces).toContain("/guide/pizza-troubleshooting");
  });

  it("removes normal product links to the retired plan route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
      source("lib", "recipe-workflow.ts"),
      source("app", "timer", "page.tsx"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/plan"');
    expect(linkedSurfaces).not.toContain('href: "/plan"');
    expect(linkedSurfaces).not.toContain("/plan?");
    expect(linkedSurfaces).not.toContain("doughtools-active-plan-v1");
    expect(linkedSurfaces).not.toContain("Fermentation Planner");
    expect(linkedSurfaces).toContain("/session/start");
  });

  it("removes normal product links to the retired coach route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/coach"');
    expect(linkedSurfaces).not.toContain('href: "/coach"');
    expect(linkedSurfaces).not.toContain("/coach?");
    expect(linkedSurfaces).not.toContain("Pizza Coach");
    expect(linkedSurfaces).toContain("/guide/pizza-troubleshooting");
  });
});
