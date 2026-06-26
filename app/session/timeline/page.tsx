"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import { type PizzaSession, type PizzaSessionTimelineStep } from "@/lib/pizza-session";
import { getPizzaSessionPreset } from "@/lib/pizza-session-presets";
import {
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDateTime(value?: string) {
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

function statusClass(status: "next" | "target" | PizzaSessionTimelineStep["status"]) {
  if (status === "next") return "bg-leaf/10 text-leaf ring-leaf/20";
  if (status === "target") return "bg-tomato/10 text-tomato ring-tomato/20";
  if (status === "done") return "bg-leaf/10 text-leaf ring-leaf/20";
  if (status === "skipped") return "bg-ink/[.05] text-ink/45 ring-ink/10";
  return "bg-cream text-ink/55 ring-ink/10";
}

function isDoughTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  return [
    "mix-dough",
    "rest-dough",
    "cold-ferment",
    "ball-dough",
    "room-temperature-rest",
  ].includes(step.id);
}

function isServiceTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  return [
    "preheat-oven",
    "prepare-sauce-toppings",
    "bake-pizza",
    "review-result",
  ].includes(step.id);
}

function statusLabel(step: PizzaSessionTimelineStep, nextStep?: PizzaSessionTimelineStep) {
  if (step.id === nextStep?.id) return "Next";
  if (step.status === "done") return "Done";
  if (step.status === "skipped") return "Skipped";
  if (step.id === "bake-pizza") return "Target time";
  return "Upcoming";
}

function relativeFromTarget(stepTime?: string, targetTime?: string) {
  if (!stepTime || !targetTime) return "Timing guide";
  const step = new Date(stepTime);
  const target = new Date(targetTime);
  if (!Number.isFinite(step.getTime()) || !Number.isFinite(target.getTime())) return "Timing guide";
  const diffMinutes = Math.round((step.getTime() - target.getTime()) / 60_000);
  if (diffMinutes === 0) return "Target time";
  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const parts = [
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : "",
  ].filter(Boolean).join(" ");
  return `${parts || "0m"} ${diffMinutes < 0 ? "before" : "after"} target`;
}

function flourLabel(value?: string) {
  if (value === "caputo-pizzeria" || value === "tipo-00") return "Caputo Pizzeria";
  if (value === "caputo-cuoco" || value === "bread") return "Strong bread flour";
  if (value === "caputo-classica" || value === "plain") return "All-purpose flour";
  return value ?? "Not set";
}

function formatPercent(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `${value} %` : "Not set";
}

function formatBallWeight(session: PizzaSession) {
  return typeof session.recipeSnapshot?.ballWeight === "number"
    ? `${session.recipeSnapshot.ballWeight} g`
    : "Not set";
}

function formatYeastType(session: PizzaSession) {
  return session.recipeSnapshot?.yeastType?.toUpperCase() ?? "Not set";
}

type ShoppingCheckpointState = "Upcoming" | "Next" | "Done";

function shoppingCheckpointState(session: PizzaSession | null, nextStep?: PizzaSessionTimelineStep): ShoppingCheckpointState {
  if (session?.shoppingList) return "Done";
  if (isDoughTimelineStep(nextStep)) return "Upcoming";
  if (isServiceTimelineStep(nextStep) || !nextStep) return "Next";
  return "Upcoming";
}

function ShoppingCheckpointCard({
  checkpointState,
  shoppingIsNext,
}: {
  checkpointState: ShoppingCheckpointState;
  shoppingIsNext: boolean;
}) {
  return (
    <article
      id="shopping-checkpoint"
      className={`rounded-[1.5rem] border p-5 shadow-sm ${
        shoppingIsNext
          ? "border-leaf/40 bg-leaf/[.12]"
          : "border-leaf/30 bg-leaf/[.08]"
      }`}
      aria-label="Shopping checkpoint"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">
            Shopping checkpoint
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Get pizza ingredients</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">Check sauce, cheese and toppings before baking.</p>
          <p className="mt-3 text-sm leading-6 text-ink/65">You can do this while the dough is resting or fermenting.</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${checkpointState === "Done" || shoppingIsNext ? "bg-leaf/10 text-leaf ring-leaf/20" : "bg-white text-ink/55 ring-ink/10"}`}>
            {checkpointState}
          </span>
          <Link
            href="/session/shopping"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Open shopping list →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function SessionTimelinePage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);

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
  const targetTime = timeline?.targetEatTime ?? session?.targetEatTime ?? session?.targetBakeTime;
  const allStepsComplete = Boolean(timeline?.steps.length) && timeline?.steps.every((step) => step.status === "done");
  const preset = session ? getPizzaSessionPreset(session.pizzaPreset) : undefined;
  const checkpointState = shoppingCheckpointState(session, nextStep);
  const shoppingIsNext = checkpointState === "Next";
  const firstServiceStepIndex = timeline?.steps.findIndex(isServiceTimelineStep) ?? -1;
  const shoppingCheckpointInsertIndex = timeline
    ? firstServiceStepIndex >= 0
      ? firstServiceStepIndex
      : timeline.steps.length
    : -1;

  const markDone = (stepId: string) => {
    if (!session) return;
    const updated = markPizzaSessionTimelineStepDone(session, stepId);
    if (updated) setSession(updated);
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
        <section
          aria-labelledby="session-timeline-heading"
          className="grid gap-5 rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#e8c98a]">Pizza Session timeline</p>
            <h1 id="session-timeline-heading" className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">Your pizza timeline</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              A practical backwards schedule from your target time. Follow the steps in order and adjust as needed
              for your dough, room temperature and oven.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={session.experienceLevel} />
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                Target: {formatDateTime(targetTime)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                Saved in this browser
              </span>
            </div>
          </div>
          <div className="grid gap-3 lg:min-w-80">
            <div className="rounded-3xl bg-white/95 p-5 text-ink shadow-sm">
              {shoppingIsNext ? (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Next step</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Next step: Get pizza ingredients</h2>
                  <p className="mt-1 text-sm font-extrabold text-ink/55">Check sauce, cheese and toppings before baking.</p>
                </>
              ) : nextStep ? (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Next step</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">Next step: {nextStep.label}</h2>
                  <p className="mt-1 text-sm font-extrabold text-ink/55">{formatShortDateTime(nextStep.scheduledAt)}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Ready</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{allStepsComplete ? "Timeline complete" : "Ready to bake"}</h2>
                  <p className="mt-1 text-sm font-extrabold text-ink/55">You’re ready for the next part of the session.</p>
                </>
              )}
            </div>
            <Link
              href={shoppingIsNext ? "/session/shopping" : "/session/kitchen"}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-leaf px-5 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              {shoppingIsNext ? "Open shopping list →" : "Open Kitchen Mode →"}
            </Link>
            <Link
              href="/session/recipe"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              Review dough plan →
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Session summary</p>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ["Pizza preset", preset?.name ?? "Not set"],
                ["Target time", formatDateTime(targetTime)],
                ["Pizza count", session.recipeSnapshot?.balls ? `${session.recipeSnapshot.balls} pizzas` : session.pizzaCount ? `${session.pizzaCount} pizzas` : "Not set"],
                ["Ball weight", formatBallWeight(session)],
                ["Flour", flourLabel(session.recipeSnapshot?.flour ?? session.flour)],
                ["Hydration", formatPercent(session.recipeSnapshot?.hydration)],
                ["Fermentation", session.recipeSnapshot?.fermentation ?? "Not set"],
                ["Yeast type", formatYeastType(session)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                  <dd className="mt-1 font-extrabold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 rounded-2xl bg-leaf/10 p-4">
              <h2 className="text-sm font-extrabold text-leaf">How this timeline works</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                This is a backwards schedule from your target time. Do each step in order. Timing is a guide, not a rule.
                Adjust for your dough, room temperature and oven.
              </p>
            </div>
            <p className="mt-5 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, push notifications or email reminders are active yet.
            </p>
             <div className="mt-4 grid gap-2">
               <Link href="/session/start" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                 Edit session choices
               </Link>
               <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                 <a href="#shopping-checkpoint" className="rounded-2xl border border-leaf/20 bg-leaf/[.08] px-4 py-3 text-center text-xs font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                   Shopping checkpoint
                 </a>
                 <Link href="/session/shopping" className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-center text-xs font-extrabold text-ink/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                   Shopping list
                 </Link>
                 <Link href="/session/review" className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-center text-xs font-extrabold text-ink/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                   Review session
                 </Link>
               </div>
             </div>
           </aside>

          <section className="grid min-w-0 gap-3" aria-label="Pizza timeline steps">
            {timeline.steps.map((step, index) => (
              <div key={step.id} className="grid gap-3">
                {index === shoppingCheckpointInsertIndex && (
                  <ShoppingCheckpointCard checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />
                )}
                <article
                  className={`rounded-[1.5rem] border p-5 shadow-sm ${
                    step.id === nextStep?.id && !shoppingIsNext
                      ? "border-leaf/30 bg-leaf/[.08]"
                      : step.id === "bake-pizza"
                        ? "border-tomato/20 bg-tomato/[.05]"
                        : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/35">
                        Step {index + 1} · {formatShortDateTime(step.scheduledAt)}
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
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusClass(step.id === nextStep?.id && !shoppingIsNext ? "next" : step.id === "bake-pizza" ? "target" : step.status)}`}>
                        {statusLabel(step, shoppingIsNext ? undefined : nextStep)}
                      </span>
                      <span className="text-sm font-bold text-ink/55">
                        {relativeFromTarget(step.scheduledAt, targetTime)}
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
              </div>
            ))}
            {shoppingCheckpointInsertIndex === timeline.steps.length && (
              <ShoppingCheckpointCard checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />
            )}
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
