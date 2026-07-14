# DoughTools SEO indexation policy

Patch 23 defines the first clean search-indexing baseline for DoughTools.

The goal is not to open indexing immediately. The goal is to make the route policy, canonical URLs, sitemap and robots behavior clear before DoughTools grows into more public recipe, troubleshooting and learning pages.

## Current launch state

DoughTools is live for testing, but indexing remains controlled by the existing centralized launch switch:

```text
ALLOW_INDEXING=false
```

Do not enable indexing in this patch.

## Public indexable route policy

Clean public routes are the routes intended to become discoverable when indexing is explicitly enabled later.

The central source of truth is `publicSeoRoutes` in `lib/seo-config.ts`.

Important public routes include:

- `/`
- `/session/start`
- `/guide`
- `/methodology`
- `/about`
- `/contact`
- `/privacy`
- `/terms`
- `/updates`
- `/plan`
- `/doctor`
- `/sauce`
- `/toppings`
- `/timer`

These routes should have stable page metadata and clean canonical URLs.

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
- `/doctor?hydration=64`
- `/sauce?balls=6`
- `/toppings?toppings=mushroom%3A35%3Araw`
- `/timer?oven=gas`

These URLs remain supported and shareable.

However, query-param variants should not create a large duplicate-content footprint in search. The current baseline is:

1. keep query-param URLs working
2. exclude query-param URLs from the sitemap
3. canonicalize query-param variants to the clean base route where metadata can be generated safely

Examples:

- `/plan?hydration=64` canonicalizes to `https://www.doughtools.app/plan`
- `/doctor?hydration=64` canonicalizes to `https://www.doughtools.app/doctor`
- `/?balls=4` canonicalizes to `https://www.doughtools.app/`

Route-level query-param noindex is intentionally not implemented yet because the current App Router metadata layer is static for these pages. If duplicate-content signals become a practical issue after indexing is opened, add a separate patch for query-aware robots handling.

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
- `/updates`
- `/plan`
- `/doctor`

It must exclude:

- query-param URLs
- `/account`
- auth routes
- private routes
- draft or debug routes
- public bake pages that do not exist yet

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

When indexing is explicitly enabled later, robots should allow public content and continue to disallow private/account/auth/debug routes.

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
   - `/plan`
   - `/doctor`
4. Inspect representative query-param URLs:
   - `/?balls=6&ballWeight=260`
   - `/plan?hydration=64`
   - `/doctor?hydration=64`
5. Confirm clean canonical URLs.
6. Confirm private/account routes are not submitted.
7. Monitor duplicate URL patterns.

## Intentionally not implemented yet

Patch 23 does not add:

- Google Search Console verification
- analytics or tracking
- cookie banners
- structured data for recipes, FAQ or how-to content
- public bake pages
- share-card metadata
- query-aware route-level noindex for every stateful tool URL
- Core Web Vitals or route-level performance baseline

These should be separate future patches.
