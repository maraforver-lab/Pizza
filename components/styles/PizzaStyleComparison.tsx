import { DoughToolsIcon } from "@/components/icons";
import { pizzaStyleEducation } from "@/lib/pizza-style-education";

const summaryRows = [
  {
    label: "Fast and soft",
    styleIds: ["neapolitan", "contemporary-neapolitan"],
    note: "High heat, restrained toppings and soft centers reward timing and handling.",
  },
  {
    label: "Slice and fold",
    styleIds: ["new-york", "roman-tonda"],
    note: "Round styles with lower edges and more structure make the base and underside more important.",
  },
  {
    label: "Pan and tray",
    styleIds: ["detroit", "roman-al-taglio", "sicilian"],
    note: "Pan geometry, oil, staged toppings and longer baking define the eating experience.",
  },
] as const;

export default function PizzaStyleComparison() {
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="style-comparison-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Quick comparison</p>
          <h2 id="style-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Same ingredients, very different architecture.
          </h2>
          <p className="mt-4 text-sm leading-7 text-ink/62">
            Style is not just topping choice. Geometry, thickness, oven heat, bake time and moisture decide whether the pizza feels soft, foldable, crisp or pan-baked.
          </p>
        </div>
        <div className="grid gap-3">
          {summaryRows.map((row) => (
            <article key={row.label} className="rounded-[1.35rem] border border-ink/10 bg-flour/70 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
                  <DoughToolsIcon name="pizza" size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-ink">{row.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{row.note}</p>
                  <p className="mt-2 text-xs font-bold text-ink/45">
                    {row.styleIds.map((id) => pizzaStyleEducation.find((style) => style.id === id)?.shortName).filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
