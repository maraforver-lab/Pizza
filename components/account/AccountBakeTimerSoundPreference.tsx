"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { closeBakeTimerAudioContext, playBakeTimerCue, type BakeTimerAudioEngine } from "@/lib/bake-timer-audio";
import { normalizeAccountPreferencesRow } from "@/lib/account-preferences";
import {
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";
import type { BakeTimerSoundSettingsResponse } from "@/lib/bake-timer-sound-settings";

type AccountBakeTimerSoundPreferenceProps = {
  className?: string;
};

type ThemeOption = BakeTimerSoundSettingsResponse["themes"][number];

type RequestState = {
  status: "idle" | "loading" | "saving" | "success" | "error" | "stale";
  message: string;
};

const DEFAULT_CHOICE = "default";
type SoundChoice = typeof DEFAULT_CHOICE | BakeTimerSoundThemeId;

const PREVIEW_CUES = [
  { cue: "normal", delaySeconds: 0 },
  { cue: "final_ten_transition", delaySeconds: 0.45 },
  { cue: "final_three", delaySeconds: 1 },
  { cue: "expired", delaySeconds: 1.55 },
] as const;

function themeLabel(themes: ThemeOption[], id: BakeTimerSoundThemeId) {
  return themes.find((theme) => theme.id === id)?.label ?? "Classic";
}

function choiceFromPreference(value: BakeTimerSoundThemeId | null, enabledThemeIds: BakeTimerSoundThemeId[]): SoundChoice {
  return value && enabledThemeIds.includes(value) ? value : DEFAULT_CHOICE;
}

export function AccountBakeTimerSoundPreference({ className = "" }: AccountBakeTimerSoundPreferenceProps) {
  const [ready, setReady] = useState(false);
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [enabledThemeIds, setEnabledThemeIds] = useState<BakeTimerSoundThemeId[]>([CLASSIC_BAKE_TIMER_SOUND_THEME_ID]);
  const [defaultThemeId, setDefaultThemeId] = useState<BakeTimerSoundThemeId>(CLASSIC_BAKE_TIMER_SOUND_THEME_ID);
  const [savedPreference, setSavedPreference] = useState<BakeTimerSoundThemeId | null>(null);
  const [draftChoice, setDraftChoice] = useState<SoundChoice>(DEFAULT_CHOICE);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [requestState, setRequestState] = useState<RequestState>({ status: "loading", message: "Loading Bake timer sound preference..." });
  const [previewChoice, setPreviewChoice] = useState<SoundChoice | null>(null);
  const audio = useRef<BakeTimerAudioEngine | null>(null);
  const previewStopTimeout = useRef<number | null>(null);
  const mounted = useRef(false);

  const enabledThemes = useMemo(
    () => themes.filter((theme) => enabledThemeIds.includes(theme.id)),
    [enabledThemeIds, themes],
  );
  const savedChoice = choiceFromPreference(savedPreference, enabledThemeIds);
  const hasChanges = draftChoice !== savedChoice;
  const disabledSavedPreference = savedPreference !== null && !enabledThemeIds.includes(savedPreference);
  const selectedLabel = draftChoice === DEFAULT_CHOICE ? "Use DoughTools default" : themeLabel(themes, draftChoice);
  const productDefaultLabel = themeLabel(themes, defaultThemeId);

  const stopPreview = useCallback(() => {
    if (previewStopTimeout.current !== null && typeof window !== "undefined") {
      window.clearTimeout(previewStopTimeout.current);
      previewStopTimeout.current = null;
    }
    closeBakeTimerAudioContext(audio);
    setPreviewChoice(null);
  }, []);

  useEffect(() => stopPreview, [stopPreview]);

  const applyPayload = useCallback((payload: unknown) => {
    const record = payload && typeof payload === "object" ? payload as {
      preferences?: unknown;
      bakeTimerSound?: Partial<BakeTimerSoundSettingsResponse>;
    } : {};
    const preferences = normalizeAccountPreferencesRow(record.preferences);
    const sound = record.bakeTimerSound;
    const nextThemes = Array.isArray(sound?.themes) ? sound.themes : [];
    const nextEnabled = Array.isArray(sound?.enabledThemeIds) && sound.enabledThemeIds.length > 0
      ? sound.enabledThemeIds
      : [CLASSIC_BAKE_TIMER_SOUND_THEME_ID];
    const nextDefault = typeof sound?.defaultThemeId === "string" && nextEnabled.includes(sound.defaultThemeId as BakeTimerSoundThemeId)
      ? sound.defaultThemeId as BakeTimerSoundThemeId
      : CLASSIC_BAKE_TIMER_SOUND_THEME_ID;

    setThemes(nextThemes);
    setEnabledThemeIds(nextEnabled as BakeTimerSoundThemeId[]);
    setDefaultThemeId(nextDefault);
    setSavedPreference(preferences.bakeTimerSoundTheme);
    setDraftChoice(choiceFromPreference(preferences.bakeTimerSoundTheme, nextEnabled as BakeTimerSoundThemeId[]));
    setUpdatedAt(preferences.updatedAt);
  }, []);

  const loadPreference = useCallback(async () => {
    setReady(false);
    setRequestState({ status: "loading", message: "Loading Bake timer sound preference..." });
    try {
      const response = await fetch("/api/account/preferences", { method: "GET" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load Bake timer sound preference.");
      if (!mounted.current) return;
      applyPayload(payload);
      setRequestState({ status: "idle", message: "" });
    } catch (caught) {
      if (!mounted.current) return;
      setThemes([]);
      setEnabledThemeIds([CLASSIC_BAKE_TIMER_SOUND_THEME_ID]);
      setDefaultThemeId(CLASSIC_BAKE_TIMER_SOUND_THEME_ID);
      setSavedPreference(null);
      setDraftChoice(DEFAULT_CHOICE);
      setUpdatedAt(undefined);
      setRequestState({ status: "error", message: caught instanceof Error ? caught.message : "Could not load Bake timer sound preference." });
    } finally {
      if (mounted.current) setReady(true);
    }
  }, [applyPayload]);

  useEffect(() => {
    mounted.current = true;
    void loadPreference();
    return () => {
      mounted.current = false;
      stopPreview();
    };
  }, [loadPreference, stopPreview]);

  function previewTheme(choice: SoundChoice) {
    const themeId = choice === DEFAULT_CHOICE ? defaultThemeId : choice;
    stopPreview();
    setPreviewChoice(choice);
    for (const preview of PREVIEW_CUES) {
      playBakeTimerCue({
        audioRef: audio,
        enabled: true,
        cue: preview.cue,
        themeId,
        delaySeconds: preview.delaySeconds,
      });
    }
    if (typeof window !== "undefined") {
      previewStopTimeout.current = window.setTimeout(() => {
        closeBakeTimerAudioContext(audio);
        setPreviewChoice(null);
        previewStopTimeout.current = null;
      }, 2_500);
    }
  }

  async function savePreference() {
    if (!ready || requestState.status === "saving") return;
    setRequestState({ status: "saving", message: "Saving Bake timer sound preference..." });
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bakeTimerSoundTheme: draftChoice === DEFAULT_CHOICE ? null : draftChoice,
          knownUpdatedAt: updatedAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 409 || payload.stale) {
        applyPayload(payload);
        setRequestState({
          status: "stale",
          message: payload.error || "Account preferences changed on another device. Latest settings were reloaded.",
        });
        return;
      }
      if (!response.ok) throw new Error(payload.error || "Could not save Bake timer sound preference.");
      applyPayload(payload);
      setRequestState({ status: "success", message: "Bake timer sound preference saved." });
    } catch (caught) {
      setRequestState({ status: "error", message: caught instanceof Error ? caught.message : "Could not save Bake timer sound preference." });
    }
  }

  return (
    <section
      className={`rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}
      aria-labelledby="bake-timer-sound-preference-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Bake Timer preference</p>
          <h2 id="bake-timer-sound-preference-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Bake timer sound
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Choose the sound used by newly opened timers. Each running timer can still be muted separately.
          </p>
        </div>
        <DoughToolsIcon name="sound-on" size={24} className="mt-1 shrink-0 text-tomato" aria-hidden="true" />
      </div>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-cream/65 p-3">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">Selected preference</p>
        <p className="mt-1 text-sm font-extrabold text-ink">{selectedLabel}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-ink/55">Current DoughTools default: {productDefaultLabel}</p>
      </div>

      {disabledSavedPreference ? (
        <p role="status" className="mt-3 rounded-2xl bg-oven-gold/[.14] px-3 py-2 text-xs font-extrabold leading-5 text-ink/65">
          Your saved sound theme is no longer available. New timers will use the DoughTools default until you choose another theme.
        </p>
      ) : null}

      <fieldset className="mt-4 space-y-3" disabled={!ready || requestState.status === "saving"} aria-describedby="bake-timer-sound-preference-status">
        <legend className="sr-only">Choose Bake timer sound preference</legend>
        <label className="block rounded-2xl border border-ink/10 bg-white p-3">
          <span className="flex items-start gap-3">
            <input
              type="radio"
              name="bake-timer-sound-theme"
              value={DEFAULT_CHOICE}
              checked={draftChoice === DEFAULT_CHOICE}
              onChange={() => setDraftChoice(DEFAULT_CHOICE)}
              className="mt-1 h-5 w-5 accent-tomato"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-ink">Use DoughTools default</span>
              <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">Currently {productDefaultLabel}. This follows the product default if it changes later.</span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => previewChoice === DEFAULT_CHOICE ? stopPreview() : previewTheme(DEFAULT_CHOICE)}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream px-3 text-xs font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            <DoughToolsIcon name={previewChoice === DEFAULT_CHOICE ? "sound-off" : "sound-on"} size={16} />
            {previewChoice === DEFAULT_CHOICE ? "Stop preview" : "Preview default"}
          </button>
        </label>

        {enabledThemes.map((theme) => (
          <label key={theme.id} className="block rounded-2xl border border-ink/10 bg-white p-3">
            <span className="flex items-start gap-3">
              <input
                type="radio"
                name="bake-timer-sound-theme"
                value={theme.id}
                checked={draftChoice === theme.id}
                onChange={() => setDraftChoice(theme.id)}
                className="mt-1 h-5 w-5 accent-tomato"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">{theme.label}</span>
                <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">{theme.description}</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => previewChoice === theme.id ? stopPreview() : previewTheme(theme.id)}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-cream px-3 text-xs font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              <DoughToolsIcon name={previewChoice === theme.id ? "sound-off" : "sound-on"} size={16} />
              {previewChoice === theme.id ? "Stop preview" : "Preview"}
            </button>
          </label>
        ))}
      </fieldset>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <p id="bake-timer-sound-preference-status" className="text-xs font-bold leading-5 text-ink/45" aria-live="polite">
          {requestState.message || (hasChanges ? "You have unsaved sound preference changes." : "Saved in your account. New timers use this preference.")}
        </p>
        <button
          type="button"
          onClick={() => void savePreference()}
          disabled={!ready || !hasChanges || requestState.status === "saving"}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {requestState.status === "saving" ? "Saving..." : "Save sound"}
        </button>
      </div>

      {requestState.status === "error" || requestState.status === "stale" ? (
        <p role="alert" className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold leading-5 text-tomato">
          {requestState.message}
        </p>
      ) : null}

      {requestState.status === "error" ? (
        <button
          type="button"
          onClick={() => void loadPreference()}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          Retry
        </button>
      ) : null}
    </section>
  );
}
