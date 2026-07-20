# Patch 444B: Basic and Admin Roles

## 1. Patch 444A Decision

Patch 444A recommended the hybrid RBAC model now implemented here:

- `public.user_roles` is authoritative.
- JWT claim `user_role` is derived through a Supabase Custom Access Token Hook.
- Server-rendered admin access re-checks the authoritative role source.
- Future admin APIs use the same server guard.
- Admin manages public product configuration only and does not browse private user content.

## 2. Role Model

The application role contract is:

```text
basic
admin
```

Unknown, missing or malformed role values normalize to `basic` for non-authoritative presentation. Protected admin authorization still uses the authoritative database lookup.

## 3. Role Source of Truth

`public.user_roles` contains one row per Auth user:

```text
user_id uuid primary key references auth.users(id) on delete cascade
role public.app_role not null default basic
created_at timestamptz
updated_at timestamptz
updated_by uuid nullable
```

The table stores no emails, names, profile content or user-facing display data.

## 4. JWT Claim

The Custom Access Token Hook writes exactly one application role claim:

```text
user_role: "basic" | "admin"
```

The hook preserves existing claims and does not include private user data, Account preferences, session counts, theme configuration or sound preferences.

## 5. Token-Hook Activation

The migration creates `public.custom_access_token_hook(jsonb)` and grants execution to `supabase_auth_admin`, but Supabase hosting still requires enabling the hook in the Dashboard. The app remains safe before activation because `/admin` uses the authoritative role lookup.

## 6. Authoritative Server Checks

Server helpers use the existing Supabase cookie and bearer authentication paths. They identify the user with `auth.getUser()` and resolve the role through `public.current_user_app_role()`, which derives identity from `auth.uid()`.

Signed-out users are redirected to Account for page access. Authenticated non-admin users receive a non-disclosing `notFound()` response for `/admin`; admin APIs return `403`.

## 7. RLS and Grants

`public.user_roles` has RLS enabled.

- Ordinary authenticated users cannot directly select, insert, update or delete role rows.
- `supabase_auth_admin` can read role rows for the token hook.
- Authenticated users can call `public.current_user_app_role()` for their own role only.
- No function accepts an arbitrary user UUID for role lookup.
- No direct role-write API exists.

## 8. New-User Basic Provisioning

An `AFTER INSERT` trigger on `auth.users` inserts a `basic` role row for new users. The trigger does not inspect email or metadata and cannot assign admin.

## 9. Existing-User Backfill

The migration backfills all existing Auth users to `basic` with `ON CONFLICT DO NOTHING`, so any explicitly existing role row is not overwritten.

## 10. `/admin` Protection

`app/admin/layout.tsx` is server-protected with `requireAdmin()`, so future nested admin routes inherit the guard. `app/admin/page.tsx` contains informational placeholders only.

The shell includes:

- Appearance campaigns placeholder for Patch 445.
- Bake Timer sounds placeholder for Patch 446.
- Public statistics placeholder for Patch 447.

It does not include user lists, email lists, Pizza Session browsers, Review-note browsers, photo browsers, Party Order browsers or role editors.

## 11. Account Admin Entry

The Account page includes a small `AccountAdminEntryCard`. It appears only after `/api/admin/status` confirms the signed-in user's authoritative role is `admin`. Basic users should never see the entry, and hiding it is not treated as a security boundary.

## 12. Privacy Boundary

Patch 444B does not change RLS on:

- `public.pizza_sessions`
- Pizza Session photo storage
- `public.account_preferences`
- `public.party_orders`
- `public.party_order_submissions`
- Party Order item/submission tables

Admin access does not broaden owner-scoped access.

## 13. Bootstrap

`docs/admin-bootstrap.md` documents the trusted first-admin procedure. It uses a placeholder `<AUTH_USER_UUID>` and does not commit a real UUID, email, token or secret.

## 14. Revocation

Changing the authoritative row back to `basic` takes effect immediately on the next server-rendered `/admin` request or admin API request. Existing JWTs may keep a stale `user_role` claim until refresh; stale claims are not sufficient for protected admin access.

## 15. Migration and Deployment Order

1. Review the migration.
2. Apply the Supabase migration.
3. Enable the Custom Access Token Hook in Supabase Dashboard.
4. Bootstrap the intended admin using trusted SQL and exact Auth UUID.
5. Verify the role row.
6. Sign out and sign back in or refresh the token.
7. Deploy the matching application commit.
8. Test signed-out `/admin`.
9. Test basic-user `/admin`.
10. Test admin `/admin`.
11. Verify no public navigation or sitemap exposure.
12. Verify no private user data is visible.

No production migration, hook activation, role assignment or deployment was performed in this patch.

## 16. Rollback

- Revoke admin by setting the row back to `basic`.
- Disable the `/admin` shell if needed.
- Disable the Auth Hook if role claims must stop.
- Keep `public.user_roles` unless a full database rollback is required.

## 17. Test Coverage

Patch 444B adds focused tests for:

- role normalization;
- migration role storage and grants;
- default basic provisioning;
- Custom Access Token Hook behavior;
- authoritative server guards;
- protected Admin shell;
- Account Admin entry;
- noindex/sitemap exclusion;
- bootstrap documentation;
- unchanged public navigation and private-data boundaries.

## 18. Known Limitations

- The migration was not applied to production.
- The hosted Auth Hook was not enabled.
- No admin role was assigned.
- Browser validation requires safe signed-out/basic/admin fixtures.
- Generated Supabase database types are not present in this repository; narrow local TypeScript types are used instead.

## 19. Patch 445-447 Integration Points

Patch 445 can add prebuilt seasonal appearance campaigns using the admin guard.

Patch 446 can add prebuilt Bake Timer sound-theme availability controls and Account preference integration.

Patch 447 can add exact admin aggregate counts and rounded public About counts.
