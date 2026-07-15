import { type CloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import {
  migratePizzaSession,
  pizzaSessionContinueHref,
  type PizzaSession,
} from "@/lib/pizza-session";

export type ActiveSessionResumeSource = "local" | "cloud";

export type ActiveSessionResumeDecision =
  | {
      state: "empty";
      session: null;
      source: null;
      href: "/session/start";
      cloudRow?: undefined;
    }
  | {
      state: "active";
      session: PizzaSession;
      source: ActiveSessionResumeSource;
      href: string;
      cloudRow?: CloudPizzaSessionRow;
    };

function sessionTimestamp(session: Pick<PizzaSession, "updatedAt"> | undefined | null) {
  if (!session?.updatedAt) return undefined;
  const time = new Date(session.updatedAt).getTime();
  return Number.isFinite(time) ? time : undefined;
}

function activeSession(session: PizzaSession | undefined | null) {
  if (!session) return undefined;
  return session.status === "completed" || session.status === "archived" ? undefined : session;
}

export function deriveActiveSessionResumeRoute(session: PizzaSession) {
  return pizzaSessionContinueHref(session);
}

export function resolveHomepageActiveSession(
  localSession: PizzaSession | undefined | null,
  cloudRow: CloudPizzaSessionRow | undefined | null,
): ActiveSessionResumeDecision {
  const local = activeSession(localSession);
  const cloud = cloudRow ? activeSession(migratePizzaSession(cloudRow.session_data)) : undefined;

  if (!local && !cloud) {
    return {
      state: "empty",
      session: null,
      source: null,
      href: "/session/start",
    };
  }

  if (!local && cloud) {
    return {
      state: "active",
      session: cloud,
      source: "cloud",
      href: deriveActiveSessionResumeRoute(cloud),
      cloudRow: cloudRow ?? undefined,
    };
  }

  if (local && !cloud) {
    return {
      state: "active",
      session: local,
      source: "local",
      href: deriveActiveSessionResumeRoute(local),
    };
  }

  const localTime = sessionTimestamp(local);
  const cloudTime = sessionTimestamp(cloud);
  const useCloud = cloud
    && (localTime === undefined || (cloudTime !== undefined && cloudTime > localTime));
  const session = useCloud ? cloud : local!;

  return {
    state: "active",
    session,
    source: useCloud ? "cloud" : "local",
    href: deriveActiveSessionResumeRoute(session),
    cloudRow: useCloud ? cloudRow ?? undefined : undefined,
  };
}
