# Patch 391A: Plan dependency audit

## Executive summary

Patch 391A audited the legacy `/plan` route before retirement. The audit is documentation-only and does not modify production code, tests, SEO, routing, metadata, calculations, persistence, authentication, Party Orders or deployment configuration.

Audited starting point:

| Field | Value |
| --- | --- |
| Branch | `patch/391a-plan-dependency-audit` |
| Starting commit | `bc584221` |
| Audit date | 2026-07-14 |
| Primary route audited | `/plan` |
| Expected changed file | `docs/audits/patch-391a-plan-dependency-audit.md` |

High-level finding:

`/plan` is still exposed by production links, but current Pizza Session routes do not import the legacy Plan page, Plan storage key, Plan completion state, or Plan schedule helpers. The modern scheduling experience is implemented separately in `/session/timeline` through `lib/pizza-session-timeline.ts` and active Pizza Session persistence.

The safe retirement path is not to delete shared recipe, calculation or component utilities. It is to first replace active `/plan` links with current destinations, then retire the legacy route with an explicit compatibility decision.

## Audit method

The audit inspected source and reverse dependencies for:

- `app/plan/**`
- Plan imports and Plan-defined symbols
- shared helpers imported by `app/plan/page.tsx`
- Plan-specific tests
- Plan-specific metadata
- Plan localStorage keys
- Plan query parameters
- links into `/plan`
- links from `/plan`
- assets referenced by Plan-only helpers
- current `/session/timeline` implementation
- session routes and session persistence modules
- SEO and sitemap configuration

Repository-wide searches were run for:

- `/plan`
- `doughtools-active-plan-v1`
- `scheduleInstructions`
- `nextScheduledStep`
- `buildDoughInstructions`
- `settingsFromUrl`
- `recipeParams`
- `beginnerHelpFor`
- direct imports of `lib/pizza-schedule`, `lib/dough-instructions`, `lib/beginner-guide` and `lib/recipe-url`

## Current `/plan` implementation

`app/plan/page.tsx` is a client component. It owns the legacy planner UI, reads recipe query parameters, builds dough instructions, schedules those instructions around a start or bake anchor, stores local completion state, and links to the standalone `/timer` utility.

`app/plan/layout.tsx` only provides metadata through `metadataForLegacyRoute("/plan")`.

### Plan-defined route behavior

| Item | Source | Current role | Classification | Removal risk |
| --- | --- | --- | --- | --- |
| `/plan` page UI | `app/plan/page.tsx` | Legacy planner interface | D. Plan-only presentation | Low after links are replaced |
| `Locale` | `app/plan/page.tsx` | Local copy language state | C. Plan-only functional logic | Low |
| `ScheduleMode` | `app/plan/page.tsx` | Local `start` or `bake` mode | C. Plan-only functional logic | Low |
| `defaults` | `app/plan/page.tsx` | Legacy default recipe settings | C. Plan-only functional logic | Low |
| `copy` | `app/plan/page.tsx` | Legacy page copy | D. Plan-only presentation | Low |
| `dateInputValue` | `app/plan/page.tsx` | Formats local date input value | C. Plan-only functional logic | Low |
| `durationText` | `app/plan/page.tsx` | Formats relative schedule text | C. Plan-only functional logic | Low |
| `completed` state | `app/plan/page.tsx` | Local completed-step `Set<string>` | C. Plan-only functional logic | Low |
| `toggleStep` | `app/plan/page.tsx` | Toggles local step completion | C. Plan-only functional logic | Low |
| `/timer` handoff | `app/plan/page.tsx` | Opens standalone timer with recipe query | C. Plan-only functional logic | Medium because `/timer` still exists |
| Legacy metadata | `app/plan/layout.tsx` | Noindex legacy metadata | D. Plan-only presentation | Low after redirect decision |

## Dependency graph

```text
/plan
├── page and layout
│   ├── app/plan/page.tsx
│   └── app/plan/layout.tsx
├── scheduling helpers
│   ├── lib/dough-instructions.ts
│   ├── lib/pizza-schedule.ts
│   └── lib/beginner-guide.ts
├── URL/query state
│   └── lib/recipe-url.ts
├── localStorage
│   └── doughtools-active-plan-v1
├── completed-step state
│   └── local Set<string> persisted inside doughtools-active-plan-v1
├── timer links
│   └── /timer?{recipeParams(settings)}
├── shared calculations
│   ├── lib/dough-calculator.ts
│   ├── lib/baking.ts
│   ├── lib/flours.ts
│   └── lib/saved-recipes.ts types
└── shared components
    ├── components/SiteFooter.tsx
    └── components/ExperienceLevelSelector.tsx
```

## Imported module inventory

| Imported symbols | Source file | Other production consumers | Active product dependency | Removal risk | Migration need |
| --- | --- | --- | --- | --- | --- |
| `SiteFooter` | `components/SiteFooter.tsx` | Many public pages | Yes, shared footer | High if removed | None; must remain |
| `ExperienceLevelSelector` | `components/ExperienceLevelSelector.tsx` | Learning and guide surfaces | Yes, shared selector | High if removed | None; must remain |
| `bakeFor` | `lib/baking.ts` | Recipe and other bake guidance | Yes, shared bake helper | High if removed | None; must remain |
| `buildDoughInstructions` | `lib/dough-instructions.ts` | `app/plan/page.tsx`; tests; type path through `beginner-guide` | No current route besides `/plan` uses the function | Medium | Delete only with Plan-specific tests or if no future route needs legacy instruction generation |
| `getEducationExperienceCopy` | `lib/education-experience-copy.ts` | Learning/test surfaces | Shared education copy helper | Medium | Keep unless separately audited |
| `readExperienceLevelPreference`, `ExperienceLevel` | `lib/experience-levels.ts` | Learning/session-adjacent preference surfaces | Shared preference utility | High if removed | None; must remain |
| `beginnerHelpFor` | `lib/beginner-guide.ts` | `app/plan/page.tsx`; tests | No active product page imports the function | Medium | Preserve shared Dough Guide image assets; helper can be removed only after Plan tests are retired |
| `calculateDoughIngredients` | `lib/dough-calculator.ts` | Calculator, session recipe, tests and other tools | Yes, core calculation helper | High if removed | None; must remain |
| `flourById` | `lib/flours.ts` | Recipe, planning, learning and tools | Yes, shared flour lookup | High if removed | None; must remain |
| `nextScheduledStep`, `scheduleInstructions` | `lib/pizza-schedule.ts` | `app/plan/page.tsx`; tests | No current Pizza Session route uses these helpers | Low to Medium | Candidate for deletion with `/plan`, subject to test cleanup |
| `recipeParams`, `settingsFromUrl` | `lib/recipe-url.ts` | Home calculator, costs, toppings, timer, coach, session recipe, tests | Yes, shared query compatibility utility | High if removed | None; must remain |
| `RecipeSettings` | `lib/saved-recipes.ts` | Saved recipe and calculator surfaces | Yes, shared type/model | High if removed | None; must remain |
| `metadataForLegacyRoute` | `lib/seo-config.ts` via layout | Remaining legacy metadata routes | Shared legacy SEO utility while legacy routes exist | Medium | Keep until all consumers are retired |

## Reverse dependency graph

| Module | Production consumers | Test consumers | Documentation or historical consumers | Assessment |
| --- | --- | --- | --- | --- |
| `app/plan/page.tsx` | Route `/plan` only | accessibility, homepage/navigation, legacy indexing, performance, security, sitewide hero, planning guard tests | Multiple audits and baseline docs | Plan-only route implementation |
| `app/plan/layout.tsx` | Route `/plan` only | SEO and route tests through route metadata behavior | SEO docs and audits | Plan-only layout |
| `lib/pizza-schedule.ts` | `app/plan/page.tsx` only | `tests/education-experience-copy.test.ts` | Patch 387 audit mentions Plan behavior | Plan-only production schedule helper |
| `lib/dough-instructions.ts` | `app/plan/page.tsx`; `lib/beginner-guide.ts` imports its `InstructionLocale` type | `tests/education-experience-copy.test.ts` | Historical docs | Function is Plan-only in production; type is shared with a Plan-adjacent helper |
| `lib/beginner-guide.ts` | `app/plan/page.tsx` only | `tests/dough-guide.test.ts` | None relevant | Plan-only function, shared Dough Guide image references |
| `lib/recipe-url.ts` | Home calculator, costs, toppings, timer, coach, session recipe and `/plan` | recipe URL, workflow, calculator, session and saved recipe tests | Core recipe workflow docs | Shared utility, not Plan-specific |
| `lib/dough-calculator.ts` | Home calculator, session recipe, Sauce/Shopping alignment paths and tools | Many formula tests | Formula docs | Core calculation dependency |
| `lib/pizza-session-timeline.ts` | `/session/timeline` and session runtime tests | Pizza Session timeline tests | Session docs | Modern timeline implementation, not Plan-dependent |

## Required dependency questions

| Question | Answer | Source evidence |
| --- | --- | --- |
| Does `/session/start` import Plan-specific code? | No | No imports of `app/plan`, `lib/pizza-schedule`, `lib/dough-instructions` or `lib/beginner-guide` from the start route. |
| Does `/session/recipe` import Plan-specific code? | No | Session recipe uses shared `recipeParams` from `lib/recipe-url.ts`, not Plan page or schedule helpers. |
| Does `/session/shopping` import Plan-specific code? | No | No Plan-specific imports found. |
| Does `/session/timeline` import Plan-specific code? | No | Timeline uses `lib/pizza-session-timeline.ts`, runtime helpers and active session state. It does not import `lib/pizza-schedule.ts`. |
| Does `/session/kitchen` import Plan-specific code? | No | No Plan-specific imports found. |
| Does `/session/review` import Plan-specific code? | No | No Plan-specific imports found. |
| Does Quick Calculator depend on Plan-specific helpers? | No | Quick Calculator has guard tests preventing imports of `planning-engine`, `recipe-url` and `doughtools-active-plan-v1`; no Plan helper import was found. |
| Do saved recipes generate `/plan` URLs? | Yes | `components/HomeCalculatorWorkspace.tsx` and `lib/recipe-workflow.ts` generate planner actions with `recipeWorkflowQueryHref("/plan", ...)`. |
| Does Doctor or any remaining production route generate `/plan` URLs? | Doctor no; remaining routes yes | `/doctor` is retired as a redirect. `/timer` links back to `/plan${query}`. Homepage, navigation, calculator workspace and recipe workflow still link to `/plan`. |
| Is Plan localStorage read anywhere outside `/plan`? | No | `doughtools-active-plan-v1` is read and written only in `app/plan/page.tsx`; other hits are tests or documentation. |
| Are Plan completed-step values stored in session or account data? | No | Completed steps are local `Set<string>` values persisted only under the Plan localStorage key. |
| Does Plan use shared schedule functions also required by Timeline? | No | `scheduleInstructions` and `nextScheduledStep` are used by `/plan` only in production. Timeline uses `lib/pizza-session-timeline.ts`. |
| Does Plan contain schedule behavior absent from Timeline? | Yes | Legacy local start/bake mode, per-recipe local completion signature and direct `/timer` handoff are Plan-specific. Timeline has modern session-backed replacements for active workflow scheduling. |
| Does Plan contain timer or browser behavior that remains unique? | Yes | Plan has a direct `/timer` handoff and a 30-second local clock. The standalone `/timer` route remains separate. |
| Would deleting Plan-specific code change any formula? | No, if shared formula modules remain | Formula code lives in shared helpers such as `lib/dough-calculator.ts`, not in the Plan route. |
| Would deleting Plan-specific code change session persistence? | No | Plan persistence is separate localStorage and is not part of Pizza Session schema or account sync. |
| Are Plan query parameters used by any modern workflow? | The shared recipe query format is; `/plan` URLs are legacy | `recipeParams` and `settingsFromUrl` are shared. The `/plan` destination is legacy. |
| Are any Plan assets or components reused elsewhere? | No Plan-only asset folder was found | Plan references shared Dough Guide images through `beginnerHelpFor`; those images must remain. |

## Timeline comparison

| Capability | `/plan` | `/session/timeline` | Same behavior | Modern replacement complete |
| --- | --- | --- | --- | --- |
| Schedule generation | `buildDoughInstructions()` plus `scheduleInstructions()` creates legacy step times from fermentation preset and anchor. | `generatePizzaSessionTimeline()` builds session timeline from active session recipe, target time, bake profile and timeline template. | No | Yes for active Pizza Session scheduling |
| Current/next action | `nextScheduledStep()` returns the first incomplete scheduled step and ignores `now`. | Session timeline derives open actions from step state, runtime map and Kitchen Mode flow. | No | Yes |
| Completed steps | Local `Set<string>` stored in Plan localStorage. | Session timeline step status and runtime completion are stored in active Pizza Session state. | No | Yes |
| Persistence | Browser localStorage key `doughtools-active-plan-v1`. | Active Pizza Session persistence and cloud/account sync. | No | Yes |
| Reload/resume | Restores when recipe signature matches query-derived settings. | Restores from active Pizza Session and timeline input signature. | No | Yes |
| Target time | Local `start` or `bake` mode plus local anchor date. | Session target eat/bake time and generated timeline state. | Partial concept match only | Yes |
| Early/late state | Relative time copy and local status only. | Early-start warnings, runtime checks and generated timing notes. | No | Yes |
| Timer access | Direct link to `/timer?{recipeParams}`. | Kitchen Mode is the canonical cooking execution route; no direct legacy timer requirement. | No | Mostly yes, but `/timer` remains a separate legacy utility decision. |
| Recipe context | URL query parameters parsed into `RecipeSettings`. | Active session recipe snapshot and `recipeParams`. | No | Yes |
| Cloud sync | None. | Active session cloud sync and account persistence. | No | Yes |

## LocalStorage audit

| Item | Finding |
| --- | --- |
| Key name | `doughtools-active-plan-v1` |
| Read location | `app/plan/page.tsx` only |
| Write location | `app/plan/page.tsx` only |
| Stored schema | `{ signature, mode, anchor, completed }` |
| `signature` | `recipeParams(settings).toString()` for query-derived or default recipe settings |
| `mode` | `start` or `bake` |
| `anchor` | ISO timestamp string |
| `completed` | Array of scheduled step ids converted to a local `Set<string>` |
| Versioning | Version is encoded only in key name `v1` |
| Cleanup behavior | No explicit cleanup outside overwriting the same key |
| External consumers | None found |
| Session or account dependency | None found |
| Migration requirement | No active product migration requirement found; old local Plan data can be abandoned if `/plan` is redirected, subject to product decision on bookmarked legacy URLs |

## Query and URL audit

`/plan` consumes the shared `settingsFromUrl()` parser and generates query strings with `recipeParams()`.

Supported shared recipe query parameters include:

- `balls`
- `ballWeight`
- `waste`
- `hydration`
- `salt`
- `yeastType`
- `fermentation`
- `temperature`
- `style`
- `oven`
- `flour`
- optional `pizzaStyle`

Route behavior:

| Question | Finding |
| --- | --- |
| Do parameters encode recipe state? | Yes, they encode calculator-style recipe settings. |
| Does equivalent state exist in Pizza Session? | Yes, session recipe state stores `recipeParams` and a recipe snapshot. |
| Are parameters Plan-specific? | No, the query format is shared. |
| Do old bookmarked Plan URLs need compatibility handling? | Yes, because `/plan?balls=...` may exist. A future redirect can preserve general intent by going to `/session/start` or `/session/timeline` only if the target has a clear recipe handoff contract. |
| Should this audit implement redirect rules? | No. Patch 391A is audit-only. |

## Link inventory

Active production links to `/plan` remain and must be replaced before route retirement.

| Source | Link form | Classification | Future target candidate |
| --- | --- | --- | --- |
| `lib/navigation.ts` | Navigation item `Fermentation Planner` -> `/plan` | Active production link | Likely remove, demote, or replace with `/session/timeline` only if the label becomes session-specific |
| `lib/homepage.ts` | Core tool `Planner` -> `/plan` | Active production link | `/session/start` for canonical planning entry or `/session/timeline` only from active sessions |
| `components/HomeCalculatorWorkspace.tsx` | `planHref = /plan?${recipeQuery}` | Active production query handoff | Needs product decision: `/session/start` with preserved recipe intent, or no direct replacement |
| `components/HomeCalculatorWorkspace.tsx` | Saved recipe action `recipeWorkflowQueryHref("/plan", savedRecipeQuery)` | Active saved recipe handoff | Likely modern saved-recipe-to-session flow, not direct `/session/timeline` without active session |
| `lib/recipe-workflow.ts` | Planner workflow action points to `/plan` | Active workflow helper | Replace as part of workflow decision |
| `app/timer/page.tsx` | Back link to `/plan${query}` | Active legacy utility link | Replace with `/session/timeline`, `/session/start`, or remove if `/timer` is later retired |
| Tests | Expected `/plan` references | Test-only | Update only in implementation patch |
| Documentation | Historical and audit references | Historical | May remain when describing legacy architecture |

No production link from the retired `/doctor` route currently generates `/plan` URLs.

## Classification by required model

| Item | Classification | Rationale |
| --- | --- | --- |
| `lib/dough-calculator.ts` | A. Core product dependency | Shared formula engine used by active calculator and session recipe. |
| `lib/recipe-url.ts` | B. Shared utility | Shared recipe URL compatibility utility used outside Plan. |
| `components/SiteFooter.tsx` | B. Shared utility | Canonical footer used sitewide. |
| `components/ExperienceLevelSelector.tsx` | B. Shared utility | Shared learning preference control. |
| `lib/baking.ts` | B. Shared utility | Shared bake helper. |
| `lib/flours.ts` | B. Shared utility | Shared flour lookup. |
| `lib/saved-recipes.ts` `RecipeSettings` | B. Shared utility | Shared saved recipe model/type. |
| `lib/pizza-schedule.ts` | C. Plan-only functional logic | Only `/plan` imports it in production. |
| `lib/dough-instructions.ts` `buildDoughInstructions` | C. Plan-only functional logic | The function is only used by `/plan` in production. |
| `lib/beginner-guide.ts` `beginnerHelpFor` | C. Plan-only functional logic | Only `/plan` imports it in production; tests verify image mapping. |
| `app/plan/page.tsx` UI and copy | D. Plan-only presentation | Route-only page implementation. |
| `app/plan/layout.tsx` | D. Plan-only presentation | Route-only metadata layout. |
| Plan tests expecting `/plan` behavior | E. Historical or test-only reference | Tests will need update when route is retired. |
| Old docs and audits mentioning `/plan` | E. Historical or test-only reference | May remain as historical architecture evidence. |
| Direct `/plan` production links | F. Unclear dependency until product target is chosen | Links are active, but they do not prove implementation dependency. They require replacement before deletion. |

## Source and maintenance risk assessment

| File or symbol | Risk | Reason |
| --- | --- | --- |
| `app/plan/page.tsx` | Low | Plan-only route implementation after active links are replaced. |
| `app/plan/layout.tsx` | Low | Plan-only legacy metadata wrapper. |
| `doughtools-active-plan-v1` | Low | Isolated localStorage key with no external consumers. |
| `lib/pizza-schedule.ts` | Low to Medium | Plan-only production helper, but tests cover it. |
| `buildDoughInstructions` in `lib/dough-instructions.ts` | Medium | Plan-only function in production; test cleanup needed. |
| `beginnerHelpFor` in `lib/beginner-guide.ts` | Medium | Plan-only production helper, but references shared Dough Guide assets and has tests. |
| `lib/recipe-url.ts` | High | Shared by modern tools and session recipe. Must remain. |
| `lib/dough-calculator.ts` | High | Core formula dependency. Must remain. |
| `lib/pizza-session-timeline.ts` | High | Modern Timeline implementation. Must remain unchanged. |
| `/timer` back link to `/plan` | Medium | Active route-link dependency; needs replacement before Plan retirement. |
| Homepage/calculator saved-recipe links to `/plan` | Medium | Active navigation/workflow exposure; needs replacement before Plan retirement. |
| SEO legacy metadata for `/plan` | Medium | Must be changed only when redirect behavior is implemented. |

## Active product dependency assessment

The current product does not depend on Plan-specific schedule logic for Pizza Session behavior.

Protected active dependencies:

- Recipe calculations come from shared formula modules and must not be removed.
- Query serialization and parsing come from `lib/recipe-url.ts` and must not be removed.
- `/session/timeline` uses `lib/pizza-session-timeline.ts`, not `lib/pizza-schedule.ts`.
- Active session persistence is separate from Plan localStorage.
- Account and cloud sync do not read Plan storage.

Still-active exposure:

- Users can reach `/plan` through production navigation and calculator surfaces.
- Saved recipe workflow helpers still generate `/plan` URLs.
- `/timer` still links back to `/plan`.

This means `/plan` is not an internal dependency of the modern session architecture, but it is still a public linked destination.

## SEO and sitemap state

`/plan` is configured as a legacy noindex route through `lib/seo-config.ts`. It is excluded from the public sitemap, but route metadata still exists while the page renders independently.

Implementation patch implications:

- Do not remove shared SEO helpers while other legacy routes still use them.
- Keep `/plan` out of the sitemap.
- When `/plan` becomes redirect-only, remove it from legacy noindex metadata if the redirect implementation no longer renders page metadata.
- Preserve canonical indexing for `/session/start` and `/session/timeline`.

## Asset audit

No Plan-only asset directory was found. Plan-specific beginner cards reference shared Dough Guide images through `lib/beginner-guide.ts`.

Preserve:

- `/public/dough-guide/*.webp`
- Dough Guide image metadata
- shared guide assets used by `/guides/dough`

Potentially removable in a future implementation patch:

- `lib/beginner-guide.ts` if no production route or retained tests still need it.
- Plan-only tests that exist only to verify legacy planner instruction imagery.

## What would break if Plan were deleted immediately?

Deleting `/plan` immediately without link and test updates would break:

- navigation references to `/plan`
- homepage/core tool references to `/plan`
- calculator workspace planner links
- saved recipe planner handoff URLs
- `/timer` back navigation
- tests that assert `/plan` exists, is noindexed, or appears in route inventories
- historical performance/security baselines that read `app/plan/page.tsx`

Deleting Plan-specific route code would not break:

- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- active Pizza Session persistence
- session schema
- account/cloud sync
- dough formulas
- recipe URL parsing, if `lib/recipe-url.ts` remains

## Recommended next action

Patch 391B should be an implementation patch that:

1. Replaces production `/plan` links with current canonical destinations.
2. Chooses a compatibility redirect target for `/plan`.
3. Does not send users directly to `/session/timeline` unless there is an active session or a clear session creation handoff.
4. Preserves shared helpers: `recipe-url`, `dough-calculator`, `baking`, `flours`, `saved-recipes`, shared components and shared assets.
5. Removes Plan-only page UI, localStorage code, layout and Plan-only scheduling helpers only after final reverse dependency searches.
6. Updates SEO and route tests to reflect redirect-only behavior.
7. Leaves `/session/timeline` behavior unchanged unless a separately approved migration is required.

## Validation performed

Patch 391A validation includes:

- repository-wide import search
- symbol search
- localStorage key search
- route-link search
- query-parameter search
- test search
- asset search
- source inspection for `/session/timeline`
- source inspection for Plan imports and reverse consumers
- `git diff --check`
- `git status --short`

No full test suite was run because the expected patch changes only documentation.

## Final conclusion

Conclusion B

`/plan` is removable, but specified shared modules must remain.

Exact dependencies that must remain:

- `lib/recipe-url.ts`
- `lib/dough-calculator.ts`
- `lib/baking.ts`
- `lib/flours.ts`
- `lib/saved-recipes.ts`
- `components/SiteFooter.tsx`
- `components/ExperienceLevelSelector.tsx`
- shared Dough Guide image assets
- `lib/pizza-session-timeline.ts`
- active Pizza Session persistence and cloud sync modules

Plan-specific deletion candidates after link replacement:

- `app/plan/page.tsx`
- `app/plan/layout.tsx`
- `lib/pizza-schedule.ts`
- `buildDoughInstructions` if no other retained production consumer is introduced
- `beginnerHelpFor` if no other retained production consumer remains
- Plan-only localStorage key behavior
- Plan-only route tests and baselines

Potential usefulness alone does not justify migration. The source evidence shows no current Pizza Session route depends on legacy Plan schedule behavior, localStorage, completed-step state, or Plan page UI.
