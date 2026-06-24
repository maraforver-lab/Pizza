export type ExperienceLevel = "beginner" | "enthusiast" | "pizza_nerd";

export type LegacyExperienceLevel = "intermediate" | "advanced";

export type ExperienceLevelAccent = "green" | "orange" | "dark-red";

export type ExperienceLevelConfig = {
  id: ExperienceLevel;
  value: ExperienceLevel;
  label: string;
  shortLabel: string;
  description: string;
  bestFor: string;
  whatYouWillSee: string;
  depthPrinciple: string;
  visualTone: string;
  guidanceTone: string;
  marker: string;
  badgeLabel: string;
  accent: ExperienceLevelAccent;
  badgeClassName: string;
  cardClassName: string;
  markerClassName: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const DEFAULT_EXPERIENCE_LEVEL: ExperienceLevel = "beginner";

export const EXPERIENCE_LEVEL_STORAGE_KEY = "doughtools.experienceLevel";

export const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    value: "beginner",
    label: "Beginner",
    shortLabel: "Beginner",
    description: "I want clear step-by-step help.",
    bestFor: "First pizzas, simple decisions, and avoiding common mistakes.",
    whatYouWillSee: "Simple steps, safe defaults, practical tips, and less jargon.",
    depthPrinciple: "Show the next best action first. Keep technical details optional.",
    visualTone: "Simple, approachable and calm.",
    guidanceTone: "Clear, calm, practical and reassuring.",
    marker: "🟢",
    badgeLabel: "Beginner",
    accent: "green",
    badgeClassName: "bg-leaf/10 text-leaf ring-leaf/20",
    cardClassName: "border-leaf/30 bg-leaf/[.06]",
    markerClassName: "bg-leaf",
  },
  {
    id: "enthusiast",
    value: "enthusiast",
    label: "Enthusiast",
    shortLabel: "Enthusiast",
    description: "I already make pizza and want better control.",
    bestFor: "Improving repeatability, understanding variables, and adjusting dough with confidence.",
    whatYouWillSee: "Beginner guidance plus clearer explanations about hydration, fermentation, flour, timing, and oven behavior.",
    depthPrinciple: "Explain the why behind the recommendation.",
    visualTone: "Warm, active and practical.",
    guidanceTone: "Practical, curious and cause-and-effect oriented.",
    marker: "🟠",
    badgeLabel: "Enthusiast",
    accent: "orange",
    badgeClassName: "bg-tomato/10 text-tomato ring-tomato/20",
    cardClassName: "border-tomato/30 bg-tomato/[.06]",
    markerClassName: "bg-tomato",
  },
  {
    id: "pizza_nerd",
    value: "pizza_nerd",
    label: "Pizza Nerd",
    shortLabel: "Nerd",
    description: "I want all the variables and technical details.",
    bestFor: "Optimizing formulas, comparing assumptions, testing variables, and improving repeatability.",
    whatYouWillSee: "All available details, technical notes, assumptions, tradeoffs, baker’s percentages, and deeper troubleshooting logic.",
    depthPrinciple: "Expose variables, assumptions, constraints, and tradeoffs.",
    visualTone: "Precise, technical and lab-like without feeling like an error state.",
    guidanceTone: "Precise, technical, transparent and not unnecessarily simplified.",
    marker: "🔴",
    badgeLabel: "Pizza Nerd",
    accent: "dark-red",
    badgeClassName: "bg-[#5d3025]/10 text-[#5d3025] ring-[#5d3025]/20",
    cardClassName: "border-[#5d3025]/30 bg-[#5d3025]/[.06]",
    markerClassName: "bg-[#5d3025]",
  },
] as const satisfies readonly ExperienceLevelConfig[];

const experienceLevelIds = new Set<ExperienceLevel>(EXPERIENCE_LEVELS.map((level) => level.id));

export const LEGACY_EXPERIENCE_LEVEL_MIGRATIONS: Record<LegacyExperienceLevel | "beginner", ExperienceLevel> = {
  beginner: "beginner",
  intermediate: "enthusiast",
  advanced: "pizza_nerd",
};

function getBrowserStorage(storage?: StorageLike): StorageLike | undefined {
  if (storage) return storage;
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return typeof value === "string" && experienceLevelIds.has(value as ExperienceLevel);
}

export function normalizeExperienceLevel(value: unknown): ExperienceLevel {
  if (isExperienceLevel(value)) return value;
  if (typeof value === "string" && value in LEGACY_EXPERIENCE_LEVEL_MIGRATIONS) {
    return LEGACY_EXPERIENCE_LEVEL_MIGRATIONS[value as keyof typeof LEGACY_EXPERIENCE_LEVEL_MIGRATIONS];
  }
  return DEFAULT_EXPERIENCE_LEVEL;
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
  const stored = target.getItem(EXPERIENCE_LEVEL_STORAGE_KEY);
  const normalized = normalizeExperienceLevel(stored);
  if (stored !== null && stored !== normalized) target.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, normalized);
  return normalized;
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
  return level === "enthusiast" || level === "pizza_nerd";
}

export function shouldShowNerdContent(level: ExperienceLevel): boolean {
  return level === "pizza_nerd";
}

export function getExperienceLevelCopyMode(level: ExperienceLevel) {
  if (level === "pizza_nerd") return "full";
  if (level === "enthusiast") return "guided";
  return "simple";
}
