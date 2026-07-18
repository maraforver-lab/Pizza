"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons";
import {
  ACTIVE_PIZZA_SESSION_DEFAULT_TITLE,
  cloudPizzaSessionCustomName,
  cloudPizzaSessionSummary,
  normalizeCloudPizzaSessionRow,
  normalizeCloudPizzaSessionNameInput,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import {
  cloudActivePizzaSessionRequestHeaders,
  clearCloudBackedPizzaSession,
  cloudBackedPizzaSessionRowId,
  queueCloudActivePizzaSessionSave,
} from "@/lib/cloud-pizza-session-client";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import { resolveCanonicalActivePizzaSession } from "@/lib/canonical-active-pizza-session";
import {
  migratePizzaSession,
  pizzaSessionContinueHref,
  type PizzaSessionPizzaMix,
  type PizzaSessionPizzaMixType,
} from "@/lib/pizza-session";
import {
  clearActivePizzaSession,
  getActivePizzaSession,
  removePizzaSession,
  savePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  adjustPizzaMixAllocation,
  formatPizzaMixSummary,
  normalizePizzaMixForCount,
  PIZZA_MIX_OPTIONS,
  savePizzaSessionMenuMix,
} from "@/lib/pizza-session-shopping-list";

type AccountActivePizzaSessionCardProps = {
  enabled: boolean;
  className?: string;
};

function accountPizzaMenuLocked(session: ReturnType<typeof migratePizzaSession>) {
  if (!session) return false;
  const bakeRuntime = session.stepRuntime?.["bake-pizza"];
  const bakeStep = session.timeline?.steps.find((step) => step.id === "bake-pizza");
  return session.currentStep === "bake"
    || Boolean(bakeRuntime?.actualStartedAt || bakeRuntime?.actualCompletedAt)
    || bakeStep?.status === "done";
}

export function AccountActivePizzaSessionCard({ enabled, className = "" }: AccountActivePizzaSessionCardProps) {
  const router = useRouter();
  const [cloudSession, setCloudSession] = useState<CloudPizzaSessionRow | null>(null);
  const [ready, setReady] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [draftPizzaMix, setDraftPizzaMix] = useState<PizzaSessionPizzaMix | null>(null);
  const [menuError, setMenuError] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuStatus, setMenuStatus] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameStatus, setNameStatus] = useState("");
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuDialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCloudSession(null);
      setReady(false);
      return;
    }

    let mounted = true;
    async function loadActiveSession() {
      const resolution = await resolveCanonicalActivePizzaSession();
      if (mounted) {
        setCloudSession(resolution.state === "active" ? resolution.cloudRow : null);
        if (mounted) setReady(true);
      }
    }

    loadActiveSession();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (!menuEditorOpen) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocus = menuTriggerRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenuEditor();
        return;
      }
      if (event.key === "Tab" && menuDialogRef.current) {
        const focusable = Array.from(menuDialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])",
        ));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => menuDialogRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => {
        if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
        else fallbackFocus?.focus();
      }, 0);
    };
  }, [menuEditorOpen]);

  if (!enabled) return null;

  const activeSession = cloudSession ? migratePizzaSession(cloudSession.session_data) : undefined;
  const pizzaCount = activeSession?.pizzaCount ?? activeSession?.recipeSnapshot?.balls;
  const lockedPizzaCount = pizzaCount && pizzaCount > 0 ? Math.floor(pizzaCount) : undefined;
  const confirmedPizzaMix = lockedPizzaCount && activeSession
    ? normalizePizzaMixForCount(lockedPizzaCount, activeSession.pizzaMix, activeSession.pizzaPreset)
    : undefined;
  const currentPizzaMenuSummary = activeSession
    ? formatPizzaMixSummary(lockedPizzaCount, activeSession.pizzaMix, activeSession.pizzaPreset)
    : "Pizza menu not ready";
  const draftNormalizedMix = lockedPizzaCount && draftPizzaMix
    ? normalizePizzaMixForCount(lockedPizzaCount, draftPizzaMix, activeSession?.pizzaPreset)
    : undefined;
  const draftAllocatedCount = draftNormalizedMix
    ? Object.values(draftNormalizedMix).reduce((total, value) => total + value, 0)
    : 0;
  const menuLocked = accountPizzaMenuLocked(activeSession);
  const menuCanEdit = Boolean(activeSession && lockedPizzaCount && lockedPizzaCount > 0 && !menuLocked);

  const closeMenuEditor = () => {
    setMenuEditorOpen(false);
    setDraftPizzaMix(null);
    setMenuError("");
    window.setTimeout(() => menuTriggerRef.current?.focus(), 0);
  };

  const openMenuEditor = () => {
    if (!activeSession || !lockedPizzaCount || lockedPizzaCount < 1) {
      setMenuError("Pizza menu needs a saved pizza count before it can be changed.");
      return;
    }
    if (accountPizzaMenuLocked(activeSession)) {
      setMenuError("Pizza menu is locked once baking starts.");
      return;
    }
    setDraftPizzaMix(normalizePizzaMixForCount(lockedPizzaCount, activeSession.pizzaMix, activeSession.pizzaPreset));
    setMenuError("");
    setMenuStatus("");
    setMenuEditorOpen(true);
  };

  const adjustDraftPizzaMix = (pizzaType: PizzaSessionPizzaMixType, delta: number) => {
    if (!lockedPizzaCount || !draftNormalizedMix) return;
    setDraftPizzaMix(adjustPizzaMixAllocation(draftNormalizedMix, pizzaType, delta, lockedPizzaCount));
  };

  const syncEditedSessionToCloud = async (updatedSession: NonNullable<typeof activeSession>) => {
    const result = await queueCloudActivePizzaSessionSave(updatedSession);
    const syncedSession = normalizeCloudPizzaSessionRow((result as { session?: unknown }).session);
    if (syncedSession) {
      setCloudSession(syncedSession);
      return syncedSession;
    }
    return null;
  };

  const saveMenuChanges = async () => {
    if (!cloudSession || !activeSession || !lockedPizzaCount || !draftNormalizedMix || savingMenu) return;
    if (draftAllocatedCount !== lockedPizzaCount) {
      setMenuError("The selected pizza mix must match the locked total.");
      return;
    }

    setSavingMenu(true);
    setMenuError("");
    setMenuStatus("");
    const restoredSession = restoreCloudPizzaSessionToLocal(cloudSession) ?? activeSession;
    if (accountPizzaMenuLocked(restoredSession)) {
      setMenuError("Pizza menu is locked once baking starts.");
      setSavingMenu(false);
      return;
    }
    const doughBefore = restoredSession.recipeSnapshot;
    const { session: updatedSession, result } = savePizzaSessionMenuMix(restoredSession, draftNormalizedMix, undefined, new Date());
    if (!updatedSession || !result.ok) {
      setMenuError("Could not update the pizza menu. Check the pizza count and try again.");
      setSavingMenu(false);
      return;
    }

    const optimisticRow: CloudPizzaSessionRow = {
      ...cloudSession,
      current_step: updatedSession.currentStep,
      session_data: updatedSession,
      updated_at: updatedSession.updatedAt,
    };
    setCloudSession(optimisticRow);

    try {
      const syncedSession = await syncEditedSessionToCloud(updatedSession);
      if (!syncedSession) {
        setCloudSession(optimisticRow);
      }
      setMenuStatus("Pizza menu saved. Shopping list updated.");
      setMenuEditorOpen(false);
      setDraftPizzaMix(null);
    } catch {
      setMenuError("Pizza menu was saved in this browser, but account sync failed. Try again.");
    } finally {
      if (
        updatedSession.recipeSnapshot?.flourAmount !== doughBefore?.flourAmount
        || updatedSession.recipeSnapshot?.waterAmount !== doughBefore?.waterAmount
        || updatedSession.recipeSnapshot?.saltAmount !== doughBefore?.saltAmount
        || updatedSession.recipeSnapshot?.leavenerAmount !== doughBefore?.leavenerAmount
      ) {
        setMenuError("Dough amounts changed unexpectedly. Reload before saving again.");
      }
      setSavingMenu(false);
    }
  };

  const saveSessionName = async (value: string) => {
    if (!cloudSession || !activeSession || savingName) return;
    setSavingName(true);
    setNameError("");
    setNameStatus("");

    const sessionName = normalizeCloudPizzaSessionNameInput(value);
    const restoredSession = restoreCloudPizzaSessionToLocal(cloudSession) ?? activeSession;
    const updatedSession = savePizzaSession({
      ...restoredSession,
      sessionName: sessionName ?? undefined,
    });
    const optimisticRow: CloudPizzaSessionRow = {
      ...cloudSession,
      current_step: updatedSession.currentStep,
      session_data: updatedSession,
      title: sessionName ?? ACTIVE_PIZZA_SESSION_DEFAULT_TITLE,
      updated_at: updatedSession.updatedAt,
    };
    setCloudSession(optimisticRow);

    try {
      const syncedSession = await syncEditedSessionToCloud(updatedSession);
      if (!syncedSession) setCloudSession(optimisticRow);
      setNameDraft(sessionName ?? "");
      setNameStatus(sessionName ? "Session name saved." : "Session name removed.");
      setEditingName(false);
    } catch {
      setCloudSession(cloudSession);
      setNameError("Session name was saved in this browser, but account sync failed. Try again.");
    } finally {
      setSavingName(false);
    }
  };

  const restoreBeforeShopping = () => {
    if (cloudSession) restoreCloudPizzaSessionToLocal(cloudSession);
  };

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

    removePizzaSession(localSession.id);
    clearActivePizzaSession();
    clearCloudBackedPizzaSession();
  };

  const deleteActiveSession = async () => {
    if (!cloudSession || deleting) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const headers = await cloudActivePizzaSessionRequestHeaders();
      const response = await fetch("/api/pizza-sessions/active", { method: "DELETE", headers });
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
      <section className={`rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7 ${className}`}>
        Loading saved pizza session…
      </section>
    );
  }

  if (!cloudSession) {
    return (
      <section className={`rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7 ${className}`} aria-labelledby="account-active-session-heading">
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
  const customName = cloudPizzaSessionCustomName(cloudSession);

  return (
    <section className={`rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] p-5 shadow-card sm:p-6 ${className}`} aria-labelledby="account-active-session-heading">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Pizza Session</p>
          <h2 id="account-active-session-heading" className="mt-2 font-display text-3xl font-semibold text-ink">
            {summary.title}
          </h2>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-ink/65">
            <p>{summary.doughLine}</p>
            <p>{summary.pizzaMenuLine}</p>
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
      <div className="mt-5 rounded-[1.25rem] border border-leaf/15 bg-white/65 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Session name</p>
            <p className="mt-1 text-sm font-bold leading-6 text-ink/62">
              {customName ? `Saved as ${customName}` : "Add a short name so this pizza is easier to recognize later."}
            </p>
          </div>
          {!editingName && (
            <button
              type="button"
              onClick={() => {
                setEditingName(true);
                setNameDraft(customName ?? "");
                setNameError("");
                setNameStatus("");
              }}
              className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
            >
              {customName ? "Edit name" : "Add name"}
            </button>
          )}
        </div>
        {editingName && (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveSessionName(nameDraft);
            }}
          >
            <label htmlFor="active-session-name-input" className="sr-only">Session name</label>
            <input
              id="active-session-name-input"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={80}
              placeholder="Friday pizza night"
              className="min-h-11 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf/35 focus:ring-2 focus:ring-leaf/20"
            />
            {nameError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{nameError}</p>}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={savingName}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingName ? "Saving…" : "Save name"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(customName ?? "");
                  setNameError("");
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
              >
                Cancel
              </button>
              {customName && (
                <button
                  type="button"
                  onClick={() => saveSessionName("")}
                  disabled={savingName}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-tomato/15 bg-white px-4 text-xs font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove name
                </button>
              )}
            </div>
          </form>
        )}
        {nameStatus && <p role="status" className="mt-3 rounded-2xl bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">{nameStatus}</p>}
      </div>
      <div className="mt-5 flex flex-col gap-2 border-t border-leaf/15 pt-4 sm:flex-row sm:flex-wrap">
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={openMenuEditor}
          disabled={!menuCanEdit}
          className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
        >
          Change pizza menu
        </button>
        <Link
          href="/session/shopping"
          onClick={restoreBeforeShopping}
          className={buttonClass({ className: "w-full sm:w-auto", variant: "tertiary" })}
        >
          View shopping list
        </Link>
        <p className="w-full text-xs font-bold leading-5 text-ink/45">
          Total pizzas: {lockedPizzaCount ?? "not set"} · {menuLocked ? "Menu locked once baking starts." : "Locked for this session."}
        </p>
        {menuStatus && <p role="status" className="w-full rounded-2xl bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">{menuStatus}</p>}
        {menuError && !menuEditorOpen && <p role="alert" className="w-full rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold text-tomato">{menuError}</p>}
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
      {menuEditorOpen && draftNormalizedMix && lockedPizzaCount && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-menu-editor-heading"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMenuEditor();
          }}
        >
          <div
            ref={menuDialogRef}
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
            className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white p-5 text-ink shadow-card focus:outline-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Pizza menu</p>
                <h2 id="account-menu-editor-heading" className="mt-2 font-display text-3xl font-semibold leading-none">Change pizza menu</h2>
              </div>
              <button
                type="button"
                onClick={closeMenuEditor}
                aria-label="Close pizza menu editor"
                className={buttonClass({ className: "min-h-10 min-w-10 px-3", variant: "icon" })}
              >
                <DoughToolsIcon name="close" size={20} strokeWidth={2.1} />
              </button>
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/60">
              Total pizzas: {lockedPizzaCount}. Locked for this session.
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-ink/50">
              Change pizza types without changing dough balls, dough weight or fermentation timing.
            </p>
            <div className="mt-4 grid gap-2">
              {PIZZA_MIX_OPTIONS.map((option) => {
                const quantity = draftNormalizedMix[option.id] ?? 0;
                const canDecrease = option.id !== "margherita" && quantity > 0;
                const canIncrease = option.id === "margherita"
                  ? PIZZA_MIX_OPTIONS.some((entry) => entry.id !== "margherita" && (draftNormalizedMix[entry.id] ?? 0) > 0)
                  : (draftNormalizedMix.margherita ?? 0) > 0;

                return (
                  <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-ink/10 bg-cream/60 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-ink">{option.name}</p>
                    </div>
                    <div className="grid grid-cols-[2.75rem_2.25rem_2.75rem] items-center gap-2" aria-label={`${option.name}: ${quantity} selected`}>
                      <button
                        type="button"
                        onClick={() => adjustDraftPizzaMix(option.id, -1)}
                        disabled={!canDecrease || savingMenu}
                        aria-label={`Decrease ${option.name} count`}
                        className={buttonClass({ className: "min-h-11 min-w-11 px-0", variant: "icon" })}
                      >
                        <DoughToolsIcon name="remove" size={20} strokeWidth={2.1} />
                      </button>
                      <span className="text-center text-lg font-extrabold tabular-nums">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjustDraftPizzaMix(option.id, 1)}
                        disabled={!canIncrease || savingMenu}
                        aria-label={`Increase ${option.name} count`}
                        className={buttonClass({ className: "min-h-11 min-w-11 px-0", variant: "icon" })}
                      >
                        <DoughToolsIcon name="add" size={20} strokeWidth={2.1} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={`mt-3 rounded-2xl px-3 py-2 text-xs font-extrabold ${
              draftAllocatedCount === lockedPizzaCount ? "bg-leaf/10 text-leaf" : "bg-tomato/10 text-tomato"
            }`} role="status">
              Selected {draftAllocatedCount}/{lockedPizzaCount} pizzas.
            </p>
            {menuError && (
              <p className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-sm font-bold leading-6 text-tomato" role="alert">
                {menuError}
              </p>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeMenuEditor}
                disabled={savingMenu}
                className={buttonClass({ variant: "secondary" })}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMenuChanges}
                disabled={savingMenu || draftAllocatedCount !== lockedPizzaCount}
                className={buttonClass()}
              >
                {savingMenu ? "Saving…" : "Save pizza menu"}
              </button>
            </div>
            <p className="mt-4 text-xs font-bold leading-5 text-ink/45">
              Shopping rows keep their checked state only when the same item and amount remain valid; changed topping or sauce rows return to open.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
