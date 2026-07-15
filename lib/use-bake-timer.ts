"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  bakeTimerDisplayValue,
  type BakeTimerSnapshot,
  type BakeTimerStatus,
  BAKE_TIMER_MAX_OVERTIME_SECONDS,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  pauseBakeTimerSnapshot,
  resetBakeTimerSnapshot,
  resumeBakeTimerSnapshot,
  startBakeTimerSnapshot,
  updateBakeTimerDuration,
} from "@/lib/bake-timer";

export type BakeTimerWakeStatus = "idle" | "active" | "unsupported" | "failed";

type WakeLockLike = {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
  released?: boolean;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> };
};

type WindowWithAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type StoredBakeTimer = {
  version: 1;
  snapshot: BakeTimerSnapshot;
};

export type UseBakeTimerOptions = {
  durationSeconds: number;
  storageKey?: string;
  soundEnabledByDefault?: boolean;
};

function safeLoadSnapshot(storageKey: string | undefined, durationSeconds: number) {
  const fallback = createBakeTimerSnapshot(durationSeconds);
  if (!storageKey || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<StoredBakeTimer>;
    if (parsed.version !== 1 || !parsed.snapshot) return fallback;
    const snapshot = {
      ...fallback,
      ...parsed.snapshot,
      durationSeconds,
    };
    return deriveBakeTimerSnapshot(snapshot);
  } catch {
    return fallback;
  }
}

function playBeep(audioRef: MutableRefObject<AudioContext | null>, enabled: boolean, frequency = 940, length = 0.18) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
  if (!AudioCtor) return;
  const context = audioRef.current ?? new AudioCtor();
  audioRef.current = context;
  void context.resume?.();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + length);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + length + 0.02);
}

export function useBakeTimer({
  durationSeconds,
  storageKey,
  soundEnabledByDefault = true,
}: UseBakeTimerOptions) {
  const [snapshot, setSnapshot] = useState(() => safeLoadSnapshot(storageKey, durationSeconds));
  const [wakeStatus, setWakeStatus] = useState<BakeTimerWakeStatus>("idle");
  const [soundEnabled, setSoundEnabled] = useState(soundEnabledByDefault);
  const wakeLock = useRef<WakeLockLike | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const closeAudio = useCallback(() => {
    const currentAudio = audio.current;
    audio.current = null;
    void currentAudio?.close();
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLock.current?.release();
    } catch {
      // The browser may have already released it.
    }
    wakeLock.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined") return;
    const wakeNavigator = navigator as NavigatorWithWakeLock;
    if (!wakeNavigator.wakeLock) {
      setWakeStatus("unsupported");
      return;
    }
    try {
      const sentinel = await wakeNavigator.wakeLock.request("screen");
      wakeLock.current = sentinel;
      setWakeStatus("active");
      sentinel.addEventListener("release", () => {
        wakeLock.current = null;
        setWakeStatus((current) => (current === "idle" ? current : "failed"));
      });
    } catch {
      setWakeStatus("failed");
    }
  }, []);

  useEffect(() => {
    setSnapshot((current) => {
      if (current.status === "running" || current.status === "overtime") return current;
      if (current.durationSeconds === durationSeconds) return current;
      return updateBakeTimerDuration(current, durationSeconds);
    });
  }, [durationSeconds]);

  useEffect(() => {
    if (snapshot.status !== "running" && snapshot.status !== "overtime") return;
    const update = () => {
      setSnapshot((current) => {
        const previousStatus = current.status;
        const derived = deriveBakeTimerSnapshot(current);
        if ((derived.status === "overtime" || derived.status === "expired") && previousStatus === "running" && !derived.completedCuePlayed) {
          playBeep(audio, soundEnabled, 1_080, 0.32);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([80, 40, 160]);
          return { ...derived, completedCuePlayed: true };
        }
        return derived;
      });
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [snapshot.status, soundEnabled]);

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (snapshot.status === "idle") {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, snapshot } satisfies StoredBakeTimer));
  }, [snapshot, storageKey]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && (snapshot.status === "running" || snapshot.status === "overtime") && !wakeLock.current) {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [requestWakeLock, snapshot.status]);

  useEffect(() => {
    return () => {
      void releaseWakeLock();
      closeAudio();
    };
  }, [closeAudio, releaseWakeLock]);

  const start = useCallback(() => {
    setSnapshot((current) => startBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const pause = useCallback(() => {
    setSnapshot((current) => pauseBakeTimerSnapshot(current));
    void releaseWakeLock();
    setWakeStatus("idle");
  }, [releaseWakeLock]);

  const resume = useCallback(() => {
    setSnapshot((current) => resumeBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const reset = useCallback(() => {
    setSnapshot((current) => resetBakeTimerSnapshot(current));
    void releaseWakeLock();
    setWakeStatus("idle");
    if (storageKey && typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  }, [releaseWakeLock, storageKey]);

  const restart = useCallback(() => {
    setSnapshot((current) => startBakeTimerSnapshot(resetBakeTimerSnapshot(current)));
    void requestWakeLock();
  }, [requestWakeLock]);

  const displayValue = useMemo(() => bakeTimerDisplayValue(snapshot), [snapshot]);
  const status = snapshot.status as BakeTimerStatus;
  const isActive = status === "running" || status === "overtime";
  const maxOvertimeReached = snapshot.overtimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS || status === "expired";

  return {
    snapshot,
    status,
    displayValue,
    wakeStatus,
    soundEnabled,
    setSoundEnabled,
    isActive,
    maxOvertimeReached,
    start,
    pause,
    resume,
    reset,
    restart,
  };
}
