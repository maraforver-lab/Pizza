import { NextResponse } from "next/server";
import {
  buildPartyOrderPizzaSessionHandoff,
  normalizePartyOrderRow,
  PARTY_ORDER_SELECT,
  summarizePartyOrderActivity,
} from "@/lib/party-orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to create a pizza plan from this Party Order." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("party_orders")
    .select(PARTY_ORDER_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const event = normalizePartyOrderRow(data);
  if (!event) return NextResponse.json({ error: "Party Order could not be found." }, { status: 404 });

  const { data: submissionRows, error: submissionsError } = await supabase
    .from("party_order_submissions")
    .select("id,guest_name,guest_comment,created_at")
    .eq("party_order_id", event.id)
    .order("created_at", { ascending: false });

  if (submissionsError) return NextResponse.json({ error: submissionsError.message }, { status: 500 });
  const submissions = Array.isArray(submissionRows) ? submissionRows : [];
  const submissionIds = submissions
    .map((submission) => typeof submission.id === "string" ? submission.id : "")
    .filter(Boolean);

  let itemRows: unknown[] = [];
  if (submissionIds.length) {
    const { data, error: itemsError } = await supabase
      .from("party_order_items")
      .select("submission_id,pizza_id,pizza_name_snapshot,quantity")
      .in("submission_id", submissionIds);

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    itemRows = Array.isArray(data) ? data : [];
  }

  const activity = summarizePartyOrderActivity(submissions, itemRows);
  const handoff = buildPartyOrderPizzaSessionHandoff(event, activity);
  if (!handoff) {
    return NextResponse.json({
      error: "Collect at least one guest order before creating a pizza plan.",
    }, { status: 400 });
  }

  return NextResponse.json({ handoff });
}
