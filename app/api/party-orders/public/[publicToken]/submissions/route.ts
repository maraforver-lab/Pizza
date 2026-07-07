import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isPartyOrderOpen,
  normalizePublicPartyOrder,
  validatePublicPartyOrderSubmissionInput,
} from "@/lib/party-orders";

export async function POST(
  request: Request,
  context: { params: Promise<{ publicToken: string }> },
) {
  const { publicToken } = await context.params;
  const supabase = await getSupabaseServerClient();

  const { data: partyOrderData, error: partyOrderError } = await supabase
    .rpc("get_public_party_order", { token_value: publicToken })
    .maybeSingle();

  if (partyOrderError) return NextResponse.json({ error: "This party order could not be loaded." }, { status: 500 });
  const partyOrder = normalizePublicPartyOrder(partyOrderData);
  if (!partyOrder) return NextResponse.json({ error: "This party order could not be found." }, { status: 404 });
  if (!isPartyOrderOpen(partyOrder)) return NextResponse.json({ error: "Orders are closed for this party." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Order details are invalid." }, { status: 400 });
  }

  const validation = validatePublicPartyOrderSubmissionInput(body, partyOrder);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const { data, error } = await supabase
    .rpc("submit_public_party_order", {
      token_value: publicToken,
      guest_name_value: validation.value.guest_name,
      guest_comment_value: validation.value.guest_comment,
      items_value: validation.value.items,
    })
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Your order could not be saved. Please try again." }, { status: 500 });
  }
  const submissionRow = data as { submission_id?: unknown; edit_token?: unknown; created_at?: unknown };
  const editToken = typeof submissionRow.edit_token === "string" ? submissionRow.edit_token : "";

  return NextResponse.json({
    submission: {
      id: typeof submissionRow.submission_id === "string" ? submissionRow.submission_id : undefined,
      editToken: editToken || undefined,
      editPath: editToken ? `/order/${partyOrder.public_token}/edit/${editToken}` : undefined,
      createdAt: typeof submissionRow.created_at === "string" ? submissionRow.created_at : undefined,
      guestName: validation.value.guest_name,
      guestComment: validation.value.guest_comment,
      items: validation.value.items,
      totalQuantity: validation.value.totalQuantity,
    },
  });
}
