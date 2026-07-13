"use client";

import { useId, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";

export type SauceMistakeCardProps = {
  cause: string;
  fixNow: string;
  nextTime: string;
  symptom: string;
  title: string;
};

function Label({ children }: { children: string }) {
  return <span className="text-[0.72rem] font-extrabold uppercase tracking-[.12em] text-ink/54">{children}</span>;
}

export default function SauceMistakeCard({ cause, fixNow, nextTime, symptom, title }: SauceMistakeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  return (
    <article className="rounded-[1.6rem] border border-ink/10 bg-card p-5 shadow-soft sm:p-6">
      <header className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
          <DoughToolsIcon name="warning" size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold leading-tight text-ink">{title}</h3>
        </div>
      </header>

      <div className="mt-5 space-y-4">
        <section className="rounded-[1.2rem] bg-flour/70 p-4" aria-label={`What happens: ${title}`}>
          <div className="flex items-center gap-2">
            <DoughToolsIcon name="information" size={16} className="text-tomato" />
            <Label>What happens</Label>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink/76">{symptom}</p>
        </section>

        <section className="rounded-[1.2rem] border border-basil/20 bg-basil/10 p-4" aria-label={`Fix it now: ${title}`}>
          <div className="flex items-center gap-2">
            <DoughToolsIcon name="success" size={16} className="text-forest" />
            <Label>Fix it now</Label>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink">{fixNow}</p>
        </section>

        <div className="hidden border-t border-ink/10 pt-4 lg:grid lg:gap-3">
          <section className="rounded-[1.05rem] bg-white/70 p-4" aria-label={`Likely cause: ${title}`}>
            <div className="flex items-center gap-2">
              <DoughToolsIcon name="information" size={16} className="text-ink/50" />
              <Label>Likely cause</Label>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{cause}</p>
          </section>
          <section className="rounded-[1.05rem] bg-warm-background p-4" aria-label={`Next time: ${title}`}>
            <div className="flex items-center gap-2">
              <DoughToolsIcon name="restore" size={16} className="text-forest" />
              <Label>Next time</Label>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{nextTime}</p>
          </section>
        </div>

        <div className="lg:hidden">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-left text-sm font-extrabold text-ink transition hover:border-tomato/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          >
            <span>Why it happened and what to change next time</span>
            <DoughToolsIcon name={expanded ? "chevron-up" : "chevron-down"} size={20} className="shrink-0 text-tomato" />
          </button>
          <div id={detailsId} hidden={!expanded} className="mt-3 space-y-3 border-t border-ink/10 pt-3">
            <section className="rounded-[1.05rem] bg-white/70 p-4" aria-label={`Likely cause: ${title}`}>
              <div className="flex items-center gap-2">
                <DoughToolsIcon name="information" size={16} className="text-ink/50" />
                <Label>Likely cause</Label>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{cause}</p>
            </section>
            <section className="rounded-[1.05rem] bg-warm-background p-4" aria-label={`Next time: ${title}`}>
              <div className="flex items-center gap-2">
                <DoughToolsIcon name="restore" size={16} className="text-forest" />
                <Label>Next time</Label>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{nextTime}</p>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
