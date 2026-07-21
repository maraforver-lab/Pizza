import { NextResponse } from "next/server";
import {
  ACCOUNT_PREFERENCES_SELECT,
  accountPreferencesAreNewer,
  accountPreferencesPayload,
  normalizeAccountPreferencesRow,
} from "@/lib/account-preferences";
import { bakeTimerSoundSettingsResponse, defaultBakeTimerSoundSettingsResponse } from "@/lib/bake-timer-sound-settings";
import {
  isBakeTimerSoundThemeId,
  resolveEffectiveBakeTimerSoundTheme,
} from "@/lib/bake-timer-sound-themes";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function loadBakeTimerSoundSettings(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, userPreference?: unknown) {
  const { data, error } = await supabase.rpc("get_bake_timer_sound_configuration");
  if (error) return defaultBakeTimerSoundSettingsResponse(userPreference);

  const row = Array.isArray(data) ? data[0] : data;
  return bakeTimerSoundSettingsResponse([{
    enabled: true,
    is_default: true,
    theme_id: row?.default_theme_id,
    version: row?.version,
  }, ...(Array.isArray(row?.enabled_theme_ids)
    ? row.enabled_theme_ids
      .filter((themeId: unknown) => themeId !== row?.default_theme_id)
      .map((themeId: unknown) => ({ theme_id: themeId, enabled: true, is_default: false, version: row?.version }))
    : [])], userPreference);
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load account preferences." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("account_preferences")
    .select(ACCOUNT_PREFERENCES_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const preferences = normalizeAccountPreferencesRow(data);
  const soundSettings = await loadBakeTimerSoundSettings(supabase, preferences.bakeTimerSoundTheme);
  return NextResponse.json({
    preferences,
    bakeTimerSound: soundSettings,
  });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to update account preferences." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid preferences payload." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const hasEarlyCompletion = Object.prototype.hasOwnProperty.call(record, "allowEarlyTimedStepCompletion");
  const hasSoundTheme = Object.prototype.hasOwnProperty.call(record, "bakeTimerSoundTheme");
  if (!hasEarlyCompletion && !hasSoundTheme) {
    return NextResponse.json({ error: "Invalid preferences payload." }, { status: 400 });
  }
  if (hasEarlyCompletion && typeof record.allowEarlyTimedStepCompletion !== "boolean") {
    return NextResponse.json({ error: "Invalid early completion preference." }, { status: 400 });
  }

  const knownUpdatedAt = typeof record.knownUpdatedAt === "string" ? record.knownUpdatedAt : undefined;
  const { data: existing, error: existingError } = await supabase
    .from("account_preferences")
    .select(ACCOUNT_PREFERENCES_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const existingPreferences = normalizeAccountPreferencesRow(existing);
  if (existing && accountPreferencesAreNewer(existingPreferences.updatedAt, knownUpdatedAt)) {
    const soundSettings = await loadBakeTimerSoundSettings(supabase, existingPreferences.bakeTimerSoundTheme);
    return NextResponse.json({
      error: "Account preferences changed on another device. Reload and try again.",
      preferences: existingPreferences,
      bakeTimerSound: soundSettings,
      stale: true,
    }, { status: 409 });
  }

  const soundSettings = await loadBakeTimerSoundSettings(supabase, existingPreferences.bakeTimerSoundTheme);
  let bakeTimerSoundTheme = existingPreferences.bakeTimerSoundTheme;
  if (hasSoundTheme) {
    if (record.bakeTimerSoundTheme === null) {
      bakeTimerSoundTheme = null;
    } else if (!isBakeTimerSoundThemeId(record.bakeTimerSoundTheme)) {
      return NextResponse.json({ error: "Unknown Bake Timer sound theme." }, { status: 400 });
    } else if (!soundSettings.enabledThemeIds.includes(record.bakeTimerSoundTheme)) {
      return NextResponse.json({ error: "That Bake Timer sound theme is not available." }, { status: 400 });
    } else {
      bakeTimerSoundTheme = record.bakeTimerSoundTheme;
    }
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    ...accountPreferencesPayload({
      allowEarlyTimedStepCompletion: hasEarlyCompletion
        ? record.allowEarlyTimedStepCompletion as boolean
        : existingPreferences.allowEarlyTimedStepCompletion,
      bakeTimerSoundTheme,
    }),
    updated_at: updatedAt,
  };

  const query = existing
    ? supabase
      .from("account_preferences")
      .update(payload)
      .eq("user_id", user.id)
      .select(ACCOUNT_PREFERENCES_SELECT)
      .single()
    : supabase
      .from("account_preferences")
      .insert({ ...payload, user_id: user.id, created_at: updatedAt })
      .select(ACCOUNT_PREFERENCES_SELECT)
      .single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const preferences = normalizeAccountPreferencesRow(data);
  return NextResponse.json({
    preferences,
    bakeTimerSound: {
      ...soundSettings,
      effectiveThemeId: resolveEffectiveBakeTimerSoundTheme({
        userPreference: preferences.bakeTimerSoundTheme,
        configuration: soundSettings,
      }),
    },
  });
}
