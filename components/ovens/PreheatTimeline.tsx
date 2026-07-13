import { DoughToolsIcon } from "@/components/icons";

const steps = [
  ["Cold oven", "Everything starts cool: air, walls and baking surface."],
  ["Air is hot", "The display may say ready before the surface has stored enough heat."],
  ["Surface is heating", "Stone, steel, pan or floor continues absorbing energy."],
  ["Surface is ready", "The intended launch area has enough stored heat for the style."],
  ["Recovery", "Each pizza removes heat; later pizzas may need a pause."],
] as const;

export default function PreheatTimeline() {
  return (
    <section id="preheat-recovery" className="scroll-mt-24 rounded-[2rem] border border-ink/10 bg-flour/70 p-5 sm:p-7" aria-labelledby="preheat-recovery-title">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Preheat and recovery</p>
      <h2 id="preheat-recovery-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">The first pizza and the fifth pizza may not see the same oven.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/62">
        The oven air can recover faster than the stone, steel or floor. During a pizza party, check the surface between launches and give it time when later pizzas turn pale or soft.
      </p>
      <ol className="mt-6 grid gap-3 lg:grid-cols-5">
        {steps.map(([title, body], index) => (
          <li key={title} className="rounded-[1.25rem] border border-ink/10 bg-white p-4">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-oven-gold/25 text-ink" aria-hidden="true">
              <DoughToolsIcon name={index === steps.length - 1 ? "restore" : "thermometer"} size={24} />
            </span>
            <span className="mt-3 block text-[11px] font-extrabold uppercase tracking-[.18em] text-ink/38">0{index + 1}</span>
            <strong className="mt-1 block text-sm text-ink">{title}</strong>
            <span className="mt-2 block text-xs leading-5 text-ink/55">{body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
