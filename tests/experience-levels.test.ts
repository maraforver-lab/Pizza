import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  clearExperienceLevelPreference,
  DEFAULT_EXPERIENCE_LEVEL,
  EXPERIENCE_LEVEL_STORAGE_KEY,
  EXPERIENCE_LEVELS,
  LEGACY_EXPERIENCE_LEVEL_MIGRATIONS,
  getDefaultExperienceLevel,
  getExperienceLevelCornerAccentStyle,
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
  it("defaults to Beginner", () => {
    expect(DEFAULT_EXPERIENCE_LEVEL).toBe("beginner");
    expect(getDefaultExperienceLevel()).toBe("beginner");
    expect(readExperienceLevelPreference()).toBe("beginner");
  });

  it("recognizes only the supported experience levels", () => {
    expect(getExperienceLevelOrder()).toEqual(["beginner", "enthusiast", "pizza_nerd"]);

    for (const level of getExperienceLevelOrder()) {
      expect(isExperienceLevel(level)).toBe(true);
      expect(normalizeExperienceLevel(level)).toBe(level);
    }

    expect(isExperienceLevel("intermediate")).toBe(false);
    expect(isExperienceLevel("advanced")).toBe(false);
    expect(isExperienceLevel("")).toBe(false);
  });

  it("normalizes invalid, unknown, null and undefined values to Beginner", () => {
    expect(normalizeExperienceLevel("unknown")).toBe("beginner");
    expect(normalizeExperienceLevel("")).toBe("beginner");
    expect(normalizeExperienceLevel(null)).toBe("beginner");
    expect(normalizeExperienceLevel(undefined)).toBe("beginner");
  });

  it("migrates legacy values safely", () => {
    expect(LEGACY_EXPERIENCE_LEVEL_MIGRATIONS).toEqual({
      beginner: "beginner",
      intermediate: "enthusiast",
      advanced: "pizza_nerd",
    });
    expect(normalizeExperienceLevel("beginner")).toBe("beginner");
    expect(normalizeExperienceLevel("intermediate")).toBe("enthusiast");
    expect(normalizeExperienceLevel("advanced")).toBe("pizza_nerd");
  });

  it("includes complete English metadata for every level", () => {
    const forbidden = /\b(Aloittelija|Harrastaja|Nybörjare|Entusiast)\b|[äöåÄÖÅ]/;

    expect(EXPERIENCE_LEVELS).toHaveLength(3);
    for (const level of EXPERIENCE_LEVELS) {
      expect(level.value).toBe(level.id);
      expect(level.label.trim()).toBeTruthy();
      expect(level.shortLabel.trim()).toBeTruthy();
      expect(level.description.trim()).toBeTruthy();
      expect(level.bestFor.trim()).toBeTruthy();
      expect(level.whatYouWillSee.trim()).toBeTruthy();
      expect(level.depthPrinciple.trim()).toBeTruthy();
      expect(level.visualTone.trim()).toBeTruthy();
      expect(level.guidanceTone.trim()).toBeTruthy();
      expect(level.marker.trim()).toBeTruthy();
      expect(level.badgeLabel.trim()).toBeTruthy();
      expect(level.accent.trim()).toBeTruthy();
      expect(level.badgeClassName.trim()).toBeTruthy();
      expect(level.cardClassName.trim()).toBeTruthy();
      expect(level.markerClassName.trim()).toBeTruthy();
      expect(`${level.label} ${level.description}`).not.toMatch(forbidden);
    }

    expect(getExperienceLevelConfig("beginner").label).toBe("Beginner");
    expect(getExperienceLevelConfig("enthusiast").label).toBe("Enthusiast");
    expect(getExperienceLevelConfig("pizza_nerd").label).toBe("Pizza Nerd");
    expect(getExperienceLevelConfig("beginner").accent).toBe("green");
    expect(getExperienceLevelConfig("enthusiast").accent).toBe("orange");
    expect(getExperienceLevelConfig("pizza_nerd").accent).toBe("pink-red");
  });

  it("maps each experience level to a shared subtle corner accent", () => {
    expect(getExperienceLevelCornerAccentStyle("beginner").backgroundImage).toContain("rgba(58, 163, 106");
    expect(getExperienceLevelCornerAccentStyle("enthusiast").backgroundImage).toContain("rgba(242, 161, 95");
    expect(getExperienceLevelCornerAccentStyle("pizza_nerd").backgroundImage).toContain("rgba(235, 87, 127");
    expect(getExperienceLevelCornerAccentStyle("missing").backgroundImage).toBe(getExperienceLevelCornerAccentStyle("beginner").backgroundImage);
  });

  it("exports the documented localStorage key", () => {
    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools.experienceLevel");
  });

  it("persists and reads valid local preferences", () => {
    const storage = new MemoryStorage();

    expect(readExperienceLevelPreference(storage)).toBe("beginner");
    expect(writeExperienceLevelPreference("pizza_nerd", storage)).toBe("pizza_nerd");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("pizza_nerd");
    expect(readExperienceLevelPreference(storage)).toBe("pizza_nerd");

    clearExperienceLevelPreference(storage);
    expect(readExperienceLevelPreference(storage)).toBe("beginner");
  });

  it("falls back to beginner for malformed stored values", () => {
    const storage = new MemoryStorage();

    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "wizard");

    expect(readExperienceLevelPreference(storage)).toBe("beginner");
  });

  it("updates legacy stored values to canonical values when read", () => {
    const storage = new MemoryStorage();

    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "intermediate");
    expect(readExperienceLevelPreference(storage)).toBe("enthusiast");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("enthusiast");

    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "advanced");
    expect(readExperienceLevelPreference(storage)).toBe("pizza_nerd");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("pizza_nerd");
  });

  it("keeps content-complexity helpers deterministic", () => {
    const levels: ExperienceLevel[] = ["beginner", "enthusiast", "pizza_nerd"];

    for (const level of levels) {
      expect(shouldShowBeginnerContent(level)).toBe(true);
    }

    expect(shouldShowAdvancedContent("beginner")).toBe(false);
    expect(shouldShowAdvancedContent("enthusiast")).toBe(true);
    expect(shouldShowAdvancedContent("pizza_nerd")).toBe(true);

    expect(shouldShowNerdContent("beginner")).toBe(false);
    expect(shouldShowNerdContent("enthusiast")).toBe(false);
    expect(shouldShowNerdContent("pizza_nerd")).toBe(true);

    expect(getExperienceLevelCopyMode("beginner")).toBe("simple");
    expect(getExperienceLevelCopyMode("enthusiast")).toBe("guided");
    expect(getExperienceLevelCopyMode("pizza_nerd")).toBe("full");
  });

  it("supports the visible shared selector component", () => {
    const source = readFileSync(join(process.cwd(), "components", "ExperienceLevelSelector.tsx"), "utf8");

    expect(source).toContain("writeExperienceLevelPreference");
    expect(source).toContain("Guidance mode:");
    expect(source).toContain("level.marker");
    for (const level of EXPERIENCE_LEVELS) {
      expect(source).toContain("EXPERIENCE_LEVELS.map");
      expect(level.label).toMatch(/^(Beginner|Enthusiast|Pizza Nerd)$/);
      expect(level.description).toMatch(/I (want|already)/);
    }
  });
});
