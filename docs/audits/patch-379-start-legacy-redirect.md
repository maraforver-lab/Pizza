# Patch 379 start legacy redirect

Patch 379 retires the old `/start` beta orientation page.

## Production behavior

- `/start` is kept only as a legacy URL.
- `app/start/page.tsx` performs a server-side `permanentRedirect("/session/start")`.
- `/start` no longer renders a standalone beta, orientation or Start Here experience.
- `/session/start` remains the active Pizza Session start form.

## Removed legacy code

- Removed the old `/start` client UI from `app/start/page.tsx`.
- Removed the route-specific `/start` metadata layout.
- Removed `lib/start-here.ts`, which only fed the old beta Start Here cards.
- Removed `docs/start-here.md`, which documented the retired beta page.

`components/ExperienceLevelSelector.tsx` was not removed because it is still shared by the calculator, account, Planner and Dough Doctor surfaces.

## Link and SEO cleanup

- Normal internal planning links now point to `/session/start`.
- `/start` is not listed as a public SEO route or sitemap entry.
- Active baseline docs now describe `/session/start` as the planning entry and `/start` as a redirect-only legacy URL.

## Out of scope

This patch does not change Pizza Session create, conflict, replace, persistence or downstream route behavior.
