"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buttonClass, cx } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons";
import { BAKE_TIMER_MAX_OVERTIME_SECONDS, formatBakeTimerClock } from "@/lib/bake-timer";
import type { PizzaSessionOvenType } from "@/lib/pizza-session-bake-profile";
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
  ovenType: PizzaSessionOvenType;
  ovenLabel: string;
  pizzaCount?: number;
};

function formatCompactDuration(seconds: number) {
  const safeSeconds = Math.max(1, Math.round(seconds));
  if (safeSeconds < 60) return `${safeSeconds} sec`;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  if (remainder === 0) return `${minutes} min`;
  return `${minutes} min ${remainder} sec`;
}

function formatOvenContext(ovenType: PizzaSessionOvenType) {
  return ovenType === "pizza" ? "For your pizza oven" : "For your home oven";
}

function formatOvenEyebrow(ovenType: PizzaSessionOvenType) {
  return ovenType === "pizza" ? "PIZZA OVEN" : "HOME OVEN";
}

function phaseCopy(phase: ReturnType<typeof useBakeTimer>["phase"]) {
  if (phase === "last20") {
    return {
      status: "ALMOST THERE",
      instruction: "Last 20 seconds — watch the color closely.",
      cardTitle: "Last 20 seconds",
      cardBody: "The sound cue becomes more frequent. Watch the rim, bottom and cheese.",
    };
  }
  if (phase === "overtime" || phase === "expired") {
    return {
      status: "OVERTIME",
      instruction: "Take the pizza out",
      cardTitle: "Time's up",
      cardBody: "Alarm every 5 sec. Overtime counts up to +90 sec.",
    };
  }
  if (phase === "paused") {
    return {
      status: "PAUSED",
      instruction: "Resume when this pizza is back in the oven.",
      cardTitle: "Timer paused",
      cardBody: "The timer keeps the selected per-pizza duration for the next start.",
    };
  }
  if (phase === "ready") {
    return {
      status: "READY",
      instruction: "Start when a pizza goes into the oven.",
      cardTitle: "Timer guide",
      cardBody: "Use the timer as a guide. Visual doneness is still authoritative.",
    };
  }
  return {
    status: "BAKING",
    instruction: "Rotate if needed",
    cardTitle: "Tip",
    cardBody: "Keep an eye on the rim color. Aim for brown spotting.",
  };
}

function BakeTimerProgressRing({
  displayValue,
  phase,
  progressRatio,
}: {
  displayValue: string;
  phase: ReturnType<typeof useBakeTimer>["phase"];
  progressRatio: number;
}) {
  const activeDegrees = phase === "overtime" || phase === "expired" || phase === "ready"
    ? 360
    : Math.max(0, Math.min(360, progressRatio * 360));
  const ringColor = phase === "last20"
    ? "var(--dt-oven-gold)"
    : phase === "overtime" || phase === "expired"
      ? "var(--dt-tomato)"
      : "var(--dt-tomato)";
  const style = {
    background: `conic-gradient(${ringColor} ${activeDegrees}deg, rgba(31,31,31,.10) 0deg)`,
  } satisfies CSSProperties;
  return (
    <div className="mx-auto grid aspect-square w-full max-w-[min(18rem,32dvh)] rounded-full p-2.5 shadow-sm sm:max-w-[21rem] sm:p-3" style={style} aria-hidden="true">
      <div className="grid place-items-center rounded-full bg-white">
        <p
          className={cx(
            "font-mono text-[clamp(3.25rem,15vw,4.5rem)] font-black leading-none tabular-nums sm:text-8xl",
            phase === "last20" || phase === "overtime" || phase === "expired" ? "text-tomato" : "text-ink",
          )}
        >
          {displayValue}
        </p>
      </div>
    </div>
  );
}

export function KitchenBakeTimerPanel({
  sessionId,
  durationSeconds,
  durationLabel,
  ovenType,
  ovenLabel,
  pizzaCount,
}: KitchenBakeTimerPanelProps) {
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousPhaseRef = useRef<string | null>(null);
  const timer = useBakeTimer({
    durationSeconds,
    storageKey: kitchenBakeTimerStorageKey(sessionId),
  });
  const phase = timer.phase;
  const copy = useMemo(() => phaseCopy(phase), [phase]);
  const durationValue = formatCompactDuration(timer.snapshot.durationSeconds);
  const defaultValue = formatCompactDuration(durationSeconds);
  const profileDurationLabel = durationLabel.trim() || defaultValue;
  const durationSupport = profileDurationLabel === defaultValue
    ? `Default ${defaultValue}`
    : `Profile guide ${profileDurationLabel}; timer starts at ${defaultValue}`;
  const timerStatus = timer.status;
  const pauseTimer = timer.pause;
  const stopTimerAlarm = timer.stopAlarm;
  const timerActive = timerStatus === "running" || timerStatus === "paused" || timerStatus === "overtime";
  const overtimeCanDecrease = timer.snapshot.overtimeSeconds > 0 || timerStatus === "expired";
  const overtimeCanIncrease = timer.snapshot.overtimeSeconds < BAKE_TIMER_MAX_OVERTIME_SECONDS && timerStatus !== "expired";

  const closeTimer = useCallback(() => {
    if (timerStatus === "running") pauseTimer();
    if (timerStatus === "overtime") stopTimerAlarm();
    setOpen(false);
  }, [pauseTimer, stopTimerAlarm, timerStatus]);

  useEffect(() => {
    if (timerActive) setOpen(true);
  }, [timerActive]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const launcherButton = launcherRef.current;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeTimer();
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
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
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
        else launcherButton?.focus();
      }, 0);
    };
  }, [closeTimer, open]);

  useEffect(() => {
    if (!open) return;
    if (previousPhaseRef.current === phase) return;
    previousPhaseRef.current = phase;
    if (phase === "active") setAnnouncement("Bake timer started.");
    if (phase === "last20") setAnnouncement("20 seconds remaining.");
    if (phase === "paused") setAnnouncement("Bake timer paused.");
    if (phase === "overtime") setAnnouncement("Time expired. Overtime started.");
    if (phase === "expired") setAnnouncement("Alarm stopped or maximum overtime reached.");
  }, [open, phase]);

  const startOrResume = () => {
    if (timer.status === "paused") timer.resume();
    else timer.start();
  };

  return (
    <>
      <section className="mt-5 rounded-[1.25rem] border border-tomato/20 bg-gradient-to-br from-white via-white to-tomato/[.06] p-4 shadow-card sm:mt-6 sm:p-5" aria-label="Bake timer">
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-tomato text-white shadow-sm" aria-hidden="true">
            <DoughToolsIcon name="timer" size={24} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Bake timer</p>
            <h3 className="mt-1 font-display text-3xl font-semibold leading-none text-ink">{durationValue} per pizza</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
              {formatOvenContext(ovenType)}. {durationSupport}. Use it as a guide; color, bottom and cheese still decide doneness.
            </p>
          </div>
        </div>
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClass({ className: "mt-4 w-full", variant: "primary" })}
        >
          Open full-screen bake timer
        </button>
      </section>

      {open && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-background-page text-ink sm:bg-ink/50 sm:p-6 sm:backdrop-blur-sm" role="presentation">
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-screen-bake-timer-heading"
            aria-describedby="full-screen-bake-timer-description"
            className="mx-auto grid h-[100dvh] w-full max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-background-page px-4 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-[calc(.75rem+env(safe-area-inset-top))] shadow-overlay outline-none sm:h-auto sm:min-h-0 sm:rounded-[2rem] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeTimer}
                aria-label="Close bake timer"
                className={buttonClass({ className: "min-h-12 min-w-12 rounded-2xl px-3", variant: "icon" })}
              >
                <DoughToolsIcon name="close" size={24} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={() => timer.setSoundEnabled((current) => !current)}
                aria-label={timer.soundEnabled ? "Turn bake timer sound off" : "Turn bake timer sound on"}
                aria-pressed={timer.soundEnabled}
                className={buttonClass({
                  className: cx("min-h-12 min-w-12 rounded-2xl px-3", timer.soundEnabled && "border-tomato/30 bg-tomato text-white hover:text-white"),
                  variant: "icon",
                })}
              >
                <DoughToolsIcon name={timer.soundEnabled ? "sound-on" : "sound-off"} size={24} strokeWidth={2.2} />
              </button>
            </div>

            <div className="grid min-h-0 place-items-center py-3 text-center sm:py-7">
              <div className="w-full">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm sm:h-16 sm:w-16" aria-hidden="true">
                  <DoughToolsIcon name={ovenType === "pizza" ? "flame" : "oven"} size={24} strokeWidth={2.1} />
                </div>
                <p className="mt-2 text-xs font-extrabold uppercase tracking-[.2em] text-ink sm:mt-4">{formatOvenEyebrow(ovenType)}</p>
                <h2 id="full-screen-bake-timer-heading" className="sr-only">Full-screen bake timer</h2>
                <p id="full-screen-bake-timer-description" className="mt-1 text-sm font-bold leading-6 text-ink/55">
                  {ovenLabel} · Default {defaultValue}
                </p>

                <div className="mt-3 sm:mt-5">
                  <BakeTimerProgressRing displayValue={timer.displayValue} phase={phase} progressRatio={timer.progressRatio} />
                  <p className="sr-only" aria-live="polite">{announcement}</p>
                </div>

                <p
                  className={cx(
                    "mt-3 text-xs font-extrabold uppercase tracking-[.2em] sm:mt-5",
                    phase === "last20" || phase === "overtime" || phase === "expired" ? "text-tomato" : "text-ink/55",
                  )}
                >
                  {copy.status}
                </p>
                <p className="mt-1 text-sm font-extrabold leading-6 text-ink/70 sm:mt-2">{copy.instruction}</p>

                <div className="mt-3 grid grid-cols-[minmax(4.5rem,1fr)_minmax(7rem,1.35fr)_minmax(4.5rem,1fr)] gap-2 sm:mt-5">
                  {phase === "overtime" || phase === "expired" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => timer.adjustOvertime(-30)}
                        disabled={!overtimeCanDecrease}
                        className={buttonClass({ className: "px-3", variant: "secondary" })}
                      >
                        -30 sec
                      </button>
                      <button type="button" onClick={timer.stopAlarm} className={buttonClass({ className: "px-3", variant: "primary" })}>
                        Stop alarm
                      </button>
                      <button
                        type="button"
                        onClick={() => timer.adjustOvertime(30)}
                        disabled={!overtimeCanIncrease}
                        className={buttonClass({ className: "px-3", variant: "secondary" })}
                      >
                        +30 sec
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => timer.adjustDuration(-10)} className={buttonClass({ className: "px-3", variant: "secondary" })}>
                        -10 sec
                      </button>
                      <button
                        type="button"
                        onClick={timer.status === "running" ? timer.pause : startOrResume}
                        className={buttonClass({ className: "px-3", variant: timer.status === "running" ? "secondary" : "primary" })}
                      >
                        {timer.status === "running" ? "Pause" : timer.status === "paused" ? "Resume" : "Start timer"}
                      </button>
                      <button type="button" onClick={() => timer.adjustDuration(10)} className={buttonClass({ className: "px-3", variant: "secondary" })}>
                        +10 sec
                      </button>
                    </>
                  )}
                </div>

                {timer.status !== "idle" && (
                  <div className="mt-2 grid gap-2 sm:mt-3 sm:grid-cols-2">
                    {(phase === "expired" || timer.maxOvertimeReached) && (
                      <button type="button" onClick={timer.restart} className={buttonClass({ variant: "primary" })}>
                        Start next pizza
                      </button>
                    )}
                    <button type="button" onClick={timer.reset} className={buttonClass({ variant: "tertiary" })}>
                      Reset timer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <aside
              className={cx(
                "rounded-[1.25rem] border p-3 text-left sm:p-4",
                phase === "last20"
                  ? "border-oven-gold/40 bg-oven-gold/20"
                  : phase === "overtime" || phase === "expired"
                    ? "border-tomato/25 bg-tomato/[.08]"
                    : "border-ink/10 bg-white/75",
              )}
              role={phase === "last20" || phase === "overtime" || phase === "expired" ? "status" : undefined}
            >
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">{copy.cardTitle}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/70">{copy.cardBody}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-ink/45">
                {pizzaCount ? `${pizzaCount} pizzas planned. ` : ""}
                Runtime timer state is local to this device and does not change Kitchen progress.
              </p>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
