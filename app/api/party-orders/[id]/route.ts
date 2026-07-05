import { NextResponse } from "next/server";
import {
  normalizePartyOrderRow,
  PARTY_ORDER_SELECT,
} from "@/lib/party-orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load this Party Order." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("party_orders")
    .select(PARTY_ORDER_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const event = normalizePartyOrderRow(data);
  if (!event) return NextResponse.json({ event: null }, { status: 404 });
  return NextResponse.json({ event });
}
