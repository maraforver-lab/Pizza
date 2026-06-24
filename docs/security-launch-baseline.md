# Patch 27 security and launch-safety baseline

DoughTools is still pre-launch and protected from indexing. This document records the first security-header baseline and the checks that must happen before any broader public launch work.

This patch does not enable Google indexing, Search Console verification, analytics, tracking, payments, database changes, Supabase schema changes, calculation changes or user-flow changes.

## Configuration inspected

The patch inspected:

- `next.config.ts`
- `app/robots.ts`
- `app/sitemap.ts`
- `lib/seo-config.ts`
- existing SEO and launch documentation
- package scripts and route test coverage

There is no `vercel.json` in the repository. No middleware-based header system was present. `next.config.ts` already had a `headers()` function for `X-Robots-Tag`, so the security baseline was added there instead of creating new middleware.

## Headers added

The reusable header values live in `lib/security-headers.ts` and are applied through `next.config.ts`.

| Header | Value |
| --- | --- |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | conservative compatible baseline described below |

## CSP decision

Patch 27 implements a conservative Content Security Policy instead of a nonce-based or report-collecting policy.

The active policy is:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:; manifest-src 'self'; media-src 'self' blob:
```

Rationale:

- `frame-ancestors 'none'` protects against framing.
- `object-src 'none'` blocks legacy plugin content.
- `img-src` allows local, data, blob and HTTPS images because the app uses generated and external-style visual assets.
- `connect-src` allows HTTPS and WSS so existing Supabase/auth and future Vercel-hosted client communication are not accidentally blocked.
- `style-src 'unsafe-inline'` and `script-src 'unsafe-inline' 'unsafe-eval'` are intentionally left compatible with the current Next.js/React setup.

Deferred:

- nonce-based CSP
- `strict-dynamic`
- CSP reporting endpoints
- `report-uri` / `report-to`
- production violation monitoring

These require a separate implementation plan and production verification.

## HSTS decision

HSTS is implemented as:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

Rationale:

- DoughTools is hosted on Vercel and the production domain is HTTPS.
- This is a reasonable baseline for HTTPS-only production behavior.

Not added:

- `preload`

The preload flag should not be added until the owner is ready to satisfy and maintain browser preload-list requirements.

## Frame protection

Frame protection is implemented in two layers:

- `Content-Security-Policy` includes `frame-ancestors 'none'`.
- `X-Frame-Options` is set to `DENY` for older browser support.

## Permissions Policy

The app does not currently require camera, microphone, geolocation or payment browser APIs, so the baseline blocks them:

```text
camera=(), microphone=(), geolocation=(), payment=()
```

If future features need one of these APIs, that feature should update this policy deliberately.

## Indexing protection remains unchanged

Patch 27 does not change the centralized indexing controls.

Current protection still depends on:

- `ALLOW_INDEXING`
- safe `NEXT_PUBLIC_SITE_URL`
- preview-environment protection
- robots metadata
- `robots.txt`
- `X-Robots-Tag`

When `ALLOW_INDEXING=false`, DoughTools remains noindexed and `robots.txt` blocks crawlers.

Patch 27 does not:

- set `ALLOW_INDEXING=true`
- add Google Search Console verification
- submit a sitemap
- add analytics
- add tracking
- add cookies

## What was not changed

Patch 27 does not change:

- dough formulas
- yeast calculations
- calculator progressive disclosure
- recipe URL behavior
- saved recipes
- local saved bakes
- Journal IndexedDB
- Planner timing logic
- Dough Doctor diagnosis logic
- authentication
- Supabase behavior
- analytics or tracking
- payments
- routes or navigation
- noindex/indexing behavior

## Production verification checklist

After deployment to Vercel, verify:

1. Open the production site.
2. Check response headers for:
   - `/`
   - `/start`
   - `/plan`
   - `/doctor`
   - `/account`
   - `/robots.txt`
   - `/sitemap.xml`
3. Confirm these headers are present:
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
   - `X-Frame-Options`
   - `Strict-Transport-Security`
   - `Content-Security-Policy`
   - `X-Robots-Tag` while indexing remains disabled
4. Confirm `robots.txt` still blocks crawling when `ALLOW_INDEXING=false`.
5. Confirm `/sitemap.xml` still renders and does not include `/account`.
6. Confirm no Google indexing is enabled.
7. Confirm no Search Console verification or sitemap submission was added.
8. Confirm the calculator still works.
9. Confirm Supabase login still works if auth is available.
10. Confirm no CSP console violations appear in production browser testing.

Local `next start` validation is useful, but Vercel production headers must still be checked after deployment because hosting platforms can add, normalize or override headers.

## Future hardening backlog

Consider later, in separate patches:

- stricter CSP without `unsafe-inline` and `unsafe-eval`
- nonce or hash-based script policy
- CSP report-only trial before stricter enforcement
- production CSP violation monitoring
- security-header checks in deployment QA
- review whether `includeSubDomains` remains appropriate after any future subdomain changes
- privacy-first field measurement only after a separate analytics decision

