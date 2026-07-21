import { NextResponse } from "next/server";
import {
  bakeTimerSoundSettingsResponse,
  defaultBakeTimerSoundSettingsResponse,
} from "@/lib/bake-timer-sound-settings";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_bake_timer_sound_configuration");

  if (error) {
    return NextResponse.json(defaultBakeTimerSoundSettingsResponse());
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json(bakeTimerSoundSettingsResponse([{
    enabled: true,
    is_default: true,
    theme_id: row?.default_theme_id,
    version: row?.version,
  }, ...(Array.isArray(row?.enabled_theme_ids)
    ? row.enabled_theme_ids
      .filter((themeId: unknown) => themeId !== row?.default_theme_id)
      .map((themeId: unknown) => ({ theme_id: themeId, enabled: true, is_default: false, version: row?.version }))
    : [])]));
}
