import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ADMIN_APP_ROLE,
  APP_ROLE_CLAIM,
  APP_ROLES,
  appRoleFromAccessToken,
  appRoleFromJwtClaims,
  normalizeAppRole,
} from "@/lib/auth/roles";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Patch 444B admin role foundation", () => {
  it("defines a narrow basic/admin role contract", () => {
    expect(APP_ROLES).toEqual(["basic", "admin"]);
    expect(ADMIN_APP_ROLE).toBe("admin");
    expect(APP_ROLE_CLAIM).toBe("user_role");
    expect(normalizeAppRole("admin")).toBe("admin");
    expect(normalizeAppRole("basic")).toBe("basic");
    expect(normalizeAppRole("owner")).toBe("basic");
    expect(appRoleFromJwtClaims({ user_role: "admin" })).toBe("admin");
    expect(appRoleFromJwtClaims({ user_role: "super_admin" })).toBe("basic");
    expect(appRoleFromAccessToken(undefined)).toBe("basic");
    expect(appRoleFromAccessToken("not-a-jwt")).toBe("basic");
  });

  it("creates authoritative user_roles storage without self-promotion policies", () => {
    const migrationPath = "supabase/migrations/20260720120000_create_user_roles_and_admin_hook.sql";
    expect(existsSync(join(process.cwd(), migrationPath))).toBe(true);
    const migration = source(migrationPath);

    expect(migration).toContain("create type public.app_role as enum ('basic', 'admin')");
    expect(migration).toContain("when duplicate_object then null");
    expect(migration).toContain("create table if not exists public.user_roles");
    expect(migration).toContain("user_id uuid primary key references auth.users(id) on delete cascade");
    expect(migration).toContain("role public.app_role not null default 'basic'");
    expect(migration).toContain("alter table public.user_roles enable row level security");
    expect(migration).toContain("revoke all on table public.user_roles from public");
    expect(migration).toContain("revoke all on table public.user_roles from anon");
    expect(migration).toContain("revoke all on table public.user_roles from authenticated");
    expect(migration).toContain("grant select on table public.user_roles to supabase_auth_admin");
    expect(migration).not.toContain("grant select on table public.user_roles to authenticated");
    expect(migration).toContain("create policy \"Auth hook can read app roles\"");
    expect(migration).not.toMatch(/for insert\s+to authenticated|for update\s+to authenticated|for delete\s+to authenticated/i);
  });

  it("creates safe basic defaults for existing and new Auth users", () => {
    const migration = source("supabase/migrations/20260720120000_create_user_roles_and_admin_hook.sql");

    expect(migration).toContain("create or replace function public.handle_new_user_role()");
    expect(migration).toContain("security definer");
    expect(migration).toContain("after insert on auth.users");
    expect(migration).toContain("values (new.id, 'basic')");
    expect(migration).toContain("select id, 'basic'");
    expect(migration).toContain("from auth.users");
    expect(migration).toContain("on conflict (user_id) do nothing");
    expect(migration).not.toMatch(/select id, 'admin'|values \(new\.id, 'admin'\)/i);
  });

  it("adds the Supabase Custom Access Token Hook claim without exposing a role write API", () => {
    const migration = source("supabase/migrations/20260720120000_create_user_roles_and_admin_hook.sql");
    const routes = source("app/api/admin/status/route.ts");

    expect(migration).toContain("create or replace function public.custom_access_token_hook(event jsonb)");
    expect(migration).toContain("'{user_role}'");
    expect(migration).toContain("to_jsonb(coalesce(assigned_role, 'basic'::public.app_role)::text)");
    expect(migration).toContain("grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin");
    expect(migration).toContain("revoke all on function public.custom_access_token_hook(jsonb) from authenticated");
    expect(routes).not.toMatch(/POST|PATCH|PUT|DELETE/);
  });

  it("adds owner-safe role lookup RPCs without arbitrary user UUID input", () => {
    const migration = source("supabase/migrations/20260720120000_create_user_roles_and_admin_hook.sql");

    expect(migration).toContain("create or replace function public.current_user_app_role()");
    expect(migration).toContain("caller_user_id uuid := auth.uid()");
    expect(migration).toContain("where user_id = caller_user_id");
    expect(migration).toContain("return coalesce(assigned_role, 'basic'::public.app_role)::text");
    expect(migration).toContain("grant execute on function public.current_user_app_role() to authenticated");
    expect(migration).toContain("create or replace function public.current_user_is_admin()");
    expect(migration).not.toMatch(/current_user_app_role\([^)]*uuid|get_role_for_user|get.*role.*user_id/i);
  });

  it("uses server-side table rechecks for protected admin rendering and API guards", () => {
    const adminHelper = source("lib/auth/admin.ts");
    const adminPage = source("app/admin/page.tsx");
    const adminLayout = source("app/admin/layout.tsx");
    const statusRoute = source("app/api/admin/status/route.ts");

    expect(adminHelper).toContain(".rpc(\"current_user_app_role\")");
    expect(adminHelper).toContain("requireAdmin()");
    expect(adminHelper).toContain("requireAdminForRequest(request: Request)");
    expect(adminHelper).toContain("redirect(\"/account?next=/admin\")");
    expect(adminHelper).toContain("notFound()");
    expect(adminHelper).toContain("role !== ADMIN_APP_ROLE");
    expect(adminLayout).toContain("await requireAdmin()");
    expect(statusRoute).toContain("getSupabaseRouteClient(request)");
    expect(statusRoute).toContain("getCurrentAppRole(supabase)");
    expect(statusRoute).not.toMatch(/localStorage|user_metadata|Account preferences|decode/i);
    expect(adminPage).not.toContain("await requireAdmin()");
  });

  it("adds a protected Admin shell without private user-content browsing", () => {
    const adminPage = source("app/admin/page.tsx");
    const adminLayout = source("app/admin/layout.tsx");

    expect(adminLayout).toContain("noindexMetadata");
    expect(adminPage).toContain("Product administration");
    expect(adminPage).toContain("does not expose private Pizza Sessions, Party Orders, photos, notes, emails or account preferences");
    expect(adminPage).toContain("Seasonal appearance");
    expect(adminPage).toContain("Bake Timer sounds");
    expect(adminPage).toContain("Public statistics");
    expect(adminPage).not.toMatch(/pizza_sessions|party_orders|account_preferences|storage\.from|auth\.admin/i);
  });

  it("shows the Account admin entry only through a server role-status check", () => {
    const accountPage = source("app/account/page.tsx");
    const component = source("components/account/AccountAdminEntryCard.tsx");

    expect(accountPage).toContain("AccountAdminEntryCard");
    expect(component).toContain("fetch(\"/api/admin/status\"");
    expect(component).toContain("if (!status?.isAdmin || status.role !== ADMIN_APP_ROLE) return null");
    expect(component).toContain("href=\"/admin\"");
    expect(component).toContain("Private user activity is not exposed here.");
    expect(component).not.toMatch(/localStorage|sessionStorage|user_metadata/);
  });

  it("documents first-admin bootstrap without adding a public bootstrap endpoint", () => {
    const doc = source("docs/admin-bootstrap.md");
    const apiFiles = [
      "app/api/admin/status/route.ts",
      "lib/auth/admin.ts",
    ].map(source).join("\n");

    expect(doc).toContain("update public.user_roles");
    expect(doc).toContain("where user_id = '<AUTH_USER_UUID>'::uuid");
    expect(doc).toContain("Do not create a public bootstrap endpoint");
    expect(doc).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(doc).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    expect(apiFiles).not.toMatch(/bootstrap|assignAdmin|promote|setRole/i);
  });
});
