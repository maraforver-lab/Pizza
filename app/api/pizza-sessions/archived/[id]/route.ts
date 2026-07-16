import { NextResponse } from "next/server";
import {
  ARCHIVED_PIZZA_SESSION_DEFAULT_TITLE,
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionArchivedRow,
  normalizeCloudPizzaSessionNameInput,
} from "@/lib/cloud-pizza-sessions";
import { createPizzaSession, migratePizzaSession } from "@/lib/pizza-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete this archived pizza session." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "archived")
    .select("id,status,updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Archived pizza session not found." }, { status: 404 });

  return NextResponse.json({ deleted: true, session: data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to update this archived pizza session." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid pizza session name." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const sessionName = normalizeCloudPizzaSessionNameInput(record.name ?? record.sessionName ?? record.title);
  const updatedAt = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "archived")
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const archivedSession = normalizeCloudPizzaSessionArchivedRow(existing);
  if (!archivedSession) return NextResponse.json({ error: "Archived pizza session not found." }, { status: 404 });
  const sessionData = migratePizzaSession(archivedSession.session_data);
  if (!sessionData) return NextResponse.json({ error: "Archived pizza session data could not be verified." }, { status: 500 });
  const nextSessionData = createPizzaSession({
    ...sessionData,
    sessionName: sessionName ?? undefined,
    updatedAt,
    lastSavedAt: updatedAt,
  });

  const { data, error } = await supabase
    .from("pizza_sessions")
    .update({
      session_data: nextSessionData,
      title: sessionName ?? ARCHIVED_PIZZA_SESSION_DEFAULT_TITLE,
      updated_at: updatedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "archived")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const session = normalizeCloudPizzaSessionArchivedRow(data);
  if (!session) return NextResponse.json({ error: "Updated archived pizza session could not be verified." }, { status: 500 });

  return NextResponse.json({ session });
}
