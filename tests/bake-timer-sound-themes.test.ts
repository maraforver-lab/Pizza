import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getBakeTimerSoundPattern } from "@/lib/bake-timer";
import {
  BAKE_TIMER_SOUND_CUE_ROLES,
  BAKE_TIMER_SOUND_THEME_DEFINITIONS,
  BAKE_TIMER_SOUND_THEME_IDS,
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  DEFERRED_BAKE_TIMER_SOUND_THEME_IDS,
  bakeTimerSoundCueRole,
  getBakeTimerSoundPatternForTheme,
  normalizeBakeTimerSoundConfiguration,
  publicBakeTimerSoundThemeDefinitions,
  resolveEffectiveBakeTimerSoundTheme,
} from "@/lib/bake-timer-sound-themes";
import {
  bakeTimerSoundSettingsResponse,
  parseBakeTimerSoundSettingsPayload,
} from "@/lib/bake-timer-sound-settings";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Bake Timer sound themes", () => {
  it("defines the approved initial registry and defers higher-risk themes", () => {
    expect(BAKE_TIMER_SOUND_THEME_IDS).toEqual(["classic", "bell", "rooster", "halloween"]);
    expect(DEFERRED_BAKE_TIMER_SOUND_THEME_IDS).toEqual(["dark-commander", "robot-chef"]);
    expect(BAKE_TIMER_SOUND_CUE_ROLES).toEqual(["periodic", "final20", "final10", "final3", "expiry", "overtime"]);
    expect(BAKE_TIMER_SOUND_THEME_DEFINITIONS.map((theme) => theme.id)).toEqual(BAKE_TIMER_SOUND_THEME_IDS);
    expect(publicBakeTimerSoundThemeDefinitions()[0]).not.toHaveProperty("patternByCue");
  });

  it("keeps Classic as the exact legacy fallback pattern", () => {
    expect(CLASSIC_BAKE_TIMER_SOUND_THEME_ID).toBe("classic");
    expect(getBakeTimerSoundPatternForTheme("normal", "classic")).toEqual(getBakeTimerSoundPattern("normal"));
    expect(getBakeTimerSoundPatternForTheme("expired", "classic")).toEqual(getBakeTimerSoundPattern("expired"));
    expect(getBakeTimerSoundPatternForTheme("overtime", "missing-theme")).toEqual(getBakeTimerSoundPattern("overtime"));
  });

  it("maps existing timer cues to shared semantic cue roles without changing cadence", () => {
    expect(bakeTimerSoundCueRole("normal")).toBe("periodic");
    expect(bakeTimerSoundCueRole("almost_there")).toBe("final20");
    expect(bakeTimerSoundCueRole("final_ten_transition")).toBe("final10");
    expect(bakeTimerSoundCueRole("final_ten")).toBe("final10");
    expect(bakeTimerSoundCueRole("final_three")).toBe("final3");
    expect(bakeTimerSoundCueRole("expired")).toBe("expiry");
    expect(bakeTimerSoundCueRole("overtime")).toBe("overtime");
  });

  it("resolves user preference to product default to Classic", () => {
    const configuration = normalizeBakeTimerSoundConfiguration({
      enabledThemeIds: ["classic", "bell"],
      defaultThemeId: "bell",
    });
    expect(resolveEffectiveBakeTimerSoundTheme({ userPreference: "classic", configuration })).toBe("classic");
    expect(resolveEffectiveBakeTimerSoundTheme({ userPreference: "halloween", configuration })).toBe("bell");
    expect(resolveEffectiveBakeTimerSoundTheme({ userPreference: null, configuration })).toBe("bell");
    expect(resolveEffectiveBakeTimerSoundTheme({
      userPreference: "bell",
      configuration: { enabledThemeIds: [], defaultThemeId: "missing" },
    })).toBe("classic");
  });

  it("normalizes admin sound settings and rejects unavailable or non-fallback-safe payloads", () => {
    const response = bakeTimerSoundSettingsResponse([
      { theme_id: "classic", enabled: true, is_default: false, version: 3 },
      { theme_id: "bell", enabled: true, is_default: true, version: 3 },
      { theme_id: "halloween", enabled: false, is_default: false, version: 3 },
      { theme_id: "dark-commander", enabled: true, is_default: false, version: 3 },
    ], "halloween");

    expect(response.enabledThemeIds).toEqual(["classic", "bell"]);
    expect(response.defaultThemeId).toBe("bell");
    expect(response.effectiveThemeId).toBe("bell");
    expect(response.version).toBe(3);
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: ["bell"],
      defaultThemeId: "bell",
      expectedVersion: 1,
    })).toMatchObject({ ok: false });
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: ["classic", "bell"],
      defaultThemeId: "halloween",
      expectedVersion: 1,
    })).toMatchObject({ ok: false });
  });

  it("adds the Patch 446B database model without broadening private-user access", () => {
    const migrationPath = "supabase/migrations/20260721130000_create_bake_timer_sound_theme_settings.sql";
    expect(existsSync(join(process.cwd(), migrationPath))).toBe(true);
    const migration = source(migrationPath);

    expect(migration).toContain("create table if not exists public.bake_timer_sound_theme_settings");
    expect(migration).toContain("bake_timer_sound_theme text");
    expect(migration).toContain("theme_id in ('classic', 'bell', 'rooster', 'halloween')");
    expect(migration).toContain("public.get_bake_timer_sound_configuration()");
    expect(migration).toContain("public.admin_list_bake_timer_sound_theme_settings()");
    expect(migration).toContain("public.admin_update_bake_timer_sound_theme_settings");
    expect(migration).toContain("public.current_user_is_admin()");
    expect(migration).toContain("revoke all on table public.bake_timer_sound_theme_settings");
    expect(migration).not.toMatch(/star wars|darth|vader|voice clone|audio url|pizza_sessions|party_orders|storage\./i);
  });

  it("adds safe public, admin and Account API plumbing", () => {
    const publicRoute = source("app/api/bake-timer/sound-themes/route.ts");
    const adminRoute = source("app/api/admin/bake-timer-sounds/route.ts");
    const accountRoute = source("app/api/account/preferences/route.ts");
    const hook = source("lib/use-bake-timer.ts");
    const audio = source("lib/bake-timer-audio.ts");

    expect(publicRoute).toContain("get_bake_timer_sound_configuration");
    expect(publicRoute).toContain("defaultBakeTimerSoundSettingsResponse");
    expect(adminRoute).toContain("requireAdminRequest(request)");
    expect(adminRoute).toContain("admin_update_bake_timer_sound_theme_settings");
    expect(accountRoute).toContain("bakeTimerSoundTheme");
    expect(accountRoute).toContain("That Bake Timer sound theme is not available.");
    expect(hook).toContain("soundThemeId = CLASSIC_BAKE_TIMER_SOUND_THEME_ID");
    expect(hook).toContain("playBakeTimerCue({ audioRef: audio, enabled: soundEnabled, cue, themeId: soundThemeId })");
    expect(audio).toContain("getBakeTimerSoundPatternForTheme(cue, themeId)");
    expect(adminRoute).not.toMatch(/auth\.admin|service_role|pizza_sessions|party_orders|account_preferences/i);
  });
});
