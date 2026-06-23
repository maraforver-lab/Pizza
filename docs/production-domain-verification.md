# DoughTools production domain verification

This checklist prepares DoughTools for using the real production domain later without enabling search indexing yet.

For the owner-friendly rehearsal flow, see `docs/manual-launch-rehearsal.md`.

## Intended production domain

```text
https://doughtools.app
```

## Required Vercel environment variables

Use these safe pre-launch values in Vercel:

```text
NEXT_PUBLIC_SITE_URL=https://doughtools.app
ALLOW_INDEXING=false
```

`ALLOW_INDEXING=false` is intentional while DoughTools is still pre-launch. It keeps the site noindexed even when the real domain is configured.

## What to check in Vercel before deployment

- The `doughtools.app` domain is connected to the correct Vercel project.
- HTTPS is active for `https://doughtools.app`.
- `NEXT_PUBLIC_SITE_URL` is set to `https://doughtools.app`.
- `ALLOW_INDEXING` is set to `false`.
- Preview deployments remain noindex.
- Production remains noindex until indexing is explicitly enabled later.
- `/robots.txt` still blocks indexing.
- The `X-Robots-Tag` response header is still present.
- `/sitemap.xml` uses `https://doughtools.app` only when `NEXT_PUBLIC_SITE_URL` is configured.

## Manual post-deployment checks

After a future deployment, before any public launch:

- Open the homepage.
- Open `/robots.txt`.
- Open `/sitemap.xml`.
- Check the page source for `noindex`.
- Check response headers for `X-Robots-Tag`.
- Confirm `/account` is not in `/sitemap.xml`.
- Confirm no old Vercel URL appears as a canonical URL.
- Confirm `doughtools.invalid` does not appear on production pages when `NEXT_PUBLIC_SITE_URL=https://doughtools.app` is configured.

## What not to do yet

- Do not set `ALLOW_INDEXING=true`.
- Do not submit the sitemap to Google.
- Do not remove noindex.
- Do not publish public bake pages.
- Do not announce a public launch.

## Later indexing launch checklist

Only later, when DoughTools is ready for public launch:

- Run final visual QA.
- Review legal pages.
- Confirm the production domain.
- Confirm the sitemap.
- Confirm robots behavior.
- Remove noindex only through `ALLOW_INDEXING=true`.
- Add Google Search Console later, not now.
