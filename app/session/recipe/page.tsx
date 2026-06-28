"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import type { PizzaSession } from "@/lib/pizza-session";
import { PIZZA_SESSION_LOCAL_ONLY_COPY } from "@/lib/pizza-session-storage";
import {
  generateAndSaveActiveSessionRecipe,
  type SessionRecipeBuildResult,
} from "@/lib/session-recipe";

function formatGram(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 10) return `${value.toFixed(2)} g`;
  return `${Math.round(value)} g`;
}

function amountCardTone(label: string) {
  if (label === "Water") return "text-sky-600";
  if (label === "Salt") return "text-ink/55";
  if (label === "Yeast") return "text-tomato";
  return "text-leaf";
}

function missingCopy(reason: Exclude<SessionRecipeBuildResult, { ok: true }>["missingReason"]) {
  if (reason === "no-session") {
    return {
      title: "No active pizza session",
      body: "Start a Pizza Session first. DoughTools will save the session locally in this browser on this device.",
      action: "Start Pizza Session →",
    };
  }
  if (reason === "missing-path") {
    return {
      title: "Choose your baking path first.",
      body: "The dough plan needs to know whether you are baking in a home oven, pizza oven or pan.",
      action: "Return to session choices →",
    };
  }
  if (reason === "missing-preset") {
    return {
      title: "Choose a pizza preset first.",
      body: "The preset keeps the session clear before timeline and shopping steps.",
      action: "Return to session choices →",
    };
  }
  if (reason === "missing-quantity") {
    return {
      title: "Choose the pizza count first.",
      body: "The dough plan needs a number of pizzas before it can calculate the total dough.",
      action: "Return to session choices →",
    };
  }
  return {
    title: "Choose your flour first.",
    body: "Pick the closest flour type in the session starter. Exact flour tuning remains available in the full calculator.",
    action: "Return to session choices →",
  };
}

export default function SessionRecipePage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [result, setResult] = useState<SessionRecipeBuildResult | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const saved = generateAndSaveActiveSessionRecipe();
    setSession(saved.session ?? null);
    setResult(saved.result);
    setReady(true);
  }, []);

  if (!ready || !result) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Building your local dough plan…
        </div>
      </main>
    );
  }

  if (!result.ok || !session) {
    const copy = missingCopy(result.ok ? "no-session" : result.missingReason);
    return (
      <SessionEmptyState
        eyebrow="Pizza Session recipe"
        title={copy.title}
        body={copy.body}
        actionHref="/session/start"
        actionLabel={copy.action}
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.`}
      />
    );
  }

  const doughIngredients = [
    ["Total dough", formatGram(result.ingredients.total)],
    ["Flour", formatGram(result.ingredients.flour)],
    ["Water", formatGram(result.ingredients.water)],
    ["Salt", formatGram(result.ingredients.salt)],
    ["Yeast", formatGram(result.ingredients.leavener)],
  ];
  const doughPrepIngredients = ["Flour", "Water", "Salt", "Yeast"];
  const doughPrepTools = ["Digital scale", "Mixing bowl", "Dough scraper or sturdy spoon", "Covered container or bowl"];

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <div className="mx-auto max-w-5xl">
        <SessionStepHero
          step={6}
          label="Dough plan"
          pageType="Reference page"
          title="Your dough plan is ready."
          body="Get your dough ingredients and amounts ready before you start."
          level={session.experienceLevel}
        />

        <section className="mt-4 sm:mt-6" aria-label="Dough plan details">
          <div className="grid min-w-0 gap-4 sm:gap-5">
            <article className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:rounded-[2rem] sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Before you start</h2>
              <p className="mt-1 text-xs leading-5 text-ink/55 sm:mt-2 sm:text-sm sm:leading-6">
                Get these ready before mixing your dough.
              </p>
              <div className="mt-4 grid gap-5 sm:mt-6 md:grid-cols-2 md:gap-6">
                <div>
                  <h3 className="text-sm font-extrabold text-leaf">Ingredients for the dough</h3>
                  <ul className="mt-3 grid gap-2 text-sm font-bold text-ink/70 sm:gap-3">
                    {doughPrepIngredients.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf/10 text-xs text-leaf" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-leaf">Tools</h3>
                  <ul className="mt-3 grid gap-2 text-sm font-bold text-ink/70 sm:gap-3">
                    {doughPrepTools.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf/10 text-xs text-leaf" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 rounded-2xl bg-sky-50 p-3 text-sm font-bold leading-6 text-ink/65 sm:mt-6 sm:p-4">
                That’s enough to start the dough.
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:rounded-[2rem] sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Dough amounts</h2>
              <p className="mt-1 text-xs leading-5 text-ink/55 sm:mt-2 sm:text-sm sm:leading-6">
                Use these amounts when mixing your dough. We recommend weighing ingredients with a digital scale.
              </p>
              <dl className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
                {doughIngredients.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-cream p-3.5 sm:p-4">
                    <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                    <dd className={`mt-1 text-2xl font-extrabold ${amountCardTone(label)}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              {result.ingredients.leavener > 0 && result.ingredients.leavener < 1 && (
                <p className="mt-4 rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-ink/60">
                  Yeast can be a very small amount. A precision scale helps.
                </p>
              )}
            </article>

            <article className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:rounded-[2rem] sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Next step</h2>
              <p className="mt-1 text-sm leading-6 text-ink/55 sm:mt-2">
                Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.
              </p>
            </article>
          </div>
        </section>

        <BottomActionBar
          back={(
            <Link
              href="/session/start"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            <Link
              href="/session/timeline"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Continue to Timeline →
            </Link>
          )}
        />
      </div>
    </main>
  );
}
