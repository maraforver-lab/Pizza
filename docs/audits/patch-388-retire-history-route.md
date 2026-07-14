# Patch 388: Retire legacy history route

## Summary

Patch 388 retires the old `/history` editorial page. The URL is preserved only as a server-side compatibility redirect to `/about`.

The route no longer renders an independent public destination, no production navigation links point to it, and the old page-specific images were removed because they had no remaining production consumer.

## Starting point

- Branch: `patch/388-retire-history-route`
- Starting commit: `721e2984`
- Previous state: Patch 387 had already removed `/history` from the public sitemap and marked it as a legacy noindex route.

## Inspection

Inspected sources:

- `app/history/page.tsx`
- `app/history/layout.tsx`
- `public/pizza-history/*`
- `lib/navigation.ts`
- `lib/homepage.ts`
- `components/HomeCalculatorWorkspace.tsx`
- `lib/seo-config.ts`
- `docs/seo-indexation.md`
- `docs/global-responsive-ux-rules.md`
- `docs/sitewide-hero-and-imagery-system.md`
- route, navigation, homepage, footer and SEO tests

Findings:

- The page implementation was route-specific and contained its own bilingual article data, source list, image list, local client readiness state and footer.
- No page-specific component or helper module had another consumer.
- The three `public/pizza-history/*.webp` files were referenced only by the retired route and historical audit documents.
- External citations were only part of the retired page content; they were not reused by About, Learning Center or active research modules.
- Normal production links to `/history` existed in shared navigation, homepage secondary tools and the old homepage calculator workspace.

## Removed files

- `app/history/layout.tsx`
- `public/pizza-history/ancient-flatbreads.webp`
- `public/pizza-history/naples-street.webp`
- `public/pizza-history/new-york-pizzeria.webp`

The old `app/history/page.tsx` article implementation was removed and replaced by a minimal server-side redirect page.

## Preserved assets and references

No `public/pizza-history` asset remained in production use, so no page-specific history images were preserved.

Historical audit documents still mention `/history` and the old imagery where they describe previous architecture. Those documentation references are intentionally left as historical records, not active product links.

Account completed-session history APIs and components were not touched. They use `/api/pizza-sessions/history` and are unrelated to the retired public editorial route.

## Redirect implementation

`app/history/page.tsx` now uses:

```ts
permanentRedirect("/about");
```

This is a Next.js server-side redirect. There is no client-side `useEffect` redirect, no placeholder page and no independent `/history` UI.

Redirect rationale: the old historical editorial story belongs, if anywhere, with the founder/product story rather than as a separate product destination.

## Internal links removed

Removed normal product links to `/history` from:

- `lib/navigation.ts`
- `lib/homepage.ts`
- `components/HomeCalculatorWorkspace.tsx`

Regression coverage checks that active navigation, homepage, workspace and footer sources do not contain `href="/history"` or `href: "/history"`.

## SEO impact

- `/history` remains excluded from `/sitemap.xml`.
- `/history` was removed from `legacyNoindexRoutes` because it no longer renders a page that needs page-level noindex metadata.
- `docs/seo-indexation.md` now classifies `/history` as a redirect-only legacy URL.
- No public sitemap routes were added.
- No global robots behavior changed.
- `/about` remains the canonical public destination and receives the legacy traffic.

## Tests updated

Updated tests:

- `tests/legacy-route-indexing.test.ts`
- `tests/seo-config.test.ts`
- `tests/navigation.test.ts`
- `tests/homepage.test.ts`
- `tests/trust-pages.test.ts`
- `tests/site-footer.test.ts`
- `tests/sitewide-hero-system.test.ts`
- `tests/sitewide-hero-rollout-audit.test.ts`

Focused validation:

- `npm run test -- tests/legacy-route-indexing.test.ts tests/seo-config.test.ts tests/navigation.test.ts tests/homepage.test.ts tests/trust-pages.test.ts tests/site-footer.test.ts tests/sitewide-hero-system.test.ts tests/sitewide-hero-rollout-audit.test.ts tests/start-here.test.ts`
- Result: passed, 9 files, 109 tests.

## Browser validation

Production-build browser validation covered:

- `/history` redirects to `/about`
- `/about` loads after redirect
- browser Back from redirected `/about` does not loop
- no broken navigation was observed on `/about`
- no console errors were observed during the redirect and `/about` load

Viewports:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Results:

| Viewport | Final URL | About title | Back result | Horizontal overflow | Console errors |
| --- | --- | --- | --- | --- | --- |
| 390 x 844 | `/about` | `About DoughTools | DoughTools` | `/` | No | None |
| 430 x 740 | `/about` | `About DoughTools | DoughTools` | `/` | No | None |
| 1280 x 900 | `/about` | `About DoughTools | DoughTools` | `/` | No | None |
| 1440 x 950 | `/about` | `About DoughTools | DoughTools` | `/` | No | None |

## Validation checklist

Final validation performed:

- Focused tests: passed, 9 files and 109 tests
- Full test suite: passed, 60 files and 984 tests
- Lint: passed
- Build: passed
- `git diff --check`: passed
- Browser production-build validation: passed

## Scope confirmation

Patch 388 did not change:

- calculations
- Pizza Session schema
- persistence contracts
- authentication
- Party Orders
- account history APIs
- pricing
- deployment configuration
- `/about` page content
- sitemap inclusion for active public routes

## Final recommendation

Treat `/history` as retired. Future architecture cleanup should continue with the remaining legacy routes one at a time rather than combining them into a broad route deletion patch.
