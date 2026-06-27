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
    expect(component).toContain("GuidanceModeBadge");
    expect(component).toContain("desktopAside");
  });

  it("adds a passive local-only note that is not rendered as a button", () => {
    const component = source("components/session/SessionLocalOnlyNote.tsx");

    expect(component).toContain("export function SessionLocalOnlyNote");
    expect(component).toContain("children");
    expect(component).not.toContain("<button");
    expect(component).not.toContain("role=\"button\"");
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
    }
  });
});
