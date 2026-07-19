"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  adjustBakeTimerDuration,
  adjustBakeTimerOvertime,
  bakeTimerDisplayValue,
  type BakeTimerSnapshot,
  type BakeTimerStatus,
  BAKE_TIMER_MAX_OVERTIME_SECONDS,
  createBakeTimerSnapshot,
  deriveBakeTimerSnapshot,
  getBakeTimerPhase,
  getBakeTimerProgressRatio,
  getBakeTimerSoundCues,
  getBakeTimerSoundPattern,
  isBakeTimerOvertimeAlarmActive,
  pauseBakeTimerSnapshot,
  resetBakeTimerSnapshot,
  resumeBakeTimerSnapshot,
  restartBakeTimerSnapshot,
  startBakeTimerSnapshot,
  stopBakeTimerAlarm,
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

function playBakeTimerCue(audioRef: MutableRefObject<AudioContext | null>, enabled: boolean, cue: Parameters<typeof getBakeTimerSoundPattern>[0]) {
  if (!enabled || typeof window === "undefined") return;
  const AudioCtor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
  if (!AudioCtor) return;
  const context = audioRef.current ?? new AudioCtor();
  audioRef.current = context;
  void context.resume?.();
  for (const tone of getBakeTimerSoundPattern(cue)) {
    const startAt = context.currentTime + tone.offset;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(tone.gain, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.length);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + tone.length + 0.03);
  }
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
  const overtimeAlarmInterval = useRef<number | null>(null);
  const previousSoundEnabled = useRef(soundEnabled);
  const soundMilestones = useRef<Set<string>>(new Set());

  const clearOvertimeAlarmLoop = useCallback(() => {
    if (overtimeAlarmInterval.current === null || typeof window === "undefined") return;
    window.clearInterval(overtimeAlarmInterval.current);
    overtimeAlarmInterval.current = null;
  }, []);

  const closeAudio = useCallback(() => {
    clearOvertimeAlarmLoop();
    const currentAudio = audio.current;
    audio.current = null;
    void currentAudio?.close();
  }, [clearOvertimeAlarmLoop]);

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
        const cues = getBakeTimerSoundCues({
          previousStatus,
          previousRemainingSeconds: current.remainingSeconds,
          snapshot: derived,
        });
        const marker = `${derived.status}:${derived.remainingSeconds}:${derived.overtimeSeconds}`;
        for (const cue of cues) {
          if (cue === "overtime") continue;
          const milestoneMarker = `${cue}:${marker}`;
          if (soundMilestones.current.has(milestoneMarker)) continue;
          soundMilestones.current.add(milestoneMarker);
          playBakeTimerCue(audio, soundEnabled, cue);
        }
        return cues.includes("expired") ? { ...derived, completedCuePlayed: true } : derived;
      });
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [snapshot.status, soundEnabled]);

  const overtimeAlarmActive = isBakeTimerOvertimeAlarmActive(snapshot);

  useEffect(() => {
    const soundWasEnabled = previousSoundEnabled.current;
    previousSoundEnabled.current = soundEnabled;

    if (!overtimeAlarmActive || !soundEnabled) {
      clearOvertimeAlarmLoop();
      if (!soundEnabled) closeAudio();
      return;
    }

    if (overtimeAlarmInterval.current !== null || typeof window === "undefined") return;
    if (!soundWasEnabled) playBakeTimerCue(audio, true, "overtime");
    overtimeAlarmInterval.current = window.setInterval(() => {
      playBakeTimerCue(audio, true, "overtime");
    }, 5_000);
  }, [clearOvertimeAlarmLoop, closeAudio, overtimeAlarmActive, soundEnabled]);

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
      clearOvertimeAlarmLoop();
    };
  }, [clearOvertimeAlarmLoop, closeAudio, releaseWakeLock]);

  const start = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => startBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const pause = useCallback(() => {
    setSnapshot((current) => pauseBakeTimerSnapshot(current));
    closeAudio();
    void releaseWakeLock();
    setWakeStatus("idle");
  }, [closeAudio, releaseWakeLock]);

  const resume = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => resumeBakeTimerSnapshot(current));
    void requestWakeLock();
  }, [requestWakeLock]);

  const reset = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot((current) => resetBakeTimerSnapshot(current));
    closeAudio();
    void releaseWakeLock();
    setWakeStatus("idle");
    if (storageKey && typeof window !== "undefined") window.localStorage.removeItem(storageKey);
  }, [closeAudio, releaseWakeLock, storageKey]);

  const restart = useCallback(() => {
    soundMilestones.current.clear();
    setSnapshot(() => restartBakeTimerSnapshot(durationSeconds));
    void requestWakeLock();
  }, [durationSeconds, requestWakeLock]);

  const adjustDuration = useCallback((deltaSeconds: number) => {
    soundMilestones.current.clear();
    setSnapshot((current) => adjustBakeTimerDuration(current, deltaSeconds));
  }, []);

  const adjustOvertime = useCallback((deltaSeconds: number) => {
    soundMilestones.current.clear();
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
  const isActive = status === "running" || status === "overtime" || overtimeAlarmActive;
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
    overtimeAlarmActive,
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
