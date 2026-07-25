# Patch 463B2A: Refined Homepage Draft

## Why Three Versions Remain

DoughTools now keeps three code-based Homepage presentations so an administrator can compare the current live page with two draft concepts without changing public behavior:

- `stable`: `Current homepage`, `live`
- `simplified`: `Simplified homepage`, `draft`
- `refined`: `Refined homepage`, `draft`

The public `/` route still resolves the single live version through the existing registry. No query parameter, cookie, local storage value, database flag or guidance-level preference can switch the public Homepage.

## Simplified Versus Refined

The refined draft keeps the simplified concept and hierarchy, but adjusts the presentation where the production preview was weakest:

- The hero gives the existing pizza photography more visual priority on desktop.
- The mobile hero keeps text and CTAs first, then shows a slightly taller, closer image crop.
- The Make and Learn paths remain compact full-card links.
- The four-step process remains one connected sequence with slightly tighter mobile spacing.
- Supporting tools now include explicit action labels instead of relying on a small arrow alone.
- The final CTA is visually distinct but lighter than the hero.

The existing `HomepageStable` and `HomepageSimplified` implementations were retained as separate components.

## Desktop Hero Image Changes

The refined desktop hero allocates roughly two thirds of the hero width to the pizza image and one third to the text panel. It reuses `/images/homepage/doughtools-hero-desktop.webp`, increases the crop scale, and shifts the object position so the pizza reads larger while retaining the oven flame and preparation environment as context.

## Mobile Hero Crop Changes

At 390-430 px, the refined hero keeps the headline, supporting copy, `Plan a pizza` and `Explore guides` before the image. The image area is slightly taller than the simplified draft and uses a closer crop to reduce empty table/background space without pushing the primary CTA below the first useful screen.

## Supporting-Tool Interaction Improvements

The supporting tools remain:

- Quick Calculator
- Pizza Styles
- Practical Tips
- Troubleshooting

Each tool remains a semantic full-card link. The refined version adds explicit action labels:

- `Open calculator`
- `Explore guide`

The cards keep concise descriptions and use the shared `DoughToolsIcon` system only.

## Density and Final CTA Refinements

The refined version reduces vertical padding between sections, keeps Make/Learn and process rows compact, and avoids a long stack of oversized cards. The final `Plan a pizza` CTA keeps strong contrast, but it uses a narrower container and lighter padding so it does not become a second full hero.

## Registry State

The registry remains code-based and strictly allowlisted:

- `stable`
- `simplified`
- `refined`

Exactly one version is live. Unknown IDs continue to return safe not-found behavior through the existing preview route.

## Public Stable Behavior

Public `/` continues to render the live `stable` version. Public visitors cannot see refined-only copy, the `refined` version ID, preview links, a version selector or Admin version metadata.

## Admin Preview Behavior

The existing protected Admin preview route can render:

- `/admin/homepage-preview/stable`
- `/admin/homepage-preview/simplified`
- `/admin/homepage-preview/refined`

The preview route remains Admin-only and uses `noindex` / `nofollow` metadata. It remains absent from sitemap, public navigation and the footer.

## Deferred Publish, Restore and Retire Work

This patch does not implement publishing, restoring, retiring, deleting, duplicating or editing Homepage versions. Those controls remain intentionally unavailable until a later version-lifecycle patch defines persistence, rollback and production safeguards.

## Product Logic

No Pizza Plan, session workflow, recipe generation, calculations, formulas, defaults, validation ranges, Quick Calculator logic, Guides content, APIs, database schema, Supabase migrations, authentication or authorization logic changed.
