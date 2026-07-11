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
  getDoughGuideTroubleshootingLabel,
  type DoughGuideImage,
  type DoughGuideStep,
  type DoughGuideStepId,
  type DoughGuideTroubleshootingReference,
  type DoughGuideVisualComparison,
  type DoughGuideVisualSequence,
} from "@/lib/dough-guide";
import {
  getDoughGuideSessionContext,
  getDoughGuideFlourGuidance,
  type DoughGuideFact,
  type DoughGuideFlourGuidance,
  type DoughGuideSessionContext,
} from "@/lib/dough-guide-session-context";
import {
  buildDoughGuideHref,
  getSafeDoughGuideSessionReturnPath,
  type DoughGuideReturnPath,
} from "@/lib/dough-guide-links";
import {
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

function compactPrepareFacts(
  context: DoughGuideSessionContext,
  flourGuidance: DoughGuideFlourGuidance | undefined,
) {
  const rows: DoughGuideFact[] = [];
  const wantedLabels = new Set(["Dough balls", "Hydration", "Fermentation", "Flour", "Yeast", "Cold temperature", "Room temperature"]);
  for (const fact of context.summaryRows) {
    if (wantedLabels.has(fact.label) && rows.length < 6) rows.push(fact);
  }

  const flourFit = flourGuidance?.facts.find((fact) => fact.label === "Fit");
  if (flourFit && !rows.some((fact) => fact.label === "Flour fit") && rows.length < 6) {
    rows.push({ label: "Flour fit", value: flourFit.value });
  }

  return rows;
}

function PreparePlanSummaryCard({
  context,
  flourGuidance,
}: {
  context: DoughGuideSessionContext;
  flourGuidance: DoughGuideFlourGuidance | undefined;
}) {
  if (!context.hasActiveSession) {
    return (
      <section className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-4 shadow-sm" aria-labelledby="dough-guide-no-session">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
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

  const facts = compactPrepareFacts(context, flourGuidance);

  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4 shadow-sm" aria-labelledby="dough-guide-current-plan">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Active Pizza Session</p>
          <h2 id="dough-guide-current-plan" className="mt-1 font-display text-2xl font-semibold">Your dough plan</h2>
        </div>
      </div>
      <FactList facts={facts} />
      {flourGuidance?.caution && (
        <p className="mt-3 rounded-2xl border border-tomato/15 bg-white/70 p-3 text-sm font-extrabold leading-6 text-tomato">
          Pay closer attention: {flourGuidance.caution}
        </p>
      )}
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

function StepVisual({ step, priority = false }: { step: DoughGuideStep; priority?: boolean }) {
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
          priority={priority}
          sizes="(min-width: 1024px) 34vw, 100vw"
          className="object-cover"
        />
      </div>
      {step.image.caption && (
        <figcaption className="px-4 py-3 text-xs font-extrabold leading-5 text-ink/55">
          {step.image.caption}
        </figcaption>
      )}
    </figure>
  );
}

function TeachingVisualFigure({
  visual,
  experienceLevel,
  compact = false,
}: {
  visual: DoughGuideImage;
  experienceLevel: ExperienceLevel;
  compact?: boolean;
}) {
  const levelNotes = visual.levelNotes?.[experienceLevel] ?? [];
  return (
    <figure className="overflow-hidden rounded-[1.25rem] border border-white/80 bg-white shadow-sm">
      <div className={`relative ${compact ? "aspect-[4/3]" : "aspect-[16/11]"} bg-cream`}>
        <Image
          src={visual.src}
          alt={visual.alt}
          fill
          sizes={compact ? "(min-width: 1024px) 18vw, 86vw" : "(min-width: 1024px) 32vw, 92vw"}
          className="object-cover"
        />
      </div>
      {(visual.caption || levelNotes.length > 0) && (
        <figcaption className="space-y-2 px-4 py-3 text-xs font-extrabold leading-5 text-ink/60">
          {visual.caption && <p>{visual.caption}</p>}
          {levelNotes.length > 0 && (
            <ul className="space-y-1">
              {levelNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function VisualSequenceCard({
  sequence,
  experienceLevel,
}: {
  sequence: DoughGuideVisualSequence | undefined;
  experienceLevel: ExperienceLevel;
}) {
  if (!sequence) return null;
  const isLongSequence = sequence.items.length > 3;
  return (
    <section className="rounded-[1.5rem] border border-orange/20 bg-[#fff7ed] p-4 sm:p-5" aria-labelledby="visual-learning">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="visual-learning" className="font-display text-2xl font-semibold">{sequence.title}</h3>
          {sequence.summary && <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-ink/60">{sequence.summary}</p>}
        </div>
      </div>
      <div className={`mt-4 grid gap-3 ${isLongSequence ? "sm:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2"}`}>
        {sequence.items.map((visual) => (
          <TeachingVisualFigure
            key={`${visual.src}-${visual.caption ?? visual.alt}`}
            visual={visual}
            experienceLevel={experienceLevel}
            compact={isLongSequence}
          />
        ))}
      </div>
      {sequence.note && (
        <p className="mt-4 rounded-2xl bg-white/75 p-3 text-sm font-extrabold leading-6 text-ink/65">
          {sequence.note}
        </p>
      )}
    </section>
  );
}

function VisualComparisonCard({
  comparison,
  experienceLevel,
}: {
  comparison: DoughGuideVisualComparison | undefined;
  experienceLevel: ExperienceLevel;
}) {
  if (!comparison) return null;
  const toneClass = {
    want: "border-leaf/25 bg-leaf/[.07]",
    avoid: "border-tomato/25 bg-tomato/[.06]",
    neutral: "border-ink/10 bg-cream/75",
  } as const;
  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 sm:p-5" aria-labelledby="dough-readiness-visual-comparison">
      <h3 id="dough-readiness-visual-comparison" className="font-display text-2xl font-semibold">{comparison.title}</h3>
      {comparison.summary && <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-ink/60">{comparison.summary}</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {comparison.items.map((item) => (
          <article key={item.label} className={`rounded-[1.25rem] border p-3 ${toneClass[item.tone]}`}>
            <TeachingVisualFigure visual={item} experienceLevel={experienceLevel} compact />
            <h4 className="mt-3 text-sm font-extrabold text-ink">{item.label}</h4>
            <BulletList items={item.teachingPoints} />
          </article>
        ))}
      </div>
      {comparison.note && (
        <p className="mt-4 rounded-2xl bg-white/75 p-3 text-sm font-extrabold leading-6 text-ink/65">
          {comparison.note}
        </p>
      )}
    </section>
  );
}

function troubleshootingHref(topicId: string, stepId: DoughGuideStepId, sessionReturnPath?: DoughGuideReturnPath | null) {
  return `/guide/pizza-troubleshooting?topic=${topicId}&from=${encodeURIComponent(buildDoughGuideHref(stepId, sessionReturnPath ?? undefined))}#topic-${topicId}`;
}

function TroubleshootingLinksCard({
  links,
  experienceLevel,
  stepId,
  sessionReturnPath,
}: {
  links: readonly DoughGuideTroubleshootingReference[] | undefined;
  experienceLevel: ExperienceLevel;
  stepId: DoughGuideStepId;
  sessionReturnPath?: DoughGuideReturnPath | null;
}) {
  if (!links?.length) return null;
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-cream/80 p-4 sm:p-5" aria-labelledby="dough-guide-troubleshooting-links">
      <h3 id="dough-guide-troubleshooting-links" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">
        Need more help?
      </h3>
      <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
        Open the existing troubleshooting guide for the problem that looks closest to what you see.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {links.map((link) => (
          <Link
            key={`${stepId}-${link.topicId}`}
            href={troubleshootingHref(link.topicId, stepId, sessionReturnPath)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            aria-label={`${getDoughGuideTroubleshootingLabel(link, experienceLevel)} in Pizza Troubleshooting Guide`}
          >
            {getDoughGuideTroubleshootingLabel(link, experienceLevel)}
          </Link>
        ))}
      </div>
    </section>
  );
}

function StepNavigation({
  activeIndex,
  sessionReturnPath,
}: {
  activeIndex: number;
  sessionReturnPath?: DoughGuideReturnPath | null;
}) {
  return (
    <nav className="rounded-[1.5rem] border border-white/80 bg-white/80 p-2 shadow-card backdrop-blur" aria-label="Dough Guide steps">
      <ol className="space-y-1">
        {doughGuideSteps.map((step, index) => {
          const active = index === activeIndex;
          return (
            <li key={step.id}>
              <Link
                href={buildDoughGuideHref(step.id, sessionReturnPath ?? undefined)}
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
                  <span className="flex flex-wrap items-center gap-2 font-extrabold">
                    {step.actionName}
                    {active && (
                      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[.14em] text-white/80">
                        Current
                      </span>
                    )}
                  </span>
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
  const sessionReturnPath = getSafeDoughGuideSessionReturnPath(searchParams.get("from"));
  const sessionReturnLabel = sessionReturnPath === "/session/timeline"
    ? "Back to Timeline"
    : sessionReturnPath === "/session/kitchen"
      ? "Back to Kitchen Mode"
      : null;
  const activeStep = getDoughGuideStepById(stepParam);
  const activeIndex = getDoughGuideStepIndex(stepParam);
  const previousStep = activeIndex > 0 ? doughGuideSteps[activeIndex - 1] : undefined;
  const nextStep = activeIndex < doughGuideSteps.length - 1 ? doughGuideSteps[activeIndex + 1] : undefined;
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [sessionContext, setSessionContext] = useState<DoughGuideSessionContext>(() => getDoughGuideSessionContext(null));
  const levelDetails = getDoughGuideLevelDetails(activeStep, experienceLevel);
  const flourGuidance = getDoughGuideFlourGuidance(sessionContext.flourContext, experienceLevel);
  const showPreparePlanSummary = activeStep.id === "prepare";

  useEffect(() => {
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
    setSessionContext(getDoughGuideSessionContext(getActivePizzaSession()));
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/guide" className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            <span aria-hidden="true">←</span>
            Back to Guide
          </Link>
          {sessionReturnPath && sessionReturnLabel && (
            <Link
              href={sessionReturnPath}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/75 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              {sessionReturnLabel}
            </Link>
          )}
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-center lg:gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools guide</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Pizza Dough Guide
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-bold leading-7 text-ink/60 sm:text-base">
              Learn how to make pizza dough step by step, from the first mix to a dough ball that is ready to stretch.
            </p>
            <p className="mt-4 hidden max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm font-bold leading-6 text-ink/65 lg:block">
              This guide works with or without a Pizza Session. When a session is active, it adds your dough-plan values without changing the session.
            </p>
          </div>
          <div className="mt-6 hidden lg:mt-0 lg:block">
            <StepVisual step={activeStep} priority />
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <StepNavigation activeIndex={activeIndex} sessionReturnPath={sessionReturnPath} />
          </aside>

          <article className="rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-card backdrop-blur sm:p-6" aria-labelledby="active-dough-guide-step">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Step {activeIndex + 1} of {doughGuideSteps.length}</p>
              <h2 id="active-dough-guide-step" className="mt-2 font-display text-4xl font-semibold leading-tight">
                {activeStep.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-7 text-ink/60">{activeStep.summary}</p>
            </div>

            <div className="mt-5 lg:hidden">
              <StepVisual step={activeStep} priority />
            </div>

            <section className="mt-5 rounded-[1.5rem] border border-tomato/20 bg-tomato/[.06] p-4 sm:p-5" aria-labelledby="do-this-now">
              <h3 id="do-this-now" className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Do this now</h3>
              <BulletList items={activeStep.doThisNow} ordered />
            </section>

            {showPreparePlanSummary && (
              <div className="mt-4 hidden lg:block">
                <PreparePlanSummaryCard context={sessionContext} flourGuidance={flourGuidance} />
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
              <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 sm:p-5" aria-labelledby="you-are-ready-when">
                <h3 id="you-are-ready-when" className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">You are ready when</h3>
                <BulletList items={activeStep.readyWhen} />
              </section>
              <section className="rounded-[1.5rem] border border-orange/25 bg-[#fff7ed] p-4 sm:p-5" aria-labelledby="common-mistake">
                <h3 id="common-mistake" className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Common mistake</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-ink/65">{activeStep.commonMistake}</p>
              </section>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-ink/10 bg-cream/80 p-4 sm:p-5" aria-labelledby="how-to-fix-it">
              <h3 id="how-to-fix-it" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">How to fix it</h3>
              <p className="mt-3 text-sm font-bold leading-6 text-ink/65">{activeStep.howToFix}</p>
            </div>

            <div className="mt-4 space-y-4">
              <VisualSequenceCard sequence={activeStep.visualSequence} experienceLevel={experienceLevel} />
              <VisualComparisonCard comparison={activeStep.visualComparison} experienceLevel={experienceLevel} />
            </div>

            <div className="mt-4">
              <ReadinessComparison step={activeStep} />
            </div>

            <div className="mt-4">
              <TroubleshootingLinksCard
                links={activeStep.troubleshooting}
                experienceLevel={experienceLevel}
                stepId={activeStep.id}
                sessionReturnPath={sessionReturnPath}
              />
            </div>

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
                  href={buildDoughGuideHref(previousStep.id, sessionReturnPath ?? undefined)}
                  className="order-2 inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:order-1"
                >
                  Previous step
                </Link>
              ) : (
                <span className="hidden sm:block" aria-hidden="true" />
              )}
              {nextStep ? (
                <Link
                  href={buildDoughGuideHref(nextStep.id, sessionReturnPath ?? undefined)}
                  className="order-1 inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:order-2 sm:justify-self-end"
                >
                  Continue to {nextStep.actionName}
                </Link>
              ) : (
                <p className="order-1 rounded-2xl bg-leaf px-5 py-3 text-center text-sm font-extrabold text-white sm:order-2 sm:justify-self-end">
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
