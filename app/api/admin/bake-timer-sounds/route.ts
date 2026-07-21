import { NextResponse } from "next/server";
import {
  bakeTimerSoundSettingsResponse,
  parseBakeTimerSoundSettingsPayload,
  safeBakeTimerSoundSettingsError,
} from "@/lib/bake-timer-sound-settings";
import { requireAdminRequest } from "@/lib/admin-theme-api";

export async function GET(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  const { data, error } = await access.admin.supabase.rpc("admin_list_bake_timer_sound_theme_settings");
  if (error) return NextResponse.json({ error: "Bake Timer sound settings could not be loaded." }, { status: 500 });
  return NextResponse.json(bakeTimerSoundSettingsResponse(data));
}

export async function PATCH(request: Request) {
  const access = await requireAdminRequest(request);
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid Bake Timer sound settings payload." }, { status: 400 });
  }

  const parsed = parseBakeTimerSoundSettingsPayload(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data, error } = await access.admin.supabase.rpc("admin_update_bake_timer_sound_theme_settings", {
    p_enabled_theme_ids: parsed.payload.enabledThemeIds,
    p_default_theme_id: parsed.payload.defaultThemeId,
    p_expected_version: parsed.payload.expectedVersion,
  });

  if (error) {
    const safeError = safeBakeTimerSoundSettingsError(error);
    return NextResponse.json(
      { error: safeError.error, stale: "stale" in safeError ? safeError.stale : undefined },
      { status: safeError.status },
    );
  }

  return NextResponse.json(bakeTimerSoundSettingsResponse(data));
}
