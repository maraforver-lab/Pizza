import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getHomepageVersionMetadata,
  getLiveHomepageVersionMetadata,
  getStableHomepageVersionMetadata,
  HOMEPAGE_VERSION_IDS,
  homepageVersionMetadata,
  isHomepageVersionId,
} from "@/lib/homepage-version-metadata";
import { homepageVersionCountLabel } from "@/lib/homepage-version-labels";
import { sitemapEntries } from "@/lib/seo-config";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Homepage version foundation", () => {
  it("registers refined live, simplified draft and stable archived Homepage versions", () => {
    expect(HOMEPAGE_VERSION_IDS).toEqual(["stable", "simplified", "refined"]);
    expect(homepageVersionMetadata.map((version) => version.id)).toEqual(["stable", "simplified", "refined"]);
    expect(homepageVersionMetadata[0]).toMatchObject({
      id: "stable",
      name: "Current homepage",
      description: "The previous production Homepage, preserved as a rollback version.",
      status: "archived",
      previewAvailable: true,
    });
    expect(homepageVersionMetadata[1]).toMatchObject({
      id: "simplified",
      name: "Simplified homepage",
      description: "A clearer Make versus Learn Homepage concept.",
      status: "draft",
      previewAvailable: true,
    });
    expect(homepageVersionMetadata[2]).toMatchObject({
      id: "refined",
      name: "Refined homepage",
      description: "A more image-led and compact refinement of the simplified Homepage.",
      status: "live",
      previewAvailable: true,
    });
    expect(homepageVersionMetadata.filter((version) => version.status === "live")).toHaveLength(1);
    expect(homepageVersionMetadata.filter((version) => version.status === "draft")).toHaveLength(1);
    expect(homepageVersionMetadata.filter((version) => version.status === "archived")).toHaveLength(1);
    expect(getLiveHomepageVersionMetadata().id).toBe("refined");
    expect(getStableHomepageVersionMetadata().id).toBe("stable");
  });

  it("allowlists version IDs and rejects unknown IDs safely", () => {
    expect(isHomepageVersionId("stable")).toBe(true);
    expect(isHomepageVersionId("simplified")).toBe(true);
    expect(isHomepageVersionId("refined")).toBe(true);
    expect(isHomepageVersionId("draft")).toBe(false);
    expect(isHomepageVersionId("../../../app/page")).toBe(false);
    expect(getHomepageVersionMetadata("stable")?.name).toBe("Current homepage");
    expect(getHomepageVersionMetadata("stable")?.status).toBe("archived");
    expect(getHomepageVersionMetadata("simplified")?.status).toBe("draft");
    expect(getHomepageVersionMetadata("refined")).toMatchObject({ name: "Refined homepage", status: "live" });
    expect(getHomepageVersionMetadata("unknown-version")).toBeNull();
  });

  it("keeps the public Homepage on the live registered refined component without public version selection", () => {
    const publicRoute = source("app", "page.tsx");
    const renderer = source("components", "homepage", "HomepageRenderer.tsx");
    const stable = source("components", "homepage", "HomepageStable.tsx");
    const simplified = source("components", "homepage", "HomepageSimplified.tsx");
    const refined = source("components", "homepage", "HomepageRefined.tsx");
    const registry = source("lib", "homepage-versions.tsx");

    expect(publicRoute).toContain("getLiveHomepageVersion()");
    expect(publicRoute).toContain("<HomepageRenderer versionId={liveVersion.id} />");
    expect(publicRoute).toContain("HomeCalculatorWorkspace");
    expect(publicRoute).toContain("calculatorViewFor");
    expect(registry).toContain("Component: homepageVersionComponents[metadata.id]");
    expect(registry).toContain("stable: HomepageStable");
    expect(registry).toContain("simplified: HomepageSimplified");
    expect(registry).toContain("refined: HomepageRefined");
    expect(renderer).toContain("getLiveHomepageVersion()");
    expect(renderer).toContain("getHomepageVersion(versionId)");
    expect(stable).toContain("Better pizza");
    expect(stable).toContain("the oven.");
    expect(stable).toContain("Plan a pizza");
    expect(stable).toContain("<SiteFooter />");
    expect(stable).not.toContain("Homepage versions");
    expect(stable).not.toContain("Current homepage");
    expect(simplified).toContain("Make better pizza with one clear plan.");
    expect(refined).toContain("homepage-hero-heading");
    expect(refined).not.toContain("homepage-refined");
    expect(refined).toContain("Make better pizza with one clear plan.");
    expect(refined).toContain("Plan a pizza");
    expect(refined).toContain("Explore guides");
    expect(publicRoute).not.toContain("Make better pizza with one clear plan.");
    expect(publicRoute).not.toContain("Refined homepage");
    expect([publicRoute, renderer, stable, simplified, refined].join("\n")).not.toMatch(/localStorage|cookies\(|account_preferences|doughtools\.experienceLevel.*version/i);
    expect(publicRoute).not.toMatch(/searchParams.*version|params\.version|homepage-preview/i);
  });

  it("shows the Homepage versions admin entry only inside the protected Admin tools area", () => {
    const adminLayout = source("app", "admin", "layout.tsx");
    const adminPage = source("app", "admin", "page.tsx");
    const accountAdminEntry = source("components", "account", "AccountAdminEntryCard.tsx");
    const metadata = source("lib", "homepage-version-metadata.ts");

    expect(adminLayout).toContain("await requireAdmin()");
    expect(adminLayout).toContain("noindexMetadata");
    expect(adminPage).toContain("Homepage versions");
    expect(adminPage).toContain("Preview and manage Homepage presentation versions without changing Pizza Plan or calculation logic.");
    expect(adminPage).toContain("homepageVersionCountLabel(homepageVersionRegistry.length)");
    expect(adminPage).toContain("homepageVersionStatusLabel(version.status)");
    expect(adminPage).toContain("live: 0");
    expect(adminPage).toContain("draft: 1");
    expect(adminPage).toContain("archived: 2");
    expect(adminPage).toContain("{version.name}");
    expect(adminPage).toContain("{version.description}");
    expect(metadata).toContain("Current homepage");
    expect(metadata).toContain("The previous production Homepage, preserved as a rollback version.");
    expect(metadata).toContain("Simplified homepage");
    expect(metadata).toContain("A clearer Make versus Learn Homepage concept.");
    expect(metadata).toContain("Refined homepage");
    expect(metadata).toContain("A more image-led and compact refinement of the simplified Homepage.");
    expect(adminPage).toContain("homepageVersionsForDisplay");
    expect(adminPage).toContain("homepageVersionStatusOrder");
    expect(adminPage).toContain("status.toUpperCase()");
    expect(adminPage).toContain("Preview");
    expect(adminPage).toContain("Preview ${version.name} Homepage version");
    expect(adminPage).toContain("/admin/homepage-preview/${version.id}");
    expect(adminPage).not.toMatch(/Publish|Restore|Retire|Delete|Duplicate|Edit/);
    expect(accountAdminEntry).toContain("if (!status?.isAdmin || status.role !== ADMIN_APP_ROLE) return null");
  });

  it("formats the Homepage version count with correct singular and plural grammar", () => {
    expect(homepageVersionCountLabel(1)).toBe("1 version");
    expect(homepageVersionCountLabel(2)).toBe("2 versions");
    expect(homepageVersionCountLabel(3)).toBe("3 versions");
  });

  it("protects all Homepage preview routes with Admin authorization, noindex metadata and safe unknown-ID handling", () => {
    const adminLayout = source("app", "admin", "layout.tsx");
    const previewPage = source("app", "admin", "homepage-preview", "[version]", "page.tsx");

    expect(adminLayout).toContain("await requireAdmin()");
    expect(previewPage).toContain("noindexMetadata");
    expect(previewPage).toContain("Homepage Preview | Admin | DoughTools");
    expect(previewPage).toContain("getHomepageVersion(requestedVersion)");
    expect(previewPage).toContain("if (!version || !version.previewAvailable)");
    expect(previewPage).toContain("notFound()");
    expect(previewPage).toContain("Admin preview — not the public Homepage");
    expect(previewPage).toContain("Status: {version.status.toUpperCase()}");
    expect(previewPage).toContain("Back to Homepage versions");
    expect(previewPage).toContain("<HomepageRenderer versionId={version.id} />");
  });

  it("keeps preview routes out of sitemap, public navigation and footer discovery", () => {
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app", ALLOW_INDEXING: "true" }).map((entry) => entry.url);
    const navigation = source("lib", "navigation.ts");
    const globalNavigation = source("components", "GlobalToolNavigation.tsx");
    const footer = source("components", "SiteFooter.tsx");

    expect(sitemapUrls.some((url) => url.includes("/admin/homepage-preview"))).toBe(false);
    expect(navigation).not.toContain("homepage-preview");
    expect(globalNavigation).not.toContain("homepage-preview");
    expect(footer).not.toContain("homepage-preview");
    expect([navigation, globalNavigation, footer].join("\n")).not.toContain("Homepage versions");
  });

  it("keeps Homepage version management separate from Pizza Plan and calculation logic", () => {
    const registry = source("lib", "homepage-versions.tsx");
    const metadata = source("lib", "homepage-version-metadata.ts");
    const renderer = source("components", "homepage", "HomepageRenderer.tsx");
    const previewPage = source("app", "admin", "homepage-preview", "[version]", "page.tsx");

    expect(metadata).toContain("getStableHomepageVersionMetadata()");
    expect(metadata).toContain("return getStableHomepageVersionMetadata()");
    expect(registry).toContain("getStableHomepageVersionMetadata");
    expect(registry).toContain('liveVersion.status === "draft"');
    expect([registry, renderer, previewPage].join("\n")).not.toMatch(
      /calculateDough|calculate.*Sauce|pizza-session|PizzaSession|session-storage|account_preferences|supabase|HomeCalculatorWorkspace/i,
    );
    expect(registry).not.toMatch(/database|featureFlag|localStorage|cookie|query/i);
  });
});
