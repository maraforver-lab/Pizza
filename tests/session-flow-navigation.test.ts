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

    expectTextLink(start, "Build my Dough Plan →", "/session/recipe");
    expectTextLink(recipe, "Continue to Shopping →", "/session/shopping");
    expectTextLink(shopping, "Continue to Timeline →", "/session/timeline");
    expect(timeline).toContain('onClick={handleNextAction}');
    expect(timeline).toContain('router.push(nextAction.href)');
    expect(timeline).toContain('Start dough →');
    expect(timeline).toContain('Continue baking →');
    expectTextLink(timeline, "Back", "/session/shopping");
    expect(kitchen).toContain("href={backHref}");
    expect(kitchen).toContain("kitchenBackHrefFromSource");
    expectTextLink(kitchen, "Review your pizza →", "/session/review");
    expect(review).toContain("Save review →");
    expect(review).toContain("router.push(\"/\")");
    expect(review).not.toContain("Back to Kitchen Mode");
    expect(review).not.toContain("View timeline");
  });

  it("keeps the Timeline shopping checkpoint visible before service and bake steps", () => {
    const timeline = source("app/session/timeline/page.tsx");

    expect(timeline).toContain("Shopping checkpoint");
    expect(timeline).toContain("Shopping review");
    expect(timeline).toContain("Shopping should be handled before Timeline.");
    expect(timeline).not.toContain("Pizza choices and shopping");
    expect(timeline).toContain("Review shopping →");
    expect(timeline).toContain('href="/session/shopping"');
    expect(timeline).toContain("const firstServiceStepIndex = displayTimelineSteps.findIndex(isServiceTimelineStep)");
    expect(timeline).toContain("index === shoppingCheckpointInsertIndex");
    expect(timeline.indexOf("<ShoppingCheckpointRow")).toBeLessThan(timeline.indexOf("Step {index + 1}"));
    expect(timeline).not.toMatch(/Copy schedule|Open full Planner|Create shopping list/);
    expect(timeline).not.toMatch(/Mark done|Edit session choices|Review session/);
  });

  it("keeps the Shopping page as pizza choice and shopping before Timeline", () => {
    const shopping = source("app/session/shopping/page.tsx");

    expect(shopping).toContain("Shopping & Pizza Menu");
    expect(shopping).toContain("Choose what you’ll make and get your ingredients ready.");
    expect(shopping).toContain("Shopping Checklist");
    expect(shopping).toContain("Before Timeline");
    expect(shopping.indexOf("Total selected:")).toBeLessThan(shopping.indexOf("PIZZA_MIX_OPTIONS.map"));
    expect(shopping.indexOf("PIZZA_MIX_OPTIONS.map")).toBeLessThan(shopping.indexOf("Shopping Checklist"));
    expect(shopping.indexOf("Shopping Checklist")).toBeLessThan(shopping.indexOf("Before Timeline"));
    expect(shopping).not.toContain("Dough style and dough formula stay in the Dough Plan.");
    expect(shopping).toContain("Total selected:");
    expect(shopping).toContain("Dough ingredients");
    expect(shopping).toContain("Sauce");
    expect(shopping).toContain("Cheese");
    expect(shopping).toContain("Toppings");
    expect(shopping).toContain("Optional gear");
    expectTextLink(shopping, "Continue to Timeline →", "/session/timeline");
    expectTextLink(shopping, "Back", "/session/recipe");
    expect(shopping).not.toMatch(/Copy shopping list|Review dough plan|Back to timeline|Open Kitchen Mode/i);
  });

  it("keeps Kitchen Mode and Review navigation states safe and connected", () => {
    const kitchen = source("app/session/kitchen/page.tsx");
    const review = source("app/session/review/page.tsx");

    expect(kitchen).toContain("hideLocalSaveNote");
    expect(kitchen).toContain("Mark step as done →");
    expect(kitchen).toContain("Pizza session complete");
    expect(kitchen).toContain("Review your pizza →");
    expect(kitchen).toContain('href="/session/review"');
    expect(kitchen).toContain("href={backHref}");
    expect(kitchen).toContain("This step is scheduled later");
    expect(kitchen).toContain("Continue anyway");
    expect(kitchen).toContain("Current step");
    expect(kitchen).toContain("Planned for");
    expect(kitchen).toContain("Next action");
    expect(kitchen).not.toContain("Step 9: Kitchen Mode");
    expect(kitchen).not.toContain("Do this now");
    expect(kitchen).not.toContain("SessionStepHero");
    expect(kitchen).not.toMatch(/Review dough plan|Open shopping list|Save and continue later|Open full Calculator/);
    expect(review).toContain("Save review →");
    expect(review).toContain("Saving review…");
    expect(review).toContain("Add a pizza photo and share your bake");
    expect(review).toContain("No pizza session to review");
    expect(review).not.toContain("How did your pizza turn out?");
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
