"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cloudPizzaSessionSummary,
  normalizeCloudPizzaSessionRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import {
  clearCloudBackedActivePizzaSessionPointer,
  clearCloudBackedPizzaSession,
  cloudBackedPizzaSessionRowId,
} from "@/lib/cloud-pizza-session-client";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import { migratePizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";
import {
  archivePizzaSession,
  clearActivePizzaSession,
  getActivePizzaSession,
} from "@/lib/pizza-session-storage";

type AccountActivePizzaSessionCardProps = {
  enabled: boolean;
};

export function AccountActivePizzaSessionCard({ enabled }: AccountActivePizzaSessionCardProps) {
  const router = useRouter();
  const [cloudSession, setCloudSession] = useState<CloudPizzaSessionRow | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setCloudSession(null);
      setReady(false);
      return;
    }

    let mounted = true;
    async function loadActiveSession() {
      try {
        const response = await fetch("/api/pizza-sessions/active", { method: "GET" });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const row = normalizeCloudPizzaSessionRow(payload.session);
        if (!row) clearCloudBackedActivePizzaSessionPointer();
        if (mounted) setCloudSession(row ?? null);
      } catch {
        if (mounted) setCloudSession(null);
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadActiveSession();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  const continueSession = () => {
    if (!cloudSession) return;
    const restored = restoreCloudPizzaSessionToLocal(cloudSession);
    if (!restored) return;
    router.push(pizzaSessionContinueHref(restored));
  };

  const clearMatchingLocalActiveSession = (deletedCloudSession: CloudPizzaSessionRow) => {
    const localSession = getActivePizzaSession();
    if (!localSession) return;

    const cloudSessionData = migratePizzaSession(deletedCloudSession.session_data);
    const localUsesDeletedCloudRow = cloudBackedPizzaSessionRowId(localSession) === deletedCloudSession.id;
    const localUsesDeletedSessionData = cloudSessionData?.id === localSession.id;
    if (!localUsesDeletedCloudRow && !localUsesDeletedSessionData) return;

    archivePizzaSession(localSession.id);
    clearActivePizzaSession();
    clearCloudBackedPizzaSession();
  };

  const deleteActiveSession = async () => {
    if (!cloudSession || deleting) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/pizza-sessions/active", { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete this pizza session.");
      clearMatchingLocalActiveSession(cloudSession);
      setCloudSession(null);
      setConfirmingDelete(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete this pizza session.");
    } finally {
      setDeleting(false);
    }
  };

  if (!ready) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading saved pizza session…
      </section>
    );
  }

  if (!cloudSession) {
    return (
      <section className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7" aria-labelledby="account-active-session-heading">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Pizza Session</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 id="account-active-session-heading" className="font-display text-3xl font-semibold">No active pizza session</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">
              Start a new Pizza Session from the homepage.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-sm transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    );
  }

  const summary = cloudPizzaSessionSummary(cloudSession);

  return (
    <section className="mt-8 rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-card sm:p-6" aria-labelledby="account-active-session-heading">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Pizza Session</p>
          <h2 id="account-active-session-heading" className="mt-2 font-display text-3xl font-semibold text-ink">
            {summary.title}
          </h2>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-ink/65">
            <p>{summary.doughLine}</p>
            <p>{summary.bakeLine}</p>
            <p>{summary.stepLine}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={continueSession}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-extrabold text-white transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
        >
          Continue Pizza Session →
        </button>
      </div>
      <div className="mt-5 border-t border-leaf/15 pt-4">
        {confirmingDelete ? (
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby="delete-active-session-heading"
            className="rounded-[1.25rem] border border-tomato/20 bg-white/85 p-4"
          >
            <h3 id="delete-active-session-heading" className="font-display text-2xl font-semibold text-ink">Delete pizza session?</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink/60">
              This will remove your active in-progress Pizza Session. This cannot be undone.
            </p>
            {deleteError && <p role="alert" className="mt-3 rounded-xl bg-tomato/10 p-3 text-xs font-bold text-tomato">{deleteError}</p>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { setConfirmingDelete(false); setDeleteError(""); }}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteActiveSession}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tomato px-4 text-sm font-extrabold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete session"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-tomato/20 bg-white/70 px-4 text-sm font-extrabold text-tomato transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Delete pizza session
          </button>
        )}
      </div>
    </section>
  );
}
