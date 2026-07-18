export type BakeTimerStatus = "idle" | "running" | "paused" | "overtime" | "expired";
export type BakeTimerPhase = "ready" | "active" | "last20" | "paused" | "overtime" | "expired";

export type BakeTimerSnapshot = {
  status: BakeTimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  overtimeSeconds: number;
  expiresAt: number | null;
  completedCuePlayed: boolean;
};

export const BAKE_TIMER_MIN_SECONDS = 10;
export const BAKE_TIMER_MAX_SECONDS = 1_800;
export const BAKE_TIMER_MAX_OVERTIME_SECONDS = 90;
export const BAKE_TIMER_LAST_SECONDS_THRESHOLD = 20;

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
    };
  }

  const overtimeSeconds = Math.min(BAKE_TIMER_MAX_OVERTIME_SECONDS, Math.floor(Math.abs(difference) / 1000));
  return {
    ...snapshot,
    status: overtimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS ? "expired" : "overtime",
    remainingSeconds: 0,
    overtimeSeconds,
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
  };
}

export function resetBakeTimerSnapshot(snapshot: BakeTimerSnapshot): BakeTimerSnapshot {
  return createBakeTimerSnapshot(snapshot.durationSeconds);
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
  const nextOvertimeSeconds = Math.max(
    0,
    Math.min(BAKE_TIMER_MAX_OVERTIME_SECONDS, derived.overtimeSeconds + Math.round(deltaSeconds)),
  );
  return {
    ...derived,
    status: nextOvertimeSeconds >= BAKE_TIMER_MAX_OVERTIME_SECONDS ? "expired" : "overtime",
    remainingSeconds: 0,
    overtimeSeconds: nextOvertimeSeconds,
    expiresAt: now - nextOvertimeSeconds * 1000,
    completedCuePlayed: true,
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
  };
}

export function getBakeTimerPhase(snapshot: BakeTimerSnapshot): BakeTimerPhase {
  if (snapshot.status === "idle") return "ready";
  if (snapshot.status === "paused") return "paused";
  if (snapshot.status === "overtime") return "overtime";
  if (snapshot.status === "expired") return "expired";
  if (snapshot.remainingSeconds <= BAKE_TIMER_LAST_SECONDS_THRESHOLD) return "last20";
  return "active";
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
