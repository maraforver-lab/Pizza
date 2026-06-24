"use client";

import { useId } from "react";
import {
  EXPERIENCE_LEVELS,
  getExperienceLevelConfig,
  writeExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";

type ExperienceLevelSelectorProps = {
  value: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
  title?: string;
  intro?: string;
  compact?: boolean;
  className?: string;
};

export function GuidanceModeBadge({ level, className = "" }: { level: ExperienceLevel; className?: string }) {
  const config = getExperienceLevelConfig(level);

  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${config.badgeClassName} ${className}`}>
      <span aria-hidden="true">{config.marker}</span>
      Guidance mode: {config.label}
    </span>
  );
}

export default function ExperienceLevelSelector({
  value,
  onChange,
  title = "Choose your guidance level",
  intro = "DoughTools adapts the amount of explanation and technical detail to how you make pizza.",
  compact = false,
  className = "",
}: ExperienceLevelSelectorProps) {
  const selected = getExperienceLevelConfig(value);
  const generatedId = useId();
  const selectorId = `${generatedId}-experience-level-selector`;
  const introId = `${generatedId}-experience-level-selector-description`;

  const selectLevel = (level: ExperienceLevel) => {
    const saved = writeExperienceLevelPreference(level);
    onChange(saved);
  };

  return (
    <section
      className={`rounded-[1.75rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5 ${className}`}
      aria-labelledby={selectorId}
      aria-describedby={introId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-tomato">Experience level</p>
          <h2 id={selectorId} className={`${compact ? "mt-1 text-xl" : "mt-2 text-2xl"} font-display font-semibold text-ink`}>{title}</h2>
          <p id={introId} className="mt-2 max-w-2xl text-xs leading-5 text-ink/55 sm:text-sm sm:leading-6">{intro}</p>
        </div>
        <GuidanceModeBadge level={selected.id} />
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`} role="group" aria-label="Experience level options">
        {EXPERIENCE_LEVELS.map((level) => {
          const active = level.id === selected.id;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => selectLevel(level.id)}
              aria-pressed={active}
              aria-label={`Select ${level.label} guidance level${active ? ", currently selected" : ""}`}
              className={`min-h-24 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                active ? `${level.cardClassName} shadow-sm` : "border-ink/10 bg-cream/40 hover:border-tomato/30"
              }`}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ${active ? level.badgeClassName : "bg-ink/[.04] text-ink/45 ring-ink/10"}`} aria-label={`${level.label} marker`}>
                <span aria-hidden="true">{level.marker}</span>
              </span>
              <span className="mt-3 block text-sm font-extrabold text-ink">{level.label}</span>
              <span className="mt-1 block text-xs leading-5 text-ink/55">{level.description}</span>
              {active && <span className="mt-2 block text-[10px] font-extrabold uppercase tracking-[.14em] text-leaf">Selected</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
