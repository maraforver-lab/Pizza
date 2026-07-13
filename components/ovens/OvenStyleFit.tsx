import Link from "next/link";

const fits = [
  ["Conventional home oven", "New York-style, thin crisp pizza, pan pizza and longer-baked styles"],
  ["Home oven with steel", "New York-style, thin artisan pizza and home-adapted round pizzas"],
  ["Dedicated high-heat oven", "Neapolitan and contemporary high-heat round pizza"],
  ["Pan baking", "Detroit, Sicilian-style pan pizza and Roman pan formats"],
] as const;

export default function OvenStyleFit() {
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="oven-style-fit-title">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Oven and style fit</p>
      <h2 id="oven-style-fit-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">The right oven is the one that fits the pizza.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
        These are typical fits, not restrictions. The point is to match heat profile, dough, sauce, cheese and timing instead of forcing one formula into every oven.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {fits.map(([environment, styles]) => (
          <div key={environment} className="rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4">
            <h3 className="text-sm font-extrabold">{environment}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/62">{styles}</p>
          </div>
        ))}
      </div>
      <Link href="/styles" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
        Compare pizza styles →
      </Link>
    </section>
  );
}
