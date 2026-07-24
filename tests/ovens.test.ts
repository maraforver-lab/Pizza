import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pizzaSessionOvenSupportSummary } from "@/lib/oven-education";
import { getPizzaSessionBakeProfile } from "@/lib/pizza-session-bake-profile";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");
const occurrences = (text: string, search: string) => text.split(search).length - 1;

const ovenTeachingAssets = [
  {
    file: "home-oven-steel-position.webp",
    section: "Home oven with baking steel",
    alt: "Baking steel positioned on an upper rack inside a home oven.",
    caption: "Place the baking steel in the recommended upper position so the base receives strong conductive heat while the top can still brown.",
  },
  {
    file: "home-oven-stone-position.webp",
    section: "Home oven with pizza stone",
    alt: "Pizza stone positioned on an upper-middle rack inside a home oven.",
    caption: "Position the stone correctly and give it a thorough preheat before launching the pizza.",
  },
  {
    file: "home-oven-tray-position.webp",
    section: "Home oven with baking tray",
    alt: "Metal baking tray positioned on an upper rack inside a home oven.",
    caption: "Use the tray in the recommended position and keep the pizza realistic for the heat available.",
  },
  {
    file: "pizza-oven-launch-position.webp",
    section: "Pizza oven",
    alt: "Pizza being launched from a peel onto a pizza oven floor away from the strongest flame.",
    caption: "Launch onto the hot oven floor with enough distance from the strongest flame.",
  },
  {
    file: "pizza-oven-turning.webp",
    section: "Manage the bake",
    alt: "Pizza being turned with a turning peel inside a pizza oven near a steady flame.",
    caption: "Turn the pizza before the flame-facing side colours too far.",
  },
  {
    file: "oven-surface-temperature-check.webp",
    section: "Choose your oven setup",
    alt: "Infrared thermometer aimed at a hot pizza stone inside a home oven.",
    caption: "Check that the baking surface is fully heated before launching.",
  },
  {
    file: "pizza-bottom-doneness-comparison.webp",
    section: "Know when it is ready",
    alt: "Comparison of pale, properly baked and burnt pizza bases viewed from underneath.",
    caption: "Look for an evenly baked base: not pale and soft, but not deeply burnt.",
  },
  {
    file: "pizza-heat-balance-comparison.webp",
    section: "Fix an uneven bake",
    alt: "Comparison of uneven and balanced pizza baking with top and base doneness shown separately.",
    caption: "Judge the top and bottom separately before deciding which heat source needs adjustment.",
  },
  {
    file: "oven-surface-recovery-between-pizzas.webp",
    section: "Bake more than one pizza",
    alt: "Baking surface recovering in a pizza oven while the next unbaked pizza waits on a peel.",
    caption: "Let the baking surface recover before launching the next pizza.",
  },
] as const;

describe("Oven Guide", () => {
  it("makes /ovens a practical Home oven and Pizza oven comparison", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");

    expect(page).toContain("OvenGuideHero");
    expect(hero).toContain("Baking guides");
    expect(hero).toContain("Home oven or pizza oven?");
    expect(hero).toContain("Compare the heat, preheat, placement, bake time and result");
    expect(page.indexOf("<OvenGuideHero />")).toBeLessThan(page.indexOf("<OvensQuickAnswer />"));
    expect(page.indexOf("<OvensQuickAnswer />")).toBeLessThan(page.indexOf('id="oven-comparison"'));
    expect(page).toContain("OvensQuickAnswer");
    expect(page).toContain("Choose your oven setup");
    expect(page).toContain("Follow the setup that matches your oven and baking surface.");
    expect(page).toContain("Pizza oven");
    expect(page).toContain("Home oven");
    expect(page).toContain("Home oven with baking steel");
    expect(page).toContain("Home oven with pizza stone");
    expect(page).toContain("Home oven with baking tray");
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

  it("stores every Ovens teaching image as a local WebP production asset", () => {
    for (const asset of ovenTeachingAssets) {
      const assetPath = join(process.cwd(), "public", "ovens", "teaching", asset.file);

      expect(asset.file.endsWith(".webp")).toBe(true);
      expect(existsSync(assetPath)).toBe(true);
      expect(statSync(assetPath).size).toBeGreaterThan(50_000);
    }
  });

  it("renders every Ovens teaching image once with meaningful alt text and required captions", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("OvenTeachingFigure");
    expect(page).toContain("width={1200}");
    expect(page).toContain("height={1000}");
    expect(page).toContain('sizes="(max-width: 768px) 100vw, 42vw"');

    for (const asset of ovenTeachingAssets) {
      const sourcePath = `/ovens/teaching/${asset.file}`;

      expect(occurrences(page, sourcePath)).toBe(1);
      expect(page).toContain(`src: "${sourcePath}"`);
      expect(page).toContain(asset.alt);
      expect(page).toContain(asset.caption);
      expect(page.indexOf(asset.section)).toBeGreaterThan(-1);
    }

    expect(page).toContain("<OvenTeachingFigure image={setup.image}");
    expect(page).toContain("<OvenTeachingFigure image={setup.supplementalImage}");
    expect(page).toContain("<OvenTeachingFigure image={surfaceReadinessImage}");
    expect(page).toContain("<OvenTeachingFigure image={bottomDonenessImage}");
    expect(page).toContain("<OvenTeachingFigure image={heatBalanceImage}");
    expect(page).toContain("<OvenTeachingFigure image={recoveryImage}");
    expect(page).not.toMatch(/https?:\/\/.*\.(webp|png|jpe?g)/i);
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

    expect(page).toContain("Fix an uneven bake");
    expect(page).toContain("Base burns before the top is ready");
    expect(page).toContain("Reduce bottom heat or move the pizza away from the hottest surface area. Finish with more controlled top heat.");
    expect(page).toContain("Top browns before the base is ready");
    expect(page).toContain("Reduce top exposure and give the base more time on the baking surface.");
    expect(page).toContain("Base stays pale");
    expect(page).toContain("Preheat the baking surface longer and confirm that it has recovered before launching.");
    expect(page).toContain("Centre stays wet");
    expect(page).toContain("Reduce topping moisture and topping load before increasing bake time.");

    expect(page).toContain("/guide/pizza-troubleshooting");
    expect(page.indexOf('id="uneven-bake-title"')).toBeLessThan(page.indexOf("OvenTeachingFigure image={heatBalanceImage}"));
    expect(page.indexOf("OvenTeachingFigure image={heatBalanceImage}")).toBeLessThan(page.indexOf("unevenBakeItems.map"));
  });

  it("keeps concise setup, surface and safety guidance without becoming a gear guide", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Home oven with baking steel");
    expect(page.indexOf("Home oven with baking steel")).toBeLessThan(page.indexOf("home-oven-steel-position.webp"));
    expect(page).toContain("Steel transfers heat quickly. It gives strong base colour but may require careful top-heat management.");
    expect(page).toContain("Home oven with pizza stone");
    expect(page.indexOf("Home oven with pizza stone")).toBeLessThan(page.indexOf("home-oven-stone-position.webp"));
    expect(page).toContain("Stone heats the base more gently than steel and usually needs a thorough preheat.");
    expect(page).toContain("Pizza oven");
    expect(page.indexOf("Pizza oven")).toBeLessThan(page.indexOf("pizza-oven-launch-position.webp"));
    expect(page.indexOf("Manage the bake")).toBeLessThan(page.indexOf("pizza-oven-turning.webp"));
    expect(page).toContain("A pizza oven bakes quickly, so launch position, turning and flame exposure matter throughout the bake.");
    expect(page).toContain("Home oven with baking tray");
    expect(page.indexOf("Home oven with baking tray")).toBeLessThan(page.indexOf("home-oven-tray-position.webp"));
    expect(page).toContain("A baking tray is less powerful than steel or stone");
    expect(page).toContain("Preheat for the current");
    expect(page).toContain("Start in the upper-middle or upper third.");
    expect(page).toContain("Launch quickly onto the hot steel.");
    expect(page).toContain("Turn frequently and move relative to the flame.");
    expect(page).toContain("Judge the oven floor, not only the flame or air heat.");
    expect(page).toContain("The oven reaching its set temperature may be enough for a tray");
    expect(page).toContain("Let the baking surface recover between pizzas.");
    expect(page.indexOf("ovenSetupPaths.map")).toBeLessThan(page.indexOf("OvenTeachingFigure image={surfaceReadinessImage}"));
    expect(page.indexOf("OvenTeachingFigure image={surfaceReadinessImage}")).toBeLessThan(page.indexOf("OvenTeachingFigure image={bottomDonenessImage}"));
    expect(page.indexOf('id="multiple-pizzas-title"')).toBeLessThan(page.indexOf("OvenTeachingFigure image={recoveryImage}"));
    expect(page).toContain("Safety checks");
    expect(page).toContain("Follow your own appliance manual");
    expect(page).toContain("Use outdoor-only ovens outdoors.");
    expect(page).not.toContain("Do not modify fuel, ventilation or safety systems.");
    expect(page).not.toContain("infrared thermometer guide");
    expect(page).not.toContain("75 min pizza-plan preheat window");
    expect(page).not.toContain("BakeTimer");
    expect(page).not.toContain("KitchenMode");
  });

  it("gives every setup path the same five practical step labels", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page.match(/label: "Preheat"/g)).toHaveLength(4);
    expect(page.match(/label: "Position"/g)).toHaveLength(4);
    expect(page.match(/label: "Launch"/g)).toHaveLength(4);
    expect(page.match(/label: "Manage the bake"/g)).toHaveLength(4);
    expect(page.match(/label: "Know when it is ready"/g)).toHaveLength(4);
  });

  it("renders oven setup paths as a readable vertical process instead of five narrow columns", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("function OvenSetupSteps");
    expect(page).toContain('aria-label={`${setupTitle} setup steps`}');
    expect(page).toContain('padStart(2, "0")');
    expect(page).toContain("<summary");
    expect(page).toContain("focus-visible:ring");
    expect(page).toContain("xl:grid-cols-[minmax(22rem,.48fr)_minmax(0,1fr)]");
    expect(page.indexOf("<OvenTeachingFigure image={setup.image}")).toBeLessThan(page.indexOf("<OvenSetupSteps"));
    expect(page).not.toContain("md:grid-cols-5");
    expect(page).not.toContain("lg:grid-cols-5");
  });

  it("adds a compact quick answer before the deeper comparison", () => {
    const page = source("app", "ovens", "page.tsx");
    const quickAnswer = source("components", "ovens", "OvensQuickAnswer.tsx");

    expect(page).toContain("<OvensQuickAnswer />");
    expect(quickAnswer).toContain("What should I do with my oven?");
    expect(quickAnswer).toContain("Choose your oven type, preheat the baking surface fully and manage the top and bottom heat separately.");
    expect(quickAnswer).toContain("Home oven");
    expect(quickAnswer).toContain("Preheat the oven and baking surface fully.");
    expect(quickAnswer).toContain("Pizza oven");
    expect(quickAnswer).toContain("Heat the oven floor fully, launch with a stable flame");

    for (const action of [
      "Preheat the steel or stone",
      "Use the upper half of the oven",
      "Launch the pizza quickly",
      "Watch the top and bottom separately",
      "Check the oven floor",
      "Launch with a stable flame",
      "Turn the pizza frequently",
      "Move it to balance the bake",
    ]) {
      expect(quickAnswer).toContain(action);
    }

    const timerRecommendation = "The timer is only a guide. The pizza is ready when the base, rim and toppings are all properly baked.";
    expect(quickAnswer).toContain(timerRecommendation);
    expect((quickAnswer.match(new RegExp(timerRecommendation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? [])).toHaveLength(1);
    expect(page).not.toContain("The pizza is ready when the base, rim and toppings are all properly baked.");
  });

  it("renders only the selected oven guidance level without changing planner timing", () => {
    const page = source("app", "ovens", "page.tsx");
    const quickAnswer = source("components", "ovens", "OvensQuickAnswer.tsx");

    expect(page).not.toContain('aria-label="Home oven guidance by experience level"');
    expect(page).not.toContain("Use one reliable starting setup.");
    expect(page).not.toContain("Separate oven air from surface heat.");
    expect(quickAnswer).toContain("readExperienceLevelPreference");
    expect(quickAnswer).toContain('useState<ExperienceLevel>(getDefaultExperienceLevel())');
    expect(quickAnswer).toContain("setExperienceLevel(readExperienceLevelPreference())");
    expect(quickAnswer).toContain("bakeManagementByLevel[selectedGuidance.id]");
    expect(quickAnswer).not.toContain("Object.entries(bakeManagementByLevel)");
    expect(quickAnswer).not.toContain("EXPERIENCE_LEVELS.map");
    expect(quickAnswer).not.toContain("bakeManagementByLevel.map");
    expect(quickAnswer).toContain("How should I manage the bake?");
    expect(quickAnswer).toContain("{selectedGuidance.label}");
    expect(quickAnswer).toContain("{bakeManagement.body}");
    expect(quickAnswer).toContain("actions={bakeManagement.rules}");

    expect(getPizzaSessionBakeProfile("home").preheatDurationMinutes).toBe(75);
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
    expect(page.match(/Show more equipment/g)).toHaveLength(1);
    expect(page).toContain("Show more equipment");
    expect(page).toContain("Essential");
    expect(page).toContain("Useful");
    expect(page).toContain("Optional");
    expect(page).toContain("Oven fit");
    expect(page).toContain("Beginner need");
    expect(page).toContain("Use or safety note");
    expect(page).toContain("Digital scale");
    expect(page).toContain("/ovens/equipment/digital-scale.svg");
    expect(page).toContain("Digital kitchen scale with a small bowl on top.");
    expect(page).toContain("/ovens/equipment/lidded-proofing-box.svg");
    expect(page).toContain("/ovens/equipment/dough-scraper.svg");
    expect(page).toContain("Launching peel");
    expect(page).toContain("/ovens/equipment/launching-peel.svg");
    expect(page).toContain("/ovens/equipment/infrared-thermometer.svg");
    expect(page).toContain("Fire blanket and heat gloves");
    expect(page).toContain("/ovens/equipment/fire-blanket-heat-gloves.svg");
    expect(page).toContain("/ovens/equipment/turning-peel.svg");
    expect(page).toContain("/ovens/equipment/stable-prep-table.svg");
    expect(page).toContain("/ovens/equipment/opening-flour-tray.svg");
    expect(page).toContain("/ovens/equipment/cooling-rack-cutting-board.svg");
    expect(page).toContain("/ovens/equipment/wheel-pizza-scissors.svg");
    expect(page).toContain("/ovens/equipment/stone-brush-scraper.svg");
    expect(page).toContain("/ovens/equipment/cover-storage.svg");
    expect(page.match(/src: "\/ovens\/equipment\//g)).toHaveLength(13);
    expect(page).toContain("sizes=\"(min-width: 1024px) 80px, (min-width: 640px) 80px, calc(100vw - 4rem)\"");
    expect(page).not.toMatch(/https?:\/\/|unsplash|pexels|stock/i);
    expect(page).not.toContain("doughtools-gear-v1");
    expect(page).not.toContain("gearItems");
  });

  it("uses one final route primary CTA and keeps related links secondary", () => {
    const page = source("app", "ovens", "page.tsx");
    const routeContentBeforeFooter = page.slice(0, page.indexOf("<SiteFooter />"));

    expect(routeContentBeforeFooter).toContain("Plan with the oven you actually have.");
    expect(routeContentBeforeFooter).toContain('href: "/session/start"');
    expect(routeContentBeforeFooter).toContain("Plan a pizza");
    expect(routeContentBeforeFooter.match(/href: "\/session\/start"/g)).toHaveLength(1);
    expect(page).toContain("PublicPageEnding");
    expect(page).toContain("relatedOvenGuides");
    expect(page).toContain("What should I learn next?");
    expect(page).toContain("Explore guide");
    expect(page).toContain('href: "/guides/dough"');
    expect(page).toContain('href: "/guide/practical-pizza-tips"');
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
    expect(page).toContain('id="uneven-bake-title"');
    expect(page).toContain('id="multiple-pizzas-title"');
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("<ol");
    expect(hero).toContain("alt=");
    expect(hero).toContain("priority");
  });
});
