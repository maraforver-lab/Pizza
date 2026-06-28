"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pizzaSessionContinueHref, type PizzaSession } from "@/lib/pizza-session";
import { getActivePizzaSession, PIZZA_SESSION_LOCAL_ONLY_COPY } from "@/lib/pizza-session-storage";

type ContinuePizzaSessionCardProps = {
  className?: string;
  variant?: "default" | "hero";
};

const stepLabels: Record<PizzaSession["currentStep"], string> = {
  style: "Choose pizza style",
  time: "Choose timing",
  quantity: "Confirm quantity",
  oven: "Choose oven",
  flour: "Choose flour",
  recipe: "Continue recipe",
  timeline: "Open pizza timeline",
  shopping: "Review shopping list",
  prep: "Prepare dough",
  bake: "Bake pizza",
  review: "Review result",
};

export default function ContinuePizzaSessionCard({ className = "", variant = "default" }: ContinuePizzaSessionCardProps) {
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getActivePizzaSession() ?? null);
    setReady(true);
  }, []);

  if (!ready || !session) return null;

  const lastSaved = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(session.lastSavedAt));

  if (variant === "hero") {
    return (
      <section
        className={`rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-card backdrop-blur-md sm:p-5 ${className}`}
        aria-labelledby="continue-pizza-session-heading"
      >
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-leaf/10 text-xl text-leaf" aria-hidden="true">◌</span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[.22em] text-ink/50">Local session</p>
            <h2 id="continue-pizza-session-heading" className="mt-1 font-display text-2xl font-semibold leading-none text-ink">
              Continue Pizza Session
            </h2>
            <p className="mt-2 text-sm leading-5 text-ink/60">
              Next step: <strong className="text-ink">{stepLabels[session.currentStep]}</strong>
            </p>
            <p className="text-sm leading-5 text-ink/50">Last saved: {lastSaved}</p>
          </div>
          <Link
            href={pizzaSessionContinueHref(session)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Continue session →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-sm sm:p-6 ${className}`}
      aria-labelledby="continue-pizza-session-heading"
    >
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Local session</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 id="continue-pizza-session-heading" className="font-display text-2xl font-semibold text-ink">
            Continue Pizza Session
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Next step: <strong className="text-ink">{stepLabels[session.currentStep]}</strong>. Last saved {lastSaved}.
          </p>
          <p className="mt-2 text-xs leading-5 text-ink/45">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} Cloud sync is not active yet.
          </p>
        </div>
        <Link
          href={pizzaSessionContinueHref(session)}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Continue session →
        </Link>
      </div>
    </section>
  );
}
