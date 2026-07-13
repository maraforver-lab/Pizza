import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  cloudPizzaSessionPayload,
  normalizeCloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession } from "@/lib/pizza-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load saved pizza sessions." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: normalizeCloudPizzaSessionRow(data) ?? null });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to save this session across devices." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const session = migratePizzaSession(record.sessionData ?? record.session_data);
  if (!session) return NextResponse.json({ error: "Invalid pizza session data." }, { status: 400 });

  const payload = cloudPizzaSessionPayload(session);
  const updatedAt = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("pizza_sessions")
    .select("id,session_data,updated_at")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const existingSession = existing?.session_data ? migratePizzaSession(existing.session_data) : undefined;
  if (existing?.id && existingSession && existingSession.id !== session.id) {
    return NextResponse.json({
      error: "A different active pizza session is already saved to this account.",
      conflict: true,
      localSessionId: session.id,
      cloudSessionId: existingSession.id,
      cloudRowId: existing.id,
    }, { status: 409 });
  }

  const query = existing?.id
    ? supabase
      .from("pizza_sessions")
      .update({ ...payload, updated_at: updatedAt })
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select(CLOUD_PIZZA_SESSION_SELECT)
      .single()
    : supabase
      .from("pizza_sessions")
      .insert({ ...payload, user_id: user.id, updated_at: updatedAt })
      .select(CLOUD_PIZZA_SESSION_SELECT)
      .single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const savedSession = normalizeCloudPizzaSessionRow(data);
  if (!savedSession) {
    return NextResponse.json({ error: "Saved pizza session could not be verified." }, { status: 500 });
  }
  return NextResponse.json({ session: savedSession });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to sync saved pizza sessions." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const session = migratePizzaSession(record.sessionData ?? record.session_data);
  if (!session) return NextResponse.json({ error: "Invalid pizza session data." }, { status: 400 });

  const requestedCloudSessionId = typeof (record.cloudSessionId ?? record.cloud_session_id) === "string"
    ? String(record.cloudSessionId ?? record.cloud_session_id)
    : undefined;

  const existingQuery = requestedCloudSessionId
    ? supabase
      .from("pizza_sessions")
      .select("id,session_data,updated_at")
      .eq("id", requestedCloudSessionId)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .maybeSingle()
    : supabase
      .from("pizza_sessions")
      .select("id,session_data,updated_at")
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  const { data: existing, error: existingError } = await existingQuery;

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing?.id) return NextResponse.json({ session: null, skipped: true });
  const existingSession = existing.session_data ? migratePizzaSession(existing.session_data) : undefined;
  if (existingSession && existingSession.id !== session.id) {
    return NextResponse.json({
      error: "A different active pizza session is already saved to this account.",
      conflict: true,
      localSessionId: session.id,
      cloudSessionId: existingSession.id,
      cloudRowId: existing.id,
    }, { status: 409 });
  }

  const updatedAt = new Date().toISOString();
  const shouldComplete = record.complete === true || record.status === "completed";
  const payload = {
    ...cloudPizzaSessionPayload(session),
    status: shouldComplete ? "completed" : "in_progress",
    completed_at: shouldComplete ? updatedAt : null,
    updated_at: updatedAt,
  };

  const { data, error } = await supabase
    .from("pizza_sessions")
    .update(payload)
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const syncedSession = shouldComplete ? null : normalizeCloudPizzaSessionRow(data);
  if (!shouldComplete && !syncedSession) {
    return NextResponse.json({ error: "Saved pizza session could not be verified." }, { status: 500 });
  }
  return NextResponse.json({
    session: syncedSession,
    completed: shouldComplete,
  });
}

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete this saved pizza session." }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("pizza_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (!existing?.id) return NextResponse.json({ archived: false, session: null });

  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("pizza_sessions")
    .update({ status: "archived", updated_at: updatedAt })
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ archived: true, session: data ? normalizeCloudPizzaSessionRow(data) : null });
}
