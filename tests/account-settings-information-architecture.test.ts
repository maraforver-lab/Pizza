import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account Settings information architecture", () => {
  it("renders Settings as a concise category hub", () => {
    const page = source("app/account/settings/page.tsx");

    expect(page).toContain('title="Settings"');
    expect(page).toContain("Choose the account settings area you want to manage.");
    expect(page).toContain("Preferences");
    expect(page).toContain("Personalize how DoughTools works for you.");
    expect(page).toContain("Privacy and data");
    expect(page).toContain("Download your data or permanently delete your account.");
    expect(page).toContain("Security");
    expect(page).toContain("Manage your email, password and account access.");
    expect(page).toContain("/account/settings/preferences");
    expect(page).toContain("/account/settings/privacy");
    expect(page).toContain("/account/settings/security");
  });

  it("keeps the existing Settings auth guard and back navigation shared by subpages", () => {
    const shell = source("components/account/AccountSettingsShell.tsx");
    const preferencesPage = source("app/account/settings/preferences/page.tsx");
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const securityPage = source("app/account/settings/security/page.tsx");

    expect(shell).toContain("supabase.auth.getUser()");
    expect(shell).toContain("onAuthStateChange");
    expect(shell).toContain("Sign in to manage settings");
    expect(preferencesPage).toContain('backHref="/account/settings"');
    expect(privacyPage).toContain('backHref="/account/settings"');
    expect(securityPage).toContain('backHref="/account/settings"');
    expect(preferencesPage).toContain('backLabel="Back to Settings"');
    expect(privacyPage).toContain('backLabel="Back to Settings"');
    expect(securityPage).toContain('backLabel="Back to Settings"');
  });

  it("groups existing settings without changing backend endpoints", () => {
    const preferencesPage = source("app/account/settings/preferences/page.tsx");
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const securityPage = source("app/account/settings/security/page.tsx");
    const soundComponent = source("components/account/AccountBakeTimerSoundPreference.tsx");
    const exportComponent = source("components/account/AccountDataExportCard.tsx");
    const deleteComponent = source("components/account/AccountDeleteAccountCard.tsx");

    expect(preferencesPage).toContain("<AccountBakeTimerSoundPreference />");
    expect(privacyPage).toContain("<AccountDataExportCard />");
    expect(privacyPage).toContain("<AccountDeleteAccountCard />");
    expect(securityPage).toContain("Open Account to use the existing email and password access controls.");
    expect(securityPage).toContain("Open Account to sign out of this browser.");
    expect(soundComponent).toContain('fetch("/api/account/preferences"');
    expect(exportComponent).toContain('fetch("/api/account/export"');
    expect(deleteComponent).toContain('fetch("/api/account/delete", { method: "DELETE" })');
  });
});
