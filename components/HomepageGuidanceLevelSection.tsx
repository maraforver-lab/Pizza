"use client";

import { useEffect, useState } from "react";
import {
  EXPERIENCE_LEVELS,
  getDefaultExperienceLevel,
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
  writeExperienceLevelPreference,
} from "@/lib/experience-levels";

export default function HomepageGuidanceLevelSection() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  function handleChange(level: ExperienceLevel) {
    setExperienceLevel(writeExperienceLevelPreference(level));
  }

  return (
    <section aria-labelledby="homepage-experience-level-heading" className="w-full">
      <p id="homepage-experience-level-heading" className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">Experience level</p>
      <div className="mt-3 rounded-[1.35rem] border border-white/75 bg-white/75 p-2 shadow-card backdrop-blur-md">
        <div className="grid grid-cols-3 gap-2">
          {EXPERIENCE_LEVELS.map((level) => {
            const selected = experienceLevel === level.id;
            const config = getExperienceLevelConfig(level.id);

            return (
              <button
                key={level.id}
                type="button"
                aria-pressed={selected}
                data-experience-level={level.id}
                data-selected={selected}
                onClick={() => handleChange(level.id)}
                className={`flex min-h-16 items-center justify-center gap-2 rounded-2xl border px-2.5 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:gap-3 sm:px-4 ${
                  selected
                    ? `${config.cardClassName} text-ink shadow-sm`
                    : "border-transparent bg-white/45 text-ink/75 hover:border-ink/10 hover:bg-white/75"
                }`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-sm text-ink/60" aria-hidden="true">
                  <span
                    data-active-indicator={selected}
                    className={`h-3 w-3 rounded-full transition ${
                      selected ? config.markerClassName : "bg-ink/15"
                    }`}
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold leading-tight text-ink sm:text-base">
                    {level.label}
                  </span>
                  <span className="sr-only">{level.description}</span>
                  {selected ? (
                    <span className="mt-1 block text-[0.65rem] font-extrabold uppercase tracking-[.18em] text-tomato">Selected</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
