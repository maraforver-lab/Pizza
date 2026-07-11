"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import {
  DOUGH_GUIDE_LEVEL_LABELS,
  doughGuideSteps,
  getDoughGuideLevelDetails,
  getDoughGuideStepById,
  getDoughGuideStepIndex,
  type DoughGuideStep,
} from "@/lib/dough-guide";
import {
  getDoughGuideSessionContext,
  getDoughGuideFlourGuidance,
  getDoughGuideStepFlourGuidance,
  getDoughGuideStepPersonalization,
  type DoughGuideFact,
  type DoughGuideFlourGuidance,
  type DoughGuideSessionContext,
} from "@/lib/dough-guide-session-context";
import {
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { getActivePizzaSession } from "@/lib/pizza-session-storage";

function BulletList({ items, ordered = false }: { items: readonly string[]; ordered?: boolean }) {
  const className = "mt-3 space-y-2 text-sm font-bold leading-6 text-ink/65";
  if (ordered) {
    return (
      <ol className={`${className} list-decimal pl-5`}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ol>
    );
  }

  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FactList({ facts }: { facts: readonly DoughGuideFact[] }) {
  if (!facts.length) return null;
  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={`${fact.label}-${fact.value}`} className="rounded-2xl bg-white/75 p-3">
          <dt className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">{fact.label}</dt>
          <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SessionContextCard({ context }: { context: DoughGuideSessionContext }) {
  if (!context.hasActiveSession) {
    return (
      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white/75 p-4 shadow-sm sm:p-5" aria-labelledby="dough-guide-no-session">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="dough-guide-no-session" className="font-display text-2xl font-semibold">No active Pizza Session</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
              You can use this guide without a session. Start a Pizza Session to see your exact ingredient amounts, dough-ball size and fermentation plan inside each step.
            </p>
          </div>
          <Link
            href="/session/start"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Start a Pizza Session
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4 shadow-sm sm:p-5" aria-labelledby="dough-guide-current-plan">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Active Pizza Session</p>
          <h2 id="dough-guide-current-plan" className="mt-1 font-display text-2xl font-semibold">Your current dough plan</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-ink/60">
            These values come from your active Dough Plan. Missing optional values are simply left out.
          </p>
        </div>
      </div>
      <FactList facts={context.summaryRows} />
    </section>
  );
}

function FlourGuidanceCard({ guidance }: { guidance: DoughGuideFlourGuidance | undefined }) {
  if (!guidance) return null;
  return (
    <section className="mt-4 rounded-[1.5rem] border border-orange/20 bg-[#fff7ed] p-4 shadow-sm sm:p-5" aria-labelledby="dough-guide-flour-guidance">
      <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Flour fit</p>
          <h2 id="dough-guide-flour-guidance" className="mt-1 font-display text-2xl font-semibold">{guidance.heading}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/65">{guidance.explanation}</p>
          {guidance.caution && (
            <p className="mt-3 rounded-2xl border border-tomato/20 bg-white/70 p-3 text-sm font-extrabold leading-6 text-tomato">
              Pay closer attention: {guidance.caution}
            </p>
          )}
        </div>
        <div>
          <FactList facts={guidance.facts} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <section className="rounded-2xl bg-white/75 p-3">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Pay attention to</h3>
              <BulletList items={guidance.payAttentionTo} />
            </section>
            <section className="rounded-2xl bg-white/75 p-3">
              <h3 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/40">Guidance for your level</h3>
              <BulletList items={guidance.levelDetails} />
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepPersonalizationCard({ facts }: { facts: readonly DoughGuideFact[] }) {
  if (!facts.length) return null;
  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 sm:p-5" aria-labelledby="your-plan-for-this-step">
      <h3 id="your-plan-for-this-step" className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Your plan for this step</h3>
      <FactList facts={facts} />
    </section>
  );
}

function DisclosureCard({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className="rounded-[1.25rem] border border-ink/10 bg-cream/65">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-between gap-4 rounded-[1.25rem] px-4 py-3 text-left text-sm font-extrabold text-ink transition hover:bg-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
      >
        {title}
        <span aria-hidden="true" className="text-lg text-tomato">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4">
          {children}
        </div>
      )}
    </section>
  );
}

function StepVisual({ step }: { step: DoughGuideStep }) {
  if (!step.image) {
    return (
      <div className="grid min-h-48 place-items-center rounded-[1.5rem] border border-white/70 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.85),transparent_28%),radial-gradient(circle_at_75%_75%,rgba(233,75,46,.16),transparent_32%)] p-6 text-center" aria-hidden="true">
        <span className="font-display text-4xl text-tomato/60">Dough</span>
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-card">
      <div className="relative aspect-[4/3]">
        <Image
          src={step.image.src}
          alt={step.image.alt}
          fill
          sizes="(min-width: 1024px) 34vw, 100vw"
          className="object-cover"
        />
      </div>
    </figure>
  );
}

function StepNavigation({ activeIndex }: { activeIndex: number }) {
  return (
    <nav className="rounded-[1.5rem] border border-white/80 bg-white/80 p-2 shadow-card backdrop-blur" aria-label="Dough Guide steps">
      <ol className="space-y-1">
        {doughGuideSteps.map((step, index) => {
          const active = index === activeIndex;
          return (
            <li key={step.id}>
              <Link
                href={`/guides/dough?step=${step.id}`}
                aria-current={active ? "step" : undefined}
                className={`grid grid-cols-[2rem_1fr] gap-2 rounded-2xl px-3 py-3 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink/60 hover:bg-cream hover:text-ink"
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${active ? "bg-white text-ink" : "bg-cream text-tomato"}`}>
                  {index + 1}
                </span>
                <span>
                  <span className="block font-extrabold">{step.actionName}</span>
                  <span className={`mt-0.5 block text-xs leading-5 ${active ? "text-white/65" : "text-ink/45"}`}>{step.title}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReadinessComparison({ step }: { step: DoughGuideStep }) {
  if (!step.readinessStates) return null;
  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 sm:p-5" aria-labelledby="dough-readiness-comparison">
      <h3 id="dough-readiness-comparison" className="font-display text-2xl font-semibold">Dough readiness comparison</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
        Use these signs together. The finger-poke test is helpful, but it is not definitive on its own.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {step.readinessStates.map((state) => (
          <article key={state.label} className="rounded-2xl bg-white/80 p-4">
            <h4 className="text-sm font-extrabold text-ink">{state.label}</h4>
            <BulletList items={state.signs} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DoughGuidePageClient() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const activeStep = getDoughGuideStepById(stepParam);
  const activeIndex = getDoughGuideStepIndex(stepParam);
  const previousStep = activeIndex > 0 ? doughGuideSteps[activeIndex - 1] : undefined;
  const nextStep = activeIndex < doughGuideSteps.length - 1 ? doughGuideSteps[activeIndex + 1] : undefined;
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [sessionContext, setSessionContext] = useState<DoughGuideSessionContext>(() => getDoughGuideSessionContext(null));
  const levelConfig = getExperienceLevelConfig(experienceLevel);
  const levelDetails = getDoughGuideLevelDetails(activeStep, experienceLevel);
  const flourGuidance = getDoughGuideFlourGuidance(sessionContext.flourContext, experienceLevel);
  const stepPersonalization = [
    ...getDoughGuideStepPersonalization(activeStep.id, sessionContext),
    ...getDoughGuideStepFlourGuidance(activeStep.id, sessionContext.flourContext),
  ];

  useEffect(() => {
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
    setSessionContext(getDoughGuideSessionContext(getActivePizzaSession()));
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/guide" className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            <span aria-hidden="true">←</span>
            Back to Guide
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur sm:p-8 lg:grid lg:grid-cols-[1fr_.72fr] lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools guide</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Pizza Dough Guide
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-bold leading-7 text-ink/60 sm:text-base">
              Learn how to make pizza dough step by step, from the first mix to a dough ball that is ready to stretch.
            </p>
            <p className="mt-4 max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm font-bold leading-6 text-ink/65">
              This guide works with or without a Pizza Session. When a session is active, it adds your dough-plan values without changing the session.
            </p>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-ink/10 bg-cream/80 p-4 lg:mt-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Current progress</p>
            <p className="mt-2 font-display text-3xl font-semibold">Step {activeIndex + 1} of {doughGuideSteps.length}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
              Active step: {activeStep.actionName}. Guidance mode: {levelConfig.label}.
            </p>
          </div>
        </section>

        <SessionContextCard context={sessionContext} />
        <FlourGuidanceCard guidance={flourGuidance} />

        <div className="mt-6 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <StepNavigation activeIndex={activeIndex} />
          </aside>

          <article className="rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-card backdrop-blur sm:p-6" aria-labelledby="active-dough-guide-step">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Step {activeIndex + 1} of {doughGuideSteps.length}</p>
                <h2 id="active-dough-guide-step" className="mt-2 font-display text-4xl font-semibold leading-tight">
                  {activeStep.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-bold leading-7 text-ink/60">{activeStep.summary}</p>
              </div>
              <StepVisual step={activeStep} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
              <section className="rounded-[1.5rem] border border-tomato/20 bg-tomato/[.06] p-4 sm:p-5" aria-labelledby="do-this-now">
                <h3 id="do-this-now" className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Do this now</h3>
                <BulletList items={activeStep.doThisNow} ordered />
              </section>
              <StepPersonalizationCard facts={stepPersonalization} />
              <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 sm:p-5" aria-labelledby="you-are-ready-when">
                <h3 id="you-are-ready-when" className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">You are ready when</h3>
                <BulletList items={activeStep.readyWhen} />
              </section>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <section className="rounded-[1.5rem] border border-orange/25 bg-[#fff7ed] p-4 sm:p-5" aria-labelledby="common-mistake">
                <h3 id="common-mistake" className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Common mistake</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-ink/65">{activeStep.commonMistake}</p>
              </section>
              <section className="rounded-[1.5rem] border border-ink/10 bg-cream/80 p-4 sm:p-5" aria-labelledby="how-to-fix-it">
                <h3 id="how-to-fix-it" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">How to fix it</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-ink/65">{activeStep.howToFix}</p>
              </section>
            </div>

            <ReadinessComparison step={activeStep} />

            <div className="mt-4 space-y-3">
              <DisclosureCard title="Why this matters">
                <p className="text-sm font-bold leading-6 text-ink/65">{activeStep.whyItMatters}</p>
              </DisclosureCard>
              <DisclosureCard title={DOUGH_GUIDE_LEVEL_LABELS[experienceLevel]}>
                <BulletList items={levelDetails} />
              </DisclosureCard>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
              {previousStep ? (
                <Link
                  href={`/guides/dough?step=${previousStep.id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  Previous step
                </Link>
              ) : (
                <span className="hidden sm:block" aria-hidden="true" />
              )}
              {nextStep ? (
                <Link
                  href={`/guides/dough?step=${nextStep.id}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:justify-self-end"
                >
                  Continue to {nextStep.actionName}
                </Link>
              ) : (
                <p className="rounded-2xl bg-leaf px-5 py-3 text-center text-sm font-extrabold text-white sm:justify-self-end">
                  Dough is ready to stretch
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
