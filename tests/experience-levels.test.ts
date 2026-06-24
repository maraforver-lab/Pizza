import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  clearExperienceLevelPreference,
  DEFAULT_EXPERIENCE_LEVEL,
  EXPERIENCE_LEVEL_STORAGE_KEY,
  EXPERIENCE_LEVELS,
  getDefaultExperienceLevel,
  getExperienceLevelConfig,
  getExperienceLevelCopyMode,
  getExperienceLevelOrder,
  isExperienceLevel,
  normalizeExperienceLevel,
  readExperienceLevelPreference,
  shouldShowAdvancedContent,
  shouldShowBeginnerContent,
  shouldShowNerdContent,
  writeExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { MemoryStorage } from "./helpers";

describe("experience levels foundation", () => {
  it("defaults to Home Pizza Maker", () => {
    expect(DEFAULT_EXPERIENCE_LEVEL).toBe("intermediate");
    expect(getDefaultExperienceLevel()).toBe("intermediate");
    expect(readExperienceLevelPreference()).toBe("intermediate");
  });

  it("recognizes only the supported experience levels", () => {
    expect(getExperienceLevelOrder()).toEqual(["beginner", "intermediate", "advanced"]);

    for (const level of getExperienceLevelOrder()) {
      expect(isExperienceLevel(level)).toBe(true);
      expect(normalizeExperienceLevel(level)).toBe(level);
    }

    expect(isExperienceLevel("pizza_nerd")).toBe(false);
    expect(isExperienceLevel("")).toBe(false);
  });

  it("normalizes invalid, unknown, null and undefined values to Home Pizza Maker", () => {
    expect(normalizeExperienceLevel("unknown")).toBe("intermediate");
    expect(normalizeExperienceLevel("")).toBe("intermediate");
    expect(normalizeExperienceLevel(null)).toBe("intermediate");
    expect(normalizeExperienceLevel(undefined)).toBe("intermediate");
  });

  it("includes complete English metadata for every level", () => {
    const forbidden = /\b(Aloittelija|Harrastaja|Nybörjare|Entusiast)\b|[äöåÄÖÅ]/;

    expect(EXPERIENCE_LEVELS).toHaveLength(3);
    for (const level of EXPERIENCE_LEVELS) {
      expect(level.label.trim()).toBeTruthy();
      expect(level.description.trim()).toBeTruthy();
      expect(level.emoji.trim()).toBeTruthy();
      expect(level.accent.trim()).toBeTruthy();
      expect(level.badgeClassName.trim()).toBeTruthy();
      expect(level.cardClassName.trim()).toBeTruthy();
      expect(`${level.label} ${level.description}`).not.toMatch(forbidden);
    }

    expect(getExperienceLevelConfig("beginner").label).toBe("Beginner");
    expect(getExperienceLevelConfig("intermediate").label).toBe("Home Pizza Maker");
    expect(getExperienceLevelConfig("advanced").label).toBe("Advanced");
  });

  it("exports the documented localStorage key", () => {
    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools.experienceLevel");
  });

  it("persists and reads valid local preferences", () => {
    const storage = new MemoryStorage();

    expect(readExperienceLevelPreference(storage)).toBe("intermediate");
    expect(writeExperienceLevelPreference("advanced", storage)).toBe("advanced");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("advanced");
    expect(readExperienceLevelPreference(storage)).toBe("advanced");

    clearExperienceLevelPreference(storage);
    expect(readExperienceLevelPreference(storage)).toBe("intermediate");
  });

  it("falls back to beginner for malformed stored values", () => {
    const storage = new MemoryStorage();

    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "wizard");

    expect(readExperienceLevelPreference(storage)).toBe("intermediate");
  });

  it("keeps content-complexity helpers deterministic", () => {
    const levels: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];

    for (const level of levels) {
      expect(shouldShowBeginnerContent(level)).toBe(true);
    }

    expect(shouldShowAdvancedContent("beginner")).toBe(false);
    expect(shouldShowAdvancedContent("intermediate")).toBe(true);
    expect(shouldShowAdvancedContent("advanced")).toBe(true);

    expect(shouldShowNerdContent("beginner")).toBe(false);
    expect(shouldShowNerdContent("intermediate")).toBe(false);
    expect(shouldShowNerdContent("advanced")).toBe(true);

    expect(getExperienceLevelCopyMode("beginner")).toBe("simple");
    expect(getExperienceLevelCopyMode("intermediate")).toBe("guided");
    expect(getExperienceLevelCopyMode("advanced")).toBe("full");
  });

  it("supports the visible shared selector component", () => {
    const source = readFileSync(join(process.cwd(), "components", "ExperienceLevelSelector.tsx"), "utf8");

    expect(source).toContain("writeExperienceLevelPreference");
    expect(source).toContain("Guidance mode:");
    for (const level of EXPERIENCE_LEVELS) {
      expect(source).toContain("EXPERIENCE_LEVELS.map");
      expect(level.label).toMatch(/^(Beginner|Home Pizza Maker|Advanced)$/);
      expect(level.description).toMatch(/I (want|already)/);
    }
  });
});
