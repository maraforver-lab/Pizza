import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BAKE_TIMER_SOUND_THEME_DEFINITIONS,
  DEFERRED_BAKE_TIMER_SOUND_THEME_IDS,
} from "@/lib/bake-timer-sound-themes";
import { parseBakeTimerSoundSettingsPayload } from "@/lib/bake-timer-sound-settings";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Admin Bake Timer sound-theme management", () => {
  it("adds a protected Admin route and dashboard link", () => {
    const pagePath = "app/admin/bake-timer-sounds/page.tsx";
    expect(existsSync(join(process.cwd(), pagePath))).toBe(true);

    const page = source(pagePath);
    const layout = source("app/admin/layout.tsx");
    const dashboard = source("app/admin/page.tsx");

    expect(layout).toContain("await requireAdmin()");
    expect(page).toContain("await requireAdmin()");
    expect(page).toContain("admin_list_bake_timer_sound_theme_settings");
    expect(page).toContain("AdminBakeTimerSoundsClient");
    expect(dashboard).toContain("/admin/bake-timer-sounds");
    expect(dashboard).toContain("Open sound settings");
  });

  it("manages only production sound themes in canonical registry order", () => {
    const component = source("components/admin/AdminBakeTimerSoundsClient.tsx");

    expect(BAKE_TIMER_SOUND_THEME_DEFINITIONS.map((theme) => theme.label)).toEqual([
      "Classic",
      "Bell",
      "Rooster",
      "Halloween",
    ]);
    for (const deferred of DEFERRED_BAKE_TIMER_SOUND_THEME_IDS) {
      expect(component).not.toContain(deferred);
    }
    expect(component).toContain("BAKE_TIMER_SOUND_THEME_DEFINITIONS.map");
    expect(component).toContain("Classic is always retained as the safe fallback.");
  });

  it("prevents zero enabled themes, preserves Classic fallback and defaults only to enabled themes", () => {
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: [],
      defaultThemeId: "classic",
      expectedVersion: 1,
    })).toMatchObject({ ok: false });
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: ["bell"],
      defaultThemeId: "bell",
      expectedVersion: 1,
    })).toMatchObject({ ok: false });
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: ["classic"],
      defaultThemeId: "bell",
      expectedVersion: 1,
    })).toMatchObject({ ok: false });
    expect(parseBakeTimerSoundSettingsPayload({
      enabledThemeIds: ["classic", "bell"],
      defaultThemeId: "bell",
      expectedVersion: 1,
    })).toMatchObject({ ok: true });

    const component = source("components/admin/AdminBakeTimerSoundsClient.tsx");
    expect(component).toContain("themeId === CLASSIC_BAKE_TIMER_SOUND_THEME_ID && currentlyEnabled");
    expect(component).toContain("disabled={!enabled || productDefault}");
    expect(component).toContain("At least one Bake Timer sound theme must remain enabled.");
    expect(component).toContain("Choose an enabled theme as the product default.");
  });

  it("uses the shared audio abstraction for preview and cleans it up", () => {
    const component = source("components/admin/AdminBakeTimerSoundsClient.tsx");

    expect(component).toContain("playBakeTimerCue");
    expect(component).toContain("closeBakeTimerAudioContext");
    expect(component).toContain("PREVIEW_CUES");
    expect(component).toContain("Stop preview");
    expect(component).toContain("stopPreview()");
    expect(component).toContain("useEffect(() => stopPreview, [stopPreview])");
    expect(component).not.toMatch(/new AudioContext|getBakeTimerSoundPatternForTheme|localStorage|PizzaSession|stepRuntime/);
  });

  it("saves through the Admin API with optimistic concurrency and reloads stale settings", () => {
    const component = source("components/admin/AdminBakeTimerSoundsClient.tsx");
    const api = source("app/api/admin/bake-timer-sounds/route.ts");

    expect(component).toContain('fetch("/api/admin/bake-timer-sounds"');
    expect(component).toContain("expectedVersion: savedSettings.version");
    expect(component).toContain("response.status === 409");
    expect(component).toContain("await refreshSettings()");
    expect(component).toContain("You have unsaved sound-theme changes.");
    expect(api).toContain("requireAdminRequest(request)");
    expect(api).toContain("admin_update_bake_timer_sound_theme_settings");
  });

  it("keeps the page compact and avoids private-user data exposure", () => {
    const component = source("components/admin/AdminBakeTimerSoundsClient.tsx");
    const page = source("app/admin/bake-timer-sounds/page.tsx");
    const doc = source("docs/audits/patch-446c-admin-sound-theme-management.md");

    expect(component).toContain("grid gap-4 lg:grid-cols-2");
    expect(component).not.toMatch(/<table|overflow-x|admin UUID|database field|updated_by/i);
    expect(page).not.toMatch(/pizza_sessions|party_orders|account_preferences|auth\.admin|storage\./i);
    expect(doc).toContain("Patch 446D can add Account UI");
  });
});
