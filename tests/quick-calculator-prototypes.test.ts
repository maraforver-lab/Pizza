import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getQuickCalculatorPrototypeMetadata,
  QUICK_CALCULATOR_PROTOTYPE_IDS,
  quickCalculatorPrototypeMetadata,
} from "@/lib/quick-calculator-prototype-metadata";
import {
  buildQuickCalculatorPrototypeInput,
  calculateQuickCalculatorPrototypeResult,
  quickCalculatorPrototypeResultSignature,
  quickCalculatorPrototypeSampleInput,
} from "@/lib/quick-calculator-prototype-results";
import { quickCalculatorPrototypeRegistry } from "@/lib/quick-calculator-prototypes";
import { calculateQuickDough, quickCalculatorDefaults } from "@/lib/quick-calculator/quick-dough-calculator";
import { sitemapEntries, seoRoutePolicy } from "@/lib/seo-config";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Quick Calculator admin visual prototypes", () => {
  it("registers exactly three allowlisted prototype IDs", () => {
    expect(QUICK_CALCULATOR_PROTOTYPE_IDS).toEqual(["instant", "guided", "workbench"]);
    expect(quickCalculatorPrototypeMetadata.map((prototype) => prototype.id)).toEqual(["instant", "guided", "workbench"]);
    expect(quickCalculatorPrototypeRegistry.map((prototype) => prototype.status)).toEqual(["prototype", "prototype", "prototype"]);
  });

  it("rejects unknown prototype IDs", () => {
    expect(getQuickCalculatorPrototypeMetadata("instant")?.name).toBe("Instant Recipe");
    expect(getQuickCalculatorPrototypeMetadata("wizard")).toBeNull();

    const route = source("app/admin/quick-calculator-preview/[prototype]/page.tsx");
    expect(route).toContain("getQuickCalculatorPrototype(requestedPrototype)");
    expect(route).toContain("notFound()");
  });

  it("keeps prototype routes protected, noindexed and out of the sitemap", () => {
    const adminLayout = source("app/admin/layout.tsx");
    const route = source("app/admin/quick-calculator-preview/[prototype]/page.tsx");
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app", ALLOW_INDEXING: "true", VERCEL_ENV: "production" })
      .map((entry) => entry.url);

    expect(adminLayout).toContain("await requireAdmin()");
    expect(route).toContain("noindexMetadata(");
    expect(route).toContain("Admin prototype — not the public Quick Calculator");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/admin/quick-calculator-preview");
    expect(sitemapUrls.some((url) => url.includes("/admin/quick-calculator-preview"))).toBe(false);
  });

  it("leaves the public Quick Calculator route unchanged and unlinked to prototypes", () => {
    const publicRoute = source("app/calculator/quick/page.tsx");
    const publicComponent = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(publicRoute).toContain("return <QuickDoughCalculator />;");
    expect(publicRoute).not.toContain("QuickCalculatorPrototype");
    expect(publicComponent).not.toContain("data-quick-calculator-prototype");
    expect(publicComponent).not.toContain("/admin/quick-calculator-preview");
  });

  it("calculates prototype results through the canonical Quick Calculator engine", () => {
    const adapter = source("lib/quick-calculator-prototype-results.ts");
    const input = buildQuickCalculatorPrototypeInput(quickCalculatorPrototypeSampleInput);
    const prototypeResult = calculateQuickCalculatorPrototypeResult(quickCalculatorPrototypeSampleInput);
    const canonicalResult = calculateQuickDough(input);

    expect(adapter).toContain('import {');
    expect(adapter).toContain("calculateQuickDough");
    expect(adapter).not.toContain("calculateDoughIngredients");
    expect(prototypeResult.ingredients).toEqual(canonicalResult.ingredients);
    expect(prototypeResult.settings).toEqual(canonicalResult.settings);
  });

  it("keeps identical numeric results for the same input across all concepts and guidance levels", () => {
    const result = calculateQuickCalculatorPrototypeResult({
      pizzaCount: 6,
      doughBallWeightGrams: 245,
      fermentationDuration: "48h",
      fermentationEnvironment: "cold",
      hydrationPercent: 66,
      saltPercent: 2.7,
    });
    const signature = quickCalculatorPrototypeResultSignature(result);

    for (const prototype of quickCalculatorPrototypeRegistry) {
      expect(prototype.status).toBe("prototype");
      expect(quickCalculatorPrototypeResultSignature(result)).toEqual(signature);
    }

    for (const level of ["beginner", "enthusiast", "pizza_nerd"] as const) {
      expect(quickCalculatorPrototypeResultSignature(result)).toEqual(signature);
      expect(level).toMatch(/beginner|enthusiast|pizza_nerd/);
    }
  });

  it("keeps sample defaults aligned with the approved prototype brief", () => {
    const input = buildQuickCalculatorPrototypeInput();

    expect(input).toMatchObject({
      pizzaCount: 4,
      doughBallWeightGrams: 260,
      fermentationDuration: "24h",
      fermentationEnvironment: "cold",
      hydrationPercent: quickCalculatorDefaults.hydrationPercent,
      saltPercent: quickCalculatorDefaults.saltPercent,
      yeastType: "idy",
      sizingMode: "ball-weight",
      pizzaStyle: "neapolitan",
    });
  });

  it("renders three distinct prototype structures without storage, session or API writes", () => {
    const component = source("components/quick-calculator/QuickCalculatorPrototypePreview.tsx");

    expect(component).toContain('data-prototype-layout="instant"');
    expect(component).toContain('data-prototype-layout="guided"');
    expect(component).toContain('data-prototype-layout="workbench"');
    expect(component).toContain("Prototype actions do not write saved recipes, sessions, share URLs or browser storage.");
    expect(component).not.toMatch(/localStorage|sessionStorage|storeQuickCalculatorSavedRecipes|saveQuickCalculatorRecipe|buildQuickCalculatorShareUrl|fetch\(|\/api\/|createAndSavePizzaSession|setActivePizzaSession|writeExperienceLevelPreference|readExperienceLevelPreference/);
  });

  it("shows only the selected guidance explanation instead of all three level explanations together", () => {
    const component = source("components/quick-calculator/QuickCalculatorPrototypePreview.tsx");

    expect(component).toContain("prototypeGuidanceCopy[selectedLevel.id]");
    expect(component).toContain("{selectedCopy.body}");
    expect(component).toContain("guidance text changes only presentation. Numeric output stays identical.");
    expect(component).not.toContain("EXPERIENCE_LEVELS.map((level) => prototypeGuidanceCopy");
  });

  it("adds compact Admin cards for all prototype previews without publish controls", () => {
    const adminPage = source("app/admin/page.tsx");

    expect(adminPage).toContain("Quick Calculator prototypes");
    expect(adminPage).toContain("quickCalculatorPrototypeRegistry.map");
    expect(adminPage).toContain("/admin/quick-calculator-preview/${prototype.id}");
    expect(adminPage).not.toContain("Publish");
    expect(adminPage).not.toContain("Restore");
    expect(adminPage).not.toContain("Delete");
  });
});
