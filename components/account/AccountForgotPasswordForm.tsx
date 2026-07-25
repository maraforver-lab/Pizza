"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  safeAccountAccessErrorMessage,
} from "@/components/account/account-access-messages";

export function AccountForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim();
    setPending(true);
    setMessage("");
    setIsError(false);

    try {
      const redirectTo = `${location.origin}/auth/callback?next=/account/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });

      if (error) {
        setMessage(safeAccountAccessErrorMessage(error.message));
        setIsError(true);
        return;
      }

      setMessage(PASSWORD_RESET_SUCCESS_MESSAGE);
    } catch {
      setMessage("Password reset is temporarily unavailable. Try again later.");
      setIsError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6"
      aria-labelledby="forgot-password-heading"
    >
      <h1 id="forgot-password-heading" className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
        Reset your password
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
        Enter your account email and we&rsquo;ll send you a secure password-reset link.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-extrabold text-ink" htmlFor="account-reset-email">
          Email
        </label>
        <input
          id="account-reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send reset link"}
          </button>
          <Link
            href="/account"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Back to sign in
          </Link>
        </div>
      </form>

      {message ? (
        <p role={isError ? "alert" : "status"} className={`mt-4 rounded-2xl px-3 py-2 text-xs font-extrabold leading-5 ${isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
