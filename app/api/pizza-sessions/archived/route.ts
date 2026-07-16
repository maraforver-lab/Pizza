import { NextResponse } from "next/server";
import {
  ARCHIVED_PIZZA_SESSION_RETENTION_LIMIT,
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionArchivedRow,
  sortCloudPizzaSessionArchivedRows,
} from "@/lib/cloud-pizza-sessions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load archived pizza sessions." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pizza_sessions")
    .select(CLOUD_PIZZA_SESSION_SELECT)
    .eq("user_id", user.id)
    .eq("status", "archived")
    .order("archived_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(ARCHIVED_PIZZA_SESSION_RETENTION_LIMIT);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessions = sortCloudPizzaSessionArchivedRows(
    (Array.isArray(data) ? data : []).flatMap((row) => {
      const normalized = normalizeCloudPizzaSessionArchivedRow(row);
      return normalized ? [normalized] : [];
    }),
  ).slice(0, ARCHIVED_PIZZA_SESSION_RETENTION_LIMIT);

  return NextResponse.json({ sessions });
}
