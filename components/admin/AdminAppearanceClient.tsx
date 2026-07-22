"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DoughToolsIcon } from "@/components/icons";
import {
  PUBLIC_THEME_DEFINITIONS,
  publicThemeDefinitionFor,
  type PublicThemeDefinition,
  type PublicThemeId,
  type ThemeCampaignSummary,
} from "@/lib/public-themes";

type AdminAppearanceClientProps = {
  initialActiveTheme: PublicThemeDefinition;
  initialCampaigns: ThemeCampaignSummary[];
};

type RequestState = {
  status: "idle" | "saving" | "success" | "error";
  message: string;
};

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "your browser timezone";
}

function localDateTimeValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function isoFromLocalDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function formatLocalDateTime(value: string | null) {
  if (!value) return "No end time";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: ThemeCampaignSummary["status"]) {
  return {
    active: "Active now",
    scheduled: "Scheduled",
    expired: "Expired",
    disabled: "Disabled",
  }[status];
}

function foundationLabel(theme: PublicThemeDefinition) {
  return theme.designStatus === "final" ? "Default design" : "Foundation design";
}

function ThemeMotifPreview({ themeId, themeName }: { themeId: PublicThemeId; themeName: string }) {
  return (
    <div className={`admin-theme-motif-preview admin-theme-motif-preview--${themeId}`} aria-label={`${themeName} motif preview`} role="img">
      {themeId === "default" ? (
        <span className="admin-theme-motif-preview__neutral" />
      ) : null}
      {themeId === "valentine" ? (
        <>
          <span className="admin-theme-motif-preview__heart" />
          <svg viewBox="0 0 120 42" focusable="false" aria-hidden="true">
            <path d="M10 30c26-17 57-25 94-22" />
            <path d="m96 8 16 6-15 10" />
          </svg>
        </>
      ) : null}
      {themeId === "easter" ? (
        <>
          <svg viewBox="0 0 70 88" focusable="false" aria-hidden="true">
            <path d="M35 80c20 0 31-13 31-33C66 25 50 4 35 4S4 25 4 47c0 20 11 33 31 33Z" />
            <path d="M14 36c8 5 15 5 23 0s15-5 25 0M13 51h44M19 64c6-5 13-5 20 0s13 5 20 0" />
          </svg>
          <span className="admin-theme-motif-preview__flower" />
        </>
      ) : null}
      {themeId === "summer" ? (
        <>
          <span className="admin-theme-motif-preview__sun" />
          <svg viewBox="0 0 86 86" focusable="false" aria-hidden="true">
            <path d="M40 80c3-25 2-47-4-67" />
            <path d="M36 18C23 8 12 5 3 8c12 8 23 13 34 15Z" />
            <path d="M39 22C25 24 14 30 6 40c14 0 25-6 33-18Z" />
            <path d="M40 20c11-12 23-18 38-19-8 13-21 20-38 19Z" />
            <path d="M42 25c16 3 29 10 39 23-16 0-29-8-39-23Z" />
          </svg>
        </>
      ) : null}
      {themeId === "harvest" ? (
        <>
          <svg viewBox="0 0 70 100" focusable="false" aria-hidden="true">
            <path d="M35 92V8" />
            <path d="M35 24C22 27 15 34 13 45c12-1 20-8 22-21ZM36 40c13 3 22 11 24 24-14-2-22-10-24-24ZM35 55c-14 3-23 11-26 24 14-1 23-9 26-24Z" />
          </svg>
          <span className="admin-theme-motif-preview__tomato" />
        </>
      ) : null}
      {themeId === "halloween" ? (
        <>
          <span className="admin-theme-motif-preview__moon" />
          <svg viewBox="0 0 90 46" focusable="false" aria-hidden="true">
            <path d="M45 23C37 12 25 7 8 7c5 5 6 12 3 20 12-6 23-3 34 7 11-10 22-13 34-7-3-8-2-15 3-20-17 0-29 5-37 16Z" />
          </svg>
        </>
      ) : null}
      {themeId === "christmas" ? (
        <>
          <svg viewBox="0 0 78 98" focusable="false" aria-hidden="true">
            <path d="M39 91V15" />
            <path d="M39 18 22 38h11L14 60h16L9 84M39 18l17 20H45l19 22H48l21 24" />
          </svg>
          <span className="admin-theme-motif-preview__star" />
        </>
      ) : null}
    </div>
  );
}

export default function AdminAppearanceClient({ initialActiveTheme, initialCampaigns }: AdminAppearanceClientProps) {
  const [activeTheme, setActiveTheme] = useState(initialActiveTheme);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [previewThemeId, setPreviewThemeId] = useState<PublicThemeId | null>(null);
  const [scheduleThemeId, setScheduleThemeId] = useState<PublicThemeId>("valentine");
  const [startValue, setStartValue] = useState(localDateTimeValue());
  const [endValue, setEndValue] = useState("");
  const [requestState, setRequestState] = useState<RequestState>({ status: "idle", message: "" });
  const timezone = useMemo(browserTimeZone, []);

  const nextScheduled = campaigns.find((campaign) => campaign.status === "scheduled") ?? null;
  const previewTheme = previewThemeId ? publicThemeDefinitionFor(previewThemeId) : null;

  async function refreshCampaigns() {
    const response = await fetch("/api/admin/themes", { method: "GET" });
    if (!response.ok) throw new Error("Theme campaigns could not be refreshed.");
    const payload = await response.json() as {
      campaigns?: ThemeCampaignSummary[];
      activeTheme?: PublicThemeDefinition;
    };
    setCampaigns(Array.isArray(payload.campaigns) ? payload.campaigns : []);
    if (payload.activeTheme) setActiveTheme(payload.activeTheme);
  }

  async function activateTheme(theme: PublicThemeDefinition) {
    const confirmed = window.confirm(
      theme.id === "default"
        ? "Return public DoughTools appearance to Default? Seasonal appearance will be removed."
        : `Activate ${theme.name} now? Public visitors will see this foundation theme.`,
    );
    if (!confirmed) return;

    setRequestState({ status: "saving", message: `Activating ${theme.name}...` });
    try {
      const response = theme.id === "default"
        ? await fetch("/api/admin/themes/activate-default", { method: "POST" })
        : await fetch("/api/admin/themes/activate-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId: theme.id,
          }),
        });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Theme could not be activated.");
      }

      await refreshCampaigns();
      setRequestState({ status: "success", message: `${theme.name} activation saved.` });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Theme could not be activated." });
    }
  }

  async function scheduleTheme(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startsAt = isoFromLocalDateTime(startValue);
    const endsAt = endValue ? isoFromLocalDateTime(endValue) : null;
    const theme = publicThemeDefinitionFor(scheduleThemeId);

    if (!startsAt || (endValue && !endsAt)) {
      setRequestState({ status: "error", message: "Choose valid schedule times." });
      return;
    }

    if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      setRequestState({ status: "error", message: "End time must be after the start time." });
      return;
    }

    const confirmed = window.confirm(
      `Schedule ${theme.name} for ${formatLocalDateTime(startsAt)}${endsAt ? ` until ${formatLocalDateTime(endsAt)}` : ""}?`,
    );
    if (!confirmed) return;

    setRequestState({ status: "saving", message: `Scheduling ${theme.name}...` });
    try {
      const response = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: theme.id, startsAt, endsAt }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Theme could not be scheduled.");
      }

      await refreshCampaigns();
      setRequestState({ status: "success", message: `${theme.name} schedule saved.` });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Theme could not be scheduled." });
    }
  }

  async function disableCampaign(campaign: ThemeCampaignSummary) {
    setRequestState({ status: "saving", message: "Updating campaign..." });
    try {
      const response = await fetch(`/api/admin/themes/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId: campaign.themeId,
          enabled: false,
          startsAt: campaign.startsAt,
          endsAt: campaign.endsAt,
          expectedVersion: campaign.version,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Campaign could not be disabled.");
      }
      await refreshCampaigns();
      setRequestState({ status: "success", message: "Campaign disabled." });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Campaign could not be disabled." });
    }
  }

  async function deleteCampaign(campaign: ThemeCampaignSummary) {
    const confirmed = window.confirm("Delete this scheduled campaign? Active campaigns should be disabled instead.");
    if (!confirmed) return;

    setRequestState({ status: "saving", message: "Deleting campaign..." });
    try {
      const response = await fetch(`/api/admin/themes/${campaign.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(payload.error ?? "Campaign could not be deleted.");
      }
      await refreshCampaigns();
      setRequestState({ status: "success", message: "Campaign deleted." });
    } catch (error) {
      setRequestState({ status: "error", message: error instanceof Error ? error.message : "Campaign could not be deleted." });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-ink/10 bg-white/86 p-5 shadow-card sm:p-7" aria-labelledby="appearance-summary-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Appearance</p>
        <h1 id="appearance-summary-heading" className="mt-3 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
          Seasonal appearance
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-ink/60 sm:text-base">
          Manage prebuilt public themes. These foundation designs are safe scheduling shells; detailed visuals can be refined later without changing the campaign system.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-ink/10 bg-cream/70 p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">Current public theme</p>
            <p className="mt-2 text-lg font-extrabold text-ink">{activeTheme.name}</p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink/58">{activeTheme.shortDescription}</p>
          </div>
          <div className="rounded-[1.5rem] border border-ink/10 bg-cream/70 p-4">
            <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">Next scheduled campaign</p>
            <p className="mt-2 text-lg font-extrabold text-ink">
              {nextScheduled ? publicThemeDefinitionFor(nextScheduled.themeId).name : "None scheduled"}
            </p>
            <p className="mt-1 text-sm font-bold leading-5 text-ink/58">
              {nextScheduled ? formatLocalDateTime(nextScheduled.startsAt) : "Default remains active unless a campaign is added."}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm font-bold text-ink/60">Times shown in {timezone}.</p>
        <div className="mt-4 min-h-6 text-sm font-extrabold" aria-live="polite">
          {requestState.message ? (
            <span className={requestState.status === "error" ? "text-tomato" : "text-forest"}>{requestState.message}</span>
          ) : null}
        </div>
      </section>

      {previewTheme ? (
        <section className="rounded-[1.75rem] border border-tomato/25 bg-tomato/[.07] p-4" aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Preview mode: {previewTheme.name}</p>
              <p className="mt-1 text-sm font-bold leading-5 text-ink/60">Preview is local to this Admin page and does not change public visitors.</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewThemeId(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              Exit preview
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Available public themes">
        {PUBLIC_THEME_DEFINITIONS.map((theme) => (
          <article key={theme.id} className="rounded-[1.75rem] border border-ink/10 bg-white/84 p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-extrabold uppercase tracking-[.18em] text-ink/45">{foundationLabel(theme)}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">{theme.name}</h2>
              </div>
              <DoughToolsIcon name={theme.id === "default" ? "success" : "experience-level"} size={24} />
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/60">{theme.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-stretch">
              <div className="flex gap-2" aria-label={`${theme.name} preview colors`}>
                {theme.previewSwatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="h-8 flex-1 rounded-full border border-ink/10"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <ThemeMotifPreview themeId={theme.id} themeName={theme.name} />
            </div>
            <p className="mt-4 rounded-2xl border border-ink/10 bg-cream/70 px-3 py-2 text-xs font-bold leading-5 text-ink/58">
              Visual details can be refined without changing the schedule.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPreviewThemeId(theme.id)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => activateTheme(theme)}
                disabled={requestState.status === "saving"}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
              >
                {theme.id === "default" ? "Activate Default" : "Activate now"}
              </button>
              {theme.id !== "default" ? (
                <button
                  type="button"
                  onClick={() => setScheduleThemeId(theme.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-cream px-4 text-sm font-extrabold text-ink transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  Schedule
                </button>
              ) : (
                <span className="hidden sm:block" aria-hidden />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/86 p-4 shadow-sm sm:p-5" aria-labelledby="schedule-theme-heading">
        <h2 id="schedule-theme-heading" className="font-display text-2xl font-semibold text-ink">Schedule a theme</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-ink/60">Times shown in {timezone}. They are saved as UTC timestamps.</p>
        <form onSubmit={scheduleTheme} className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-extrabold text-ink">
            Theme
            <select
              value={scheduleThemeId}
              onChange={(event) => setScheduleThemeId(event.target.value as PublicThemeId)}
              className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              {PUBLIC_THEME_DEFINITIONS.filter((theme) => theme.id !== "default").map((theme) => (
                <option key={theme.id} value={theme.id}>{theme.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-extrabold text-ink">
            Start
            <input
              type="datetime-local"
              value={startValue}
              onChange={(event) => setStartValue(event.target.value)}
              className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-extrabold text-ink">
            Optional end
            <input
              type="datetime-local"
              value={endValue}
              onChange={(event) => setEndValue(event.target.value)}
              className="min-h-12 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            />
          </label>
          <button
            type="submit"
            disabled={requestState.status === "saving"}
            className="inline-flex min-h-12 items-center justify-center self-end rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
          >
            Save schedule
          </button>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/86 p-4 shadow-sm sm:p-5" aria-labelledby="theme-campaign-list-heading">
        <h2 id="theme-campaign-list-heading" className="font-display text-2xl font-semibold text-ink">Campaign list</h2>
        <div className="mt-4 grid gap-3">
          {campaigns.length === 0 ? (
            <p className="rounded-2xl border border-ink/10 bg-cream/70 px-4 py-3 text-sm font-bold text-ink/60">
              No theme campaigns yet. Default is the public fallback.
            </p>
          ) : campaigns.map((campaign) => {
            const theme = publicThemeDefinitionFor(campaign.themeId);
            return (
              <article key={campaign.id} className="rounded-2xl border border-ink/10 bg-cream/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{statusLabel(campaign.status)}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-ink">{theme.name}</h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-ink/60">
                      Starts {formatLocalDateTime(campaign.startsAt)} · Ends {formatLocalDateTime(campaign.endsAt)} · Version {campaign.version}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => disableCampaign(campaign)}
                      disabled={!campaign.enabled || requestState.status === "saving"}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/25 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                    >
                      Disable
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCampaign(campaign)}
                      disabled={campaign.status === "active" || requestState.status === "saving"}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-tomato/20 bg-white px-4 text-sm font-extrabold text-tomato transition hover:border-tomato/40 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
