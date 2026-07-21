import {
  BAKE_TIMER_SOUND_THEME_IDS,
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  DEFAULT_BAKE_TIMER_SOUND_CONFIGURATION,
  isBakeTimerSoundThemeId,
  normalizeBakeTimerSoundConfiguration,
  publicBakeTimerSoundThemeDefinitions,
  resolveEffectiveBakeTimerSoundTheme,
  type BakeTimerSoundConfiguration,
  type BakeTimerSoundThemeId,
} from "@/lib/bake-timer-sound-themes";

export type BakeTimerSoundSettingsRow = {
  theme_id?: unknown;
  enabled?: unknown;
  is_default?: unknown;
  updated_at?: unknown;
  version?: unknown;
};

export type BakeTimerSoundSettingsResponse = {
  themes: ReturnType<typeof publicBakeTimerSoundThemeDefinitions>;
  enabledThemeIds: BakeTimerSoundThemeId[];
  defaultThemeId: BakeTimerSoundThemeId;
  effectiveThemeId?: BakeTimerSoundThemeId;
  version: number;
};

export function normalizeBakeTimerSoundSettingsRows(rows: unknown): BakeTimerSoundConfiguration & { version: number } {
  const list = Array.isArray(rows) ? rows as BakeTimerSoundSettingsRow[] : [];
  const enabledThemeIds = list
    .filter((row) => row.enabled === true && isBakeTimerSoundThemeId(row.theme_id))
    .map((row) => row.theme_id as BakeTimerSoundThemeId);
  const defaultRow = list.find((row) => row.is_default === true && row.enabled === true && isBakeTimerSoundThemeId(row.theme_id));
  const version = Math.max(1, ...list.map((row) => (typeof row.version === "number" ? row.version : 1)));

  return {
    ...normalizeBakeTimerSoundConfiguration({
      enabledThemeIds,
      defaultThemeId: defaultRow?.theme_id,
    }),
    version,
  };
}

export function parseBakeTimerSoundSettingsPayload(value: unknown):
  | { ok: true; payload: { enabledThemeIds: BakeTimerSoundThemeId[]; defaultThemeId: BakeTimerSoundThemeId; expectedVersion: number } }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Invalid Bake Timer sound settings payload." };
  }

  const record = value as Record<string, unknown>;
  const allowed = new Set(["enabledThemeIds", "defaultThemeId", "expectedVersion"]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    return { ok: false, error: "Bake Timer sound settings payload contains unsupported fields." };
  }

  if (!Array.isArray(record.enabledThemeIds)) {
    return { ok: false, error: "Select at least one Bake Timer sound theme." };
  }

  const enabledThemeIds = [...new Set(record.enabledThemeIds)];
  if (enabledThemeIds.length === 0 || !enabledThemeIds.every(isBakeTimerSoundThemeId)) {
    return { ok: false, error: "Unknown Bake Timer sound theme." };
  }

  if (!enabledThemeIds.includes(CLASSIC_BAKE_TIMER_SOUND_THEME_ID)) {
    return { ok: false, error: "Classic must remain available as the safe fallback." };
  }

  if (!isBakeTimerSoundThemeId(record.defaultThemeId)) {
    return { ok: false, error: "Unknown default Bake Timer sound theme." };
  }

  if (!enabledThemeIds.includes(record.defaultThemeId)) {
    return { ok: false, error: "The default Bake Timer sound theme must be enabled." };
  }

  if (!Number.isInteger(record.expectedVersion) || Number(record.expectedVersion) < 1) {
    return { ok: false, error: "Invalid Bake Timer sound settings version." };
  }

  return {
    ok: true,
    payload: {
      enabledThemeIds: enabledThemeIds as BakeTimerSoundThemeId[],
      defaultThemeId: record.defaultThemeId,
      expectedVersion: Number(record.expectedVersion),
    },
  };
}

export function bakeTimerSoundSettingsResponse(
  rows: unknown,
  userPreference?: unknown,
): BakeTimerSoundSettingsResponse {
  const configuration = normalizeBakeTimerSoundSettingsRows(rows);
  return {
    themes: publicBakeTimerSoundThemeDefinitions(),
    enabledThemeIds: configuration.enabledThemeIds,
    defaultThemeId: configuration.defaultThemeId,
    effectiveThemeId: userPreference === undefined
      ? undefined
      : resolveEffectiveBakeTimerSoundTheme({ userPreference, configuration }),
    version: configuration.version,
  };
}

export function defaultBakeTimerSoundSettingsResponse(userPreference?: unknown): BakeTimerSoundSettingsResponse {
  return {
    themes: publicBakeTimerSoundThemeDefinitions(),
    enabledThemeIds: [...DEFAULT_BAKE_TIMER_SOUND_CONFIGURATION.enabledThemeIds],
    defaultThemeId: DEFAULT_BAKE_TIMER_SOUND_CONFIGURATION.defaultThemeId,
    effectiveThemeId: userPreference === undefined
      ? undefined
      : resolveEffectiveBakeTimerSoundTheme({
        userPreference,
        configuration: DEFAULT_BAKE_TIMER_SOUND_CONFIGURATION,
      }),
    version: 1,
  };
}

export function safeBakeTimerSoundSettingsError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  if (/bake_timer_sound_settings_stale/i.test(message)) return { error: "Bake Timer sound settings changed on another device. Reload and try again.", stale: true, status: 409 };
  if (/bake_timer_sound_theme_invalid|check constraint|invalid input syntax/i.test(message)) return { error: "Invalid Bake Timer sound settings.", status: 400 };
  return { error: "Bake Timer sound settings could not be saved.", status: 500 };
}

export function allBakeTimerSoundThemeIdsForSql() {
  return [...BAKE_TIMER_SOUND_THEME_IDS];
}
