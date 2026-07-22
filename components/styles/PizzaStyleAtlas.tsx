"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import {
  pizzaStyleEducation,
  type PizzaStyleCallout,
  type PizzaStyleEducation,
} from "@/lib/pizza-style-education";

const technicalGroups = [
  {
    title: "Structure",
    fields: [
      ["Shape", "shape"],
      ["Thickness", "thickness"],
      ["Edge", "edge"],
      ["Interior", "interior"],
      ["Base", "base"],
    ],
  },
  {
    title: "Heat and bake",
    fields: [
      ["Surface", "bakingSurface"],
      ["Oven", "ovenEnvironment"],
      ["Bake style", "bakeStyle"],
    ],
  },
  {
    title: "Sauce, cheese and toppings",
    fields: [
      ["Sauce", "sauceTreatment"],
      ["Cheese", "cheeseTreatment"],
      ["Topping density", "toppingDensity"],
    ],
  },
] as const satisfies readonly {
  title: string;
  fields: readonly (readonly [string, keyof PizzaStyleEducation])[];
}[];

function fallbackVisual(style: PizzaStyleEducation) {
  return (
    <div className="grid aspect-square place-items-center rounded-[1.5rem] bg-flour text-center">
      <div className="max-w-[14rem] px-5">
        <DoughToolsIcon name={style.icon} size={32} className="mx-auto text-tomato" />
        <p className="mt-4 text-sm font-extrabold text-ink">{style.shortName}</p>
        <p className="mt-2 text-xs leading-5 text-ink/55">{style.shape}</p>
      </div>
    </div>
  );
}

function StyleImage({ style, priority = false }: { style: PizzaStyleEducation; priority?: boolean }) {
  if (!style.image) return fallbackVisual(style);

  return (
    <Image
      src={style.image.src}
      alt={style.image.alt}
      width={style.image.width}
      height={style.image.height}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      className="aspect-square h-auto w-full object-cover"
    />
  );
}

function AnnotationLayer({ callouts }: { callouts: readonly PizzaStyleCallout[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {callouts.map((callout) => (
          <line
            key={`${callout.id}-line`}
            x1={callout.anchorX}
            y1={callout.anchorY}
            x2={callout.labelX}
            y2={callout.labelY}
            className="stroke-oven-gold/80"
            strokeWidth="0.35"
          />
        ))}
        {callouts.map((callout) => (
          <circle key={`${callout.id}-anchor`} cx={callout.anchorX} cy={callout.anchorY} r="1.1" className="fill-forest stroke-white" strokeWidth="0.45" />
        ))}
      </svg>
      {callouts.map((callout) => (
        <span
          key={callout.id}
          className={`absolute max-w-[10rem] rounded-full border border-white/70 bg-white/88 px-3 py-1.5 text-[11px] font-extrabold leading-4 text-ink shadow-card backdrop-blur ${
            callout.alignment === "right" ? "text-right" : "text-left"
          }`}
          style={{ left: `${callout.labelX}%`, top: `${callout.labelY}%`, transform: callout.alignment === "right" ? "translate(-100%, -50%)" : "translate(0, -50%)" }}
        >
          {callout.label}
        </span>
      ))}
    </div>
  );
}

function SupportAction({ style }: { style: PizzaStyleEducation }) {
  if (style.support === "supported") {
    return (
      <Link
        href="/session/start"
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
      >
        Plan a pizza
      </Link>
    );
  }

  return (
    <p className="rounded-2xl border border-ink/10 bg-flour/70 px-4 py-3 text-sm font-bold leading-6 text-ink/60">
      This is an educational style guide. DoughTools does not generate a separate pizza plan for this style yet.
    </p>
  );
}

function StyleDetailDialog({ onClose, style }: { onClose: () => void; style: PizzaStyleEducation }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-2 backdrop-blur-sm sm:p-4 lg:items-center" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${style.id}-dialog-title`}
        className="max-h-[calc(100vh-1rem)] w-full max-w-6xl overflow-y-auto rounded-[2rem] bg-warm-background shadow-overlay"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,.95fr)]">
          <div className="relative bg-ink">
            <div className="overflow-hidden rounded-t-[2rem] lg:rounded-l-[2rem] lg:rounded-r-none">
              <StyleImage style={style} priority />
            </div>
            <AnnotationLayer callouts={style.callouts} />
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
                  <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">{style.origin}</span>
                </div>
                <h2 id={`${style.id}-dialog-title`} className="mt-4 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  {style.name}
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink transition hover:bg-flour focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                aria-label="Close style detail"
              >
                <DoughToolsIcon name="close" size={20} />
              </button>
            </div>

            <p className="mt-4 text-base leading-7 text-ink/68">{style.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] bg-white p-4">
                <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">What you see</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/65">
                  {style.whatYouSee.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.25rem] bg-white p-4">
                <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">What you feel</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/65">
                  {style.whatYouFeel.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <section className="mt-5 rounded-[1.35rem] bg-forest-dark p-5 text-white" aria-labelledby={`${style.id}-why-title`}>
              <h3 id={`${style.id}-why-title`} className="flex items-center gap-2 text-sm font-extrabold">
                <DoughToolsIcon name="information" size={20} />
                Why it behaves this way
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/72">{style.whyItBehaves}</p>
            </section>

            <div className="mt-5 grid gap-3">
              {technicalGroups.map((group) => (
                <section key={group.title} className="rounded-[1.35rem] border border-ink/10 bg-white p-4" aria-labelledby={`${style.id}-${group.title.replaceAll(" ", "-")}`}>
                  <h3 id={`${style.id}-${group.title.replaceAll(" ", "-")}`} className="text-sm font-extrabold text-ink">{group.title}</h3>
                  <dl className="mt-3 grid gap-3">
                    {group.fields.map(([label, field]) => (
                      <div key={field} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
                        <dt className="text-xs font-extrabold uppercase tracking-[.12em] text-ink/38">{label}</dt>
                        <dd className="text-sm leading-6 text-ink/66">{String(style[field])}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <section className="rounded-[1.25rem] border border-ink/10 bg-white p-4">
                <h3 className="text-sm font-extrabold">Typical build</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/62">
                  {style.typicalBuild.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-[1.25rem] border border-ink/10 bg-white p-4">
                <h3 className="text-sm font-extrabold">Best suited for</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/62">
                  {style.bestSuitedFor.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <details className="mt-5 rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4">
              <summary className="cursor-pointer text-sm font-extrabold text-ink">Common confusion</summary>
              <p className="mt-3 text-sm leading-6 text-ink/65">{style.commonConfusion}</p>
            </details>

            <div className="mt-6">
              <SupportAction style={style} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StyleCard({ onExplore, style }: { onExplore: (style: PizzaStyleEducation) => void; style: PizzaStyleEducation }) {
  return (
    <article id={style.id} className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-card" aria-labelledby={`${style.id}-card-title`}>
      <button
        type="button"
        onClick={() => onExplore(style)}
        className="group block w-full overflow-hidden bg-ink text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-tomato"
        aria-label={`Compare ${style.name}`}
      >
        <StyleImage style={style} />
        <span className="sr-only">Open style detail</span>
      </button>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
          <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">{style.origin}</span>
        </div>
        <h3 id={`${style.id}-card-title`} className="mt-4 font-display text-3xl font-semibold text-ink">
          {style.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-ink/62">{style.description}</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${style.name} key traits`}>
          {style.galleryTraits.map((trait) => (
            <li key={trait} className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/60">
              {trait}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => onExplore(style)}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition hover:bg-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
        >
          Compare style details
        </button>
      </div>
    </article>
  );
}

export default function PizzaStyleAtlas() {
  const [selectedStyleId, setSelectedStyleId] = useState<PizzaStyleEducation["id"] | null>(null);
  const selectedStyle = useMemo(
    () => pizzaStyleEducation.find((style) => style.id === selectedStyleId) ?? null,
    [selectedStyleId],
  );

  return (
    <>
      <section id="style-gallery" className="scroll-mt-24" aria-labelledby="style-gallery-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Style gallery</p>
            <h2 id="style-gallery-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Compare by what the pizza looks and feels like.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-ink/60">
            Open a style to compare its crust, structure, sauce, cheese, heat and baking method without turning the page into a specification sheet.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pizzaStyleEducation.map((style) => (
            <StyleCard key={style.id} style={style} onExplore={(nextStyle) => setSelectedStyleId(nextStyle.id)} />
          ))}
        </div>
      </section>

      {selectedStyle && <StyleDetailDialog style={selectedStyle} onClose={() => setSelectedStyleId(null)} />}
    </>
  );
}
