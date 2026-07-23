"use client";

const DOUGHTOOLS_LOCAL_STORAGE_KEYS = [
  "doughtools-currency",
  "doughtools-saved-recipes-v1",
  "doughtools.quick-calculator.recipes.v1",
  "doughtools.experienceLevel",
  "doughtools:bake-results",
  "doughtools:pizza-sessions-v1",
  "doughtools:active-pizza-session-id",
  "doughtools:cloud-backed-pizza-session-id",
  "doughtools.bake-timer.sound-enabled.v1",
];

const DOUGHTOOLS_SESSION_STORAGE_KEYS = [
  "doughtools:dough-plan-auto-saved-snapshot-key",
];

const DOUGHTOOLS_LOCAL_STORAGE_PREFIXES = [
  "doughtools.kitchen-bake-timer.v1:",
];

function removeKnownKeys(storage: Storage | undefined, keys: string[]) {
  if (!storage) return;
  for (const key of keys) storage.removeItem(key);
}

function removeKnownPrefixes(storage: Storage | undefined, prefixes: string[]) {
  if (!storage) return;
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
}

export function clearDoughToolsOwnedLocalData() {
  if (typeof window === "undefined") return;
  removeKnownKeys(window.localStorage, DOUGHTOOLS_LOCAL_STORAGE_KEYS);
  removeKnownPrefixes(window.localStorage, DOUGHTOOLS_LOCAL_STORAGE_PREFIXES);
  removeKnownKeys(window.sessionStorage, DOUGHTOOLS_SESSION_STORAGE_KEYS);
}
