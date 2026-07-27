import Image from "next/image";
import { pizzaStyleEducation } from "@/lib/pizza-style-education";

const stylesWithImages = pizzaStyleEducation.filter((style) => style.image);

export default function PizzaStyleVisualComparison() {
  return (
    <section
      className="mt-5 rounded-[1.75rem] border border-ink/10 bg-white/78 p-4 shadow-card sm:p-5 lg:p-6"
      aria-labelledby="style-visual-comparison-title"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Browse all styles</p>
        <h2 id="style-visual-comparison-title" className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
          Every style stays available.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Use the images to recognize shape, rim, thickness and bake style, then jump to the compact comparison.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 xl:grid-cols-7">
        {stylesWithImages.map((style) => {
          const image = style.image!;

          return (
            <a
              key={style.id}
              href={`#${style.id}`}
              className="group min-w-0 rounded-[1rem] border border-ink/10 bg-flour/70 p-2 transition hover:border-tomato/30 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              aria-label={`View ${style.name} details in the style comparison`}
            >
              <span className="relative block aspect-square overflow-hidden rounded-[.8rem] bg-cream">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 480px) 31vw, (max-width: 768px) 23vw, (max-width: 1279px) 18vw, 11vw"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                />
              </span>
              <span className="mt-2 block text-center text-[11px] font-extrabold leading-tight text-ink sm:text-xs">
                {style.shortName}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
