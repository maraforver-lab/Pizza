# Patch 441: Bake Timer overtime stability

## 1. Previous 10-second pulse cap

Patch 440 intentionally limited the strong expiry pulse to the first 10 seconds of overtime. Product review showed that this made the timer feel like it had calmed down while the pizza was still beyond the target bake time.

Patch 441 removes that visual cap. Overtime urgency now continues for the active overtime alarm period instead of depending on the current overtime second.

## 2. Continuous overtime visual contract

The full-screen Bake Timer now separates two concepts:

- overtime display: the timer is at or beyond zero and shows `TIME'S UP`.
- overtime alarm activity: the urgent pulse and recurring alarm are still active.

While the alarm is active, the overtime ring and surface keep a controlled one-second pulse. The pulse stops when the user stops the alarm, starts the next pizza, resets the timer, closes the timer, or otherwise leaves active overtime.

The pulse remains a ring/surface emphasis, not a full-screen strobe.

## 3. Flame icon behavior

Overtime now shows a flame icon above the `TIME'S UP` status. It uses the existing `DoughToolsIcon` system and the existing `flame` icon mapping.

The icon carries the accessible label `Pizza still baking`, because it reinforces the state that the pizza is still in the oven after the target time.

## 4. Overtime alarm state model

The timer snapshot now includes a local-only overtime alarm state:

- `inactive`
- `active`
- `stopped`

This state belongs to the Bake Timer runtime snapshot only. It does not change `PizzaSession`, Timeline, Kitchen progress, session schema, cloud payloads, or database rows.

## 5. `-30 sec` root cause and correction

The previous implementation derived overtime sound cues from the current overtime second. Pressing `-30 sec` cleared sound milestones and rewrote the overtime timestamp. If the resulting second did not immediately match the old cue cadence, the alarm could appear to stop until another eligible second arrived.

Patch 441 moves recurring overtime alarm playback into one explicit loop tied to `overtimeAlarmState === "active"`. The `-30 sec` control now:

- remains in overtime when the adjusted overtime value is still above zero.
- keeps the alarm active when it remains in overtime.
- transitions back to countdown when subtraction crosses below zero.
- stops the overtime alarm when returning to countdown.
- preserves the sound-enabled preference.

`Start next pizza` clears the active alarm and starts the next per-pizza timer from the canonical oven-profile default. This keeps the next pizza anchored to the selected oven profile rather than a temporary emergency adjustment made during overtime.

## 6. Sound-toggle behavior

Sound remains user-controlled.

When sound is turned off during overtime, all active audio is stopped immediately and the visual urgency remains. When sound is turned back on during active overtime, the recurring overtime alert restarts cleanly without waiting for a new phase transition.

## 7. Cleanup and duplicate prevention

The hook owns a single overtime alarm interval. Reset, close, stop alarm, start next pizza, unmount, pause, and sound-off all clear active audio and the interval.

Countdown cues still use milestone markers, and recurring overtime cues are no longer scheduled through the per-second countdown path. This prevents duplicate cue accumulation during React re-renders or repeated overtime adjustments.

## 8. Reduced-motion behavior

`prefers-reduced-motion: reduce` disables the pulsing and scaling animations. Static red overtime styling, the flame icon, `TIME'S UP`, `Take the pizza out`, and user-enabled sound remain available.

## 9. Test coverage

Focused tests cover:

- active overtime at normal and capped values.
- alarm state preservation through `-30 sec` and `+30 sec`.
- transition from overtime back to countdown.
- Stop alarm producing static stopped overtime.
- flame icon source.
- continuous pulse classes.
- reduced-motion CSS.
- local-only timer boundaries.

## 10. Protected invariants

Patch 441 does not change:

- pizza oven default 90 seconds.
- home oven default 300 seconds.
- final-ten cadence.
- final three-second emphasis.
- Kitchen completion.
- Review CTA.
- Timeline.
- PizzaSession schema.
- session or cloud persistence.
- oven profile calculations.
- Party Orders.
- auth or SEO.
