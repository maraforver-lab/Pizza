import { NextResponse } from "next/server";
import { getCurrentAppRole } from "@/lib/auth/admin";
import { ADMIN_APP_ROLE } from "@/lib/auth/roles";
import { getSupabaseRouteClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { supabase, user } = await getSupabaseRouteClient(request);

  if (!user) {
    return NextResponse.json({ error: "Sign in to check admin access." }, { status: 401 });
  }

  const role = await getCurrentAppRole(supabase);
  return NextResponse.json({
    isAdmin: role === ADMIN_APP_ROLE,
    role,
  });
}
