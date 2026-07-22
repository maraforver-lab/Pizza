import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPERIENCE_LEVELS } from "@/lib/experience-levels";
import { navigationGroups, navigationItems } from "@/lib/navigation";

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

  it("keeps the legacy /start route free of client-only UI while preserving the redirect", () => {
    const startSource = source("app/start/page.tsx");

    expect(startSource).toContain("permanentRedirect");
    expect(startSource).toContain('"/session/start"');
    expect(startSource).not.toContain('"use client"');
    expect(startSource).not.toContain("ExperienceLevelSelector");
    expect(startSource).not.toContain("Start Here");
  });

  it("keeps minimal global header controls named and active state available without color alone", () => {
    const navigationSource = source("components/GlobalToolNavigation.tsx");

    expect(navigationSource).toContain("aria-label=\"DoughTools home\"");
    expect(navigationSource).toContain("aria-haspopup=\"menu\"");
    expect(navigationSource).toContain("aria-expanded={learningMenuOpen}");
    expect(navigationSource).toContain("aria-expanded={mobileMenuOpen}");
    expect(navigationSource).toContain("aria-controls=\"global-learning-menu\"");
    expect(navigationSource).toContain("aria-controls=\"global-mobile-menu\"");
    expect(navigationSource).toContain("aria-label=\"Pizza guides menu\"");
    expect(navigationSource).toContain("aria-label=\"Mobile navigation menu\"");
    expect(navigationSource).toContain("aria-label=\"Open DoughTools navigation menu\"");
    expect(navigationSource).toContain('const doughGuideActive = pathname === "/guides/dough"');
    expect(navigationSource).toContain('const learningCenterActive = pathname === "/guide"');
    expect(navigationSource).toContain('const troubleshootingActive = pathname === "/guide/pizza-troubleshooting"');
    expect(navigationSource).toContain('aria-current={active ? "page" : undefined}');
    expect(navigationSource).toContain('aria-current={aboutActive ? "page" : undefined}');
    expect(navigationSource).toContain("menuItemClass");
    expect(navigationSource).toContain("navLinkClass");
    expect(navigationSource).toContain("ring-tomato/20");
    expect(navigationSource).toContain("focus-visible:ring");
    expect(navigationSource).toContain('const startActive = pathname === "/session/start"');
    expect(navigationSource).toContain('const accountActive = pathname === "/account"');
    expect(navigationSource).toContain('href="/account"');
    expect(navigationSource).toContain('account: "Account"');
    expect(navigationSource).toContain('accountActive: "Account"');
    expect(navigationSource).toContain("aria-label={copy.account}");
    expect(navigationSource).toContain("bg-ink text-white");
    expect(navigationSource).toContain("getSupabaseBrowserClient");
    expect(navigationSource).toContain("supabase.auth.getSession()");
    expect(navigationSource).not.toContain('startSession: "Start Pizza Session"');
    expect(navigationSource).toContain('href="/session/start"');
    expect(navigationSource).not.toContain("Tools menu");
    expect(navigationSource).toContain('href: "/toppings"');
    expect(navigationSource).toContain("Choose toppings");
    expect(navigationSource).not.toContain('href="/timer"');
    expect(navigationSource).not.toContain('href="/costs"');
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

  it("keeps retired Plan as a server-side redirect without selectable planner controls", () => {
    const planSource = source("app/plan/page.tsx");

    expect(planSource).toContain("permanentRedirect");
    expect(planSource).toContain('"/session/start"');
    expect(planSource).not.toContain("<h1");
    expect(planSource).not.toContain("aria-pressed");
    expect(planSource).not.toContain("Selected schedule mode");
    expect(planSource).not.toContain("doughtools-active-plan-v1");
  });

  it("keeps retired Doctor as a server-side redirect without diagnostic UI", () => {
    const doctorSource = source("app/doctor/page.tsx");

    expect(doctorSource).toContain("permanentRedirect");
    expect(doctorSource).toContain('"/guide/pizza-troubleshooting"');
    expect(doctorSource).not.toContain("<h1");
    expect(doctorSource).not.toContain("aria-pressed={active}");
  });

  it("keeps account guidance compact while preserving Pizza Session experience controls", () => {
    const accountSource = source("app/account/page.tsx");
    const accountGuidanceSource = source("components/account/AccountGuidancePreference.tsx");
    const sessionStartSource = source("app/session/start/page.tsx");

    expect(accountSource).toContain("AccountGuidancePreference");
    expect(accountGuidanceSource).toContain("Guidance level");
    expect(accountGuidanceSource).toContain("aria-expanded={expanded}");
    expect(accountGuidanceSource).toContain("aria-controls=\"account-guidance-selector\"");
    expect(accountGuidanceSource).toContain("readExperienceLevelPreference");
    expect(accountGuidanceSource).toContain("ExperienceLevelSelector");
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
