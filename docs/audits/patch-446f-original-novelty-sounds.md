# Patch 446F: Original Novelty Bake Timer Sounds

## Purpose

Patch 446F releases two previously deferred Bake Timer sound themes:

- `dark-commander`
- `robot-chef`

Both themes use application-owned Web Audio synthesis only. No audio files, external URLs, browser speech synthesis, voice recordings, copied media or protected franchise references are introduced.

## Dark Commander

Dark Commander is an original non-verbal sound profile built from deep mechanical pulses with restrained metallic resonance. It uses low-mid frequencies that remain audible on ordinary phone speakers without relying on excessive bass.

The final-ten and final-three cues are stronger than the normal periodic cue, while expiry and overtime use a bounded mechanical alert pattern. The theme intentionally avoids breathing effects, speech, famous quotations and recognizable movie or character sound design.

## Robot Chef

Robot Chef is an original non-verbal profile built from friendly robotic beeps. It uses concise square and triangle tones for periodic, final-ten, expiry and overtime cues.

The final-three cue escalates safely without piercing high frequencies. The profile avoids speech, known robot imitation, long comic sequences and external media.

## Shared Integration

Both themes are released through `lib/bake-timer-sound-themes.ts`, the canonical sound-theme registry. They define the same cue roles as the existing themes:

- `periodic`
- `final20`
- `final10`
- `final3`
- `expiry`
- `overtime`

Kitchen Bake Timer, standalone Bake Timer, Admin preview and Account preview continue to use the shared Web Audio helper. No theme-specific timer scheduler is added, and timer cadence is unchanged.

## Fallback

Classic remains the guaranteed fallback. Unknown, disabled or failed theme configuration still resolves through:

```text
user preference -> product default -> Classic
```

Runtime mute, Stop alarm, Start next pizza, Close and unmount cleanup keep the existing Patch 446E behavior.

## Database Migration

Patch 446B's published migration allowed only:

- `classic`
- `bell`
- `rooster`
- `halloween`

Patch 446F adds an additive migration:

```text
supabase/migrations/20260721140000_release_novelty_bake_timer_sound_themes.sql
```

The migration expands the Account preference and Admin sound-settings constraints to include `dark-commander` and `robot-chef`, inserts default enabled settings rows for both themes, and updates the safe read/admin RPC allowlists and ordering.

The migration is not applied by this patch.

## Originality Rules

The released novelty themes remain non-verbal and application-owned:

- no speech synthesis
- no voice cloning
- no copied audio
- no protected character names
- no protected franchise references
- no external audio assets or URLs

## Validation Coverage

Tests cover:

- released registry IDs
- empty deferred list
- complete cue profiles for both themes
- bounded gain, duration and frequency ranges
- protected-term and external-media absence
- migration constraint expansion
- Admin registry-order behavior
- Account registry-driven listing
- existing shared Timer/audio integration
