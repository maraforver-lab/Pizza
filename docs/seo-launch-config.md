# DoughTools SEO and launch configuration

This document describes the controlled Google indexing configuration after Patch 479C.

For the production-domain checklist, see `docs/production-domain-verification.md`.
For the owner-friendly manual verification flow, see `docs/manual-launch-rehearsal.md`.
For the public route, canonical, sitemap and Search Console policy, see `docs/seo-indexation.md`.

## Current launch state

DoughTools uses centralized route-aware indexing.

Production indexing is allowed only when:

1. `NEXT_PUBLIC_SITE_URL` is configured with a safe non-preview production URL.
2. The deployment is not a Vercel preview deployment.
3. The route is part of the approved first-wave indexable route policy.

Preview, localhost, unsafe or missing-site-url builds remain globally noindex and robots-blocked.

## Environment variables

### `NEXT_PUBLIC_SITE_URL`

The intended public production URL:

```text
NEXT_PUBLIC_SITE_URL=https://www.doughtools.app
```

The app does not use Vercel preview URLs as canonical fallbacks. If this value is missing or unsafe, DoughTools falls back to the internal placeholder:

```text
https://doughtools.invalid
```

That placeholder is intentional. It prevents accidental canonical links to an old preview or staging deployment.

### Deprecated pre-launch flag

`ALLOW_INDEXING` is no longer the production indexing switch after Patch 479C. Route-aware production indexing is controlled by the safe production URL and non-preview deployment checks.

## Sitemap behavior

`/sitemap.xml` contains only the approved first-wave indexable public routes from `publicIndexableRoutePaths`.

It excludes:

- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`
- `/contact`
- `/privacy`
- `/terms`
- `/account`
- authentication routes
- private or user-specific routes
- preview or debug routes
- query-string recipe URLs
- API routes

The sitemap uses the configured safe site URL when available.

## Robots behavior

With a safe production URL, `/robots.txt` allows crawling of public content and disallows private/account/auth/debug/session/order/API route classes.

Public KEEP NOINDEX routes are not blocked by robots. They remain crawlable so crawlers can see their `noindex` metadata and `X-Robots-Tag` header.

Preview, localhost and unsafe-url builds still return a broad `Disallow: /` robots policy.

## Header behavior

`next.config.ts` applies:

- normal security headers to all routes
- `X-Robots-Tag: noindex, noarchive` for public KEEP NOINDEX routes
- `X-Robots-Tag: noindex, nofollow, noarchive` for private/workflow/token/API route classes
- global `X-Robots-Tag: noindex, nofollow, noarchive` only for unsafe, local or preview builds

## Canonical URL behavior

Canonical URLs are generated only when `NEXT_PUBLIC_SITE_URL` is configured as a safe production URL.

Stateful recipe and tool URLs canonicalize to their clean base route where route metadata is available. For example, `/calculator/quick?quick=...` resolves to the clean `/calculator/quick` canonical URL rather than becoming a separate sitemap page.

## Search Console

Patch 479C does not submit the sitemap, add Search Console verification, request indexing or add analytics.

Manual Search Console steps remain a separate owner action after the deployed 479C behavior is verified in production.
