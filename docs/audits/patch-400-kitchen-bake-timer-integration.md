# Patch 400: Kitchen Bake Timer Integration

## Executive summary

Patch 400 adds an optional bake timer to Kitchen Mode for the `bake-pizza` step only. The timer is a local execution aid: it does not complete Kitchen steps, write `PizzaSession` state, queue cloud sync, alter `stepRuntime`, or change timeline generation.

The standalone `/timer` route remains available. It now shares the timer clock formatting, duration bounds and timer status type with the Kitchen timer core, while keeping its existing inspection-light and standalone utility behavior.

## Starting point

- Branch: `patch/400-kitchen-bake-timer`
- Starting master commit: `8b57f63d6f1ed1219c0f983d2a9d9873e50bada1`
- Source audit inputs: Patch 399 utility audit, Patch 398 Kitchen density polish, Patch 397B execution panel, Patch 395 Kitchen cloud persistence, Patch 396 Back-navigation sync protection.
- Deployment: none.

## Scope

Changed production scope is limited to:

- shared bake timer state and display helpers;
- a Kitchen-only optional timer panel rendered only for `bake-pizza`;
- a small standalone `/timer` reuse of shared timer formatting and duration normalization.

No changes were made to calculations, Pizza Session schema, persistence contracts, auth, Party Orders, SEO, navigation or route behavior.

## Shared timer core

Added `lib/bake-timer.ts` for deterministic timer state helpers:

- `BakeTimerStatus`
- `BakeTimerSnapshot`
- duration normalization with 10 second minimum and 30 minute maximum
- start, pause, resume, reset and derived countdown/overtime state
- clock display formatting

Added `lib/use-bake-timer.ts` for client runtime behavior:

- wall-clock countdown
- wake-lock request/release during active timing
- one completion sound/vibration cue
- local storage persistence when a storage key is provided
- no `PizzaSession`, cloud queue, `stepRuntime` or API dependencies

## Kitchen integration

Kitchen now renders `KitchenBakeTimerPanel` only when:

```ts
currentStep?.id === "bake-pizza"
```

The timer duration and label come from:

```ts
getPizzaSessionBakeProfileForSession(session)
```

This preserves the canonical bake-profile defaults:

- home oven: `300` seconds, `about 5 min`
- pizza oven: `90` seconds, `60–90 sec`

The panel is optional and closed by default for a fresh bake step. If a local timer is active and the user reloads or returns to Kitchen, the timer reopens to preserve the active local timing context.

## Local persistence

Kitchen timer state is stored under:

```txt
doughtools.kitchen-bake-timer.v1:<sessionId>
```

This storage contains only timer runtime state, not a `PizzaSession` object. It is cleared when the bake step is completed from Kitchen or when the user resets/stops the timer.

No migration or global cleanup was added.

## Completion behavior

The timer completion state is advisory only:

- sound/vibration can indicate that the timer reached zero;
- overtime can continue locally;
- the user must still inspect the pizza;
- the user must still press the existing Kitchen primary action to complete the `bake-pizza` step.

Timer actions do not call `queueCloudActivePizzaSessionSave`, `queueKitchenProgressSync`, `completeKitchenTimelineStep`, `startPizzaSessionTimelineStep` or `setSession`.

## Standalone Timer preservation

The standalone `/timer` route was not retired, redirected, noindexed or redesigned.

It continues to preserve:

- wake lock;
- audio cues;
- overtime;
- inspection light / screen light behavior;
- style-based defaults;
- footer rendering.

The only shared-core reuse in `/timer` is duration normalization, status typing and clock formatting.

## Accessibility

Kitchen timer controls use named buttons:

- `Open bake timer`
- `Start bake timer`
- `Pause timer`
- `Resume timer`
- `Start next pizza timer`
- `Reset`
- `Sound on` / `Sound off`
- `Close bake timer`

The timer value uses `aria-live="polite"`. Closing an active timer requires an explicit confirmation choice. The component does not replace the Kitchen primary action.

## Validation

Validation results:

- Focused tests: `npm run test -- tests/kitchen-bake-timer.test.ts tests/pizza-session-kitchen.test.ts tests/pizza-session-timeline.test.ts tests/cloud-pizza-sessions.test.ts tests/session-flow-navigation.test.ts tests/pizza-session.test.ts` passed, 6 files and 180 tests.
- Full suite: `npm run test` passed, 61 files and 1014 tests.
- Lint: `npm run lint` passed with no warnings.
- Build: `npm run build` passed.
- `git diff --check`: passed.
- Browser validation: passed with production build and local production server.

## Browser validation plan

Required viewports:

- `390 × 844`
- `430 × 740`
- `1280 × 900`
- `1440 × 950`

Required checks:

- timer absent before bake step;
- timer present on `bake-pizza`;
- home oven timer uses about five minutes;
- pizza oven timer uses 90 seconds / 60–90 sec context;
- timer start, pause, resume, reset and next-pizza restart;
- reload restores local active timer state;
- timer completion does not complete Kitchen;
- Kitchen completion still uses the normal primary action;
- no horizontal overflow, console errors or hydration errors.

Results:

- `390 × 844`: timer absent before bake; timer present on bake; open/start/pause/resume/reset; reload restored active local timer; schedule round-trip passed; no horizontal overflow.
- `430 × 740`: timer absent before bake; timer present on bake; open/start/pause/resume/reset; reload restored active local timer; schedule round-trip passed; no horizontal overflow.
- `1280 × 900`: timer absent before bake; timer present on bake; open/start/pause/resume/reset; reload restored active local timer; schedule round-trip passed; no horizontal overflow.
- `1440 × 950`: timer absent before bake; timer present on bake; open/start/pause/resume/reset; reload restored active local timer; schedule round-trip passed; no horizontal overflow.
- Home oven default: `05:00 per pizza`, `about 5 min`.
- Pizza oven default: `01:30 per pizza`, `60–90 sec`.
- Experience levels checked on the bake step: Beginner, Enthusiast and Pizza Nerd.
- Console/runtime issues: none observed in the CDP run.

## Protected invariants

Confirmed scope protections:

- no formula changes;
- no session schema changes;
- no cloud persistence contract changes;
- no active-session route changes;
- no Kitchen progress or `stepRuntime` changes;
- no Shopping status changes;
- no auth, account or Party Order changes;
- no SEO, sitemap or navigation changes;
- no deployment.
