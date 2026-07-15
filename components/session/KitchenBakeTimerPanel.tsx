"use client";

import { useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/design-system";
import { formatBakeTimerClock } from "@/lib/bake-timer";
import { useBakeTimer } from "@/lib/use-bake-timer";

const KITCHEN_BAKE_TIMER_STORAGE_PREFIX = "doughtools.kitchen-bake-timer.v1";

export function kitchenBakeTimerStorageKey(sessionId: string) {
  return `${KITCHEN_BAKE_TIMER_STORAGE_PREFIX}:${sessionId}`;
}

export function clearKitchenBakeTimerState(sessionId: string | undefined) {
  if (!sessionId || typeof window === "undefined") return;
  window.localStorage.removeItem(kitchenBakeTimerStorageKey(sessionId));
}

export type KitchenBakeTimerPanelProps = {
  sessionId: string;
  durationSeconds: number;
  durationLabel: string;
  pizzaCount?: number;
};

export function KitchenBakeTimerPanel({
  sessionId,
  durationSeconds,
  durationLabel,
  pizzaCount,
}: KitchenBakeTimerPanelProps) {
  const [open, setOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const timer = useBakeTimer({
    durationSeconds,
    storageKey: kitchenBakeTimerStorageKey(sessionId),
  });
  const timerActive = timer.status === "running" || timer.status === "paused" || timer.status === "overtime";

  useEffect(() => {
    if (timerActive) setOpen(true);
  }, [timerActive]);

  const statusText = useMemo(() => {
    if (timer.status === "running") return "Timer running";
    if (timer.status === "paused") return "Timer paused";
    if (timer.status === "overtime") return "Time is up";
    if (timer.status === "expired") return "Timer finished";
    return "Ready when you start baking a pizza";
  }, [timer.status]);

  const closeTimer = () => {
    if (timer.status === "running" || timer.status === "paused") {
      setConfirmClose(true);
      return;
    }
    if (timer.status === "overtime" || timer.status === "expired") timer.reset();
    setConfirmClose(false);
    setOpen(false);
  };

  const stopAndClose = () => {
    timer.reset();
    setConfirmClose(false);
    setOpen(false);
  };

  if (!open) {
    return (
      <section className="mt-5 rounded-[1.25rem] border border-ink/10 bg-white/70 p-3 sm:mt-6" aria-label="Optional bake timer">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <p className="text-sm font-bold leading-6 text-ink/55">
            Optional timer · {formatBakeTimerClock(durationSeconds)} per pizza · {durationLabel}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
          >
            Open bake timer
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="mt-5 rounded-[1.25rem] border border-ink/10 bg-white/80 p-4 sm:mt-6 sm:p-5"
      aria-labelledby="kitchen-bake-timer-heading"
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Optional bake timer</p>
          <h3 id="kitchen-bake-timer-heading" className="mt-1 font-display text-2xl font-semibold">
            Per-pizza timer
          </h3>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/55">
            {durationLabel} is the planning default. Judge the rim, bottom and cheese before marking the Kitchen step done.
          </p>
        </div>
        <div className="rounded-2xl bg-cream/80 px-4 py-3 text-center">
          <p className="font-mono text-4xl font-black leading-none text-ink" aria-live="polite">
            {timer.displayValue}
          </p>
          <p className={`mt-1 text-xs font-extrabold uppercase tracking-[.16em] ${
            timer.status === "overtime" || timer.status === "expired" ? "text-tomato" : "text-ink/45"
          }`}>
            {statusText}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {timer.status === "running" ? (
          <button type="button" onClick={timer.pause} className={buttonClass({ variant: "secondary" })}>
            Pause timer
          </button>
        ) : timer.status === "paused" ? (
          <button type="button" onClick={timer.resume} className={buttonClass({ variant: "primary" })}>
            Resume timer
          </button>
        ) : timer.status === "overtime" || timer.status === "expired" ? (
          <button type="button" onClick={timer.restart} className={buttonClass({ variant: "primary" })}>
            Start next pizza timer
          </button>
        ) : (
          <button type="button" onClick={timer.start} className={buttonClass({ variant: "primary" })}>
            Start bake timer
          </button>
        )}
        <button type="button" onClick={timer.reset} className={buttonClass({ variant: "tertiary" })}>
          Reset
        </button>
        <button
          type="button"
          onClick={() => timer.setSoundEnabled((current) => !current)}
          className={buttonClass({ variant: "tertiary" })}
          aria-pressed={timer.soundEnabled}
        >
          {timer.soundEnabled ? "Sound on" : "Sound off"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 border-t border-ink/10 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <p className="text-xs font-bold leading-5 text-ink/45">
          {pizzaCount ? `${pizzaCount} pizzas in this session. ` : ""}
          The timer is local to this device and does not change Kitchen progress.
        </p>
        <button type="button" onClick={closeTimer} className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}>
          Close bake timer
        </button>
      </div>

      {confirmClose && (
        <div className="mt-3 rounded-2xl border border-tomato/20 bg-tomato/[.08] p-3" role="status">
          <p className="text-sm font-extrabold text-tomato">The bake timer is still active.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setConfirmClose(false)} className={buttonClass({ variant: "secondary" })}>
              Keep timer visible
            </button>
            <button type="button" onClick={stopAndClose} className={buttonClass({ variant: "tertiary" })}>
              Stop and close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
