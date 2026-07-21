# Patch 446B: Bake Timer Sound-Theme Foundation

## Scope

Patch 446B implements the technical foundation recommended by Patch 446A. It does not add the final Admin management UI or Account selector UI.

## Approved Themes

Initial enabled registry:

- `classic`
- `bell`
- `rooster`
- `halloween`

Deferred:

- `dark-commander`
- `robot-chef`

The deferred themes are intentionally excluded from the runtime registry and database constraint in this patch.

## Registry

`lib/bake-timer-sound-themes.ts` is the canonical registry. It defines approved IDs, user-facing labels, descriptions and synthesized cue patterns for the shared cue roles:

- `periodic`
- `final20`
- `final10`
- `final3`
- `expiry`
- `overtime`

`classic` remains the guaranteed fallback and preserves the previous Bake Timer sound patterns.

## Audio Abstraction

`lib/bake-timer-audio.ts` centralizes Web Audio playback. The Bake Timer hook still owns timer state, cue timing, milestone de-duplication, overtime alarm scheduling and runtime mute. The audio helper only turns a cue plus sound-theme ID into safe synthesized tones.

No external audio files, URLs, spoken voice, character imitation or copied media are introduced.

## Resolver

The deterministic resolver is:

```text
user preference -> product default -> Classic
```

Unknown, disabled or missing values fall back safely. Runtime sound on/off remains a separate local-only timer preference and is not stored in Account preferences.

## Database Model

Migration file:

`supabase/migrations/20260721130000_create_bake_timer_sound_theme_settings.sql`

It adds:

- nullable `public.account_preferences.bake_timer_sound_theme`
- `public.bake_timer_sound_theme_settings`
- safe read RPC `public.get_bake_timer_sound_configuration()`
- admin-only list/update RPCs
- RLS enabled on the settings table
- grants only through the intended RPC boundary

The migration is not applied by this patch.

## API Behavior

Public:

- `GET /api/bake-timer/sound-themes`
- returns approved definitions, enabled IDs, default ID and version
- falls back to Classic if configuration cannot be read

Admin:

- `GET /api/admin/bake-timer-sounds`
- `PATCH /api/admin/bake-timer-sounds`
- uses the authoritative `requireAdminForRequest` guard
- rejects unknown IDs, disabled-default payloads, missing Classic fallback and stale versions

Account:

- `GET /api/account/preferences` now includes Bake Timer sound configuration and effective theme
- `PATCH /api/account/preferences` can update `bakeTimerSoundTheme`
- users may only update their own Account preference
- disabled or unknown preference values are rejected or resolved to fallback

## Security

The patch does not broaden access to Pizza Sessions, Party Orders, Account rows owned by other users, storage, Auth admin data or private user content.

Ordinary users cannot modify global sound settings because the table is not directly granted to them and admin mutations require `current_user_is_admin()` through the existing admin guard/RPC boundary.

## Local-Only Timer State

Timer runtime state remains local to the current device. The saved Account preference selects a theme only. It does not control whether sound is currently on or off, and it does not create per-second cloud/session writes.

## Tests

Added coverage for:

- approved and deferred theme IDs
- Classic fallback preserving legacy patterns
- semantic cue roles
- resolver priority
- admin payload validation
- migration/RLS/API contract
- Account preference storage and validation
- Bake Timer hook refactor preserving local-only behavior

## Known Limitations

The final Admin and Account UI controls are intentionally deferred to later Patch 446 work. The migration must be applied in a separate production operation before non-Classic theme settings can be managed in production.
