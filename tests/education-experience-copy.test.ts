import { describe, expect, it } from "vitest";
import { bakeFor } from "@/lib/baking";
import { buildDoughInstructions } from "@/lib/dough-instructions";
import { doctorIssues } from "@/lib/dough-doctor";
import { educationExperienceCopy, getEducationExperienceCopy } from "@/lib/education-experience-copy";
import { getExperienceLevelOrder } from "@/lib/experience-levels";
import { flourById } from "@/lib/flours";
import { scheduleInstructions } from "@/lib/pizza-schedule";
import { baseSettings } from "./helpers";

const textFor = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFor).join(" ");
  if (value && typeof value === "object") return Object.values(value).map(textFor).join(" ");
  return "";
};

describe("education experience copy", () => {
  it("provides planner, guide and Dough Doctor copy for every experience level", () => {
    for (const level of getExperienceLevelOrder()) {
      const copy = getEducationExperienceCopy(level);

      expect(copy.planner.intro.trim()).toBeTruthy();
      expect(copy.guide.intro.trim()).toBeTruthy();
      expect(copy.doctor.intro.trim()).toBeTruthy();
    }
  });

  it("keeps beginner copy simpler than Pizza Nerd copy", () => {
    const beginner = getEducationExperienceCopy("beginner");
    const nerd = getEducationExperienceCopy("pizza_nerd");

    expect(beginner.guide.technicalDetails.length).toBeLessThan(nerd.guide.technicalDetails.length);
    expect(beginner.doctor.diagnosisDetails.length).toBeLessThan(nerd.doctor.diagnosisDetails.length);
  });

  it("adds technical detail for Pizza Nerd guidance", () => {
    const text = textFor(getEducationExperienceCopy("pizza_nerd"));

    expect(text).toContain("dough temperature");
    expect(text).toContain("baker's percentages");
    expect(text).toContain("gluten development");
    expect(text).toContain("enzymatic activity");
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

  it("keeps planner timing values independent of experience level", () => {
    const flour = flourById(baseSettings.flourId);
    const bake = bakeFor(baseSettings.goal, baseSettings.ovenType);
    const instructions = buildDoughInstructions({ locale: "en", settings: baseSettings, flour, bake });
    const anchor = new Date("2026-06-24T12:00:00.000Z");
    const baselineTimes = scheduleInstructions(instructions.steps, baseSettings.fermentation, anchor, "start")
      .map((step) => [step.id, step.at.toISOString()]);

    for (const level of getExperienceLevelOrder()) {
      expect(getEducationExperienceCopy(level).planner.intro).toBeTruthy();
      const times = scheduleInstructions(instructions.steps, baseSettings.fermentation, anchor, "start")
        .map((step) => [step.id, step.at.toISOString()]);
      expect(times).toEqual(baselineTimes);
    }
  });

  it("does not remove Dough Doctor diagnostic categories", () => {
    expect(doctorIssues.map((issue) => issue.id)).toEqual([
      "sticky",
      "torn",
      "tight",
      "underproofed",
      "overproofed",
      "ready",
    ]);
  });
});
