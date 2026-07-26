"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buttonClass, cardClass } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons/DoughToolsIcon";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  DEFAULT_EXPERIENCE_LEVEL,
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
  readExperienceLevelPreference,
} from "@/lib/experience-levels";

export type OvenAssistantPathId = "home" | "pizza" | "other";

export type OvenAssistantEquipmentItem = {
  name: string;
  use: string;
  priority: string;
  image: {
    src: string;
    alt: string;
  };
};

type OvenAssistantProps = {
  compactEquipment: Record<OvenAssistantPathId, OvenAssistantEquipmentItem[]>;
};

const ovenPaths: Array<{
  id: OvenAssistantPathId;
  label: string;
  description: string;
  result: string;
  setupTitle: string;
  setup: string[];
  anchor: string;
}> = [
  {
    id: "home",
    label: "Home oven",
    description: "For a conventional oven using a steel, stone or tray.",
    result:
      "Expect a steadier bake with more time for the top and base to catch up.",
    setupTitle: "Recommended home-oven setup",
    setup: [
      "Use the highest safe heat your oven can hold.",
      "Preheat the steel, stone or tray thoroughly.",
      "Start in the upper half of the oven.",
      "Watch the base colour and use top heat only when needed.",
    ],
    anchor: "#home-oven-setups",
  },
  {
    id: "pizza",
    label: "Pizza oven",
    description: "For high-heat ovens with a hot floor and dome heat.",
    result:
      "Expect a faster bake where launching, turning and heat balance matter most.",
    setupTitle: "Recommended pizza-oven setup",
    setup: [
      "Let the floor and dome heat stabilize before launching.",
      "Launch cleanly onto the hot floor.",
      "Turn the pizza as the near side colours.",
      "Finish when the base, rim and top are balanced.",
    ],
    anchor: "#pizza-oven-setup",
  },
  {
    id: "other",
    label: "Closest other setup",
    description: "For grills, compact ovens or unfamiliar equipment.",
    result:
      "Choose the path closest to your heat source, then adjust with the same setup checks.",
    setupTitle: "Choose the closest practical path",
    setup: [
      "Use the home-oven path for enclosed, lower-heat setups.",
      "Use the pizza-oven path for very hot floor-and-dome setups.",
      "Preheat fully before judging the bake.",
      "Use the troubleshooting checks when the top and base finish unevenly.",
    ],
    anchor: "#oven-comparison",
  },
];

const bakeSteps: Array<{
  title: string;
  body: string;
  icon: "checklist" | "timer" | "pizza" | "thermometer";
}> = [
  {
    title: "Set up",
    body: "Choose the surface and rack or floor position that matches your oven.",
    icon: "checklist",
  },
  {
    title: "Preheat",
    body: "Give the baking surface enough time to store useful heat.",
    icon: "timer",
  },
  {
    title: "Launch",
    body: "Move quickly and keep the pizza shape intact as it hits the heat.",
    icon: "pizza",
  },
  {
    title: "Turn and finish",
    body: "Balance the base, rim and top instead of chasing one perfect number.",
    icon: "thermometer",
  },
];

const bakeManagementByLevel: Record<
  ExperienceLevel,
  { title: string; body: string; bullets: string[] }
> = {
  beginner: {
    title: "Keep the first bake simple",
    body: "Pick the closest oven path, preheat well and watch whether the base or top finishes first.",
    bullets: [
      "Use one reliable surface.",
      "Avoid constant changes during the bake.",
      "Adjust the next pizza based on what browned first.",
    ],
  },
  enthusiast: {
    title: "Tune heat and timing together",
    body: "Use the same setup for a few bakes, then adjust rack position, top heat or turning rhythm when the result points to a clear change.",
    bullets: [
      "Track whether the base, rim or toppings lag behind.",
      "Let the surface recover between pizzas.",
      "Use tools when they clarify the decision.",
    ],
  },
  pizza_nerd: {
    title: "Balance stored heat, top heat and recovery",
    body: "Treat the oven as a heat system: surface temperature, air heat, dome or broiler intensity and recovery time all shape the final bake.",
    bullets: [
      "Measure the floor or surface before launching.",
      "Control recovery between pizzas.",
      "Match hydration and toppings to the oven's heat delivery.",
    ],
  },
};

function getExperienceLevel(id: ExperienceLevel) {
  return EXPERIENCE_LEVELS.find((level) => level.id === id) ?? EXPERIENCE_LEVELS[0];
}

export function OvenAssistant({ compactEquipment }: OvenAssistantProps) {
  const [selectedPath, setSelectedPath] = useState<OvenAssistantPathId>("home");
  const [selectedGuidance, setSelectedGuidance] =
    useState<ExperienceLevel>(DEFAULT_EXPERIENCE_LEVEL);

  useEffect(() => {
    setSelectedGuidance(readExperienceLevelPreference());
  }, []);

  const path = useMemo(
    () => ovenPaths.find((item) => item.id === selectedPath) ?? ovenPaths[0],
    [selectedPath],
  );
  const guidance = getExperienceLevel(selectedGuidance);
  const bakeManagement = bakeManagementByLevel[selectedGuidance];
  const relevantEquipment = compactEquipment[selectedPath] ?? [];

  return (
    <section
      aria-labelledby="oven-assistant-heading"
      className={cardClass({
        variant: "guidance",
        className: "space-y-6 p-5 sm:p-6 lg:p-7",
      })}
    >
      <div className="max-w-3xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dt-primary">
          Oven assistant
        </p>
        <h2
          id="oven-assistant-heading"
          className="font-display text-2xl font-semibold text-dt-ink sm:text-3xl"
        >
          What oven do you use?
        </h2>
        <p className="text-sm leading-6 text-dt-muted sm:text-base">
          Pick the closest path first. The setup, bake rhythm and most useful
          tools change depending on how your oven delivers heat.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3" role="group" aria-label="Choose oven path">
        {ovenPaths.map((item) => {
          const selected = selectedPath === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedPath(item.id)}
              className={[
                "rounded-dt-md border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dt-primary",
                selected
                  ? "border-dt-primary bg-dt-primary-soft text-dt-ink shadow-dt-soft"
                  : "border-dt-border bg-white text-dt-ink hover:border-dt-primary/50 hover:bg-dt-cream-50",
              ].join(" ")}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="space-y-1">
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span className="block text-sm leading-5 text-dt-muted">
                    {item.description}
                  </span>
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                    selected
                      ? "bg-white text-dt-primary"
                      : "bg-dt-cream-100 text-dt-muted",
                  ].join(" ")}
                >
                  {selected ? "Selected" : "Choose"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
        <article className="rounded-dt-md border border-dt-border bg-white p-4 shadow-dt-soft sm:p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dt-primary-soft text-dt-primary"
            >
              <DoughToolsIcon name="oven" className="h-5 w-5" />
            </span>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dt-primary">
                  Recommended setup
                </p>
                <h3 className="font-display text-xl font-semibold text-dt-ink">
                  {path.setupTitle}
                </h3>
                <p className="mt-1 text-sm leading-6 text-dt-muted">{path.result}</p>
              </div>
              <ul className="grid gap-2 text-sm leading-6 text-dt-ink sm:grid-cols-2">
                {path.setup.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-dt-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={path.anchor}
                className="inline-flex text-sm font-semibold text-dt-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dt-primary"
              >
                Jump to the matching setup
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-dt-md border border-dt-border bg-dt-cream-50 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <GuidanceModeBadge level={guidance.id} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dt-muted">
              Guidance depth
            </span>
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-dt-ink">
            {bakeManagement.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-dt-muted">{bakeManagement.body}</p>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-dt-ink">
            {bakeManagement.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-dt-accent" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-dt-ink">
              Useful tools for this path
            </h3>
            <p className="text-sm leading-6 text-dt-muted">
              Start with the tools that clarify heat and handling for the oven
              you selected.
            </p>
          </div>
          <a
            href="#other-equipment"
            className="text-sm font-semibold text-dt-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dt-primary"
          >
            View all equipment
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {relevantEquipment.map((item) => (
            <article
              key={item.name}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 rounded-dt-md border border-dt-border bg-white p-3"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-dt-sm bg-dt-cream-100">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  width={120}
                  height={90}
                  sizes="4.5rem"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dt-primary">
                  {item.priority}
                </p>
                <h4 className="text-sm font-semibold text-dt-ink">{item.name}</h4>
                <p className="text-xs leading-5 text-dt-muted">{item.use}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-dt-border pt-5">
        <h3 className="font-display text-xl font-semibold text-dt-ink">
          Practical bake guidance
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bakeSteps.map((step, index) => (
            <article key={step.title} className="flex gap-3 rounded-dt-sm bg-white/70 p-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dt-cream-100 text-dt-primary"
              >
                <DoughToolsIcon name={step.icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dt-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h4 className="text-sm font-semibold text-dt-ink">{step.title}</h4>
                <p className="mt-1 text-xs leading-5 text-dt-muted">{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-dt-md bg-dt-primary p-4 text-white sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold">
            Plan with the oven you actually have.
          </h3>
          <p className="mt-1 text-sm leading-6 text-white/80">
            Pizza Plan uses your oven choice for preheat timing, baking rhythm
            and kitchen guidance.
          </p>
        </div>
        <Link
          href="/session/start"
          className={buttonClass({
            variant: "secondary",
            className: "mt-4 shrink-0 sm:mt-0",
          })}
        >
          Plan a pizza
        </Link>
      </div>
    </section>
  );
}
