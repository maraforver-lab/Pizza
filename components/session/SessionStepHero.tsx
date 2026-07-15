"use client";

import type { ReactNode } from "react";
import { StatusPill } from "@/components/design-system";
import { SessionExperienceLevelBadge } from "@/components/session/SessionExperienceLevelBadge";
import {
  getExperienceLevelCornerAccentStyle,
  type ExperienceLevel,
} from "@/lib/experience-levels";

type SessionStepHeroProps = {
  body?: ReactNode;
  children?: ReactNode;
  desktopAside?: ReactNode;
  hideMeta?: boolean;
  label: string;
  level?: ExperienceLevel;
  levelCompactOnMobile?: boolean;
  pageType: string;
  step: number;
  title: ReactNode;
};

export function SessionStepHero({
  body,
  children,
  desktopAside,
  hideMeta = false,
  label,
  level,
  levelCompactOnMobile = false,
  pageType,
  step,
  title,
}: SessionStepHeroProps) {
  const levelAccent = level ? getExperienceLevelCornerAccentStyle(level) : undefined;
  const showMetaRow = !hideMeta || Boolean(level);

  return (
    <section
      aria-labelledby="session-step-heading"
      className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7 lg:p-8"
      style={levelAccent}
    >
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:justify-between">
        <div className="min-w-0">
          {showMetaRow && (
            <div className="flex flex-wrap gap-2">
              {!hideMeta && (
                <>
                  <StatusPill className="bg-tomato/10 text-tomato">Step {step} of 10</StatusPill>
                  <StatusPill className="hidden sm:inline-flex">{label}</StatusPill>
                  <StatusPill className="hidden sm:inline-flex">{pageType}</StatusPill>
                </>
              )}
              {level && levelCompactOnMobile ? (
                <>
                  <SessionExperienceLevelBadge level={level} compact className="sm:hidden" />
                  <SessionExperienceLevelBadge level={level} className="hidden sm:inline-flex" />
                </>
              ) : (
                level && <SessionExperienceLevelBadge level={level} />
              )}
            </div>
          )}
          <h1 id="session-step-heading" className={`${showMetaRow ? "mt-4" : ""} max-w-3xl font-display text-3xl font-semibold leading-none sm:text-6xl`}>
            {title}
          </h1>
          {body && <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/60 sm:mt-4 sm:text-base sm:leading-6">{body}</p>}
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
