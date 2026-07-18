# Patch 434B: No-archive active session lifecycle

## 1. Patch 434A findings

Patch 434A found multiple interacting lifecycle defects in the signed-in Start New Pizza flow:

- typed `active_session_exists` conflict handling was correct but visually overloaded
- Session Start could show the conflict actions and the sticky `Create my pizza plan` CTA at the same time
- confirmed replacement used archive-before-create semantics
- Account exposed archived unfinished sessions even though they were read-only backups
- Party Order handoff reused the same archive-before-create lifecycle

Patch 434B replaces that model with one active unfinished Pizza Session, completed history, and no archived unfinished-session workflow.

## 2. Old archive lifecycle

The old replacement path was:

```text
new setup
  -> typed active-session conflict
  -> user confirms Start new pizza
  -> archive_active_and_create_pizza_session(...)
  -> old active row becomes archived
  -> new active row becomes in_progress
  -> Account lists archived unfinished rows
```

This preserved unfinished work, but archived sessions could not be continued or restored. The new product decision is that this state should not exist.

## 3. New no-archive lifecycle

The new lifecycle is:

```text
new setup
  -> typed active-session conflict
  -> user chooses replacement
  -> replace_active_pizza_session(...)
  -> old unfinished active row is deleted
  -> new active row is inserted
  -> one in_progress row remains
  -> no archived row is created
```

Completed rows remain separate and retain the maximum of 15 completed sessions.

## 4. Session Start state machine

Session Start now models conflict with a single discriminated state:

```ts
type CloudConflictState =
  | { stage: "decision"; conflict: ActiveCloudPizzaSessionConflict }
  | { stage: "replacement-confirmation"; conflict: ActiveCloudPizzaSessionConflict }
  | null;
```

The normal sticky `Create my pizza plan` action is hidden while a summary-step active-session conflict is visible. This prevents the user from firing the non-replacement create path while deciding how to handle the existing account session.

## 5. Conflict UX

The conflict card now uses plain product language:

- `You already have an unfinished pizza`
- `Continue it, or replace it with this new pizza plan.`
- `Continue current pizza`
- `Use this new pizza plan`
- `Keep editing`

Technical route text such as `/session/recipe` is no longer rendered in the conflict card.

## 6. Replacement confirmation

The replacement confirmation now says:

- `Replace your unfinished pizza?`
- `Your current unfinished pizza plan will be permanently removed. This new setup will become your active pizza plan.`
- `Keep current pizza`
- `Replace and create new plan`

The destructive action immediately calls the replacement transaction. The user does not need to press `Create my pizza plan` again.

## 7. Atomic RPC design

New migration:

`supabase/migrations/20260718120000_no_archive_active_session_replacement.sql`

New RPC:

`public.replace_active_pizza_session(new_session_data, new_current_step, new_title, expected_active_row_id, expected_active_session_id)`

The RPC:

- requires `auth.uid()`
- validates incoming `session_data.id`
- returns an existing active row when the incoming logical session is already active
- locks the current active row
- validates the expected active row/session when supplied
- deletes the old `in_progress` row
- inserts the new `in_progress` row
- returns the new canonical row
- creates no archived row

## 8. Idempotency and rollback

Idempotency is based on `session_data.id`. Retrying the same replacement request after a successful commit returns the already-active row for that logical session.

Rollback is handled by the database transaction. If the insert fails, the old active row deletion is rolled back.

## 9. Anonymous local promotion

Anonymous local promotion is preserved:

- signed-out local sessions remain local-authoritative
- signed-in users with local session and no cloud active session still promote that same local session to cloud
- progress, route, `stepRuntime`, Kitchen state and logical `session_data.id` are preserved

If cloud already has an active session, the existing typed conflict path is used instead of silently overwriting cloud.

## 10. Local/cloud conflict handling

For unrelated local and cloud active sessions:

- non-replacement save returns `active_session_exists`
- Continue restores cloud locally and routes to canonical resume
- Keep editing closes the decision with no cloud mutation
- confirmed replacement calls the no-archive RPC with expected cloud identifiers

Old stale cloud-row writes fail because the old row is deleted and PATCH remains scoped to the requested `cloudSessionId` when present.

## 11. Party Order integration

Party Order handoff now uses the same replacement option:

- no active cloud session: create normally
- active cloud session: show no-archive replacement choice
- confirmed replacement calls `saveCloudActivePizzaSession(..., { replaceActiveSession: true })`
- no archived row is created

Party Order's own `archived` event status is unrelated and remains intact.

## 12. Account changes

Removed from Account:

- `AccountArchivedPizzaSessions`
- archived Pizza Session API routes
- archived-session naming/deletion UI
- archived-session retention presentation

Preserved:

- Active Pizza Session
- active-session naming
- active-session pizza-menu editing
- completed-session history
- completed-session naming and deletion
- account preferences
- Party Orders

## 13. Existing archived-row cleanup

The new migration permanently deletes rows with the exact condition:

```sql
delete from public.pizza_sessions
where status = 'archived';
```

It does not delete `in_progress` or `completed` rows and does not delete based on age.

After cleanup, the migration replaces the status check constraint with:

```sql
check (status in ('in_progress', 'completed'))
```

This prevents future archived Pizza Session rows where the database constraint is safely available.

## 14. Completed retention

Completed retention remains 15.

The retention function and trigger now enforce completed rows only. The archived branch was removed, but the completed branch and Account completed history remain.

## 15. Migration and deployment order

Required production order:

1. Review the migration.
2. Apply the Supabase migration.
3. Deploy the matching Vercel application.
4. Run signed-in lifecycle tests for Session Start, replacement, Account, Party Order and completed history.

The migration is not applied by this patch.

## 16. Accessibility

The current implementation keeps replacement confirmation inline inside the decision card, matching the pre-existing UI shape. It removes the background sticky create action during conflict so keyboard and touch users do not encounter two competing primary actions.

Future enhancement: if this becomes a modal dialog, add a full focus trap and modal semantics.

## 17. Test coverage

Updated tests cover:

- replacement request body uses `operation: "replace_active"`
- no `archiveActiveAndCreateNew` request body
- active API calls `replace_active_pizza_session`
- active API no longer calls archive/create RPC
- active DELETE permanently deletes the row
- stale cloud-backed local active pointer removes the local session rather than archiving it
- Session Start conflict copy and sticky-action gating
- Account archived section removal
- completed retention remains 15
- Party Order handoff uses no-archive replacement copy

## 18. Known limitations

- Existing archived production rows are deleted by migration; review is required before applying it.
- Browser validation requires a signed-in environment and migration-applied database.
- The inline confirmation is not a full modal focus-trapped dialog; it is safer than the previous duplicated action state but remains an inline decision pattern.

## Protected invariants

Unchanged:

- pizza formulas
- Recipe calculations
- Shopping quantities
- Timeline generation
- Kitchen runtime and timers
- biological durations
- Review completion model
- Party Order data model
- authentication and RLS ownership boundaries
- SEO
- signed-out local Pizza Session behavior
