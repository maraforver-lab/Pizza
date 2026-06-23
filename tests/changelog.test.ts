import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isUpdateRecent,
  latestPublicUpdate,
  newUpdateNotice,
  patchHistory,
  patchHistoryNewestFirst,
  RECENT_UPDATE_NOTICE_VISIBLE_MS,
  sortUpdatesNewestFirst,
  updates,
} from "@/lib/changelog";

const publicCopy = [
  ...updates.flatMap((update) => [
    update.title,
    update.summary,
    update.category,
    ...update.highlights,
  ]),
  ...patchHistory.flatMap((entry) => [
    entry.title,
    entry.summary,
    entry.category,
  ]),
  newUpdateNotice.label,
  newUpdateNotice.copy,
].join("\n");

describe("updates changelog", () => {
  it("defines the latest public foundation update", () => {
    expect(latestPublicUpdate).toBeDefined();
    expect(latestPublicUpdate?.title).toBe("DoughTools foundation update");
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
    expect(latestPublicUpdate).toBe(updates.filter((update) => update.isPublic)[0]);
  });

  it("includes Patch 01 through Patch 12 in release history", () => {
    expect([...patchHistory].sort((a, b) => a.patch - b.patch).map((entry) => entry.patch))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const entry of patchHistory) {
      expect(entry.title.trim()).toBeTruthy();
      expect(entry.summary.trim()).toBeTruthy();
    }
  });

  it("exposes Patch history newest first for the updates page", () => {
    expect(patchHistoryNewestFirst.map((entry) => entry.patch)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
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
    expect(publicCopy).not.toMatch(/indexing is enabled|search indexing is enabled|Google indexing/i);
    expect(publicCopy).not.toMatch(/perfect pizza|guaranteed results/i);
  });
});
