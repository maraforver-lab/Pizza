# Patch 397A: Kitchen execution-panel audit

## 1. Executive summary

Patch 397A audited `/session/kitchen` as an execution page, not as a redesign patch.

Current Kitchen Mode already has the right core model: current step, timing, concise instruction, done condition, next-step preview, level-specific help behind a native disclosure, and a primary start/complete action. The page is also technically stable in the audited production build: no horizontal overflow and no console errors were found at `390 x 844`, `430 x 740`, `1280 x 900`, or `1440 x 950`.

The audit found three product issues to address in Patch 397B:

1. The normal application `Back` link is visible in every normal Kitchen state and points away from the execution panel. It solves valid jobs, but the label is too broad and it overlaps with the stale-state area fixed in Patches 395 and 396.
2. Mobile Kitchen still exposes too much supporting structure by default. The default should keep the current task, timing, concise instruction, done cue, next preview, and primary action. Technique depth should remain closed under one explicit `More guidance` action.
3. Kitchen does not currently expose pizza-menu editing. Shopping already has safe total-lock allocation helpers, but its persistence helper sets `currentStep: "shopping"`, so Kitchen needs a narrow confirm path that preserves Kitchen progress and only updates menu-derived data.

Final decisions:

- Kitchen default content: keep the execution essentials, shorten timing/progress framing, keep detailed technique behind disclosure, remove the generic desktop-only mode card copy, and move schedule/menu jobs to explicit secondary actions.
- Application Back decision: **REPLACE** with focused secondary actions, primarily `View full schedule` and `Change pizza menu`; keep browser Back as browser behavior.
- Menu editing decision: allow menu reallocation while total pizza count is locked, safest phase **until bake phase starts**, using existing Shopping allocation/generation helpers plus a Kitchen-specific persistence path.
- Patch 397B should be a narrow implementation patch: simplify the panel, replace Back, add the locked-count menu editor, preserve Kitchen state, and add focused tests.

No production code, tests, formulas, session schema, persistence behavior, auth, SEO, navigation, or deployment state changed in Patch 397A.

## 2. Audit scope and method

Audited branch:

- Branch: `patch/397a-kitchen-execution-panel-audit`
- Starting commit: `649e3b4e` (`Patch 396: Protect sync during Back navigation`)
- Audit date: 2026-07-15

Sources inspected:

- `app/session/kitchen/page.tsx`
- `lib/pizza-session-kitchen.ts`
- `lib/pizza-session-shopping-list.ts`
- `app/session/shopping/page.tsx`
- `lib/pizza-session.ts`
- `lib/cloud-pizza-session-client.ts`
- `lib/cloud-pizza-sessions.ts`
- `lib/pizza-session-timeline.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/pizza-session-shopping-list.test.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/pizza-session-timeline.test.ts`
- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/design-system.md`
- `docs/pizza-session-autosave-and-resume.md`
- `docs/audits/patch-395-kitchen-cloud-progress-persistence.md`
- `docs/audits/patch-396-back-navigation-session-sync.md`

Validation performed:

- Kitchen source inspection
- component and route inventory
- menu-state searches
- Shopping editor dependency searches
- quantity-calculation searches
- persistence and cloud-path searches
- test inventory
- production build
- production-browser validation at required viewports

Full automated suite was not run because this patch changes documentation only.

## 3. Current Kitchen structure

Route: `/session/kitchen`

Page type: execution page.

Current route structure:

- client page
- reads the active local Pizza Session with `getActivePizzaSession()`
- renders `SessionViewportReset`
- renders `<CloudPizzaSessionSync session={session} />`
- renders `SessionWorkspaceLayout activeStep={9} hideLocalSaveNote`
- normal state renders one large article card
- missing/error states render `SessionRouteState`

Current state sources:

- active session: `getActivePizzaSession()`
- current/next Kitchen step: `getKitchenModeState(session)`
- display timeline: `timelineStepsForPlanningSummaryDisplay(...)`
- runtime overlay: `applyPizzaSessionStepRuntime(...)`
- current step timing: `formatSessionPlannedTime(...)`, `formatTimelineLiveTiming(...)`
- wait/too-early state: `getKitchenStepWaitInfo(...)`
- concise task copy: `getKitchenTaskPresentation(...)`
- level-specific help: `getKitchenExperienceGuidance(currentStep, session.experienceLevel, session)`
- experience visual metadata: `experienceLevelDisplay(session.experienceLevel)`
- ingredient lines: `doughKitchenIngredientLines(session.recipeSnapshot)`
- cloud queue: `queueCloudActivePizzaSessionSave(updated)`

Current primary actions:

- runtime work not started: `Start mixing now`, `Start balling now`, or `Start this step`
- runtime work started: `Mark mixing complete ->`, `Mark balling complete ->`, or `Mark step as done ->`
- all steps done: `Review my pizza`

Current Back action:

- visible in the normal action bar
- target comes from `?from=timeline`, `?from=review`, same-origin referrer, or default `/session/shopping`
- `?from=timeline` maps to `/session/timeline`
- `?from=review` maps to `/session/review`
- default maps to `/session/shopping`

Current footer behavior:

- no canonical site footer is rendered on `/session/kitchen`, which matches focused task-flow rules.

## 4. Mobile measurements

Production build:

```txt
npm.cmd run build
```

Result: passed. Next.js generated 43 static pages.

Browser validation used controlled local active sessions in a production server on `127.0.0.1:3000`.

Mobile measurements:

| State | Viewport | Screen count | Buttons | Links | Paragraphs | Cards approx | Current step top | Primary action top | Back visible | Details closed | Overflow | Console errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |
| Step not started | 390 x 844 | 2.0 | 3 | 4 | 26 | 31 | 213 | 724 | Yes | Yes | No | 0 |
| Step active | 390 x 844 | 2.1 | 3 | 4 | 27 | 31 | 213 | 724 | Yes | Yes | No | 0 |
| Step overdue | 390 x 844 | 2.0 | 3 | 4 | 26 | 31 | 213 | 724 | Yes | Yes | No | 0 |
| Completed / next step | 390 x 844 | 1.6 | 3 | 4 | 19 | 27 | 213 | 724 | Yes | Yes | No | 0 |
| Final bake step | 390 x 844 | 1.8 | 3 | 4 | 22 | 27 | 213 | 724 | Yes | Yes | No | 0 |
| Step not started | 430 x 740 | 2.3 | 3 | 4 | 26 | 31 | 213 | 620 | Yes | Yes | No | 0 |
| Step active | 430 x 740 | 2.3 | 3 | 4 | 27 | 31 | 213 | 620 | Yes | Yes | No | 0 |
| Step overdue | 430 x 740 | 2.3 | 3 | 4 | 26 | 31 | 213 | 620 | Yes | Yes | No | 0 |
| Completed / next step | 430 x 740 | 1.7 | 3 | 4 | 19 | 27 | 213 | 620 | Yes | Yes | No | 0 |
| Final bake step | 430 x 740 | 2.0 | 3 | 4 | 22 | 27 | 213 | 620 | Yes | Yes | No | 0 |

Mobile findings:

- The current action is visible in the first viewport because `BottomActionBar` is fixed/sticky enough for the measured layouts.
- The content still spans roughly 1.6 to 2.3 screens depending on state.
- The amount of visible paragraph and card structure is high for an execution page.
- The `Need more help?` disclosure is closed by default.
- The application `Back` link is always visible and competes as a normal flow control even when the user is actively cooking.
- No horizontal overflow or console errors were observed.

## 5. Desktop measurements

Desktop measurements:

| State | Viewport | Screen count | Buttons | Links | Paragraphs | Cards approx | Current step top | Primary action top | Back visible | Details closed | Overflow | Console errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | ---: |
| Step not started | 1280 x 900 | 1.5 | 3 | 13 | 30 | 57 | 202 | 1272 | Yes | Yes | No | 0 |
| Step active | 1280 x 900 | 1.6 | 3 | 13 | 31 | 57 | 202 | 1300 | Yes | Yes | No | 0 |
| Step overdue | 1280 x 900 | 1.5 | 3 | 13 | 30 | 57 | 202 | 1272 | Yes | Yes | No | 0 |
| Completed / next step | 1280 x 900 | 1.3 | 3 | 13 | 23 | 53 | 202 | 1030 | Yes | Yes | No | 0 |
| Final bake step | 1280 x 900 | 1.5 | 3 | 13 | 26 | 53 | 202 | 1232 | Yes | Yes | No | 0 |
| Step not started | 1440 x 950 | 1.5 | 3 | 13 | 30 | 57 | 202 | 1272 | Yes | Yes | No | 0 |
| Step active | 1440 x 950 | 1.5 | 3 | 13 | 31 | 57 | 202 | 1300 | Yes | Yes | No | 0 |
| Step overdue | 1440 x 950 | 1.5 | 3 | 13 | 30 | 57 | 202 | 1272 | Yes | Yes | No | 0 |
| Completed / next step | 1440 x 950 | 1.2 | 3 | 13 | 23 | 53 | 202 | 1030 | Yes | Yes | No | 0 |
| Final bake step | 1440 x 950 | 1.4 | 3 | 13 | 26 | 53 | 202 | 1232 | Yes | Yes | No | 0 |

Desktop findings:

- Desktop shows substantially more global/session navigation links through the surrounding workspace.
- The current task remains visually dominant, but the primary action can sit below the fold in full-page measurements because the normal document height exceeds one screen.
- Desktop-only level mode card adds copy but not operational value.
- No horizontal overflow or console errors were observed.

## 6. Current information inventory

| Element | Source | Data source | Mobile | Desktop | Interaction | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Step count pill | Kitchen page | `kitchenState.currentIndex`, `totalCount` | Visible | Visible | None | SHORTEN |
| `Kitchen Mode` pill | Kitchen page | static | Visible | Visible | None | KEEP DEFAULT |
| Experience badge | `SessionExperienceLevelBadge` | `session.experienceLevel` | Visible | Visible | None | KEEP DEFAULT |
| Wait pill | Kitchen page | `waitInfo` | Conditional | Conditional | None | KEEP DEFAULT |
| Current step icon | Kitchen page | `kitchenStepIcon` | Visible | Visible | None | KEEP DEFAULT |
| `Now` eyebrow | Kitchen page | static | Visible | Visible | None | SHORTEN |
| Current step title | Kitchen page | `taskPresentation.title` | Visible | Visible | None | KEEP DEFAULT |
| Desktop level mode card | Kitchen page | `experienceLevelDisplay` | Hidden | Visible | None | REMOVE |
| Timing panel | Kitchen page | current step schedule/runtime | Visible | Visible | None | KEEP DEFAULT, SHORTEN |
| Scheduled time | Kitchen page | `currentStep.scheduledAt` | Visible | Visible | None | KEEP DEFAULT |
| Runtime started line | Kitchen page | `session.stepRuntime` | Conditional | Conditional | None | KEEP DEFAULT |
| Live timing pill | Kitchen page | `formatTimelineLiveTiming` | Visible | Visible | None | KEEP DEFAULT |
| Next-step preview | Kitchen page | `kitchenState.nextStep` | Visible | Visible | None | KEEP DEFAULT |
| Too-early warning | Kitchen page | `waitInfo` | Conditional | Conditional | None | KEEP DEFAULT |
| Step guidance heading | Kitchen page | static | Visible | Visible | None | SHORTEN |
| Concise instruction | `getKitchenTaskPresentation` | helper source | Visible | Visible | None | KEEP DEFAULT |
| Done condition | `getKitchenTaskPresentation` | helper source | Visible | Visible | None | KEEP DEFAULT |
| `Need more help?` disclosure | native `details` | static open state | Visible | Visible | Open/close | KEEP DEFAULT, rename to `More guidance` |
| Level guidance | `getKitchenExperienceGuidance` | per-level helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| What to look for | `getKitchenExperienceGuidance` | per-level helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| Why it matters | `getKitchenExperienceGuidance` | per-level helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| Technical note | `getKitchenExperienceGuidance` | per-level helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| Keep in mind | `getKitchenExperienceGuidance` | per-level helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| Helper copy | `getKitchenTaskPresentation` | step helper | Hidden until disclosure | Hidden until disclosure | Disclosure | MOVE TO MORE GUIDANCE |
| Dough guide link | contextual learning | step guide link | Hidden until disclosure | Hidden until disclosure | Link | MOVE TO MORE GUIDANCE |
| Troubleshooting link | contextual learning | step guide link | Hidden until disclosure | Hidden until disclosure | Link | MOVE TO MORE GUIDANCE |
| Dough ingredients | `doughKitchenIngredientLines` | `recipeSnapshot` | Visible for mix step | Visible for mix step | None | KEEP DEFAULT for mix step |
| Ingredient unavailable state | Kitchen page | missing snapshot | Conditional | Conditional | None | KEEP DEFAULT |
| Service reminders | Kitchen page | `kitchenMode === "service"` | Visible in service | Visible in service | None | SHORTEN |
| Pizza count line | Kitchen page | `session.pizzaCount` | Visible in service | Visible in service | None | MOVE TO MENU EDITOR / summary |
| Quiet-hours warning | timeline step | `quietHoursWarning` | Conditional | Conditional | None | KEEP DEFAULT |
| Application Back | `BottomActionBar` | `backHref` | Visible | Visible | Link | REPLACE |
| Primary action | `BottomActionBar` | current step runtime status | Visible | Visible | Button/link | KEEP DEFAULT |
| Early-completion modal | Kitchen page | `confirmEarlyCompletion` | Conditional | Conditional | Dialog | KEEP DEFAULT |
| Complete-state Review link | `BottomActionBar` | current step absent | Visible | Visible | Link | KEEP DEFAULT |
| Canonical footer | none | none | Not present | Not present | None | KEEP ABSENT |

Duplicated concepts:

- current-step context appears as step count, `Kitchen Mode`, `Now`, icon, and title
- timing appears as scheduled time, runtime line, live timing pill, next preview, and sometimes wait warning
- experience level appears as badge plus desktop mode card plus hidden guidance heading
- route escape appears as Back, browser Back, and surrounding session navigation

Actions competing with current-step action:

- application Back is the only direct competing action in the action bar
- contextual learning links are safely hidden inside disclosure
- global/session navigation links remain available on desktop through the workspace shell

## 7. Essential execution information

Required default mobile content:

1. compact session/level context
2. current step name
3. planned time, live timing, or overdue/wait state
4. one concise instruction
5. one completion cue
6. one primary action
7. next-step preview
8. critical warning when applicable
9. current-step quantities only when needed for the task
10. secondary actions: `More guidance`, `Change pizza menu`, `View full schedule`

Required default desktop content:

1. current step and primary action
2. timing/live status
3. concise instruction and completion cue
4. compact next-step/progress context
5. optional side or secondary panel for menu/schedule/guidance actions

Information not operationally required by default:

- why the step matters
- technical note
- beginner reassurance
- Pizza Nerd process depth
- related learning links
- desktop explanation that desktop has more context
- full schedule
- route history Back

## 8. Optional guidance inventory

Structured guidance already exists in `lib/pizza-session-kitchen.ts`.

Default instruction source:

- `kitchenTaskInstructions`
- `getKitchenTaskPresentation`

Per-level guidance source:

- `kitchenExperienceGuidance`
- `defaultExperienceGuidance`
- `getKitchenExperienceGuidance`

Current structured fields:

- `instruction`
- `whatToLookFor`
- `whyItMatters`
- `technicalNote`
- `reassuranceTip`

Current task presentation fields:

- `title`
- `shortInstruction`
- `doneCondition`
- `helperCopy`

Classification:

- `shortInstruction`: essential default
- `doneCondition`: essential default
- `helperCopy`: optional detailed guidance unless it contains a safety-critical cue
- `instruction`: optional detailed guidance because it is level-depth copy
- `whatToLookFor`: optional detailed guidance
- `whyItMatters`: optional detailed guidance
- `technicalNote`: optional detailed guidance
- `reassuranceTip`: optional detailed guidance
- learning links: optional exit to canonical learning pages

## 9. Experience-level guidance analysis

Current behavior:

- visible badge reads `session.experienceLevel`
- hidden guidance reads `session.experienceLevel`
- desktop card reads `experienceLevelDisplay(session.experienceLevel)`
- source is aligned with Patch 394's canonical field

Browser validation:

| Level | Viewports | Visible label | Details default | Overflow | Console errors |
| --- | --- | --- | --- | --- | ---: |
| Beginner | all required | Yes | Closed | No | 0 |
| Enthusiast | all required | Yes | Closed | No | 0 |
| Pizza Nerd | all required | Yes | Closed | No | 0 |

Important rule for Patch 397B:

Pizza Nerd should change optional guidance depth, not default panel density. The current implementation partially respects this because detailed guidance is inside `details`, but the desktop-only mode card adds level-related explanation to the default view. That card should be removed or folded into the compact badge/guidance disclosure.

## 10. More Guidance recommendation

Recommended model for Patch 397B: native `<details>` / `<summary>`.

Preferred label: `More guidance`.

Rationale:

- already present in the current implementation
- keyboard accessible by default
- screen-reader behavior is well understood
- no focus trap required
- low implementation risk
- opening it does not need to write local or cloud session state
- good fit for current-step-only help
- avoids nested accordions

Rules:

- closed by default
- content scoped to the current step
- update content safely when current step changes
- no session persistence on open/close
- no cloud queue on open/close
- preserve experience-level-specific detail
- keep learning links inside the disclosure or a low-priority secondary area

Alternative models:

| Model | Pros | Risks | Decision |
| --- | --- | --- | --- |
| Native `details` | simple, accessible, no state persistence | less app-like than drawer | Prefer |
| Drawer / bottom sheet | good mobile focus | focus handling, escape behavior, more code | Consider later |
| Side panel | useful desktop | can reintroduce desktop density | Not default |
| Inline always-open help | no interaction needed | violates mobile focused-app rule | Reject |
| Nested accordion | granular | too much structure | Reject |

## 11. Application Back analysis

Current implementation:

- `kitchenBackHrefFromSource(value)` maps route query `from` to a destination.
- `kitchenBackHrefFromReferrer(value)` maps same-origin referrer to a destination.
- default destination is `/session/shopping`.
- `BottomActionBar` renders visible `Back` in normal and complete states.

Current valid jobs solved by Back:

- view full schedule in Timeline
- return to Review when Kitchen was opened from Review
- go back to Shopping to inspect or change the menu/list
- recover from arriving in Kitchen too early or with uncertainty

Problems:

- `Back` does not name the user's job.
- It encourages leaving the execution flow during active cooking.
- It overlaps with the Back-navigation stale-state area fixed in Patches 395 and 396.
- Existing tests currently assert `kitchenBackHrefFromSource`, `href={backHref}`, and `BottomActionBar` Back behavior, so Patch 397B must update tests intentionally.

Patch 395 relevance:

- resume routing now prefers canonical Kitchen/review state before stale `lastRoute`.
- Kitchen mutations explicitly queue the updated snapshot.

Patch 396 relevance:

- cloud queue now resolves latest active local session before enqueueing non-completion saves.
- Timeline display preserves Kitchen-progress timeline snapshots.
- Application Back to Timeline was part of the reproduced stale-state path.

Conclusion:

Application Back is not technically unsafe after Patches 395 and 396, but it remains a product-level escape hatch that solves multiple jobs with one vague control. A focused execution panel should replace it with named secondary actions.

## 12. Browser Back analysis

Browser Back remains browser-controlled and should not be intercepted for this patch.

Production browser validation:

- Starting from `/session/timeline`, navigating to `/session/kitchen?from=timeline`, then using browser Back returns to `/session/timeline`.
- Result was consistent for Beginner, Enthusiast, and Pizza Nerd at all required viewports.
- No horizontal overflow or console errors were observed after browser Back.

Browser Back is not a product replacement for named actions, but it remains a familiar browser-level escape. Patch 397B should not block or redefine it.

## 13. Back-policy decision

Decision: **REPLACE** application Back with focused secondary actions.

Recommended normal Kitchen actions:

- primary: current start/complete action
- secondary: `More guidance`
- secondary: `Change pizza menu`
- secondary: `View full schedule`

Keep conditional recovery actions in exceptional states:

- no session: `Create my pizza plan`
- missing timeline: `Build my timeline`
- route error: retry and start-new-plan recovery
- complete state: `Review my pizza`

Why not Option A, pure removal:

- users still need explicit ways to inspect the full schedule and change the menu.

Why not Option C, conditional Back:

- conditional Back would preserve an ambiguous route-history concept and would require users to infer when it appears.

Recommended replacement:

- remove `Back` from the default action bar
- add low-priority named actions:
  - `View full schedule` -> `/session/timeline`
  - `Change pizza menu` -> opens editor
- keep browser Back untouched
- do not use `Exit Kitchen Mode` unless a concrete destination and state semantics are defined

## 14. Pizza-menu state inventory

Canonical fields:

- total count: `session.pizzaCount`, falling back to `session.recipeSnapshot?.balls`
- mix allocation: `session.pizzaMix`
- legacy/default preset: `session.pizzaPreset`
- generated list: `session.shoppingList`

Canonical mix types:

- `margherita`
- `marinara`
- `diavola`
- `funghi`
- `prosciutto`
- `quattro-formaggi`

Canonical helpers:

- `normalizePizzaMixForCount(pizzaCount, mix, legacyPreset)`
- `adjustPizzaMixAllocation(currentMix, pizzaType, delta, pizzaCount)`
- `generatePizzaSessionShoppingList(session, presetId?, now?, pizzaMixOverride?)`
- `generateAndSaveActiveShoppingList(presetId?, storage?, now?, pizzaMixOverride?)`

Normalization behavior:

- allocation total is locked to `pizzaCount`
- missing mix defaults to legacy preset or all Margherita
- non-Margherita increases consume Margherita count
- decreasing a non-Margherita returns count to Margherita
- zero-count supported types remain representable

Current Kitchen behavior:

- Kitchen reads `pizzaCount` only for service reminders.
- Kitchen does not show current `pizzaMix`.
- Kitchen does not expose a menu editor.

Current Review behavior:

- Review summary reads `pizzaPreset` through `lib/pizza-session-review.ts`, not a detailed mix table.
- Shopping/export data carries the detailed mix-derived quantities.

Party Orders:

- Party Orders have separate `pizzaMix` aggregation logic in `lib/party-orders.ts`.
- Patch 397B should not change Party Orders.

## 15. Shopping editor reuse analysis

Shopping already provides the safest menu allocation UX in production:

- `Edit pizza mix` disclosure
- `Total selected: allocated/locked count`
- increase/decrease controls per pizza type
- visible pizza images and descriptions
- helpers preserve total pizza count
- tests cover allocation helpers and Shopping UI source

Reusable for Kitchen:

- `PIZZA_MIX_OPTIONS`
- `normalizePizzaMixForCount`
- `adjustPizzaMixAllocation`
- `generatePizzaSessionShoppingList`
- tests and invariants around fixed total

Do not reuse directly:

- `generateAndSaveActiveShoppingList` as-is for Kitchen confirm. It persists:
  - `pizzaMix`
  - `pizzaPreset`
  - `shoppingList`
  - `currentStep: "shopping"`

That `currentStep` update is correct for Shopping, but unsafe for Kitchen because it would move an active Kitchen session back to Shopping.

Patch 397B should add a Kitchen-safe helper or a generalized helper with an option that preserves current phase. It must be tested so Kitchen progress, timeline, status, and `stepRuntime` survive a menu confirmation.

## 16. Locked-count invariant

Invariant:

The user may change pizza-type allocation, but the total pizza count is locked for the active Pizza Session.

Allowed:

```txt
2 x Margherita + 2 x Diavola
-> 3 x Margherita + 1 x Diavola
```

Not allowed:

```txt
4 pizzas -> 5 pizzas
```

Locked total source:

```txt
session.pizzaCount ?? session.recipeSnapshot?.balls
```

Patch 397B must validate:

- sum of allocation equals locked total
- locked total is shown in the editor
- no control can increase total count
- confirm re-normalizes before save
- invalid or missing total disables menu editing with a clear recovery path

Required visible copy:

```txt
Total pizzas are locked for this session.
```

## 17. Derived-data impact matrix

| Data item | Current source | Menu edit impact | Patch 397B rule |
| --- | --- | --- | --- |
| `pizzaCount` | session | Must not change | Preserve |
| dough balls | recipe snapshot | Must not change | Preserve |
| total dough | recipe snapshot | Must not change | Preserve |
| hydration | recipe/session | Must not change | Preserve |
| yeast | recipe/session | Must not change | Preserve |
| flour | recipe/session | Must not change | Preserve |
| fermentation | recipe/session | Must not change | Preserve |
| target eat/bake time | session | Must not change | Preserve |
| timeline | session timeline | Must not change | Preserve |
| current Kitchen step | session | Must not change | Preserve |
| completed steps | timeline and runtime | Must not change | Preserve |
| `stepRuntime` | session | Must not change | Preserve |
| experience level | session | Must not change | Preserve |
| session ID | session | Must not change | Preserve |
| cloud row marker | local marker | Must not change | Preserve |
| `pizzaMix` | session | May change | Update atomically |
| `pizzaPreset` | session | May change to primary type | Update consistently |
| shopping list | generated from mix | Should change | Regenerate |
| sauce quantity | shopping generator via sauce calculator | Should change | Regenerate through existing helper |
| cheese/topping quantities | shopping generator | Should change | Regenerate through existing helper |
| Shopping export | shopping list | Changes when reopened/exported | Preserve visual export behavior |
| Review mix detail | currently limited | May reflect updated preset/list where already used | No new review redesign |
| Kitchen topping guidance | currently generic | May show compact current mix summary | Keep optional/compact |

## 18. Safe edit timing policy

Evaluated policies:

| Policy | Pros | Risks | Decision |
| --- | --- | --- | --- |
| Editable until first pizza is baked | best conceptual safety | requires per-pizza baked tracking that does not exist | Reject for now |
| Editable throughout Kitchen | simplest | can retroactively change menu after completed bakes | Reject |
| Editable until bake phase starts | derivable from existing step state | less granular than per-pizza tracking | Prefer |

Decision: allow menu editing until bake phase starts.

Lock when:

- `session.currentStep === "bake"`
- current Kitchen step is `bake-pizza`
- `bake-pizza` has runtime completion
- timeline indicates bake phase is already active or completed

Reason:

The current model tracks steps, not individual pizzas. There is no reliable per-pizza baked-state tracking, so "until first pizza is baked" cannot be enforced without new state. Patch 397B should not add per-pizza tracking.

Recommended locked message:

```txt
Menu is locked once baking starts.
```

## 19. Persistence and cloud-sync path

Required update path:

```txt
menu editor confirm
-> validate locked total
-> normalize allocation
-> generate shopping list from the confirmed allocation
-> create one immutable updated session
-> preserve currentStep, status, timeline, stepRuntime, experienceLevel, session ID and cloud identity
-> update pizzaMix, pizzaPreset, shoppingList, updatedAt and lastSavedAt
-> persist locally
-> explicitly queue latest cloud snapshot
-> update Kitchen UI
```

Required implementation principle:

- editor draft state is local UI state only
- opening, closing, or canceling editor does not write local storage
- only confirm writes the session
- confirm writes once
- confirm queues the exact updated session through `queueCloudActivePizzaSessionSave(updated)`

Why explicit queue is required:

Patch 395 established that Kitchen mutations should queue the newest snapshot immediately rather than relying only on the route-level sync effect.

Why canonical active selection still matters:

Patch 396 established that stale route snapshots must not overwrite newer active storage. Menu confirm should therefore use the latest active session at confirm time or otherwise prove it has not overwritten newer Kitchen progress.

## 20. Mobile execution-panel proposal

Proposed mobile hierarchy:

```txt
[compact level/session context]

CURRENT STEP
Mix dough

[large planned time / live timing / overdue state]

Mix until no dry flour remains.

Done when: dough is evenly hydrated and no dry flour remains.

[Start mixing now / Mark mixing complete]

Next: Ball dough at 18:30

[More guidance]
[Change pizza menu]
[View full schedule]
```

Mobile rules:

- one dominant current-step action
- primary action must be easy to tap and remain prominent
- `More guidance` closed by default
- menu editor opens only from an explicit secondary action
- no normal application Back in the default action area
- no footer
- no full schedule by default
- no desktop mode explanation
- preserve current warning and early-completion dialog
- consider keep-screen-awake in a later patch, not Patch 397B unless explicitly requested

## 21. Desktop execution-panel proposal

Proposed desktop hierarchy:

```txt
Current task panel              Compact context panel
- step label                    - next step
- current title                 - progress
- timing/live status            - menu summary
- concise instruction           - secondary actions
- done condition
- primary action

More guidance disclosure below or beside the current task, closed by default.
```

Desktop rules:

- desktop may show compact context, but not more default explanation
- the current action remains dominant
- no dense full schedule by default
- no duplicate timing cards
- no desktop-only explanatory card that says desktop has more context
- menu and schedule actions are named secondary controls

## 22. Content removal and disclosure table

| Current content | Decision | Target |
| --- | --- | --- |
| Step count | SHORTEN | compact progress |
| Kitchen Mode pill | KEEP DEFAULT | default header |
| Experience badge | KEEP DEFAULT | default header |
| Wait/overdue pill | KEEP DEFAULT | timing/status |
| Current step title | KEEP DEFAULT | primary content |
| Timing card | SHORTEN | default timing |
| Runtime lines | SHORTEN | default timing |
| Next preview | KEEP DEFAULT | default |
| Too-early warning | KEEP DEFAULT | default warning |
| Concise instruction | KEEP DEFAULT | default |
| Done condition | KEEP DEFAULT | default |
| `Need more help?` | SHORTEN/RENAME | `More guidance` |
| Level guidance | MOVE TO MORE GUIDANCE | disclosure |
| What to look for | MOVE TO MORE GUIDANCE | disclosure |
| Why it matters | MOVE TO MORE GUIDANCE | disclosure |
| Technical note | MOVE TO MORE GUIDANCE | disclosure |
| Keep in mind | MOVE TO MORE GUIDANCE | disclosure |
| Helper copy | MOVE TO MORE GUIDANCE | disclosure |
| Learning links | MOVE TO MORE GUIDANCE | disclosure |
| Dough ingredients | KEEP DEFAULT for mix step | current-step quantities |
| Service reminders | SHORTEN | compact current/menu summary |
| Pizza count line | MOVE TO MENU EDITOR | menu summary/editor |
| Quiet-hours warning | KEEP DEFAULT | warning |
| Application Back | REMOVE/REPLACE | named secondary actions |
| Desktop mode card | REMOVE | none |
| Full schedule | MOVE TO FULL SCHEDULE | `/session/timeline` |
| Pizza mix editing | MOVE TO MENU EDITOR | new editor |

## 23. Accessibility requirements

Execution panel:

- keep one visible primary action
- use semantic headings for current task and guidance
- visible status text must not rely on color only
- no horizontal overflow
- touch targets should remain at least the existing shared button size
- primary action should be reachable without requiring users to inspect optional guidance

More Guidance:

- native `details` is acceptable and preferred
- if replaced with custom disclosure, implement `aria-expanded`, `aria-controls`, keyboard handling, and focus behavior
- no nested accordion
- opening/closing must not change session state

Menu editor:

- if modal/dialog: focus trap, Escape/cancel, return focus to trigger
- if drawer/bottom sheet: same keyboard and screen-reader requirements as dialog
- every count control needs an accessible name including pizza type and action
- locked total must be visible text
- invalid allocation state must be announced or visibly explained
- cancel must leave session unchanged
- confirm must be disabled or blocked unless allocation sums to locked total

Browser Back:

- leave browser behavior intact
- do not intercept browser history to enforce product flow

## 24. Test gaps

Existing coverage:

- Kitchen content hierarchy source tests
- Kitchen primary action labels
- current Back source tests
- experience-level guidance source tests
- Kitchen start/completion local persistence tests
- Kitchen direct cloud queue source tests
- Patch 395 cloud queue and resume tests
- Patch 396 stale Back snapshot tests
- Shopping pizza mix allocation helper tests
- Shopping menu editor source tests
- shopping list quantity generation tests

Gaps for Patch 397B:

- no test proving normal Kitchen omits application Back
- no test for `View full schedule` replacing Back
- no test for `Change pizza menu` in Kitchen
- no test that Kitchen menu confirm preserves `currentStep`, `status`, `timeline`, and `stepRuntime`
- no test that Kitchen menu confirm explicitly queues cloud sync
- no test that cancel leaves active session unchanged
- no test that bake phase locks menu editing
- no test that unsupported total count disables editing
- no test that details/disclosure remains closed by default after simplification
- no focused browser assertion for first-viewport Kitchen density after redesign

## 25. Patch 397B implementation scope

Recommended narrow scope:

1. Simplify normal Kitchen panel hierarchy.
2. Rename `Need more help?` to `More guidance`.
3. Remove the desktop-only mode explanation card.
4. Replace application `Back` in normal Kitchen state with:
   - `View full schedule` -> `/session/timeline`
   - `Change pizza menu` -> menu editor
5. Keep recovery-state actions intact.
6. Add compact current menu summary.
7. Add a locked-count menu editor:
   - local draft allocation
   - total locked display
   - confirm/cancel
   - unavailable after bake phase starts
8. Reuse:
   - `PIZZA_MIX_OPTIONS`
   - `normalizePizzaMixForCount`
   - `adjustPizzaMixAllocation`
   - `generatePizzaSessionShoppingList`
9. Add a Kitchen-safe persistence helper or route-local confirm function that preserves Kitchen state.
10. Explicitly queue `queueCloudActivePizzaSessionSave(updated)` after confirm.
11. Add focused tests for execution panel, Back removal/replacement, menu invariants, persistence, cloud queue, and accessibility.
12. Run focused tests, full suite, lint, build, `git diff --check`, and production browser validation.

Out of scope for Patch 397B:

- formula changes
- session schema changes
- per-pizza baked tracking
- timeline recalculation
- new Party Order behavior
- Review redesign
- Shopping redesign
- navigation/SEO changes
- deployment

## 26. Protected invariants

Patch 397B must not change:

- total pizza count
- dough ball count
- total dough amount
- hydration
- yeast
- flour
- fermentation
- target bake/eat time
- Timeline schedule
- completed Kitchen steps
- active Kitchen step
- `stepRuntime`
- experience level
- session ID
- active-session storage keys
- cloud row identity
- auth
- account behavior
- Party Orders
- SEO
- deployment configuration

Patch 397A changed none of these.

## 27. Risks and limitations

Risks:

- Replacing Back requires updating current source tests that assert Back behavior.
- A careless reuse of `generateAndSaveActiveShoppingList` would move `currentStep` to `shopping`.
- Menu editing after bake starts could retroactively change the visible menu after some pizzas have already been made.
- Dialog implementation can add accessibility risk if focus handling is custom.
- Cloud sync could regress if menu confirm relies only on render effect instead of explicitly queuing.

Limitations:

- Browser validation used deterministic local sessions, not a live signed-in cloud account.
- No live Supabase row was inspected.
- Browser validation for guidance depth verified closed disclosure and visible level labels; hidden per-level guidance text was source-audited rather than opened for every level and viewport.
- Card counts are approximate because they count visible rounded UI containers, not semantic card components.
- Timing value counts are approximate and should be used directionally.

## 28. Final recommendation

Proceed with Patch 397B as a narrow execution-panel implementation:

- replace application Back with named secondary actions
- preserve browser Back
- keep the default panel focused on current execution
- keep detailed guidance behind one closed `More guidance` disclosure
- add locked-total menu editing only until bake phase starts
- update menu-derived shopping/sauce/topping data atomically
- preserve Kitchen progress and explicitly queue cloud sync
- avoid schema, formula, timeline, auth, SEO, Party Order, or deployment changes

The safest product model is:

```txt
Kitchen Mode = current action first.
Schedule and menu changes are named secondary actions.
Detailed guidance is available, but not default density.
Total pizza count is fixed once the session is in Kitchen.
```
