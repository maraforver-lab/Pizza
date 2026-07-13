# Patch 39 — Homepage Session-First Visual Cleanup

Patch 39 refines the homepage around the approved session-first visual direction.

The goal is not pixel-perfect copying. The goal is a clearer hierarchy:

1. clear promise
2. Start Pizza Session
3. guidance level
4. Continue Session when a real local session exists
5. compact session flow and local-first benefits
6. secondary tools

## What changed

- The hero now uses the headline “Plan and bake better pizza without guessing.”
- The primary homepage CTA remains `Start Pizza Session` and points to `/session/start`.
- The secondary calculator CTA points to `/?calculator=1`.
- A visible guidance-level selector is shown for Beginner, Enthusiast and Pizza Nerd.
- Continue Pizza Session remains conditional and appears only when a real active local session exists.
- The session path is shown as a compact eight-step explanation.
- Trust copy is shorter and focused on local-first privacy.
- Individual tools remain available as compact secondary links.

## Visual reference

The attached mockup was used as layout hierarchy guidance, not as a pixel-perfect target.

The homepage uses an existing local pizza image asset from `public/pizza-styles/neapolitan.webp`.
No external image assets were added.

## Removed from the homepage primary flow

The homepage does not render the old full calculator dashboard by default.
It also avoids the old recipe result card, share/copy blocks, Save recipe, Save this bake, My recipes and large workshop/dashboard sections.

Those features were not deleted. They remain in their existing routes or workflow contexts.

## Preserved routes

- `/`
- `/?calculator=1`
- `/start`
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

## Local-first limits

Homepage copy says session progress is saved locally in this browser/device.

It does not claim:

- cloud sync
- account sync
- cross-device sync
- offline mode
- public sharing

## Safety

Patch 39 does not change dough formulas, yeast calculations, Pizza Session storage, saved recipe storage, planner timing logic, Dough Doctor logic, authentication, Supabase behavior, security headers, analytics, payments or SEO indexing permissions.
