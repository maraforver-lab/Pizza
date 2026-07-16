# Patch 430: Session naming and retention

## Summary

Patch 430 extends the safe active-session lifecycle from Patch 428B with account-level session management:

- `PizzaSession.sessionName?: string` is the canonical user-defined session name inside `session_data`.
- The existing `pizza_sessions.title` column remains a denormalized display label for lists and backward compatibility.
- Archived unfinished sessions can be renamed or permanently deleted from Account.
- Completed sessions can be renamed and are retained separately from archived sessions.
- Database retention keeps at most one active session, three archived unfinished sessions and fifteen completed sessions per signed-in user.

No Pizza Session calculations, active-session authority, Timeline generation, Kitchen runtime, Review flow, authentication model or SEO behavior changed.

## Naming Contract

The canonical optional name is:

```ts
sessionName?: string;
```

Names are normalized with one shared rule:

- collapse repeated whitespace
- trim leading and trailing whitespace
- store at most 80 characters
- empty input removes the custom name

Cloud writes keep `session_data.sessionName` and `pizza_sessions.title` aligned. Older rows that only have a custom `title` still display that title. Generic legacy titles such as `Active pizza session`, `Completed pizza session` and `Archived pizza session` are treated as defaults, not custom names.

## Account UI

Active session:

- shows the active session name when present
- allows adding, editing or removing the name
- uses the existing cloud-backed active-session save queue
- does not change the active-session identity

Completed sessions:

- show all retained completed rows, up to 15
- still collapse to two by default with an accessible disclosure
- support adding, editing or removing the session name
- deleting a completed row now permanently removes that completed row instead of converting it into an archived unfinished session

Archived sessions:

- show retained archived rows, up to 3
- still collapse to two by default
- support adding, editing or removing the session name
- support explicit permanent deletion after confirmation
- remain read-only; restore/reactivation is not added in this patch

## Retention Rules

The retained cloud rows per signed-in account are:

| Status | Limit | Sorting rule |
| --- | ---: | --- |
| `in_progress` | 1 | enforced by Patch 428B partial unique index |
| `archived` | 3 | newest `archived_at`, then `updated_at`, then `created_at` |
| `completed` | 15 | newest `completed_at`, then `updated_at`, then `created_at` |

Retention deletes only rows from the category that exceeded its limit:

- archived cleanup never deletes completed rows
- completed cleanup never deletes archived rows
- active rows are never deleted by retention
- cleanup is scoped to the row owner

## Database Migration

The migration `20260716130000_session_names_and_retention_limits.sql` adds:

- a user-owned delete policy for `pizza_sessions`
- `public.trim_pizza_session_retention_for_user(uuid)`
- `public.enforce_pizza_session_retention()`
- an `after insert or update of status, archived_at, completed_at` trigger
- one-time pruning of older archived and completed rows to the new limits

The retention helper is security definer but rejects direct calls for another authenticated user. Trigger execution uses the affected row's `user_id`.

## API Changes

Completed list:

- `GET /api/pizza-sessions/history` returns up to 15 retained completed sessions.

Completed detail:

- `PATCH /api/pizza-sessions/history/[id]` accepts `name`, `sessionName` or legacy `title` and updates both `session_data.sessionName` and `title`.
- `DELETE /api/pizza-sessions/history/[id]` permanently deletes the completed row.

Archived list:

- `GET /api/pizza-sessions/archived` returns up to 3 retained archived sessions.

Archived detail:

- `PATCH /api/pizza-sessions/archived/[id]` renames an archived row.
- `DELETE /api/pizza-sessions/archived/[id]` permanently deletes an archived row.

## Backward Compatibility

Existing rows without `sessionName` continue to render with their non-generic `title` if present. Existing generic titles fall back to category-specific labels.

Older clients using active-session save APIs continue to work because the existing `title` field is still written. Patch 428B archive-before-create remains unchanged.

## Validation Notes

Automated validation should cover:

- session name normalization
- active Account rename source behavior
- completed rename and delete behavior
- archived rename and delete behavior
- 3 archived / 15 completed retention constants and migration trigger
- Account collapsed/expanded rendering for retained rows
- full regression suite, lint, production build and `git diff --check`

## Protected Invariants

Unchanged:

- one canonical `in_progress` session per signed-in account
- signed-out local-only behavior
- active-session cloud authority
- archive-before-create lifecycle
- Recipe, Shopping, Timeline, Kitchen and Review calculations
- Pizza Session schema version
- authentication and Party Order behavior
- deployment state
