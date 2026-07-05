import { NextResponse } from "next/server";
import {
  CLOUD_PIZZA_SESSION_SELECT,
  normalizeCloudPizzaSessionHistoryRow,
  sortCloudPizzaSessionHistoryRows,
} from "@/lib/cloud-pizza-sessions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  const sessions = sortCloudPizzaSessionHistoryRows(
    (Array.isArray(data) ? data : []).flatMap((row) => {
      const normalized = normalizeCloudPizzaSessionHistoryRow(row);
      return normalized ? [normalized] : [];
    }),
  ).slice(0, 5);

  return NextResponse.json({ sessions });
}
