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

function rhythmSignature(themeId: string, cue: Parameters<typeof getBakeTimerSoundPatternForTheme>[0]) {
  return getBakeTimerSoundPatternForTheme(cue, themeId)
    .map((tone) => `${tone.offset.toFixed(3)}:${tone.length.toFixed(3)}`)
    .join("|");
}

function noteSignature(themeId: string, cue: Parameters<typeof getBakeTimerSoundPatternForTheme>[0]) {
  return getBakeTimerSoundPatternForTheme(cue, themeId)
    .map((tone) => `${tone.type ?? "sine"}:${tone.frequency}`)
    .join("|");
}

function fullSequenceSignature(themeId: string) {
  return [
    "normal",
    "almost_there",
    "final_ten",
    "final_three",
    "expired",
    "overtime",
  ].map((cue) => `${cue}=${rhythmSignature(themeId, cue as Parameters<typeof getBakeTimerSoundPatternForTheme>[0])}/${noteSignature(themeId, cue as Parameters<typeof getBakeTimerSoundPatternForTheme>[0])}`).join(";");
}

describe("Bake Timer sound themes", () => {
  it("defines the approved registry and releases original novelty themes", () => {
    expect(BAKE_TIMER_SOUND_THEME_IDS).toEqual([
      "classic",
      "bell",
      "rooster",
      "halloween",
      "dark-commander",
      "robot-chef",
    ]);
    expect(DEFERRED_BAKE_TIMER_SOUND_THEME_IDS).toEqual([]);
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

    expect(response.enabledThemeIds).toEqual(["classic", "bell", "dark-commander"]);
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

  it("defines complete bounded nonverbal profiles for released novelty themes", () => {
    const protectedTerms = /star wars|darth|vader|jedi|sith|lightsaber|voice|speech|quote|movie|franchise|url|asset/i;

    for (const themeId of ["dark-commander", "robot-chef"] as const) {
      const definition = BAKE_TIMER_SOUND_THEME_DEFINITIONS.find((theme) => theme.id === themeId);
      expect(definition).toBeDefined();
      expect(`${definition?.label} ${definition?.description}`).not.toMatch(protectedTerms);
      expect(definition?.cueRoles).toEqual(BAKE_TIMER_SOUND_CUE_ROLES);

      for (const cue of ["normal", "almost_there", "final_ten_transition", "final_ten", "final_three", "expired", "overtime"] as const) {
        const pattern = getBakeTimerSoundPatternForTheme(cue, themeId);
        expect(pattern.length).toBeGreaterThan(0);
        for (const tone of pattern) {
          expect(tone.frequency).toBeGreaterThanOrEqual(160);
          expect(tone.frequency).toBeLessThanOrEqual(2_100);
          expect(tone.gain).toBeLessThanOrEqual(0.24);
          expect(tone.length).toBeLessThanOrEqual(0.5);
          expect(tone.offset).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("gives every released theme a distinct rhythm, note order and sequence shape", () => {
    const sequenceSignatures = BAKE_TIMER_SOUND_THEME_IDS.map((themeId) => fullSequenceSignature(themeId));
    expect(new Set(sequenceSignatures).size).toBe(BAKE_TIMER_SOUND_THEME_IDS.length);

    const finalTenRhythms = BAKE_TIMER_SOUND_THEME_IDS.map((themeId) => rhythmSignature(themeId, "final_ten"));
    const expiryRhythms = BAKE_TIMER_SOUND_THEME_IDS.map((themeId) => rhythmSignature(themeId, "expired"));
    const finalThreeNotes = BAKE_TIMER_SOUND_THEME_IDS.map((themeId) => noteSignature(themeId, "final_three"));

    expect(new Set(finalTenRhythms).size).toBe(BAKE_TIMER_SOUND_THEME_IDS.length);
    expect(new Set(expiryRhythms).size).toBe(BAKE_TIMER_SOUND_THEME_IDS.length);
    expect(new Set(finalThreeNotes).size).toBe(BAKE_TIMER_SOUND_THEME_IDS.length);
  });

  it("makes the individual sound identities materially different beyond frequency", () => {
    expect(getBakeTimerSoundPatternForTheme("normal", "classic")).toHaveLength(1);

    const bellNormal = getBakeTimerSoundPatternForTheme("normal", "bell");
    expect(bellNormal).toHaveLength(2);
    expect(bellNormal[0].length).toBeGreaterThan(0.3);
    expect(bellNormal[1].frequency).toBe(bellNormal[0].frequency * 2);

    const roosterNormal = getBakeTimerSoundPatternForTheme("normal", "rooster");
    expect(roosterNormal.map((tone) => tone.frequency)).toEqual([700, 920, 1_180]);
    expect(roosterNormal.map((tone) => tone.offset)).toEqual([0, 0.1, 0.22]);

    const halloweenFinalTen = getBakeTimerSoundPatternForTheme("final_ten", "halloween");
    expect(halloweenFinalTen.map((tone) => tone.frequency)).toEqual([370, 311, 247]);
    expect(halloweenFinalTen.map((tone) => tone.type)).toEqual(["triangle", "triangle", "sawtooth"]);
    expect(getBakeTimerSoundPatternForTheme("expired", "halloween")).toHaveLength(4);
    expect(getBakeTimerSoundPatternForTheme("expired", "halloween")[0].length).toBeGreaterThan(0.7);

    const commanderOvertime = getBakeTimerSoundPatternForTheme("overtime", "dark-commander");
    expect(commanderOvertime.map((tone) => tone.frequency)).toEqual([180, 540, 180, 540]);
    expect(commanderOvertime.map((tone) => tone.type)).toEqual(["square", "sawtooth", "square", "sawtooth"]);

    const robotFinalTen = getBakeTimerSoundPatternForTheme("final_ten", "robot-chef");
    expect(robotFinalTen).toHaveLength(4);
    expect(robotFinalTen.map((tone) => tone.frequency)).toEqual([900, 1_140, 1_440, 1_720]);
    expect(robotFinalTen.map((tone) => tone.type)).toEqual(["square", "triangle", "square", "triangle"]);
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

  it("adds a small Patch 446F migration for the released novelty sound IDs", () => {
    const migrationPath = "supabase/migrations/20260721140000_release_novelty_bake_timer_sound_themes.sql";
    expect(existsSync(join(process.cwd(), migrationPath))).toBe(true);
    const migration = source(migrationPath);

    expect(migration).toContain("account_preferences_bake_timer_sound_theme_check");
    expect(migration).toContain("bake_timer_sound_theme_settings_theme_id_check");
    expect(migration).toContain("'dark-commander'");
    expect(migration).toContain("'robot-chef'");
    expect(migration).toContain("admin_update_bake_timer_sound_theme_settings");
    expect(migration).toContain("allowed_theme_ids constant text[] := array['classic', 'bell', 'rooster', 'halloween', 'dark-commander', 'robot-chef']");
    expect(migration).not.toMatch(/star wars|darth|vader|voice clone|audio url|pizza_sessions|party_orders|storage\.|service_role/i);
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
