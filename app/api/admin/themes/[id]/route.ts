import { NextResponse } from "next/server";
import {
  mutationSuccessResponse,
  parseUpdateThemeCampaignPayload,
  requireAdminRequest,
  safeThemeMutationError,
} from "@/lib/admin-theme-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid theme campaign payload." }, { status: 400 });
  }

  const parsed = parseUpdateThemeCampaignPayload(body);
  if (!parsed.ok) return parsed.response;

  const { data, error } = await access.admin.supabase.rpc("admin_update_theme_campaign", {
    p_id: id,
    p_expected_version: parsed.payload.expectedVersion,
    p_theme_id: parsed.payload.themeId,
    p_enabled: parsed.payload.enabled,
    p_starts_at: parsed.payload.startsAt,
    p_ends_at: parsed.payload.endsAt,
  });

  if (error) return safeThemeMutationError(error);
  return mutationSuccessResponse(data);
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  const { id } = await context.params;
  const { error } = await access.admin.supabase.rpc("admin_delete_theme_campaign", {
    p_id: id,
  });

  if (error) return safeThemeMutationError(error);
  return mutationSuccessResponse([], 200);
}
