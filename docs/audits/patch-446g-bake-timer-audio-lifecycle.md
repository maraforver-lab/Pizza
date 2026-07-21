# Patch 446G: Bake Timer Audio Lifecycle

## Scope

Patch 446G stabilizes the shared Bake Timer audio lifecycle without changing sound themes, cue timing, timer duration, overtime rules, Admin UI, Account UI or Kitchen progression.

## Change

`lib/bake-timer-audio.ts` now treats audio playback as one small shared engine:

- one reusable `AudioContext`
- one tracked set of active scheduled sources
- safe resume for suspended contexts after user-driven playback
- deterministic cleanup for active tones and context resources
- safe no-op behavior when audio is muted, unsupported or interrupted

The Kitchen timer, standalone timer, Admin preview and Account preview all keep using the same helper.

## Cleanup Contract

Calling `closeBakeTimerAudioContext` now stops every active scheduled source before closing the context. Existing callers already invoke this cleanup when the alarm is stopped, the timer is reset, the timer is paused, the dialog closes, preview stops, route components unmount, or sound is muted.

## Fallback

The selected sound theme still resolves through the existing registry. If theme pattern lookup fails, playback falls back to Classic. Audio failures never block the visual timer.

## Regression Boundaries

Unchanged:

- sound-theme IDs
- cue timing
- final-ten cadence
- overtime interval
- runtime mute semantics
- saved Account preference semantics
- Admin and Account UI
- database, migrations and APIs
- Pizza Session and Kitchen completion state

## Tests

Patch 446G adds focused audio lifecycle tests covering:

- shared engine reuse
- suspended-context resume
- active-source cleanup
- fresh context creation after close
- muted behavior
- unsupported-audio fallback

