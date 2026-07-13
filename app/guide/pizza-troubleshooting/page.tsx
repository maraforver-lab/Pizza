import type { Metadata } from "next";
import { PizzaTroubleshootingGuideClient } from "@/components/guide/PizzaTroubleshootingGuideClient";
import {
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
} from "@/lib/pizza-troubleshooting";
import { getSafeContextualReturnPath } from "@/lib/contextual-return";

export const metadata: Metadata = {
  title: "Pizza Troubleshooting Guide | DoughTools",
  description:
    "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
};

type TroubleshootingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PizzaTroubleshootingGuidePage({ searchParams }: TroubleshootingPageProps) {
  const params = await searchParams;
  const requestedTopic = firstParam(params?.topic);
  const activeTopicId = isPizzaTroubleshootingTopicId(requestedTopic) ? requestedTopic : undefined;
  const returnPath = getSafeDoughGuideReturnPath(params?.from);
  const contextualReturnPath = getSafeContextualReturnPath(params?.returnTo);

  return <PizzaTroubleshootingGuideClient activeTopicId={activeTopicId} returnPath={returnPath} contextualReturnPath={contextualReturnPath} />;
}
