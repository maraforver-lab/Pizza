import { getHomepageVersion, getLiveHomepageVersion, type HomepageVersionId } from "@/lib/homepage-versions";

type HomepageRendererProps = {
  versionId?: HomepageVersionId;
};

export default function HomepageRenderer({ versionId }: HomepageRendererProps) {
  const version = versionId ? getHomepageVersion(versionId) : getLiveHomepageVersion();
  if (!version) {
    throw new Error(`Unknown Homepage version: ${versionId}`);
  }
  const Component = version.Component;

  return <Component />;
}
