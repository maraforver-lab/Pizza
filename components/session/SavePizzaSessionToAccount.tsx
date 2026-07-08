"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { markCloudBackedPizzaSession } from "@/lib/cloud-pizza-session-client";
import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import type { PizzaSession } from "@/lib/pizza-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SavePizzaSessionToAccountProps = {
  session: PizzaSession;
};

type AccountSaveStatus = "idle" | "saving" | "saved" | "error";
type SaveMode = "auto" | "manual";

const DOUGH_PLAN_AUTO_SAVE_SNAPSHOT_KEY = "doughtools:dough-plan-auto-saved-snapshot-key";
const AUTO_SAVE_ERROR_COPY = "We could not auto-save this session. You can try saving it manually.";

function isAccountSavablePizzaSession(session: PizzaSession) {
  return Boolean(session.id) && session.status !== "completed" && session.status !== "archived";
}

export function doughPlanAccountSaveSnapshotKey(session: PizzaSession) {
  if (!isAccountSavablePizzaSession(session)) return "";
  return JSON.stringify({
    id: session.id,
    status: session.status,
    currentStep: session.currentStep,
    updatedAt: session.updatedAt,
    lastSavedAt: session.lastSavedAt,
    targetEatTime: session.targetEatTime,
    targetBakeTime: session.targetBakeTime,
    pizzaCount: session.pizzaCount,
    doughBallWeight: session.doughBallWeight,
    ovenType: session.ovenType,
    pizzaStyle: session.pizzaStyle,
    pizzaPreset: session.pizzaPreset,
    flour: session.flour,
    flourSituation: session.flourSituation,
    availableFlourWRanges: session.availableFlourWRanges,
    plannedFermentationHours: session.plannedFermentationHours,
    hydrationPercentOverride: session.hydrationPercentOverride,
    fermentationTemperatureCOverride: session.fermentationTemperatureCOverride,
    yeastType: session.yeastType,
    recipeParams: session.recipeParams,
    recipeSnapshot: session.recipeSnapshot,
    pizzaMix: session.pizzaMix,
  });
}

function readAutoSavedSnapshotKey() {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(DOUGH_PLAN_AUTO_SAVE_SNAPSHOT_KEY) ?? "";
}

function writeAutoSavedSnapshotKey(value: string) {
  if (typeof window === "undefined" || !value) return;
  window.sessionStorage.setItem(DOUGH_PLAN_AUTO_SAVE_SNAPSHOT_KEY, value);
}

export function SavePizzaSessionToAccount({ session }: SavePizzaSessionToAccountProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<AccountSaveStatus>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lastAutoSavedKey = useRef("");
  const inFlightSaveKey = useRef("");
  const snapshotKey = useMemo(() => doughPlanAccountSaveSnapshotKey(session), [session]);
  const supabase = useMemo(() => {
    try {
      return getSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const saveToAccount = useCallback(async (mode: SaveMode = "manual") => {
    if (!snapshotKey || inFlightSaveKey.current === snapshotKey) return;
    inFlightSaveKey.current = snapshotKey;
    setSaveStatus("saving");
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/pizza-sessions/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData: session }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Saving failed.");
      const savedSession = normalizeCloudPizzaSessionRow(payload.session);
      if (!savedSession) throw new Error("Saved pizza session could not be verified.");
      markCloudBackedPizzaSession(session.id, savedSession.id);
      lastAutoSavedKey.current = snapshotKey;
      writeAutoSavedSnapshotKey(snapshotKey);
      setSaveStatus("saved");
      setMessage("Saved to your account.");
    } catch (caught) {
      setSaveStatus("error");
      setError(mode === "auto" ? "" : caught instanceof Error ? caught.message : "Saving failed.");
    } finally {
      if (inFlightSaveKey.current === snapshotKey) inFlightSaveKey.current = "";
    }
  }, [session, snapshotKey]);

  useEffect(() => {
    if (!authReady || !user || !snapshotKey) return;
    if (lastAutoSavedKey.current === snapshotKey || readAutoSavedSnapshotKey() === snapshotKey) {
      lastAutoSavedKey.current = snapshotKey;
      setSaveStatus("saved");
      setMessage("Saved to your account.");
      setError("");
      return;
    }
    void saveToAccount("auto");
  }, [authReady, saveToAccount, snapshotKey, user]);

  if (!authReady) {
    return (
      <section className="rounded-[1.5rem] border border-ink/10 bg-white/80 p-4 text-sm font-bold text-ink/45 shadow-sm">
        Checking account save…
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded-[1.5rem] border border-ink/10 bg-white/85 p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/40">Account save</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/60">Sign in to save this session across devices.</p>
        </div>
        <Link
          href="/account"
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:mt-0"
        >
          Save to account
        </Link>
      </section>
    );
  }

  if (saveStatus === "saved") {
    return (
      <section className="rounded-[1.25rem] border border-leaf/15 bg-leaf/[.06] p-4 shadow-sm">
        <p role="status" className="text-sm font-extrabold text-leaf">{message || "Saved to your account."}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-ink/55">You can continue from your account later.</p>
      </section>
    );
  }

  if (saveStatus === "saving" || saveStatus === "idle") {
    return (
      <section className="rounded-[1.25rem] border border-leaf/15 bg-white/80 p-4 shadow-sm">
        <p role="status" className="text-sm font-extrabold text-ink/55">Saving to your account…</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Account save</p>
        <p className="mt-2 text-sm font-bold leading-6 text-ink/62">We could not auto-save this session. You can try saving it manually.</p>
        {message && <p role="status" className="mt-2 text-xs font-extrabold text-leaf">{message}</p>}
        {error && <p role="alert" className="mt-2 text-xs font-extrabold text-tomato">{error}</p>}
      </div>
      <button
        type="button"
        onClick={() => saveToAccount("manual")}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition active:scale-[.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:mt-0"
      >
        Save to account
      </button>
    </section>
  );
}
