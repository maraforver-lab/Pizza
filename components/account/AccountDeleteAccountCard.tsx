"use client";

import { useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { clearDoughToolsOwnedLocalData } from "@/components/account/account-local-data-cleanup";

type DeleteState =
  | { status: "idle"; message: string }
  | { status: "confirming"; message: string }
  | { status: "deleting"; message: string }
  | { status: "error"; message: string }
  | { status: "blocked"; message: string };

type AccountDeletionResponse = {
  success?: boolean;
  error?: string;
  blockedReason?: "adminRole";
  storage?: { completed?: boolean; error?: string };
  appData?: { success?: boolean; failedCategories?: Array<{ category: string; error: string }> } | null;
  auth?: { completed?: boolean; error?: string };
};

function deletionFailureMessage(payload: AccountDeletionResponse) {
  if (payload.blockedReason === "adminRole") {
    return payload.error || "Admin accounts cannot use self-service account deletion.";
  }
  if (payload.storage?.completed === false) {
    return payload.storage.error || "Review photos could not be deleted. Your account was not deleted.";
  }
  if (payload.appData?.success === false) {
    const failed = payload.appData.failedCategories?.map((item) => item.category).join(", ");
    return failed
      ? `Some DoughTools cloud data could not be deleted (${failed}). Your account was not deleted.`
      : "Some DoughTools cloud data could not be deleted. Your account was not deleted.";
  }
  if (payload.auth?.completed === false) {
    return payload.auth.error || "Your sign-in account could not be deleted after cleanup. You can retry safely.";
  }
  return payload.error || "Your account could not be deleted. You can retry if you are still signed in.";
}

export function AccountDeleteAccountCard() {
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<DeleteState>({ status: "idle", message: "" });
  const confirmationMatches = confirmation === "DELETE";
  const dialogOpen = state.status === "confirming" || state.status === "deleting";

  async function deleteAccount() {
    if (!confirmationMatches || state.status === "deleting") return;
    setState({ status: "deleting", message: "Deleting your account..." });

    try {
      const response = await fetch("/api/account/delete", { method: "DELETE" });
      const payload = await response.json().catch(() => ({})) as AccountDeletionResponse;

      if (response.ok && payload.success) {
        clearDoughToolsOwnedLocalData();
        window.location.assign("/account/settings?accountDeleted=1");
        return;
      }

      setState({
        status: payload.blockedReason === "adminRole" ? "blocked" : "error",
        message: deletionFailureMessage(payload),
      });
    } catch {
      setState({
        status: "error",
        message: "Your account could not be deleted. Check your connection and try again.",
      });
    }
  }

  return (
    <section
      className="rounded-[1.75rem] border border-tomato/20 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5"
      aria-labelledby="delete-account-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Account deletion</p>
          <h2 id="delete-account-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Delete account
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Permanently remove your account, owned Review photos, and DoughTools cloud data. Download your data first if you want a copy.
          </p>
        </div>
        <DoughToolsIcon name="warning" size={24} className="mt-1 shrink-0 text-tomato" aria-hidden="true" />
      </div>

      <div className="mt-4 rounded-2xl border border-tomato/15 bg-tomato/[.06] p-3">
        <p className="text-xs font-bold leading-5 text-ink/60">
          This action cannot be undone. Backups may retain data for a limited period according to the Privacy Policy.
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <p className="text-xs font-bold leading-5 text-ink/45" aria-live="polite">
          {state.message || "Admin accounts cannot use self-service deletion."}
        </p>
        <button
          type="button"
          onClick={() => setState({ status: "confirming", message: "" })}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-tomato/30 bg-white px-5 text-sm font-extrabold text-tomato transition hover:border-tomato hover:bg-tomato/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          <DoughToolsIcon name="warning" size={20} aria-hidden="true" />
          Delete my account
        </button>
      </div>

      {state.status === "error" || state.status === "blocked" ? (
        <p role="alert" className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold leading-5 text-tomato">
          {state.message}
        </p>
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink/55 px-4 py-6 backdrop-blur-sm" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-heading"
            className="w-full max-w-lg rounded-[1.75rem] border border-tomato/20 bg-white p-5 shadow-overlay sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Permanent action</p>
                <h3 id="delete-account-dialog-heading" className="mt-2 font-display text-3xl font-semibold text-ink">
                  Delete your account?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setState({ status: "idle", message: "" })}
                disabled={state.status === "deleting"}
                aria-label="Cancel account deletion"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl border border-ink/10 bg-white text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                <DoughToolsIcon name="close" size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm font-bold leading-6 text-ink/65">
              <p>This permanently removes your account preferences, owned pizza plans and history, owned Party Orders with related submissions and items, owned Review photos, Supabase Auth account, and current signed-in session.</p>
              <p>Public admin-created configuration is not deleted. Admin accounts cannot use self-service deletion.</p>
              <p>After success, this browser clears known DoughTools-owned local app data only. This action cannot be undone. Backups may retain data for a limited period according to the Privacy Policy.</p>
            </div>

            <label className="mt-5 block text-sm font-extrabold text-ink" htmlFor="delete-account-confirmation">
              Type DELETE to confirm
            </label>
            <input
              id="delete-account-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={state.status === "deleting"}
              autoComplete="off"
              className="mt-2 min-h-12 w-full rounded-2xl border border-ink/15 bg-cream px-4 text-sm font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-2 focus:ring-tomato/20 disabled:opacity-60"
            />

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setState({ status: "idle", message: "" })}
                disabled={state.status === "deleting"}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={!confirmationMatches || state.status === "deleting"}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {state.status === "deleting" ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
