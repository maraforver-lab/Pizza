# Patch 392A: Coach dependency audit

## 1. Executive summary

Patch 392A audits the legacy `/coach` route before retirement. The source evidence shows that Coach is still reachable from production navigation, homepage core tools and the calculator workspace, but its implementation is isolated from the modern Pizza Session product.

Audited starting point:

- Branch at audit start: `master`
- Starting commit: `8e85127e`
- Audit branch: `patch/392a-coach-dependency-audit`
- Audit type: documentation only

Answer to the primary dependency question:

No current Pizza Session route, account route, Party Order route, calculation engine, session schema, persistence contract or cloud-sync path depends on Coach-specific logic. The only active production consumers of Coach are links to the route and the route itself.

Coach does import shared modules that must remain:

- `components/SiteFooter.tsx`
- `lib/flours.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/seo-config.ts` while `/coach` remains noindexed before retirement

Coach-specific code is limited to:

- `app/coach/page.tsx`
- `app/coach/layout.tsx`
- `lib/pizza-coach.ts`

Recommendation: retire `/coach` in a follow-up patch by replacing production links with canonical destinations and converting `/coach` to a server-side redirect to `/guide/pizza-troubleshooting`.

## 2. Coach route structure

Current route files:

| File | Role | Classification | Risk |
| --- | --- | --- | --- |
| `app/coach/page.tsx` | Client-rendered legacy Coach UI, local goal and issue selectors, recipe query read, recommendation link back to calculator | D. Coach-only presentation plus C. Coach-only functional route orchestration | Low |
| `app/coach/layout.tsx` | Route-specific legacy noindex metadata wrapper | D. Coach-only presentation / SEO wrapper | Low |
| `lib/pizza-coach.ts` | Coach advice engine and Coach-only types | C. Coach-only functional logic | Low |

No nested route folders exist under `app/coach`.

No Coach-specific assets were found under `public`.

## 3. Complete import inventory

`app/coach/page.tsx` imports:

| Imported symbol | Source file | Coach usage | Other production consumers | Current runtime depends on it? | Ownership | Removal risk | Migration need |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Link` | `next/link` | Header/back and recommendation links | Many routes | Yes, framework | Framework | None | None |
| `useEffect`, `useMemo`, `useState` | `react` | Client state for route hydration, goal, issue and advice | Many routes | Yes, framework | Framework | None | None |
| `SiteFooter` | `components/SiteFooter.tsx` | Canonical footer on Coach page | Many public pages | Yes | Shared component | High if removed | Keep |
| `flourById` | `lib/flours.ts` | Resolve selected flour for warnings and advice | Calculator, Styles comparison, tests | Yes | Shared data utility | High if removed | Keep |
| `buildCoachAdvice` | `lib/pizza-coach.ts` | Build local Coach recommendations | None outside `/coach` and legacy-route tests | No active dependency outside Coach | Coach-only | Low | Delete with Coach |
| `CoachGoal`, `CoachIssue` | `lib/pizza-coach.ts` | Local selector typing | None outside `/coach` | No | Coach-only | Low | Delete with Coach |
| `recipeParams` | `lib/recipe-url.ts` | Build calculator return URL and recommended query | Calculator, Costs, Toppings, Timer, Session Recipe, tests | Yes | Shared query utility | High if removed | Keep |
| `settingsFromUrl` | `lib/recipe-url.ts` | Parse current recipe query from `/coach?...` | Calculator, Costs, Toppings, Timer, tests | Yes | Shared query utility | High if removed | Keep |
| `RecipeSettings` | `lib/saved-recipes.ts` | Type local defaults and recommended settings | Calculator, Quick Calculator, Session Recipe, bake result, tests | Yes | Shared recipe type | High if removed | Keep |

`app/coach/layout.tsx` imports:

| Imported symbol | Source file | Coach usage | Other production consumers | Current runtime depends on it? | Ownership | Removal risk | Migration need |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Metadata` | `next` | Route metadata type | Many routes | Yes, framework | Framework | None | None |
| `ReactNode` | `react` | Layout children type | Many routes | Yes, framework | Framework | None | None |
| `metadataForLegacyRoute` | `lib/seo-config.ts` | Noindex metadata for `/coach` | Tests; currently only `/coach` route at runtime | Yes while Coach remains | Shared SEO config currently serving last legacy noindex route | Medium during retirement | Remove or simplify only in 392B after redirect |

`lib/pizza-coach.ts` imports:

| Imported symbol | Source file | Coach usage | Other production consumers | Current runtime depends on it? | Ownership | Removal risk | Migration need |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `FlourProfile` | `lib/flours.ts` | Input type for flour ranges | Calculator, Styles, Dough/Recipe data | Yes | Shared flour model | High if removed | Keep |
| `Fermentation`, `RecipeSettings` | `lib/saved-recipes.ts` | Advice inputs and recommended output | Many product routes and tests | Yes | Shared recipe model | High if removed | Keep |

## 4. Reverse dependency inventory

| Coach-related item | `/coach` | Other production routes | Tests | Docs | Classification |
| --- | --- | --- | --- | --- | --- |
| `app/coach/page.tsx` | Route page | None | `site-footer`, `sitewide-hero`, `legacy-route-indexing` read route source | Historical audits | D. Coach-only presentation |
| `app/coach/layout.tsx` | Route metadata layout | None | `legacy-route-indexing` verifies legacy metadata | Historical audits | D. Coach-only layout/metadata |
| `lib/pizza-coach.ts` | Imported by page | None | `legacy-route-indexing` marker only | Patch 387 mentions investigation | C. Coach-only functional logic |
| `buildCoachAdvice` | Called by page | None | Marker string only | Patch 387 mentions investigation | C. Coach-only functional logic |
| `CoachGoal`, `CoachIssue`, `CoachAction`, `CoachLocale` | Used by page/advice module | None | None | None | C. Coach-only types |
| `/coach` route string | Route itself | `lib/navigation.ts`, `lib/homepage.ts`, `components/HomeCalculatorWorkspace.tsx`, `lib/seo-config.ts` | Navigation, homepage, SEO, hero/footer tests | SEO docs and historical audits | Mixed: active link exposure plus historical references |
| `/coach?...` route string | Route URL state | `components/HomeCalculatorWorkspace.tsx` | None directly | None | Active production link |

## 5. Dependency graph

Forward dependency graph:

```text
/coach
├── page and layout
│   ├── app/coach/page.tsx
│   └── app/coach/layout.tsx
├── advice engine
│   └── lib/pizza-coach.ts
├── goals and issue inputs
│   ├── CoachGoal: airy | crispy | easy | flavor
│   └── CoachIssue: none | sticky | dense | tears | pale | soggy | burnt
├── recipe/settings inputs
│   ├── defaults inside app/coach/page.tsx
│   ├── settingsFromUrl(location.search)
│   ├── RecipeSettings
│   └── flourById(settings.flourId)
├── result types
│   ├── CoachAction
│   └── { summary, actions, warnings, recommended }
├── query state
│   ├── reads shared recipe query params
│   └── writes calculator query params into /?...
├── storage or persistence
│   └── none
├── shared calculations
│   ├── flour ranges from lib/flours.ts
│   └── no dough ingredient formula calls
├── shared components
│   └── SiteFooter
└── assets
    └── none found
```

Reverse dependency graph:

```text
lib/pizza-coach.ts
├── app/coach/page.tsx
├── tests/legacy-route-indexing.test.ts (marker string only)
└── docs/audits/patch-387-canonical-indexing-and-legacy-retirement.md

app/coach/page.tsx
├── Next.js route /coach
├── tests/site-footer.test.ts
├── tests/sitewide-hero-system.test.ts
├── tests/sitewide-hero-rollout-audit.test.ts
├── tests/legacy-route-indexing.test.ts
└── historical audit docs

app/coach/layout.tsx
├── Next.js route /coach
└── tests/legacy-route-indexing.test.ts
```

## 6. Advice-engine analysis

`buildCoachAdvice(locale, settings, flour, goal, issue)` is pure advice generation:

- Inputs:
  - `locale`: `"fi"` or `"en"`
  - `settings`: shared `RecipeSettings`
  - `flour`: shared `FlourProfile`
  - `goal`: `airy`, `crispy`, `easy` or `flavor`
  - `issue`: `none`, `sticky`, `dense`, `tears`, `pale`, `soggy` or `burnt`
- Outputs:
  - localized `summary`
  - up to four `actions`
  - `warnings`
  - `recommended` recipe settings
- Mutations:
  - none outside local function scope
  - copies `settings` into `recommended`
- Persistence:
  - none
- Formula impact:
  - does not call dough ingredient calculation
  - does not alter shared recipe, session or cloud state
  - changes only local recommendation values returned to `/coach`
- Assumptions:
  - flour hydration and fermentation ranges are suitable advice boundaries
  - goal and issue choices can suggest hydration, ball weight or fermentation changes

Advice category classification:

| Category | Coach behavior | Modern coverage | Classification |
| --- | --- | --- | --- |
| Airier rim | Protect gas, raise hydration inside flour range, warm dough balls | Dough Guide and Troubleshooting cover gas handling, readiness and dense rim; Session Start/Recipe choose supported presets | Unique but unused legacy advice |
| Crispy base | Lower hydration, smaller ball, control topping moisture | Styles, Ovens, Toppings and Troubleshooting cover crispness/moisture | Already replaced across learning/tools |
| Easier dough | Use flour middle range, recommended fermentation, one change at a time | Session Start, Recipe, Dough Guide and planning guidance cover practical setup | Already replaced by Session Start/Recipe/Dough Guide |
| More flavor | Longer fermentation, less yeast, avoid scorching | Recipe and Timeline cover fermentation; Ovens/Troubleshooting cover baking | Already replaced by Recipe/Timeline/Ovens |
| Sticky issue | Lower hydration, cool and strengthen | Troubleshooting has sticky dough topics; Dough Guide teaches rest/folds | Already replaced by Troubleshooting/Dough Guide |
| Dense issue | Check proofing | Troubleshooting has dense rim and proofing topics | Already replaced by Troubleshooting |
| Tears issue | Lower hydration, rest gluten | Troubleshooting and Dough Guide cover tearing | Already replaced by Troubleshooting/Dough Guide |
| Pale issue | Increase top heat/preheat | Ovens and Troubleshooting cover pale base/top heat | Already replaced by Ovens/Troubleshooting |
| Soggy issue | Reduce moisture/sauce/cheese | Sauce, Toppings and Troubleshooting cover moisture | Already replaced by Sauce/Toppings/Troubleshooting |
| Burnt issue | Balance flame and floor | Ovens and Troubleshooting cover burnt base/top | Already replaced by Ovens/Troubleshooting |

Potential usefulness does not create an active dependency. No modern route imports, calls or stores Coach output.

## 7. Capability comparison

| Capability | `/coach` | Recipe | Troubleshooting | Review | Session Start | Active dependency |
| --- | --- | --- | --- | --- | --- | --- |
| Goal-based advice | Four local goals map to text and small recipe adjustments | Recipe uses session recipe settings and fermentation guidance | Some goal outcomes appear as symptom guidance | Review captures actual outcome for next bake | Presets and flow choices guide user setup | No |
| Recipe adjustment advice | Returns local `recommended` settings and calculator query | Builds active session recipe from canonical session state | Explains likely changes by symptom | Does not mutate recipe | Creates new session only by explicit action | No |
| Problem diagnosis | Seven issue chips generate action text | Limited to recipe guidance | Canonical diagnosis route by symptom | Captures post-bake notes | Not diagnostic | No |
| Post-bake improvement | Issue selector can reflect last bake | No | Yes, via symptoms | Canonical post-bake reflection surface | No | No |
| Learning links | None beyond back/apply | Related learning exists elsewhere | Yes | Limited | No | No |
| Session-aware advice | No active session read | Yes | No active session required | Yes, active/completed session aware | Creates/chooses session | No |
| Persisted recommendations | None | Session recipe persists through active session | None | Review persists through session/history | Session persists only after explicit create | No |
| Formula changes | Local suggested settings only | Canonical recipe calculations | No formula changes | No formula changes | No formula changes until session flow | No |

## 8. Production consumers

Active production consumers of `/coach`:

| Surface | File | Current target | Classification | Future target recommendation |
| --- | --- | --- | --- | --- |
| Global/tool navigation | `lib/navigation.ts` | `/coach` | Navigation exposure | Remove or replace with `Troubleshooting` -> `/guide/pizza-troubleshooting` |
| Homepage core tools | `lib/homepage.ts` | `/coach` | Homepage exposure | Remove or replace with `Troubleshooting` -> `/guide/pizza-troubleshooting` |
| Calculator desktop action | `components/HomeCalculatorWorkspace.tsx` | `/coach?${recipeParams(currentSettings)}` | Contextual utility link | Replace with `/guide/pizza-troubleshooting`; do not preserve query unless a tested handoff exists |
| Calculator mobile action | `components/HomeCalculatorWorkspace.tsx` | `/coach?${recipeParams(currentSettings)}` | Contextual utility link | Replace with `/guide/pizza-troubleshooting`; do not preserve query unless a tested handoff exists |
| Legacy SEO metadata | `lib/seo-config.ts` | `/coach` in `legacyNoindexRoutes` | SEO noindex compatibility | Remove after `/coach` becomes redirect-only |

No production link from session routes, account routes, Party Orders, Quick Calculator route, Toppings route, Guide or Troubleshooting was found.

## 9. Test-only consumers

| Test | Reference | Meaning |
| --- | --- | --- |
| `tests/legacy-route-indexing.test.ts` | `/coach`, `buildCoachAdvice` marker | Ensures accessible legacy route has noindex metadata while still rendered |
| `tests/seo-config.test.ts` | `/coach`, `metadataForLegacyRoute("/coach")` | Ensures Coach is legacy noindex and absent from public sitemap |
| `tests/navigation.test.ts` | `/coach` | Current navigation route inventory |
| `tests/homepage.test.ts` | `/coach` | Current homepage/core-tool route inventory |
| `tests/trust-pages.test.ts` | `/coach` | Current route accessibility/trust inventory |
| `tests/site-footer.test.ts` | `app/coach/page.tsx` | Verifies canonical footer usage on currently rendered Coach page |
| `tests/sitewide-hero-system.test.ts` | `/coach` | Current hero/exemption route inventory |
| `tests/sitewide-hero-rollout-audit.test.ts` | `app/coach/page.tsx` | Historical audit coverage |

These tests protect the current legacy state. They are not evidence that active product behavior depends on Coach.

## 10. Storage and persistence audit

Coach route storage behavior:

| Storage surface | Read? | Write? | Evidence | Other consumers | Migration required |
| --- | --- | --- | --- | --- | --- |
| `localStorage` | No | No | `app/coach/page.tsx` contains no `localStorage` calls | Not applicable | No |
| `sessionStorage` | No | No | no `sessionStorage` calls | Not applicable | No |
| cookies | No | No | no `cookies()` or `document.cookie` calls | Not applicable | No |
| active Pizza Session | No | No | no imports from `lib/pizza-session-storage.ts` or session modules | Not applicable | No |
| account history | No | No | no account/cloud imports | Not applicable | No |
| cloud session data | No | No | no Supabase/cloud imports | Not applicable | No |
| saved recipe data | No | No | imports `RecipeSettings` type only, does not call `loadSavedRecipes` or `storeSavedRecipes` | Saved recipes remain shared | No |
| URL state | Yes | Yes, links only | reads shared recipe query from `location.search`; emits `/?${recipeParams(...)}` | shared recipe URL utilities | No migration; future redirect can discard unsupported params |

Coach only reads shared recipe URL state and emits calculator query links. It does not persist outputs.

## 11. Session-schema audit

Repository searches found no Coach-specific fields in:

- `app/session/**`
- `lib/pizza-session.ts`
- `lib/pizza-session-storage.ts`
- `lib/session-recipe.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-review.ts`
- cloud session modules

Question answers:

1. `/session/start` imports Coach-specific code: no.
2. `/session/recipe` imports Coach-specific code: no.
3. `/session/shopping` imports Coach-specific code: no.
4. `/session/timeline` imports Coach-specific code: no.
5. `/session/kitchen` imports Coach-specific code: no.
6. `/session/review` imports Coach-specific code: no.
14. Coach results are stored in Pizza Session data: no.
15. Coach fields are part of any session schema: no.
16. Coach recommendations are persisted locally or in cloud data: no.

## 12. Calculation dependency audit

Coach-specific code does not own shared calculations.

| Calculation/data source | Coach usage | Other active usage | Deletion decision |
| --- | --- | --- | --- |
| `lib/flours.ts` | Flour profile ranges and defaults for warnings/recommendations | Calculator, Styles, recipe/session modules and tests | Preserve |
| `lib/saved-recipes.ts` | Shared `RecipeSettings` and `Fermentation` types | Calculator, Quick Calculator, Session Recipe, bake result, saved recipe storage | Preserve |
| `lib/recipe-url.ts` | Query parsing and query generation | Calculator, Costs, Toppings, Timer, Session Recipe, tests | Preserve |
| `lib/pizza-coach.ts` | Coach-only advice generation | None | Delete in retirement |
| dough ingredient formulas | Not called | Session Recipe, calculator, quick calculator | No impact |
| Pizza Session timeline formulas | Not called | Timeline | No impact |

Question answers:

18. Coach calls shared calculations without owning them: yes, it consumes shared flour/profile and recipe URL data; it does not own them.
19. Removing Coach-specific code risks changing any formula: no, if shared modules remain.

## 13. Query parameter audit

`/coach` does not define Coach-specific URL parameters for `goal` or `issue`; those are local React state defaults.

It accepts the shared recipe URL parameters parsed by `settingsFromUrl`:

| Parameter | Source utility | Meaning | Generated by active routes? | Future redirect handling |
| --- | --- | --- | --- | --- |
| `balls` | `lib/recipe-url.ts` | pizza count | Yes, calculator links | Discard for `/coach` redirect unless a tested new handoff exists |
| `ballWeight` | `lib/recipe-url.ts` | dough ball weight | Yes | Discard |
| `waste` | `lib/recipe-url.ts` | waste percentage | Yes | Discard |
| `hydration` | `lib/recipe-url.ts` | hydration percentage | Yes | Discard |
| `salt` | `lib/recipe-url.ts` | salt percentage | Yes | Discard |
| `yeastType` | `lib/recipe-url.ts` | yeast type | Yes | Discard |
| `fermentation` | `lib/recipe-url.ts` | legacy recipe fermentation preset | Yes | Discard |
| `temperature` | `lib/recipe-url.ts` | fermentation temperature | Yes | Discard |
| `style` | `lib/recipe-url.ts` | legacy recipe goal | Yes | Discard |
| `oven` | `lib/recipe-url.ts` | oven type | Yes | Discard |
| `flour` | `lib/recipe-url.ts` | flour id | Yes | Discard |
| `pizzaStyle` | `lib/recipe-url.ts` | pizza style id | Yes | Discard |

Equivalent context exists in modern Pizza Session only after a session is explicitly created. A future `/coach?...` redirect should not silently create, replace or mutate an active session.

## 14. Internal-link inventory

Production links:

| Link source | Type | Current link | Future target |
| --- | --- | --- | --- |
| `lib/navigation.ts` | navigation | `/coach` | Remove or replace with `/guide/pizza-troubleshooting` |
| `lib/homepage.ts` | homepage/core tool | `/coach` | Remove or replace with `/guide/pizza-troubleshooting` |
| `components/HomeCalculatorWorkspace.tsx` | calculator desktop contextual action | `/coach?${recipeParams(currentSettings)}` | `/guide/pizza-troubleshooting`, discard recipe query |
| `components/HomeCalculatorWorkspace.tsx` | calculator mobile contextual action | `/coach?${recipeParams(currentSettings)}` | `/guide/pizza-troubleshooting`, discard recipe query |

No production links found from:

- session routes
- account routes
- Party Order routes
- `/guide`
- `/guide/pizza-troubleshooting`
- Quick Calculator route
- Toppings route
- saved-recipe action helpers

Documentation references may remain in historical audits.

## 15. Asset dependency audit

No Coach-only images, icons or public asset folders were found.

| Item | Classification | Retirement action |
| --- | --- | --- |
| `public/**coach**` | None found | None |
| emoji/star mark in `app/coach/page.tsx` | Route-only inline presentation | Delete with page UI |
| Coach copy object in `app/coach/page.tsx` | Route-only copy | Delete with page UI |
| Coach goal/issue button UI | Route-only UI | Delete with page UI |

## 16. Risk classification

| Item | Classification | Risk | Required validation before deletion |
| --- | --- | --- | --- |
| `app/coach/page.tsx` | Coach-only UI and route orchestration | Low | Verify replacement links and redirect |
| `app/coach/layout.tsx` | Coach-only metadata wrapper | Low | Remove only when redirect route no longer needs metadata |
| `lib/pizza-coach.ts` | Coach-only advice engine | Low | Verify no imports remain |
| `buildCoachAdvice` and Coach types | Coach-only symbols | Low | Verify symbol search after deletion |
| `lib/navigation.ts` `/coach` link | Active production link | Medium | Replace before redirect/removal |
| `lib/homepage.ts` `/coach` link | Active production link | Medium | Replace before redirect/removal |
| Calculator `/coach?...` links | Active production query links | Medium | Replace without unsupported query handoff |
| `lib/seo-config.ts` `/coach` legacy noindex | Legacy SEO state | Medium | Remove from legacy noindex after redirect-only conversion |
| `SiteFooter` | Shared component | High if deleted | Preserve |
| `lib/flours.ts` | Shared data/calculation input | High if deleted | Preserve |
| `lib/recipe-url.ts` | Shared query utility | High if deleted | Preserve |
| `lib/saved-recipes.ts` | Shared recipe types/storage | High if deleted | Preserve |

## 17. Safe deletion candidates

Safe deletion candidates for Patch 392B after link replacement and redirect tests:

- old `app/coach/page.tsx` rendered UI, replaced by redirect page
- `app/coach/layout.tsx`, if no standalone legacy metadata remains necessary
- `lib/pizza-coach.ts`
- Coach-only types:
  - `CoachLocale`
  - `CoachGoal`
  - `CoachIssue`
  - `CoachAction`
- Coach-only copy, goal labels, issue labels and local action rendering
- tests that only verify the old rendered legacy page, updated to redirect expectations

## 18. Shared modules that must remain

Do not delete or rewrite these during Coach retirement:

- `components/SiteFooter.tsx`
- `lib/flours.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/dough-calculator.ts`
- `lib/session-recipe.ts`
- `lib/pizza-session.ts`
- `lib/pizza-session-storage.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-review.ts`
- account, auth, cloud session and Party Order modules

`metadataForLegacyRoute` and `legacyNoindexRoutes` are shared SEO infrastructure today only in the sense that they live inside `lib/seo-config.ts`; after Coach becomes redirect-only, the `/coach` entry should be removed and tests updated. Whether the helper remains or is deleted should be decided from the then-current SEO test usage.

## 19. Unclear items

No unresolved active dependency was found.

The only product decision left for Patch 392B is link replacement semantics:

- navigation and homepage can likely use `Troubleshooting`
- calculator contextual Coach actions can either be removed or point to `/guide/pizza-troubleshooting`
- no current tested handoff exists for sending calculator recipe parameters into Troubleshooting or Review

This is a UX routing decision, not a dependency blocker.

## 20. Recommended redirect target

Recommended future redirect:

```text
/coach -> /guide/pizza-troubleshooting
```

Rationale:

- Coach's most defensible remaining job is symptom-based advice.
- The canonical modern symptom/advice route is `/guide/pizza-troubleshooting`.
- Generic `/coach` URLs cannot safely infer an active Pizza Session.
- `/session/review` requires session context and is not appropriate for anonymous legacy URLs.
- `/session/start` is for creating a new Pizza Session, while Coach's old purpose was improvement/diagnosis.
- Legacy recipe query parameters should be discarded unless a future patch introduces a tested handoff contract.

## 21. Recommended next step

Patch 392B should:

1. Replace production `/coach` and `/coach?...` links.
2. Convert `/coach` to a server-side redirect to `/guide/pizza-troubleshooting`.
3. Delete `lib/pizza-coach.ts` after confirming no imports remain.
4. Remove Coach-only rendered UI and metadata layout.
5. Remove `/coach` from `legacyNoindexRoutes` because it becomes redirect-only.
6. Keep `/coach` excluded from sitemap.
7. Update tests to verify redirect, no internal links and absent Coach-only module references.
8. Do not migrate Coach advice logic into Recipe, Review, Troubleshooting or Pizza Session unless a new dependency appears.

## Required dependency question answers

| Question | Answer |
| --- | --- |
| Does `/session/start` import Coach-specific code? | No. |
| Does `/session/recipe` import Coach-specific code? | No. |
| Does `/session/shopping` import Coach-specific code? | No. |
| Does `/session/timeline` import Coach-specific code? | No. |
| Does `/session/kitchen` import Coach-specific code? | No. |
| Does `/session/review` import Coach-specific code? | No. |
| Does `/guide/pizza-troubleshooting` import Coach-specific code? | No. |
| Does `/guide` import Coach-specific code? | No. |
| Does Quick Calculator import Coach-specific code? | No. |
| Does Toppings import Coach-specific code? | No. |
| Does Account history use Coach output? | No. |
| Does Party Orders use Coach output? | No. |
| Is `buildCoachAdvice` used anywhere outside `/coach` and Coach-specific tests? | No. |
| Are Coach results stored in Pizza Session data? | No. |
| Are Coach fields part of any session schema? | No. |
| Are Coach recommendations persisted locally or in cloud data? | No. |
| Are Coach query parameters generated by active routes? | No Coach-specific query parameters exist; active calculator links generate shared recipe parameters in `/coach?...` URLs. |
| Does Coach call shared calculations without owning them? | Yes. It consumes shared flour and recipe URL/type modules, which must remain. |
| Does removing Coach-specific code risk changing any formula? | No, if shared modules are preserved. |
| Are any Coach assets reused elsewhere? | No Coach-specific assets were found. |
| Are visible production links to Coach still present? | Yes: navigation, homepage/core tools and calculator workspace. |
| Is any Coach advice currently surfaced through another route? | No. Modern routes cover similar user jobs independently, but do not import or display Coach output. |

## Validation performed

Commands/searches performed:

- `Get-ChildItem -Recurse app\coach`
- `rg --files | rg 'coach|Coach|dough-coach|pizza-coach'`
- `rg -n 'from "@/lib/pizza-coach"|buildCoachAdvice|CoachGoal|CoachIssue|CoachAction|CoachLocale' app components lib tests docs`
- `rg -n '/coach\?|/coach|Pizza Coach|Coach analysis|coach reads|coach route|buildCoachAdvice' app components lib tests docs`
- `rg --files public | rg -i 'coach|pizza-coach|dough-coach'`
- `rg -n 'pizza-coach|buildCoachAdvice|CoachGoal|CoachIssue|/coach|/coach\?' app\session app\guide app\guides app\account app\order app\api components\session components\account components\quick-calculator components\toppings components\guide`
- `rg -n 'pizza-coach|buildCoachAdvice|CoachGoal|CoachIssue|/coach|/coach\?' lib`
- `rg -n 'flourById\(|flourById' app components lib tests`
- `rg -n 'settingsFromUrl\(|recipeParams\(|recipeUrl\(' app components lib tests`
- `rg -n 'metadataForLegacyRoute\(' app components lib tests`
- `rg -n 'localStorage|sessionStorage|document\.cookie|cookies\(|storage|persist|cloud|supabase|database|schema|Coach|coach|buildCoachAdvice' app\coach lib tests app components`
- `git diff --check`
- `git status --short`

Patch 392A intentionally did not run the full test suite because it changes only documentation.

## Final conclusion

Conclusion B

`/coach` is removable, but specified shared modules must remain.

Exact modules to preserve:

- `components/SiteFooter.tsx`
- `lib/flours.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- Pizza Session modules, including `lib/session-recipe.ts`, `lib/pizza-session.ts`, `lib/pizza-session-storage.ts`, `lib/pizza-session-timeline.ts` and `lib/pizza-session-review.ts`
- account, auth, cloud session and Party Order modules
- `lib/seo-config.ts`, while removing only the `/coach` legacy noindex entry during the redirect patch

Coach-specific modules that can be retired after link replacement and redirect validation:

- `app/coach/page.tsx` rendered UI
- `app/coach/layout.tsx`
- `lib/pizza-coach.ts`
