"use client";

import { useCallback, useRef, useState } from "react";
import {
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  isBakeTimerSoundThemeId,
  resolveEffectiveBakeTimerSoundTheme,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";
import type { BakeTimerSoundSettingsResponse } from "@/lib/bake-timer-sound-settings";

type SoundThemeResolution = {
  themeId: BakeTimerSoundThemeId;
  source: "account" | "product-default" | "classic-fallback";
};

export function effectiveBakeTimerSoundThemeFromAccountPayload(payload: unknown): SoundThemeResolution | null {
  const record = payload && typeof payload === "object" ? payload as {
    bakeTimerSound?: Partial<BakeTimerSoundSettingsResponse>;
  } : {};
  const sound = record.bakeTimerSound;
  if (isBakeTimerSoundThemeId(sound?.effectiveThemeId)) {
    return { themeId: sound.effectiveThemeId, source: "account" };
  }
  if (isBakeTimerSoundThemeId(sound?.defaultThemeId)) {
    return {
      themeId: resolveEffectiveBakeTimerSoundTheme({
        userPreference: undefined,
        configuration: {
          enabledThemeIds: Array.isArray(sound?.enabledThemeIds) ? sound.enabledThemeIds : [],
          defaultThemeId: sound.defaultThemeId,
        },
      }),
      source: "product-default",
    };
  }
  return null;
}

export function effectiveBakeTimerSoundThemeFromPublicPayload(payload: unknown): SoundThemeResolution | null {
  const sound = payload && typeof payload === "object" ? payload as Partial<BakeTimerSoundSettingsResponse> : {};
  if (!isBakeTimerSoundThemeId(sound.defaultThemeId)) return null;
  return {
    themeId: resolveEffectiveBakeTimerSoundTheme({
      userPreference: undefined,
      configuration: {
        enabledThemeIds: Array.isArray(sound.enabledThemeIds) ? sound.enabledThemeIds : [],
        defaultThemeId: sound.defaultThemeId,
      },
    }),
    source: "product-default",
  };
}

export function useBakeTimerSoundTheme() {
  const [lastResolution, setLastResolution] = useState<SoundThemeResolution>({
    themeId: CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
    source: "classic-fallback",
  });
  const inFlight = useRef<Promise<SoundThemeResolution> | null>(null);

  const resolveLatestSoundTheme = useCallback(async () => {
    if (inFlight.current) return inFlight.current;

    inFlight.current = (async (): Promise<SoundThemeResolution> => {
      try {
        const accountResponse = await fetch("/api/account/preferences", { method: "GET" });
        if (accountResponse.ok) {
          const accountPayload = await accountResponse.json().catch(() => ({}));
          const accountResolution = effectiveBakeTimerSoundThemeFromAccountPayload(accountPayload);
          if (accountResolution) return accountResolution;
        }
      } catch {
        // Fall through to public configuration.
      }

      try {
        const publicResponse = await fetch("/api/bake-timer/sound-themes", { method: "GET" });
        if (publicResponse.ok) {
          const publicPayload = await publicResponse.json().catch(() => ({}));
          const publicResolution = effectiveBakeTimerSoundThemeFromPublicPayload(publicPayload);
          if (publicResolution) return publicResolution;
        }
      } catch {
        // Fall through to Classic.
      }

      return { themeId: CLASSIC_BAKE_TIMER_SOUND_THEME_ID, source: "classic-fallback" };
    })();

    try {
      const resolution = await inFlight.current;
      setLastResolution(resolution);
      return resolution;
    } finally {
      inFlight.current = null;
    }
  }, []);

  return {
    lastResolution,
    resolveLatestSoundTheme,
  };
}
