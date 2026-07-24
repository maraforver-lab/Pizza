"use client";

import { useEffect, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import { getDefaultExperienceLevel, readExperienceLevelPreference, type ExperienceLevel } from "@/lib/experience-levels";
import { getSauceQuickAnswer } from "@/lib/sauce-page-guidance";

export default function SauceQuickAnswer() {
  const [level, setLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());

  useEffect(() => {
    setLevel(readExperienceLevelPreference());
  }, []);

  const quickAnswer = getSauceQuickAnswer(level);

  return (
    <section
      className="rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-8"
      aria-labelledby="sauce-quick-answer-title"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Quick answer</p>
        <h2 id="sauce-quick-answer-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          {quickAnswer.title}
        </h2>
        <div className="mt-4">
          <GuidanceModeBadge level={quickAnswer.level} />
        </div>
      </div>
      <div className="mt-6 lg:mt-0">
        <p className="text-base leading-8 text-ink sm:text-lg">{quickAnswer.answer}</p>
        <ul className="mt-5 grid gap-3">
          {quickAnswer.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 rounded-2xl border border-ink/10 bg-flour p-4 text-sm font-bold leading-6 text-ink">
              <DoughToolsIcon name="check" className="mt-0.5 shrink-0 text-leaf" size={20} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
