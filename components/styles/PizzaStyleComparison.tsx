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
    return "Learning-only tray format; no Pizza Session planning default.";
  }

  const flour = flourById(preset.settings.flourId);
  return `${preset.settings.hydration}% planning default · ${formatFermentation(preset.settings.fermentation)} · ${flour.strength}`;
}

function bakeSummary(style: PizzaStyleEducation) {
  return presetForStyle(style)?.bake ?? style.bakeStyle;
}

function bestForSummary(style: PizzaStyleEducation) {
  return style.bestSuitedFor[0];
}

export default function PizzaStyleComparison() {
  return (
    <section id="style-comparison" className="mt-8 scroll-mt-24 rounded-[2rem] border border-ink/10 bg-white/78 p-5 shadow-card sm:p-7" aria-labelledby="style-comparison-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Compare first</p>
          <h2 id="style-comparison-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            Main pizza styles at a glance.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/60">
            Use this as a choosing guide. DoughTools currently creates a Neapolitan-style Pizza Session; the other style families are learning references or legacy calculator presets.
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold leading-6 text-forest lg:max-w-sm">
          <DoughToolsIcon name="information" size={20} className="mr-2 inline align-[-4px]" />
          Pizza Session currently plans Neapolitan-style pizza for home ovens and pizza ovens. Other styles are learning references.
        </div>
      </div>

      <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-flour/70 p-4 text-sm leading-6 text-ink/64">
        <strong className="text-ink">Topping names are not dough styles.</strong>{" "}
        {PIZZA_CATALOG_OPTIONS.map((option) => option.name).join(", ")} are menu presets used later for Shopping quantities.
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {pizzaStyleEducation.map((style) => {
          const preset = presetForStyle(style);
          const rows = [
            ["Result", style.description],
            ["Oven and bake", `${style.ovenEnvironment} · ${bakeSummary(style)}`],
            ["Dough character", doughSummary(style)],
            ["Sauce and toppings", `${style.sauceTreatment} · ${style.toppingDensity}`],
            ["Best for", bestForSummary(style)],
          ] as const;

          return (
            <article key={style.id} id={style.id} className="scroll-mt-24 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" aria-labelledby={`${style.id}-comparison-title`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PizzaStyleSupportBadge support={style.support} note={style.supportNote} />
                    {preset ? (
                      <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">
                        Preset data available
                      </span>
                    ) : (
                      <span className="rounded-full bg-flour px-3 py-1.5 text-xs font-extrabold text-ink/55">
                        Learning-only reference
                      </span>
                    )}
                  </div>
                  <h3 id={`${style.id}-comparison-title`} className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">
                    {style.name}
                  </h3>
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
                  <DoughToolsIcon name={style.icon} size={24} />
                </span>
              </div>

              <dl className="mt-4 grid gap-0 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid gap-1 border-t border-ink/10 py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
                    <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/42">{label}</dt>
                    <dd className="leading-5 text-ink/68">{value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
