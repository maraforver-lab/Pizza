"use client";

import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";
import { PIZZA_SESSION_LOCAL_ONLY_COPY } from "@/lib/pizza-session-storage";

const sessionJourneySteps = [
  { label: "Oven", phase: "Setup", href: "/session/start?step=path" },
  { label: "Pizza style", phase: "Setup", href: "/session/start?step=preset" },
  { label: "When", phase: "Setup", href: "/session/start?step=time" },
  { label: "Quantity", phase: "Setup", href: "/session/start?step=quantity" },
  { label: "Flour situation", phase: "Setup", href: "/session/start?step=flour" },
  { label: "Dough Plan", phase: "Plan", href: "/session/recipe" },
  { label: "Choose pizzas & Shopping", phase: "Prepare", href: "/session/shopping" },
  { label: "Timeline", phase: "Plan", href: "/session/timeline" },
  { label: "Kitchen Mode", phase: "Bake", href: "/session/kitchen" },
  { label: "Review", phase: "Improve", href: "/session/review" },
] as const;

type SessionProgressSidebarProps = {
  activeStep: number;
  hideLocalSaveNote?: boolean;
};

function stepState(index: number, activeStep: number) {
  if (index + 1 < activeStep) return "complete";
  if (index + 1 === activeStep) return "current";
  return "upcoming";
}

export function SessionProgressSidebar({ activeStep, hideLocalSaveNote = false }: SessionProgressSidebarProps) {
  const progress = Math.round((activeStep / sessionJourneySteps.length) * 100);

  return (
    <aside className="hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur lg:sticky lg:top-5 lg:block lg:self-start">
      <h2 className="font-display text-3xl font-semibold leading-none">Pizza Session</h2>
      <p className="mt-3 text-sm leading-5 text-ink/55">One guided path from setup to Dough Plan, Shopping, Timeline, Kitchen Mode and Review.</p>
      <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-ink/65">
          <span>Step {activeStep} of {sessionJourneySteps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-[11px] font-bold text-ink/45">Desktop keeps the full session path visible.</p>
      </div>
      <ol className="mt-5 grid gap-1.5" aria-label="Pizza Session journey">
        {sessionJourneySteps.map((item, index) => {
          const state = stepState(index, activeStep);
          const canNavigate = state === "complete";
          const content = (
            <>
              <span className="sr-only">{state === "current" ? "Current journey step: " : state === "complete" ? "Completed journey step: " : "Upcoming journey step: "}</span>
              <span className={`grid h-6 w-6 place-items-center rounded-full ${state === "current" ? "bg-white text-ink" : state === "complete" ? "bg-leaf text-white" : "bg-ink/10 text-ink/45"}`}>
                {state === "complete" ? <DoughToolsIcon name="check" size={16} strokeWidth={2.4} /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{item.label}</span>
                <span className={`block text-[10px] ${state === "current" ? "text-white/55" : "text-ink/35"}`}>{item.phase}</span>
              </span>
            </>
          );
          const className = `flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold ${state === "current" ? "bg-ink text-white" : state === "complete" ? "bg-leaf/10 text-leaf" : "bg-ink/[.04] text-ink/45"}`;
          return (
            <li key={item.label}>
              {canNavigate ? (
                <Link href={item.href} className={`${className} cursor-pointer transition hover:bg-leaf/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream`} aria-label={`Go to ${item.label}`}>
                  {content}
                </Link>
              ) : (
                <div className={`${className} cursor-default select-none`} aria-current={state === "current" ? "step" : undefined} aria-disabled={state === "upcoming" ? true : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {!hideLocalSaveNote && (
        <div className="mt-5 rounded-2xl bg-cream/70 p-3 text-xs leading-5 text-ink/50">
          <strong className="block text-sm text-ink">Saved as you go.</strong>
          <span className="mt-2 block">{PIZZA_SESSION_LOCAL_ONLY_COPY}</span>
        </div>
      )}
    </aside>
  );
}
