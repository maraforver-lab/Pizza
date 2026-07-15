import { NextResponse } from "next/server";
import {
  ACCOUNT_PREFERENCES_SELECT,
  accountPreferencesAreNewer,
  accountPreferencesPayload,
  normalizeAccountPreferencesRow,
} from "@/lib/account-preferences";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  return NextResponse.json({ preferences: normalizeAccountPreferencesRow(data) });
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
  if (typeof record.allowEarlyTimedStepCompletion !== "boolean") {
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
    return NextResponse.json({
      error: "Account preferences changed on another device. Reload and try again.",
      preferences: existingPreferences,
      stale: true,
    }, { status: 409 });
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    ...accountPreferencesPayload({
      allowEarlyTimedStepCompletion: record.allowEarlyTimedStepCompletion,
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
  return NextResponse.json({ preferences: normalizeAccountPreferencesRow(data) });
}
