import Image from "next/image";
import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import type { PizzaStyleEducation } from "@/lib/pizza-style-education";

function TraitList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-[1.25rem] border border-ink/10 bg-white/80 p-4">
      <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">{title}</h4>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/66">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StructureDiagram() {
  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-card" role="img" aria-label="Diagram showing Roman al Taglio as a rectangular pan pizza with crisp base and airy crumb.">
      <div className="rounded-[1.25rem] bg-flour p-4">
        <div className="rounded-xl border-b-8 border-oven-gold bg-tomato/75 p-3">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className="h-7 rounded-full bg-white/50" aria-hidden="true" />
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-ink/55">
          <span>airy crumb</span>
          <span>crisp base</span>
          <span>pan support</span>
        </div>
      </div>
    </div>
  );
}

export default function PizzaStyleChapter({ style, index }: { style: PizzaStyleEducation; index: number }) {
  const reverse = index % 2 === 1;

  return (
    <article id={style.id} className="scroll-mt-24 rounded-[2rem] border border-ink/10 bg-white/72 p-5 shadow-card sm:p-7" aria-labelledby={`${style.id}-title`}>
      <div className={`grid gap-6 lg:grid-cols-[minmax(0,.88fr)_minmax(0,1fr)] lg:items-start ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div>
          {style.image ? (
            <figure className="overflow-hidden rounded-[1.5rem] bg-ink/5">
              <Image
                src={style.image.src}
                alt={style.image.alt}
                width={style.image.width}
                height={style.image.height}
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="aspect-square h-auto w-full object-cover"
              />
              <figcaption className="bg-white px-4 py-3 text-xs leading-5 text-ink/55">{style.image.alt}</figcaption>
            </figure>
          ) : (
            <StructureDiagram />
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
            <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">{style.origin}</span>
          </div>
          <h2 id={`${style.id}-title`} className="mt-4 font-display text-3xl font-semibold sm:text-5xl">{style.name}</h2>
          <p className="mt-3 text-base leading-7 text-ink/66">{style.description}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <TraitList title="What you see" items={style.whatYouSee} />
            <TraitList title="What you feel" items={style.whatYouFeel} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-[1.25rem] bg-forest-dark p-5 text-white">
          <h3 className="flex items-center gap-2 text-sm font-extrabold">
            <DoughToolsIcon name="information" size={20} />
            Why it behaves this way
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/70">{style.whyItBehaves}</p>
        </section>
        <section className="rounded-[1.25rem] border border-ink/10 bg-white p-5">
          <h3 className="text-sm font-extrabold">Typical build</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/62">
            {style.typicalBuild.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </section>
        <section className="rounded-[1.25rem] border border-ink/10 bg-white p-5">
          <h3 className="text-sm font-extrabold">Best suited for</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/62">
            {style.bestSuitedFor.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </section>
      </div>

      <details className="mt-5 rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4">
        <summary className="cursor-pointer text-sm font-extrabold text-ink">Common confusion</summary>
        <p className="mt-3 text-sm leading-6 text-ink/65">{style.commonConfusion}</p>
      </details>

      <div className="mt-5 border-t border-ink/10 pt-5">
        <h3 className="text-sm font-extrabold">Related learning</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {style.relatedLearning.map((link) => (
            <Link key={`${style.id}-${link.href}-${link.title}`} href={link.href} className="group rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 transition hover:border-tomato/30 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              <span className="flex items-center gap-2 text-sm font-extrabold text-ink group-hover:text-tomato">
                <DoughToolsIcon name={link.icon} size={16} />
                {link.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-ink/55">{link.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
