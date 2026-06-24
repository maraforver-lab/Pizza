"use client";

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

const selectorAccentClasses: Record<ExperienceLevel, { card: string; badge: string; dot: string }> = {
  beginner: {
    card: "border-leaf/35 bg-leaf/[.06]",
    badge: "bg-leaf/10 text-leaf ring-leaf/20",
    dot: "bg-leaf",
  },
  intermediate: {
    card: "border-tomato/35 bg-tomato/[.06]",
    badge: "bg-tomato/10 text-tomato ring-tomato/20",
    dot: "bg-tomato",
  },
  advanced: {
    card: "border-[#5d3025]/35 bg-[#5d3025]/[.06]",
    badge: "bg-[#5d3025]/10 text-[#5d3025] ring-[#5d3025]/20",
    dot: "bg-[#5d3025]",
  },
};

export function GuidanceModeBadge({ level, className = "" }: { level: ExperienceLevel; className?: string }) {
  const config = getExperienceLevelConfig(level);
  const classes = selectorAccentClasses[config.id];

  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${classes.badge} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${classes.dot}`} aria-hidden="true" />
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

  const selectLevel = (level: ExperienceLevel) => {
    const saved = writeExperienceLevelPreference(level);
    onChange(saved);
  };

  return (
    <section className={`rounded-[1.75rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-tomato">Experience level</p>
          <h2 className={`${compact ? "mt-1 text-xl" : "mt-2 text-2xl"} font-display font-semibold text-ink`}>{title}</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/55 sm:text-sm sm:leading-6">{intro}</p>
        </div>
        <GuidanceModeBadge level={selected.id} />
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "sm:grid-cols-3" : "md:grid-cols-3"}`}>
        {EXPERIENCE_LEVELS.map((level) => {
          const active = level.id === selected.id;
          const classes = selectorAccentClasses[level.id];

          return (
            <button
              key={level.id}
              type="button"
              onClick={() => selectLevel(level.id)}
              aria-pressed={active}
              className={`min-h-24 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                active ? `${classes.card} shadow-sm` : "border-ink/10 bg-cream/40 hover:border-tomato/30"
              }`}
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ${active ? classes.badge : "bg-ink/[.04] text-ink/45 ring-ink/10"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${classes.dot}`} aria-hidden="true" />
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
