"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
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

const toppingChoicePresetIds: PizzaPresetId[] = [
  "margherita",
  "marinara",
  "diavola",
  "funghi",
];

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
  const toppingChoices = toppingChoicePresetIds
    .map((id) => findPizzaSessionPreset(id))
    .filter((preset): preset is NonNullable<typeof preset> => Boolean(preset));
  const renderNextActionCard = () => (
    <div className="rounded-2xl border border-leaf/15 bg-white p-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Next up</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Timeline</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">After shopping, check when to mix, rest, proof and bake.</p>
      <Link
        href="/session/timeline"
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
      >
        Continue to Timeline →
      </Link>
    </div>
  );

  const choosePreset = (nextPresetId: PizzaPresetId) => {
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList(nextPresetId);
    setSession(updatedSession ?? session);
    setPresetId(nextPresetId);
    setMissingReason(result.ok ? null : result.missingReason);
  };

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
      <SessionEmptyState
        eyebrow="Pizza Session shopping"
        title="No active pizza session"
        body="Start a Pizza Session first. DoughTools will save your shopping list locally in this browser on this device."
      />
    );
  }

  if (missingReason === "missing-pizza-count") {
    return (
      <SessionEmptyState
        eyebrow="Pizza Session shopping"
        title="Choose pizza count first."
        body="A shopping list needs to know how many pizzas you are making. Return to the session starter and choose the quantity."
        actionLabel="Return to Start Pizza Session →"
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.`}
      />
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={7}>
        <SessionStepHero
          step={7}
          label="Choose pizzas & shopping"
          pageType="Checklist page"
          title="Choose pizzas and build the shopping list."
          body="Pick the topping plan for this session, then check what you already have."
          level={session.experienceLevel}
          hideMeta
          desktopAside={renderNextActionCard()}
        >
          <div className="lg:hidden">
            {renderNextActionCard()}
          </div>
        </SessionStepHero>

        <section className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-5" aria-labelledby="choose-pizzas-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Choose toppings</p>
              <h2 id="choose-pizzas-heading" className="mt-1 font-display text-3xl font-semibold">What pizzas are you making?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                This choice is for toppings and shopping only. Dough style and dough formula stay in the Dough Plan.
              </p>
            </div>
            <span className="w-fit rounded-full bg-cream px-3 py-2 text-xs font-extrabold text-ink/55">
              Selected: {findPizzaSessionPreset(presetId)?.name ?? "Pizza"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {toppingChoices.map((preset) => {
              const selected = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => choosePreset(preset.id)}
                  aria-pressed={selected}
                  className={`min-h-32 rounded-[1.35rem] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 ${
                    selected
                      ? "border-tomato/45 bg-tomato/[.08] shadow-sm"
                      : "border-ink/10 bg-cream/65 hover:border-tomato/25 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{preset.marker}</span>
                      <span className="text-sm font-extrabold text-ink">{preset.name}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${selected ? "bg-tomato text-white" : "bg-white text-ink/45"}`}>
                      {selected ? "Selected" : "Choose"}
                    </span>
                  </span>
                  <span className="mt-3 block text-sm leading-5 text-ink/60">{preset.shortDescription}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-cream/60 p-3 text-xs font-bold leading-5 text-ink/55">
            V1 shopping supports Margherita, Marinara, Diavola and Funghi. Prosciutto, Quattro Formaggi, Capricciosa, Vegetariana, Nduja and Custom can be added when their shopping presets exist.
          </p>
        </section>

        <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/85 shadow-card sm:mt-6 sm:rounded-[2rem]" aria-label="Grouped shopping list">
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

        <BottomActionBar
          back={(
            <Link
              href="/session/recipe"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            <Link
              href="/session/timeline"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
            >
              Continue to Timeline →
            </Link>
          )}
        />

      </SessionWorkspaceLayout>
    </main>
  );
}
