"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { enableKitchenStepAudioAlerts, playKitchenStepChime } from "@/lib/kitchen-audio-alerts";
import {
  alertCheckpointForRemainingSeconds,
  kitchenStepCountdownState,
} from "@/lib/kitchen-step-countdown";

type KitchenStepCountdownProps = {
  targetTime?: string;
};

export function KitchenStepCountdown({ targetTime }: KitchenStepCountdownProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundUnavailable, setSoundUnavailable] = useState(false);
  const playedCheckpointsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    playedCheckpointsRef.current = new Set();
  }, [targetTime]);

  const countdown = useMemo(
    () => now ? kitchenStepCountdownState(targetTime, now) : undefined,
    [now, targetTime],
  );

  useEffect(() => {
    if (!soundEnabled || !countdown || countdown.status !== "remaining") return;
    const checkpoint = alertCheckpointForRemainingSeconds(countdown.totalSeconds);
    if (!checkpoint || playedCheckpointsRef.current.has(checkpoint)) return;
    playedCheckpointsRef.current.add(checkpoint);
    void playKitchenStepChime().then((played) => {
      if (!played) setSoundUnavailable(true);
    });
  }, [countdown, soundEnabled]);

  if (!countdown || countdown.status === "unavailable") return null;

  const enableSound = async () => {
    const enabled = await enableKitchenStepAudioAlerts();
    setSoundEnabled(enabled);
    setSoundUnavailable(!enabled);
  };

  const isOverdue = countdown.status === "overdue";

  return (
    <section
      aria-label="Active step timer"
      className={[
        "mt-4 rounded-2xl border px-4 py-3 transition sm:mt-5 sm:px-5",
        isOverdue
          ? "border-tomato/25 bg-tomato/[.07] text-tomato shadow-[0_0_30px_rgba(233,75,46,0.18)]"
          : "border-ink/10 bg-cream/70 text-ink",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] opacity-60">
            Active step timer
          </p>
          <p
            className={[
              "mt-1 text-2xl font-black tabular-nums leading-none sm:text-3xl",
              isOverdue ? "text-tomato" : "text-ink",
            ].join(" ")}
          >
            {countdown.label}
          </p>
        </div>
        {!soundEnabled ? (
          <button
            type="button"
            onClick={enableSound}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/70 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Enable sound alerts
          </button>
        ) : (
          <p className="rounded-full bg-white/70 px-3 py-2 text-xs font-extrabold uppercase tracking-[.14em] text-ink/55">
            Sound alerts on
          </p>
        )}
      </div>
      <p className="mt-2 text-sm font-bold leading-5 opacity-70">
        {isOverdue
          ? "This step target has passed. Continue when ready, then mark the step done."
          : "Counts down only this active Kitchen Mode step."}
      </p>
      {soundUnavailable && (
        <p className="mt-2 text-xs font-bold leading-5 text-ink/55" role="status">
          Sound alerts are unavailable in this browser, but the timer still works.
        </p>
      )}
    </section>
  );
}
