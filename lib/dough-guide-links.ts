import type { DoughGuideStepId } from "@/lib/dough-guide";
import type { PizzaSessionTimelineStep } from "@/lib/pizza-session";

export type DoughGuideReturnPath = "/session/timeline" | "/session/kitchen";

export type DoughGuideSessionStep = Pick<PizzaSessionTimelineStep, "id" | "kind"> & {
  label?: string;
};

export type DoughGuideLink = {
  stepId: DoughGuideStepId;
  href: string;
  label: string;
  ariaLabel: string;
};

const SESSION_STEP_TO_DOUGH_GUIDE_STEP: Record<string, DoughGuideStepId> = {
  prepare: "prepare",
  measure: "measure",
  "measure-ingredients": "measure",
  "mix-dough": "mix-dough",
  "rest-dough": "rest-dough",
  "develop-dough": "develop-dough",
  "knead-dough": "develop-dough",
  "fold-dough": "develop-dough",
  "cold-ferment": "bulk-ferment",
  "room-ferment": "bulk-ferment",
  "ferment-dough": "bulk-ferment",
  "bulk-ferment": "bulk-ferment",
  "divide-dough": "divide-dough",
  "ball-dough": "ball-dough",
  "proof-dough-balls": "proof-dough-balls",
  "room-temperature-rest": "warm-dough",
  "warm-dough": "warm-dough",
  "check-readiness": "check-readiness",
  "release-dough-ball": "release-dough-ball",
  "pre-stretch-release": "release-dough-ball",
};

const GUIDE_LABELS: Record<DoughGuideStepId, string> = {
  prepare: "Open prep checklist",
  measure: "See measuring guidance",
  "mix-dough": "See how to mix the dough",
  "rest-dough": "See the rest step",
  "develop-dough": "See dough development",
  "bulk-ferment": "What to look for during fermentation",
  "divide-dough": "See how to divide the dough",
  "ball-dough": "See balling instructions",
  "proof-dough-balls": "Check proofing signs",
  "warm-dough": "See how to warm the dough",
  "check-readiness": "Check dough readiness",
  "release-dough-ball": "See how to release the dough",
};

export function buildDoughGuideHref(stepId: DoughGuideStepId, from?: DoughGuideReturnPath) {
  const params = new URLSearchParams({ step: stepId });
  if (from) {
    params.set("from", from);
  }
  return `/guides/dough?${params.toString()}`;
}

export function getSafeDoughGuideSessionReturnPath(value?: string | string[] | null): DoughGuideReturnPath | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return null;

  let decodedValue: string;
  try {
    decodedValue = decodeURIComponent(rawValue);
  } catch {
    return null;
  }

  if (decodedValue === "/session/timeline" || decodedValue === "/session/kitchen") {
    return decodedValue;
  }

  return null;
}

export function getDoughGuideLinkForSessionStep(
  step?: DoughGuideSessionStep | null,
  from?: DoughGuideReturnPath,
): DoughGuideLink | null {
  if (!step) return null;

  const stepId = SESSION_STEP_TO_DOUGH_GUIDE_STEP[step.id];
  if (!stepId) return null;

  const label = GUIDE_LABELS[stepId];
  return {
    stepId,
    href: buildDoughGuideHref(stepId, from),
    label,
    ariaLabel: `${label} in the Dough Guide`,
  };
}
