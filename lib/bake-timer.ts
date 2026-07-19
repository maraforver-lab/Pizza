export type BakeTimerStatus = "idle" | "running" | "paused" | "overtime" | "expired";
export type BakeTimerPhase = "ready" | "active" | "almost_there" | "final_ten" | "paused" | "overtime" | "expired";
export type BakeTimerOvertimeAlarmState = "inactive" | "active" | "stopped";
export type BakeTimerSoundCue =
  | "normal"
  | "almost_there"
  | "final_ten_transition"
  | "final_ten"
  | "final_three"
  | "expired"
  | "overtime";

export type BakeTimerSoundTone = {
  frequency: number;
  length: number;
  gain: number;
  offset: number;
};

export type BakeTimerSnapshot = {
  status: BakeTimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  overtimeSeconds: number;
  expiresAt: number | null;
  completedCuePlayed: boolean;
  overtimeAlarmState: BakeTimerOvertimeAlarmState;
};

export const BAKE_TIMER_MIN_SECONDS = 10;
export const BAKE_TIMER_MAX_SECONDS = 1_800;
export const BAKE_TIMER_MAX_OVERTIME_SECONDS = 90;
export const BAKE_TIMER_LAST_SECONDS_THRESHOLD = 20;
export const BAKE_TIMER_FINAL_SECONDS_THRESHOLD = 10;
export const BAKE_TIMER_FINAL_THREE_SECONDS_THRESHOLD = 3;

export function normalizeBakeTimerDuration(value: number, fallback = 90) {
  const numeric = Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(BAKE_TIMER_MIN_SECONDS, Math.min(BAKE_TIMER_MAX_SECONDS, numeric));
}

function normalizeBakeTimerRemaining(value: number, durationSeconds: number) {
  const duration = normalizeBakeTimerDuration(durationSeconds);
  const numeric = Number.isFinite(value) ? Math.round(value) : duration;
  return Math.max(1, Math.min(duration, numeric));
}

export function createBakeTimerSnapshot(durationSeconds: number): BakeTimerSnapshot {
  const duration = normalizeBakeTimerDuration(durationSeconds);
  return {
    status: "idle",
    durationSeconds: duration,
    remainingSeconds: duration,
    overtimeSeconds: 0,
    expiresAt: null,
    completedCuePlayed: false,
    overtimeAlarmState: "inactive",
  };
}

export function deriveBakeTimerSnapshot(snapshot: BakeTimerSnapshot, now = Date.now()): BakeTimerSnapshot {
  if (snapshot.status !== "running" && snapshot.status !== "overtime") return snapshot;
  if (!snapshot.expiresAt) return resetBakeTimerSnapshot(snapshot);

  const difference = snapshot.expiresAt - now;
  if (difference > 0) {
    return {
      ...snapshot,
      status: "running",
      remainingSeconds: Math.ceil(difference / 1000),
      overtimeSeconds: 0,
      overtimeAlarmState: "inactive",
    };
  }

  const overtimeSeconds = Math.min(BAKE_TIMER_MAX_OVERTIME_SECONDS, Math.floor(Math.abs(difference) / 1000));
  return {
    ...snapshot,
    status: overtimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS ? "expired" : "overtime",
    remainingSeconds: 0,
    overtimeSeconds,
    overtimeAlarmState: snapshot.overtimeAlarmState === "stopped" ? "stopped" : "active",
  };
}

export function startBakeTimerSnapshot(snapshot: BakeTimerSnapshot, now = Date.now()): BakeTimerSnapshot {
  const durationSeconds = normalizeBakeTimerDuration(snapshot.durationSeconds);
  return {
    ...snapshot,
    status: "running",
    durationSeconds,
    remainingSeconds: durationSeconds,
    overtimeSeconds: 0,
    expiresAt: now + durationSeconds * 1000,
    completedCuePlayed: false,
    overtimeAlarmState: "inactive",
  };
}

export function pauseBakeTimerSnapshot(snapshot: BakeTimerSnapshot, now = Date.now()): BakeTimerSnapshot {
  const derived = deriveBakeTimerSnapshot(snapshot, now);
  if (derived.status !== "running") return derived;
  return {
    ...derived,
    status: "paused",
    expiresAt: null,
  };
}

export function resumeBakeTimerSnapshot(snapshot: BakeTimerSnapshot, now = Date.now()): BakeTimerSnapshot {
  const remainingSeconds = normalizeBakeTimerRemaining(snapshot.remainingSeconds, snapshot.durationSeconds);
  return {
    ...snapshot,
    status: "running",
    remainingSeconds,
    overtimeSeconds: 0,
    expiresAt: now + remainingSeconds * 1000,
    completedCuePlayed: false,
    overtimeAlarmState: "inactive",
  };
}

export function resetBakeTimerSnapshot(snapshot: BakeTimerSnapshot): BakeTimerSnapshot {
  return createBakeTimerSnapshot(snapshot.durationSeconds);
}

export function restartBakeTimerSnapshot(defaultDurationSeconds: number, now = Date.now()): BakeTimerSnapshot {
  return startBakeTimerSnapshot(createBakeTimerSnapshot(defaultDurationSeconds), now);
}

export function updateBakeTimerDuration(snapshot: BakeTimerSnapshot, durationSeconds: number): BakeTimerSnapshot {
  const duration = normalizeBakeTimerDuration(durationSeconds, snapshot.durationSeconds);
  return createBakeTimerSnapshot(duration);
}

export function adjustBakeTimerDuration(snapshot: BakeTimerSnapshot, deltaSeconds: number, now = Date.now()): BakeTimerSnapshot {
  const derived = deriveBakeTimerSnapshot(snapshot, now);
  const nextDuration = normalizeBakeTimerDuration(derived.durationSeconds + Math.round(deltaSeconds), derived.durationSeconds);

  if (derived.status === "running") {
    const nextRemaining = normalizeBakeTimerRemaining(derived.remainingSeconds + Math.round(deltaSeconds), nextDuration);
    return {
      ...derived,
      durationSeconds: nextDuration,
      remainingSeconds: nextRemaining,
      expiresAt: now + nextRemaining * 1000,
    };
  }

  if (derived.status === "paused") {
    return {
      ...derived,
      durationSeconds: nextDuration,
      remainingSeconds: normalizeBakeTimerRemaining(derived.remainingSeconds + Math.round(deltaSeconds), nextDuration),
    };
  }

  if (derived.status === "overtime" || derived.status === "expired") {
    return {
      ...derived,
      durationSeconds: nextDuration,
    };
  }

  return createBakeTimerSnapshot(nextDuration);
}

export function adjustBakeTimerOvertime(snapshot: BakeTimerSnapshot, deltaSeconds: number, now = Date.now()): BakeTimerSnapshot {
  const derived = deriveBakeTimerSnapshot(snapshot, now);
  if (derived.status !== "overtime" && derived.status !== "expired") return derived;
  const nextRawOvertimeSeconds = derived.overtimeSeconds + Math.round(deltaSeconds);

  if (nextRawOvertimeSeconds <= 0) {
    const remainingSeconds = normalizeBakeTimerRemaining(Math.abs(nextRawOvertimeSeconds) || 1, derived.durationSeconds);
    return {
      ...derived,
      status: "running",
      remainingSeconds,
      overtimeSeconds: 0,
      expiresAt: now + remainingSeconds * 1000,
      completedCuePlayed: false,
      overtimeAlarmState: "inactive",
    };
  }

  const nextOvertimeSeconds = Math.min(BAKE_TIMER_MAX_OVERTIME_SECONDS, nextRawOvertimeSeconds);
  return {
    ...derived,
    status: nextOvertimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS ? "expired" : "overtime",
    remainingSeconds: 0,
    overtimeSeconds: nextOvertimeSeconds,
    expiresAt: now - nextOvertimeSeconds * 1000,
    completedCuePlayed: true,
    overtimeAlarmState: derived.overtimeAlarmState === "stopped" ? "stopped" : "active",
  };
}

export function stopBakeTimerAlarm(snapshot: BakeTimerSnapshot, now = Date.now()): BakeTimerSnapshot {
  const derived = deriveBakeTimerSnapshot(snapshot, now);
  if (derived.status !== "overtime" && derived.status !== "expired") return derived;
  return {
    ...derived,
    status: "expired",
    expiresAt: null,
    completedCuePlayed: true,
    overtimeAlarmState: "stopped",
  };
}

export function isBakeTimerOvertimeState(snapshot: BakeTimerSnapshot) {
  return snapshot.status === "overtime" || snapshot.status === "expired";
}

export function isBakeTimerOvertimeAlarmActive(snapshot: BakeTimerSnapshot) {
  return isBakeTimerOvertimeState(snapshot) && snapshot.overtimeAlarmState === "active";
}

export function getBakeTimerPhase(snapshot: BakeTimerSnapshot): BakeTimerPhase {
  if (snapshot.status === "idle") return "ready";
  if (snapshot.status === "paused") return "paused";
  if (snapshot.status === "overtime") return "overtime";
  if (snapshot.status === "expired") return "expired";
  if (snapshot.remainingSeconds <= BAKE_TIMER_FINAL_SECONDS_THRESHOLD) return "final_ten";
  if (snapshot.remainingSeconds <= BAKE_TIMER_LAST_SECONDS_THRESHOLD) return "almost_there";
  return "active";
}

export function getBakeTimerSoundCues({
  previousStatus,
  previousRemainingSeconds,
  snapshot,
}: {
  previousStatus: BakeTimerStatus;
  previousRemainingSeconds: number;
  snapshot: BakeTimerSnapshot;
}): BakeTimerSoundCue[] {
  if (snapshot.status === "paused" || snapshot.status === "idle") return [];

  const cues: BakeTimerSoundCue[] = [];

  if (snapshot.status === "running") {
    if (snapshot.remainingSeconds > BAKE_TIMER_LAST_SECONDS_THRESHOLD && snapshot.remainingSeconds % 10 === 0) {
      cues.push("normal");
    }
    if (
      snapshot.remainingSeconds <= BAKE_TIMER_LAST_SECONDS_THRESHOLD
      && snapshot.remainingSeconds > BAKE_TIMER_FINAL_SECONDS_THRESHOLD
      && snapshot.remainingSeconds % 5 === 0
    ) {
      cues.push("almost_there");
    }
    if (
      previousRemainingSeconds > BAKE_TIMER_FINAL_SECONDS_THRESHOLD
      && snapshot.remainingSeconds <= BAKE_TIMER_FINAL_SECONDS_THRESHOLD
      && snapshot.remainingSeconds > 0
    ) {
      cues.push("final_ten_transition");
    }
    if (snapshot.remainingSeconds <= BAKE_TIMER_FINAL_SECONDS_THRESHOLD && snapshot.remainingSeconds > 0) {
      cues.push(snapshot.remainingSeconds <= BAKE_TIMER_FINAL_THREE_SECONDS_THRESHOLD ? "final_three" : "final_ten");
    }
  }

  if ((snapshot.status === "overtime" || snapshot.status === "expired") && previousStatus === "running" && !snapshot.completedCuePlayed) {
    cues.push("expired");
  }
  if (snapshot.status === "expired") return cues;
  if (snapshot.status === "overtime" && snapshot.overtimeSeconds > 0 && snapshot.overtimeSeconds % 5 === 0) {
    cues.push("overtime");
  }

  return cues;
}

export function getBakeTimerSoundPattern(cue: BakeTimerSoundCue): BakeTimerSoundTone[] {
  if (cue === "normal") {
    return [{ frequency: 820, gain: 0.13, length: 0.1, offset: 0 }];
  }
  if (cue === "almost_there") {
    return [{ frequency: 960, gain: 0.15, length: 0.12, offset: 0 }];
  }
  if (cue === "final_ten_transition") {
    return [
      { frequency: 1_060, gain: 0.16, length: 0.09, offset: 0 },
      { frequency: 1_180, gain: 0.17, length: 0.1, offset: 0.13 },
    ];
  }
  if (cue === "final_ten") {
    return [{ frequency: 1_120, gain: 0.17, length: 0.09, offset: 0 }];
  }
  if (cue === "final_three") {
    return [{ frequency: 1_360, gain: 0.2, length: 0.11, offset: 0 }];
  }
  return [
    { frequency: 1_120, gain: 0.2, length: 0.12, offset: 0 },
    { frequency: 1_260, gain: 0.22, length: 0.12, offset: 0.18 },
    { frequency: 1_420, gain: 0.24, length: 0.18, offset: 0.36 },
  ];
}

export function getBakeTimerProgressRatio(snapshot: BakeTimerSnapshot) {
  if (snapshot.status === "overtime" || snapshot.status === "expired") return 1;
  const duration = normalizeBakeTimerDuration(snapshot.durationSeconds);
  return Math.max(0, Math.min(1, snapshot.remainingSeconds / duration));
}

export function formatBakeTimerClock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function bakeTimerDisplayValue(snapshot: BakeTimerSnapshot) {
  if (snapshot.status === "overtime" || snapshot.status === "expired") {
    return `+${formatBakeTimerClock(snapshot.overtimeSeconds)}`;
  }
  return formatBakeTimerClock(snapshot.remainingSeconds);
}
