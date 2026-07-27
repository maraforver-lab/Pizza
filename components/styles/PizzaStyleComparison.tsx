import Image from "next/image";
import { DoughToolsIcon } from "@/components/icons";
import PizzaStyleSupportBadge from "@/components/styles/PizzaStyleSupportBadge";
import { flourById } from "@/lib/flours";
import { PIZZA_CATALOG_OPTIONS } from "@/lib/pizza-catalog";
import { pizzaStyleEducation, type PizzaStyleEducation, type PizzaStyleEducationId } from "@/lib/pizza-style-education";
import { pizzaStyleById, type PizzaStyleId } from "@/lib/pizza-styles";

const educationToPresetId: Partial<Record<PizzaStyleEducationId, PizzaStyleId>> = {
  neapolitan: "neapolitan",
  "contemporary-neapolitan": "contemporary",
  "new-york": "new-york",
  "roman-tonda": "roman-thin",
  detroit: "detroit",
  sicilian: "sicilian",
};

function presetForStyle(style: PizzaStyleEducation) {
  const presetId = educationToPresetId[style.id];
  return presetId ? pizzaStyleById(presetId) : undefined;
}

function formatFermentation(value?: string) {
  return value ? value.replace("-", " ") : undefined;
}

function doughSummary(style: PizzaStyleEducation) {
  const preset = presetForStyle(style);
  if (!preset) {
    return "Learning-only tray format; no pizza-plan default.";
  }

  const flour = flourById(preset.settings.flourId);
  return `${preset.settings.hydration}% planning default · ${formatFermentation(preset.settings.fermentation)} · ${flour.strength}`;
}

function bakeSummary(style: PizzaStyleEducation) {
  return presetForStyle(style)?.bake ?? style.bakeStyle;
}

function bestForSummary(style: PizzaStyleEducation) {
  return style.bestSuitedFor.slice(0, 2).join(" · ");
}

function StyleImage({ style }: { style: PizzaStyleEducation }) {
  if (!style.image) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-[1rem] bg-flour text-tomato" aria-hidden="true">
        <DoughToolsIcon name={style.icon} size={32} />
      </div>
    );
  }

  return (
    <Image
      src={style.image.src}
      alt={style.image.alt}
      width={style.image.width}
      height={style.image.height}
      sizes="(max-width: 640px) 92vw, (max-width: 1279px) 42vw, 18vw"
      className="aspect-[4/3] h-auto w-full rounded-[1rem] object-cover"
    />
  );
}

export default function PizzaStyleComparison() {
  return (
    <section id="style-comparison" className="mt-8 scroll-mt-24 rounded-[1.75rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-6" aria-labelledby="style-comparison-title">
      <div className="max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Compact comparison</p>
        <h2 id="style-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
          Compare the important differences.
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Use this as the full style reference after the assistant narrows your direction.
        </p>
      </div>

      <div className="mt-4 rounded-[1rem] border border-ink/10 bg-flour/70 p-4 text-sm leading-6 text-ink/64">
        <strong className="text-ink">Topping names are not dough styles.</strong>{" "}
        {PIZZA_CATALOG_OPTIONS.map((option) => option.name).join(", ")} are menu presets used later for Shopping quantities.
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {pizzaStyleEducation.map((style) => {
          const preset = presetForStyle(style);
          const rows = [
            ["Oven fit", style.ovenEnvironment],
            ["Crust and texture", style.eatingExperience],
            ["Shape or thickness", `${style.shape} · ${style.thickness}`],
            ["Bake behavior", bakeSummary(style)],
            ["Best for", bestForSummary(style)],
          ] as const;

          return (
            <article key={style.id} id={style.id} className="scroll-mt-24 rounded-[1.25rem] border border-ink/10 bg-white p-4 shadow-sm" aria-labelledby={`${style.id}-comparison-title`}>
              <div className="grid gap-4 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                <StyleImage style={style} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
                    {preset ? (
                      <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">Preset data available</span>
                    ) : null}
                  </div>
                  <h3 id={`${style.id}-comparison-title`} className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
                    {style.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{style.description}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-0 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid gap-1 border-t border-ink/10 py-2 sm:grid-cols-[9rem_minmax(0,1fr)]">
                    <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/42">{label}</dt>
                    <dd className="leading-5 text-ink/68">{value}</dd>
                  </div>
                ))}
              </dl>

              <details className="mt-3 rounded-[1rem] border border-ink/10 bg-flour/65">
                <summary className="cursor-pointer px-4 py-3 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  View dough, topping and technique details
                </summary>
                <div className="grid gap-3 border-t border-ink/10 px-4 pb-4 pt-3 text-sm leading-6 text-ink/64 md:grid-cols-2">
                  <p>
                    <strong className="text-ink">Dough reference:</strong> {doughSummary(style)}
                  </p>
                  <p>
                    <strong className="text-ink">Sauce and cheese:</strong> {style.sauceTreatment} · {style.cheeseTreatment}
                  </p>
                  <p>
                    <strong className="text-ink">Topping load:</strong> {style.toppingDensity}
                  </p>
                  <p>
                    <strong className="text-ink">Common confusion:</strong> {style.commonConfusion}
                  </p>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
