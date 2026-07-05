"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  normalizePartyOrderRow,
  partyOrderAllowedPizzaOptions,
  partyOrderDateTimeLabel,
  type PartyOrderRow,
} from "@/lib/party-orders";

type PartyOrderDetailProps = {
  eventId: string;
};

export function PartyOrderDetail({ eventId }: PartyOrderDetailProps) {
  const [event, setEvent] = useState<PartyOrderRow | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const shareLink = useMemo(() => (
    event && typeof location !== "undefined" ? `${location.origin}/order/${event.public_token}` : ""
  ), [event]);

  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      setReady(false);
      setError("");
      try {
        const response = await fetch(`/api/party-orders/${eventId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Party Order could not be loaded.");
        const nextEvent = normalizePartyOrderRow(payload.event);
        if (!nextEvent) throw new Error("Party Order could not be found.");
        if (mounted) setEvent(nextEvent);
      } catch (caught) {
        if (mounted) setError(caught instanceof Error ? caught.message : "Party Order could not be loaded.");
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (!ready) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading Party Order…
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="mt-8 rounded-[2rem] border border-tomato/15 bg-white p-5 shadow-card sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Party Order unavailable</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">Party Order not found.</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">{error || "This Party Order could not be loaded."}</p>
        <Link href="/account/party-orders" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink">
          ← Back to Party Orders
        </Link>
      </section>
    );
  }

  const allowedPizzas = partyOrderAllowedPizzaOptions(event);

  return (
    <article className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Party Order</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{event.title}</h1>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-[.16em] text-leaf">{event.status}</p>
        </div>
        <Link href="/account/party-orders" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-cream/60 px-4 text-sm font-extrabold text-ink">
          ← Back
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <p className="rounded-[1.25rem] bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/70">
          Pizza time: {partyOrderDateTimeLabel(event.pizza_datetime)}
        </p>
        <p className="rounded-[1.25rem] bg-cream/70 p-4 text-sm font-bold leading-6 text-ink/70">
          Orders close: {partyOrderDateTimeLabel(event.orders_close_at)}
        </p>
      </section>

      {event.guest_note && (
        <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-[.16em] text-ink/45">Guest note</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/70">{event.guest_note}</p>
        </section>
      )}

      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white p-4" aria-labelledby="selected-pizzas-heading">
        <h2 id="selected-pizzas-heading" className="font-display text-2xl font-semibold">Selected allowed pizzas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {allowedPizzas.map((pizza) => (
            <div key={pizza.id} className="rounded-[1.25rem] border border-ink/10 bg-cream/65 p-4">
              <p className="text-sm font-extrabold text-ink">{pizza.marker} {pizza.name}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-ink/50">{pizza.ingredientSummary}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Future guest link</p>
        <p className="mt-2 break-all rounded-2xl bg-white/80 p-3 text-sm font-extrabold text-ink/70">{shareLink}</p>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Guest order collection will be added in the next patch. This link token is ready, but the public guest form is not live yet.
        </p>
      </section>
    </article>
  );
}
