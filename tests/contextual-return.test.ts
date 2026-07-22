import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildContextualReturnHref,
  contextualReturnLabelFor,
  getSafeContextualReturnPath,
} from "@/lib/contextual-return";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("contextual return navigation", () => {
  it("accepts only the approved Kitchen Mode return path", () => {
    expect(getSafeContextualReturnPath("/session/kitchen")).toBe("/session/kitchen");
    expect(getSafeContextualReturnPath(encodeURIComponent("/session/kitchen"))).toBe("/session/kitchen");
    expect(getSafeContextualReturnPath("/session/timeline")).toBeNull();
    expect(getSafeContextualReturnPath("/account")).toBeNull();
    expect(getSafeContextualReturnPath("https://evil.example/session/kitchen")).toBeNull();
    expect(getSafeContextualReturnPath("//evil.example/session/kitchen")).toBeNull();
    expect(getSafeContextualReturnPath("javascript:alert(1)")).toBeNull();
    expect(getSafeContextualReturnPath("%")).toBeNull();
  });

  it("adds return context without moving anchors or exposing session data", () => {
    expect(buildContextualReturnHref("/guide/pizza-troubleshooting#baking")).toBe(
      "/guide/pizza-troubleshooting?returnTo=%2Fsession%2Fkitchen&returnLabel=Back+to+Kitchen#baking",
    );
    expect(buildContextualReturnHref("/guides/dough?step=mix-dough&from=%2Fsession%2Fkitchen")).toBe(
      "/guides/dough?step=mix-dough&from=%2Fsession%2Fkitchen&returnTo=%2Fsession%2Fkitchen&returnLabel=Back+to+Kitchen",
    );
    expect(buildContextualReturnHref("https://evil.example")).toBe("https://evil.example");
    expect(buildContextualReturnHref("//evil.example")).toBe("//evil.example");
    expect(buildContextualReturnHref("/guide/pizza-troubleshooting#baking")).not.toContain("sessionId");
  });

  it("renders a fixed Back to Kitchen destination for valid context only", () => {
    const component = source("components/navigation/ContextualReturn.tsx");
    const helper = source("lib/contextual-return.ts");
    const doughGuide = source("components/guide/DoughGuidePageClient.tsx");
    const troubleshootingPage = source("app/guide/pizza-troubleshooting/page.tsx");
    const troubleshootingClient = source("components/guide/PizzaTroubleshootingGuideClient.tsx");

    expect(contextualReturnLabelFor("/session/kitchen")).toBe("Back to Kitchen");
    expect(component).toContain("getSafeContextualReturnPath(returnTo)");
    expect(helper).toContain("Return to your active step");
    expect(component).toContain("href={safeReturnTo}");
    expect(doughGuide).toContain('<ContextualReturn returnTo={searchParams.get("returnTo")} />');
    expect(doughGuide).toContain("!contextualReturnPath && sessionReturnPath");
    expect(troubleshootingPage).toContain("getSafeContextualReturnPath(params?.returnTo)");
    expect(troubleshootingClient).toContain("<ContextualReturn returnTo={contextualReturnPath} />");
  });
});
