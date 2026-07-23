import { NextResponse } from "next/server";
import {
  ACCOUNT_ADMIN_SELF_DELETION_ERROR,
  deleteSignedInUserAccount,
} from "@/lib/account-full-deletion";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to delete your DoughTools account." }, { status: 401 });
  }

  try {
    const result = await deleteSignedInUserAccount({ user });
    if (result.blockedReason === "adminRole") {
      return NextResponse.json({ ...result, error: ACCOUNT_ADMIN_SELF_DELETION_ERROR }, { status: 403 });
    }

    let currentSessionRevoked = false;
    if (result.success) {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      currentSessionRevoked = !signOutError || result.auth.deleted;
    }

    return NextResponse.json(
      { ...result, currentSessionRevoked },
      { status: result.success ? 200 : 207 },
    );
  } catch {
    return NextResponse.json({
      error: "Your DoughTools account could not be deleted.",
    }, { status: 500 });
  }
}
