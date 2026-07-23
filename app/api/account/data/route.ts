import { NextResponse } from "next/server";
import { deleteSignedInUserCloudApplicationData } from "@/lib/account-data-deletion";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete your DoughTools cloud data." }, { status: 401 });
  }

  try {
    const result = await deleteSignedInUserCloudApplicationData({ user });
    return NextResponse.json(result, { status: result.success ? 200 : 207 });
  } catch {
    return NextResponse.json({
      error: "Your DoughTools cloud data could not be deleted.",
    }, { status: 500 });
  }
}
