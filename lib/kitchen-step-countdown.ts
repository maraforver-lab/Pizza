export type KitchenCountdownStatus = "remaining" | "overdue" | "unavailable";

export type KitchenStepCountdownState = {
  status: KitchenCountdownStatus;
  label: string;
  totalSeconds: number;
  isFinalTwoMinutes: boolean;
};

export const KITCHEN_SOUND_ALERT_CHECKPOINTS_SECONDS = [120, 105, 90, 75, 60, 45, 30, 15] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${pad(minutes)}:${pad(secs)}`;
}

function timestamp(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : undefined;
}

export function kitchenStepCountdownState(targetTime?: string, now = new Date()): KitchenStepCountdownState {
  const target = timestamp(targetTime);
  const current = now.getTime();
  if (target === undefined || !Number.isFinite(current)) {
    return {
      status: "unavailable",
      label: "Step timer unavailable",
      totalSeconds: 0,
      isFinalTwoMinutes: false,
    };
  }

  const diffMs = target - current;
  if (diffMs >= 0) {
    const diffSeconds = Math.ceil(diffMs / 1000);
    return {
      status: "remaining",
      label: `${formatDuration(diffSeconds)} remaining`,
      totalSeconds: diffSeconds,
      isFinalTwoMinutes: diffSeconds > 0 && diffSeconds <= 120,
    };
  }

  const overdueSeconds = Math.max(1, Math.ceil(Math.abs(diffMs) / 1000));
  return {
    status: "overdue",
    label: `+${formatDuration(overdueSeconds)} over`,
    totalSeconds: overdueSeconds,
    isFinalTwoMinutes: false,
  };
}

export function alertCheckpointForRemainingSeconds(remainingSeconds: number) {
  const rounded = Math.ceil(remainingSeconds);
  return KITCHEN_SOUND_ALERT_CHECKPOINTS_SECONDS.find((checkpoint) => rounded === checkpoint);
}
