import { describe, expect, it } from "vitest";
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
  it("defaults to beginner", () => {
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

    expect(isExperienceLevel("advanced")).toBe(false);
    expect(isExperienceLevel("")).toBe(false);
  });

  it("normalizes invalid, unknown, null and undefined values to beginner", () => {
    expect(normalizeExperienceLevel("unknown")).toBe("beginner");
    expect(normalizeExperienceLevel("")).toBe("beginner");
    expect(normalizeExperienceLevel(null)).toBe("beginner");
    expect(normalizeExperienceLevel(undefined)).toBe("beginner");
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
    expect(getExperienceLevelConfig("enthusiast").label).toBe("Enthusiast");
    expect(getExperienceLevelConfig("pizza_nerd").label).toBe("Pizza Nerd");
  });

  it("exports the documented localStorage key", () => {
    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools:experience-level");
  });

  it("persists and reads valid local preferences", () => {
    const storage = new MemoryStorage();

    expect(readExperienceLevelPreference(storage)).toBe("beginner");
    expect(writeExperienceLevelPreference("enthusiast", storage)).toBe("enthusiast");
    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("enthusiast");
    expect(readExperienceLevelPreference(storage)).toBe("enthusiast");

    clearExperienceLevelPreference(storage);
    expect(readExperienceLevelPreference(storage)).toBe("beginner");
  });

  it("falls back to beginner for malformed stored values", () => {
    const storage = new MemoryStorage();

    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "wizard");

    expect(readExperienceLevelPreference(storage)).toBe("beginner");
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
});
