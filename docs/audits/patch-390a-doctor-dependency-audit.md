# Patch 390A: Doctor dependency audit

## 1. Executive summary

Audit branch: `patch/390a-doctor-dependency-audit`
Audited starting commit: `70a24f13`
Audit date: 2026-07-14
Scope: audit only

The `/doctor` route is a legacy Dough Doctor experience. Source inspection shows that the Doctor diagnosis engine is isolated in `lib/dough-doctor.ts` and is not called by Pizza Session, Quick Calculator, Sauce, Ovens, Styles, Toppings, Party Orders, account routes or the current Pizza Troubleshooting guide.

However, active product surfaces still link to `/doctor` and generate `/doctor?...` recipe-query URLs. This means the route is not imported as product logic, but it is still exposed as a visible destination. A retirement patch must remove or replace those links before redirecting or deleting the page.

No production code was changed in this patch.

## 2. Doctor route structure

```text
/doctor
├── app/doctor/page.tsx
│   ├── legacy client page
│   ├── reads recipe query parameters with settingsFromUrl()
│   ├── renders Doctor-specific cards and copy
│   ├── calls diagnoseDough() after a user selects an issue
│   ├── links back to /, /plan, /styles and /guide
│   └── renders SiteFooter
├── app/doctor/layout.tsx
│   └── metadataForLegacyRoute("/doctor")
├── lib/dough-doctor.ts
│   ├── DoctorIssueId
│   ├── DoctorLocale
│   ├── doctorIssues
│   ├── issueCopy
│   └── diagnoseDough()
└── public/dough-doctor/*.webp
    ├── sticky.webp
    ├── torn.webp
    ├── tight.webp
    ├── underproofed.webp
    ├── overproofed.webp
    └── ready.webp
```

## 3. Complete import inventory

| Imported symbol | Source file | Used in `/doctor` for | Other production consumers | Classification | Removal risk |
| --- | --- | --- | --- | --- | --- |
| `Image` | `next/image` | Doctor issue image cards | Many routes | B. Shared non-core utility | Low |
| `Link` | `next/link` | Doctor route navigation | Many routes | B. Shared non-core utility | Low |
| `useEffect`, `useMemo`, `useState` | `react` | Doctor client state | Many components | B. Shared non-core utility | Low |
| `SiteFooter` | `components/SiteFooter.tsx` | Doctor footer | Public footer-bearing pages | B. Shared non-core utility | Low |
| `ExperienceLevelSelector` | `components/ExperienceLevelSelector.tsx` | Doctor guidance-mode selector | Homepage calculator, Plan, Account, Quick Calculator | B. Shared non-core utility | Low |
| `diagnoseDough` | `lib/dough-doctor.ts` | Doctor diagnosis engine | None found | C. Doctor-only functional logic | Low |
| `doctorIssues` | `lib/dough-doctor.ts` | Doctor selectable issue list | Test-only import in `tests/education-experience-copy.test.ts` | C. Doctor-only functional logic | Low |
| `issueCopy` | `lib/dough-doctor.ts` | Doctor issue card labels | None found | C. Doctor-only functional logic | Low |
| `DoctorIssueId` | `lib/dough-doctor.ts` | Doctor selected state type | None found | C. Doctor-only functional logic | Low |
| `getEducationExperienceCopy` | `lib/education-experience-copy.ts` | Doctor guidance copy | Plan, tests and other education surfaces | B. Shared non-core utility | Medium |
| `readExperienceLevelPreference` | `lib/experience-levels.ts` | Reads shared guidance preference | Pizza Session, Account, Guide, Quick Calculator, tests | A. Core engine dependency | High |
| `ExperienceLevel` | `lib/experience-levels.ts` | Doctor state type | Pizza Session and many learning/product modules | A. Core engine dependency | High |
| `flourById` | `lib/flours.ts` | Doctor recipe context and flour range checks | Calculator, Plan, Coach, Styles, recipe/session modules | A. Core engine dependency | High |
| `pizzaStyleById` | `lib/pizza-styles.ts` | Doctor style note context | Calculator, Timer, Styles, recipe/session modules | A. Core engine dependency | High |
| `recipeParams` | `lib/recipe-url.ts` | Builds Doctor back/plan links | Calculator, Plan, Coach, Session Recipe, tests | A. Core engine dependency | High |
| `settingsFromUrl` | `lib/recipe-url.ts` | Reads Doctor query context | Calculator, Plan, Sauce-related tools, Timer, Toppings, Coach, tests | A. Core engine dependency | High |
| `RecipeSettings` | `lib/saved-recipes.ts` | Doctor defaults and diagnosis input type | Calculator, saved recipes, session recipe, many engines | A. Core engine dependency | High |
| `metadataForLegacyRoute` | `lib/seo-config.ts` | `/doctor` legacy noindex metadata | `/plan`, `/coach`, SEO tests | B. Shared non-core utility | Medium |

Doctor-local values in `app/doctor/page.tsx`:

| Local item | Purpose | Classification | Removal risk |
| --- | --- | --- | --- |
| `defaults` | Doctor fallback recipe context | C. Doctor-only functional logic | Low |
| `copy` | Doctor route labels and page copy | D. Doctor-only presentation | Low |
| `Locale` | Doctor local locale type | C. Doctor-only functional logic | Low |
| `selected` state | Doctor selected issue state | C. Doctor-only functional logic | Low |
| `ready` state | Doctor client hydration guard | C. Doctor-only state handling | Low |
| `query` | Doctor route query handoff | C. Doctor-only state handling | Low |

## 4. Reverse dependency inventory

| Doctor-related module or route | `/doctor` | Other production routes | Tests | Docs | Assessment |
| --- | --- | --- | --- | --- | --- |
| `app/doctor/page.tsx` | Route implementation | None import it | Accessibility, performance, security, hero-route, legacy-route tests read it | Multiple historical docs | Doctor-only presentation and state |
| `app/doctor/layout.tsx` | Route metadata | None import it | SEO and legacy-route tests cover policy indirectly | SEO docs mention `/doctor` | Doctor-only route metadata wrapper |
| `lib/dough-doctor.ts` | Imported directly | None found | `tests/education-experience-copy.test.ts` imports `doctorIssues` | Historical docs mention diagnosis logic | Doctor-only functional logic |
| `public/dough-doctor/*.webp` | Reached through `doctorIssues` | None found | No direct test import found | None active outside Doctor references | Doctor-only assets |
| `/doctor` route URL | Current page destination | Navigation, homepage, calculator workspace, saved recipe next actions, recipe workflow handoff, SEO policy | Several tests | SEO and historical docs | Active visible route reference, not a logic dependency |

## 5. Dependency graph

```text
/doctor page
├── components
│   ├── SiteFooter -> shared public footer
│   └── ExperienceLevelSelector -> shared guidance selector
├── helpers
│   ├── diagnoseDough -> lib/dough-doctor.ts -> Doctor-only
│   ├── getEducationExperienceCopy -> shared education copy
│   ├── readExperienceLevelPreference -> shared guidance preference
│   ├── flourById -> shared flour data
│   ├── pizzaStyleById -> shared style data
│   ├── recipeParams -> shared recipe query builder
│   └── settingsFromUrl -> shared recipe query parser
├── types
│   ├── DoctorIssueId -> Doctor-only
│   ├── ExperienceLevel -> shared
│   └── RecipeSettings -> shared recipe model
├── constants
│   ├── defaults -> Doctor-only fallback recipe
│   ├── copy -> Doctor-only page copy
│   ├── doctorIssues -> Doctor-only issue list
│   └── issueCopy -> Doctor-only labels
├── storage/query state
│   ├── no Doctor-specific storage key
│   ├── shared doughtools.experienceLevel preference read
│   └── shared recipe URL parameters read from location.search
└── external/shared modules
    ├── flours, pizza-styles, recipe-url, saved-recipes
    ├── seo-config
    └── React / Next primitives
```

Reverse graph:

```text
Doctor-related module
├── lib/dough-doctor.ts
│   ├── app/doctor/page.tsx
│   └── tests/education-experience-copy.test.ts
├── public/dough-doctor/*.webp
│   └── lib/dough-doctor.ts -> app/doctor/page.tsx
├── /doctor route URL
│   ├── lib/navigation.ts
│   ├── lib/homepage.ts
│   ├── components/HomeCalculatorWorkspace.tsx
│   ├── lib/recipe-workflow.ts
│   ├── lib/seo-config.ts
│   ├── tests
│   └── docs
└── app/doctor/*
    ├── tests that read source
    └── docs that reference legacy page status
```

## 6. Production consumers

Doctor logic consumers:

- `app/doctor/page.tsx` imports `diagnoseDough`, `doctorIssues`, `issueCopy` and `DoctorIssueId`.
- No production consumer outside `/doctor` imports `lib/dough-doctor.ts`.
- No production consumer outside `/doctor` calls `diagnoseDough()`.

Visible `/doctor` route consumers:

- `lib/navigation.ts` exposes `{ id: "doctor", label: "Dough Doctor", href: "/doctor" }`.
- `lib/homepage.ts` includes a core tool entry for `/doctor`.
- `components/HomeCalculatorWorkspace.tsx` builds `doctorHref = \`/doctor?${recipeQuery}\`` and renders desktop/mobile Doctor links.
- `components/HomeCalculatorWorkspace.tsx` builds saved recipe next action links with `recipeWorkflowQueryHref("/doctor", savedRecipeQuery)`.
- `lib/recipe-workflow.ts` includes a support action with `href: recipeWorkflowQueryHref("/doctor", recipeQuery)`.
- `lib/seo-config.ts` keeps `/doctor` as a legacy noindex route and stateful query-param route.

These are active route references, not active imports of Doctor diagnosis logic.

## 7. Test-only consumers

Doctor-specific or Doctor-aware tests found:

- `tests/education-experience-copy.test.ts` imports `doctorIssues` to ensure Doctor issue categories remain present.
- `tests/legacy-route-indexing.test.ts` treats `/doctor` as a legacy noindex route and checks the `diagnoseDough` marker.
- `tests/accessibility-baseline.test.ts` reads `app/doctor/page.tsx`.
- `tests/performance-baseline.test.ts` reads/builds route expectations including `/doctor`.
- `tests/security-launch-baseline.test.ts` includes `app/doctor/page.tsx`.
- `tests/sitewide-hero-rollout-audit.test.ts`, `tests/sitewide-hero-system.test.ts`, `tests/navigation.test.ts`, `tests/homepage.test.ts`, `tests/trust-pages.test.ts`, `tests/seo-config.test.ts`, `tests/recipe-workflow.test.ts` and `tests/saved-recipe-account-value.test.ts` contain route, link or policy expectations involving `/doctor`.

These tests do not prove current runtime dependency on Doctor diagnosis logic; they preserve the current legacy route exposure.

## 8. Storage and query parameter usage

Doctor-specific storage:

- No Doctor-specific `localStorage` or `sessionStorage` key was found in `app/doctor/page.tsx` or `lib/dough-doctor.ts`.
- `app/doctor/page.tsx` reads the shared guidance preference through `readExperienceLevelPreference()`.
- The underlying key is `doughtools.experienceLevel`, which is shared by current product and learning surfaces.

Doctor query handling:

- `/doctor` reads shared recipe query parameters with `settingsFromUrl(window.location.search)`.
- `/doctor` builds shared recipe query strings with `recipeParams(settings).toString()`.
- Active pages generate `/doctor?...` links:
  - `components/HomeCalculatorWorkspace.tsx`
  - `lib/recipe-workflow.ts`

The query parameters are shared recipe parameters, not Doctor-specific persisted schema.

## 9. Session-schema dependency check

Searches across:

- `app/session/**`
- `components/session/**`
- `lib/pizza-session*.ts`
- `lib/session-recipe.ts`
- `lib/saved-recipes.ts`
- account and API route surfaces

Findings:

- No `doctor`, `Doctor`, `diagnoseDough`, `DoctorIssue`, or `dough-doctor` references were found in Pizza Session schemas, storage, recipe generation, shopping, timeline, kitchen, review, cloud restore, account or API code.
- No Doctor result type is stored in session data.
- No Doctor type is stored in account data.
- No Doctor field is part of `PizzaSession` or saved session history.

Removing Doctor-specific logic does not risk changing Pizza Session schema or account storage based on source evidence.

## 10. Calculation-engine dependency check

Searches across current calculation and planning surfaces found:

- No shared calculation engine calls `diagnoseDough()`.
- Quick Calculator does not import Doctor modules.
- Pizza Troubleshooting does not import Doctor modules.
- Pizza Session recipe, shopping, timeline, kitchen and review do not import Doctor modules.
- Toppings, Sauce, Ovens and Styles do not import Doctor modules.

Shared helpers used by `/doctor` that must remain:

- `lib/flours.ts`
- `lib/pizza-styles.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/experience-levels.ts`
- `lib/education-experience-copy.ts`
- `components/ExperienceLevelSelector.tsx`
- `components/SiteFooter.tsx`
- `lib/seo-config.ts`

These helpers are not Doctor-owned even though Doctor imports them.

## 11. Asset dependency check

Doctor assets found:

- `public/dough-doctor/sticky.webp`
- `public/dough-doctor/torn.webp`
- `public/dough-doctor/tight.webp`
- `public/dough-doctor/underproofed.webp`
- `public/dough-doctor/overproofed.webp`
- `public/dough-doctor/ready.webp`

Search result:

- The only active source reference to `/dough-doctor/*.webp` is `lib/dough-doctor.ts`.
- No current troubleshooting image, guide image or session image uses the `public/dough-doctor` path.

Assessment: Doctor-only assets, safe deletion candidates in a future retirement patch after route links are handled.

## 12. Internal-link inventory

Active production `/doctor` links or route references:

| Source | Reference | Runtime role |
| --- | --- | --- |
| `lib/navigation.ts` | `href: "/doctor"` | Shared navigation model exposes Dough Doctor |
| `lib/homepage.ts` | `href: "/doctor"` | Homepage tool model exposes Dough Doctor |
| `components/HomeCalculatorWorkspace.tsx` | `doctorHref = \`/doctor?${recipeQuery}\`` | Calculator header/mobile tool link |
| `components/HomeCalculatorWorkspace.tsx` | `recipeWorkflowQueryHref("/doctor", savedRecipeQuery)` | Saved recipe next action |
| `lib/recipe-workflow.ts` | `recipeWorkflowQueryHref("/doctor", recipeQuery)` | Recipe workflow support action |
| `lib/seo-config.ts` | `/doctor` legacy noindex and stateful route policy | SEO policy |
| `app/doctor/layout.tsx` | `metadataForLegacyRoute("/doctor")` | Route metadata |

Documentation and tests also reference `/doctor`, but those are not runtime links.

## 13. Risk classification

| Item | Classification | Removal risk | Reason | Required validation before deletion | Migration needed |
| --- | --- | --- | --- | --- | --- |
| `app/doctor/page.tsx` | D. Doctor-only presentation plus C. Doctor-only state | Low for logic, Medium for user-visible route | No other imports, but active links still point to `/doctor` | Confirm links removed or redirected; browser-test redirect | Yes, route/link migration |
| `app/doctor/layout.tsx` | D. Doctor-only metadata wrapper | Low | Only supports `/doctor` legacy metadata | Confirm `/doctor` redirect handles SEO policy | Yes, SEO route policy update |
| `lib/dough-doctor.ts` | C. Doctor-only functional logic | Low | No production imports outside `/doctor`; one test-only import | Confirm no imports after `/doctor` removal | No product-data migration |
| `doctorIssues` | C. Doctor-only functional logic | Low | Used by `/doctor` and one test | Update/remove test if retiring Doctor | No |
| `issueCopy` | C. Doctor-only functional logic | Low | Used only by `/doctor` | Confirm no import remains | No |
| `diagnoseDough()` | C. Doctor-only functional logic | Low | No shared engine calls it | Confirm no import remains | No |
| `public/dough-doctor/*.webp` | D. Doctor-only assets | Low | Only referenced through `lib/dough-doctor.ts` | Source search after removing Doctor page/module | No |
| `getEducationExperienceCopy().doctor` copy | C. Doctor-only copy inside shared module | Medium | Module is shared; Doctor subcopy appears route-specific | Remove only Doctor subcopy after tests and types are adjusted | No product-data migration |
| `ExperienceLevelSelector` | B. Shared non-core utility | High if removed | Used by active account, calculator, plan and quick calculator surfaces | Must remain | No |
| `readExperienceLevelPreference` / `ExperienceLevel` | A. Core/shared dependency | High | Used by Pizza Session and learning surfaces | Must remain | No |
| `flourById` / flour data | A. Core engine dependency | High | Used by calculator, planner, styles and session-adjacent logic | Must remain | No |
| `pizzaStyleById` / style data | A. Core engine dependency | High | Used by calculator, timer, styles and recipe/session logic | Must remain | No |
| `recipeParams` / `settingsFromUrl` | A. Core/shared dependency | High | Used by calculator, plan, session recipe and multiple tools | Must remain | No |
| `RecipeSettings` | A. Core/shared dependency | High | Used by saved recipes, calculator and recipe/session modules | Must remain | No |
| `metadataForLegacyRoute` | B. Shared non-core utility | Medium | Used by remaining legacy routes | Must remain while `/plan` and `/coach` use it | No |
| `/doctor` links in product surfaces | Route exposure, not logic | Medium | Removing route first would break visible links | Replace/remove links or add redirect in same retirement patch | Yes, link/redirect migration |

## 14. Safe deletion candidates

Safe future deletion candidates after visible `/doctor` links are removed or the route is redirected:

- `app/doctor/page.tsx`
- `app/doctor/layout.tsx`
- `lib/dough-doctor.ts`
- `public/dough-doctor/*.webp`
- Doctor-specific tests that only protect the retired legacy page
- Doctor-specific branch of `educationExperienceCopy`, if no active consumer remains after type/test updates

Do not delete shared modules imported by `/doctor`.

## 15. Shared modules that must remain

These are used outside Doctor and must remain:

- `components/SiteFooter.tsx`
- `components/ExperienceLevelSelector.tsx`
- `lib/education-experience-copy.ts`
- `lib/experience-levels.ts`
- `lib/flours.ts`
- `lib/pizza-styles.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/seo-config.ts`

The fact that `/doctor` imports these modules does not make them Doctor-owned.

## 16. Unclear items

No source-level dependency is unclear.

Not inspected in this audit:

- live analytics or real-user route usage
- external inbound links to `/doctor`
- Search Console state

Those are product/SEO rollout questions, not source dependencies.

## 17. Required questions answered

1. Does `/session/start` import any Doctor module? No.
2. Does `/session/recipe` import any Doctor module? No.
3. Does `/session/shopping` import any Doctor module? No.
4. Does `/session/timeline` import any Doctor module? No.
5. Does `/session/kitchen` import any Doctor module? No.
6. Does `/session/review` import any Doctor module? No.
7. Does Quick Calculator import any Doctor module? No.
8. Does Troubleshooting import any Doctor module? No.
9. Does any shared calculation engine call `diagnoseDough`? No.
10. Is `diagnoseDough` used anywhere outside `/doctor` and Doctor tests? No. In current source, `diagnoseDough` is called only by `app/doctor/page.tsx`; tests only check markers or `doctorIssues`.
11. Does removing `/doctor` risk changing any formula or persisted data? No formula or persisted-data dependency was found. Removing the route without link cleanup would create broken visible links.
12. Are any Doctor types stored in session or account data? No.
13. Are any Doctor query parameters generated by active pages? Active pages generate shared recipe query parameters for `/doctor`; no Doctor-specific query schema was found.
14. Are any Doctor assets reused elsewhere? No.
15. Are any Doctor links still visible in production? Yes: navigation, homepage model, calculator workspace links, saved recipe next actions and recipe workflow handoff still point to `/doctor`.

## 18. Recommendation for the next step

Do not remove `/doctor` in isolation.

Recommended Patch 390B:

1. Remove or replace active product links to `/doctor`.
2. Decide redirect target, likely `/guide/pizza-troubleshooting` unless product owner chooses a different target.
3. Convert `/doctor` to a server-side redirect.
4. Remove `lib/dough-doctor.ts` and `public/dough-doctor/*.webp` only after source search confirms no remaining imports.
5. Update SEO legacy route policy and tests.
6. Keep shared modules listed in section 15.

## 19. Validation performed

Commands and inspections performed:

- repository-wide import search for `/doctor` imports and imported modules
- symbol search for `diagnoseDough`, `doctorIssues`, `issueCopy`, `DoctorIssueId`, `DoctorLocale`
- route reference search for `/doctor`, `doctorHref`, and `recipeWorkflowQueryHref`
- storage-key search for Doctor-specific localStorage/sessionStorage
- query-parameter search for `settingsFromUrl`, `recipeParams` and `/doctor?...` generation
- test reference search for Doctor-specific tests and route expectations
- asset reference search for `/dough-doctor/*.webp`
- session-schema search across `app/session`, `components/session`, `lib/pizza-session*.ts`, `lib/session-recipe.ts`, account and API surfaces
- calculation-engine search across Quick Calculator, Pizza Session, Troubleshooting and shared product modules

No production code, route behavior, tests, formulas, persistence, authentication, SEO behavior or deployment state changed.

## 20. Final conclusion

### Conclusion B

`/doctor` is removable, but specific shared modules must remain.

Shared modules that must remain:

- `components/SiteFooter.tsx`
- `components/ExperienceLevelSelector.tsx`
- `lib/education-experience-copy.ts`
- `lib/experience-levels.ts`
- `lib/flours.ts`
- `lib/pizza-styles.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts`
- `lib/seo-config.ts`

Doctor-specific logic is source-isolated, but active product links to `/doctor` must be removed or redirected in the retirement patch before the route is deleted or redirected.
