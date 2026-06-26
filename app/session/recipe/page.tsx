"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
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
      title: "No active session yet.",
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

const sessionNavItems = [
  ["Start", "/session/start"],
  ["Timeline", "/session/timeline"],
  ["Recipe", "/session/recipe"],
  ["Shopping", "/session/shopping"],
  ["Review", "/session/review"],
] as const;

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
      <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session recipe</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none">{copy.title}</h1>
          <p className="mt-4 text-sm leading-6 text-ink/60">{copy.body}</p>
          <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.
          </p>
          <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            {copy.action}
          </Link>
        </div>
      </main>
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
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/session/start"
          className="mb-5 inline-flex min-h-11 items-center rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/65 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          ← Back to Start
        </Link>

        <section
          aria-labelledby="session-recipe-heading"
          className="rounded-[2rem] bg-white/90 p-6 shadow-card sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Your dough plan</p>
              <h1 id="session-recipe-heading" className="mt-3 max-w-3xl font-display text-5xl font-semibold leading-none sm:text-6xl">Your dough plan is ready.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60">Here are your dough amounts and what you need before you start.</p>
            </div>
            <GuidanceModeBadge level={session.experienceLevel} />
          </div>
        </section>

        <section className="mt-6" aria-label="Dough plan details">
          <div className="grid min-w-0 gap-5">
            <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Before you start: get these ready</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                You only need the ingredients for the dough and a few basic tools.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-extrabold text-leaf">Ingredients for the dough</h3>
                  <ul className="mt-3 grid gap-3 text-sm font-bold text-ink/70">
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
                  <ul className="mt-3 grid gap-3 text-sm font-bold text-ink/70">
                    {doughPrepTools.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-leaf/10 text-xs text-leaf" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-6 rounded-2xl bg-sky-50 p-4 text-sm font-bold leading-6 text-ink/65">
                That’s it. You don’t need anything else to make the dough.
              </p>
            </article>

            <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Dough amounts</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                Use these amounts when mixing your dough. We recommend weighing ingredients with a digital scale.
              </p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {doughIngredients.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-cream p-4">
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

            <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Next step</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/session/timeline" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Continue to Timeline →
                </Link>
              </div>
              <p className="mt-4 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
                {PIZZA_SESSION_LOCAL_ONLY_COPY} Saved locally in this browser.
              </p>
            </article>
          </div>
        </section>

        <nav className="mt-6 rounded-[2rem] border border-white/80 bg-white/75 p-3 shadow-card" aria-label="Pizza Session navigation">
          <ul className="grid grid-cols-5 gap-2 text-center text-[0.68rem] font-extrabold text-ink/50 sm:text-sm">
            {sessionNavItems.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={label === "Recipe" ? "page" : undefined}
                  className={`block rounded-2xl px-2 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                    label === "Recipe" ? "bg-ink text-white" : "hover:bg-cream"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="mt-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
