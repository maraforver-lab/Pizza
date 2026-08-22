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
    caption:
      "Place the baking steel in the recommended upper position so the base receives strong conductive heat while the top can still brown.",
  },
  {
    file: "home-oven-stone-position.webp",
    section: "Home oven with pizza stone",
    alt: "Pizza stone positioned on an upper-middle rack inside a home oven.",
    caption:
      "Position the stone correctly and give it a thorough preheat before launching the pizza.",
  },
  {
    file: "home-oven-tray-position.webp",
    section: "Home oven with baking tray",
    alt: "Metal baking tray positioned on an upper rack inside a home oven.",
    caption:
      "Use the tray in the recommended position and keep the pizza realistic for the heat available.",
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
    section: "Follow the setup closest to your oven",
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
    caption:
      "Judge the top and bottom separately before deciding which heat source needs adjustment.",
  },
  {
    file: "oven-surface-recovery-between-pizzas.webp",
    section: "Bake more than one pizza",
    alt: "Baking surface recovering in a pizza oven while the next unbaked pizza waits on a peel.",
    caption: "Let the baking surface recover before launching the next pizza.",
  },
] as const;

const equipmentAssets = [
  "/ovens/equipment/digital-scale.svg",
  "/ovens/equipment/lidded-proofing-box.svg",
  "/ovens/equipment/dough-scraper.svg",
  "/ovens/equipment/launching-peel.svg",
  "/ovens/equipment/infrared-thermometer.svg",
  "/ovens/equipment/fire-blanket-heat-gloves.svg",
  "/ovens/equipment/turning-peel.svg",
  "/ovens/equipment/stable-prep-table.svg",
  "/ovens/equipment/opening-flour-tray.svg",
  "/ovens/equipment/cooling-rack-cutting-board.svg",
  "/ovens/equipment/wheel-pizza-scissors.svg",
  "/ovens/equipment/stone-brush-scraper.svg",
  "/ovens/equipment/cover-storage.svg",
] as const;

describe("Oven Guide", () => {
  it("opens with the approved Oven Assistant direction", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");
    const assistant = source("components", "ovens", "OvenAssistant.tsx");

    expect(page).toContain("OvenGuideHero");
    expect(page).toContain("OvenAssistant");
    expect(hero).toContain("Get better pizza from the oven you already have.");
    expect(hero).toContain("Choose the oven closest to your setup");
    expect(hero).not.toContain("Home oven or pizza oven?");
    expect(assistant).toContain("What oven do you use?");
    expect(assistant).toContain("Home oven");
    expect(assistant).toContain("Pizza oven");
    expect(assistant).toContain("Closest other setup");
    expect(page.indexOf("<OvenGuideHero />")).toBeLessThan(
      page.indexOf("<OvenAssistant compactEquipment={compactEquipmentByPath} />"),
    );
    expect(page.indexOf("<OvenAssistant compactEquipment={compactEquipmentByPath} />")).toBeLessThan(
      page.indexOf('id="oven-comparison"'),
    );
  });

  it("uses accessible path selection without changing oven logic", () => {
    const assistant = source("components", "ovens", "OvenAssistant.tsx");
    const page = source("app", "ovens", "page.tsx");

    expect(assistant).toContain('role="group"');
    expect(assistant).toContain('aria-label="Choose oven path"');
    expect(assistant).toContain("aria-pressed={selected}");
    expect(assistant).toContain("Selected");
    expect(assistant).toContain("setSelectedPath(item.id)");
    expect(assistant).not.toContain("localStorage.setItem");
    expect(assistant).not.toContain("fetch(");
    expect(page).toContain("getPizzaSessionBakeProfile");
    expect(page).toContain("homeProfile.preheatDurationMinutes");
    expect(page).toContain("pizzaProfile.preheatDurationMinutes");
  });

  it("places the recommended setup before the complete equipment reference", () => {
    const page = source("app", "ovens", "page.tsx");
    const assistant = source("components", "ovens", "OvenAssistant.tsx");

    expect(assistant).toContain("Recommended setup");
    expect(assistant).toContain("Recommended home-oven setup");
    expect(assistant).toContain("Recommended pizza-oven setup");
    expect(assistant).toContain("Choose the closest practical path");
    expect(assistant).toContain("Practical bake guidance");
    expect(page.indexOf("<OvenAssistant")).toBeLessThan(page.indexOf('id="other-equipment"'));
    expect(page.indexOf('id="oven-comparison"')).toBeLessThan(page.indexOf('id="other-equipment"'));
    expect(page.indexOf("Fix an uneven bake")).toBeLessThan(page.indexOf('id="other-equipment"'));
  });

  it("keeps all canonical setup paths and practical bake steps", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Home oven with baking steel");
    expect(page).toContain("Home oven with pizza stone");
    expect(page).toContain("Home oven with baking tray");
    expect(page).toContain("Pizza oven");
    expect(page).toContain('anchorId: "home-oven-steel"');
    expect(page).toContain('anchorId: "home-oven-stone"');
    expect(page).toContain('anchorId: "home-oven-tray"');
    expect(page).toContain('anchorId: "pizza-oven-setup"');
    expect(page.match(/label: "Preheat"/g)).toHaveLength(4);
    expect(page.match(/label: "Position"/g)).toHaveLength(4);
    expect(page.match(/label: "Launch"/g)).toHaveLength(4);
    expect(page.match(/label: "Manage the bake"/g)).toHaveLength(4);
    expect(page.match(/label: "Know when it is ready"/g)).toHaveLength(4);
  });

  it("keeps current oven recommendations and Pizza Plan timing unchanged", () => {
    const page = source("app", "ovens", "page.tsx");
    const sessionStart = source("app", "session", "start", "page.tsx");
    const bakeProfile = source("lib", "pizza-session-bake-profile.ts");

    expect(pizzaSessionOvenSupportSummary).toContain("Home oven and Pizza oven");
    expect(pizzaSessionOvenSupportSummary).toContain("without adding brands, models or extra planner presets");
    expect(sessionStart).toContain('id: "pizza-oven"');
    expect(sessionStart).toContain('id: "home-oven"');
    expect(sessionStart).not.toContain('id: "steel"');
    expect(sessionStart).not.toContain('id: "stone"');
    expect(bakeProfile).toContain('ovenType: "home"');
    expect(bakeProfile).toContain('ovenType: "pizza"');
    expect(page).toContain("pizzaProfile.bakeTimeLabel");
    expect(page).toContain("homeProfile.bakeTimeLabel");

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

  it("uses one local oven hero image with explicit dimensions and responsive loading", () => {
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

  it("keeps every existing Ovens teaching image local and meaningful", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("OvenTeachingFigure");
    expect(page).toContain("width={1200}");
    expect(page).toContain("height={1000}");
    expect(page).toContain('sizes="(max-width: 768px) 100vw, 42vw"');

    for (const asset of ovenTeachingAssets) {
      const sourcePath = `/ovens/teaching/${asset.file}`;
      const assetPath = join(process.cwd(), "public", "ovens", "teaching", asset.file);

      expect(asset.file.endsWith(".webp")).toBe(true);
      expect(existsSync(assetPath)).toBe(true);
      expect(statSync(assetPath).size).toBeGreaterThan(50_000);
      expect(occurrences(page, sourcePath)).toBe(1);
      expect(page).toContain(`src: "${sourcePath}"`);
      expect(page).toContain(asset.alt);
      expect(page).toContain(asset.caption);
      expect(page.indexOf(asset.section)).toBeGreaterThan(-1);
    }

    expect(page).not.toMatch(/https?:\/\/.*\.(webp|png|jpe?g)/i);
  });

  it("shows only compact relevant equipment initially and collapses the full reference by default", () => {
    const page = source("app", "ovens", "page.tsx");
    const assistant = source("components", "ovens", "OvenAssistant.tsx");

    expect(assistant).toContain("Useful tools for this path");
    expect(assistant).toContain("compactEquipment[selectedPath]");
    expect(page).toContain("compactEquipmentNamesByPath");
    expect(page).toContain("View all equipment recommendations");
    expect(page).toContain('<details className="group mt-5');
    expect(page).not.toContain('<details className="group mt-5 rounded-[1.2rem] border border-ink/10 bg-flour/70" open');
    expect(page).toContain("Essential");
    expect(page).toContain("Useful");
    expect(page).toContain("Optional");
    expect(page).toContain("Oven fit");
    expect(page).toContain("Beginner need");
    expect(page).toContain("Use or safety note");
  });

  it("keeps all existing equipment assets accessible inside the disclosure", () => {
    const page = source("app", "ovens", "page.tsx");

    for (const path of equipmentAssets) {
      expect(page).toContain(path);
    }

    expect(page.match(/src: "\/ovens\/equipment\//g)).toHaveLength(13);
    expect(page).toContain('sizes="(min-width: 1024px) 80px, (min-width: 640px) 80px, calc(100vw - 4rem)"');
    expect(page).not.toMatch(/https?:\/\/|unsplash|pexels|stock/i);
    expect(page).not.toContain("doughtools-gear-v1");
    expect(page).not.toContain("gearItems");
  });

  it("removes generic lower-page learning navigation", () => {
    const page = source("app", "ovens", "page.tsx");
    const assistant = source("components", "ovens", "OvenAssistant.tsx");
    const routeContentBeforeFooter = [page.slice(0, page.indexOf("<SiteFooter />")), assistant].join("\n");

    expect(page).not.toContain("PublicPageEnding");
    expect(page).not.toContain("relatedOvenGuides");
    expect(page).not.toContain("What should I learn next?");
    expect(page).not.toContain('href: "/guides/dough"');
    expect(page).not.toContain('href: "/guide/practical-pizza-tips"');
    expect(routeContentBeforeFooter).toContain("Plan with the oven you actually have.");
    expect(routeContentBeforeFooter).toContain('href="/session/start"');
    expect(routeContentBeforeFooter).toContain("Plan a pizza");
    expect(routeContentBeforeFooter.match(/href="\/session\/start"/g)).toHaveLength(1);
  });

  it("keeps troubleshooting, safety and session-boundary guidance", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("Fix an uneven bake");
    expect(page).toContain("Base burns before the top is ready");
    expect(page).toContain("Top browns before the base is ready");
    expect(page).toContain("Base stays pale");
    expect(page).toContain("Centre stays wet");
    expect(page).toContain("/guide/pizza-troubleshooting");
    expect(page).toContain("Pizza plan effect");
    expect(page).toContain("Home oven and Pizza oven are the supported pizza-plan choices.");
    expect(page).toContain("Safety checks");
    expect(page).toContain("Follow your own appliance manual");
    expect(page).toContain("Use outdoor-only ovens outdoors.");
    expect(page).not.toContain("createSession");
    expect(page).not.toContain("supabase");
    expect(page).not.toContain("fetch(");
  });

  it("renders only the selected oven guidance depth from the existing preference", () => {
    const assistant = source("components", "ovens", "OvenAssistant.tsx");

    expect(assistant).toContain("readExperienceLevelPreference");
    expect(assistant).toContain("useState<ExperienceLevel>(DEFAULT_EXPERIENCE_LEVEL)");
    expect(assistant).toContain("setSelectedGuidance(readExperienceLevelPreference())");
    expect(assistant).toContain("bakeManagementByLevel[selectedGuidance]");
    expect(assistant).not.toContain("EXPERIENCE_LEVELS.map");
    expect(assistant).not.toContain("Object.entries(bakeManagementByLevel)");
    expect(assistant).toContain("Keep the first bake simple");
    expect(assistant).toContain("Tune heat and timing together");
    expect(assistant).toContain("Balance stored heat, top heat and recovery");
  });

  it("keeps the page responsive without horizontal tables or post-footer content", () => {
    const page = source("app", "ovens", "page.tsx");

    expect(page).toContain("overflow-x-clip");
    expect(page).toContain("lg:grid-cols-2");
    expect(page).not.toContain("<table");
    expect(page).toContain("SiteFooter");
    expect(page.indexOf("Plan with the oven you actually have.")).toBeLessThan(
      page.indexOf("<SiteFooter />"),
    );
  });

  it("keeps SEO positioning and indexing policy unchanged", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Pizza Oven and Home Oven Baking Guide | DoughTools");
    expect(seo).toContain("Get better pizza from a home oven or pizza oven with practical setup, heat, preheating, bake-time and topping-moisture guidance.");
    expect(seo).toContain("ALLOW_INDEXING");
    expect(seo).not.toContain("Compare electric ovens, gas pizza ovens and other common pizza oven setups with practical trade-offs.");
  });

  it("preserves accessible section semantics and heading landmarks", () => {
    const page = source("app", "ovens", "page.tsx");
    const hero = source("components", "ovens", "OvenGuideHero.tsx");
    const assistant = source("components", "ovens", "OvenAssistant.tsx");

    expect(page).toContain("LearningBreadcrumbs");
    expect(page).toContain('id="oven-comparison"');
    expect(page).toContain('id="other-equipment"');
    expect(page).toContain('id="uneven-bake-title"');
    expect(page).toContain('id="multiple-pizzas-title"');
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("<ol");
    expect(hero).toContain("alt=");
    expect(hero).toContain("priority");
    expect(assistant).toContain('aria-labelledby="oven-assistant-heading"');
    expect(assistant).toContain("focus-visible:outline");
  });
});
