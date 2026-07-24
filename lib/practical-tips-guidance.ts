import {
  getDefaultExperienceLevel,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";

export type PracticalTipLevelGuidanceItem = {
  level: ExperienceLevel;
  title: string;
  intro: string;
  steps: readonly string[];
};

type StorageLike = Parameters<typeof readExperienceLevelPreference>[0];

export function selectPracticalTipLevelGuidance(
  items: readonly PracticalTipLevelGuidanceItem[],
  storage?: StorageLike,
) {
  const selectedLevel = readExperienceLevelPreference(storage);
  return items.find((item) => item.level === selectedLevel) ?? items.find((item) => item.level === getDefaultExperienceLevel()) ?? items[0];
}
