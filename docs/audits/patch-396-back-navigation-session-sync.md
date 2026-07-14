# Patch 396: Back-navigation active-session sync

## 1. Executive summary

Patch 396 reproduced and fixed the Back-navigation active-session sync regression observed after Patch 395.

Two related stale-state paths were confirmed:

1. A Back-restored route snapshot could be queued to cloud after newer Kitchen progress already existed in the active local session.
2. Opening `/session/timeline` through Back could rebase an already-started Kitchen session back to `currentStep: "timeline"` when the stored timeline snapshot had Kitchen progress but no matching `inputSignature`.

The fix is deliberately narrow:

- Cloud queue calls now resolve the latest active local session for the same session ID before enqueueing non-completion saves.
- Timeline generation now preserves an existing scheduled timeline snapshot when it already contains Kitchen progress.

No schema, formula, auth, SEO, Party Order, navigation or unrelated route behavior was changed.

## 2. Exact user-observed scenario

The product owner observed that Kitchen progress appeared to save correctly, but Back navigation could make active-session sync inconsistent. The suspected failure was not the initial Kitchen save. It was an older route or history-restored snapshot becoming authoritative after newer Kitchen progress had been saved.

Patch 396 validated this suspicion with deterministic tests and production-browser scenarios.

## 3. Reproduction environment

- Branch: `patch/396-back-navigation-session-sync`
- Starting commit: `262213b4` (`Patch 395: Fix Kitchen cloud progress persistence`)
- Production build: `npm.cmd run build`
- Local production server: `127.0.0.1:3000`
- Browser validation viewports:
  - `390 x 844`
  - `430 x 740`
  - `1280 x 900`
  - `1440 x 950`

Live signed-in Supabase testing was not available. Cloud behavior was validated with deterministic cloud-backed storage, queue payload tests and fetch interception.

## 4. Application Back reproduction

Scenario:

1. Seed an active session in Kitchen Mode.
2. Open `/session/kitchen?from=timeline`.
3. Start and complete `mix-dough`.
4. Use the application Back link to `/session/timeline`.
5. Inspect local active session.

Pre-fix browser result:

- `timeline.steps["mix-dough"].status` stayed `done`.
- `stepRuntime["mix-dough"]` stayed present.
- `currentStep` changed from `prep` to `timeline`.
- `updatedAt` was refreshed by the Timeline route.

This proved a route-only Timeline write could rebase canonical session phase around preserved Kitchen progress.

Post-fix browser result:

- `currentStep` remains `prep`.
- completed step remains `done`.
- `stepRuntime` remains present.
- `updatedAt` does not change during Timeline Back display.
- no horizontal overflow or console errors.

## 5. Browser Back reproduction

Scenario:

1. Complete a Kitchen step.
2. Use application Back to Timeline.
3. Use browser Back to return to Kitchen.

Pre-fix risk:

- browser history could expose an older route-local session snapshot to route sync.
- Timeline display had already rebased `currentStep`.

Post-fix result:

- browser Back returns to `/session/kitchen`.
- active session remains `currentStep: "prep"`.
- completed Kitchen progress and runtime remain unchanged.

## 6. Browser Forward reproduction

Scenario:

1. Complete a Kitchen step.
2. Application Back to Timeline.
3. Browser Back to Kitchen.
4. Browser Forward to Timeline.

Post-fix result:

- browser Forward displays Timeline but does not change canonical session state.
- active session remains `currentStep: "prep"`.
- fresh continuation still points to `/session/kitchen`.

## 7. Immediate Back reproduction

Patch 395 already fixed the immediate Kitchen mutation queue gap by queueing the Kitchen snapshot before `setSession(updated)`.

Patch 396 reproduced the follow-on issue:

- a stale route snapshot can still be queued after Back if the cloud queue trusts the route-local prop.
- a Timeline route can still rebase canonical phase after Back if it regenerates the timeline.

Regression tests now cover both paths.

## 8. Local state evidence

Failing Timeline regression:

```txt
npm.cmd run test -- tests/pizza-session-timeline.test.ts -t "does not rebase Kitchen progress"
```

Pre-fix failure:

- Expected `currentStep: "prep"`
- Received `currentStep: "timeline"`

The stored session had:

- `timeline.steps[0].status: "done"`
- `stepRuntime["mix-dough"].actualCompletedAt`
- `currentStep: "prep"`

Opening Timeline with a missing or stale timeline signature regenerated and saved the session as Timeline.

## 9. Queue evidence

Failing cloud regression:

```txt
npm.cmd run test -- tests/cloud-pizza-sessions.test.ts -t "Back-restored route snapshot"
```

Pre-fix payload:

- `currentStep: "timeline"`
- `status: "planning"`
- `lastRoute: "/session/timeline"`
- no Kitchen `stepRuntime`

Expected payload:

- `currentStep: "prep"`
- `status: "preparing"`
- `lastRoute: "/session/kitchen"`
- completed `mix-dough`
- Kitchen `stepRuntime`

This proved the queue trusted the Back-restored route snapshot instead of the newer canonical active session in storage.

## 10. Payload evidence

The fixed queue sends the latest active session for the same session ID when that local session is at least as new as the incoming route snapshot.

Tests cover:

- stale Timeline snapshot with older timestamp -> Kitchen snapshot is sent
- equal timestamp -> canonical active storage wins
- newer incoming Kitchen snapshot -> incoming snapshot wins over older storage

Completion saves are left unchanged so Review completion continues to send its explicit completed snapshot.

## 11. API/cloud evidence

The API stale-write protection remains unchanged:

- older `session.updatedAt` values are rejected against newer cloud `session_data.updatedAt`.
- requested cloud row ID behavior is unchanged.
- no new active row creation path was added.

Patch 396 prevents stale snapshots earlier, before they are sent to the API. The API still remains the final stale-write backstop.

No live signed-in database row was inspected.

## 12. Timestamp analysis

Confirmed problem:

- route-local stale snapshots can gain authority if they are queued directly or if a route-only update saves a regenerated session with a newer timestamp.

Fixed semantics:

- Cloud queue uses the latest active session when `active.updatedAt >= incoming.updatedAt`.
- If incoming is newer, incoming is preserved.
- Timeline display does not update timestamps when it is only preserving an existing Kitchen-progress timeline snapshot.

Equal timestamps are deterministic: canonical active storage wins for non-completion cloud sync.

## 13. `lastRoute` analysis

Patch 395 already ensured stale `lastRoute` cannot override canonical Kitchen continuation.

Patch 396 adds:

- stale route snapshots with old `lastRoute` are not queued when newer active session data exists.
- Timeline Back display no longer writes a full regenerated session just to show Timeline when Kitchen progress exists.

`lastRoute` may still exist as navigation metadata, but it no longer causes cloud payload downgrade in the reproduced path.

## 14. Root cause

Root-cause classification: H. Multiple interacting causes.

Confirmed causes:

- C. Cloud sync effect / queue path could queue stale route state because `queueCloudActivePizzaSessionSave` accepted the route-local `session` prop as authoritative.
- B. Route-only update rebased stale data because Timeline generation could rewrite `currentStep` and timestamps around an existing Kitchen-progress timeline.

Not confirmed:

- D. Queue ordering bug after correct snapshots are queued.
- E. Cloud restore precedence bug.
- F. Browser bfcache as an independent root cause.
- G. Resume-routing-only issue.

## 15. Failing regression tests

Added failing-first tests:

- `tests/cloud-pizza-sessions.test.ts`
  - `does not let a Back-restored route snapshot overwrite newer Kitchen progress in the cloud queue`
  - `chooses the canonical active session for equal-timestamp route snapshots`
  - `does not replace a newer incoming Kitchen snapshot with older active storage`
- `tests/pizza-session-timeline.test.ts`
  - `does not rebase Kitchen progress to Timeline when Back opens an older timeline snapshot`

The first and fourth tests failed before the production fixes and passed afterward.

## 16. Production fix

Changed `lib/cloud-pizza-session-client.ts`:

- added `latestActivePizzaSessionForCloudSync`
- queue resolves same-ID active storage before keying/enqueueing a non-completion save
- equal timestamps prefer canonical active storage
- newer incoming snapshots remain authoritative

Changed `lib/pizza-session-timeline.ts`:

- added `hasKitchenProgressTimelineSnapshot`
- if a stored timeline has scheduled steps plus Kitchen progress, Timeline display reuses it even when `inputSignature` is missing or stale
- avoids changing `currentStep`, `updatedAt`, `lastSavedAt`, `timeline.steps` or `stepRuntime` during Back display

## 17. Same-browser validation

Production-browser result at all required viewports:

| Viewport | App Back | Browser Back | Browser Forward | Overflow | Console errors |
| --- | --- | --- | --- | --- | --- |
| 390 x 844 | progress preserved, `currentStep: prep` | preserved | preserved | No | 0 |
| 430 x 740 | progress preserved, `currentStep: prep` | preserved | preserved | No | 0 |
| 1280 x 900 | progress preserved, `currentStep: prep` | preserved | preserved | No | 0 |
| 1440 x 950 | progress preserved, `currentStep: prep` | preserved | preserved | No | 0 |

No `/api/pizza-sessions/active` request was emitted in anonymous browser validation because the test was not signed in. Queue payload behavior was covered by deterministic tests.

## 18. Fresh-client validation

The browser validation copied the final active session snapshot into a fresh browser context.

Result at all required viewports:

- fresh homepage showed `Continue my plan`
- continue href was `/session/kitchen`
- active state remained `currentStep: "prep"`
- completed `mix-dough` and runtime timestamps remained present

## 19. Signed-in validation status

Live signed-in validation was not performed because no safe signed-in development account or production-like cloud database was available in this task.

Equivalent deterministic coverage:

- cloud-backed marker present
- `PATCH /api/pizza-sessions/active` payload captured
- stale Timeline payload rejected by queue selection
- newest Kitchen payload sent
- no duplicate active row path introduced

## 20. Limitations

- No live Supabase row was inspected.
- No cross-device signed-in browser session was available.
- Browser network inspection in anonymous mode naturally produced zero active-session API requests.
- The patch does not introduce a global active-session store; it fixes only the confirmed stale queue and Timeline rebase paths.

## 21. Protected invariants

Unchanged:

- recipe calculations
- dough calculations
- sauce quantities
- Timeline schedule formulas
- Kitchen step model
- `stepRuntime` schema
- Pizza Session schema version
- active-session storage keys
- authentication
- account semantics
- Party Orders
- SEO and sitemap
- navigation structure
- learning pages
- deployment configuration

No deployment was performed.

## Validation summary

Focused regressions:

```txt
npm.cmd run test -- tests/cloud-pizza-sessions.test.ts -t "Back-restored route snapshot"
npm.cmd run test -- tests/pizza-session-timeline.test.ts -t "does not rebase Kitchen progress"
```

Result: passed.

Focused suite:

```txt
npm.cmd run test -- tests/session-flow-navigation.test.ts tests/cloud-pizza-sessions.test.ts tests/pizza-session-kitchen.test.ts tests/pizza-session-timeline.test.ts tests/start-pizza-session-wizard.test.ts tests/pizza-session.test.ts tests/session-recipe.test.ts tests/pizza-session-shopping-list.test.ts tests/pizza-session-review.test.ts
```

Result: 9 files passed, 312 tests passed.

Full suite:

```txt
npm.cmd run test
```

Result: 60 files passed, 1004 tests passed.

Lint:

```txt
npm.cmd run lint
```

Result: passed.

Build:

```txt
npm.cmd run build
```

Result: passed, 43 static pages generated.

`git diff --check`:

Result: passed. Git reported CRLF working-copy warnings only; no whitespace errors were found.
