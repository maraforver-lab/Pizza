"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { validateAccountPasswordUpdate } from "@/lib/account-access";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RecoveryState = "resolving" | "ready" | "invalid" | "success";

function updatePasswordErrorMessage(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("weak") || normalized.includes("password")) {
    return "Use a stronger password that meets the project password rules.";
  }
  return "We could not update the password. Try again with a fresh recovery link.";
}

export function UpdatePasswordClient() {
  const [state, setState] = useState<RecoveryState>("resolving");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const authError = searchParams.get("authError");
    if (authError) {
      setState("invalid");
      setError("This password reset link is invalid or has expired. Request a new one and try again.");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(data.session?.user ? "ready" : "invalid");
      if (!data.session?.user) {
        setError("This password reset link is invalid or has expired. Request a new one and try again.");
      }
    }).catch(() => {
      if (!active) return;
      setState("invalid");
      setError("This password reset link is invalid or has expired. Request a new one and try again.");
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        setState(session?.user ? "ready" : "invalid");
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || state !== "ready") return;

    setError("");
    setStatus("");
    const validation = validateAccountPasswordUpdate(password, confirmation);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updatePasswordErrorMessage(updateError.message));
      return;
    }

    setPassword("");
    setConfirmation("");
    setState("success");
    setStatus("Your password has been updated.");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-background-page px-4 py-8 pb-20 text-ink sm:px-6 sm:py-12">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-ink/10 bg-white/85 p-5 shadow-card sm:p-7" aria-labelledby="update-password-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Account access</p>
        <h1 id="update-password-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
          Choose a new password.
        </h1>

        {state === "resolving" && (
          <div className="mt-6 rounded-2xl bg-cream/65 p-4" aria-busy="true" aria-live="polite">
            <p className="text-sm font-bold leading-6 text-ink/60">Checking your recovery link…</p>
          </div>
        )}

        {state === "invalid" && (
          <div aria-live="polite">
            <p role="alert" className="mt-6 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
              {error || "This password reset link is invalid or has expired. Request a new one and try again."}
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {state === "ready" && (
          <>
            <p className="mt-4 text-sm leading-6 text-ink/60">
              Use at least 8 characters. The password is sent directly to Supabase Auth and is not stored in DoughTools tables.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-extrabold text-ink/70" htmlFor="new-password">
                New password
              </label>
              <div className="flex gap-2">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="min-h-12 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <label className="block text-sm font-extrabold text-ink/70" htmlFor="confirm-new-password">
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
              />
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 w-full rounded-xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg shadow-tomato/15 transition hover:bg-forest disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/40"
              >
                {submitting ? "Updating password…" : "Update password"}
              </button>
            </form>
          </>
        )}

        {state === "success" && (
          <div aria-live="polite">
            <p role="status" className="mt-6 rounded-2xl bg-leaf/10 p-4 text-sm font-bold leading-6 text-leaf">
              {status || "Your password has been updated."}
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Go to Account
            </Link>
          </div>
        )}

        {error && state === "ready" && (
          <p role="alert" aria-live="polite" className="mt-4 rounded-xl bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
