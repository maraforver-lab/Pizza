import {
  clearCloudBackedActivePizzaSessionPointer,
  isCloudBackedPizzaSession,
  markCloudBackedPizzaSession,
} from "@/lib/cloud-pizza-session-client";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import {
  normalizeCloudPizzaSessionRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import {
  migratePizzaSession,
  pizzaSessionContinueHref,
  type PizzaSession,
} from "@/lib/pizza-session";
import { getActivePizzaSession } from "@/lib/pizza-session-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Fetcher = typeof fetch;

export type CanonicalActivePizzaSessionSource =
  | "local"
  | "cloud"
  | "local-cache"
  | "promoted-local";

export type CanonicalActivePizzaSessionResolution =
  | {
      state: "empty";
      signedIn: boolean;
      source: "none";
      session: null;
      cloudRow: null;
      href: "/session/start";
    }
  | {
      state: "active";
      signedIn: boolean;
      source: CanonicalActivePizzaSessionSource;
      session: PizzaSession;
      cloudRow: CloudPizzaSessionRow | null;
      href: string;
    }
  | {
      state: "error";
      signedIn: boolean;
      source: "error";
      session: PizzaSession | null;
      cloudRow: CloudPizzaSessionRow | null;
      href: string;
      error: string;
    };

type ResolveCanonicalActivePizzaSessionOptions = {
  fetcher?: Fetcher;
  getSignedInUser?: () => Promise<boolean>;
  storage?: StorageLike;
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not resolve the active pizza session.";
}

async function defaultSignedInUser() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

async function fetchActiveCloudPizzaSession(fetcher: Fetcher) {
  const response = await fetcher("/api/pizza-sessions/active", { method: "GET" });
  if (response.status === 401) return { signedOut: true as const, row: null };
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not load the active account pizza session.");
  return {
    signedOut: false as const,
    row: normalizeCloudPizzaSessionRow(payload.session) ?? null,
  };
}

async function promoteLocalPizzaSessionToCloud(session: PizzaSession, fetcher: Fetcher) {
  const response = await fetcher("/api/pizza-sessions/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionData: session }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not save the active pizza session to your account.");
  const row = normalizeCloudPizzaSessionRow(payload.session);
  if (!row) throw new Error("Saved pizza session could not be verified.");
  return row;
}

export function deriveActiveSessionResumeRoute(session: PizzaSession) {
  return pizzaSessionContinueHref(session);
}

export function chooseCanonicalActivePizzaSession(
  localSession: PizzaSession | undefined | null,
  cloudRow: CloudPizzaSessionRow | undefined | null,
  signedIn: boolean,
) {
  const local = activeSession(localSession);
  const cloud = cloudRow ? activeSession(migratePizzaSession(cloudRow.session_data)) : undefined;

  if (!signedIn) {
    return local
      ? { state: "active" as const, source: "local" as const, session: local, cloudRow: null }
      : { state: "empty" as const, source: "none" as const, session: null, cloudRow: null };
  }

  if (!cloud) {
    return local
      ? { state: "promote" as const, source: "local" as const, session: local, cloudRow: null }
      : { state: "empty" as const, source: "none" as const, session: null, cloudRow: null };
  }

  if (local?.id === cloud.id) {
    const localTime = sessionTimestamp(local);
    const cloudTime = sessionTimestamp(cloud);
    if (localTime !== undefined && cloudTime !== undefined && localTime > cloudTime) {
      return { state: "active" as const, source: "local-cache" as const, session: local, cloudRow };
    }
  }

  return { state: "active" as const, source: "cloud" as const, session: cloud, cloudRow };
}

export async function resolveCanonicalActivePizzaSession(
  options: ResolveCanonicalActivePizzaSessionOptions = {},
): Promise<CanonicalActivePizzaSessionResolution> {
  const storage = options.storage;
  const fetcher = options.fetcher ?? fetch;
  const getSignedInUser = options.getSignedInUser ?? defaultSignedInUser;
  const localSession = getActivePizzaSession(storage) ?? null;

  let signedIn = false;
  try {
    signedIn = await getSignedInUser();
  } catch {
    signedIn = false;
  }

  if (!signedIn) {
    const decision = chooseCanonicalActivePizzaSession(localSession, null, false);
    if (decision.state === "active") {
      return {
        state: "active",
        signedIn: false,
        source: "local",
        session: decision.session,
        cloudRow: null,
        href: deriveActiveSessionResumeRoute(decision.session),
      };
    }
    return {
      state: "empty",
      signedIn: false,
      source: "none",
      session: null,
      cloudRow: null,
      href: "/session/start",
    };
  }

  try {
    const cloudLookup = await fetchActiveCloudPizzaSession(fetcher);
    if (cloudLookup.signedOut) {
      const decision = chooseCanonicalActivePizzaSession(localSession, null, false);
      if (decision.state === "active") {
        return {
          state: "active",
          signedIn: false,
          source: "local",
          session: decision.session,
          cloudRow: null,
          href: deriveActiveSessionResumeRoute(decision.session),
        };
      }
      return {
        state: "empty",
        signedIn: false,
        source: "none",
        session: null,
        cloudRow: null,
        href: "/session/start",
      };
    }

    const decision = chooseCanonicalActivePizzaSession(localSession, cloudLookup.row, true);
    if (decision.state === "empty") {
      return {
        state: "empty",
        signedIn: true,
        source: "none",
        session: null,
        cloudRow: null,
        href: "/session/start",
      };
    }

    if (decision.state === "promote") {
      if (isCloudBackedPizzaSession(decision.session, storage)) {
        clearCloudBackedActivePizzaSessionPointer(storage);
        return {
          state: "empty",
          signedIn: true,
          source: "none",
          session: null,
          cloudRow: null,
          href: "/session/start",
        };
      }

      const promotedRow = await promoteLocalPizzaSessionToCloud(decision.session, fetcher).catch(async (error) => {
        const latest = await fetchActiveCloudPizzaSession(fetcher).catch(() => ({ row: null }));
        if (latest.row) return latest.row;
        throw error;
      });
      const restored = restoreCloudPizzaSessionToLocal(promotedRow, storage) ?? migratePizzaSession(promotedRow.session_data);
      if (!restored) throw new Error("Promoted pizza session could not be restored.");
      return {
        state: "active",
        signedIn: true,
        source: "promoted-local",
        session: restored,
        cloudRow: promotedRow,
        href: deriveActiveSessionResumeRoute(restored),
      };
    }

    if (decision.source === "local-cache" && decision.cloudRow) {
      markCloudBackedPizzaSession(decision.session.id, decision.cloudRow.id, storage);
      return {
        state: "active",
        signedIn: true,
        source: "local-cache",
        session: decision.session,
        cloudRow: decision.cloudRow,
        href: deriveActiveSessionResumeRoute(decision.session),
      };
    }

    if (!decision.cloudRow) throw new Error("Active cloud pizza session could not be verified.");
    const restored = restoreCloudPizzaSessionToLocal(decision.cloudRow, storage) ?? decision.session;
    return {
      state: "active",
      signedIn: true,
      source: "cloud",
      session: restored,
      cloudRow: decision.cloudRow,
      href: deriveActiveSessionResumeRoute(restored),
    };
  } catch (error) {
    return {
      state: "error",
      signedIn: true,
      source: "error",
      session: localSession,
      cloudRow: null,
      href: localSession ? deriveActiveSessionResumeRoute(localSession) : "/session/start",
      error: errorMessage(error),
    };
  }
}
