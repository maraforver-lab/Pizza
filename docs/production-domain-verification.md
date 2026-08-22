# DoughTools production domain verification

This checklist verifies DoughTools on the real production domain after the controlled indexing launch.

For the owner-friendly rehearsal flow, see `docs/manual-launch-rehearsal.md`.

## Intended production domain

```text
https://www.doughtools.app
```

## Required Vercel environment variables

Use this production value in Vercel:

```text
NEXT_PUBLIC_SITE_URL=https://www.doughtools.app
```

`ALLOW_INDEXING` is no longer the production indexing switch after Patch 479C. Preview deployments remain protected by the non-preview deployment check and unsafe/preview URL filtering.

## What to check in Vercel before deployment

- The `www.doughtools.app` domain is connected to the correct Vercel project.
- HTTPS is active for `https://www.doughtools.app`.
- `NEXT_PUBLIC_SITE_URL` is set to `https://www.doughtools.app`.
- Preview deployments remain noindex.
- Production uses the centralized route-aware indexing policy.
- `/robots.txt` no longer contains a global `Disallow: /` on production.
- `/sitemap.xml` contains exactly the first-wave indexable routes.
- Public KEEP NOINDEX routes still receive noindex metadata and response headers.

## Manual post-deployment checks

After a future deployment, open:

- `https://www.doughtools.app`
- `https://www.doughtools.app/calculator/quick`
- `https://www.doughtools.app/guide/practical-pizza-tips/fermentation-length`
- `https://www.doughtools.app/privacy`
- `https://www.doughtools.app/session/start`
- `https://www.doughtools.app/robots.txt`
- `https://www.doughtools.app/sitemap.xml`
- `https://www.doughtools.app/account`

Check that:

- first-wave public pages are crawlable and do not emit noindex
- `/privacy` and `/session/start` emit noindex but are not robots-blocked
- `/account` is not in `/sitemap.xml`
- query-string recipe URLs are not in `/sitemap.xml`
- no old Vercel URL appears as a canonical URL
- `doughtools.invalid` does not appear on production pages
- no broken metadata, icon or social-image requests appear

## What not to do from this checklist

- Do not submit the sitemap to Google from this checklist.
- Do not add Google Search Console verification.
- Do not request indexing.
- Do not add analytics.
- Do not publish public bake pages.

Search Console submission remains a separate owner action after production verification.
