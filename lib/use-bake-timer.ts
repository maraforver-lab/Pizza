"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  adjustBakeTimerDuration,
  adjustBakeTimerOvertime,
  bakeTimerDisplayValue,
  type BakeTimerSnapshot,
  type BakeTimerStatus,
  BAKE_TIMER_MAX_OVERTIME_SECONDS,
  BAKE_TIMER_LAST_SECONDS_THRESHOLD,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  getBakeTimerPhase,
  getBakeTimerProgressRatio,
  pauseBakeTimerSnapshot,
  resetBakeTimerSnapshot,
  resumeBakeTimerSnapshot,
  startBakeTimerSnapshot,
  stopBakeTimerAlarm,
  updateBakeTimerDuration,
} from "@/lib/bake-timer";

export type BakeTimerWakeStatus = "idle" | "active" | "unsupported" | "failed";
export type BakeTimerSoundMilestone = "normal" | "last20" | "expired" | "overtime";

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

const BAKE_TIMER_SOUND_STORAGE_KEY = "doughtools.bake-timer.sound-enabled.v1";

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

function loadSoundPreference(fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(BAKE_TIMER_SOUND_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    return fallback;
  }
  return fallback;
}

function persistSoundPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BAKE_TIMER_SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // Local preference storage can be unavailable in private or restricted contexts.
  }
}

export function useBakeTimer({
  durationSeconds,
  storageKey,
  soundEnabledByDefault = true,
}: UseBakeTimerOptions) {
  const [snapshot, setSnapshot] = useState(() => safeLoadSnapshot(storageKey, durationSeconds));
  const [wakeStatus, setWakeStatus] = useState<BakeTimerWakeStatus>("idle");
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundPreference(soundEnabledByDefault));
  const wakeLock = useRef<WakeLockLike | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const soundMilestones = useRef<Set<string>>(new Set());

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
        const previousRemaining = current.remainingSeconds;
        const derived = deriveBakeTimerSnapshot(current);
        const marker = `${derived.status}:${derived.remainingSeconds}:${derived.overtimeSeconds}`;
        const emitMilestone = (milestone: BakeTimerSoundMilestone, frequency: number, length: number) => {
          const milestoneMarker = `${milestone}:${marker}`;
          if (soundMilestones.current.has(milestoneMarker)) return;
          soundMilestones.current.add(milestoneMarker);
          playBeep(audio, soundEnabled, frequency, length);
        };
        if (derived.status === "running" && derived.remainingSeconds > BAKE_TIMER_LAST_SECONDS_THRESHOLD && derived.remainingSeconds % 10 === 0) {
          emitMilestone("normal", 820, 0.12);
        }
        if (derived.status === "running" && derived.remainingSeconds <= BAKE_TIMER_LAST_SECONDS_THRESHOLD && derived.remainingSeconds > 0 && derived.remainingSeconds % 5 === 0) {
          emitMilestone("last20", 980, 0.16);
        }
        if (derived.status === "running" && previousRemaining > BAKE_TIMER_LAST_SECONDS_THRESHOLD && derived.remainingSeconds <= BAKE_TIMER_LAST_SECONDS_THRESHOLD) {
          emitMilestone("last20", 1_020, 0.18);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([60]);
        }
        if ((derived.status === "overtime" || derived.status === "expired") && previousStatus === "running" && !derived.completedCuePlayed) {
          emitMilestone("expired", 1_080, 0.32);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([80, 40, 160]);
          return { ...derived, completedCuePlayed: true };
        }
        if (derived.status === "overtime" && derived.overtimeSeconds > 0 && derived.overtimeSeconds % 5 === 0) {
          emitMilestone("overtime", 1_040, 0.22);
        }
        return derived;
      });
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [snapshot.status, soundEnabled]);

  useEffect(() => {
    persistSoundPreference(soundEnabled);
    if (!soundEnabled) closeAudio();
  }, [closeAudio, soundEnabled]);

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
    soundMilestones.current.clear();
    setSnapshot((current) => startBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const pause = useCallback(() => {
    setSnapshot((current) => pauseBakeTimerSnapshot(current));
    void releaseWakeLock();
    setWakeStatus("idle");
  }, [releaseWakeLock]);

  const resume = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => resumeBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const reset = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => resetBakeTimerSnapshot(current));
    void releaseWakeLock();
    setWakeStatus("idle");
    if (storageKey && typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  }, [releaseWakeLock, storageKey]);

  const restart = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => startBakeTimerSnapshot(resetBakeTimerSnapshot(current)));
    void requestWakeLock();
  }, [requestWakeLock]);

  const adjustDuration = useCallback((deltaSeconds: number) => {
    setSnapshot((current) => adjustBakeTimerDuration(current, deltaSeconds));
  }, []);

  const adjustOvertime = useCallback((deltaSeconds: number) => {
    setSnapshot((current) => adjustBakeTimerOvertime(current, deltaSeconds));
  }, []);

  const stopAlarm = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => stopBakeTimerAlarm(current));
    closeAudio();
    void releaseWakeLock();
    setWakeStatus("idle");
  }, [closeAudio, releaseWakeLock]);

  const displayValue = useMemo(() => bakeTimerDisplayValue(snapshot), [snapshot]);
  const status = snapshot.status as BakeTimerStatus;
  const isActive = status === "running" || status === "overtime";
  const maxOvertimeReached = snapshot.overtimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS || status === "expired";
  const phase = useMemo(() => getBakeTimerPhase(snapshot), [snapshot]);
  const progressRatio = useMemo(() => getBakeTimerProgressRatio(snapshot), [snapshot]);

  return {
    snapshot,
    status,
    phase,
    displayValue,
    progressRatio,
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
    adjustDuration,
    adjustOvertime,
    stopAlarm,
  };
}
