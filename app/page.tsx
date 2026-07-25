import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageRenderer from "@/components/homepage/HomepageRenderer";
import { getLiveHomepageVersion } from "@/lib/homepage-versions";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry";

  return "full";
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  const liveVersion = getLiveHomepageVersion();

  return <HomepageRenderer versionId={liveVersion.id} />;
}
