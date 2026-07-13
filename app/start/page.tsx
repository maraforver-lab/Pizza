"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import ExperienceLevelSelector, { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { startHerePathHref, startHerePaths } from "@/lib/start-here";

export default function StartHerePage() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const experience = getExperienceLevelConfig(experienceLevel);

  useEffect(() => {
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  return (
    <main className="min-h-screen px-4 py-5 pb-28 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 15.5C7.8 7.9 17.6 5 20 7c-.3 6.4-4.9 12.1-12 12.5-3.4.2-5.3-1.4-4-4Z"/><circle cx="10" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span>
          </Link>
          <Link href="/" className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-xs font-bold text-ink/65 transition hover:border-ink/25 hover:text-ink">
            Calculator
          </Link>
        </header>

        <section className="grid gap-5 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Beginner front door</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[.95] tracking-tight sm:text-7xl">
              Start Here
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/60">
              Make your first good pizza without guessing every setting. Choose the kind of pizza you want to make,
              then DoughTools gives you a safe starting path into the calculator, Planner and Dough Doctor.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={experienceLevel} />
              <span className="rounded-full border border-ink/10 bg-cream px-3 py-2 text-xs font-bold text-ink/55">
                {experience.bestFor}
              </span>
            </div>
            <Link
              href="/session/start"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98]"
            >
              Plan my next pizza
            </Link>
          </div>
          <ExperienceLevelSelector
            value={experienceLevel}
            onChange={setExperienceLevel}
            compact
            title="Choose how much detail you want"
            intro="Beginner keeps the path simple. Enthusiast adds practical why-notes. Pizza Nerd exposes assumptions, tradeoffs and constraints."
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3" aria-label="Start Here pizza paths">
          {startHerePaths.map((path) => {
            const calculatorHref = startHerePathHref(path, "/");
            const plannerHref = startHerePathHref(path, "/plan");
            const doctorHref = startHerePathHref(path, "/doctor");
            const headingId = `start-path-${path.id}`;

            return (
              <article key={path.id} aria-labelledby={headingId} className="flex min-h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/80 shadow-card backdrop-blur">
                <div className="border-b border-ink/10 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-xl text-white" aria-hidden="true">
                      {path.marker}
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-tomato">Start path</p>
                      <h2 id={headingId} className="mt-1 font-display text-3xl font-semibold leading-none">{path.title}</h2>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/60">{path.description}</p>
                </div>

                <div className="grid flex-1 gap-4 p-5">
                  <section>
                    <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Best for</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/65">{path.bestFor}</p>
                  </section>
                  <section>
                    <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Why this works</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/65">{path.whyItWorks}</p>
                  </section>
                  <section className="rounded-2xl bg-leaf/[.08] p-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Do not worry about yet</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/60">{path.dontWorryAboutYet}</p>
                  </section>
                  <section>
                    <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Beginner-safe guidance</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/65">{path.beginnerGuidance}</p>
                  </section>
                  <section>
                    <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Simple steps</h3>
                    <ol className="mt-2 grid gap-2">
                      {path.steps.map((step, index) => (
                        <li key={step} className="flex gap-2 text-sm leading-6 text-ink/60">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tomato text-[10px] font-extrabold text-white">{index + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                  <section className={`rounded-2xl p-4 ring-1 ${experience.badgeClassName}`}>
                    <h3 className="flex items-center gap-2 text-sm font-extrabold">
                      <span aria-hidden="true">{experience.marker}</span>
                      {experience.label} notes
                    </h3>
                    <ul className="mt-2 grid gap-2 text-sm leading-6">
                      {path.levelNotes[experienceLevel].map((note) => (
                        <li key={note} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="grid gap-2 border-t border-ink/10 p-5">
                  <Link href={calculatorHref} className="rounded-2xl bg-tomato px-4 py-3 text-center text-sm font-extrabold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98]">
                    {path.primaryCta} →
                  </Link>
                  <Link href={plannerHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98]">
                    {path.secondaryCta} →
                  </Link>
                  <Link href={doctorHref} className="rounded-2xl border border-leaf/15 bg-leaf/[.07] px-4 py-3 text-center text-sm font-bold text-leaf transition hover:border-leaf/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[.98]">
                    If something goes wrong, open Dough Doctor →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 rounded-[1.75rem] bg-ink p-5 text-white shadow-card sm:p-7">
          <h2 className="font-display text-3xl font-semibold">This is not a separate calculator.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            Start Here chooses a safe pizza goal first, then sends that setup into the same DoughTools calculator,
            Planner and troubleshooting workflow. The dough formulas stay the same; the starting path is simply calmer.
          </p>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
