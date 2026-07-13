import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import { pizzaStyleSupportSummary } from "@/lib/pizza-style-education";

export default function PizzaStyleHero() {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-ink/10 bg-forest-dark p-5 text-white shadow-raised sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.78fr)] lg:items-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Pizza Style Atlas</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[.95] sm:text-5xl lg:text-6xl">
          Why every pizza style behaves differently.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
          Compare crust, structure, sauce, cheese, oven heat and baking method — and learn why a Neapolitan pizza cannot simply become Detroit or New York by changing the toppings.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#compare-styles"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Compare the styles
          </a>
          <a
            href="#neapolitan"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oven-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Learn Neapolitan style
          </a>
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[.07] p-4">
        <div className="grid grid-cols-2 gap-3" aria-label="Visual pizza style differences">
          {[
            ["Soft round", "Neapolitan", "rounded-[48%] border-[10px] border-oven-gold bg-tomato/70"],
            ["Foldable slice", "New York", "rounded-[55%_45%_48%_52%] border-[5px] border-oven-gold bg-tomato/55"],
            ["Cheese edge", "Detroit", "rounded-xl border-[8px] border-oven-gold bg-tomato/70"],
            ["Thin crisp", "Roman Tonda", "rounded-full border-[4px] border-oven-gold bg-tomato/50"],
          ].map(([label, style, shape]) => (
            <div key={style} className="rounded-[1.25rem] bg-white/10 p-3">
              <div className="flex h-24 items-center justify-center rounded-2xl bg-ink/20">
                <span className={`block h-16 w-16 ${shape}`} aria-hidden="true" />
              </div>
              <p className="mt-3 text-xs font-extrabold text-white">{style}</p>
              <p className="mt-1 text-[11px] leading-4 text-white/55">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl bg-white p-4 text-ink">
          <PizzaStyleSupportBadge support="supported" note="Supported in Pizza Session" />
          <p className="mt-3 text-xs leading-5 text-ink/58">{pizzaStyleSupportSummary}</p>
          <Link href="/session/start" className="mt-4 inline-flex text-xs font-extrabold text-tomato underline-offset-2 hover:underline">
            Plan my next pizza →
          </Link>
        </div>
      </div>
    </section>
  );
}
