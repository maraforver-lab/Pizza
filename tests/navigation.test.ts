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
    expect(header).toContain("Tools");
    expect(header).toContain("const [toolsMenuOpen, setToolsMenuOpen] = useState(false)");
    expect(header).toContain("setToolsMenuOpen(false)");
    expect(header).toContain("aria-expanded={toolsMenuOpen}");
    expect(header).toContain('aria-label="Tools menu"');
    expect(header).toContain('const accountActive = pathname === "/account"');
    expect(header).toContain('href="/account"');
    expect(header).toContain("Sign in");
    expect(header).toContain("Your account");
    expect(header).not.toContain("Start Pizza Session");
    expect(header).not.toContain('href="/session/start"');
    expect(header).not.toMatch(/Dough Calculator|Make pizza|Learn & troubleshoot|My DoughTools|More tools|navigationGroups\.map|panelId|fixed inset-x-2/);
  });

  it("closes the Tools dropdown on navigation, item click, outside click and Escape", () => {
    const header = readFileSync(join(process.cwd(), "components", "GlobalToolNavigation.tsx"), "utf8");

    expect(header).toContain("const [toolsMenuOpen, setToolsMenuOpen] = useState(false)");
    expect(header).toContain("const toolsMenuRef = useRef<HTMLDivElement>(null)");
    expect(header).toContain("setToolsMenuOpen(false)");
    expect(header).toContain("}, [pathname]);");
    expect(header).toContain("toolsMenuOpen && !toolsMenuRef.current?.contains(target)");
    expect(header).toContain("event.key === \"Escape\"");
    expect(header).toContain("onClick={() => setToolsMenuOpen(false)}");
    expect(header).toContain("aria-expanded={toolsMenuOpen}");
    expect(header).toContain('aria-controls="global-tools-menu"');
    expect(header).toContain('role="menu" aria-label="Tools menu"');
    expect(header).toContain('role="menuitem"');
    expect(header).not.toContain("<details");
    expect(header).not.toContain("<summary");
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
