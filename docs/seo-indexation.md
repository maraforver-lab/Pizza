# DoughTools SEO indexation policy

Patch 23 defined the first clean search-indexing baseline for DoughTools. Patch 387 updated that baseline after the Pizza Session and Learning Center simplification work. Patch 388 retires the old `/history` editorial page as a compatibility redirect. Patch 389 retires the old `/gear` page as a compatibility redirect to the equipment section on `/ovens`. Patch 390B retires the old `/doctor` page as a compatibility redirect to Troubleshooting.

The goal is still not to open indexing automatically. The goal is to keep the public sitemap, canonical URLs, explicit noindex routes and robots behavior aligned with the current product architecture.

## Current launch state

DoughTools is live for testing, but indexing remains controlled by the centralized launch switch:

```text
ALLOW_INDEXING=false
```

Do not enable indexing in this patch.

## Public indexable route policy

Clean public routes are the routes intended to become discoverable when indexing is explicitly enabled later.

The central source of truth is `publicSeoRoutes` in `lib/seo-config.ts`.

Current public indexable routes are:

- `/`
- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/methodology`
- `/guide`
- `/session/start`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/styles`
- `/ovens`
- `/sauce`
- `/toppings`
- `/calculator/quick`
- `/timer`
- `/costs`
- `/updates`

These routes should have stable page metadata and clean canonical URLs.

## Legacy noindex and redirect routes

Patch 387 kept predecessor routes accessible but removed them from the public sitemap and assigned explicit noindex metadata. Patch 388 retires `/history` further as a server-side redirect to `/about`. Patch 389 retires `/gear` further as a server-side redirect to `/ovens#other-equipment`. Patch 390B retires `/doctor` further as a server-side redirect to `/guide/pizza-troubleshooting`.

The central source of truth is `legacyNoindexRoutes` in `lib/seo-config.ts`.

Current legacy noindex routes are:

- `/plan`
- `/coach`

These routes remain reachable from existing links until a later migration patch decides whether to redirect, merge, remove or preserve their unique logic. They must not appear in `/sitemap.xml`.

Current redirect-only legacy routes are:

- `/start` -> `/session/start`
- `/history` -> `/about`
- `/gear` -> `/ovens#other-equipment`
- `/doctor` -> `/guide/pizza-troubleshooting`

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

These routes must not appear in the sitemap.

## Stateful query-param routes

DoughTools uses query parameters so users can share calculator, planning and troubleshooting setups.

Examples:

- `/?balls=6&ballWeight=260`
- `/plan?hydration=64`
- `/sauce?balls=6`
- `/calculator/quick?quick=...`
- `/toppings?toppings=mushroom%3A35%3Araw`
- `/timer?oven=gas`

These URLs remain supported and shareable.

However, query-param variants should not create a large duplicate-content footprint in search. The current baseline is:

1. keep query-param URLs working
2. exclude query-param URLs from the sitemap
3. canonicalize query-param variants to the clean base route where metadata can be generated safely

Examples:

- `/plan?hydration=64` canonicalizes to `https://www.doughtools.app/plan` and remains explicitly noindexed by route metadata
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

The sitemap includes clean public routes only.

It must include:

- `/`
- `/session/start`
- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/sauce`
- `/calculator/quick`
- `/updates`

It must exclude:

- query-param URLs
- `/start`
- `/plan`
- `/doctor`
- `/gear`
- `/history`
- `/coach`
- downstream session routes
- `/account`
- auth routes
- private routes
- dynamic guest order routes
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

When indexing is explicitly enabled later, robots should allow public content and continue to disallow private/account/auth/debug routes. Legacy predecessor routes remain noindexed by page metadata even when global indexing is enabled.

Redirect-only compatibility routes are handled by server-side redirects rather than page-level noindex metadata.

Robots includes a Sitemap line so crawlers can find the sitemap when the owner is ready to submit it.

## Google Search Console manual checklist

Search Console verification is not implemented automatically. Do not add a fake verification token.

When DoughTools is ready for public indexing:

1. Verify `https://www.doughtools.app` in Google Search Console.
2. Submit `https://www.doughtools.app/sitemap.xml`.
3. Inspect:
   - `/`
   - `/session/start`
   - `/guide`
   - `/guides/dough`
   - `/guide/pizza-troubleshooting`
   - `/sauce`
   - `/calculator/quick`
4. Confirm `/plan` and `/coach` are not submitted through the sitemap and report noindex metadata.
5. Confirm `/history` redirects to `/about`, `/gear` redirects to `/ovens#other-equipment`, `/doctor` redirects to `/guide/pizza-troubleshooting` and none of those routes are submitted through the sitemap.
6. Inspect representative query-param URLs:
   - `/?balls=6&ballWeight=260`
   - `/calculator/quick?quick=...`
   - `/plan?hydration=64`
7. Confirm clean canonical URLs.
8. Confirm private/account routes are not submitted.
9. Monitor duplicate URL patterns.

## Intentionally not implemented yet

The current SEO policy does not add:

- Google Search Console verification
- analytics or tracking
- cookie banners
- structured data for recipes, FAQ or how-to content
- public bake pages
- share-card metadata
- redirects for `/plan` or `/coach`
- route removal
- query-aware route-level noindex for every stateful tool URL
- Core Web Vitals or route-level performance baseline

These should be separate future patches.
