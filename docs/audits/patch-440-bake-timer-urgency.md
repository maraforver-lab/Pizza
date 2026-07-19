# Patch 440: Bake Timer Urgency

## Summary

Patch 440 tightens the full-screen Bake Timer finish experience introduced in Patch 438.

The change removes the repeated bottom information card from every timer state and moves the experience toward one clear cooking surface: oven context, large timer, concise status, controls and close/sound controls.

No Kitchen progression, Pizza Session schema, Timeline, cloud persistence, oven-profile calculation, Review behavior, Party Orders, auth or SEO behavior was changed.

## Removed Information Cards

The full-screen timer no longer renders the bottom cards that repeated explanatory copy:

- normal `Tip` card,
- final-seconds `Last 20 seconds` card,
- overtime `Time's up` card,
- repeated `Runtime timer state is local...` explanation.

This applies to mobile and desktop. The local-only contract remains true, but it is no longer repeated inside the active cooking UI.

## Timer Phase Model

The shared timer helper now distinguishes:

- `ready`
- `active`
- `almost_there`
- `final_ten`
- `paused`
- `overtime`
- `expired`

The same helper-derived phase drives visual status and sound scheduling.

## Sound Cadence

Sound remains controlled by the existing sound toggle and local sound preference.

Implemented cadence:

- more than 20 seconds remaining: calm cue every 10 seconds,
- 20 to 11 seconds remaining: short cue every 5 seconds,
- at 10 seconds: distinct transition cue,
- 10 through 1 seconds: one cue per second,
- 3, 2 and 1 seconds: stronger higher-pitch cue,
- zero: three-tone expiry pattern,
- overtime: the same three-tone alarm pattern repeats every 5 seconds while the alarm is active.

Sound disabled means no cues or alarm. Turning sound off closes the active AudioContext so pending sound activity stops.

## Final-Ten Behavior

The final ten seconds show:

```text
FINAL 10 SECONDS
Watch the rim and bottom
```

Digits and ring use the urgent tomato treatment. The final three seconds use a slightly stronger pulse class without resizing surrounding controls.

## Expiry Alarm

At zero the display switches to overtime values such as `+00:01` and shows:

```text
TIME'S UP
Take the pizza out
```

The overtime cap remains `+01:30`. `Stop alarm` keeps the current alarm-stop behavior and removes the strong visual pulse.

## Visual Urgency

Visual progression:

- normal: existing DoughTools timer appearance,
- 20 to 11 seconds: warning ring treatment,
- final ten: tomato digits and controlled 1 Hz ring pulse,
- final three: slightly stronger 1 Hz pulse,
- first 10 seconds of overtime: controlled expiry pulse,
- after that: calmer persistent overtime state.

The pulse never exceeds one pulse per second and does not alternate full-screen white/red.

## Reduced Motion

`@media (prefers-reduced-motion: reduce)` disables the pulse animations while preserving static warning colors, labels and sound behavior when sound is enabled.

The timer remains understandable without motion or sound.

## Cleanup And Duplicate Prevention

Sound scheduling is centralized through the shared timer helper:

- cue derivation is deterministic,
- each cue-second uses a marker to prevent duplicate playback,
- pause closes audio and stops countdown cue scheduling,
- reset closes audio and clears pending markers,
- close pauses or stops alarm through the existing timer paths,
- sound off closes the active AudioContext,
- stop alarm cancels the alarm loop,
- React re-rendering does not create duplicate cue markers.

No external audio files were added.

## Local-only State Guarantee

Timer runtime state remains local to the current browser/device.

The timer does not:

- complete Kitchen automatically,
- change `scheduledAt`,
- change Timeline anchors,
- write Pizza Session or cloud state per timer tick,
- add a database migration.

Visual doneness remains authoritative; the timer is a cooking aid.

## Tests

Focused tests cover:

- deterministic phase transitions,
- final-ten phase,
- overtime cap,
- sound cue cadence,
- stronger final-three cues,
- three-tone expiry/overtime patterns,
- removed bottom cards,
- reduced-motion CSS protection,
- no Kitchen/cloud/session write imports in the timer hook or component,
- canonical pizza-oven and home-oven bake durations.

Browser validation covered the required mobile and desktop viewports for pizza oven and home oven.
