import { NextResponse } from "next/server";
import {
  normalizePartyOrderRow,
  PARTY_ORDER_SELECT,
  summarizePartyOrderActivity,
  validatePartyOrderInput,
  validatePartyOrderStatusUpdate,
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

  return NextResponse.json({ event, activity });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to update this Party Order." }, { status: 401 });
  }

  const { data: existingData, error: existingError } = await supabase
    .from("party_orders")
    .select(PARTY_ORDER_SELECT)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const existing = normalizePartyOrderRow(existingData);
  if (!existing) return NextResponse.json({ error: "Party Order could not be found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Party Order status is invalid." }, { status: 400 });
  }

  const record = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const detailKeys = ["title", "pizzaDateTime", "ordersCloseAt", "guestNote", "allowedPizzaIds", "pizza_datetime", "orders_close_at", "guest_note", "allowed_pizza_ids"];
  const isStatusUpdate = typeof record.status === "string" && !detailKeys.some((key) => key in record);
  let updateValues: {
    status?: "open" | "closed";
    title?: string;
    pizza_datetime?: string;
    orders_close_at?: string;
    guest_note?: string | null;
    allowed_pizza_ids?: string[];
    updated_at: string;
  };
  if (isStatusUpdate) {
    const validation = validatePartyOrderStatusUpdate(body, existing);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    updateValues = {
      status: validation.value.status,
      updated_at: new Date().toISOString(),
    };
  } else {
    const validation = validatePartyOrderInput(body);
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
    updateValues = {
      title: validation.value.title,
      pizza_datetime: validation.value.pizza_datetime,
      orders_close_at: validation.value.orders_close_at,
      guest_note: validation.value.guest_note,
      allowed_pizza_ids: validation.value.allowed_pizza_ids,
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("party_orders")
    .update(updateValues)
    .eq("id", existing.id)
    .eq("user_id", user.id)
    .select(PARTY_ORDER_SELECT)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const event = normalizePartyOrderRow(data);
  if (!event) return NextResponse.json({ error: "Party Order could not be updated." }, { status: 500 });
  return NextResponse.json({ event });
}
