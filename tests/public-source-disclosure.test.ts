import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { publicPizzaSauceSources, publicToppingBalanceSources } from "@/lib/public-research-sources";
import { trustPages } from "@/lib/trust-pages";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("public source disclosure", () => {
  it("keeps internal research documents out of public page source", () => {
    const publicFiles = ["app/sauce/page.tsx", "components/toppings/ToppingBalanceLab.tsx"];

    for (const file of publicFiles) {
      const text = source(file);

      expect(text).not.toContain("docs/research/");
      expect(text).not.toMatch(/C:\\|C:\/|\/Users\/|\/home\/|localhost/);
    }
  });

  it("keeps internal research documents available for maintainers", () => {
    expect(existsSync(join(process.cwd(), "docs/research/pizza-sauce-sources.md"))).toBe(true);
    expect(existsSync(join(process.cwd(), "docs/research/topping-balance-sources.md"))).toBe(true);
  });

  it("exposes public methodology anchors with human source names", () => {
    const methodology = trustPages.methodology.sections;
    const sauce = methodology.find((section) => section.id === "pizza-sauce");
    const toppings = methodology.find((section) => section.id === "topping-balance");

    expect(sauce?.sources).toBe(publicPizzaSauceSources);
    expect(toppings?.sources).toBe(publicToppingBalanceSources);
    expect(sauce?.sources?.map((sourceItem) => sourceItem.title)).toContain("AVPN International Regulations");
    expect(toppings?.sources?.map((sourceItem) => sourceItem.organization)).toContain("King Arthur Baking");
  });

  it("renders methodology sections as linkable public source cards", () => {
    const layout = source("components/TrustPageLayout.tsx");

    expect(layout).toContain("id={section.id}");
    expect(layout).toContain("sourceCategoryLabel[source.category]");
    expect(layout).toContain("Open public source");
    expect(layout).toContain('target="_blank"');
    expect(layout).toContain('rel="noreferrer"');
  });
});
