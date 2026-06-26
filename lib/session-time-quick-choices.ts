export type PizzaSessionDayQuickChoiceId =
  | "today"
  | "tomorrow"
  | "day-after-tomorrow"
  | "three-days-from-now"
  | "custom-date";

export type PizzaSessionTimeQuickChoiceId = "lunch" | "afternoon" | "dinner" | "evening" | "custom-time";

export type PizzaSessionDayQuickChoice = {
  id: PizzaSessionDayQuickChoiceId;
  label: string;
  date?: string;
  displayDate?: string;
};

export type PizzaSessionTimeQuickChoice = {
  id: PizzaSessionTimeQuickChoiceId;
  label: string;
  time?: string;
};

export const pizzaSessionTimeQuickChoices: PizzaSessionTimeQuickChoice[] = [
  { id: "lunch", label: "Lunch", time: "12:00" },
  { id: "afternoon", label: "Afternoon", time: "16:00" },
  { id: "dinner", label: "Dinner", time: "18:00" },
  { id: "evening", label: "Evening", time: "20:00" },
  { id: "custom-time", label: "Custom time" },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = startOfLocalDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatQuickDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function weekdayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(date);
}

export function getPizzaSessionDayQuickChoices(today = new Date()): PizzaSessionDayQuickChoice[] {
  const twoDaysFromNow = addDays(today, 2);
  const threeDaysFromNow = addDays(today, 3);
  const choices: Array<[PizzaSessionDayQuickChoiceId, string, Date | undefined]> = [
    ["today", "Today", startOfLocalDay(today)],
    ["tomorrow", "Tomorrow", addDays(today, 1)],
    ["day-after-tomorrow", weekdayLabel(twoDaysFromNow), twoDaysFromNow],
    ["three-days-from-now", weekdayLabel(threeDaysFromNow), threeDaysFromNow],
    ["custom-date", "Custom date", undefined],
  ];

  return choices.map(([id, label, date]) => ({
    id,
    label,
    date: date ? toLocalDateValue(date) : undefined,
    displayDate: date ? formatQuickDate(date) : undefined,
  }));
}

export function buildPizzaSessionTargetTime(
  dayChoiceId: PizzaSessionDayQuickChoiceId | undefined,
  timeChoiceId: PizzaSessionTimeQuickChoiceId | undefined,
  today = new Date(),
) {
  if (!dayChoiceId || !timeChoiceId || dayChoiceId === "custom-date" || timeChoiceId === "custom-time") {
    return "";
  }

  const day = getPizzaSessionDayQuickChoices(today).find((choice) => choice.id === dayChoiceId);
  const time = pizzaSessionTimeQuickChoices.find((choice) => choice.id === timeChoiceId);

  if (!day?.date || !time?.time) return "";
  return `${day.date}T${time.time}`;
}

export function getDefaultPizzaSessionTargetTime(today = new Date()) {
  return buildPizzaSessionTargetTime("tomorrow", "dinner", today);
}
