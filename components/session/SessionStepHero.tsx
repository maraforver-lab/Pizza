"use client";

import type { ReactNode } from "react";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import { StatusPill } from "@/components/design-system";
import type { ExperienceLevel } from "@/lib/experience-levels";

type SessionStepHeroProps = {
  body: ReactNode;
  children?: ReactNode;
  desktopAside?: ReactNode;
  label: string;
  level?: ExperienceLevel;
  pageType: string;
  step: number;
  title: ReactNode;
};

export function SessionStepHero({
  body,
  children,
  desktopAside,
  label,
  level,
  pageType,
  step,
  title,
}: SessionStepHeroProps) {
  return (
    <section
      aria-labelledby="session-step-heading"
      className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7 lg:p-8"
    >
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusPill className="bg-tomato/10 text-tomato">Step {step} of 10</StatusPill>
            <StatusPill className="hidden sm:inline-flex">{label}</StatusPill>
            <StatusPill className="hidden sm:inline-flex">{pageType}</StatusPill>
            {level && <GuidanceModeBadge level={level} className="hidden sm:inline-flex" />}
          </div>
          <p className="mt-4 hidden text-xs font-extrabold uppercase tracking-[.22em] text-tomato sm:block">Pizza Session V2</p>
          <h1 id="session-step-heading" className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-none sm:text-6xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/60 sm:mt-4 sm:text-base sm:leading-6">{body}</p>
          {children && <div className="mt-4 sm:mt-5">{children}</div>}
        </div>
        {desktopAside && (
          <aside className="hidden rounded-2xl bg-cream/80 p-4 text-sm leading-6 text-ink/60 lg:block">
            {desktopAside}
          </aside>
        )}
      </div>
    </section>
  );
}
