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

function cssVariablesForBlock(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`${escapedSelector}\\s*{(?<body>[^}]+)}`))?.groups?.body ?? "";
  const variables = new Map<string, string>();

  for (const match of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    variables.set(match[1], match[2].trim());
  }

  return variables;
}

function effectiveThemeVariables(css: string, themeId: string) {
  const root = cssVariablesForBlock(css, ":root");
  if (themeId === "default") return root;

  const themed = cssVariablesForBlock(css, `html[data-public-theme="${themeId}"]`);
  return new Map([...root, ...themed]);
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
    expect(publicThemeDefinitionFor("summer").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("harvest").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("halloween").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("final");
    expect(PUBLIC_THEME_DEFINITIONS.every((theme) => theme.designStatus === "final")).toBe(true);
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
    expect(publicThemeDefinitionFor("summer").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("harvest").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("halloween").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("final");
  });

  it("finalizes only the Summer registry values approved by Patch 445B", () => {
    const summer = publicThemeDefinitionFor("summer");

    expect(summer).toMatchObject({
      id: "summer",
      rootClassName: "theme-summer",
      themeColor: "#FFF4D8",
      designStatus: "final",
      shortDescription: "Sunlit terrace warmth with readable teal accents.",
    });
    expect(summer.description).toContain("Mediterranean terrace");
    expect(summer.description).toContain("outdoor-readable");
    expect(summer.description).toContain("tile rhythm");
    expect(summer.description).not.toMatch(/beach|palm|umbrella|cocktail|vacation/i);
    expect(summer.previewSwatches).toEqual(["#FFF4D8", "#FFF9EC", "#D88A24", "#126D7A"]);
    expect(publicThemeDefinitionFor("valentine").themeColor).toBe("#FFF3F1");
    expect(publicThemeDefinitionFor("easter").themeColor).toBe("#FFF9DE");
    expect(publicThemeDefinitionFor("harvest").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("halloween").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("final");
  });

  it("finalizes only the Harvest registry values approved by Patch 445B", () => {
    const harvest = publicThemeDefinitionFor("harvest");

    expect(harvest).toMatchObject({
      id: "harvest",
      rootClassName: "theme-harvest",
      themeColor: "#FFF0DC",
      designStatus: "final",
      shortDescription: "Warm grain, flour and ingredient craft.",
    });
    expect(harvest.description).toContain("ingredient-focused");
    expect(harvest.description).toContain("grain");
    expect(harvest.description).toContain("flour");
    expect(harvest.description).not.toMatch(/halloween|spooky|pumpkin|ghost|bat|night/i);
    expect(harvest.previewSwatches).toEqual(["#FFF0DC", "#FFF9F1", "#B96324", "#65723A"]);
    expect(publicThemeDefinitionFor("valentine").themeColor).toBe("#FFF3F1");
    expect(publicThemeDefinitionFor("easter").themeColor).toBe("#FFF9DE");
    expect(publicThemeDefinitionFor("summer").themeColor).toBe("#FFF4D8");
    expect(publicThemeDefinitionFor("halloween").designStatus).toBe("final");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("final");
  });

  it("finalizes only the Halloween registry values approved by Patch 445B", () => {
    const halloween = publicThemeDefinitionFor("halloween");

    expect(halloween).toMatchObject({
      id: "halloween",
      rootClassName: "theme-halloween",
      themeColor: "#241A16",
      designStatus: "final",
      shortDescription: "Warm night atmosphere with restrained ember accents.",
    });
    expect(halloween.description).toContain("light workflow surfaces");
    expect(halloween.description).toContain("warm night arcs");
    expect(halloween.description).toContain("muted purple");
    expect(halloween.description).not.toMatch(/gore|horror|jump|strobe|ghost|bat|skull|blood/i);
    expect(halloween.previewSwatches).toEqual(["#241A16", "#FFF8EF", "#E96F24", "#5B3A6B"]);
    expect(publicThemeDefinitionFor("valentine").themeColor).toBe("#FFF3F1");
    expect(publicThemeDefinitionFor("easter").themeColor).toBe("#FFF9DE");
    expect(publicThemeDefinitionFor("summer").themeColor).toBe("#FFF4D8");
    expect(publicThemeDefinitionFor("harvest").themeColor).toBe("#FFF0DC");
    expect(publicThemeDefinitionFor("christmas").designStatus).toBe("final");
  });

  it("finalizes only the Christmas registry values approved by Patch 445B", () => {
    const christmas = publicThemeDefinitionFor("christmas");

    expect(christmas).toMatchObject({
      id: "christmas",
      rootClassName: "theme-christmas",
      themeColor: "#F8F1E6",
      designStatus: "final",
      shortDescription: "Warm festive cream with restrained red and forest.",
    });
    expect(christmas.description).toContain("non-religious");
    expect(christmas.description).toContain("warm-light cues");
    expect(christmas.description).not.toMatch(/church|cross|religious symbol|santa|reindeer|gift|snowfall|blink/i);
    expect(christmas.previewSwatches).toEqual(["#F8F1E6", "#FFF9F0", "#8F2626", "#0F3D2E"]);
    expect(publicThemeDefinitionFor("valentine").themeColor).toBe("#FFF3F1");
    expect(publicThemeDefinitionFor("easter").themeColor).toBe("#FFF9DE");
    expect(publicThemeDefinitionFor("summer").themeColor).toBe("#FFF4D8");
    expect(publicThemeDefinitionFor("harvest").themeColor).toBe("#FFF0DC");
    expect(publicThemeDefinitionFor("halloween").themeColor).toBe("#241A16");
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
      "app/api/admin/themes/activate-now/route.ts",
      "lib/admin-theme-api.ts",
    ].map(source).join("\n");

    expect(routes).toContain("requireAdminForRequest(request)");
    expect(routes).toContain("adminGuardErrorResponse");
    expect(routes).toContain("admin_list_theme_campaigns");
    expect(routes).toContain("admin_create_theme_campaign");
    expect(routes).toContain("admin_update_theme_campaign");
    expect(routes).toContain("admin_delete_theme_campaign");
    expect(routes).toContain("admin_activate_default_theme");
    expect(routes).toContain("admin_activate_theme_now");
    expect(routes).toContain("revalidatePublicThemeCache");
    expect(routes).toContain("Unknown public theme");
    expect(routes).toContain("stale: true");
    expect(routes).not.toMatch(/auth\.admin|service_role|pizza_sessions|party_orders|account_preferences|created_by.*json|updated_by.*json/i);
  });

  it("allows direct seasonal theme activation through an atomic database function", () => {
    const migration = source("supabase/migrations/20260722100000_activate_public_theme_now.sql");
    const activateRoute = source("app/api/admin/themes/activate-now/route.ts");
    const appearanceClient = source("components/admin/AdminAppearanceClient.tsx");

    expect(migration).toContain("create or replace function public.admin_activate_theme_now(p_theme_id text)");
    expect(migration).toContain("lock table public.theme_campaigns in exclusive mode");
    expect(migration).toContain("where enabled is true");
    expect(migration).toContain("and starts_at <= activation_time");
    expect(migration).toContain("and (ends_at is null or activation_time < ends_at)");
    expect(migration).toContain("set enabled = false");
    expect(migration).toContain("if public.theme_campaign_overlaps(null, p_theme_id, activation_time, null) then");
    expect(migration).toContain("raise exception 'theme_campaign_overlap'");
    expect(migration).toContain("insert into public.theme_campaigns (theme_id, starts_at, ends_at, created_by, updated_by)");
    expect(migration).toContain("grant execute on function public.admin_activate_theme_now(text) to authenticated");

    expect(activateRoute).toContain("requireAdminRequest(request)");
    expect(activateRoute).toContain("admin_activate_theme_now");
    expect(activateRoute).toContain("p_theme_id: body.themeId");
    expect(activateRoute).toContain('body.themeId === "default"');
    expect(activateRoute).toContain("revalidatePublicThemeCache");
    expect(activateRoute).not.toMatch(/auth\.admin|service_role|pizza_sessions|party_orders|account_preferences/i);

    expect(appearanceClient).toContain('fetch("/api/admin/themes/activate-now"');
    expect(appearanceClient).toContain('fetch("/api/admin/themes/activate-default"');
    expect(appearanceClient).not.toMatch(/theme\.id,\s*startsAt:\s*new Date\(\)\.toISOString\(\),\s*endsAt:\s*null/s);
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
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 36%, var(--theme-page-background)) 48%, var(--theme-page-background) 100%)");
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
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 34%, var(--theme-page-background)) 48%, var(--theme-page-background) 100%)");
    expect(css).not.toMatch(/html\[data-public-theme="easter"\][^{]*(?:\.text-leaf|\.bg-leaf|dt-bake-timer)/);
    expect(css).not.toMatch(/html\[data-public-theme="easter"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="easter"\][\s\S]*--dt-action-danger/);
  });

  it("implements the final Summer CSS tokens with outdoor-readable teal and restrained sun-tile motif", () => {
    const css = source("app/globals.css");
    const summerBlock = css.match(/html\[data-public-theme="summer"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(summerBlock).toContain("--theme-page-background: #fff4d8");
    expect(summerBlock).toContain("--theme-page-background-secondary: #e7f4f6");
    expect(summerBlock).toContain("--theme-surface: #fff9ec");
    expect(summerBlock).toContain("--theme-surface-muted: #e7f4f6");
    expect(summerBlock).toContain("--theme-surface-elevated: #fff9ec");
    expect(summerBlock).toContain("--theme-border: #c9e2e7");
    expect(summerBlock).toContain("--theme-border-strong: #9fc7ce");
    expect(summerBlock).toContain("--theme-accent: #d88a24");
    expect(summerBlock).toContain("--theme-accent-hover: #99520c");
    expect(summerBlock).toContain("--theme-accent-secondary: #126d7a");
    expect(summerBlock).toContain("--theme-header-surface: rgba(255, 244, 216, .96)");
    expect(summerBlock).toContain("--theme-header-border: rgba(18, 109, 122, .16)");
    expect(css).toContain('html[data-public-theme="summer"] body');
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 30%, var(--theme-page-background)) 50%, var(--theme-page-background) 100%)");
    expect(css).not.toMatch(/html\[data-public-theme="summer"\][^{]*(?:\.text-sky|\.bg-sky|dt-bake-timer)/);
    expect(css).not.toMatch(/html\[data-public-theme="summer"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="summer"\][\s\S]*--dt-action-danger/);
  });

  it("implements the final Harvest CSS tokens with grain/flour motif and no Halloween semantics", () => {
    const css = source("app/globals.css");
    const harvestBlock = css.match(/html\[data-public-theme="harvest"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(harvestBlock).toContain("--theme-page-background: #fff0dc");
    expect(harvestBlock).toContain("--theme-page-background-secondary: #f0dfc2");
    expect(harvestBlock).toContain("--theme-surface: #fff9f1");
    expect(harvestBlock).toContain("--theme-surface-muted: #f0dfc2");
    expect(harvestBlock).toContain("--theme-surface-elevated: #fff9f1");
    expect(harvestBlock).toContain("--theme-border: #dec290");
    expect(harvestBlock).toContain("--theme-border-strong: #c9a76b");
    expect(harvestBlock).toContain("--theme-accent: #b96324");
    expect(harvestBlock).toContain("--theme-accent-hover: #8f4618");
    expect(harvestBlock).toContain("--theme-accent-secondary: #65723a");
    expect(harvestBlock).toContain("--theme-header-surface: rgba(255, 240, 220, .96)");
    expect(harvestBlock).toContain("--theme-header-border: rgba(101, 114, 58, .16)");
    expect(css).toContain('html[data-public-theme="harvest"] body');
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 32%, var(--theme-page-background)) 48%, var(--theme-page-background) 100%)");
    expect(css).not.toMatch(/html\[data-public-theme="harvest"\][^{]*(?:\.text-purple|\.bg-purple|dt-bake-timer)/);
    expect(css).not.toMatch(/html\[data-public-theme="harvest"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="harvest"\][\s\S]*--dt-action-danger/);
  });

  it("implements the final Halloween CSS tokens without replacing timer urgency or workflow semantics", () => {
    const css = source("app/globals.css");
    const halloweenBlock = css.match(/html\[data-public-theme="halloween"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(halloweenBlock).toContain("--theme-page-background: #fff4e8");
    expect(halloweenBlock).toContain("--theme-page-background-secondary: #241a16");
    expect(halloweenBlock).toContain("--theme-surface: #fff8ef");
    expect(halloweenBlock).toContain("--theme-surface-muted: #f3dfcf");
    expect(halloweenBlock).toContain("--theme-surface-elevated: #fff8ef");
    expect(halloweenBlock).toContain("--theme-border: #70442f");
    expect(halloweenBlock).toContain("--theme-border-strong: #5f3828");
    expect(halloweenBlock).toContain("--theme-accent: #e96f24");
    expect(halloweenBlock).toContain("--theme-accent-hover: #b94f12");
    expect(halloweenBlock).toContain("--theme-accent-secondary: #5b3a6b");
    expect(halloweenBlock).toContain("--theme-header-surface: rgba(255, 244, 232, .96)");
    expect(halloweenBlock).toContain("--theme-header-border: rgba(112, 68, 47, .18)");
    expect(css).toContain('html[data-public-theme="halloween"] body');
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 8%, var(--theme-page-background)) 42%, var(--theme-page-background) 100%)");
    expect(css).not.toMatch(/html\[data-public-theme="halloween"\][^{]*(?:\.text-purple|\.bg-purple|dt-bake-timer|flame|overtime|final-ten)/);
    expect(css).not.toMatch(/html\[data-public-theme="halloween"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="halloween"\][\s\S]*--dt-action-danger/);
  });

  it("implements the final Christmas CSS tokens without replacing semantic red, green or timer urgency", () => {
    const css = source("app/globals.css");
    const christmasBlock = css.match(/html\[data-public-theme="christmas"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(christmasBlock).toContain("--theme-page-background: #f8f1e6");
    expect(christmasBlock).toContain("--theme-page-background-secondary: #e9ddca");
    expect(christmasBlock).toContain("--theme-surface: #fff9f0");
    expect(christmasBlock).toContain("--theme-surface-muted: #eadfce");
    expect(christmasBlock).toContain("--theme-surface-elevated: #fff9f0");
    expect(christmasBlock).toContain("--theme-border: #d9c8ad");
    expect(christmasBlock).toContain("--theme-border-strong: #bfa781");
    expect(christmasBlock).toContain("--theme-accent: #8f2626");
    expect(christmasBlock).toContain("--theme-accent-hover: #6f1d1d");
    expect(christmasBlock).toContain("--theme-accent-secondary: #0f3d2e");
    expect(christmasBlock).toContain("--theme-header-surface: rgba(248, 241, 230, .96)");
    expect(christmasBlock).toContain("--theme-header-border: rgba(15, 61, 46, .16)");
    expect(css).toContain('html[data-public-theme="christmas"] body');
    expect(css).toContain("linear-gradient(180deg, var(--theme-page-background) 0%, color-mix(in srgb, var(--theme-page-background-secondary) 28%, var(--theme-page-background)) 48%, var(--theme-page-background) 100%)");
    expect(css).not.toMatch(/html\[data-public-theme="christmas"\][^{]*(?:dt-bake-timer|flame|overtime|final-ten|snowfall|blink)/);
    expect(css).not.toMatch(/html\[data-public-theme="christmas"\][\s\S]*--dt-status-(?:danger|warning|success)|html\[data-public-theme="christmas"\][\s\S]*--dt-action-danger/);
  });

  it("keeps Harvest visually separate from Halloween final design", () => {
    const harvest = publicThemeDefinitionFor("harvest");
    const halloween = publicThemeDefinitionFor("halloween");
    const css = source("app/globals.css");
    const harvestBlock = css.match(/html\[data-public-theme="harvest"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";
    const halloweenBlock = css.match(/html\[data-public-theme="halloween"\]\s*{(?<body>[^}]+)}/)?.groups?.body ?? "";

    expect(harvest.themeColor).toBe("#FFF0DC");
    expect(halloween.themeColor).toBe("#241A16");
    expect(harvest.previewSwatches).not.toEqual(halloween.previewSwatches);
    expect(harvestBlock).toContain("--theme-accent: #b96324");
    expect(halloweenBlock).toContain("--theme-accent: #e96f24");
    expect(harvestBlock).toContain("--theme-accent-secondary: #65723a");
    expect(halloweenBlock).toContain("--theme-accent-secondary: #5b3a6b");
    expect(`${harvest.description} ${harvest.shortDescription}`).not.toMatch(/halloween|spooky|pumpkin|ghost|bat|night|purple|charcoal/i);
    expect(`${halloween.description} ${halloween.shortDescription}`).not.toMatch(/grain|flour|ingredient craft|wheat/i);
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

  it("keeps Summer readable outdoors by using Ink, muted text and teal over final surfaces", () => {
    for (const surface of ["#FFF4D8", "#FFF9EC", "#E7F4F6"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFF9EC")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#126D7A", "#FFF4D8")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#99520C", "#FFF4D8")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps Harvest readable without muddy brown-on-brown contrast", () => {
    for (const surface of ["#FFF0DC", "#FFF9F1", "#F0DFC2"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFF9F1")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#8F4618", "#FFF0DC")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#65723A", "#FFF0DC")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps Halloween readable without making normal UI look like urgency", () => {
    for (const surface of ["#FFF4E8", "#FFF8EF", "#F3DFCF"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFF8EF")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#B94F12", "#FFF4E8")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#5B3A6B", "#FFF4E8")).toBeGreaterThanOrEqual(4.5);
    expect(publicThemeDefinitionFor("halloween").previewSwatches).not.toContain("#E94B2E");
  });

  it("keeps Christmas readable without replacing semantic red or green states", () => {
    for (const surface of ["#F8F1E6", "#FFF9F0", "#EADFCE"]) {
      expect(contrastRatio("#1F1F1F", surface)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio("#6B645D", "#FFF9F0")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#6F1D1D", "#F8F1E6")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#0F3D2E", "#F8F1E6")).toBeGreaterThanOrEqual(4.5);
    expect(publicThemeDefinitionFor("christmas").previewSwatches).not.toContain("#E94B2E");
    expect(publicThemeDefinitionFor("christmas").previewSwatches).not.toContain("#3BA66B");
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

describe("Patch 445I cross-theme consistency contract", () => {
  const requiredTokens = [
    "--theme-page-background",
    "--theme-page-background-secondary",
    "--theme-surface",
    "--theme-surface-muted",
    "--theme-surface-elevated",
    "--theme-border",
    "--theme-border-strong",
    "--theme-text",
    "--theme-text-muted",
    "--theme-accent",
    "--theme-accent-hover",
    "--theme-accent-soft",
    "--theme-accent-secondary",
    "--theme-header-surface",
    "--theme-header-border",
    "--theme-decorative",
    "--theme-decorative-secondary",
    "--theme-focus",
  ];

  const themeSurfaces = {
    default: ["#FFF8F1", "#FFFFFF", "#F1E6D8"],
    valentine: ["#FFF3F1", "#FFFBFA", "#F7E1DD"],
    easter: ["#FFF9DE", "#FFFDF5", "#EEF5DC"],
    summer: ["#FFF4D8", "#FFF9EC", "#E7F4F6"],
    harvest: ["#FFF0DC", "#FFF9F1", "#F0DFC2"],
    halloween: ["#FFF4E8", "#FFF8EF", "#F3DFCF"],
    christmas: ["#F8F1E6", "#FFF9F0", "#EADFCE"],
  } satisfies Record<(typeof PUBLIC_THEME_IDS)[number], string[]>;

  it("gives every public theme the same effective token contract", () => {
    const css = source("app/globals.css");

    for (const theme of PUBLIC_THEME_DEFINITIONS) {
      const variables = effectiveThemeVariables(css, theme.id);
      for (const token of requiredTokens) {
        expect(variables.get(token), `${theme.id} missing ${token}`).toBeTruthy();
      }
    }
  });

  it("keeps all finalized theme metadata colors and preview swatches distinct enough for scanning", () => {
    const themeColors = PUBLIC_THEME_DEFINITIONS.map((theme) => theme.themeColor);
    expect(new Set(themeColors).size).toBe(PUBLIC_THEME_DEFINITIONS.length);

    for (const theme of PUBLIC_THEME_DEFINITIONS) {
      expect(theme.designStatus).toBe("final");
      expect(theme.previewSwatches[0]).toBe(theme.themeColor);
      expect(theme.previewSwatches).toHaveLength(4);
    }

    expect(publicThemeDefinitionFor("valentine").previewSwatches).not.toEqual(publicThemeDefinitionFor("christmas").previewSwatches);
    expect(publicThemeDefinitionFor("easter").previewSwatches).not.toEqual(publicThemeDefinitionFor("summer").previewSwatches);
    expect(publicThemeDefinitionFor("harvest").previewSwatches).not.toEqual(publicThemeDefinitionFor("halloween").previewSwatches);
  });

  it("keeps Ink and muted text readable across the complete seven-theme surface set", () => {
    for (const [themeId, surfaces] of Object.entries(themeSurfaces)) {
      for (const surface of surfaces) {
        expect(contrastRatio("#1F1F1F", surface), `${themeId} Ink on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio("#6B645D", surfaces[1]), `${themeId} muted text on primary surface`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps seasonal accents separate from semantic status and Bake Timer urgency colors", () => {
    const semanticColors = ["#E94B2E", "#3BA66B", "#E8C98A"];
    const css = source("app/globals.css");

    for (const theme of PUBLIC_THEME_DEFINITIONS.filter((definition) => definition.id !== "default")) {
      const variables = effectiveThemeVariables(css, theme.id);
      const seasonalAccent = String(variables.get("--theme-accent")).toUpperCase();
      const seasonalSecondary = String(variables.get("--theme-accent-secondary")).toUpperCase();

      expect(semanticColors).not.toContain(seasonalAccent);
      expect(semanticColors).not.toContain(seasonalSecondary);
    }

    expect(css).toContain("@keyframes dt-bake-timer-final-pulse");
    expect(css).toContain("@keyframes dt-bake-timer-expiry-pulse");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toMatch(/html\[data-public-theme="[^\"]+"\][\s\S]*--dt-status-(?:danger|warning|success)/);
    expect(css).not.toMatch(/html\[data-public-theme="[^\"]+"\][\s\S]*(?:dt-bake-timer|overtime|final-ten|flame)[\s\S]*--theme-accent/);
  });

  it("keeps seasonal motifs static, CSS-owned and away from external assets", () => {
    const css = source("app/globals.css");
    const themeCss = css.slice(css.indexOf('html[data-public-theme="valentine"]'), css.indexOf("* { box-sizing"));

    expect(themeCss).toContain("linear-gradient(180deg");
    expect(themeCss).not.toMatch(/url\(|https?:\/\/|animation:|@keyframes|blink|strobe|particle|parallax|snowfall/i);
    expect(css).toContain("html[data-public-theme]:not([data-public-theme=\"default\"]) .bg-cream");
    expect(css).toContain("html[data-public-theme]:not([data-public-theme=\"default\"]) .border-flour");
  });

  it("adds one reusable non-interactive seasonal decoration layer to the root layout", () => {
    const layout = source("app/layout.tsx");
    const component = source("components/SeasonalThemeDecorations.tsx");

    expect(layout).toContain("SeasonalThemeDecorations");
    expect(layout.indexOf("<SeasonalThemeDecorations/>")).toBeLessThan(layout.indexOf("<GlobalToolNavigation/>"));
    expect(component).toContain('data-seasonal-theme-decoration');
    expect(component).toContain('aria-hidden="true"');
    expect(component).not.toMatch(/localStorage|sessionStorage|fetch\(|supabase|PizzaSession|stepRuntime/i);
  });

  it("shows seasonal graphics for seasonal themes with route-based intensity", () => {
    const css = source("app/globals.css");
    const component = source("components/SeasonalThemeDecorations.tsx");

    expect(css).toContain('html[data-public-theme="summer"] .seasonal-theme-decoration');
    expect(css).toContain('html[data-public-theme="valentine"] .seasonal-theme-decoration');
    expect(css).toContain('html[data-public-theme="easter"] .seasonal-theme-decoration');
    expect(css).toContain('html[data-public-theme="harvest"] .seasonal-theme-decoration');
    expect(css).toContain('html[data-public-theme="halloween"] .seasonal-theme-decoration');
    expect(css).toContain('html[data-public-theme="christmas"] .seasonal-theme-decoration');
    expect(css).not.toContain('html[data-public-theme="default"] .seasonal-theme-decoration');
    expect(css).toContain('.seasonal-theme-decoration[data-seasonal-intensity="restrained"]');
    expect(css).toContain('.seasonal-theme-decoration[data-seasonal-intensity="minimal"]');
    expect(component).toContain('pathname === "/"');
    expect(component).toContain('pathname === "/about"');
    expect(component).toContain('pathname.startsWith("/guide/")');
    expect(component).toContain('pathname === "/session/kitchen"');
    expect(component).toContain('pathname === "/tools/bake-timer"');
    expect(component).toContain('pathname === "/admin"');
    expect(component).toContain('pathname.startsWith("/admin/")');
  });

  it("uses original local SVG and CSS shapes without external graphics or overflow-prone layout", () => {
    const css = source("app/globals.css");
    const component = source("components/SeasonalThemeDecorations.tsx");
    const seasonalCss = css.slice(css.indexOf(".seasonal-theme-decoration"), css.indexOf('html[data-public-theme]:not([data-public-theme="default"]) .bg-cream'));

    expect(component).toContain("function SummerGraphics");
    expect(component).toContain("function ValentineGraphics");
    expect(component).toContain("seasonal-theme-decoration__summer-palm");
    expect(component).toContain("seasonal-theme-decoration__heart");
    expect(component).toContain("seasonal-theme-decoration__cupid-arrow");
    expect(component).toContain("seasonal-theme-decoration__sun");
    expect(component).toContain("seasonal-theme-decoration__lemon");
    expect(component).toContain("seasonal-theme-decoration__easter-egg");
    expect(component).toContain("seasonal-theme-decoration__spring-flower");
    expect(component).toContain("seasonal-theme-decoration__bunny-ears");
    expect(component).toContain("seasonal-theme-decoration__grain");
    expect(component).toContain("seasonal-theme-decoration__olive-branch");
    expect(component).toContain("seasonal-theme-decoration__tomato-detail");
    expect(component).toContain("seasonal-theme-decoration__moon");
    expect(component).toContain("seasonal-theme-decoration__web");
    expect(component).toContain("seasonal-theme-decoration__bat");
    expect(component).toContain("seasonal-theme-decoration__pumpkin");
    expect(component).toContain("seasonal-theme-decoration__fir");
    expect(component).toContain("seasonal-theme-decoration__star");
    expect(component).toContain("seasonal-theme-decoration__ornament");
    expect(component).toContain("seasonal-theme-decoration__snowflake");
    expect(`${component}\n${seasonalCss}`).not.toMatch(/url\(|https?:\/\/|<img|image href|background-image:\s*url/i);
    expect(seasonalCss).toContain("position: fixed");
    expect(seasonalCss).toContain("overflow: hidden");
    expect(seasonalCss).toContain("pointer-events: none");
    expect(seasonalCss).toContain("@media (max-width: 640px)");
  });

  it("gives Easter and Harvest their own seasonal shapes without changing Summer or Valentine selectors", () => {
    const css = source("app/globals.css");
    const component = source("components/SeasonalThemeDecorations.tsx");

    expect(component).toContain("function EasterGraphics");
    expect(component).toContain("function HarvestGraphics");
    expect(css).toContain('html[data-public-theme="easter"] .seasonal-theme-decoration__easter-egg');
    expect(css).toContain('html[data-public-theme="easter"] .seasonal-theme-decoration__spring-flower');
    expect(css).toContain('html[data-public-theme="easter"] .seasonal-theme-decoration__bunny-ears');
    expect(css).toContain('html[data-public-theme="harvest"] .seasonal-theme-decoration__grain');
    expect(css).toContain('html[data-public-theme="harvest"] .seasonal-theme-decoration__olive-branch');
    expect(css).toContain('html[data-public-theme="harvest"] .seasonal-theme-decoration__tomato-detail');
    expect(css).toContain('html[data-public-theme="summer"] .seasonal-theme-decoration__summer-palm');
    expect(css).toContain('html[data-public-theme="valentine"] .seasonal-theme-decoration__heart');
    expect(css).not.toMatch(/html\[data-public-theme="(?:halloween|christmas|default)"\]\s+\.seasonal-theme-decoration__(?:easter-egg|spring-flower|bunny-ears|grain|olive-branch|tomato-detail)/);
  });

  it("gives Halloween and Christmas tasteful static seasonal shapes without changing earlier graphics", () => {
    const css = source("app/globals.css");
    const component = source("components/SeasonalThemeDecorations.tsx");
    const seasonalCss = css.slice(css.indexOf(".seasonal-theme-decoration"), css.indexOf('html[data-public-theme]:not([data-public-theme="default"]) .bg-cream'));

    expect(component).toContain("function HalloweenGraphics");
    expect(component).toContain("function ChristmasGraphics");
    expect(css).toContain('html[data-public-theme="halloween"] .seasonal-theme-decoration__moon');
    expect(css).toContain('html[data-public-theme="halloween"] .seasonal-theme-decoration__web');
    expect(css).toContain('html[data-public-theme="halloween"] .seasonal-theme-decoration__bat');
    expect(css).toContain('html[data-public-theme="halloween"] .seasonal-theme-decoration__pumpkin');
    expect(css).toContain('html[data-public-theme="christmas"] .seasonal-theme-decoration__fir');
    expect(css).toContain('html[data-public-theme="christmas"] .seasonal-theme-decoration__star');
    expect(css).toContain('html[data-public-theme="christmas"] .seasonal-theme-decoration__ornament');
    expect(css).toContain('html[data-public-theme="christmas"] .seasonal-theme-decoration__snowflake');
    expect(css).toContain('html[data-public-theme="summer"] .seasonal-theme-decoration__summer-palm');
    expect(css).toContain('html[data-public-theme="valentine"] .seasonal-theme-decoration__heart');
    expect(css).toContain('html[data-public-theme="easter"] .seasonal-theme-decoration__easter-egg');
    expect(css).toContain('html[data-public-theme="harvest"] .seasonal-theme-decoration__grain');
    expect(seasonalCss).not.toMatch(/animation:|@keyframes|blink|snowfall|strobe|scary|skull|blood|ghost/i);
    expect(css).not.toMatch(/html\[data-public-theme="default"\]\s+\.seasonal-theme-decoration__(?:moon|web|bat|pumpkin|fir|star|ornament|snowflake)/);
  });

  it("keeps Admin pages globally decoration-free while showing small theme-card motif previews", () => {
    const component = source("components/SeasonalThemeDecorations.tsx");
    const appearanceClient = source("components/admin/AdminAppearanceClient.tsx");
    const css = source("app/globals.css");

    expect(component).toContain('pathname === "/admin"');
    expect(component).toContain('pathname.startsWith("/admin/")');
    expect(css).toContain('.seasonal-theme-decoration[data-seasonal-intensity="minimal"]');
    expect(appearanceClient).toContain("ThemeMotifPreview");
    expect(css).toContain(".admin-theme-motif-preview--valentine");
    expect(css).toContain(".admin-theme-motif-preview--easter");
    expect(css).toContain(".admin-theme-motif-preview--summer");
    expect(css).toContain(".admin-theme-motif-preview--harvest");
    expect(css).toContain(".admin-theme-motif-preview--halloween");
    expect(css).toContain(".admin-theme-motif-preview--christmas");
  });
});
