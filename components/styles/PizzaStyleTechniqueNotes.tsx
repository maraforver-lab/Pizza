"use client";

import { useId, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { pizzaStyleEducation, type PizzaStyleEducationId } from "@/lib/pizza-style-education";

export default function PizzaStyleTechniqueNotes() {
  const baseId = useId();
  const [openId, setOpenId] = useState<PizzaStyleEducationId | null>(null);

  return (
    <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="style-notes-title">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Optional detail</p>
      <h2 id="style-notes-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
        Technique notes stay secondary.
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
        Open a style only when you want the extra why. The main oven, dough, bake and topping differences stay visible in the comparison above.
      </p>

      <div className="mt-6 grid gap-3">
        {pizzaStyleEducation.map((style) => {
          const expanded = openId === style.id;
          const buttonId = `${baseId}-${style.id}-button`;
          const panelId = `${baseId}-${style.id}-panel`;

          return (
            <article key={style.id} className="rounded-[1.25rem] border border-ink/10 bg-flour/65">
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpenId(expanded ? null : style.id)}
                className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3 text-left text-sm font-extrabold text-ink transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                <span>{style.name}</span>
                <DoughToolsIcon name={expanded ? "chevron-up" : "chevron-down"} size={20} aria-hidden="true" />
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!expanded}
                className="border-t border-ink/10 px-4 pb-4 pt-3"
              >
                <div className="grid gap-3 text-sm leading-6 text-ink/64 lg:grid-cols-2">
                  <p>{style.whyItBehaves}</p>
                  <p><strong className="text-ink">Common confusion:</strong> {style.commonConfusion}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
