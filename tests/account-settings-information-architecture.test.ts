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
    expect(page).toContain("App and device");
    expect(page).toContain("Install DoughTools on this device.");
    expect(page).toContain("/account/settings/preferences");
    expect(page).toContain("/account/settings/privacy");
    expect(page).toContain("/account/settings/security");
    expect(page).toContain("#app-and-device");
    expect(page).toContain('aria-label="Settings categories"');
    expect(page).toContain("min-h-28");
    expect(page).toContain("sm:grid-cols-[minmax(0,1fr)_auto]");
    expect(page).toContain("Open preferences");
    expect(page).toContain("Open privacy");
    expect(page).toContain("Open security");
    expect(page).toContain("View install options");
    expect(page).toContain("<InstallAppPrompt compact collapsible");
    expect(page).toContain("<AccountAdminEntryCard title=\"Admin tools\"");
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
    const securityControls = source("components/account/AccountSecurityControls.tsx");

    expect(preferencesPage).toContain("<AccountGuidancePreference />");
    expect(preferencesPage).toContain("<AccountBakeTimerSoundPreference />");
    expect(privacyPage).toContain("<AccountDataExportCard />");
    expect(privacyPage).toContain("<AccountDeleteAccountCard />");
    expect(securityPage).toContain("<AccountSecurityControls />");
    expect(securityControls).toContain("Email");
    expect(securityControls).toContain("Change email or password");
    expect(securityControls).toContain("supabase.auth.signOut()");
    expect(soundComponent).toContain('fetch("/api/account/preferences"');
    expect(exportComponent).toContain("/api/account/export");
    expect(deleteComponent).toContain('fetch("/api/account/delete", { method: "DELETE" })');
  });

  it("keeps Settings pages responsive and separated by task", () => {
    const shell = source("components/account/AccountSettingsShell.tsx");
    const privacyPage = source("app/account/settings/privacy/page.tsx");
    const securityPage = source("app/account/settings/security/page.tsx");
    const exportComponent = source("components/account/AccountDataExportCard.tsx");

    expect(shell).toContain("overflow-x-hidden");
    expect(shell).toContain("w-full max-w-4xl");
    expect(shell).toContain("max-w-full");
    expect(privacyPage).toContain("space-y-6");
    expect(privacyPage).toContain("border-t border-tomato/15 pt-5");
    expect(exportComponent).toContain("Your data");
    expect(exportComponent).toContain("sm:grid-cols-2");
    expect(exportComponent).toContain("w-full max-w-full");
    expect(securityPage).toContain("<AccountSecurityControls />");
  });
});
