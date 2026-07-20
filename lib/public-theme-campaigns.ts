import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_THEME_CACHE_TAG } from "@/lib/public-theme-cache-tags";
import {
  DEFAULT_PUBLIC_THEME_ID,
  normalizeThemeCampaignRow,
  publicThemeDefinitionFor,
  type PublicThemeDefinition,
  type PublicThemeId,
  type ThemeCampaignSummary,
} from "@/lib/public-themes";

export const THEME_CAMPAIGN_SELECT =
  "id, theme_id, enabled, starts_at, ends_at, version, created_at, updated_at";

export type ActivePublicThemeResult = {
  theme: PublicThemeDefinition;
  source: "campaign" | "default" | "fallback";
};

type PublicSupabaseClient = ReturnType<typeof createClient> | null;

function getPublicSupabaseClient(): PublicSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function activePublicThemeIdFromDatabase(): Promise<PublicThemeId> {
  const supabase = getPublicSupabaseClient();
  if (!supabase) return DEFAULT_PUBLIC_THEME_ID;

  const { data, error } = await supabase.rpc("get_active_public_theme");
  if (error || !data) {
    if (error && process.env.NODE_ENV !== "production") {
      console.warn("Falling back to Default public theme.", { code: error.code });
    }
    return DEFAULT_PUBLIC_THEME_ID;
  }

  return publicThemeDefinitionFor(data).id;
}

const getCachedActivePublicThemeId = unstable_cache(
  activePublicThemeIdFromDatabase,
  ["active-public-theme-id"],
  { revalidate: 60, tags: [PUBLIC_THEME_CACHE_TAG] },
);

export async function getActivePublicTheme(): Promise<ActivePublicThemeResult> {
  const themeId = await getCachedActivePublicThemeId().catch(() => DEFAULT_PUBLIC_THEME_ID);
  const theme = publicThemeDefinitionFor(themeId);
  return {
    theme,
    source: theme.id === DEFAULT_PUBLIC_THEME_ID ? "default" : "campaign",
  };
}

export function revalidatePublicThemeCache() {
  revalidateTag(PUBLIC_THEME_CACHE_TAG);
}

export function normalizeAdminThemeCampaignRows(rows: unknown, now: Date = new Date()): ThemeCampaignSummary[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map((row) => normalizeThemeCampaignRow(row, now));
}
