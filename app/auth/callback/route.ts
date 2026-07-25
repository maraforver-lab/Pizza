import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowType = requestUrl.searchParams.get("type");
  const fallbackNext = flowType === "recovery" ? "/account/reset-password" : "/account";
  const requestedNext = requestUrl.searchParams.get("next") ?? fallbackNext;
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : fallbackNext;

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectUrl = new URL(next, requestUrl.origin);
      if (next === "/account/reset-password" || flowType === "recovery") {
        redirectUrl.searchParams.set("recovery", "1");
      } else {
        redirectUrl.searchParams.set("confirmed", "1");
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (next === "/account/reset-password") {
    return NextResponse.redirect(new URL("/account/reset-password?authError=expired", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/account?authError=confirmation", requestUrl.origin));
}
