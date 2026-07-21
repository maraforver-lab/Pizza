import type { BakeTimerSoundCue } from "@/lib/bake-timer";

export const CLASSIC_BAKE_TIMER_SOUND_THEME_ID = "classic";

export const BAKE_TIMER_SOUND_THEME_IDS = [
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  "bell",
  "rooster",
  "halloween",
] as const;

export type BakeTimerSoundThemeId = (typeof BAKE_TIMER_SOUND_THEME_IDS)[number];

export const DEFERRED_BAKE_TIMER_SOUND_THEME_IDS = [
  "dark-commander",
  "robot-chef",
] as const;

export type DeferredBakeTimerSoundThemeId = (typeof DEFERRED_BAKE_TIMER_SOUND_THEME_IDS)[number];

export const BAKE_TIMER_SOUND_CUE_ROLES = [
  "periodic",
  "final20",
  "final10",
  "final3",
  "expiry",
  "overtime",
] as const;

export type BakeTimerSoundCueRole = (typeof BAKE_TIMER_SOUND_CUE_ROLES)[number];

export type BakeTimerSoundTone = {
  frequency: number;
  length: number;
  gain: number;
  offset: number;
  type?: OscillatorType;
};

export type BakeTimerSoundThemeDefinition = {
  id: BakeTimerSoundThemeId;
  label: string;
  description: string;
  cueRoles: readonly BakeTimerSoundCueRole[];
  patternByCue: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>>;
};

type BakeTimerSoundConfigurationInput = {
  enabledThemeIds?: readonly unknown[] | null;
  defaultThemeId?: unknown;
};

export type BakeTimerSoundConfiguration = {
  enabledThemeIds: BakeTimerSoundThemeId[];
  defaultThemeId: BakeTimerSoundThemeId;
  version?: number;
};

const ALL_CUE_ROLES = BAKE_TIMER_SOUND_CUE_ROLES;

const CLASSIC_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [{ frequency: 820, gain: 0.13, length: 0.1, offset: 0 }],
  almost_there: [{ frequency: 960, gain: 0.15, length: 0.12, offset: 0 }],
  final_ten_transition: [
    { frequency: 1_060, gain: 0.16, length: 0.09, offset: 0 },
    { frequency: 1_180, gain: 0.17, length: 0.1, offset: 0.13 },
  ],
  final_ten: [{ frequency: 1_120, gain: 0.17, length: 0.09, offset: 0 }],
  final_three: [{ frequency: 1_360, gain: 0.2, length: 0.11, offset: 0 }],
  expired: [
    { frequency: 1_120, gain: 0.2, length: 0.12, offset: 0 },
    { frequency: 1_260, gain: 0.22, length: 0.12, offset: 0.18 },
    { frequency: 1_420, gain: 0.24, length: 0.18, offset: 0.36 },
  ],
  overtime: [
    { frequency: 1_120, gain: 0.2, length: 0.12, offset: 0 },
    { frequency: 1_260, gain: 0.22, length: 0.12, offset: 0.18 },
    { frequency: 1_420, gain: 0.24, length: 0.18, offset: 0.36 },
  ],
};

const BELL_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [{ frequency: 740, gain: 0.12, length: 0.18, offset: 0, type: "sine" }],
  almost_there: [{ frequency: 880, gain: 0.14, length: 0.2, offset: 0, type: "sine" }],
  final_ten_transition: [
    { frequency: 880, gain: 0.15, length: 0.14, offset: 0, type: "sine" },
    { frequency: 1_176, gain: 0.16, length: 0.18, offset: 0.16, type: "sine" },
  ],
  final_ten: [{ frequency: 1_046, gain: 0.16, length: 0.14, offset: 0, type: "sine" }],
  final_three: [{ frequency: 1_318, gain: 0.2, length: 0.16, offset: 0, type: "sine" }],
  expired: [
    { frequency: 988, gain: 0.18, length: 0.14, offset: 0, type: "sine" },
    { frequency: 1_318, gain: 0.2, length: 0.16, offset: 0.16, type: "sine" },
    { frequency: 1_568, gain: 0.22, length: 0.2, offset: 0.34, type: "sine" },
  ],
  overtime: [
    { frequency: 988, gain: 0.17, length: 0.14, offset: 0, type: "sine" },
    { frequency: 1_318, gain: 0.2, length: 0.18, offset: 0.22, type: "sine" },
  ],
};

const ROOSTER_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [{ frequency: 760, gain: 0.11, length: 0.08, offset: 0, type: "triangle" }],
  almost_there: [
    { frequency: 820, gain: 0.12, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 1_020, gain: 0.12, length: 0.08, offset: 0.1, type: "triangle" },
  ],
  final_ten_transition: [
    { frequency: 900, gain: 0.14, length: 0.07, offset: 0, type: "triangle" },
    { frequency: 1_240, gain: 0.15, length: 0.08, offset: 0.1, type: "triangle" },
    { frequency: 1_060, gain: 0.14, length: 0.08, offset: 0.2, type: "triangle" },
  ],
  final_ten: [
    { frequency: 980, gain: 0.15, length: 0.07, offset: 0, type: "triangle" },
    { frequency: 1_180, gain: 0.14, length: 0.07, offset: 0.09, type: "triangle" },
  ],
  final_three: [
    { frequency: 1_240, gain: 0.18, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 1_520, gain: 0.2, length: 0.1, offset: 0.11, type: "triangle" },
  ],
  expired: [
    { frequency: 980, gain: 0.16, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 1_320, gain: 0.2, length: 0.1, offset: 0.12, type: "triangle" },
    { frequency: 1_620, gain: 0.21, length: 0.14, offset: 0.28, type: "triangle" },
  ],
  overtime: [
    { frequency: 1_060, gain: 0.17, length: 0.08, offset: 0, type: "triangle" },
    { frequency: 1_420, gain: 0.2, length: 0.11, offset: 0.16, type: "triangle" },
  ],
};

const HALLOWEEN_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [{ frequency: 640, gain: 0.11, length: 0.12, offset: 0, type: "sine" }],
  almost_there: [{ frequency: 720, gain: 0.13, length: 0.14, offset: 0, type: "sine" }],
  final_ten_transition: [
    { frequency: 720, gain: 0.14, length: 0.1, offset: 0, type: "sine" },
    { frequency: 960, gain: 0.16, length: 0.12, offset: 0.14, type: "triangle" },
  ],
  final_ten: [{ frequency: 840, gain: 0.16, length: 0.1, offset: 0, type: "triangle" }],
  final_three: [{ frequency: 1_080, gain: 0.2, length: 0.12, offset: 0, type: "triangle" }],
  expired: [
    { frequency: 720, gain: 0.18, length: 0.14, offset: 0, type: "triangle" },
    { frequency: 960, gain: 0.2, length: 0.14, offset: 0.18, type: "triangle" },
    { frequency: 1_280, gain: 0.22, length: 0.2, offset: 0.38, type: "triangle" },
  ],
  overtime: [
    { frequency: 720, gain: 0.18, length: 0.14, offset: 0, type: "triangle" },
    { frequency: 960, gain: 0.2, length: 0.18, offset: 0.24, type: "triangle" },
  ],
};

export const BAKE_TIMER_SOUND_THEME_DEFINITIONS: readonly BakeTimerSoundThemeDefinition[] = [
  {
    id: "classic",
    label: "Classic",
    description: "The original DoughTools timer cue set.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: CLASSIC_PATTERNS,
  },
  {
    id: "bell",
    label: "Bell",
    description: "Clean bell-like tones with the same timer cadence.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: BELL_PATTERNS,
  },
  {
    id: "rooster",
    label: "Rooster",
    description: "A bright kitchen-safe synthesized cue set without voice or sampled calls.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: ROOSTER_PATTERNS,
  },
  {
    id: "halloween",
    label: "Halloween",
    description: "A seasonal synthesized cue set using darker, non-copied tones.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: HALLOWEEN_PATTERNS,
  },
];

const DEFINITIONS_BY_ID = new Map(BAKE_TIMER_SOUND_THEME_DEFINITIONS.map((definition) => [definition.id, definition]));
const SOUND_THEME_ID_SET = new Set<string>(BAKE_TIMER_SOUND_THEME_IDS);

export const DEFAULT_BAKE_TIMER_SOUND_CONFIGURATION: BakeTimerSoundConfiguration = {
  enabledThemeIds: [CLASSIC_BAKE_TIMER_SOUND_THEME_ID],
  defaultThemeId: CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
};

export function isBakeTimerSoundThemeId(value: unknown): value is BakeTimerSoundThemeId {
  return typeof value === "string" && SOUND_THEME_ID_SET.has(value);
}

export function normalizeBakeTimerSoundThemeId(value: unknown): BakeTimerSoundThemeId {
  return isBakeTimerSoundThemeId(value) ? value : CLASSIC_BAKE_TIMER_SOUND_THEME_ID;
}

export function getBakeTimerSoundThemeDefinition(value: unknown): BakeTimerSoundThemeDefinition {
  return DEFINITIONS_BY_ID.get(normalizeBakeTimerSoundThemeId(value)) ?? DEFINITIONS_BY_ID.get(CLASSIC_BAKE_TIMER_SOUND_THEME_ID)!;
}

export function getBakeTimerSoundPatternForTheme(
  cue: BakeTimerSoundCue,
  themeId: unknown = CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
): readonly BakeTimerSoundTone[] {
  return getBakeTimerSoundThemeDefinition(themeId).patternByCue[cue] ?? CLASSIC_PATTERNS[cue];
}

export function bakeTimerSoundCueRole(cue: BakeTimerSoundCue): BakeTimerSoundCueRole {
  if (cue === "normal") return "periodic";
  if (cue === "almost_there") return "final20";
  if (cue === "final_ten_transition" || cue === "final_ten") return "final10";
  if (cue === "final_three") return "final3";
  if (cue === "expired") return "expiry";
  return "overtime";
}

export function normalizeBakeTimerSoundConfiguration(
  input: BakeTimerSoundConfigurationInput | null | undefined,
): BakeTimerSoundConfiguration {
  const rawEnabled = Array.isArray(input?.enabledThemeIds) ? input.enabledThemeIds : [];
  const enabledThemeIds = rawEnabled.filter(isBakeTimerSoundThemeId);
  const uniqueEnabled: BakeTimerSoundThemeId[] = [...new Set(enabledThemeIds)];
  const safeEnabled: BakeTimerSoundThemeId[] = uniqueEnabled.length > 0 ? uniqueEnabled : [CLASSIC_BAKE_TIMER_SOUND_THEME_ID];
  const preferredDefault = normalizeBakeTimerSoundThemeId(input?.defaultThemeId);
  const defaultThemeId = safeEnabled.includes(preferredDefault) ? preferredDefault : CLASSIC_BAKE_TIMER_SOUND_THEME_ID;

  return {
    enabledThemeIds: safeEnabled,
    defaultThemeId: safeEnabled.includes(defaultThemeId) ? defaultThemeId : safeEnabled[0] ?? CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  };
}

export function resolveEffectiveBakeTimerSoundTheme({
  userPreference,
  configuration,
}: {
  userPreference?: unknown;
  configuration?: BakeTimerSoundConfigurationInput | null;
}): BakeTimerSoundThemeId {
  const normalizedConfiguration = normalizeBakeTimerSoundConfiguration(configuration);
  if (isBakeTimerSoundThemeId(userPreference) && normalizedConfiguration.enabledThemeIds.includes(userPreference)) {
    return userPreference;
  }
  if (normalizedConfiguration.enabledThemeIds.includes(normalizedConfiguration.defaultThemeId)) {
    return normalizedConfiguration.defaultThemeId;
  }
  return CLASSIC_BAKE_TIMER_SOUND_THEME_ID;
}

export function publicBakeTimerSoundThemeDefinitions() {
  return BAKE_TIMER_SOUND_THEME_DEFINITIONS.map(({ id, label, description, cueRoles }) => ({
    id,
    label,
    description,
    cueRoles: [...cueRoles],
  }));
}
