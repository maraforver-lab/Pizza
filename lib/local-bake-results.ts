import {
  createBakeResult,
  deserializeBakeResult,
  migrateBakeResult,
  serializeBakeResult,
  type BakeResult,
} from "@/lib/bake-result";

export const BAKE_RESULTS_STORAGE_KEY = "doughtools:bake-results";
export const BAKE_RESULTS_LOCAL_ONLY_COPY = "Saved bakes are stored locally on this device for now.";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

function parseBakeResults(value: string | null): BakeResult[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = migrateBakeResult(item);
      return result && result.visibility === "private" ? [result] : [];
    });
  } catch {
    return [];
  }
}

export function loadLocalBakeResults(storage?: StorageLike): BakeResult[] {
  const target = getBrowserStorage(storage);
  if (!target) return [];
  return parseBakeResults(target.getItem(BAKE_RESULTS_STORAGE_KEY))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function storeLocalBakeResults(results: readonly BakeResult[], storage?: StorageLike) {
  const target = getBrowserStorage(storage);
  if (!target) return;
  const privateResults = results
    .flatMap((result) => {
      const migrated = migrateBakeResult(result);
      return migrated && migrated.visibility === "private" ? [migrated] : [];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  target.setItem(BAKE_RESULTS_STORAGE_KEY, JSON.stringify(privateResults));
}

export function addLocalBakeResult(result: BakeResult, storage?: StorageLike): BakeResult[] {
  const safeResult = createBakeResult({ ...result, visibility: "private" });
  const nextResults = [safeResult, ...loadLocalBakeResults(storage)]
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
  storeLocalBakeResults(nextResults, storage);
  return nextResults;
}

export function deleteLocalBakeResult(id: string, storage?: StorageLike): BakeResult[] {
  const nextResults = loadLocalBakeResults(storage).filter((result) => result.id !== id);
  storeLocalBakeResults(nextResults, storage);
  return nextResults;
}

export function clearLocalBakeResults(storage?: StorageLike) {
  const target = getBrowserStorage(storage);
  target?.removeItem(BAKE_RESULTS_STORAGE_KEY);
}

export function exportLocalBakeResult(result: BakeResult) {
  return serializeBakeResult(createBakeResult({ ...result, visibility: "private" }));
}

export function importLocalBakeResult(value: string) {
  const result = deserializeBakeResult(value);
  return result && result.visibility === "private" ? result : undefined;
}
