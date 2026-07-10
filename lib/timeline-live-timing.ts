export type TimelineLiveTiming = {
  kind: "future" | "ready" | "overdue" | "unknown";
  label: string;
  value?: string;
};

function formatDurationParts(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  if (seconds < 60) return `${seconds} sec`;

  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [
    hours ? `${hours} h` : "",
    minutes ? `${minutes} min` : "",
  ].filter(Boolean);
  return parts.join(" ") || "0 min";
}

export function formatTimelineLiveTiming(stepTime?: string, now = new Date()): TimelineLiveTiming {
  if (!stepTime) return { kind: "unknown", label: "Timing unavailable" };

  const scheduledAt = new Date(stepTime);
  if (!Number.isFinite(scheduledAt.getTime()) || !Number.isFinite(now.getTime())) {
    return { kind: "unknown", label: "Timing unavailable" };
  }

  const diffSeconds = Math.round((scheduledAt.getTime() - now.getTime()) / 1000);
  if (diffSeconds > 0) {
    return {
      kind: "future",
      label: `Starts in ${formatDurationParts(diffSeconds)}`,
    };
  }

  if (diffSeconds > -60) {
    return { kind: "ready", label: "READY NOW" };
  }

  return {
    kind: "overdue",
    label: "OVERDUE",
    value: `−${formatDurationParts(Math.abs(diffSeconds))}`,
  };
}
