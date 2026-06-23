import { describe, expect, it } from "vitest";
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

    expect(primaryItem?.href).toBe("/");
    expect(primaryItem?.label).toBe("Dough Calculator");
    expect(makeGroup?.items.some((item) => item.id === primaryNavigationItemId)).toBe(true);
  });

  it("keeps desktop and mobile navigation on the same underlying groups", () => {
    expect(navigationGroups.map((group) => group.id)).toEqual(["make", "learn", "my", "support"]);
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
