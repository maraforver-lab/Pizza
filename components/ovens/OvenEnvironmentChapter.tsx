import { DoughToolsIcon } from "@/components/icons";
import OvenSupportBadge from "@/components/ovens/OvenSupportBadge";
import type { OvenEnvironment } from "@/lib/oven-education";

export default function OvenEnvironmentChapter({ environment, index }: { environment: OvenEnvironment; index: number }) {
  const reverse = index % 2 === 1;

  return (
    <article id={environment.id} className="scroll-mt-24 rounded-[2rem] border border-ink/10 bg-white/72 p-5 shadow-card sm:p-7" aria-labelledby={`${environment.id}-chapter-title`}>
      <div className={`grid gap-6 lg:grid-cols-[minmax(0,.55fr)_minmax(0,1fr)] lg:items-start ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="rounded-[1.5rem] bg-flour p-5">
          <div className="grid aspect-square place-items-center rounded-[1.25rem] bg-white text-forest shadow-card">
            <div className="text-center">
              <DoughToolsIcon name={environment.icon} size={32} className="mx-auto" />
              <p className="mt-3 text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{environment.context}</p>
              <p className="mt-2 text-2xl font-extrabold">{environment.heatIntensity}</p>
              <p className="mt-1 text-xs leading-5 text-ink/55">heat environment</p>
            </div>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-3">
            <OvenSupportBadge support={environment.plannerSupport} note={environment.supportNote} />
            <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">{environment.operationalDifficulty} difficulty</span>
          </div>
          <h2 id={`${environment.id}-chapter-title`} className="mt-4 font-display text-3xl font-semibold sm:text-5xl">{environment.name}</h2>
          <p className="mt-3 text-base leading-7 text-ink/66">{environment.lesson}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <section className="rounded-[1.25rem] border border-leaf/20 bg-leaf/10 p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-forest">Advantages</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/66">
                {environment.advantages.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </section>
            <section className="rounded-[1.25rem] border border-tomato/15 bg-tomato/5 p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Limitations</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/66">
                {environment.limitations.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}
