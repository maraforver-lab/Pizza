"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import {
  pizzaStyleEducationById,
  type PizzaStyleEducationId,
} from "@/lib/pizza-style-education";

type StyleRecommendation = {
  styleId: PizzaStyleEducationId;
  reason: string;
};

type StyleGoal = {
  id: string;
  label: string;
  helper: string;
  recommendations: readonly StyleRecommendation[];
};

const styleGoals = [
  {
    id: "soft-airy",
    label: "Soft and airy",
    helper: "Light rim, soft center and fast bake.",
    recommendations: [
      { styleId: "neapolitan", reason: "Soft, light and currently supported in Pizza Plan." },
      { styleId: "contemporary-neapolitan", reason: "A more expressive airy rim for high-heat learning." },
    ],
  },
  {
    id: "crisp-foldable",
    label: "Crisp and foldable",
    helper: "A slice that bends without falling apart.",
    recommendations: [
      { styleId: "new-york", reason: "Built for foldable slices, crisp underside and moderate toppings." },
    ],
  },
  {
    id: "thin-crisp",
    label: "Thin and crisp",
    helper: "Low edge, light toppings and a snappy base.",
    recommendations: [
      { styleId: "roman-tonda", reason: "Very thin, crisp and suited to stone or steel baking." },
    ],
  },
  {
    id: "pan-pizza",
    label: "Pan pizza",
    helper: "Oil, pan heat and more structure.",
    recommendations: [
      { styleId: "detroit", reason: "Crisp cheese edges and an airy pan crumb." },
      { styleId: "roman-al-taglio", reason: "Airy tray pizza with a crisp sheet-pan base." },
      { styleId: "sicilian", reason: "Thick bakery-style squares for sharing." },
    ],
  },
  {
    id: "large-sharing",
    label: "Large sharing pizza",
    helper: "Bigger formats for slicing and serving.",
    recommendations: [
      { styleId: "new-york", reason: "Large round pie made for shared slices." },
      { styleId: "roman-al-taglio", reason: "Tray format that serves well by the piece." },
      { styleId: "sicilian", reason: "Thicker square slices that hold up for a group." },
    ],
  },
  {
    id: "home-oven",
    label: "Easiest home-oven fit",
    helper: "Styles that adapt well to practical home heat.",
    recommendations: [
      { styleId: "new-york", reason: "Works well with a strong home oven, steel or stone." },
      { styleId: "detroit", reason: "Pan heat helps a home oven produce crisp texture." },
      { styleId: "roman-tonda", reason: "Thin and crisp goals are realistic with stone or steel." },
    ],
  },
] as const satisfies readonly StyleGoal[];

const supportNotice =
  "DoughTools Pizza Plans currently support Neapolitan-style pizza. Other styles are learning references unless specifically marked otherwise.";

function styleById(id: PizzaStyleEducationId) {
  return pizzaStyleEducationById(id);
}

function RecommendationCard({
  recommendation,
  selected,
  onSelect,
}: {
  recommendation: StyleRecommendation;
  selected: boolean;
  onSelect: () => void;
}) {
  const style = styleById(recommendation.styleId);
  const image = style.image;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid min-h-full gap-3 rounded-[1.2rem] border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:grid-cols-[6rem_minmax(0,1fr)] ${
        selected ? "border-tomato bg-white shadow-card" : "border-ink/10 bg-white/78 hover:border-tomato/30 hover:bg-white"
      }`}
      aria-pressed={selected}
      aria-label={`Inspect ${style.name} details`}
    >
      <span className="relative block aspect-square overflow-hidden rounded-[.9rem] bg-flour">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 640px) 34vw, 8rem"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-tomato" aria-hidden="true">
            <DoughToolsIcon name={style.icon} size={32} />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-extrabold text-ink">{style.shortName}</span>
          {selected ? <span className="rounded-full bg-tomato px-2 py-1 text-[11px] font-extrabold text-white">Selected</span> : null}
        </span>
        <span className="mt-1 block text-sm leading-6 text-ink/62">{recommendation.reason}</span>
        <span className="mt-2 block text-xs font-bold leading-5 text-ink/55">{style.ovenEnvironment}</span>
        <span className="mt-3 inline-flex text-sm font-extrabold text-tomato">Inspect style details</span>
      </span>
    </button>
  );
}

function SelectedStyleDetail({ styleId }: { styleId: PizzaStyleEducationId }) {
  const style = styleById(styleId);
  const image = style.image;
  const supported = style.support === "supported";

  return (
    <section
      className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm lg:grid lg:grid-cols-[minmax(16rem,.72fr)_minmax(0,1fr)] lg:gap-5 lg:p-5"
      aria-labelledby="selected-style-title"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-[1.15rem] bg-flour">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 1023px) 92vw, 34vw"
            className="aspect-[4/3] h-auto w-full object-cover lg:aspect-square"
          />
        ) : (
          <div className="grid aspect-[4/3] place-items-center text-tomato lg:aspect-square" aria-hidden="true">
            <DoughToolsIcon name={style.icon} size={32} />
          </div>
        )}
      </div>

      <div className="mt-4 lg:mt-0">
        <div className="flex flex-wrap items-center gap-2">
          <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
          <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">{style.origin}</span>
        </div>
        <h3 id="selected-style-title" className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {style.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-ink/64">{style.description}</p>

        <dl className="mt-4 grid gap-0 text-sm">
          {([
            ["Result", style.eatingExperience],
            ["Oven fit", style.ovenEnvironment],
            ["Crust and shape", `${style.shape} · ${style.thickness}`],
            ["Bake behavior", style.bakeStyle],
            ["Sauce and toppings", `${style.sauceTreatment} · ${style.toppingDensity}`],
          ] as const).map(([label, value]) => (
            <div key={label} className="grid gap-1 border-t border-ink/10 py-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/42">{label}</dt>
              <dd className="leading-5 text-ink/68">{value}</dd>
            </div>
          ))}
        </dl>

        {supported ? (
          <Link
            href="/session/start"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
          >
            Plan a Neapolitan-style pizza
          </Link>
        ) : (
          <p className="mt-4 rounded-[1rem] border border-ink/10 bg-flour/70 px-4 py-3 text-sm font-bold leading-6 text-ink/62">
            Use this as a learning reference. DoughTools does not yet create a full Pizza Plan for this style.
          </p>
        )}

        <details className="mt-4 rounded-[1rem] border border-ink/10 bg-flour/70">
          <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            View deeper style details
          </summary>
          <div className="border-t border-ink/10 px-4 pb-4 pt-3 text-sm leading-6 text-ink/64">
            <p>{style.whyItBehaves}</p>
            <p className="mt-3">
              <strong className="text-ink">Common confusion:</strong> {style.commonConfusion}
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}

export default function PizzaStyleAssistant() {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(styleGoals[0].id);
  const selectedGoal = styleGoals.find((goal) => goal.id === selectedGoalId) ?? styleGoals[0];
  const [selectedStyleId, setSelectedStyleId] = useState<PizzaStyleEducationId>(selectedGoal.recommendations[0].styleId);

  function selectGoal(goal: StyleGoal) {
    setSelectedGoalId(goal.id);
    setSelectedStyleId(goal.recommendations[0].styleId);
  }

  return (
    <section className="mt-5 rounded-[1.75rem] border border-ink/10 bg-flour/72 p-4 shadow-card sm:p-6 lg:p-7" aria-labelledby="style-assistant-title">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Style assistant</p>
          <h2 id="style-assistant-title" className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            What kind of pizza do you want to make?
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Start with the eating result, then compare the styles that fit your oven and goal.
          </p>
          <p className="mt-4 rounded-[1rem] border border-leaf/20 bg-white/72 px-4 py-3 text-sm font-bold leading-6 text-forest">
            <DoughToolsIcon name="information" size={20} className="mr-2 inline align-[-4px]" aria-hidden="true" />
            {supportNotice}
          </p>

          <div className="mt-4 grid gap-2" role="radiogroup" aria-label="Pizza style goal">
            {styleGoals.map((goal) => {
              const selected = goal.id === selectedGoal.id;

              return (
                <button
                  key={goal.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectGoal(goal)}
                  className={`rounded-[1rem] border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                    selected ? "border-tomato bg-white shadow-sm" : "border-ink/10 bg-white/62 hover:border-tomato/30 hover:bg-white"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-extrabold text-ink">{goal.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-ink/55">{goal.helper}</span>
                    </span>
                    <span className={`mt-0.5 rounded-full px-2 py-1 text-[11px] font-extrabold ${selected ? "bg-tomato text-white" : "bg-flour text-ink/50"}`}>
                      {selected ? "Selected" : "Choose"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Recommendation</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">Styles that fit this goal</h3>
          </div>

          <div className="grid gap-3">
            {selectedGoal.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.styleId}
                recommendation={recommendation}
                selected={recommendation.styleId === selectedStyleId}
                onSelect={() => setSelectedStyleId(recommendation.styleId)}
              />
            ))}
          </div>

          <SelectedStyleDetail styleId={selectedStyleId} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-3">
        {([
          ["Dough and fermentation", "Hydration, dough-ball size and fermentation change with the style."],
          ["Oven and bake", "Heat, surface and bake time shape the result more than the name alone."],
          ["Sauce and toppings", "Moisture and topping load need to match the crust and bake."],
        ] as const).map(([title, body]) => (
          <article key={title} className="rounded-[1rem] border border-ink/10 bg-white/70 p-4">
            <h3 className="text-sm font-extrabold text-ink">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-ink/60">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export { styleGoals };
