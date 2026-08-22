# Patch 479C - Controlled Google Indexing Launch

Starting commit: `492c3ff5f6508e6775ff9018185f5cd666ccf69f`
Branch: `patch/479c-controlled-google-indexing-launch`
Status: **READY TO OPEN GOOGLE INDEXING**

## Executive Verdict

Patch 479C removes the production-wide indexing block and replaces it with the centralized route-aware policy introduced in Patch 479B.

Production first-wave public pages become crawlable and indexable only when `NEXT_PUBLIC_SITE_URL` is a safe non-preview production URL. Public KEEP NOINDEX routes remain crawlable but noindexed. Private, workflow, token, API and downstream session routes remain protected.

This patch does not submit the sitemap to Google, add Search Console verification, add analytics, change page content strategy, change calculations or deploy.

## First-Wave Indexable URLs

With `NEXT_PUBLIC_SITE_URL=https://www.doughtools.app`, `/sitemap.xml` contains exactly 17 URLs:

1. `https://www.doughtools.app/`
2. `https://www.doughtools.app/about`
3. `https://www.doughtools.app/methodology`
4. `https://www.doughtools.app/guide`
5. `https://www.doughtools.app/guides/dough`
6. `https://www.doughtools.app/guide/pizza-troubleshooting`
7. `https://www.doughtools.app/guide/practical-pizza-tips`
8. `https://www.doughtools.app/guide/practical-pizza-tips/leftover-dough`
9. `https://www.doughtools.app/guide/practical-pizza-tips/fermentation-length`
10. `https://www.doughtools.app/guide/practical-pizza-tips/containers-and-lids`
11. `https://www.doughtools.app/guide/practical-pizza-tips/common-problems`
12. `https://www.doughtools.app/styles`
13. `https://www.doughtools.app/ovens`
14. `https://www.doughtools.app/sauce`
15. `https://www.doughtools.app/toppings`
16. `https://www.doughtools.app/calculator/quick`
17. `https://www.doughtools.app/costs`

## KEEP NOINDEX Policy

Public routes that remain noindex:

- `/contact`
- `/privacy`
- `/terms`
- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`

These routes are not in the sitemap. They are not robots-blocked in production, so crawlers can see route metadata and the response header:

```text
X-Robots-Tag: noindex, noarchive
```

Private/workflow/token/API route classes remain more restrictive:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

## Robots Before to After

Before Patch 479C, production indexing depended on the pre-launch `ALLOW_INDEXING` flag. When disabled, robots returned:

```text
User-agent: *
Disallow: /
Sitemap: https://www.doughtools.app/sitemap.xml
```

After Patch 479C, safe non-preview production robots allow public crawling and disallow private route classes:

```text
User-agent: *
Allow: /
Disallow: /account
Disallow: /account/
Disallow: /admin
Disallow: /admin/
Disallow: /api
Disallow: /api/
...
Sitemap: https://www.doughtools.app/sitemap.xml
```

Unsafe, local and preview builds still return the broad `Disallow: /` policy.

## Representative Meta/Header Verification

Representative indexable route:

- Route: `/calculator/quick`
- Metadata with production URL: `robots.index = true`, `robots.follow = true`
- Canonical: `https://www.doughtools.app/calculator/quick`
- Sitemap: included
- X-Robots production header: no indexing-blocking header on the route

Representative public noindex route:

- Route: `/privacy`
- Metadata with production URL: `robots.index = false`, `robots.follow = true`
- Sitemap: excluded
- X-Robots production header: `noindex, noarchive`
- Robots: not blocked

Representative private route:

- Route class: `/account`
- Sitemap: excluded
- Robots: disallowed
- X-Robots production header: `noindex, nofollow, noarchive`
- Page layout also uses route-level noindex metadata

Local built-app verification with `NEXT_PUBLIC_SITE_URL=https://www.doughtools.app` and `VERCEL_ENV=production`:

| Check | Result |
|---|---|
| `/robots.txt` has global `Disallow: /` | No |
| `/robots.txt` has `Allow: /` | Yes |
| `/sitemap.xml` URL count | 17 |
| Sitemap includes `/calculator/quick` | Yes |
| Sitemap includes `/privacy` | No |
| `/calculator/quick` contains noindex | No |
| `/calculator/quick` canonical | `https://www.doughtools.app/calculator/quick` |
| `/privacy` contains noindex | Yes |
| `/privacy` X-Robots header | `noindex, noarchive` |
| `/timer` redirect | `308` to `/tools/bake-timer` |

## Sitemap Verification

The sitemap is generated exclusively from `publicIndexableRoutePaths`.

Verified behavior:

- count: 17 URLs
- all URLs use the configured production origin
- no query strings
- no `/session/start`
- no `/timer`
- no `/tools/bake-timer`
- no `/updates`
- no `/contact`
- no `/privacy`
- no `/terms`
- no account/auth/session/order/API routes

## Canonical and Redirect Verification

- `/timer` remains a query-preserving permanent redirect to `/tools/bake-timer`.
- `/timer` is not in the sitemap.
- `/tools/bake-timer` is the canonical functional timer route but remains KEEP NOINDEX for first-wave launch.
- First-wave sitemap pages use clean self-canonicals when a safe production URL is configured.
- Stateful query-param URLs canonicalize to clean base routes.

## Structured Data Validation

Patch 479C does not add schema.

The Patch 479B structured data remains:

- `WebSite`
- `Organization`

It renders only when a safe production site URL is configured and does not include fake calculator, recipe, FAQ, how-to or unsupported app schema.

## Test Results

Validation run for this patch:

- `npm test -- tests/seo-config.test.ts tests/security-launch-baseline.test.ts tests/performance-baseline.test.ts tests/install-app-pwa.test.ts tests/accessibility-baseline.test.ts tests/ovens.test.ts tests/pizza-styles.test.ts tests/session-recipe.test.ts tests/quick-calculator-prototypes.test.ts tests/homepage-version-foundation.test.ts`: passed, 10 files / 169 tests
- `npm run lint`: passed
- `NEXT_PUBLIC_SITE_URL=https://www.doughtools.app VERCEL_ENV=production npm run build`: passed
- `git diff --check`: passed

Full-suite note:

- `npm test` was attempted.
- Result: 87 files passed, 1 file failed; 1345 tests passed, 1 failed.
- Remaining failure: `tests/cloud-pizza-sessions.test.ts` expects `Your DoughTools workspace.` with a period in unchanged Account page source. This was already documented in Patch 479B and remains outside the SEO/indexing scope.

## Final Verdict

**READY TO OPEN GOOGLE INDEXING.**

Next step after review is merge/deploy approval for Patch 479C, followed by production verification. Google Search Console verification, sitemap submission and indexing requests remain separate owner actions after production behavior is confirmed.
