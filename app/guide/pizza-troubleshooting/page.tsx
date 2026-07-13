import type { Metadata } from "next";
import { PizzaTroubleshootingGuideClient } from "@/components/guide/PizzaTroubleshootingGuideClient";
import {
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
} from "@/lib/pizza-troubleshooting";
import { getSafeContextualReturnPath } from "@/lib/contextual-return";

export const metadata: Metadata = {
  title: "Pizza Troubleshooting Guide: Dough, Stretching, Baking and Toppings | DoughTools",
  description:
    "Diagnose common pizza problems by symptom, find immediate fixes, understand likely causes, and learn what to change on your next bake.",
};

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
