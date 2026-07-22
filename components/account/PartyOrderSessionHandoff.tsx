"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/design-system";
import {
  isActiveCloudPizzaSessionConflictError,
  saveCloudActivePizzaSession,
  type ActiveCloudPizzaSessionConflict,
} from "@/lib/cloud-pizza-session-client";
import { resolveCanonicalActivePizzaSession } from "@/lib/canonical-active-pizza-session";
import { isPizzaCatalogId } from "@/lib/pizza-catalog";
import { createPizzaSession, type PizzaSession, type PizzaSessionPizzaMix } from "@/lib/pizza-session";
import { savePizzaSession, setActivePizzaSession } from "@/lib/pizza-session-storage";
import {
  partyOrderDateTimeLabel,
  type PartyOrderActivity,
  type PartyOrderPizzaMixItem,
  type PartyOrderRow,
} from "@/lib/party-orders";

type PartyOrderSessionHandoffProps = {
  event: PartyOrderRow;
  activity: PartyOrderActivity;
};

type HandoffPayload = {
  partyOrderId: string;
  title: string;
  pizzaTime: string;
  pizzaCount: number;
  pizzaMix: PizzaSessionPizzaMix;
  pizzaMixRows: PartyOrderPizzaMixItem[];
  skippedPizzaNames: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeHandoffPayload(value: unknown): HandoffPayload | undefined {
  if (!isRecord(value)) return undefined;
  const partyOrderId = typeof value.partyOrderId === "string" ? value.partyOrderId : "";
  const title = typeof value.title === "string" ? value.title : "";
  const pizzaTime = typeof value.pizzaTime === "string" ? value.pizzaTime : "";
  const pizzaCount = typeof value.pizzaCount === "number" && Number.isFinite(value.pizzaCount)
    ? Math.floor(value.pizzaCount)
    : 0;
  const pizzaMix = isRecord(value.pizzaMix)
    ? Object.fromEntries(Object.entries(value.pizzaMix).flatMap(([key, raw]) => {
      const quantity = typeof raw === "number" ? Math.floor(raw) : Number(raw);
      return key && Number.isInteger(quantity) && quantity > 0 ? [[key, quantity]] : [];
    })) as PizzaSessionPizzaMix
    : {};
  const pizzaMixRows = Array.isArray(value.pizzaMixRows)
    ? value.pizzaMixRows.flatMap((item) => {
      if (!isRecord(item)) return [];
      const pizzaId = typeof item.pizza_id === "string" ? item.pizza_id : "";
      const snapshot = typeof item.pizza_name_snapshot === "string" ? item.pizza_name_snapshot : "";
      const quantity = typeof item.quantity === "number" ? Math.floor(item.quantity) : Number(item.quantity);
      return pizzaId && snapshot && Number.isInteger(quantity) && quantity > 0
        ? [{ pizza_id: pizzaId, pizza_name_snapshot: snapshot, quantity }]
        : [];
    })
    : [];
  const skippedPizzaNames = Array.isArray(value.skippedPizzaNames)
    ? value.skippedPizzaNames.flatMap((name) => typeof name === "string" && name.trim() ? [name.trim()] : [])
    : [];

  if (!partyOrderId || !title || !pizzaTime || pizzaCount < 1) return undefined;
  return { partyOrderId, title, pizzaTime, pizzaCount, pizzaMix, pizzaMixRows, skippedPizzaNames };
}

export function PartyOrderSessionHandoff({ event, activity }: PartyOrderSessionHandoffProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeConflict, setActiveConflict] = useState<ActiveCloudPizzaSessionConflict | null>(null);
  const [confirmingStartNew, setConfirmingStartNew] = useState(false);
  const [pendingSession, setPendingSession] = useState<PizzaSession | null>(null);
  const hasGuestOrders = activity.totalPizzaCount > 0;
  const unsupportedPizzaNames = activity.pizzaMix
    .filter((pizza) => !isPizzaCatalogId(pizza.pizza_id))
    .map((pizza) => pizza.pizza_name_snapshot);

  const persistSessionFromOrder = async (session: PizzaSession, replaceActiveSession = false) => {
    const saved = savePizzaSession(session);
    setPendingSession(saved);
    const result = await saveCloudActivePizzaSession(saved, {
      expectedActiveCloudRowId: activeConflict?.activeCloudRowId ?? activeConflict?.cloudRowId,
      expectedActiveSessionId: activeConflict?.activeSessionId ?? activeConflict?.cloudSessionId,
      replaceActiveSession,
    });
    if ("skipped" in result) throw new Error("Sign in to create a pizza plan from this Party Order.");
    setActivePizzaSession(saved.id);
    router.push("/session/start?handoff=1");
  };

  const createSessionFromOrder = async () => {
    setSubmitting(true);
    setError("");
    setActiveConflict(null);
    setConfirmingStartNew(false);
    try {
      const response = await fetch(`/api/party-orders/${event.id}/session-handoff`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Pizza plan could not be created from this order.");
      const handoff = normalizeHandoffPayload(payload.handoff);
      if (!handoff) throw new Error("Pizza plan handoff data could not be verified.");

      const session = createPizzaSession({
        status: "planning",
        currentStep: "style",
        targetEatTime: handoff.pizzaTime,
        pizzaCount: handoff.pizzaCount,
        pizzaMix: handoff.pizzaMix,
      });
      setPendingSession(session);
      await persistSessionFromOrder(session);
    } catch (caught) {
      if (isActiveCloudPizzaSessionConflictError(caught)) {
        setActiveConflict(caught.conflict);
        setError("");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Pizza plan could not be created from this order.");
    } finally {
      setSubmitting(false);
    }
  };

  const continueExistingSession = async () => {
    if (!activeConflict || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const canonical = await resolveCanonicalActivePizzaSession();
      if (canonical.state === "active") {
        router.push(canonical.href);
        return;
      }
      if (activeConflict.resumeRoute) {
        router.push(activeConflict.resumeRoute);
        return;
      }
      setError("We could not open the existing active pizza plan. Try again from Account.");
    } catch {
      setError("We could not open the existing active pizza plan. Try again from Account.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmCreateFromOrder = async () => {
    if (!pendingSession || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await persistSessionFromOrder(pendingSession, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pizza plan could not be created from this order.");
    } finally {
      setSubmitting(false);
    }
  };

  const keepPartyOrderSetup = () => {
    setActiveConflict(null);
    setConfirmingStartNew(false);
    setError("");
  };

  return (
    <section className="mt-5 rounded-[1.5rem] border border-tomato/15 bg-tomato/[.055] p-4" aria-labelledby="party-order-production-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Plan production</p>
          <h2 id="party-order-production-heading" className="mt-2 font-display text-2xl font-semibold">
            Create pizza plan from this order
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Start a normal pizza plan using this party’s pizza time, total pizza count and pizza mix.
          </p>
        </div>
        <button
          type="button"
          onClick={createSessionFromOrder}
          disabled={!hasGuestOrders || submitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-55 lg:w-auto"
        >
          {submitting ? "Creating pizza plan…" : "Create pizza plan from this order"}
        </button>
      </div>

      {hasGuestOrders ? (
        <div className="mt-4 rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
          <p className="text-sm font-extrabold text-ink">This will start a normal pizza plan with:</p>
          <div className="mt-3 grid gap-2 text-sm font-bold leading-6 text-ink/68">
            <p>Pizza time: <span className="text-ink">{partyOrderDateTimeLabel(event.pizza_datetime, event.time_zone)}</span></p>
            <p>Total pizzas: <span className="text-ink">{activity.totalPizzaCount}</span></p>
          </div>
          <div className="mt-3 grid gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Pizza mix</p>
            {activity.pizzaMix.map((pizza) => (
              <p key={pizza.pizza_id} className="flex items-center justify-between gap-4 rounded-2xl bg-cream/70 px-3 py-2 text-sm font-bold text-ink/70">
                <span>{pizza.pizza_name_snapshot}</span>
                <span className="shrink-0 font-extrabold text-ink">{pizza.quantity}</span>
              </p>
            ))}
          </div>
          {unsupportedPizzaNames.length > 0 && (
            <p className="mt-3 rounded-2xl bg-flour/70 p-3 text-xs font-bold leading-5 text-ink/55">
              Review these older pizza names in the normal pizza plan flow: {unsupportedPizzaNames.join(", ")}.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/80 p-4 text-sm font-bold leading-6 text-ink/60">
          Collect at least one guest order before creating a pizza plan.
        </p>
      )}

      {error && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{error}</p>}
      {activeConflict && (
        <div className="mt-4 rounded-[1.25rem] border border-tomato/20 bg-white/85 p-4" aria-labelledby="party-order-active-session-conflict-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Active account pizza plan</p>
          <h3 id="party-order-active-session-conflict-heading" className="mt-2 font-display text-2xl font-semibold leading-tight">
            You already have an unfinished pizza
          </h3>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/62">
            Continue it, or replace it with this Party Order plan.
          </p>
          {!confirmingStartNew ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <button type="button" onClick={continueExistingSession} disabled={submitting} className={buttonClass({ className: "min-h-12 px-5" })}>
            Continue your pizza plan
              </button>
              <button type="button" onClick={keepPartyOrderSetup} disabled={submitting} className={buttonClass({ className: "min-h-12 px-5", variant: "secondary" })}>
                Keep Party Order setup
              </button>
              <button type="button" onClick={() => setConfirmingStartNew(true)} disabled={submitting} className={buttonClass({ className: "min-h-12 px-5", variant: "secondary" })}>
                Use this Party Order plan
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-ink/10 bg-cream/65 p-4">
              <p className="text-sm font-bold leading-6 text-ink/62">
                Your current unfinished pizza plan will be permanently removed. This Party Order plan will become your active pizza plan.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={keepPartyOrderSetup} disabled={submitting} className={buttonClass({ className: "min-h-12 px-5", variant: "secondary" })}>
                  Keep current pizza
                </button>
                <button type="button" onClick={confirmCreateFromOrder} disabled={submitting} className={buttonClass({ className: "min-h-12 px-5" })}>
                {submitting ? "Creating pizza plan…" : "Replace and create Party Order plan"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
