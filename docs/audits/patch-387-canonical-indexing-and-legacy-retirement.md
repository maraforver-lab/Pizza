# Patch 387: Canonical indexing and legacy retirement

## Executive summary

Patch 387 aligns DoughTools indexing with the current product architecture after the Pizza Session and learning-page simplification sequence.

The canonical public sitemap now promotes the routes that match the current product:

- `/session/start`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/calculator/quick`

The predecessor routes remain accessible, but are removed from the sitemap and explicitly noindexed:

- `/plan`
- `/doctor`
- `/gear`
- `/history`
- `/coach`

No route was removed, redirected or redesigned in this patch. `/start` remains a compatibility redirect to `/session/start` and remains excluded from the sitemap.

## Audit basis

- Branch: `patch/387-canonical-indexing-legacy-retirement`
- Starting commit: `646828f4`
- Product base: current `master` after Patch 385
- Audit date: 2026-07-14
- Production deployment: not performed

## Previous sitemap policy

Before Patch 387, `publicSeoRoutes` exposed several predecessor routes as public indexable destinations:

| Route | Previous state |
| --- | --- |
| `/` | In sitemap |
| `/about` | In sitemap |
| `/contact` | In sitemap |
| `/privacy` | In sitemap |
| `/terms` | In sitemap |
| `/methodology` | In sitemap |
| `/guide` | In sitemap |
| `/styles` | In sitemap |
| `/doctor` | In sitemap |
| `/ovens` | In sitemap |
| `/gear` | In sitemap |
| `/sauce` | In sitemap |
| `/toppings` | In sitemap |
| `/timer` | In sitemap |
| `/plan` | In sitemap |
| `/costs` | In sitemap |
| `/history` | In sitemap |
| `/coach` | In sitemap |
| `/updates` | In sitemap |

The main mismatch was that `/session/start`, `/guides/dough`, `/guide/pizza-troubleshooting` and `/calculator/quick` were valuable current routes but were not represented in the public sitemap, while `/plan`, `/doctor`, `/gear`, `/history` and `/coach` were still treated as first-class indexable destinations.

## Final sitemap policy

Patch 387 makes `publicSeoRoutes` the current canonical public list:

| Route | Final state | Rationale |
| --- | --- | --- |
| `/` | In sitemap | Public product entry |
| `/about` | In sitemap | Trust page |
| `/contact` | In sitemap | Support page |
| `/privacy` | In sitemap | Legal page |
| `/terms` | In sitemap | Legal page |
| `/methodology` | In sitemap | Trust and calculation explanation |
| `/guide` | In sitemap | Learning Center |
| `/session/start` | In sitemap | Canonical Pizza Session entry |
| `/guides/dough` | In sitemap | Canonical dough guide |
| `/guide/pizza-troubleshooting` | In sitemap | Canonical troubleshooting guide |
| `/styles` | In sitemap | Current learning route |
| `/ovens` | In sitemap | Current learning route |
| `/sauce` | In sitemap | Current sauce recipe and quantity tool |
| `/toppings` | In sitemap | Current supporting utility |
| `/calculator/quick` | In sitemap | Current standalone quick calculator |
| `/timer` | In sitemap | Retained for future Kitchen Mode decision |
| `/costs` | In sitemap | Retained supporting utility |
| `/updates` | In sitemap | Trust/product updates |

Removed from sitemap and explicit noindex:

| Route | Final state | Recommended eventual target |
| --- | --- | --- |
| `/plan` | Accessible, noindex | Redirect to `/session/start` or migrate unique schedule details into `/session/timeline` before removal |
| `/doctor` | Accessible, noindex | Merge useful diagnosis logic into `/guide/pizza-troubleshooting` |
| `/gear` | Accessible, noindex | Move practical setup guidance into `/ovens` or Learning Center |
| `/history` | Accessible, noindex | Redirect to `/about` or remove after compatibility review |
| `/coach` | Accessible, noindex | Investigate useful advice logic, then merge into troubleshooting, review or remove |

## Implementation summary

- Added centralized `legacyNoindexRoutes` to `lib/seo-config.ts`.
- Added `metadataForLegacyRoute()` to produce explicit `noindex, nofollow, nocache` metadata for the five predecessor routes.
- Removed `/plan`, `/doctor`, `/gear`, `/history` and `/coach` from `publicSeoRoutes`, so they no longer appear in `/sitemap.xml`.
- Added `/session/start`, `/guides/dough`, `/guide/pizza-troubleshooting` and `/calculator/quick` to `publicSeoRoutes`.
- Updated the five legacy route layouts to use `metadataForLegacyRoute()`.
- Updated canonical route metadata for `/guides/dough`, `/guide/pizza-troubleshooting`, `/calculator/quick` and `/session/start` to read from the centralized SEO config.
- Updated `docs/seo-indexation.md` so the durable SEO policy matches the code.

## Route behavior preservation

Patch 387 does not change the page components for `/plan`, `/doctor`, `/gear`, `/history` or `/coach`; it only changes their metadata and sitemap membership.

Source tests confirm these pages remain accessible and do not call `redirect()` or `permanentRedirect()`:

| Route | Route-specific marker preserved |
| --- | --- |
| `/plan` | `doughtools-active-plan-v1` |
| `/doctor` | `diagnoseDough` |
| `/gear` | `doughtools-gear-v1` |
| `/history` | `pizza-history` |
| `/coach` | `buildCoachAdvice` |

`/start` remains implemented by `app/start/page.tsx` using `permanentRedirect("/session/start")`.

## Legacy source audit

### `/plan`

Current route-specific code includes URL-derived recipe settings, local `doughtools-active-plan-v1` state, schedule mode, anchor time, completion tracking, beginner guidance, `buildDoughInstructions()`, `scheduleInstructions()` and `nextScheduledStep()`.

Future deletion guidance:

- Delete the `/plan` page UI and local storage key only after confirming Timeline covers the remaining useful scheduling job.
- Preserve or migrate any unique schedule explanation that is not already in `/session/timeline`.
- Shared instruction and schedule helpers should be deleted only if no other route or test still needs them.

### `/doctor`

Current route-specific code uses `diagnoseDough()`, `doctorIssues`, `issueCopy`, current recipe URL settings and visual issue cards.

Future deletion guidance:

- Migrate any useful interactive diagnosis into `/guide/pizza-troubleshooting`.
- Delete the page UI after links and compatibility routing are settled.
- Keep `lib/dough-doctor.ts` only if the troubleshooting guide or tests still use its issue model.

### `/gear`

Current route-specific code uses `gearItems`, filter state, local `doughtools-gear-v1` checklist state, gear images and setup/launch guidance.

Future deletion guidance:

- Migrate concise setup, launching and safety guidance into `/ovens` or `/guide` only if still useful.
- Delete checklist state and gear-only images if no migrated surface uses them.

### `/history`

Current route-specific code is editorial. It has image-backed sections, source links and no calculation, persistence or API dependency.

Future deletion guidance:

- This can likely be redirected or removed with low product risk.
- Preserve source references only if they support About, Methodology or Learning Center content.

### `/coach`

Current route-specific code uses `buildCoachAdvice()`, current recipe URL settings, a goal selector and an issue selector.

Future deletion guidance:

- Investigate whether `buildCoachAdvice()` contains guidance that should survive in Review, Troubleshooting or another contextual route.
- Delete the standalone route after the useful advice logic is either migrated or intentionally retired.

## Internal-link status

Patch 387 intentionally does not change navigation, footer, homepage or contextual links. Existing internal links to predecessor routes remain so direct product behavior does not change inside this SEO patch.

Known live source references remain in:

- `lib/navigation.ts`
- `lib/homepage.ts`
- `components/HomeCalculatorWorkspace.tsx`
- `components/guide/PizzaTroubleshootingGuideClient.tsx`
- `lib/pizza-style-education.ts`
- `lib/recipe-workflow.ts`
- legacy route pages themselves

These should be addressed in later implementation patches, not as hidden scope inside Patch 387.

## Sitemap and robots validation

Local production-build HTTP validation:

- `/sitemap.xml` includes `/session/start`, `/guides/dough`, `/guide/pizza-troubleshooting` and `/calculator/quick`.
- `/sitemap.xml` excludes `/start`, `/plan`, `/doctor`, `/gear`, `/history` and `/coach`.
- `/robots.txt` still returns launch-safe broad blocking while `ALLOW_INDEXING` is not enabled:
  - `User-Agent: *`
  - `Disallow: /`
  - `Sitemap: https://doughtools.invalid/sitemap.xml`

Unit tests also validate the production-domain variant with `NEXT_PUBLIC_SITE_URL=https://www.doughtools.app`.

## Browser validation

Production build was validated at:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Routes checked:

- `/session/start`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/calculator/quick`
- `/plan`
- `/doctor`
- `/gear`
- `/history`
- `/coach`
- `/start`

Findings:

- All checked page routes loaded.
- No horizontal overflow was detected on any checked route or viewport.
- `/start` redirected to `/session/start`.
- Legacy pages rendered `noindex, nofollow, nocache`.
- Canonical public pages rendered the expected titles from centralized SEO metadata.
- Because the local environment does not enable indexing, public pages also render noindex locally through the launch switch; tests cover the `ALLOW_INDEXING=true` production behavior.
- `/session/start`, `/guides/dough` and `/guide/pizza-troubleshooting` still do not render a canonical footer in the current production structure; this patch did not add or remove footers.

Approximate screen counts:

| Route | 390x844 | 430x740 | 1280x900 | 1440x950 |
| --- | ---: | ---: | ---: | ---: |
| `/session/start` | 1.1 | 1.1 | 1.1 | 1.1 |
| `/guides/dough` | 3.8 | 4.2 | 2.9 | 2.7 |
| `/guide/pizza-troubleshooting` | 4.9 | 5.3 | 2.4 | 2.2 |
| `/calculator/quick` | 7.3 | 8.2 | 3.7 | 3.5 |
| `/plan` | 14.8 | 16.3 | 13.2 | 12.5 |
| `/doctor` | 3.4 | 3.8 | 2.7 | 2.5 |
| `/gear` | 11.0 | 12.5 | 5.8 | 5.5 |
| `/history` | 16.7 | 18.3 | 9.6 | 9.1 |
| `/coach` | 3.2 | 3.4 | 1.8 | 1.7 |

## Tests and checks

Focused tests:

- `npm run test -- tests/seo-config.test.ts tests/legacy-route-indexing.test.ts tests/start-here.test.ts tests/quick-calculator.test.ts tests/dough-guide.test.ts tests/pizza-troubleshooting-guide.test.ts tests/navigation.test.ts tests/homepage.test.ts`
- Result: 8 files passed, 198 tests passed.

Full validation:

- `npm run test`: 60 files passed, 982 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

## Future patch recommendations

Patch 388 candidate: remove or redirect the clearest predecessor routes after link cleanup.

Suggested sequence:

1. Replace internal links to `/plan`, `/doctor`, `/gear`, `/history` and `/coach` with canonical destinations where behavior is clearly equivalent.
2. Decide `/plan` and `/doctor` first because they still participate in recipe handoff paths.
3. Migrate any useful Doctor logic into `/guide/pizza-troubleshooting`.
4. Migrate any useful Gear content into `/ovens` or Learning Center.
5. Redirect `/history` after deciding whether About needs any of its editorial evidence.
6. Investigate `buildCoachAdvice()` before deleting `/coach`.

## Final recommendation

Keep Patch 387 as an SEO and audit boundary only. The indexable public page tree is now aligned with the current product, while older routes remain available long enough for a safe follow-up cleanup patch.
