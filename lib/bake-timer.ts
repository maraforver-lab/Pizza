export type BakeTimerStatus = "idle" | "running" | "paused" | "overtime" | "expired";

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

export function normalizeBakeTimerDuration(value: number, fallback = 90) {
  const numeric = Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(BAKE_TIMER_MIN_SECONDS, Math.min(BAKE_TIMER_MAX_SECONDS, numeric));
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
  const remainingSeconds = normalizeBakeTimerDuration(snapshot.remainingSeconds, snapshot.durationSeconds);
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
