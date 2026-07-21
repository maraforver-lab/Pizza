import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeBakeTimerSoundConfiguration,
  resolveEffectiveBakeTimerSoundTheme,
} from "@/lib/bake-timer-sound-themes";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Account Bake Timer sound preference", () => {
  it("adds the signed-in Account preference card without changing signed-out access", () => {
    const componentPath = "components/account/AccountBakeTimerSoundPreference.tsx";
    expect(existsSync(join(process.cwd(), componentPath))).toBe(true);

    const accountPage = source("app/account/page.tsx");
    const component = source(componentPath);

    expect(accountPage).toContain("AccountBakeTimerSoundPreference");
    expect(accountPage.indexOf("<AccountBakeTimerSoundPreference />")).toBeGreaterThan(accountPage.indexOf("{user ? ("));
    expect(component).toContain("Bake Timer sound");
    expect(component).toContain("Choose the sound used by newly opened timers.");
    expect(component).toContain("Each running timer can still be muted separately.");
    expect(component).not.toMatch(/PizzaSession|stepRuntime|queueCloudActivePizzaSessionSave/);
  });

  it("shows default plus enabled production themes and excludes deferred themes", () => {
    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");

    expect(component).toContain("Use DoughTools default");
    expect(component).toContain("enabledThemes.map");
    expect(component).toContain("theme.label");
    expect(component).toContain("theme.description");
    expect(component).not.toMatch(/Dark Commander|Robot Chef|dark-commander|robot-chef/);
  });

  it("keeps the documented fallback behavior for disabled or missing preferences", () => {
    const configuration = normalizeBakeTimerSoundConfiguration({
      enabledThemeIds: ["classic", "bell"],
      defaultThemeId: "bell",
    });

    expect(resolveEffectiveBakeTimerSoundTheme({ userPreference: null, configuration })).toBe("bell");
    expect(resolveEffectiveBakeTimerSoundTheme({ userPreference: "halloween", configuration })).toBe("bell");
    expect(resolveEffectiveBakeTimerSoundTheme({
      userPreference: "halloween",
      configuration: { enabledThemeIds: [], defaultThemeId: "missing" },
    })).toBe("classic");

    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");
    expect(component).toContain("Your saved sound theme is no longer available.");
    expect(component).toContain("New timers will use the DoughTools default");
  });

  it("previews through the shared audio helper and cleans up on navigation or unmount", () => {
    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");

    expect(component).toContain("playBakeTimerCue");
    expect(component).toContain("closeBakeTimerAudioContext");
    expect(component).toContain("PREVIEW_CUES");
    expect(component).toContain("Stop preview");
    expect(component).toContain("stopPreview()");
    expect(component).toContain("return () =>");
    expect(component).not.toMatch(/new AudioContext|getBakeTimerSoundPatternForTheme|localStorage/);
  });

  it("saves only the sound preference through existing Account preferences API", () => {
    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");
    const route = source("app/api/account/preferences/route.ts");

    expect(component).toContain('fetch("/api/account/preferences"');
    expect(component).toContain("bakeTimerSoundTheme: draftChoice === DEFAULT_CHOICE ? null : draftChoice");
    expect(component).toContain("knownUpdatedAt: updatedAt");
    expect(component).not.toContain("allowEarlyTimedStepCompletion:");
    expect(route).toContain("const hasEarlyCompletion");
    expect(route).toContain("const hasSoundTheme");
    expect(route).toContain("hasEarlyCompletion");
    expect(route).toContain("existingPreferences.allowEarlyTimedStepCompletion");
  });

  it("handles stale writes by reloading latest preferences and sound settings", () => {
    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");
    const route = source("app/api/account/preferences/route.ts");

    expect(component).toContain("response.status === 409");
    expect(component).toContain("applyPayload(payload)");
    expect(component).toContain("Latest settings were reloaded.");
    expect(route).toContain("bakeTimerSound: soundSettings");
    expect(route).toContain("stale: true");
  });

  it("uses compact responsive cards instead of a wide table", () => {
    const component = source("components/account/AccountBakeTimerSoundPreference.tsx");
    const doc = source("docs/audits/patch-446d-account-sound-theme-preference.md");

    expect(component).toContain("rounded-[1.75rem]");
    expect(component).toContain("space-y-3");
    expect(component).not.toMatch(/<table|overflow-x|admin UUID|database field|updated_by/i);
    expect(doc).toContain("Patch 446E can wire the saved effective sound theme");
  });
});
