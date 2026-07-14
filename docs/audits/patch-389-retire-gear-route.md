# Patch 389: Retire legacy gear route

## Summary

Patch 389 retires `/gear` as an independent public page and preserves the useful, current equipment guidance inside `/ovens` as a compact `Other equipment` section.

The legacy URL remains compatible through a server-side redirect:

```text
/gear -> /ovens#other-equipment
```

No session calculations, formulas, persistence contracts, authentication, database behavior or Pizza Session route behavior were changed.

## Inspection

Inspected before removal:

- `app/gear/page.tsx`
- `app/gear/layout.tsx`
- `lib/pizza-gear.ts`
- `public/gear/*.webp`
- navigation and homepage link models
- Learning Center, troubleshooting and pizza-style related-learning links
- SEO route policy and sitemap tests
- footer and route-existence tests
- `/ovens` page structure

Findings:

- `lib/pizza-gear.ts` was only imported by `app/gear/page.tsx`.
- `public/gear/*.webp` files were only referenced by the old `/gear` page image cards.
- The old page used route-specific localStorage key `doughtools-gear-v1`; no shared persistence contract depended on it.
- Session shopping still uses the `Gear` shopping group as session data, but that is unrelated to the retired `/gear` public route and was not changed.

## What Moved To Ovens

The useful equipment content was condensed into `/ovens#other-equipment`.

The section appears after practical oven guidance and before the final CTA, preserving the requested `/ovens` order:

1. oven comparison
2. preheat
3. placement
4. bake time
5. practical oven guidance
6. Other equipment
7. final CTA
8. footer

The default visible state is intentionally short:

- a concise summary of the equipment philosophy
- counts for Essential, Useful and Optional groups
- one native `details` / `summary` disclosure labeled `Show more equipment`

The disclosed detail is grouped as:

- Essential
- Useful
- Optional

Each retained item states:

- what it is
- what it is used for
- priority
- oven fit
- whether a beginner needs it immediately
- a short use or safety note

## Retained Equipment Guidance

Essential:

- Digital scale
- Lidded proofing box
- Dough scraper
- Launching peel
- Infrared thermometer
- Fire blanket and heat gloves

Useful:

- Turning peel
- Stable prep table
- Opening-flour tray
- Cooling rack and cutting board
- Wheel or pizza scissors

Optional:

- Stone brush or scraper
- Cover and storage

The old budget ladder, ownership checklist, image-card gallery, localStorage progress state and long standalone station walkthrough were not retained because they made the retired route feel like a separate product.

## Removed Files

- `app/gear/layout.tsx`
- `lib/pizza-gear.ts`
- `public/gear/brush.webp`
- `public/gear/cover.webp`
- `public/gear/cutter.webp`
- `public/gear/flour-tub.webp`
- `public/gear/landing-rack.webp`
- `public/gear/launch-peel.webp`
- `public/gear/precision-scale.webp`
- `public/gear/prep-table.webp`
- `public/gear/proof-box.webp`
- `public/gear/safety.webp`
- `public/gear/scale.webp`
- `public/gear/scraper.webp`
- `public/gear/thermometer.webp`
- `public/gear/turning-peel.webp`

## Redirect Implementation

`app/gear/page.tsx` now uses `permanentRedirect` from `next/navigation`.

This keeps `/gear` as a server-side compatibility route and avoids a client-side `useEffect` redirect.

## Internal Links

Production links to `/gear` were removed.

Updated or removed surfaces:

- `lib/navigation.ts`
- `lib/homepage.ts`
- `components/HomeCalculatorWorkspace.tsx`
- `components/guide/PizzaTroubleshootingGuideClient.tsx`
- `lib/pizza-style-education.ts`

Contextual learning links now point to `/ovens#other-equipment` where equipment guidance remains available.

## SEO Impact

- `/gear` is no longer a legacy noindex page with route metadata.
- `/gear` remains excluded from sitemap.
- `/gear` is now documented as redirect-only compatibility URL.
- `/ovens` remains the canonical indexed learning route for oven setup and related equipment guidance.

## Tests Updated

- `tests/legacy-route-indexing.test.ts`
- `tests/seo-config.test.ts`
- `tests/navigation.test.ts`
- `tests/homepage.test.ts`
- `tests/trust-pages.test.ts`
- `tests/sitewide-hero-system.test.ts`
- `tests/sitewide-hero-rollout-audit.test.ts`
- `tests/site-footer.test.ts`
- `tests/ovens.test.ts`

## Browser Validation

Production build was validated locally with `next start -p 3102`.

| Viewport | `/gear` redirect | Other equipment anchor | Disclosure default | Disclosure open | Footer | Horizontal overflow | Back behavior | Console errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 390 x 844 | `/ovens#other-equipment` | visible | closed | open with Essential, Useful, Optional details | visible after scroll | none | returned to `/` | none |
| 430 x 740 | `/ovens#other-equipment` | visible | closed | open with Essential, Useful, Optional details | visible after scroll | none | returned to `/` | none |
| 1280 x 900 | `/ovens#other-equipment` | visible | closed | open with Essential, Useful, Optional details | visible after scroll | none | returned to `/` | none |
| 1440 x 950 | `/ovens#other-equipment` | visible | closed | open with Essential, Useful, Optional details | visible after scroll | none | returned to `/` | none |

Approximate page lengths:

| Viewport | Closed details | Open details |
| --- | ---: | ---: |
| 390 x 844 | 8.5 screens | 14.7 screens |
| 430 x 740 | 9.3 screens | 16.0 screens |
| 1280 x 900 | 4.4 screens | 6.5 screens |
| 1440 x 950 | 4.0 screens | 6.0 screens |

The default page remains compact because the equipment detail is hidden until the user opens the single native disclosure.

## Validation Results

- focused tests: `11 passed`, `160 passed`
- full test suite: `60 passed`, `987 passed`
- lint: passed
- build: passed
- `git diff --check`: passed
- browser validation: passed in all required viewports
