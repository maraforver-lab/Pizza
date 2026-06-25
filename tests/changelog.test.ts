import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getVisibleUpdates,
  isUpdateRecent,
  latestPublicUpdate,
  MAX_VISIBLE_UPDATES,
  newUpdateNotice,
  patchHistory,
  patchHistoryNewestFirst,
  RECENT_UPDATE_NOTICE_VISIBLE_MS,
  sortUpdatesNewestFirst,
  updates,
  visiblePatchHistory,
  visiblePublicUpdates,
} from "@/lib/changelog";

const publicCopy = [
  ...updates.flatMap((update) => [
    update.title,
    update.summary,
    update.category,
    update.userImpact,
    ...update.highlights,
    ...update.details,
    update.technicalNote ?? "",
  ]),
  ...patchHistory.flatMap((entry) => [
    entry.title,
    entry.summary,
    entry.category,
    entry.userImpact,
    ...entry.highlights,
    ...entry.details,
    entry.technicalNote ?? "",
  ]),
  newUpdateNotice.label,
  newUpdateNotice.copy,
].join("\n");

describe("updates changelog", () => {
  it("defines the latest public foundation update", () => {
    expect(latestPublicUpdate).toBeDefined();
    expect(latestPublicUpdate?.title).toBe("Homepage session-first visual cleanup");
    expect(latestPublicUpdate?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(`${latestPublicUpdate?.date}T12:00:00Z`))).toBe(false);
  });

  it("sorts updates newest first and uses the newest public update as latest", () => {
    const sorted = sortUpdatesNewestFirst([
      { id: "older", date: "2026-06-21" },
      { id: "invalid", date: "not-a-date" },
      { id: "newer", date: "2026-06-23" },
    ]);

    expect(sorted.map((update) => update.id)).toEqual(["newer", "older", "invalid"]);
    expect(latestPublicUpdate).toBe(visiblePublicUpdates[0]);
  });

  it("limits visible updates to the newest 20 without mutating source data", () => {
    const source = Array.from({ length: 25 }, (_, index) => ({
      id: `update-${index + 1}`,
      date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    }));
    const originalOrder = source.map((update) => update.id);

    const visible = getVisibleUpdates(source);

    expect(MAX_VISIBLE_UPDATES).toBe(20);
    expect(visible).toHaveLength(20);
    expect(visible[0].id).toBe("update-25");
    expect(visible.at(-1)?.id).toBe("update-6");
    expect(source.map((update) => update.id)).toEqual(originalOrder);
    expect(getVisibleUpdates([])).toEqual([]);
    expect(getVisibleUpdates(source, 0)).toEqual([]);
  });

  it("includes Patch 01 through Patch 39 in release history", () => {
    expect([...patchHistory].sort((a, b) => a.patch - b.patch).map((entry) => entry.patch))
      .toEqual(Array.from({ length: 39 }, (_, index) => index + 1));
    for (const entry of patchHistory) {
      expect(entry.title.trim()).toBeTruthy();
      expect(entry.summary.trim()).toBeTruthy();
      expect(entry.highlights.length).toBeGreaterThanOrEqual(3);
      expect(entry.details.length).toBeGreaterThanOrEqual(2);
      expect(entry.userImpact.trim()).toBeTruthy();
    }
  });

  it("exposes Patch history newest first for the updates page", () => {
    expect(patchHistoryNewestFirst.map((entry) => entry.patch)).toEqual([39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(visiblePatchHistory).toHaveLength(MAX_VISIBLE_UPDATES);
    expect(visiblePatchHistory.length).toBeLessThanOrEqual(MAX_VISIBLE_UPDATES);
    expect(visiblePatchHistory[0].patch).toBe(39);
  });

  it("keeps Patch 12, Patch 14, experience-level and onboarding details explicit", () => {
    const patch12 = patchHistory.find((entry) => entry.patch === 12);
    const patch14 = patchHistory.find((entry) => entry.patch === 14);
    const patch18 = patchHistory.find((entry) => entry.patch === 18);
    const patch19 = patchHistory.find((entry) => entry.patch === 19);
    const patch20 = patchHistory.find((entry) => entry.patch === 20);
    const patch21 = patchHistory.find((entry) => entry.patch === 21);
    const patch22 = patchHistory.find((entry) => entry.patch === 22);
    const patch23 = patchHistory.find((entry) => entry.patch === 23);
    const patch24 = patchHistory.find((entry) => entry.patch === 24);
    const patch25 = patchHistory.find((entry) => entry.patch === 25);
    const patch26 = patchHistory.find((entry) => entry.patch === 26);
    const patch27 = patchHistory.find((entry) => entry.patch === 27);
    const patch28 = patchHistory.find((entry) => entry.patch === 28);
    const patch29 = patchHistory.find((entry) => entry.patch === 29);
    const patch30 = patchHistory.find((entry) => entry.patch === 30);
    const patch31 = patchHistory.find((entry) => entry.patch === 31);
    const patch32 = patchHistory.find((entry) => entry.patch === 32);
    const patch33 = patchHistory.find((entry) => entry.patch === 33);
    const patch34 = patchHistory.find((entry) => entry.patch === 34);
    const patch35 = patchHistory.find((entry) => entry.patch === 35);
    const patch36 = patchHistory.find((entry) => entry.patch === 36);
    const patch37 = patchHistory.find((entry) => entry.patch === 37);
    const patch38 = patchHistory.find((entry) => entry.patch === 38);
    const patch39 = patchHistory.find((entry) => entry.patch === 39);

    expect(patch12?.details.join(" ")).toContain("doughtools:bake-results");
    expect(patch12?.technicalNote).toContain("photo upload");
    expect(patch14?.details.join(" ")).toContain("30 seconds");
    expect(patch14?.details.join(" ")).toContain("non-modal");
    expect(patch18?.highlights.join(" ")).toContain("Dough Doctor");
    expect(patch19?.details.join(" ")).toContain("doughtools.experienceLevel");
    expect(patch20?.summary).toContain("workflow");
    expect(patch20?.highlights.join(" ")).toContain("choose level");
    expect(patch20?.technicalNote).toContain("did not change dough formulas");
    expect(patch21?.summary).toContain("Beginner, Enthusiast and Pizza Nerd");
    expect(patch21?.details.join(" ")).toContain("migrated safely");
    expect(patch21?.technicalNote).toContain("did not change dough formulas");
    expect(patch22?.summary).toContain("Start Here");
    expect(patch22?.highlights.join(" ")).toContain("Home oven, pizza oven and pan / tray pizza");
    expect(patch22?.details.join(" ")).toContain("existing DoughTools calculator");
    expect(patch22?.technicalNote).toContain("did not change dough formulas");
    expect(patch23?.summary).toContain("search-indexing baseline");
    expect(patch23?.highlights.join(" ")).toContain("canonical URL policy");
    expect(patch23?.details.join(" ")).toContain("Shareable tool links remain supported");
    expect(patch23?.technicalNote).toContain("did not change dough formulas");
    expect(patch24?.summary).toContain("clearer labels");
    expect(patch24?.highlights.join(" ")).toContain("accessible names");
    expect(patch24?.details.join(" ")).toContain("form labels");
    expect(patch24?.technicalNote).toContain("did not change dough formulas");
    expect(patch25?.summary).toContain("performance baseline");
    expect(patch25?.highlights.join(" ")).toContain("Google indexing remains disabled");
    expect(patch25?.details.join(" ")).toContain("production mode");
    expect(patch25?.technicalNote).toContain("did not change dough formulas");
    expect(patch26?.summary).toContain("adapts its control depth");
    expect(patch26?.highlights.join(" ")).toContain("Beginner users see a simpler calculator path");
    expect(patch26?.details.join(" ")).toContain("Existing formulas");
    expect(patch26?.technicalNote).toContain("did not change dough formulas");
    expect(patch27?.summary).toContain("security and launch-safety baseline");
    expect(patch27?.highlights.join(" ")).toContain("Pre-launch indexing protection preserved");
    expect(patch27?.details.join(" ")).toContain("Google indexing remains disabled");
    expect(patch27?.technicalNote).toContain("SEO indexing permissions");
    expect(patch28?.summary).toContain("next DoughTools steps");
    expect(patch28?.highlights.join(" ")).toContain("Recipe context is preserved");
    expect(patch28?.details.join(" ")).toContain("no unsupported tool parameters");
    expect(patch28?.technicalNote).toContain("security headers");
    expect(patch29?.details.join(" ")).toContain("Saved recipe cards");
    expect(patch29?.details.join(" ")).toContain("browser");
    expect(patch29?.technicalNote).toContain("saved recipe storage format");
    expect(patch30?.summary).toContain("home-screen");
    expect(patch30?.details.join(" ")).toContain("install card");
    expect(patch30?.highlights.join(" ")).toContain("No tracking, push notifications, offline mode or indexing change was added");
    expect(patch30?.technicalNote).toContain("security headers");
    expect(patch31?.summary).toContain("Pizza Session");
    expect(patch31?.highlights.join(" ")).toContain("Dedicated localStorage keys");
    expect(patch31?.details.join(" ")).toContain("Malformed localStorage data falls back safely");
    expect(patch31?.technicalNote).toContain("install/PWA behavior");
    expect(patch32?.title).toBe("Start Pizza Session wizard");
    expect(patch32?.highlights.join(" ")).toContain("Style, time, quantity, oven and flour decisions saved locally");
    expect(patch32?.details.join(" ")).toContain("first guided session wizard");
    expect(patch32?.technicalNote).toContain("SEO indexing permissions");
    expect(patch33?.title).toBe("Session timeline and backward schedule");
    expect(patch33?.highlights.join(" ")).toContain("Backward-planned pizza preparation steps");
    expect(patch33?.details.join(" ")).toContain("target time from the Start Pizza Session wizard");
    expect(patch33?.technicalNote).toContain("SEO indexing permissions");
    expect(patch34?.title).toBe("Session shopping list generator");
    expect(patch34?.highlights.join(" ")).toContain("Pizza preset cards");
    expect(patch34?.details.join(" ")).toContain("Margherita");
    expect(patch34?.details.join(" ")).toContain("Simple cheese pizza");
    expect(patch34?.technicalNote).toContain("SEO indexing permissions");
    expect(patch35?.title).toBe("Session recipe build step");
    expect(patch35?.highlights.join(" ")).toContain("New session recipe route");
    expect(patch35?.details.join(" ")).toContain("calculator-compatible recipe parameters");
    expect(patch35?.technicalNote).toContain("SEO indexing permissions");
    expect(patch36?.title).toBe("Session Kitchen Mode");
    expect(patch36?.highlights.join(" ")).toContain("New session kitchen route");
    expect(patch36?.details.join(" ")).toContain("first todo task");
    expect(patch36?.technicalNote).toContain("SEO indexing permissions");
    expect(patch37?.title).toBe("Session-first homepage cleanup");
    expect(patch37?.highlights.join(" ")).toContain("Start Pizza Session becomes the clear homepage action");
    expect(patch37?.details.join(" ")).toContain("crowded dashboard");
    expect(patch37?.technicalNote).toContain("Pizza Session storage");
    expect(patch37?.technicalNote).toContain("SEO indexing permissions");
    expect(patch38?.title).toBe("Session review and bake notes");
    expect(patch38?.highlights.join(" ")).toContain("New session review route");
    expect(patch38?.details.join(" ")).toContain("first review step");
    expect(patch38?.technicalNote).toContain("SEO indexing permissions");
    expect(patch39?.title).toBe("Homepage session-first visual cleanup");
    expect(patch39?.highlights.join(" ")).toContain("Start Pizza Session is the main homepage action");
    expect(patch39?.details.join(" ")).toContain("approved session-first visual direction");
    expect(patch39?.technicalNote).toContain("Pizza Session storage");
    expect(patch39?.technicalNote).toContain("SEO indexing permissions");
  });

  it("uses the required new-update notice destination", () => {
    expect(newUpdateNotice.href).toBe("/updates");
    expect(newUpdateNotice.label).toBe("New update");
    expect(newUpdateNotice.copy).toContain("DoughTools");
  });

  it("keeps the site-wide update notice temporary and session-only", () => {
    const noticeSource = readFileSync(join(process.cwd(), "components", "LatestUpdateNotice.tsx"), "utf8");

    expect(RECENT_UPDATE_NOTICE_VISIBLE_MS).toBe(30_000);
    expect(noticeSource).toContain("setTimeout");
    expect(noticeSource).toContain("clearTimeout");
    expect(noticeSource).not.toMatch(/localStorage|sessionStorage|document\.cookie|analytics|gtag|posthog|plausible|trackEvent/i);
  });

  it("treats today and exactly 5 days old as recent", () => {
    const now = new Date("2026-06-23T18:00:00Z");

    expect(isUpdateRecent("2026-06-23", now)).toBe(true);
    expect(isUpdateRecent("2026-06-18", now)).toBe(true);
  });

  it("treats 6 days old, invalid dates and missing updates as not recent", () => {
    const now = new Date("2026-06-23T18:00:00Z");

    expect(isUpdateRecent("2026-06-17", now)).toBe(false);
    expect(isUpdateRecent("not-a-date", now)).toBe(false);
    expect(isUpdateRecent("2026-02-31", now)).toBe(false);
    expect(isUpdateRecent("2026-06-24", now)).toBe(false);
    expect(isUpdateRecent(undefined, now)).toBe(false);
  });

  it("does not claim unavailable launch or sharing features are available", () => {
    expect(publicCopy).not.toMatch(/share cards? (is|are) available/i);
    expect(publicCopy).not.toMatch(/cloud sync (is|now|available)/i);
    expect(publicCopy).not.toMatch(/indexing is enabled|search indexing is enabled|Google indexing is enabled/i);
    expect(publicCopy).not.toMatch(/perfect pizza|guaranteed results/i);
  });

  it("renders the updates page from the bounded visible history list", () => {
    const updatesPageSource = readFileSync(join(process.cwd(), "app", "updates", "page.tsx"), "utf8");

    expect(updatesPageSource).toContain("visiblePatchHistory.map");
    expect(updatesPageSource).not.toContain("patchHistoryNewestFirst.map");
  });
});
