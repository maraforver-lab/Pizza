import { NextResponse } from "next/server";
import {
  mutationSuccessResponse,
  parseCreateThemeCampaignPayload,
  requireAdminRequest,
  safeThemeMutationError,
  themeCampaignsResponse,
} from "@/lib/admin-theme-api";
import { getActivePublicTheme } from "@/lib/public-theme-campaigns";
import { PUBLIC_THEME_DEFINITIONS } from "@/lib/public-themes";

export async function GET(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  const { data, error } = await access.admin.supabase.rpc("admin_list_theme_campaigns");
  if (error) return NextResponse.json({ error: "Theme campaigns could not be loaded." }, { status: 500 });

  const activeTheme = await getActivePublicTheme();
  return NextResponse.json({
    ...themeCampaignsResponse(data),
    activeTheme: activeTheme.theme,
    themeDefinitions: PUBLIC_THEME_DEFINITIONS,
  });
}

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid theme campaign payload." }, { status: 400 });
  }

  const parsed = parseCreateThemeCampaignPayload(body);
  if (!parsed.ok) return parsed.response;

  const { data, error } = await access.admin.supabase.rpc("admin_create_theme_campaign", {
    p_theme_id: parsed.payload.themeId,
    p_starts_at: parsed.payload.startsAt,
    p_ends_at: parsed.payload.endsAt,
  });

  if (error) return safeThemeMutationError(error);
  return mutationSuccessResponse(data, 201);
}
