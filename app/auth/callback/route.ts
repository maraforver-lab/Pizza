import { NextResponse } from "next/server";
import {
  ACCOUNT_RECOVERY_NEXT_PATH,
  appendAuthResult,
  safeInternalAuthPath,
} from "@/lib/account-access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/account";
  const next = safeInternalAuthPath(requestedNext, "/account");

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(appendAuthResult(next, "confirmed", "1"), requestUrl.origin));
  }

  if (next === ACCOUNT_RECOVERY_NEXT_PATH) {
    return NextResponse.redirect(new URL(appendAuthResult(ACCOUNT_RECOVERY_NEXT_PATH, "authError", "recovery"), requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/account?authError=confirmation", requestUrl.origin));
}
