# Patch 444A: Admin Security Architecture Audit

Audit date: 2026-07-20  
Requested starting commit: `9a19b723cddfa87695d1ced2b5a28c6c921a39f9`  
Actual audited starting commit: `9a19b723cddfa87695d1ced2b5a28c6c921a39f9`  
Audit branch: `patch/444a-admin-security-architecture-audit`

External references used:

- Supabase Custom Claims and RBAC: `https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac`
- Supabase Auth Hooks: `https://supabase.com/docs/guides/auth/auth-hooks`
- Supabase API keys: `https://supabase.com/docs/guides/getting-started/api-keys`
- Supabase user management and public-schema guidance: `https://supabase.com/docs/guides/auth/managing-user-data`

This patch is audit-only. It does not implement admin roles, `/admin`, themes, sound themes, user counts, migrations, RLS policies, UI, role assignment or deployment.

## 1. Executive summary

DoughTools currently has authentication and owner-scoped persistence, but no application role model.

Current security boundary:

- Supabase Auth identifies the signed-in user.
- API routes and server pages call `supabase.auth.getUser()`.
- Data access is constrained mostly by `auth.uid() = user_id` RLS policies.
- The server and browser clients use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- No service-role Supabase client exists in the repository.
- No middleware, shared `/admin` guard or role claim exists.

The smallest secure admin architecture is a hybrid role model:

- `public.user_roles` is the authoritative role table.
- Every user is effectively `basic`; explicitly authorized users are `admin`.
- A Supabase Custom Access Token Hook copies the authoritative role into a JWT claim such as `user_role`.
- Server `/admin` pages and admin APIs use a shared server-side admin guard.
- Admin write APIs perform a fresh server-side role lookup against `public.user_roles`, not only a client-visible claim.
- RLS for future admin tables can use the JWT claim for policy checks where appropriate.
- Private user-content tables remain owner-scoped and are not made broadly readable by admin.

Patch 444B should create only the role source of truth, token hook, shared authorization helper and protected `/admin` shell. Product configuration belongs in later patches.

## 2. Current auth architecture

Inspected files:

- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `app/auth/callback/route.ts`
- `app/account/page.tsx`
- `app/account/layout.tsx`
- `components/GlobalToolNavigation.tsx`
- `app/account/party-orders/**`
- `app/account/pizza-sessions/[id]/page.tsx`
- `app/api/**`

Current flow:

```text
user signs in or confirms email
-> Supabase issues a browser/server session
-> browser client stores and refreshes Supabase session through @supabase/ssr
-> /auth/callback exchanges the code for a session and sets cookies
-> Account page reads supabase.auth.getUser() in the browser
-> selected account subroutes read supabase.auth.getUser() on the server
-> API routes read supabase.auth.getUser() from cookie or bearer-token client
-> Supabase queries run as the authenticated user
-> RLS policies compare auth.uid() with user-owned columns
```

Current auth diagram:

```text
Browser
  | @supabase/ssr browser client
  | NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  v
Supabase Auth session
  | cookies / browser session
  v
Next server route
  | getSupabaseServerClient()
  | or getSupabaseRouteClient(request)
  v
Supabase PostgREST / Storage as authenticated user
  | auth.uid()
  v
Owner-scoped RLS policies
```

Answers:

1. The user identity proof is Supabase Auth's verified session. Application code uses `User.id` from `auth.getUser()`.
2. Cookie and bearer flows are partly consistent. `getSupabaseRouteClient(request)` supports cookie first and bearer fallback. Some API routes still call `getSupabaseServerClient()` directly and therefore depend on SSR cookies.
3. Access tokens are validated by Supabase SDK `auth.getUser()`, not by custom JWT parsing in DoughTools.
4. API routes do not all use one shared auth helper. Active-session routes use `getSupabaseRouteClient`; preferences, history, photos and Party Orders mostly use direct server client calls.
5. Authorization is currently ownership-based, not role-based.
6. No application role system exists.
7. No current `app_metadata`, `user_metadata` or custom claim is used as a role.
8. Client-editable metadata does not currently affect authorization because no metadata-based authorization exists.
9. No elevated Supabase service-role endpoint was found in the repo.
10. Service-role access is not currently implemented. The audit found only publishable-key Supabase clients.
11. There is no current role-change behavior.
12. With future JWT roles, role changes require token refresh to update claims. Admin APIs should additionally table-check role for high-risk writes to avoid stale-token privilege after revocation.

## 3. Current authorization and RLS

Inspected migrations:

- `20260704183000_create_pizza_sessions.sql`
- `20260705113000_create_pizza_session_photos_bucket.sql`
- `20260705200000_create_party_orders.sql`
- `20260705203000_create_public_party_order_lookup.sql`
- `20260705210000_create_party_order_submissions.sql`
- `20260706093000_allow_archived_party_orders.sql`
- `20260707103000_allow_owner_delete_party_order_submissions.sql`
- `20260707110000_add_party_order_submission_edit_tokens.sql`
- `20260715120000_create_account_preferences.sql`
- `20260716120000_archive_active_pizza_session_replacements.sql`
- `20260716130000_session_names_and_retention_limits.sql`
- `20260718120000_no_archive_active_session_replacement.sql`
- `20260718123000_add_party_order_time_zone.sql`

Current database model:

| Area | Tables / objects | Current rule |
| --- | --- | --- |
| Pizza Sessions | `public.pizza_sessions` | RLS enabled. Users select/insert/update/delete only rows where `auth.uid() = user_id`, with status-specific delete limits. |
| Active-session replacement | `replace_active_pizza_session(...)` | Security-definer function, but uses `auth.uid()` as caller identity and owner-scoped row locks. |
| Completed retention | `trim_pizza_session_retention_for_user(...)` | Security-definer function rejects another authenticated user's target ID. Trigger trims completed rows beyond 15. |
| Photos | private `pizza-session-photos` bucket | Storage object policies require first path folder to match `auth.uid()`. Signed URLs are generated only after owner row checks. |
| Account preferences | `public.account_preferences` | RLS enabled. Users select/insert/update only own `user_id`. |
| Party Orders | `public.party_orders` | RLS enabled. Owners select/insert/update by `auth.uid() = user_id`. |
| Party Order submissions | `public.party_order_submissions`, `public.party_order_items` | Owners can read and delete via joins through owned `party_orders`. Public guests use token-scoped security-definer RPCs. |
| Public Party Order lookup | `get_public_party_order`, `submit_public_party_order`, edit-token RPCs | Security-definer functions expose only token-scoped public data or edit-token-scoped own submission data. |

Important finding: public-schema tables are already protected by RLS and narrow security-definer functions. A future admin role must not loosen private owner policies for `pizza_sessions`, photos, Party Orders or Account preferences.

## 4. Current Account preference model

Inspected:

- `app/api/account/preferences/route.ts`
- `lib/account-preferences.ts`
- `components/account/AccountEarlyCompletionPreference.tsx`
- `components/account/AccountGuidancePreference.tsx`
- `supabase/migrations/20260715120000_create_account_preferences.sql`

Current behavior:

- `public.account_preferences` stores per-user preference data.
- Missing rows normalize to default values.
- Current stored field: `allow_early_timed_step_completion`.
- API requires signed-in user through `auth.getUser()`.
- Reads and writes are owner-scoped through both `.eq("user_id", user.id)` and RLS.
- PATCH uses `knownUpdatedAt` stale-write protection.

Admin role must not be stored in Account preferences because preferences are user-editable within the user's own row. If admin were added there, a basic user could craft a self-promotion request unless every preference endpoint learned a special-case denial. That would be an avoidable security boundary.

## 5. Role-model comparison

| Model | Summary | Strengths | Weaknesses | Fit |
| --- | --- | --- | --- | --- |
| A. Database `user_roles` table, server lookup | Authoritative table; every admin request checks the table server-side. | Simple mental model, fast revocation, no client-trust issue, easy audit. | RLS policies cannot cheaply read role unless using functions or extra lookups; more per-request DB reads. | Good baseline, especially for `/admin` route guard. |
| B. JWT custom role claim | Trusted hook adds `user_role` claim before token issuance. RLS uses `auth.jwt()`. | Matches Supabase RBAC pattern; efficient RLS; no extra lookup for every policy. | Stale until token refresh; hook deployment/grants required; cannot be sole protection for critical writes after revocation. | Good for RLS and UI hints, not enough alone. |
| C. Trusted `app_metadata` role | Admin role lives in Supabase Auth metadata. | Only privileged server/admin operations should update app metadata; visible in token. | Operationally tied to Auth Admin API/service role; claim staleness; less auditable in public schema; easy to accidentally blur app/user metadata concepts. | Not preferred for this repo's public-table/RLS model. |
| D. Hybrid table plus JWT claim | `user_roles` table is authoritative; token hook copies role into JWT; server guard may table-check. | Strong source of truth, RLS support, efficient public/admin config policies, revocation can be enforced server-side for writes. | More moving parts: table, hook, grants, helper, token-refresh behavior. | Best fit. |

## 6. Recommended role source of truth

Recommendation: hybrid authoritative table plus JWT claim.

Architecture:

```text
auth.users
  -> public.user_roles one row per user
       role: basic | admin
       created_at
       updated_at
       updated_by
       revoked_at optional only if audit/revocation history needs it later
  -> custom_access_token_hook(event jsonb)
       reads public.user_roles
       writes claims.user_role = role
  -> app server
       requireAdmin()
       verifies user
       verifies user_role claim when present
       table-checks role for /admin render and all admin mutations
  -> RLS
       admin-managed config policies can use auth.jwt()->>'user_role'
       private user-content tables remain owner-only
```

Role defaults:

- Missing or malformed role means `basic`.
- New users should receive a `basic` row through a migration/backfill plus auth trigger or equivalent controlled SQL function.
- Existing users must be backfilled to `basic` before enabling role-dependent features.

JWT claim:

- Recommended claim: `user_role`.
- Values: `basic`, `admin`.
- Do not rely on client-editable `user_metadata`.
- Do not expose a UI that lets users edit role.

Server guard:

- Add `requireAdmin()` or equivalent in a server-only module.
- It must call Supabase Auth to identify the user.
- It must perform a trusted table lookup for `role = 'admin'`.
- It must not trust localStorage, query params, client state or Account preferences.
- It should be usable from server components and API routes.

RLS guard:

- For admin-managed config tables, use least privilege and either:
  - a function such as `public.current_user_is_admin()` reading the custom claim, or
  - direct claim checks where policies stay readable.
- For role assignment table itself, do not allow users to insert/update their own admin role.

Revocation:

- Update `public.user_roles.role` from `admin` to `basic`.
- Admin APIs that table-check immediately deny future writes even if an old JWT still has `user_role=admin`.
- RLS checks based only on JWT may remain permissive until token refresh/expiry. Avoid JWT-only protection for high-risk writes.
- UI should ask the user to refresh/sign out and in after role changes.

Rollback:

- Disable `/admin` navigation and routes.
- Revert hook configuration to omit `user_role`.
- Leave `user_roles` rows in place, because `basic` is harmless and useful for count/rollback.

## 7. Admin bootstrap

Recommended first-admin procedure:

1. Deploy the role table, basic backfill, custom access token hook and `/admin` guard code.
2. Identify the product owner's Supabase Auth UUID from a trusted Supabase Dashboard or server-only CLI context.
3. Run a one-time owner-scoped SQL operation in Supabase Dashboard SQL editor or Supabase CLI:

```sql
update public.user_roles
set role = 'admin', updated_at = timezone('utc', now())
where user_id = '<known-product-owner-auth-uuid>';
```

4. Refresh the product owner's Supabase session or sign out/in to receive the JWT claim.
5. Verify `/admin` loads for the owner and returns denial for a basic test account.

Do not:

- hard-code an admin email in browser code;
- expose a public bootstrap endpoint;
- use a query-parameter secret;
- store a reusable bootstrap secret in localStorage;
- let Account preferences mutate roles.

Adding later admins:

- Use a server-only SQL/CLI operation or a future admin UI that itself requires an existing admin and writes through a protected API.
- First version should not include a self-service admin invitation flow.

## 8. Permission matrix

| Capability | Public | Basic | Admin |
| --- | --- | --- | --- |
| View public guides | Yes | Yes | Yes |
| Use standalone Bake Timer | Yes | Yes | Yes |
| Manage own Account | No | Yes | Yes, own account only |
| Manage own Pizza Sessions | No | Yes | Yes, own sessions only |
| Manage own Party Orders | No | Yes | Yes, own orders only |
| View another user's session | No | No | No product UI/API by default |
| View another user's photos | No | No | No product UI/API by default |
| View another user's Party Orders | No | No | No product UI/API by default |
| Open `/admin` | No | No | Yes |
| Read admin theme configuration | No raw table access; may read resolved public active theme only | Same as public | Yes |
| Change admin theme configuration | No | No | Yes |
| Schedule seasonal theme | No | No | Yes |
| Manage available sound themes | No | No | Yes |
| View exact registered-user count | No | No | Yes |
| View rounded public user count | Optional public output only | Optional public output only | Optional public output only plus exact admin count |
| Assign admin role | No | No | Not in first UI; server-only operation or future protected admin action |

Admin product access does not include private user-content browsing. Any future support tooling that requires inspecting private content must be a separate product/security decision with explicit consent and audit logging.

## 9. `/admin` route protection

Current state:

- No `/admin` route exists.
- No middleware exists.
- `privateSeoRoutes` does not include `/admin`.
- Account layout uses noindex metadata, but Account page itself is mostly client-auth.
- Some account subroutes use server-side redirect guards.

Recommended `/admin` policy:

- `/admin` must be a server-protected route group, not client-only gated UI.
- A basic user or signed-out user must not receive admin data in the initial HTML.
- Use `noindexMetadata` and add `/admin` to `privateSeoRoutes`.
- Do not include `/admin` in `publicSeoRoutes`, sitemap or desktop/mobile navigation for non-admins.
- Admin API routes must independently call the same server guard. UI hiding is not authorization.

Unauthorized response:

- Signed-out: redirect to `/account?next=/admin` or the closest existing sign-in pattern.
- Signed-in non-admin: return `notFound()` for the route shell or a plain 403 page. The safer first implementation is `notFound()` to avoid advertising admin functionality.
- API routes: return `403` with generic `{ error: "Not authorized." }`.

Stale token:

- Server guard table-checks admin status and denies revoked users even when JWT claim is stale.
- RLS for direct database reads may still depend on refreshed JWT claims. Admin UI should route writes through server APIs.

## 10. Theme architecture

Current theme state:

- `app/globals.css` defines global CSS custom properties under `:root`.
- `app/layout.tsx` sets static viewport `themeColor: "#FFF8F1"`.
- `app/manifest.ts` sets static `theme_color`.
- No runtime theme registry exists.
- Existing design docs require official DoughTools palette and semantic aliases.

Safe theme scope:

- accent colors chosen from prebuilt DoughTools-compatible palettes;
- page background and subtle surface variables;
- card/surface accents;
- non-interactive decorative icons/patterns;
- optional seasonal logo decoration;
- optional public seasonal message;
- metadata `theme-color` when server-resolved;
- optional default sound-theme mapping later.

Must not change:

- text contrast below accessibility thresholds;
- layout dimensions;
- calculations;
- navigation structure;
- session logic;
- form behavior;
- semantic error/success colors where meaning matters;
- experience-level colors unless intentionally isolated;
- arbitrary CSS/HTML/JS.

Recommended theme registry:

```ts
type PublicThemeId = "default" | "halloween" | "christmas";
```

Theme definitions should live in code, not in editable database CSS. Admin stores only theme IDs and schedule metadata.

## 11. Theme scheduling

Recommended data model for Patch 445:

```text
public_theme_campaigns
  id uuid primary key
  theme_id text not null check in shipped IDs
  enabled boolean not null default true
  starts_at timestamptz null
  ends_at timestamptz null
  priority integer not null default 0
  created_by uuid references auth.users(id)
  updated_by uuid references auth.users(id)
  created_at timestamptz
  updated_at timestamptz
```

Time contract:

- Store all schedule boundaries as `timestamptz` UTC instants.
- Start is inclusive.
- End is exclusive.
- `starts_at = null` means active from beginning.
- `ends_at = null` means no scheduled end.
- Expired campaigns remain rows for audit/history until cleaned deliberately.

Conflict resolution:

- Filter `enabled = true`.
- Active if `starts_at is null or starts_at <= now()` and `ends_at is null or now() < ends_at`.
- Pick highest `priority`, then newest `updated_at`, then deterministic `id`.
- If none active or theme ID missing in the shipped registry, use `default`.

Active-theme resolution:

- Prefer server request-time resolution through a small public-safe config function or API.
- Cache for a short period, for example 60 seconds, with default fallback on outage.
- Avoid build-time environment variables because scheduled campaigns need runtime changes.
- Avoid scheduled cron as the only source of truth; it can miss deployment/outage edges.

Hydration:

- Server should render the active theme class or data attribute to avoid a flash of wrong theme.
- Client can revalidate but must not change layout or calculations.

## 12. Theme preview

Recommended preview model:

- Admin preview is local admin UI state or server-verified preview state.
- Preview never writes active campaign data until confirmed.
- Basic users cannot unlock admin functionality with a `?theme=` query parameter.
- A query parameter may select a public theme only after server verifies admin role and returns a signed/authorized preview response.
- Preview must not modify Pizza Session, Account or Party Order data.

Smallest safe first version:

- `/admin/themes` lists shipped theme IDs.
- Selecting preview applies theme variables in the admin page only.
- "Activate" writes a real campaign through a protected API.

## 13. Sound-theme architecture

Current sound state:

- `lib/bake-timer.ts` contains deterministic timer phases and synthesized tone patterns.
- `lib/use-bake-timer.ts` uses Web Audio and a local `doughtools.bake-timer.sound-enabled.v1` preference.
- `components/session/KitchenBakeTimerPanel.tsx` and `/tools/bake-timer` share the timer.
- No audio assets, URLs or sound theme catalog exists.

Recommended future catalog:

```ts
type BakeTimerSoundThemeId =
  | "classic"
  | "bell"
  | "rooster"
  | "halloween";
```

Responsibilities:

- Admin controls enabled theme IDs and the default enabled sound theme.
- Basic user controls preferred enabled theme in Account preferences.
- Runtime sound on/off remains local to the timer/device.

Implementation recommendations:

- Keep first catalog synthesized through Web Audio where possible.
- If local assets are needed, ship vetted files in the repo with clear provenance.
- Do not allow arbitrary audio URLs or uploads in the first version.
- Normalize perceived volume across themes.
- Keep autoplay restriction handling and failure-safe no-audio behavior.
- When a user's selected theme is disabled, fall back to the admin default, then `classic`.
- Standalone and Kitchen timers must use the same theme resolution.

Admin sound configuration storage can be a separate table from theme campaigns because sound availability and seasonal visuals have different update cadence and future concerns.

## 14. Registered-user definition

Recommended definition:

Registered user = a non-deleted Supabase Auth user that has a permanent account and a corresponding `public.user_roles` row.

Practical details:

- Existing users are backfilled into `public.user_roles` as `basic`.
- New signups create a `basic` role row.
- If Supabase Auth supports anonymous users in the future, exclude anonymous users from public count unless the product explicitly decides otherwise.
- Banned/deleted users should not count once represented in the app-controlled registry.

Rationale:

- Counting `auth.users` directly requires privileged server/database access.
- Counting `public.user_roles` avoids exposing emails or Auth rows and aligns with the role source of truth.
- The count remains stable and auditable.

## 15. Safe aggregate-count architecture

Admin exact count:

- Protected admin API calls `requireAdmin()`.
- Server counts rows in `public.user_roles` matching countable users.
- Return only `{ registeredUsers: number }`.
- Do not return emails, user IDs, signup timestamps or auth metadata.

Public rounded count:

- About page must not receive the exact count.
- Recommended public function/API returns only a rounded label or floor:

```text
under 25: hide
25-49: Over 25
50-99: Over 50
100-249: Over 100
250-499: Over 250
500-999: Over 500
1000-2499: Over 1,000
2500+: largest lower milestone
```

Public controls:

- Admin setting decides whether the About count is shown.
- Public About fallback on database/API outage: hide the count.
- Cache rounded value for a short period or store the rounded floor in a public-safe stats row.

Do not:

- expose Supabase Auth admin API to the browser;
- expose service-role credentials;
- expose exact count publicly;
- add online/currently-active counts.

## 16. Configuration data model

Compared models:

| Model | Pros | Cons | Recommendation |
| --- | --- | --- | --- |
| One `public_site_settings` row | Simple for flags/defaults. | Becomes a JSON grab bag for campaigns and catalog history. | Use only for small global flags such as "show public user count" and default sound theme. |
| Separate normalized tables | Clear validation, RLS and audit behavior. | More migrations. | Preferred for theme campaigns and sound availability. |
| Versioned JSON document | Flexible and easy to diff. | Harder RLS/validation; easier to accidentally permit arbitrary CSS/URLs. | Not first choice. |

Recommended future tables:

- `public.user_roles`
- `public.public_site_settings`
- `public.theme_campaigns`
- `public.bake_timer_sound_theme_settings`
- `public.admin_audit_log`

Theme and sound IDs must be validated against shipped registries, preferably with database check constraints and server validation.

## 17. Admin audit history

First implementation should record at least:

- `created_by` / `updated_by` on admin-managed rows.
- `updated_at` timestamps.

For Patch 445/446, add an `admin_audit_log` table if admin writes are more than a single row:

```text
admin_audit_log
  id uuid
  actor_user_id uuid
  action text
  target_type text
  target_id text
  previous_value jsonb
  next_value jsonb
  created_at timestamptz
```

Do not log private user data. Admin audit history should track product configuration changes only.

## 18. Threat model

| Threat | Risk | Mitigation |
| --- | --- | --- |
| Basic user crafts admin API request | Direct unauthorized write | Every admin API calls `requireAdmin()` and table-checks role. |
| Basic user changes local role state | Client-only bypass | No client state participates in authorization. |
| Basic user changes Account preference to admin | Self-promotion | Role not stored in Account preferences. |
| Stale JWT contains admin after revocation | Continued RLS access until refresh | Admin APIs table-check role; require refresh/sign-out for UI claim changes; use short-lived sessions where possible. |
| Admin route renders client-side before denial | Data leak in HTML | Server-side role guard before rendering. |
| Service-role key bundled in browser | Total data exposure | No service-role client in browser; only server-only env vars if ever needed. |
| SQL/RPC callable directly by basic users | Bypass UI | Revoke function grants from public unless intended; functions check role/owner. |
| Theme config injects CSS/HTML | XSS or layout breakage | Store only shipped theme IDs and limited schedule fields. |
| Sound config injects external URL | Privacy/licensing/security issue | Store only shipped sound theme IDs. |
| User-count endpoint leaks rows | Privacy issue | Return only aggregate count to admin and rounded label publicly. |
| Preview query exposes admin identity or access | Unauthorized preview | Server-verifies admin preview; no public unlock parameter. |
| Overlapping theme schedules | Inconsistent UI | Deterministic priority and tie-break rules. |
| Cache serves expired theme | Seasonal mismatch | Short cache plus start/end checks at resolution time. |
| Inaccessible contrast published | Accessibility regression | Theme registry includes contrast tests; admin cannot edit raw colors. |
| Role-table RLS allows self-edit | Self-promotion | No user insert/update policy for roles; assignment only trusted SQL/admin API. |
| Compromised admin account | Product config damage | Least privilege admin APIs, audit log, no private browsing, optional reauth later. |
| CSRF or repeated admin mutation | Unexpected config changes | Use same-site auth cookies plus server validation; idempotency/stale-write tokens for schedule edits. |
| Stale-write overwrites newer schedule | Lost admin work | Use `updated_at` preconditions or version column on admin config rows. |

## 19. Migration plan

Patch 444B:

- Add role enum/check and `public.user_roles`.
- Backfill existing auth users to `basic`.
- Add trusted first-admin procedure.
- Add Custom Access Token Hook and grants.
- Add server-only admin authorization helper.
- Add protected `/admin` shell with no product configuration.
- Add noindex/private route policy.

Patch 445:

- Add shipped public theme registry in code.
- Add theme campaign storage.
- Add admin theme UI/API.
- Add active-theme server resolution and preview.
- Add public fallback to Default.

Patch 446:

- Add shipped Bake Timer sound-theme registry.
- Add admin sound availability controls.
- Add Account preference for selected enabled sound theme.
- Integrate sound theme into shared Kitchen and standalone timers.

Patch 447:

- Add exact admin registered-user count.
- Add optional rounded About count.
- Add public count display flag and caching/fallback policy.

## 20. Deployment and rollback

Patch 444B deployment order:

1. Apply migration creating `user_roles`, basic defaults/backfill and hook function.
2. Configure Supabase Custom Access Token Hook.
3. Deploy app code with server guard and `/admin` shell.
4. Grant first admin through trusted SQL/CLI.
5. Refresh admin session.
6. Smoke-test signed-out, basic and admin accounts.

Rollback:

- Disable admin link/shell in app.
- Disable the Auth Hook or leave harmless `basic` claim.
- Keep `user_roles` table for future redeploy unless migration rollback is required.
- Revoking admin rows returns everyone to `basic`.

Patch 445-447 rollback:

- Theme: disable campaigns or force `default`.
- Sound: disable non-classic themes and default to `classic`.
- User count: hide public About count; admin exact count can remain protected.

No production role assignment was performed in this audit.

## 21. Test strategy

Current relevant tests:

- `tests/account-preferences.test.ts`: owner-only preferences and stale writes.
- `tests/cloud-pizza-sessions.test.ts`: active-session API, RLS expectations, no service-role bypass, retention, cloud authority.
- `tests/party-orders.test.ts`: Party Order owner RLS, public token RPCs, guest edit tokens.
- `tests/account-responsive-workspace.test.ts`: Account page composition.
- `tests/navigation.test.ts`: global/mobile nav and private/public route exposure.
- `tests/kitchen-bake-timer.test.ts` and `tests/standalone-bake-timer.test.ts`: shared timer behavior.
- `tests/seo-config.test.ts`: private noindex route policy and sitemap exclusion.

Future tests required:

Roles:

- basic default for missing row;
- admin assignment through trusted path;
- self-promotion blocked;
- `/admin` server protection;
- admin API protection;
- RLS on admin-managed tables;
- revocation table-check behavior;
- stale JWT behavior;
- signed-out denial.

Themes:

- default fallback;
- immediate activation;
- future schedule;
- expiry;
- overlap priority;
- preview isolation;
- hydration with no flash;
- accessibility contrast;
- cache invalidation.

Sound themes:

- admin catalog update;
- disabled-theme fallback;
- Account selected theme;
- preview;
- Kitchen and standalone consistency;
- sound-off behavior;
- unsupported audio fallback.

User count:

- exact admin aggregate;
- rounded public aggregate;
- no user rows or emails exposed;
- low-count hiding;
- outage fallback.

## 22. Recommended Patch 444B

Scope:

- Create `public.app_role` or equivalent constrained text values: `basic`, `admin`.
- Create `public.user_roles` with one row per user and default `basic`.
- Backfill current users.
- Add Custom Access Token Hook to copy role into JWT.
- Grant hook execution only to `supabase_auth_admin`; revoke from `anon`, `authenticated`, `public`.
- Add RLS that prevents self-promotion and permits only required role reads.
- Add server-only `requireAdmin()` helper.
- Add protected `/admin` shell and layout metadata.
- Add tests for role defaults, denied basic access, allowed admin shell and no private-data browsing.
- Document first-admin SQL/CLI procedure.

Do not include in 444B:

- theme campaigns;
- sound themes;
- user counts;
- About count;
- broad admin navigation;
- private user-content browsing;
- service-role browser exposure.

Migration required: yes.

Supabase Auth Hook configuration required: yes.

Service-role key required in browser: no.

## 23. Later Patch 445-447 boundaries

Patch 445: seasonal visual themes.

- Code-shipped theme registry.
- `theme_campaigns`.
- server active-theme resolution.
- admin preview.
- no raw CSS/HTML.

Patch 446: Bake Timer sound themes.

- Code-shipped sound registry.
- admin enabled/default sound config.
- Account preference for enabled user theme.
- shared Kitchen/standalone timer integration.
- no arbitrary audio URL/upload.

Patch 447: registered-user count.

- exact admin aggregate.
- optional rounded public About label.
- low-count hiding.
- short caching/fallback.
- no user row exposure.

## 24. Known limitations

- This audit did not inspect the live Supabase Dashboard configuration, Auth Hook settings, token lifetime settings or production RLS state beyond migration files.
- The repository has no `supabase/config.toml`, so local hook configuration details must be added or managed through Supabase Dashboard/CLI in Patch 444B.
- Exact current registered-user count cannot be known from the repository.
- Existing Auth users need a safe backfill plan before role-dependent code is enabled.
- JWT revocation cannot be instantaneous for RLS policies that rely only on token claims. Server-side table checks are required for admin mutations.

Required conclusion: Hybrid role table and JWT claim recommended
