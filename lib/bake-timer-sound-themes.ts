import type { BakeTimerSoundCue } from "@/lib/bake-timer";

export const CLASSIC_BAKE_TIMER_SOUND_THEME_ID = "classic";

export const BAKE_TIMER_SOUND_THEME_IDS = [
  CLASSIC_BAKE_TIMER_SOUND_THEME_ID,
  "bell",
  "rooster",
  "halloween",
  "dark-commander",
  "robot-chef",
] as const;

export type BakeTimerSoundThemeId = (typeof BAKE_TIMER_SOUND_THEME_IDS)[number];

export const DEFERRED_BAKE_TIMER_SOUND_THEME_IDS = [] as const;

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
  normal: [
    { frequency: 660, gain: 0.1, length: 0.32, offset: 0, type: "sine" },
    { frequency: 1_320, gain: 0.045, length: 0.36, offset: 0.006, type: "sine" },
  ],
  almost_there: [
    { frequency: 740, gain: 0.105, length: 0.28, offset: 0, type: "sine" },
    { frequency: 1_480, gain: 0.048, length: 0.34, offset: 0.006, type: "sine" },
    { frequency: 740, gain: 0.085, length: 0.22, offset: 0.34, type: "sine" },
  ],
  final_ten_transition: [
    { frequency: 988, gain: 0.12, length: 0.24, offset: 0, type: "sine" },
    { frequency: 1_976, gain: 0.04, length: 0.28, offset: 0.006, type: "sine" },
    { frequency: 740, gain: 0.11, length: 0.26, offset: 0.28, type: "sine" },
    { frequency: 1_480, gain: 0.04, length: 0.3, offset: 0.286, type: "sine" },
  ],
  final_ten: [
    { frequency: 1_046, gain: 0.13, length: 0.18, offset: 0, type: "sine" },
    { frequency: 784, gain: 0.105, length: 0.2, offset: 0.2, type: "sine" },
  ],
  final_three: [
    { frequency: 1_318, gain: 0.16, length: 0.22, offset: 0, type: "sine" },
    { frequency: 2_636, gain: 0.045, length: 0.24, offset: 0.006, type: "sine" },
  ],
  expired: [
    { frequency: 784, gain: 0.14, length: 0.28, offset: 0, type: "sine" },
    { frequency: 1_568, gain: 0.045, length: 0.32, offset: 0.006, type: "sine" },
    { frequency: 988, gain: 0.15, length: 0.3, offset: 0.34, type: "sine" },
    { frequency: 1_976, gain: 0.048, length: 0.34, offset: 0.346, type: "sine" },
    { frequency: 1_318, gain: 0.17, length: 0.42, offset: 0.72, type: "sine" },
    { frequency: 2_636, gain: 0.04, length: 0.46, offset: 0.726, type: "sine" },
  ],
  overtime: [
    { frequency: 988, gain: 0.14, length: 0.24, offset: 0, type: "sine" },
    { frequency: 1_976, gain: 0.04, length: 0.28, offset: 0.006, type: "sine" },
    { frequency: 988, gain: 0.12, length: 0.22, offset: 0.38, type: "sine" },
  ],
};

const ROOSTER_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [
    { frequency: 700, gain: 0.095, length: 0.065, offset: 0, type: "triangle" },
    { frequency: 920, gain: 0.105, length: 0.075, offset: 0.1, type: "triangle" },
    { frequency: 1_180, gain: 0.12, length: 0.115, offset: 0.22, type: "triangle" },
  ],
  almost_there: [
    { frequency: 760, gain: 0.1, length: 0.06, offset: 0, type: "triangle" },
    { frequency: 980, gain: 0.11, length: 0.07, offset: 0.09, type: "triangle" },
    { frequency: 1_260, gain: 0.125, length: 0.105, offset: 0.2, type: "triangle" },
    { frequency: 820, gain: 0.095, length: 0.055, offset: 0.42, type: "triangle" },
    { frequency: 1_080, gain: 0.105, length: 0.065, offset: 0.5, type: "triangle" },
    { frequency: 1_380, gain: 0.12, length: 0.1, offset: 0.6, type: "triangle" },
  ],
  final_ten_transition: [
    { frequency: 860, gain: 0.115, length: 0.055, offset: 0, type: "triangle" },
    { frequency: 1_120, gain: 0.125, length: 0.06, offset: 0.08, type: "triangle" },
    { frequency: 1_460, gain: 0.145, length: 0.095, offset: 0.17, type: "triangle" },
    { frequency: 980, gain: 0.11, length: 0.05, offset: 0.34, type: "triangle" },
    { frequency: 1_300, gain: 0.13, length: 0.06, offset: 0.41, type: "triangle" },
    { frequency: 1_620, gain: 0.15, length: 0.1, offset: 0.5, type: "triangle" },
  ],
  final_ten: [
    { frequency: 980, gain: 0.125, length: 0.045, offset: 0, type: "triangle" },
    { frequency: 1_280, gain: 0.14, length: 0.055, offset: 0.07, type: "triangle" },
    { frequency: 1_580, gain: 0.155, length: 0.08, offset: 0.15, type: "triangle" },
  ],
  final_three: [
    { frequency: 1_180, gain: 0.145, length: 0.05, offset: 0, type: "triangle" },
    { frequency: 1_540, gain: 0.18, length: 0.07, offset: 0.08, type: "triangle" },
    { frequency: 1_760, gain: 0.2, length: 0.12, offset: 0.19, type: "triangle" },
  ],
  expired: [
    { frequency: 860, gain: 0.13, length: 0.055, offset: 0, type: "triangle" },
    { frequency: 1_140, gain: 0.15, length: 0.06, offset: 0.09, type: "triangle" },
    { frequency: 1_500, gain: 0.175, length: 0.09, offset: 0.2, type: "triangle" },
    { frequency: 1_020, gain: 0.13, length: 0.055, offset: 0.42, type: "triangle" },
    { frequency: 1_360, gain: 0.17, length: 0.07, offset: 0.5, type: "triangle" },
    { frequency: 1_820, gain: 0.21, length: 0.18, offset: 0.62, type: "triangle" },
  ],
  overtime: [
    { frequency: 1_020, gain: 0.13, length: 0.05, offset: 0, type: "triangle" },
    { frequency: 1_340, gain: 0.16, length: 0.07, offset: 0.09, type: "triangle" },
    { frequency: 1_700, gain: 0.18, length: 0.12, offset: 0.22, type: "triangle" },
  ],
};

const HALLOWEEN_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [
    { frequency: 196, gain: 0.13, length: 0.28, offset: 0, type: "sawtooth" },
  ],
  almost_there: [
    { frequency: 196, gain: 0.135, length: 0.26, offset: 0, type: "sawtooth" },
    { frequency: 220, gain: 0.13, length: 0.26, offset: 0.38, type: "sawtooth" },
  ],
  final_ten_transition: [
    { frequency: 392, gain: 0.13, length: 0.12, offset: 0, type: "triangle" },
    { frequency: 330, gain: 0.14, length: 0.12, offset: 0.16, type: "triangle" },
    { frequency: 262, gain: 0.155, length: 0.18, offset: 0.34, type: "sawtooth" },
  ],
  final_ten: [
    { frequency: 370, gain: 0.14, length: 0.085, offset: 0, type: "triangle" },
    { frequency: 311, gain: 0.15, length: 0.085, offset: 0.115, type: "triangle" },
    { frequency: 247, gain: 0.16, length: 0.12, offset: 0.25, type: "sawtooth" },
  ],
  final_three: [
    { frequency: 1_240, gain: 0.17, length: 0.07, offset: 0, type: "triangle" },
    { frequency: 1_470, gain: 0.2, length: 0.08, offset: 0.1, type: "triangle" },
    { frequency: 220, gain: 0.13, length: 0.22, offset: 0, type: "sawtooth" },
  ],
  expired: [
    { frequency: 196, gain: 0.16, length: 0.74, offset: 0, type: "sawtooth" },
    { frequency: 277, gain: 0.09, length: 0.68, offset: 0.02, type: "triangle" },
    { frequency: 392, gain: 0.075, length: 0.6, offset: 0.04, type: "sine" },
    { frequency: 740, gain: 0.13, length: 0.12, offset: 0.5, type: "triangle" },
  ],
  overtime: [
    { frequency: 220, gain: 0.15, length: 0.26, offset: 0, type: "sawtooth" },
    { frequency: 294, gain: 0.13, length: 0.18, offset: 0.34, type: "triangle" },
    { frequency: 247, gain: 0.14, length: 0.22, offset: 0.58, type: "sawtooth" },
  ],
};

const DARK_COMMANDER_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [
    { frequency: 180, gain: 0.15, length: 0.16, offset: 0, type: "square" },
    { frequency: 540, gain: 0.055, length: 0.07, offset: 0.02, type: "sawtooth" },
  ],
  almost_there: [
    { frequency: 180, gain: 0.145, length: 0.13, offset: 0, type: "square" },
    { frequency: 540, gain: 0.055, length: 0.06, offset: 0.018, type: "sawtooth" },
    { frequency: 180, gain: 0.14, length: 0.13, offset: 0.3, type: "square" },
    { frequency: 540, gain: 0.055, length: 0.06, offset: 0.318, type: "sawtooth" },
  ],
  final_ten_transition: [
    { frequency: 200, gain: 0.15, length: 0.09, offset: 0, type: "square" },
    { frequency: 600, gain: 0.06, length: 0.055, offset: 0.018, type: "sawtooth" },
    { frequency: 200, gain: 0.15, length: 0.09, offset: 0.18, type: "square" },
    { frequency: 600, gain: 0.06, length: 0.055, offset: 0.198, type: "sawtooth" },
    { frequency: 300, gain: 0.11, length: 0.12, offset: 0.42, type: "triangle" },
  ],
  final_ten: [
    { frequency: 220, gain: 0.155, length: 0.07, offset: 0, type: "square" },
    { frequency: 660, gain: 0.06, length: 0.045, offset: 0.016, type: "sawtooth" },
    { frequency: 220, gain: 0.12, length: 0.055, offset: 0.13, type: "square" },
  ],
  final_three: [
    { frequency: 240, gain: 0.18, length: 0.1, offset: 0, type: "square" },
    { frequency: 720, gain: 0.075, length: 0.06, offset: 0.02, type: "sawtooth" },
    { frequency: 960, gain: 0.09, length: 0.07, offset: 0.16, type: "triangle" },
  ],
  expired: [
    { frequency: 160, gain: 0.19, length: 0.34, offset: 0, type: "square" },
    { frequency: 320, gain: 0.08, length: 0.28, offset: 0.018, type: "sawtooth" },
    { frequency: 880, gain: 0.13, length: 0.12, offset: 0.42, type: "triangle" },
    { frequency: 1_160, gain: 0.12, length: 0.12, offset: 0.62, type: "triangle" },
  ],
  overtime: [
    { frequency: 180, gain: 0.17, length: 0.12, offset: 0, type: "square" },
    { frequency: 540, gain: 0.06, length: 0.055, offset: 0.018, type: "sawtooth" },
    { frequency: 180, gain: 0.16, length: 0.12, offset: 0.24, type: "square" },
    { frequency: 540, gain: 0.06, length: 0.055, offset: 0.258, type: "sawtooth" },
  ],
};

const ROBOT_CHEF_PATTERNS: Readonly<Record<BakeTimerSoundCue, readonly BakeTimerSoundTone[]>> = {
  normal: [
    { frequency: 880, gain: 0.11, length: 0.045, offset: 0, type: "square" },
    { frequency: 1_180, gain: 0.085, length: 0.045, offset: 0.075, type: "triangle" },
  ],
  almost_there: [
    { frequency: 920, gain: 0.105, length: 0.04, offset: 0, type: "square" },
    { frequency: 1_160, gain: 0.095, length: 0.04, offset: 0.06, type: "triangle" },
    { frequency: 1_420, gain: 0.105, length: 0.05, offset: 0.12, type: "square" },
  ],
  final_ten_transition: [
    { frequency: 780, gain: 0.11, length: 0.035, offset: 0, type: "square" },
    { frequency: 980, gain: 0.11, length: 0.035, offset: 0.052, type: "triangle" },
    { frequency: 1_240, gain: 0.125, length: 0.04, offset: 0.104, type: "square" },
    { frequency: 1_560, gain: 0.145, length: 0.055, offset: 0.156, type: "triangle" },
  ],
  final_ten: [
    { frequency: 900, gain: 0.115, length: 0.032, offset: 0, type: "square" },
    { frequency: 1_140, gain: 0.11, length: 0.032, offset: 0.05, type: "triangle" },
    { frequency: 1_440, gain: 0.125, length: 0.038, offset: 0.1, type: "square" },
    { frequency: 1_720, gain: 0.135, length: 0.045, offset: 0.152, type: "triangle" },
  ],
  final_three: [
    { frequency: 1_180, gain: 0.14, length: 0.04, offset: 0, type: "square" },
    { frequency: 1_560, gain: 0.16, length: 0.045, offset: 0.06, type: "triangle" },
    { frequency: 2_040, gain: 0.18, length: 0.055, offset: 0.13, type: "square" },
  ],
  expired: [
    { frequency: 880, gain: 0.12, length: 0.04, offset: 0, type: "square" },
    { frequency: 1_110, gain: 0.12, length: 0.04, offset: 0.055, type: "triangle" },
    { frequency: 1_400, gain: 0.135, length: 0.045, offset: 0.11, type: "square" },
    { frequency: 1_760, gain: 0.155, length: 0.05, offset: 0.175, type: "triangle" },
    { frequency: 2_100, gain: 0.14, length: 0.1, offset: 0.28, type: "sine" },
  ],
  overtime: [
    { frequency: 760, gain: 0.12, length: 0.04, offset: 0, type: "square" },
    { frequency: 1_040, gain: 0.12, length: 0.04, offset: 0.055, type: "triangle" },
    { frequency: 1_320, gain: 0.13, length: 0.04, offset: 0.11, type: "square" },
    { frequency: 760, gain: 0.105, length: 0.04, offset: 0.28, type: "square" },
    { frequency: 1_040, gain: 0.115, length: 0.04, offset: 0.335, type: "triangle" },
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
    description: "Resonant kitchen-bell patterns with warm ringing tails.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: BELL_PATTERNS,
  },
  {
    id: "rooster",
    label: "Rooster",
    description: "Playful rising synthesized phrases without voice or sampled calls.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: ROOSTER_PATTERNS,
  },
  {
    id: "halloween",
    label: "Halloween",
    description: "Dark pulses, descending tension and a dramatic synthesized expiry.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: HALLOWEEN_PATTERNS,
  },
  {
    id: "dark-commander",
    label: "Dark Commander",
    description: "An original deep mechanical cinematic sound.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: DARK_COMMANDER_PATTERNS,
  },
  {
    id: "robot-chef",
    label: "Robot Chef",
    description: "A friendly robotic kitchen sound with concise beeps.",
    cueRoles: ALL_CUE_ROLES,
    patternByCue: ROBOT_CHEF_PATTERNS,
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
