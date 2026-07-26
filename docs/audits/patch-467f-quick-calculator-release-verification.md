# Patch 467F: Quick Calculator Release Verification

## Release Summary

- Starting commit: `d43a39a970a483f99c947edeefc0acd8f6c81ca1`
- Application deployment commit: `d43a39a970a483f99c947edeefc0acd8f6c81ca1`
- Deployment URL: `https://pizza-g987vtym2-maraforver.vercel.app`
- Production alias: `https://www.doughtools.app`
- Vercel deployment ID: `dpl_87RnwH4PLQWKUm6SysRP24q6QQ2L`
- Initial deployment status: `READY`
- Release decision: pass. No production defect required a code correction.

This release deployed Patch 467E public Quick Calculator UX and the already completed Practical Pizza Tips landing cleanup.

## Preflight

- `master` matched `origin/master` at `d43a39a970a483f99c947edeefc0acd8f6c81ca1`.
- Tracked working tree was clean before deployment.
- `.vercel/project.json` confirmed project name `pizza`.
- Production alias confirmed as `https://www.doughtools.app`.
- `npx supabase migration list` reported matching local and remote migration histories.
- No pending migration was found.
- `supabase/.temp/` remained ignored and unstaged.
- No new environment variable was required.
- Public calculator source continued to call `calculateQuickDough(input)` from the canonical engine.
- Admin Quick Calculator prototype route remained protected, noindexed and absent from sitemap.

## Automated Validation

Run before deployment:

- `npm run test -- tests/quick-calculator.test.ts tests/quick-calculator-prototypes.test.ts tests/experience-levels.test.ts tests/responsive-visual-audit.test.ts tests/practical-pizza-tips.test.ts tests/seo-config.test.ts tests/admin-roles.test.ts`
- Result: 7 files passed, 140 tests passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.

Focused coverage included Quick Calculator UI structure, engine fixtures, saved recipes, share URLs, experience-level invariance, Admin prototype protection, sitemap behavior and Practical Pizza Tips.

## Numerical Equivalence

Focused tests confirmed representative canonical calculations remain unchanged for:

- default recipe
- four pizzas at 260 g
- round pizza by diameter
- pan pizza by dimensions
- custom dough weight
- custom hydration and salt
- room-temperature fermentation
- cold fermentation
- non-default yeast
- Poolish
- Biga
- Levain
- custom ingredients
- flour blend

Compared values include total dough, dough-ball weight, flour, water, salt, yeast, optional ingredients, baker's percentages and preferment split.

## Saved Recipe Compatibility

Confirmed by focused tests:

- storage key remains `doughtools.quick-calculator.recipes.v1`
- schema remains versioned and browser-local
- maximum recipe count remains `20`
- malformed saved data is ignored safely
- old recipes load with advanced defaults
- current recipes save
- reset does not delete saved recipes

Production smoke check confirmed `Save recipe` wrote one browser-local saved recipe under the current key. Saved recipe management controls for Load, Duplicate and Delete rendered in the lower saved-recipes section. Rename/load/duplicate/delete behavior was covered by focused tests rather than mutating broader production browser data.

## Share URL Compatibility

Production and focused checks confirmed:

- new share links use the existing `quick` parameter
- generated production share URL opened `/calculator/quick` and restored values
- invalid/out-of-range shared values normalized safely
- no `NaN` output appeared
- no account, Pizza Plan, session, API or Supabase write was created

## Production Quick Calculator Verification

Route: `https://www.doughtools.app/calculator/quick`

Checked at:

- `390x844`
- `430x740`
- `1280x900`
- `1440x900`

Guidance levels checked:

- Beginner
- Enthusiast
- Pizza Nerd

Confirmed:

- compact page identity rendered
- compact three-tab guidance selector rendered
- Live Recipe rendered before the first large control section on mobile
- result order remained Total dough, Dough balls, Dough-ball weight, Flour, Water, Salt, Yeast
- Copy, Save and Share appeared directly after the result
- `Adjust the recipe` followed the result actions
- fermentation options used compact layout
- Room temperature and Cold fermentation remained readable
- desktop rendered a two-pane Workbench
- result and controls were visible in the first desktop viewport
- saved recipes remained outside the sticky result panel
- no horizontal overflow
- no console errors, hydration warnings or failed application requests

## Mobile Measurements

Production measurements:

| Viewport | Guidance | Live Recipe top | Yeast row top | Essential controls top | Document height |
| --- | --- | ---: | ---: | ---: | ---: |
| 390x844 | Beginner | 351 px | 1061 px | 1507 px | 5256 px |
| 390x844 | Enthusiast | 351 px | 1061 px | 1559 px | 5717 px |
| 390x844 | Pizza Nerd | 351 px | 1061 px | 1559 px | 6294 px |
| 430x740 | Beginner | 315 px | 1025 px | 1471 px | 5072 px |
| 430x740 | Enthusiast | 315 px | 1025 px | 1499 px | 5509 px |
| 430x740 | Pizza Nerd | 315 px | 1025 px | 1499 px | 6086 px |

Pizza Nerd opened formula, yeast/temperature and baker's percentages, while sizing, preferment, dough-temperature/flour tools and assumptions remained collapsed unless active.

## Desktop Verification

At `1280x900` and `1440x900`:

- two-pane Workbench rendered
- Live Recipe and controls began at `311 px`
- yeast row measured `831 px`
- sticky result placement remained stable
- technical details did not outrank ingredient values
- no narrow compressed cards or clipped units were observed
- no horizontal overflow was observed

## Production Functional Checks

Production browser-local smoke checks confirmed:

- pizza count and dough-ball weight inputs updated visibly
- calculated numbers updated from `4 x 260 g` to `5 x 275 g`
- guidance switching preserved input values and numerical results
- Copy recipe produced status feedback
- Save recipe produced status feedback and local saved data
- Share recipe produced a `quick` URL and status feedback
- Learn handoff linked to `/guides/dough`
- Pizza Plan handoff linked to `/session/start`
- no API or Supabase requests were made by calculator operations

The full advanced-state matrix for round sizing, pan sizing, custom weight, room/cold fermentation, yeast type, Poolish, Biga, Levain, technical tools, custom ingredients and flour blend was covered by focused pre-deployment tests. Production verification used harmless browser-local smoke data only.

## Local Data and Privacy

Confirmed in production:

- saved recipes stay in browser localStorage
- sharing creates a URL containing calculator settings
- no Pizza Plan was created
- no active session was created
- no account record was created
- no API write occurred
- no Supabase write occurred
- no cloud sync occurred
- `/session/start` is only opened through explicit `Plan a pizza` navigation
- Quick Calculator settings are not silently imported into Pizza Plan

## Practical Pizza Tips Verification

Route: `https://www.doughtools.app/guide/practical-pizza-tips`

Checked at `390x844`, `430x740`, `1280x900` and `1440x900`.

Confirmed:

- section label `Practical topics` is present
- `Upcoming topics` is absent
- exactly four topic cards render
- combined card `Leftover dough, freezing and thawing` renders
- only one card links to `/guide/practical-pizza-tips/leftover-dough`
- fermentation-length route loads
- containers-and-lids route loads
- common-problems route loads
- all cards use `Explore guide`
- no horizontal overflow
- no console or hydration errors

## Admin Prototype Protection

Confirmed:

- `/admin/quick-calculator-preview/instant` redirects unauthenticated users to `/account?next=/admin`
- prototype content was not exposed to unauthenticated users
- redirected protected route carried `noindex, nofollow, nocache`
- `/admin/quick-calculator-preview` is absent from `sitemap.xml`
- no public prototype selector appears on `/calculator/quick`

Authenticated prototype visual checks were not required for this release because the public implementation is now the production target.

## Defects

No release-blocking production defect was found. No correction commit was required.

## Checks Not Performed

- Authenticated Admin prototype visual review was not performed; unauthenticated protection and sitemap/noindex behavior were verified.
- Exhaustive production mutation of every advanced calculator state was not performed to avoid unnecessary production-browser local-data churn. Equivalent advanced states were covered by focused tests before deployment.

## Contract Confirmation

Unchanged:

- calculator engine
- formulas
- defaults
- validation ranges
- saved-recipe schema and local-storage key
- share URL parameter and encoding
- Pizza Plan
- sessions
- Account
- Guides other than the verified Practical Tips landing
- Homepage
- header, navigation and footer
- APIs
- database
- migrations

