import type { DoughGuideImage, DoughGuideStepId } from "@/lib/dough-guide";

export type DoughStepImageId = DoughGuideStepId;

export type DoughStepPrimaryImage = DoughGuideImage & {
  kind: "photo";
  width: 1200;
  height: 900;
};

export const DOUGH_STEP_PRIMARY_IMAGES: Record<DoughStepImageId, DoughStepPrimaryImage> = {
  prepare: {
    src: "/dough-guide/guide-step-01-prepare.webp",
    alt: "Measured dough ingredients and dough tools prepared on a warm kitchen work surface.",
    caption: "Keep the tools ready before the dough gets sticky.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  measure: {
    src: "/dough-guide/guide-step-02-measure.webp",
    alt: "Flour being weighed in a bowl on a kitchen scale.",
    caption: "Weigh ingredients separately so the recipe stays controlled.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "mix-dough": {
    src: "/dough-guide/guide-step-03-mix.webp",
    alt: "Hands mixing rough pizza dough in a ceramic bowl.",
    caption: "The first mix can look rough before the rest improves texture.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "rest-dough": {
    src: "/dough-guide/guide-step-04-rest.webp",
    alt: "A covered bowl of dough resting on a warm kitchen counter.",
    caption: "Covered rest protects the surface while the dough becomes more cohesive.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "develop-dough": {
    src: "/dough-guide/guide-step-05-develop.webp",
    alt: "Hands gently folding pizza dough to develop structure.",
    caption: "Develop structure with controlled handling, not brute force.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "bulk-ferment": {
    src: "/dough-guide/guide-step-06-bulk.webp",
    alt: "Pizza dough bulk fermenting in a covered container with visible gas bubbles.",
    caption: "Look for gas and dough maturity, not one universal doubling target.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "divide-dough": {
    src: "/dough-guide/guide-step-07-divide.webp",
    alt: "Dough being divided into portions with a scraper beside a kitchen scale.",
    caption: "Cut and correct weights before final balling.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "ball-dough": {
    src: "/dough-guide/guide-step-08-ball.webp",
    alt: "Hands shaping a smooth pizza dough ball on a floured work surface.",
    caption: "The goal is a smooth ball with the seam underneath and no torn skin.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "proof-dough-balls": {
    src: "/dough-guide/guide-step-09-proof.webp",
    alt: "Proofed pizza dough balls resting covered in a metal tray.",
    caption: "Proofed balls should relax and expand while staying covered and intact.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "warm-dough": {
    src: "/dough-guide/guide-step-10-warm.webp",
    alt: "Covered dough balls relaxing in a tray at room temperature after cold storage.",
    caption: "Cold dough should relax before evaluation; there is no universal warm-up duration.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "check-readiness": {
    src: "/dough-guide/guide-step-11-readiness.webp",
    alt: "A finger gently checking the readiness of a proofed dough ball.",
    caption: "Check gas, shape, surface strength and relaxation together.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
  "release-dough-ball": {
    src: "/dough-guide/guide-step-12-release.webp",
    alt: "A dough scraper gently releasing an intact dough ball onto a floured work surface.",
    caption: "Release the dough intact, then stop before stretching.",
    kind: "photo",
    width: 1200,
    height: 900,
  },
} as const;

export const TIMELINE_DOUGH_STEP_IMAGE_IDS: Partial<Record<string, DoughStepImageId>> = {
  "mix-dough": "mix-dough",
  "rest-dough": "rest-dough",
  "cold-ferment": "bulk-ferment",
  "room-ferment": "bulk-ferment",
  "ferment-dough": "bulk-ferment",
  "ball-dough": "ball-dough",
  "room-temperature-rest": "warm-dough",
} as const;

export const BEGINNER_GUIDE_STEP_IMAGE_IDS: Partial<Record<string, DoughStepImageId>> = {
  prepare: "prepare",
  mix: "mix-dough",
  rest: "rest-dough",
  knead: "develop-dough",
  bulk: "bulk-ferment",
  ball: "ball-dough",
  cold: "proof-dough-balls",
  warm: "warm-dough",
  final: "check-readiness",
} as const;

export function getDoughStepPrimaryImage(id: DoughStepImageId): DoughStepPrimaryImage {
  return DOUGH_STEP_PRIMARY_IMAGES[id];
}

export function getDoughStepPrimaryImageForTimelineStep(stepId: string): DoughStepPrimaryImage | undefined {
  const imageId = TIMELINE_DOUGH_STEP_IMAGE_IDS[stepId];
  return imageId ? getDoughStepPrimaryImage(imageId) : undefined;
}

export function getDoughStepPrimaryImageForBeginnerStep(stepId: string): DoughStepPrimaryImage | undefined {
  const imageId = BEGINNER_GUIDE_STEP_IMAGE_IDS[stepId];
  return imageId ? getDoughStepPrimaryImage(imageId) : undefined;
}
