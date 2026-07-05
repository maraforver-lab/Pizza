import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionHistoryRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession } from "@/lib/pizza-session";
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

  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("pizza_sessions")
    .update({
      status: "archived",
      updated_at: updatedAt,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .select("id,status,updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Completed pizza session not found." }, { status: 404 });

  return NextResponse.json({ archived: true, session: data });
}
