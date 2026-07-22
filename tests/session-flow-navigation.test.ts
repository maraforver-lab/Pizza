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

    expect(start).toContain("Create my pizza plan");
    expect(start).toContain("const continueToRecipe = async (options: { replaceActiveCloudSession?: boolean } = {})");
    expect(start).toContain("await materializeCloudBackedPizzaSession(saved,");
    expect(start).toContain("router.push(\"/session/recipe\")");
    expectTextLink(recipe, "Continue your pizza plan →", "/session/shopping");
    expectTextLink(shopping, "Continue your pizza plan →", "/session/timeline");
    expect(timeline).toContain('onClick={handleNextAction}');
    expect(timeline).toContain('router.push(nextAction.href)');
    expect(timeline).toContain('Start cooking');
    expectTextLink(timeline, "Back", "/session/shopping");
    expect(kitchen).not.toContain("href={backHref}");
    expect(kitchen).not.toContain("kitchenBackHrefFromSource");
    expectTextLink(kitchen, "View full schedule", "/session/timeline");
    expectTextLink(kitchen, "Review my pizza", "/session/review");
    expect(review).toContain("Finish session");
    expect(review).toContain("router.push(\"/\")");
    expect(review).not.toContain("Back to Kitchen Mode");
    expect(review).not.toContain("View timeline");
  });

  it("keeps /session/start unprotected while downstream routes keep their empty states", () => {
    const start = source("app/session/start/page.tsx");
    const recipe = source("app/session/recipe/page.tsx");
    const shopping = source("app/session/shopping/page.tsx");
    const timeline = source("app/session/timeline/page.tsx");
    const kitchen = source("app/session/kitchen/page.tsx");
    const review = source("app/session/review/page.tsx");

    expect(start).toContain("createPlanningDraftSession");
    expect(start).toContain("const baseSession = active ?? createPlanningDraftSession(preferredLevel, requestedStep)");
    expect(start).toContain("resolveCanonicalActivePizzaSession");
    expect(start).toContain("We could not verify your active account pizza session.");
    expect(start).not.toContain("SessionEmptyState");
    expect(recipe).toContain("SessionRouteState");
    expect(recipe).toContain("No active pizza plan");
    expect(shopping).toContain('missingReason === "no-session"');
    expect(shopping).toContain("No shopping list yet");
    expect(timeline).toContain("if (!timeline || missingReason)");
    expect(timeline).toContain("No timeline yet");
    expect(kitchen).toContain('missingReason === "no-session"');
    expect(kitchen).toContain("Kitchen is not ready yet");
    expect(review).toContain("Nothing to review yet");
  });

  it("keeps the Timeline shopping checkpoint visible before service and bake steps", () => {
    const timeline = source("app/session/timeline/page.tsx");

    expect(timeline).toContain("Shopping checkpoint");
    expect(timeline).toContain("Shopping list");
    expect(timeline).not.toContain("Shopping should be handled before Timeline.");
    expect(timeline).not.toContain("Pizza choices and shopping");
    expect(timeline).not.toContain("Review shopping →");
    expect(timeline).toContain("Use Back if you still need to check ingredients.");
    expect(timeline).toContain('href="/session/shopping"');
    expect(timeline).toContain("const firstServiceStepIndex = displayTimelineSteps.findIndex(isServiceTimelineStep)");
    expect(timeline).toContain("index === shoppingCheckpointInsertIndex");
    expect(timeline.indexOf("<ShoppingCheckpointRow")).toBeLessThan(timeline.indexOf("Step {index + 1}"));
    expect(timeline).not.toMatch(/Copy schedule|Open full Planner|Create shopping list/);
    expect(timeline).not.toMatch(/Mark done|Edit session choices|Review session/);
  });

  it("keeps the Shopping page as pizza choice and shopping before Timeline", () => {
    const shopping = source("app/session/shopping/page.tsx");

    expect(shopping).toContain("Your shopping list");
    expect(shopping).toContain("Check ingredients, choose toppings, then continue your pizza plan.");
    expect(shopping).toContain("These are the ingredients you need to make the dough, make the sauce and choose toppings. Check what you already have and what you still need to buy.");
    expect(shopping).toContain("levelCompactOnMobile");
    expect(shopping).toContain("hideBodyOnMobile");
    expect(shopping).toContain("Shopping list");
    expect(shopping).not.toContain("Before Timeline");
    expect(shopping.indexOf("Shopping list")).toBeLessThan(shopping.indexOf("<BottomActionBar"));
    expect(shopping.indexOf("<BottomActionBar")).toBeLessThan(shopping.indexOf("Optional shopping tools"));
    expect(shopping.indexOf("Optional shopping tools")).toBeLessThan(shopping.indexOf("Hide topping choices"));
    expect(shopping.indexOf("Hide topping choices")).toBeLessThan(shopping.indexOf("PIZZA_MIX_OPTIONS.map"));
    expect(shopping).not.toContain("Dough style and dough formula stay in the Dough Plan.");
    expect(shopping).toContain("Total selected:");
    expect(shopping).toContain("selectedPizzaMixSummary");
    expect(shopping).toContain('aria-controls="pizza-menu-controls-panel"');
    expect(shopping).toContain("aria-expanded={menuControlsOpen}");
    expect(shopping).toContain("Make the dough");
    expect(shopping).toContain("Make the sauce");
    expect(shopping).toContain("Cheese");
    expect(shopping).toContain("Choose toppings");
    expect(shopping).toContain("Optional gear");
    expectTextLink(shopping, "Continue your pizza plan →", "/session/timeline");
    expectTextLink(shopping, "Back", "/session/recipe");
    expect(shopping).toContain('className={buttonClass({ className: "hidden w-full sm:inline-flex sm:w-auto", variant: "secondary" })}');
    expect(shopping).not.toMatch(/Copy shopping list|Review dough plan|Back to timeline|Open Kitchen Mode/i);
  });

  it("keeps Kitchen Mode and Review navigation states safe and connected", () => {
    const kitchen = source("app/session/kitchen/page.tsx");
    const review = source("app/session/review/page.tsx");

    expect(kitchen).toContain("hideLocalSaveNote");
    expect(kitchen).toContain("Done baking? Review");
    expect(kitchen).toContain("Pizza plan ready for Review");
    expect(kitchen).toContain("Review my pizza");
    expect(kitchen).toContain('href="/session/review"');
    expect(kitchen).not.toContain("href={backHref}");
    expectTextLink(kitchen, "View full schedule", "/session/timeline");
    expect(kitchen).toContain("max-sm:hidden w-full sm:w-auto");
    expect(kitchen).toContain("Keep waiting");
    expect(kitchen).toContain("Mark complete early");
    expect(kitchen).toContain("Current step");
    expect(kitchen).toContain("Planned ${plannedClock}");
    expect(kitchen).not.toContain("Next action");
    expect(kitchen).toContain("Next:");
    expect(kitchen).toContain("More guidance");
    expect(kitchen).toContain("Change pizza menu");
    expect(kitchen).toContain("buildContextualReturnHref(doughGuideLink.href)");
    expect(kitchen).toContain("buildContextualReturnHref(ovenTroubleshootingLink.href)");
    expect(kitchen).not.toContain("Step 9: Kitchen Mode");
    expect(kitchen).not.toContain("Do this now");
    expect(kitchen).not.toContain("SessionStepHero");
    expect(kitchen).not.toMatch(/Review dough plan|Open shopping list|Save and continue later|Open full Calculator/);
    expect(review).toContain("Finish session");
    expect(review).toContain("Finishing session…");
    expect(review).toContain("Add a pizza photo and share your bake");
    expect(review).toContain("Nothing to review yet");
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

  it("resumes persisted Kitchen progress to Kitchen even when the last safe route is stale", () => {
    const kitchenStartedSession = createPizzaSession({
      id: "flow-kitchen-stale-last-route",
      currentStep: "prep",
      status: "preparing",
      lastRoute: "/session/timeline",
      timeline: {
        generatedAt: "2026-06-25T10:00:00.000Z",
        targetEatTime: "2026-06-27T18:00",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", status: "todo", kind: "passive" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-06-25T10:15:00.000Z",
          actualCompletedAt: "2026-06-25T10:30:00.000Z",
        },
      },
    });

    expect(pizzaSessionContinueHref(kitchenStartedSession)).toBe("/session/kitchen");
  });

  it("does not introduce Finnish UI copy in session flow pages", () => {
    const combined = sessionRoutes
      .map(([, , file]) => source(file))
      .join("\n");

    expect(combined).not.toMatch(/\b(Avaa|Takaisin|Seuraava|Ostoslista|Aikajana|Tallenna|Arvostelu|Taikina)\b/);
  });

  it("uses the shared semantic icon system for primary functional session icons", () => {
    const targetedFiles = [
      "components/GlobalToolNavigation.tsx",
      "components/session/SessionProgressSidebar.tsx",
      "app/session/start/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
    ];
    const combined = targetedFiles.map(source).join("\n");

    expect(combined).toContain("DoughToolsIcon");
    expect(combined).not.toMatch(/[🥣🌡🔥🍕🕒⏱🛒💧🍞🍅📝❄️⏳]/u);
    expect(combined).not.toMatch(/[▣▥◒◌✺]/u);
    expect(combined).not.toContain(">✓<");
    expect(combined).not.toContain(">×<");
    expect(combined).not.toContain(">−<");
    expect(combined).not.toContain(">+<");
    expect(combined).not.toContain(">→<");
    expect(combined).toContain("aria-label=\"Decrease pizza count\"");
    expect(combined).toContain("aria-label=\"Increase pizza count\"");
  });
});
