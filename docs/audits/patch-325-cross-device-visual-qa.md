# Patch 325 — Cross-device visual QA and UX polish

Date: 2026-07-12

Baseline: Patch 324 on `master`.

## Scope

Patch 325 reviewed the post-redesign DoughTools surfaces for responsive layout, visual consistency, accessibility and practical UX polish. This was a QA patch, not a redesign.

Reviewed widths:

- 320 px
- 390 px
- 430 px
- 768 px
- 1024 px
- 1280 px
- 1440 px
- 1920 px

Reviewed representative routes:

- `/`
- `/?calculator=1`
- `/calculator/quick`
- `/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account`
- `/account/party-orders`
- `/about`
- `/guide`
- `/styles`

## Confirmed issue fixed

### Quick Calculator 320 px overflow

At 320 px, `/calculator/quick` could create horizontal overflow inside the main calculator workspace. The cause was CSS grid min-content behavior: the main two-column calculator grid and repeated card children did not explicitly allow shrinking, so advanced controls and number-control min-widths could push cards outside the narrow viewport.

Fix:

- Added `min-w-0` to the Quick Calculator main workspace grid.
- Added `min-w-0` to the Quick Calculator input column, result panel and repeated input cards.
- Made number controls use a more compact mobile grid, while preserving the larger desktop control sizing.
- Slightly increased advanced checkbox visual size for better touch usability.

Result:

- At 320 px, Quick Calculator no longer creates document or body horizontal scrolling.
- Desktop sizing remains unchanged through responsive `sm:` control sizing.

## Intentional non-changes

- No Pizza Session flow logic changed.
- No calculator formulas changed.
- No Timeline, Kitchen Mode, fermentation, flour, oven, storage, auth, API or account behavior changed.
- No homepage messaging or hero assets changed.
- No design foundation or icon architecture changed.

Some legacy direct routes such as `/?calculator=1` and unauthenticated account subroutes were reviewed but not redesigned. Any route-level or legacy calculator restructuring should be handled in a dedicated patch.
