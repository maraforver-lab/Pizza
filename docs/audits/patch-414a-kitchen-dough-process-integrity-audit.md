# Patch 414A: Kitchen dough-process integrity audit

## 1. Executive summary

Patch 414A audited whether the current Pizza Session Timeline and Kitchen Mode preserve the biological dough-making sequence when the user completes Kitchen steps early, on time or late.

This patch is documentation only. No production code, tests, formulas, session schema, persistence behavior, cloud behavior, UI, routes, navigation, SEO, authentication, Party Orders or deployment configuration were changed.

Audited branch: `patch/414a-kitchen-dough-process-audit`

Audited starting commit: `fb0b79eb` (`Patch 413: Hide mobile Kitchen secondary controls`)

Audit date: July 15, 2026

Active Pizza Session schema version: `PIZZA_SESSION_SCHEMA_VERSION = 1`

Primary finding: the current system has the right stored objects for planned timeline, step status and runtime progress, and cloud persistence preserves those objects. However, the current model does not fully enforce the intended biological runtime chain. It keeps a stable planned timeline and overlays some runtime display adjustments, but it does not persist a downstream rescheduled timeline that guarantees:

- Rest dough always starts from actual Mix completion.
- Fermentation starts immediately after the full Rest duration.
- Ball rest starts from actual Ball completion.
- The target-time policy is explicit when late completion makes all biological durations impossible.

The current system already has a partial runtime correction: `applyPizzaSessionStepRuntime(...)` can display the following passive wait step as ending after the previous active dough-work completion. This covers the immediate Mix -> Rest and Ball -> Ball rest display better than a purely fixed schedule. But that correction is intentionally display/runtime overlay only. It does not change `session.timeline.steps[].scheduledAt`, and it does not propagate the shifted passive wait into the next biological phase.

Therefore the safest implementation direction is a small, explicit hybrid rescheduling model: preserve the target as the anchor, preserve biologically critical durations, allow flexible operational tasks to absorb slack where possible, and show a clear late/conflict state when the target can no longer fit.

Required conclusion:

Hybrid rescheduling model required

## 2. Current Kitchen step model

Source inspected:

- `app/session/kitchen/page.tsx`
- `app/session/timeline/page.tsx`
- `lib/pizza-session-kitchen.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-timeline-display.ts`
- `lib/pizza-session-step-runtime.ts`
- `lib/pizza-session.ts`
- `lib/cloud-pizza-session-client.ts`
- `lib/cloud-pizza-sessions.ts`
- `app/api/pizza-sessions/active/route.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/pizza-session-timeline.test.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/pizza-session-scenario-qa.test.ts`

The stored Timeline model is:

| Object | Role |
| --- | --- |
| `PizzaSession.timeline.steps[]` | Planned step order, planned `scheduledAt`, status and copy. |
| `PizzaSession.timeline.anchorTime` | Stable `doughStartMode: "now"` anchor used to avoid rebasing when the user returns later. |
| `PizzaSession.stepRuntime[stepId].actualStartedAt` | Actual start timestamp, currently recorded for runtime dough-work steps. |
| `PizzaSession.stepRuntime[stepId].actualCompletedAt` | Actual completion timestamp, recorded when a Kitchen step is marked complete. |
| `PizzaSession.currentStep` | Coarse route phase such as `timeline`, `prep`, `bake`, `review`. |
| `PizzaSession.status` | Coarse status such as `planning`, `preparing`, `baking`, `reviewing`. |

Current generated timeline steps:

| Step id | Label | Kind | Planned source |
| --- | --- | --- | --- |
| `mix-dough` | Mix dough | active | Dough start basis from selected fermentation length, explicit later start, start-now anchor, or target offset fallback. |
| `rest-dough` | Rest dough | passive | Normally `mix-dough + 30 min` when scheduled from dough start. |
| `cold-ferment`, `room-ferment` or `ferment-dough` | Fermentation | passive | Normally `mix-dough + 60 min` when scheduled from dough start. |
| `ball-dough` | Ball dough | active | Target offset, currently about 4 hours before target. |
| `room-temperature-rest` | Room temperature rest / final room rest | passive | Target offset, currently about 3 hours before target. |
| `preheat-oven` | Preheat oven | active | Oven bake profile, e.g. 60 minutes for pizza oven and 75 minutes for home oven. |
| `prepare-sauce-toppings` | Prepare sauce and toppings | active | Target offset, currently 45 minutes before target. |
| `bake-pizza` | Bake pizza | active | Target-adjacent, currently rounded near target and profile-aware in tests. |
| `review-result` | Review result | active | Post-target note step, excluded from normal Kitchen current-step selection. |

Kitchen current-step selection:

- `getKitchenModeState(session)` reads the stored timeline.
- It passes timeline steps through `timelineStepsForPlanningSummaryDisplay(...)`.
- It then applies `applyPizzaSessionStepRuntime(...)`.
- It selects the first `todo` step whose id is not `review-result`.
- `nextTodoAfter(...)` returns the next later `todo` step after the current step.

Runtime dough-work steps:

- `isRuntimeDoughWorkStep(...)` returns true only for active `mix-dough` and `ball-dough`.
- Kitchen records explicit starts for those work steps through `startPizzaSessionTimelineStep(...)`.
- Any completed step receives `actualCompletedAt` through `runtimeMapWithStepCompletion(...)`.

The important implementation detail is that runtime shifts are display overlays, not stored timeline mutations.

## 3. Intended dough-process model

The intended biological flow is:

```txt
Mix dough
-> mandatory covered rest
-> planned fermentation
-> Ball dough
-> planned ball rest / warm proof
-> Preheat and prepare sauce/toppings
-> Bake pizza
-> Review
```

The intended model distinguishes:

| Concept | Meaning |
| --- | --- |
| Planned schedule | The initial target-based plan before real user execution. |
| Actual user completion | The moment the user marks a task complete in Kitchen. |
| Biologically required duration | Time the dough must actually receive, not merely a planned timestamp. |
| Flexible preparation task | A task whose timing can move without changing dough biology. |
| Target pizza time | The user's intended eating/baking target, which should remain the anchor unless product explicitly chooses to move it. |
| Persistence contract | Local and cloud objects that must restore the same current step and runtime state. |

The user requirement is not to force the user to wait through active work windows. The user should complete Mix or Ball early if the work is actually done. The biologically passive duration after that completion must then be honored.

## 4. Duration matrix

| Step | Intended duration | Current planned duration | Actual-start rule | Actual-completion rule | Can shift? | Biologically critical? |
| --- | --- | --- | --- | --- | --- | --- |
| Mix dough | Up to 30 min reserved; user may finish earlier | Often the 30-minute window before Rest in generated dough-start schedules | `actualStartedAt` recorded only if user presses start for `mix-dough` or mark-done starts it first | `actualCompletedAt` recorded when marked complete | Yes, active work may finish early/late | Yes |
| Rest dough | Exactly 30 min after Mix completion | Usually Rest planned at `mix + 30`; fermentation planned at `mix + 60`, so the planned Rest-to-ferment gap is 30 min | Runtime overlay can set `runtimeStartsAt` to Mix completion | Runtime overlay sets displayed Rest end to Mix completion plus the planned gap to the next step | Yes, must start from actual Mix completion | Yes |
| Fermentation | Session plan, e.g. 10h, 24h, 48h | Dough-start basis comes from `plannedFermentationHours` or continuous yeast; fermentation step is usually `mix + 60` | No persisted actual start field separate from status/runtime | User may mark fermentation step complete; early guard is based on displayed `scheduledAt` | Should preserve planned duration; may need conflict state if late | Yes |
| Ball dough | Planned working window | Target offset, currently about 4h before target | `actualStartedAt` recorded for `ball-dough` | `actualCompletedAt` recorded when marked complete | Yes, active work may finish early/late | Yes |
| Ball rest / warm proof | Session/plan final proof or warm rest | Target offset, currently about 3h before target | Runtime overlay can set start to Ball completion | Runtime overlay can set displayed end from Ball completion plus planned gap to next step | Yes, must start from actual Ball completion | Yes |
| Preheat oven | Oven profile | `getPizzaSessionBakeProfileForSession(...)`, tests expect home 75 min and pizza oven 60 min before target | No special runtime start currently | Completion records runtime/status | Flexible, within readiness | Medium |
| Sauce/toppings | Flexible task window | 45 min before target | No special runtime start currently | Completion records runtime/status | Flexible | Low |
| Bake pizza | Per-pizza timer aid; user completes phase after all pizzas | Target-adjacent, profile-aware; optional timer duration comes from bake profile | `bake-pizza` is not a runtime dough-work start step; optional bake timer is separate local UI state | Completion records runtime/status, clears bake timer state, moves to review | Operational | Operational |
| Review | No fixed duration | `review-result` is post-target but excluded as a Kitchen current step | N/A | User finishes Review explicitly on review route | N/A | No |

## 5. Transition matrix

| Transition | Current source | Uses actual completion? | Uses fixed scheduled time? | Should it shift? |
| --- | --- | --- | --- | --- |
| Mix -> Rest | `applyPizzaSessionStepRuntime(...)` can display Rest using Mix `actualCompletedAt`; stored timeline is unchanged | Partially, display/runtime only | Stored timeline still has original Rest `scheduledAt` | Yes, Rest should begin at actual Mix completion |
| Rest -> Fermentation | Fermentation remains its planned/display timeline step; runtime overlay does not use passive Rest completion as a source | No | Yes, primarily fixed planned/display time | Yes, fermentation should begin after the full Rest duration |
| Fermentation -> Ball | Ball remains target-offset planned step | No actual fermentation-start/end propagation beyond status and optional early guard | Yes | Prefer preserve planned fermentation duration; if target cannot fit, show conflict rather than silently shorten |
| Ball -> Ball rest | `applyPizzaSessionStepRuntime(...)` can display following passive step from Ball `actualCompletedAt`; stored timeline is unchanged | Partially, display/runtime only | Stored timeline still has original room-rest `scheduledAt` | Yes, Ball rest should begin at actual Ball completion |
| Ball rest -> Preheat/prep | Preheat and prep remain target-offset tasks | No | Yes | Flexible operational tasks may shift or overlap, but should not consume required proof time silently |
| Preheat/prep -> Bake | Bake remains target-adjacent; readiness depends on user confirmation | No strict dependency except ordered statuses | Yes | Flexible readiness is acceptable, but baking should not start before required preceding tasks are complete |
| Bake -> Review | `completeKitchenTimelineStep(...)` marks Bake done; next step is `review-result`, which maps to Review/completion UI | Yes, explicit user completion | No meaningful fixed wait | Explicit completion is correct |

## 6. Mix early/on-time/late findings

### Scenario A: Mix completed early

Example:

```txt
Mix starts: 15:26
Planned Mix window ends / Rest due: 15:56
User completes Mix: 15:46
Expected Rest: 15:46-16:16
Expected Fermentation begins: 16:16
```

Current behavior:

- Completion stores `stepRuntime["mix-dough"].actualCompletedAt = 15:46`.
- `applyPizzaSessionStepRuntime(...)` can display the current Rest step as ending at `15:46 + planned Rest duration`.
- In normal generated dough-start schedules, planned Rest duration is inferred from the gap between Rest and Fermentation, usually 30 minutes, so Rest displays as ending at 16:16.
- The stored `session.timeline.steps[].scheduledAt` values are not changed.
- The following fermentation step remains on its planned/display timeline time rather than being explicitly chained to the runtime Rest completion.

Finding: early Mix completion is partially handled for the immediate Rest display, but not as a persisted downstream biological chain.

### Scenario B: Mix completed on time

Example:

```txt
Mix complete: 15:56
Expected Rest: 15:56-16:26
Expected Fermentation begins: 16:26
```

Current behavior:

- Runtime overlay displays Rest ending after the inferred planned Rest duration.
- If the generated plan already has Rest and Fermentation spaced from the same dough-start basis, the visible Rest end normally aligns with the intended 30 minutes.
- Fermentation remains independently planned.

Finding: on-time behavior is usually close, but only because planned schedule and runtime completion happen to align.

### Scenario C: Mix completed late

Example:

```txt
Mix planned complete: 15:56
Mix actual complete: 16:10
Expected Rest: 16:10-16:40
```

Current behavior:

- Runtime overlay can display Rest ending at 16:40.
- The fermentation step remains anchored to the planned schedule.
- There is no explicit product-level conflict model that says whether the target remains fixed, flexible tasks compress, or fermentation/proofing is now late.

Finding: late Mix completion reveals the largest product-policy gap. The system should not silently shorten required fermentation or create ambiguous wait states. It needs an explicit hybrid schedule/conflict rule.

## 7. Mandatory Rest findings

The current runtime helper has the core piece needed for mandatory Rest:

- `getRuntimeDependentWaitDurationMinutes(steps, "rest-dough")` infers a passive wait duration from the current step's `scheduledAt` to the next step's `scheduledAt`.
- If the previous step has an `actualCompletedAt` and the previous step is a runtime dough-work step, `applyPizzaSessionStepRuntime(...)` returns a runtime version of the passive wait step with:
  - `plannedScheduledAt`
  - `runtimeStartsAt`
  - `runtimeEndsAt`
  - shifted `scheduledAt = runtimeEndsAt`

The tests explicitly protect this behavior:

- `tests/pizza-session-kitchen.test.ts` includes `uses actual work completion to run the following rest for its full planned duration without changing the stored schedule`.
- `tests/pizza-session-timeline.test.ts` includes `preserves step runtime timestamps separately from the planned timeline schedule`.

However, this is not a complete Rest contract:

- The stored schedule remains unchanged by design.
- The current duration is inferred from adjacent planned steps, not from an explicit Rest constant.
- The following fermentation step is not recalculated from the Rest runtime end.
- The early-completion guard is based on the current step's displayed `scheduledAt`, which is useful but does not create a durable downstream biological timeline.

Conclusion for Rest: mandatory Rest is partially represented in runtime display, but the durable model should encode or derive it as a biological dependency, not only as a local display overlay.

## 8. Fermentation-duration findings

Timeline generation already uses the selected fermentation duration as a dough-start basis:

- `effectiveFermentationHoursForTimeline(...)` reads continuous yeast selected fermentation hours when available.
- It falls back to `session.plannedFermentationHours`.
- `selectedFermentationStartForSession(...)` computes `target - effective.hours`.
- `scheduleStepsFromDoughStart(...)` schedules:
  - Mix at selected dough start.
  - Rest at selected dough start + 30 minutes.
  - Fermentation at selected dough start + 60 minutes.

Tests protect this planning behavior:

- Selected fermentation lengths such as 10h, 24h, 26.3h and 48h move the generated Mix basis.
- Under-24h room fermentation does not force the timeline to 24h.
- Same-day room, 24h cold, 40h cold, 72h cold and later-start QA scenarios exist in `tests/pizza-session-scenario-qa.test.ts`.

But the current runtime chain does not prove that the dough actually receives the selected fermentation duration after real Mix and Rest completion:

- The selected fermentation duration is used to choose the initial dough-start basis.
- Runtime completion can shift Rest display.
- Runtime completion does not propagate Rest end into a persisted fermentation start.
- Ball timing remains a target offset, not a duration-from-actual-fermentation-start result.

Important acceptance question:

If the plan says 10 hours of fermentation, the initial planned timeline is built from that 10-hour basis. But after early or late real Kitchen completions, the current persisted model does not guarantee that the actual biological fermentation remains approximately 10 hours. It needs either a durable runtime-derived schedule or an explicit conflict/late model.

## 9. Cold-fermentation findings

Cold fermentation is represented by:

- `cold-ferment` step id after fermentation-mode normalization.
- Cold-specific copy from `coldFermentationCopy(...)`.
- Kitchen copy from `coldFermentationPresentation`.
- Guidance selected by `resolveKitchenFermentationMode(...)`.

Planning support is solid for current generated schedules:

- `recipeSnapshot.fermentation` ending in `-cold` resolves as cold.
- `plannedFermentationHours` is treated as cold if no stronger continuous-yeast source exists.
- Cold plans keep fridge-specific copy after stale room-copy normalization.
- Longer cold fermentation display is protected by tests.

Biological integrity gap:

- Cold fermentation duration is planned from target/dough-start basis.
- It is not recalculated from actual Rest completion.
- There is no explicit evidence that late Mix/Rest completion preserves cold fermentation duration instead of compressing the cold phase, delaying target, or showing conflict.

Cold-specific risk:

- Cold fermentation can tolerate schedule flexibility better than same-day dough in practical terms, but the selected yeast and flour guidance may depend on the original duration. If actual runtime shortens or extends the cold phase materially, the UI should acknowledge the difference.

## 10. Room-fermentation findings

Room fermentation is represented by:

- `room-ferment` step id after mode normalization.
- Room-specific copy from `roomFermentationCopy(...)`.
- Same-day display scheduling from `sameDayScheduleIso(...)`.
- Kitchen guidance aligned through `resolveKitchenFermentationMode(...)`.

Planning support:

- Under-24h room fermentation is explicitly tested.
- Same-day room planning uses available time and keeps `bake-pizza` at the target.
- `doughStartMode: "now"` stores an `anchorTime` so returning to Timeline does not rebase the session after Kitchen/Back.

Biological integrity gap:

- Same-day room plans have less slack. If Mix or Rest completes late, preserving the fermentation duration may conflict with the fixed target.
- Current code keeps target-oriented planned steps stable and applies only partial runtime overlay to the next passive step.
- There is no durable conflict state that says "the dough is now short on fermentation time" or "target should move."

Room-specific risk:

- Room fermentation is biologically faster and less forgiving than a long cold phase. Silent compression is more risky here than in a long cold workflow.

## 11. Balling and ball-rest findings

Current Ball model:

- `ball-dough` is an active runtime dough-work step.
- `startPizzaSessionTimelineStep(...)` can record actual Ball start.
- `completeKitchenTimelineStep(...)` records actual Ball completion.
- `room-temperature-rest` follows Ball in the timeline.
- `applyPizzaSessionStepRuntime(...)` can shift the following passive step from actual Ball completion because Ball is included in `DOUGH_WORK_STEP_IDS`.

This is structurally similar to Mix -> Rest and is a good foundation.

Current gaps:

- Ball rest duration is inferred from the planned gap between `room-temperature-rest` and the next scheduled step.
- The persisted timeline does not change.
- Preheat, topping preparation and Bake remain target-offset steps.
- There is no explicit conflict state if late Ball completion consumes the final proof/warm-up window.

Cold-fermentation importance:

- `room-temperature-rest` is especially important after cold fermentation. The current UI correctly describes it as "Cold dough is harder to open" and "Let the dough balls warm and relax while still covered."
- The duration should be protected as a biological phase, not merely displayed as an offset before the target.

Room-only plans:

- The same route uses `Final room rest` copy for room/same-day flows.
- The simpler room flow still benefits from a distinct final relaxation period before opening.

## 12. Preheat and preparation flexibility

Preheat:

- `preheat-oven` duration is profile-aware.
- Tests expect home oven preheat at 75 minutes before target and pizza oven preheat at 60 minutes before target.
- Kitchen copy uses bake-profile-specific instructions.
- Completion is explicit.

Prepare sauce and toppings:

- `prepare-sauce-toppings` remains an ordered active service task.
- It is not part of the dough biology, but it must be done before baking starts.
- Kitchen exposes a topping-balance link only for this step.

Current flexibility:

- Both steps are target-offset operational tasks.
- They do not shorten dough biology directly.
- In a future hybrid model, these are the best candidates to absorb slack or overlap with passive waits before changing biological durations or target time.

## 13. Bake and Review flow

Bake:

- `bake-pizza` is an active service step.
- Patch 400 added optional bake timer support through `KitchenBakeTimerPanel`.
- Timer duration comes from the bake profile.
- `kitchen-bake-timer` tests verify the timer is local UI state and does not mutate `stepRuntime` or cloud progress.
- Completing the bake step is still explicit through Kitchen's primary action.
- `completeCurrentStep(...)` clears bake timer state when `currentStep.id === "bake-pizza"`.

Review:

- `review-result` is present in the timeline but excluded from Kitchen current-step selection.
- Once `bake-pizza` is done, `currentStepForTimelineStep(review-result)` returns `review`, and `statusForTimelineStep(review-result)` returns `reviewing`.
- The normal Kitchen page then presents the completion/review state instead of treating `review-result` as another Kitchen task.

Finding: Bake -> Review is correctly explicit and does not depend on the optional timer auto-completing the phase.

## 14. UI timing semantics

Current Kitchen timing has mixed semantics:

- Active dough-work steps use `actualStartedAt` to show elapsed timing after the user starts the step.
- Passive steps use `scheduledAt` as the time before the user should complete/confirm the step.
- `getKitchenStepWaitInfo(...)` treats any future `scheduledAt` as too early.
- `shouldConfirmEarlyKitchenStepCompletion(...)` triggers an early-confirmation state when the user tries to mark a future step done.

This works practically, but it is semantically overloaded:

- For active tasks, `scheduledAt` means "planned start/action time."
- For passive waits after runtime overlay, `scheduledAt` becomes "runtime end/readiness time."
- For fermentation, `scheduledAt` can read as a start time in copy but behave as a completion gate in Kitchen.

Recommended semantic clarification:

| Step | User-facing timing should mean |
| --- | --- |
| Mix dough | Work window/reserved time; user may finish when mixed. |
| Rest dough | Countdown to Rest complete, starting from actual Mix completion. |
| Fermentation | Remaining fermentation/proof time or next handling time, based on explicit model. |
| Ball dough | Work window/reserved time; user may finish when balls are formed. |
| Ball rest | Countdown to balls ready, starting from actual Ball completion. |
| Preheat | Oven readiness target, with user confirmation. |
| Sauce/toppings | Operational checklist readiness. |
| Bake | Optional timer plus explicit "all pizzas baked" confirmation. |

## 15. Button-label recommendations

Current labels:

- `mix-dough` start: `Start mixing now`
- `mix-dough` completion: `Mark mixing complete ->`
- `ball-dough` start: `Start balling now`
- `ball-dough` completion: `Mark balling complete ->`
- other steps: `Mark step as done ->`

Recommended future labels:

| Step | Recommended primary action |
| --- | --- |
| Mix dough, not started | `Start mixing now` |
| Mix dough, started | `Mixing complete` or keep `Mark mixing complete` |
| Rest dough, waiting | Disabled/readiness state or explicit `Wait until rest is complete` |
| Rest dough, ready | `Rest complete` |
| Fermentation, waiting | Disabled/readiness state or explicit remaining fermentation |
| Fermentation, ready | `Fermentation complete` |
| Ball dough, not started | `Start balling now` |
| Ball dough, started | `Balling complete` or keep `Mark balling complete` |
| Ball rest, waiting | Disabled/readiness state or explicit remaining proof |
| Ball rest, ready | `Ball rest complete` |
| Preheat oven | `Oven preheated` |
| Prepare sauce and toppings | `Sauce and toppings ready` |
| Bake pizza | `All pizzas baked` or `Baking complete` |

Recommendation:

- Waiting/passive phases should not invite early completion as a normal action.
- If early completion remains possible, it should stay guarded and should clearly explain the trade-off.
- Active work can finish early.
- Bake should communicate that the phase ends when all pizzas are baked, not when a timer ends.

## 16. Persistence and cloud trace

Local persistence:

- `completeKitchenTimelineStep(...)` updates:
  - `timeline.steps[].status`
  - `stepRuntime[stepId].actualStartedAt`
  - `stepRuntime[stepId].actualCompletedAt`
  - `currentStep`
  - `status`
  - `updatedAt`
  - `lastSavedAt`
- `startPizzaSessionTimelineStep(...)` updates `stepRuntime[stepId].actualStartedAt`.
- Both are stored through `updatePizzaSession(...)`.

Cloud persistence:

- `CloudPizzaSessionSync` watches session identity, `currentStep`, `status`, `updatedAt` and `lastSavedAt`.
- Kitchen explicitly calls `queueKitchenProgressSync(updated)` after start, completion and menu changes.
- `queueCloudActivePizzaSessionSave(...)` selects the latest local active session by `updatedAt` before syncing.
- `cloudPizzaSessionPayload(session)` sends the full `session_data: session`.
- `app/api/pizza-sessions/active/route.ts` stores `session_data` after `migratePizzaSession(...)` validation.
- `normalizeCloudPizzaSessionRow(...)` restores the full migrated session.

Tests:

- `tests/cloud-pizza-sessions.test.ts` verifies Kitchen progress serializes into cloud rows and local restore.
- It also protects newest-Kitchen-progress-wins behavior during Back-navigation stale snapshots.
- `tests/pizza-session-shopping-list.test.ts` verifies Shopping updates preserve timeline and `stepRuntime`.

Persistence conclusion:

- Current local and cloud contracts preserve the available objects.
- The gap is not that `stepRuntime` is lost.
- The gap is that current persisted objects do not encode a complete runtime-derived biological schedule.

## 17. Test gaps

Existing useful tests:

- Timeline generation from selected fermentation hours.
- Room and cold fermentation display modes.
- Stable start-now anchor after Kitchen/Back.
- Runtime timestamps separate from planned timeline.
- Following passive wait display derived from previous dough-work completion.
- Kitchen step completion status and currentStep transitions.
- Cloud serialization and restore of `timeline` and `stepRuntime`.
- Back-navigation stale snapshot protection.
- Optional bake timer isolation from `stepRuntime`.

Gaps:

| Missing test | Why it matters |
| --- | --- |
| Mix completed early -> Rest exactly 30 min -> Fermentation begins immediately after Rest | This is the user's primary biological contract. |
| Mix completed late with fixed target | Need prove whether flexible tasks compress, target moves, or conflict appears. |
| Rest completion propagates into fermentation timing | Current runtime overlay does not cover passive-to-passive or passive-to-fermentation chaining. |
| 10h room fermentation effective actual duration after real Mix/Rest | The initial planned duration may not equal actual runtime duration. |
| 24h/48h cold effective actual duration after real Mix/Rest | Long plans need proof that runtime variance is handled honestly. |
| Ball completed early/late -> Ball rest duration preserved | Current Ball overlay is partial, similar to Mix. |
| Late Ball completion before Bake | Need conflict/readiness behavior for final proof. |
| Passive waiting phase cannot be silently marked complete too early | Current early guard exists, but biological consequence tests are not end-to-end. |
| Cloud restore reproduces runtime-derived biological schedule | Cloud preserves current fields, but no durable derived schedule exists to compare. |
| Button labels by step semantics | Current generic labels work but do not fully communicate phase meaning. |

## 18. Root-cause conclusion

The root cause is a model mismatch, not a lost persistence field.

Current implementation intentionally separates:

- stable planned `timeline.steps[].scheduledAt`
- actual runtime `stepRuntime`
- display-only runtime adjustment through `applyPizzaSessionStepRuntime(...)`

That separation was useful for avoiding dangerous rebases after Back navigation and for preserving cloud snapshots. But the biological process now needs a stronger runtime contract:

- Some active work may finish earlier or later.
- The next passive dough phase must be measured from actual completion.
- The following biological phase must start after the passive phase has actually completed.
- Selected fermentation/proof durations must remain approximately intact, or the product must clearly show the user that the target plan is now infeasible.

Current logic is not "wrong" for a stable planned timeline, and it has a good partial runtime overlay. It is incomplete for the stricter biological Kitchen contract described in this audit.

Required conclusion:

Hybrid rescheduling model required

## 19. Recommended implementation scope

Recommended Patch 414B scope:

1. Define a narrow Kitchen runtime scheduling contract.
   - Keep `targetEatTime` as the anchor.
   - Treat Mix and Ball as active work that may complete early/late.
   - Treat Rest and Ball rest as fixed runtime-dependent passive waits.
   - Preserve selected fermentation duration whenever possible.
   - Let preheat and topping prep remain flexible operational tasks.
   - Show explicit late/conflict state when the target cannot fit.

2. Add behavior tests before implementation.
   - Mix early/on-time/late.
   - Rest exactly 30 minutes from actual Mix completion.
   - Fermentation starts after Rest and preserves selected duration.
   - Cold and room workflows.
   - Ball -> Ball rest from actual Ball completion.
   - Bake -> Review explicit completion.
   - Cloud restore of the resulting state.

3. Avoid schema migration unless a durable new field is truly required.
   - First evaluate whether runtime-derived schedule can be computed deterministically from existing `timeline` and `stepRuntime`.
   - If not, propose a schema-versioned change separately.

4. Keep UI changes narrow.
   - Clarify button labels and waiting semantics only where needed.
   - Do not redesign Kitchen.
   - Do not change calculations.
   - Do not change recipe quantities.
   - Do not change optional bake timer behavior.

Protected invariants for the implementation patch:

- No formula changes.
- No dough or sauce quantity changes.
- No Pizza Session creation changes.
- No cloud-auth contract changes.
- No Party Order changes.
- No SEO or navigation changes.
- Existing Back-navigation stale-state protections remain intact.
- Existing cloud queue behavior remains intact.

Final audit conclusion:

Hybrid rescheduling model required
