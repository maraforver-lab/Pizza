export const PARTY_ORDER_LEGACY_TIME_ZONE = "Europe/Helsinki";

export type PartyOrderTimeErrorCode =
  | "missing_timezone"
  | "invalid_timezone"
  | "invalid_date"
  | "invalid_time"
  | "nonexistent_time";

export type PartyOrderTimeResult =
  | { ok: true; instant: string; timeZone: string; ambiguous: boolean }
  | { ok: false; code: PartyOrderTimeErrorCode; error: string };

type WallTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    calendar: "iso8601",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function numberPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  const value = parts.find((part) => part.type === type)?.value;
  return value ? Number(value) : NaN;
}

function zonedParts(instantMs: number, timeZone: string): WallTimeParts | undefined {
  const parts = formatterFor(timeZone).formatToParts(new Date(instantMs));
  const year = numberPart(parts, "year");
  const month = numberPart(parts, "month");
  const day = numberPart(parts, "day");
  const hour = numberPart(parts, "hour");
  const minute = numberPart(parts, "minute");
  if (![year, month, day, hour, minute].every(Number.isFinite)) return undefined;
  return { year, month, day, hour, minute };
}

function wallPartsAsUtcMs(parts: WallTimeParts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

function offsetAt(instantMs: number, timeZone: string) {
  const parts = zonedParts(instantMs, timeZone);
  return parts ? wallPartsAsUtcMs(parts) - instantMs : undefined;
}

function sameWallTime(left: WallTimeParts, right: WallTimeParts) {
  return left.year === right.year
    && left.month === right.month
    && left.day === right.day
    && left.hour === right.hour
    && left.minute === right.minute;
}

function parseDateTimeLocal(value: string): WallTimeParts | undefined {
  const match = DATE_TIME_LOCAL_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const parts = {
    year: Number(yearValue),
    month: Number(monthValue),
    day: Number(dayValue),
    hour: Number(hourValue),
    minute: Number(minuteValue),
  };
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  if (
    date.getUTCFullYear() !== parts.year
    || date.getUTCMonth() + 1 !== parts.month
    || date.getUTCDate() !== parts.day
    || date.getUTCHours() !== parts.hour
    || date.getUTCMinutes() !== parts.minute
  ) {
    return undefined;
  }
  return parts;
}

function parseDateAndTime(date: string, time: string): WallTimeParts | undefined {
  const dateMatch = DATE_PATTERN.exec(date.trim());
  const timeMatch = TIME_PATTERN.exec(time.trim());
  if (!dateMatch || !timeMatch) return undefined;
  return parseDateTimeLocal(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${timeMatch[1]}:${timeMatch[2]}`);
}

export function normalizePartyOrderTimeZone(value: unknown) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate) return undefined;
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: candidate }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export function detectBrowserPartyOrderTimeZone() {
  if (typeof Intl === "undefined") return undefined;
  return normalizePartyOrderTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function zonedWallTimeToUtc(input: {
  date: string;
  time: string;
  timeZone: string;
}): PartyOrderTimeResult {
  const timeZone = normalizePartyOrderTimeZone(input.timeZone);
  if (!input.timeZone) {
    return { ok: false, code: "missing_timezone", error: "Time zone is required." };
  }
  if (!timeZone) {
    return { ok: false, code: "invalid_timezone", error: "Time zone is invalid." };
  }

  const desired = parseDateAndTime(input.date, input.time);
  if (!desired) {
    return { ok: false, code: "invalid_date", error: "Date and time are invalid." };
  }

  const wallUtcMs = wallPartsAsUtcMs(desired);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    const offset = offsetAt(wallUtcMs + hours * 3_600_000, timeZone);
    if (typeof offset === "number" && Number.isFinite(offset)) offsets.add(offset);
  }

  const candidates = [...offsets]
    .map((offset) => wallUtcMs - offset)
    .filter((instantMs, index, values) => values.indexOf(instantMs) === index)
    .filter((instantMs) => {
      const formatted = zonedParts(instantMs, timeZone);
      return formatted ? sameWallTime(formatted, desired) : false;
    })
    .sort((left, right) => left - right);

  if (candidates.length === 0) {
    return {
      ok: false,
      code: "nonexistent_time",
      error: "This time does not exist because the clocks change that day. Choose another time.",
    };
  }

  return {
    ok: true,
    ambiguous: candidates.length > 1,
    instant: new Date(candidates[0]).toISOString(),
    timeZone,
  };
}

export function dateTimeLocalToUtc(dateTimeLocal: string, timeZone: string): PartyOrderTimeResult {
  const parts = parseDateTimeLocal(dateTimeLocal);
  if (!parts) {
    return { ok: false, code: "invalid_date", error: "Date and time are invalid." };
  }
  return zonedWallTimeToUtc({
    date: `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    time: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
    timeZone,
  });
}

export function utcToZonedFormValue(input: { instant: string; timeZone: string }) {
  const timeZone = normalizePartyOrderTimeZone(input.timeZone) ?? PARTY_ORDER_LEGACY_TIME_ZONE;
  const instantMs = new Date(input.instant).getTime();
  if (!Number.isFinite(instantMs)) return "";
  const parts = zonedParts(instantMs, timeZone);
  if (!parts) return "";
  return [
    String(parts.year).padStart(4, "0"),
    "-",
    String(parts.month).padStart(2, "0"),
    "-",
    String(parts.day).padStart(2, "0"),
    "T",
    String(parts.hour).padStart(2, "0"),
    ":",
    String(parts.minute).padStart(2, "0"),
  ].join("");
}

export function validUtcInstant(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) return undefined;
  const timestamp = new Date(trimmed).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

export function partyOrderDateTimeLabel(value: string, timeZone = PARTY_ORDER_LEGACY_TIME_ZONE) {
  const normalizedTimeZone = normalizePartyOrderTimeZone(timeZone) ?? PARTY_ORDER_LEGACY_TIME_ZONE;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Not set";
  const date = new Date(timestamp);
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
    timeZone: normalizedTimeZone,
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  return `${weekday} ${day} ${month} · ${hour}:${minute} · ${normalizedTimeZone}`.trim();
}
