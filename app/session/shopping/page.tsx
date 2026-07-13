"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomActionBar, buttonClass, cardClass, statusPillClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionRouteState } from "@/components/session/SessionRouteState";
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
import { getShoppingPizzaImage } from "@/lib/shopping-pizza-images";

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

function pizzaChefRecommendation(pizzaType: PizzaSessionPizzaMixType) {
  if (pizzaType === "margherita") return "Perfect if you're making classic Neapolitan pizza.";
  if (pizzaType === "marinara") return "A traditional cheese-free classic.";
  if (pizzaType === "diavola") return "For spicy pizza lovers.";
  if (pizzaType === "funghi") return "Excellent with roasted mushrooms.";
  if (pizzaType === "prosciutto") return "Best finished with fresh arugula.";
  if (pizzaType === "quattro-formaggi") return "Rich, creamy and cheese-forward.";
  return "A good choice for a mixed pizza night.";
}

function ingredientIconKind(item: PizzaSessionShoppingItem) {
  const id = item.id.toLowerCase();
  const label = item.label.toLowerCase();
  if (id.includes("flour") || label.includes("flour")) return "flour";
  if (id.includes("water") || label.includes("water")) return "water";
  if (id.includes("salt") || label.includes("salt")) return "salt";
  if (id.includes("yeast") || label.includes("yeast")) return "yeast";
  if (id.includes("tomato") || label.includes("tomato")) return "tomato";
  if (id.includes("mozzarella") || id.includes("gorgonzola") || id.includes("parmesan") || id.includes("fontina") || label.includes("cheese")) return "cheese";
  if (id.includes("basil") || id.includes("arugula") || label.includes("basil") || label.includes("arugula")) return "herb";
  if (id.includes("mushroom") || label.includes("mushroom")) return "mushroom";
  if (id.includes("oil") || label.includes("oil")) return "oil";
  return "topping";
}

function IngredientIcon({ item }: { item: PizzaSessionShoppingItem }) {
  const kind = ingredientIconKind(item);
  const iconByKind: Record<string, DoughToolsIconName> = {
    cheese: "pizza",
    flour: "wheat",
    herb: "wheat",
    mushroom: "pizza",
    oil: "water",
    salt: "salt",
    tomato: "pizza",
    topping: "pizza",
    water: "water",
    yeast: "yeast",
  };

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cream text-tomato ring-1 ring-ink/5" aria-hidden="true">
      <DoughToolsIcon name={iconByKind[kind] ?? "pizza"} size={20} strokeWidth={1.9} />
    </span>
  );
}

export default function SessionShoppingPage() {
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [exportingImage, setExportingImage] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    try {
      const initialSession = getActivePizzaSession();
      const { session: updatedSession, result } = generateAndSaveActiveShoppingList();
      setSession(updatedSession ?? initialSession ?? null);
      setMissingReason(result.ok ? null : result.missingReason);
    } catch {
      setRouteError(true);
    } finally {
      setReady(true);
    }
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
  const shoppingItems = shoppingList?.groups.flatMap((group) => group.items) ?? [];
  const readyShoppingItems = shoppingItems.filter((item) => isItemReady(item.status)).length;
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

  if (routeError) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Start a new plan" }}
        body="Something interrupted the local session check. Try again, or start a fresh pizza plan."
        eyebrow="Shopping list"
        onRetry={() => window.location.reload()}
        title="We couldn’t open your shopping list."
        variant="error"
      />
    );
  }

  if (!ready) {
    return (
      <SessionRouteState
        body="Checking this browser for an active pizza plan before building the shopping list."
        eyebrow="Shopping list"
        title="Opening your shopping list"
        variant="checking"
      />
    );
  }

  if (!session || missingReason === "no-session") {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Create my pizza plan" }}
        body="Your shopping list is created from your pizza and dough plan."
        eyebrow="Shopping list"
        title="No shopping list yet"
        variant="no-session"
      />
    );
  }

  if (missingReason) {
    return (
      <SessionRouteState
        action={{ href: "/session/recipe", label: "Open Dough Plan" }}
        body="Complete your dough plan first so DoughTools can build the ingredients and pizza menu from a valid plan."
        eyebrow="Shopping list"
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.`}
        title="Your shopping list is not ready yet."
        variant="step-unavailable"
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

        <section className={cardClass({ className: "mt-4 p-4 sm:mt-6 sm:p-5", variant: "guidance" })} aria-label="Pizza menu allocation">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Pizza Menu</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">Choose your pizzas</h2>
            </div>
            <span className={statusPillClass({ className: "bg-background-subtle text-ink/55", variant: "info" })}>
              Total selected: {allocatedPizzaCount}/{pizzaCount || "—"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PIZZA_MIX_OPTIONS.map((option) => {
              const quantity = pizzaMix?.[option.id] ?? 0;
              const selected = quantity > 0;
              const canIncrement = canIncrementPizzaType(option.id, pizzaMix);
              const canDecrement = option.id !== "margherita" && quantity > 0;
              const image = getShoppingPizzaImage(option.id);
              return (
                <article
                  key={option.id}
                  aria-label={`${option.name}: ${quantity} selected`}
                  className={`flex min-w-0 flex-col overflow-hidden rounded-card border text-left transition focus-within:ring-2 focus-within:ring-focus-ring focus-within:ring-offset-2 ${
                    selected
                      ? "border-action-primary/45 bg-background-card shadow-card"
                      : "border-ink/10 bg-background-subtle/65 hover:border-action-primary/25 hover:bg-background-card"
                  }`}
                >
                  <figure className="bg-background-subtle">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={image.width}
                      height={image.height}
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                      style={{ objectPosition: image.objectPosition }}
                    />
                  </figure>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="[overflow-wrap:anywhere] text-base font-extrabold leading-5 text-ink">{option.name}</h3>
                        {selected && (
                          <span className="mt-1 inline-flex rounded-full bg-action-primary/10 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-action-primary">
                            Selected
                          </span>
                        )}
                      </div>
                      <span className={statusPillClass({ className: "px-2.5 py-1 text-[11px]", variant: selected ? "selected" : "archived" })}>
                        {quantity} pizza{quantity === 1 ? "" : "s"}
                      </span>
                    </div>
                    <span className="mt-3 block text-sm leading-5 text-ink/60">{option.shortDescription}</span>
                    <span className="mt-2 block text-xs font-bold leading-5 text-ink/45">{option.ingredientSummary}</span>
                    <p className="mt-3 rounded-2xl bg-cream/75 px-3 py-2 text-xs font-extrabold leading-5 text-ink/60">
                      {pizzaChefRecommendation(option.id)}
                    </p>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 p-2 ring-1 ring-ink/5">
                        <button
                          type="button"
                          onClick={() => updatePizzaMix(option.id, -1)}
                          disabled={!canDecrement}
                          aria-label={`Decrease ${option.name} quantity`}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-white text-xl font-extrabold text-ink/70 transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <DoughToolsIcon name="remove" size={20} strokeWidth={2.4} />
                        </button>
                        <span className="text-2xl font-extrabold tabular-nums text-ink">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updatePizzaMix(option.id, 1)}
                          disabled={!canIncrement}
                          aria-label={`Increase ${option.name} quantity`}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-white text-xl font-extrabold text-ink/70 transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <DoughToolsIcon name="add" size={20} strokeWidth={2.4} />
                        </button>
                      </div>
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

        <section className={cardClass({ className: "mt-4 overflow-hidden p-0 sm:mt-6", variant: "guidance" })} aria-labelledby="shopping-checklist-heading">
          <div className="border-b border-ink/10 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Shopping Checklist</p>
                <h2 id="shopping-checklist-heading" className="mt-1 font-display text-2xl font-semibold">Shopping Checklist</h2>
                <p className="mt-1 text-sm leading-6 text-ink/60">
                  Dough amounts come from the Dough Plan. Toppings follow the selected pizza mix.
                </p>
              </div>
              <div className={cardClass({ className: "px-4 py-3 shadow-none", variant: "success" })}>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Shopping progress</p>
                <p className="mt-1 text-sm font-extrabold text-ink">{readyShoppingItems} / {shoppingItems.length} ingredients ready</p>
              </div>
            </div>
            {fermentationDisplay?.mode && (
              <p className={statusPillClass({ className: "mt-3 px-3 py-2", variant: "success" })}>
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
                      className={`grid min-h-16 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition hover:bg-cream/70 sm:grid-cols-[auto_minmax(0,1fr)_minmax(8rem,auto)_auto] sm:gap-4 sm:px-5 sm:py-4 ${
                        readyItem ? "bg-leaf/[.045]" : "bg-white/40"
                      }`}
                    >
                      <IngredientIcon item={item} />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                        {item.amount && <span className="mt-1 block text-sm leading-5 text-ink/50 sm:hidden">{item.amount}</span>}
                      </span>
                      {item.amount && <span className="hidden min-w-0 [overflow-wrap:anywhere] text-sm font-bold text-ink/55 sm:block">{item.amount}</span>}
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

        <section className={cardClass({ className: "mt-4 p-4 shadow-sm sm:mt-6 sm:p-5", variant: "success" })} aria-labelledby="before-timeline-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Before Timeline</p>
          <h2 id="before-timeline-heading" className="mt-2 font-display text-2xl font-semibold">Before Timeline</h2>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-ink/65">
            Download the shopping image if you want it, then continue to the Timeline.
          </p>
        </section>

        {shoppingList && (
          <section className={cardClass({ className: "mt-4 p-4 sm:mt-6 sm:p-5", variant: "guidance" })} aria-labelledby="shopping-image-export-heading">
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
                className={buttonClass({ className: "w-full sm:w-auto", tone: "dark" })}
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
              className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
            >
              Back
            </Link>
          )}
          primary={(
            <Link
              href="/session/timeline"
              className={buttonClass({ className: "w-full sm:w-auto" })}
            >
              Continue to Timeline →
            </Link>
          )}
        />

      </SessionWorkspaceLayout>
    </main>
  );
}
