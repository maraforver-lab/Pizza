# Patch 40 — Homepage Minimal UX Lockdown

Patch 40 reduces the visible homepage to a minimal beta front door.

The normal homepage should contain only:

- DoughTools brand/header
- optional Sign in / Account button
- hero promise
- `Start Pizza Session`
- local-first note
- guidance level selector
- Continue Pizza Session when a real active local session exists

## What was removed from visible homepage UX

- visible top navigation groups
- `Dough Calculator` header pill
- `Make pizza`
- `Learn & troubleshoot`
- `My DoughTools`
- `More tools`
- hero `Open calculator` button
- hero `Learn how it works` link
- homepage eight-step flow section
- homepage trust row as a separate large row
- homepage tool grid
- install prompt placement on the homepage
- homepage update banner
- homepage next-step footer prompt

## What was preserved

No product routes were deleted. These routes remain available directly:

- `/?calculator=1`
- `/session/start`
- `/session/recipe`
- `/session/timeline`
- `/session/shopping`
- `/session/kitchen`
- `/session/review`
- `/plan`
- `/doctor`
- `/sauce`
- `/toppings`
- `/timer`
- `/account`
- `/updates`

## Header behavior

The DoughTools logo points to `/`.

The visible header keeps the account/sign-in link.

The old navigation model remains in code for route metadata/tests, but the confusing visible header menus are not rendered.

## Local-first honesty

The hero says:

> Your session is saved locally in this browser/device. No cloud sync. No tracking.

No cloud sync, account sync, cross-device sync, tracking, analytics or offline mode is claimed.

## Safety

Patch 40 does not change dough formulas, yeast calculations, Pizza Session storage, saved recipe storage, planner timing logic, Dough Doctor logic, authentication, Supabase behavior, security headers, payments or SEO indexing permissions.
