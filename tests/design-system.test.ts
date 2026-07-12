import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("DoughTools design foundation", () => {
  it("stores the shared layout visual reference inside the repository", () => {
    expect(existsSync(join(process.cwd(), "docs", "design-reference", "doughtools-shared-layout-reference.png"))).toBe(true);
    const designSystem = source("docs/design-system.md");

    expect(designSystem).toContain("DoughTools Design System");
    expect(designSystem).toContain("./design-reference/doughtools-shared-layout-reference.png");
    expect(designSystem).toContain("Desktop = guided workspace.");
    expect(designSystem).toContain("Mobile = focused app experience.");
    expect(designSystem).toContain("Same logic, different layout.");
    expect(designSystem).toContain("PageShell");
    expect(designSystem).toContain("PrimaryButton");
    expect(designSystem).toContain("Before creating a new component or layout");
  });

  it("documents durable project instructions for future Codex work", () => {
    const agents = source("AGENTS.md");

    expect(agents).toContain("DoughTools project instructions");
    expect(agents).toContain("docs/global-responsive-ux-rules.md");
    expect(agents).toContain("docs/visual-style-guide.md");
    expect(agents).toContain("docs/design-system.md");
    expect(agents).toContain("Do not create separate mobile business logic.");
    expect(agents).toContain("Do not change formulas, calculations, persistence, auth, SEO, pricing or route behavior unless the task explicitly requests it.");
  });

  it("adds shared visual tokens through the existing global CSS approach", () => {
    const globals = source("app/globals.css");

    expect(globals).toContain("--dt-forest: #0F3D2E;");
    expect(globals).toContain("--dt-forest-dark: #09291F;");
    expect(globals).toContain("--dt-warm-background: #FFF8F1;");
    expect(globals).toContain("--dt-card: #FFFFFF;");
    expect(globals).toContain("--dt-tomato: #E94B2E;");
    expect(globals).toContain("--dt-oven-gold: #E8C98A;");
    expect(globals).toContain("--dt-muted: #6B645D;");
    expect(globals).toContain("--dt-brand-primary: var(--dt-forest);");
    expect(globals).toContain("--dt-action-primary: var(--dt-tomato);");
    expect(globals).toContain("--dt-focus-ring: var(--dt-tomato);");
    expect(globals).toContain("--dt-primary: var(--dt-forest);");
    expect(globals).toContain("--dt-background-warm: var(--dt-warm-background);");
  });

  it("keeps Tailwind and CSS variables aligned to the official palette", () => {
    const globals = source("app/globals.css");
    const tailwind = source("tailwind.config.ts");
    const designSystem = source("docs/design-system.md");

    for (const [name, value] of [
      ["Forest", "#0F3D2E"],
      ["Forest Dark", "#09291F"],
      ["Warm Background", "#FFF8F1"],
      ["Flour", "#F1E6D8"],
      ["Card", "#FFFFFF"],
      ["Tomato", "#E94B2E"],
      ["Oven Gold", "#E8C98A"],
      ["Basil", "#3BA66B"],
      ["Ink", "#1F1F1F"],
      ["Muted", "#6B645D"],
    ] as const) {
      expect(designSystem).toContain(name);
      expect(designSystem).toContain(value);
      expect(globals).toContain(value);
      expect(tailwind).toContain(value);
    }

    expect(tailwind).toContain('"brand-primary": doughToolsPalette.forest');
    expect(tailwind).toContain('"background-page": doughToolsPalette.warmBackground');
    expect(tailwind).toContain('"action-primary": doughToolsPalette.tomato');
    expect(tailwind).toContain('"status-warning": doughToolsPalette.ovenGold');
    expect(tailwind).toContain('"focus-ring": doughToolsPalette.tomato');
    expect(tailwind).toContain("cream: doughToolsPalette.warmBackground");
    expect(tailwind).toContain("leaf: doughToolsPalette.basil");
    expect(designSystem).toContain("Legacy compatibility aliases");
  });

  it("documents visual governance for surfaces, images, people, icons and typography", () => {
    const agents = source("AGENTS.md");
    const designSystem = source("docs/design-system.md");
    const visualGuide = source("docs/visual-style-guide.md");
    const responsiveRules = source("docs/global-responsive-ux-rules.md");
    const packageJson = source("package.json");

    expect(designSystem).toContain("Marketing and workspace surfaces");
    expect(designSystem).toContain("Do not turn the application workspace into a dark interface.");
    expect(designSystem).toContain("Use `Inter` for application UI");
    expect(designSystem).toContain("Use `Newsreader` for major marketing headings");
    expect(designSystem).toContain("Do not use `Newsreader` for numeric controls");
    expect(designSystem).toContain("Canonical radius roles");
    expect(designSystem).toContain("DoughTools uses `lucide-react` as the official interface icon source");
    expect(designSystem).toContain("shared `DoughToolsIcon` wrapper");
    expect(designSystem).toContain("Emoji must not be used as primary functional interface icons.");

    expect(visualGuide).toContain("DoughTools Photography and AI Image Direction");
    expect(visualGuide).toContain("Do not create or commission any AI-generated image containing a person without first asking Marcin for explicit approval.");
    expect(visualGuide).toContain("This includes faces, full bodies, partial bodies, visible hands, silhouettes, reflections and background people.");
    expect(visualGuide).toContain("Do not create a synthetic founder replacement.");
    expect(visualGuide).toContain("Future homepage hero direction");

    expect(responsiveRules).toContain("Marketing surfaces and workspace surfaces may have different visual emphasis");
    expect(agents).toContain("Legacy color names are compatibility aliases only.");
    expect(agents).toContain("shared `DoughToolsIcon` semantic icon system backed by `lucide-react`");
    expect(packageJson).toMatch(/lucide-react/i);
  });

  it("defines one official semantic icon system for functional interface icons", () => {
    const iconMap = source("components/icons/icon-map.ts");
    const iconWrapper = source("components/icons/DoughToolsIcon.tsx");
    const designSystem = source("docs/design-system.md");
    const visualGuide = source("docs/visual-style-guide.md");

    expect(iconMap).toContain("from \"lucide-react\"");
    expect(iconMap).toContain("doughToolsIconMap");
    expect(iconMap).toContain("satisfies Record<string, LucideIcon>");
    expect(iconWrapper).toContain("export type DoughToolsIconSize = 16 | 20 | 24 | 32");
    expect(iconWrapper).toContain("aria-hidden");
    expect(iconWrapper).toContain("aria-label");
    expect(iconWrapper).toContain("color=\"currentColor\"");

    for (const semanticName of [
      "pizza",
      "flame",
      "oven",
      "clock",
      "timer",
      "calendar",
      "thermometer",
      "refrigerator",
      "mixing-bowl",
      "wheat",
      "water",
      "salt",
      "yeast",
      "scale",
      "shopping-basket",
      "checklist",
      "timeline",
      "kitchen-mode",
      "chef-hat",
      "camera",
      "history",
      "party",
      "account",
      "experience-level",
      "warning",
      "information",
      "success",
      "error",
      "back",
      "forward",
      "close",
      "add",
      "remove",
      "edit",
      "delete",
      "archive",
      "restore",
      "share",
      "download",
      "external-link",
      "menu",
      "chevron-down",
      "chevron-up",
      "check",
    ]) {
      expect(iconMap).toMatch(new RegExp(`["']?${semanticName}["']?:`));
    }

    expect(designSystem).toContain("Canonical icon sizes");
    expect(visualGuide).toContain("The official source is `lucide-react`");
  });

  it("exports lightweight shared layout and UI components", () => {
    const componentSource = source("components/design-system.tsx");

    expect(componentSource).toContain("export function PageShell");
    expect(componentSource).toContain("export function PageHero");
    expect(componentSource).toContain("export function PageSection");
    expect(componentSource).toContain("export function ContentGrid");
    expect(componentSource).toContain("export function Card");
    expect(componentSource).toContain("export function TipCard");
    expect(componentSource).toContain("export function StepCard");
    expect(componentSource).toContain("export function PrimaryButton");
    expect(componentSource).toContain("export function SecondaryButton");
    expect(componentSource).toContain("export function StatusPill");
    expect(componentSource).toContain("export function BottomActionBar");
    expect(componentSource).toContain("bg-[var(--dt-primary)]");
    expect(componentSource).toContain("order-2 sm:order-1");
    expect(componentSource).toContain("order-1 sm:order-2");
  });
});
