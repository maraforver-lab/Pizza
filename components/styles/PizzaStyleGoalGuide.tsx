import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import { pizzaStyleEducationById, pizzaStyleGoalGuide } from "@/lib/pizza-style-education";

export default function PizzaStyleGoalGuide() {
  return (
    <section className="mt-8 rounded-[2rem] border border-ink/10 bg-flour/70 p-5 sm:p-7" aria-labelledby="goal-guide-title">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Choose by goal</p>
      <h2 id="goal-guide-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Which style fits your goal?</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
        These links jump back to the comparison above. They help you choose a direction without creating a separate style-selection engine.
      </p>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {pizzaStyleGoalGuide.map((item) => {
          const style = pizzaStyleEducationById(item.styleId);
          return (
            <a
              key={item.goal}
              href={`#${style.id}`}
              className="rounded-[1.35rem] border border-ink/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-tomato/30 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              <span className="block text-sm font-extrabold text-ink">{item.goal}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-tomato">→ {style.shortName}</span>
                <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
