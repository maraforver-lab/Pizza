# Patch 427: Active Cloud Session Conflict During Plan Creation

Branch: `patch/427-active-cloud-session-conflict`

Starting commit: `c64c0fa78699bf8c9b1a7167add0ad63b370f946`

## Executive Summary

Patch 426 fixed the signed-in authentication boundary for active Pizza Session cloud materialization. Production then returned a real `409 Conflict` from `POST /api/pizza-sessions/active`, proving that the request was authenticated and reached the active-session database logic.

Patch 427 handles that confirmed conflict explicitly. A signed-in user who creates a new plan while another active cloud Pizza Session already exists now gets a safe choice instead of the generic save-failure message:

- continue the existing active cloud session
- keep the current setup without proceeding
- explicitly confirm starting a new active cloud session

No active cloud session is silently overwritten or deleted.

## Exact 409 Cause

The active-session POST route queries:

```text
pizza_sessions
where user_id = authenticated user
and status = in_progress
order by updated_at desc
limit 1
```

The `409` occurs when that active cloud row exists and its stored `session_data.id` differs from the newly created setup session id.

This is not an authentication failure, stale write, duplicate same-session retry or firewall problem. It is a different logical active cloud Pizza Session already existing for the signed-in account.

## API Contract

The route now returns a typed conflict payload:

```json
{
  "error": "active_session_exists",
  "message": "A different active pizza session is already saved to this account.",
  "conflict": true,
  "activeSessionId": "...",
  "activeCloudRowId": "...",
  "cloudRowId": "...",
  "cloudSessionId": "...",
  "localSessionId": "...",
  "resumeRoute": "/session/kitchen"
}
```

`resumeRoute` is derived from the existing cloud session through the canonical Pizza Session resume helper.

## Explicit Start-New Path

The API accepts `replaceActiveSession: true` only after the user confirms starting a new pizza session.

When confirmed:

1. the existing in-progress cloud row is updated with the new setup session
2. the new setup session becomes the single active cloud-backed session
3. retries with the same new logical session update the same active row instead of creating duplicates

This is an explicit user action, not silent overwrite. The implementation intentionally uses one active-row update instead of archive-plus-insert so a failed second write cannot leave the account without an active session.

## Client Handling

`saveCloudActivePizzaSession(...)` now converts `409 active_session_exists` into `ActiveCloudPizzaSessionConflictError`.

Session Start catches only that typed error and renders a conflict panel. Other save failures still use the recoverable generic cloud-save error from Patch 425.

The conflict panel actions are:

- `Continue existing session`: re-runs the canonical cloud resolver and navigates to the saved session's correct resume route
- `Keep setup`: dismisses the conflict and leaves current selections visible
- `Start new pizza`: opens an explicit confirmation before retrying materialization with `replaceActiveSession: true`

## Authority Contract

Patch 424B remains intact:

- signed-out users remain local-only
- signed-in users use the active cloud row as canonical
- unrelated local sessions do not win by timestamp
- an existing active cloud session is not overwritten unless the user explicitly confirms starting a new one

## Protected Invariants

- no formula changes
- no session schema changes
- no persistence redesign
- no auth weakening
- no service-role bypass
- no Party Orders changes
- no deployment

## Validation Notes

The focused automated checks cover:

- typed API conflict contract
- explicit `replaceActiveSession` request body
- explicit active-row replacement behavior
- client typed conflict error
- Session Start conflict UI actions
- canonical resolver use for continuing the existing cloud session

Live production verification should confirm:

1. signed in with an existing active cloud session
2. complete Session Start for a new setup
3. press `Create my pizza plan`
4. see conflict choices instead of generic save failure
5. `Continue existing session` opens the existing cloud session
6. `Keep setup` leaves selections visible
7. `Start new pizza` requires confirmation and then opens Recipe
8. Account shows exactly one active session afterward
