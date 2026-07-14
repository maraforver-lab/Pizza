# Patch 393: Product integrity and session state audit

## 1. Executive summary

Patch 393 audited the current `master` state after the legacy route cleanup sequence. This is documentation only. No production code, tests, routes, formulas, schemas, persistence behavior, authentication, SEO behavior or deployment configuration were changed.

Audited starting commit: `61e2533b` (`Patch 392B: Retire legacy Coach route`)

Audit branch: `patch/393-product-integrity-state-audit`

Audit date: July 14, 2026

Current active Pizza Session schema version: `PIZZA_SESSION_SCHEMA_VERSION = 1`

Current test inventory: 60 test files, approximately 986 `it`/`test` cases.

Route inventory:

| Count | Value |
| --- | ---: |
| Source page routes | 36 |
| Session page routes | 6 |
| Account/management page routes | 5 |
| Public guest dynamic page routes | 2 |
| API/auth route handlers | 11 |
| Metadata routes | 4 |
| Total source route entries | 51 |
| Public indexable SEO routes | 18 |
| Redirect-only compatibility pages | 6 |

Previous patch commits relevant to this audit:

| Patch | Commit |
| --- | --- |
| Patch 370 | `308fe6b0` |
| Patch 373 | `e052e730` |
| Patch 374 | `c7d357e7` |
| Patch 378 | `5fa82233`, `67dc5b59` |
| Patch 380 | `deb1ca74` |
| Patch 387 | `721e2984` |
| Patch 390B | `bc584221` |
| Patch 391B | `8e85127e` |
| Patch 392B | `61e2533b` |

High-level product judgment: the product spine is now coherent. The active experience is clearly `/session/start -> /session/recipe -> /session/shopping -> /session/timeline -> /session/kitchen -> /session/review`. The remaining friction is not another legacy route. It is the prominence and role clarity of the remaining utilities, plus state visibility and cloud verification around Pizza Session continuity.

Critical issue A conclusion: confirmed display-only consistency gap. The stored `experienceLevel` stayed stable in source, tests and anonymous browser scenarios, but the visible level label/badge is not consistently rendered across session steps. The mismatch begins at `/session/recipe`, where the stored level is correct but no explicit visible "Guidance mode" or level label appears. The UI then relies mostly on accent styling and route-specific controls.

Critical issue B conclusion: not reproducible due to missing signed-in cross-device environment. Source and tests show Kitchen local writes, full-session cloud payload serialization, API acceptance and restore all preserve `timeline` and `stepRuntime`. Anonymous browser testing confirmed local Kitchen runtime writes. A real signed-in cloud row and cross-device continuation were not safely available in this audit, so cloud persistence cannot be declared fully verified end to end.

## 2. Audit scope and method

Read and inspected:

- `docs/audits/patch-377-mobile-first-product-audit.md`
- `docs/audits/patch-378-mobile-shopping-checklist-first.md`
- `docs/audits/patch-379-start-legacy-redirect.md`
- `docs/audits/patch-380-timeline-action-first.md`
- `docs/audits/patch-381-guide-learning-center-simplification.md`
- `docs/audits/patch-382-sauce-recipe-quantity-clarity.md`
- `docs/audits/patch-383-sauce-quantity-consistency.md`
- `docs/audits/patch-384-ovens-practical-baking-guide.md`
- `docs/audits/patch-385-styles-comparison-and-selection.md`
- `docs/audits/patch-387-canonical-indexing-and-legacy-retirement.md`
- `docs/audits/patch-388-retire-history-route.md`
- `docs/audits/patch-389-retire-gear-route.md`
- `docs/audits/patch-390a-doctor-dependency-audit.md`
- `docs/audits/patch-390b-retire-doctor-route.md`
- `docs/audits/patch-391a-plan-dependency-audit.md`
- `docs/audits/patch-391b-retire-plan-route.md`
- `docs/audits/patch-392a-coach-dependency-audit.md`
- `docs/audits/patch-392b-retire-coach-route.md`
- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/design-system.md`
- `docs/visual-style-guide.md`
- `docs/sitewide-hero-and-imagery-system.md`
- `docs/pizza-session-autosave-and-resume.md`

Source inspection covered:

- `app/**/page.tsx`
- `app/**/route.ts`
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx`
- `lib/navigation.ts`
- `lib/seo-config.ts`
- `lib/experience-levels.ts`
- `components/ExperienceLevelSelector.tsx`
- `app/session/start/page.tsx`
- all current Pizza Session step pages
- `components/session/CloudPizzaSessionSync.tsx`
- `components/session/SavePizzaSessionToAccount.tsx`
- `lib/cloud-pizza-session-client.ts`
- `lib/cloud-pizza-session-restore.ts`
- `lib/cloud-pizza-sessions.ts`
- `app/api/pizza-sessions/active/route.ts`
- `lib/pizza-session.ts`
- `lib/pizza-session-storage.ts`
- `lib/pizza-session-step-runtime.ts`
- `lib/pizza-session-kitchen.ts`
- tests covering session, Kitchen, cloud, navigation, SEO and legacy redirects

Validation run:

- full route inventory
- repository-wide route, link, storage, experience-level and Kitchen persistence searches
- focused test run: 14 files, 438 tests
- production build
- browser validation at 390x844, 430x740, 1280x900 and 1440x950
- redirect status validation with redirects disabled
- `git diff --check`
- `git status --short`

The full automated suite was not required because the patch changed documentation only.

## 3. Current route inventory

Page routes:

| Route | Classification | Notes |
| --- | --- | --- |
| `/` | Public product home | Product entry, calculator workspace, guidance selector |
| `/about` | Trust/support | Founder and product story |
| `/contact` | Support | Contact and feedback |
| `/updates` | Trust/support | Product updates |
| `/methodology` | Trust/technical | Calculation method |
| `/privacy` | Legal | Privacy notice |
| `/terms` | Legal | Terms |
| `/guide` | Learning | Learning Center hub |
| `/guides/dough` | Learning | Canonical dough guide |
| `/guide/pizza-troubleshooting` | Learning | Canonical troubleshooting |
| `/sauce` | Supporting product/learning | Sauce recipe and quantities |
| `/styles` | Learning | Style comparison |
| `/ovens` | Learning | Oven guide plus compact equipment |
| `/calculator/quick` | Utility | Standalone quick dough calculator |
| `/toppings` | Utility/supporting product | Topping balance lab |
| `/costs` | Utility | Cost calculator |
| `/timer` | Utility | Standalone bake timer |
| `/session/start` | Core product | Canonical Pizza Session start |
| `/session/recipe` | Core product | Dough Plan |
| `/session/shopping` | Core product | Shopping checklist and menu allocation |
| `/session/timeline` | Core product | Action-first schedule |
| `/session/kitchen` | Core product | Kitchen Mode |
| `/session/review` | Core product | Review and completion |
| `/account` | Account/management | Account workspace |
| `/account/pizza-sessions/[id]` | Account/management | Completed session detail |
| `/account/party-orders` | Account/management | Party Order list |
| `/account/party-orders/new` | Account/management | New Party Order |
| `/account/party-orders/[id]` | Account/management | Party Order detail |
| `/order/[publicToken]` | Public guest | Public Party Order submission |
| `/order/[publicToken]/edit/[submissionToken]` | Public guest | Public submission edit |
| `/start` | Compatibility redirect | `308` to `/session/start` |
| `/history` | Compatibility redirect | `308` to `/about` |
| `/gear` | Compatibility redirect | `308` to `/ovens#other-equipment` |
| `/doctor` | Compatibility redirect | `308` to `/guide/pizza-troubleshooting` |
| `/plan` | Compatibility redirect | `308` to `/session/start` |
| `/coach` | Compatibility redirect | `308` to `/guide/pizza-troubleshooting` |

API and technical routes:

| Route file | Role |
| --- | --- |
| `app/api/pizza-sessions/active/route.ts` | Active Pizza Session cloud create, sync, restore, delete |
| `app/api/pizza-sessions/history/route.ts` | Completed session history |
| `app/api/pizza-sessions/history/[id]/route.ts` | Completed session detail and delete/update |
| `app/api/pizza-sessions/history/[id]/photo/route.ts` | Completed session photo |
| `app/api/party-orders/route.ts` | Party Order create/list |
| `app/api/party-orders/[id]/route.ts` | Party Order detail/update |
| `app/api/party-orders/[id]/session-handoff/route.ts` | Party Order to Pizza Session handoff |
| `app/api/party-orders/[id]/submissions/[submissionId]/route.ts` | Party Order submission management |
| `app/api/party-orders/public/[publicToken]/submissions/route.ts` | Public Party Order submission create |
| `app/api/party-orders/public/[publicToken]/submissions/[editToken]/route.ts` | Public Party Order submission edit |
| `app/auth/callback/route.ts` | Supabase auth callback |
| `app/sitemap.ts` | Sitemap |
| `app/robots.ts` | Robots |
| `app/manifest.ts` | Web app manifest |
| `app/opengraph-image.tsx` | Open Graph image |

## 4. Current page tree

```text
/
|-- Core Pizza Session
|   |-- /session/start
|   |-- /session/recipe
|   |-- /session/shopping
|   |-- /session/timeline
|   |-- /session/kitchen
|   `-- /session/review
|-- Learning
|   |-- /guide
|   |-- /guides/dough
|   |-- /guide/pizza-troubleshooting
|   |-- /sauce
|   |-- /styles
|   `-- /ovens
|-- Supporting utilities
|   |-- /calculator/quick
|   |-- /toppings
|   |-- /costs
|   `-- /timer
|-- Account and Party Orders
|   |-- /account
|   |-- /account/pizza-sessions/[id]
|   |-- /account/party-orders
|   |-- /account/party-orders/new
|   |-- /account/party-orders/[id]
|   |-- /order/[publicToken]
|   `-- /order/[publicToken]/edit/[submissionToken]
|-- Trust, support and legal
|   |-- /about
|   |-- /contact
|   |-- /updates
|   |-- /methodology
|   |-- /privacy
|   `-- /terms
`-- Compatibility redirects
    |-- /start -> /session/start
    |-- /history -> /about
    |-- /gear -> /ovens#other-equipment
    |-- /doctor -> /guide/pizza-troubleshooting
    |-- /plan -> /session/start
    `-- /coach -> /guide/pizza-troubleshooting
```

## 5. Navigation and sitemap alignment

`lib/navigation.ts` currently exposes:

- Make pizza: `/session/start`, `/?calculator=1`, `/sauce`, `/toppings`, `/timer`
- Learn and troubleshoot: `/guide/pizza-troubleshooting`, `/styles`, `/guide`, `/guides/dough`, `/ovens`
- My DoughTools: `/?calculator=1#my-recipes`, `/account`
- More tools: `/costs`, `/updates`

Sitemap/indexing from `lib/seo-config.ts` includes 18 public SEO routes:

```text
/
/about
/contact
/privacy
/terms
/methodology
/guide
/session/start
/guides/dough
/guide/pizza-troubleshooting
/styles
/ovens
/sauce
/toppings
/calculator/quick
/timer
/costs
/updates
```

`legacyNoindexRoutes` is empty because retired legacy pages are redirect-only and excluded from sitemap.

Alignment findings:

- The core Pizza Session spine is clear and indexed at `/session/start`.
- Session downstream routes are not indexed, which is correct for stateful workflow pages.
- The four remaining utilities are all indexed and exposed in navigation or homepage/footer surfaces.
- The current navigation still exposes several product concepts alongside the canonical Pizza Session, especially Calculator, Sauce Calculator, Topping Balance Lab, Baking Timer and Cost Calculator.
- Footer exposes selected tools and trust routes; this remains useful but contributes to utility prominence.
- Redirect-only routes are not linked in active production surfaces according to source search and tests.

## 6. Remaining utility assessment

| Route | User job | Unique value | Competes with Pizza Session? | Recommendation |
| --- | --- | --- | --- | --- |
| `/calculator/quick` | Calculate dough without starting a session | High: fast standalone dough calculation, saved quick recipes | Medium: can look like an alternate entry product | Keep, but position as secondary utility and make relationship to `/session/start` explicit |
| `/toppings` | Understand topping load, sauce, cheese and moisture | High: visual and calculation-heavy topping education | Low to medium: Shopping now owns active session topping allocation | Keep, but demote to contextual support from Shopping, Sauce, Ovens and Troubleshooting |
| `/costs` | Estimate pizza night cost | Medium: useful but outside cooking workflow | Low: not the same user job as Pizza Session | Keep, but demote; consider noindex or footer-only if analytics show low use |
| `/timer` | Time a bake with a focused utility | Medium: real browser timer behavior | Medium: Kitchen Mode also handles bake steps | Keep as utility for now; investigate integration or contextual launch from Kitchen bake step |

The utilities are no longer legacy in the same sense as `/plan` or `/coach`, but they are still overexposed relative to the now-clear Pizza Session spine.

## 7. Experience-level intended contract

Canonical implementation: `lib/experience-levels.ts`

| Internal id | Display label | Persisted value | URL value | Fallback | Visual accent |
| --- | --- | --- | --- | --- | --- |
| `beginner` | Beginner | `beginner` | Not session-canonical | Default | green |
| `enthusiast` | Enthusiast | `enthusiast` | Not session-canonical | None | orange |
| `pizza_nerd` | Pizza Nerd | `pizza_nerd` | Not session-canonical | None | pink-red |

Legacy aliases:

| Legacy value | Normalized value |
| --- | --- |
| `intermediate` | `enthusiast` |
| `advanced` | `pizza_nerd` |

Safe default: `beginner`.

Global preference storage key: `doughtools.experienceLevel`.

Pizza Session canonical field: `PizzaSession.experienceLevel`.

## 8. Experience-level source inventory

| Source | File | Behavior |
| --- | --- | --- |
| Homepage guidance selector | `components/HomepageGuidanceLevelSection.tsx` | Writes global preference through `writeExperienceLevelPreference` |
| Homepage calculator workspace | `components/HomeCalculatorWorkspace.tsx` | Reads global preference, uses `ExperienceLevelSelector`, affects calculator disclosure and recipe handoff copy |
| Quick Calculator | `components/quick-calculator/QuickDoughCalculator.tsx` | Reads and writes global preference |
| Account guidance preference | `components/account/AccountGuidancePreference.tsx` | Reads and writes global preference |
| Dough Guide | `components/guide/DoughGuidePageClient.tsx` | Reads global preference for learning depth, does not write |
| Session Start | `app/session/start/page.tsx` | Reads global preference for new in-memory draft; uses active session value when active session exists |
| Pizza Session object | `lib/pizza-session.ts` | Normalizes `experienceLevel` through `normalizeExperienceLevel` |
| Cloud session payload | `lib/cloud-pizza-sessions.ts` | Sends entire `session_data`, including `experienceLevel` |
| Cloud restore | `lib/cloud-pizza-session-restore.ts` | `migratePizzaSession` normalizes and saves restored session locally |

No account profile field or database-specific experience-level preference was found. The account component is a UI over the same browser-local preference, not a cloud profile value.

## 9. Experience-level precedence matrix

| Route | Primary source | Fallback 1 | Fallback 2 | Normalization | Can overwrite session? |
| --- | --- | --- | --- | --- | --- |
| `/session/start` | Active `PizzaSession.experienceLevel` if active session exists | `doughtools.experienceLevel` for new draft | `beginner` | `createPizzaSession` and storage helper | Yes, when saving wizard patches from current in-memory `experienceLevel` |
| `/session/recipe` | Active `PizzaSession.experienceLevel` | session migration fallback | `beginner` if invalid/missing | `migratePizzaSession` | No direct level UI; updates preserve session field |
| `/session/shopping` | Active `PizzaSession.experienceLevel` | session migration fallback | `beginner` | `migratePizzaSession` | No |
| `/session/timeline` | Active `PizzaSession.experienceLevel` | session migration fallback | `beginner` | `migratePizzaSession` | No |
| `/session/kitchen` | Active `PizzaSession.experienceLevel` | `getExperienceLevelConfig` fallback | `beginner` | `normalizeExperienceLevel` | No |
| `/session/review` | Active `PizzaSession.experienceLevel` | session migration fallback | `beginner` | `migratePizzaSession` | No |
| `/account` | Global browser preference | `beginner` | none | `readExperienceLevelPreference` | No active session overwrite |
| `/account/pizza-sessions/[id]` | Completed row `session_data.experienceLevel` if used by detail | migration fallback | `beginner` | `migratePizzaSession` | No |
| `/calculator/quick` | Global browser preference | `beginner` | none | `readExperienceLevelPreference` | No session overwrite |

No downstream session route was found reading the global preference instead of the session field.

## 10. Experience-level full lifecycle trace

| Transition | Source object | Field | Write/read function | Result |
| --- | --- | --- | --- | --- |
| User selects level on home/calculator/account | browser localStorage | `doughtools.experienceLevel` | `writeExperienceLevelPreference` | Global preference updated |
| `/session/start` opens without active session | preference -> draft session | `experienceLevel` | `readExperienceLevelPreference`, `createPlanningDraftSession` | New draft gets preference value |
| Explicit creation | draft session -> local active session | `experienceLevel` | `savePizzaSession`, `setActivePizzaSession` | Active session stores canonical value |
| Recipe generation | active session | `experienceLevel` | `generateAndSaveActiveSessionRecipe` | Session field preserved |
| Shopping generation | active session | `experienceLevel` | `generateAndSaveActiveShoppingList` | Session field preserved |
| Timeline generation | active session | `experienceLevel` | `generateAndSaveActivePizzaSessionTimeline` | Session field preserved |
| Kitchen open | active session | `experienceLevel` | `getActivePizzaSession`, `getKitchenExperienceGuidance` | Guidance reads session value |
| Review | active session | `experienceLevel` | `getActivePizzaSession`, `completeSessionReview` | Completion preserves session object |
| Cloud save | active session | full session | `cloudPizzaSessionPayload` | `session_data` includes level |
| Cloud restore | cloud row | `session_data.experienceLevel` | `restoreCloudPizzaSessionToLocal`, `migratePizzaSession` | Restored local session preserves level |

Focused tests explicitly cover stale global preference not overwriting an existing Pizza Nerd session.

## 11. Experience-level visual indicator audit

| Surface | Stored source | Visible label | Visual style | Controls/guidance |
| --- | --- | --- | --- | --- |
| Homepage | global preference | Visible selected card | selected card styling | Full selector |
| Home calculator | global preference | Visible selector/badge | selector card styling | Controls disclosure |
| Quick Calculator | global preference | Visible selector area | mode-specific presentation | Calculator group visibility |
| Account | global preference | `Guidance mode: X` badge | selector badge classes | Account preference selector |
| `/session/start` | draft/session value | No visible badge | page background accent | Pizza Nerd-only dough-ball and yeast controls |
| `/session/recipe` | session value | No visible badge | hero accent via `SessionStepHero` | Pizza Nerd controls source-gated |
| `/session/shopping` | session value | No visible badge | hero accent | No route-specific level label |
| `/session/timeline` | session value | No visible badge | hero accent | `getTimelineNote(step, session.experienceLevel)` |
| `/session/kitchen` | session value | Desktop-only `X mode` card; mobile label hidden in closed details | `experience.cardClassName` | `getKitchenExperienceGuidance` |
| `/session/review` | session value | No visible badge | hero accent | Review copy modules exist, but visible form is not obviously labelled by level |

Observed browser result at 390x844:

- stored `experienceLevel` remained `beginner`, `enthusiast` and `pizza_nerd` respectively through Recipe, Shopping, Timeline, Kitchen and Review route visits.
- visible route text usually did not include Beginner, Enthusiast or Pizza Nerd.
- no horizontal overflow was found.

This explains a likely owner-observed symptom: the level may appear to change or disappear because explicit level UI is inconsistent, even when the canonical stored value is stable.

## 12. Experience-level browser scenarios

Anonymous production-build browser scenarios were run for:

- Beginner
- Enthusiast
- Pizza Nerd

Each scenario selected the level through the homepage UI, created a session through `/session/start`, then visited:

- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`

Results:

| Level selected | Stored preference | Stored active session value | Route where stored mismatch began | Visible mismatch |
| --- | --- | --- | --- | --- |
| Beginner | `beginner` | `beginner` on all inspected routes | None | Label absent after start |
| Enthusiast | `enthusiast` | `enthusiast` on all inspected routes | None | Label absent after start |
| Pizza Nerd | `pizza_nerd` | `pizza_nerd` on all inspected routes | None | Label/control visibility inconsistent by route and viewport |

Reload/backward navigation source analysis:

- session route reads are from local active session.
- migration normalizes unknown/missing values to `beginner`.
- no route-level global preference read was found downstream of `/session/start`.

Signed-in cloud restore:

- source and tests show cloud restore preserves `experienceLevel`.
- real signed-in cross-device verification was not performed in this audit.

## 13. Experience-level root-cause conclusion

Classification: confirmed display-only inconsistency.

Exact route where mismatch begins: `/session/recipe`, immediately after the explicit Pizza Session creation handoff.

Root cause:

- The canonical data field is stable: `PizzaSession.experienceLevel`.
- Downstream routes use `session.experienceLevel`.
- The visual contract is not stable: many session routes do not render a visible label/badge and rely on accent styling or hidden/desktop-only context.
- `SessionStepHero` accepts `level` but only applies a corner accent, not a visible level label.
- Kitchen has a more explicit desktop-only mode card, which can make it feel like the level changed later even though the stored value did not.

Not confirmed:

- persisted-data inconsistency
- source-precedence inconsistency
- cloud serialization/restore inconsistency
- Quick Calculator preference leaking into an already active session

## 14. Kitchen persistence intended contract

Canonical active-session fields for Kitchen continuity:

| State item | Field |
| --- | --- |
| Active route/progress | `currentStep`, `status`, `lastRoute` |
| Timeline steps | `timeline.steps[].status` |
| Runtime start/completion | `stepRuntime[stepId].actualStartedAt`, `stepRuntime[stepId].actualCompletedAt` |
| Timeline target and anchor | `timeline.targetEatTime`, `timeline.anchorTime`, `targetEatTime`, `targetBakeTime` |
| Save ordering | `updatedAt`, `lastSavedAt` |
| Recipe basis | `recipeSnapshot`, `recipeParams`, fermentation and oven fields |

The canonical local object is `PizzaSession` stored under `doughtools:pizza-sessions-v1`, with active pointer `doughtools:active-pizza-session-id`.

The cloud object stores the whole session in `pizza_sessions.session_data`.

## 15. Kitchen write-path graph

```text
Kitchen click
-> app/session/kitchen/page.tsx markDone/startCurrentStep/completeCurrentStep
-> lib/pizza-session-step-runtime.ts startPizzaSessionTimelineStep
   or lib/pizza-session-kitchen.ts completeKitchenTimelineStep
-> lib/pizza-session-storage.ts updatePizzaSession
-> savePizzaSession updates updatedAt and lastSavedAt
-> React setSession(updated)
-> components/session/CloudPizzaSessionSync effect
-> queueCloudActivePizzaSessionSave(session)
-> syncCloudBackedPizzaSession or saveCloudActivePizzaSession
-> POST/PATCH /api/pizza-sessions/active
-> cloudPizzaSessionPayload(session)
-> Supabase pizza_sessions.session_data
-> later GET /api/pizza-sessions/active
-> restoreCloudPizzaSessionToLocal
```

Write-path details:

| Arrow | Function/file | Sync behavior | Test/source coverage |
| --- | --- | --- | --- |
| Start work step | `startPizzaSessionTimelineStep` | synchronous local update | `pizza-session-timeline.test.ts`, browser scenario |
| Complete Kitchen step | `completeKitchenTimelineStep` | synchronous local update | `pizza-session-kitchen.test.ts` |
| Local persistence | `updatePizzaSession`, `savePizzaSession` | writes localStorage, updates timestamps | `pizza-session.test.ts` |
| Sync trigger | `CloudPizzaSessionSync` | React effect on session object and timestamp key | `cloud-pizza-sessions.test.ts` source coverage |
| Queue | `queueCloudActivePizzaSessionSave` | one active save plus latest queued save | `cloud-pizza-sessions.test.ts` source coverage |
| API validation | `migratePizzaSession` in active route | rejects invalid payload | `cloud-pizza-sessions.test.ts` |
| DB payload | `cloudPizzaSessionPayload` | stores full `session_data` | unit/source coverage |
| Restore | `restoreCloudPizzaSessionToLocal` | saves migrated cloud row locally | unit coverage |

## 16. Kitchen read/restore graph

```text
/session/kitchen
-> getActivePizzaSession()
-> getKitchenModeState(session)
-> timelineStepsForPlanningSummaryDisplay(...)
-> applyPizzaSessionStepRuntime(session.timeline.steps, session.stepRuntime)
-> first todo action step is current Kitchen step
```

Cloud restore:

```text
GET /api/pizza-sessions/active
-> normalizeCloudPizzaSessionRow
-> row.session_data as PizzaSession
-> restoreCloudPizzaSessionToLocal(row)
-> savePizzaSession(session)
-> setActivePizzaSession(restored.id)
-> markCloudBackedPizzaSession(restored.id, row.id)
-> pizzaSessionContinueHref(restored)
```

Merge precedence:

- `/session/start` checks local active session and signed-in cloud active row.
- If both exist and IDs differ, it shows an explicit conflict choice.
- It does not silently replace local with cloud when there is a conflict.
- Cloud stale-write protection compares `session.updatedAt` values inside `session_data`.
- `ContinuePizzaSessionCard` prioritizes cloud active sessions for signed-in continuation.

## 17. Patch 373 and 374 contract verification

Patch 373 claims checked:

- active-session cloud save queue exists: yes, `queueCloudActivePizzaSessionSave`
- missing cloud row creation: yes, non-cloud-backed active session calls `saveCloudActivePizzaSession`
- queued save before navigation from start: yes, `/session/start` queues before `router.push("/session/recipe")`
- stale overwrite rejection: yes, active API rejects older `session.updatedAt`
- downstream synchronization: yes, Recipe, Shopping, Timeline, Kitchen and Review render `CloudPizzaSessionSync`

Patch 374 claims checked:

- Kitchen progress writes local session state: yes
- `stepRuntime` is canonical for actual work start/completion timestamps: yes
- timeline step status changes are stored in `timeline.steps`
- transition writes update `updatedAt` and `lastSavedAt`: yes through `savePizzaSession`
- Kitchen consumes persisted `stepRuntime`: yes through `applyPizzaSessionStepRuntime`

Later refactor risk:

- `SavePizzaSessionToAccount` has a snapshot key that omits `experienceLevel`, `timeline` and `stepRuntime`. This component is for Dough Plan account save, not Kitchen transition sync. Because Kitchen pages use `CloudPizzaSessionSync`, it is not a confirmed Kitchen loss path, but it is a test gap for account-save trigger semantics.

## 18. Kitchen signed-in scenarios

Signed-in test capability was not safely available in this audit. No test account or safe development database session was used.

What was verified:

- anonymous local Kitchen entry and runtime start write through production browser
- source path for signed-in save queue and API payload
- focused cloud tests for `stepRuntime` serialization and restore
- redirect and viewport behavior

What was not verified:

- real Supabase row after entering Kitchen
- real Supabase row after completing one or more Kitchen steps
- cross-device continuation from another browser signed into the same account
- stale cloud response with live network timing
- rapid writes against a real remote database

Therefore Kitchen cloud persistence remains source- and test-supported, but not live-cloud confirmed.

## 19. Kitchen persistence matrix

| State item | Local write | Cloud payload | API accepted | DB stored | GET restored | Kitchen consumed |
| --- | --- | --- | --- | --- | --- | --- |
| Experience level | `PizzaSession.experienceLevel` | full `session_data` | `migratePizzaSession` | yes in JSONB | yes | yes |
| Current Kitchen step | `currentStep` plus derived first todo | full `session_data` and `current_step` | yes | yes | yes | yes |
| Completed steps | `timeline.steps[].status` | full `session_data` | yes | yes | yes | yes |
| `stepRuntime` | `stepRuntime[stepId]` | full `session_data` | yes | yes | yes | yes |
| Timeline transition state | `timeline`, `status`, `currentStep` | full `session_data` | yes | yes | yes | yes |
| `updatedAt` | `savePizzaSession` | inside `session_data` | stale comparison | yes | yes | yes |
| route/phase state | `lastRoute`, `currentStep`, `status` | full `session_data` | yes | yes | yes | yes |

## 20. Kitchen root-cause conclusion

Classification: not reproducible due to missing signed-in environment.

No confirmed Kitchen persistence bug was found in source or local production browser behavior.

Disproven by source/local evidence:

- Kitchen transition updates local state but does not update `updatedAt`: disproven, `savePizzaSession` updates it.
- serializer strips Kitchen fields: disproven, `cloudPizzaSessionPayload` stores full session.
- API normalization discards Kitchen fields: disproven, `migratePizzaSession` clones `timeline` and `stepRuntime`.
- Kitchen reads only derived timeline and ignores runtime: disproven, `applyPizzaSessionStepRuntime` consumes runtime.
- progress is written only to completed history: disproven, active session is updated.

Plausible remaining risks:

- real cloud queue/network ordering was not observed with a signed-in account.
- immediate navigation after a Timeline start relies on the next route's `CloudPizzaSessionSync` if the Timeline effect unmounts before firing.
- account-save snapshot omission could create false confidence around what has been saved from Dough Plan, though Kitchen pages have their own sync path.

## 21. Existing test coverage and gaps

Focused validation run:

```text
Test Files  14 passed (14)
Tests       438 passed (438)
Duration    1.67s
```

Files run:

- `tests/experience-levels.test.ts`
- `tests/start-pizza-session-wizard.test.ts`
- `tests/pizza-session.test.ts`
- `tests/session-recipe.test.ts`
- `tests/pizza-session-shopping-list.test.ts`
- `tests/pizza-session-timeline.test.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/pizza-session-review.test.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/navigation.test.ts`
- `tests/seo-config.test.ts`
- `tests/legacy-route-indexing.test.ts`
- `tests/homepage.test.ts`
- `tests/quick-calculator.test.ts`

Coverage strengths:

- experience-level canonical values, default and legacy normalization
- stale preference does not overwrite active Pizza Nerd session
- cloud restore preserves `experienceLevel`
- Kitchen local step start/completion and `stepRuntime`
- cloud row normalization preserves Kitchen progress
- route redirects and SEO sitemap exclusions

Coverage gaps:

- no full browser test asserts visible level labels on every Pizza Session route
- no test requires `SessionStepHero` to render visible level text
- no live signed-in cloud test asserts Kitchen progress in Supabase after every transition
- no cross-device browser test restores Kitchen position from cloud
- no rapid real-network queue-order test
- several cloud tests are source-string tests rather than behavioral network tests

## 22. Confirmed bugs

Confirmed bug 1: display-only experience-level continuity gap.

Setup:

1. Select Beginner, Enthusiast or Pizza Nerd through homepage UI.
2. Create a Pizza Session through `/session/start`.
3. Visit Recipe, Shopping, Timeline, Kitchen and Review.

Expected:

- The selected level remains both stored and visibly understandable through the workflow.

Actual:

- The stored active-session value remains correct.
- Most session routes do not show a visible level label/badge.
- Kitchen's explicit level treatment is desktop-only or inside help details, making the experience feel inconsistent.

Relevant code paths:

- `app/session/start/page.tsx` reads preference and sets `PizzaSession.experienceLevel`.
- `components/session/SessionStepHero.tsx` applies only `getExperienceLevelCornerAccentStyle(level)`.
- `app/session/kitchen/page.tsx` renders a desktop-only `X mode` card and details-based guidance.

No persisted-data bug was confirmed for experience level.

No Kitchen cloud bug was confirmed without signed-in runtime access.

## 23. Disproven hypotheses

Experience-level hypotheses:

| Hypothesis | Result | Evidence |
| --- | --- | --- |
| Session value missing after creation | Disproven | Browser and tests show canonical value stored |
| Nerd normalizes to default | Disproven | `normalizeExperienceLevel("pizza_nerd")` returns `pizza_nerd` |
| Downstream routes read global preference | Disproven | Downstream pages read `session.experienceLevel` |
| Cloud payload omits level | Disproven by source/tests | `cloudPizzaSessionPayload` stores full session |
| Quick Calculator overwrites active session | Disproven by source | It writes global preference, not session object |
| Review maps unknown level incorrectly | Not confirmed | Review currently mostly lacks visible level display |

Kitchen hypotheses:

| Hypothesis | Result | Evidence |
| --- | --- | --- |
| Local write omits `updatedAt` | Disproven | `savePizzaSession` updates timestamps |
| Sync effect ignores timestamp changes | Disproven by source | sync key includes `updatedAt` and `lastSavedAt` |
| Serializer strips `stepRuntime` | Disproven | full session payload |
| API discards `stepRuntime` | Disproven | `cloneStepRuntime` in session migration |
| Restore omits Kitchen state | Disproven by tests | cloud restore test asserts `stepRuntime` |
| Queue ordering loses latest write | Plausible but unconfirmed | source uses latest queued save, no live rapid network test |
| Route unmount before sync loses write | Plausible but mitigated | next route reads local state and has sync component |

## 24. Limitations

- No production code was instrumented.
- No database migration or Supabase data inspection was performed.
- No safe signed-in test account was available for live cloud and cross-device testing.
- Review full-flow completion was not fully exercised through every Kitchen step in browser; review route was validated as its guarded state.
- Full automated suite was not run because only this audit document changed.

## 25. Prioritized issue register

| Priority | Issue | Impact | Recommended patch |
| --- | --- | --- | --- |
| P1 | Experience level is stored correctly but not visibly continuous across session pages | User may think level changed or disappeared | Patch 394 |
| P1 | Kitchen cloud persistence lacks live signed-in/cross-device verification | Owner-observed bug cannot be fully confirmed or dismissed | Patch 395 |
| P2 | Remaining utilities are still prominent beside the core product | Product architecture can feel like several tools instead of one product | Patch 396 |
| P2 | `SavePizzaSessionToAccount` snapshot key omits `experienceLevel`, `timeline`, `stepRuntime` | Possible false auto-save "already saved" state | Patch 395 or 394 depending chosen scope |
| P3 | Some learning/trust pages are long on mobile | Product simplified, but secondary pages still vary in content budget | Later editorial patch |

## 26. Recommended follow-up patches

Patch 394: Experience-level canonical visibility and full-flow consistency.

Scope:

- keep canonical data field as `PizzaSession.experienceLevel`
- add one consistent, compact visible level indicator to all Pizza Session steps
- decide whether `/session/start` should show current guidance level even without a selector
- ensure Beginner, Enthusiast and Pizza Nerd are visible without relying on color alone
- add browser/component tests for all six session steps and all three levels
- do not change formulas, persisted schema or preference storage unless required

Patch 395: Kitchen signed-in cloud progress verification and corrections.

Scope:

- add focused integration tests or test harness for cloud-backed Kitchen transitions
- verify POST/PATCH payload contains `timeline`, `stepRuntime`, `currentStep`, `status`, `updatedAt`, `lastSavedAt`
- test rapid consecutive progress and navigate-away-after-transition
- include missing cloud row creation with Kitchen progress
- inspect or adjust `SavePizzaSessionToAccount` snapshot key only if it is proven to affect active-session cloud state
- do not change Kitchen UX beyond persistence fixes

Patch 396: Remaining utility role decision.

Scope:

- decide exposure for `/calculator/quick`, `/toppings`, `/costs`, `/timer`
- likely demote `/costs`
- keep `/timer` contextual until Kitchen bake integration decision
- keep `/toppings` as supporting learning/tool, not first-class core product
- preserve indexed pages until SEO impact is reviewed

Patch 397: Navigation and sitemap final alignment.

Scope:

- reduce competing primary navigation concepts
- align header, mobile nav, footer and sitemap with final utility decisions
- avoid changing route behavior in the same patch as utility integration

## 27. Final product-integrity judgment

DoughTools now has a coherent product spine. The legacy route cleanup succeeded: `/history`, `/gear`, `/doctor`, `/plan` and `/coach` are redirect-only, excluded from sitemap, and not active product destinations. `/start` remains compatibility-only.

The highest-confidence current bug is not a data bug. It is an experience-level visibility bug: `experienceLevel` is a stable session field, but the UI does not consistently show the selected level through the workflow. This can reasonably look like the level changed, especially when later routes use different visual treatment.

The Kitchen persistence path is structurally sound in source and tests, and anonymous browser testing confirmed local runtime writes. The remaining unknown is live signed-in cloud behavior under real queue/network timing and cross-device restore. That needs a narrow verification/fix patch, not speculative redesign.

Validation summary:

| Check | Result |
| --- | --- |
| Focused tests | 14 files, 438 tests passed |
| Production build | Passed |
| Browser validation | Passed at 390x844, 430x740, 1280x900, 1440x950 |
| Horizontal overflow | None on validated pages |
| Redirect status | `/start`, `/history`, `/gear`, `/doctor`, `/plan`, `/coach` return `308` |
| Deployment | Not performed |
