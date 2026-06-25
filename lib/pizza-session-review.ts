import { getExperienceLevelConfig, type ExperienceLevel } from "@/lib/experience-levels";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  clearActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type PizzaSessionReviewInput = {
  rating?: number;
  notes?: string;
  whatWorked?: string;
  improveNextTime?: string;
};

export const SESSION_REVIEW_LOCAL_ONLY_COPY =
  "Review notes are saved locally in this browser on this device for now.";

export const reviewCopyByLevel: Record<ExperienceLevel, {
  heading: string;
  intro: string;
  whatWorkedPlaceholder: string;
  improvePlaceholder: string;
  notesPlaceholder: string;
}> = {
  beginner: {
    heading: "What went well?",
    intro: "Keep it simple: save what you liked and one thing to change next time.",
    whatWorkedPlaceholder: "The crust browned well, the dough was easy to stretch…",
    improvePlaceholder: "Use a little less topping, bake longer, start earlier…",
    notesPlaceholder: "Anything you want to remember from this pizza night.",
  },
  enthusiast: {
    heading: "What would make this bake easier to repeat?",
    intro: "Note timing, dough feel, oven behavior and topping balance while it is fresh.",
    whatWorkedPlaceholder: "The timeline worked, the dough handled well, the oven recovery was good…",
    improvePlaceholder: "Adjust fermentation, preheat longer, dry toppings better…",
    notesPlaceholder: "Practical observations about dough feel, oven heat, toppings and repeatability.",
  },
  pizza_nerd: {
    heading: "Which variable should you test next?",
    intro: "Capture the useful variables: hydration, fermentation time, flour, oven heat, topping load and bake time.",
    whatWorkedPlaceholder: "70% hydration handled well, bottom heat was strong, fermentation timing was repeatable…",
    improvePlaceholder: "Test lower hydration, longer cold ferment, different flour, less topping load…",
    notesPlaceholder: "Technical notes, assumptions and variables for the next controlled bake.",
  },
};

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeRating(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return undefined;
  }
  return Math.min(5, Math.round(value));
}

export function normalizeSessionReviewInput(input: PizzaSessionReviewInput) {
  return {
    rating: normalizeRating(input.rating),
    notes: cleanText(input.notes),
    review: {
      whatWorked: cleanText(input.whatWorked),
      improveNextTime: cleanText(input.improveNextTime),
    },
  };
}

export function getSessionReviewCopy(level: ExperienceLevel) {
  return reviewCopyByLevel[level] ?? reviewCopyByLevel.beginner;
}

export function sessionSummaryLines(session: PizzaSession) {
  const experience = getExperienceLevelConfig(session.experienceLevel).label;
  const timelineDone = session.timeline?.steps.filter((step) => step.status === "done").length ?? 0;
  const timelineTotal = session.timeline?.steps.length ?? 0;
  return [
    ["Pizza", session.pizzaPreset ?? session.recipeSnapshot?.pizzaPreset ?? session.pizzaStyle ?? "Not set"],
    ["Quantity", session.pizzaCount ? `${session.pizzaCount} pizzas` : session.recipeSnapshot?.balls ? `${session.recipeSnapshot.balls} pizzas` : "Not set"],
    ["Target time", session.targetEatTime ?? session.targetBakeTime ?? "Not set"],
    ["Oven / path", session.ovenType ?? session.recipeSnapshot?.oven ?? session.pizzaStyle ?? "Not set"],
    ["Guidance", experience],
    ["Timeline progress", timelineTotal ? `${timelineDone} of ${timelineTotal} steps done` : "No timeline yet"],
  ] as const;
}

export function saveSessionReview(
  session: PizzaSession,
  input: PizzaSessionReviewInput,
  storage?: StorageLike,
  now = new Date(),
) {
  const normalized = normalizeSessionReviewInput(input);
  return updatePizzaSession(
    session.id,
    {
      rating: normalized.rating,
      notes: normalized.notes,
      review: normalized.review,
      status: session.status === "completed" ? "completed" : "reviewing",
      currentStep: "review",
    },
    storage,
    now,
  );
}

export function completeSessionReview(
  session: PizzaSession,
  input: PizzaSessionReviewInput,
  storage?: StorageLike,
  now = new Date(),
) {
  const normalized = normalizeSessionReviewInput(input);
  const completed = updatePizzaSession(
    session.id,
    {
      rating: normalized.rating,
      notes: normalized.notes,
      review: normalized.review,
      status: "completed",
      currentStep: "review",
    },
    storage,
    now,
  );
  if (completed) clearActivePizzaSession(storage);
  return completed;
}
