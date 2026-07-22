"use client";

import { useEffect, useState } from "react";
import ExperienceLevelSelector, { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  getDefaultExperienceLevel,
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";

type AccountGuidancePreferenceProps = {
  className?: string;
};

export function AccountGuidancePreference({ className = "" }: AccountGuidancePreferenceProps) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());
  const [expanded, setExpanded] = useState(false);
  const selected = getExperienceLevelConfig(experienceLevel);

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  return (
    <section
      className={`rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 ${className}`}
      aria-labelledby="account-guidance-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Guidance level</p>
          <h2 id="account-guidance-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            {selected.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Controls how much explanation DoughTools shows in guided workflows.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <GuidanceModeBadge level={selected.id} />
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="account-guidance-selector"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-cream/65 px-4 text-xs font-extrabold text-ink/70 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {expanded ? "Close guidance options" : "Change guidance level"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div id="account-guidance-selector" className="mt-4">
          <ExperienceLevelSelector
            value={experienceLevel}
            onChange={setExperienceLevel}
            compact
            title="Choose account guidance"
            intro="This preference is shared with pizza plans, guides and calculators. It changes explanation depth, not the calculations."
            className="border-ink/10 bg-cream/45 shadow-none"
          />
        </div>
      ) : null}
    </section>
  );
}
