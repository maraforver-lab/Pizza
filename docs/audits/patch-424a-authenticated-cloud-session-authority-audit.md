# Patch 424A: Authenticated Cloud Session Authority Audit

Audit date: 2026-07-15
Branch: `patch/424a-cloud-session-authority-audit`
Audited starting commit: `5c424d04`
Scope: audit-only. No production code, tests, routes, persistence, schemas, authentication, SEO, navigation, or deployment behavior changed.

## Executive Summary

DoughTools currently has several active-session authorities:

- browser-local active session storage
- a browser-local cloud-backed marker
- the latest `pizza_sessions.status = "in_progress"` cloud row
- route-local page state derived from local storage
- homepage-specific local/cloud resolution
- Account-specific cloud-first resolution

The intended authenticated contract is "cloud is authoritative, local is only a cache." The current implementation does not enforce that contract everywhere. Account is effectively cloud-first, homepage uses a mixed timestamp resolver, and the Pizza Session routes are local-first and only write/sync to cloud after they have already selected a local session.

This makes the reported symptoms plausible and source-confirmed:

- A signed-in user can see Account continue one active cloud session while `/session/kitchen` or `/session/review` reads another local active session.
- Homepage can choose a newer local session over an older cloud active session even when they are different logical sessions.
- Review completion can fail to appear in Account history when the session is not correctly marked cloud-backed or when the completion path does not target the canonical cloud row.
- Sign-in does not run a canonical promotion/restore resolver; auth callback only exchanges the code and redirects.

The safest next implementation is a narrow Patch 424B that introduces one signed-in active-session resolver and makes homepage, Account, and all active Pizza Session routes use the same cloud-first session authority before rendering or mutating session state.

## Audit Method

Inspected source:

- `lib/pizza-session-storage.ts`
- `lib/cloud-pizza-session-client.ts`
- `lib/cloud-pizza-session-restore.ts`
- `lib/homepage-active-session.ts`
- `app/auth/callback/route.ts`
- `app/api/pizza-sessions/active/route.ts`
- `app/api/pizza-sessions/history/route.ts`
- `components/HomepageSessionActions.tsx`
- `components/ContinuePizzaSessionCard.tsx`
- `components/account/AccountActivePizzaSessionCard.tsx`
- `components/account/AccountPizzaSessionHistory.tsx`
- `components/session/CloudPizzaSessionSync.tsx`
- `components/session/SavePizzaSessionToAccount.tsx`
- `app/session/start/page.tsx`
- `app/session/recipe/page.tsx`
- `app/session/shopping/page.tsx`
- `app/session/timeline/page.tsx`
- `app/session/kitchen/page.tsx`
- `app/session/review/page.tsx`
- `lib/session-recipe.ts`
- `lib/pizza-session-shopping-list.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-review.ts`
- cloud/session tests in `tests/cloud-pizza-sessions.test.ts`
- homepage resolver tests in `tests/homepage-active-session.test.ts`
- review tests in `tests/pizza-session-review.test.ts`

Searches used:

- active local storage keys and helpers
- cloud-backed marker helpers
- active cloud API calls
- restore/materialization calls
- save queue calls
- Review completion calls
- Account active/history queries
- `updatedAt` stale-write comparisons

## Intended Authority Contract

Signed out:

- Local browser storage is authoritative.
- No cloud read or write is required.

Signed in:

- The active cloud session is authoritative.
- Local storage is a cache/materialized copy of the active cloud session.
- If a cloud active session exists, it wins over an unrelated local session even if the local `updatedAt` is newer.
- A newer local session may only win automatically when it is the same canonical cloud-backed session and the cloud row is stale.
- All routes must resolve the same canonical session before rendering or mutating.
- Writes must target the canonical cloud row.

Sign-in transition:

- Local active + no cloud active: promote local to cloud, mark it cloud-backed, and continue the same progress.
- Local active + cloud active: restore cloud locally and do not continue the incompatible local session as active.
- Losing local data must be documented or archived explicitly; it must not silently overwrite cloud.

Review completion:

- Complete the same canonical cloud session used by Kitchen.
- Preserve Review data.
- Mark that cloud row completed.
- Make it visible in Account history.
- Clear or reconcile local active pointers.
- Avoid creating a second unrelated completed session.

## Current Persistence Primitives

### Local active session

Source: `lib/pizza-session-storage.ts`

- Session list key: `doughtools:pizza-sessions-v1`
- Active pointer key: `doughtools:active-pizza-session-id`
- `getActivePizzaSession()` reads the active ID and returns the matching non-archived, non-completed local session.
- `savePizzaSession()` always rewrites `updatedAt` and `lastSavedAt` to the current time.
- `completePizzaSession()` marks a local session completed and clears the local active pointer.

Local storage is complete enough to run the anonymous product flow, but by itself it does not know whether the signed-in user's account has a different active cloud session.

### Cloud-backed marker

Source: `lib/cloud-pizza-session-client.ts`

- Marker key: `doughtools:cloud-backed-pizza-session-id`
- Marker shape: `{ sessionId, cloudSessionId? }`
- Legacy raw string markers are still accepted.
- `markCloudBackedPizzaSession(session.id, row.id)` connects a local session id to a cloud row id.
- `cloudBackedPizzaSessionRowId(session)` only returns a row id if the marker session id matches the local session id.

This marker is local-only. It can be missing, stale, or point to an inactive row. It is not a server-side active-session authority.

### Active cloud session

Source: `app/api/pizza-sessions/active/route.ts`

- `GET` returns the latest `pizza_sessions` row for the signed-in user with `status = "in_progress"`, ordered by `updated_at desc`, limited to one row.
- `POST` inserts or updates the latest in-progress row when the logical `session_data.id` matches. If a different logical session already exists, it returns `409 conflict`.
- `PATCH` updates the requested cloud row when `cloudSessionId` is provided, otherwise the latest in-progress row. It also rejects different logical session ids with `409 conflict`.
- `PATCH complete` marks the row `status = "completed"` and sets `completed_at`.
- `DELETE` archives the latest in-progress row.

There is no separate active-session pointer table. "Active cloud session" currently means "latest in-progress row."

### Cloud restore

Source: `lib/cloud-pizza-session-restore.ts`

`restoreCloudPizzaSessionToLocal(row)` migrates `row.session_data`, saves it locally, sets the local active pointer to that restored session id, and marks it cloud-backed with `row.id`.

This is the correct materialization primitive, but it is not called by every route before local session selection.

## Current Route Authority Map

| Surface | Current first read | Cloud read? | Resolver behavior | Risk |
| --- | --- | --- | --- | --- |
| `/` homepage CTA | local first | yes, when signed in | `resolveHomepageActiveSession(local, cloud)` compares timestamps | Newer unrelated local can win over cloud |
| Account active card | cloud | yes | fetches `/api/pizza-sessions/active` and restores on continue | Closest to intended contract |
| `/session/start` | local first | yes, when signed in unless `new=1` or handoff | if cloud id differs, shows conflict choice | Better than downstream routes, but still route-local |
| `/session/recipe` | local | write-only sync | `generateAndSaveActiveSessionRecipe()` uses `getActivePizzaSession()` | Can open/mutate stale or wrong local session |
| `/session/shopping` | local | write-only sync | `generateAndSaveActiveShoppingList()` uses `getActivePizzaSession()` | Can open/mutate stale or wrong local session |
| `/session/timeline` | local | write-only sync | `generateAndSaveActivePizzaSessionTimeline()` uses `getActivePizzaSession()` | Can open/mutate stale or wrong local session |
| `/session/kitchen` | local | write-only sync | page state initializes from `getActivePizzaSession()` | Can run Kitchen for a non-canonical local session |
| `/session/review` | local | write/complete only | initializes from `getActivePizzaSession()` | Can complete local-only or wrong local session |
| Account history | cloud completed rows | yes | fetches `/api/pizza-sessions/history` | Does not show local-only completions |

The downstream Session routes share cloud sync through `CloudPizzaSessionSync`, but that component only writes. It does not fetch, compare, or restore the canonical cloud active session before the page chooses the session.

## Source-Of-Truth Matrix

| User state | Local session | Cloud session | Current winner | Intended winner | Current risk |
| --- | --- | --- | --- | --- | --- |
| Signed out | exists | none | Local | Local | Low; anonymous flow is intentionally local |
| Signed in | none | exists | Homepage/Account can use cloud; direct Session routes show no local session | Cloud | Medium; direct `/session/*` routes do not restore cloud first |
| Signed in | older local | newer cloud | Homepage chooses cloud; Account chooses cloud; Session routes choose local | Cloud | High; different surfaces can continue different sessions |
| Signed in | newer local | older cloud | Homepage chooses local; Account chooses cloud; Session routes choose local | Cloud unless same canonical cloud-backed session | High; timestamp-only local win violates contract for different logical sessions |
| Sign-in transition | local exists | no cloud active | Auth callback does nothing; later route sync may POST | Promote local to cloud | Medium; promotion is opportunistic, not canonical |
| Sign-in transition | local exists | cloud active exists | Auth callback does nothing; homepage may choose local if newer; Account chooses cloud; Start shows conflict | Cloud | High; no global sign-in conflict resolution |
| Review completion | local active | cloud active | Review completes the local active session and tries cloud save/complete | Same canonical cloud session | High; if marker is absent/wrong or active row differs, history can miss the completed review |

Important: `newer local` is not sufficient evidence that local should win for a signed-in user. It is only safe when the local session is the same logical session and is correctly cloud-backed to the same canonical row.

## Identity Audit

Current identifiers:

| Identity | Location | Meaning | Stability |
| --- | --- | --- | --- |
| Local session id | `PizzaSession.id` in `doughtools:pizza-sessions-v1` | Logical session id inside session payload | Stable for that local session |
| Local active pointer | `doughtools:active-pizza-session-id` | Browser-selected active session id | Browser-local and can point to a non-cloud or stale session |
| Cloud row id | `pizza_sessions.id` | Database row identity | Stable server-side row id |
| Cloud logical session id | `pizza_sessions.session_data.id` | Logical session id stored inside row | Must match local `PizzaSession.id` for safe sync |
| Cloud-backed marker | `doughtools:cloud-backed-pizza-session-id` | Local mapping from session id to cloud row id | Browser-local and optional |
| Active cloud reference | latest `status = "in_progress"` row | Implicit active session | Not a separate pointer; multiple older in-progress rows can be hidden |
| User id | Supabase user id | Account owner | Server authoritative |
| Progress state | `currentStep`, `lastRoute`, `timeline`, `stepRuntime`, `status` | Session progress | Stored in both local and cloud payloads |

The application does not currently have one stable active-session identity abstraction. It has a set of loosely related identifiers, and the relationship is rebuilt differently by different UI surfaces.

## Identity Flow

Current desired flow:

```text
anonymous local session
  -> sign in
  -> cloud materialization or cloud restore decision
  -> active cloud session row
  -> local materialized cache
  -> Kitchen progress writes to the same cloud row
  -> Review completes the same cloud row
  -> completed Account history
```

Current implemented flow is conditional:

```text
anonymous local session
  -> sign in callback
  -> redirect only; no resolver runs
  -> next page decides independently
     -> homepage: timestamp resolver
     -> Account: cloud-first active row
     -> Session routes: local-first, then write-only sync
  -> Review local completion
  -> optional cloud POST/PATCH depending on account state and marker
  -> Account history only if a cloud row becomes completed
```

## Sign-In Transition Findings

Source: `app/auth/callback/route.ts`

The auth callback exchanges the OAuth/code session and redirects to the requested `next` URL. It does not:

- read local active Pizza Session
- fetch active cloud Pizza Session
- promote local to cloud
- restore cloud to local
- resolve local/cloud conflicts
- archive or preserve a losing local session

Therefore sign-in transition authority is deferred to whichever page renders next. That page may be homepage, Account, Start, Recipe, Kitchen, or another route, and each has different logic.

Confirmed issue: the sign-in boundary has no canonical session authority handoff.

## Homepage Findings

Source: `lib/homepage-active-session.ts` and `components/HomepageSessionActions.tsx`

Homepage reads local first, then fetches cloud if signed in. It calls `resolveHomepageActiveSession(localSession, cloudRow)`.

The helper:

- returns cloud when cloud exists and local does not
- returns local when local exists and cloud does not
- when both exist, compares `updatedAt`
- chooses local if local is newer or if cloud does not have a newer timestamp

This is correct only when both objects are the same canonical session or when the user is signed out. It is not correct for a signed-in user with unrelated local and cloud sessions.

Test evidence: `tests/homepage-active-session.test.ts` currently asserts that a newer local active session should win over an older cloud row even when the ids differ. That test documents the current behavior but conflicts with this audit's intended signed-in authority contract.

Confirmed issue: homepage can route a signed-in user to a non-canonical local active session.

## Account Findings

Sources:

- `components/account/AccountActivePizzaSessionCard.tsx`
- `components/account/AccountPizzaSessionHistory.tsx`
- `app/api/pizza-sessions/active/route.ts`
- `app/api/pizza-sessions/history/route.ts`

Account active-session behavior is closest to the intended model:

- fetches `/api/pizza-sessions/active`
- uses cloud row if present
- restores cloud locally before Continue
- clears stale local cloud-backed pointer when cloud has no active row

Account history:

- fetches `/api/pizza-sessions/history`
- only displays cloud rows with `status = "completed"`
- does not display browser-local completed sessions

This is internally coherent, but it differs from downstream Session routes. If Review completes only locally or completes a different row than Account considers active, history will not show the expected session.

## Session Route Findings

### Recipe

Sources:

- `app/session/recipe/page.tsx`
- `lib/session-recipe.ts`

`generateAndSaveActiveSessionRecipe()` calls `getActivePizzaSession()` and then `updatePizzaSession()`. Recipe renders and mutates the local active session. `SavePizzaSessionToAccount` and `CloudPizzaSessionSync` can write to cloud later, but Recipe does not first restore the signed-in cloud session.

Risk: Recipe can update a stale or unrelated local active session while a signed-in account has a different active cloud session.

### Shopping

Sources:

- `app/session/shopping/page.tsx`
- `lib/pizza-session-shopping-list.ts`

Shopping calls `getActivePizzaSession()` through `generateAndSaveActiveShoppingList()`. The route then renders and mutates local session state. Cloud sync is write-only.

Risk: Shopping can generate a list and change checkboxes for the wrong local active session.

### Timeline

Sources:

- `app/session/timeline/page.tsx`
- `lib/pizza-session-timeline.ts`

Timeline calls `generateAndSaveActivePizzaSessionTimeline()`, which reads `getActivePizzaSession()`. Cloud sync runs only after local selection and mutation.

Risk: Timeline can regenerate or preserve a timeline for a stale local session even while Account has a different cloud active session.

### Kitchen

Source: `app/session/kitchen/page.tsx`

Kitchen initializes page state with `getActivePizzaSession()`. Progress changes call `queueCloudActivePizzaSessionSave(updated)` and `CloudPizzaSessionSync` also writes the rendered session.

Risk: Kitchen can execute and sync a local session that is not the signed-in user's canonical cloud session. If the API detects a different active cloud row, writes can conflict, but the local UI has already advanced.

### Review

Sources:

- `app/session/review/page.tsx`
- `lib/pizza-session-review.ts`
- `lib/cloud-pizza-session-client.ts`

Review initializes from `getActivePizzaSession()`. `completeSessionReview(session, reviewInput)` completes local state and clears the local active pointer. Then Review attempts:

1. `saveCloudActivePizzaSession(completed)`
2. if that did not return a skipped result, `completeCloudBackedPizzaSession(completed)`

This is fragile:

- `syncCloudBackedPizzaSession(..., { complete: true })` skips without network when the session is not marked cloud-backed.
- `saveCloudActivePizzaSession(completed)` uses `POST` and the active route checks the latest in-progress row. If another in-progress cloud session exists with a different logical id, it returns `409 conflict`.
- Review catches cloud errors and still routes home, so the user may see local completion success while Account history does not get a completed cloud row.
- Because Review chose local first, it can complete a different session from the one Account would continue.

Confirmed issue: Review completion is not guaranteed to target the same canonical cloud session that Account considers active.

## Cloud Save Queue And Stale Protection

Source: `lib/cloud-pizza-session-client.ts`

Client queue behavior:

- `latestActivePizzaSessionForCloudSync(session, storage)` compares incoming session to local active only when ids match.
- If the active local session is a different id, it returns the incoming session.
- Queue deduplication is in memory and keyed by session fields.
- `syncCloudBackedPizzaSession()` PATCHes when local marker says the session is cloud-backed, otherwise POSTs a new/active session.

Server protection:

- API rejects different logical session ids with `409 conflict`.
- API rejects stale same-session payloads when the existing cloud session has a newer `session_data.updatedAt`.
- If `cloudSessionId` is absent, PATCH selects the latest in-progress row.

This protects the database from some stale overwrites, but it does not make the UI resolve the correct session before rendering. The user can still act on stale local state, and the failed cloud write may be hidden by catch blocks.

## Review Completion And Account History Trace

Expected cloud-backed success path:

```text
Kitchen uses cloud-backed local session
  -> Review reads same local session
  -> completeSessionReview writes Review data locally
  -> saveCloudActivePizzaSession(completed) updates same active row or succeeds
  -> completeCloudBackedPizzaSession(completed) PATCHes same row with complete=true
  -> row status becomes completed
  -> Account history GET returns the row
```

Failure paths found:

1. Local-only Review completion:

```text
Review local session is not cloud-backed
  -> completeSessionReview completes locally
  -> saveCloudActivePizzaSession may be skipped if unauthenticated or may conflict if another cloud active exists
  -> completeCloudBackedPizzaSession skips if no marker or fails on conflict
  -> Account history has no completed row
```

2. Different local and cloud active sessions:

```text
Account active cloud row = A
Browser local active session = B
Review reads B
  -> cloud POST/PATCH sees active row A
  -> API rejects different session id
  -> Review catches the failure and routes home
  -> Account history still lacks B
```

3. Missing/stale cloud-backed marker:

```text
Local session payload matches a cloud row
Marker missing or row id absent
  -> completion may PATCH latest in-progress row instead of intended row, or skip complete
  -> row mismatch can conflict
```

4. Multiple in-progress rows:

```text
API GET/POST/PATCH without explicit row id uses latest in-progress row
Older in-progress rows remain hidden
  -> completion may not affect the row the user expects if local marker is missing
```

## Multiple Cloud Rows

The active API prevents creating or updating a different logical active session through normal POST/PATCH when an in-progress row already exists. However, the current model can still have multiple in-progress rows from older data, concurrent races, manual database state, or previous bugs.

When multiple rows exist:

- GET returns only the latest by `updated_at`.
- POST/PATCH without `cloudSessionId` act against only the latest row.
- Older in-progress rows remain invisible to Account active state.

Recommendation: Patch 424B should not attempt broad cleanup, but it should always operate through an explicit resolved canonical cloud row id when one exists. A later migration/audit can decide whether to archive duplicate in-progress rows.

## Test Coverage Findings

Useful existing tests:

- cloud-backed marker behavior
- cloud restore to local
- active API conflict/stale response source checks
- Kitchen progress serialization and restore
- Review cloud completion request payload when marker exists
- Account active-session source checks
- Account history source checks
- homepage resume route mapping

False-confidence risks:

- Several tests are source-string assertions, not behavior tests.
- Homepage tests currently encode the timestamp-only local win behavior, which conflicts with the desired signed-in cloud-first contract for different logical sessions.
- Review tests verify cloud calls are present but do not prove Review used the same canonical cloud session that Kitchen or Account used.
- Cloud route tests prove the API rejects conflicts, but not that the UI responds by restoring cloud authority.
- There is no full signed-in transition test that starts anonymous, signs in, and verifies promotion or cloud restore.
- There is no route-entry test proving `/session/recipe`, `/session/shopping`, `/session/timeline`, `/session/kitchen`, and `/session/review` all resolve the same signed-in cloud active session before local mutation.

## Failure Hypotheses

| Hypothesis | Status | Evidence |
| --- | --- | --- |
| Signed-in homepage can choose local over cloud | Confirmed | `resolveHomepageActiveSession()` compares timestamps without requiring same logical session |
| Account and homepage can disagree | Confirmed | Account is cloud-first; homepage can choose newer local |
| Account and direct Session routes can disagree | Confirmed by source | Session routes read `getActivePizzaSession()` before any cloud restore |
| Auth callback resolves local/cloud conflicts | Disproven | `app/auth/callback/route.ts` only exchanges code and redirects |
| Review always completes the Account active cloud row | Disproven | Review reads local first and cloud completion depends on marker/API success |
| Local-only completion appears in Account history | Disproven | Account history only fetches cloud completed rows |
| API stale protection is absent | Disproven | active route rejects newer existing same-session payloads |
| API conflict protection is sufficient for UI correctness | Disproven | conflicts prevent writes but do not correct already-rendered local UI state |
| Multiple active cloud rows are impossible | Plausible but unproven | API reduces normal creation risk, but no unique active pointer or uniqueness proof was found |
| Cloud restore can be skipped because local exists | Confirmed on downstream routes | Recipe/Shopping/Timeline/Kitchen/Review do not fetch cloud before local selection |

## Root Cause

The root cause is not a single stale-write bug. It is an authority-boundary bug:

1. Local storage remains the default source for most active Pizza Session routes.
2. Cloud is authoritative only on Account and sometimes homepage/start.
3. The app lacks one shared signed-in active-session resolver.
4. The auth transition does not promote/restore/reconcile sessions.
5. Review completion is local-first and only then attempts cloud completion.

The database API contains useful conflict and stale protections, but the UI often chooses the wrong local session before those protections can help.

## Recommended Patch 424B Scope

Implement one canonical signed-in active-session resolver. Suggested responsibilities:

- Detect signed-in user.
- Fetch latest active cloud row.
- Read local active session.
- Read cloud-backed marker and row id.
- If signed out, return local.
- If signed in and cloud exists:
  - cloud wins unless local is the same logical cloud-backed session and is newer by valid `updatedAt`.
  - restore the chosen canonical session locally.
  - ensure local active pointer and marker match the canonical row.
- If signed in and no cloud exists:
  - promote local active session to cloud when present.
  - mark the promoted session cloud-backed.
  - if no local active, return empty.
- Return a typed resolution result:
  - source: local, cloud, promoted-local, empty, conflict/error
  - session
  - cloud row id
  - resume route
  - user-visible conflict/error message when needed

Then use it in:

- homepage actions
- Account active card if useful, while preserving cloud-first behavior
- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`

Review-specific hardening:

- Before completing, resolve the canonical signed-in session.
- Complete only the canonical cloud-backed session when signed in.
- Use the explicit resolved cloud row id.
- If signed-in cloud completion fails, show a recoverable error instead of silently routing home as if Account history is guaranteed.
- Keep anonymous local completion behavior intact.

## Recommended Patch 424C Scope

After 424B, add behavior tests and optional cleanup for duplicate cloud rows:

- signed-in local/cloud conflict flows
- sign-in promotion from anonymous session
- direct route restore for cloud-only sessions
- Review completion -> Account history
- stale local route snapshot cannot overwrite cloud
- duplicate in-progress row handling or investigation

Do not combine duplicate-row cleanup with the resolver patch unless the resolver requires it.

## Protected Invariants For Follow-Up Work

Do not change:

- dough formulas
- fermentation or Kitchen timing calculations
- Pizza Session schema unless a narrow optional field is proven required
- Party Orders
- auth provider configuration
- SEO/navigation
- anonymous local flow
- Review form fields and data model

The fix should be about session authority, not product behavior.

## Final Conclusion

Conclusion: multiple interacting authority issues.

The current app has enough cloud write and stale-write protection to prevent some data corruption, but it does not have one consistent signed-in source of truth. Account is cloud-first; homepage is timestamp-mixed; downstream session routes are local-first; Review completion is local-first and may not complete the Account active cloud row.

Patch 424B should establish a shared signed-in active-session resolver and route-entry contract before any further Review/history or homepage fixes are attempted.
