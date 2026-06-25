import { type ExperienceLevel } from "@/lib/experience-levels";
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
  nextTimeTry?: string;
};

export const SESSION_REVIEW_LOCAL_ONLY_COPY =
  "Review notes are saved locally in this browser on this device for now.";

export const reviewCopyByLevel: Record<ExperienceLevel, {
  heading: string;
  intro: string;
  whatWorkedPlaceholder: string;
  improvePlaceholder: string;
  notesPlaceholder: string;
  nextTimeTryPlaceholder: string;
}> = {
  beginner: {
    heading: "Save what you learned.",
    intro: "Keep it simple: rate the result and save one thing to repeat or change next time.",
    whatWorkedPlaceholder: "Example: The dough was easy to stretch, the crust browned well, or the timing felt calm.",
    improvePlaceholder: "Example: Use less topping, preheat longer, make smaller dough balls, or ferment longer.",
    notesPlaceholder: "Add any extra notes about dough feel, oven heat, toppings, timing or serving.",
    nextTimeTryPlaceholder: "Example: 24h cold ferment, less cheese, hotter oven, or thinner stretch.",
  },
  enthusiast: {
    heading: "Make the next bake easier to repeat.",
    intro: "Save timing, dough feel, oven behavior and topping balance while the result is fresh.",
    whatWorkedPlaceholder: "Example: The dough was easy to stretch, the crust browned well, or the timing felt calm.",
    improvePlaceholder: "Example: Use less topping, preheat longer, make smaller dough balls, or ferment longer.",
    notesPlaceholder: "Add any extra notes about dough feel, oven heat, toppings, timing or serving.",
    nextTimeTryPlaceholder: "Example: 24h cold ferment, less cheese, hotter oven, or thinner stretch.",
  },
  pizza_nerd: {
    heading: "Capture the variables worth testing next.",
    intro: "Save useful variables like hydration, fermentation time, flour, oven heat, topping load and bake timing.",
    whatWorkedPlaceholder: "Example: The dough was easy to stretch, the crust browned well, or the timing felt calm.",
    improvePlaceholder: "Example: Use less topping, preheat longer, make smaller dough balls, or ferment longer.",
    notesPlaceholder: "Add any extra notes about dough feel, oven heat, toppings, timing or serving.",
    nextTimeTryPlaceholder: "Example: 24h cold ferment, less cheese, hotter oven, or thinner stretch.",
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
      nextTimeTry: cleanText(input.nextTimeTry),
    },
  };
}

export function getSessionReviewCopy(level: ExperienceLevel) {
  return reviewCopyByLevel[level] ?? reviewCopyByLevel.beginner;
}

export function sessionSummaryLines(session: PizzaSession) {
  return [
    ["Pizza preset", session.pizzaPreset ?? session.recipeSnapshot?.pizzaPreset ?? session.pizzaStyle ?? "Not set"],
    ["Pizza count", session.pizzaCount ? `${session.pizzaCount} pizzas` : session.recipeSnapshot?.balls ? `${session.recipeSnapshot.balls} pizzas` : "Not set"],
    ["Ball weight", session.recipeSnapshot?.ballWeight ? `${session.recipeSnapshot.ballWeight} g` : "Not set"],
    ["Flour", session.flour ?? session.recipeSnapshot?.flour ?? "Not set"],
    ["Hydration", typeof session.recipeSnapshot?.hydration === "number" ? `${session.recipeSnapshot.hydration} %` : "Not set"],
    ["Fermentation", session.recipeSnapshot?.fermentation ?? "Not set"],
    ["Yeast type", session.recipeSnapshot?.yeastType?.toUpperCase() ?? "Not set"],
    ["Target time", session.targetEatTime ?? session.targetBakeTime ?? "Not set"],
  ] as const;
}

export function saveSessionReview(
  session: PizzaSession,
  input: PizzaSessionReviewInput,
  storage?: StorageLike,
  now = new Date(),
) {
  const normalized = normalizeSessionReviewInput(input);
  const savedAt = now.toISOString();
  return updatePizzaSession(
    session.id,
    {
      rating: normalized.rating,
      notes: normalized.notes,
      review: {
        ...normalized.review,
        savedAt,
      },
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
  const savedAt = now.toISOString();
  const completed = updatePizzaSession(
    session.id,
    {
      rating: normalized.rating,
      notes: normalized.notes,
      review: {
        ...normalized.review,
        savedAt,
      },
      status: "completed",
      currentStep: "review",
    },
    storage,
    now,
  );
  if (completed) clearActivePizzaSession(storage);
  return completed;
}
