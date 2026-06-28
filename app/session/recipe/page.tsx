"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
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

  const doughIngredientRows = [
    { label: "Flour", value: formatGram(result.ingredients.flour), icon: "▣", description: "The base of your dough." },
    { label: "Water", value: formatGram(result.ingredients.water), icon: "💧", description: "Hydrates the flour." },
    { label: "Salt", value: formatGram(result.ingredients.salt), icon: "◌", description: "Adds flavor and strength." },
    { label: "Yeast", value: formatGram(result.ingredients.leavener), icon: "✺", description: "Helps the dough rise." },
    { label: "Total dough", value: formatGram(result.ingredients.total), icon: "🥣", description: "Your full dough batch.", summary: true },
  ];
  const doughPrepTools = [
    { label: "Digital scale", icon: "⚖️", description: "Weigh ingredients accurately." },
    { label: "Mixing bowl", icon: "🥣", description: "Big enough for mixing." },
    { label: "Dough scraper or sturdy spoon", icon: "🥄", description: "Helpful for mixing and handling." },
    { label: "Covered container or bowl", icon: "◒", description: "Keeps dough covered while it rests." },
  ];

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={6}>
        <SessionStepHero
          step={6}
          label="Dough plan"
          pageType="Reference page"
          title="Your dough plan is ready."
          body="Get your dough ingredients and amounts ready before you start."
          level={session.experienceLevel}
          hideMeta
        />

        <section className="mt-4 sm:mt-6" aria-label="Dough plan details">
          <div className="grid min-w-0 gap-4 sm:gap-5">
            <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-6 lg:p-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,.85fr)] lg:gap-6">
                <section aria-labelledby="ingredients-amounts-heading" className="min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="ingredients-amounts-heading" className="font-display text-2xl font-semibold">Ingredients & amounts</h3>
                    <span className="rounded-full bg-leaf/10 px-3 py-1.5 text-xs font-extrabold text-leaf">Weigh for best results</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/55">
                    Use these amounts when mixing your dough.
                  </p>
                  <dl className="mt-4 grid gap-2.5">
                    {doughIngredientRows.map((item) => (
                      <div key={item.label} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 ${item.summary ? "border-leaf/25 bg-leaf/[.08]" : "border-white/80 bg-white"}`}>
                        <dt className="contents">
                          <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-xl shadow-sm">{item.icon}</span>
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                            <span className="mt-0.5 block text-xs leading-4 text-ink/45">{item.description}</span>
                          </span>
                        </dt>
                        <dd className={`text-right text-xl font-extrabold sm:text-2xl ${amountCardTone(item.label)}`}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section aria-labelledby="dough-tools-heading" className="min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="dough-tools-heading" className="font-display text-2xl font-semibold">Tools</h3>
                    <span className="rounded-full bg-tomato/10 px-3 py-1.5 text-xs font-extrabold text-tomato">Have these ready</span>
                  </div>
                  <ul className="mt-4 grid gap-2.5">
                    {doughPrepTools.map((item) => (
                      <li key={item.label} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-white/80 bg-white p-3.5">
                        <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-xl shadow-sm">{item.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                          <span className="mt-0.5 block text-xs leading-4 text-ink/45">{item.description}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
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
      </SessionWorkspaceLayout>
    </main>
  );
}
