import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Patch 311 responsive visual audit protections", () => {
  it("keeps calculator numeric controls readable without overlaying units on values", () => {
    const quickCalculator = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const calculatorV2 = source("components/HomeCalculatorWorkspace.tsx");

    expect(quickCalculator).toContain("data-quick-number-control");
    expect(quickCalculator).toContain("data-quick-number-unit");
    expect(quickCalculator).not.toContain("absolute right-3");

    expect(calculatorV2).toContain("data-responsive-number-control");
    expect(calculatorV2).toContain("grid-cols-[3.25rem_minmax(5.25rem,1fr)_auto_3.25rem]");
    expect(calculatorV2).toContain("tabular-nums");
    expect(calculatorV2).not.toContain("absolute right-4");
    expect(calculatorV2).not.toContain("pr-12");
  });

  it("lets long account and Party Order titles wrap inside their cards", () => {
    const history = source("components/account/AccountPizzaSessionHistory.tsx");
    const partyOrders = source("components/account/PartyOrdersList.tsx");
    const partyDetail = source("components/account/PartyOrderDetail.tsx");
    const publicOrder = source("components/party-orders/PublicPartyOrderForm.tsx");
    const publicOrderEdit = source("components/party-orders/PublicPartyOrderEditForm.tsx");

    expect(history).toContain("[overflow-wrap:anywhere]");
    expect(partyOrders).toContain("[overflow-wrap:anywhere]");
    expect(partyDetail).toContain("[overflow-wrap:anywhere]");
    expect(publicOrder).toContain("[overflow-wrap:anywhere]");
    expect(publicOrderEdit).toContain("[overflow-wrap:anywhere]");
  });

  it("keeps key cards, dialogs, dropdowns and lists viewport-safe without global overflow hiding", () => {
    const kitchen = source("app/session/kitchen/page.tsx");
    const shopping = source("app/session/shopping/page.tsx");
    const troubleshooting = source("components/guide/PizzaTroubleshootingGuideClient.tsx");
    const navigation = source("components/GlobalToolNavigation.tsx");
    const homepage = source("app/page.tsx");
    const siteFooter = source("components/SiteFooter.tsx");
    const globals = source("app/globals.css");

    expect(kitchen).toContain("max-h-[calc(100vh-3rem)]");
    expect(kitchen).toContain("overflow-y-auto");
    expect(shopping).toContain("[overflow-wrap:anywhere]");
    expect(troubleshooting).toContain("[overflow-wrap:anywhere]");
    expect(navigation).toContain("w-[min(21rem,calc(100vw-1.5rem))]");
    expect(navigation).toContain("max-sm:fixed");
    expect(navigation).toContain("max-sm:max-h-[calc(100vh-4.5rem)]");
    expect(navigation).toContain("max-sm:overflow-y-auto");
    expect(navigation).toContain("overflow-visible");
    expect(navigation).not.toContain("items-center justify-between gap-2 overflow-hidden");
    expect(navigation).not.toContain("items-center justify-start gap-1 overflow-hidden");
    expect(homepage).toContain("<SiteFooter />");
    expect(siteFooter).toContain("data-site-footer");
    expect(siteFooter).toContain("min-[390px]:grid-cols-2 md:grid-cols-1");
    expect(siteFooter).toContain("min-h-9");
    expect(globals).not.toContain("overflow-x: hidden");
  });

  it("does not add sitewide blank scroll space after the final content or footer", () => {
    const globals = source("app/globals.css");
    const siteFooter = source("components/SiteFooter.tsx");
    const trustLayout = source("components/TrustPageLayout.tsx");
    const workflowNextStep = source("components/WorkflowNextStep.tsx");
    const sessionKitchen = source("app/session/kitchen/page.tsx");

    expect(globals).not.toContain("padding-bottom: calc(5.25rem + env(safe-area-inset-bottom))");
    expect(globals).not.toMatch(/@media\s*\(max-width:\s*767px\)\s*{\s*body\s*{\s*padding-bottom/);
    expect(siteFooter).toContain("data-site-footer");
    expect(trustLayout.indexOf("<SiteFooter />")).toBeGreaterThan(trustLayout.indexOf("Back to DoughTools"));
    expect(workflowNextStep).not.toMatch(/fixed|sticky|bottom-0/);
    expect(sessionKitchen).toContain("pb-28");
  });

  it("preserves navigation routes and business-logic boundaries while applying responsive fixes", () => {
    const navigation = source("components/GlobalToolNavigation.tsx");
    const quickCalculator = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const sessionKitchen = source("app/session/kitchen/page.tsx");

    expect(navigation).toContain("/calculator/quick");
    expect(navigation).toContain("/guides/dough");
    expect(navigation).toContain("/guide/pizza-troubleshooting");
    expect(quickCalculator).toContain("calculateQuickDough(input)");
    expect(quickCalculator).not.toContain("getActivePizzaSession");
    expect(sessionKitchen).toContain("completeCurrentStep");
    expect(sessionKitchen).toContain("shouldConfirmEarlyKitchenStepCompletion");
  });
});
