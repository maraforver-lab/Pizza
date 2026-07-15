import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Patch 344 account responsive workspace", () => {
  it("turns account into a responsive workspace without changing authentication plumbing", () => {
    const page = source("app/account/page.tsx");

    expect(page).toContain("Your DoughTools workspace.");
    expect(page).toContain("Loading your DoughTools workspace…");
    expect(page).toContain("lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]");
    expect(page).toContain("AccountActivePizzaSessionCard enabled");
    expect(page).toContain("AccountArchivedPizzaSessions enabled");
    expect(page).toContain("AccountPizzaSessionHistory enabled");
    expect(page).toContain("PartyOrdersAccountEntryCard enabled");
    expect(page).toContain("InstallAppPrompt compact collapsible");
    expect(page).toContain("AccountGuidancePreference");
    expect(page).toContain("Account and security");
    expect(page).toContain("supabase.auth.getUser()");
    expect(page).toContain("supabase.auth.signInWithPassword");
    expect(page).toContain("supabase.auth.signUp");
    expect(page).toContain("supabase.auth.signOut()");
  });

  it("keeps the mobile reading order focused on session work before support settings", () => {
    const page = source("app/account/page.tsx");

    const activeIndex = page.indexOf("AccountActivePizzaSessionCard enabled");
    const archivedIndex = page.indexOf("AccountArchivedPizzaSessions enabled");
    const historyIndex = page.indexOf("AccountPizzaSessionHistory enabled");
    const partyIndex = page.indexOf("PartyOrdersAccountEntryCard enabled");
    const installIndex = page.indexOf("InstallAppPrompt compact collapsible");
    const guidanceIndex = page.indexOf("<AccountGuidancePreference");
    const securityIndex = page.indexOf("Account and security");

    expect(activeIndex).toBeGreaterThan(-1);
    expect(archivedIndex).toBeGreaterThan(activeIndex);
    expect(historyIndex).toBeGreaterThan(archivedIndex);
    expect(partyIndex).toBeGreaterThan(historyIndex);
    expect(installIndex).toBeGreaterThan(partyIndex);
    expect(guidanceIndex).toBeGreaterThan(installIndex);
    expect(securityIndex).toBeGreaterThan(guidanceIndex);
  });

  it("shows only two completed sessions by default with an accessible disclosure for the rest", () => {
    const history = source("components/account/AccountPizzaSessionHistory.tsx");

    expect(history).toContain("const ACCOUNT_HISTORY_COLLAPSED_LIMIT = 2");
    expect(history).toContain("sortCloudPizzaSessionHistoryRows(rows).slice(0, 5)");
    expect(history).toContain("sessions.slice(0, ACCOUNT_HISTORY_COLLAPSED_LIMIT)");
    expect(history).toContain("Show ${hiddenSessionCount} more sessions");
    expect(history).toContain("Show fewer sessions");
    expect(history).toContain("aria-expanded={historyExpanded}");
    expect(history).toContain("aria-controls=\"account-pizza-session-history-list\"");
  });

  it("shows archived unfinished sessions separately from completed history", () => {
    const page = source("app/account/page.tsx");
    const archived = source("components/account/AccountArchivedPizzaSessions.tsx");
    const route = source("app/api/pizza-sessions/archived/route.ts");

    expect(page).toContain("AccountArchivedPizzaSessions enabled");
    expect(archived).toContain("Archived pizza sessions");
    expect(archived).toContain("const ACCOUNT_ARCHIVED_COLLAPSED_LIMIT = 2");
    expect(archived).toContain("fetch(\"/api/pizza-sessions/archived\"");
    expect(archived).toContain("normalizeCloudPizzaSessionArchivedRow");
    expect(archived).toContain("cloudPizzaSessionArchivedSummary");
    expect(archived).toContain("View session details");
    expect(archived).toContain("Show ${hiddenSessionCount} more archived sessions");
    expect(archived).toContain("Archived sessions are read-only in this version");
    expect(route).toContain(".eq(\"status\", \"archived\")");
    expect(route).toContain("sortCloudPizzaSessionArchivedRows");
    expect(route).toContain("slice(0, 10)");
  });

  it("keeps install guidance compact on account without changing PWA event behavior", () => {
    const install = source("components/InstallAppPrompt.tsx");
    const page = source("app/account/page.tsx");

    expect(page).toContain("InstallAppPrompt compact collapsible");
    expect(install).toContain("collapsible?: boolean");
    expect(install).toContain("Show install options");
    expect(install).toContain("Hide install options");
    expect(install).toContain("beforeinstallprompt");
    expect(install).toContain("appinstalled");
    expect(install).toContain("Installing does not add cloud sync, push notifications, tracking or offline mode");
  });

  it("uses the shared guidance preference source rather than account-specific storage", () => {
    const guidance = source("components/account/AccountGuidancePreference.tsx");

    expect(guidance).toContain("readExperienceLevelPreference");
    expect(guidance).toContain("ExperienceLevelSelector");
    expect(guidance).toContain("GuidanceModeBadge");
    expect(guidance).toContain("It changes explanation depth, not the calculations.");
    expect(guidance).not.toMatch(/localStorage\.setItem|sessionStorage|account-guidance-storage/i);
  });

  it("lets active account sessions edit the locked pizza menu through the canonical shopping path", () => {
    const card = source("components/account/AccountActivePizzaSessionCard.tsx");

    expect(card).toContain("Change pizza menu");
    expect(card).toContain("View shopping list");
    expect(card).toContain("Total pizzas:");
    expect(card).toContain("Locked for this session");
    expect(card).toContain("savePizzaSessionMenuMix(restoredSession, draftNormalizedMix");
    expect(card).toContain("queueCloudActivePizzaSessionSave(updatedSession)");
    expect(card).toContain("restoreCloudPizzaSessionToLocal(cloudSession)");
    expect(card).toContain("Shopping rows keep their checked state only when the same item and amount remain valid");
    expect(card).toContain("Pizza menu is locked once baking starts.");
    expect(card).toContain("Save pizza menu");
    expect(card).not.toContain("doughBallWeight:");
    expect(card).not.toContain("plannedFermentationHours:");
  });
});
