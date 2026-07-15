"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import {
  resolveCanonicalActivePizzaSession,
  type CanonicalActivePizzaSessionResolution,
} from "@/lib/canonical-active-pizza-session";

type HomepageSessionActionsProps = {
  className?: string;
  includeWorkflowLink?: boolean;
  tone?: "dark" | "light";
  variant?: "hero" | "final";
  workflowHref?: string;
  workflowLabel?: string;
};

const emptyDecision: CanonicalActivePizzaSessionResolution = {
  state: "empty",
  signedIn: false,
  session: null,
  source: "none",
  cloudRow: null,
  href: "/session/start",
};

function primaryClass(tone: "dark" | "light", variant: "hero" | "final") {
  const widthClass = variant === "hero" ? "w-full sm:w-auto" : "w-full sm:w-auto";
  return [
    "inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-2xl px-6 py-3 text-base font-extrabold shadow-lg transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-80 sm:px-7",
    widthClass,
    tone === "dark"
      ? "bg-tomato text-white shadow-tomato/20 hover:bg-white hover:text-ink focus-visible:ring-white focus-visible:ring-offset-forest-dark disabled:bg-white/18 disabled:text-white"
      : "bg-tomato text-white shadow-tomato/20 hover:bg-white hover:text-ink focus-visible:ring-white focus-visible:ring-offset-ink disabled:bg-white/18 disabled:text-white",
  ].join(" ");
}

function secondaryClass(tone: "dark" | "light") {
  return [
    "inline-flex min-h-12 w-full items-center justify-center whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto",
    tone === "dark"
      ? "border border-white/20 bg-white/12 text-white backdrop-blur hover:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-forest-dark"
      : "border border-white/20 bg-white/10 text-white hover:bg-white/18 focus-visible:ring-white focus-visible:ring-offset-ink",
  ].join(" ");
}

function dialogButtonClass(kind: "primary" | "secondary") {
  return [
    "inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto",
    kind === "primary"
      ? "bg-tomato text-white hover:bg-forest"
      : "border border-ink/10 bg-white text-ink hover:border-ink/25",
  ].join(" ");
}

export default function HomepageSessionActions({
  className = "",
  includeWorkflowLink = false,
  tone = "dark",
  variant = "hero",
  workflowHref = "#how-it-works",
  workflowLabel = "See how it works",
}: HomepageSessionActionsProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<CanonicalActivePizzaSessionResolution>(emptyDecision);
  const [checking, setChecking] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const startNewButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function resolveActiveSession() {
      const resolution = await resolveCanonicalActivePizzaSession();
      if (mounted) {
        setDecision(resolution);
        if (mounted) setChecking(false);
      }
    }

    resolveActiveSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : startNewButtonRef.current;
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setConfirmOpen(false);
        previous?.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      previous?.focus();
    };
  }, [confirmOpen]);

  const hasActiveSession = decision.state === "active";
  const hasError = decision.state === "error";
  const showChecking = checking;
  const label = showChecking
    ? "Checking your pizza..."
    : hasError
      ? "Could not check your pizza"
    : hasActiveSession
      ? "Continue my pizza"
      : "Plan my new pizza";

  const continueActiveSession = () => {
    if (decision.state !== "active") return;
    router.push(decision.href);
  };

  const closeConfirm = () => setConfirmOpen(false);

  const startNewPizza = () => {
    setConfirmOpen(false);
    router.push("/session/start?new=1&replace=1");
  };

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${variant === "final" ? "justify-center" : ""} ${className}`}
      data-homepage-session-state={decision.state}
      data-homepage-session-source={decision.source ?? "none"}
    >
      {showChecking ? (
        <button
          type="button"
          disabled
          aria-busy="true"
          className={primaryClass(tone, variant)}
          data-homepage-primary-session-action="checking"
        >
          {label}
        </button>
      ) : hasError ? (
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={primaryClass(tone, variant)}
          data-homepage-primary-session-action="error"
        >
          {label}
        </button>
      ) : hasActiveSession ? (
        <button
          type="button"
          onClick={continueActiveSession}
          className={primaryClass(tone, variant)}
          data-homepage-primary-session-action="continue"
        >
          {label}
          <DoughToolsIcon name="forward" size={20} className="ml-2" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href="/session/start"
          className={primaryClass(tone, variant)}
          data-homepage-primary-session-action="plan"
        >
          {label}
          <DoughToolsIcon name="forward" size={20} className="ml-2" aria-hidden="true" />
        </Link>
      )}

      {hasActiveSession && !showChecking && (
        <button
          ref={startNewButtonRef}
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={secondaryClass(tone)}
          data-homepage-start-new-session
        >
          Start a new pizza
        </button>
      )}

      {!hasActiveSession && includeWorkflowLink && !showChecking && (
        <a href={workflowHref} className={secondaryClass(tone)}>
          {workflowLabel}
        </a>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/45 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeConfirm();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="homepage-start-new-pizza-title"
            aria-describedby="homepage-start-new-pizza-copy"
            tabIndex={-1}
            className="w-full max-w-md rounded-[1.75rem] border border-ink/10 bg-cream p-5 text-ink shadow-overlay focus:outline-none sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Active session</p>
                <h2 id="homepage-start-new-pizza-title" className="mt-2 font-display text-3xl font-semibold leading-none">
                  Start a new pizza?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeConfirm}
                aria-label="Close"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <DoughToolsIcon name="close" size={20} aria-hidden="true" />
              </button>
            </div>
            <p id="homepage-start-new-pizza-copy" className="mt-4 text-sm font-bold leading-6 text-ink/66">
              Your current pizza session will be archived so you can return to its details later. A new active session will be created from these choices.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeConfirm} className={dialogButtonClass("secondary")}>
                Keep current session
              </button>
              <button type="button" onClick={startNewPizza} className={dialogButtonClass("primary")}>
                Start new pizza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
