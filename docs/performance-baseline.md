# DoughTools performance and rendering baseline

Patch 25 creates a practical baseline for performance and rendering work before broader public launch and before calculator progressive-disclosure changes.

This is a measurement and planning document. It does not enable indexing, add analytics, change calculations, change storage, add tracking, or redesign the product.

## Scope

Routes checked for the core baseline:

- `/`
- `/start`
- `/plan`
- `/doctor`
- `/guide`
- `/updates`
- `/account`
- `/robots.txt`
- `/sitemap.xml`

Additional routes included in the production build summary where available:

- `/about`
- `/privacy`
- `/terms`
- `/methodology`
- `/sauce`
- `/toppings`
- `/timer`
- `/journal`

## Build output summary

The Patch 25 baseline used `npm run build` with Next.js 15.5.19.

The build completed successfully and generated 31 static pages. The relevant route output was:

| Route | Build type shown | Route size | First Load JS |
| --- | --- | ---: | ---: |
| `/` | Static | 18.8 kB | 132 kB |
| `/start` | Static | 6.23 kB | 114 kB |
| `/plan` | Static | 18 kB | 131 kB |
| `/doctor` | Static | 9.61 kB | 123 kB |
| `/guide` | Static | 10.1 kB | 121 kB |
| `/updates` | Static | 2.61 kB | 116 kB |
| `/account` | Static | 4.77 kB | 176 kB |
| `/robots.txt` | Static | 189 B | 103 kB |
| `/sitemap.xml` | Static | 189 B | 103 kB |
| `/sauce` | Static | 6.06 kB | 119 kB |
| `/toppings` | Static | 12.7 kB | 126 kB |
| `/timer` | Static | 5.3 kB | 113 kB |
| `/journal` | Static | 7.26 kB | 120 kB |
| `/about` | Static | 178 B | 106 kB |
| `/privacy` | Static | 178 B | 106 kB |
| `/terms` | Static | 178 B | 106 kB |
| `/methodology` | Static | 178 B | 106 kB |

The only dynamic app route shown by the build was `/auth/callback`.

The build output does not provide real Core Web Vitals field data, CPU timing, interaction latency, image decode timing, memory use, or mobile network waterfall details.

## Production-mode route smoke test

After building, the local production server should be checked with `next start` or `npm run start`.

Patch 25 smoke-test target routes:

- `/`
- `/start`
- `/plan`
- `/doctor`
- `/guide`
- `/updates`
- `/account`
- `/robots.txt`
- `/sitemap.xml`

Expected result: each route returns HTTP 200 in local production mode and shows no obvious server runtime error.

This is a local production-mode check only. It is not a deployed production validation.

## Core Web Vitals status

Real Core Web Vitals field data is not available from this patch.

Local build output and route smoke tests are useful, but they are not equivalent to field Core Web Vitals. They do not prove real-user Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift, Time to First Byte, or mobile network performance.

Future work should include:

- a Lighthouse/lab pass for the core routes
- mobile throttling checks for the calculator and planner
- production field measurement only after a separate privacy-first analytics or measurement decision

No analytics, tracking, Search Console verification, or sitemap submission was added in this patch.

## Client-heavy and rendering observations

Confirmed findings:

- The inspected core routes build successfully.
- `/`, `/start`, `/plan`, `/doctor`, `/guide`, `/updates`, and `/account` are shown as static in the Next.js build output.
- `/auth/callback` is the only dynamic app route shown in the build output.
- Many application pages currently start with `"use client"`, including the homepage, Start Here, Planner, Dough Doctor, Guide, Updates and Account.
- Start Here, Guide and Updates contain meaningful visible copy and headings in the page source.
- Planner and Dough Doctor provide meaningful page shells and headings, but they also rely on client-side state for recipe-aware interactivity.
- The homepage calculator is intentionally interactive and carries one of the larger route sizes.
- `/account` has the largest First Load JS in the current build output, likely because account/auth UI and Supabase client behavior are client-side.

Possible risks to watch later:

- Interactive pages may be heavier than necessary if content-only sections remain client components.
- The homepage can become heavier if more calculators or non-critical widgets are imported into the first load.
- The Planner and Dough Doctor should avoid pulling unrelated tool logic into their route bundles.
- The Updates page is currently client-rendered even though it is mostly static content.

Not verified in this patch:

- browser console hydration warnings across all routes
- Lighthouse performance scores
- CPU cost on low-end mobile devices
- real-user Core Web Vitals
- network waterfall or image decode timing

## Initial route budget proposal

These are starting guidelines, not enforced budgets.

- Homepage `/`: keep focused on the main workflow and avoid importing unrelated tools into first load.
- `/start`: keep mostly static, content-first and fast to scan.
- `/updates`: keep static/data-driven and avoid turning it into an interactive feed.
- `/guide`: keep content-first; split large interactive education widgets if added later.
- `/plan`: interactive planning is expected, but avoid unrelated calculators or heavy visual modules.
- `/doctor`: interactive diagnosis is expected, but image and diagnostic logic should remain scoped to the route.
- Calculator/homepage: interactive by design; future progressive disclosure should reduce visible complexity without increasing first-load cost.
- `/account`: monitor carefully because it currently has the highest First Load JS among core checked routes.
- `/robots.txt` and `/sitemap.xml`: keep simple and fast.

## Optimization backlog

Priority ideas for later patches:

1. Review which content-first routes can become server components or split their interactive islands.
2. Keep Start Here and Updates mostly static.
3. Avoid importing calculator-heavy modules into informational pages.
4. Consider lazy-loading non-critical sections on the homepage if route size grows.
5. Review shared modules that are imported by the homepage, Planner and Dough Doctor.
6. Check whether `/account` can reduce first-load client cost without changing auth behavior.
7. Run Lighthouse/lab checks on `/`, `/start`, `/plan`, `/doctor`, `/guide`, `/updates` and `/account`.
8. Add privacy-first field measurement only after a separate product/legal decision.
9. Use this Patch 25 baseline to guide Patch 26 calculator progressive disclosure so the beginner experience improves without making first load heavier.

## Indexing and tracking safety

Google indexing remains disabled.

This patch did not:

- change `ALLOW_INDEXING`
- remove noindex protection
- change robots behavior to allow indexing
- submit a sitemap
- add Search Console verification
- add Google Analytics
- add analytics or tracking
- add cookies

## Regression safety

This patch is documentation, changelog and tests only.

It does not change:

- dough formulas
- yeast calculations
- saved recipes
- shared recipe URLs
- planner timing logic
- Dough Doctor diagnosis logic
- BakeResult storage
- Journal IndexedDB
- authentication or Supabase behavior
- experience-level storage keys or canonical values
- product routes or navigation
