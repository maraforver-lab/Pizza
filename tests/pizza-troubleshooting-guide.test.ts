import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const troubleshootingRoute = "app/guide/pizza-troubleshooting/page.tsx";

describe("Pizza Troubleshooting Guide", () => {
  it("adds the standalone guide route with the requested title and subtitle", () => {
    expect(existsSync(join(process.cwd(), troubleshootingRoute))).toBe(true);

    const page = source(troubleshootingRoute);

    expect(page).toContain("Pizza Troubleshooting Guide");
    expect(page).toContain(
      "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
    );
    expect(page).toContain("Pizza usually goes wrong for a reason");
  });

  it("renders all four troubleshooting section headings", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("Dough and fermentation");
    expect(page).toContain("Shaping and launching");
    expect(page).toContain("Baking and toppings");
    expect(page).toContain("Home oven problems");
  });

  it("renders all ten requested problem titles", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("Dough is not rising");
    expect(page).toContain("Dough is too sticky");
    expect(page).toContain("Dough springs back");
    expect(page).toContain("Dough tears or gets holes");
    expect(page).toContain("Pizza sticks to the peel");
    expect(page).toContain("Pizza is soggy in the middle");
    expect(page).toContain("Crust burns but middle is doughy");
    expect(page).toContain("Base burns underneath");
    expect(page).toContain("Toppings release too much water");
    expect(page).toContain("Home oven pizza is pale or soft");
  });

  it("uses the requested problem-card fields", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("What you see");
    expect(page).toContain("Likely causes");
    expect(page).toContain("Fix it now");
    expect(page).toContain("Prevent it next time");
  });

  it("uses lightweight CSS-based guide visuals without remote images", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("function VisualPanel");
    expect(page).toContain("radial-gradient");
    expect(page).toContain("aria-hidden=\"true\"");
    expect(page).not.toContain("http://");
    expect(page).not.toContain("https://");
  });

  it("links the troubleshooting guide from the existing Guide index", () => {
    const guide = source("app/guide/page.tsx");

    expect(guide).toContain("Pizza Troubleshooting Guide");
    expect(guide).toContain(
      "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
    );
    expect(guide).toContain('href="/guide/pizza-troubleshooting"');
  });

  it("keeps Pizza Session pages free of troubleshooting guide content", () => {
    const sessionPages = [
      "app/session/start/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ];

    for (const pagePath of sessionPages) {
      const page = source(pagePath);
      expect(page).not.toContain("Pizza Troubleshooting Guide");
      expect(page).not.toContain("/guide/pizza-troubleshooting");
    }
  });
});
