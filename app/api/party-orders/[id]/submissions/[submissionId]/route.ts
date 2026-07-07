import { NextResponse } from "next/server";
import { normalizePartyOrderRow, PARTY_ORDER_SELECT } from "@/lib/party-orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; submissionId: string }> },
) {
  const { id, submissionId } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete this guest order." }, { status: 401 });
  }

  const { data: eventData, error: eventError } = await supabase
    .from("party_orders")
    .select(PARTY_ORDER_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  const event = normalizePartyOrderRow(eventData);
  if (!event) return NextResponse.json({ error: "Party Order could not be found." }, { status: 404 });

  const { data: submission, error: submissionError } = await supabase
    .from("party_order_submissions")
    .select("id,party_order_id")
    .eq("id", submissionId)
    .eq("party_order_id", event.id)
    .maybeSingle();

  if (submissionError) return NextResponse.json({ error: submissionError.message }, { status: 500 });
  if (!submission?.id) return NextResponse.json({ error: "Guest order could not be found." }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("party_order_submissions")
    .delete()
    .eq("id", submission.id)
    .eq("party_order_id", event.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ deleted: true, submissionId: submission.id });
}
