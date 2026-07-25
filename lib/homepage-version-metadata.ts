export const HOMEPAGE_VERSION_IDS = ["stable", "simplified", "refined"] as const;

export type HomepageVersionId = (typeof HOMEPAGE_VERSION_IDS)[number];

export type HomepageVersionStatus = "live" | "draft" | "retired";

export type HomepageVersionMetadata = {
  id: HomepageVersionId;
  name: string;
  description: string;
  status: HomepageVersionStatus;
  previewAvailable: boolean;
};

export const homepageVersionMetadata = [
  {
    id: "stable",
    name: "Current homepage",
    description: "The existing production Homepage.",
    status: "live",
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
    status: "draft",
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

export function getLiveHomepageVersionMetadata(): HomepageVersionMetadata {
  const liveVersions = homepageVersionMetadata.filter((version) => version.status === "live");
  if (liveVersions.length !== 1) {
    throw new Error(`Expected exactly one live Homepage version, found ${liveVersions.length}.`);
  }
  return liveVersions[0];
}
