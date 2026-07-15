# Patch 404: Final navigation, footer and sitemap alignment

## Executive summary

Patch 404 aligns DoughTools navigation exposure with the post-cleanup product architecture.

The production model after Patch 403 is:

- Core product: Pizza Session, starting at `/session/start`.
- Learning system: `/guide`, `/guides/dough`, `/sauce`, `/ovens`, `/styles`, `/guide/pizza-troubleshooting`.
- Secondary utility: `/calculator/quick`.
- Contextual or demoted utilities: `/toppings`, `/timer`, `/costs`.
- Trust and account: `/about`, `/contact`, `/updates`, `/methodology`, `/privacy`, `/terms`, `/account`.
- Compatibility redirects: `/start`, `/history`, `/gear`, `/doctor`, `/plan`, `/coach`.

This patch removes the generic global Tools concept from active navigation. It keeps Quick Calculator as the only globally exposed utility, keeps Toppings and Timer contextual, keeps Costs as a demoted footer and homepage discovery item, and preserves the 18-route sitemap policy from the current SEO configuration.

No formulas, Pizza Session schema, persistence, authentication, Party Orders, route behavior, redirects or deployment configuration were changed.

## Starting state

- Branch: `patch/404-final-navigation-alignment`
- Audited starting commit: `62da12ba5d184d2364b878b41c56ca7ef4957a37`
- Starting commit label: `Patch 403: Clarify Quick Calculator role`
- Audit date: 2026-07-15
- Current page route files: 36
- Redirect-only page routes: 6
- Public sitemap entries: 18
- API route files: 11
- Metadata route files: 3

Patch 386 was requested as a source, but `docs/audits/patch-386-product-architecture-page-tree-audit.md` is not present in the current repository. Current source, Patch 399 and Patches 400-403 were used as the source of truth.

## Sources inspected

- `docs/audits/patch-387-canonical-indexing-and-legacy-retirement.md`
- `docs/audits/patch-399-remaining-utility-role-audit.md`
- `docs/audits/patch-400-kitchen-bake-timer-integration.md`
- `docs/audits/patch-401-contextual-toppings-guidance.md`
- `docs/audits/patch-402-simplify-playful-costs.md`
- `docs/audits/patch-403-quick-calculator-role-clarity.md`
- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/seo-indexation.md`
- `lib/navigation.ts`
- `components/GlobalToolNavigation.tsx`
- `components/SiteFooter.tsx`
- `lib/homepage.ts`
- `lib/seo-config.ts`
- `app/sitemap.ts`
- `app/robots.ts`
- route pages under `app/**/page.tsx`
- navigation, homepage, footer, sitemap, indexing and legacy-route tests

## Current route inventory

Current page routes:

| Category | Routes |
| --- | --- |
| Core public | `/`, `/about`, `/contact`, `/updates`, `/methodology`, `/privacy`, `/terms` |
| Learning | `/guide`, `/guides/dough`, `/guide/pizza-troubleshooting`, `/sauce`, `/styles`, `/ovens` |
| Utilities | `/calculator/quick`, `/toppings`, `/costs`, `/timer` |
| Pizza Session | `/session/start`, `/session/recipe`, `/session/shopping`, `/session/timeline`, `/session/kitchen`, `/session/review` |
| Account | `/account`, `/account/pizza-sessions/[id]`, `/account/party-orders`, `/account/party-orders/new`, `/account/party-orders/[id]` |
| Guest and Party Orders | `/order/[publicToken]`, `/order/[publicToken]/edit/[submissionToken]` |
| Redirect-only compatibility | `/start`, `/history`, `/gear`, `/doctor`, `/plan`, `/coach` |

Redirect targets:

| Route | Target | Status |
| --- | --- | --- |
| `/start` | `/session/start` | server-side `permanentRedirect` |
| `/history` | `/about` | server-side `permanentRedirect` |
| `/gear` | `/ovens#other-equipment` | server-side `permanentRedirect` |
| `/doctor` | `/guide/pizza-troubleshooting` | server-side `permanentRedirect` |
| `/plan` | `/session/start` | server-side `permanentRedirect` |
| `/coach` | `/guide/pizza-troubleshooting` | server-side `permanentRedirect` |

## Final navigation model

### Desktop header

The desktop header now exposes:

- Plan my next pizza -> `/session/start`
- Learning Center menu -> `/guide`, `/guides/dough`, `/sauce`, `/ovens`, `/styles`, `/guide/pizza-troubleshooting`
- Quick Calculator -> `/calculator/quick`
- About -> `/about`
- Account -> `/account`

Removed from desktop global navigation:

- generic Tools menu
- `/toppings`
- `/timer`
- `/costs`
- retired routes `/start`, `/history`, `/gear`, `/doctor`, `/plan`, `/coach`

### Mobile navigation

The mobile menu now exposes the same architecture in a compact order:

1. Plan my next pizza
2. Learning Center group
3. Quick Calculator
4. About
5. Account

The mobile menu keeps accessible menu semantics, `aria-expanded`, `aria-controls`, focusable menu items, Escape close behavior and click-outside close behavior.

### Footer

Footer groups now map to product roles:

| Group | Routes |
| --- | --- |
| Learn | `/guide`, `/guides/dough`, `/sauce`, `/ovens`, `/styles`, `/guide/pizza-troubleshooting` |
| Product | `/session/start`, `/calculator/quick`, `/account/party-orders`, `/costs` |
| Company | `/about`, `/updates`, `/contact`, `/methodology`, `/privacy`, `/terms` |

Toppings and Timer are intentionally not footer-wide destinations. They remain public and indexable, but are reached contextually or directly.

### Homepage exposure

Homepage `coreTools` now favors the canonical product and learning system:

- Pizza Session -> `/session/start`
- Quick Calculator -> `/calculator/quick`
- Learning Center -> `/guide`
- Dough Guide -> `/guides/dough`
- Pizza Sauce -> `/sauce`
- Troubleshooting -> `/guide/pizza-troubleshooting`

Homepage `secondaryTools` now contains demoted discovery routes:

- Pizza Styles -> `/styles`
- Ovens -> `/ovens`
- Topping Balance Lab -> `/toppings`
- Pizza Bake Timer -> `/timer`
- Pizza costs -> `/costs`
- Updates -> `/updates`

This keeps utility discovery available without presenting every utility as an equal product pillar.

## Sitemap and indexing alignment

The current sitemap remains 18 public routes:

1. `/`
2. `/about`
3. `/contact`
4. `/privacy`
5. `/terms`
6. `/methodology`
7. `/guide`
8. `/session/start`
9. `/guides/dough`
10. `/guide/pizza-troubleshooting`
11. `/styles`
12. `/ovens`
13. `/sauce`
14. `/toppings`
15. `/calculator/quick`
16. `/timer`
17. `/costs`
18. `/updates`

No sitemap behavior changed in this patch. The final navigation now matches that policy more closely:

- globally promoted: `/session/start`, `/guide`, `/calculator/quick`, `/about`, `/account`
- learning routes: grouped under Learning Center
- contextual utilities: indexable, but not top-level navigation pillars
- retired routes: redirect-only and excluded from sitemap

## Internal-link findings

Production-source searches found no active production links to retired public routes:

- `/start`
- `/history`
- `/gear`
- `/doctor`
- `/plan`
- `/coach`

Expected utility links remain:

- `/toppings` from contextual learning/session surfaces: Sauce, Ovens, Shopping and Kitchen.
- `/costs` from footer and homepage secondary discovery.
- `/timer` from homepage secondary discovery and Kitchen timer integration source, not global header/footer navigation.

## Changed files

| File | Purpose |
| --- | --- |
| `lib/navigation.ts` | Replaced the old mixed Tools model with final primary, learning, secondary and account navigation groups. |
| `components/GlobalToolNavigation.tsx` | Removed global Tools menu; added compact Learning Center dropdown and mobile menu aligned to the final architecture. |
| `components/SiteFooter.tsx` | Reorganized footer groups into Learn, Product and Company. |
| `lib/homepage.ts` | Rebalanced homepage core and secondary discovery tool lists. |
| `docs/global-responsive-ux-rules.md` | Added the canonical navigation placement rule. |
| `tests/navigation.test.ts` | Updated navigation model tests for the final architecture. |
| `tests/accessibility-baseline.test.ts` | Updated header accessibility/source guardrails. |
| `tests/site-footer.test.ts` | Updated footer group expectations. |
| `tests/homepage.test.ts` | Updated homepage/header/footer exposure expectations. |
| `tests/learning-architecture.test.ts` | Updated Learning Center dropdown expectations. |
| `tests/internal-link-governance.test.ts` | Added explicit regression coverage for retired routes and contextual utility exposure. |
| `docs/audits/patch-404-final-navigation-footer-sitemap-alignment.md` | This implementation report. |

## Governance update

`docs/global-responsive-ux-rules.md` now records the final rule:

> Global navigation exposes the core Pizza Session, canonical learning entry, one clearly secondary Quick Calculator utility, About and Account. Supporting utilities appear contextually or in demoted footer positions rather than as equal product pillars.

This is the single governance update for Patch 404.

## Browser validation plan

Production-build browser validation covers:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Validation targets:

- desktop header: Plan, Learning Center, Quick Calculator, About, Account
- mobile menu: Plan first, Learning Center group, Quick Calculator, About, Account
- no global Tools menu
- no global header/mobile exposure for Toppings, Timer or Costs
- footer groups on public pages
- no footer on focused Pizza Session step pages that intentionally omit it
- sitemap route list
- legacy redirects
- no horizontal overflow or clipped navigation
- no console errors or hydration errors

## Validation results

Focused tests:

- `npm run test -- tests/navigation.test.ts tests/accessibility-baseline.test.ts tests/site-footer.test.ts tests/homepage.test.ts tests/seo-config.test.ts tests/legacy-route-indexing.test.ts tests/internal-link-governance.test.ts tests/install-app-pwa.test.ts tests/learning-architecture.test.ts --reporter=dot`
- Result: 9 files passed, 103 tests passed.

Post-build focused header/browser-source tests:

- `npm run test -- tests/navigation.test.ts tests/accessibility-baseline.test.ts tests/homepage.test.ts tests/learning-architecture.test.ts tests/responsive-visual-audit.test.ts --reporter=dot`
- Result: 5 files passed, 59 tests passed.

Full test suite:

- `npm run test -- --reporter=dot`
- Result: 62 files passed, 1011 tests passed.

Lint:

- `npm run lint`
- Result: passed.

Production build:

- `npm run build`
- Result: passed. Next.js generated 43 static pages and completed type checking.

Diff check:

- `git diff --check`
- Result: passed. Git reported only existing CRLF conversion warnings.

Browser validation:

- Production server: `next start -p 3007`
- Browser method: headless Chrome through Chrome DevTools Protocol.
- Note: the browser plugin runtime could not initialize in this environment because it failed with `Cannot redefine property: process`; the bundled Playwright package was also missing `playwright-core`, so CDP was used as the local browser fallback.
- Result: passed.

Validated viewports:

| Viewport | Result |
| --- | --- |
| 390 x 844 | Passed |
| 430 x 740 | Passed |
| 1280 x 900 | Passed |
| 1440 x 950 | Passed |

Validated browser checks:

- Desktop header exposes Plan my next pizza, Learning Center, Quick Calculator, About and Account.
- Desktop Learning Center menu exposes Learning Center, Dough Guide, Pizza Sauce, Ovens, Pizza Styles and Troubleshooting.
- Mobile menu exposes Plan my next pizza first, then Learning Center links, Quick Calculator, About and Account.
- No global header or mobile menu exposure for Toppings, Timer or Costs.
- No generic Tools menu.
- Public pages render the canonical footer with Learn, Product and Company groups.
- Focused Pizza Session step pages do not render the canonical site footer.
- Sitemap contains 18 public routes.
- Sitemap excludes `/start`, `/history`, `/gear`, `/doctor`, `/plan` and `/coach`.
- Legacy redirects resolve to their canonical destinations without loops.
- No horizontal overflow was detected in the validated viewports.
- No console/runtime errors were detected.

## Protected invariants

Patch 404 did not change:

- Pizza Session calculations
- dough, sauce, topping, cost or timer formulas
- session schema
- local persistence
- cloud persistence
- authentication
- account data
- Party Orders
- redirect behavior
- sitemap behavior
- robots behavior
- SEO metadata content
- deployment state

## Final recommendation

The final navigation architecture is now consistent enough for the next product decision:

- Keep `/session/start` as the sole primary product entry.
- Keep Learning Center as the only broad public learning parent.
- Keep Quick Calculator as the only globally exposed standalone utility.
- Keep Toppings, Timer and Costs indexable but not equal product pillars.
- Keep retired routes as redirect-only compatibility URLs.
- Handle any future utility exposure changes in small patches, not through another broad navigation rewrite.
