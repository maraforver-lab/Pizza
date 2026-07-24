# Patch 461A1: Guidance-Level Foundation Audit

## Executive Summary

Patch 461A1 inspected the technical foundation for DoughTools guidance levels and inventoried the full application route tree. It did not perform the full page-by-page visual or DOM audit requested for the broader 461A series.

Confirmed foundation:

- Canonical storage key: `doughtools.experienceLevel`
- Canonical accepted values: `beginner`, `enthusiast`, `pizza_nerd`
- Canonical visible labels: `Beginner`, `Enthusiast`, `Pizza Nerd`
- Default and fallback: `beginner`
- Canonical implementation: `lib/experience-levels.ts`
- Canonical selector: `components/ExperienceLevelSelector.tsx`
- Account setting entry point: `components/account/AccountGuidancePreference.tsx`

Main foundation risks found:

- Several client components initialize local state to the literal `"beginner"` before reading the stored preference. This currently matches the canonical default, but it is a duplicated fallback pattern.
- `readExperienceLevelPreference` and `writeExperienceLevelPreference` do not catch storage exceptions. Missing `window` is handled, but browser storage denial or `localStorage` throwing is not guarded.
- Four Practical pizza tips article pages define and render all three guidance-level cards statically. This is outside the desired selected-level-only rule and needs a deeper page audit before implementation.

No production code, tests, CSS, routes, data, migrations or preferences were changed.

## Confirmed Canonical Preference Implementation

Source: `lib/experience-levels.ts`

| Item | Finding |
| --- | --- |
| Type | `ExperienceLevel = "beginner" | "enthusiast" | "pizza_nerd"` |
| Storage key | `EXPERIENCE_LEVEL_STORAGE_KEY = "doughtools.experienceLevel"` |
| Default | `DEFAULT_EXPERIENCE_LEVEL = "beginner"` |
| Accepted values | `beginner`, `enthusiast`, `pizza_nerd` |
| Visible labels | `Beginner`, `Enthusiast`, `Pizza Nerd` |
| Order | `["beginner", "enthusiast", "pizza_nerd"]` |
| Legacy migrations | `intermediate -> enthusiast`; `advanced`, `nerd`, `pizza nerd`, `pizza-nerd` -> `pizza_nerd` |
| Config helper | `getExperienceLevelConfig(level)` normalizes unknown input |
| Read helper | `readExperienceLevelPreference(storage?)` |
| Write helper | `writeExperienceLevelPreference(level, storage?)` |
| Clear helper | `clearExperienceLevelPreference(storage?)` |
| Complexity helpers | `shouldShowBeginnerContent`, `shouldShowAdvancedContent`, `shouldShowNerdContent`, `getExperienceLevelCopyMode` |

The canonical selector in `components/ExperienceLevelSelector.tsx` iterates `EXPERIENCE_LEVELS`, writes through `writeExperienceLevelPreference`, and exposes all three choices as an explicit user preference control. This all-level rendering is appropriate because it is the preference selector itself, not educational content.

## Storage and Fallback Behavior

Confirmed behavior:

- Missing storage object returns `beginner`.
- Missing stored value returns `beginner`.
- Invalid stored values normalize to `beginner`.
- Legacy values are normalized to canonical values.
- If a stored value exists but differs from the normalized value, `readExperienceLevelPreference` writes the normalized value back.
- `getExperienceLevelConfig` accepts unknown input and safely returns the normalized config.

Storage-unavailable caveat:

- Server-side or no-`window` execution is handled by returning `undefined` storage and falling back to `beginner`.
- Browser storage throwing during `getItem`, `setItem` or `removeItem` is not caught. This is a foundation-level resilience gap for private browsing, blocked storage or unusual embedded contexts.

## Hydration and Rendering Architecture

The current architecture is client-first for preference-dependent rendering:

- Most level-sensitive UI components use `"use client"`.
- Components often initialize as `beginner`, then call `readExperienceLevelPreference()` in `useEffect`.
- This means the initial client render is normally Beginner until hydration/effect completes.
- For pages with level-specific educational copy, this can create a short Beginner-to-selected-level content switch after hydration.
- Server components that contain all three level cards can expose all levels in the initial HTML/RSC payload because they do not read the preference.

Observed canonical pattern:

```tsx
const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());
useEffect(() => {
  setExperienceLevel(readExperienceLevelPreference());
}, []);
```

Observed duplicated variant:

```tsx
const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
```

The duplicated variant is functionally equivalent today but should be replaced with `getDefaultExperienceLevel()` when the affected pages are touched.

## Complete Source-Pattern Inventory

Guidance-related source search found 47 production source files and 27 test files containing one or more of:

- `doughtools.experienceLevel`
- `EXPERIENCE_LEVEL_STORAGE_KEY`
- `readExperienceLevelPreference`
- `writeExperienceLevelPreference`
- `normalizeExperienceLevel`
- `ExperienceLevelSelector`
- `GuidanceModeBadge`
- `SessionExperienceLevelBadge`
- `type ExperienceLevel`
- `Record<ExperienceLevel`
- visible labels `Beginner`, `Enthusiast`, `Pizza Nerd`

### Canonical Foundation

| File | Classification | Notes |
| --- | --- | --- |
| `lib/experience-levels.ts` | canonical | Single source of accepted values, storage key, fallback, normalization and config metadata. |
| `components/ExperienceLevelSelector.tsx` | canonical | Shared visible preference selector; intentionally renders all three options. |
| `components/account/AccountGuidancePreference.tsx` | canonical consumer | Account Settings preference entry; reads canonical preference and expands shared selector. |
| `components/session/SessionExperienceLevelBadge.tsx` | canonical display | Displays session-level guidance label from canonical config. |
| `components/session/SessionStepHero.tsx` | canonical display | Uses the shared session badge. |

### Direct Preference Readers

| File | Pattern | Notes |
| --- | --- | --- |
| `components/HomepageGuidanceLevelSection.tsx` | read/write | Selector-style homepage preference control. |
| `components/HomeCalculatorWorkspace.tsx` | read | Uses selected level for homepage calculator explanation. |
| `components/guide/DoughGuidePageClient.tsx` | read | Client-only selected-level Dough guide content. |
| `components/ovens/OvensQuickAnswer.tsx` | read | Client-only selected oven guidance. |
| `components/toppings/ToppingBalanceLab.tsx` | read | Client-only selected topping guidance. |
| `components/sauce/SauceQuickAnswer.tsx` | read | Client-only selected sauce quick answer. |
| `components/sauce/SauceCalculator.tsx` | read | Client-only selected sauce amount teaching. |
| `components/sauce/SaucePracticalGuidance.tsx` | read | Client-only selected practical sauce guidance. |
| `components/quick-calculator/QuickDoughCalculator.tsx` | read/write | Calculator can change preference and uses selected-level teaching. |
| `components/account/AccountGuidancePreference.tsx` | read | Account Settings preference display. |
| `app/session/start/page.tsx` | read | Pizza Plan start flow snapshots selected level into the session. |

### Level-Specific Data Helpers

These files hold `ExperienceLevel` data or normalize level input without directly reading browser storage:

- `lib/calculator-progressive-disclosure.ts`
- `lib/quick-calculator/quick-dough-calculator.ts`
- `lib/dough-guide.ts`
- `lib/dough-step-images.ts`
- `lib/education-experience-copy.ts`
- `lib/homepage-experience-copy.ts`
- `lib/sauce-page-guidance.ts`
- `lib/pizza-session.ts`
- `lib/pizza-session-kitchen.ts`
- `lib/pizza-session-review.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-troubleshooting.ts`
- `lib/planning-available-flour-recommendation.ts`
- `lib/planning-combined-risk-summary.ts`
- `lib/planning-dough-type-guidance.ts`
- `lib/planning-fermentation-setup.ts`
- `lib/planning-fermentation-timeline.ts`
- `lib/planning-flour-guidance.ts`
- `lib/planning-formula-fit-guidance.ts`
- `lib/planning-start-window-recommendation.ts`
- `lib/planning-warning-engine.ts`
- `lib/planning-yeast-guidance.ts`

### Components That Intentionally Iterate All Levels

| File | Classification | Reason |
| --- | --- | --- |
| `components/ExperienceLevelSelector.tsx` | canonical | User must see all options to choose a preference. |
| `components/HomepageGuidanceLevelSection.tsx` | preference control | Homepage guidance selector; all options are controls, not three duplicated educational sections. |
| `components/quick-calculator/QuickDoughCalculator.tsx` | preference control | All options are shown only when the guidance selector is expanded. |

### Requires Deeper Page Audit Later

| File | Reason |
| --- | --- |
| `app/guide/practical-pizza-tips/leftover-dough/page.tsx` | Static `levelGuidance.map` renders all three level cards. |
| `app/guide/practical-pizza-tips/containers-and-lids/page.tsx` | Same static all-level article pattern. |
| `app/guide/practical-pizza-tips/common-problems/page.tsx` | Same static all-level article pattern. |
| `app/guide/practical-pizza-tips/fermentation-length/page.tsx` | Same static all-level article pattern. |
| `app/about/page.tsx` | Shows all three levels in an explanatory methodology section; likely shared content, but page audit should confirm wording is not acting as personalized guidance. |
| `app/page.tsx` | Contains a static summary of all three levels near the homepage guidance selector; likely acceptable preference explanation, but should be checked in the Guide/marketing pass. |

## Duplicate or Inconsistent Implementations

Counted as foundation-level implementation categories: 3.

| Category | Severity | Evidence | Why it matters |
| --- | --- | --- | --- |
| Literal `"beginner"` initial state | Low | `HomeCalculatorWorkspace`, `DoughGuidePageClient`, `ToppingBalanceLab`, `QuickDoughCalculator`, `app/session/start/page.tsx` | Duplicates the canonical default. Safe today, but brittle if the default changes. |
| Storage exceptions are not caught | Medium | `readExperienceLevelPreference`, `writeExperienceLevelPreference`, `clearExperienceLevelPreference` | Missing `window` is handled, but denied or throwing storage may crash preference reads/writes. |
| Static all-level article pages | High candidate for later audit | Practical pizza tips article pages | These likely violate selected-level-only educational rendering, but Patch 461A2 should verify DOM and page intent before implementation. |

No direct duplicate storage key was found outside the canonical constant, except the account local-data cleanup list correctly includes `"doughtools.experienceLevel"` as a key to remove after account deletion.

## Complete Canonical Route Inventory

The `app` tree currently contains:

- 49 canonical page routes
- 22 route-handler/API routes, including `/auth/callback`
- 12 layout files
- No `not-found.tsx`, `error.tsx` or `loading.tsx` files found in `app`

### Preliminary A/B/C/D Route Classification

This is a foundation inventory only. These classifications are initial audit targets, not final correctness findings.

| Route | File | Preliminary class | Notes |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | C | Marketing, calculator workspace and guidance selector. |
| `/about` | `app/about/page.tsx` | B | Shared product/methodology content; mentions all levels. |
| `/account` | `app/account/page.tsx` | B | Account workspace controls; not educational guidance. |
| `/account/party-orders` | `app/account/party-orders/page.tsx` | B | Transactional account feature. |
| `/account/party-orders/:id` | `app/account/party-orders/[id]/page.tsx` | B | Transactional detail page. |
| `/account/party-orders/new` | `app/account/party-orders/new/page.tsx` | B | Transactional creation page. |
| `/account/pizza-sessions/:id` | `app/account/pizza-sessions/[id]/page.tsx` | B | History/detail view; may display stored plan data. |
| `/account/settings` | `app/account/settings/page.tsx` | B | Settings hub. |
| `/account/settings/preferences` | `app/account/settings/preferences/page.tsx` | B | Preference controls; all-level selector is appropriate. |
| `/account/settings/privacy` | `app/account/settings/privacy/page.tsx` | D | Privacy/export/delete controls should not vary by skill level. |
| `/account/settings/security` | `app/account/settings/security/page.tsx` | D | Security controls should remain identical. |
| `/admin` | `app/admin/page.tsx` | D | Admin controls; personalization inappropriate. |
| `/admin/appearance` | `app/admin/appearance/page.tsx` | D | Admin theme controls. |
| `/admin/bake-timer-sounds` | `app/admin/bake-timer-sounds/page.tsx` | D | Admin sound controls. |
| `/calculator/quick` | `app/calculator/quick/page.tsx` | C | Shared formulas with level-specific explanation. |
| `/coach` | `app/coach/page.tsx` | A | Legacy/learning route candidate; inspect in 461A2. |
| `/contact` | `app/contact/page.tsx` | B | Shared contact page. |
| `/costs` | `app/costs/page.tsx` | C | Calculator/tool route; formulas should be shared, explanation may vary. |
| `/doctor` | `app/doctor/page.tsx` | A | Troubleshooting/learning route candidate. |
| `/gear` | `app/gear/page.tsx` | A | Equipment learning route candidate. |
| `/guide` | `app/guide/page.tsx` | A | Guide hub. |
| `/guide/pizza-troubleshooting` | `app/guide/pizza-troubleshooting/page.tsx` | A | Educational troubleshooting. |
| `/guide/practical-pizza-tips` | `app/guide/practical-pizza-tips/page.tsx` | A | Practical tips landing. |
| `/guide/practical-pizza-tips/common-problems` | `app/guide/practical-pizza-tips/common-problems/page.tsx` | A | Level-specific educational article candidate. |
| `/guide/practical-pizza-tips/containers-and-lids` | `app/guide/practical-pizza-tips/containers-and-lids/page.tsx` | A | Level-specific educational article candidate. |
| `/guide/practical-pizza-tips/fermentation-length` | `app/guide/practical-pizza-tips/fermentation-length/page.tsx` | A | Level-specific educational article candidate. |
| `/guide/practical-pizza-tips/leftover-dough` | `app/guide/practical-pizza-tips/leftover-dough/page.tsx` | A | Level-specific educational article candidate. |
| `/guides/dough` | `app/guides/dough/page.tsx` | A | Educational Dough guide. |
| `/history` | `app/history/page.tsx` | B | Shared update/history route. |
| `/methodology` | `app/methodology/page.tsx` | B | Shared methodology/trust content. |
| `/order/:publicToken` | `app/order/[publicToken]/page.tsx` | D | Public guest order form should not depend on owner's guidance level. |
| `/order/:publicToken/edit/:submissionToken` | `app/order/[publicToken]/edit/[submissionToken]/page.tsx` | D | Public guest edit route. |
| `/ovens` | `app/ovens/page.tsx` | A | Educational Ovens guide. |
| `/plan` | `app/plan/page.tsx` | B | Shared route/entry point candidate. |
| `/privacy` | `app/privacy/page.tsx` | D | Legal/privacy text. |
| `/sauce` | `app/sauce/page.tsx` | A | Educational Sauce guide and calculator. |
| `/session/kitchen` | `app/session/kitchen/page.tsx` | C | Workflow controls with selected-level support copy. |
| `/session/recipe` | `app/session/recipe/page.tsx` | C | Workflow/calculation page with Pizza Nerd controls. |
| `/session/review` | `app/session/review/page.tsx` | C | Workflow completion with level-aware review copy. |
| `/session/shopping` | `app/session/shopping/page.tsx` | C | Shared checklist with stored session level badge. |
| `/session/start` | `app/session/start/page.tsx` | C | Workflow setup snapshots selected level. |
| `/session/timeline` | `app/session/timeline/page.tsx` | C | Shared schedule with selected-level context. |
| `/start` | `app/start/page.tsx` | B | Entry/redirect-style route candidate. |
| `/styles` | `app/styles/page.tsx` | D | Internal/design route; personalization inappropriate. |
| `/terms` | `app/terms/page.tsx` | D | Legal text. |
| `/timer` | `app/timer/page.tsx` | B | Standalone timer; sound/mute state separate from guidance level. |
| `/tools/bake-timer` | `app/tools/bake-timer/page.tsx` | B | Standalone timer alias/tool route. |
| `/toppings` | `app/toppings/page.tsx` | A | Educational Toppings guide and calculator-like lab. |
| `/updates` | `app/updates/page.tsx` | B | Shared release/update content. |

### Route Handlers and API Routes

Route handlers should not use guidance-level personalization unless they are explicitly persisting or returning account/session state. Initial classification:

- Shared/auth/account/admin APIs: D or B; no user-facing level-specific education.
- Pizza session APIs may carry persisted `experienceLevel` as session data, but should not change calculations by current browser preference.
- `/auth/callback` is D.

API routes found:

- `/api/account/data`
- `/api/account/delete`
- `/api/account/export`
- `/api/account/preferences`
- `/api/admin/bake-timer-sounds`
- `/api/admin/status`
- `/api/admin/themes`
- `/api/admin/themes/:id`
- `/api/admin/themes/activate-default`
- `/api/admin/themes/activate-now`
- `/api/bake-timer/sound-themes`
- `/api/party-orders`
- `/api/party-orders/:id`
- `/api/party-orders/:id/session-handoff`
- `/api/party-orders/:id/submissions/:submissionId`
- `/api/party-orders/public/:publicToken/submissions`
- `/api/party-orders/public/:publicToken/submissions/:editToken`
- `/api/pizza-sessions/active`
- `/api/pizza-sessions/history`
- `/api/pizza-sessions/history/:id`
- `/api/pizza-sessions/history/:id/photo`
- `/auth/callback`

## Existing Test Inventory

Foundation-level tests:

- `tests/experience-levels.test.ts`
  - default is Beginner
  - accepted level order
  - invalid/null/undefined fallback
  - legacy value migration
  - visible English labels
  - storage key
  - persistence and clearing with `MemoryStorage`
  - malformed stored value fallback
  - content-complexity helpers
  - selector source contract
  - session badge source contract

Selected-level and page-adjacent tests:

- `tests/calculator-progressive-disclosure.test.ts`
- `tests/quick-calculator.test.ts`
- `tests/homepage.test.ts`
- `tests/dough-guide.test.ts`
- `tests/ovens.test.ts`
- `tests/topping-balance-lab.test.ts`
- `tests/pizza-sauce-calculator.test.ts`
- `tests/pizza-troubleshooting-guide.test.ts`
- `tests/practical-pizza-tips.test.ts`
- `tests/start-pizza-session-wizard.test.ts`
- `tests/session-recipe.test.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/pizza-session-review.test.ts`
- `tests/pizza-session-timeline.test.ts`
- `tests/recipe-workflow.test.ts`
- `tests/session-desktop-components.test.ts`
- `tests/accessibility-baseline.test.ts`
- `tests/account-responsive-workspace.test.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/pizza-session.test.ts`

Obvious foundation-level test gaps:

- No test simulates `localStorage.getItem` throwing.
- No test simulates `localStorage.setItem` throwing during legacy normalization or write.
- No explicit foundation test asserts that all direct readers use `getDefaultExperienceLevel()` rather than literal `"beginner"`.
- DOM-absence tests are uneven. Several tests inspect source strings and selected copy, but the full sitewide "non-selected copy absent from DOM" contract is not comprehensively covered.
- Practical pizza tips tests confirm shared three-level structure, which conflicts with the newer selected-level-only product rule and needs follow-up test realignment after page audit.

## Foundation-Level Risks

| Risk | Severity | Status |
| --- | --- | --- |
| Storage exceptions can throw from the canonical read/write helpers | Medium | Needs 461B or equivalent foundation fix. |
| Hard-coded `"beginner"` initial states duplicate canonical default | Low | Safe today, but should be cleaned up when touching affected components. |
| Server/static article pages can render all three level-specific cards | High candidate | Needs 461A2 DOM/page audit before implementation. |
| Preference-dependent client components can initially render Beginner before stored preference is read | Medium | Needs DOM/hydration-focused audit in 461A2/461A3. |
| Test coverage relies heavily on source-string assertions | Low | Needs later test hardening, not a production blocker by itself. |

## Minimal Browser Smoke Check

An isolated browser context set `localStorage["doughtools.experienceLevel"] = "pizza_nerd"` on the homepage, reloaded, and confirmed the homepage guidance selector selected `pizza_nerd`.

Result:

- Stored key: `doughtools.experienceLevel`
- Stored value: `pizza_nerd`
- Selected UI control: `Pizza Nerd`
- No user profile, production database row or normal browser preference was modified.

## Exact Scope for Patch 461A2

Recommended next audit patch: Guide and calculator selected-level DOM audit.

Inspect in browser and source:

- `/guide`
- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`
- `/calculator/quick`
- `/costs`
- `/gear`, `/doctor`, `/coach` if still public and non-redirecting

Verify:

- Beginner/Enthusiast/Pizza Nerd selected states
- missing preference fallback
- invalid preference fallback
- whether non-selected content is absent from DOM or merely hidden
- hydration flash from initial Beginner state
- whether all-level comparison blocks are preference controls, shared methodology, or incorrect educational duplication

## Exact Scope for Patch 461A3

Recommended following audit patch: workflow, account, admin, legal and public shared-link classification.

Inspect in browser/source where safe:

- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account` and Settings subroutes
- `/account/party-orders` routes
- `/order/:publicToken` and edit route by source/test inspection
- `/timer` and `/tools/bake-timer`
- `/admin` routes
- `/privacy`, `/terms`, `/methodology`, `/contact`, `/updates`, `/history`, `/about`
- relevant route handlers that persist or return session/account data

Verify:

- one canonical logic with different instructional depth
- no guidance level changes calculations, saved values, auth, privacy or destructive actions
- account/security/legal/admin pages correctly avoid personalization
- session-stored `experienceLevel` does not get overwritten by stale local preference
- workflow pages do not hide required controls or safety guidance
