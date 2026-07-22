import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Patch 344 account responsive workspace", () => {
  it("turns account into a responsive workspace without changing authentication plumbing", () => {
    const page = source("app/account/page.tsx");

    expect(page).toContain("Your DoughTools workspace.");
    expect(page).toContain("Your place for pizza plans.");
    expect(page).toContain("Active pizza plans can be saved to your account");
    expect(page).toContain("Pizza plans appear here when they are active or completed.");
    expect(page).toContain("Loading your DoughTools workspace…");
    expect(page).toContain("lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]");
    expect(page).toContain("AccountActivePizzaSessionCard enabled");
    expect(page).toContain("AccountPizzaSessionHistory enabled");
    expect(page).toContain("PartyOrdersAccountEntryCard enabled");
    expect(page).toContain("InstallAppPrompt compact collapsible");
    expect(page).toContain("AccountGuidancePreference");
    expect(page).toContain("AccountAdminEntryCard");
    expect(page).toContain("Account and security");
    expect(page).not.toContain("AccountArchivedPizzaSessions");
    expect(page).not.toContain("Archived pizza sessions");
    expect(page).toContain("supabase.auth.getUser()");
    expect(page).toContain("supabase.auth.signInWithPassword");
    expect(page).toContain("supabase.auth.signUp");
    expect(page).toContain("supabase.auth.signOut()");
  });

  it("keeps the mobile reading order focused on session work before support settings", () => {
    const page = source("app/account/page.tsx");

    const activeIndex = page.indexOf("AccountActivePizzaSessionCard enabled");
    const historyIndex = page.indexOf("AccountPizzaSessionHistory enabled");
    const partyIndex = page.indexOf("PartyOrdersAccountEntryCard enabled");
    const installIndex = page.indexOf("InstallAppPrompt compact collapsible");
    const guidanceIndex = page.indexOf("<AccountGuidancePreference");
    const adminIndex = page.indexOf("<AccountAdminEntryCard");
    const securityIndex = page.indexOf("Account and security");

    expect(activeIndex).toBeGreaterThan(-1);
    expect(historyIndex).toBeGreaterThan(activeIndex);
    expect(partyIndex).toBeGreaterThan(historyIndex);
    expect(installIndex).toBeGreaterThan(partyIndex);
    expect(guidanceIndex).toBeGreaterThan(installIndex);
    expect(adminIndex).toBeGreaterThan(guidanceIndex);
    expect(securityIndex).toBeGreaterThan(adminIndex);
  });

  it("shows only two completed pizza plans by default with an accessible disclosure for the rest", () => {
    const history = source("components/account/AccountPizzaSessionHistory.tsx");

    expect(history).toContain("const ACCOUNT_HISTORY_COLLAPSED_LIMIT = 2");
    expect(history).toContain("sortCloudPizzaSessionHistoryRows(rows)");
    expect(history).toContain("sessions.slice(0, ACCOUNT_HISTORY_COLLAPSED_LIMIT)");
    expect(history).toContain("retained completed pizza plans");
    expect(history).toContain("Show ${hiddenSessionCount} more pizza plans");
    expect(history).toContain("Show fewer pizza plans");
    expect(history).toContain("aria-expanded={historyExpanded}");
    expect(history).toContain("aria-controls=\"account-pizza-session-history-list\"");
  });

  it("removes the archived unfinished-session product surface", () => {
    const page = source("app/account/page.tsx");

    expect(page).not.toContain("AccountArchivedPizzaSessions");
    expect(page).not.toContain("/api/pizza-sessions/archived");
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

  it("lets active account pizza plans edit the locked pizza menu through the canonical shopping path", () => {
    const card = source("components/account/AccountActivePizzaSessionCard.tsx");

    expect(card).toContain("Pizza plan");
    expect(card).toContain("Continue your pizza plan");
    expect(card).toContain("Plan a pizza from the homepage.");
    expect(card).toContain("Change pizza menu");
    expect(card).toContain("View shopping list");
    expect(card).toContain("Total pizzas:");
    expect(card).toContain("Locked for this pizza plan");
    expect(card).toContain("savePizzaSessionMenuMix(restoredSession, draftNormalizedMix");
    expect(card).toContain("queueCloudActivePizzaSessionSave(updatedSession)");
    expect(card).toContain("restoreCloudPizzaSessionToLocal(cloudSession)");
    expect(card).toContain("Shopping rows keep their checked state only when the same item and amount remain valid");
    expect(card).toContain("Pizza menu is locked once baking starts.");
    expect(card).toContain("Save pizza menu");
    expect(card).not.toContain("Continue Pizza Session");
    expect(card).not.toContain("Start a new Pizza Session");
    expect(card).not.toContain("doughBallWeight:");
    expect(card).not.toContain("plannedFermentationHours:");
  });

  it("uses pizza plan terminology for completed account history", () => {
    const history = source("components/account/AccountPizzaSessionHistory.tsx");
    const detail = source("components/account/CompletedPizzaSessionDetail.tsx");

    expect(history).toContain("Pizza plan history");
    expect(history).toContain("No completed pizza plans yet");
    expect(history).toContain("Finish and review a pizza plan to save it here.");
    expect(history).toContain("View pizza plan");
    expect(detail).toContain("Completed pizza plan");
    expect(detail).toContain("Pizza plan name");
    expect(detail).toContain("No review notes were saved for this pizza plan.");
    expect(history).not.toContain("Pizza session history");
    expect(detail).not.toContain("Completed session not found.");
  });
});
