import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  COMPLETED_PIZZA_SESSION_DEFAULT_TITLE,
  normalizeCloudPizzaSessionHistoryRow,
  normalizeCompletedPizzaSessionTitleInput,
} from "@/lib/cloud-pizza-sessions";
import { createPizzaSession, migratePizzaSession } from "@/lib/pizza-session";
import { PIZZA_SESSION_PHOTO_BUCKET } from "@/lib/pizza-session-photo";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function withSignedPizzaPhotoUrl(row: unknown, supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return row;
  const record = row as Record<string, unknown>;
  const session = migratePizzaSession(record.session_data ?? record.sessionData);
  if (!session?.photo?.path) return row;

  const { data } = await supabase.storage
    .from(PIZZA_SESSION_PHOTO_BUCKET)
    .createSignedUrl(session.photo.path, 60 * 60);
  if (!data?.signedUrl) return row;

  return {
    ...record,
    session_data: {
      ...session,
      photo: {
        ...session.photo,
        url: data.signedUrl,
      },
    },
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load this completed pizza session." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const session = normalizeCloudPizzaSessionHistoryRow(await withSignedPizzaPhotoUrl(data, supabase));
  if (!session) return NextResponse.json({ session: null }, { status: 404 });

  return NextResponse.json({ session });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete this pizza session." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .select("id,status,updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Completed pizza session not found." }, { status: 404 });

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
    return NextResponse.json({ error: "Sign in to update this pizza session." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid pizza session title." }, { status: 400 });
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const customTitle = normalizeCompletedPizzaSessionTitleInput(record.name ?? record.sessionName ?? record.title);
  const updatedAt = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const existingSession = normalizeCloudPizzaSessionHistoryRow(existing);
  if (!existingSession) return NextResponse.json({ error: "Completed pizza session not found." }, { status: 404 });
  const sessionData = migratePizzaSession(existingSession.session_data);
  if (!sessionData) return NextResponse.json({ error: "Completed pizza session data could not be verified." }, { status: 500 });
  const nextSessionData = createPizzaSession({
    ...sessionData,
    sessionName: customTitle ?? undefined,
    updatedAt,
    lastSavedAt: updatedAt,
  });

  const { data, error } = await supabase
    .from("pizza_sessions")
    .update({
      title: customTitle ?? COMPLETED_PIZZA_SESSION_DEFAULT_TITLE,
      session_data: nextSessionData,
      updated_at: updatedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Completed pizza session not found." }, { status: 404 });

  const session = normalizeCloudPizzaSessionHistoryRow(await withSignedPizzaPhotoUrl(data, supabase));
  if (!session) return NextResponse.json({ error: "Updated pizza session could not be verified." }, { status: 500 });

  return NextResponse.json({ session });
}
