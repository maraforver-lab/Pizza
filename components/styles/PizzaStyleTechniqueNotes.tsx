"use client";

import { useId, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { pizzaStyleEducation, type PizzaStyleEducationId } from "@/lib/pizza-style-education";

export default function PizzaStyleTechniqueNotes() {
  const baseId = useId();
  const [openId, setOpenId] = useState<PizzaStyleEducationId | null>(null);

  return (
    <section className="mt-8" aria-labelledby="style-notes-title">
      <details className="rounded-[1.5rem] border border-ink/10 bg-white/78 shadow-card">
        <summary className="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:p-6">
          <span className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Optional detail</span>
              <span id="style-notes-title" className="mt-2 block font-display text-3xl font-semibold text-ink sm:text-4xl">
                Explore technique differences
              </span>
              <span className="mt-2 block max-w-3xl text-sm leading-6 text-ink/60">
                Open this only when you want the extra why behind a style.
              </span>
            </span>
            <DoughToolsIcon name="chevron-down" size={24} className="shrink-0 text-tomato" aria-hidden="true" />
          </span>
        </summary>

        <div className="grid gap-3 border-t border-ink/10 p-5 pt-4 sm:p-6">
          {pizzaStyleEducation.map((style) => {
            const expanded = openId === style.id;
            const buttonId = `${baseId}-${style.id}-button`;
            const panelId = `${baseId}-${style.id}-panel`;

            return (
              <article key={style.id} className="rounded-[1.1rem] border border-ink/10 bg-flour/65">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenId(expanded ? null : style.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[1.1rem] px-4 py-3 text-left text-sm font-extrabold text-ink transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
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
                    <p>
                      <strong className="text-ink">Common confusion:</strong> {style.commonConfusion}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}
