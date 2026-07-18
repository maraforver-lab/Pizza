# Patch 438: Full-screen Bake Timer

## Previous UX Problem

The Kitchen `Bake pizza` step rendered the bake timer as a large inline panel inside the normal Kitchen task flow. On mobile this made the page feel like a stack of competing cards instead of a focused cooking tool.

The Bake step also repeated schedule metadata near the current task, including planned time and next-step preview. Once the user is already viewing the Bake step, that block does not help the immediate cooking job.

## New Interaction Model

The normal Bake step now keeps the baking guidance visible and replaces the inline timer panel with a compact `Bake timer` launch card.

The launch card shows:

- the timer purpose,
- the oven-specific per-pizza timer duration,
- the canonical oven context,
- one primary action: `Open full-screen bake timer`.

Opening the launcher displays a modal timer surface. On mobile it fills the viewport with safe-area padding. On desktop it remains a large modal with a sensible max width rather than a phone-shaped mockup.

## Oven Duration Source Of Truth

The timer continues to use `getPizzaSessionBakeProfileForSession(session)` from the existing Pizza Session bake-profile logic.

- Pizza oven sessions use the existing pizza-oven profile, with a 90 second timer default.
- Home oven sessions use the existing home-oven profile, with a 5 minute timer default.

No second bake-duration calculation was added.

## Timer State Model

The shared timer core now exposes explicit display phases:

- `ready`
- `active`
- `last20`
- `paused`
- `overtime`
- `expired`

The timer is derived from timestamps rather than only decrementing an interval. This keeps it stable when rendering is delayed, the tab is throttled, or the browser resumes after a short interruption.

The user can adjust the selected duration by 10 seconds while ready, running or paused. Overtime can be adjusted in 30 second increments where safe.

## Sound And Overtime Behavior

Sound is user-controlled inside the full-screen timer and defaults on unless a local browser preference says otherwise.

Sound behavior:

- normal running state can cue every 10 seconds,
- the last 20 seconds use a clearer cue,
- zero emits an expiry cue,
- overtime can cue every 5 seconds,
- muting, reset, alarm stop, close and unmount stop further audio.

Overtime counts upward after zero and caps at `+01:30`. The timer does not run overtime indefinitely.

## Accessibility Decisions

The full-screen timer uses an accessible modal dialog with:

- `role="dialog"`,
- `aria-modal="true"`,
- a dialog name and description,
- Escape close support,
- focus moved into the dialog on open,
- focus returned on close,
- a basic keyboard focus trap while open.

The timer does not announce every second. The live region is reserved for meaningful phase changes such as start, last-20-seconds, pause, overtime and alarm stopped.

## Reduced Motion Behavior

No aggressive animation or flashing was added. The progress ring is a static conic visual derived from the current timer state. The timer remains usable without animation.

## Local-only Versus Persisted State

Runtime timer state remains local to the current device.

The timer does not:

- change Kitchen progress,
- change `scheduledAt`,
- change Timeline anchors,
- mark the Bake step complete,
- write session or cloud state every second.

The timer is guidance, not an automatic doneness guarantee. Visual pizza cues remain authoritative.

## Files Changed

- `app/session/kitchen/page.tsx`
- `components/icons/icon-map.ts`
- `components/session/KitchenBakeTimerPanel.tsx`
- `lib/bake-timer.ts`
- `lib/use-bake-timer.ts`
- `tests/kitchen-bake-timer.test.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/session-flow-navigation.test.ts`
- `docs/audits/patch-438-full-screen-bake-timer.md`

## Tests Added Or Updated

Focused coverage now checks:

- timestamp-derived timer phases,
- last-20-second phase,
- overtime display and cap,
- duration adjustment,
- overtime adjustment,
- alarm stop state,
- canonical oven bake-profile durations,
- full-screen dialog source structure,
- local-only separation from Kitchen progress and cloud sync,
- Bake step CTA copy: `Done baking? Review session`,
- Bake-specific removal of the redundant `Starts/Planned/Next` status block.

## Validation Notes

Automated source and behavior tests cover the timer state model and Kitchen integration.

Manual browser validation was attempted against the local production build, but the Browser tool blocked the local test-session fixture injection through its URL security policy. That browser path was not bypassed. The remaining validation for this patch is therefore automated tests, lint, production build and source-level responsive/accessibility checks.

## Deferred Functionality

The patch does not add per-pizza cloud progress, automatic Bake-step completion, new oven settings, or new schedule persistence. Those would require separate product decisions.
