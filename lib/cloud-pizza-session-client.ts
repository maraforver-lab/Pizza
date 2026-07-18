import {
  normalizeCloudPizzaSessionRow,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  clearActivePizzaSession,
  getActivePizzaSession,
  removePizzaSession,
} from "@/lib/pizza-session-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY = "doughtools:cloud-backed-pizza-session-id";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type CloudSyncOptions = {
  complete?: boolean;
  expectedActiveCloudRowId?: string;
  expectedActiveSessionId?: string;
  replaceActiveSession?: boolean;
};

type QueueCloudSyncOptions = CloudSyncOptions & {
  storage?: StorageLike;
};

type CloudBackedPizzaSessionMarker = {
  sessionId: string;
  cloudSessionId?: string;
};

export type CloudActivePizzaSessionAuthState = {
  headers: Headers;
  signedIn: boolean;
};

export type ActiveCloudPizzaSessionConflict = {
  activeCloudRowId?: string;
  activeSessionId?: string;
  cloudRowId?: string;
  cloudSessionId?: string;
  localSessionId?: string;
  message: string;
  resumeRoute?: string;
};

export class ActiveCloudPizzaSessionConflictError extends Error {
  conflict: ActiveCloudPizzaSessionConflict;

  constructor(conflict: ActiveCloudPizzaSessionConflict) {
    super(conflict.message);
    this.name = "ActiveCloudPizzaSessionConflictError";
    this.conflict = conflict;
  }
}

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function activeCloudPizzaSessionConflictFromPayload(payload: unknown): ActiveCloudPizzaSessionConflict | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as Record<string, unknown>;
  if (record.error !== "active_session_exists" && record.conflict !== true) return undefined;
  return {
    activeCloudRowId: stringField(record, "activeCloudRowId"),
    activeSessionId: stringField(record, "activeSessionId"),
    cloudRowId: stringField(record, "cloudRowId"),
    cloudSessionId: stringField(record, "cloudSessionId"),
    localSessionId: stringField(record, "localSessionId"),
    message: stringField(record, "message") ?? "A different active pizza session is already saved to this account.",
    resumeRoute: stringField(record, "resumeRoute"),
  };
}

export function isActiveCloudPizzaSessionConflictError(error: unknown): error is ActiveCloudPizzaSessionConflictError {
  return error instanceof ActiveCloudPizzaSessionConflictError;
}

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function readCloudBackedPizzaSessionMarker(storage?: StorageLike): CloudBackedPizzaSessionMarker | undefined {
  const value = getBrowserStorage(storage)?.getItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY);
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && "sessionId" in parsed) {
      const marker = parsed as Record<string, unknown>;
      const sessionId = typeof marker.sessionId === "string" ? marker.sessionId : undefined;
      if (!sessionId) return undefined;
      const cloudSessionId = typeof marker.cloudSessionId === "string" ? marker.cloudSessionId : undefined;
      return { sessionId, cloudSessionId };
    }
  } catch {
    // Legacy marker values stored the local session id as a raw string.
  }

  return { sessionId: value };
}

export function markCloudBackedPizzaSession(
  sessionId: string,
  cloudSessionIdOrStorage?: string | StorageLike,
  storage?: StorageLike,
) {
  const cloudSessionId = typeof cloudSessionIdOrStorage === "string" ? cloudSessionIdOrStorage : undefined;
  const targetStorage = typeof cloudSessionIdOrStorage === "string" ? storage : cloudSessionIdOrStorage;
  const marker: CloudBackedPizzaSessionMarker = cloudSessionId
    ? { sessionId, cloudSessionId }
    : { sessionId };
  getBrowserStorage(targetStorage)?.setItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY, JSON.stringify(marker));
}

export function clearCloudBackedPizzaSession(storage?: StorageLike) {
  getBrowserStorage(storage)?.removeItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY);
}

export function isCloudBackedPizzaSession(session: Pick<PizzaSession, "id"> | undefined | null, storage?: StorageLike) {
  if (!session?.id) return false;
  return readCloudBackedPizzaSessionMarker(storage)?.sessionId === session.id;
}

export function cloudBackedPizzaSessionRowId(
  session: Pick<PizzaSession, "id"> | undefined | null,
  storage?: StorageLike,
) {
  if (!session?.id) return undefined;
  const marker = readCloudBackedPizzaSessionMarker(storage);
  return marker?.sessionId === session.id ? marker.cloudSessionId : undefined;
}

function cloudActivePizzaSessionSaveKey(session: PizzaSession) {
  return [
    session.id,
    session.currentStep,
    session.status,
    session.lastRoute,
    session.updatedAt,
    session.lastSavedAt,
  ].join(":");
}

export async function getCloudActivePizzaSessionAuthState(options: { json?: boolean } = {}): Promise<CloudActivePizzaSessionAuthState> {
  const headers = new Headers();
  if (options.json) headers.set("Content-Type", "application/json");

  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return {
      headers,
      signedIn: Boolean(data.session?.user),
    };
  } catch {
    return {
      headers,
      signedIn: false,
    };
  }
}

export async function cloudActivePizzaSessionRequestHeaders(options: { json?: boolean } = {}) {
  const { headers } = await getCloudActivePizzaSessionAuthState(options);
  return headers;
}

function pizzaSessionTimestamp(value?: string) {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : undefined;
}

export function latestActivePizzaSessionForCloudSync(
  session: PizzaSession,
  storage?: StorageLike,
) {
  const activeSession = getActivePizzaSession(storage);
  if (!activeSession || activeSession.id !== session.id) return session;
  const activeTime = pizzaSessionTimestamp(activeSession.updatedAt);
  const incomingTime = pizzaSessionTimestamp(session.updatedAt);
  if (activeTime === undefined || incomingTime === undefined) return activeSession;
  return activeTime >= incomingTime ? activeSession : session;
}

export function clearCloudBackedActivePizzaSessionPointer(storage?: StorageLike) {
  const localSession = getActivePizzaSession(storage);
  if (localSession && isCloudBackedPizzaSession(localSession, storage)) {
    removePizzaSession(localSession.id, storage);
    clearActivePizzaSession(storage);
  }
  clearCloudBackedPizzaSession(storage);
}

export async function saveCloudActivePizzaSession(session: PizzaSession, options: CloudSyncOptions = {}) {
  const auth = await getCloudActivePizzaSessionAuthState({ json: true });
  if (!auth.signedIn) return { skipped: true, reason: "unauthenticated" as const };
  const replaceActiveSession = options.replaceActiveSession === true;

  const response = await fetch("/api/pizza-sessions/active", {
    method: "POST",
    headers: auth.headers,
    body: JSON.stringify({
      expectedActiveCloudRowId: options.expectedActiveCloudRowId,
      expectedActiveSessionId: options.expectedActiveSessionId,
      operation: replaceActiveSession ? "replace_active" : "save_active",
      sessionData: session,
      replaceActiveSession,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const conflict = response.status === 409 ? activeCloudPizzaSessionConflictFromPayload(payload) : undefined;
  if (conflict) throw new ActiveCloudPizzaSessionConflictError(conflict);
  if (!response.ok) throw new Error(payload.error || "Cloud session save failed.");
  const savedSession = normalizeCloudPizzaSessionRow(payload.session);
  if (!savedSession) throw new Error("Saved pizza session could not be verified.");
  markCloudBackedPizzaSession(session.id, savedSession.id);
  return { session: savedSession };
}

export async function syncCloudBackedPizzaSession(
  session: PizzaSession,
  options: CloudSyncOptions = {},
) {
  if (!isCloudBackedPizzaSession(session)) {
    if (options.complete) return { skipped: true };
    return saveCloudActivePizzaSession(session, options);
  }
  if (options.replaceActiveSession) return saveCloudActivePizzaSession(session, options);
  const cloudSessionId = cloudBackedPizzaSessionRowId(session);
  const headers = await cloudActivePizzaSessionRequestHeaders({ json: true });

  const response = await fetch("/api/pizza-sessions/active", {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      sessionData: session,
      complete: options.complete === true,
      cloudSessionId,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  const conflict = response.status === 409 ? activeCloudPizzaSessionConflictFromPayload(payload) : undefined;
  if (conflict) throw new ActiveCloudPizzaSessionConflictError(conflict);
  if (!response.ok) throw new Error(payload.error || "Cloud session sync failed.");
  if (options.complete) clearCloudBackedPizzaSession();
  const syncedSession = normalizeCloudPizzaSessionRow(payload.session);
  if (syncedSession) markCloudBackedPizzaSession(session.id, syncedSession.id);
  return payload;
}

export async function completeCloudBackedPizzaSession(session: PizzaSession) {
  return syncCloudBackedPizzaSession({
    ...session,
    status: "completed",
    currentStep: "review",
  }, { complete: true });
}

type QueuedCloudSave = {
  key: string;
  options: CloudSyncOptions;
  reject: Array<(error: unknown) => void>;
  resolve: Array<(value: Awaited<ReturnType<typeof syncCloudBackedPizzaSession>>) => void>;
  session: PizzaSession;
};

let queuedCloudSave: QueuedCloudSave | undefined;
let activeCloudSave: Promise<void> | undefined;

async function drainCloudSaveQueue() {
  while (queuedCloudSave) {
    const current = queuedCloudSave;
    queuedCloudSave = undefined;
    try {
      const result = await syncCloudBackedPizzaSession(current.session, current.options);
      current.resolve.forEach((resolve) => resolve(result));
    } catch (error) {
      current.reject.forEach((reject) => reject(error));
    }
  }
}

function startCloudSaveDrain() {
  if (activeCloudSave) return;
  activeCloudSave = drainCloudSaveQueue().finally(() => {
    activeCloudSave = undefined;
    if (queuedCloudSave) startCloudSaveDrain();
  });
}

export function queueCloudActivePizzaSessionSave(
  session: PizzaSession,
  options: QueueCloudSyncOptions = {},
) {
  const { storage, ...syncOptions } = options;
  const replaceActiveSession = syncOptions.replaceActiveSession === true;
  const sessionForSync = syncOptions.complete === true
    ? session
    : latestActivePizzaSessionForCloudSync(session, storage);
  const key = `${cloudActivePizzaSessionSaveKey(sessionForSync)}:${syncOptions.complete === true ? "complete" : "active"}`;
  const queueKey = `${key}:${replaceActiveSession ? "replace-active" : "normal"}`;

  return new Promise<Awaited<ReturnType<typeof syncCloudBackedPizzaSession>>>((resolve, reject) => {
    if (queuedCloudSave?.key === queueKey) {
      queuedCloudSave.resolve.push(resolve);
      queuedCloudSave.reject.push(reject);
    } else {
      queuedCloudSave = {
        key: queueKey,
        options: { ...syncOptions, replaceActiveSession },
        reject: queuedCloudSave ? [...queuedCloudSave.reject, reject] : [reject],
        resolve: queuedCloudSave ? [...queuedCloudSave.resolve, resolve] : [resolve],
        session: sessionForSync,
      };
    }

    startCloudSaveDrain();
  });
}

export async function materializeCloudBackedPizzaSession(
  session: PizzaSession,
  options: QueueCloudSyncOptions = {},
): Promise<
  | { status: "cloud-backed"; session: CloudPizzaSessionRow }
  | { status: "local-only"; reason: "unauthenticated" }
> {
  const result = await queueCloudActivePizzaSessionSave(session, options);
  if ("skipped" in result && "reason" in result && result.reason === "unauthenticated") {
    return { status: "local-only", reason: "unauthenticated" };
  }

  const cloudSession = normalizeCloudPizzaSessionRow("session" in result ? result.session : null);
  if (!cloudSession) {
    throw new Error("Saved pizza session could not be verified in your account.");
  }

  return { status: "cloud-backed", session: cloudSession };
}
