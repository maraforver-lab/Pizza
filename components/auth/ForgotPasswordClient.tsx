"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ACCOUNT_RECOVERY_NEXT_PATH,
  authCallbackRedirectTo,
  validateAccountEmail,
} from "@/lib/account-access";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const neutralSuccessCopy = "If an account exists for this email address, we’ve sent password reset instructions.";

function recoveryErrorMessage(errorMessage?: string) {
  const message = errorMessage?.toLowerCase() ?? "";
  if (message.includes("rate") || message.includes("too many")) {
    return "Too many reset requests. Wait a little, then try again.";
  }
  return "We could not send reset instructions right now. Try again in a moment.";
}

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");

    const validation = validateAccountEmail(email);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    const redirectTo = authCallbackRedirectTo(location.origin, ACCOUNT_RECOVERY_NEXT_PATH);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(validation.email, { redirectTo });
    setSubmitting(false);

    if (resetError) {
      setError(recoveryErrorMessage(resetError.message));
      return;
    }

    setStatus(neutralSuccessCopy);
  };

  return (
    <main className="min-h-screen bg-background-page px-4 py-8 pb-20 text-ink sm:px-6 sm:py-12">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-ink/10 bg-white/85 p-5 shadow-card sm:p-7" aria-labelledby="forgot-password-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Account access</p>
        <h1 id="forgot-password-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
          Reset your password.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">
          Enter the email address you use for DoughTools. If an account exists, we’ll send reset instructions.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-extrabold text-ink/70" htmlFor="recovery-email">
            Email
          </label>
          <input
            id="recovery-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby="recovery-email-help recovery-status"
            className="h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />
          <p id="recovery-email-help" className="text-xs leading-5 text-ink/45">
            We use neutral reset copy so this page does not reveal whether an address is registered.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-12 w-full rounded-xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg shadow-tomato/15 transition hover:bg-forest disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/40"
          >
            {submitting ? "Sending instructions…" : "Send reset instructions"}
          </button>
        </form>

        <div id="recovery-status" aria-live="polite">
          {error && <p role="alert" className="mt-4 rounded-xl bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">{error}</p>}
          {status && <p role="status" className="mt-4 rounded-xl bg-leaf/10 p-3 text-sm font-bold leading-6 text-leaf">{status}</p>}
        </div>

        <Link
          href="/account"
          className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
