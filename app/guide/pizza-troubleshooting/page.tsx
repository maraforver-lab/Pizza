import type { Metadata } from "next";
import { PizzaTroubleshootingGuideClient } from "@/components/guide/PizzaTroubleshootingGuideClient";
import {
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
} from "@/lib/pizza-troubleshooting";
import { getSafeContextualReturnPath } from "@/lib/contextual-return";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/guide/pizza-troubleshooting");

type TroubleshootingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PizzaTroubleshootingGuidePage({ searchParams }: TroubleshootingPageProps) {
  const params = await searchParams;
  const requestedTopic = firstParam(params?.problem) ?? firstParam(params?.topic);
  const activeTopicId = isPizzaTroubleshootingTopicId(requestedTopic) ? requestedTopic : undefined;
  const returnPath = getSafeDoughGuideReturnPath(params?.from);
  const contextualReturnPath = getSafeContextualReturnPath(params?.returnTo);

  return <PizzaTroubleshootingGuideClient activeTopicId={activeTopicId} returnPath={returnPath} contextualReturnPath={contextualReturnPath} />;
}
