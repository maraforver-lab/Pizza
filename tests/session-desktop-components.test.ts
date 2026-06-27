import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Pizza Session desktop refinement components", () => {
  it("adds a shared SessionStepHero for V2 step context", () => {
    const component = source("components/session/SessionStepHero.tsx");

    expect(component).toContain("export function SessionStepHero");
    expect(component).toContain("Step {step} of 10");
    expect(component).toContain("{label}");
    expect(component).toContain("{pageType}");
    expect(component).toContain("{title}");
    expect(component).toContain("{body}");
    expect(component).toContain("desktopAside");
    expect(component).toContain("getExperienceLevelCornerAccentStyle");
    expect(component).toContain("const levelAccent = level ? getExperienceLevelCornerAccentStyle(level) : undefined");
    expect(component).not.toContain("GuidanceModeBadge");
    expect(component).not.toContain("Pizza Session V2");
  });

  it("adds a passive local-only note that is not rendered as a button", () => {
    const component = source("components/session/SessionLocalOnlyNote.tsx");

    expect(component).toContain("export function SessionLocalOnlyNote");
    expect(component).toContain("children");
    expect(component).not.toContain("<button");
    expect(component).not.toContain("role=\"button\"");
  });

  it("adds a shared viewport reset for session route and step openings", () => {
    const component = source("components/session/SessionViewportReset.tsx");
    const emptyState = source("components/session/SessionEmptyState.tsx");

    expect(component).toContain("export function SessionViewportReset");
    expect(component).toContain("usePathname");
    expect(component).toContain("watchKey");
    expect(component).toContain('window.history.scrollRestoration = "manual"');
    expect(component).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
    expect(component).toContain("window.requestAnimationFrame(reset)");
    expect(emptyState).toContain("SessionViewportReset");
  });

  it("uses the shared desktop step hero on Pizza Session steps 6 through 10", () => {
    const pages = [
      "app/session/recipe/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ];

    for (const pagePath of pages) {
      const page = source(pagePath);
      expect(page).toContain("SessionStepHero");
      expect(page).toContain("SessionViewportReset");
    }
  });
});
