import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  effectiveBakeTimerSoundThemeFromAccountPayload,
  effectiveBakeTimerSoundThemeFromPublicPayload,
} from "@/lib/use-bake-timer-sound-theme";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Bake Timer sound-theme runtime integration", () => {
  it("resolves signed-in Account preference before product default and Classic", () => {
    expect(effectiveBakeTimerSoundThemeFromAccountPayload({
      bakeTimerSound: {
        effectiveThemeId: "bell",
        enabledThemeIds: ["classic", "bell"],
        defaultThemeId: "classic",
      },
    })).toEqual({ themeId: "bell", source: "account" });

    expect(effectiveBakeTimerSoundThemeFromAccountPayload({
      bakeTimerSound: {
        enabledThemeIds: ["classic", "halloween"],
        defaultThemeId: "halloween",
      },
    })).toEqual({ themeId: "halloween", source: "product-default" });

    expect(effectiveBakeTimerSoundThemeFromAccountPayload({
      bakeTimerSound: {
        enabledThemeIds: [],
        defaultThemeId: "unknown",
      },
    })).toBeNull();
  });

  it("resolves signed-out public configuration to product default with Classic fallback", () => {
    expect(effectiveBakeTimerSoundThemeFromPublicPayload({
      enabledThemeIds: ["classic", "rooster"],
      defaultThemeId: "rooster",
    })).toEqual({ themeId: "rooster", source: "product-default" });

    expect(effectiveBakeTimerSoundThemeFromPublicPayload({
      enabledThemeIds: ["classic"],
      defaultThemeId: "halloween",
    })).toEqual({ themeId: "classic", source: "product-default" });

    expect(effectiveBakeTimerSoundThemeFromPublicPayload({ defaultThemeId: "missing" })).toBeNull();
  });

  it("snapshots the effective theme when the shared timer opens", () => {
    const panel = source("components/session/KitchenBakeTimerPanel.tsx");
    const hook = source("lib/use-bake-timer-sound-theme.ts");

    expect(panel).toContain("const [activeSoundThemeId");
    expect(panel).toContain("resolveLatestSoundTheme");
    expect(panel).toContain("setActiveSoundThemeId(resolution.themeId)");
    expect(panel).toContain("soundThemeId: activeSoundThemeId");
    expect(panel).toContain("openTimer");
    expect(panel).toContain("Start next pizza");
    expect(hook).toContain('fetch("/api/account/preferences"');
    expect(hook).toContain('fetch("/api/bake-timer/sound-themes"');
    expect(hook).toContain("CLASSIC_BAKE_TIMER_SOUND_THEME_ID");
  });

  it("keeps Kitchen and standalone wrappers on the same shared panel without new session writes", () => {
    const panel = source("components/session/KitchenBakeTimerPanel.tsx");
    const standalone = source("components/tools/StandaloneBakeTimerTool.tsx");
    const kitchen = source("app/session/kitchen/page.tsx");

    expect(panel).toContain("export function BakeTimerPanel");
    expect(panel).toContain("export function KitchenBakeTimerPanel");
    expect(standalone).toContain("BakeTimerPanel");
    expect(kitchen).toContain("KitchenBakeTimerPanel");
    expect(panel).not.toMatch(/queueCloudActivePizzaSessionSave|completeKitchenTimelineStep|stepRuntime|setSession\(/);
    expect(standalone).not.toMatch(/queueCloudActivePizzaSessionSave|stepRuntime|fetch\(|setActivePizzaSession|getActivePizzaSession/);
  });

  it("routes every cue through the theme-aware shared audio helper without changing timing helpers", () => {
    const timerHook = source("lib/use-bake-timer.ts");
    const audio = source("lib/bake-timer-audio.ts");
    const timer = source("lib/bake-timer.ts");

    expect(timerHook).toContain("soundThemeId = CLASSIC_BAKE_TIMER_SOUND_THEME_ID");
    expect(timerHook).toContain("playBakeTimerCue({ audioRef: audio, enabled: soundEnabled, cue, themeId: soundThemeId })");
    expect(audio).toContain("getBakeTimerSoundPatternForTheme(cue, themeId)");
    expect(timer).toContain("getBakeTimerSoundCues");
    expect(timer).toContain("previousRemainingSeconds");
    expect(timerHook).toContain('if (cue === "overtime") continue');
    expect(timerHook).toContain("overtimeAlarmInterval");
  });

  it("documents runtime resolution, snapshot behavior and local-only cleanup", () => {
    const doc = source("docs/audits/patch-446b-sound-theme-foundation.md");

    expect(doc).toContain("Patch 446E Runtime Integration");
    expect(doc).toContain("The selected theme is snapshotted for the open timer");
    expect(doc).toContain("A newly reopened timer resolves the latest Account preference");
    expect(doc).toContain("Runtime mute remains separate");
    expect(doc).toContain("does not update Account preferences");
  });
});
