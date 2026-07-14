# Patch 395: Kitchen cloud progress persistence

## Executive summary

Patch 395 reproduced and fixed two Kitchen progress continuity issues found after Patch 393:

1. A restored or continued session with canonical Kitchen progress could be sent back to `/session/timeline` when `lastRoute` was stale.
2. Kitchen step mutations relied on the route-level cloud sync effect, so an immediate navigation or unmount after starting or completing a step could miss the newest Kitchen snapshot before the sync effect observed it.

The fix is intentionally narrow:

- `pizzaSessionContinueHref` now prefers canonical review/Kitchen session state before `lastRoute`.
- Kitchen start and completion handlers explicitly queue the updated session snapshot for cloud sync before updating React state.

No formulas, session schema, persistence contract, authentication, Party Orders, SEO, experience-level logic, or unrelated routes were changed.

## Starting point

- Branch: `patch/395-kitchen-cloud-progress-persistence`
- Audited base: `d933f2fe` (`Patch 394: Preserve session experience level`)
- Patch 373 present: `e052e730` (`Patch 373: Restore active session cloud sync`)
- Patch 374 present: `c7d357e7` (`Patch 374: Persist Kitchen step progress`)
- Patch 393 present: `f7506227` (`Patch 393: Audit product integrity and session state`)
- Patch 394 present: `d933f2fe` (`Patch 394: Preserve session experience level`)
- Active session schema version: `1`

## Reproduction evidence

### Failing reproduction 1: stale resume route wins over Kitchen progress

Added a regression case in `tests/session-flow-navigation.test.ts`:

- `currentStep: "prep"`
- `status: "preparing"`
- `lastRoute: "/session/timeline"`
- timeline contains one `done` step and one `todo` step
- `stepRuntime` contains completed runtime for `mix-dough`

Pre-fix result:

- Expected: `/session/kitchen`
- Received: `/session/timeline`

Command:

```txt
npm.cmd run test -- tests/session-flow-navigation.test.ts
```

Classification: resume-routing bug.

### Failing reproduction 2: Kitchen mutation snapshot not explicitly queued

Added a focused source regression in `tests/cloud-pizza-sessions.test.ts`.

Pre-fix result:

- `app/session/kitchen/page.tsx` did not import or call `queueCloudActivePizzaSessionSave`.
- Starting or completing a Kitchen step relied on `<CloudPizzaSessionSync session={session} />` after `setSession(updated)`.
- If the user navigated away immediately, the newest snapshot could be missed before the effect queued it.

Command:

```txt
npm.cmd run test -- tests/cloud-pizza-sessions.test.ts -t "queues the latest Kitchen mutation snapshot"
```

Classification: sync-trigger bug.

## Root cause

### Resume routing

`pizzaSessionContinueHref` trusted a safe `lastRoute` before inspecting the canonical session phase. A cloud-restored or locally restored session could contain correct Kitchen progress and a stale safe route. Because `/session/timeline` is a safe route, the helper returned it before reaching the Kitchen-state checks.

### Kitchen cloud queue trigger

Kitchen Mode already wrote progress locally through `completeKitchenTimelineStep` and `startPizzaSessionTimelineStep`, and route-level cloud sync persisted normal render updates. The immediate-navigation gap was that the updated Kitchen snapshot was not queued at mutation time. A quick route change or close could unmount the sync effect before it observed and queued the new object.

## Fix implemented

### Resume routing

Updated `lib/pizza-session.ts`:

- `/session/review` wins when `currentStep === "review"`.
- `/session/kitchen` wins when active timeline work exists and `currentStep` is `timeline`, `prep`, or `bake`.
- `/session/kitchen` also wins for `prep` and `bake` even if the timeline is fully complete.
- `lastRoute` is still honored after canonical review/Kitchen state has been checked.

This preserves the existing Pizza Session route model while preventing stale safe routes from overriding Kitchen progress.

### Kitchen sync trigger

Updated `app/session/kitchen/page.tsx`:

- Added `queueKitchenProgressSync(updated)`.
- It calls `queueCloudActivePizzaSessionSave(updated).catch(...)`.
- `completeCurrentStep` queues the updated snapshot before `setSession(updated)`.
- `startCurrentStep` queues the updated snapshot before `setSession(updated)`.

The local active session remains current even if the cloud queue rejects; the existing route-level sync can retry on the next render.

## Canonical persisted Kitchen fields

Kitchen progress remains represented by the existing active session object:

- `currentStep`
- `status`
- `timeline.steps[].status`
- `timeline.steps[].scheduledAt`
- `stepRuntime[stepId].actualStartedAt`
- `stepRuntime[stepId].actualCompletedAt`
- `updatedAt`
- `lastSavedAt`
- `lastRoute`

No new field or schema migration was introduced.

## Payload and API behavior

The direct Kitchen queue uses the existing `queueCloudActivePizzaSessionSave(updated)` path. It does not introduce a second payload format.

Existing cloud behavior remains in place:

- newest update wins in the client queue
- missing active cloud row creation remains handled by the existing API path
- stale-write protection remains handled by the existing API path
- cloud restore continues to use the existing active-session restore logic

## Browser validation

Production build was run, then the local production server was started on `127.0.0.1:3000`.

Validated with a local browser automation context at:

- `390 x 844`
- `430 x 740`
- `1280 x 900`
- `1440 x 950`

Scenario:

1. Inject an active local session with `currentStep: "prep"`, stale `lastRoute: "/session/timeline"`, one completed step, one todo step, and `stepRuntime`.
2. Open `/`.
3. Confirm the continue action points to `/session/kitchen`.
4. Open `/session/kitchen`.
5. Confirm Kitchen renders with the expected session level visible.
6. Confirm browser Back returns to `/` without a loop.
7. Confirm no horizontal overflow and no console errors.

Result:

| Viewport | Continue target | Kitchen route | Overflow | Console errors |
| --- | --- | --- | --- | --- |
| 390 x 844 | `/session/kitchen` | `/session/kitchen` | No | 0 |
| 430 x 740 | `/session/kitchen` | `/session/kitchen` | No | 0 |
| 1280 x 900 | `/session/kitchen` | `/session/kitchen` | No | 0 |
| 1440 x 950 | `/session/kitchen` | `/session/kitchen` | No | 0 |

Live signed-in cross-device testing was not performed because no safe signed-in development account or production-like cloud database was available in this task. The cloud path was validated through existing and added automated tests around queue usage, active-session API behavior, stale-write behavior, missing-row behavior, and restore/resume routing.

## Validation

Focused failing reproductions after fix:

```txt
npm.cmd run test -- tests/session-flow-navigation.test.ts tests/cloud-pizza-sessions.test.ts -t "resumes persisted Kitchen progress|queues the latest Kitchen mutation snapshot"
```

Result: 2 passed, 51 skipped.

Focused session/cloud/Kitchen suite:

```txt
npm.cmd run test -- tests/session-flow-navigation.test.ts tests/cloud-pizza-sessions.test.ts tests/pizza-session-kitchen.test.ts tests/pizza-session-timeline.test.ts tests/start-pizza-session-wizard.test.ts tests/pizza-session.test.ts
```

Result: 6 files passed, 209 tests passed.

Full suite:

```txt
npm.cmd run test
```

Result: 60 files passed, 1000 tests passed.

Lint:

```txt
npm.cmd run lint
```

Result: passed.

Build:

```txt
npm.cmd run build
```

Result: passed. Next.js generated 43 static pages.

`git diff --check`:

Result: passed. Git reported CRLF working-copy warnings only; no whitespace errors were found.

## Changed files

- `app/session/kitchen/page.tsx`
- `lib/pizza-session.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/session-flow-navigation.test.ts`
- `docs/audits/patch-395-kitchen-cloud-progress-persistence.md`

## Protected invariants

Confirmed unchanged by scope review:

- recipe calculations
- dough calculations
- sauce quantities
- Timeline schedule generation
- `stepRuntime` schema
- Pizza Session schema version
- active-session storage keys
- cloud API contract
- authentication
- account behavior
- Party Orders
- SEO and sitemap behavior
- navigation
- experience-level continuity from Patch 394

## Final conclusion

Patch 395 fixes the confirmed Kitchen progress continuity defects without redesigning Kitchen Mode or changing the active-session schema. The patch preserves the existing cloud queue and API contract, but makes Kitchen progress harder to lose by queuing the newest mutation snapshot immediately and by ensuring restored Kitchen progress resumes to Kitchen even when `lastRoute` is stale.
