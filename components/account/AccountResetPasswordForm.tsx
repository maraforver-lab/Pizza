"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PASSWORD_UPDATED_MESSAGE,
  safeAccountAccessErrorMessage,
  validatePasswordPair,
} from "@/components/account/account-access-messages";

type RecoveryState = "loading" | "ready" | "invalid" | "success";

export function AccountResetPasswordForm() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const recoveryHint = params.get("recovery") === "1" || params.get("confirmed") === "1";
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setRecoveryState(data.session && recoveryHint ? "ready" : "invalid");
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryState("ready");
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || recoveryState !== "ready") return;

    const validationMessage = validatePasswordPair(password, confirmation);
    if (validationMessage) {
      setMessage(validationMessage);
      setIsError(true);
      return;
    }

    setPending(true);
    setMessage("");
    setIsError(false);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(safeAccountAccessErrorMessage(error.message));
        setIsError(true);
        return;
      }
      setPassword("");
      setConfirmation("");
      setMessage(PASSWORD_UPDATED_MESSAGE);
      setRecoveryState("success");
    } catch {
      setMessage("The password could not be updated. Try again in a moment.");
      setIsError(true);
    } finally {
      setPending(false);
    }
  }

  if (recoveryState === "loading") {
    return (
      <section className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6" aria-busy="true">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">Checking your password-reset link...</p>
      </section>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <section className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6" aria-labelledby="invalid-reset-heading">
        <h1 id="invalid-reset-heading" className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Choose a new password
        </h1>
        <p role="alert" className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-sm font-bold leading-6 text-tomato">
          This password-reset link is invalid or expired.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link
            href="/account/forgot-password"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Request a new reset link
          </Link>
          <Link
            href="/account"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Back to sign in
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6"
      aria-labelledby="reset-password-heading"
    >
      <h1 id="reset-password-heading" className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
        Choose a new password
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
        Use at least 8 characters. Choose a password you do not use elsewhere.
      </p>

      {recoveryState === "success" ? (
        <div className="mt-5">
          <p role="status" className="rounded-2xl bg-leaf/10 px-3 py-2 text-sm font-bold leading-6 text-leaf">
            {PASSWORD_UPDATED_MESSAGE}
          </p>
          <Link
            href="/account"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
          >
            Continue to account
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-extrabold text-ink" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />

          <label className="block text-sm font-extrabold text-ink" htmlFor="confirm-new-password">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Updating..." : "Update password"}
            </button>
            <Link
              href="/account"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Back to account
            </Link>
          </div>
        </form>
      )}

      {message && recoveryState !== "success" ? (
        <p role={isError ? "alert" : "status"} className={`mt-4 rounded-2xl px-3 py-2 text-xs font-extrabold leading-5 ${isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
