import { describe, expect, it } from "vitest";
import {
  buildDoughGuideHref,
  getDoughGuideLinkForSessionStep,
  getSafeDoughGuideSessionReturnPath,
} from "@/lib/dough-guide-links";

describe("Dough Guide session links", () => {
  it("builds stable Dough Guide links with safe session return paths", () => {
    expect(buildDoughGuideHref("mix-dough")).toBe("/guides/dough?step=mix-dough");
    expect(buildDoughGuideHref("ball-dough", "/session/kitchen")).toBe(
      "/guides/dough?step=ball-dough&from=%2Fsession%2Fkitchen",
    );
    expect(buildDoughGuideHref("bulk-ferment", "/session/timeline")).toBe(
      "/guides/dough?step=bulk-ferment&from=%2Fsession%2Ftimeline",
    );
  });

  it("keeps return context reusable when a Guide link is nested inside a troubleshooting return URL", () => {
    const guideHref = buildDoughGuideHref("mix-dough", "/session/timeline");
    const encodedReturn = encodeURIComponent(guideHref);

    expect(encodedReturn).toBe("%2Fguides%2Fdough%3Fstep%3Dmix-dough%26from%3D%252Fsession%252Ftimeline");
    expect(decodeURIComponent(encodedReturn)).toBe("/guides/dough?step=mix-dough&from=%2Fsession%2Ftimeline");
  });

  it("maps dough-making session steps to the matching Guide step", () => {
    expect(getDoughGuideLinkForSessionStep({ id: "mix-dough", kind: "active" })?.stepId).toBe("mix-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "rest-dough", kind: "passive" })?.stepId).toBe("rest-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "fold-dough", kind: "active" })?.stepId).toBe("develop-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "cold-ferment", kind: "passive" })?.stepId).toBe("bulk-ferment");
    expect(getDoughGuideLinkForSessionStep({ id: "room-ferment", kind: "passive" })?.stepId).toBe("bulk-ferment");
    expect(getDoughGuideLinkForSessionStep({ id: "divide-dough", kind: "active" })?.stepId).toBe("divide-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "ball-dough", kind: "active" })?.stepId).toBe("ball-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "proof-dough-balls", kind: "passive" })?.stepId).toBe("proof-dough-balls");
    expect(getDoughGuideLinkForSessionStep({ id: "warm-dough", kind: "passive" })?.stepId).toBe("warm-dough");
    expect(getDoughGuideLinkForSessionStep({ id: "check-readiness", kind: "active" })?.stepId).toBe("check-readiness");
    expect(getDoughGuideLinkForSessionStep({ id: "release-dough-ball", kind: "active" })?.stepId).toBe("release-dough-ball");
  });

  it("does not map service or unrelated pizza-session steps", () => {
    expect(getDoughGuideLinkForSessionStep({ id: "preheat-oven", kind: "passive" })).toBeNull();
    expect(getDoughGuideLinkForSessionStep({ id: "prepare-sauce-toppings", kind: "active" })).toBeNull();
    expect(getDoughGuideLinkForSessionStep({ id: "bake-pizza", kind: "active" })).toBeNull();
    expect(getDoughGuideLinkForSessionStep({ id: "review-result", kind: "active" })).toBeNull();
  });

  it("accepts only Timeline and Kitchen Mode return paths", () => {
    expect(getSafeDoughGuideSessionReturnPath("/session/timeline")).toBe("/session/timeline");
    expect(getSafeDoughGuideSessionReturnPath(encodeURIComponent("/session/kitchen"))).toBe("/session/kitchen");
    expect(getSafeDoughGuideSessionReturnPath("https://evil.example/session/timeline")).toBeNull();
    expect(getSafeDoughGuideSessionReturnPath("//evil.example/session/kitchen")).toBeNull();
    expect(getSafeDoughGuideSessionReturnPath("javascript:alert(1)")).toBeNull();
    expect(getSafeDoughGuideSessionReturnPath("/account")).toBeNull();
    expect(getSafeDoughGuideSessionReturnPath("%E0%A4%A")).toBeNull();
  });
});
