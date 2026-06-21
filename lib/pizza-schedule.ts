import type { DoughInstruction } from "@/lib/dough-instructions";
import type { Fermentation } from "@/lib/saved-recipes";

export type ScheduledStep = DoughInstruction & { at: Date };

const hoursFor = (fermentation: Fermentation) => Number(fermentation.match(/^\d+/)?.[0] ?? 24);
const minutes = (value: number) => value * 60_000;

export function scheduleInstructions(steps: DoughInstruction[], fermentation: Fermentation, anchor: Date, mode: "start" | "bake") {
  const totalMinutes = hoursFor(fermentation) * 60;
  const start = mode === "start" ? anchor : new Date(anchor.getTime() - minutes(totalMinutes));
  const bake = mode === "bake" ? anchor : new Date(anchor.getTime() + minutes(totalMinutes));
  const cold = fermentation.endsWith("cold");
  const finalProof = fermentation === "6h-room" ? 120 : fermentation === "12h-room" ? 180 : 300;
  const offsets: Record<string, number> = {
    prepare: 0,
    mix: 5,
    rest: 15,
    knead: 40,
    bulk: 60,
    ball: cold ? 90 : totalMinutes - finalProof,
    cold: 105,
    warm: totalMinutes - 150,
    final: totalMinutes - finalProof + 15,
    bake: totalMinutes,
  };

  return steps.map((step) => ({ ...step, at: new Date(start.getTime() + minutes(Math.max(0, offsets[step.id] ?? 0))) })) as ScheduledStep[];
}

export function nextScheduledStep(steps: ScheduledStep[], now: Date, completed: Set<string>) {
  void now;
  return steps.find((step) => !completed.has(step.id));
}
