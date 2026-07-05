import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  normalizePartyOrderRow,
  PARTY_ORDER_SELECT,
  validatePartyOrderInput,
} from "@/lib/party-orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function publicToken() {
  return randomBytes(24).toString("base64url");
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to load Party Orders." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("party_orders")
    .select(PARTY_ORDER_SELECT)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const events = (Array.isArray(data) ? data : []).flatMap((row) => {
    const event = normalizePartyOrderRow(row);
    return event ? [event] : [];
  });
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to create Party Orders." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid Party Order payload." }, { status: 400 });
  }

  const validation = validatePartyOrderInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("party_orders")
    .insert({
      ...validation.value,
      user_id: user.id,
      public_token: publicToken(),
      status: "open",
      updated_at: updatedAt,
    })
    .select(PARTY_ORDER_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const event = normalizePartyOrderRow(data);
  if (!event) return NextResponse.json({ error: "Party Order could not be verified." }, { status: 500 });
  return NextResponse.json({ event });
}
