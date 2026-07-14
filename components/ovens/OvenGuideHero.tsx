import Image from "next/image";
import { cardClass } from "@/components/design-system";

export default function OvenGuideHero() {
  return (
    <section
      className={cardClass({
        className:
          "overflow-hidden p-5 sm:p-8 lg:grid lg:grid-cols-[minmax(0,.92fr)_minmax(22rem,1.08fr)] lg:items-center lg:gap-8",
        variant: "guidance",
      })}
    >
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Oven Guide</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.98] tracking-tight sm:text-6xl">
          Home oven or pizza oven?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/62 sm:text-base">
          Compare the heat, preheat, placement, bake time and result so you can choose the right DoughTools Pizza Session path.
        </p>
        <p className="mt-4 max-w-xl text-sm font-bold leading-6 text-ink/70">
          Oven choice changes the schedule, bake rhythm and how much moisture your pizza can handle.
        </p>
      </div>
      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-ink shadow-raised lg:mt-0">
        <Image
          src="/ovens/home-vs-pizza-oven.webp"
          alt="Home oven and high-heat pizza oven shown side by side with pizzas baking on their respective surfaces."
          width={1756}
          height={896}
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/9] lg:aspect-[1.22/1]"
        />
      </div>
    </section>
  );
}
