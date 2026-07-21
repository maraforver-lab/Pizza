"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { closeBakeTimerAudioContext, playBakeTimerCue, type BakeTimerAudioEngine } from "@/lib/bake-timer-audio";
import {
  BAKE_TIMER_SOUND_THEME_DEFINITIONS,
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";
import type { BakeTimerSoundSettingsResponse } from "@/lib/bake-timer-sound-settings";

type RequestState = {
  status: "idle" | "loading" | "saving" | "success" | "error" | "stale";
  message: string;
};

type EditableSettings = {
  enabledThemeIds: BakeTimerSoundThemeId[];
  defaultThemeId: BakeTimerSoundThemeId;
  version: number;
};

type AdminBakeTimerSoundsClientProps = {
  initialSettings: BakeTimerSoundSettingsResponse;
};

const PREVIEW_CUES = [
  { cue: "normal", delaySeconds: 0 },
  { cue: "final_ten_transition", delaySeconds: 0.45 },
  { cue: "final_three", delaySeconds: 1 },
  { cue: "expired", delaySeconds: 1.55 },
] as const;

function settingsFromResponse(response: BakeTimerSoundSettingsResponse): EditableSettings {
  return {
    enabledThemeIds: response.enabledThemeIds,
    defaultThemeId: response.defaultThemeId,
    version: response.version,
  };
}

function isEnabled(settings: EditableSettings, id: BakeTimerSoundThemeId) {
  return settings.enabledThemeIds.includes(id);
}

function sortedEnabled(ids: BakeTimerSoundThemeId[]) {
  return BAKE_TIMER_SOUND_THEME_DEFINITIONS
    .map((theme) => theme.id)
    .filter((id) => ids.includes(id));
}

export default function AdminBakeTimerSoundsClient({ initialSettings }: AdminBakeTimerSoundsClientProps) {
  const [savedSettings, setSavedSettings] = useState<EditableSettings>(() => settingsFromResponse(initialSettings));
  const [draftSettings, setDraftSettings] = useState<EditableSettings>(() => settingsFromResponse(initialSettings));
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle", message: "" });
  const [previewThemeId, setPreviewThemeId] = useState<BakeTimerSoundThemeId | null>(null);
  const audio = useRef<BakeTimerAudioEngine | null>(null);
  const previewStopTimeout = useRef<number | null>(null);

  const hasChanges = useMemo(() => (
    draftSettings.defaultThemeId !== savedSettings.defaultThemeId
    || draftSettings.enabledThemeIds.join("|") !== savedSettings.enabledThemeIds.join("|")
  ), [draftSettings, savedSettings]);

  const currentDefault = BAKE_TIMER_SOUND_THEME_DEFINITIONS.find((theme) => theme.id === savedSettings.defaultThemeId);

  const stopPreview = useCallback(() => {
    if (previewStopTimeout.current !== null && typeof window !== "undefined") {
      window.clearTimeout(previewStopTimeout.current);
      previewStopTimeout.current = null;
    }
    closeBakeTimerAudioContext(audio);
    setPreviewThemeId(null);
  }, []);

  useEffect(() => stopPreview, [stopPreview]);

  async function refreshSettings() {
    setRequestState({ status: "loading", message: "Loading latest Bake Timer sound settings..." });
    try {
      const response = await fetch("/api/admin/bake-timer-sounds", { method: "GET" });
      const payload = await response.json().catch(() => ({})) as Partial<BakeTimerSoundSettingsResponse> & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Bake Timer sound settings could not be loaded.");
      const next = settingsFromResponse(payload as BakeTimerSoundSettingsResponse);
      setSavedSettings(next);
      setDraftSettings(next);
      setRequestState({ status: "success", message: "Latest Bake Timer sound settings loaded." });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Bake Timer sound settings could not be loaded." });
    }
  }

  function toggleTheme(themeId: BakeTimerSoundThemeId) {
    setRequestState({ status: "idle", message: "" });
    setDraftSettings((current) => {
      const currentlyEnabled = isEnabled(current, themeId);
      if (themeId === CLASSIC_BAKE_TIMER_SOUND_THEME_ID && currentlyEnabled) return current;

      const enabledThemeIds = currentlyEnabled
        ? current.enabledThemeIds.filter((id) => id !== themeId)
        : sortedEnabled([...current.enabledThemeIds, themeId]);

      if (enabledThemeIds.length === 0) return current;
      const defaultThemeId = enabledThemeIds.includes(current.defaultThemeId)
        ? current.defaultThemeId
        : CLASSIC_BAKE_TIMER_SOUND_THEME_ID;

      return {
        ...current,
        enabledThemeIds,
        defaultThemeId,
      };
    });
  }

  function setDefault(themeId: BakeTimerSoundThemeId) {
    if (!isEnabled(draftSettings, themeId)) return;
    setRequestState({ status: "idle", message: "" });
    setDraftSettings((current) => ({ ...current, defaultThemeId: themeId }));
  }

  function previewTheme(themeId: BakeTimerSoundThemeId) {
    stopPreview();
    setPreviewThemeId(themeId);
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
        setPreviewThemeId(null);
        previewStopTimeout.current = null;
      }, 2_500);
    }
  }

  async function saveSettings() {
    if (draftSettings.enabledThemeIds.length === 0) {
      setRequestState({ status: "error", message: "At least one Bake Timer sound theme must remain enabled." });
      return;
    }
    if (!draftSettings.enabledThemeIds.includes(CLASSIC_BAKE_TIMER_SOUND_THEME_ID)) {
      setRequestState({ status: "error", message: "Classic must remain enabled as the safe fallback." });
      return;
    }
    if (!draftSettings.enabledThemeIds.includes(draftSettings.defaultThemeId)) {
      setRequestState({ status: "error", message: "Choose an enabled theme as the product default." });
      return;
    }

    setRequestState({ status: "saving", message: "Saving Bake Timer sound settings..." });
    try {
      const response = await fetch("/api/admin/bake-timer-sounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabledThemeIds: draftSettings.enabledThemeIds,
          defaultThemeId: draftSettings.defaultThemeId,
          expectedVersion: savedSettings.version,
        }),
      });
      const payload = await response.json().catch(() => ({})) as Partial<BakeTimerSoundSettingsResponse> & {
        error?: string;
        stale?: boolean;
      };

      if (response.status === 409 || payload.stale) {
        setRequestState({
          status: "stale",
          message: payload.error ?? "Bake Timer sound settings changed on another device. Reload latest settings before saving again.",
        });
        await refreshSettings();
        return;
      }

      if (!response.ok) throw new Error(payload.error ?? "Bake Timer sound settings could not be saved.");

      const next = settingsFromResponse(payload as BakeTimerSoundSettingsResponse);
      setSavedSettings(next);
      setDraftSettings(next);
      setRequestState({ status: "success", message: "Bake Timer sound settings saved." });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Bake Timer sound settings could not be saved." });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-ink/10 bg-white/86 p-5 shadow-card sm:p-7" aria-labelledby="sound-admin-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Bake Timer sounds</p>
        <h1 id="sound-admin-heading" className="mt-3 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
          Sound-theme management
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-ink/60 sm:text-base">
          Choose which prebuilt Bake Timer sound themes are available and which enabled theme is the product default.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-ink/10 bg-cream/70 p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">Current product default</p>
            <p className="mt-2 text-lg font-extrabold text-ink">{currentDefault?.label ?? "Classic"}</p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink/58">Version {savedSettings.version}</p>
          </div>
          <div className="rounded-[1.5rem] border border-ink/10 bg-cream/70 p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">Available themes</p>
            <p className="mt-2 text-lg font-extrabold text-ink">{savedSettings.enabledThemeIds.length} enabled</p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink/58">Classic is always retained as the safe fallback.</p>
          </div>
        </div>
        <div className="mt-4 min-h-6 text-sm font-extrabold" aria-live="polite">
          {requestState.message ? (
            <span className={requestState.status === "error" || requestState.status === "stale" ? "text-tomato" : "text-forest"}>
              {requestState.message}
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Production Bake Timer sound themes">
        {BAKE_TIMER_SOUND_THEME_DEFINITIONS.map((theme) => {
          const enabled = isEnabled(draftSettings, theme.id);
          const productDefault = draftSettings.defaultThemeId === theme.id;
          const previewing = previewThemeId === theme.id;
          const classic = theme.id === CLASSIC_BAKE_TIMER_SOUND_THEME_ID;

          return (
            <article key={theme.id} className="rounded-[1.75rem] border border-ink/10 bg-white/84 p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">
                    {enabled ? "Enabled" : "Disabled"}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{theme.label}</h2>
                </div>
                <DoughToolsIcon name={productDefault ? "sound-on" : "timer"} size={24} />
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-ink/60">{theme.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${enabled ? "bg-leaf/[.12] text-forest" : "bg-ink/[.06] text-ink/50"}`}>
                  {enabled ? "Enabled" : "Disabled"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${productDefault ? "bg-tomato/[.12] text-tomato" : "bg-ink/[.06] text-ink/50"}`}>
                  {productDefault ? "Product default" : "Not default"}
                </span>
                {classic ? (
                  <span className="rounded-full bg-oven-gold/[.14] px-3 py-1 text-xs font-extrabold text-ink/65">
                    Safe fallback
                  </span>
                ) : null}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => toggleTheme(theme.id)}
                  disabled={classic && enabled}
                  aria-pressed={enabled}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/25 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {enabled ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => setDefault(theme.id)}
                  disabled={!enabled || productDefault}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-cream px-4 text-sm font-extrabold text-ink transition hover:border-tomato/25 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  Set default
                </button>
                <button
                  type="button"
                  onClick={() => previewing ? stopPreview() : previewTheme(theme.id)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
                >
                  <DoughToolsIcon name={previewing ? "sound-off" : "sound-on"} size={20} />
                  {previewing ? "Stop preview" : "Preview"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/86 p-4 shadow-sm sm:p-5" aria-labelledby="save-sound-settings-heading">
        <h2 id="save-sound-settings-heading" className="font-display text-2xl font-semibold text-ink">Save changes</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
          Saving uses the current settings version. If another admin changes these settings first, reload the latest version before saving again.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <p className="text-sm font-extrabold text-ink/60">
            {hasChanges ? "You have unsaved sound-theme changes." : "No unsaved sound-theme changes."}
          </p>
          <button
            type="button"
            onClick={() => void refreshSettings()}
            disabled={requestState.status === "loading" || requestState.status === "saving"}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/25 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Reload latest
          </button>
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={!hasChanges || requestState.status === "saving" || requestState.status === "loading"}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
          >
            {requestState.status === "saving" ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
