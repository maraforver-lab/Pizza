import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  isPartyOrderOpen,
  normalizePublicPartyOrderEditableSubmission,
  validatePublicPartyOrderSubmissionInput,
} from "@/lib/party-orders";

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicToken: string; editToken: string }> },
) {
  const { publicToken, editToken } = await context.params;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .rpc("get_public_party_order_submission", {
      token_value: publicToken,
      edit_token_value: editToken,
    })
    .maybeSingle();

  if (error) return NextResponse.json({ error: "This pizza order could not be loaded." }, { status: 500 });
  const editable = normalizePublicPartyOrderEditableSubmission(data);
  if (!editable) return NextResponse.json({ error: "This pizza order could not be found." }, { status: 404 });

  return NextResponse.json(editable);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ publicToken: string; editToken: string }> },
) {
  const { publicToken, editToken } = await context.params;
  const supabase = await getSupabaseServerClient();

  const { data: existingData, error: existingError } = await supabase
    .rpc("get_public_party_order_submission", {
      token_value: publicToken,
      edit_token_value: editToken,
    })
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: "This pizza order could not be loaded." }, { status: 500 });
  const existing = normalizePublicPartyOrderEditableSubmission(existingData);
  if (!existing) return NextResponse.json({ error: "This pizza order could not be found." }, { status: 404 });
  if (!isPartyOrderOpen(existing.event)) return NextResponse.json({ error: "Orders are closed for this party." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Order details are invalid." }, { status: 400 });
  }

  const validation = validatePublicPartyOrderSubmissionInput(body, existing.event);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const { data, error } = await supabase
    .rpc("update_public_party_order_submission", {
      token_value: publicToken,
      edit_token_value: editToken,
      guest_name_value: validation.value.guest_name,
      guest_comment_value: validation.value.guest_comment,
      items_value: validation.value.items,
    })
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Your order could not be updated. Please try again." }, { status: 500 });
  }
  const submissionRow = data as { submission_id?: unknown; edit_token?: unknown; updated_at?: unknown };

  return NextResponse.json({
    submission: {
      id: typeof submissionRow.submission_id === "string" ? submissionRow.submission_id : existing.submission.id,
      editToken: typeof submissionRow.edit_token === "string" ? submissionRow.edit_token : editToken,
      updatedAt: typeof submissionRow.updated_at === "string" ? submissionRow.updated_at : undefined,
      guestName: validation.value.guest_name,
      guestComment: validation.value.guest_comment,
      items: validation.value.items,
      totalQuantity: validation.value.totalQuantity,
    },
  });
}
