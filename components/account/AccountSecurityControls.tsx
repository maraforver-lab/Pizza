"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  EMAIL_CHANGE_SENT_MESSAGE,
  PASSWORD_UPDATED_MESSAGE,
  safeAccountAccessErrorMessage,
  validatePasswordPair,
} from "@/components/account/account-access-messages";

type ActionState = {
  pending: boolean;
  message: string;
  isError: boolean;
};

const idleActionState: ActionState = { pending: false, message: "", isError: false };

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;

  return (
    <p role={state.isError ? "alert" : "status"} className={`mt-3 rounded-2xl px-3 py-2 text-xs font-extrabold leading-5 ${state.isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>
      {state.message}
    </p>
  );
}

export function AccountSecurityControls() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [emailState, setEmailState] = useState<ActionState>(idleActionState);
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordState, setPasswordState] = useState<ActionState>(idleActionState);
  const [signOutState, setSignOutState] = useState<ActionState>(idleActionState);
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

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailState.pending) return;

    const currentEmail = user?.email?.trim().toLowerCase() ?? "";
    const nextEmail = newEmail.trim().toLowerCase();
    if (!user) {
      setEmailState({ pending: false, message: "Sign in again to change your email address.", isError: true });
      return;
    }
    if (!nextEmail) {
      setEmailState({ pending: false, message: "Enter a valid email address.", isError: true });
      return;
    }
    if (nextEmail === currentEmail) {
      setEmailState({ pending: false, message: "Enter a different email address.", isError: true });
      return;
    }

    setEmailState({ pending: true, message: "Sending confirmation instructions...", isError: false });
    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: `${location.origin}/auth/callback?next=/account/settings/security` },
    );

    if (error) {
      setEmailState({ pending: false, message: safeAccountAccessErrorMessage(error.message), isError: true });
      return;
    }

    setNewEmail("");
    setEmailState({ pending: false, message: EMAIL_CHANGE_SENT_MESSAGE, isError: false });
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordState.pending) return;

    if (!user) {
      setPasswordState({ pending: false, message: "Sign in again to change your password.", isError: true });
      return;
    }

    const validationMessage = validatePasswordPair(newPassword, passwordConfirmation);
    if (validationMessage) {
      setPasswordState({ pending: false, message: validationMessage, isError: true });
      return;
    }

    setPasswordState({ pending: true, message: "Updating password...", isError: false });
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordState({ pending: false, message: safeAccountAccessErrorMessage(error.message), isError: true });
      return;
    }

    setNewPassword("");
    setPasswordConfirmation("");
    setPasswordState({ pending: false, message: PASSWORD_UPDATED_MESSAGE, isError: false });
  }

  async function signOut() {
    setLoading(true);
    setSignOutState(idleActionState);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    setUser(null);
    setSignOutState({
      pending: false,
      message: error ? safeAccountAccessErrorMessage(error.message) : "You are signed out.",
      isError: Boolean(error),
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="security-current-account-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Current account</p>
        <h2 id="security-current-account-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
          Current account email
        </h2>
        <p className="mt-2 break-all text-sm leading-6 text-ink/60">
          {user?.email ?? "Account email loads after sign-in."}
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="change-email-heading">
        <h2 id="change-email-heading" className="font-display text-2xl font-semibold text-ink">
          Change email address
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          We&rsquo;ll send confirmation instructions before the new email becomes active.
        </p>
        <form onSubmit={changeEmail} className="mt-4 space-y-3">
          <label className="block text-sm font-extrabold text-ink" htmlFor="account-new-email">
            New email
          </label>
          <input
            id="account-new-email"
            type="email"
            required
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />
          <button
            type="submit"
            disabled={loading || emailState.pending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {emailState.pending ? "Sending..." : "Send confirmation"}
          </button>
        </form>
        <StatusMessage state={emailState} />
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="change-password-heading">
        <h2 id="change-password-heading" className="font-display text-2xl font-semibold text-ink">
          Change password
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Use at least 8 characters. Choose a password you do not use elsewhere.
        </p>
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <label className="block text-sm font-extrabold text-ink" htmlFor="account-new-password">
            New password
          </label>
          <input
            id="account-new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />
          <label className="block text-sm font-extrabold text-ink" htmlFor="account-confirm-new-password">
            Confirm new password
          </label>
          <input
            id="account-confirm-new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-ink/15 bg-cream/55 px-4 text-base text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20"
          />
          <button
            type="submit"
            disabled={loading || passwordState.pending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {passwordState.pending ? "Updating..." : "Update password"}
          </button>
        </form>
        <StatusMessage state={passwordState} />
      </section>

      <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="security-sign-out-heading">
        <h2 id="security-sign-out-heading" className="font-display text-2xl font-semibold text-ink">
          Sign out
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          End this browser session. Your browser-local pizza plans, recipes, notes and preferences remain on this device.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <button
            type="button"
            onClick={signOut}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "One moment..." : "Sign out"}
          </button>
          {!user ? (
            <Link
              href="/account"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
            >
              Sign in
            </Link>
          ) : null}
        </div>
        <StatusMessage state={signOutState} />
      </section>
    </div>
  );
}
