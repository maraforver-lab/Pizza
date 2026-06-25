"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pizzaSessionContinueHref, type PizzaSession } from "@/lib/pizza-session";
import { getActivePizzaSession, PIZZA_SESSION_LOCAL_ONLY_COPY } from "@/lib/pizza-session-storage";

type ContinuePizzaSessionCardProps = {
  className?: string;
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

export default function ContinuePizzaSessionCard({ className = "" }: ContinuePizzaSessionCardProps) {
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
