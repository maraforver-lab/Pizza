"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXPERIENCE_LEVELS,
  getDefaultExperienceLevel,
  readExperienceLevelPreference,
  type ExperienceLevel,
  writeExperienceLevelPreference,
} from "@/lib/experience-levels";

const ACTIVE_DOT_CLASS = "bg-leaf shadow-[0_0_0_3px_rgba(58,163,106,0.18)]";
const selectedCardClassByLevel: Record<ExperienceLevel, string> = {
  beginner: "border-leaf/35 bg-leaf/[.07]",
  enthusiast: "border-[#f2a15f]/35 bg-[#f2a15f]/[.08]",
  pizza_nerd: "border-[#eb577f]/30 bg-[#eb577f]/[.07]",
};

export default function HomepageGuidanceLevelSection() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());
  const hasUserSelectedLevel = useRef(false);

  useEffect(() => {
    if (hasUserSelectedLevel.current) return;
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  function handleChange(level: ExperienceLevel) {
    hasUserSelectedLevel.current = true;
    setExperienceLevel(writeExperienceLevelPreference(level));
  }

  return (
    <section aria-labelledby="homepage-experience-level-heading" className="w-full">
      <p id="homepage-experience-level-heading" className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">Experience level</p>
      <div className="mt-3 rounded-[1.35rem] border border-white/75 bg-white/75 p-2 shadow-card backdrop-blur-md">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {EXPERIENCE_LEVELS.map((level) => {
            const selected = experienceLevel === level.id;

            return (
              <button
                key={level.id}
                type="button"
                aria-pressed={selected}
                data-experience-level={level.id}
                data-selected={selected}
                onClick={() => handleChange(level.id)}
                className={`flex min-h-14 items-center justify-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:min-h-16 sm:justify-center ${
                  selected
                    ? `${selectedCardClassByLevel[level.id]} text-ink shadow-sm`
                    : "border-transparent bg-white/45 text-ink/75 hover:border-ink/10 hover:bg-white/75"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                    selected ? "border-leaf/15 bg-white" : "border-ink/10 bg-white/65"
                  }`}
                  aria-hidden="true"
                >
                  <span
                    data-active-indicator={selected}
                    className={`h-3 w-3 rounded-full transition ${
                      selected ? `${ACTIVE_DOT_CLASS} opacity-100 scale-100` : "scale-0 bg-transparent opacity-0"
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
