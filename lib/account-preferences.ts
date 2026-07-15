export type AccountPreferences = {
  allowEarlyTimedStepCompletion: boolean;
  updatedAt?: string;
};

export const ACCOUNT_PREFERENCES_SELECT = "user_id,allow_early_timed_step_completion,created_at,updated_at";

export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  allowEarlyTimedStepCompletion: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: Record<string, unknown>, key: string) {
  const raw = value[key];
  return typeof raw === "string" && raw.trim() ? raw : undefined;
}

function booleanField(value: Record<string, unknown>, key: string) {
  return typeof value[key] === "boolean" ? value[key] : undefined;
}

export function normalizeAccountPreferencesRow(value: unknown): AccountPreferences {
  if (!isRecord(value)) return DEFAULT_ACCOUNT_PREFERENCES;
  return {
    allowEarlyTimedStepCompletion: booleanField(value, "allow_early_timed_step_completion")
      ?? booleanField(value, "allowEarlyTimedStepCompletion")
      ?? false,
    updatedAt: stringField(value, "updated_at") ?? stringField(value, "updatedAt"),
  };
}

export function accountPreferencesPayload(preferences: Pick<AccountPreferences, "allowEarlyTimedStepCompletion">) {
  return {
    allow_early_timed_step_completion: preferences.allowEarlyTimedStepCompletion === true,
  };
}

function timestamp(value?: string) {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : undefined;
}

export function accountPreferencesAreNewer(existingUpdatedAt?: string, knownUpdatedAt?: string) {
  const existingTime = timestamp(existingUpdatedAt);
  const knownTime = timestamp(knownUpdatedAt);
  return existingTime !== undefined && knownTime !== undefined && existingTime > knownTime;
}
