# Patch 434A: Start New Pizza lifecycle audit

## 1. Executive summary

Patch 434A audited the current signed-in "Start new pizza" conflict flow from the current `master` state.

Requested starting commit: `073acfe48de12f52fb997172fbf54d3741180896`.

Actual audited starting commit: `e4b98f4c0ffd52e9ace1fd4e22db5eb77dbfe943`.

The requested commit is behind current `master` because Patch 433 has already been merged. Patch 433 is a mobile Timeline copy/presentation change and does not alter the active-session lifecycle audited here.

Main finding: the current conflict flow is structurally confusing and lifecycle-heavy. The app has the server primitives for archive-before-create replacement, but the Session Start UI can show the conflict decision and the normal sticky `Create my pizza plan` action at the same time. Pressing the sticky action during conflict repeats the non-replacement create path and can reproduce the same `409 active_session_exists` conflict.

The current archived-session lifecycle works as a preservation model in source: old unfinished active rows are moved to `archived`, a new `in_progress` row is inserted, and Account can list, rename and delete archived rows. However, the product owner has now decided archived unfinished sessions do not provide meaningful user value. The safest follow-up is a no-archive replacement model with one explicit decision surface and an owner-scoped atomic replacement transaction.

No production code, tests, API behavior, database schema, migrations, RPCs, UI, session data, cloud rows, formulas, Timeline, Kitchen, Account data, Party Orders or deployment state were changed in this audit.

## 2. Current reproduction

The supplied mobile screenshots show `/session/start` at the completed setup summary with an active account-session conflict.

Visible setup summary:

| Field | Visible value |
| --- | --- |
| Oven | Pizza oven |
| Style | Neapolitan-style |
| When | Sat 18 Jul - 18:00 |
| Dough start | Let DoughTools recommend |
| Quantity | 4 pizzas - 260 g each |
| Flour situation | Recommend what to buy |

Visible conflict UI:

- `ACTIVE ACCOUNT SESSION`
- `You already have an active pizza session.`
- `Continue the saved session, keep editing this setup, or explicitly start a new active pizza session.`
- `Existing session opens at /session/recipe.`
- `Continue existing session`
- `Keep setup`
- `Start new pizza`

The screenshot also shows that the normal sticky action remains visible below the conflict card:

- `Create my pizza plan`

When nested replacement confirmation is open, the page also shows:

- `Start a new pizza session?`
- `Your current pizza session will be archived so you can return to its details later. A new active session will be created from these choices.`
- `Keep setup`
- `Start new pizza`

This is the exact mobile defect surface: the user sees a conflict choice, a nested confirmation, and the original creation CTA in the same decision moment.

## 3. Current button behavior matrix

| Visible action | Current click result | Network request | Local state change | Cloud change | Navigation | Intended meaning | Defect |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Continue existing session` | Calls `continueExistingCloudSession()` from `app/session/start/page.tsx:897`. It resolves the canonical active session and routes to its resume href. | `GET /api/pizza-sessions/active` through `resolveCanonicalActivePizzaSession()`. | Restores/materializes the cloud session locally when found. | No mutation. | Canonical resume route, or conflict `resumeRoute` fallback. | Continue the account's existing unfinished pizza. | Good intent, but the visible route text such as `/session/recipe` is technical and should not be user-facing. |
| `Keep setup` | Calls `cancelActiveCloudConflict()` from `app/session/start/page.tsx:922`. It clears conflict UI and returns to setup state. | None. | Keeps current React setup/session state; clears conflict and replacement confirmation. The active local pointer may already have been cleared after the first 409. | None. | None. | Keep editing the new setup without replacing the account session. | Ambiguous. It does not explain that the new setup is not yet saved as active; reload/back can lose the in-memory draft after the active pointer was cleared. |
| `Start new pizza` | First click sets `confirmingCloudStartNew` to `true` at `app/session/start/page.tsx:1495`. In the nested confirmation, the second click calls `continueToRecipe({ replaceActiveCloudSession: true })` at `app/session/start/page.tsx:1496`. | `POST /api/pizza-sessions/active` with `archiveActiveAndCreateNew` and `replaceActiveSession` flags via `lib/cloud-pizza-session-client.ts:205-213`. | Saves the new setup as the local active session before cloud materialization. | API calls `archive_active_and_create_pizza_session` when a conflicting active row exists. | `/session/recipe` after successful cloud materialization. | Replace the existing unfinished account session with this new setup. | Copy still says archive, not permanent replacement. Two-step nested choice competes with the sticky create CTA. |
| `Create my pizza plan` | Calls `continueToRecipe()` without replacement options at `app/session/start/page.tsx:1524`. | `POST /api/pizza-sessions/active` without archive/replace flags. | Saves the new setup locally, then clears the active local pointer if the API returns typed conflict. | No mutation on typed conflict. | None on conflict; Recipe only after successful materialization. | Normal final create action when no conflict exists. | It remains visible during conflict and retriggers the same `409 active_session_exists` path. It is a second primary action for the same decision point. |

`Start new pizza` does not merely set a local flag forever. It opens a nested confirmation first; the nested confirmation directly invokes the server replacement lifecycle. It does not require the user to press `Create my pizza plan` again. The problem is that the sticky `Create my pizza plan` remains available anyway.

## 4. Current Session Start state machine

Observed source states in `app/session/start/page.tsx`:

- `editing setup`
- `setup ready`
- `creating session`
- `active-session conflict`
- `keeping setup`
- `replacement confirmation`
- `replacement in progress`
- `success`
- `recoverable error`

State-transition diagram:

```text
editing setup
  -> setup ready
  -> Create my pizza plan
  -> creating session
  -> POST /api/pizza-sessions/active
      -> success
          -> cloud-backed local marker
          -> /session/recipe
      -> active_session_exists
          -> clear active local pointer
          -> active-session conflict
              -> Continue existing session
                  -> canonical resolver
                  -> existing resume route
              -> Keep setup
                  -> clear conflict UI
                  -> setup remains in memory
              -> Start new pizza
                  -> replacement confirmation
                      -> Keep setup
                          -> active-session conflict or setup
                      -> Start new pizza
                          -> creating replacement
                          -> archive/create RPC
                          -> new active cloud row
                          -> /session/recipe
```

Answers:

1. Conflict state and normal-create state can exist visually at the same time. `activeCloudConflict` renders the conflict card at `app/session/start/page.tsx:1490-1497`, while the sticky summary CTA still renders `Create my pizza plan` at `app/session/start/page.tsx:1524-1525`.
2. The sticky CTA remains visible because the summary action row is not gated by `activeCloudConflict`.
3. Yes. During conflict the UI has two competing creation actions: `Start new pizza` inside the conflict card and `Create my pizza plan` in the sticky action area.
4. `Keep setup` clears the conflict and preserves current in-memory setup state. It does not cloud-save the setup and does not make it canonical.
5. `Start new pizza` invokes the server lifecycle only after the nested confirmation.
6. The user does not need to press another button after choosing nested `Start new pizza`, but the persistent sticky CTA implies otherwise.
7. Repeated clicks are partly guarded by `creatingPlan`, but the UI still exposes multiple ways to trigger create attempts before the state is settled.
8. Reload or browser Back after a conflict can lose the unsaved setup because the first conflict path may clear the active local pointer.
9. Yes. The page can look like setup is ready while Account still has the old active cloud session.
10. The main business logic is shared, but the mobile screenshot shows the presentation problem most sharply because the sticky CTA remains in view below the conflict card.

## 5. Patch 427 conflict integration

Patch 427 introduced the typed conflict contract. The current API response source is `app/api/pizza-sessions/active/route.ts:22-33`:

- `error: "active_session_exists"`
- `conflict: true`
- `activeSessionId`
- `activeCloudRowId`
- `cloudRowId`
- `cloudSessionId`
- `localSessionId`
- `resumeRoute`

The current client parses that shape in `lib/cloud-pizza-session-client.ts:65` and raises `ActiveCloudPizzaSessionConflictError`. Session Start catches it in `continueToRecipe()` and stores it in `activeCloudConflict`.

The integration is type-aware but not decision-complete. It gives the UI enough information to offer a safe choice, but the page still exposes the normal non-conflict create CTA.

## 6. Patch 428B archive/create integration

Patch 428B added archive-before-create replacement. Current client options are converted in `lib/cloud-pizza-session-client.ts:205-213`:

- `archiveActiveAndCreateNew`
- `replaceActiveSession`
- `sessionData`

`app/api/pizza-sessions/active/route.ts:86-108` treats either archive/replace flag as replacement intent. When there is an existing active cloud row with a different logical session id and no replacement flag, it returns typed 409 at `route.ts:106`. With replacement intent it calls the RPC at `route.ts:108`.

The migration `supabase/migrations/20260716120000_archive_active_pizza_session_replacements.sql`:

- adds `archived_at`
- creates `pizza_sessions_one_active_per_user_idx` for one `in_progress` row per user at lines `27-29`
- defines `archive_active_and_create_pizza_session` at line `31`
- locks the existing active row with `for update`
- updates it to `status = 'archived'`
- inserts a separate new `in_progress` row
- returns the new active row plus archived diagnostics

Source evidence indicates the archive/create lifecycle should run when the nested replacement confirmation is used. This audit did not execute a live production RPC or inspect live cloud rows.

## 7. API and RPC trace

Current non-replacement create path:

```text
Session Start setup
  -> savePizzaSession(local)
  -> setActivePizzaSession(local id)
  -> materializeCloudBackedPizzaSession(local)
  -> POST /api/pizza-sessions/active
  -> active row lookup
  -> existing different session found
  -> 409 active_session_exists
  -> Session Start clears active local pointer and shows conflict
```

Current replacement path:

```text
Session Start conflict
  -> Start new pizza
  -> nested confirmation
  -> continueToRecipe({ replaceActiveCloudSession: true })
  -> savePizzaSession(local)
  -> setActivePizzaSession(local id)
  -> materializeCloudBackedPizzaSession(local, archive/replace flags)
  -> POST /api/pizza-sessions/active
  -> existing active row found
  -> archive_active_and_create_pizza_session(...)
  -> existing row becomes archived
  -> new row becomes in_progress
  -> returned row is restored as cloud-backed local session
  -> /session/recipe
```

Potential failure points to protect in Patch 434B:

- replacement RPC signature mismatch after migration drift
- partial deployment where app sends new no-archive intent but old RPC still archives
- duplicate clicks before `creatingPlan` disables all competing controls
- stale tab PATCH from old cloud row after replacement
- stale local active pointer after a failed replacement

## 8. Canonical session identity trace

For an active replacement today:

| Identity item | Current behavior |
| --- | --- |
| setup draft | Held in Session Start React/session state until saved. |
| local `PizzaSession.id` | Generated for the new setup before cloud materialization. |
| local active pointer | Set to the new local id before the POST; cleared when the first non-replacement POST returns 409. |
| cloud row id | Existing active row has one id; archive/create inserts a new active row with a new id. |
| `session_data.id` | Used as the logical Pizza Session id. The RPC is idempotent when the incoming logical id already matches the active row. |
| user id | Supabase authenticated user id; all active/history/archive queries are owner-scoped. |
| status | `in_progress`, `completed`, or `archived`. |
| `updatedAt` | Used for same-logical-session freshness checks; unrelated logical sessions must not be compared by timestamp. |
| cloud-backed marker | Written after successful cloud materialization/restoration by client helpers. |
| canonical resolver | For signed-in users, cloud active wins unless the local and cloud rows are the same logical session and local is newer. |

After Review completion, PATCH marks the active cloud row as `completed`; Account history queries `status = "completed"` and returns retained completed rows.

## 9. Archived-session value analysis

Current archived session capabilities:

| Capability | Current value |
| --- | --- |
| View details | Partial account-card details and summary. |
| Name it | Yes, through archived PATCH endpoint and Account UI. |
| Delete it | Yes, through archived DELETE endpoint and Account UI. |
| Restore it | No. |
| Continue it | No. |
| Use in Kitchen | No. |
| Use for another Pizza Session | No. |

Archived sessions are currently readable backups, not actionable drafts. `components/account/AccountArchivedPizzaSessions.tsx:226` explicitly states archived sessions are read-only in this version.

Product value conclusion: low. The feature preserves unfinished work but does not let users continue it. It adds Account surface area, database status complexity, retention logic and test coverage for a state the product owner no longer wants.

## 10. Archived-dependent code inventory

Implementation that exists solely or primarily for archived Pizza Sessions:

| Area | Evidence | Patch 434B implication |
| --- | --- | --- |
| Cloud status union | `lib/cloud-pizza-sessions.ts` includes `"archived"`. | Keep only if existing archived rows remain queryable/cleanupable; eventually remove after data policy is resolved. |
| `archived_at` column | `20260716120000...` migration adds it. | No new archived writes; column can remain for compatibility until cleanup. |
| Active delete behavior | `app/api/pizza-sessions/active/route.ts` DELETE archives active rows. | Must change if no archived workflow remains. |
| Archive/create RPC | `archive_active_and_create_pizza_session`. | Replace with a no-archive atomic replacement RPC. |
| Archived retention | `ARCHIVED_PIZZA_SESSION_RETENTION_LIMIT = 3`; retention trigger deletes older archived rows. | Remove or leave inert after app stops archiving. |
| Archived API routes | `app/api/pizza-sessions/archived/**`. | Remove or hide from UI depending rollout policy. |
| Account archived section | `AccountArchivedPizzaSessions` imported in `app/account/page.tsx:8` and rendered at `app/account/page.tsx:168`. | Remove from Account in the no-archive model. |
| Homepage replacement copy | `components/HomepageSessionActions.tsx:231`. | Change archive promise to permanent-replacement copy. |
| Party Order handoff copy and flags | `components/account/PartyOrderSessionHandoff.tsx:86-91` and `229-256`. | Move to same no-archive replacement flow. |
| Tests | `tests/account-responsive-workspace.test.ts`, `tests/cloud-pizza-sessions.test.ts`. | Rewrite/remove archived lifecycle assertions. |

Party Order "archived" status is a separate Party Order lifecycle and must not be confused with archived Pizza Sessions.

## 11. Anonymous-session promotion

The canonical resolver in `lib/canonical-active-pizza-session.ts` currently implements this model:

- signed-out users use local active session authority
- signed-in users query cloud active sessions
- if signed in with local session and no cloud active row, `chooseCanonicalActivePizzaSession()` returns `promote`
- `resolveCanonicalActivePizzaSession()` calls `promoteLocalPizzaSessionToCloud()` and restores the returned cloud row locally
- if signed in with a cloud active row and an unrelated local active session, the cloud row wins

This protects the cloud session from accidental overwrite, but it does not yet provide the future product choice when an anonymous local session collides with an existing active account session:

- continue account pizza
- use this local pizza instead
- cancel

Patch 434B should preserve successful no-cloud promotion and add a clear conflict choice for local-vs-cloud collisions when the user is explicitly trying to keep the local setup.

## 12. Local/cloud conflict behavior

Current signed-in conflict rules:

| State | Current behavior |
| --- | --- |
| Cloud active exists, unrelated local setup tries to create | API returns typed `409 active_session_exists`. |
| Session Start receives 409 | Shows conflict UI and clears local active pointer if it points to the rejected new session. |
| User continues existing | Cloud session is restored locally and opened. |
| User keeps setup | Conflict clears; setup remains in memory only. |
| User chooses nested replacement | Current active cloud row is archived, new setup becomes active. |
| Stale unrelated local later tries to sync | API conflict should reject it because logical session ids differ. |

The cloud-authoritative model is conceptually right. The weak point is the conflict UI/state machine and the now-unwanted archived outcome.

## 13. Party Order behavior

`components/account/PartyOrderSessionHandoff.tsx` currently mirrors the archive-before-create contract:

- creates a `PizzaSession` draft from Party Order totals
- attempts `saveCloudActivePizzaSession(saved)`
- catches typed active-session conflict
- offers `Continue existing session`, `Keep Party Order setup`, and `Start new pizza`
- confirmed `Start new pizza` retries with `archiveActiveAndCreateNew` and `replaceActiveSession`

Under the future no-archive model, Party Order should not have a separate replacement lifecycle. It should use the same owner-scoped atomic replacement contract as Session Start:

```text
Party Order draft
  -> active cloud check
  -> if conflict, explicit permanent replacement confirmation
  -> atomic replace active cloud session
  -> Party Order session becomes canonical
```

The Party Order data itself should remain intact. Only the unfinished active Pizza Session should be replaced.

## 14. Mobile UX findings

The supplied mobile screenshot confirms these UX defects:

- duplicate primary actions: conflict `Start new pizza` plus sticky `Create my pizza plan`
- technical route text visible to the user: `Existing session opens at /session/recipe.`
- unclear distinction between account session and current setup draft
- `Keep setup` does not explain whether the setup is saved
- `Start new pizza` says "start", but the actual consequence is archive/create today and permanent replacement in the preferred future model
- nested confirmation appears inside the already tall setup surface
- the sticky CTA remains available below the conflict decision
- the user must understand "active pizza session" and route names to reason about the flow

Recommended mobile decision pattern for Patch 434B:

```text
You already have an unfinished pizza
Continue it, or replace it with this new plan.

[ Continue current pizza ]
[ Use this new pizza plan ]
[ Keep editing ]
```

After `Use this new pizza plan`:

```text
Replace your unfinished pizza?
Your current unfinished pizza plan will be permanently removed.
This new setup will become your active plan.

[ Keep current pizza ]
[ Replace and create new plan ]
```

When this decision is shown, the normal sticky `Create my pizza plan` action should be hidden or disabled so there is only one creation path.

## 15. Desktop parity

The logic must be identical on mobile and desktop:

- same active-session authority
- same cloud/local conflict result
- same replacement confirmation
- same atomic server transaction
- same canonical resume route
- same loading, retry and failure behavior

Only presentation may differ. Desktop can use a wider layout, but it must not keep a separate non-conflict create CTA available during conflict.

## 16. Atomic replacement model comparison

| Model | Description | Advantages | Risks | Recommendation |
| --- | --- | --- | --- | --- |
| Model A - update existing active row in place | Keep the same cloud row id and replace `session_data`. | Simple, no temporary duplicate row, old data lost only after confirmed write. | Stale clients holding the old cloud row id may appear to be same-row writers; harder to distinguish old logical session from new one unless logical id checks are strict. |
| Model B - delete old row and create new row in one transaction | Remove the old unfinished row and insert a separate new `in_progress` row atomically. | Clear lifecycle, new logical cloud identity, no archive row, completed rows unaffected, easier to reason about stale old-row writes. | Requires a new RPC/migration and careful idempotency handling. |
| Model C - create new row, then delete old row | Insert first, delete second. | Easy to conceptualize. | Can temporarily violate one-active uniqueness and can leave two active rows or zero active rows after partial failure. |

Recommended model: Model B.

Patch 434B should add an owner-scoped RPC such as `replace_active_pizza_session` that performs delete-old-and-insert-new in one transaction. It should:

- require `auth.uid()`
- lock the user's current active row
- preserve completed rows
- not write `archived`
- insert exactly one new `in_progress` row
- be idempotent for retries with the same incoming `session_data.id`
- return the new active row
- fail atomically so the old active session remains when replacement fails

## 17. Existing archived-data rollout options

| Option | Behavior | Pros | Risks |
| --- | --- | --- | --- |
| Option A - delete all existing archived rows during migration | Remove archived rows immediately. | Simplest future model. | Deletes user data that may have been promised as available; low reversibility. |
| Option B - keep existing archived rows temporarily but hide them from Account | Stop creating archived rows and remove the user-facing archived workflow, but do not delete old rows in the same rollout. | Safest, reversible, avoids surprise data deletion while product copy is corrected. | Leaves dormant data and code/migration cleanup for a later patch. |
| Option C - owner-scoped cleanup operation | Provide an explicit cleanup process or migration after notice. | Controlled data handling. | More process and governance work. |

Recommended rollout: Option B for Patch 434B, followed by a separate cleanup decision. Existing archived rows may contain unique user setup data because the app previously told users those sessions could be returned to for details. Hiding them and stopping new creation is safer than deleting them in the same behavioral patch.

## 18. Account changes

Current Account model:

- one Active Pizza Session section
- Archived Pizza Sessions section
- Completed Pizza Session history
- Party Orders

Evidence:

- `app/account/page.tsx:8` imports `AccountArchivedPizzaSessions`
- `app/account/page.tsx:168` renders it
- `components/account/AccountArchivedPizzaSessions.tsx` fetches `/api/pizza-sessions/archived`
- archived rows can be renamed and deleted
- completed history fetches `/api/pizza-sessions/history`

Future no-archive model:

- one Active Pizza Session section
- Completed Sessions section, maximum 15 retained
- no Archived Pizza Sessions section

Completed sessions already use `COMPLETED_PIZZA_SESSION_RETENTION_LIMIT = 15` in `lib/cloud-pizza-sessions.ts:18` and the history route limits to that value at `app/api/pizza-sessions/history/route.ts:49`.

Active-session manual deletion should be re-audited in Patch 434B because current active DELETE archives the row. Under the no-archive model, deleting an unfinished active session should either permanently delete it after explicit confirmation or be removed as a user action.

## 19. Test impact

Existing tests to preserve or update:

| Test area | Current coverage | Patch 434B impact |
| --- | --- | --- |
| Session Start conflict | Source/string tests cover typed conflict UI and replacement options. | Rewrite for one clear conflict surface, no sticky create CTA during conflict, permanent-replacement copy. |
| Continue existing | Covered through resolver and source assertions. | Preserve. |
| Keep setup | Source-covered. | Add behavior expectations that setup remains intact and no mutation occurs. |
| Start new pizza | Currently archive/create-focused. | Rewrite to no-archive atomic replacement. |
| Archive/create RPC | Source tests in `tests/cloud-pizza-sessions.test.ts`. | Remove or replace with new replacement RPC tests. |
| Anonymous promotion | `tests/homepage-active-session.test.ts` covers promote when no cloud active. | Preserve and extend for local-vs-cloud explicit choice if implemented. |
| Cloud authority | Resolver tests exist. | Preserve. |
| Account archived section | `tests/account-responsive-workspace.test.ts` requires archived section order and behavior. | Remove/rewrite. |
| Completed history | Existing tests assert 15 retained completed sessions. | Preserve. |
| Party Order handoff | Source/component tests likely cover archive conflict copy and flags. | Rewrite to shared no-archive replacement contract. |
| Idempotency/retries | Current RPC has same-session idempotency. | Add tests for new replacement RPC idempotency and duplicate-click prevention. |
| Mobile sticky CTA | Current tests only assert `Create my pizza plan` count generally. | Add conflict-state test that sticky create action is not visible/active. |
| Desktop parity | Mostly source-level today. | Add parity assertions that mobile and desktop use same conflict state machine. |

The audit changed no tests.

## 20. Confirmed root causes

1. Session Start presentation defect: conflict state does not suppress the normal sticky `Create my pizza plan` action.
2. Session Start state-machine defect: the conflict decision and normal creation action can be active in the same visible state.
3. Product-model mismatch: the implemented archive-before-create lifecycle preserves unfinished sessions, but the current product decision is no archived-session workflow.
4. UX copy defect: user-facing copy promises archive/recovery and exposes route paths, which no longer matches the preferred lifecycle.
5. Draft durability gap: after a typed conflict, the rejected new setup can remain only in component memory because the active local pointer may be cleared.
6. Party Order coupling: Party Order handoff still uses the archive-before-create flags and copy.

## 21. Recommended Patch 434B

Patch 434B should be narrow and ordered:

1. Add a new owner-scoped atomic replacement RPC for no-archive replacement, preferably delete-old-and-insert-new in one transaction.
2. Update `POST /api/pizza-sessions/active` so explicit replacement uses the new RPC instead of `archive_active_and_create_pizza_session`.
3. Keep typed `409 active_session_exists` for non-replacement creation.
4. Update Session Start conflict UI to one clear decision surface:
   - `Continue current pizza`
   - `Use this new pizza plan`
   - `Keep editing`
5. Hide or disable the sticky `Create my pizza plan` action while an active-session conflict or replacement confirmation is visible.
6. Replace archive copy with permanent-replacement copy.
7. Ensure `Keep editing` preserves the setup draft and does not mutate cloud.
8. Ensure replacement failure keeps both the old cloud active session and the current setup draft intact.
9. Update Homepage `Start a new pizza` confirmation copy and route behavior to the no-archive model.
10. Update Party Order handoff to the same replacement contract.
11. Remove Account archived UI from the visible account workspace.
12. Stop creating new archived Pizza Session rows.
13. Preserve completed history and the 15-row completed retention behavior.
14. Add tests for replacement idempotency, conflict-state sticky CTA suppression, Party Order replacement, failure rollback, and stale old-session write rejection.

Out of scope for Patch 434B unless explicitly approved:

- deleting existing archived production rows
- removing historical migrations
- changing completed-session retention
- changing formulas, Timeline, Kitchen or Review behavior

## 22. Migration and deployment requirements

Patch 434B requires a Supabase migration if the server adopts the recommended no-archive atomic replacement model.

Safe deployment order:

1. Add the new RPC/migration while leaving existing archive RPC and columns in place.
2. Deploy application code that calls the new replacement RPC and stops creating archived rows.
3. Hide archived sessions from Account in the same app deployment, or keep a temporary admin-only fallback if required.
4. Verify replacement, retry/idempotency, Account active session, completed history and Party Order handoff.
5. Decide separately whether to delete existing archived rows, keep them hidden temporarily, or provide an owner-scoped cleanup.

Do not remove the old archive RPC or `archived_at` column in the same deployment unless production archived-row cleanup has already been decided and tested.

## 23. Regression risks

| Risk | Required guard |
| --- | --- |
| Old active session deleted before new insert fails | Replacement must be one transaction with rollback. |
| Two active sessions created | Keep partial unique index and transaction locking. |
| Duplicate requests create duplicate rows | Add idempotency by incoming logical session id and disable competing UI actions. |
| Completed history deleted accidentally | Replacement query must scope only `status = 'in_progress'`; completed retention remains independent. |
| Stale device resurrects deleted active session | API must reject old cloud row/logical session writes after replacement. |
| Anonymous local session overwritten silently | Conflict choice must be explicit when cloud active exists. |
| Party Order bypasses replacement confirmation | Party Order handoff must call the same replacement path. |
| Account still promises archived recovery | Remove or hide archived UI and replace copy. |
| Existing archived rows deleted too early | Keep hidden temporarily unless a separate cleanup is approved. |

## Implementation reference

Patch 434B implements the reviewed no-archive lifecycle. It adds `replace_active_pizza_session(...)`, removes the user-facing archived Pizza Session product surface, hides the normal sticky create action during Session Start conflict resolution, and documents the migration/deployment order in `docs/audits/patch-434b-no-archive-session-lifecycle.md`.

## Final answers

1. Is the current Start New Pizza flow functionally broken? Yes, for the user-facing signed-in conflict flow. The server replacement path exists, but the UI exposes competing actions and can retrigger the conflict.
2. Is it primarily confusing UI or failed lifecycle execution? Multiple causes: presentation/state-machine confusion plus a lifecycle model the product no longer wants.
3. What does each visible action currently do? See the button behavior matrix.
4. Does the current archive/create RPC run? Source confirms it is called for confirmed replacement with archive/replace flags; this audit did not execute a live production RPC.
5. Does it create the correct cloud rows? Source and migration indicate yes: old active becomes archived, new row becomes `in_progress`, one active row remains. Live database verification was not performed in this audit.
6. Why does the sticky Create CTA remain visible? The summary sticky action is not gated by `activeCloudConflict`.
7. Is the current archived feature useful to users? Low value. It is a read-only backup with rename/delete/details, not a continuable draft.
8. What code and database objects depend on archived status? See archived-dependent code inventory.
9. Can archived sessions be removed safely? New archived creation can be stopped safely with a replacement RPC and UI/API changes. Existing rows should not be deleted in the same patch without a separate data-retention decision.
10. What should happen to existing archived rows? Keep them temporarily but hide them from Account; decide cleanup separately.
11. How should anonymous local-session promotion work? Promote to cloud only when no active cloud session exists. If cloud already has an active session, present a choice to continue the account pizza or replace it with the local pizza after explicit confirmation.
12. Which atomic replacement model is safest? Model B: delete old unfinished active row and insert new active row in one owner-scoped transaction.
13. What is the exact Patch 434B scope? Add no-archive replacement RPC/API path, simplify Session Start conflict UI, suppress sticky create CTA during conflict, update Homepage and Party Order replacement copy/flow, hide archived Account UI, update tests.
14. Does Patch 434B require a Supabase migration? Yes, for the recommended atomic no-archive replacement RPC.
15. What is the required deployment order? Migration first, app code second, no deployment until replacement, conflict, Account, Party Order and completed-history tests pass.

Multiple interacting lifecycle defects
