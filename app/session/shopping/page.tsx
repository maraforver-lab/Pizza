"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  type PizzaSession,
  type PizzaSessionShoppingItem,
  pizzaSessionRecipeQuery,
} from "@/lib/pizza-session";
import {
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  pizzaSessionPresets,
  getPizzaSessionPreset,
  findPizzaSessionPreset,
  type PizzaPresetId,
} from "@/lib/pizza-session-presets";
import {
  formatShoppingListPlainText,
  generateAndSaveActiveShoppingList,
  generatePizzaSessionShoppingList,
  SHOPPING_LIST_LOCAL_ONLY_COPY,
  updateShoppingItemStatus,
  type ShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";

const statusOptions: Array<{ value: ShoppingItemStatus; label: string }> = [
  { value: "need_to_buy", label: "Need to buy" },
  { value: "already_have", label: "Already have" },
  { value: "bought", label: "Bought" },
];

function formatSessionTime(value?: string) {
  if (!value) return "Target time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Target time not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: PizzaSessionShoppingItem["status"], selected: boolean) {
  if (!selected) return "border-ink/10 bg-white text-ink/45";
  if (status === "bought") return "border-leaf/30 bg-leaf/10 text-leaf";
  if (status === "already_have") return "border-[#e8c98a]/40 bg-[#e8c98a]/20 text-ink";
  return "border-tomato/35 bg-tomato/10 text-tomato";
}

function presetCopy(session: PizzaSession, presetId: string) {
  const preset = getPizzaSessionPreset(presetId);
  if (session.experienceLevel === "pizza_nerd") return preset.pizzaNerdCopy;
  if (session.experienceLevel === "enthusiast") return preset.enthusiastCopy;
  return preset.beginnerCopy;
}

export default function SessionShoppingPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<PizzaPresetId>(pizzaSessionPresets[0].id);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList();
    setSession(updatedSession ?? null);
    setSelectedPresetId(findPizzaSessionPreset(updatedSession?.shoppingList?.presetId)?.id ?? pizzaSessionPresets[0].id);
    setMissingReason(result.ok ? null : result.missingReason);
    setReady(true);
  }, []);

  const generationResult = useMemo(
    () => generatePizzaSessionShoppingList(session ?? undefined, selectedPresetId),
    [session, selectedPresetId],
  );
  const shoppingList = session?.shoppingList?.presetId === selectedPresetId
    ? session.shoppingList
    : generationResult.ok
      ? generationResult.shoppingList
      : undefined;
  const selectedPreset = getPizzaSessionPreset(selectedPresetId);
  const recipeQuery = session ? pizzaSessionRecipeQuery(session) : "";
  const sauceHref = recipeQuery ? `/sauce?${recipeQuery}` : "/sauce";
  const toppingsHref = recipeQuery ? `/toppings?${recipeQuery}` : "/toppings";

  const choosePreset = (presetId: PizzaPresetId) => {
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList(presetId);
    setSelectedPresetId(presetId);
    setSession(updatedSession ?? session);
    setMissingReason(result.ok ? null : result.missingReason);
  };

  const changeStatus = (itemId: string, status: ShoppingItemStatus) => {
    if (!session) return;
    const updated = updateShoppingItemStatus(session, itemId, status);
    if (updated) setSession(updated);
  };

  const copyShoppingList = async () => {
    if (!session || !shoppingList || typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyMessage("Copy is not available in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(formatShoppingListPlainText(session, shoppingList));
      setCopyMessage("Shopping list copied as plain text.");
    } catch {
      setCopyMessage("Copy failed. You can still read the list here.");
    }
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading your local shopping list…
        </div>
      </main>
    );
  }

  if (!session || missingReason === "no-session") {
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session shopping</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none">No active session yet.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/60">
            Start a Pizza Session first. DoughTools will save your shopping list locally in this browser on this device.
          </p>
          <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            Start Pizza Session →
          </Link>
        </div>
      </main>
    );
  }

  if (missingReason === "missing-pizza-count") {
    return (
      <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session shopping</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none">Choose pizza count first.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/60">
            A shopping list needs to know how many pizzas you are making. Return to the session starter and choose the quantity.
          </p>
          <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.
          </p>
          <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            Return to Start Pizza Session →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <section
          aria-labelledby="session-shopping-heading"
          className="grid gap-5 rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#e8c98a]">Pizza Session shopping</p>
            <h1 id="session-shopping-heading" className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">Build your shopping list</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              Choose a pizza preset and turn your active session into a practical shopping list. This is local-first:
              no cloud sync, tracking or public sharing is active.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={session.experienceLevel} />
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                {session.pizzaCount ?? shoppingList?.pizzaCount ?? 0} pizzas
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                {formatSessionTime(session.targetEatTime)}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
            <button
              type="button"
              onClick={copyShoppingList}
              className="min-h-12 rounded-2xl bg-white px-5 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              Copy shopping list
            </button>
            <Link
              href="/session/timeline"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]"
            >
              Back to timeline →
            </Link>
          </div>
        </section>

        {copyMessage && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status">
            {copyMessage}
          </p>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Choose pizza preset</p>
            <div className="mt-4 grid gap-3">
              {pizzaSessionPresets.map((preset) => {
                const selected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => choosePreset(preset.id)}
                    aria-pressed={selected}
                    className={`rounded-[1.25rem] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${selected ? "border-tomato bg-tomato/10 text-ink shadow-sm" : "border-ink/10 bg-white text-ink/70 hover:border-tomato/40"}`}
                  >
                    <span className="block text-lg font-extrabold">{preset.marker} {preset.name}</span>
                    <span className="mt-1 block text-sm leading-5 text-ink/55">{preset.shortDescription}</span>
                    {selected && <span className="mt-2 block text-xs font-extrabold text-tomato">Selected</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/60">
              <strong className="text-ink">Why this preset:</strong> {selectedPreset.bestFor}
              <br />
              <span>{presetCopy(session, selectedPresetId)}</span>
            </div>
            <p className="mt-4 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              {SHOPPING_LIST_LOCAL_ONLY_COPY} No custom ingredient editor, cloud sync or public sharing is active yet.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/session/recipe" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Review dough plan →
              </Link>
              <Link href={sauceHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open Sauce tool →
              </Link>
              <Link href={toppingsHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open Toppings tool →
              </Link>
            </div>
          </aside>

          <section className="grid min-w-0 gap-4" aria-label="Grouped shopping list">
            {shoppingList?.groups.map((group) => (
              <article key={group.group} className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                <h2 className="font-display text-3xl font-semibold">{group.group === "Gear" ? "Optional gear" : group.group}</h2>
                <div className="mt-4 grid gap-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="rounded-[1.25rem] bg-cream p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold">{item.label}</h3>
                          {item.amount && <p className="mt-1 text-sm leading-5 text-ink/55">{item.amount}</p>}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[24rem]">
                          {statusOptions.map((option) => {
                            const selected = item.status === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => changeStatus(item.id, option.value)}
                                aria-pressed={selected}
                                className={`min-h-11 rounded-2xl border px-3 text-xs font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${statusClass(option.value, selected)}`}
                              >
                                {option.label}
                                {selected && <span className="sr-only"> selected</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white/70 p-5">
          <h2 className="font-display text-2xl font-semibold">What this list does not do yet</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Patch 34 intentionally avoids free-text ingredient editing and exact topping formulas. Use Sauce and Toppings
            tools for more detailed prep decisions, especially moisture and topping-load checks.
          </p>
        </section>

        <footer className="mt-10 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
