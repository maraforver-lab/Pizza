"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  findPizzaTroubleshootingProblem,
  getPizzaTroubleshootingLevelPresentation,
  pizzaTroubleshootingTopicIds,
  troubleshootingCategories,
  troubleshootingSections,
  type PizzaTroubleshootingProblem,
  type PizzaTroubleshootingSection,
} from "@/lib/pizza-troubleshooting";
import { readExperienceLevelPreference, type ExperienceLevel } from "@/lib/experience-levels";

type PizzaTroubleshootingGuideClientProps = {
  activeTopicId?: string;
  returnPath?: string | null;
};

function VisualPanel({ visual, index }: { visual: PizzaTroubleshootingSection["visual"]; index: number }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/80 bg-[#f3e8d7] shadow-card" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.9),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(233,75,46,.2),transparent_22%),radial-gradient(circle_at_65%_78%,rgba(59,166,107,.18),transparent_28%)]" />
      <div className="absolute -left-8 bottom-5 h-28 w-28 rounded-full border-[18px] border-white/60 bg-orange/20" />
      <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-tomato/15" />
      <div className="absolute right-8 top-8 grid h-14 w-14 rotate-12 place-items-center rounded-[1.1rem] bg-white/75 text-xl shadow-sm">
        {index === 0 ? "🌾" : index === 1 ? "✋" : index === 2 ? "🍕" : index === 3 ? "🔥" : "🍅"}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/80 p-4 backdrop-blur">
        <span className={`mb-3 block h-1.5 w-16 rounded-full ${visual.accent}`} />
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-ink/40">{visual.motif}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">{visual.label}</p>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/60">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato/70" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StepLabel({ children }: { children: ReactNode }) {
  return <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">{children}</h4>;
}

function ProblemCard({
  problem,
  active,
  experienceLevel,
}: {
  problem: PizzaTroubleshootingProblem;
  active: boolean;
  experienceLevel: ExperienceLevel;
}) {
  const presentation = getPizzaTroubleshootingLevelPresentation(problem, experienceLevel);
  const fullDetailId = `${problem.id}-full-detail`;

  return (
    <article
      id={`topic-${problem.id}`}
      tabIndex={active ? -1 : undefined}
      aria-current={active ? "true" : undefined}
      className={`scroll-mt-24 rounded-[1.5rem] border bg-white/85 p-5 shadow-card backdrop-blur transition sm:p-6 ${
        active ? "border-tomato/45 ring-2 ring-tomato/25" : "border-white/80"
      }`}
    >
      {active && (
        <p className="mb-3 inline-flex rounded-full bg-tomato px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-white">
          Selected troubleshooting topic
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-2xl font-semibold text-ink">{problem.title}</h3>
        <span className="rounded-full border border-ink/10 bg-cream/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.14em] text-ink/45">
          {presentation.modeLabel}
        </span>
      </div>
      {presentation.quickCheck && (
        <p className="mt-3 rounded-2xl border border-leaf/15 bg-leaf/[.07] p-3 text-sm font-bold leading-6 text-ink/70">
          Quick check: {presentation.quickCheck}
        </p>
      )}
      <figure className="mt-4 overflow-hidden rounded-[1.25rem] border border-ink/10 bg-cream/70">
        <div className="relative aspect-[3/2]">
          <Image
            src={problem.image.src}
            alt={problem.image.alt}
            width={problem.image.width}
            height={problem.image.height}
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-full w-full object-cover"
          />
        </div>
        {problem.image.kind === "comparison" && problem.image.comparisonLabels && (
          <dl className="grid gap-2 border-t border-ink/10 bg-white/75 p-3 text-[11px] sm:grid-cols-2">
            <div className="rounded-xl bg-cream px-3 py-2">
              <dt className="font-extrabold uppercase tracking-[.12em] text-tomato">Problem</dt>
              <dd className="mt-1 text-ink/65">{problem.image.comparisonLabels.problem}</dd>
            </div>
            <div className="rounded-xl bg-leaf/[.08] px-3 py-2">
              <dt className="font-extrabold uppercase tracking-[.12em] text-leaf">Better result</dt>
              <dd className="mt-1 text-ink/65">{problem.image.comparisonLabels.better}</dd>
            </div>
          </dl>
        )}
        {problem.image.caption && (
          <figcaption className="border-t border-ink/10 bg-white/70 px-4 py-3 text-xs leading-5 text-ink/55">
            {problem.image.caption}
          </figcaption>
        )}
      </figure>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-cream/70 p-4">
          <StepLabel>Symptom</StepLabel>
          <p className="mt-2 text-sm leading-6 text-ink/65">{problem.shortSymptom}</p>
          {presentation.diagnosticNote && <p className="mt-2 text-sm leading-6 text-ink/55">{presentation.diagnosticNote}</p>}
        </div>
        <div className="rounded-2xl bg-[#fff7ed]/80 p-4">
          <StepLabel>Likely causes</StepLabel>
          <BulletList items={presentation.likelyCauses} />
        </div>
        <div className="rounded-2xl bg-white p-4">
          <StepLabel>Fix now</StepLabel>
          <BulletList items={presentation.fixNow} />
        </div>
        <div className="rounded-2xl bg-leaf/[.08] p-4">
          <StepLabel>Prevent next time</StepLabel>
          <BulletList items={presentation.preventNextTime} />
        </div>
      </div>
      {presentation.showMoreDetail && (
        <details id={fullDetailId} className="mt-4 rounded-2xl border border-ink/10 bg-white/75 p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-ink/65 marker:text-tomato">
            More detail for {problem.title}
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {problem.symptomDetails && (
              <div className="rounded-2xl bg-cream/70 p-4">
                <StepLabel>Diagnostic note</StepLabel>
                <p className="mt-2 text-sm leading-6 text-ink/60">{problem.symptomDetails}</p>
              </div>
            )}
            <div className="rounded-2xl bg-[#fff7ed]/80 p-4">
              <StepLabel>All likely causes</StepLabel>
              <BulletList items={problem.likelyCauses} />
            </div>
            <div className="rounded-2xl bg-white p-4">
              <StepLabel>All fix now actions</StepLabel>
              <BulletList items={problem.fixNow} />
            </div>
            <div className="rounded-2xl bg-leaf/[.08] p-4">
              <StepLabel>All prevent next time actions</StepLabel>
              <BulletList items={problem.preventNextTime} />
            </div>
          </div>
        </details>
      )}
      {presentation.relatedTopicIds.length > 0 && (
        <nav className="mt-4 rounded-2xl border border-ink/10 bg-cream/70 p-4" aria-label={`Related troubleshooting topics for ${problem.title}`}>
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Related troubleshooting</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {presentation.relatedTopicIds.map((topicId) => {
              const related = findPizzaTroubleshootingProblem(topicId);
              if (!related) return null;
              return (
                <a
                  key={topicId}
                  href={`#topic-${topicId}`}
                  className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/60 transition hover:border-tomato/25 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {related.problem.title}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </article>
  );
}

export function PizzaTroubleshootingGuideClient({ activeTopicId, returnPath }: PizzaTroubleshootingGuideClientProps) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  const activeTopic = findPizzaTroubleshootingProblem(activeTopicId);

  return (
    <main className="guide-page min-h-screen overflow-x-clip px-4 py-5 text-ink sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/guide" className="flex items-center gap-2 text-sm font-bold text-ink/65 transition hover:text-ink">
            <span aria-hidden="true">←</span>
            Back to Guide
          </Link>
          {returnPath && (
            <Link href={returnPath} className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Back to Dough Guide
            </Link>
          )}
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-card backdrop-blur sm:p-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Pizza troubleshooting</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              What went wrong with your pizza?
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
              Choose the problem that looks closest to yours, then work through the likely causes and fixes.
            </p>
            <p className="mt-4 max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm leading-6 text-ink/65">
              Pizza usually goes wrong for a reason: timing, temperature, hydration, flour strength, toppings or oven setup.
              Use the closest symptom, make one change at a time, and compare what improves on the next bake.
            </p>
            <p className="mt-4 inline-flex rounded-full border border-ink/10 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">
              Guidance mode: {getPizzaTroubleshootingLevelPresentation(troubleshootingSections[0].problems[0], experienceLevel).levelLabel}
            </p>
            {activeTopic && (
              <p className="mt-4 max-w-2xl rounded-2xl border border-tomato/20 bg-[#fff7ed] p-4 text-sm font-extrabold leading-6 text-ink/70">
                Opened topic: {activeTopic.problem.title}. The matching card is highlighted below.
              </p>
            )}
          </div>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#f1e2cd] shadow-card lg:mt-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(255,255,255,.86),transparent_24%),radial-gradient(circle_at_74%_22%,rgba(233,75,46,.25),transparent_22%),radial-gradient(circle_at_50%_76%,rgba(59,166,107,.16),transparent_30%)]" />
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-tomato/75 shadow-lg" />
            <div className="absolute right-10 top-16 h-16 w-16 rounded-full bg-leaf/70 shadow-lg" />
            <div className="absolute bottom-8 left-10 right-10 rounded-[2rem] border-[18px] border-[#d9a85c]/45 bg-white/35 p-10 backdrop-blur-sm" />
            <div className="absolute bottom-8 right-8 rounded-2xl bg-ink px-5 py-4 text-white shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/45">Troubleshoot</p>
              <p className="font-display text-3xl font-semibold">{pizzaTroubleshootingTopicIds.length} common problems</p>
            </div>
          </div>
        </section>

        <nav className="my-8 rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur sm:p-5" aria-label="Quick problem finder">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Quick problem finder</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Start with the symptom area</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {troubleshootingCategories.map((category, index) => {
              const section = troubleshootingSections.find((item) => item.id === category.id);
              const topicCount = section?.problems.length ?? 0;
              return (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="group rounded-2xl border border-ink/10 bg-cream/70 p-4 transition hover:-translate-y-0.5 hover:border-tomato/25 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  <span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-tomato">{index + 1}</span>
                  <span className="mt-2 block text-sm font-extrabold text-ink">{category.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{topicCount} {topicCount === 1 ? "topic" : "topics"}</span>
                </a>
              );
            })}
          </div>
        </nav>

        <div className="space-y-12">
          {troubleshootingSections.map((section, sectionIndex) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
                <div className="lg:sticky lg:top-24">
                  <VisualPanel visual={section.visual} index={sectionIndex} />
                  <div className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Section {sectionIndex + 1}</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold">{section.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-ink/60">{section.intro}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-ink/35">
                      Symptom → likely causes → fix now → prevent next time
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {section.problems.map((problem) => (
                    <ProblemCard key={problem.id} problem={problem} active={problem.id === activeTopicId} experienceLevel={experienceLevel} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-[1fr_.85fr]">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">General diagnostic guidance</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Change one variable at a time</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/65 sm:grid-cols-2">
              <li className="rounded-2xl bg-cream/70 p-4">Take notes on dough temperature, fermentation time and oven behavior.</li>
              <li className="rounded-2xl bg-cream/70 p-4">Use the closest matching symptom instead of waiting for an exact visual match.</li>
              <li className="rounded-2xl bg-cream/70 p-4">Change one thing on the next bake so you can tell what helped.</li>
              <li className="rounded-2xl bg-cream/70 p-4">Compare dough handling, topping moisture and heat balance before changing the recipe.</li>
            </ul>
          </div>
          <aside className="rounded-[1.75rem] border border-white/80 bg-cream/80 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="related-guides">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Related guides</p>
            <h2 id="related-guides" className="mt-2 font-display text-2xl font-semibold">Useful next references</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/guides/dough" className="rounded-2xl bg-white/80 p-4 text-sm font-extrabold text-ink transition hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Dough Guide
              </Link>
              <Link href="/guide" className="rounded-2xl bg-white/80 p-4 text-sm font-extrabold text-ink transition hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Guide and glossary
              </Link>
              <Link href="/calculator/quick" className="rounded-2xl bg-white/80 p-4 text-sm font-extrabold text-ink transition hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Quick Dough Calculator
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
