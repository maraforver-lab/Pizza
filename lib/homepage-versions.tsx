import type { ComponentType } from "react";
import HomepageRefined from "@/components/homepage/HomepageRefined";
import HomepageSimplified from "@/components/homepage/HomepageSimplified";
import HomepageStable from "@/components/homepage/HomepageStable";
import {
  getHomepageVersionMetadata,
  getLiveHomepageVersionMetadata,
  getStableHomepageVersionMetadata,
  homepageVersionMetadata,
  type HomepageVersionId,
  type HomepageVersionMetadata,
} from "@/lib/homepage-version-metadata";

export type { HomepageVersionId } from "@/lib/homepage-version-metadata";

export type HomepageVersionRegistration = HomepageVersionMetadata & {
  Component: ComponentType;
};

const homepageVersionComponents: Record<HomepageVersionId, ComponentType> = {
  stable: HomepageStable,
  simplified: HomepageSimplified,
  refined: HomepageRefined,
};

export const homepageVersionRegistry = homepageVersionMetadata.map((metadata) => ({
  ...metadata,
  Component: homepageVersionComponents[metadata.id],
})) satisfies readonly HomepageVersionRegistration[];

export function getHomepageVersion(value: string): HomepageVersionRegistration | null {
  const metadata = getHomepageVersionMetadata(value);
  if (!metadata) return null;
  return homepageVersionRegistry.find((version) => version.id === metadata.id) ?? null;
}

export function getLiveHomepageVersion(): HomepageVersionRegistration {
  const liveMetadata = getLiveHomepageVersionMetadata();
  const liveVersion = getHomepageVersion(liveMetadata.id) ?? getHomepageVersion(getStableHomepageVersionMetadata().id);
  if (!liveVersion || liveVersion.status === "draft") {
    throw new Error("Missing safe Homepage component for public route.");
  }
  return liveVersion;
}
