import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account workspace redesign", () => {
  it("uses the approved signed-in two-column workspace structure without changing navigation or footer", () => {
    const page = source("app/account/page.tsx");

    expect(page).toContain("Your DoughTools workspace");
    expect(page).toContain("account-workspace-shell");
    expect(page).toContain("data-account-workspace-layout=\"two-column\"");
    expect(page).toContain("lg:grid-cols-[minmax(0,2fr)_minmax(18rem,24rem)]");
    expect(page).toContain("data-account-workspace-main");
    expect(page).toContain("data-account-workspace-secondary");
    expect(page.indexOf("account-workspace-heading")).toBeLessThan(page.indexOf("<AccountActivePizzaSessionCard enabled"));
    expect(page.indexOf("<AccountActivePizzaSessionCard enabled")).toBeLessThan(page.indexOf("<AccountPizzaSessionHistory enabled latestOnly"));
    expect(page.indexOf("aria-label=\"Account support tools\"")).toBeGreaterThan(page.indexOf("<AccountPizzaSessionHistory enabled latestOnly"));
    expect(page.indexOf("{accountAccessCard}")).toBeLessThan(page.indexOf("<InstallAppPrompt compact collapsible"));
    expect(page.indexOf("<InstallAppPrompt compact collapsible")).toBeLessThan(page.indexOf("href=\"/account/settings\""));
    expect(page).toContain("<SiteFooter />");
    expect(page).not.toMatch(/GlobalToolNavigation|navigationGroups|SiteFooter.*href|new header link/i);
  });

  it("keeps Account functionality while making the secondary column compact", () => {
    const page = source("app/account/page.tsx");

    expect(page).toContain("<AccountGuidancePreference />");
    expect(page).toContain("<AccountAdminEntryCard />");
    expect(page).toContain("Account and security");
    expect(page).toContain("signOut");
    expect(page).toContain("href=\"/account/settings\"");
    expect(page).toContain("lg:sticky lg:top-24");
    expect(page).toContain("space-y-3");
    expect(page).not.toContain("PartyOrdersAccountEntryCard");
  });

  it("shows only the latest completed pizza plan on Account and keeps safe photo behavior", () => {
    const page = source("app/account/page.tsx");
    const history = source("components/account/AccountPizzaSessionHistory.tsx");

    expect(page).toContain("<AccountPizzaSessionHistory enabled latestOnly");
    expect(history).toContain("latestOnly?: boolean");
    expect(history).toContain("latestCompletedSession = sessions[0] ?? null");
    expect(history).toContain("latestCompletedSession ? [latestCompletedSession] : []");
    expect(history).toContain("sortCloudPizzaSessionHistoryRows(rows)");
    expect(history).toContain("Showing your latest completed pizza plan.");
    expect(history).toContain("Only the latest completed pizza plan is shown here to keep Account compact.");
    expect(history).toContain("const photo = sessionData?.photo?.url");
    expect(history).toContain("{photo && (");
    expect(history).toContain("Completed pizza plan thumbnail");
    expect(history).toContain("href={`/account/pizza-sessions/${session.id}`}");
    expect(history).not.toMatch(/placeholder.*photo|generated image|image_gen|createSignedUrl/i);
  });
});
