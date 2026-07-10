"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cloudPizzaSessionSummary,
  normalizeCloudPizzaSessionRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import {
  clearCloudBackedActivePizzaSessionPointer,
  cloudBackedPizzaSessionRowId,
} from "@/lib/cloud-pizza-session-client";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import { pizzaSessionContinueHref, type PizzaSession } from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ContinuePizzaSessionCardProps = {
  className?: string;
  variant?: "default" | "hero";
};

const stepLabels: Record<PizzaSession["currentStep"], string> = {
  style: "Choose pizza style",
  time: "Choose timing",
  quantity: "Confirm quantity",
  oven: "Choose oven",
  flour: "Choose flour",
  recipe: "Continue recipe",
  timeline: "Open pizza timeline",
  shopping: "Review shopping list",
  prep: "Prepare dough",
  bake: "Bake pizza",
  review: "Review result",
};

export default function ContinuePizzaSessionCard({ className = "", variant = "default" }: ContinuePizzaSessionCardProps) {
  const router = useRouter();
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [cloudSession, setCloudSession] = useState<CloudPizzaSessionRow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCloudSession() {
      const localSession = getActivePizzaSession() ?? null;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          if (mounted) {
            setSession(localSession);
            setCloudSession(null);
          }
          return;
        }

        const response = await fetch("/api/pizza-sessions/active", { method: "GET" });
        if (!response.ok) {
          if (mounted) {
            setSession(null);
            setCloudSession(null);
          }
          return;
        }
        const payload = await response.json().catch(() => ({}));
        const row = normalizeCloudPizzaSessionRow(payload.session);
        if (row) {
          if (mounted) {
            setCloudSession(row);
            setSession(null);
          }
          return;
        }

        if (localSession && cloudBackedPizzaSessionRowId(localSession)) {
          clearCloudBackedActivePizzaSessionPointer();
        }

        if (mounted) {
          setSession(null);
          setCloudSession(null);
        }
      } catch {
        if (mounted) {
          setSession(null);
          setCloudSession(null);
        }
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadCloudSession();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready || (!session && !cloudSession)) return null;

  const continueCloudSession = () => {
    if (!cloudSession) return;
    const restored = restoreCloudPizzaSessionToLocal(cloudSession);
    if (!restored) return;
    router.push(pizzaSessionContinueHref(restored));
  };

  if (cloudSession) {
    const summary = cloudPizzaSessionSummary(cloudSession);
    return (
      <section
        className={`rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-sm sm:p-6 ${variant === "hero" ? "border-white/70 bg-white/80 shadow-card backdrop-blur-md" : ""} ${className}`}
        aria-labelledby="cloud-active-pizza-session-heading"
      >
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Active pizza session</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="cloud-active-pizza-session-heading" className="font-display text-2xl font-semibold text-ink">
              {summary.title}
            </h2>
            <p className="mt-2 text-sm font-extrabold leading-6 text-ink/62">{summary.statusLine}</p>
            <div className="mt-2 grid gap-1 text-sm leading-6 text-ink/60">
              <p>{summary.doughLine}</p>
              <p>{summary.bakeLine}</p>
              <p>{summary.stepLine}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={continueCloudSession}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Continue Pizza Session →
          </button>
        </div>
      </section>
    );
  }

  if (!session) return null;

  const lastSaved = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(session.lastSavedAt));

  if (variant === "hero") {
    return (
      <section
        className={`rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur-md sm:p-6 ${className}`}
        aria-labelledby="continue-pizza-session-heading"
      >
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-leaf/10 text-2xl text-leaf" aria-hidden="true">◌</span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[.28em] text-ink/50">Local session</p>
            <h2 id="continue-pizza-session-heading" className="mt-2 font-display text-2xl font-semibold leading-none text-ink">
              Continue Pizza Session
            </h2>
            <p className="mt-2 text-sm leading-5 text-ink/60">
              Next step: <strong className="text-ink">{stepLabels[session.currentStep]}</strong>
            </p>
            <p className="text-sm leading-5 text-ink/50">Last saved: {lastSaved}</p>
          </div>
          <Link
            href={pizzaSessionContinueHref(session)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Continue session →
          </Link>
        </div>
        <div className="mt-4 border-t border-ink/10 pt-4 text-sm leading-6 text-ink/55">
          <p>{PIZZA_SESSION_LOCAL_ONLY_COPY}</p>
          <p>Signed-in users can save an in-progress copy to their account from Dough Plan.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-sm sm:p-6 ${className}`}
      aria-labelledby="continue-pizza-session-heading"
    >
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Local session</p>
      <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 id="continue-pizza-session-heading" className="font-display text-2xl font-semibold text-ink">
            Continue Pizza Session
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Next step: <strong className="text-ink">{stepLabels[session.currentStep]}</strong>. Last saved {lastSaved}.
          </p>
          <p className="mt-2 text-xs leading-5 text-ink/45">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} Signed-in users can save an in-progress copy from Dough Plan.
          </p>
        </div>
        <Link
          href={pizzaSessionContinueHref(session)}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Continue session →
        </Link>
      </div>
    </section>
  );
}
