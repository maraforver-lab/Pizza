import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Oven Guide", () => {
  it("makes /ovens a practical Home oven and Pizza oven comparison", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).toContain("OvenGuideHero");
    expect(hero).toContain("Baking guides");
    expect(hero).toContain("Home oven or pizza oven?");
    expect(hero).toContain("Compare the heat, preheat, placement, bake time and result");
    expect(page).toContain("Pick the oven path that matches your real heat");
    expect(page).toContain("Bake instructions");
    expect(page).toContain("Pizza oven");
    expect(page).toContain("Home oven");
    expect(page).toContain("Stone, steel and tray");
    expect(page).toContain("Pizza plan effect");
    expect(page).toContain("Plan with the oven you actually have.");
  });

  it("removes the previous encyclopedia-style page complexity from the rendered page", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).not.toContain("HeatBalanceDiagram");
    expect(page).not.toContain("OvenEnvironmentComparison");
    expect(page).not.toContain("OvenEnvironmentChapter");
    expect(page).not.toContain("PreheatTimeline");
    expect(page).not.toContain("OvenProblemGuide");
    expect(page).not.toContain("OvenStyleFit");
    expect(page).not.toContain("<RelatedLearning");
    expect(page).not.toContain("What users struggle with most");
    expect(page).not.toContain("Sources and communities");
    expect(hero).not.toContain("Compare the ovens");
    expect(hero).not.toContain("See common mistakes");
  });

  it("keeps product truth limited to existing Home oven and Pizza oven planner categories", () => {
    const page = source("app", "ovens", "page.tsx");
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
    expect(page).toContain("getPizzaSessionBakeProfile");
    expect(page).toContain("homeProfile.preheatDurationMinutes");
    expect(page).toContain("pizzaProfile.preheatDurationMinutes");
    expect(page).toContain("homeProfile.bakeTimeLabel");
    expect(page).toContain("pizzaProfile.bakeTimeLabel");

    expect(getPizzaSessionBakeProfile("home")).toMatchObject({
      preheatDurationMinutes: 75,
      bakeTimeLabel: "about 5 min",
      overlayBakeTime: "5 MIN",
    });
    expect(getPizzaSessionBakeProfile("gas")).toMatchObject({
      preheatDurationMinutes: 60,
      bakeTimeLabel: "60–90 sec",
      overlayBakeTime: "90 SEC",
    });
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

    expect(page).toContain("lg:grid-cols-2");
    expect(page).not.toContain("<table");
    expect(page).toContain("overflow-x-clip");
    expect(page).toContain("SiteFooter");
    expect(page.indexOf("Plan with the oven you actually have.")).toBeLessThan(page.indexOf("<SiteFooter />"));
  });

  it("retains compact practical troubleshooting and a deeper troubleshooting link", () => {
    const page = source("app", "ovens", "page.tsx");

    for (const title of [
      "Pale or soft base",
      "Burnt base, pale top",
      "Top burns first",
      "Later pizzas get worse",
    ]) {
      expect(page).toContain(title);
    }

    expect(page).toContain("/guide/pizza-troubleshooting");
    expect(page).toContain("Use the baked pizza as feedback.");
  });

  it("keeps concise setup, surface and safety guidance without becoming a gear guide", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Preheat the surface, place the pizza deliberately");
    expect(page).toContain("judge the floor, not only the flame");
    expect(page).toContain("Steel");
    expect(page).toContain("Stone");
    expect(page).toContain("Tray");
    expect(page).toContain("Safety checks");
    expect(page).toContain("Follow your own appliance manual");
    expect(page).toContain("Use outdoor-only ovens outdoors.");
    expect(page).not.toContain("Do not modify fuel, ventilation or safety systems.");
    expect(page).not.toContain("infrared thermometer guide");
  });

  it("adds compact disclosed equipment guidance without reviving the retired gear page", () => {
    const page = source("app", "ovens", "page.tsx");
    const otherEquipmentIndex = page.indexOf('id="other-equipment"');
    const finalCtaIndex = page.indexOf("Plan with the oven you actually have.");
    const footerIndex = page.indexOf("<SiteFooter />");

    expect(otherEquipmentIndex).toBeGreaterThan(-1);
    expect(otherEquipmentIndex).toBeGreaterThan(page.indexOf("Pizza plan effect"));
    expect(otherEquipmentIndex).toBeLessThan(finalCtaIndex);
    expect(finalCtaIndex).toBeLessThan(footerIndex);
    expect(page.match(/<details/g)).toHaveLength(1);
    expect(page.match(/<summary/g)).toHaveLength(1);
    expect(page).toContain("Show more equipment");
    expect(page).toContain("Essential");
    expect(page).toContain("Useful");
    expect(page).toContain("Optional");
    expect(page).toContain("Oven fit");
    expect(page).toContain("Beginner need");
    expect(page).toContain("Use or safety note");
    expect(page).toContain("Digital scale");
    expect(page).toContain("Launching peel");
    expect(page).toContain("Fire blanket and heat gloves");
    expect(page).not.toContain("doughtools-gear-v1");
    expect(page).not.toContain("gearItems");
  });

  it("uses one final route primary CTA and keeps related links secondary", () => {
    const page = source("app", "ovens", "page.tsx");
    const routeContentBeforeFooter = page.slice(0, page.indexOf("<SiteFooter />"));

    expect(routeContentBeforeFooter).toContain("Plan with the oven you actually have.");
    expect(routeContentBeforeFooter).toContain('href="/session/start"');
    expect(routeContentBeforeFooter).toContain("Plan a pizza");
    expect(routeContentBeforeFooter.match(/href="\/session\/start"/g)).toHaveLength(1);
    expect(page).toContain('href="/guides/dough"');
    expect(page).toContain('href="/toppings"');
    expect(page).not.toContain("Compare pizza styles");
    expect(page).not.toContain('href="/start"');
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
    expect(page).toContain('id="actionable-bake-title"');
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("<ol");
    expect(hero).toContain("alt=");
    expect(hero).toContain("priority");
  });
});
