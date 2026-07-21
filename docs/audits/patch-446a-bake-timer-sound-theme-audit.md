# Patch 446A: Bake Timer sound-theme architecture audit

## 1. Executive summary

Patch 446A audited the current Bake Timer audio system and the safest future architecture for prebuilt sound themes.

The current timer has a strong foundation: timing, phases, countdown cues, final-ten behavior, overtime state, Stop alarm, local-only runtime state and Kitchen/standalone sharing are already centralized enough to support sound themes. The main gap is that actual sound rendering is still embedded in `lib/use-bake-timer.ts` through one hard-coded Web Audio sine-tone helper. Sound themes should not be added directly into React rendering or into the timer state machine.

Recommended direction:

- Add one canonical prebuilt sound-theme registry.
- Keep timing semantics in `lib/bake-timer.ts`.
- Extract a small shared sound engine that accepts a cue role and theme ID.
- Store admin configuration as canonical IDs only.
- Store signed-in user preference as one Account preference value.
- Keep runtime sound on/off separate from theme preference.
- Launch the first production set with four reliable non-spoken themes: Classic, Bell, Rooster and Halloween.
- Defer Dark Commander and Robot Chef to a later novelty patch unless they are implemented as original, non-identifying, bounded sounds with documented provenance.

No production code, migrations, settings, admin controls or audio assets were changed in this audit.

## 2. Current Bake Timer audio architecture

Inspected files:

- `lib/bake-timer.ts`
- `lib/use-bake-timer.ts`
- `components/session/KitchenBakeTimerPanel.tsx`
- `components/tools/StandaloneBakeTimerTool.tsx`
- `app/tools/bake-timer/page.tsx`
- `tests/kitchen-bake-timer.test.ts`
- `tests/standalone-bake-timer.test.ts`

The current core timing model is in `lib/bake-timer.ts`.

Important current types:

- `BakeTimerStatus`: `idle`, `running`, `paused`, `overtime`, `expired`
- `BakeTimerPhase`: `ready`, `active`, `almost_there`, `final_ten`, `paused`, `overtime`, `expired`
- `BakeTimerOvertimeAlarmState`: `inactive`, `active`, `stopped`
- `BakeTimerSoundCue`: `normal`, `almost_there`, `final_ten_transition`, `final_ten`, `final_three`, `expired`, `overtime`

The current cue pattern is hard-coded by `getBakeTimerSoundPattern(cue)` as sine tones:

- Normal periodic cue: one short tone.
- Almost-there cue: one slightly stronger tone.
- Final-ten transition: two tones.
- Final-ten: one sharper tone.
- Final-three: higher and stronger than final-ten.
- Expired and overtime: three-tone alert pattern.

The hook `useBakeTimer` creates and closes the `AudioContext`, plays cues, tracks milestone de-duplication, persists the runtime sound-enabled preference in browser localStorage and handles the recurring overtime alarm interval.

Kitchen and standalone use the same `BakeTimerPanel`, so visual and timer behavior are shared. Kitchen passes a storage key tied to the Pizza Session. Standalone passes no session storage key and does not touch session state.

## 3. Current audio lifecycle diagram

```text
User opens full-screen timer
-> user presses Start timer
-> useBakeTimer starts timestamp-based snapshot
-> update interval derives current timer snapshot every 250 ms
-> getBakeTimerSoundCues selects cue roles from status and remaining time
-> soundMilestones prevents duplicate countdown cues
-> playBakeTimerCue creates or reuses AudioContext
-> Web Audio oscillator and gain nodes emit synthesized tones
-> at zero, expired cue is played and completedCuePlayed is recorded
-> overtimeAlarmState becomes active
-> separate overtime interval plays overtime cue every 5 sec
-> Stop alarm, mute, pause, reset, close or unmount clears audio/intervals
```

Answers to required lifecycle questions:

1. `AudioContext` is created lazily inside `playBakeTimerCue`.
2. The first cue normally follows a Start timer tap, so it is tied to a user-initiated flow, but creation is not explicitly centralized in a named trusted-gesture initializer.
3. The context is resumed with `context.resume?.()` each time a cue is played.
4. Countdown cues are selected during the 250 ms timer update loop. Overtime is handled by a separate 5-second interval.
5. Cue overlap is limited by short tone durations and milestone de-duplication, but there is no theme-level mixer, limiter or explicit "one active preview at a time" engine yet.
6. Timer drift is handled by deriving the display state from `expiresAt` and current time rather than decrementing a counter.
7. Pause closes audio and releases wake lock.
8. `+10 sec` and `-10 sec` clear milestone history and recalculate the snapshot.
9. Overtime repetition uses `overtimeAlarmInterval` in `useBakeTimer`.
10. Stop alarm sets `overtimeAlarmState` to `stopped`, closes audio and clears the interval.
11. Sound off closes the current audio context and prevents new cues.
12. Sound on during active overtime restarts the overtime cue cleanly.
13. Unmount releases wake lock, closes audio and clears the overtime interval.
14. Kitchen and standalone share the timer component and hook.
15. Browser autoplay risk is low because sounds follow timer interaction, but a future preview UI must also be user-gesture driven.
16. Speech is not currently supported.
17. Browser speech synthesis would add inconsistent voices, timing and localization risk.

## 4. Existing risks and limitations

The current implementation is safe for one built-in sound style, but not yet a complete theme architecture.

Current limitations:

- Sound rendering is inside `useBakeTimer`, not a reusable sound engine.
- `getBakeTimerSoundPattern` returns one global pattern per cue role.
- There is no `soundThemeId` input for Kitchen or standalone timer.
- There is no sound-theme registry.
- There is no preview engine.
- There is no volume normalization contract across themes.
- Overtime and countdown sounds are scheduled through separate mechanisms.
- AudioContext lifecycle is functional but not named as a capability state machine.
- Runtime sound preference uses browser localStorage and correctly means sound on/off, not user theme preference.
- There are no audio assets or provenance records.

These limitations are not production defects today. They mean Patch 446B should add a shared sound engine before adding Account or Admin controls.

## 5. Proposed canonical sound-theme IDs

Approved canonical registry IDs should be:

```ts
export const BAKE_TIMER_SOUND_THEME_IDS = [
  "classic",
  "bell",
  "rooster",
  "halloween",
  "dark-commander",
  "robot-chef",
] as const;

export type BakeTimerSoundThemeId =
  (typeof BAKE_TIMER_SOUND_THEME_IDS)[number];
```

Production UI names:

| ID | User-facing name | Initial status |
| --- | --- | --- |
| `classic` | Classic | Initial release |
| `bell` | Bell | Initial release |
| `rooster` | Rooster | Initial release if asset/provenance is ready, otherwise disabled |
| `halloween` | Halloween | Initial release |
| `dark-commander` | Dark Commander | Deferred novelty theme |
| `robot-chef` | Robot Chef | Deferred novelty theme |

Do not use alternate IDs such as `vader`, `darth`, `sci-fi-villain`, `robot`, `chefbot`, `spooky`, or `holiday-halloween`.

## 6. Recommended initial release theme set

Recommended initial release: Option B.

Enable:

- Classic
- Bell
- Rooster
- Halloween

Defer:

- Dark Commander
- Robot Chef

Reasoning:

- Classic, Bell and Halloween can be synthesized reliably.
- Rooster is product-friendly but should use a short original/local asset only if synthesis sounds too artificial; it can still be included if provenance is ready.
- Dark Commander and Robot Chef raise originality, speech, localization, repetition fatigue and browser consistency questions.
- The first release should prove the registry, admin availability, Account preference, preview and shared timer integration before adding spoken or novelty-heavy themes.

## 7. Registry contract

Recommended application-owned registry shape:

```ts
type BakeTimerCueRole =
  | "normal"
  | "almost_there"
  | "final_ten_transition"
  | "final_ten"
  | "final_three"
  | "expired"
  | "overtime";

type BakeTimerSoundImplementation = "synthesized" | "asset" | "hybrid";

type BakeTimerSoundThemeDefinition = {
  id: BakeTimerSoundThemeId;
  name: string;
  description: string;
  implementation: BakeTimerSoundImplementation;
  releaseStatus: "initial" | "deferred";
  novelty: boolean;
  speech: "none" | "asset-only" | "deferred";
  cueProfiles: Record<BakeTimerCueRole, BakeTimerCueProfile>;
  previewCueOrder: BakeTimerCueRole[];
  previewDurationMs: number;
};
```

The database must store only:

- sound theme ID
- enabled/disabled state
- default flag or default theme ID
- version/update metadata

The database must not store frequencies, gain values, phrases, file paths, uploaded audio, base64 audio, JavaScript or arbitrary JSON cue definitions.

## 8. Classic specification

Classic should be the current DoughTools sound identity.

Implementation: synthesized.

Behavior:

- Periodic cue: current short neutral tone.
- Final-20: current slightly stronger cue every 5 seconds.
- Final-10 transition: current two-tone rise.
- Final-10: current short sharper cue every second.
- Final 3-2-1: current higher and stronger tone.
- Expiry: current three-tone pattern.
- Overtime: current recurring three-tone alert every 5 seconds.

Classic should be the hard fallback for unknown, disabled, unsupported or failed themes.

## 9. Bell specification

Bell should feel warm, clear and kitchen-friendly without becoming harsh.

Implementation: synthesized first.

Recommended behavior:

- Periodic cue: soft bell-like partial, short decay.
- Final-20: slightly brighter bell cue.
- Final-10 transition: two ascending bell tones.
- Final-10: one short bell ping per second.
- Final 3-2-1: higher bell pings with controlled gain.
- Expiry: three quick bell strikes.
- Overtime: two or three bell strikes every 5 seconds.

Synthesis can probably provide an acceptable bell by layering sine/triangle partials with exponential gain decay. If it sounds poor in browser validation, use Classic fallback and defer Bell asset tuning.

## 10. Rooster specification

Rooster should be playful and memorable, but not loud, long or constant.

Recommended implementation: hybrid.

Recommended behavior:

- Periodic cue: keep neutral or use a very subtle chirp-like synthesized cue.
- Final-20: neutral warning cue, not rooster every 5 seconds.
- Final-10: short rhythmic non-verbal cue.
- Final 3-2-1: stronger short cue, still not a long rooster call.
- Expiry: one short original rooster-like alert.
- Overtime: bounded short rooster-like alert every 5 seconds.

Rooster should use an application-owned local asset only if it is original/licensed, short, normalized and documented. Maximum recommended asset duration: 900 ms for expiry and 700 ms for overtime loop segment. Do not use downloaded clips without documented license.

## 11. Halloween specification

Halloween should be playful, theatrical and restrained.

Implementation: synthesized.

Recommended behavior:

- Periodic cue: low-mid soft tick or hollow tone.
- Final-20: slightly darker warning tone.
- Final-10 transition: small rising spooky interval, not a horror sting.
- Final-10: short per-second tick.
- Final 3-2-1: stronger but still controlled.
- Expiry: three-tone minor-pattern alert.
- Overtime: recurring short spooky alarm.

The Halloween sound theme must be independent from the Halloween visual appearance. A user may choose Halloween sound under Default, Summer or any other appearance.

## 12. Dark Commander specification

Dark Commander must be original and non-identifying.

Allowed character:

- deep
- mechanical
- cinematic
- commanding
- playful
- generally space-opera inspired

Prohibited:

- protected franchise names
- famous quotes
- recognizable character breathing
- recognizable movie sound effects
- actor imitation
- voice cloning
- UI names that imply a protected character

Recommended first implementation: deferred.

If implemented later, prefer a non-verbal variant:

- deep synthetic pulses
- filtered original tones
- short command-style alert shapes
- no speech in final countdown

Spoken variant should be allowed only with original voice production and short DoughTools-owned phrases. Browser speech synthesis should not be used for the final-ten countdown.

## 13. Robot Chef specification

Robot Chef should be friendly, robotic and kitchen-focused.

Allowed character:

- concise
- humorous
- non-identifying
- useful under repeated use

Prohibited:

- known fictional robot imitation
- famous phrases
- voice cloning
- long speech over countdown timing

Recommended first implementation: deferred.

If implemented later, prefer non-verbal robotic beeps for countdown and reserve any speech for preview, expiry or a bounded overtime alert. Candidate original phrases must be short, such as `Pizza ready.` or `Check the crust.`

## 14. Novelty-theme originality and IP boundary

The registry and tests should explicitly prevent protected franchise language.

Do not include in production UI, code identifiers or docs for released assets:

- Star Wars
- Darth Vader
- protected character names
- actor names
- film quotes
- recognizable franchise terminology
- extracted or recreated movie sound effects

Dark Commander and Robot Chef can exist only as original DoughTools sound identities. If there is any doubt, ship the non-verbal version or keep the theme disabled.

## 15. Synthesized versus asset comparison

| Model | Strengths | Risks | Recommendation |
| --- | --- | --- | --- |
| Web Audio synthesis only | Small bundle, no licensing burden, deterministic, works offline | Lower realism for rooster/voice novelty | Use for Classic, Bell and Halloween |
| Local audio assets only | Better realism, controlled voice quality | Asset size, preload/decode, licensing, provenance, failure fallback | Avoid as the only model |
| Hybrid | Best balance: synth where reliable, local assets only where needed | Requires asset contract and fallback | Recommended |
| Browser speech synthesis | No assets, flexible phrases | Inconsistent voices, timing, language and device behavior | Do not use for precise timer cues |

Recommended implementation model: hybrid with synthesis-first defaults.

Local asset requirements if used:

- Application-owned or properly licensed.
- No external URLs.
- Stored in repo under a documented local asset path.
- Prefer small compressed audio with browser-compatible fallback, such as `.mp3` plus `.ogg` only if needed.
- Mono unless stereo materially improves quality.
- Short duration: normally under 1 second for cue assets.
- Normalized loudness.
- Provenance documented in the same patch that adds the asset.
- Failure fallback to Classic.

## 16. Speech synthesis assessment

Browser speech synthesis should not be used for core countdown timing.

Reasons:

- Voices differ by browser, OS and installed language.
- Timing is not precise enough for final ten seconds.
- Speech can continue across route changes unless carefully cancelled.
- Localization and future translation become harder.
- It may conflict with screen readers or assistive audio.
- It can be annoying during repeated pizzas.

Spoken themes should be deferred and, if approved, use original prerecorded assets or a clearly original licensed synthetic voice with non-verbal fallback.

## 17. Recommended sound implementation model

Patch 446B should introduce a shared sound layer:

```text
timer state machine
-> cue role selection
-> effective sound theme resolver
-> sound-theme registry
-> sound engine
-> Web Audio synthesis or local asset player
```

The timer state machine must remain theme-agnostic.

Sound themes may choose sound color, timbre and asset profile. They must not change:

- duration
- final-ten threshold
- final-three threshold
- overtime interval
- overtime cap
- Kitchen completion
- Pizza Session state

The sound engine should own:

- AudioContext creation/resume/close
- one-preview-at-a-time policy
- active timer cue playback
- asset loading and decode fallback
- cancellation
- cleanup
- unsupported-audio state
- duplicate prevention

This is the necessary shared audio refactor before adding selectable sound themes.

## 18. Original voice-production contract

If a future patch adds spoken novelty sounds:

- Use original human voice actor recordings or a clearly licensed original synthetic voice.
- Do not ask anyone to imitate a named person or character.
- Do not clone a real person's voice without explicit rights.
- Record only original DoughTools phrases.
- Keep phrases short.
- Provide non-verbal fallback.
- Preserve provenance/license documentation in the repository.
- Avoid English-only assumptions in data design.

First release recommendation: avoid spoken phrases.

## 19. Volume and loudness contract

Current gain values range roughly from 0.13 to 0.24 in synthesized tones. Future themes need a shared loudness policy.

Recommended contract:

- Never programmatically change device volume.
- Normalize all themes to a comparable perceived loudness.
- Keep final-three stronger than final-ten but not startling.
- Keep overtime clear but bounded.
- Prevent overlapping loud cues.
- Avoid large low-frequency energy that phone speakers cannot reproduce.
- Use a maximum effective gain ceiling per cue profile.
- Consider a lightweight limiter or gain clamp inside the sound engine.
- Preview should use the same volume normalization as the timer.

Rooster and spoken/novelty themes need extra loudness review because they can become irritating or too prominent in a kitchen.

## 20. Autoplay and trusted gestures

Current timer sound is tied to Start timer and subsequent timer interactions, which is compatible with browser restrictions in practice.

Future requirements:

- Initialize or resume audio only after a click/tap.
- Preview must start only from explicit Play preview.
- Do not use hidden autoplay workarounds.
- If AudioContext is blocked, mark audio capability as unavailable and keep the visual timer fully usable.
- If assets are used, decode them after user interaction or preload metadata safely without attempting playback.
- Account page preview must not start on page load.
- Admin preview must not start on page load.

Supported target behavior:

- Chrome desktop: Web Audio synthesis should work after user gesture.
- Mobile Chromium: same, with possible background throttling handled by timestamp timer.
- Safari iOS: requires careful AudioContext resume after gesture and asset decode fallback.
- Installed PWA: same user-gesture rules.

## 21. Admin configuration model

Recommend normalized catalog rows:

```text
public.bake_timer_sound_theme_settings
theme_id text primary key
enabled boolean not null
is_default boolean not null
updated_by uuid
updated_at timestamptz not null
version integer not null
```

Why normalized rows:

- Easier RLS and RPC validation per canonical ID.
- Easier to reject unknown IDs.
- Easier to enforce exactly one default.
- Easier future addition of novelty themes.
- Better stale-write behavior per row.
- No arbitrary JSON array mutation.

Rules:

- Database stores IDs and availability/default metadata only.
- Admin writes go through Patch 444B authoritative admin guard.
- Public/basic clients may read only safe effective configuration.
- Admin UUIDs should not be exposed in public responses.
- Basic users cannot write settings.

## 22. Account preference model

Recommended preference:

```text
bakeTimerSoundTheme: BakeTimerSoundThemeId
```

Recommended storage: add a nullable `bake_timer_sound_theme` column to `public.account_preferences`.

Reasons:

- Current Account preferences are column-based.
- Existing API already has normalization and stale-write protection.
- Preference is user-owned and cross-device.
- No new localStorage contract is needed for signed-in preference.

Behavior:

| Situation | Result |
| --- | --- |
| No preference | Use enabled admin default, then Classic |
| Preferred theme enabled | Use preference |
| Preferred theme disabled | Fall back to enabled default, then Classic |
| Preferred theme removed from app registry | Fall back to enabled default, then Classic |
| Configuration fetch fails | Use Classic |
| User signed out | Use enabled default if available without auth, otherwise Classic |
| Preference changed on another device | Existing stale-write protection rejects old writes |
| Spoken theme unsupported | Use non-verbal profile, then Classic |

The runtime sound on/off toggle remains local and separate.

## 23. Effective-theme resolution

Canonical resolver:

```text
1. valid enabled signed-in Account preference
2. valid enabled admin-configured default
3. Classic
```

The resolver must return only an allowlisted theme.

It must not depend on:

- active visual theme
- Pizza Session
- oven type
- Account role
- query parameters
- browser localStorage theme value

Recommended placement: hybrid.

- Server/API resolves Account preference and public settings where available.
- Client timer receives an `effectiveSoundThemeId`.
- Timer can start immediately with Classic if configuration is not ready.
- If settings arrive after a timer has started, the running timer should keep its original theme for determinism.

## 24. Admin preview UX

Admin preview should:

- Show every prebuilt theme, including disabled/deferred ones when shipped in the registry.
- Require explicit Play preview.
- Play one short bounded preview at a time.
- Provide Stop preview.
- Never write configuration during preview.
- Never create a timer.
- Never mutate a Pizza Session.
- Clean up audio on navigation.
- Label novelty themes as playful or experimental.

Recommended preview sequence:

- Classic: normal, final-ten, expiry. Max 2.5 sec.
- Bell: periodic bell, final-three, expiry. Max 3 sec.
- Rooster: neutral cue, expiry rooster, one overtime cue. Max 3 sec.
- Halloween: final-ten, expiry, one overtime cue. Max 3 sec.
- Dark Commander: deferred preview only after originality approval. Max 3 sec.
- Robot Chef: deferred preview only after originality approval. Max 3 sec.

## 25. Account preview UX

Account preview should:

- Show only enabled themes.
- Use explicit Play and Stop buttons.
- Play one preview at a time.
- Avoid long overtime-style previews.
- Avoid cloud write until the user saves/selects.
- Allow immediate return to Classic.
- Clearly label novelty themes if enabled.
- Stop preview on route change or component unmount.

Preview and active timer audio must not run simultaneously. If a timer is active, either disable preview or stop preview before opening the timer.

## 26. Shared timer integration

Recommended timer contract:

```tsx
<BakeTimerPanel soundThemeId={effectiveThemeId} />
```

or:

```tsx
const timer = useBakeTimer({ durationSeconds, storageKey, soundThemeId });
```

Kitchen and standalone must use the same resolver and same sound engine.

The timer state machine should continue to emit cue roles. The sound engine should interpret cue roles with the selected theme.

Do not create separate Kitchen and standalone sound paths.

## 27. Runtime sound-toggle semantics

Recommended separated state:

```text
preferredSoundThemeId
effectiveSoundThemeId
runtimeSoundEnabled
audioCapabilityStatus
overtimeAlarmStopped
activePreviewThemeId
```

Required behavior:

- Runtime sound off stops current and future cue playback for the current timer.
- Runtime sound on resumes future cues and restarts active overtime alarm cleanly.
- Stop alarm stops overtime repetition but does not change preferred theme.
- Start next pizza resets overtime alarm stopped state and keeps the effective theme.
- Account preference changes should not alter an already-running timer.
- Close cleans audio resources.
- Speech or asset playback must be cancelled on mute, close and route change.

Current localStorage sound-enabled preference can remain as the runtime default. It must not become the Account sound-theme preference.

## 28. Speech and localization

Initial sound themes should be language-neutral and non-spoken.

Speech guidance:

- Do not speak the final ten-second countdown.
- Do not use browser speech synthesis for precise timing.
- If spoken themes are approved later, reserve speech for preview, expiry or bounded overtime.
- Keep phrases short.
- Use original DoughTools phrases.
- Design data structures so future localization can map phrase IDs, not arbitrary text.

Recommended first release: no speech.

## 29. Unsupported-audio fallback

If audio is unsupported or blocked:

- Timer remains visually fully usable.
- No uncaught exception.
- Sound toggle can show unavailable/failed state where UI supports it.
- Preview shows a safe error such as "Sound is not available in this browser."
- Timer state, pause/resume, final-ten visuals and overtime remain unchanged.
- Effective sound theme falls back to Classic only if the selected theme cannot play.

Do not block Kitchen or standalone timer because audio fails.

## 30. Accessibility

Requirements:

- Theme names and descriptions must be visible text.
- Novelty themes must be clearly labeled.
- Play preview and Stop preview need accessible names.
- Sound on/off remains clearly labeled.
- No critical timer information is sound-only.
- Final-ten and overtime remain visible.
- Screen readers should announce meaningful milestones only, not every cue.
- Users can fully mute sound.
- Reduced-motion behavior remains independent from sound.
- Spoken themes must not interfere with assistive technology.

Sound themes are optional personality. They are not safety requirements.

## 31. Privacy and security

Sound-theme implementation requires no access to:

- other users
- Pizza Sessions
- Party Orders
- photos
- notes
- emails
- Auth user lists

Admin sound configuration should expose only:

- enabled theme IDs
- default theme ID
- safe version/update metadata

Account preference should expose only the current user's selected theme.

No private RLS policy should be broadened.

No voice recordings should contain personal information.

## 32. Migration requirements

Patch 446B or 446C will require migrations if sound themes become configurable.

Expected migrations:

1. `public.bake_timer_sound_theme_settings`
2. optional seed rows for canonical IDs
3. RLS and grants
4. admin-only RPCs or guarded API write path
5. safe read resolver for public/basic usage
6. `account_preferences.bake_timer_sound_theme`

No migration is required for Patch 446A.

## 33. Deployment order

Recommended future deployment:

1. Add registry and shared sound engine in code.
2. Apply settings and Account preference migrations.
3. Verify seed/default configuration.
4. Deploy application with Classic fallback.
5. Enable admin configuration UI.
6. Enable Account preference UI.
7. Test Kitchen timer.
8. Test standalone timer.
9. Test signed-out fallback.
10. Test unsupported audio fallback.
11. Add any local assets only with provenance.

Rollback:

- App should fall back to Classic if settings table or preference column is unavailable.
- Admin sound UI can be hidden if settings endpoint fails.
- Account preference UI can be hidden while timer remains usable.

## 34. Threat and failure model

| Risk | Mitigation |
| --- | --- |
| Basic user crafts admin mutation | Patch 444B admin guard plus admin-only RPC/write path |
| Unknown theme ID stored | database check and app registry validation |
| Default is disabled | reject write and resolver falls back to Classic |
| User preference disabled | fall back to enabled default |
| Asset fails to load | non-verbal or Classic fallback |
| AudioContext blocked | visual timer continues, audio status becomes failed |
| Two previews overlap | centralized preview controller |
| Preview continues after navigation | cleanup on unmount |
| Overtime alarms overlap | one sound engine loop per timer |
| Sound-on duplicates schedulers | theme engine owns scheduler identity |
| Time adjustment duplicates cues | cue milestones keyed by cue role and timer second |
| Device sleeps/resumes | timestamp-derived timer remains source of truth |
| Theme too loud | gain clamp and normalization tests |
| Malformed configuration | server validation plus Classic fallback |
| License unclear | do not ship asset |
| Halloween visual forces sound | resolver explicitly ignores visual theme |
| Signed-out unavailable preference | use default/Classic only |
| Protected-media similarity | originality review and prohibited-term tests |
| Speech overlaps final countdown | no speech in initial release |
| Speech continues after mute | cancel speech/audio on mute and close |

## 35. Test strategy

Future tests should cover:

Registry:

- exact canonical IDs
- unknown ID falls back to Classic
- no arbitrary URLs
- required cue roles
- no protected franchise terminology

Configuration:

- admin can read/write
- signed-out gets 401 for writes
- basic gets 403
- stale write returns 409
- disabled default rejected
- unknown ID rejected

Account:

- enabled choices only
- save preference
- cross-device retrieval
- disabled preference fallback
- signed-out fallback
- no effect on runtime mute state

Preview:

- explicit user gesture
- one preview at a time
- Stop preview
- cleanup on unmount
- unsupported audio fallback
- no timer or session creation

Timer:

- Kitchen and standalone consistency
- Classic fallback
- each cue role under each enabled theme
- final-ten and final-three cadence
- expiry
- overtime
- Stop alarm
- Start next pizza
- mute/unmute
- no duplicate scheduling
- no per-second cloud writes

Originality/assets:

- no protected names
- no external media URLs
- provenance exists for local assets
- maximum asset sizes
- no voice-cloning dependency

Browser:

- Chrome desktop
- mobile Chromium
- iOS/Safari limitations
- autoplay blocked fallback
- background/resume
- mobile speaker audibility

## 36. Patch 446B-446G boundaries

Recommended sequence:

Patch 446B:

- canonical sound-theme registry
- shared sound engine extraction
- Classic/Bell/Halloween synthesized profiles
- Rooster placeholder or asset-ready profile
- effective resolver in code with Classic fallback
- no Admin UI yet if migration scope is kept separate

Patch 446C:

- admin sound-theme settings migration
- admin API/RPC
- Admin sound-theme management UI
- preview for all shipped profiles

Patch 446D:

- Account sound preference migration/API/UI
- Account preview
- disabled-theme fallback UX

Patch 446E:

- Kitchen and standalone timer integration with effective theme
- runtime sound state hardening
- browser compatibility pass

Patch 446F:

- Dark Commander and Robot Chef novelty implementation if approved
- original assets or non-verbal profiles
- provenance and localization fallback

Patch 446G:

- cross-browser audio, loudness and reliability audit/tuning

## 37. Known limitations

- Supabase CLI was not available in this environment, so migration history could not be checked with `supabase migration list`.
- No browser-audio matrix was executed because this is audit-only.
- Rooster quality cannot be proven without either synthesis prototyping or an original licensed asset.
- Dark Commander and Robot Chef require product approval on originality and speech boundaries before release.
- Existing sound generation has no limiter/compressor yet.
- Existing AudioContext creation is safe enough for current behavior but should be formalized in the shared sound engine.

## 38. Final recommendation

Implement Patch 446B as a shared audio refactor plus application-owned sound-theme registry. Do not put sound theme branching into React rendering, Account UI or the existing timer state machine. Ship reliable non-spoken themes first, keep Classic as the permanent fallback, and defer novelty spoken themes until original assets, licensing, localization and browser behavior are proven.

Shared audio refactor required before sound themes
