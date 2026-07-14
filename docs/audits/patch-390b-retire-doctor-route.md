# Patch 390B: Retire legacy Doctor route

## Summary

Patch 390B retires `/doctor` as an independent DoughTools destination.

Patch 390A proved that Doctor logic was isolated from the current product:

- no Pizza Session route imported Doctor logic
- no shared calculation engine called `diagnoseDough`
- no session schema, account data or persistence contract depended on Doctor
- Doctor-specific assets were used only by Doctor
- shared modules imported by Doctor had other valid consumers and were preserved

Because no active dependency required migration, Doctor logic was not moved into Troubleshooting. The route now exists only as a compatibility redirect.

## Redirect Implementation

`app/doctor/page.tsx` now uses a Next.js server-side redirect:

```ts
permanentRedirect("/guide/pizza-troubleshooting")
```

The route does not render an intermediate page and does not use a client-side effect.

## Links Replaced

Production `/doctor` links were removed or replaced with `/guide/pizza-troubleshooting`.

Updated surfaces:

- `lib/navigation.ts`
- `lib/homepage.ts`
- `components/HomeCalculatorWorkspace.tsx`
- `lib/recipe-workflow.ts`

Recipe query parameters were not preserved because `/guide/pizza-troubleshooting` does not use Doctor recipe context.

Labels were updated from Doctor-specific wording to canonical Troubleshooting wording.

The calculator workspace also received a narrow hydration-stability fix: its first server/client render now uses a deterministic current-time fallback derived from the selected bake target, then updates to the real browser time after mount. This removed the production React hydration error that appeared while validating the replaced calculator links. Formula modules, calculator arithmetic and persisted data contracts were not changed.

## Doctor-Only Files Removed

Removed:

- `app/doctor/layout.tsx`
- `lib/dough-doctor.ts`
- `public/dough-doctor/overproofed.webp`
- `public/dough-doctor/ready.webp`
- `public/dough-doctor/sticky.webp`
- `public/dough-doctor/tight.webp`
- `public/dough-doctor/torn.webp`
- `public/dough-doctor/underproofed.webp`

The old Doctor page UI was replaced by the redirect-only page.

## Shared Modules Preserved

The following shared modules remain because they have valid non-Doctor consumers:

- `components/SiteFooter.tsx`
- `components/ExperienceLevelSelector.tsx`
- `lib/education-experience-copy.ts`
- `lib/experience-levels.ts`
- `lib/flours.ts`
- `lib/pizza-styles.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/seo-config.ts`

Doctor-only copy was removed from `lib/education-experience-copy.ts`, while planner and guide copy remain intact.

## SEO Cleanup

- `/doctor` was removed from `legacyNoindexRoutes`.
- `/doctor` was removed from `statefulQueryParamRoutes`.
- `/doctor` remains excluded from sitemap.
- `/guide/pizza-troubleshooting` remains the canonical indexed Troubleshooting route.
- No standalone Doctor metadata remains.

## Final Source Search

Production source no longer contains active references to:

- `diagnoseDough`
- `lib/dough-doctor`
- `/doctor?`
- `/dough-doctor`
- `DoctorIssue`
- `doctorIssues`
- `issueCopy`
- `doctorHref`
- `Dough Doctor` navigation labels

Historical docs and changelog entries may still mention the former Doctor route.

## Tests Updated

Updated tests cover:

- `/doctor` server-side redirect
- absence of production links to `/doctor`
- `/doctor` excluded from sitemap
- `/doctor` absent from legacy noindex configuration
- saved recipe and recipe workflow links no longer generating Doctor URLs
- education copy no longer depending on Doctor-specific content
- footer behavior treating `/doctor` as a redirect-only route
- navigation and homepage route models using Troubleshooting

## Browser Validation

Production build validation was run in clean system Chrome contexts at:

| Viewport | `/doctor` redirect | Troubleshooting loads | Back behavior | Homepage link | Calculator links | Horizontal overflow | Console errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 390 x 844 | `/guide/pizza-troubleshooting` | H1: `What went wrong with your pizza?` | Back returned to `/` | 1 Troubleshooting link, 0 Doctor links | 0 Doctor links, 0 Doctor text in `/?calculator=1` and `/?calculator=2` | None | None |
| 430 x 740 | `/guide/pizza-troubleshooting` | H1: `What went wrong with your pizza?` | Back returned to `/` | 1 Troubleshooting link, 0 Doctor links | 0 Doctor links, 0 Doctor text in `/?calculator=1` and `/?calculator=2` | None | None |
| 1280 x 900 | `/guide/pizza-troubleshooting` | H1: `What went wrong with your pizza?` | Back returned to `/` | 1 Troubleshooting link, 0 Doctor links | 0 Doctor links, 0 Doctor text in `/?calculator=1` and `/?calculator=2` | None | None |
| 1440 x 950 | `/guide/pizza-troubleshooting` | H1: `What went wrong with your pizza?` | Back returned to `/` | 1 Troubleshooting link, 0 Doctor links | 0 Doctor links, 0 Doctor text in `/?calculator=1` and `/?calculator=2` | None | None |

`/guide/pizza-troubleshooting` remains a no-footer learning route by existing site-footer policy. The redirect does not add a route-specific or canonical footer and does not alter footer-bearing routes.

## Validation Results

- Focused tests: `16 passed`, `190 tests passed`
- Full test suite: `60 passed`, `988 tests passed`
- Lint: passed
- Build: passed
- `git diff --check`: passed with CRLF warnings only
- Browser validation: passed at all four required viewports

## Scope Confirmation

No Pizza Session route, calculation formula, session schema, persistence contract, authentication flow or Party Order behavior was changed.
