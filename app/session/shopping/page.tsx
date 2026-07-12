"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import { ShoppingListExportCard } from "@/components/session/ShoppingListExportCard";
import {
  type PizzaSession,
  type PizzaSessionPizzaMix,
  type PizzaSessionPizzaMixType,
  type PizzaSessionShoppingItem,
} from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import {
  adjustPizzaMixAllocation,
  generateAndSaveActiveShoppingList,
  generatePizzaSessionShoppingList,
  normalizePizzaMixForCount,
  PIZZA_MIX_OPTIONS,
  updateShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { downloadShoppingListImage } from "@/lib/shopping-image-export";

function isItemReady(status: PizzaSessionShoppingItem["status"]) {
  return status === "already_have" || status === "bought";
}

function sectionLabel(group: string) {
  if (group === "Dough") return "Dough ingredients";
  if (group === "Sauce") return "Sauce";
  if (group === "Cheese") return "Cheese";
  if (group === "Toppings") return "Toppings";
  if (group === "Gear") return "Optional gear";
  return group;
}

function pizzaMenuImagePath(pizzaType: PizzaSessionPizzaMixType) {
  if (pizzaType === "margherita") return "/pizza-styles/neapolitan.webp";
  if (pizzaType === "marinara") return "/sauce/marinara.webp";
  if (pizzaType === "diavola") return "/pizza-styles/new-york.webp";
  if (pizzaType === "funghi") return "/toppings/balanced.webp";
  if (pizzaType === "prosciutto") return "/pizza-styles/contemporary.webp";
  if (pizzaType === "quattro-formaggi") return "/pizza-styles/roman-thin.webp";
  return "/pizza-styles/neapolitan.webp";
}

export default function SessionShoppingPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [exportingImage, setExportingImage] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const initialSession = getActivePizzaSession();
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList();
    setSession(updatedSession ?? initialSession ?? null);
    setMissingReason(result.ok ? null : result.missingReason);
    setReady(true);
  }, []);

  const generationResult = useMemo(
    () => generatePizzaSessionShoppingList(session ?? undefined),
    [session],
  );
  const recipeResult = useMemo(() => buildSessionRecipe(session ?? undefined), [session]);
  const fermentationDisplay = recipeResult.ok
    ? buildSessionFermentationDisplay({
      session,
      snapshot: recipeResult.recipeSnapshot,
      basis: recipeResult.continuousYeast?.recommendation,
    })
    : session
      ? buildSessionFermentationDisplay({ session, snapshot: session.recipeSnapshot })
      : undefined;
  const shoppingList = session?.shoppingList ?? (generationResult.ok ? generationResult.shoppingList : undefined);
  const pizzaCount = session?.pizzaCount ?? session?.recipeSnapshot?.balls ?? 0;
  const pizzaMix = pizzaCount > 0
    ? normalizePizzaMixForCount(pizzaCount, session?.pizzaMix, session?.pizzaPreset)
    : undefined;
  const allocatedPizzaCount = pizzaMix
    ? Object.values(pizzaMix).reduce((total, value) => total + value, 0)
    : 0;
  const updatePizzaMix = (pizzaType: PizzaSessionPizzaMixType, delta: number) => {
    if (!session || !pizzaMix || pizzaCount < 1) return;
    const nextMix = adjustPizzaMixAllocation(pizzaMix, pizzaType, delta, pizzaCount);
    const { session: updatedSession, result } = generateAndSaveActiveShoppingList(undefined, undefined, new Date(), nextMix);
    setSession(updatedSession ?? session);
    setMissingReason(result.ok ? null : result.missingReason);
  };

  const canIncrementPizzaType = (pizzaType: PizzaSessionPizzaMixType, currentMix: PizzaSessionPizzaMix | undefined) => {
    if (!currentMix || pizzaCount < 1) return false;
    if (pizzaType === "margherita") {
      return Object.entries(currentMix).some(([type, count]) => type !== "margherita" && Number(count) > 0);
    }
    return Number(currentMix.margherita ?? 0) > 0;
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

  const downloadShoppingImage = async () => {
    if (!exportCardRef.current || !shoppingList) return;
    setExportingImage(true);
    setExportError(null);
    try {
      await downloadShoppingListImage(exportCardRef.current);
    } catch {
      setExportError("Could not prepare the shopping image. Please try again.");
    } finally {
      setExportingImage(false);
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
      <CloudPizzaSessionSync session={session} />
      <SessionWorkspaceLayout activeStep={7}>
        <SessionStepHero
          step={7}
          label="Choose pizzas & Shopping"
          pageType="Checklist page"
          title="Shopping & Pizza Menu"
          body="Choose what you’ll make and get your ingredients ready."
          level={session.experienceLevel}
          hideMeta
        />

        <section className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-5" aria-label="Pizza menu allocation">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-end">
            <span className="w-fit rounded-full bg-cream px-3 py-2 text-xs font-extrabold text-ink/55">
              Total selected: {allocatedPizzaCount}/{pizzaCount || "—"}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PIZZA_MIX_OPTIONS.map((option) => {
              const quantity = pizzaMix?.[option.id] ?? 0;
              const selected = quantity > 0;
              const canIncrement = canIncrementPizzaType(option.id, pizzaMix);
              const canDecrement = option.id !== "margherita" && quantity > 0;
              return (
                <article
                  key={option.id}
                  className={`overflow-hidden rounded-[1.35rem] border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 ${
                    selected
                      ? "border-tomato/45 bg-tomato/[.08] shadow-sm"
                      : "border-ink/10 bg-cream/65 hover:border-tomato/25 hover:bg-white"
                  }`}
                >
                  <div className="relative h-28 overflow-hidden bg-cream sm:h-32" aria-hidden="true">
                    <Image
                      src={pizzaMenuImagePath(option.id)}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-white/5" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{option.marker}</span>
                        <span className="text-sm font-extrabold text-ink">{option.name}</span>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${selected ? "bg-tomato text-white" : "bg-white text-ink/45"}`}>
                        {quantity} pizza{quantity === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="mt-3 block text-sm leading-5 text-ink/60">{option.shortDescription}</span>
                    <span className="mt-2 block text-xs font-bold leading-5 text-ink/45">{option.ingredientSummary}</span>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => updatePizzaMix(option.id, -1)}
                        disabled={!canDecrement}
                        aria-label={`Decrease ${option.name} quantity`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-lg font-extrabold text-ink/70 transition hover:border-tomato/30 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        −
                      </button>
                      <span className="text-2xl font-extrabold tabular-nums text-ink">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updatePizzaMix(option.id, 1)}
                        disabled={!canIncrement}
                        aria-label={`Increase ${option.name} quantity`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white text-lg font-extrabold text-ink/70 transition hover:border-tomato/30 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-cream/60 p-3 text-xs font-bold leading-5 text-ink/55">
            V1 shopping supports Margherita, Marinara, Diavola, Funghi, Prosciutto and Quattro Formaggi. Margherita automatically fills any unallocated pizzas so the total always matches your pizza count.
          </p>
        </section>

        <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/85 shadow-card sm:mt-6 sm:rounded-[2rem]" aria-labelledby="shopping-checklist-heading">
          <div className="border-b border-ink/10 px-4 py-4 sm:px-5">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Shopping Checklist</p>
            <h2 id="shopping-checklist-heading" className="mt-1 font-display text-2xl font-semibold">Shopping Checklist</h2>
            <p className="mt-1 text-sm leading-6 text-ink/60">
              Dough ingredient amounts come from the Dough Plan. Topping ingredient amounts come from the selected pizza mix.
            </p>
            {fermentationDisplay?.mode && (
              <p className="mt-3 w-fit rounded-full bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">
                Fermentation: {fermentationDisplay.fullLabel}
              </p>
            )}
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
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                        {item.amount && <span className="mt-1 block text-sm leading-5 text-ink/50 sm:hidden">{item.amount}</span>}
                      </span>
                      {item.amount && <span className="hidden min-w-0 [overflow-wrap:anywhere] text-sm font-bold text-ink/55 sm:block">{item.amount}</span>}
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

        <section className="mt-4 rounded-[1.5rem] border border-leaf/20 bg-leaf/[.07] p-4 shadow-sm sm:mt-6 sm:rounded-[2rem] sm:p-5" aria-labelledby="before-timeline-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Before Timeline</p>
          <h2 id="before-timeline-heading" className="mt-2 font-display text-2xl font-semibold">Before Timeline</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-ink/65">
            Make sure everything is ready before your first dough step.
          </p>
        </section>

        {shoppingList && (
          <section className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-5" aria-labelledby="shopping-image-export-heading">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="shopping-image-export-heading" className="font-display text-2xl font-semibold">Save your shopping list</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">
                  Save a branded DoughTools shopping list to your phone or computer.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadShoppingImage}
                disabled={exportingImage}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 disabled:bg-ink/25 disabled:text-ink/45 sm:w-auto"
              >
                {exportingImage ? "Preparing image…" : "Download shopping image"}
              </button>
            </div>
            {exportError && (
              <p className="mt-3 rounded-2xl border border-tomato/20 bg-tomato/[.06] px-4 py-3 text-sm font-bold leading-6 text-tomato" role="status">
                {exportError}
              </p>
            )}
          </section>
        )}

        {session && shoppingList && (
          <div className="fixed -left-[10000px] top-0" aria-hidden="true">
            <ShoppingListExportCard ref={exportCardRef} session={session} shoppingList={shoppingList} />
          </div>
        )}

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
