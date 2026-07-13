import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  archivePizzaSession,
  clearActivePizzaSession,
  getActivePizzaSession,
} from "@/lib/pizza-session-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY = "doughtools:cloud-backed-pizza-session-id";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type CloudBackedPizzaSessionMarker = {
  sessionId: string;
  cloudSessionId?: string;
};

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

export function clearCloudBackedActivePizzaSessionPointer(storage?: StorageLike) {
  const localSession = getActivePizzaSession(storage);
  if (localSession && isCloudBackedPizzaSession(localSession, storage)) {
    archivePizzaSession(localSession.id, storage);
    clearActivePizzaSession(storage);
  }
  clearCloudBackedPizzaSession(storage);
}

export async function saveCloudActivePizzaSession(session: PizzaSession) {
  let hasSignedInUser = false;
  try {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    hasSignedInUser = Boolean(data.session?.user);
  } catch {
    hasSignedInUser = false;
  }

  if (!hasSignedInUser) return { skipped: true, reason: "unauthenticated" as const };

  const response = await fetch("/api/pizza-sessions/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionData: session }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Cloud session save failed.");
  const savedSession = normalizeCloudPizzaSessionRow(payload.session);
  if (!savedSession) throw new Error("Saved pizza session could not be verified.");
  markCloudBackedPizzaSession(session.id, savedSession.id);
  return { session: savedSession };
}

export async function syncCloudBackedPizzaSession(
  session: PizzaSession,
  options: { complete?: boolean } = {},
) {
  if (!isCloudBackedPizzaSession(session)) {
    if (options.complete) return { skipped: true };
    return saveCloudActivePizzaSession(session);
  }
  const cloudSessionId = cloudBackedPizzaSessionRowId(session);

  const response = await fetch("/api/pizza-sessions/active", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionData: session,
      complete: options.complete === true,
      cloudSessionId,
    }),
  });
  const payload = await response.json().catch(() => ({}));
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
  options: { complete?: boolean };
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
  options: { complete?: boolean } = {},
) {
  const key = `${cloudActivePizzaSessionSaveKey(session)}:${options.complete === true ? "complete" : "active"}`;

  return new Promise<Awaited<ReturnType<typeof syncCloudBackedPizzaSession>>>((resolve, reject) => {
    if (queuedCloudSave?.key === key) {
      queuedCloudSave.resolve.push(resolve);
      queuedCloudSave.reject.push(reject);
    } else {
      queuedCloudSave = {
        key,
        options,
        reject: queuedCloudSave ? [...queuedCloudSave.reject, reject] : [reject],
        resolve: queuedCloudSave ? [...queuedCloudSave.resolve, resolve] : [resolve],
        session,
      };
    }

    startCloudSaveDrain();
  });
}
