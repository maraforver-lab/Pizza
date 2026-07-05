import type { PizzaSession } from "@/lib/pizza-session";

export const CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY = "doughtools:cloud-backed-pizza-session-id";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function markCloudBackedPizzaSession(sessionId: string, storage?: StorageLike) {
  getBrowserStorage(storage)?.setItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY, sessionId);
}

export function clearCloudBackedPizzaSession(storage?: StorageLike) {
  getBrowserStorage(storage)?.removeItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY);
}

export function isCloudBackedPizzaSession(session: Pick<PizzaSession, "id"> | undefined | null, storage?: StorageLike) {
  if (!session?.id) return false;
  return getBrowserStorage(storage)?.getItem(CLOUD_BACKED_PIZZA_SESSION_STORAGE_KEY) === session.id;
}

export async function syncCloudBackedPizzaSession(
  session: PizzaSession,
  options: { complete?: boolean } = {},
) {
  if (!isCloudBackedPizzaSession(session)) return { skipped: true };

  const response = await fetch("/api/pizza-sessions/active", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionData: session, complete: options.complete === true }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Cloud session sync failed.");
  if (options.complete) clearCloudBackedPizzaSession();
  return payload;
}

export async function completeCloudBackedPizzaSession(session: PizzaSession) {
  return syncCloudBackedPizzaSession({
    ...session,
    status: "completed",
    currentStep: "review",
  }, { complete: true });
}
