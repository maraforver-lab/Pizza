import { NextResponse } from "next/server";
import { requireAdminRequest, safeThemeMutationError } from "@/lib/admin-theme-api";
import { revalidatePublicThemeCache } from "@/lib/public-theme-campaigns";
import { publicThemeDefinitionFor } from "@/lib/public-themes";

export async function POST(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  const { data, error } = await access.admin.supabase.rpc("admin_activate_default_theme");
  if (error) return safeThemeMutationError(error);

  revalidatePublicThemeCache();
  return NextResponse.json({
    deactivatedCampaigns: Number(data ?? 0),
    activeTheme: publicThemeDefinitionFor("default"),
  });
}
