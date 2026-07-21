# Patch 446C: Admin Sound-Theme Management

## Route

Patch 446C adds:

`/admin/bake-timer-sounds`

The route is under the existing protected Admin layout and also loads its initial settings through `requireAdmin()` before rendering.

## Authorization

The page inherits the server-side Admin guard from `/admin/layout.tsx`. Client saves use:

`/api/admin/bake-timer-sounds`

That API uses the Patch 444B authoritative Admin guard and Patch 446B admin RPC boundary. No private Pizza Session, Party Order, Account preference rows owned by other users, Auth data or storage data is displayed.

## Enabled And Default Behavior

The page manages only production registry themes:

- Classic
- Bell
- Rooster
- Halloween

Deferred themes are not offered:

- Dark Commander
- Robot Chef

Classic cannot be disabled in the UI because it is the safe fallback. A product default can be selected only from enabled themes. The UI prevents zero enabled themes and the API still enforces the same constraints.

## Preview Lifecycle

Each production theme has a Preview action. Preview:

- starts only from a click or tap
- uses the shared Patch 446B `playBakeTimerCue` Web Audio helper
- plays one short representative sequence
- allows only one active preview at a time
- exposes `Stop preview`
- stops when another preview starts
- stops on unmount/navigation
- does not create a Timer or Pizza Session
- does not save Admin or Account settings
- does not affect runtime Timer mute

Unsupported or blocked audio fails safely because the shared audio helper catches playback failures.

## Stale-Write Handling

Saving sends:

- enabled theme IDs
- default theme ID
- current version

A `409` stale response is shown as a conflict state and the page reloads the latest settings instead of overwriting another admin's newer change. Ordinary save failures keep unsaved edits in place.

## Mobile Behavior

The page uses compact cards rather than a wide table. It is designed for 390 px and 430 px mobile widths without horizontal scrolling, and it keeps primary controls as large touch targets.

## Validation

Patch tests cover:

- route protection source
- Admin dashboard link
- four production themes only
- deferred themes excluded from UI
- Classic fallback behavior
- default selection constraints
- preview cleanup and shared audio use
- stale-write handling
- no private-user data exposure

## Patch 446D Integration Point

Patch 446D can add Account UI for choosing the user's preferred enabled sound theme. It should reuse the Patch 446B Account preference field and resolver instead of adding another preference model.
