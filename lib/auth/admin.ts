import { NextResponse } from "next/server";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ADMIN_APP_ROLE, type AppRole, normalizeAppRole } from "@/lib/auth/roles";
import { getSupabaseRouteClient, getSupabaseServerClient } from "@/lib/supabase/server";

export const USER_ROLE_SELECT = "user_id, role, updated_at";

export type UserRoleRow = {
  user_id: string;
  role: AppRole;
  updated_at?: string | null;
};

export type AdminIdentity = {
  role: typeof ADMIN_APP_ROLE;
  supabase: SupabaseClient;
  user: User;
};

export type AdminRequestGuardResult =
  | (AdminIdentity & { authorized: true })
  | { authorized: false; error: string; status: 401 | 403; user: User | null };

export async function getCurrentAppRole(supabase: SupabaseClient): Promise<AppRole> {
  const { data, error } = await supabase.rpc("current_user_app_role");

  if (error || !data) return "basic";
  return normalizeAppRole(data);
}

export async function getSignedInUserAppRole(): Promise<{ role: AppRole; supabase: SupabaseClient; user: User | null }> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  if (!user) return { role: "basic", supabase, user: null };
  const role = await getCurrentAppRole(supabase);
  return { role, supabase, user };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const { role, supabase, user } = await getSignedInUserAppRole();

  if (!user) {
    redirect("/account?next=/admin");
  }

  if (role !== ADMIN_APP_ROLE) {
    notFound();
  }

  return { role: ADMIN_APP_ROLE, supabase, user };
}

export async function requireAdminForRequest(request: Request): Promise<AdminRequestGuardResult> {
  const { supabase, user } = await getSupabaseRouteClient(request);
  if (!user) {
    return { authorized: false, error: "Sign in to access admin tools.", status: 401, user: null };
  }

  const role = await getCurrentAppRole(supabase);
  if (role !== ADMIN_APP_ROLE) {
    return { authorized: false, error: "Not authorized.", status: 403, user };
  }

  return { authorized: true, role: ADMIN_APP_ROLE, supabase, user };
}

export function adminGuardErrorResponse(result: Exclude<AdminRequestGuardResult, AdminIdentity & { authorized: true }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
