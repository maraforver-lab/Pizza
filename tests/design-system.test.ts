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

    expect(globals).toContain("--dt-primary: #0F3D2E;");
    expect(globals).toContain("--dt-primary-dark: #09291F;");
    expect(globals).toContain("--dt-background-warm: #FFF8F1;");
    expect(globals).toContain("--dt-card: #FFFFFF;");
    expect(globals).toContain("--dt-tomato: #E94B2E;");
    expect(globals).toContain("--dt-text-muted: #6B645D;");
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
