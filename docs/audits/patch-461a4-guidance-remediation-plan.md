# Patch 461A4: Guidance-Level Remediation Plan

## 1. Executive Summary

This document consolidates the findings from:

- `patch-461a1-guidance-foundation-audit.md`
- `patch-461a2-guides-calculators-guidance-audit.md`
- `patch-461a3-workflow-utility-guidance-audit.md`

The current guidance-level foundation is mostly coherent: the canonical storage key is `doughtools.experienceLevel`, the accepted values are `beginner`, `enthusiast`, and `pizza_nerd`, and invalid or missing values normalize to Beginner. Most modern Guide and calculator pages already render only the selected educational level.

The product model needs three targeted corrections:

1. Separate guidance level from Pizza Plan logic on `/session/start` and `/session/recipe`.
2. Filter four Practical Pizza Tips article pages so only the selected level renders.
3. Harden canonical preference reading and add regression coverage for fallback, storage-denial, DOM filtering, and no-logic-change guarantees.

Deduplicated issue counts:

| Severity | Count | Summary |
| --- | ---: | --- |
| Critical | 2 | Guidance level can affect Pizza Plan defaults, control availability, persisted values, and recipe recalculation. |
| High | 1 | Four Practical Tips articles visibly render all three guidance levels. |
| Medium | 3 | Storage exception handling, literal Beginner initial states/hydration risk, and tests currently encode inconsistent behavior. |
| Low | 1 | Minor user-facing terminology drift between guidance-level labels. |

Direct implementation routes requiring changes: 6.

- `/session/start`
- `/session/recipe`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`

Alias or entry routes indirectly affected by the session-start fix: `/start`, `/plan`.

## 2. Consolidated Canonical Product Rules

### Core Rule

The final model is:

`One canonical Pizza Plan logic, different instructional depth.`

Guidance level may change:

- explanation depth
- helper text
- examples
- troubleshooting framing
- technical caveats
- optional educational detail
- mobile or desktop presentation density

Guidance level must not change:

- formulas
- default recipe values
- saved Pizza Plan data
- workflow state
- required controls
- user permissions
- timer mechanics
- legal meaning
- security behavior
- account deletion or export behavior
- admin visibility
- public guest functionality
- safety-critical instructions

### Beginner

Beginner should receive direct defaults, short explanations, and immediate next actions. Beginner copy may simplify reasoning, but it must not remove access to a calculation-affecting control or silently force a different canonical value.

### Enthusiast

Enthusiast should receive practical adjustments, common exceptions, and cause-effect explanations. Enthusiast must use the same workflow controls, defaults, formulas, and saved values as every other level.

### Pizza Nerd

Pizza Nerd should receive concise technical detail about assumptions, ratios, temperature, fermentation, and tradeoffs. Pizza Nerd may see fuller explanations by default, but Pizza Nerd must not be the only level capable of accessing persisted recipe inputs.

### Shared Content

The following content is shared and must remain available to every level:

- safety information
- food handling guidance
- required workflow actions
- canonical facts
- quantities and formulas
- plan summaries
- shopping quantities
- schedule times
- timer controls
- account, privacy, security, admin, legal, and guest-link functionality

### Selected-Level Content

Selected-level educational content should render only for the selected level. Non-selected educational content should be absent from the final DOM. CSS-only hiding, inactive tabs containing non-selected level copy, and three simultaneous level cards are not acceptable for level-specific guidance.

### Calculation Logic and Saved Data

Guidance level must not silently affect:

- dough ball weight
- yeast type
- hydration override
- fermentation temperature override
- calculated ingredient amounts
- yeast recommendation direction
- shopping quantities derived from recipe output
- session persistence or sync data

Advanced settings may be progressively disclosed, but the underlying calculation model must remain canonical for all levels.

### Fallback Behavior

Missing, invalid, legacy, or unavailable preference storage should fall back safely to Beginner. Storage access denial must not crash a page.

### DOM Rendering

Final DOM should contain:

- shared content
- selected level content
- level selector controls where appropriate

Final DOM should not contain:

- non-selected educational level copy
- all-level comparison cards unless the page is explicitly about choosing a guidance level
- hidden duplicates that create blank space or assistive-technology noise

### Mobile Presentation

Mobile should be action-first. Selected-level explanation should not push the current task or primary control below excessive scrolling. Mobile must not compress all three levels into a stacked comparison.

### Desktop Presentation

Desktop may use more width for selected-level context, examples, or comparisons. Desktop must not use extra width to expose all three levels.

## 3. Confirmed Preference-System Behavior

Source verified in `lib/experience-levels.ts`:

| Item | Confirmed behavior |
| --- | --- |
| Canonical key | `doughtools.experienceLevel` |
| Accepted values | `beginner`, `enthusiast`, `pizza_nerd` |
| Labels | `Beginner`, `Enthusiast`, `Pizza Nerd` |
| Default | `beginner` |
| Missing value | normalizes to `beginner` |
| Invalid value | normalizes to `beginner` |
| Legacy values | `intermediate` -> `enthusiast`; `advanced`, `nerd`, `pizza nerd`, `pizza-nerd` -> `pizza_nerd` |
| Canonical read utility | `readExperienceLevelPreference(storage?)` |
| Canonical write utility | `writeExperienceLevelPreference(level, storage?)` |
| Canonical clear utility | `clearExperienceLevelPreference(storage?)` |
| Server behavior | no browser storage, so default Beginner applies |
| Client behavior | components read from local storage after mount unless they use a supplied test storage |

Confirmed risk:

- `readExperienceLevelPreference`, `writeExperienceLevelPreference`, and `clearExperienceLevelPreference` do not catch storage access exceptions.
- Several client components initialize state to literal `"beginner"` before reading storage, which can create a selected-level content flash when the stored value is Enthusiast or Pizza Nerd.

These are foundation issues, not page-level redesign issues.

## 4. Focused `/session/start` and `/session/recipe` Investigation

### `/session/start`

Source files verified:

- `app/session/start/page.tsx`
- `tests/start-pizza-session-wizard.test.ts`
- `lib/pizza-session.ts`
- `lib/yeast-types.ts`

Relevant source behavior:

- `shouldShowPizzaNerdDoughControls(level)` returns true only for `pizza_nerd`.
- `simpleDoughDefaultsPatchForLevel(level, session)` returns no patch for Pizza Nerd.
- For Beginner and Enthusiast, `simpleDoughDefaultsPatchForLevel` can patch:
  - `doughBallWeight: SIMPLE_SESSION_DOUGH_BALL_WEIGHT`
  - `yeastType: DEFAULT_SESSION_YEAST_TYPE`
- `SIMPLE_SESSION_DOUGH_BALL_WEIGHT` is `260`.
- `DEFAULT_SESSION_YEAST_TYPE` is `ady`.
- The dough ball weight and yeast type controls are rendered only when `showPizzaNerdDoughControls` is true.
- The active session stores `experienceLevel`.

Affected controls:

- dough ball size quick picks
- custom grams per dough ball
- yeast type

Affected defaults:

- Beginner and Enthusiast can be forced to 260 g dough balls.
- Beginner and Enthusiast can be forced to active dry yeast.
- Pizza Nerd keeps the advanced controls visible and avoids the simplification patch.

Affected calculated or persisted values:

- `doughBallWeight`
- `yeastType`
- downstream recipe quantities that depend on dough ball weight
- session payloads stored locally or synced to cloud

Presentation-only differences:

- shorter explanations
- level badge display
- selected-level copy

Control availability difference:

- Beginner and Enthusiast cannot access calculation-affecting dough ball weight and yeast type controls from the same screen.

Canonical logic difference:

- Beginner and Enthusiast receive an automatic defaults patch that Pizza Nerd does not receive.

Conclusion:

This is a Critical issue. Otherwise identical user input can produce different Pizza Plans because of the selected guidance level. The fix must remove level-dependent saved-value mutation and make calculation-affecting controls available through a shared canonical model, even if some controls are progressively disclosed.

### `/session/recipe`

Source files verified:

- `app/session/recipe/page.tsx`
- `tests/session-recipe.test.ts`

Relevant source behavior:

- `showPizzaNerdControls = session.experienceLevel === "pizza_nerd"`.
- Hydration and fermentation temperature controls render only inside the Pizza Nerd controls block.
- `updateHydrationOverride(value)` writes `hydrationPercentOverride: value`.
- `updateTemperatureOverride(value)` writes `fermentationTemperatureCOverride: value`.
- Both update paths call `regenerateRecipeAfterSessionUpdate(updated)`.
- Existing tests verify that these overrides are persisted and used in regenerated recipe snapshots.

Affected controls:

- hydration override
- fermentation temperature override

Affected defaults and calculated values:

- active hydration
- water amount
- flour split dependent on hydration
- fermentation temperature used by continuous yeast guidance
- regenerated recipe snapshot
- downstream shopping dough quantities where hydration affects ingredient totals

Affected persisted values:

- `hydrationPercentOverride`
- `fermentationTemperatureCOverride`

Presentation-only differences:

- the label `Pizza Nerd controls`
- technical helper copy around the advanced controls

Control availability difference:

- only Pizza Nerd sessions can access persisted recipe-affecting override controls.

Canonical logic difference:

- Pizza Nerd can persist values that other levels cannot access from the page. The guidance level does not merely change explanation depth; it gates recipe-affecting controls.

Switching behavior:

- No source evidence was found that changing the account-level preference alone rewrites an already active session.
- The critical impact is still present because the session's stored `experienceLevel` controls access to persisted calculation inputs.

Conclusion:

This is a Critical issue. Pizza Nerd has exclusive access to persisted recipe-affecting controls. The correction must preserve one canonical recipe model and make calculation-affecting controls available consistently, while keeping selected-level instructional depth.

## 5. Guides and Calculators Consolidation

### Pages already filtering selected level correctly

The A2 audit and focused source review support that these pages already use selected-level educational rendering appropriately:

- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/calculator/quick`

For these pages, implementation patches should avoid redesign and should preserve the current selected-level behavior.

### Guide hub

`/guides` is primarily a navigation and learning-entry page. It does not need to personalize route availability by level. If it uses level language, that language should frame learning depth only; it should not hide guides.

### Calculators

Calculator rule:

- inputs, formulas, defaults, validation, units, and numerical outputs are canonical and shared
- only interpretation, practical next step, or technical caveat copy may vary by level

No consolidated Critical calculator issue remains outside the session workflow. The Quick calculator is a model to protect, not redesign, in this series.

### Costs and other calculators

Costs and other utility calculators should remain shared unless a future implementation patch finds explicit educational text that needs selected-level filtering. Calculation logic must not be level-sensitive.

## 6. Practical Tips Root Cause

Affected routes:

- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`

Source files:

- `app/guide/practical-pizza-tips/leftover-dough/page.tsx`
- `app/guide/practical-pizza-tips/fermentation-length/page.tsx`
- `app/guide/practical-pizza-tips/containers-and-lids/page.tsx`
- `app/guide/practical-pizza-tips/common-problems/page.tsx`
- `tests/practical-pizza-tips.test.ts`

Root cause:

- Each article defines a local `levelGuidance` array with Beginner, Enthusiast, and Pizza Nerd entries.
- Each article renders `levelGuidance.map(...)`.
- `LevelGuidanceCard` resolves display metadata from `EXPERIENCE_LEVELS`.
- No canonical preference reader is used.
- Non-selected level content is visible in the final DOM.

This is one duplicated implementation pattern, not four independent root causes.

One shared correction can fix all four routes by introducing a selected-level article presentation pattern and updating the article tests.

Content that should remain shared:

- safety and discard guidance
- comparison tables
- universal practical actions
- links to existing troubleshooting guides
- food-safety and heat-safety warnings

Content that should render only for the selected level:

- Beginner direct-action explanation
- Enthusiast practical-adjustment explanation
- Pizza Nerd technical explanation

Special note for `common-problems`:

- The shared heading `Beginner fixes for the current pizza.` appears outside the level guidance cards.
- Patch 461C should decide whether this is truly shared quick-fix content with a misleading label or selected Beginner-only content.
- That correction should be limited to the article pattern and tests.

Required regression tests for Patch 461C:

- each affected article renders the selected level
- non-selected level labels and body copy are absent from the final DOM
- shared safety content remains visible
- invalid and missing preference values fall back to Beginner
- no CSS-only hiding is used

## 7. Foundation and Fallback Consolidation

### Canonical implementation to keep

`lib/experience-levels.ts` should remain the canonical source for:

- value type
- labels
- descriptions
- storage key
- normalization
- default fallback
- read/write helpers
- corner accent helpers

### Findings requiring production changes

1. Storage exception handling should be centralized.
   - Reads should fall back to Beginner if storage access throws.
   - Writes and clears should fail safely without crashing UI.

2. Literal initial Beginner state should be replaced where it can produce a visible selected-level flash.
   - Prefer a shared hook or utility that exposes a stable selected level and safe hydration behavior.
   - Do not create duplicate parsing logic in components.

3. Direct readers should not be replaced blindly.
   - Components that already call the canonical helper are acceptable.
   - Components with repeated mount-effect patterns can be consolidated if doing so reduces flash risk and test gaps.

### Findings acceptable as implementation details

- Server-rendered pages that cannot read browser storage may default to Beginner before client hydration if they render no level-specific educational content or if a client component handles selected-level rendering.
- Internal identifiers using `experienceLevel` are acceptable. User-facing terminology can use `guidance level` where clearer, but this does not require broad renaming.

### Preferred central correction

Patch 461D should add or harden a canonical client-side preference pattern that:

- reads `doughtools.experienceLevel`
- normalizes legacy and invalid values
- catches storage denial
- falls back to Beginner
- avoids rendering all three levels
- avoids duplicated literal fallback logic where evidenced

## 8. Correct Non-Use of Guidance Levels

Guidance-level personalization should not be introduced for these route groups or behaviors:

1. authentication and identity flows
2. login, logout, callback, password recovery, and email-change flows
3. account permissions
4. security settings
5. account deletion flow
6. data export flow
7. GDPR explanations
8. Privacy Policy
9. Terms
10. Methodology and legal notices
11. admin permissions
12. admin data access
13. public theme administration
14. sound administration
15. Party Order ownership rules
16. Party Order guest submissions
17. public shared-link behavior
18. private guest tokens
19. timer duration
20. countdown behavior
21. alarm and sound behavior
22. Kitchen completion mechanics
23. Review rating and completion data
24. Shopping quantities and bought states
25. Timeline schedule calculations
26. public footer
27. global navigation
28. header behavior
29. 404 and error recovery actions
30. expired-link recovery actions
31. unauthorized-state recovery actions
32. storage object deletion behavior
33. Auth account deletion behavior
34. Supabase RLS or grants
35. route handlers and APIs
36. database schema and migrations

Correct non-use is intentional. These areas should remain identical across Beginner, Enthusiast, and Pizza Nerd except where they merely display the current preference selector itself.

## 9. Deduplicated Issue Register

### 461-I01: Session Start Applies Level-Dependent Defaults

| Field | Detail |
| --- | --- |
| Severity | Critical |
| Affected routes | `/session/start`; aliases `/start` and `/plan` inherit the same behavior |
| Source files | `app/session/start/page.tsx`, `tests/start-pizza-session-wizard.test.ts`, `lib/pizza-session.ts`, `lib/yeast-types.ts` |
| Observed behavior | Beginner and Enthusiast sessions receive a simplification patch for dough ball weight and yeast type; Pizza Nerd sessions do not. Dough ball and yeast controls are visible only for Pizza Nerd. |
| Expected behavior | Guidance level may alter explanation depth but must not silently alter saved defaults or hide calculation-affecting controls. |
| User impact | Otherwise identical input can create different Pizza Plans depending on guidance level. Non-Pizza Nerd users cannot adjust some recipe-affecting inputs. |
| Calculations or saved data affected | Yes: `doughBallWeight`, `yeastType`, and downstream recipe quantities. |
| Non-selected DOM issue | No. This issue is workflow logic and control availability. |
| Recommended correction | Remove level-dependent default mutation. Provide one canonical default model and expose calculation-affecting controls consistently, potentially behind shared advanced disclosure. |
| Required tests | Same input produces same defaults across levels; controls or disclosure available across levels; level switching does not rewrite existing session values; persisted session fields are stable. |
| Dependencies | None. |
| Patch assignment | 461B |

### 461-I02: Dough Plan Gates Persisted Recipe Overrides by Level

| Field | Detail |
| --- | --- |
| Severity | Critical |
| Affected routes | `/session/recipe` |
| Source files | `app/session/recipe/page.tsx`, `tests/session-recipe.test.ts` |
| Observed behavior | Hydration and fermentation temperature override controls render only for Pizza Nerd sessions and persist recipe-affecting values. |
| Expected behavior | Calculation-affecting controls must not be exclusive to one guidance level. |
| User impact | Pizza Nerd users can produce and persist recipe values that other levels cannot access from the page. |
| Calculations or saved data affected | Yes: `hydrationPercentOverride`, `fermentationTemperatureCOverride`, regenerated recipe snapshot, and downstream ingredient quantities. |
| Non-selected DOM issue | No. This issue is control availability and saved data. |
| Recommended correction | Keep technical explanation level-aware, but make recipe-affecting controls part of a shared canonical advanced settings model or remove level-gating from persisted overrides. |
| Required tests | Overrides do not depend on selected level; controls/disclosure are available consistently; recipe outputs are unchanged unless the user explicitly changes a shared control; existing saved overrides remain honored. |
| Dependencies | 461-I01 should be fixed in the same patch to keep session workflow rules coherent. |
| Patch assignment | 461B |

### 461-I03: Practical Tips Articles Render All Guidance Levels

| Field | Detail |
| --- | --- |
| Severity | High |
| Affected routes | Four Practical Tips article routes |
| Source files | `app/guide/practical-pizza-tips/*/page.tsx`, `tests/practical-pizza-tips.test.ts` |
| Observed behavior | Each affected article renders Beginner, Enthusiast, and Pizza Nerd cards through `levelGuidance.map(...)`. |
| Expected behavior | Only selected-level educational content should render; shared safety and practical facts remain visible. |
| User impact | Mobile pages are longer and more confusing; non-selected explanations remain visible and available to assistive technology. |
| Calculations or saved data affected | No. |
| Non-selected DOM issue | Yes: all level content is visible in final DOM. |
| Recommended correction | Introduce a selected-level article pattern and update each affected article to render only the selected level while preserving shared sections. |
| Required tests | Beginner/Enthusiast/Pizza Nerd article rendering; non-selected DOM absence; missing/invalid fallback; shared safety visibility. |
| Dependencies | Can be implemented independently after 461B. |
| Patch assignment | 461C |

### 461-I04: Preference Storage Exceptions Are Not Caught

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Affected routes | All client surfaces that call the canonical preference helpers |
| Source files | `lib/experience-levels.ts` and direct-reader components |
| Observed behavior | Storage `getItem`, `setItem`, or `removeItem` exceptions can escape. |
| Expected behavior | Storage denial should fall back safely to Beginner without crashing. |
| User impact | Privacy-mode, blocked-storage, or browser-policy cases can break level-sensitive UI. |
| Calculations or saved data affected | No direct calculation effect. |
| Non-selected DOM issue | Possible secondary issue if fallback fails. |
| Recommended correction | Catch storage exceptions centrally in canonical read/write/clear helpers. |
| Required tests | Storage get/set/remove throw cases; safe Beginner fallback; no crash. |
| Dependencies | None. |
| Patch assignment | 461D |

### 461-I05: Literal Beginner Initial States Can Cause Selected-Level Flash

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Affected routes | Multiple client-rendered Guide, calculator, homepage, and workflow surfaces |
| Source files | `components/HomeCalculatorWorkspace.tsx`, `components/guide/DoughGuidePageClient.tsx`, `components/toppings/ToppingBalanceLab.tsx`, `components/quick-calculator/QuickDoughCalculator.tsx`, `app/session/start/page.tsx`, and related readers |
| Observed behavior | Some components initialize state to literal `"beginner"` before reading the canonical preference. |
| Expected behavior | A stored Enthusiast or Pizza Nerd preference should not flash Beginner-specific educational content before hydration settles. |
| User impact | Brief incorrect guidance can appear on level-sensitive surfaces. |
| Calculations or saved data affected | No, unless combined with workflow code in 461-I01. |
| Non-selected DOM issue | Possible during hydration; final DOM is correct on many modern pages. |
| Recommended correction | Centralize client preference reading and use a stable hydration pattern where selected-level educational content is rendered. |
| Required tests | Missing/invalid values, stored Pizza Nerd value, no all-level render, representative no-flash or stable initial rendering tests where feasible. |
| Dependencies | Should follow 461B and 461C so the largest behavior defects are fixed first. |
| Patch assignment | 461D |

### 461-I06: Regression Tests Encode Old or Incomplete Behavior

| Field | Detail |
| --- | --- |
| Severity | Medium |
| Affected routes | `/session/start`, `/session/recipe`, four Practical Tips article routes, representative protected routes |
| Source files | `tests/start-pizza-session-wizard.test.ts`, `tests/session-recipe.test.ts`, `tests/practical-pizza-tips.test.ts`, existing guidance-level tests |
| Observed behavior | Some tests assert Pizza Nerd-only calculation controls or all-level Practical Tips structure. Other route groups lack explicit invariance tests. |
| Expected behavior | Tests should protect the canonical model: selected educational depth only, shared workflow logic, and no level-sensitive calculations. |
| User impact | Current tests can preserve defects and miss regressions in protected areas. |
| Calculations or saved data affected | Tests do not change data but can permit calculation regressions. |
| Non-selected DOM issue | Practical Tips tests currently tolerate all-level DOM. |
| Recommended correction | Update focused tests in 461B and 461C; add sitewide foundation regression coverage in 461D. |
| Required tests | See patch assignments. |
| Dependencies | Test changes should accompany the relevant behavior corrections. |
| Patch assignment | 461B, 461C, 461D |

### 461-I07: Minor User-Facing Terminology Drift

| Field | Detail |
| --- | --- |
| Severity | Low |
| Affected routes | Scattered user-facing settings and learning surfaces |
| Source files | Components using `experience level`, `guidance level`, `guidance mode`, or equivalent labels |
| Observed behavior | Terminology alternates in some user-facing contexts. |
| Expected behavior | The preference can be described consistently as a guidance level, while internal identifiers may remain `experienceLevel`. |
| User impact | Minor clarity issue; not a functional defect. |
| Calculations or saved data affected | No. |
| Non-selected DOM issue | No. |
| Recommended correction | Only adjust terminology where directly touched by 461D tests or preference UI. Do not create a broad copy patch inside the 461 series. |
| Required tests | Focused copy assertions only if changed. |
| Dependencies | None. |
| Patch assignment | 461D, if touched; otherwise backlog. |

## 10. Final Severity Counts

Deduplicated counts:

- Critical: 2
- High: 1
- Medium: 3
- Low: 1

The A2 count of four High issues is consolidated into one High issue because all four Practical Tips article routes share the same rendering pattern and can be fixed together.

The A3 Critical findings are consolidated into two Critical issues because `/session/start` and `/session/recipe` affect different controls, different persisted fields, and different stages of the Pizza Plan workflow.

## 11. Pages and Route Groups Requiring No Changes

### Already rendering selected level correctly

- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/calculator/quick`

### Correctly shared or intentionally non-personalized

These route groups should be protected from 461 implementation patches unless a touched component requires a targeted regression test:

1. `/`
2. `/guides`
3. `/guide/practical-pizza-tips`
4. `/calculator/cost`
5. `/shopping`
6. `/timeline`
7. `/kitchen`
8. `/timer`
9. `/review`
10. `/account`
11. `/account/settings`
12. `/account/settings/preferences`
13. `/account/settings/privacy`
14. `/account/settings/security`
15. `/login`
16. `/auth/callback`
17. `/auth/forgot-password`
18. `/auth/reset-password`
19. email-change and account-access flows
20. `/party-orders`
21. Party Order owner dynamic routes
22. Party Order guest dynamic routes
23. public shared-link states
24. `/admin`
25. `/admin/appearance`
26. `/admin/sounds`
27. `/privacy`
28. `/terms`
29. `/methodology`
30. `/about`
31. `not-found`
32. unauthorized states
33. expired-link states
34. empty account states
35. route handlers and APIs
36. database, RLS, migrations, and storage policies

Protected route-group count: 36.

## 12. Exactly Three Implementation Patches

### Patch 461B: Separate Guidance Level From Pizza Plan Logic

Scope:

- `/session/start`
- `/session/recipe`
- direct session workflow helpers and tests needed for these pages

Expected source areas:

- `app/session/start/page.tsx`
- `app/session/recipe/page.tsx`
- `tests/start-pizza-session-wizard.test.ts`
- `tests/session-recipe.test.ts`
- narrowly related Pizza Session helper tests if needed

Goal:

- preserve one canonical calculation model
- prevent guidance level from silently changing defaults or saved values
- keep appropriate instructional-depth differences
- make calculation-affecting controls consistently available through a shared workflow model

Exact exclusions:

- Practical Tips articles
- general preference utility cleanup
- Guide redesign
- calculators outside session workflow
- database, APIs, migrations, auth, Shopping, Timeline, Kitchen, Review, account, admin, legal pages

Acceptance criteria:

1. Beginner, Enthusiast, and Pizza Nerd do not receive different saved defaults solely because of guidance level.
2. `doughBallWeight` and `yeastType` are not silently patched by selected level.
3. Hydration and fermentation temperature override access is not exclusive to Pizza Nerd if those controls persist recipe-affecting values.
4. Existing saved session values remain honored.
5. Switching guidance level does not reset, replace, or silently recalculate existing recipe values.
6. Instructional copy may still vary by level.

Required focused tests:

- same start input creates the same canonical saved defaults across levels
- level changes do not mutate an existing active session
- calculation-affecting controls or advanced disclosure are available consistently
- Pizza Nerd technical explanation can remain selected-level without controlling saved data access
- recipe output changes only after explicit user action, not from guidance-level selection alone
- existing persisted override values are preserved

Regression risks:

- changing tests that currently assert old Pizza Nerd-only behavior
- accidentally broadening the workflow UI too much on mobile
- unintentionally changing defaults for existing saved sessions

Rollback boundary:

- revert 461B only if session workflow regression appears; it should not affect Practical Tips or foundation utilities.

### Patch 461C: Filter Practical Tips by Selected Level

Scope:

- four affected Practical Tips article routes
- their shared or repeated level-guidance presentation pattern
- selected-level DOM rendering tests

Expected source areas:

- `app/guide/practical-pizza-tips/leftover-dough/page.tsx`
- `app/guide/practical-pizza-tips/fermentation-length/page.tsx`
- `app/guide/practical-pizza-tips/containers-and-lids/page.tsx`
- `app/guide/practical-pizza-tips/common-problems/page.tsx`
- optional small shared Practical Tips client component
- `tests/practical-pizza-tips.test.ts`

Goal:

- render only the selected level
- keep shared article content visible
- remove non-selected content from final DOM
- preserve routes and article meaning

Exact exclusions:

- Pizza Plan workflow
- calculator logic
- global preference utility hardening beyond what is strictly required to read the selected level
- article redesign or large content rewrite
- navigation and footer

Acceptance criteria:

1. Each affected article renders exactly one selected-level educational block.
2. Beginner selection renders Beginner-only guidance plus shared content.
3. Enthusiast selection renders Enthusiast-only guidance plus shared content.
4. Pizza Nerd selection renders Pizza Nerd-only guidance plus shared content.
5. Non-selected level labels and body copy are absent from the final DOM.
6. Safety and practical shared content remains visible to all levels.
7. Missing and invalid values fall back to Beginner.

Required focused tests:

- selected-level rendering for all three levels
- non-selected content absence
- shared safety visibility
- invalid and missing value fallback
- no CSS-only hidden all-level content

Regression risks:

- accidentally moving shared safety guidance into selected-level content
- over-refactoring four simple pages
- breaking static route rendering by introducing client-only code incorrectly

Rollback boundary:

- revert 461C only if Practical Tips article rendering regresses; no session workflow or preference foundation changes should be included.

### Patch 461D: Harden Canonical Preference Reading and Regression Coverage

Scope:

- canonical preference utility or hook
- direct-reader cleanup where necessary
- safe storage-denial fallback
- hydration/content-flash prevention where evidenced
- focused sitewide regression tests
- minor terminology cleanup only where directly supported

Expected source areas:

- `lib/experience-levels.ts`
- optional shared client hook/component for selected-level rendering
- direct-reader components identified in A1, A2, and A3
- focused tests for preference fallback, storage denial, selected-level DOM, and protected-route invariance

Goal:

- one consistent preference-reading pattern
- safe Beginner fallback
- no three-level flash where selected-level content is rendered
- no duplicated literal fallback logic where it creates risk
- strong regression protection around correct non-use

Exact exclusions:

- session workflow logic already handled by 461B
- Practical Tips article filtering already handled by 461C
- Guide redesign
- broad terminology sweep
- database, APIs, migrations, auth, admin, legal behavior

Acceptance criteria:

1. Storage denial during read falls back to Beginner and does not crash.
2. Storage denial during write or clear does not crash UI.
3. Invalid and legacy values normalize through the canonical utility.
4. Selected-level surfaces do not render all three levels during normal client rendering.
5. Representative protected routes prove guidance level does not affect timer, account, legal, admin, security, or public guest behavior.
6. Direct readers use the canonical utility or justified shared hook.

Required focused tests:

- read/write/clear storage exception tests
- invalid and legacy normalization tests
- selected-level DOM absence tests for representative pages
- no calculation changes by level for representative calculator/workflow outputs after 461B
- protected-route invariance tests for account, timer, legal, admin, and Party Order behavior

Regression risks:

- changing too many components at once
- introducing hydration mismatch by moving server/client boundaries
- over-normalizing user-facing copy outside the patch scope

Rollback boundary:

- revert 461D if preference utility changes cause widespread client rendering issues; 461B and 461C should remain independent.

## 13. Required Implementation Order

1. Patch 461B: fix Critical Pizza Plan workflow logic first.
2. Patch 461C: fix High Practical Tips all-level rendering second.
3. Patch 461D: harden preference foundation and regression coverage last.

Reason:

- 461B removes the only confirmed guidance-level effect on saved Pizza Plan values and calculations.
- 461C removes the only confirmed visible all-level educational rendering defect.
- 461D then centralizes fallback and regression protection once the known behavior defects have been corrected.

## 14. Cross-Patch Scope Guards

The 461 implementation series must not:

- redesign Guide pages
- change Pizza Plan formulas
- change route structure
- change account, security, admin, GDPR, legal, timer, or Party Order behavior
- change database schema
- add migrations
- introduce separate mobile business logic
- use desktop width to show all three guidance levels
- hide non-selected content with CSS-only techniques
- remove shared safety content
- convert internal `experienceLevel` identifiers unless needed for a direct implementation reason

Patch ownership:

- 461B owns session workflow calculation and control availability.
- 461C owns Practical Tips selected-level article rendering.
- 461D owns canonical preference fallback, storage-denial handling, and regression coverage.

## 15. Final Definition of Done for the Complete 461 Series

The 461 series is complete when all of these conditions are met:

1. Beginner selection renders only Beginner-specific educational content.
2. Enthusiast selection renders only Enthusiast-specific educational content.
3. Pizza Nerd selection renders only Pizza Nerd-specific educational content.
4. Non-selected educational content is absent from the final DOM.
5. Shared facts, controls, actions, and safety information remain available.
6. Missing preference values fall back safely to Beginner.
7. Invalid preference values fall back safely to Beginner.
8. Legacy preference values normalize to canonical values.
9. Storage denial does not crash level-sensitive pages.
10. Guidance level does not silently change canonical Pizza Plan calculations.
11. Guidance level does not silently change canonical Pizza Plan defaults.
12. Guidance level does not silently change persisted Pizza Plan values.
13. Guidance level does not change timer behavior.
14. Guidance level does not change account behavior.
15. Guidance level does not change security behavior.
16. Guidance level does not change legal meaning.
17. Guidance level does not change admin permissions or visibility rules.
18. Guidance level does not change public guest or Party Order behavior.
19. Practical Tips articles no longer show all three levels.
20. Existing correct Guide and calculator pages remain unchanged except for shared utility safety fixes.
21. Mobile remains action-first.
22. Desktop does not show all three levels simultaneously.
23. Focused regression tests protect the canonical product model.
