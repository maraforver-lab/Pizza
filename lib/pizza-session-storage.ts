import {
  createPizzaSession,
  migratePizzaSession,
  type PizzaSession,
} from "@/lib/pizza-session";

export const PIZZA_SESSIONS_STORAGE_KEY = "doughtools:pizza-sessions-v1";
export const ACTIVE_PIZZA_SESSION_STORAGE_KEY = "doughtools:active-pizza-session-id";
export const PIZZA_SESSION_LOCAL_ONLY_COPY = "Pizza sessions are currently saved in this browser on this device.";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function parseSessions(value: string | null): PizzaSession[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const session = migratePizzaSession(item);
      return session ? [session] : [];
    });
  } catch {
    return [];
  }
}

function sortSessions(sessions: PizzaSession[]) {
  return [...sessions].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPizzaSessions(storage?: StorageLike): PizzaSession[] {
  const target = getBrowserStorage(storage);
  if (!target) return [];
  return sortSessions(parseSessions(target.getItem(PIZZA_SESSIONS_STORAGE_KEY)));
}

function writePizzaSessions(sessions: PizzaSession[], storage?: StorageLike) {
  const target = getBrowserStorage(storage);
  if (!target) return;
  target.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify(sortSessions(sessions)));
}

export function savePizzaSession(session: PizzaSession, storage?: StorageLike, now = new Date()): PizzaSession {
  const savedAt = now.toISOString();
  const safeSession = createPizzaSession({
    ...session,
    updatedAt: savedAt,
    lastSavedAt: savedAt,
    createdAt: session.createdAt,
    id: session.id,
  }, now);
  const sessions = getPizzaSessions(storage);
  const nextSessions = [safeSession, ...sessions.filter((item) => item.id !== safeSession.id)];
  writePizzaSessions(nextSessions, storage);
  return safeSession;
}

export function createAndSavePizzaSession(input: Parameters<typeof createPizzaSession>[0] = {}, storage?: StorageLike, now = new Date()): PizzaSession {
  return savePizzaSession(createPizzaSession(input, now), storage, now);
}

export function getPizzaSession(id: string, storage?: StorageLike): PizzaSession | undefined {
  return getPizzaSessions(storage).find((session) => session.id === id);
}

export function setActivePizzaSession(id: string, storage?: StorageLike) {
  const target = getBrowserStorage(storage);
  if (!target) return;
  if (getPizzaSession(id, storage)) target.setItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY, id);
}

export function getActivePizzaSession(storage?: StorageLike): PizzaSession | undefined {
  const target = getBrowserStorage(storage);
  if (!target) return undefined;
  const id = target.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY);
  if (!id) return undefined;
  const session = getPizzaSession(id, storage);
  return session && session.status !== "archived" && session.status !== "completed" ? session : undefined;
}

export function clearActivePizzaSession(storage?: StorageLike) {
  getBrowserStorage(storage)?.removeItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY);
}

export function updatePizzaSession(
  id: string,
  patch: Partial<Omit<PizzaSession, "id" | "schemaVersion" | "createdAt">>,
  storage?: StorageLike,
  now = new Date(),
): PizzaSession | undefined {
  const existing = getPizzaSession(id, storage);
  if (!existing) return undefined;
  return savePizzaSession({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt }, storage, now);
}

export function archivePizzaSession(id: string, storage?: StorageLike, now = new Date()) {
  return updatePizzaSession(id, { status: "archived" }, storage, now);
}

export function completePizzaSession(id: string, storage?: StorageLike, now = new Date()) {
  return updatePizzaSession(id, { status: "completed", currentStep: "review" }, storage, now);
}

