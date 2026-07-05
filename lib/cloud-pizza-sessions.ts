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

export function normalizeCloudPizzaSessionRow(value: unknown): CloudPizzaSessionRow | undefined {
  if (!isRecord(value)) return undefined;
  const status = value.status;
  const session = migratePizzaSession(value.session_data);
  if (!session || status !== "in_progress") return undefined;
  const id = typeof value.id === "string" ? value.id : undefined;
  const userId = typeof value.user_id === "string" ? value.user_id : undefined;
  const createdAt = typeof value.created_at === "string" ? value.created_at : undefined;
  const updatedAt = typeof value.updated_at === "string" ? value.updated_at : undefined;
  if (!id || !userId || !createdAt || !updatedAt) return undefined;
  return {
    id,
    user_id: userId,
    status,
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
