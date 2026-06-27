"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import {
  type PizzaSession,
  type PizzaSessionShoppingItem,
} from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  findPizzaSessionPreset,
  pizzaSessionPresets,
  type PizzaPresetId,
} from "@/lib/pizza-session-presets";
import {
  generateAndSaveActiveShoppingList,
  generatePizzaSessionShoppingList,
  SHOPPING_LIST_LOCAL_ONLY_COPY,
  updateShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";

function isItemReady(status: PizzaSessionShoppingItem["status"]) {
  return status === "already_have" || status === "bought";
}

function sectionLabel(group: string) {
  if (group === "Dough") return "Dough essentials";
  if (group === "Sauce") return "Sauce";
  if (group === "Cheese") return "Cheese";
  if (group === "Toppings") return "Toppings";
  if (group === "Gear") return "Optional gear";
  return group;
}

function selectedPresetId(session: PizzaSession | null): PizzaPresetId {
  return (
    findPizzaSessionPreset(session?.shoppingList?.presetId)?.id
    ?? findPizzaSessionPreset(session?.pizzaPreset)?.id
    ?? pizzaSessionPresets[0].id
  );
}

export default function SessionShoppingPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [presetId, setPresetId] = useState<PizzaPresetId>(pizzaSessionPresets[0].id);
  const [missingReason, setMissingReason] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const initialSession = getActivePizzaSession();
    const resolvedPreset = selectedPresetId(initialSession ?? null);
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList(resolvedPreset);
    setSession(updatedSession ?? initialSession ?? null);
    setPresetId(resolvedPreset);
    setMissingReason(result.ok ? null : result.missingReason);
    setReady(true);
  }, []);

  const generationResult = useMemo(
    () => generatePizzaSessionShoppingList(session ?? undefined, presetId),
    [session, presetId],
  );
  const shoppingList = session?.shoppingList?.presetId === presetId
    ? session.shoppingList
    : generationResult.ok
      ? generationResult.shoppingList
      : undefined;
  const pizzaCount = session?.pizzaCount ?? shoppingList?.pizzaCount ?? session?.recipeSnapshot?.balls;

  const toggleReady = (item: PizzaSessionShoppingItem) => {
    if (!session) return;
    const updated = updateShoppingItemStatus(
      session,
      item.id,
      isItemReady(item.status) ? "need_to_buy" : "already_have",
    );
    if (updated) setSession(updated);
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
      <div className="mx-auto max-w-5xl">
        <SessionStepHero
          step={8}
          label="Shopping list"
          pageType="Checklist page"
          title="Your shopping list"
          body="Check what you already have before you start cooking."
          level={session.experienceLevel}
          desktopAside={(
            <>
              <strong className="block text-ink">Step 8: Shopping list</strong>
              {pizzaCount ? `Built for ${pizzaCount} ${pizzaCount === 1 ? "pizza" : "pizzas"}. ` : ""}
              This is a preparation checklist for your kitchen.
            </>
          )}
        />

        <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/85 shadow-card sm:mt-6 sm:rounded-[2rem]" aria-label="Grouped shopping list">
          <div className="border-b border-ink/10 p-4 sm:p-5">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Checklist groups</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Check what you already have.</h2>
            <p className="mt-1 text-xs leading-5 text-ink/60 sm:mt-2 sm:text-sm sm:leading-6">
              Mark items as Have when they are ready. Unchecked items stay marked as Need.
            </p>
          </div>
          {shoppingList?.groups.map((group) => (
            <section key={group.group} className="border-b border-ink/10 last:border-b-0">
              <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="text-sm font-extrabold uppercase tracking-[.14em] text-ink/70">{sectionLabel(group.group)}</h3>
                <span className="text-sm font-bold text-ink/45">{group.items.length} {group.items.length === 1 ? "item" : "items"}</span>
              </div>
              <div className="divide-y divide-ink/10">
                {group.items.map((item) => {
                  const readyItem = isItemReady(item.status);
                  return (
                    <label
                      key={item.id}
                      className="grid min-h-14 cursor-pointer grid-cols-[1fr_auto] gap-3 px-4 py-3 transition hover:bg-cream/70 sm:min-h-16 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,auto)_5rem_auto] sm:items-center sm:gap-4 sm:px-5 sm:py-4"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                        {item.amount && <span className="mt-1 block text-sm leading-5 text-ink/50 sm:hidden">{item.amount}</span>}
                      </span>
                      {item.amount && <span className="hidden text-sm font-bold text-ink/55 sm:block">{item.amount}</span>}
                      <span className={`text-sm font-extrabold ${readyItem ? "text-leaf" : "text-tomato"}`}>
                        {readyItem ? "Have" : "Need"}
                      </span>
                      <input
                        type="checkbox"
                        checked={readyItem}
                        onChange={() => toggleReady(item)}
                        aria-label={`Mark ${item.label} as ${readyItem ? "needed" : "ready"}`}
                        className="h-7 w-7 rounded-md border-ink/20 text-leaf focus:ring-2 focus:ring-tomato sm:h-6 sm:w-6"
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-leaf/15 bg-leaf/10 p-4 sm:mt-6 sm:rounded-[2rem] sm:p-5">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Next up</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Kitchen Mode</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">You’ll cook your pizzas step by step.</p>
          <SessionLocalOnlyNote>
            {SHOPPING_LIST_LOCAL_ONLY_COPY} No cloud sync, tracking, public sharing or account sync is active.
          </SessionLocalOnlyNote>
        </section>

        <BottomActionBar
          back={(
            <Link
              href="/session/timeline"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            <Link
              href="/session/kitchen"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
            >
              Next →
            </Link>
          )}
        />

      </div>
    </main>
  );
}
