"use client";

import { useMemo, useState } from "react";
import {
  partyOrderPrepSummaryText,
  type PartyOrderActivity,
  type PartyOrderRow,
} from "@/lib/party-orders";

type PartyOrderPrepSummaryCardProps = {
  event: PartyOrderRow;
  activity: PartyOrderActivity;
  shareLink: string;
};

type CopyState = "idle" | "copied" | "unavailable";

async function copyText(value: string, setState: (state: CopyState) => void) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(value);
    setState("copied");
    window.setTimeout(() => setState("idle"), 2000);
  } catch {
    setState("unavailable");
    window.setTimeout(() => setState("idle"), 2500);
  }
}

export function PartyOrderPrepSummaryCard({ event, activity, shareLink }: PartyOrderPrepSummaryCardProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const prepSummary = useMemo(
    () => partyOrderPrepSummaryText(event, activity, shareLink),
    [event, activity, shareLink],
  );

  return (
    <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4" aria-labelledby="party-order-prep-summary-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Prep summary</p>
          <h2 id="party-order-prep-summary-heading" className="mt-2 font-display text-2xl font-semibold">
            Copy kitchen-ready order summary
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Copy a clean kitchen-ready summary of the pizza mix, guest orders and comments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => copyText(prepSummary, setCopyState)}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          {copyState === "copied" ? "Copied" : copyState === "unavailable" ? "Copy unavailable" : "Copy prep summary"}
        </button>
      </div>

      <details className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/85 p-4">
        <summary className="cursor-pointer text-sm font-extrabold text-ink">Preview plain-text summary</summary>
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream/70 p-4 text-xs font-bold leading-5 text-ink/58">
          {prepSummary}
        </pre>
      </details>
    </section>
  );
}
