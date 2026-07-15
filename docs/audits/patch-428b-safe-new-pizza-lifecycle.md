# Patch 428B: Safe New Pizza Lifecycle

Branch: `patch/428b-safe-new-pizza-lifecycle`

Starting commit: `41cfa0d396b9fe6623091017e469d870e3d98c38`

## Executive Summary

Patch 428B replaces the destructive active-session replacement behavior with an archive-before-create lifecycle.

Before this patch, `replaceActiveSession: true` updated the existing `pizza_sessions` active row in place. That kept one active cloud row, but it changed `session_data.id` and overwrote the unfinished session previously stored in that row.

After this patch, an explicit new-pizza replacement:

1. archives the previous unfinished active row,
2. preserves its `session_data`,
3. creates a separate new `in_progress` row,
4. materializes the new row locally,
5. keeps completed history unchanged,
6. keeps at most one active row per user through a partial unique index.

Signed-out local-only creation remains unchanged.

## Previous Destructive Replacement Behavior

The old API behavior was:

```text
existing in_progress cloud row
-> update same row with new session_data
-> keep same row id
-> old unfinished session payload disappears
```

This protected the one-active-session model but created a real data-loss risk for unfinished work.

## New Archive-Before-Create Contract

The replacement contract is now:

```text
existing active row
-> status = archived
-> archived_at = transaction time
-> full old session_data preserved
-> insert new in_progress row
-> return the new canonical cloud row
```

Completed rows are not touched. Archived unfinished sessions do not count as completed sessions.

## Statuses

The existing status model remains:

```ts
type CloudPizzaSessionStatus = "in_progress" | "completed" | "archived";
```

Patch 428B adds nullable `archived_at` metadata to support deterministic archived-session ordering.

## Transaction Design

The migration adds `public.archive_active_and_create_pizza_session(...)`, a narrow server-side Postgres function called by `POST /api/pizza-sessions/active` when the client asks for `archiveActiveAndCreateNew` or the legacy-compatible `replaceActiveSession`.

The function:

- requires `auth.uid()`
- uses the authenticated owner as `user_id`
- locks the current active row with `for update`
- archives that row
- inserts the new active row
- returns the new row plus archived-session diagnostics

If the insert fails, the function call fails and the archive is rolled back by the database transaction.

## Database Uniqueness

Migration:

`supabase/migrations/20260716120000_archive_active_pizza_session_replacements.sql`

Adds:

- `archived_at timestamptz`
- deterministic duplicate-active remediation before the constraint
- `pizza_sessions_one_active_per_user_idx`

The unique index is:

```sql
on public.pizza_sessions (user_id)
where status = 'in_progress'
```

Duplicate active rows discovered during migration are handled by preserving the newest row as active and archiving older `in_progress` rows. This matches the current app behavior, which already selected the newest row as canonical.

## Idempotency

The RPC first checks whether the incoming `session_data.id` is already the current active row. If so, it returns that row instead of archiving and inserting again.

The client queue key also distinguishes archive-create requests from normal saves, reducing duplicate double-click requests for the same session snapshot.

Known limitation: if two different new-session IDs race, the database guarantees at most one active row. A later successful replacement can archive the earlier replacement. This preserves data and active uniqueness, but a future server idempotency key would make the "losing" client response more explicit.

## Concurrency

The partial unique index prevents duplicate active rows after the migration. The RPC row lock and single transaction protect the normal explicit replacement path.

Concurrent stale writes from an old active session still hit the active API's existing session-id conflict checks and cannot silently reactivate an archived session as active.

## Account Archived-Session Presentation

Account now includes a compact `Archived pizza sessions` section when archived unfinished rows exist.

It shows:

- archived timestamp
- dough quantity summary
- pizza mix summary
- bake target
- last reached stage
- a read-only `View session details` disclosure

It shows the latest two archived sessions by default and provides a disclosure for more archived rows returned by the API. It does not add restore/reactivation.

Completed history remains a separate section.

## Party Order Integration

Party Order handoff no longer swallows active-session conflicts.

No active session:

- create the Party Order session
- save it to cloud
- make it local active
- open `/session/start?handoff=1`

Active session exists:

- surface the same conflict decision
- allow continuing the existing session
- allow keeping the Party Order setup
- allow confirmed archive-and-create using the same server lifecycle operation

The pending Party Order session object is retained in component state during conflict handling.

## Retention Behavior

Completed history:

- latest five returned/shown by the current Account history API/UI
- storage remains unbounded until explicit archive/delete or account deletion

Archived unfinished sessions:

- latest archived rows are shown in the new Account section
- storage remains unbounded until a future retention policy

No automatic deletion is introduced.

Future GDPR export/deletion work should include archived rows because they preserve full session payloads.

## Backward Compatibility

Supported:

- old `replaceActiveSession: true` clients now trigger archive-and-create instead of destructive overwrite
- existing `in_progress` rows
- existing `completed` rows
- accounts with no archived rows
- duplicate active rows at migration time
- local-only anonymous sessions
- older cloud rows without `archived_at`
- sessions created before Patch 424B

## Known Limitations

- Archived-session restore is intentionally not included.
- Archived-session API returns a bounded list for Account display; it is not a full archive browser.
- The RPC uses logical session id idempotency, not a separate client-generated replacement request id.
- Browser validation should be repeated against the real Supabase environment after the migration is reviewed/applied.

## Test Coverage

Focused coverage includes:

- cloud session status normalization
- archived-session summary behavior
- active API source contract
- migration source contract
- Session Start conflict copy
- homepage shared resolver/copy
- Account archived section source contract
- Party Order conflict handling source contract
- Review completion and completed history regression coverage

## Protected Invariants

No formula, Recipe, Shopping, Timeline, Kitchen runtime, biological timing, Review form, account preference, authentication, SEO or Party Order data-model behavior was intentionally changed.

No deployment was performed by this patch.
