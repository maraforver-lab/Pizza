import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Oven Guide", () => {
  it("simplifies /ovens into a two-path Home oven and Pizza oven learning guide", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).toContain("OvenGuideHero");
    expect(hero).toContain("Oven Guide");
    expect(hero).toContain("Home oven or pizza oven?");
    expect(hero).toContain("Compare the ovens");
    expect(hero).toContain("See common mistakes");
    expect(page).toContain("Home oven vs Pizza oven");
    expect(page).toContain("Two heat environments. Two different workflows.");
    expect(page).toContain("What changes");
    expect(page).toContain("Setup and preheat");
    expect(page).toContain("Common mistakes");
    expect(page).toContain("Which one fits your goal?");
    expect(page).toContain("Ready to plan for your oven?");
  });

  it("removes the previous encyclopedia-style page complexity from the rendered page", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).not.toContain("HeatBalanceDiagram");
    expect(page).not.toContain("OvenEnvironmentComparison");
    expect(page).not.toContain("OvenEnvironmentChapter");
    expect(page).not.toContain("PreheatTimeline");
    expect(page).not.toContain("OvenProblemGuide");
    expect(page).not.toContain("OvenStyleFit");
    expect(page).not.toContain("<RelatedLearning");
    expect(page).not.toContain("What users struggle with most");
    expect(page).not.toContain("Sources and communities");
    expect(page).not.toContain("Measure the surface you actually launch on.");
  });

  it("keeps product truth limited to existing Home oven and Pizza oven planner categories", () => {
    const sessionStart = source("app", "session", "start", "page.tsx");
    const bakeProfile = source("lib", "pizza-session-bake-profile.ts");

    expect(pizzaSessionOvenSupportSummary).toContain("Home oven and Pizza oven");
    expect(pizzaSessionOvenSupportSummary).toContain("without adding brands, models or extra planner presets");
    expect(sessionStart).toContain('id: "pizza-oven"');
    expect(sessionStart).toContain('id: "home-oven"');
    expect(sessionStart).not.toContain('id: "steel"');
    expect(sessionStart).not.toContain('id: "stone"');
    expect(sessionStart).not.toContain('id: "indoor-high-heat"');
    expect(bakeProfile).toContain('ovenType: "home"');
    expect(bakeProfile).toContain('ovenType: "pizza"');

    expect(getPizzaSessionBakeProfile("home").overlayBakeTime).toBe("5 MIN");
    expect(getPizzaSessionBakeProfile("gas").overlayBakeTime).toBe("90 SEC");
  });

  it("keeps the comparison concise and free of brands, models, rankings and affiliate links", () => {
    const pageAndHero = [source("app", "ovens", "page.tsx"), source("components", "ovens", "OvenGuideHero.tsx")].join("\n");

    expect(pageAndHero).not.toMatch(/Ooni|Gozney|Effeuno|Witt|Cozze|Chef Matteo|Koda|Arc XL|Tread|Rotante|Dome|P134H/i);
    expect(pageAndHero).not.toMatch(/affiliate|paid ranking|best pizza oven|price bands|Amazon/i);
    expect(pageAndHero).not.toContain("target=\"_blank\"");
    expect(pageAndHero).not.toContain("http");
    expect(pageAndHero).not.toContain("recommendOvens");
    expect(pageAndHero).not.toContain("Total oven budget");
    expect(pageAndHero).not.toContain("Manufacturer details");
  });

  it("uses one local oven hero image with explicit dimensions, alt text and responsive loading", () => {
    const hero = source("components", "ovens", "OvenGuideHero.tsx");
    const assetPath = join(process.cwd(), "public", "ovens", "home-vs-pizza-oven.webp");

    expect(existsSync(assetPath)).toBe(true);
    expect(statSync(assetPath).size).toBeGreaterThan(50_000);
    expect(hero).toContain('src="/ovens/home-vs-pizza-oven.webp"');
    expect(hero).toContain("width={1756}");
    expect(hero).toContain("height={896}");
    expect(hero).toContain("sizes=");
    expect(hero).toContain("Home oven and high-heat pizza oven shown side by side");
    expect(hero).not.toMatch(/person|people|hands|chef|logo|brand/i);
    expect(hero).not.toMatch(/https?:\/\/.*\.(webp|png|jpe?g)/i);
  });

  it("keeps the comparison responsive without horizontal tables or post-footer content", () => {
    const page = source("app", "ovens", "page.tsx");
    const workflowNextStep = source("components", "WorkflowNextStep.tsx");

    expect(page).toContain("sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]");
    expect(page).not.toContain("<table");
    expect(page).toContain("SiteFooter");
    expect(workflowNextStep).not.toContain('"/ovens"');
  });

  it("retains only the practical common mistakes and deeper troubleshooting link", () => {
    const page = source("app", "ovens", "page.tsx");

    for (const title of [
      "Base is pale or soft",
      "Top browns before the base",
      "Pizza dries during the bake",
      "Scorched rim, undercooked center",
      "Burnt base with pale top",
      "Later pizzas bake worse",
    ]) {
      expect(page).toContain(title);
    }

    expect(page).toContain("/guide/pizza-troubleshooting");
    expect(page).toContain("What you see:");
    expect(page).toContain("Likely reason:");
    expect(page).toContain("What to change:");
  });

  it("keeps concise setup, surface and safety guidance without becoming a gear guide", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Preheat thoroughly at the highest safe setting.");
    expect(page).toContain("Heat the floor, not only the air or flame.");
    expect(page).toContain("Steel");
    expect(page).toContain("Stone");
    expect(page).toContain("Pan");
    expect(page).toContain("Small safety note");
    expect(page).toContain("Follow your equipment manufacturer");
    expect(page).toContain("Use outdoor-only ovens outdoors.");
    expect(page).not.toContain("Do not modify fuel, ventilation or safety systems.");
    expect(page).not.toContain("infrared thermometer guide");
  });

  it("uses one final primary CTA and keeps related links secondary", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Ready to plan for your oven?");
    expect(page).toContain('href="/session/start"');
    expect(page).toContain("Plan my next pizza");
    expect(page).toContain('href="/guides/dough"');
    expect(page).toContain('href="/toppings"');
    expect(page).not.toContain("Compare pizza styles");
  });

  it("updates SEO positioning without changing indexing policy", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Home Oven vs Pizza Oven: Heat, Baking and Pizza Results | DoughTools");
    expect(seo).toContain("Compare Home oven and Pizza oven baking paths, including heat, bake time, topping moisture");
    expect(seo).toContain("ALLOW_INDEXING");
    expect(seo).not.toContain("Compare electric ovens, gas pizza ovens and other common pizza oven setups with practical trade-offs.");
  });

  it("preserves learning architecture and accessible section semantics", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).toContain("LearningBreadcrumbs");
    expect(page).toContain('id="oven-comparison"');
    expect(page).toContain('id="common-oven-mistakes"');
    expect(page).toContain("aria-labelledby");
    expect(hero).toContain("alt=");
    expect(hero).toContain("priority");
  });
});
