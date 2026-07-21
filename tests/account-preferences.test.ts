import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  accountPreferencesAreNewer,
  accountPreferencesPayload,
  normalizeAccountPreferencesRow,
} from "@/lib/account-preferences";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account preferences", () => {
  it("defaults missing early-completion preference to false for older accounts", () => {
    expect(normalizeAccountPreferencesRow(null)).toEqual({
      allowEarlyTimedStepCompletion: false,
      bakeTimerSoundTheme: null,
    });
    expect(normalizeAccountPreferencesRow({ user_id: "user-1" })).toEqual({
      allowEarlyTimedStepCompletion: false,
      bakeTimerSoundTheme: null,
    });
  });

  it("normalizes account preference rows and payloads for Supabase storage", () => {
    expect(normalizeAccountPreferencesRow({
      allow_early_timed_step_completion: true,
      bake_timer_sound_theme: "bell",
      updated_at: "2026-07-15T12:00:00.000Z",
    })).toEqual({
      allowEarlyTimedStepCompletion: true,
      bakeTimerSoundTheme: "bell",
      updatedAt: "2026-07-15T12:00:00.000Z",
    });
    expect(accountPreferencesPayload({ allowEarlyTimedStepCompletion: true, bakeTimerSoundTheme: "bell" })).toEqual({
      allow_early_timed_step_completion: true,
      bake_timer_sound_theme: "bell",
    });
  });

  it("detects stale preference writes from older browser state", () => {
    expect(accountPreferencesAreNewer(
      "2026-07-15T12:10:00.000Z",
      "2026-07-15T12:00:00.000Z",
    )).toBe(true);
    expect(accountPreferencesAreNewer(
      "2026-07-15T12:00:00.000Z",
      "2026-07-15T12:10:00.000Z",
    )).toBe(false);
    expect(accountPreferencesAreNewer("2026-07-15T12:10:00.000Z", undefined)).toBe(false);
  });

  it("adds a cloud-backed account preferences table with owner-only RLS", () => {
    const migrationPath = "supabase/migrations/20260715120000_create_account_preferences.sql";
    expect(existsSync(join(process.cwd(), migrationPath))).toBe(true);
    const migration = source(migrationPath);

    expect(migration).toContain("create table if not exists public.account_preferences");
    expect(migration).toContain("user_id uuid primary key references auth.users(id) on delete cascade");
    expect(migration).toContain("allow_early_timed_step_completion boolean not null default false");
    expect(migration).toContain("alter table public.account_preferences enable row level security");
    expect(migration).toContain("auth.uid() = user_id");
  });

  it("exposes authenticated GET and PATCH endpoints with stale-write protection", () => {
    const route = source("app/api/account/preferences/route.ts");

    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain(".from(\"account_preferences\")");
    expect(route).toContain("normalizeAccountPreferencesRow(data)");
    expect(route).toContain("allowEarlyTimedStepCompletion");
    expect(route).toContain("bakeTimerSoundTheme");
    expect(route).toContain("knownUpdatedAt");
    expect(route).toContain("accountPreferencesAreNewer(existingPreferences.updatedAt, knownUpdatedAt)");
    expect(route).toContain("stale: true");
    expect(route).toContain(".insert({ ...payload, user_id: user.id, created_at: updatedAt })");
    expect(route).toContain(".update(payload)");
  });

  it("adds a nullable Bake Timer sound-theme preference without changing owner-only storage", () => {
    const migration = source("supabase/migrations/20260721130000_create_bake_timer_sound_theme_settings.sql");
    const preferences = source("lib/account-preferences.ts");
    const route = source("app/api/account/preferences/route.ts");

    expect(preferences).toContain("bakeTimerSoundTheme: BakeTimerSoundThemeId | null");
    expect(preferences).toContain("bake_timer_sound_theme");
    expect(migration).toContain("alter table public.account_preferences");
    expect(migration).toContain("add column if not exists bake_timer_sound_theme text");
    expect(migration).toContain("account_preferences_bake_timer_sound_theme_check");
    expect(route).toContain("isBakeTimerSoundThemeId(record.bakeTimerSoundTheme)");
    expect(route).toContain("soundSettings.enabledThemeIds.includes(record.bakeTimerSoundTheme)");
  });

  it("renders the Account toggle only in the signed-in account workspace", () => {
    const accountPage = source("app/account/page.tsx");
    const component = source("components/account/AccountEarlyCompletionPreference.tsx");

    expect(accountPage).toContain("AccountEarlyCompletionPreference");
    expect(accountPage.indexOf("<AccountEarlyCompletionPreference />")).toBeGreaterThan(accountPage.indexOf("{user ? ("));
    expect(component).toContain("Allow early completion of timed dough stages");
    expect(component).toContain("Allows you to continue before a dough rest or fermentation timer has finished.");
    expect(component).toContain("Saving preference");
    expect(component).toContain("knownUpdatedAt: updatedAt");
    expect(component).not.toMatch(/localStorage|sessionStorage/);
  });

  it("keeps the preference code available while temporary Kitchen rollout enforcement is disabled", () => {
    const kitchen = source("app/session/kitchen/page.tsx");

    expect(kitchen).toContain("const EARLY_COMPLETION_PREFERENCE_ENFORCED = false");
    expect(kitchen).toContain("fetch(\"/api/account/preferences\"");
    expect(kitchen).toContain("!EARLY_COMPLETION_PREFERENCE_ENFORCED");
    expect(kitchen).toContain("earlyCompletionPreference.signedIn");
    expect(kitchen).toContain("earlyCompletionPreference.allowEarlyTimedStepCompletion");
    expect(kitchen).toContain("currentStepCanConfirmEarlyCompletion");
    expect(kitchen).toContain("primaryActionDisabled");
    expect(kitchen).toContain("Keep waiting");
    expect(kitchen).toContain("Mark complete early");
    expect(kitchen).toContain("getEarlyTimedKitchenCompletionWarning(currentStep, waitInfo.remainingMinutes)");
    expect(kitchen).not.toContain("Continue anyway");
  });
});
