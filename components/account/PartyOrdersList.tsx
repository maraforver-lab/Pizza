"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  normalizePartyOrderRow,
  partyOrderDateTimeLabel,
  partyOrderOwnerStatusSummary,
  type PartyOrderStatus,
  type PartyOrderRow,
} from "@/lib/party-orders";

function PartyOrderListCard({
  event,
  onRestore,
  restoring,
}: {
  event: PartyOrderRow;
  onRestore?: (event: PartyOrderRow) => void;
  restoring?: boolean;
}) {
  const statusSummary = partyOrderOwnerStatusSummary(event);
  const archived = event.status === "archived";

  return (
    <article className={`rounded-[1.5rem] border p-4 sm:p-5 ${
      archived
        ? "border-ink/10 bg-white/80 shadow-none"
        : "border-leaf/15 bg-cream/65 shadow-sm"
    }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[.16em] ${
            archived ? "bg-ink/5 text-ink/50" : "bg-leaf/10 text-leaf"
          }`}
          >
            {statusSummary.label}
          </p>
          <h2 className="font-display text-2xl font-semibold">{event.title}</h2>
          <p className="mt-2 text-sm font-bold text-ink/60">Pizza time: {partyOrderDateTimeLabel(event.pizza_datetime)}</p>
          <p className="mt-1 text-sm font-bold text-ink/50">Orders close: {partyOrderDateTimeLabel(event.orders_close_at)}</p>
          <p className={`mt-3 text-xs font-extrabold uppercase tracking-[.16em] ${
            archived ? "text-ink/40" : "text-leaf"
          }`}
          >
            {archived ? "Archived · Not accepting guest orders" : `${event.status} · ${event.allowed_pizza_ids.length} pizza options`}
          </p>
          {archived && (
            <p className="mt-2 text-sm leading-6 text-ink/52">
              Saved for review. Restore it to move it back to your active list.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Link
            href={`/account/party-orders/${event.id}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
          >
            Open / View
          </Link>
          {onRestore && (
            <button
              type="button"
              onClick={() => onRestore(event)}
              disabled={restoring}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf transition hover:border-leaf/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
    <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Party Orders</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">Party Orders</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
            Create a pizza party menu, choose which DoughTools pizzas guests can order, and prepare a public order link for the next phase.
          </p>
        </div>
        <Link
          href="/account/party-orders/new"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
        >
          Create party order →
        </Link>
      </div>

      {!ready && <p className="mt-6 text-sm font-bold text-ink/45">Loading Party Orders…</p>}
      {error && <p role="alert" className="mt-6 rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}
      {statusMessage && <p role="status" className="mt-6 rounded-2xl bg-leaf/10 p-4 text-sm font-extrabold text-leaf">{statusMessage}</p>}
      {statusError && <p role="alert" className="mt-6 rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{statusError}</p>}

      {ready && !error && activeEvents.length === 0 && archivedEvents.length === 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/15 bg-cream/70 p-5">
          <h2 className="font-display text-2xl font-semibold">No Party Orders yet</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Start a party order to choose the pizza options your guests will be able to pick from.
          </p>
        </div>
      )}

      {ready && !error && activeEvents.length === 0 && archivedEvents.length > 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/15 bg-cream/70 p-5">
          <h2 className="font-display text-2xl font-semibold">No active Party Orders</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Archived Party Orders are saved below if you need to review or restore them.
          </p>
        </div>
      )}

      {activeEvents.length > 0 && (
        <div className="mt-6 grid gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Current</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Active Party Orders</h2>
          </div>
          {activeEvents.map((event) => (
            <PartyOrderListCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {archivedEvents.length > 0 && (
        <div className="mt-8 rounded-[1.75rem] border border-ink/10 bg-cream/45 p-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/40">History</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Archived Party Orders</h2>
            <p className="mt-2 text-sm leading-6 text-ink/55">
              Archived Party Orders stay viewable, but guests cannot submit or edit orders while they are archived.
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
        </div>
      )}
    </section>
  );
}
