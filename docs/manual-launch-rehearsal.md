# DoughTools manual controlled-indexing verification

This checklist verifies the controlled production indexing behavior for:

```text
https://www.doughtools.app
```

It is written for a non-expert project owner. It does not deploy the site and it does not submit anything to Google Search Console.

Required production value:

```text
NEXT_PUBLIC_SITE_URL=https://www.doughtools.app
```

## 1. Before deployment

- Confirm the latest branch and commit have been reviewed and approved.
- Confirm focused SEO/indexing tests pass.
- Confirm `npm run lint` passes.
- Confirm `npm run build` passes.
- Confirm `.env.example` contains no secrets.
- Confirm contact and legal details are filled:
  - `hello@doughtools.app`
  - `Marcin Arcisz`
  - `Finland`
- Confirm no unsupported claims or placeholder copy remain on first-wave public pages.
- Confirm the site has been checked on desktop and mobile.

## 2. Vercel configuration

In the Vercel project settings, manually verify Production environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://www.doughtools.app
```

Preview deployments must remain protected. Do not add secrets to public environment variables.

Do not:

- add analytics
- add Google Search Console verification yet
- submit the sitemap to Google yet
- change build settings unless there is a clear reason

## 3. Domain configuration

Before deploying or promoting anything, verify:

- `www.doughtools.app` is connected to the correct Vercel project.
- HTTPS is active for `https://www.doughtools.app`.
- The domain does not point to an old project.
- Old Vercel preview URLs are not used as canonical URLs.
- Production pages do not show `doughtools.invalid`.

## 4. Deployment action

This checklist does not deploy the site.

When deployment is intentionally approved later:

- Merge the approved launch branch into the production branch.
- Push the production branch.
- Let Vercel build the production deployment from the Git integration.
- Verify production before submitting anything to Google.

Do not execute deployment from this documentation checklist.

## 5. Production route checks

Open:

- `https://www.doughtools.app`
- `https://www.doughtools.app/calculator/quick`
- `https://www.doughtools.app/guide/practical-pizza-tips/fermentation-length`
- `https://www.doughtools.app/guides/dough`
- `https://www.doughtools.app/sauce`
- `https://www.doughtools.app/toppings`
- `https://www.doughtools.app/ovens`
- `https://www.doughtools.app/privacy`
- `https://www.doughtools.app/session/start`
- `https://www.doughtools.app/account`
- `https://www.doughtools.app/robots.txt`
- `https://www.doughtools.app/sitemap.xml`

Check that:

- first-wave indexable routes load
- public noindex routes load but remain noindex
- `/account` is not in sitemap
- query-string recipe URLs are not in sitemap
- no major visual errors appear
- navigation and footer links work

## 6. Indexing verification

First-wave indexable routes should:

- not contain `noindex` in page metadata
- not return `X-Robots-Tag: noindex`
- have a self-canonical production URL
- appear in `/sitemap.xml`

Public noindex routes should:

- contain `noindex`
- return `X-Robots-Tag: noindex, noarchive`
- not appear in `/sitemap.xml`
- not be blocked by robots.txt

Private/workflow routes should:

- not appear in `/sitemap.xml`
- remain protected by noindex metadata and/or `X-Robots-Tag: noindex, nofollow, noarchive`
- not expose user-specific content for search

Confirm `/robots.txt` does not contain a global:

```text
Disallow: /
```

## 7. Search Console boundary

Do not submit sitemap to Google yet.

Do not request indexing yet.

Do not add Search Console verification yet unless that work is explicitly approved as a separate task.

Search Console submission remains a separate owner action.

## 8. Rollback plan

If something looks wrong after deployment:

1. Do not submit sitemap.
2. Do not request indexing.
3. Roll back the production deployment in Vercel or redeploy the previous stable version.
4. Record the issue.
5. Fix it in a new patch.
6. Redeploy only after tests pass.

This checklist does not claim rollback has been tested.
