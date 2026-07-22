import { NextResponse } from "next/server";
import { requireAdminRequest, safeThemeMutationError, themeCampaignsResponse } from "@/lib/admin-theme-api";
import { revalidatePublicThemeCache } from "@/lib/public-theme-campaigns";
import { isPublicThemeId, publicThemeDefinitionFor } from "@/lib/public-themes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid theme activation payload." }, { status: 400 });
  }

  if (!isRecord(body) || Object.keys(body).some((key) => key !== "themeId")) {
    return NextResponse.json({ error: "Theme activation payload contains unsupported fields." }, { status: 400 });
  }

  if (!isPublicThemeId(body.themeId) || body.themeId === "default") {
    return NextResponse.json({ error: "Unknown public theme." }, { status: 400 });
  }

  const { data, error } = await access.admin.supabase.rpc("admin_activate_theme_now", {
    p_theme_id: body.themeId,
  });

  if (error) return safeThemeMutationError(error);

  revalidatePublicThemeCache();
  return NextResponse.json({
    ...themeCampaignsResponse(data),
    activeTheme: publicThemeDefinitionFor(body.themeId),
  });
}
