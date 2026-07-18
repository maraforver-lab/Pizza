import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  cloudPizzaSessionPayload,
  normalizeCloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

function pizzaSessionUpdatedAtTime(session: ReturnType<typeof migratePizzaSession>) {
  if (!session?.updatedAt) return undefined;
  const time = new Date(session.updatedAt).getTime();
  return Number.isFinite(time) ? time : undefined;
}

function cloudSessionIsNewer(existingSession: ReturnType<typeof migratePizzaSession>, incomingSession: ReturnType<typeof migratePizzaSession>) {
  const existingTime = pizzaSessionUpdatedAtTime(existingSession);
  const incomingTime = pizzaSessionUpdatedAtTime(incomingSession);
  return existingTime !== undefined && incomingTime !== undefined && existingTime > incomingTime;
}

function activeSessionConflictResponse(
  existing: { id: string },
  existingSession: NonNullable<ReturnType<typeof migratePizzaSession>>,
  incomingSession: NonNullable<ReturnType<typeof migratePizzaSession>>,
) {
  return NextResponse.json({
    error: "active_session_exists",
    message: "A different active pizza session is already saved to this account.",
    conflict: true,
    activeSessionId: existingSession.id,
    activeCloudRowId: existing.id,
    cloudRowId: existing.id,
    cloudSessionId: existingSession.id,
    localSessionId: incomingSession.id,
    resumeRoute: pizzaSessionContinueHref(existingSession),
  }, { status: 409 });
}

function rpcReplaceActivePayload(value: unknown) {
  const normalized = normalizeCloudPizzaSessionRow(value);
  return normalized ? { session: normalized } : undefined;
}

export async function GET(request: Request) {
  const { supabase, user } = await getSupabaseRouteClient(request);
  if (!user) {
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
  const { supabase, user } = await getSupabaseRouteClient(request);
  if (!user) {
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
  const replaceActiveSession = record.operation === "replace_active"
    || record.replaceActiveSession === true
    || record.replace_active_session === true;
  const expectedActiveCloudRowId = typeof (record.expectedActiveCloudRowId ?? record.expected_active_cloud_row_id) === "string"
    ? String(record.expectedActiveCloudRowId ?? record.expected_active_cloud_row_id)
    : null;
  const expectedActiveSessionId = typeof (record.expectedActiveSessionId ?? record.expected_active_session_id) === "string"
    ? String(record.expectedActiveSessionId ?? record.expected_active_session_id)
    : null;

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
  let targetExisting = existing;
  if (replaceActiveSession) {
    const { data: replacement, error: replacementError } = await supabase
      .rpc("replace_active_pizza_session", {
        expected_active_row_id: expectedActiveCloudRowId,
        expected_active_session_id: expectedActiveSessionId,
        new_current_step: payload.current_step,
        new_session_data: payload.session_data,
        new_title: payload.title,
      })
      .single();

    if (replacementError) {
      const { data: latest } = await supabase
        .from("pizza_sessions")
        .select(CLOUD_PIZZA_SESSION_SELECT)
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const latestSession = latest?.session_data ? migratePizzaSession(latest.session_data) : undefined;
      if (latest?.id && latestSession && latestSession.id !== session.id) {
        return activeSessionConflictResponse(latest, latestSession, session);
      }
      return NextResponse.json({ error: "We could not replace your active pizza session. Try again." }, { status: 500 });
    }

    const savedSession = rpcReplaceActivePayload(replacement);
    if (!savedSession) {
      return NextResponse.json({ error: "Saved pizza session could not be verified." }, { status: 500 });
    }
    return NextResponse.json(savedSession);
  }

  if (existing?.id && existingSession && existingSession.id !== session.id) {
    return activeSessionConflictResponse(existing, existingSession, session);
  }

  if (targetExisting?.id && existingSession && cloudSessionIsNewer(existingSession, session)) {
    const normalizedExisting = normalizeCloudPizzaSessionRow(existing);
    if (normalizedExisting) return NextResponse.json({ session: normalizedExisting, skipped: true, reason: "stale-session" });
  }

  const query = targetExisting?.id
    ? supabase
      .from("pizza_sessions")
      .update({ ...payload, updated_at: updatedAt })
      .eq("id", targetExisting.id)
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
  const { supabase, user } = await getSupabaseRouteClient(request);
  if (!user) {
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
    return activeSessionConflictResponse(existing, existingSession, session);
  }
  if (existingSession && cloudSessionIsNewer(existingSession, session)) {
    const normalizedExisting = normalizeCloudPizzaSessionRow(existing);
    if (normalizedExisting) return NextResponse.json({ session: normalizedExisting, skipped: true, reason: "stale-session" });
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

export async function DELETE(request: Request) {
  const { supabase, user } = await getSupabaseRouteClient(request);
  if (!user) {
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
  if (!existing?.id) return NextResponse.json({ deleted: false, session: null });

  const { error } = await supabase
    .from("pizza_sessions")
    .delete()
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true, session: null });
}
