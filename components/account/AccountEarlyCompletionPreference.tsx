"use client";

import { useEffect, useState } from "react";
import { normalizeAccountPreferencesRow } from "@/lib/account-preferences";

type AccountEarlyCompletionPreferenceProps = {
  className?: string;
};

export function AccountEarlyCompletionPreference({ className = "" }: AccountEarlyCompletionPreferenceProps) {
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allowEarly, setAllowEarly] = useState(false);
  const [confirmedAllowEarly, setConfirmedAllowEarly] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadPreferences() {
      setReady(false);
      setError("");
      setMessage("");
      try {
        const response = await fetch("/api/account/preferences", { method: "GET" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load account preferences.");
        const preferences = normalizeAccountPreferencesRow(payload.preferences);
        if (!mounted) return;
        setAllowEarly(preferences.allowEarlyTimedStepCompletion);
        setConfirmedAllowEarly(preferences.allowEarlyTimedStepCompletion);
        setUpdatedAt(preferences.updatedAt);
      } catch (caught) {
        if (!mounted) return;
        setAllowEarly(false);
        setConfirmedAllowEarly(false);
        setUpdatedAt(undefined);
        setError(caught instanceof Error ? caught.message : "Could not load account preferences.");
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  const savePreference = async (nextValue: boolean) => {
    if (saving || !ready) return;
    setAllowEarly(nextValue);
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowEarlyTimedStepCompletion: nextValue,
          knownUpdatedAt: updatedAt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const serverPreferences = normalizeAccountPreferencesRow(payload.preferences);
        setAllowEarly(serverPreferences.allowEarlyTimedStepCompletion);
        setConfirmedAllowEarly(serverPreferences.allowEarlyTimedStepCompletion);
        setUpdatedAt(serverPreferences.updatedAt);
        setError(payload.error || "Could not save account preferences.");
        return;
      }
      const preferences = normalizeAccountPreferencesRow(payload.preferences);
      setAllowEarly(preferences.allowEarlyTimedStepCompletion);
      setConfirmedAllowEarly(preferences.allowEarlyTimedStepCompletion);
      setUpdatedAt(preferences.updatedAt);
      setMessage("Preference saved.");
    } catch (caught) {
      setAllowEarly(confirmedAllowEarly);
      setError(caught instanceof Error ? caught.message : "Could not save account preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={`rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}
      aria-labelledby="early-completion-preference-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Kitchen preference</p>
          <h2 id="early-completion-preference-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Allow early completion of timed dough stages
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Allows you to continue before a dough rest or fermentation timer has finished. You will always be warned before continuing early.
          </p>
        </div>
        <label className="flex min-w-fit items-center gap-3 rounded-2xl border border-ink/10 bg-cream/65 px-3 py-2">
          <span className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/55">
            {allowEarly ? "On" : "Off"}
          </span>
          <input
            type="checkbox"
            checked={allowEarly}
            disabled={!ready || saving}
            onChange={(event) => savePreference(event.target.checked)}
            className="h-5 w-5 accent-tomato disabled:opacity-50"
            aria-describedby="early-completion-preference-status"
          />
        </label>
      </div>
      <p id="early-completion-preference-status" className="mt-4 text-xs font-bold leading-5 text-ink/45" aria-live="polite">
        {!ready ? "Loading preference…" : saving ? "Saving preference…" : message || "Saved in your account. Default is Off for new accounts."}
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold leading-5 text-tomato">
          {error}
        </p>
      )}
    </section>
  );
}
