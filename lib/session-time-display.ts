const MINUTES_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dayDistance(from: Date, to: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / millisecondsPerDay);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

function formatWeekdayClock(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  return `${part(parts, "weekday")} ${part(parts, "hour")}:${part(parts, "minute")}`;
}

function formatShortDateClock(value: Date, includeYear: boolean) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: includeYear ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(value);
  const date = [
    `${part(parts, "weekday")},`,
    part(parts, "day"),
    part(parts, "month"),
    includeYear ? part(parts, "year") : "",
  ].filter(Boolean).join(" ");
  return `${date} · ${part(parts, "hour")}:${part(parts, "minute")}`;
}

export function formatSessionPlannedTime(value?: string, now = new Date()) {
  if (!value) return "Timing not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(now.getTime())) return "Timing not set";

  const clock = MINUTES_FORMATTER.format(date);
  const days = dayDistance(now, date);
  if (days === 0) return `Today ${clock}`;
  if (days === 1) return `Tomorrow ${clock}`;
  if (days > 1 && days <= 5) return formatWeekdayClock(date);

  return formatShortDateClock(date, date.getFullYear() !== now.getFullYear());
}
