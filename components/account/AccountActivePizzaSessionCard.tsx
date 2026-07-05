"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cloudPizzaSessionSummary,
  normalizeCloudPizzaSessionRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import { pizzaSessionContinueHref } from "@/lib/pizza-session";

type AccountActivePizzaSessionCardProps = {
  enabled: boolean;
};

export function AccountActivePizzaSessionCard({ enabled }: AccountActivePizzaSessionCardProps) {
  const router = useRouter();
  const [cloudSession, setCloudSession] = useState<CloudPizzaSessionRow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setCloudSession(null);
      setReady(false);
      return;
    }

    let mounted = true;
    async function loadActiveSession() {
      try {
        const response = await fetch("/api/pizza-sessions/active", { method: "GET" });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const row = normalizeCloudPizzaSessionRow(payload.session);
        if (mounted) setCloudSession(row ?? null);
      } catch {
        if (mounted) setCloudSession(null);
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadActiveSession();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  const continueSession = () => {
    if (!cloudSession) return;
    const restored = restoreCloudPizzaSessionToLocal(cloudSession);
    if (!restored) return;
    router.push(pizzaSessionContinueHref(restored));
  };

  if (!ready) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading saved pizza session…
      </section>
    );
  }

  if (!cloudSession) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7" aria-labelledby="account-active-session-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Pizza Session</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="account-active-session-heading" className="font-display text-3xl font-semibold">No active pizza session</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">
              Start a new Pizza Session and save it to your account to continue later.
            </p>
          </div>
          <Link
            href="/session/start"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-sm transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Start Pizza Session →
          </Link>
        </div>
      </section>
    );
  }

  const summary = cloudPizzaSessionSummary(cloudSession);

  return (
    <section className="mt-8 rounded-[2rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-card sm:p-7" aria-labelledby="account-active-session-heading">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Pizza Session</p>
          <h2 id="account-active-session-heading" className="mt-2 font-display text-3xl font-semibold text-ink">
            {summary.title}
          </h2>
          <p className="mt-2 text-sm font-extrabold leading-6 text-leaf">{summary.statusLine}</p>
          <div className="mt-4 grid gap-2 rounded-[1.35rem] border border-white/75 bg-white/80 p-4 text-sm leading-6 text-ink/62">
            <p>{summary.doughLine}</p>
            <p>{summary.bakeLine}</p>
            <p>{summary.stepLine}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={continueSession}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Continue Pizza Session →
        </button>
      </div>
    </section>
  );
}
