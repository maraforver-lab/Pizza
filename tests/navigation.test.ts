import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isNavigationGroupActive,
  isNavigationItemActive,
  navigationGroups,
  navigationItems,
  primaryNavigationItemId,
  splitNavigationHref,
} from "@/lib/navigation";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

const globalNavigationRoutes = [
  "/session/start",
  "/guide",
  "/guides/dough",
  "/sauce",
  "/ovens",
  "/styles",
  "/guide/pizza-troubleshooting",
  "/calculator/quick",
  "/about",
  "/account",
] as const;

const contextualOrFooterUtilityRoutes = [
  "/toppings",
  "/timer",
  "/costs",
] as const;

const retiredRoutes = [
  "/start",
  "/history",
  "/gear",
  "/doctor",
  "/plan",
  "/coach",
] as const;

describe("final product navigation model", () => {
  it("keeps group and route identifiers unique", () => {
    const groupIds = navigationGroups.map((group) => group.id);
    const hrefs = navigationItems.map((item) => item.href);

    expect(new Set(groupIds).size).toBe(groupIds.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("uses valid internal URLs and English labels only", () => {
    const forbidden = /\b(Laskuri|Suunnittele|Opi|Omat|Kaikki työkalut|Kalkylator|Planera|Lär|Mina)\b|[äöåÄÖÅ]/;

    for (const group of navigationGroups) {
      expect(group.label.trim()).toBeTruthy();
      expect(group.shortLabel.trim()).toBeTruthy();
      expect(group.description.trim()).toBeTruthy();
      expect(group.label).not.toMatch(forbidden);
      expect(group.shortLabel).not.toMatch(forbidden);

      for (const item of group.items) {
        expect(item.href.startsWith("/")).toBe(true);
        expect(item.href).not.toContain("http");
        expect(item.href).not.toContain("//");
        expect(item.label.trim()).toBeTruthy();
        expect(item.description.trim()).toBeTruthy();
        expect(item.label).not.toMatch(forbidden);
      }
    }
  });

  it("exposes the final canonical global navigation routes", () => {
    const paths = new Set(navigationItems.map((item) => splitNavigationHref(item.href).pathname));

    for (const route of globalNavigationRoutes) {
      expect(paths.has(route)).toBe(true);
    }
  });

  it("does not expose contextual utilities as global navigation pillars", () => {
    const paths = new Set(navigationItems.map((item) => splitNavigationHref(item.href).pathname));
    const labels = navigationItems.map((item) => item.label).join("\n");

    for (const route of contextualOrFooterUtilityRoutes) {
      expect(paths.has(route)).toBe(false);
    }

    expect(labels).not.toMatch(/Topping Balance Lab|Baking Timer|Cost Calculator|Pizza costs/);
  });

  it("does not expose retired compatibility routes", () => {
    const hrefs = navigationItems.map((item) => item.href);
    const labels = navigationItems.map((item) => item.label).join("\n");

    for (const route of retiredRoutes) {
      expect(hrefs).not.toContain(route);
      expect(hrefs.some((href) => href.startsWith(`${route}?`))).toBe(false);
    }

    expect(labels).not.toMatch(/Fermentation Planner|Dough Doctor|Pizza Coach|History|Gear/);
    expect(existsSync(join(process.cwd(), "app", "journal", "page.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "app", "community", "page.tsx"))).toBe(false);
  });

  it("uses Plan my next pizza as the primary global navigation action", () => {
    const primaryItem = navigationItems.find((item) => item.id === primaryNavigationItemId);
    const primaryGroup = navigationGroups.find((group) => group.id === "primary");

    expect(primaryNavigationItemId).toBe("start");
    expect(primaryItem?.href).toBe("/session/start");
    expect(primaryItem?.label).toBe("Plan my next pizza");
    expect(primaryGroup?.items.some((item) => item.id === primaryNavigationItemId)).toBe(true);
  });

  it("keeps the shared navigation model aligned with the final product tree", () => {
    expect(navigationGroups.map((group) => group.id)).toEqual(["primary", "learning", "secondary", "account"]);
    expect(navigationGroups.find((group) => group.id === "secondary")?.items.map((item) => item.href)).toEqual(["/calculator/quick"]);
  });

  it("renders desktop navigation without the generic Tools product pillar", () => {
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(header).toContain('href="/session/start"');
    expect(header).toContain("Plan my next pizza");
    expect(header).toContain("Learning Center");
    expect(header).toContain('aria-label="Learning Center menu"');
    expect(header).toContain("Quick Calculator");
    expect(header).toContain('href="/calculator/quick"');
    expect(header).toContain("About");
    expect(header).toContain('href="/about"');
    expect(header).toContain("Account");
    expect(header).toContain('href="/account"');
    expect(header).toContain('aria-label="Primary"');
    expect(header).not.toContain('copy.tools');
    expect(header).not.toContain('type OpenNavigationMenu = "guide" | "tools" | null');
    expect(header).not.toContain("Tools menu");
    expect(header).not.toContain('href="/toppings"');
    expect(header).not.toContain('href: "/toppings"');
    expect(header).not.toContain('href="/timer"');
    expect(header).not.toContain('href="/costs"');
    expect(header).not.toMatch(/Make pizza|Learn & troubleshoot|My DoughTools|More tools|navigationGroups\.map|panelId|fixed inset-x-2/);
  });

  it("renders a mobile navigation menu with the same product priorities", () => {
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(header).toContain('aria-label="Open DoughTools navigation menu"');
    expect(header).toContain('aria-controls="global-mobile-menu"');
    expect(header).toContain('aria-haspopup="dialog"');
    expect(header).toContain('role="dialog"');
    expect(header).toContain('aria-modal="true"');
    expect(header).toContain('aria-label="Mobile navigation menu"');
    expect(header).toContain("data-mobile-menu-overlay");
    expect(header).toContain("h-[100dvh]");
    expect(header).toContain("bg-cream text-ink");
    expect(header).toContain("data-mobile-menu-scroll");
    expect(header).toContain("overscroll-contain");
    expect(header).toContain('const mobileMenuOpen = openMenu === "mobile"');
    expect(header).toContain('type OpenNavigationMenu = "learning" | "mobile" | null');
    expect(header.indexOf("data-mobile-menu-section=\"account\"")).toBeLessThan(header.indexOf("data-mobile-menu-section=\"pizza\""));
    expect(header.indexOf("data-mobile-menu-section=\"pizza\"")).toBeLessThan(header.indexOf("data-mobile-menu-section=\"tools\""));
    expect(header.indexOf("data-mobile-menu-section=\"tools\"")).toBeLessThan(header.indexOf("data-mobile-menu-section=\"learn\""));
    expect(header.indexOf("data-mobile-menu-section=\"learn\"")).toBeLessThan(header.indexOf("data-mobile-menu-section=\"about\""));
    expect(header).toContain("Sign in");
    expect(header).toContain("Save your pizza plans and continue on another device.");
    expect(header).toContain("My account");
    expect(header).toContain("Manage your pizza plans and preferences.");
    expect(header).toContain("Checking account...");
    expect(header).toContain("Continue making your pizza");
    expect(header).toContain("Start making a pizza");
    expect(header).toContain("Checking your pizza...");
    expect(header).toContain("resolveCanonicalActivePizzaSession");
    expect(header).toContain("href={sessionDecision.href}");
    expect(header).toContain("Quick dough calculator");
    expect(header).toContain("Calculate dough amounts without starting a full pizza plan.");
    expect(header).toContain('data-mobile-tools-extension-point="before-quick-dough-calculator"');
    expect(header).toContain("Learn to make better pizza");
    expect(header).toContain("Practical guides for dough, sauce, ovens and common problems.");
    expect(header).toContain("How to make pizza dough");
    expect(header).toContain("How to make pizza sauce");
    expect(header).toContain("Choose and use your oven");
    expect(header).toContain("Choose your pizza style");
    expect(header).toContain("Fix common pizza problems");
    expect(header).toContain("View all pizza guides");
    expect(header).toContain("About DoughTools");
    expect(header).toContain("Close menu");
    expect(header).not.toContain("Topping Balance Lab");
    expect(header).not.toContain("Bake Timer");
    expect(header).not.toContain("Pizza costs");
  });

  it("keeps dropdown accessibility behavior for desktop and mobile menus", () => {
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(header).toContain('const learningMenuOpen = openMenu === "learning"');
    expect(header).toContain('const mobileMenuOpen = openMenu === "mobile"');
    expect(header).toContain("const learningButtonRef = useRef<HTMLButtonElement>(null)");
    expect(header).toContain("const mobileButtonRef = useRef<HTMLButtonElement>(null)");
    expect(header).toContain("const mobileCloseButtonRef = useRef<HTMLButtonElement>(null)");
    expect(header).toContain('onKeyDown={openMenuFromKeyboard("learning")}');
    expect(header).toContain('onKeyDown={openMenuFromKeyboard("mobile")}');
    expect(header).toContain('event.key === "ArrowDown"');
    expect(header).toContain('event.key === "Escape"');
    expect(header).toContain('event.key !== "Tab"');
    expect(header).toContain("trigger?.focus()");
    expect(header).toContain("mobileButtonRef.current?.focus()");
    expect(header).toContain('document.body.style.overflow = "hidden"');
    expect(header).toContain('document.body.style.touchAction = "none"');
    expect(header).toContain("window.scrollTo(0, scrollY)");
    expect(header).toContain("!navigationRootRef.current?.contains(target)");
    expect(header).toContain("aria-expanded={learningMenuOpen}");
    expect(header).toContain("aria-expanded={mobileMenuOpen}");
    expect(header).toContain("aria-expanded={mobileLearnOpen}");
    expect(header).toContain('aria-controls="mobile-menu-learn-panel"');
    expect(header).toContain('aria-current={active ? "page" : undefined}');
  });

  it("detects active pages and hash destinations without query strings", () => {
    const start = navigationItems.find((item) => item.id === "start")!;
    const guide = navigationItems.find((item) => item.id === "guide")!;
    const learningGroup = navigationGroups.find((group) => group.id === "learning")!;

    expect(isNavigationItemActive(start, "/session/start", "")).toBe(true);
    expect(isNavigationItemActive(start, "/session/start", "anything")).toBe(false);
    expect(isNavigationItemActive(guide, "/guide", "")).toBe(true);
    expect(isNavigationGroupActive(learningGroup, "/sauce", "")).toBe(true);
  });
});
