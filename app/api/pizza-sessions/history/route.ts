import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionHistoryRow,
  sortCloudPizzaSessionHistoryRows,
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

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load completed pizza sessions." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rowsWithPhotos = await Promise.all((Array.isArray(data) ? data : []).map((row) => withSignedPizzaPhotoUrl(row, supabase)));
  const sessions = sortCloudPizzaSessionHistoryRows(
    rowsWithPhotos.flatMap((row) => {
      const normalized = normalizeCloudPizzaSessionHistoryRow(row);
      return normalized ? [normalized] : [];
    }),
  ).slice(0, 5);

  return NextResponse.json({ sessions });
}
