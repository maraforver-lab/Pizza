const EARLY_TIMELINE_START_WARNING_THRESHOLD_MS = 60 * 60 * 1000;

export function shouldWarnBeforeEarlyTimelineStart(stepTime?: string | null, now = new Date()) {
  if (!stepTime) return false;

  const scheduledAt = new Date(stepTime).getTime();
  const currentTime = now.getTime();

  if (!Number.isFinite(scheduledAt) || !Number.isFinite(currentTime)) return false;

  return scheduledAt - currentTime > EARLY_TIMELINE_START_WARNING_THRESHOLD_MS;
}

export function formatEarlyTimelineStartTime(value?: string | null) {
  if (!value) return "the planned time";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "the planned time";

  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const weekday = part("weekday");
  const day = part("day");
  const month = part("month");
  const hour = part("hour");
  const minute = part("minute");

  return [weekday, day, month].filter(Boolean).join(" ") + (hour && minute ? ` at ${hour}:${minute}` : "");
}
