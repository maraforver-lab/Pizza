export type ExperienceLevel = "beginner" | "enthusiast" | "pizza_nerd";

export type LegacyExperienceLevel = "intermediate" | "advanced" | "nerd" | "pizza nerd" | "pizza-nerd";

export type ExperienceLevelAccent = "green" | "orange" | "pink-red";

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
    badgeClassName: "bg-[#f2a15f]/15 text-[#b85f20] ring-[#f2a15f]/25",
    cardClassName: "border-[#f2a15f]/35 bg-[#f2a15f]/[.08]",
    markerClassName: "bg-[#f2a15f]",
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
    accent: "pink-red",
    badgeClassName: "bg-[#eb577f]/10 text-[#b8325d] ring-[#eb577f]/20",
    cardClassName: "border-[#eb577f]/30 bg-[#eb577f]/[.07]",
    markerClassName: "bg-[#eb577f]",
  },
] as const satisfies readonly ExperienceLevelConfig[];

const experienceLevelIds = new Set<ExperienceLevel>(EXPERIENCE_LEVELS.map((level) => level.id));

export const LEGACY_EXPERIENCE_LEVEL_MIGRATIONS: Record<LegacyExperienceLevel | "beginner", ExperienceLevel> = {
  beginner: "beginner",
  intermediate: "enthusiast",
  advanced: "pizza_nerd",
  nerd: "pizza_nerd",
  "pizza nerd": "pizza_nerd",
  "pizza-nerd": "pizza_nerd",
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
  if (typeof value === "string") {
    const normalizedKey = value.trim().toLowerCase();
    if (isExperienceLevel(normalizedKey)) return normalizedKey;
    if (normalizedKey in LEGACY_EXPERIENCE_LEVEL_MIGRATIONS) {
      return LEGACY_EXPERIENCE_LEVEL_MIGRATIONS[normalizedKey as keyof typeof LEGACY_EXPERIENCE_LEVEL_MIGRATIONS];
    }
    const canonicalizedKey = normalizedKey.replace(/[\s-]+/g, "_");
    if (isExperienceLevel(canonicalizedKey)) return canonicalizedKey;
  }
  return DEFAULT_EXPERIENCE_LEVEL;
}

export function getExperienceLevelConfig(level: unknown): ExperienceLevelConfig {
  const normalized = normalizeExperienceLevel(level);
  return EXPERIENCE_LEVELS.find((item) => item.id === normalized) ?? EXPERIENCE_LEVELS[0];
}

const EXPERIENCE_LEVEL_CORNER_ACCENTS: Record<ExperienceLevel, string> = {
  beginner:
    "radial-gradient(circle at 100% 0%, rgba(58, 163, 106, 0.16), rgba(255, 255, 255, 0.92) 38%, rgba(255, 255, 255, 0.85) 68%)",
  enthusiast:
    "radial-gradient(circle at 100% 0%, rgba(242, 161, 95, 0.18), rgba(255, 255, 255, 0.92) 38%, rgba(255, 255, 255, 0.85) 68%)",
  pizza_nerd:
    "radial-gradient(circle at 100% 0%, rgba(235, 87, 127, 0.16), rgba(255, 255, 255, 0.92) 38%, rgba(255, 255, 255, 0.85) 68%)",
};

export function getExperienceLevelCornerAccentStyle(level: unknown) {
  return {
    backgroundImage: EXPERIENCE_LEVEL_CORNER_ACCENTS[normalizeExperienceLevel(level)],
  };
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
