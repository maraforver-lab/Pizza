# Patch 447M: Repair Theme Activate-Now RPC

Patch 447M repairs the dormant direct seasonal activation RPC without changing the restored Admin UI flow from Patch 447K.

## What changed

A new migration replaces `public.admin_activate_theme_now(p_theme_id text)` with the same signature, Admin authorization boundary and return shape.

The repaired function qualifies `public.theme_campaigns` through explicit aliases when it disables the current active campaign, checks future overlaps and returns the inserted campaign row. This avoids collisions with `RETURNS TABLE` output fields such as `enabled`, `version`, `theme_id`, `starts_at` and `ends_at`.

## What stayed unchanged

Seasonal Admin cards still use:

```text
POST /api/admin/themes
body: { themeId, startsAt: now, endsAt: null }
```

Default activation still uses:

```text
POST /api/admin/themes/activate-default
```

The `/api/admin/themes/activate-now` route remains compatible with the repaired RPC, but the visible Admin UI does not depend on it.

## Safety

- The RPC still calls `public.require_theme_admin()`.
- Anonymous and basic users remain blocked by the database Admin boundary.
- Invalid IDs and `default` are rejected with `theme_campaign_invalid_theme`.
- Future enabled seasonal campaign overlap protection remains in place.
- No theme visuals, scheduling UI, campaign creation flow or Admin authorization code changed.

## Migration status

Migration added but not applied:

```text
supabase/migrations/20260722120000_repair_activate_public_theme_now_rpc.sql
```
