"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import { DoughToolsIcon } from "@/components/icons";
import { getDefaultExperienceLevel, readExperienceLevelPreference, type ExperienceLevel } from "@/lib/experience-levels";

type SectionIntroProps = {
  body?: string;
  eyebrow: string;
  id: string;
  title: string;
};

const moistureGuidance: Record<ExperienceLevel, { body: string; title: string }> = {
  beginner: {
    title: "Direct fix",
    body: "Use a little less sauce, drain wet mozzarella, keep toppings lighter and make sure the baking surface is properly hot.",
  },
  enthusiast: {
    title: "Practical adjustment",
    body: "When the center stays wet, reduce one moisture source at a time: sauce quantity, cheese water, topping load or weak bottom heat.",
  },
  pizza_nerd: {
    title: "Moisture-budget explanation",
    body: "Sauce water, cheese moisture, topping load, bake temperature and bake time form one moisture budget. Longer bakes and weaker bottom heat need a drier total load.",
  },
};

const applicationSteps = [
  "Stretch the dough.",
  "Place the recommended sauce amount in the centre.",
  "Spread outward with the back of a spoon in a spiral.",
  "Leave a clean 1-2 cm crust border.",
  "Keep the centre thin and even.",
];

function SectionIntro({ body, eyebrow, id, title }: SectionIntroProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
        {title}
      </h2>
      {body ? <p className="mt-4 text-sm leading-7 text-muted sm:text-base">{body}</p> : null}
    </div>
  );
}

function DoughApplicationVisual() {
  const steps = [
    { label: "Dough", sauce: "none" },
    { label: "Centre", sauce: "center" },
    { label: "Spiral", sauce: "spiral" },
    { label: "Border", sauce: "border" },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Sauce application sequence">
      {steps.map((step, index) => (
        <article key={step.label} className="rounded-2xl border border-ink/10 bg-white p-3">
          <div className="relative aspect-square overflow-hidden rounded-[1.1rem] border border-ink/10 bg-flour">
            <div className="absolute inset-[12%] rounded-full border-[12px] border-tomato/10 bg-card shadow-inner" />
            <div className="absolute inset-[21%] rounded-full border border-ink/10 bg-flour/70 shadow-inner" />
            {step.sauce === "center" ? <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-tomato shadow-soft" /> : null}
            {step.sauce === "spiral" ? (
              <div className="absolute inset-[25%] rounded-full border-[12px] border-tomato/90 ring-8 ring-inset ring-tomato/30" />
            ) : null}
            {step.sauce === "border" ? (
              <div className="absolute inset-[23%] rounded-full bg-tomato/90 shadow-inner">
                <div className="absolute inset-[14%] rounded-full border-[6px] border-tomato/50" />
              </div>
            ) : null}
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-extrabold text-ink shadow-soft">{index + 1}</span>
          </div>
          <h3 className="mt-3 text-sm font-extrabold text-ink">{step.label}</h3>
        </article>
      ))}
    </div>
  );
}

export default function SaucePracticalGuidance() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  const selectedMoistureGuidance = moistureGuidance[experienceLevel];

  return (
    <>
      <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-8" aria-labelledby="buy-tomatoes-title">
        <SectionIntro
          id="buy-tomatoes-title"
          eyebrow="Buy the tomatoes"
          title="Good canned tomatoes keep the sauce simple."
          body="Good canned whole peeled tomatoes are the easiest starting point. They provide reliable flavour and texture without requiring a complicated sauce."
        />
        <div className="mt-6 grid gap-4 lg:mt-0">
          <Image
            src="/sauce/neapolitan.webp"
            alt="Bowl of lightly crushed tomato sauce with basil and olive oil"
            width={960}
            height={600}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-auto max-w-full rounded-[1.5rem] border border-ink/10 object-cover"
            style={{ width: "100%", height: "auto" }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Best default", "Choose good canned whole peeled tomatoes first. They let you control texture and keep the flavour clean."],
              ["Crushed tomatoes", "Crushed tomatoes are acceptable when the ingredient list is simple and the product is not watery."],
              ["Avoid pasta sauce", "Heavily seasoned ready-made pasta sauces can make the pizza taste muddy or too sweet."],
              ["Drain only when needed", "Drain only when the tomatoes are unusually watery; otherwise keep the natural tomato juice in balance."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
                <h3 className="text-sm font-extrabold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="make-apply-title">
        <SectionIntro
          id="make-apply-title"
          eyebrow="Make and apply the sauce"
          title="Spread a thin layer and keep the rim clean."
          body="Crush or blend lightly, then apply a thin, even layer. The goal is coverage, not a heavy blanket of sauce."
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="rounded-[1.5rem] border border-ink/10 bg-flour p-4">
            <h3 className="text-sm font-extrabold text-ink">Application sequence</h3>
            <ol className="mt-4 grid gap-3 text-sm leading-6 text-muted">
              {applicationSteps.map((step) => (
                <li key={step} className="flex gap-3">
                  <DoughToolsIcon name="check" className="mt-0.5 shrink-0 text-leaf" size={20} />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <DoughApplicationVisual />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-leaf/25 bg-leaf/[.06] p-4">
            <Image
              src="/toppings/references/sauce-balanced.webp"
              alt="Pizza base with a thin even tomato sauce layer and a clean crust border"
              width={960}
              height={960}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto max-w-full rounded-[1.15rem] border border-ink/10 object-cover"
              style={{ width: "100%", height: "auto" }}
            />
            <h3 className="mt-4 text-sm font-extrabold text-ink">Recommended amount</h3>
            <p className="mt-2 text-sm leading-6 text-muted">A thin, even layer covers the dough while leaving a clear crust border.</p>
          </article>
          <article className="rounded-[1.5rem] border border-tomato/25 bg-tomato/[.06] p-4">
            <Image
              src="/toppings/references/sauce-heavy.webp"
              alt="Pizza base with an overly thick tomato sauce layer and visible wet areas"
              width={960}
              height={960}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto max-w-full rounded-[1.15rem] border border-ink/10 object-cover"
              style={{ width: "100%", height: "auto" }}
            />
            <h3 className="mt-4 text-sm font-extrabold text-ink">Too much sauce</h3>
            <p className="mt-2 text-sm leading-6 text-muted">A heavy layer slows the bake, can leave the centre wet and may burn during a longer bake.</p>
          </article>
        </div>
      </section>

      <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7" aria-labelledby="avoid-wet-burnt-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <SectionIntro
            id="avoid-wet-burnt-title"
            eyebrow="Avoid a wet or burnt pizza"
            title="Balance sauce, cheese, toppings and heat together."
            body="If the pizza turns wet, the problem is often the total moisture load—not only the tomatoes. Sauce, cheese and toppings all release water."
          />
          <GuidanceModeBadge level={experienceLevel} />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["Too much sauce", "Use the calculator amount first, then reduce slightly if the centre stays wet."],
            ["Wet mozzarella", "Drain or blot wet cheese so it does not add extra water over the sauce."],
            ["Overloaded toppings", "Use fewer wet toppings and keep the heaviest ingredients away from the centre."],
            ["Pale or wet centre", "Preheat the baking surface well and reduce the total wet load."],
            ["Burnt or dried sauce", "For longer bakes, keep the layer thinner and avoid smearing sauce onto the rim."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
              <h3 className="text-sm font-extrabold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
        <article className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white p-4">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">{selectedMoistureGuidance.title}</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink">{selectedMoistureGuidance.body}</p>
        </article>
        <Link
          href="/guide/pizza-troubleshooting"
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          Explore guide
        </Link>
      </section>

      <section className="mt-12 rounded-[2rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-7 lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-8" aria-labelledby="store-safely-title">
        <SectionIntro
          id="store-safely-title"
          eyebrow="Store safely"
          title="Keep extra sauce cold, covered and easy to identify."
          body="Safety guidance stays the same at every experience level: use clean storage, keep sauce cold and discard anything questionable."
        />
        <div className="mt-6 grid gap-3 lg:mt-0">
          {[
            ["Refrigerate promptly", "Move leftover sauce into a clean covered container and refrigerate it promptly."],
            ["Freeze for longer storage", "Freeze the sauce when longer storage is needed, and label it so you know what it is."],
            ["Discard unsafe sauce", "Throw it away if it has an unusual smell, mould, visible spoilage or an unsafe handling history."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-ink/10 bg-flour p-4">
              <h3 className="text-sm font-extrabold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
