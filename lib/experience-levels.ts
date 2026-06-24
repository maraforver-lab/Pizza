export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type ExperienceLevelAccent = "green" | "orange" | "dark-red";

export type ExperienceLevelConfig = {
  id: ExperienceLevel;
  label: string;
  description: string;
  emoji: string;
  accent: ExperienceLevelAccent;
  badgeClassName: string;
  cardClassName: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = "intermediate";

export const EXPERIENCE_LEVEL_STORAGE_KEY = "doughtools.experienceLevel";

export const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "I want clear step-by-step help.",
    emoji: "🟢",
    accent: "green",
    badgeClassName: "bg-leaf/10 text-leaf ring-leaf/20",
    cardClassName: "border-leaf/30 bg-leaf/[.06]",
  },
  {
    id: "intermediate",
    label: "Home Pizza Maker",
    description: "I already make pizza and want better control.",
    emoji: "🟠",
    accent: "orange",
    badgeClassName: "bg-tomato/10 text-tomato ring-tomato/20",
    cardClassName: "border-tomato/30 bg-tomato/[.06]",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "I want deeper technical guidance.",
    emoji: "🔴",
    accent: "dark-red",
    badgeClassName: "bg-[#5d3025]/10 text-[#5d3025] ring-[#5d3025]/20",
    cardClassName: "border-[#5d3025]/30 bg-[#5d3025]/[.06]",
  },
] as const satisfies readonly ExperienceLevelConfig[];

const experienceLevelIds = new Set<ExperienceLevel>(EXPERIENCE_LEVELS.map((level) => level.id));

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return typeof value === "string" && experienceLevelIds.has(value as ExperienceLevel);
}

export function normalizeExperienceLevel(value: unknown): ExperienceLevel {
  return isExperienceLevel(value) ? value : DEFAULT_EXPERIENCE_LEVEL;
}

export function getExperienceLevelConfig(level: unknown): ExperienceLevelConfig {
  const normalized = normalizeExperienceLevel(level);
  return EXPERIENCE_LEVELS.find((item) => item.id === normalized) ?? EXPERIENCE_LEVELS[0];
}

export function getDefaultExperienceLevel(): ExperienceLevel {
  return DEFAULT_EXPERIENCE_LEVEL;
}

export function getExperienceLevelOrder(): ExperienceLevel[] {
  return EXPERIENCE_LEVELS.map((level) => level.id);
}

export function readExperienceLevelPreference(storage?: StorageLike): ExperienceLevel {
  const target = getBrowserStorage(storage);
  if (!target) return DEFAULT_EXPERIENCE_LEVEL;
  return normalizeExperienceLevel(target.getItem(EXPERIENCE_LEVEL_STORAGE_KEY));
}

export function writeExperienceLevelPreference(level: ExperienceLevel, storage?: StorageLike): ExperienceLevel {
  const normalized = normalizeExperienceLevel(level);
  const target = getBrowserStorage(storage);
  target?.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, normalized);
  return normalized;
}

export function clearExperienceLevelPreference(storage?: StorageLike) {
  getBrowserStorage(storage)?.removeItem(EXPERIENCE_LEVEL_STORAGE_KEY);
}

export function shouldShowBeginnerContent(level: ExperienceLevel): boolean {
  return isExperienceLevel(level);
}

export function shouldShowAdvancedContent(level: ExperienceLevel): boolean {
  return level === "intermediate" || level === "advanced";
}

export function shouldShowNerdContent(level: ExperienceLevel): boolean {
  return level === "advanced";
}

export function getExperienceLevelCopyMode(level: ExperienceLevel) {
  if (level === "advanced") return "full";
  if (level === "intermediate") return "guided";
  return "simple";
}
