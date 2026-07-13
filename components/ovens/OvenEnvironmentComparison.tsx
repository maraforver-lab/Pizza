import { DoughToolsIcon } from "@/components/icons";
import OvenSupportBadge from "@/components/ovens/OvenSupportBadge";
import { ovenEnvironments } from "@/lib/oven-education";

const fields = [
  ["heatIntensity", "Heat intensity"],
  ["topHeat", "Top heat"],
  ["bottomHeat", "Bottom heat"],
  ["preheatBehavior", "Preheat behavior"],
  ["bakeCharacter", "Bake character"],
  ["heatRecovery", "Heat recovery"],
  ["suitableStyles", "Often suits"],
  ["toppingMoistureTolerance", "Moisture tolerance"],
  ["operationalDifficulty", "Difficulty"],
  ["context", "Context"],
] as const;

export default function OvenEnvironmentComparison() {
  return (
    <section id="oven-environments" className="scroll-mt-24" aria-labelledby="oven-environments-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Compare environments</p>
          <h2 id="oven-environments-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Match the oven to the pizza you want.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-ink/60">
          These are practical categories, not model rankings. Exact behavior depends on your equipment, material thickness, rack position and method.
        </p>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {ovenEnvironments.map((environment) => (
          <article key={environment.id} className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card" aria-labelledby={`${environment.id}-title`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id={`${environment.id}-title`} className="font-display text-2xl font-semibold">{environment.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/58">{environment.summary}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf/10 text-leaf" aria-hidden="true">
                <DoughToolsIcon name={environment.icon} size={24} />
              </span>
            </div>
            <div className="mt-4">
              <OvenSupportBadge support={environment.plannerSupport} note={environment.supportNote} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              {fields.map(([field, label]) => (
                <div key={field} className="grid gap-1 border-t border-ink/10 pt-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="text-xs font-extrabold uppercase tracking-[.12em] text-ink/40">{label}</dt>
                  <dd className="leading-6 text-ink/70">{environment[field]}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
