import { describe, expect, it } from "vitest";
import { educationExperienceCopy, getEducationExperienceCopy } from "@/lib/education-experience-copy";
import { getExperienceLevelOrder } from "@/lib/experience-levels";

const textFor = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFor).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(textFor).join(" ");
  return "";
};

describe("education experience copy", () => {
  it("provides planner and guide copy for every experience level", () => {
    for (const level of getExperienceLevelOrder()) {
      const copy = getEducationExperienceCopy(level);

      expect(copy.planner.intro.trim()).toBeTruthy();
      expect(copy.guide.intro.trim()).toBeTruthy();
    }
  });

  it("keeps beginner copy simpler than Pizza Nerd copy", () => {
    const beginner = getEducationExperienceCopy("beginner");
    const pizzaNerd = getEducationExperienceCopy("pizza_nerd");

    expect(beginner.guide.technicalDetails.length).toBeLessThan(pizzaNerd.guide.technicalDetails.length);
  });

  it("adds technical detail for Pizza Nerd guidance", () => {
    const text = textFor(getEducationExperienceCopy("pizza_nerd"));

    expect(text).toContain("dough temperature");
    expect(text).toContain("baker's percentages");
    expect(text).toContain("gluten development");
  });

  it("keeps education copy English and avoids unavailable feature claims", () => {
    const forbiddenLanguage = /\b(Aloittelija|Harrastaja|Nybörjare|Entusiast)\b|[äöåÄÖÅ]/;
    const unavailableClaims = /\b(cloud sync|photo upload|share card|public bake page|AI chat|calendar integration)\b/i;

    for (const copy of Object.values(educationExperienceCopy)) {
      const text = textFor(copy);

      expect(text).not.toMatch(forbiddenLanguage);
      expect(text).not.toMatch(unavailableClaims);
    }
  });

  it("keeps planner copy informational after the legacy planner route is retired", () => {
    for (const level of getExperienceLevelOrder()) {
      expect(getEducationExperienceCopy(level).planner.intro).toBeTruthy();
    }
  });
});
