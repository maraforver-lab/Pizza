export const HOMEPAGE_VERSION_IDS = ["stable", "simplified", "refined"] as const;

export type HomepageVersionId = (typeof HOMEPAGE_VERSION_IDS)[number];

export type HomepageVersionStatus = "live" | "draft" | "archived";

export type HomepageVersionMetadata = {
  id: HomepageVersionId;
  name: string;
  description: string;
  status: HomepageVersionStatus;
  previewAvailable: boolean;
};

export const STABLE_HOMEPAGE_VERSION_ID = "stable" satisfies HomepageVersionId;

export const homepageVersionMetadata = [
  {
    id: "stable",
    name: "Current homepage",
    description: "The previous production Homepage, preserved as a rollback version.",
    status: "archived",
    previewAvailable: true,
  },
  {
    id: "simplified",
    name: "Simplified homepage",
    description: "A clearer Make versus Learn Homepage concept.",
    status: "draft",
    previewAvailable: true,
  },
  {
    id: "refined",
    name: "Refined homepage",
    description: "A more image-led and compact refinement of the simplified Homepage.",
    status: "live",
    previewAvailable: true,
  },
] as const satisfies readonly HomepageVersionMetadata[];

export function isHomepageVersionId(value: string): value is HomepageVersionId {
  return HOMEPAGE_VERSION_IDS.includes(value as HomepageVersionId);
}

export function getHomepageVersionMetadata(value: string): HomepageVersionMetadata | null {
  if (!isHomepageVersionId(value)) return null;
  return homepageVersionMetadata.find((version) => version.id === value) ?? null;
}

export function getStableHomepageVersionMetadata(): HomepageVersionMetadata {
  const stableVersion = homepageVersionMetadata.find((version) => version.id === STABLE_HOMEPAGE_VERSION_ID);
  if (!stableVersion) {
    throw new Error("Missing stable Homepage fallback version.");
  }
  return stableVersion;
}

export function getLiveHomepageVersionMetadata(): HomepageVersionMetadata {
  const liveVersions = homepageVersionMetadata.filter((version) => version.status === "live");
  if (liveVersions.length !== 1) {
    return getStableHomepageVersionMetadata();
  }
  return liveVersions[0] ?? getStableHomepageVersionMetadata();
}
