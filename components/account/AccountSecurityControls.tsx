"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSecurityControls() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function signOut() {
    setLoading(true);
    setMessage("");
    setIsError(false);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    setUser(null);
    setMessage(error ? error.message : "You are signed out.");
    setIsError(Boolean(error));
  }

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="security-current-account-heading">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Current account</p>
      <h2 id="security-current-account-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
        Email
      </h2>
      <p className="mt-2 break-all text-sm leading-6 text-ink/60">
        {user?.email ?? "Account email loads after sign-in."}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/70 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Change email or password
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "One moment..." : "Sign out"}
        </button>
      </div>
      {message ? (
        <p role={isError ? "alert" : "status"} className={`mt-3 rounded-2xl px-3 py-2 text-xs font-extrabold leading-5 ${isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
