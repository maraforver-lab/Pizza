# DoughTools SEO indexation policy

Patch 23 defined the first clean search-indexing baseline for DoughTools. Patch 387 updated that baseline after the Pizza Session and Learning Center simplification work. Patch 388 retires the old `/history` editorial page as a compatibility redirect. Patch 389 retires the old `/gear` page as a compatibility redirect to the equipment section on `/ovens`. Patch 390B retires the old `/doctor` page as a compatibility redirect to Troubleshooting. Patch 392B retires the old `/coach` page as a compatibility redirect to Troubleshooting. Patch 476A adds launch-ready social identity assets and explicit noindex protection for downstream workflow, token and API routes while keeping indexing disabled. Patch 479B separates public metadata from first-wave indexable routes before the indexing switch is opened.

The goal is still not to open indexing automatically. The goal is to keep the public sitemap, canonical URLs, explicit noindex routes and robots behavior aligned with the current product architecture.

## Current launch state

DoughTools is live for testing, but indexing remains controlled by the centralized launch switch:

```text
ALLOW_INDEXING=false
```

Do not enable indexing in this patch.

## Public indexable route policy

Clean public routes are split into metadata routes and first-wave indexable routes. A page can be publicly accessible and have stable metadata without being included in the search sitemap.

The central source of truth is `lib/seo-config.ts`:

- `publicSeoRoutes`: pages with public metadata.
- `publicIndexableRoutePaths`: first-wave routes intended for the sitemap when indexing is opened.
- `publicNoindexRoutePaths`: public pages that must remain noindex.

Current first-wave public indexable routes are:

- `/`
- `/about`
- `/methodology`
- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`
- `/styles`
- `/ovens`
- `/sauce`
- `/toppings`
- `/calculator/quick`
- `/costs`

These routes should have stable page metadata, clean canonical URLs and enough crawlable context to work as standalone search results.

Current public routes that remain noindex:

- `/contact`
- `/privacy`
- `/terms`
- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`

These pages may remain linked for users, but they are not first-wave organic search landing pages.

## Legacy noindex and redirect routes

Patch 387 kept predecessor routes accessible but removed them from the public sitemap and assigned explicit noindex metadata. Patch 388 retires `/history` further as a server-side redirect to `/about`. Patch 389 retires `/gear` further as a server-side redirect to `/ovens#other-equipment`. Patch 390B retires `/doctor` further as a server-side redirect to `/guide/pizza-troubleshooting`. Patch 391B retires `/plan` further as a server-side redirect to `/session/start`. Patch 392B retires `/coach` further as a server-side redirect to `/guide/pizza-troubleshooting`.

The central source of truth is `legacyNoindexRoutes` in `lib/seo-config.ts`.

Current legacy noindex routes:

- none

Legacy compatibility routes that have been retired are redirect-only and must not appear in `/sitemap.xml`.

Current redirect-only legacy routes are:

- `/start` -> `/session/start`
- `/plan` -> `/session/start`
- `/history` -> `/about`
- `/gear` -> `/ovens#other-equipment`
- `/doctor` -> `/guide/pizza-troubleshooting`
- `/coach` -> `/guide/pizza-troubleshooting`

Redirect-only legacy routes must not appear in `/sitemap.xml` and must not be linked as normal product destinations.

## Private and noindex routes

Private, account-related or user-state routes are intentionally kept out of the public indexable route list.

The central source of truth is `privateSeoRoutes` in `lib/seo-config.ts`.

Important private/noindex routes include:

- `/account`
- `/auth`
- `/auth/callback`
- `/login`
- `/signup`
- `/preview`
- `/debug`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/order`
- `/api`

These routes must not appear in the sitemap.

## Stateful query-param routes

DoughTools uses query parameters so users can share calculator and supporting tool setups.

Examples:

- `/?balls=6&ballWeight=260`
- `/sauce?balls=6`
- `/calculator/quick?quick=...`
- `/toppings?toppings=mushroom%3A35%3Araw`

These URLs remain supported and shareable.

However, query-param variants should not create a large duplicate-content footprint in search. The current baseline is:

1. keep query-param URLs working
2. exclude query-param URLs from the sitemap
3. canonicalize query-param variants to the clean base route where metadata can be generated safely

Examples:

- `/calculator/quick?quick=...` canonicalizes to `https://www.doughtools.app/calculator/quick`
- `/?balls=4` canonicalizes to `https://www.doughtools.app/`

Route-level query-param noindex is intentionally not implemented yet for every stateful tool URL because the current App Router metadata layer is static for these pages. If duplicate-content signals become a practical issue after indexing is opened, add a separate patch for query-aware robots handling.

## Canonical rules

Canonical URLs are created by `canonicalUrl()` in `lib/seo-config.ts`.

Rules:

- use the configured safe production origin
- strip query strings
- strip hash fragments
- normalize repeated slashes in the path
- avoid trailing slashes except for `/`
- never promote localhost, Vercel preview URLs or old staging URLs as canonical URLs

The intended production origin for public verification is:

```text
https://www.doughtools.app
```

## Sitemap rules

The sitemap route is:

```text
/sitemap.xml
```

The implementation is:

```text
app/sitemap.ts
```

The sitemap includes first-wave indexable public routes only.

It must include:

- `/`
- `/about`
- `/methodology`
- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`
- `/styles`
- `/ovens`
- `/sauce`
- `/toppings`
- `/calculator/quick`
- `/costs`

It must exclude:

- query-param URLs
- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`
- `/contact`
- `/privacy`
- `/terms`
- `/start`
- `/plan`
- `/doctor`
- `/gear`
- `/history`
- `/coach`
- downstream session routes
- dynamic guest order routes
- `/account`
- auth routes
- API routes
- private routes
- draft or debug routes

## Robots rules

The robots route is:

```text
/robots.txt
```

The implementation is:

```text
app/robots.ts
```

While `ALLOW_INDEXING=false`, robots blocks crawling broadly as part of the temporary launch protection. This is not the only protection layer; pages also use noindex metadata and response headers.

When indexing is explicitly enabled later, robots should allow first-wave public content and continue to disallow private/account/auth/debug routes, downstream session workflow routes, public token order routes and API routes. Public noindex routes remain protected by route metadata and response headers. Legacy predecessor routes that still render pages remain noindexed by page metadata even when global indexing is enabled.

Redirect-only compatibility routes are handled by server-side redirects rather than page-level noindex metadata.

Robots includes a Sitemap line so crawlers can find the sitemap when the owner is ready to submit it.

## Google Search Console manual checklist

Search Console verification is not implemented automatically. Do not add a fake verification token.

When DoughTools is ready for public indexing:

1. Verify `https://www.doughtools.app` in Google Search Console.
2. Submit `https://www.doughtools.app/sitemap.xml`.
3. Inspect:
   - `/`
   - `/guide`
   - `/guides/dough`
   - `/guide/pizza-troubleshooting`
   - `/sauce`
   - `/calculator/quick`
   - `/guide/practical-pizza-tips/fermentation-length`
4. Confirm `/session/start`, `/timer`, `/tools/bake-timer`, `/updates`, `/contact`, `/privacy` and `/terms` are not submitted through the sitemap.
5. Confirm `/coach` is not submitted through the sitemap and redirects to `/guide/pizza-troubleshooting`.
6. Confirm `/plan` redirects to `/session/start`, `/history` redirects to `/about`, `/gear` redirects to `/ovens#other-equipment`, `/doctor` redirects to `/guide/pizza-troubleshooting` and none of those routes are submitted through the sitemap.
7. Inspect representative query-param URLs:
   - `/?balls=6&ballWeight=260`
   - `/calculator/quick?quick=...`
8. Confirm clean canonical URLs.
9. Confirm private/account routes are not submitted.
10. Monitor duplicate URL patterns.

## Intentionally not implemented yet

The current SEO policy does not add:

- Google Search Console verification
- analytics or tracking
- cookie banners
- structured data for recipes, FAQ or how-to content
- public bake pages
- share-card metadata
- route removal
- query-aware route-level noindex for every stateful tool URL
- Core Web Vitals or route-level performance baseline

These should be separate future patches.
