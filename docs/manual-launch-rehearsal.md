# DoughTools manual launch rehearsal checklist

This checklist is for rehearsing a controlled production-domain deployment to:

```text
https://doughtools.app
```

It is written for a non-expert project owner. Follow it slowly, one checkbox at a time.

Important: this checklist does not deploy the site. It explains what to check before and after a future deployment. The first production-domain deployment must remain noindexed.

Required production values for the rehearsal:

```text
NEXT_PUBLIC_SITE_URL=https://doughtools.app
ALLOW_INDEXING=false
```

`ALLOW_INDEXING=false` must remain false for the first production-domain deployment.

## 1. Before deployment

- Confirm the latest local branch and commit have been reviewed and approved.
- Confirm all tests pass with `npm run test`.
- Confirm the production build passes with `npm run build`.
- Confirm noindex is active locally.
- Confirm `.env.example` contains no secrets.
- Confirm contact and legal details are filled:
  - `hello@doughtools.app`
  - `Marcin Arcisz`
  - `Finland`
- Confirm no visible placeholder text remains.
- Confirm no unsupported claims remain.
- Confirm the site has been manually checked on desktop and mobile.
- Confirm you understand that noindex means “not indexed by search engines”; it does not mean the site is private.

## 2. Vercel configuration

In the Vercel project settings, manually verify Production environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://doughtools.app
ALLOW_INDEXING=false
```

If Preview environment variables are configured, keep indexing disabled there too.

Do not:

- set `ALLOW_INDEXING=true` yet
- add analytics yet
- add Google Search Console verification yet
- change build settings unless there is a clear reason
- add secrets to public environment variables
- add fake project IDs, private tokens or private keys to documentation

## 3. Domain configuration

Before deploying or promoting anything, verify:

- `doughtools.app` is connected to the correct Vercel project.
- HTTPS is active for `https://doughtools.app`.
- You understand the `www` behavior if `www.doughtools.app` is configured.
- The domain does not point to an old project.
- Old Vercel preview URLs are not used as canonical URLs.
- Production pages do not show `doughtools.invalid` when `NEXT_PUBLIC_SITE_URL=https://doughtools.app` is configured.

Do not perform DNS changes from this checklist unless you intentionally decide to do that outside this patch.

## 4. Deployment action

This checklist does not deploy the site.

When you intentionally decide to rehearse deployment later, use one controlled approach:

### A. Git-based deployment

- Merge the approved launch branch into the production branch.
- Push the production branch.
- Let Vercel build the production deployment from the Git integration.
- Keep `ALLOW_INDEXING=false`.

### B. Manual Vercel deployment or promotion

- Use this only if you intentionally choose the manual Vercel workflow.
- Confirm the target deployment is the correct one.
- Confirm Production environment variables are still:
  - `NEXT_PUBLIC_SITE_URL=https://doughtools.app`
  - `ALLOW_INDEXING=false`

Do not execute either approach as part of this documentation patch.

## 5. Immediate post-deployment checks

After a future deployment to the real domain, manually open:

- `https://doughtools.app`
- `https://doughtools.app/about`
- `https://doughtools.app/contact`
- `https://doughtools.app/privacy`
- `https://doughtools.app/terms`
- `https://doughtools.app/methodology`
- `https://doughtools.app/robots.txt`
- `https://doughtools.app/sitemap.xml`
- `https://doughtools.app/account`

Check that:

- pages load
- no major visual errors appear
- the calculator loads
- navigation works
- footer links work
- contact email appears
- legal pages are readable
- no old placeholders appear
- `/account` is not in sitemap
- query-string recipe URLs are not in sitemap

## 6. Noindex verification

Noindex must remain active after deployment.

Browser-based checks:

- Open the homepage.
- View page source.
- Search the source for `noindex`.
- Open `https://doughtools.app/robots.txt`.
- Confirm it blocks crawling while indexing is disabled.
- Open `https://doughtools.app/sitemap.xml`.
- Confirm sitemap exists but does not include `/account` or query-string recipe URLs.

Optional command-line checks:

```text
curl -I https://doughtools.app
curl https://doughtools.app/robots.txt
curl https://doughtools.app/sitemap.xml
```

Confirm the response headers include:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

The sitemap does not override noindex. Do not ask Google to index the site yet. Do not submit sitemap to Google yet.

## 7. Visual QA on production domain

Desktop checks:

- homepage
- calculator
- navigation
- footer
- About
- Contact
- Privacy
- Terms
- Methodology

Mobile checks:

- homepage
- calculator
- mobile navigation
- footer
- Privacy
- Terms
- Methodology
- long email address
- bottom navigation spacing

Test on at least one real phone if possible.

## 8. What not to do yet

Do not yet:

- set `ALLOW_INDEXING=true`
- submit sitemap to Google
- request indexing
- announce public launch
- run paid ads
- add Google Search Console verification unless specifically planned later
- add analytics
- add public bake pages
- add share-card public URLs
- claim the product is fully launched
- delete noindex protection

## 9. Rollback plan

If something looks wrong after deployment:

1. Keep `ALLOW_INDEXING=false`.
2. Do not submit sitemap.
3. Do not announce launch.
4. Roll back the production deployment in Vercel or redeploy the previous stable version.
5. Record the issue.
6. Fix it in a new patch.
7. Redeploy only after tests pass.

This checklist does not claim rollback has been tested.

## 10. When indexing can be considered later

Indexing should only be considered after:

- the production domain works
- the noindex deployment has been checked
- legal and trust pages are reviewed
- mobile QA passes
- the calculator works in production
- sitemap is correct
- robots behavior is understood
- the owner intentionally decides to open indexing

Opening indexing must be a separate patch and process. Do not enable indexing now.
