"use client";

import { useEffect, useState } from "react";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import {
  getDefaultExperienceLevel,
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";

const quickAnswerCards = [
  {
    title: "Home oven",
    icon: "oven" as DoughToolsIconName,
    answer:
      "Preheat the oven and baking surface fully. Bake in the upper half of the oven and watch whether the top or bottom needs more heat.",
    actions: [
      "Preheat the steel or stone",
      "Use the upper half of the oven",
      "Launch the pizza quickly",
      "Watch the top and bottom separately",
    ],
  },
  {
    title: "Pizza oven",
    icon: "flame" as DoughToolsIconName,
    answer:
      "Heat the oven floor fully, launch with a stable flame and turn the pizza frequently so the rim and base colour evenly.",
    actions: [
      "Check the oven floor",
      "Launch with a stable flame",
      "Turn the pizza frequently",
      "Move it to balance the bake",
    ],
  },
] as const;

const bakeManagementByLevel: Record<ExperienceLevel, { body: string; rules: readonly string[] }> = {
  beginner: {
    body:
      "Watch the pizza instead of relying only on time. If the base colours too quickly, reduce the bottom heat or move the pizza away from the hottest area. If the top stays pale, give it more top heat near the end.",
    rules: ["Check the base", "Watch the rim", "Adjust one thing at a time"],
  },
  enthusiast: {
    body:
      "Balance the bake by adjusting rack position, baking-surface heat, flame distance and turning frequency. The top and bottom rarely need exactly the same correction.",
    rules: ["Control surface heat", "Adjust top heat separately", "Turn or reposition as needed"],
  },
  pizza_nerd: {
    body:
      "Treat the bake as a heat-balance problem. Conductive heat sets the base, while radiant and convective heat finish the rim, cheese and toppings.",
    rules: ["Track deck heat", "Manage radiant exposure", "Protect thermal recovery"],
  },
};

function ActionList({ actions, dark = false }: { actions: readonly string[]; dark?: boolean }) {
  return (
    <ul className="mt-4 grid gap-2">
      {actions.map((action) => (
        <li
          key={action}
          className={`flex min-h-11 items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-bold leading-5 ${
            dark ? "border-white/10 bg-white/[.07] text-white/78" : "border-ink/10 bg-flour text-ink/74"
          }`}
        >
          <DoughToolsIcon name="check" className={`shrink-0 ${dark ? "text-oven-gold" : "text-leaf"}`} size={20} />
          <span>{action}</span>
        </li>
      ))}
    </ul>
  );
}

export default function OvensQuickAnswer() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  const selectedGuidance = getExperienceLevelConfig(experienceLevel);
  const bakeManagement = bakeManagementByLevel[selectedGuidance.id];

  return (
    <section className="mt-6 space-y-5" aria-labelledby="ovens-quick-answer-title">
      <div className="rounded-[2rem] border border-ink/10 bg-card p-5 shadow-card sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Quick answer</p>
            <h2 id="ovens-quick-answer-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
              What should I do with my oven?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/64 sm:text-base">
              Choose your oven type, preheat the baking surface fully and manage the top and bottom heat separately.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickAnswerCards.map((card) => {
              const dark = card.title === "Pizza oven";

              return (
                <article
                  key={card.title}
                  className={`rounded-[1.5rem] border p-4 shadow-sm sm:p-5 ${
                    dark ? "border-ink bg-ink text-white" : "border-ink/10 bg-cream/80 text-ink"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                        dark ? "bg-white/10 text-oven-gold" : "bg-tomato/10 text-tomato"
                      }`}
                      aria-hidden="true"
                    >
                      <DoughToolsIcon name={card.icon} size={24} />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold">{card.title}</h3>
                      <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/70" : "text-ink/64"}`}>{card.answer}</p>
                    </div>
                  </div>
                  <ActionList actions={card.actions} dark={dark} />
                </article>
              );
            })}
          </div>
        </div>

        <p className="mt-5 rounded-[1.25rem] border border-tomato/20 bg-tomato/[.06] p-4 text-sm font-extrabold leading-6 text-ink">
          The timer is only a guide. The pizza is ready when the base, rim and toppings are all properly baked.
        </p>
      </div>

      <article
        className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="ovens-bake-management-title"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Bake management</p>
            <h2 id="ovens-bake-management-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              How should I manage the bake?
            </h2>
          </div>
          <GuidanceModeBadge level={selectedGuidance.id} />
        </div>
        <div className="mt-5 rounded-[1.35rem] border border-ink/10 bg-flour/70 p-4 sm:p-5">
          <p className="text-sm font-extrabold text-ink">{selectedGuidance.label}</p>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-ink/64 sm:text-base">{bakeManagement.body}</p>
          <ActionList actions={bakeManagement.rules} />
        </div>
      </article>
    </section>
  );
}
