"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import { type PizzaSession, type PizzaSessionTimelineStep, pizzaSessionRecipeQuery } from "@/lib/pizza-session";
import {
  formatTimelinePlainText,
  generateAndSaveActivePizzaSessionTimeline,
  generatePizzaSessionTimeline,
  getNextTimelineStep,
  getTimelineNote,
  markPizzaSessionTimelineStepDone,
} from "@/lib/pizza-session-timeline";

function formatDateTime(value?: string) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: PizzaSessionTimelineStep["status"]) {
  if (status === "done") return "bg-leaf/10 text-leaf ring-leaf/20";
  if (status === "skipped") return "bg-ink/[.05] text-ink/45 ring-ink/10";
  return "bg-tomato/10 text-tomato ring-tomato/20";
}

export default function SessionTimelinePage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const { session: updatedSession, result } = generateAndSaveActivePizzaSessionTimeline();
    setSession(updatedSession ?? null);
    setMissingReason(result.ok ? null : result.missingReason ?? "unknown");
    setReady(true);
  }, []);

  const timelineResult = useMemo(() => generatePizzaSessionTimeline(session ?? undefined), [session]);
  const timeline = session?.timeline ?? timelineResult.timeline;
  const nextStep = getNextTimelineStep(timeline);
  const recipeQuery = session ? pizzaSessionRecipeQuery(session) : "";

  const markDone = (stepId: string) => {
    if (!session) return;
    const updated = markPizzaSessionTimelineStepDone(session, stepId);
    if (updated) setSession(updated);
  };

  const copySchedule = async () => {
    if (!session || !timeline || typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("Copy is not available in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(formatTimelinePlainText(session, timeline));
      setCopyMessage("Schedule copied as plain text.");
    } catch {
      setCopyMessage("Copy failed. You can still read the schedule here.");
    }
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading your local pizza timeline…
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none">No active session yet.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/60">
            Start a Pizza Session first. DoughTools will save the session locally in this browser on this device.
          </p>
          <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            Start Pizza Session →
          </Link>
        </div>
      </main>
    );
  }

  if (!timeline || missingReason) {
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Your pizza timeline</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none">Choose a target time first.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/60">
            A backward schedule needs a planned eating or baking time. Return to the session starter and set a target time.
          </p>
          <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} No reminders, cloud sync or account sync are active yet.
          </p>
          <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            Return to Start Pizza Session →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-5 rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#e8c98a]">Pizza Session timeline</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">Your pizza timeline</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              A practical backward schedule from your planned time. Timing is a guide, so adjust for your dough,
              room temperature and oven.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={session.experienceLevel} />
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                Target: {formatDateTime(timeline.targetEatTime ?? session.targetEatTime)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                Saved in this browser
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
            <button
              type="button"
              onClick={copySchedule}
              className="min-h-12 rounded-2xl bg-white px-5 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              Copy schedule
            </button>
            <Link
              href={recipeQuery ? `/plan?${recipeQuery}` : "/plan"}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              Open full Planner →
            </Link>
          </div>
        </header>

        {copyMessage && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status">
            {copyMessage}
          </p>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Next step</p>
            {nextStep ? (
              <>
                <h2 className="mt-2 font-display text-3xl font-semibold">{nextStep.label}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">{nextStep.description}</p>
                <p className="mt-3 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/65">
                  {getTimelineNote(nextStep, session.experienceLevel)}
                </p>
                {nextStep.quietHoursWarning && (
                  <p className="mt-3 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {nextStep.quietHoursWarning}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => markDone(nextStep.id)}
                  className="mt-4 min-h-12 w-full rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  Mark next step done
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-2 font-display text-3xl font-semibold">Timeline complete</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Nice. Add a journal note or save what worked after the bake.
                </p>
              </>
            )}
            <p className="mt-5 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, push notifications or email reminders are active yet.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/session/start" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Edit session choices
              </Link>
              <Link href="/" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open calculator
              </Link>
            </div>
          </aside>

          <section className="grid min-w-0 gap-3" aria-label="Pizza timeline steps">
            {timeline.steps.map((step, index) => (
              <article key={step.id} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/35">
                      Step {index + 1} · {formatDateTime(step.scheduledAt)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">{step.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">{step.description}</p>
                    <p className="mt-3 text-sm leading-6 text-ink/65">{getTimelineNote(step, session.experienceLevel)}</p>
                    {step.quietHoursWarning && (
                      <p className="mt-3 rounded-2xl bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">
                        Quiet-hours warning: {step.quietHoursWarning}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusClass(step.status)}`}>
                      Status: {step.status}
                    </span>
                    {step.status === "todo" && (
                      <button
                        type="button"
                        onClick={() => markDone(step.id)}
                        className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white/70 p-5">
          <h2 className="font-display text-2xl font-semibold">Timing assumptions</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/60">
            {(timeline.assumptions ?? []).map((assumption) => (
              <li key={assumption} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-10 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
