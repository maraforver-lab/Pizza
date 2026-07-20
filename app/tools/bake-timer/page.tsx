import type { Metadata } from "next";
import StandaloneBakeTimerTool from "@/components/tools/StandaloneBakeTimerTool";
import { metadataForRoute } from "@/lib/seo-config";

export const metadata: Metadata = metadataForRoute("/tools/bake-timer");

export default function StandaloneBakeTimerPage() {
  return <StandaloneBakeTimerTool />;
}
