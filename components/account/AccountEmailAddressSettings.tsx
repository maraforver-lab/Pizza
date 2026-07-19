"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  authCallbackRedirectTo,
  validateNewAccountEmail,
} from "@/lib/account-access";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type UserWithPendingEmail = User & {
  new_email?: string | null;
};

export function AccountEmailAddressSettings({ user }: { user: User }) {
  const confirmedEmail = user.email ?? "";
  const initialPendingEmail = (user as UserWithPendingEmail).new_email ?? "";
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(initialPendingEmail);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    setPendingEmail(initialPendingEmail);
  }, [initialPendingEmail]);

  const cancel = () => {
    if (submitting) return;
    setEditing(false);
    setNewEmail("");
    setMessage("");
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setMessage("");
    setError("");
    const validation = validateNewAccountEmail(newEmail, confirmedEmail);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);
    const { data, error: updateError } = await supabase.auth.updateUser(
      { email: validation.email },
      { emailRedirectTo: authCallbackRedirectTo(location.origin, "/account") },
    );
    setSubmitting(false);

    if (updateError) {
      setError("We could not request that email change. Check the address and try again.");
      return;
    }

    const returnedPendingEmail = (data.user as UserWithPendingEmail | null)?.new_email;
    setPendingEmail(returnedPendingEmail || validation.email);
    setMessage("Check your email to confirm the change. Your current email remains active until Supabase completes the update.");
    setEditing(false);
    setNewEmail("");
  };

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="account-email-heading">
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Email address</p>
      <h2 id="account-email-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
        Account email
      </h2>
      <p className="mt-2 text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Confirmed email</p>
      <p className="mt-1 break-all text-sm font-bold leading-6 text-ink/70">{confirmedEmail}</p>
      {pendingEmail && (
        <p className="mt-3 rounded-2xl bg-cream/70 p-3 text-xs font-bold leading-5 text-ink/55">
          Pending: <span className="break-all text-ink/75">{pendingEmail}</span>
        </p>
      )}

      {!editing ? (
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setMessage("");
            setError("");
          }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-cream/65 px-5 text-sm font-extrabold text-ink/75 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Change email address
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm font-extrabold text-ink/70" htmlFor="account-new-email">
            New email address
          </label>
          <input
            id="account-new-email"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            className="h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />
          <p className="text-xs leading-5 text-ink/45">
            The confirmed email does not change immediately. Supabase may ask you to confirm from the current and new addresses.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={cancel}
              disabled={submitting}
              className="min-h-11 rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:opacity-45"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-xl bg-tomato px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-forest disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/40"
            >
              {submitting ? "Saving…" : "Save email change"}
            </button>
          </div>
        </form>
      )}

      <div aria-live="polite">
        {error && <p role="alert" className="mt-3 rounded-xl bg-tomato/10 p-3 text-xs font-bold leading-5 text-tomato">{error}</p>}
        {message && <p role="status" className="mt-3 rounded-xl bg-leaf/10 p-3 text-xs font-bold leading-5 text-leaf">{message}</p>}
      </div>
    </section>
  );
}
