# Patch 414B: Hybrid Kitchen step chaining

## Summary

Patch 414B implements the smallest runtime model required by Patch 414A.

The original planned Timeline remains canonical:

- `timeline.steps[].scheduledAt` is not rewritten by Kitchen runtime chaining.
- target time remains unchanged.
- plan-derived durations remain based on the original planned Timeline.

Kitchen now derives an effective execution schedule from the stored plan plus `stepRuntime`. This effective schedule is used for Kitchen readiness, countdowns and conflict messaging.

No dough formulas, recipe values, session creation flow, schema version, database schema, authentication, Party Orders, SEO, navigation or deployment configuration changed.

## Effective schedule rule

Implemented helper:

```ts
deriveEffectiveKitchenSchedule(steps, stepRuntime, targetAt)
```

The helper is pure and deterministic. It returns:

- effective `steps`
- optional target conflict metadata

Runtime chaining rules:

| Dependency | Effective rule |
| --- | --- |
| Mix -> Rest | Rest readiness is `mix-dough.actualCompletedAt + 30 min`. |
| Rest -> Fermentation | Fermentation readiness is `rest-dough.actualCompletedAt + original planned fermentation duration`. If Rest has not been completed but Mix has, the projected Rest end is used. |
| Fermentation -> Ball dough | Ball dough readiness follows Fermentation completion or projected fermentation readiness. |
| Ball dough -> Ball rest | Ball rest readiness is `ball-dough.actualCompletedAt + original planned ball-rest duration`, or the projected Ball work end if Ball has not been completed yet. |

Operational steps keep their planned anchors:

- `preheat-oven`
- `prepare-sauce-toppings`
- `bake-pizza`

These steps are not globally shifted by this patch.

## Persisted fields used

No new persisted field was added.

The effective schedule is reconstructed from existing persisted fields:

- `timeline.steps[].scheduledAt`
- `timeline.steps[].status`
- `timeline.targetEatTime`
- `targetEatTime`
- `targetBakeTime`
- `stepRuntime[stepId].actualStartedAt`
- `stepRuntime[stepId].actualCompletedAt`
- `updatedAt`
- `lastSavedAt`

Because no schema field was added, existing local persistence, cloud payload serialization and active-session restore continue to use the same data contract.

## Backward compatibility

Older sessions without runtime completion data fall back to the existing planned schedule.

The helper only derives biological runtime times when upstream completion data exists. For example:

- no Mix completion -> Rest keeps planned `scheduledAt`
- Mix completion present -> Rest readiness becomes Mix completion plus 30 minutes
- no Ball completion and no projected fermentation shift -> Ball rest keeps planned `scheduledAt`

This avoids changing old sessions merely because they are opened with newer code.

## Target conflict behavior

When biological readiness no longer fits before the original target, Kitchen now reports a compact late state.

The conflict keeps:

- original target time
- updated biological readiness time
- delay in minutes

It does not:

- shorten fermentation
- shorten ball rest
- rewrite the target
- rewrite the planned Timeline
- create a new scheduling interface

## UI semantics

Kitchen primary actions now use step-specific labels:

| Step | Action |
| --- | --- |
| Mix dough | `Mixing complete` |
| Rest dough | `Rest complete` |
| Fermentation | `Fermentation complete` |
| Ball dough | `Balling complete` |
| Ball rest | `Ball rest complete` |
| Preheat oven | `Oven preheated` |
| Prepare sauce and toppings | `Sauce and toppings ready` |
| Bake pizza | `All pizzas baked` |

Active work steps may still be completed by the user.

Biologically timed waiting phases are protected:

- Rest
- Fermentation
- Ball rest

If the required effective duration has not elapsed, the primary action is disabled and Kitchen shows the remaining wait state.

## Validation scenarios covered

Added or updated behavior tests for:

- Mix completed early and Rest starting from actual completion
- fixed 30-minute Rest
- older sessions without runtime data keeping planned schedule
- 10-hour room-fermentation segment preserved from effective Rest completion
- 24-hour cold-fermentation segment preserved from effective Rest completion
- warm ball rest starting from actual Ball completion
- target conflict reporting without biological compression
- cloud restore reconstructing effective countdown from existing fields
- optional bake timer remaining independent from Kitchen completion
- Back/Forward stale snapshot protections remaining intact
- home oven and pizza oven timing regression coverage

Validation run:

| Check | Result |
| --- | --- |
| Focused Kitchen, Timeline, cloud, timer, oven and navigation tests | Passed, 6 files / 173 tests |
| Full test suite | Passed, 62 files / 1020 tests |
| Lint | Passed |
| Production build | Passed |
| Browser 390 x 844, early Mix -> Rest countdown | Passed; `Rest complete` disabled until ready |
| Browser 430 x 740, late target conflict | Passed; conflict message visible and `Fermentation complete` disabled |
| Browser 1280 x 900, Ball rest | Passed; `Ball rest complete` disabled until ready |
| Horizontal overflow | None found in browser validation |
| Console/page errors | None found in browser validation |

## Known limitations

This patch deliberately avoids a broad timeline redesign.

Known limitations:

- The planned Timeline still displays the original plan; Kitchen derives the effective execution schedule.
- Operational steps are not globally shifted.
- If users need a full updated schedule view after a late biological phase, that should be a separate product patch.
- No per-pizza baked tracking was added.
- No schema migration was introduced.

## Protected invariants

Confirmed unchanged by scope:

- dough calculations
- sauce calculations
- recipe snapshot values
- shopping quantities
- Timeline generation contract
- optional bake timer behavior
- active-session cloud payload shape
- stale cloud overwrite protections
- session schema version
- auth
- account behavior
- Party Orders
- SEO
- deployment state
