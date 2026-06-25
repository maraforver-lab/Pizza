"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import type { PizzaSession } from "@/lib/pizza-session";
import { PIZZA_SESSION_LOCAL_ONLY_COPY } from "@/lib/pizza-session-storage";
import { getPizzaSessionPreset } from "@/lib/pizza-session-presets";
import {
  buildSessionRecipe,
  generateAndSaveActiveSessionRecipe,
  sessionRecipeQuery,
  type SessionRecipeBuildResult,
} from "@/lib/session-recipe";

function formatGram(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 10) return `${value.toFixed(2)} g`;
  return `${Math.round(value)} g`;
}

function formatDateTime(value?: string) {
  if (!value) return "Target time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Target time not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function bakingPathLabel(value?: string) {
  if (value === "pizza-oven") return "Pizza oven pizza";
  if (value === "pan-tray") return "Pan / tray pizza";
  if (value === "home-oven") return "Home oven pizza";
  return "Not set";
}

function flourLabel(value?: string) {
  if (value === "caputo-pizzeria") return "Caputo Pizzeria";
  if (value === "caputo-cuoco") return "Strong bread flour";
  if (value === "caputo-classica") return "All-purpose flour";
  return value ?? "Not set";
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

function levelIntro(session: PizzaSession) {
  if (session.experienceLevel === "pizza_nerd") {
    return "Your dough plan is ready. Advanced formula details are available below if you want to inspect the assumptions.";
  }
  if (session.experienceLevel === "enthusiast") {
    return "These dough numbers give you a repeatable starting point before the timeline and baking steps.";
  }
  return "Here are your dough amounts and what you need before you start.";
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

  const preset = getPizzaSessionPreset(session.pizzaPreset);
  const query = sessionRecipeQuery(result);
  const calculatorHref = query ? `/?${query}` : "/";
  const doctorHref = query ? `/doctor?${query}` : "/doctor";
  const rebuilt = buildSessionRecipe(session);
  const targetTime = formatDateTime(session.targetEatTime ?? session.targetBakeTime);
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
      <div className="mx-auto max-w-6xl">
        <section
          aria-labelledby="session-recipe-heading"
          className="rounded-[2rem] bg-white/90 p-6 shadow-card sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Your dough plan</p>
              <h1 id="session-recipe-heading" className="mt-3 max-w-3xl font-display text-5xl font-semibold leading-none sm:text-6xl">Your dough plan is ready.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60">{levelIntro(session)}</p>
            </div>
            <GuidanceModeBadge level={session.experienceLevel} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Pizza preset", `${preset.marker} ${preset.name}`],
              ["Target time", targetTime],
              ["Pizza count", `${result.settings.pizzas} pizzas`],
              ["Ball weight", `${result.settings.ballWeight} g`],
              ["Flour", flourLabel(result.settings.flourId)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-cream p-4">
                <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                <dd className="mt-1 text-base font-extrabold text-ink">{value}</dd>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/session/timeline"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              Continue to Timeline →
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              Save and continue later
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[21rem_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Session summary</p>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ["Baking path", bakingPathLabel(session.pizzaStyle)],
                ["Pizza preset", preset.name],
                ["Target time", targetTime],
                ["Pizza count", `${result.settings.pizzas}`],
                ["Ball weight", `${result.settings.ballWeight} g`],
                ["Flour", flourLabel(result.settings.flourId)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                  <dd className="mt-1 font-extrabold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              {PIZZA_SESSION_LOCAL_ONLY_COPY} This recipe snapshot is private and local for now.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/session/start" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Edit session choices
              </Link>
              <Link href={calculatorHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open full Calculator
              </Link>
              <Link href={doctorHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open Dough Doctor
              </Link>
            </div>
          </aside>

          <section className="grid min-w-0 gap-5" aria-label="Dough plan details">
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

            {session.experienceLevel !== "beginner" && (
              <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card sm:p-6">
                <h2 className="font-display text-3xl font-semibold">Why this matters</h2>
                <p className="mt-3 text-sm leading-6 text-ink/60">
                  Hydration, flour and fermentation decide how repeatable the dough feels. This session snapshot gives you
                  a stable baseline before you adjust handling or bake timing.
                </p>
              </article>
            )}

            {session.experienceLevel === "pizza_nerd" && rebuilt.ok && (
              <details className="rounded-[2rem] border border-ink/10 bg-ink p-5 text-white shadow-card sm:p-6">
                <summary className="cursor-pointer font-display text-3xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Advanced formula details
                </summary>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  These calculator-compatible params are stored locally without changing formula behavior.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/25 p-4 text-xs leading-5 text-white/80">
                  {JSON.stringify(rebuilt.recipeParams, null, 2)}
                </pre>
              </details>
            )}

            <article className="rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card sm:p-6">
              <h2 className="font-display text-3xl font-semibold">Next step</h2>
              <p className="mt-2 text-sm leading-6 text-ink/55">
                Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/session/timeline" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Continue to Timeline →
                </Link>
                <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Save and continue later
                </Link>
              </div>
            </article>
          </section>
        </section>

        <footer className="mt-8">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
