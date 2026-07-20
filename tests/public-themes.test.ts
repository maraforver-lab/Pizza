import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PUBLIC_THEME_ID,
  PUBLIC_THEME_DEFINITIONS,
  PUBLIC_THEME_IDS,
  deriveThemeCampaignStatus,
  normalizePublicThemeId,
  publicThemeDefinitionFor,
  publicThemeDefinitionIsSafe,
} from "@/lib/public-themes";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function channelToLinear(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const [red, green, blue] = hex
    .replace("#", "")
    .match(/../g)!
    .map((part) => channelToLinear(Number.parseInt(part, 16)));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Patch 445A public theme architecture", () => {
  it("defines exactly the approved seven public theme IDs", () => {
    expect(PUBLIC_THEME_IDS).toEqual([
      "default",
      "valentine",
      "easter",
      "summer",
      "harvest",
      "halloween",
      "christmas",
    ]);
    expect(new Set(PUBLIC_THEME_IDS).size).toBe(7);
    expect(DEFAULT_PUBLIC_THEME_ID).toBe("default");
  });

  it("normalizes unknown or competing theme IDs safely to Default", () => {
    expect(normalizePublicThemeId("halloween")).toBe("halloween");
    expect(normalizePublicThemeId("valentines")).toBe("default");
    expect(normalizePublicThemeId("fall")).toBe("default");
    expect(normalizePublicThemeId("xmas")).toBe("default");
    expect(normalizePublicThemeId(undefined)).toBe("default");
    expect(publicThemeDefinitionFor("spring").id).toBe("default");
  });

  it("keeps theme definitions safe, allowlisted and code-owned", () => {
    expect(PUBLIC_THEME_DEFINITIONS).toHaveLength(7);
    for (const theme of PUBLIC_THEME_DEFINITIONS) {
      expect(theme.rootClassName).toBe(`theme-${theme.id}`);
      expect(theme.previewSwatches.length).toBeGreaterThanOrEqual(3);
      expect(theme.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(publicThemeDefinitionIsSafe(theme)).toBe(true);
      expect(JSON.stringify(theme)).not.toMatch(/<[^>]+>|javascript:|https?:\/\//i);
    }
    expect(publicThemeDefinitionFor("default").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("valentine").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("easter").designStatus).toBe("final");
    expect(PUBLIC_THEME_DEFINITIONS
      .filter((theme) => theme.id !== "default" && theme.id !== "valentine" && theme.id !== "easter")
      .every((theme) => theme.designStatus === "foundation")).toBe(true);
  });

  it("keeps the Valentine registry values approved by Patch 445B and Patch 445C", () => {
    const valentine = publicThemeDefinitionFor("valentine");

    expect(valentine).toMatchObject({
      id: "valentine",
      rootClassName: "theme-valentine",
      themeColor: "#FFF3F1",
      designStatus: "final",
      shortDescription: "Warm rose cream for shared pizza nights.",
    });
    expect(valentine.description).toContain("sharing pizza");
    expect(valentine.description).not.toMatch(/romantic|couple|dating|heart/i);
    expect(valentine.previewSwatches).toEqual(["#FFF3F1", "#FFFBFA", "#D94238", "#7A2D2C"]);
  });

  it("finalizes only the Easter registry values approved by Patch 445B", () => {
    const easter = publicThemeDefinitionFor("easter");

    expect(easter).toMatchObject({
      id: "easter",
      rootClassName: "theme-easter",
      themeColor: "#FFF9DE",
      designStatus: "final",
      shortDescription: "Fresh spring warmth with clean green accents.",
    });
    expect(easter.description).toContain("non-religious");
    expect(easter.description).toContain("practical");
    expect(easter.description).not.toMatch(/church|cross|religious symbol|egg hunt|cartoon/i);
    expect(easter.previewSwatches).toEqual(["#FFF9DE", "#FFFDF5", "#5F8F3A", "#E0B84A"]);
    expect(publicThemeDefinitionFor("summer").designStatus).toBe("foundation");
    expect(publicThemeDefinitionFor("harvest").designStatus).toBe("foundation");
    expect(publicThemeDefinitionFor("halloween").designStatus).toBe("foundation");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("foundation");
  });

  it("derives campaign status with inclusive start and exclusive end semantics", () => {
    const now = new Date("2026-10-31T18:00:00.000Z");
    expect(deriveThemeCampaignStatus({ enabled: false, startsAt: now.toISOString(), endsAt: null }, now)).toBe("disabled");
    expect(deriveThemeCampaignStatus({ enabled: true, startsAt: "2026-10-31T18:00:00.000Z", endsAt: null }, now)).toBe("active");
    expect(deriveThemeCampaignStatus({ enabled: true, startsAt: "2026-10-31T18:01:00.000Z", endsAt: null }, now)).toBe("scheduled");
    expect(deriveThemeCampaignStatus({ enabled: true, startsAt: "2026-10-31T17:00:00.000Z", endsAt: "2026-10-31T18:00:00.000Z" }, now)).toBe("expired");
    expect(deriveThemeCampaignStatus({ enabled: true, startsAt: "2026-10-31T17:00:00.000Z", endsAt: "2026-10-31T18:00:01.000Z" }, now)).toBe("active");
  });

  it("adds a restricted theme_campaigns migration without arbitrary design payloads or private-table changes", () => {
    const migration = source("supabase/migrations/20260721120000_create_public_theme_campaigns.sql");

    expect(migration).toContain("create table if not exists public.theme_campaigns");
    expect(migration).toContain("theme_campaigns_theme_id_check");
    for (const id of PUBLIC_THEME_IDS) {
      expect(migration).toContain(`'${id}'`);
    }
    expect(migration).toContain("alter table public.theme_campaigns enable row level security");
    expect(migration).toContain("revoke all on table public.theme_campaigns from anon");
    expect(migration).toContain("revoke all on table public.theme_campaigns from authenticated");
    expect(migration).toContain("ends_at is null or ends_at > starts_at");
    expect(migration).toContain("version integer not null default 1");
    expect(migration).toContain("created_by uuid not null references auth.users(id)");
    expect(migration).toContain("updated_by uuid not null references auth.users(id)");
    expect(migration).not.toMatch(/css|html|javascript|tailwind|image_url|audio_url|jsonb/i);
    expect(migration).not.toMatch(/pizza_sessions|party_orders|account_preferences|storage\./i);
  });

  it("provides server-side resolver and cache invalidation with Default failure fallback", () => {
    const resolver = source("lib/public-theme-campaigns.ts");
    const layout = source("app/layout.tsx");

    expect(resolver).toContain("getActivePublicTheme");
    expect(resolver).toContain("get_active_public_theme");
    expect(resolver).toContain("DEFAULT_PUBLIC_THEME_ID");
    expect(resolver).toContain("revalidateTag");
    expect(resolver).toContain("revalidate: 60");
    expect(layout).toContain("data-public-theme={theme.id}");
    expect(layout).toContain("theme.rootClassName");
    expect(layout).toContain("generateViewport");
    expect(layout).toContain("themeColor: theme.themeColor");
  });

  it("exposes protected admin theme APIs with authoritative admin guards and safe error contracts", () => {
    const routes = [
      "app/api/admin/themes/route.ts",
      "app/api/admin/themes/[id]/route.ts",
      "app/api/admin/themes/activate-default/route.ts",
      "lib/admin-theme-api.ts",
    ].map(source).join("\n");

    expect(routes).toContain("requireAdminForRequest(request)");
    expect(routes).toContain("adminGuardErrorResponse");
    expect(routes).toContain("admin_list_theme_campaigns");
    expect(routes).toContain("admin_create_theme_campaign");
    expect(routes).toContain("admin_update_theme_campaign");
    expect(routes).toContain("admin_delete_theme_campaign");
    expect(routes).toContain("admin_activate_default_theme");
    expect(routes).toContain("revalidatePublicThemeCache");
    expect(routes).toContain("Unknown public theme");
    expect(routes).toContain("stale: true");
    expect(routes).not.toMatch(/auth\.admin|service_role|pizza_sessions|party_orders|account_preferences|created_by.*json|updated_by.*json/i);
  });

  it("adds the protected Appearance UI without exposing private data or public navigation", () => {
    const adminPage = source("app/admin/page.tsx");
    const appearancePage = source("app/admin/appearance/page.tsx");
    const appearanceClient = source("components/admin/AdminAppearanceClient.tsx");
    const seo = source("lib/seo-config.ts");

    expect(adminPage).toContain("href: \"/admin/appearance\"");
    expect(appearancePage).toContain("await requireAdmin()");
    expect(appearancePage).toContain("AdminAppearanceClient");
    expect(appearanceClient).toContain("Preview mode:");
    expect(appearanceClient).toContain("Exit preview");
    expect(appearanceClient).toContain("Times shown in");
    expect(appearanceClient).toContain("Foundation design");
    expect(appearanceClient).toContain("window.confirm");
    expect(appearanceClient).toContain("Save schedule");
    expect(appearanceClient).not.toMatch(/localStorage|sessionStorage|auth\.admin|pizza_sessions|party_orders|account_preferences/i);
    expect(seo).toContain("\"/admin/appearance\"");
  });

  it("adds a safe CSS variable foundation for every non-default theme without replacing workflow semantics", () => {
    const css = source("app/globals.css");

    for (const id of PUBLIC_THEME_IDS) {
      if (id === "default") continue;
      expect(css).toContain(`html[data-public-theme="${id}"]`);
    }
    expect(css).toContain("--theme-page-background");
    expect(css).toContain("--theme-surface");
    expect(css).toContain("--theme-border");
    expect(css).not.toMatch(/animation:\s*.*theme|@keyframes\s+.*theme/i);
    expect(css).not.toContain("html[data-public-theme]:not([data-public-theme=\"default\"]) .text-tomato");
  });

  it("implements the final Valentine CSS tokens without changing semantic or timer urgency colors", () => {
    const css = source("app/globals.css");
    const valentineBlock = css.match(/html\[data-public-theme="valentine"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(valentineBlock).toContain("--theme-page-background: #fff3f1");
    expect(valentineBlock).toContain("--theme-page-background-secondary: #f7e1dd");
    expect(valentineBlock).toContain("--theme-surface: #fffbfa");
    expect(valentineBlock).toContain("--theme-surface-muted: #f7e1dd");
    expect(valentineBlock).toContain("--theme-surface-elevated: #fffbfa");
    expect(valentineBlock).toContain("--theme-border: #ebc8c1");
    expect(valentineBlock).toContain("--theme-border-strong: #d9aaa0");
    expect(valentineBlock).toContain("--theme-accent: #d94238");
    expect(valentineBlock).toContain("--theme-accent-hover: #c7352e");
    expect(valentineBlock).toContain("--theme-accent-secondary: #7a2d2c");
    expect(valentineBlock).toContain("--theme-header-surface: rgba(255, 243, 241, .96)");
    expect(valentineBlock).toContain("--theme-header-border: rgba(122, 45, 44, .14)");
    expect(css).toContain('html[data-public-theme="valentine"] body');
    expect(css).toContain("radial-gradient(circle at 10% 0%, var(--theme-decorative), transparent 24rem)");
    expect(css).not.toMatch(/html\[data-public-theme="valentine"\][^{]*(?:\.text-tomato|\.bg-tomato|dt-bake-timer)/);
    expect(css).not.toMatch(/html\[data-public-theme="valentine"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="valentine"\][\s\S]*--dt-action-danger/);
  });

  it("implements the final Easter CSS tokens without low-contrast pastel text or semantic color replacement", () => {
    const css = source("app/globals.css");
    const easterBlock = css.match(/html\[data-public-theme="easter"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(easterBlock).toContain("--theme-page-background: #fff9de");
    expect(easterBlock).toContain("--theme-page-background-secondary: #eef5dc");
    expect(easterBlock).toContain("--theme-surface: #fffdf5");
    expect(easterBlock).toContain("--theme-surface-muted: #eef5dc");
    expect(easterBlock).toContain("--theme-surface-elevated: #fffdf5");
    expect(easterBlock).toContain("--theme-border: #d8e4b8");
    expect(easterBlock).toContain("--theme-border-strong: #b7c98a");
    expect(easterBlock).toContain("--theme-accent: #5f8f3a");
    expect(easterBlock).toContain("--theme-accent-hover: #4f7c30");
    expect(easterBlock).toContain("--theme-accent-secondary: #e0b84a");
    expect(easterBlock).toContain("--theme-header-surface: rgba(255, 249, 222, .96)");
    expect(easterBlock).toContain("--theme-header-border: rgba(95, 143, 58, .16)");
    expect(css).toContain('html[data-public-theme="easter"] body');
    expect(css).toContain("radial-gradient(ellipse at 12% 0%, var(--theme-decorative), transparent 24rem)");
    expect(css).not.toMatch(/html\[data-public-theme="easter"\][^{]*(?:\.text-leaf|\.bg-leaf|dt-bake-timer)/);
    expect(css).not.toMatch(/html\[data-public-theme="easter"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="easter"\][\s\S]*--dt-action-danger/);
  });

  it("keeps Valentine readable by using Ink and muted text over final surfaces", () => {
    for (const surface of ["#FFF3F1", "#FFFBFA", "#F7E1DD"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFFBFA")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#7A2D2C", "#FFF3F1")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps Easter readable by using Ink and muted text over final surfaces", () => {
    for (const surface of ["#FFF9DE", "#FFFDF5", "#EEF5DC"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFFDF5")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#4F7C30", "#FFF9DE")).toBeGreaterThanOrEqual(4.5);
  });

  it("documents the Patch 445B visual audit boundary and later theme roadmap", () => {
    const doc = source("docs/audits/patch-445a-seven-theme-architecture.md");

    expect(doc).toContain("Patch 445B should be an audit/design specification only");
    expect(doc).toContain("Patch 445C: Valentine final design");
    expect(doc).toContain("Patch 445I: cross-theme consistency");
    expect(doc).toContain("Patch 446 Sound-Theme Integration Point");
    expect(doc).toContain("Patch 445A does not apply the migration and does not deploy");
  });
});
