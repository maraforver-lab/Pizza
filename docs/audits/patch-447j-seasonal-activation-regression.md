# Patch 447J: Seasonal Activation Regression Audit

## Executive summary

Production seasonal `Activate now` still fails with `Theme campaign could not be saved.` after Patches 447F-447I. The regression is isolated to the new direct-switch activation path introduced by Patch 447F:

```text
AdminAppearanceClient
-> POST /api/admin/themes/activate-now
-> rpc("admin_activate_theme_now", { p_theme_id })
-> public.admin_activate_theme_now(text)
```

Default activation still uses the older `/api/admin/themes/activate-default` route and `admin_activate_default_theme()` RPC, so it remains working.

The confirmed source-level root cause is in the new `admin_activate_theme_now` PL/pgSQL function. It returns table columns named `enabled`, `version`, and other campaign fields, then uses unqualified column names such as `enabled` and `version` inside an `UPDATE public.theme_campaigns` statement. In PL/pgSQL, `RETURNS TABLE` output columns are variables in the function scope. Those names collide with unqualified table column references and can raise a database runtime error such as an ambiguous column reference. That error is not recognized by `safeThemeMutationError`, so the API returns the generic fallback: `Theme campaign could not be saved.`

Patch 447H made the RPC safer in other ways, but it retained the same unqualified `enabled` and `version` references, so the production behavior can remain broken.

Recommended recovery: **Option B - revert the Admin UI to the last known working seasonal activation behavior first**. Restore seasonal activation by routing `Activate now` back through `POST /api/admin/themes` with `{ themeId, startsAt: now, endsAt: null }`. This restores Default -> seasonal activation and keeps schedule overlap protection. Direct seasonal-to-seasonal switching should be reintroduced later only after the RPC has an integration-level database test or a verified production RPC smoke path.

## Reproduction

Reported production behavior:

1. Open `/admin/appearance` as an Admin.
2. Press a seasonal `Activate now` action.
3. UI shows: `Theme campaign could not be saved.`

Observed during this audit:

- `master` and `origin/master` are on `802970664e469044a5f19630607a62878a50861f`.
- `supabase migration list` shows both direct-switch migrations applied remotely:
  - `20260722100000`
  - `20260722110000`
- Vercel logs show production `POST /api/admin/themes/activate-now` requests.
- The in-app browser and CLI did not have an authenticated Admin session, so the full Admin click path could not be reproduced without bypassing authentication.
- A direct anonymous PostgREST RPC visibility check could not be trusted because the local `.env.local` anon key was rejected by the production Supabase project.

No secrets, tokens, emails or private row contents were printed.

## Working historical behavior

Before Patch 447F, `AdminAppearanceClient.activateTheme` used:

```text
seasonal Activate now
-> POST /api/admin/themes
-> admin_create_theme_campaign(theme_id, starts_at, ends_at)
```

The payload was:

```json
{
  "themeId": "<seasonal theme>",
  "startsAt": "<current ISO time>",
  "endsAt": null
}
```

That path could activate a seasonal theme when no other active campaign overlapped. If another seasonal campaign was active, Admin first had to activate Default or end/disable the campaign. That behavior was clunky, but it was known to work.

Default activation used, and still uses:

```text
POST /api/admin/themes/activate-default
-> admin_activate_default_theme()
```

## Current broken behavior

Patch 447F changed seasonal `Activate now` to:

```text
POST /api/admin/themes/activate-now
body: { "themeId": "<seasonal theme>" }
-> admin_activate_theme_now(p_theme_id)
```

The new RPC is intended to atomically disable the current active seasonal campaign and insert the new active campaign.

Production now fails every seasonal activation through this path, while Default remains functional.

## Database findings

### Applied migrations

Current remote migration history includes:

- `20260722100000_activate_public_theme_now.sql`
- `20260722110000_fix_activate_public_theme_now_rpc.sql`

### RPC signature and grant

The current intended function signature is:

```sql
public.admin_activate_theme_now(p_theme_id text)
```

The route calls it with:

```ts
rpc("admin_activate_theme_now", { p_theme_id: body.themeId })
```

The grant exists:

```sql
grant execute on function public.admin_activate_theme_now(text) to authenticated;
```

This matches the existing Admin RPC pattern: execution is granted to `authenticated`, then `require_theme_admin()` enforces the actual admin boundary inside the security-definer function.

### Function body problem

Both 447F and 447H define the function with:

```sql
returns table (
  id uuid,
  theme_id text,
  enabled boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text
)
```

The function then uses unqualified names:

```sql
update public.theme_campaigns
  set enabled = false,
      updated_by = caller_user_id,
      updated_at = activation_time,
      version = version + 1
  where enabled is true
    and theme_id <> 'default'
    and starts_at <= activation_time
    and (ends_at is null or activation_time < ends_at);
```

In PL/pgSQL, `RETURNS TABLE` output fields are variables. This creates a collision between output variables and table columns. The function should have qualified the target table columns, for example through an alias:

```sql
update public.theme_campaigns as campaign
set enabled = false,
    version = campaign.version + 1
where campaign.enabled is true
```

Because the current DB error does not match `theme_campaign_overlap`, `theme_campaign_stale`, `theme_campaign_invalid`, or the PostgREST schema-cache patterns, `safeThemeMutationError` returns the generic 500 response.

### Future schedule protection

Patch 447H changed the overlap check to inline SQL:

```sql
tstzrange(existing.starts_at, coalesce(existing.ends_at, 'infinity'::timestamptz), '[)')
&& tstzrange(activation_time, 'infinity'::timestamptz, '[)')
```

That preserves future-overlap protection, but it also means any enabled future seasonal campaign blocks a new open-ended immediate activation. That is consistent with the current "one active public theme at a time" model, but it should produce the explicit overlap error, not the generic save error.

## API findings

`/api/admin/themes/activate-now`:

- requires the authoritative Admin guard
- accepts only `{ themeId }`
- rejects `default`
- passes `p_theme_id`
- maps RPC errors through `safeThemeMutationError`
- revalidates public theme cache only after success

The route does not expose private user data and does not weaken Admin authorization.

The route's failure path is too opaque for unknown database errors. It intentionally avoids leaking internal DB details, which is good for users, but it leaves production diagnosis dependent on server logs or a controlled Admin repro.

## Admin authorization findings

The Admin route and API still use the existing authoritative guard:

```text
requireAdminRequest
-> requireAdminForRequest
-> authoritative role check
```

The new RPC also calls:

```sql
public.require_theme_admin()
```

The authorization model is therefore still layered:

- Next API Admin guard
- database Admin guard

No audit finding suggests basic or anonymous users can successfully activate a theme.

## Last known working implementation

The last known working seasonal activation implementation is the pre-447F `AdminAppearanceClient` branch:

```ts
await fetch("/api/admin/themes", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    themeId: theme.id,
    startsAt: new Date().toISOString(),
    endsAt: null,
  }),
});
```

This route uses the older `admin_create_theme_campaign` RPC from `20260721120000_create_public_theme_campaigns.sql`.

Known limitation: seasonal-to-seasonal direct switching requires Default or disabling the active campaign first.

## Option comparison

### Option A - Repair direct atomic seasonal switching

Pros:

- Meets the desired product behavior.
- Can be done with a corrected RPC.
- Avoids requiring Default as an intermediate step.

Cons:

- The last two direct-switch attempts already reached production and broke activation.
- Requires another corrective migration.
- Needs real database-level tests or a verified Admin production smoke path before release.
- Still has product ambiguity around open-ended immediate activation when future scheduled campaigns exist.

Minimum safe implementation if chosen later:

- Add a new corrective migration replacing `admin_activate_theme_now`.
- Use a table alias everywhere in the `UPDATE`.
- Avoid output column name collisions.
- Return an explicit overlap error if a future schedule blocks the open-ended activation.
- Add a production-safe RPC smoke check using a valid Admin session before deployment.

### Option B - Revert to last known working activation behavior

Pros:

- Smallest recovery.
- No migration required.
- Restores seasonal activation quickly.
- Uses the already-proven `admin_create_theme_campaign` path.
- Keeps existing future overlap protection.
- Leaves Default activation unchanged.

Cons:

- Direct seasonal-to-seasonal switching remains unavailable.
- Admin must activate Default or disable/end the active campaign before activating another seasonal theme.
- The dormant `admin_activate_theme_now` RPC remains in production until a later cleanup migration.

Recommendation: **Option B for Patch 447K**.

The immediate product priority is to restore seasonal activation. Direct switching should wait until there is a database-backed test harness or an Admin-authenticated production verification path.

## Existing production campaign rows

The active public theme after the last production check was `default`.

Potential row state from prior attempts:

- Disabled campaigns from Default activation.
- Possibly failed `activate-now` attempts with no inserted rows.
- Future scheduled rows may exist.

No cleanup should be done in this audit.

Patch 447K should not delete production campaign history. It should only restore the working activation route. A later cleanup can remove or leave the unused RPC after direct-switch strategy is decided.

## Exact faulty layer

Faulty layer: database RPC implementation introduced by Patch 447F and retained by Patch 447H.

Faulty migration chain:

- `20260722100000_activate_public_theme_now.sql`
- `20260722110000_fix_activate_public_theme_now_rpc.sql`

Faulty application commit:

- `65108c1eee7b102fe7b481ee6c25a1ad8a4c347a` changed the Admin client to use `/api/admin/themes/activate-now`.

Patch 447H commit:

- `802970664e469044a5f19630607a62878a50861f` improved the RPC but did not remove the unqualified-name collision risk.

## Required tests for Patch 447K

Patch 447K should add focused tests confirming:

1. Seasonal `Activate now` uses `/api/admin/themes`.
2. Seasonal activation sends `themeId`, `startsAt`, and `endsAt: null`.
3. `Activate Default` continues to use `/api/admin/themes/activate-default`.
4. `/api/admin/themes/activate-now` is no longer used by the UI.
5. Existing protected Admin API tests still cover `admin_create_theme_campaign`.
6. Future schedule overlap protection remains mapped to the explicit overlap error.
7. The user-facing copy documents or preserves the requirement to clear the active seasonal campaign before activating another seasonal campaign, if product wants the limitation visible.

No database migration is required for the Option B recovery.

## Recommended Patch 447K scope

Implement only:

- Revert `AdminAppearanceClient.activateTheme` seasonal branch to the pre-447F `/api/admin/themes` create-campaign request.
- Keep `/api/admin/themes/activate-default` unchanged.
- Keep `/api/admin/themes/activate-now` and the RPC migrations in the repository for now, but stop calling the route from UI.
- Adjust tests to make the route choice explicit.
- Do not delete or modify applied migrations.
- Do not alter theme visuals.
- Do not alter Admin authorization.
- Do not touch production data.

Patch 447K should then be deployed and verified:

1. Activate Default.
2. Activate Valentine.
3. Activate Default.
4. Activate Easter.
5. Confirm seasonal activation works when no active seasonal campaign overlaps.
6. Confirm attempting to activate a second seasonal campaign without clearing still shows the explicit overlap message.
7. Restore Default.

## Production rollout plan

1. Implement Patch 447K as application-only recovery.
2. Run focused public theme/Admin tests.
3. Run lint/build only if imports or executable code change.
4. Merge and push.
5. Deploy current master.
6. Verify with Admin session:
   - Default -> Valentine works.
   - Valentine -> Default works.
   - Default -> Easter works.
   - seasonal -> seasonal without Default returns explicit overlap, not generic save failure.
7. Restore Default.

## Rollback plan

If Patch 447K fails:

- Revert the application commit only.
- Do not roll back migrations unless a separate database problem is proven.
- Activate Default using the already-working `/api/admin/themes/activate-default`.

## Known limitations

- This audit did not capture the authenticated Admin response body because no Admin browser session was available.
- Vercel logs showed `POST /api/admin/themes/activate-now` calls but did not include the database error text.
- Direct PostgREST verification was blocked because local production API credentials were not available in `.env.local`.
- The root cause is therefore confirmed from source-level database analysis and observed symptom matching, not from a captured production stack trace.
