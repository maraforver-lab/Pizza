import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import { migratePizzaSession, type PizzaSession } from "@/lib/pizza-session";

export type CloudPizzaSessionStatus = "in_progress" | "completed" | "archived";

export type CloudPizzaSessionRow = {
  id: string;
  user_id: string;
  status: CloudPizzaSessionStatus;
  title: string | null;
  current_step: string | null;
  session_data: unknown;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export const CLOUD_PIZZA_SESSION_SELECT = "id,user_id,status,title,current_step,session_data,created_at,updated_at,completed_at";

const stepLabels: Record<PizzaSession["currentStep"], string> = {
  style: "Setup",
  time: "Setup",
  quantity: "Setup",
  oven: "Setup",
  flour: "Setup",
  recipe: "Dough Plan",
  shopping: "Shopping list",
  timeline: "Timeline",
  prep: "Kitchen Mode",
  bake: "Kitchen Mode",
  review: "Review",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function meaningfulText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hoursBetween(start?: string, end?: string) {
  if (!start || !end) return undefined;
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return undefined;
  return Math.round(((endTime - startTime) / 3_600_000) * 10) / 10;
}

function inferFermentationModeFromTimeline(session: PizzaSession) {
  const labels = session.timeline?.steps
    .map((step) => `${step.id} ${step.label} ${step.description ?? ""}`.toLowerCase())
    .join(" ") ?? "";
  if (labels.includes("cold")) return "cold" as const;
  if (labels.includes("room fermentation") || labels.includes("room temperature")) return "room" as const;
  return undefined;
}

function fermentationBasisFromCompletedSession(session: PizzaSession) {
  if (finiteNumber(session.plannedFermentationHours)) {
    return undefined;
  }

  const mixStep = session.timeline?.steps.find((step) => step.id === "mix-dough");
  const bakeStep = session.timeline?.steps.find((step) => step.id === "bake-pizza");
  const fermentationHours = hoursBetween(
    mixStep?.scheduledAt,
    bakeStep?.scheduledAt ?? session.timeline?.targetEatTime ?? session.targetEatTime ?? session.targetBakeTime,
  );
  const fermentationMode = inferFermentationModeFromTimeline(session);
  if (!fermentationHours || !fermentationMode) return undefined;
  const temperatureC = finiteNumber(session.fermentationTemperatureCOverride);
  return {
    fermentationHours,
    fermentationMode,
    temperatureC,
  };
}

function hasReviewNotes(session: PizzaSession) {
  return Boolean(
    meaningfulText(session.notes)
    || meaningfulText(session.review?.whatWorked)
    || meaningfulText(session.review?.improveNextTime)
    || meaningfulText(session.review?.nextTimeTry),
  );
}

function cloudPizzaSessionReviewSummary(session: PizzaSession) {
  const rating = typeof session.rating === "number" && Number.isFinite(session.rating)
    ? `${session.rating}/5`
    : undefined;
  const notes = hasReviewNotes(session);
  if (rating && notes) return `Review: ${rating} · Notes saved`;
  if (rating) return `Review: ${rating}`;
  if (notes) return "Review: Notes saved";
  return undefined;
}

export function normalizeCloudPizzaSessionRow(value: unknown): CloudPizzaSessionRow | undefined {
  return normalizeCloudPizzaSessionRowForStatus(value, "in_progress");
}

export function normalizeCloudPizzaSessionHistoryRow(value: unknown): CloudPizzaSessionRow | undefined {
  return normalizeCloudPizzaSessionRowForStatus(value, "completed");
}

function normalizeCloudPizzaSessionRowForStatus(
  value: unknown,
  expectedStatus: CloudPizzaSessionStatus,
): CloudPizzaSessionRow | undefined {
  if (!isRecord(value)) return undefined;
  const status = value.status;
  const session = migratePizzaSession(value.session_data);
  if (!session || status !== expectedStatus) return undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const userId = typeof value.user_id === "string" ? value.user_id : undefined;
  const createdAt = typeof value.created_at === "string" ? value.created_at : undefined;
  const updatedAt = typeof value.updated_at === "string" ? value.updated_at : undefined;
  if (!id || !userId || !createdAt || !updatedAt) return undefined;
  return {
    id,
    user_id: userId,
    status: expectedStatus,
    title: typeof value.title === "string" ? value.title : null,
    current_step: typeof value.current_step === "string" ? value.current_step : null,
    session_data: session,
    created_at: createdAt,
    updated_at: updatedAt,
    completed_at: typeof value.completed_at === "string" ? value.completed_at : null,
  };
}

export function cloudPizzaSessionPayload(session: PizzaSession) {
  return {
    status: "in_progress" as const,
    title: "Active pizza session",
    current_step: session.currentStep,
    session_data: session,
  };
}

export function cloudPizzaSessionCurrentStepLabel(session: PizzaSession) {
  return stepLabels[session.currentStep] ?? "Setup";
}

export function cloudPizzaSessionDoughSummary(session: PizzaSession) {
  const balls = session.recipeSnapshot?.balls ?? session.pizzaCount;
  const ballWeight = session.recipeSnapshot?.ballWeight ?? session.doughBallWeight;
  if (!balls || !ballWeight) return "Dough plan not complete";
  return `${balls} dough balls · ${ballWeight} g each`;
}

export function cloudPizzaSessionBakeTimeSummary(session: PizzaSession) {
  const value = session.targetEatTime ?? session.targetBakeTime;
  if (!value) return "Bake time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Bake time not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function cloudPizzaSessionUpdatedLabel(value: string, now = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Updated recently";
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  if (sameDay) return "Updated today";
  return `Updated ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date)}`;
}

export function cloudPizzaSessionCompletedLabel(value: string | null | undefined, now = new Date()) {
  if (!value) return "Completed recently";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Completed recently";
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  if (sameDay) return "Completed today";
  return `Completed ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date)}`;
}

export function sortCloudPizzaSessionHistoryRows(rows: CloudPizzaSessionRow[]) {
  return [...rows].sort((a, b) => {
    const left = new Date(a.completed_at ?? a.updated_at).getTime();
    const right = new Date(b.completed_at ?? b.updated_at).getTime();
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });
}

export function cloudPizzaSessionSummary(row: CloudPizzaSessionRow, now = new Date()) {
  const session = migratePizzaSession(row.session_data);
  if (!session) {
    return {
      title: row.title ?? "Active pizza session",
      statusLine: `In progress · ${cloudPizzaSessionUpdatedLabel(row.updated_at, now)}`,
      doughLine: "Dough plan not complete",
      bakeLine: "Bake time not set",
      stepLine: "Current step not set",
    };
  }
  return {
    title: row.title ?? "Active pizza session",
    statusLine: `In progress · ${cloudPizzaSessionUpdatedLabel(row.updated_at, now)}`,
    doughLine: cloudPizzaSessionDoughSummary(session),
    bakeLine: `Bake time: ${cloudPizzaSessionBakeTimeSummary(session)}`,
    stepLine: `Current step: ${cloudPizzaSessionCurrentStepLabel(session)}`,
  };
}

export function cloudPizzaSessionHistorySummary(row: CloudPizzaSessionRow, now = new Date()) {
  const session = migratePizzaSession(row.session_data);
  if (!session) {
    return {
      title: "Completed pizza session",
      statusLine: cloudPizzaSessionCompletedLabel(row.completed_at ?? row.updated_at, now),
      doughLine: "Dough plan not complete",
      bakeLine: "Bake time: Bake time not set",
      hydrationLine: undefined,
      fermentationLine: undefined,
      reviewLine: undefined,
    };
  }
  const hydration = session.recipeSnapshot?.hydration ?? session.hydrationPercentOverride;
  const fermentation = buildSessionFermentationDisplay({
    session,
    snapshot: session.recipeSnapshot,
    basis: fermentationBasisFromCompletedSession(session),
  });
  const fermentationLine = fermentation.durationHours && fermentation.mode
    ? `Fermentation: ${fermentation.fullLabel}`
    : undefined;
  const reviewLine = cloudPizzaSessionReviewSummary(session);

  return {
    title: "Completed pizza session",
    statusLine: cloudPizzaSessionCompletedLabel(row.completed_at ?? row.updated_at, now),
    doughLine: cloudPizzaSessionDoughSummary(session),
    bakeLine: `Bake time: ${cloudPizzaSessionBakeTimeSummary(session)}`,
    hydrationLine: typeof hydration === "number" && Number.isFinite(hydration)
      ? `Hydration: ${Math.round(hydration * 10) / 10}%`
      : undefined,
    fermentationLine,
    reviewLine,
  };
}
