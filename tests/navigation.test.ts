import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isNavigationGroupActive,
  isNavigationItemActive,
  navigationGroups,
  navigationItems,
  primaryNavigationItemId,
  splitNavigationHref,
} from "@/lib/navigation";

const requiredRoutes = [
  "/",
  "/start",
  "/plan",
  "/sauce",
  "/toppings",
  "/timer",
  "/doctor",
  "/styles",
  "/guide",
  "/guides/dough",
  "/ovens",
  "/gear",
  "/history",
  "/journal",
  "/account",
  "/community",
  "/coach",
  "/costs",
  "/updates",
] as const;

describe("shared navigation model", () => {
  it("keeps group identifiers unique", () => {
    const ids = navigationGroups.map((group) => group.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps route entries unique while still allowing hash destinations", () => {
    const hrefs = navigationItems.map((item) => item.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("uses valid internal URLs only", () => {
    for (const item of navigationItems) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.href).not.toContain("http");
      expect(item.href).not.toContain("//");
    }
  });

  it("has required English labels and descriptions", () => {
    for (const group of navigationGroups) {
      expect(group.label.trim()).toBeTruthy();
      expect(group.shortLabel.trim()).toBeTruthy();
      expect(group.description.trim()).toBeTruthy();
      for (const item of group.items) {
        expect(item.label.trim()).toBeTruthy();
        expect(item.description.trim()).toBeTruthy();
      }
    }
  });

  it("does not reintroduce Finnish or Swedish active navigation labels", () => {
    const forbidden = /\b(Laskuri|Suunnittele|Opi|Omat|Kaikki työkalut|Kalkylator|Planera|Lär|Mina)\b|[äöåÄÖÅ]/;
    const labels = navigationGroups.flatMap((group) => [group.label, group.shortLabel, ...group.items.map((item) => item.label)]);

    for (const label of labels) {
      expect(label).not.toMatch(forbidden);
    }
  });

  it("includes every required existing route without renaming route URLs", () => {
    const paths = new Set(navigationItems.map((item) => splitNavigationHref(item.href).pathname));

    for (const route of requiredRoutes) {
      expect(paths.has(route)).toBe(true);
    }
  });

  it("keeps Dough Calculator as the primary entry inside the Make pizza group", () => {
    const makeGroup = navigationGroups.find((group) => group.id === "make");
    const primaryItem = navigationItems.find((item) => item.id === primaryNavigationItemId);

    expect(primaryItem?.href).toBe("/?calculator=1");
    expect(primaryItem?.label).toBe("Dough Calculator");
    expect(makeGroup?.items.some((item) => item.id === primaryNavigationItemId)).toBe(true);
  });

  it("keeps desktop and mobile navigation on the same underlying groups", () => {
    expect(navigationGroups.map((group) => group.id)).toEqual(["make", "learn", "my", "support"]);
  });

  it("keeps the visible global header minimal for the homepage UX lockdown", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain('href="/"');
    expect(header).toContain("max-sm:sr-only");
    expect(header).toContain("Tools");
    expect(header).toContain('type OpenNavigationMenu = "guide" | "tools" | null');
    expect(header).toContain("const [openMenu, setOpenMenu] = useState<OpenNavigationMenu>(null)");
    expect(header).toContain('const toolsMenuOpen = openMenu === "tools"');
    expect(header).toContain("setOpenMenu(null)");
    expect(header).toContain("aria-expanded={toolsMenuOpen}");
    expect(header).toContain('aria-label="Tools menu"');
    expect(header).toContain("Guide");
    expect(header).toContain('aria-label="Guide menu"');
    expect(header).toContain('const aboutActive = pathname === "/about"');
    expect(header).toContain('const accountActive = pathname === "/account"');
    expect(header).toContain('const doughGuideActive = pathname === "/guides/dough"');
    expect(header).toContain('const guideGlossaryActive = pathname === "/guide"');
    expect(header).toContain('const sauceGuideActive = pathname === "/sauce"');
    expect(header).toContain('const pizzaStylesActive = pathname === "/styles"');
    expect(header).toContain('const ovenGuideActive = pathname === "/ovens"');
    expect(header).toContain('const troubleshootingGuideActive = pathname === "/guide/pizza-troubleshooting"');
    expect(header).toContain('href="/account"');
    expect(header).toContain("Sign in");
    expect(header).toContain("Your account");
    expect(header).toContain("max-sm:sr-only");
    expect(header).not.toContain("Start Pizza Session");
    expect(header).not.toContain('href="/session/start"');
    expect(header).not.toMatch(/Make pizza|Learn & troubleshoot|My DoughTools|More tools|navigationGroups\.map|panelId|fixed inset-x-2/);
    expect(header).not.toContain('label: "Dough Calculator"');
  });

  it("removes Lab from the global header without deleting the legacy calculator route", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");
    const homepage = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");

    expect(header).not.toContain("Lab");
    expect(header).not.toContain("copy.lab");
    expect(header).not.toContain('href="/?calculator=1"');
    expect(header).toContain("About");
    expect(header).toContain('href="/about"');
    expect(header).toContain("Guide");
    expect(header).toContain("Tools");
    expect(header).toContain('href="/account"');
    expect(homepage).toContain("calculatorViewFor");
    expect(homepage).toContain('params.calculator === "2" ? "guided" : "entry"');
  });

  it("closes the Tools dropdown on navigation, item click, outside click and Escape", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain('const toolsMenuOpen = openMenu === "tools"');
    expect(header).toContain("const toolsMenuRef = useRef<HTMLDivElement>(null)");
    expect(header).toContain("setOpenMenu(null)");
    expect(header).toContain("}, [pathname]);");
    expect(header).toContain("const navigationRootRef = useRef<HTMLDivElement>(null)");
    expect(header).toContain("!navigationRootRef.current?.contains(target)");
    expect(header).toContain("event.key === \"Escape\"");
    expect(header).toContain("trigger?.focus()");
    expect(header).toContain('onClick={() => setOpenMenu((menu) => menu === "tools" ? null : "tools")}');
    expect(header).toContain('onKeyDown={openMenuFromKeyboard("tools")}');
    expect(header).toContain("aria-expanded={toolsMenuOpen}");
    expect(header).toContain('aria-controls="global-tools-menu"');
    expect(header).toContain('role="menu" aria-label="Tools menu"');
    expect(header).toContain('role="menuitem"');
    expect(header).not.toContain("<details");
    expect(header).not.toContain("<summary");
  });

  it("limits the Tools dropdown to the standalone Quick Dough Calculator destination", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain("const toolsMenuItems = [");
    expect(header).toContain("toolsMenuItems.map");
    expect(header).toContain("Quick Dough Calculator");
    expect(header).toContain("Standalone dough amounts, preferments, sizing and advanced tools.");
    expect(header).toContain('href: "/calculator/quick"');
    expect(header.split('href: "/calculator/quick"')).toHaveLength(2);
    expect(header).toContain('const quickCalculatorActive = pathname === "/calculator/quick"');
    expect(header).toContain('aria-current={quickCalculatorActive ? "page" : undefined}');
    expect(header).toContain("guideMenuItemClass(quickCalculatorActive)");
    expect(header).not.toContain("Calculator v2");
    expect(header).not.toContain("Pizza dough calculator");
    expect(header).not.toContain("Calculator v1");
    expect(header).not.toContain("Calculate flour, water, salt and yeast.");
    expect(header).not.toContain("Full-control planning lab for dough variables and risk.");
  });

  it("uses one controlled menu state for Guide and Tools dropdowns on desktop and mobile", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain('const guideMenuOpen = openMenu === "guide"');
    expect(header).toContain('const toolsMenuOpen = openMenu === "tools"');
    expect(header).toContain("const guideButtonRef = useRef<HTMLButtonElement>(null)");
    expect(header).toContain("const toolsButtonRef = useRef<HTMLButtonElement>(null)");
    expect(header).toContain('onClick={() => setOpenMenu((menu) => menu === "guide" ? null : "guide")}');
    expect(header).toContain('onClick={() => setOpenMenu((menu) => menu === "tools" ? null : "tools")}');
    expect(header).toContain('onKeyDown={openMenuFromKeyboard("guide")}');
    expect(header).toContain('event.key === "ArrowDown"');
    expect(header).toContain('aria-controls="global-guide-menu"');
    expect(header).toContain('id="global-guide-menu"');
    expect(header).toContain('role="menu" aria-label="Guide menu"');
    expect(header).toContain('href="/guides/dough"');
    expect(header).toContain('href="/sauce"');
    expect(header).toContain('href="/guide/pizza-troubleshooting"');
    expect(header).toContain('href="/styles"');
    expect(header).toContain('href="/ovens"');
    expect(header).toContain('aria-current={doughGuideActive ? "page" : undefined}');
    expect(header).toContain('aria-current={guideGlossaryActive ? "page" : undefined}');
    expect(header).toContain('aria-current={sauceGuideActive ? "page" : undefined}');
    expect(header).toContain('aria-current={pizzaStylesActive ? "page" : undefined}');
    expect(header).toContain('aria-current={ovenGuideActive ? "page" : undefined}');
    expect(header).toContain('aria-current={troubleshootingGuideActive ? "page" : undefined}');
    expect(header).toContain('aria-current={aboutActive ? "page" : undefined}');
    expect(header).toContain("guideMenuItemClass(doughGuideActive)");
    expect(header).toContain("guideMenuItemClass(guideGlossaryActive)");
    expect(header).toContain("guideMenuItemClass(sauceGuideActive)");
    expect(header).toContain("guideMenuItemClass(pizzaStylesActive)");
    expect(header).toContain("guideMenuItemClass(ovenGuideActive)");
    expect(header).toContain("guideMenuItemClass(troubleshootingGuideActive)");
    expect(header).toContain("guideMenuItemClass(aboutActive)");
    expect(header).toContain("!navigationRootRef.current?.contains(target)");
    expect(header).toContain("overflow-visible");
    expect(header).toContain("z-[60]");
    expect(header).toContain("z-[70]");
    expect(header).toContain("w-[min(21rem,calc(100vw-1.5rem))]");
    expect(header).toContain("max-sm:max-h-[calc(100vh-4.5rem)]");
    expect(header).toContain("max-sm:overflow-y-auto");
  });

  it("makes About available in compact mobile navigation without duplicating the header control", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain('const aboutActive = pathname === "/about"');
    expect(header).toContain('<nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">');
    expect(header).toContain('href="/about"');
    expect(header.split('href="/about"')).toHaveLength(3);
    expect(header).toContain('aria-current={aboutActive ? "page" : undefined}');
    expect(header).toContain('className={`${guideMenuItemClass(aboutActive)} lg:hidden`}');
    expect(header).toContain("onClick={() => setOpenMenu(null)}");
    expect(header).toContain("max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto");
    expect(header).toContain('aria-label="Guide menu"');
    expect(header).toContain("Tools");
    expect(header).toContain('href="/account"');
    expect(header).not.toContain("overflow-x-hidden");
  });

  it("keeps compact header controls usable at narrow mobile widths", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain('aria-label="DoughTools home"');
    expect(header).toContain("max-sm:sr-only");
    expect(header).toContain('className={`${guideMenuItemClass(aboutActive)} lg:hidden`}');
    expect(header).toContain('aria-label={signedIn ? copy.accountActive : copy.account}');
    expect(header).toContain("h-10");
    expect(header).toContain("min-w-0");
    expect(header).toContain("w-[min(21rem,calc(100vw-1.5rem))]");
    expect(header).toContain("max-sm:max-h-[calc(100vh-4.5rem)]");
    expect(header).toContain("max-sm:overflow-y-auto");
    expect(header).toContain("w-64");
    expect(header).toContain("max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto");
    expect(header).not.toContain("overflow-x-hidden");
  });

  it("detects active pages and hash destinations without query strings", () => {
    const calculator = navigationItems.find((item) => item.id === "calculator")!;
    const savedRecipes = navigationItems.find((item) => item.id === "saved-recipes")!;
    const myGroup = navigationGroups.find((group) => group.id === "my")!;

    expect(isNavigationItemActive(calculator, "/", "")).toBe(true);
    expect(isNavigationItemActive(calculator, "/", "my-recipes")).toBe(false);
    expect(isNavigationItemActive(savedRecipes, "/", "my-recipes")).toBe(true);
    expect(isNavigationGroupActive(myGroup, "/", "my-recipes")).toBe(true);
  });
});
