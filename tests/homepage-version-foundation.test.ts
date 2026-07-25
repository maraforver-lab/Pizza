import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getHomepageVersionMetadata,
  getLiveHomepageVersionMetadata,
  HOMEPAGE_VERSION_IDS,
  homepageVersionMetadata,
  isHomepageVersionId,
} from "@/lib/homepage-version-metadata";
import { sitemapEntries } from "@/lib/seo-config";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Homepage version foundation", () => {
  it("registers stable live and simplified draft Homepage versions", () => {
    expect(HOMEPAGE_VERSION_IDS).toEqual(["stable", "simplified"]);
    expect(homepageVersionMetadata.map((version) => version.id)).toEqual(["stable", "simplified"]);
    expect(homepageVersionMetadata[0]).toMatchObject({
      id: "stable",
      name: "Current homepage",
      description: "The existing production Homepage.",
      status: "live",
      previewAvailable: true,
    });
    expect(homepageVersionMetadata[1]).toMatchObject({
      id: "simplified",
      name: "Simplified homepage",
      description: "A clearer Make versus Learn Homepage concept.",
      status: "draft",
      previewAvailable: true,
    });
    expect(homepageVersionMetadata.filter((version) => version.status === "live")).toHaveLength(1);
    expect(homepageVersionMetadata.filter((version) => version.status === "draft")).toHaveLength(1);
    expect(getLiveHomepageVersionMetadata().id).toBe("stable");
  });

  it("allowlists version IDs and rejects unknown IDs safely", () => {
    expect(isHomepageVersionId("stable")).toBe(true);
    expect(isHomepageVersionId("simplified")).toBe(true);
    expect(isHomepageVersionId("draft")).toBe(false);
    expect(isHomepageVersionId("../../../app/page")).toBe(false);
    expect(getHomepageVersionMetadata("stable")?.name).toBe("Current homepage");
    expect(getHomepageVersionMetadata("simplified")?.status).toBe("draft");
    expect(getHomepageVersionMetadata("unknown-version")).toBeNull();
  });

  it("keeps the public Homepage on the live registered stable component without public version selection", () => {
    const publicRoute = source("app", "page.tsx");
    const renderer = source("components", "homepage", "HomepageRenderer.tsx");
    const stable = source("components", "homepage", "HomepageStable.tsx");
    const simplified = source("components", "homepage", "HomepageSimplified.tsx");
    const registry = source("lib", "homepage-versions.tsx");

    expect(publicRoute).toContain("getLiveHomepageVersion()");
    expect(publicRoute).toContain("<HomepageRenderer versionId={liveVersion.id} />");
    expect(publicRoute).toContain("HomeCalculatorWorkspace");
    expect(publicRoute).toContain("calculatorViewFor");
    expect(registry).toContain("Component: homepageVersionComponents[metadata.id]");
    expect(registry).toContain("stable: HomepageStable");
    expect(registry).toContain("simplified: HomepageSimplified");
    expect(renderer).toContain("getLiveHomepageVersion()");
    expect(renderer).toContain("getHomepageVersion(versionId)");
    expect(stable).toContain("Better pizza");
    expect(stable).toContain("the oven.");
    expect(stable).toContain("Plan a pizza");
    expect(stable).toContain("<SiteFooter />");
    expect(stable).not.toContain("Homepage versions");
    expect(stable).not.toContain("Current homepage");
    expect(simplified).toContain("Make better pizza with one clear plan.");
    expect(publicRoute).not.toContain("Make better pizza with one clear plan.");
    expect([publicRoute, renderer, stable, simplified].join("\n")).not.toMatch(/localStorage|cookies\(|account_preferences|doughtools\.experienceLevel.*version/i);
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
    expect(adminPage).toContain("{homepageVersionRegistry.length} version");
    expect(adminPage).toContain("LIVE");
    expect(adminPage).toContain("{version.name}");
    expect(adminPage).toContain("{version.description}");
    expect(metadata).toContain("Current homepage");
    expect(metadata).toContain("The existing production Homepage.");
    expect(metadata).toContain("Simplified homepage");
    expect(metadata).toContain("A clearer Make versus Learn Homepage concept.");
    expect(adminPage).toContain("status.toUpperCase()");
    expect(adminPage).toContain("Preview");
    expect(adminPage).toContain("Preview ${version.name} Homepage version");
    expect(adminPage).toContain("/admin/homepage-preview/${version.id}");
    expect(adminPage).not.toMatch(/Publish|Restore|Retire|Delete|Duplicate|Edit/);
    expect(accountAdminEntry).toContain("if (!status?.isAdmin || status.role !== ADMIN_APP_ROLE) return null");
  });

  it("protects the stable preview route with Admin authorization, noindex metadata and safe unknown-ID handling", () => {
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
    const renderer = source("components", "homepage", "HomepageRenderer.tsx");
    const previewPage = source("app", "admin", "homepage-preview", "[version]", "page.tsx");

    expect([registry, renderer, previewPage].join("\n")).not.toMatch(
      /calculateDough|calculate.*Sauce|pizza-session|PizzaSession|session-storage|account_preferences|supabase|HomeCalculatorWorkspace/i,
    );
    expect(registry).not.toMatch(/database|featureFlag|localStorage|cookie|query/i);
  });
});
