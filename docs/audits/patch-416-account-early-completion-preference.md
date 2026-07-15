# Patch 416: Account Early Completion Preference

## Summary

Patch 416 adds a signed-in account preference for intentionally completing timed dough stages before their effective Kitchen timer has finished.

The setting is off by default and applies only to:

- Rest dough
- Fermentation
- Ball rest / final proof

It does not apply to Mix dough, Ball dough, Preheat oven, Sauce/toppings or Bake pizza.

## Preference Storage

The existing Account guidance preference is browser-local only and is not suitable for this patch. Patch 416 therefore adds a minimal cloud-backed account preference table:

- `public.account_preferences`
- primary key: `user_id`
- field: `allow_early_timed_step_completion boolean not null default false`
- timestamps: `created_at`, `updated_at`
- owner-only RLS using `auth.uid() = user_id`

The app-facing JSON key is:

- `allowEarlyTimedStepCompletion`

Missing rows and missing fields normalize to `false`, so older accounts remain compatible.

## API Contract

`/api/account/preferences`

- `GET` returns `{ preferences }` for the signed-in user.
- `PATCH` accepts `{ allowEarlyTimedStepCompletion, knownUpdatedAt }`.
- `knownUpdatedAt` protects against stale writes from older browser state.
- If a newer server row exists, the API returns `409` with the current server preferences and `stale: true`.

Unauthenticated users receive `401`; the Kitchen page treats that as preference off.

## Account UI

The Account page now renders:

`Allow early completion of timed dough stages`

Description:

`Allows you to continue before a dough rest or fermentation timer has finished. You will always be warned before continuing early.`

The toggle:

- is visible only inside the signed-in Account workspace
- defaults to Off
- shows loading/saving/saved state
- prevents double saves while a PATCH is in flight
- rolls back to the last server-confirmed value on failure or stale-write rejection

## Kitchen Behavior

Before readiness:

- unsigned user: `Rest complete` / timed-stage button remains disabled
- signed-in user with preference Off: button remains disabled
- signed-in user with preference On: button is enabled and opens a warning dialog

At or after readiness:

- all users complete normally without the dialog

The confirmed override uses the existing Kitchen completion path:

- normal `actualCompletedAt`
- existing `completeKitchenTimelineStep(...)`
- existing Patch 414B effective schedule recomputation
- original Timeline and target time preserved
- no extra early-completion field

## Warning Dialog

The dialog is specific to the active timed dough stage:

- Rest: `The dough still needs N minutes of rest`
- Fermentation: `The dough still needs H h M min of fermentation`
- Ball rest: `The dough balls still need N minutes of proofing`

Actions:

- `Keep waiting`
- `Mark complete early`

Escape, backdrop click and closing behavior do not complete the step. Focus moves into the dialog on open, traps inside while open and returns to the triggering action when closed.

## Backward Compatibility

- No PizzaSession schema changes.
- No session data migration.
- Old account rows without the preference normalize to Off.
- Old local sessions remain valid.
- Existing Patch 414B runtime fields and Patch 415 Rest mobile UI remain intact.

## Protected Invariants

This patch does not change:

- dough formulas
- planned rest or fermentation durations
- original Timeline
- target-conflict logic
- `stepRuntime` persistence
- cloud active-session sync
- bake timer auto-completion behavior
- Review flow
- Party Orders
- auth architecture beyond adding the account-preferences endpoint
