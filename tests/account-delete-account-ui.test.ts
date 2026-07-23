import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account delete-account UI", () => {
  it("surfaces Delete my account under Account Settings Privacy and data", () => {
    const settingsPage = source("app/account/settings/page.tsx");
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const component = source("components/account/AccountDeleteAccountCard.tsx");

    expect(settingsPage).toContain("/account/settings/privacy");
    expect(settingsPage).not.toContain("<AccountDeleteAccountCard />");
    expect(privacyPage).toContain("AccountDeleteAccountCard");
    expect(privacyPage).toContain("<AccountDeleteAccountCard />");
    expect(privacyPage.indexOf("<AccountDataExportCard />")).toBeLessThan(privacyPage.indexOf("<AccountDeleteAccountCard />"));
    expect(component).toContain("Delete account");
    expect(component).toContain("Delete my account");
    expect(component).toContain("Privacy Policy");
  });

  it("requires a strong DELETE confirmation before calling the deletion API", () => {
    const component = source("components/account/AccountDeleteAccountCard.tsx");

    expect(component).toContain("Type DELETE to confirm");
    expect(component).toContain('confirmation === "DELETE"');
    expect(component).toContain("disabled={!confirmationMatches || state.status === \"deleting\"}");
    expect(component).toContain('fetch("/api/account/delete", { method: "DELETE" })');
    expect(component).not.toContain("request.json");
  });

  it("explains the permanent deletion scope and admin safeguard", () => {
    const component = source("components/account/AccountDeleteAccountCard.tsx");

    expect(component).toContain("account preferences");
    expect(component).toContain("owned pizza plans and history");
    expect(component).toContain("owned Party Orders with related submissions and items");
    expect(component).toContain("owned Review photos");
    expect(component).toContain("Supabase Auth account");
    expect(component).toContain("current signed-in session");
    expect(component).toContain("Public admin-created configuration is not deleted");
    expect(component).toContain("Admin accounts cannot use self-service deletion");
    expect(component).toContain("This action cannot be undone");
  });

  it("clears only DoughTools-owned browser data on successful deletion", () => {
    const cleanup = source("components/account/account-local-data-cleanup.ts");
    const component = source("components/account/AccountDeleteAccountCard.tsx");

    expect(component).toContain("clearDoughToolsOwnedLocalData()");
    expect(cleanup).toContain("doughtools:pizza-sessions-v1");
    expect(cleanup).toContain("doughtools:active-pizza-session-id");
    expect(cleanup).toContain("doughtools:cloud-backed-pizza-session-id");
    expect(cleanup).toContain("doughtools.kitchen-bake-timer.v1:");
    expect(cleanup).toContain("doughtools:dough-plan-auto-saved-snapshot-key");
    expect(cleanup).not.toMatch(/localStorage\.clear|sessionStorage\.clear|document\.cookie|indexedDB\.deleteDatabase/i);
  });

  it("shows a signed-out completion state without changing the backend", () => {
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const shell = source("components/account/AccountSettingsShell.tsx");
    const component = source("components/account/AccountDeleteAccountCard.tsx");
    const route = source("app/api/account/delete/route.ts");

    expect(component).toContain('window.location.assign("/account/settings/privacy?accountDeleted=1")');
    expect(privacyPage).toContain("showDeletionCompletion");
    expect(shell).toContain("accountDeleted");
    expect(shell).toContain("Your account has been deleted");
    expect(shell).toContain("DoughTools-owned local app data");
    expect(route).toContain("deleteSignedInUserAccount({ user })");
  });

  it("maps backend partial failures and admin blocks to user-friendly retry states", () => {
    const component = source("components/account/AccountDeleteAccountCard.tsx");

    expect(component).toContain("payload.blockedReason === \"adminRole\"");
    expect(component).toContain("payload.storage?.completed === false");
    expect(component).toContain("payload.appData?.success === false");
    expect(component).toContain("payload.auth?.completed === false");
    expect(component).toContain("Your account was not deleted");
    expect(component).toContain("You can retry safely");
    expect(component).not.toContain("success: true");
  });
});
