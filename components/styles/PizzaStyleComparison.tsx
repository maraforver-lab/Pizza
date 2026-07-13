import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import {
  pizzaStyleComparisonFields,
  pizzaStyleEducation,
  type PizzaStyleEducation,
} from "@/lib/pizza-style-education";

const comparisonLabels: Record<(typeof pizzaStyleComparisonFields)[number], string> = {
  shape: "Shape",
  thickness: "Typical thickness",
  edge: "Edge / cornicione",
  interior: "Interior texture",
  base: "Base texture",
  bakingSurface: "Baking surface",
  ovenEnvironment: "Oven environment",
  bakeStyle: "Approximate bake style",
  cheeseTreatment: "Cheese",
  sauceTreatment: "Sauce",
  toppingDensity: "Topping density",
  eatingExperience: "Eating experience",
};

function StyleComparisonCard({ style }: { style: PizzaStyleEducation }) {
  return (
    <article className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card" aria-labelledby={`${style.id}-compare-title`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id={`${style.id}-compare-title`} className="font-display text-2xl font-semibold">{style.shortName}</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-[.16em] text-ink/45">{style.origin}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
          <DoughToolsIcon name={style.icon} size={24} />
        </span>
      </div>
      <div className="mt-4">
        <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        {pizzaStyleComparisonFields.map((field) => (
          <div key={field} className="grid gap-1 border-t border-ink/10 pt-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <dt className="text-xs font-extrabold uppercase tracking-[.12em] text-ink/40">{comparisonLabels[field]}</dt>
            <dd className="leading-6 text-ink/70">{style[field]}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function PizzaStyleComparison() {
  return (
    <section id="compare-styles" className="scroll-mt-24" aria-labelledby="style-comparison-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Visual comparison</p>
          <h2 id="style-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Compare the styles without a spreadsheet.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-ink/60">
          These are typical traits, not universal rules. Flour, oven, thickness and topping moisture still change the result.
        </p>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {pizzaStyleEducation.map((style) => (
          <StyleComparisonCard key={style.id} style={style} />
        ))}
      </div>
    </section>
  );
}
