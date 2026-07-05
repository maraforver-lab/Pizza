"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { markCloudBackedPizzaSession } from "@/lib/cloud-pizza-session-client";
import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import type { PizzaSession } from "@/lib/pizza-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SavePizzaSessionToAccountProps = {
  session: PizzaSession;
};

export function SavePizzaSessionToAccount({ session }: SavePizzaSessionToAccountProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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

  const saveToAccount = async () => {
    setSaving(true);
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
      markCloudBackedPizzaSession(session.id);
      setMessage("Saved to your account");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Saving failed.");
    } finally {
      setSaving(false);
    }
  };

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
          Sign in →
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Account save</p>
        <p className="mt-2 text-sm font-bold leading-6 text-ink/62">Save this in-progress Pizza Session to your account.</p>
        {message && <p role="status" className="mt-2 text-xs font-extrabold text-leaf">{message}</p>}
        {error && <p role="alert" className="mt-2 text-xs font-extrabold text-tomato">{error}</p>}
      </div>
      <button
        type="button"
        onClick={saveToAccount}
        disabled={saving}
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition active:scale-[.98] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:mt-0"
      >
        {saving ? "Saving…" : "Save to account"}
      </button>
    </section>
  );
}
