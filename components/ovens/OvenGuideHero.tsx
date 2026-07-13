import { DoughToolsIcon } from "@/components/icons";

export default function OvenGuideHero() {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-ink/10 bg-forest-dark p-5 text-white shadow-raised sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.78fr)] lg:items-center">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Oven and Heat Guide</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[.95] sm:text-5xl lg:text-6xl">
          The oven changes the pizza.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
          Learn how home ovens, pizza ovens, stones, steels, pans, flame and bake time change the crust, base, toppings and workflow.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#oven-environments"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Compare oven environments
          </a>
          <a
            href="#common-oven-problems"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oven-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Fix an oven problem
          </a>
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[.07] p-4" role="img" aria-label="Brand-neutral diagram comparing home oven surface heat with high-heat pizza oven flame and floor heat.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-white p-4 text-ink">
            <div className="rounded-2xl border border-ink/10 bg-flour p-4">
              <div className="flex items-center justify-between text-tomato">
                <DoughToolsIcon name="oven" size={32} />
                <span className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Home oven</span>
              </div>
              <div className="mt-5 rounded-xl bg-ink/10 p-3">
                <div className="h-2 rounded-full bg-oven-gold" />
                <p className="mt-2 text-[11px] font-bold text-ink/55">stone · steel · pan</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink/58">Longer bake. Surface heat matters.</p>
          </div>
          <div className="rounded-[1.5rem] bg-ink p-4 text-white">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between text-oven-gold">
                <DoughToolsIcon name="flame" size={32} />
                <span className="text-xs font-extrabold uppercase tracking-[.18em] text-white/50">Pizza oven</span>
              </div>
              <div className="mt-5 rounded-xl bg-tomato/20 p-3">
                <div className="h-2 rounded-full bg-tomato" />
                <p className="mt-2 text-[11px] font-bold text-white/60">floor · flame · recovery</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-white/58">Fast bake. Balance happens quickly.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
