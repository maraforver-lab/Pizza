import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function expectTextLink(sourceText: string, visibleText: string, href: string) {
  expect(sourceText).toContain(visibleText);
  expect(sourceText).toContain(`href="${href}"`);
}

const sessionRoutes = [
  ["start", "/session/start", "app/session/start/page.tsx"],
  ["recipe", "/session/recipe", "app/session/recipe/page.tsx"],
  ["timeline", "/session/timeline", "app/session/timeline/page.tsx"],
  ["shopping", "/session/shopping", "app/session/shopping/page.tsx"],
  ["kitchen", "/session/kitchen", "app/session/kitchen/page.tsx"],
  ["review", "/session/review", "app/session/review/page.tsx"],
] as const;

describe("Pizza Session flow navigation integrity", () => {
  it("keeps every expected Pizza Session route present", () => {
    for (const [, , file] of sessionRoutes) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("connects the intended session route chain with real href destinations", () => {
    const start = source("app/session/start/page.tsx");
    const recipe = source("app/session/recipe/page.tsx");
    const timeline = source("app/session/timeline/page.tsx");
    const shopping = source("app/session/shopping/page.tsx");
    const kitchen = source("app/session/kitchen/page.tsx");
    const review = source("app/session/review/page.tsx");

    expectTextLink(start, "Build my dough plan →", "/session/recipe");
    expectTextLink(recipe, "Continue to Timeline →", "/session/timeline");
    expectTextLink(timeline, "Open shopping list →", "/session/shopping");
    expect(timeline).toContain('href={nextAction.href}');
    expect(timeline).toContain('Start dough →');
    expect(timeline).toContain('Continue baking →');
    expectTextLink(shopping, "Next →", "/session/kitchen");
    expectTextLink(shopping, "Back", "/session/timeline");
    expectTextLink(kitchen, "Back to timeline", "/session/timeline");
    expectTextLink(kitchen, "Review dough plan", "/session/recipe");
    expectTextLink(kitchen, "Review and add notes →", "/session/review");
    expectTextLink(review, "Start a new Pizza Session →", "/session/start");
    expectTextLink(review, "Back to Kitchen Mode", "/session/kitchen");
    expectTextLink(review, "View timeline", "/session/timeline");
  });

  it("keeps the Timeline shopping checkpoint visible before service and bake steps", () => {
    const timeline = source("app/session/timeline/page.tsx");

    expect(timeline).toContain("Shopping checkpoint");
    expect(timeline).toContain("Get pizza ingredients");
    expect(timeline).toContain("Check sauce, cheese and toppings before baking.");
    expect(timeline).toContain("Open shopping list →");
    expect(timeline).toContain('href="/session/shopping"');
    expect(timeline).toContain("const firstServiceStepIndex = timeline?.steps.findIndex(isServiceTimelineStep) ?? -1");
    expect(timeline).toContain("index === shoppingCheckpointInsertIndex");
    expect(timeline.indexOf("<ShoppingCheckpointRow")).toBeLessThan(timeline.indexOf("Step {index + 1}"));
    expect(timeline).not.toMatch(/Copy schedule|Open full Planner|Create shopping list/);
    expect(timeline).not.toMatch(/Mark done|Edit session choices|Review session/);
  });

  it("keeps the Shopping page as simple Next and Back navigation to Kitchen and Timeline", () => {
    const shopping = source("app/session/shopping/page.tsx");

    expect(shopping).toContain("Your shopping list");
    expect(shopping).toContain("Dough essentials");
    expect(shopping).toContain("Sauce");
    expect(shopping).toContain("Cheese");
    expect(shopping).toContain("Toppings");
    expect(shopping).toContain("Optional gear");
    expectTextLink(shopping, "Next →", "/session/kitchen");
    expectTextLink(shopping, "Back", "/session/timeline");
    expect(shopping).not.toMatch(/Copy shopping list|Review dough plan|Back to timeline|Open Kitchen Mode/i);
  });

  it("keeps Kitchen Mode and Review navigation states safe and connected", () => {
    const kitchen = source("app/session/kitchen/page.tsx");
    const review = source("app/session/review/page.tsx");

    expect(kitchen).toContain("Dough Kitchen Mode");
    expect(kitchen).toContain("Pizza Service Mode");
    expect(kitchen).toContain("Mark step as done →");
    expect(kitchen).toContain("Pizza session complete");
    expect(kitchen).toContain("Review and add notes →");
    expect(kitchen).toContain('href="/session/review"');
    expect(review).toContain("How did your pizza turn out?");
    expect(review).toContain("Save review →");
    expect(review).toContain("Review saved in this browser.");
    expect(review).toContain("No pizza session to review");
  });

  it("maps Continue Session to the same flow destinations", () => {
    const timelineSession = createPizzaSession({
      id: "flow-timeline",
      currentStep: "timeline",
    });
    const shoppingSession = createPizzaSession({
      id: "flow-shopping",
      currentStep: "shopping",
    });
    const kitchenSession = createPizzaSession({
      id: "flow-kitchen",
      currentStep: "timeline",
      timeline: {
        generatedAt: "2026-06-25T10:00:00.000Z",
        targetEatTime: "2026-06-27T18:00",
        steps: [{ id: "mix-dough", label: "Mix dough", status: "todo", kind: "active" }],
      },
    });
    const reviewSession = createPizzaSession({
      id: "flow-review",
      currentStep: "review",
    });
    const recipeSession = createPizzaSession({
      id: "flow-recipe",
      currentStep: "recipe",
    });

    expect(pizzaSessionContinueHref(recipeSession)).toBe("/session/recipe");
    expect(pizzaSessionContinueHref(timelineSession)).toBe("/session/timeline");
    expect(pizzaSessionContinueHref(shoppingSession)).toBe("/session/shopping");
    expect(pizzaSessionContinueHref(kitchenSession)).toBe("/session/kitchen");
    expect(pizzaSessionContinueHref(reviewSession)).toBe("/session/review");
  });

  it("does not introduce Finnish UI copy in session flow pages", () => {
    const combined = sessionRoutes
      .map(([, , file]) => source(file))
      .join("\n");

    expect(combined).not.toMatch(/\b(Avaa|Takaisin|Seuraava|Ostoslista|Aikajana|Tallenna|Arvostelu|Taikina)\b/);
  });
});
