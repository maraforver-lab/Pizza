# Patch 428A: Make New Pizza Lifecycle and Session Retention Audit

Audit branch: `patch/428a-make-new-pizza-lifecycle-audit`

Audited starting commit: `183ea5449d1d7b2b0c23aa5c0e551893705e304b`

Audit date: 2026-07-16

Scope: documentation and audit only. No production code, tests, database schema, migrations, UI, route behavior, cloud rows or deployment configuration were changed.

## Executive Summary

DoughTools currently has a clear intended authority model for signed-in users: the active cloud Pizza Session is canonical, browser-local state is a materialized cache, and signed-out users remain local-only. The current code mostly follows that model for homepage continuation, Account, Session Start, Session routes and Review completion.

The Make New Pizza lifecycle still has three product-contract gaps:

1. `replaceActiveSession: true` keeps one active cloud row but overwrites the unfinished active session data inside that row. It does not archive the old unfinished session and does not move it to completed history.
2. Account history shows at most five completed sessions, collapsed to two by default, but this is a display/API result limit rather than a true retention limit. The database has no automatic completed-session retention rule.
3. The homepage `Start a new pizza` confirmation currently routes to `/session/start` without an explicit `new=1` intent, while Session Start normally resolves the existing canonical active session. Its copy also says the current session will remain available in the account, which is not true for the implemented cloud replacement model.

The active-session conflict UI on `/session/start` is safer than the homepage copy: it accurately says the confirmed action replaces the active pizza session in the account. However, this still means unfinished active work can be lost from cloud storage.

## Current Creation Entry Points

| Entry point | Source | Current path | Uses canonical creation path? | Finding |
| --- | --- | --- | --- | --- |
| Homepage `Plan my new pizza` with no active session | `components/HomepageSessionActions.tsx`, `lib/homepage.ts` | Link to `/session/start`; final setup action calls `materializeCloudBackedPizzaSession(...)` when signed in | Yes | Correct for no-active state. |
| Homepage `Start a new pizza` with active session | `components/HomepageSessionActions.tsx` | Confirmation then `router.push("/session/start")` | No | It does not pass `new=1`; `/session/start` can resolve the existing active cloud session instead of creating a replacement draft. Copy says the current session remains available, but no archive path backs that claim. |
| `/session/start` final `Create my pizza plan` | `app/session/start/page.tsx` | Save local session, set active pointer, materialize cloud before routing to Recipe | Yes | Correct no-conflict path after Patches 425-427. |
| `/session/start` signed-in active-cloud conflict | `app/session/start/page.tsx` + `app/api/pizza-sessions/active/route.ts` | Typed `409 active_session_exists`; user may continue, keep setup, or confirm replace | Yes | Safe conflict UI, but confirmed replace overwrites the active row's previous session data. |
| `/session/start?new=1` with local active session | `app/session/start/page.tsx` | Shows `ReplaceActiveSessionChoice` before allowing `/session/start?new=1&replace=1` | Partial | Local active replacement is explicit. Old local session is no longer active but remains in local session storage unless archived by cloud-backed cleanup. |
| Account active session card | `components/account/AccountActivePizzaSessionCard.tsx` | Continue, edit pizza menu, view shopping list, delete active session | No Make New Pizza action | Account does not create a replacement directly; empty state links back to homepage. |
| Account empty state | `components/account/AccountActivePizzaSessionCard.tsx` | `Back to homepage` | Indirect | It does not create a session itself. |
| Review follow-up CTA | `app/session/review/page.tsx` | `/session/start` after active session has been completed and cleared | Yes when completion succeeds | Correct if Review cloud completion succeeds; if cloud completion fails, Review blocks completion with a retry message. |
| Empty route CTAs | Session route empty states | `/session/start` | Indirect | Intended to create only when no canonical active session exists. |
| Party Order handoff | `components/account/PartyOrderSessionHandoff.tsx` | API handoff payload, local `createAndSavePizzaSession`, `setActivePizzaSession`, attempted `saveCloudActivePizzaSession`, then `/session/start?handoff=1` | No | It can create a local active handoff and skip Session Start's canonical resolver on first render. If a different cloud active session exists, the initial cloud conflict is caught and ignored. |
| Direct active Session routes | `/session/recipe`, `/session/shopping`, `/session/timeline`, `/session/kitchen`, `/session/review` | Resolve canonical active session before rendering/mutating | Yes | Protected by Patch 424B route authority. |

## Current Active-Session Rule

### Signed out

The active session is the local storage pointer `doughtools:active-pizza-session-id` into `doughtools:pizza-sessions-v1`. `getActivePizzaSession(...)` ignores local sessions whose status is `archived` or `completed`.

There is only one active local pointer. Local storage can contain additional old sessions, but the product has no current local session picker.

### Signed in

The API reads the active cloud session with:

```text
pizza_sessions
where user_id = current user
and status = in_progress
order by updated_at desc
limit 1
```

The canonical resolver gives the active cloud row authority over unrelated local sessions. A local cache can win by timestamp only when it is the same logical session id as the cloud session.

The database migration creates an index on `(user_id, status, updated_at desc)`, but it does not create a uniqueness constraint that limits a user to one `in_progress` row.

## Current Completed-Session Rule

Completed sessions are cloud rows whose `status` is `completed`. Review completion updates the existing active cloud row to `completed` through `PATCH /api/pizza-sessions/active` with `complete: true`; it does not create a second completed-history row.

Account history behavior:

| Layer | Current behavior |
| --- | --- |
| Database | Stores completed rows until explicit delete/archive or account deletion. No automatic hard retention limit found. |
| API | `GET /api/pizza-sessions/history` queries completed rows ordered by `updated_at desc` with `.limit(20)`, normalizes and sorts them, then returns `.slice(0, 5)`. |
| Account UI | Fetches `/api/pizza-sessions/history`, sorts again, then stores `.slice(0, 5)`. It shows two by default and expands to the remaining visible rows. |
| Detail route | `/account/pizza-sessions/[id]` can load a completed session by id if the row is still `completed`. |
| User deletion | `DELETE /api/pizza-sessions/history/[id]` changes status from `completed` to `archived`; it does not physically delete the row. |

Therefore, "five completed sessions" is a display/API-result limit, not a proven storage retention limit. The API also does not expose rows older than the latest five through Account history, even though the rows can remain in Supabase.

## Identity Model

| Identity | Stored where | Meaning |
| --- | --- | --- |
| Local session id | `PizzaSession.id` in local storage | Stable logical Pizza Session identity in the browser. |
| Cloud row id | `pizza_sessions.id` | Supabase row identity. |
| Cloud logical session id | `pizza_sessions.session_data.id` | The same logical Pizza Session identity after materialization. |
| Cloud marker | `doughtools:cloud-backed-pizza-session-id` | JSON marker tying local `sessionId` to optional `cloudSessionId` row id. |
| User id | `pizza_sessions.user_id` | Supabase authenticated owner. |
| Status | `pizza_sessions.status` and `session_data.status` | Active rows use `in_progress` at row level and an in-session status such as `planning`, `preparing` or `reviewing`. Completed rows use row `completed`. |

For a normal signed-in creation, `session_data.id` matches the local `PizzaSession.id`, while the Supabase row id is separate.

For active replacement, the row id stays stable and `session_data.id` changes to the new Pizza Session id.

## Creation Lifecycle

### No Active Session

```text
in-memory setup draft
-> savePizzaSession(...)
-> setActivePizzaSession(saved.id)
-> materializeCloudBackedPizzaSession(saved)
-> POST /api/pizza-sessions/active
-> insert pizza_sessions row when no in_progress row exists
-> markCloudBackedPizzaSession(saved.id, cloudRow.id)
-> /session/recipe
-> Account active card resolves the same cloud row
```

For signed-out users, `materializeCloudBackedPizzaSession(...)` returns `local-only` because no authenticated browser token exists; the local active pointer remains authoritative.

For signed-in users, Recipe navigation waits for cloud materialization. This prevents the Recipe route from rejecting a newly-created local session before the active cloud row exists.

## Replacement Lifecycle

### Current Cloud Replacement

When a user has an active cloud row and attempts to materialize a different logical session without `replaceActiveSession: true`, the API returns:

```json
{
  "error": "active_session_exists",
  "conflict": true,
  "activeSessionId": "old-session-id",
  "activeCloudRowId": "cloud-row-id",
  "cloudSessionId": "old-session-id",
  "localSessionId": "new-session-id",
  "resumeRoute": "/session/..."
}
```

When the user confirms `Start new pizza`, Session Start retries with `replaceActiveSession: true`.

The API then updates the latest existing `in_progress` row:

```text
existing active cloud row
-> update same row id with new cloudPizzaSessionPayload(session)
-> status remains in_progress
-> session_data.id becomes the new local session id
-> old session_data is no longer stored in that row
-> Account and homepage now resolve the new active session
```

This is atomic in the sense that it is one row update rather than archive-plus-insert. It avoids a failed second write that could leave no active row. It does not preserve the unfinished previous session in completed history or an archive visible to users.

### Local Replacement

For `/session/start?new=1&replace=1`, the page clears the active local pointer before creating a fresh in-memory draft. If the old local session was cloud-backed, `clearCloudBackedActivePizzaSessionPointer()` archives the local copy and clears the cloud marker. If it was local-only, `clearActivePizzaSession()` removes the pointer but leaves the old local session record in `doughtools:pizza-sessions-v1`.

## Completed-History Lifecycle

```text
active cloud row
-> Review save
-> completeSessionReview(...) updates local session to completed and clears active local pointer
-> completeCloudBackedPizzaSession(...)
-> PATCH /api/pizza-sessions/active with complete: true and cloudSessionId
-> API verifies the same active row/session id
-> row status = completed
-> completed_at = now
-> active GET no longer returns the row
-> history GET can return it among latest five
```

Review re-resolves the canonical session before completion. If the canonical active session changed, Review blocks completion and asks the user to review the current session before finishing.

## Lifecycle Matrix

| User state | Active local | Active cloud | Completed cloud | Action | Current result | Intended result | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Signed out | none | none | none | Start new pizza | `/session/start` creates in-memory draft; `Create my pizza plan` saves one local active session and opens Recipe. | Same. | Low. |
| Signed out | active | none | none | Start new pizza | Normal `/session/start` resumes active local session. Explicit `/session/start?new=1` shows replace choice. | Explicit decision before replacing active pointer. | Low to medium: old local sessions may become unreachable because there is no local session manager. |
| Signed in | none | none | none | Start new pizza | Draft is saved locally, materialized to one cloud row, marked cloud-backed, then Recipe opens. | Same. | Low after Patch 426/427, except race without DB uniqueness. |
| Signed in | active same session | active | some | Start new pizza | `/session/start` normally restores the active cloud-backed session. A separate draft that reaches creation gets conflict/replace handling. | User should be able to choose Continue, Keep setup, or Start new. | Medium: homepage active `Start a new pizza` routes without `new=1`, so it may not create a replacement draft. |
| Signed in | unrelated local | active cloud | some | Start new pizza | Canonical resolver restores cloud row locally; unrelated local does not win by timestamp. | Same. | Low for route entry; stale local storage remains but is not active. |
| Signed in | no active | none | 5+ completed | Start new pizza | Creates a new active cloud row. Completed rows remain stored; Account only returns/shows latest five. | Same, if five is only a display limit. | Medium: retention policy is undocumented, and the API hides older completed rows from the Account list. |
| Signed in | completed Review | none | history | Start new pizza | Review completion clears active local pointer and completes cloud row; next start inserts a new active row. | Same. | Low when cloud completion succeeds. |
| Signed in | Party Order local handoff | active cloud | history | Create session | Party Order creates local active session, swallows initial cloud conflict, and routes to `/session/start?handoff=1`, which bypasses canonical resolver. Later explicit creation may hit the conflict panel. | Party Order should use the same active-session conflict contract before creating a local handoff. | High: temporary local/cloud divergence and delayed conflict UX. |

## Retention Findings

| Rule | Current behavior | Enforced in UI | Enforced in API | Enforced in DB |
| --- | --- | --- | --- | --- |
| Maximum active sessions | Intended one active session; active API reads the latest `in_progress` row. | Mostly, through conflict UI and canonical resolver. | Partially, through conflict detection and latest-row update. | No unique constraint found. |
| Completed sessions shown | Latest five returned/stored, latest two visible before disclosure. | Yes. | Yes, `.slice(0, 5)` after querying latest 20 completed rows. | No. |
| Completed sessions stored | No hard storage limit found. | Not visible beyond five. | API does not expose beyond five. | Rows remain until archive/delete/account deletion. |
| Automatic deletion | None found. | No. | No. | No. |
| Automatic archive | Active delete archives active row. Completed delete archives completed row. | Yes, through delete actions. | Yes. | Status supports `archived`. |
| Abandoned active sessions | Replaced cloud active data is overwritten, not archived. Old local-only sessions can remain non-active locally. | No visible abandoned-session model. | No abandoned status transition on replace. | `archived` exists, but replace does not use it. |

## Data-Loss Findings

| Scenario | Current behavior | Data-loss risk |
| --- | --- | --- |
| Starting new session while active and confirming replacement | Updates the existing active cloud row with new session data. | High for unfinished active cloud session data because no archive/history copy is created. |
| Atomic replacement | One row update prevents no-active gaps. | Medium: safe from duplicate-row failure, but old row payload is overwritten. |
| Clearing local pointer before cloud save | Session Start conflict cleanup clears the just-saved local active pointer after a 409 to avoid unrelated local authority. | Low to medium: setup remains in React state, but browser refresh before resolving conflict could lose the setup draft. |
| Review completion before history query | Completion updates active row to completed. | Low if cloud PATCH succeeds; Review blocks if PATCH fails. |
| Account active delete | Archives active row and clears matching local pointer/marker. | Intentional data removal from active UI; row remains archived. |
| Completed history delete | Archives completed row; component removes it from state. | Intentional removal from account history; row is not physically deleted by this route. |
| Stale browser tab save | PATCH detects different `session_data.id` and returns typed conflict. Same-session stale saves compare timestamps. | Low for resurrection; possible swallowed sync errors in background UI. |
| Sign-out/sign-in transition | Signed-in resolver restores cloud active over unrelated local. | Low for authority; unrelated local can remain in storage. |
| Cloud lookup failure | Resolver returns error for signed-in users and route should not continue unrelated local session. | Low for data loss, medium for UX. |
| Party Order handoff with existing active cloud session | Creates local active handoff and suppresses save conflict. | Medium to high: temporary divergence and unclear replacement point. |
| Concurrent device creation | No DB uniqueness constraint; two no-active POSTs can both insert if they race before either sees an existing row. | Medium: duplicate `in_progress` rows possible under race. |

## Active-Session Uniqueness

Application behavior aims for one active session per signed-in account, but this is not enforced by the database.

Evidence:

- The migration has a primary key on `id` and an index on `(user_id, status, updated_at desc)`.
- No partial unique index for `(user_id) where status = 'in_progress'` was found.
- `GET /api/pizza-sessions/active` uses `limit(1)`, so if duplicate active rows exist it chooses the latest and hides the rest.
- `POST /api/pizza-sessions/active` checks the latest active row before insert/update. This protects normal sequential requests, not true simultaneous first inserts.
- `replaceActiveSession: true` updates the existing latest active row rather than inserting a new one.

Race and retry assessment:

| Case | Current result |
| --- | --- |
| Double-click in UI | Buttons are disabled while creation is pending, so normal repeated clicks are limited. |
| Retry after successful insert but lost client response | Retrying with the same `session_data.id` should update the existing latest active row rather than insert another. |
| Two devices create first active session at nearly the same time | Both can theoretically query no active row and insert, because DB uniqueness is absent. |
| Existing duplicate active rows from old bugs/manual data | Resolver/API select latest by `updated_at`; older `in_progress` rows remain hidden, not cleaned up. |

## UX Copy Accuracy

| Surface | Current copy | Accuracy |
| --- | --- | --- |
| Session Start conflict panel | "This will replace the active pizza session in your account with this setup." | Accurate for current implementation. |
| Homepage active confirmation | "Your current session will remain available in your account." | Inaccurate relative to the implemented replacement model. The only explicit cloud replacement path overwrites the active row. |
| Account active delete | "This will remove your active in-progress Pizza Session. This cannot be undone." | Mostly accurate from the user's perspective; implementation archives the row rather than physical deletion. |
| Completed history delete | "This removes the completed session from your account history. This cannot be undone." | Accurate from the account-history UI perspective; implementation archives the row. |

There is also an implementation mismatch on homepage: `Start new pizza` routes to `/session/start`, not `/session/start?new=1`. With an active signed-in cloud session, `/session/start` normally restores the active session rather than beginning a distinct replacement setup draft.

## Party Order Interaction

Party Order handoff is the least aligned entry point.

Current flow:

```text
Party Order detail
-> POST /api/party-orders/[id]/session-handoff
-> local createAndSavePizzaSession(...)
-> setActivePizzaSession(session.id)
-> clearCloudBackedPizzaSession()
-> saveCloudActivePizzaSession(session).catch(() => ignore)
-> router.push("/session/start?handoff=1")
```

Findings:

- It does not call `materializeCloudBackedPizzaSession(...)`.
- It does not surface typed `active_session_exists` conflict before making the handoff active locally.
- It deliberately uses `handoff=1`, and Session Start skips canonical resolver when `handoff=1`.
- If no active cloud session exists, it can create the cloud active session correctly.
- If a different active cloud session exists, the first cloud conflict is swallowed; the user can continue editing a local handoff until a later cloud materialization attempt exposes conflict.
- Party Order creation should use the same conflict/replace contract as normal Session Start before it can be considered fully aligned.

## Multi-Device Findings

| Scenario | Expected | Current evidence |
| --- | --- | --- |
| Active session on mobile, desktop starts new pizza | One canonical active session; explicit replace should be required. | `/session/start` conflict path supports this, but homepage `Start a new pizza` does not pass explicit new intent. |
| Two tabs press Start new pizza nearly simultaneously | One logical session or a typed conflict. | UI reduces duplicate clicks, but DB lacks uniqueness for true simultaneous inserts. |
| Active session replaced on desktop, stale mobile tab saves old Kitchen progress | Old session must not resurrect. | PATCH compares `session_data.id`; different old local session gets typed conflict. |
| Review completes on one device, another device still sees old active state | Completed row should not stay active; stale saves should not revive it. | Active GET filters `in_progress`; Review completion clears cloud marker. A stale tab may receive skipped/conflict behavior, but no full browser test was run in this audit. |

## Account History Contract

The account currently shows:

- one active cloud Pizza Session card, if a latest `in_progress` row exists
- up to five completed sessions in Account history
- only two completed sessions by default before disclosure
- completed-session detail pages by id

It does not show:

- archived active sessions
- abandoned/replaced unfinished sessions
- completed sessions older than the latest five through the Account list
- multiple drafts
- local-only old sessions

No code path was found that reactivates a completed session. Completed rows are excluded by both active normalization and active API filters.

## Required Test Coverage Inventory

| Behavior | Existing coverage found | Gap |
| --- | --- | --- |
| No-active creation materializes before Recipe | Source-string and client tests in `start-pizza-session-wizard.test.ts` and `cloud-pizza-sessions.test.ts`. | No browser-level signed-in creation test in this audit. |
| Active-session conflict typed response | Source-string tests in `cloud-pizza-sessions.test.ts`. | Limited behavior-level API tests; no race test. |
| Continue existing from conflict | Source-string tests assert resolver use. | No end-to-end conflict choice flow. |
| Keep setup | Source-string tests assert UI label and state. | No browser persistence/reload test for kept setup. |
| Explicit replacement | Source-string tests assert `replaceActiveSession`. | No test proving old active data is intentionally archived or not archived. |
| Duplicate prevention | Queue and conflict source tests exist. | No concurrent first-insert test because DB has no unique constraint. |
| Account active card | Source-string tests in `cloud-pizza-sessions.test.ts`. | No live cloud duplicate-row behavior test. |
| Completed history | Source-string and helper tests. | No test documenting storage retention beyond five visible rows. |
| Review completion | Behavior tests for `completeCloudBackedPizzaSession`; source tests for Review page. | No full browser/account-history verification in this audit. |
| Party Order session creation | Source-string and handoff builder tests in `party-orders.test.ts`. | No active-cloud-conflict test for Party Order handoff. |
| Stale write protection | Helper/queue tests in `cloud-pizza-sessions.test.ts`. | No multi-device browser test. |

## Confirmed Defects

1. **Homepage active-session `Start a new pizza` does not express a true replacement intent.** It navigates to `/session/start` without `new=1`, so a signed-in user with an active cloud session can be routed back into the canonical active session rather than a new setup/replacement draft.
2. **Homepage replacement copy is not backed by the current data model.** It says the active session remains available in the account, while the implemented `replaceActiveSession: true` path overwrites the active row payload rather than archiving the old unfinished session.
3. **Party Order handoff bypasses the shared active-session conflict flow.** It creates a local active handoff and catches cloud save errors before routing with `handoff=1`, so cloud authority is delayed.
4. **Database-level active uniqueness is absent.** Normal application flows try to maintain one active row, but concurrent first creation can theoretically create duplicate `in_progress` rows.

## Product Decisions Required

| Question | Audit answer |
| --- | --- |
| Should starting a new pizza overwrite an unfinished active session? | Current implementation does after explicit Session Start confirmation. Product should decide whether this is acceptable. |
| Should the unfinished session be archived instead? | Recommended if the product promise is "your current session will remain available." |
| Should abandoned sessions appear in Account? | Not currently. Requires a visible `archived`/`abandoned` model decision. |
| Should completed-session storage be unlimited? | Currently unbounded in DB, while Account list returns five. This should be documented as a retention policy. |
| Should Account show only five while retaining all? | This matches current behavior best, except the API also only returns five; detail pages remain by id. |
| Should there be a hard retention limit? | None exists. Do not add one without GDPR/export/delete policy review. |
| If there is a hard limit, which session is deleted and when? | Undefined. |
| Does GDPR deletion/export need all historical sessions? | Likely yes for future export/delete work; do not silently delete older sessions without policy. |
| Should Party Order creation follow the same replacement confirmation? | Yes. |

## Model Comparison

### Model A: one active row, overwrite unfinished session

This is closest to current Patch 427 implementation.

Benefits:

- Smallest architecture.
- Maintains one visible active cloud row.
- Replacement is atomic as one update.

Costs:

- Unfinished old session data is lost from cloud.
- Homepage copy cannot truthfully say the old session remains available.
- No user-visible abandoned-session history exists.

### Model B: one active session plus archived unfinished sessions

Replacement would archive or abandon the existing active row, then create a new active row with uniqueness/idempotency protections.

Benefits:

- No unfinished work is silently lost.
- Homepage copy can truthfully promise availability if Account exposes archived/abandoned sessions.
- Better audit trail for cross-device sessions.

Costs:

- Requires product language for abandoned sessions.
- Requires atomicity design: archive-plus-insert needs transaction/RPC or DB constraint plus recovery.
- Requires Account UI and retention decisions.

### Model C: multiple drafts, one current active session

Several saved drafts could exist while one is selected as active.

Benefits:

- Most flexible.
- Avoids data loss and supports experimentation.

Costs:

- Larger product concept and navigation burden.
- Requires draft management UI, statuses and migration policy.
- More complex than the current one-active-session design.

## Recommended Product Model

Recommend Model B as the safest product direction: preserve one canonical active session, but archive/abandon the previous unfinished active session on explicit replacement instead of overwriting it. This matches the user's likely expectation that "current session will remain available" and reduces data-loss risk without introducing multiple active drafts.

The implementation should be a separate patch because it needs:

- a clear `archived` versus `abandoned` account-history decision
- homepage copy correction or route correction
- Party Order handoff alignment
- idempotent replacement with DB-level active uniqueness or a transaction/RPC
- tests for duplicate prevention, stale writes, and old-session availability

## Recommended Implementation Patch

Patch 428B should not redesign all history. The narrowest useful implementation would be:

1. Fix homepage `Start a new pizza` to use an explicit new-session intent and copy that matches the real data model.
2. Align Party Order handoff with the same typed active-session conflict/replace path.
3. Decide and implement either:
   - truthful overwrite copy and tests, if Model A is intentionally accepted; or
   - archive previous unfinished active session before creating the new active session, if Model B is accepted.
4. Add DB-level or transactional uniqueness protection for one active row per user, or document why it is deferred.
5. Document completed-session retention as "latest five shown, storage retained until user/archive/account deletion" if that remains the policy.

## Validation Performed

Planned after this document is written:

- focused Session Start tests
- canonical resolver/homepage tests
- active-session API and cloud-session tests
- Account active and completed-history tests
- Review completion tests
- Party Order handoff tests
- lint
- production build
- `git diff --check`
- `git status --short`

## Required Conclusion

Active-session replacement can lose unfinished work
