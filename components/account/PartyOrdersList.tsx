"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  normalizePartyOrderRow,
  partyOrderDateTimeLabel,
  type PartyOrderRow,
} from "@/lib/party-orders";

export function PartyOrdersList() {
  const [events, setEvents] = useState<PartyOrderRow[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

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
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          Create party order →
        </Link>
      </div>

      {!ready && <p className="mt-6 text-sm font-bold text-ink/45">Loading Party Orders…</p>}
      {error && <p role="alert" className="mt-6 rounded-2xl bg-tomato/10 p-4 text-sm font-extrabold text-tomato">{error}</p>}

      {ready && !error && events.length === 0 && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/15 bg-cream/70 p-5">
          <h2 className="font-display text-2xl font-semibold">No Party Orders yet</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Start a party order to choose the pizza options your guests will be able to pick from.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-6 grid gap-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold">{event.title}</h2>
                  <p className="mt-2 text-sm font-bold text-ink/60">Pizza time: {partyOrderDateTimeLabel(event.pizza_datetime)}</p>
                  <p className="mt-1 text-sm font-bold text-ink/50">Orders close: {partyOrderDateTimeLabel(event.orders_close_at)}</p>
                  <p className="mt-3 text-xs font-extrabold uppercase tracking-[.16em] text-leaf">
                    {event.status} · {event.allowed_pizza_ids.length} pizza options
                  </p>
                </div>
                <Link
                  href={`/account/party-orders/${event.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
