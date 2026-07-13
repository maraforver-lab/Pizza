import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ovenEnvironments,
  ovenProblems,
  ovenUserFeedbackThemes,
  pizzaSessionOvenSupportSummary,
} from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Oven and Heat Guide", () => {
  it("rebuilds /ovens as a brand-neutral heat guide instead of an oven catalogue", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).toContain("OvenGuideHero");
    expect(page).toContain("HeatBalanceDiagram");
    expect(page).toContain("OvenEnvironmentComparison");
    expect(page).toContain("OvenEnvironmentChapter");
    expect(page).toContain("PreheatTimeline");
    expect(page).toContain("OvenProblemGuide");
    expect(page).toContain("OvenStyleFit");
    expect(hero).toContain("Oven and Heat Guide");
    expect(hero).toContain("The oven changes the pizza.");
    expect(page).not.toContain("recommendOvens");
    expect(page).not.toContain("Total oven budget");
    expect(page).not.toContain("Significant market options");
    expect(page).not.toContain("Manufacturer details");
  });

  it("removes brands, model comparisons, rankings and commercial links from the page", () => {
    const pageAndComponents = [
      source("app", "ovens", "page.tsx"),
      source("components", "ovens", "OvenGuideHero.tsx"),
      source("components", "ovens", "OvenEnvironmentComparison.tsx"),
      source("components", "ovens", "OvenEnvironmentChapter.tsx"),
      source("components", "ovens", "OvenProblemGuide.tsx"),
    ].join("\n");

    expect(pageAndComponents).not.toMatch(/Ooni|Gozney|Effeuno|Witt|Cozze|Chef Matteo|Koda|Arc XL|Tread|Rotante|Dome|P134H/i);
    expect(pageAndComponents).not.toMatch(/affiliate|paid ranking|best pizza oven|price bands|€|Amazon/i);
    expect(pageAndComponents).not.toContain("target=\"_blank\"");
    expect(pageAndComponents).not.toContain("http");
  });

  it("keeps product truth limited to existing Home oven and Pizza oven planner categories", () => {
    const sessionStart = source("app", "session", "start", "page.tsx");
    const bakeProfile = source("lib", "pizza-session-bake-profile.ts");

    expect(pizzaSessionOvenSupportSummary).toContain("Home oven and Pizza oven");
    expect(pizzaSessionOvenSupportSummary).toContain("does not add manufacturer");
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

  it("defines educational oven environments without turning them into planner options", () => {
    expect(ovenEnvironments.map((environment) => environment.id)).toEqual([
      "home-oven",
      "home-oven-steel",
      "home-oven-stone",
      "high-heat-pizza-oven",
      "pan-baking",
      "indoor-high-heat",
    ]);

    const supported = ovenEnvironments.filter((environment) => environment.plannerSupport === "supported");
    const educational = ovenEnvironments.filter((environment) => environment.plannerSupport === "education");

    expect(supported.map((environment) => environment.id)).toEqual(["home-oven", "high-heat-pizza-oven"]);
    expect(educational.map((environment) => environment.id)).toEqual([
      "home-oven-steel",
      "home-oven-stone",
      "pan-baking",
      "indoor-high-heat",
    ]);

    for (const environment of ovenEnvironments) {
      expect(environment.summary).toBeTruthy();
      expect(environment.heatIntensity).toBeTruthy();
      expect(environment.topHeat).toBeTruthy();
      expect(environment.bottomHeat).toBeTruthy();
      expect(environment.preheatBehavior).toBeTruthy();
      expect(environment.heatRecovery).toBeTruthy();
      expect(environment.suitableStyles).toBeTruthy();
      expect(environment.advantages.length).toBeGreaterThanOrEqual(4);
      expect(environment.limitations.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("teaches air-versus-surface, top-versus-bottom heat, preheating and recovery", () => {
    const heat = source("components", "ovens", "HeatBalanceDiagram.tsx");
    const preheat = source("components", "ovens", "PreheatTimeline.tsx");
    const page = source("app", "ovens", "page.tsx");

    expect(heat).toContain("An oven has more than one temperature.");
    expect(heat).toContain("Top heat");
    expect(heat).toContain("Bottom heat");
    expect(heat).toContain("the stone, steel, pan or oven floor is ready");
    expect(preheat).toContain("Cold oven");
    expect(preheat).toContain("Air is hot");
    expect(preheat).toContain("Surface is ready");
    expect(preheat).toContain("Recovery");
    expect(page).toContain("Measure the surface you actually launch on.");
    expect(preheat).toContain("The first pizza and the fifth pizza may not see the same oven.");
  });

  it("covers required common problems with corrections and related troubleshooting links", () => {
    expect(ovenProblems).toHaveLength(10);
    expect(ovenProblems.map((problem) => problem.title)).toEqual([
      "Base is pale",
      "Base burns before the top cooks",
      "Top burns before the base cooks",
      "Center stays wet",
      "Rim burns too fast",
      "Pizza sticks during launch",
      "Stone temperature drops between pizzas",
      "Pizza bakes unevenly",
      "Home-oven pizza dries out",
      "Oven will not maintain expected heat",
    ]);

    for (const problem of ovenProblems) {
      expect(problem.sees).toBeTruthy();
      expect(problem.likelyCauses.length).toBeGreaterThanOrEqual(3);
      expect(problem.doNow).toBeTruthy();
      expect(problem.nextBake).toBeTruthy();
      expect(problem.relatedHref).toMatch(/^\/guide\/pizza-troubleshooting#/);
    }
  });

  it("keeps safety conservative and avoids unsafe hacks", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Safety");
    expect(page).toContain("Use outdoor-only appliances outdoors");
    expect(page).toContain("Follow the instructions for your specific oven");
    expect(page).toContain("Do not modify fuel, ventilation or safety systems.");
    expect(page).not.toMatch(/disable safety|bypass|hack|blower|garage with door open|indoors if ventilated/i);
  });

  it("uses community feedback only as synthesis of recurring user struggles", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("What users struggle with most");
    expect(page).toContain("Community discussions are not formal rules");
    expect(ovenUserFeedbackThemes).toContain("confusing air temperature with stone or floor temperature");
    expect(ovenUserFeedbackThemes).toContain("expecting a pizza oven to remove the learning curve");
    expect(page).not.toContain("u/");
    expect(page).not.toContain("r/ooni");
  });

  it("keeps related learning concise and internal", () => {
    const page = source("app", "ovens", "page.tsx");

    for (const href of [
      "/styles",
      "/sauce",
      "/guides/dough",
      "/toppings",
      "/gear",
      "/guide/pizza-troubleshooting",
      "/session/start",
    ]) {
      expect(page).toContain(`href: "${href}"`);
    }

    expect(page).not.toContain("externalSources");
    expect(page).not.toContain("Sources and communities");
  });

  it("records research sources without exposing a raw bibliography in the page", () => {
    const researchPath = join(process.cwd(), "docs", "research", "pizza-oven-sources.md");
    const research = source("docs", "research", "pizza-oven-sources.md");
    const page = source("app", "ovens", "page.tsx");

    expect(existsSync(researchPath)).toBe(true);
    expect(research).toContain("formal safety guidance");
    expect(research).toContain("expert practical advice");
    expect(research).toContain("recurring user feedback");
    expect(research).toContain("DoughTools product truth");
    expect(research).toContain("United States Fire Administration");
    expect(research).toContain("King Arthur Baking");
    expect(research).toContain("Serious Eats");
    expect(page).not.toContain("United States Fire Administration");
    expect(page).not.toContain("Serious Eats");
  });

  it("uses local CSS diagrams and no production raster oven images", () => {
    const pageAndComponents = [
      source("app", "ovens", "page.tsx"),
      source("components", "ovens", "OvenGuideHero.tsx"),
      source("components", "ovens", "HeatBalanceDiagram.tsx"),
      source("components", "ovens", "OvenEnvironmentChapter.tsx"),
    ].join("\n");

    expect(pageAndComponents).not.toContain("next/image");
    expect(pageAndComponents).not.toContain("<Image");
    expect(pageAndComponents).not.toMatch(/<img|<Image|src=|backgroundImage/i);
    expect(pageAndComponents).not.toMatch(/aria-label="[^"]*(person|people|hands|chef|logo)[^"]*"/i);
    expect(pageAndComponents).toContain("role=\"img\"");
    expect(pageAndComponents).toContain("aria-label=");
  });

  it("updates SEO positioning without changing indexing policy", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Home Oven vs Pizza Oven: Heat, Baking and Pizza Results | DoughTools");
    expect(seo).toContain("Learn how home ovens, pizza ovens, steels, stones, pans, preheating and heat balance change pizza crust");
    expect(seo).toContain("ALLOW_INDEXING");
    expect(seo).not.toContain("Compare electric ovens, gas pizza ovens and other common pizza oven setups with practical trade-offs.");
  });

  it("keeps accessibility and responsive strategy explicit", () => {
    const page = source("app", "ovens", "page.tsx");
    const comparison = source("components", "ovens", "OvenEnvironmentComparison.tsx");
    const problemGuide = source("components", "ovens", "OvenProblemGuide.tsx");

    expect(page).toContain("LearningBreadcrumbs");
    expect(page).toContain("aria-label=\"Oven guide section index\"");
    expect(page).toContain("aria-label=\"Oven environment lessons\"");
    expect(comparison).toContain("sm:grid-cols-[9rem_minmax(0,1fr)]");
    expect(comparison).not.toContain("<table");
    expect(problemGuide).toContain("<details");
    expect(problemGuide).toContain("<summary");
    expect(page).toContain("focus-visible:ring");
  });
});
