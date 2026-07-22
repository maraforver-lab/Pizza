# Patch 447K: Restore Seasonal Activation

Patch 447K restores the last known working Admin seasonal `Activate now` flow.

## What changed

Seasonal theme cards now activate through the existing campaign-creation API again:

```text
POST /api/admin/themes
body: { themeId, startsAt: now, endsAt: null }
```

Default activation is unchanged:

```text
POST /api/admin/themes/activate-default
```

## Why

Patch 447J found that the newer direct-switch path through `/api/admin/themes/activate-now` and `admin_activate_theme_now` was the regression layer. Until that RPC has database-backed verification, the safest recovery is to restore the proven create-campaign route.

## Product behavior

- Seasonal activation works when no active seasonal campaign overlaps.
- If another seasonal campaign is active, Admin must activate Default or disable/end that campaign first.
- Scheduled campaign overlap protection remains unchanged.
- Theme visuals, Admin authorization, scheduling UI and database migrations are unchanged.

## Deferred

Direct seasonal-to-seasonal switching should be reintroduced only with a corrected RPC and a reliable Admin-authenticated production smoke path.
