import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { productUpdates } from "@/lib/product-updates";
import { metadataForRoute } from "@/lib/seo-config";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("branded Updates empty state", () => {
  it("keeps the Updates route as an intentional empty release center", () => {
    const page = source("app/updates/page.tsx");

    expect(productUpdates).toEqual([]);
    expect(page).toContain("Product updates, when they are ready to share.");
    expect(page).toContain("No public updates are published yet.");
    expect(page).toContain("0 published updates");
    expect(page).toContain("<SiteFooter />");
    expect(page).not.toContain("Latest update");
    expect(page).not.toContain("Release history");
    expect(page).not.toContain("visiblePatchHistory");
    expect(page).not.toContain("@/lib/changelog");
    expect(page).not.toMatch(/Version 2\.0|coming soon|stay tuned|major update on the way/i);
  });

  it("uses a compact image-free header instead of reusing the Homepage hero", () => {
    const page = source("app/updates/page.tsx");
    const updatesData = source("lib/product-updates.ts");

    expect(page).not.toContain("next/image");
    expect(page).not.toContain("<Image");
    expect(page).not.toContain("updatesHeroImage");
    expect(page).not.toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(page).not.toContain("priority");
    expect(updatesData).not.toContain("updatesHeroImage");
    expect(updatesData).not.toContain("/images/homepage/doughtools-hero-desktop.webp");
  });

  it("keeps SEO positioning credible without fake release claims", () => {
    const metadata = metadataForRoute("/updates");

    expect(metadata.title).toBe("Updates | DoughTools");
    expect(metadata.description).toContain("future home");
    expect(metadata.description).toContain("release notes");
    expect(metadata.description).not.toMatch(/recent|latest|new features|coming soon|version/i);
  });
});
