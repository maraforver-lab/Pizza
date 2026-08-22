# Patch 479B - Pre-index SEO Launch Hardening

Starting commit: `220afbbe0d2a1bc13e71df12919802ff231048ef`
Branch: `patch/479b-pre-index-seo-hardening`
Source of truth: `docs/audits/patch-479a-final-pre-index-seo-audit.md`
Status: **READY FOR 479C**

## Summary

Patch 479B implements the P0 route-policy and sitemap hardening from Patch 479A and applies the justified P1 search-intent improvements that are safe before opening indexing.

Indexing is still disabled. This patch does not change `ALLOW_INDEXING`, robots launch blocking, the global X-Robots launch block, database, APIs, persistence, yeast formulas, fermentation calculations, favicon/app icons or unrelated product logic.

## P0 Findings Resolved

| 479A P0 | Resolution |
|---|---|
| Split public metadata from indexable sitemap policy | Added explicit `publicIndexableRoutePaths` and `publicNoindexRoutePaths` in `lib/seo-config.ts`. `publicSeoRoutes` remains the public metadata registry. |
| Prepare `/calculator/quick` for calculator search intent | Updated metadata to target pizza dough calculator intent and added a compact crawlable context section that explains inputs, results, yeast/hydration/fermentation relationship and next steps. |
| Resolve `/timer` and `/tools/bake-timer` duplication | Kept `/tools/bake-timer` as the canonical functional route and converted `/timer` to a query-preserving redirect. Both timer routes remain out of first-wave indexing. |

## Route Policy Implemented

Current route-policy counts:

- Public metadata routes: 24
- First-wave indexable routes: 17
- Public noindex routes: 7

First-wave indexable routes:

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

Public routes that remain noindex:

- `/contact`
- `/privacy`
- `/terms`
- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`

Private, account, admin, API, auth, order-token and downstream session routes remain protected through the existing private route policy and header protections.

## Sitemap Before to After

Before Patch 479B:

- `sitemapEntries()` mapped every `publicSeoRoutes` entry.
- This would have submitted 24 public metadata routes if indexing were enabled.
- The candidate sitemap included `/session/start`, `/timer`, `/tools/bake-timer`, `/updates`, `/contact`, `/privacy` and `/terms`.

After Patch 479B:

- `sitemapEntries()` includes only `publicIndexableRoutePaths`.
- First-wave sitemap size is 17 routes.
- Workflow, thin, duplicate and legal/support pages are omitted from the sitemap.
- Query-param variants remain excluded because canonical URL generation strips query strings.

## Quick Calculator SEO Changes

Metadata:

- Before: `Quick Dough Calculator | DoughTools`
- After: `Pizza Dough Calculator: Yeast, Hydration and Dough Balls | DoughTools`

Description:

- Before: `Calculate pizza dough ingredient amounts without creating a full pizza plan.`
- After: `Calculate pizza dough flour, water, salt and yeast from pizza count, dough-ball weight, hydration and fermentation time.`

Visible page:

- H1 changed from `Quick Dough Calculator` to `Pizza Dough Calculator`.
- Added a compact `data-quick-seo-context` section after the main calculator workspace.
- The section explains:
  - key inputs
  - ingredient results
  - yeast/hydration/fermentation relationship
  - links to methodology, dough guide and fermentation guide
- The calculator remains prominent and result-first; no large SEO article was placed before the tool.

## Fermentation Changes

`/guide/practical-pizza-tips/fermentation-length` now more explicitly owns fermentation timing search intent:

- Metadata now targets `Pizza Dough Fermentation Time Guide: 12, 24, 48 and 72 Hours`.
- Intro now says the page compares room and cold pizza dough fermentation plans.
- Added compact crawlable context explaining that time only makes sense with temperature.
- Added contextual links to:
  - `/calculator/quick`
  - `/methodology`

No yeast formulas, fermentation process rules, temperatures or calculation behavior changed.

## Timer Canonical Decision

Canonical functional timer route:

- `/tools/bake-timer`

Duplicate compatibility route:

- `/timer` now permanently redirects to `/tools/bake-timer`
- Query parameters are preserved during redirect.

Neither timer route is included in the first-wave sitemap because Patch 479A classified both as `KEEP NOINDEX`.

## Structured Data Added

Added minimal root-level structured data in `components/SeoStructuredData.tsx`:

- `WebSite`
- `Organization`

The component renders only when a safe production site URL is configured. It does not add:

- Recipe schema
- FAQ schema
- HowTo schema
- fake calculator schema
- unsupported WebApplication schema

## Internal Linking

Added two high-value footer learning links:

- `/toppings`
- `/guide/practical-pizza-tips`

Added contextual calculator/methodology links from:

- `/calculator/quick`
- `/guide/practical-pizza-tips/fermentation-length`

No repetitive SEO link block was added.

## Validation

Focused SEO/route tests:

```text
npm test -- tests/seo-config.test.ts tests/quick-calculator.test.ts tests/practical-pizza-tips.test.ts tests/standalone-bake-timer.test.ts tests/kitchen-bake-timer.test.ts tests/site-footer.test.ts tests/homepage.test.ts tests/learning-architecture.test.ts
```

Result:

```text
8 test files passed
164 tests passed
```

Additional stale-expectation tests updated after full-suite review:

```text
npm test -- tests/cta-language.test.ts tests/internal-link-governance.test.ts tests/ovens.test.ts tests/cost-calculator.test.ts tests/pizza-sauce-calculator.test.ts tests/pizza-styles.test.ts
```

Result:

```text
6 test files passed
71 tests passed
```

Full suite:

```text
npm test
```

Result:

```text
87 test files passed
1 test file failed
1345 tests passed
1 test failed
```

The remaining failure is `tests/cloud-pizza-sessions.test.ts`, which expects `Your DoughTools workspace.` with a period in `app/account/page.tsx`. Patch 479B does not change Account code, auth, sessions or account tests, so this is recorded as an unrelated stale assertion rather than corrected inside this SEO patch.

Final validation:

- `npm test -- tests/seo-config.test.ts tests/quick-calculator.test.ts tests/practical-pizza-tips.test.ts tests/standalone-bake-timer.test.ts tests/kitchen-bake-timer.test.ts tests/site-footer.test.ts tests/homepage.test.ts tests/learning-architecture.test.ts tests/cta-language.test.ts tests/internal-link-governance.test.ts tests/ovens.test.ts tests/cost-calculator.test.ts tests/pizza-sauce-calculator.test.ts tests/pizza-styles.test.ts` passed: 14 files, 235 tests
- `npm run lint` passed
- `npm run build` passed
- `git diff --check` passed

## Remaining P1/P2 Items

Not included in Patch 479B:

- Dedicated yeast calculator explainer page.
- Dedicated hydration guide.
- More granular oven setup articles.
- Recipe schema for `/sauce`; defer until visible recipe structure is audited against schema requirements.
- Query-aware route-level noindex for every possible stateful query URL.

These are not blockers for 479C if current production verification confirms the new route policy, sitemap, metadata, noindex headers and robots behavior.

## Recommendation

**READY FOR 479C.**

Patch 479C may open indexing only after deployment verification confirms:

- global indexing is still disabled before the 479C switch
- first-wave sitemap contains exactly the approved indexable route set
- public noindex routes remain noindex and receive X-Robots protection
- private/process/token/API routes remain protected
- `/calculator/quick` and fermentation metadata render correctly
- `/timer` redirects to `/tools/bake-timer`
