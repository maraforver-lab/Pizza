import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPERIENCE_LEVELS } from "@/lib/experience-levels";
import { navigationGroups, navigationItems } from "@/lib/navigation";
import { startHerePaths } from "@/lib/start-here";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("core accessibility baseline", () => {
  it("keeps experience level selector options named, grouped and stateful", () => {
    const selectorSource = source("components/ExperienceLevelSelector.tsx");

    expect(selectorSource).toContain("role=\"group\"");
    expect(selectorSource).toContain("aria-label=\"Experience level options\"");
    expect(selectorSource).toContain("aria-pressed={active}");
    expect(selectorSource).toContain("aria-label={`Select ${level.label} guidance level");
    expect(selectorSource).toContain("currently selected");
    for (const level of EXPERIENCE_LEVELS) {
      expect(["Beginner", "Enthusiast", "Pizza Nerd"]).toContain(level.label);
      expect(level.label.trim()).toBeTruthy();
    }
  });

  it("keeps Start Here cards labelled by visible headings and clear CTAs", () => {
    const startSource = source("app/start/page.tsx");

    expect(startSource).toContain("aria-labelledby={headingId}");
    expect(startSource).toContain("id={headingId}");
    expect(startSource).toContain("aria-hidden=\"true\"");
    expect(startSource).toContain("focus-visible:ring");
    expect(startHerePaths.map((path) => path.title)).toEqual([
      "Home oven pizza",
      "Pizza oven pizza",
      "Pan / tray pizza",
    ]);
    for (const path of startHerePaths) {
      expect(path.primaryCta).not.toMatch(/\b(here|click|more)\b/i);
      expect(path.secondaryCta).not.toMatch(/\b(here|click|more)\b/i);
      expect(path.title.trim()).toBeTruthy();
      expect(path.description.trim()).toBeTruthy();
    }
  });

  it("keeps minimal global header controls named and active state available without color alone", () => {
    const navigationSource = source("components/GlobalToolNavigation.tsx");

    expect(navigationSource).toContain("aria-label=\"DoughTools home\"");
    expect(navigationSource).toContain("aria-haspopup=\"menu\"");
    expect(navigationSource).toContain("aria-expanded={guideMenuOpen}");
    expect(navigationSource).toContain("aria-expanded={toolsMenuOpen}");
    expect(navigationSource).toContain("aria-controls=\"global-tools-menu\"");
    expect(navigationSource).toContain("aria-label=\"Guide menu\"");
    expect(navigationSource).toContain("aria-label=\"Tools menu\"");
    expect(navigationSource).toContain('aria-current={doughGuideActive ? "page" : undefined}');
    expect(navigationSource).toContain('aria-current={guideGlossaryActive ? "page" : undefined}');
    expect(navigationSource).toContain('aria-current={troubleshootingGuideActive ? "page" : undefined}');
    expect(navigationSource).toContain('aria-current={aboutActive ? "page" : undefined}');
    expect(navigationSource).toContain("guideMenuItemClass");
    expect(navigationSource).toContain('className={`${guideMenuItemClass(aboutActive)} lg:hidden`}');
    expect(navigationSource).toContain("ring-tomato/20");
    expect(navigationSource).toContain("focus-visible:ring");
    expect(navigationSource).toContain('const accountActive = pathname === "/account"');
    expect(navigationSource).toContain('href="/account"');
    expect(navigationSource).toContain('account: "Sign in"');
    expect(navigationSource).toContain('accountActive: "Your account"');
    expect(navigationSource).toContain("aria-label={signedIn ? copy.accountActive : copy.account}");
    expect(navigationSource).toContain("border-ink bg-ink text-white");
    expect(navigationSource).toContain("getSupabaseBrowserClient");
    expect(navigationSource).toContain("supabase.auth.getSession()");
    expect(navigationSource).not.toContain('startSession: "Start Pizza Session"');
    expect(navigationSource).not.toContain('href="/session/start"');
    expect(navigationSource).not.toContain("aria-expanded={expanded}");
    expect(navigationSource).not.toContain("aria-controls={panelId}");
    for (const item of navigationItems) {
      expect(item.label.trim()).toBeTruthy();
      expect(item.description.trim()).toBeTruthy();
    }
    for (const group of navigationGroups) {
      expect(group.label.trim()).toBeTruthy();
      expect(group.shortLabel.trim()).toBeTruthy();
    }
  });

  it("keeps calculator steppers and save-bake rating controls accessible in the calculator workspace", () => {
    const homepageSource = source("components/HomeCalculatorWorkspace.tsx");

    expect(homepageSource).toContain("aria-label={decreaseLabel}");
    expect(homepageSource).toContain("aria-label={increaseLabel}");
    expect(homepageSource).toContain("Set overall bake rating to ${rating} out of 5");
    expect(homepageSource).toContain("aria-pressed={bakeRating === rating}");
    expect(homepageSource).toContain("focus-visible:ring");
    expect(homepageSource).toContain("<h1");
  });

  it("keeps Planner selectable controls labelled, stateful and focusable", () => {
    const planSource = source("app/plan/page.tsx");

    expect(planSource).toContain("<h1");
    expect(planSource).toContain("aria-pressed={mode === \"start\"}");
    expect(planSource).toContain("aria-pressed={mode === \"bake\"}");
    expect(planSource).toContain("aria-pressed={isDone}");
    expect(planSource).toContain("Selected schedule mode");
    expect(planSource).toContain("focus-visible:ring");
  });

  it("keeps Dough Doctor image choices named beyond checkmark and X markers", () => {
    const doctorSource = source("app/doctor/page.tsx");

    expect(doctorSource).toContain("<h1");
    expect(doctorSource).toContain("aria-label={`Choose dough situation: ${labels[0]}");
    expect(doctorSource).toContain("aria-pressed={active}");
    expect(doctorSource).toContain("Selected dough situation");
    expect(doctorSource).toContain("aria-hidden=\"true\"");
    expect(doctorSource).toContain("focus-visible:ring");
  });

  it("removes the account page experience selector while preserving Pizza Session experience controls", () => {
    const accountSource = source("app/account/page.tsx");
    const sessionStartSource = source("app/session/start/page.tsx");

    expect(accountSource).not.toContain("aria-labelledby=\"account-experience-heading\"");
    expect(accountSource).not.toContain("Account experience level options");
    expect(accountSource).not.toContain("Choose how much guidance you want.");
    expect(accountSource).not.toContain("Beginner");
    expect(accountSource).not.toContain("Enthusiast");
    expect(accountSource).not.toContain("Pizza Nerd");
    expect(accountSource).not.toContain("EXPERIENCE_LEVELS");
    expect(accountSource).not.toContain("writeExperienceLevelPreference");
    expect(sessionStartSource).toContain("readExperienceLevelPreference");
    expect(sessionStartSource).toContain("shouldShowPizzaNerdDoughControls");
    expect(sessionStartSource).toContain("pizza_nerd");
    expect(accountSource).not.toContain("Saved recipe value");
    expect(accountSource).not.toContain("Save recipes to make progress repeatable.");
  });

  it("keeps guide, updates and accessibility docs with meaningful headings", () => {
    expect(source("app/guide/page.tsx")).toContain("<h1");
    expect(source("app/updates/page.tsx")).toContain("<h1");
    expect(existsSync(join(process.cwd(), "docs", "accessibility-baseline.md"))).toBe(true);

    const doc = source("docs/accessibility-baseline.md");
    expect(doc).toContain("Color-not-alone rule");
    expect(doc).toContain("Focus visibility");
    expect(doc).toContain("Touch targets");
    expect(doc).toContain("did not change");
  });

  it("preserves pre-launch indexing protection and avoids Search Console changes", () => {
    const seoSource = source("lib/seo-config.ts");
    const nextConfig = source("next.config.ts");
    const accessibilityDoc = source("docs/accessibility-baseline.md");

    expect(seoSource).toContain("ALLOW_INDEXING");
    expect(nextConfig).toContain("noindex, nofollow, noarchive");
    expect(accessibilityDoc).not.toMatch(/Search Console verification|Google Analytics|gtag|posthog|plausible/i);
  });
});
