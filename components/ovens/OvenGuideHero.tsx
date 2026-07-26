import Image from "next/image";
import { cardClass } from "@/components/design-system";

export default function OvenGuideHero() {
  return (
    <section
      className={cardClass({
        className:
          "overflow-hidden p-5 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.42fr)] lg:items-center lg:gap-6",
        variant: "guidance",
      })}
    >
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Baking guides</p>
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.98] tracking-tight sm:text-5xl lg:text-[3.35rem]">
          Get better pizza from the oven you already have.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/62 sm:text-base">
          Choose the oven closest to your setup, see the recommended path and follow a practical bake approach for preheating, launching and finishing the pizza.
        </p>
        <p className="mt-4 max-w-xl text-sm font-bold leading-6 text-ink/70">
          Home oven and Pizza oven remain the Pizza Plan choices; other setups use the closest practical guidance path.
        </p>
      </div>
      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-ink shadow-raised lg:mt-0 lg:justify-self-end">
        <Image
          src="/ovens/home-vs-pizza-oven.webp"
          alt="Home oven and high-heat pizza oven shown side by side with pizzas baking on their respective surfaces."
          width={1756}
          height={896}
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="aspect-[16/9] w-full object-cover object-center lg:aspect-[4/3]"
        />
      </div>
    </section>
  );
}
