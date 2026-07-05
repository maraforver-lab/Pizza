import { NextResponse } from "next/server";
import {
  normalizePartyOrderRow,
  PARTY_ORDER_SELECT,
  type PartyOrderActivity,
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

  const { data: submissionRows, error: submissionsError } = await supabase
    .from("party_order_submissions")
    .select("id,guest_name,created_at")
    .eq("party_order_id", event.id)
    .order("created_at", { ascending: false });

  if (submissionsError) return NextResponse.json({ error: submissionsError.message }, { status: 500 });
  const submissions = Array.isArray(submissionRows) ? submissionRows : [];
  const submissionIds = submissions
    .map((submission) => typeof submission.id === "string" ? submission.id : "")
    .filter(Boolean);

  let totalPizzaCount = 0;
  if (submissionIds.length) {
    const { data: itemRows, error: itemsError } = await supabase
      .from("party_order_items")
      .select("quantity,submission_id")
      .in("submission_id", submissionIds);

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    totalPizzaCount = (Array.isArray(itemRows) ? itemRows : []).reduce((total, item) => (
      total + (typeof item.quantity === "number" && Number.isFinite(item.quantity) ? item.quantity : 0)
    ), 0);
  }

  const activity: PartyOrderActivity = {
    submissionCount: submissions.length,
    totalPizzaCount,
    latestGuestNames: submissions
      .flatMap((submission) => typeof submission.guest_name === "string" && submission.guest_name.trim() ? [submission.guest_name.trim()] : [])
      .slice(0, 3),
  };

  return NextResponse.json({ event, activity });
}
