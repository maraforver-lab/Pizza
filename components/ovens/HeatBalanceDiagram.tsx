import { DoughToolsIcon } from "@/components/icons";

export default function HeatBalanceDiagram() {
  return (
    <section id="heat-basics" className="scroll-mt-24 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="heat-basics-title">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start with heat</p>
          <h2 id="heat-basics-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            An oven has more than one temperature.
          </h2>
          <p className="mt-4 text-sm leading-7 text-ink/62">
            The oven display tells you something useful, but it does not prove the stone, steel, pan or oven floor is ready. A good bake balances hot air, top heat, bottom heat, stored energy and recovery between pizzas.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-flour p-4" role="img" aria-label="Diagram showing top heat moving downward to toppings and bottom heat moving upward to the pizza base.">
          <div className="grid gap-3">
            <div className="rounded-2xl bg-tomato/10 p-4 text-center">
              <DoughToolsIcon name="flame" size={32} className="mx-auto text-tomato" />
              <p className="mt-2 text-sm font-extrabold">Top heat</p>
              <p className="mt-1 text-xs leading-5 text-ink/55">colors the rim, melts cheese and cooks toppings</p>
              <p className="mt-2 text-2xl text-tomato" aria-hidden="true">↓</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-4 text-center">
              <DoughToolsIcon name="pizza" size={32} className="mx-auto text-ink" />
              <p className="mt-2 text-sm font-extrabold">Pizza</p>
              <p className="mt-1 text-xs leading-5 text-ink/55">dough, sauce, cheese and moisture all react differently</p>
            </div>
            <div className="rounded-2xl bg-leaf/10 p-4 text-center">
              <p className="mb-2 text-2xl text-leaf" aria-hidden="true">↑</p>
              <DoughToolsIcon name="oven" size={32} className="mx-auto text-leaf" />
              <p className="mt-2 text-sm font-extrabold">Bottom heat</p>
              <p className="mt-1 text-xs leading-5 text-ink/55">sets the base, browning and oven spring support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
