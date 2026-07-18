# Patch 436A: Overdue Kitchen completion audit

## 1. Executive summary

Patch 436A audited the reported stall where a signed-in user resumed Kitchen Mode on an overdue fermentation step, pressed `Fermentation complete`, and saw no visible progress.

The strongest source-level root cause is not the generic overdue readiness branch. The same-id overdue room-fermentation path is covered by an existing behavior test and advances to `ball-dough`.

The confirmed risk is a mismatch between the step id rendered by Kitchen and the step id stored in the persisted timeline:

- `getKitchenModeState(...)` builds Kitchen's current step from `timelineStepsForPlanningSummaryDisplay(...)`.
- That display helper can normalize fermentation ids, for example `room-ferment` to `cold-ferment`, `cold-ferment` to `room-ferment`, or either to `ferment-dough`.
- `completeKitchenTimelineStep(session, currentStep.id, ...)` then looks for that rendered id in the original `session.timeline.steps`.
- If the original timeline contains the legacy id instead of the rendered id, `completeKitchenTimelineStep` returns `undefined`.
- `app/session/kitchen/page.tsx` silently returns when `updated` is undefined, so there is no visible error, no local state update, no cloud queue, and no rerender to the next step.

This matches the observed immediate no-op: the button appears enabled, but the session remains on overdue fermentation.

Cloud authority and save queue behavior can make the issue harder to recover from on reload or another device, but the immediate stall is best explained by a local completion no-op before cloud sync is attempted.

## 2. Exact reproduction

Reported production scenario:

1. User is signed in.
2. Active cloud-backed Pizza Session exists.
3. `/session/kitchen` resumes a fermentation step.
4. Effective fermentation ready time passed about three hours earlier.
5. UI shows an actionable `Fermentation complete` button.
6. User presses the button.
7. No visible progression occurs.

Expected:

1. No early-completion warning.
2. Fermentation receives `actualCompletedAt`.
3. Persisted timeline marks fermentation done.
4. Effective schedule recalculates.
5. Current step advances to `ball-dough` or the canonical next step.
6. Local state updates immediately.
7. Cloud save is queued or completed.
8. Reload and Account restore the advanced state.

Source-level reproduction result:

- Same-id overdue `room-ferment` completion is already covered in `tests/pizza-session-kitchen.test.ts` and works.
- A stale displayed-id mismatch is not covered: for example, persisted timeline contains `room-ferment`, but display normalization renders `cold-ferment`. In that state, clicking calls completion with `cold-ferment`; the original timeline lookup does not find it; completion returns `undefined`; no local or cloud mutation follows.

## 3. Current button event path

Current path in `app/session/kitchen/page.tsx`:

```text
button onClick
-> markDone()
-> currentStepCompletionBlocked?
-> if runtime work and not started, startCurrentStep()
-> otherwise completeCurrentStep()
-> completeKitchenTimelineStep(session, currentStep.id, undefined, now)
-> if (!updated) return
-> queueKitchenProgressSync(updated)
-> setConfirmEarlyCompletion(false)
-> setCurrentTime(now)
-> setSession(updated)
```

Important findings:

- Overdue biological steps are not blocked because `getKitchenStepWaitInfo` returns `isTooEarly: false` when `remainingMinutes <= 0`.
- The button is technically enabled for overdue steps.
- No source evidence shows a normal invisible overlay blocking overdue clicks.
- The early-completion dialog appears only when `currentStepCompletionBlocked` is true. Overdue steps do not enter that branch.
- The only silent local no-op in the completion path is `if (!updated) return`.

## 4. Readiness-state matrix

Current implementation uses the current rendered step's `scheduledAt`, which is the effective ready time after `deriveEffectiveKitchenSchedule(...)`.

| Step | Before ready | Exactly ready | Overdue | Button state | Click behavior | Dialog | Expected next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rest dough | `remainingMinutes > 0` | `remainingMinutes <= 0` | `remainingMinutes <= 0` | enabled during Patch 417 rollout, because `EARLY_COMPLETION_PREFERENCE_ENFORCED` is false | before ready opens warning; ready/overdue completes | warning only before ready | fermentation |
| Room fermentation | `remainingMinutes > 0` | `remainingMinutes <= 0` | `remainingMinutes <= 0` | same | before ready opens warning; ready/overdue completes when ids match | warning only before ready | ball dough |
| Cold fermentation | `remainingMinutes > 0` | `remainingMinutes <= 0` | `remainingMinutes <= 0` | same | same, but id mismatch risk exists for legacy normalized sessions | warning only before ready | ball dough |
| Ball rest / final proof | `remainingMinutes > 0` | `remainingMinutes <= 0` | `remainingMinutes <= 0` | same | before ready opens warning; ready/overdue completes | warning only before ready | next operational step |

Boundary details:

- Readiness uses `Math.ceil((scheduledAt - now) / 60_000)`.
- `remainingMinutes <= 0` is treated as ready.
- Overdue does not use a separate completion branch.
- UI timing and completion eligibility both read `currentStep.scheduledAt`.

## 5. Effective-schedule trace

`getKitchenModeState(session, now)` derives the current Kitchen step by:

```text
session.timeline.steps
-> buildSessionRecipe(...)
-> timelineStepsForPlanningSummaryDisplay(...)
-> deriveEffectiveKitchenSchedule(displaySteps, session.stepRuntime, target)
-> first runtime step where status === "todo" and id !== "review-result"
```

`deriveEffectiveKitchenSchedule(...)` preserves planned timeline values and changes runtime-facing `scheduledAt` for dependent steps:

- Rest end = `mix-dough.actualCompletedAt + 30 min`
- Fermentation end = rest completion or rest end plus planned fermentation duration
- Ball starts at fermentation completion or effective fermentation end
- Ball rest ends from actual ball completion or projected ball completion plus planned rest duration

For the affected overdue fermentation:

- Planned start and end remain in `session.timeline.steps`.
- Effective ready time is placed into rendered `currentStep.scheduledAt`.
- `currentStep.status` remains `todo` until completion.
- The current step is considered ready or overdue when effective `scheduledAt <= now`.

## 6. Runtime and timeline state

Successful same-id completion calls `completeKitchenTimelineStep(...)`:

```text
targetStep = session.timeline.steps.find(step.id === stepId)
if missing, return undefined
timeline step with that id -> status "done"
stepRuntime[stepId].actualStartedAt ||= now
stepRuntime[stepId].actualCompletedAt ||= now
currentStep = currentStepForTimelineStep(next todo original timeline step)
status = statusForTimelineStep(next todo original timeline step)
updatePizzaSession(...)
```

This means persisted timeline mutation currently depends on `stepId` existing in the original timeline, not only in the display-normalized Kitchen step list.

For a stale normalized fermentation:

```text
original persisted step: room-ferment
display-normalized step: cold-ferment
button calls completeKitchenTimelineStep(session, "cold-ferment")
original timeline lookup misses
function returns undefined
Kitchen handler silently returns
```

The reverse mismatch can also occur:

```text
original persisted step: cold-ferment
display-normalized step: room-ferment
button calls completeKitchenTimelineStep(session, "room-ferment")
original timeline lookup misses
```

Neutral fallback can similarly render `ferment-dough`.

## 7. Restored-session findings

Restored cloud sessions are materialized locally through `restoreCloudPizzaSessionToLocal(row, storage)`, which:

- migrates `row.session_data`
- saves it to local storage
- sets it as the local active session
- marks it cloud-backed with the cloud row id

Older sessions can still contain:

- stale fermentation ids
- stale labels/copy
- old planned timestamps
- incomplete `stepRuntime`
- timeline status values that predate display normalization

Existing normalization is sufficient for display, but not for completion identity. Display normalization can change the id used by the button without preserving a persisted-step id for mutation.

## 8. Cloud-authority findings

Signed-in Kitchen open path:

```text
resolveCanonicalActivePizzaSession()
-> GET /api/pizza-sessions/active
-> chooseCanonicalActivePizzaSession(local, cloud, signedIn)
-> restore cloud row locally when cloud wins
-> setSession(restored)
```

Completion sync path:

```text
local update succeeds
-> queueKitchenProgressSync(updated)
-> queueCloudActivePizzaSessionSave(updated)
-> PATCH /api/pizza-sessions/active
```

Cloud findings:

- If local completion returns `undefined`, no cloud save is queued.
- If local completion succeeds but cloud save fails, Kitchen currently swallows the queue error in `queueKitchenProgressSync`.
- The local updated session should remain visible in the same browser after a successful local update.
- For same logical session ids, canonical resolver prefers newer local cache over older cloud when local `updatedAt` is newer.
- A fresh browser cannot recover a locally updated step if the cloud save failed.
- The observed immediate no-op is more consistent with local completion returning `undefined` than with cloud rollback.

Identity fields to compare in Patch 436B validation:

| Identity | Expected |
| --- | --- |
| local session id | equals `session_data.id` for the canonical cloud row |
| cloud row id | stored in cloud-backed marker |
| page snapshot session id | equals active canonical session id |
| rendered step id | must map to a persisted timeline step id |
| runtime key | must be understood by effective schedule after completion |

## 9. Completion-transition findings

Expected fermentation transition:

```text
fermentation complete
-> persisted fermentation step status done
-> runtime completion recorded
-> effective schedule recalculates
-> ball-dough becomes current
```

When ids match, this is covered by the existing overdue room-fermentation behavior test.

When ids do not match:

- Ball dough may exist and be valid.
- Current-step selection is not reached because the persisted timeline never changes.
- No navigation is required; rerender would be sufficient if local state changed.
- The next step is not missing; the failure is before next-step derivation.

## 10. Error-handling findings

The current UI can silently swallow or hide these failure modes:

- `completeKitchenTimelineStep(...)` returns `undefined` because the displayed step id is not in the persisted timeline.
- `updatePizzaSession(...)` returns `undefined` if the active session is not present in local storage.
- `queueCloudActivePizzaSessionSave(...)` rejects after local mutation.

Current user-facing behavior:

- Local completion no-op: no error, no state change, no cloud request.
- Cloud queue failure after local success: no visible error in Kitchen.
- Stale write response: handled in API/client tests, but not surfaced in Kitchen as a visible warning.

Patch 436B should add a typed transition failure state or at least a visible retry state for local no-op cases.

## 11. Scenario results

| Scenario | Current source/test result |
| --- | --- |
| A: room fermentation three hours overdue | Works when persisted id is also `room-ferment`; existing test advances to `ball-dough`. Can stall if display normalizes id away from persisted id. |
| B: cold fermentation three hours overdue | Expected to work when persisted id is `cold-ferment`; no exact overdue cold-completion behavior test found. Can stall if display normalizes id away from persisted id. |
| C: exactly ready | Uses same branch as overdue because `remainingMinutes <= 0`; expected immediate completion when ids match. |
| D: one minute early | Patch 417 rollout opens warning; confirmed early completion calls the same completion helper, so id mismatch can still stall after confirmation. |
| E: Rest dough overdue | No id-normalization risk found for `rest-dough`; can still fail if local session is absent from storage. |
| F: Ball rest overdue | No id-normalization risk found for `room-temperature-rest`; can still fail if local session is absent from storage. |
| G: cloud-restored legacy session | Display normalization can make the step look modern while persisted ids remain legacy, creating the stall. |
| H: cloud save fails | Local state remains updated in current browser if local completion succeeded; no visible cloud error is shown. |
| I: stale second tab | Existing tests cover stale Back/snapshot protection for queue selection; no test found for stale tab after overdue fermentation completion with id mismatch. |
| J: repeated clicks | Same-id local completion is idempotent enough to record one `actualCompletedAt`; no focused repeated-click test found for overdue timed steps. |

## 12. System-wide impact

1. Can the entire Kitchen workflow stall when a timed step is overdue?
   Yes, when the displayed current step id cannot be found in persisted `session.timeline.steps`, the workflow can remain on the same step indefinitely.

2. Is the defect limited to fermentation?
   The strongest confirmed id-mismatch vector is fermentation because display normalization changes fermentation ids. A separate local-storage missing-session no-op could affect any step.

3. Can it affect Rest or Ball rest?
   Not through fermentation id normalization. It can affect them if `updatePizzaSession` cannot find the active local session.

4. Can it affect only restored sessions?
   Restored or older sessions are the highest-risk cases because they can carry stale fermentation ids. A newly created session with matching ids should work.

5. Does it affect local state, cloud state or both?
   In the id-mismatch path, local state does not change and cloud is not queued. In cloud-failure paths, local may change while cloud stays stale.

6. Can reload recover automatically?
   Reload does not fix an id mismatch because the same cloud/local data will render the same normalized display step again.

7. Can the user become permanently unable to complete the session?
   Yes, for that session until code maps the rendered step to the persisted step or normalizes stored timeline identity.

8. Can the issue cause data loss?
   The id-mismatch stall itself does not delete data. Cloud failure after local completion can create cross-device divergence.

9. Can it cause duplicate or skipped completions?
   No duplicate/skipped completion was confirmed. Patch 436B should still guard repeated clicks.

10. Does it interact with Patch 434B replacement identity?
    No direct Patch 434B replacement-row defect was found. Patch 434B makes active sessions cloud-authoritative, which makes legacy cloud rows more likely to be restored consistently and expose the same stall until fixed.

## 13. Confirmed root cause

Confirmed source-level root cause:

```text
Kitchen current step can be display-normalized to a different fermentation id than the id stored in session.timeline.steps.
Completion uses the display-normalized currentStep.id to mutate the persisted timeline.
completeKitchenTimelineStep returns undefined when that id is not found.
The React handler silently returns without showing an error or queueing cloud sync.
```

Evidence:

- `timelineStepsForPlanningSummaryDisplay(...)` can change fermentation ids in `coldFermentationCopy`, `roomFermentationCopy`, and `neutralFermentationCopy`.
- `getKitchenModeState(...)` derives the Kitchen current step from those display-normalized steps.
- `completeCurrentStep(...)` passes `currentStep.id` directly to `completeKitchenTimelineStep(...)`.
- `completeKitchenTimelineStep(...)` looks for `step.id === stepId` in the original persisted timeline and returns `undefined` if missing.
- The handler checks `if (!updated) return` and provides no error.

Secondary confirmed risk:

- Kitchen suppresses cloud queue errors after a successful local mutation, so a cloud persistence failure can be invisible until reload or cross-device restore.

## 14. Test gaps

Existing meaningful coverage:

- Same-id overdue room fermentation completion advances to Ball dough.
- Effective Rest countdown restores from cloud timeline and `stepRuntime`.
- Mix completion uses actual completion time.
- Room and cold fermentation duration preservation after Rest.
- Ball rest starts from actual Ball completion.
- Back-restored stale snapshot does not overwrite newer Kitchen progress in cloud queue.
- Active session resolver chooses canonical cloud/local state.

Gaps:

- No test for overdue `cold-ferment` completion.
- No test where persisted timeline id is `room-ferment` but displayed Kitchen id is `cold-ferment`.
- No test where persisted timeline id is `cold-ferment` but displayed Kitchen id is `room-ferment`.
- No test for neutral `ferment-dough` display id mismatch.
- No component behavior test that clicking an overdue displayed fermentation button changes local state.
- No visible error test for `completeKitchenTimelineStep(...)` returning `undefined`.
- No cloud restore test for a stale-id fermentation step followed by completion.
- No repeated-click test for timed overdue biological completion.
- No explicit cloud-save-failure UI test in Kitchen.

## 15. Recommended Patch 436B scope

Patch 436B should be narrow and behavior-focused:

1. Add a persisted-step resolution helper for Kitchen completion.
   - Exact id match first.
   - If the rendered step is a fermentation step and exact id is missing, find the one persisted todo fermentation step among `cold-ferment`, `room-ferment`, and `ferment-dough`.
   - Return both rendered id and persisted id.

2. Complete the persisted timeline row while preserving effective-schedule compatibility.
   - Mark the persisted timeline step done.
   - Record runtime completion under the id that `deriveEffectiveKitchenSchedule(...)` will read on the next render.
   - Consider recording both persisted and rendered ids if needed for backward compatibility.

3. Avoid changing planned timeline durations or formulas.

4. Add a visible transition error for true local no-op cases.
   - Example: "We could not update this Kitchen step. Reload and try again."
   - Do not silently remain on the same step.

5. Add behavior tests:
   - Overdue room fermentation same id.
   - Overdue cold fermentation same id.
   - Persisted `room-ferment` displayed as `cold-ferment`.
   - Persisted `cold-ferment` displayed as `room-ferment`.
   - Neutral `ferment-dough` fallback if applicable.
   - Cloud-restored stale fermentation completion.
   - Local missing-session transition failure surfaces an error.
   - Cloud queue failure remains local-first but is observable or retryable.

6. Keep cloud authority intact.
   - Do not bypass canonical resolver.
   - Do not create a new cloud save path.
   - Keep Patch 424B, 434B and stale-write protections.

## 16. Regression risks

- Updating the wrong fermentation row could skip a real remaining fermentation step.
- Recording runtime under only the persisted legacy id may leave `deriveEffectiveKitchenSchedule(...)` unable to see completion after display normalization.
- Recording runtime under only the rendered id may make historical timeline inspection harder if the original persisted id differs.
- Broadly normalizing stored timeline ids could affect Timeline, Account history, and existing tests.
- Surfacing cloud errors too aggressively could make local-first Kitchen progress feel broken even when local progress is safe.
- Repeated-click handling must avoid completing multiple steps at once.

Multiple interacting Kitchen progression defects

## Implementation Reference

Patch 436B implemented the recommended narrow fix in `lib/pizza-session-kitchen.ts` and `app/session/kitchen/page.tsx`.

The implementation keeps the planned Timeline unchanged, resolves displayed fermentation ids to the correct persisted Timeline step at completion time, records `actualCompletedAt` under the persisted id, and returns a typed completion result instead of silently returning `undefined`.

See `docs/audits/patch-436b-legacy-fermentation-completion-fix.md`.
