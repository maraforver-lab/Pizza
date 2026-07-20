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
    expect(PUBLIC_THEME_DEFINITIONS.filter((theme) => theme.id !== "default").every((theme) => theme.designStatus === "foundation")).toBe(true);
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

  it("documents the Patch 445B visual audit boundary and later theme roadmap", () => {
    const doc = source("docs/audits/patch-445a-seven-theme-architecture.md");

    expect(doc).toContain("Patch 445B should be an audit/design specification only");
    expect(doc).toContain("Patch 445C: Valentine final design");
    expect(doc).toContain("Patch 445I: cross-theme consistency");
    expect(doc).toContain("Patch 446 Sound-Theme Integration Point");
    expect(doc).toContain("Patch 445A does not apply the migration and does not deploy");
  });
});
