"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import {
  normalizePartyOrderRow,
  partyOrderDateTimeLabel,
  partyOrderOwnerStatusSummary,
  type PartyOrderStatus,
  type PartyOrderRow,
} from "@/lib/party-orders";

function PartyOrderStatusPill({ event }: { event: PartyOrderRow }) {
  const statusSummary = partyOrderOwnerStatusSummary(event);
  const archived = event.status === "archived";
  const closed = statusSummary.label.toLowerCase().includes("closed");

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] ${
        archived
          ? "bg-ink/5 text-ink/50 ring-1 ring-ink/10"
          : closed
            ? "bg-oven-gold/18 text-ink/65 ring-1 ring-oven-gold/25"
            : "bg-leaf/10 text-leaf ring-1 ring-leaf/15"
      }`}
    >
      <DoughToolsIcon name={archived ? "archive" : closed ? "timer" : "success"} size={16} aria-hidden="true" />
      {statusSummary.label}
    </span>
  );
}

function PartyOrderListCard({
  event,
  featured = false,
  onRestore,
  restoring,
}: {
  event: PartyOrderRow;
  featured?: boolean;
  onRestore?: (event: PartyOrderRow) => void;
  restoring?: boolean;
}) {
  const statusSummary = partyOrderOwnerStatusSummary(event);
  const archived = event.status === "archived";
  const primaryLabel = archived
    ? "View archived party"
    : statusSummary.canClose
      ? "Share ordering link"
      : "Prepare this party";
  const secondaryLabel = archived ? "View reference" : "View guest orders";

  return (
    <article
      className={`rounded-[1.75rem] border p-4 sm:p-5 ${
        archived
          ? "border-ink/10 bg-white/70 shadow-none"
          : featured
            ? "border-leaf/20 bg-white shadow-card"
            : "border-white/80 bg-white/88 shadow-sm"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.42fr)] lg:items-start">
        <div className="min-w-0 [overflow-wrap:anywhere]">
          {featured && !archived && (
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Current pizza party</p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">{event.title}</h3>
              <p className="mt-2 text-sm font-bold text-ink/58">Pizza time: {partyOrderDateTimeLabel(event.pizza_datetime, event.time_zone)}</p>
            </div>
            <PartyOrderStatusPill event={event} />
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.1rem] bg-cream/70 p-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/40">Guest ordering</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{statusSummary.label}</dd>
            </div>
            <div className="rounded-[1.1rem] bg-cream/70 p-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/40">Guest orders</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{archived ? "Reference only" : "View inside party"}</dd>
            </div>
            <div className="rounded-[1.1rem] bg-cream/70 p-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/40">Menu</dt>
              <dd className="mt-1 text-sm font-extrabold text-ink">{event.allowed_pizza_ids.length} pizza options</dd>
            </div>
            <div className="rounded-[1.1rem] bg-cream/70 p-3">
              <dt className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/40">Orders close</dt>
              <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">{partyOrderDateTimeLabel(event.orders_close_at, event.time_zone)}</dd>
            </div>
          </dl>

          <p className={`mt-4 rounded-2xl p-3 text-sm font-bold leading-6 ${
            archived ? "bg-ink/5 text-ink/52" : "bg-leaf/[.07] text-ink/62"
          }`}
          >
            {archived
              ? "Archived parties stay available for reference, but guests cannot submit or edit orders."
              : statusSummary.helper}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-stretch">
          <Link
            href={`/account/party-orders/${event.id}`}
            className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
              archived
                ? "border border-ink/10 bg-white text-ink/70 hover:border-ink/25"
                : "bg-ink text-white shadow-sm hover:bg-ink/90"
            }`}
          >
            {primaryLabel}
          </Link>
          <Link
            href={`/account/party-orders/${event.id}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {secondaryLabel}
          </Link>
          {onRestore && (
            <button
              type="button"
              onClick={() => onRestore(event)}
              disabled={restoring}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {restoring ? "Restoring…" : "Restore party order"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function PartyOrdersList() {
  const [events, setEvents] = useState<PartyOrderRow[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [restoringId, setRestoringId] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadEvents() {
      setReady(false);
      setError("");
      try {
        const response = await fetch("/api/party-orders");
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Party Orders could not be loaded.");
        const rows: unknown[] = Array.isArray(payload.events) ? payload.events : [];
        if (mounted) setEvents(rows.flatMap((row) => {
          const event = normalizePartyOrderRow(row);
          return event ? [event] : [];
        }));
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "Party Orders could not be loaded.");
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadEvents();
    return () => {
      mounted = false;
    };
  }, []);

  const activeEvents = events.filter((event) => event.status !== "archived");
  const archivedEvents = events.filter((event) => event.status === "archived");

  const updateEventStatus = async (event: PartyOrderRow, status: PartyOrderStatus) => {
    setRestoringId(event.id);
    setStatusMessage("");
    setStatusError("");
    try {
      const response = await fetch(`/api/party-orders/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Party Order status could not be updated.");
      const nextEvent = normalizePartyOrderRow(payload.event);
      if (!nextEvent) throw new Error("Party Order status could not be verified.");
      setEvents((current) => current.map((item) => item.id === nextEvent.id ? nextEvent : item));
      setStatusMessage(nextEvent.status === "archived" ? "Party Order archived." : "Party Order restored.");
    } catch (caught) {
      setStatusError(caught instanceof Error ? caught.message : "Party Order status could not be updated.");
    } finally {
      setRestoringId("");
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="party-orders-heading">
      <nav aria-label="Account breadcrumb" className="text-sm font-extrabold text-ink/50">
        <Link href="/account" className="rounded-sm underline-offset-2 hover:text-tomato hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          Account
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Party Orders</span>
      </nav>

      <div className="rounded-[2rem] border border-white/80 bg-white p-5 shadow-card sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-leaf">Party Orders</p>
            <h1 id="party-orders-heading" className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Plan the menu. Let guests choose.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/62">
              Create a pizza party, share the ordering link, collect guest choices, and turn the final menu into a pizza plan.
            </p>
          </div>
          <Link
            href="/account/party-orders/new"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
          >
            Create a pizza party
          </Link>
        </div>
      </div>

      {!ready && (
        <div className="rounded-[1.75rem] border border-ink/10 bg-white/75 p-5 text-sm font-bold text-ink/50 shadow-sm">
          Loading Party Orders…
        </div>
      )}
      {error && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}
      {statusMessage && <p role="status" className="rounded-2xl bg-leaf/10 p-4 text-sm font-extrabold text-leaf">{statusMessage}</p>}
      {statusError && <p role="alert" className="rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{statusError}</p>}

      {ready && !error && activeEvents.length === 0 && archivedEvents.length === 0 && (
        <section className="rounded-[2rem] border border-dashed border-ink/15 bg-white/82 p-5 shadow-sm sm:p-7" aria-labelledby="party-orders-empty-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Your pizza parties</p>
          <h2 id="party-orders-empty-heading" className="mt-3 font-display text-3xl font-semibold">Plan your first pizza party</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/62">
            Create the menu, share one link with your guests, and collect everyone’s pizza choices in one place.
          </p>
          <ol className="mt-5 grid gap-2 text-sm font-bold text-ink/66 sm:grid-cols-3">
            <li className="rounded-2xl bg-cream/70 p-3">1. Create the party</li>
            <li className="rounded-2xl bg-cream/70 p-3">2. Share the guest link</li>
            <li className="rounded-2xl bg-cream/70 p-3">3. Turn orders into a pizza plan</li>
          </ol>
        </section>
      )}

      {ready && !error && activeEvents.length === 0 && archivedEvents.length > 0 && (
        <section className="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/80 p-5">
          <h2 className="font-display text-2xl font-semibold">No active pizza parties</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Archived parties are saved below if you need to review or restore them.
          </p>
        </section>
      )}

      {activeEvents.length > 0 && (
        <section className="rounded-[2rem] border border-white/80 bg-cream/55 p-4 shadow-sm sm:p-5" aria-labelledby="active-party-orders-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Active parties</p>
              <h2 id="active-party-orders-heading" className="mt-2 font-display text-3xl font-semibold">
                Active parties · {activeEvents.length}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-ink/58">
              Open and closed parties stay here while you collect orders, prepare the menu, or create the pizza plan.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {activeEvents.map((event) => (
              <PartyOrderListCard key={event.id} event={event} featured={activeEvents.length === 1} />
            ))}
          </div>
        </section>
      )}

      {archivedEvents.length > 0 && (
        <section className="rounded-[2rem] border border-ink/10 bg-white/72 p-4 shadow-none sm:p-5" aria-labelledby="archived-party-orders-heading">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/40">Archived parties</p>
            <h2 id="archived-party-orders-heading" className="mt-2 font-display text-3xl font-semibold">
              Archived parties · {archivedEvents.length}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/55">
              Archived parties stay available for reference, but guests cannot submit or edit orders while they are archived.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {archivedEvents.map((event) => (
              <PartyOrderListCard
                key={event.id}
                event={event}
                restoring={restoringId === event.id}
                onRestore={(order) => updateEventStatus(order, "open")}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
