"use client";

import Link from "next/link";

type PartyOrdersAccountEntryCardProps = {
  enabled: boolean;
  className?: string;
};

export function PartyOrdersAccountEntryCard({ enabled, className = "" }: PartyOrdersAccountEntryCardProps) {
  if (!enabled) return null;

  return (
    <section
      className={`rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7 ${className}`}
      aria-labelledby="party-orders-account-entry-heading"
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">PIZZA PARTY ORDERS</p>
          <h2 id="party-orders-account-entry-heading" className="mt-2 font-display text-3xl font-semibold text-ink">
            Collect pizza orders from guests
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
            Create a party order link, choose which DoughTools pizzas guests can order, and collect their choices before
            you start baking.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-48">
          <Link
            href="/account/party-orders"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Open Party Orders →
          </Link>
          <Link
            href="/account/party-orders/new"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-cream/65 px-5 py-3 text-xs font-extrabold text-ink/70 transition hover:border-leaf/35 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Create party order →
          </Link>
        </div>
      </div>
    </section>
  );
}
