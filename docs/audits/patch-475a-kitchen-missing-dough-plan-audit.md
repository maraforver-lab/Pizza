# Patch 475A: Kitchen Mode missing Dough Plan audit

## 1. Executive summary

Kitchen Mode can reach the `Mix the dough` step while showing `Ingredient amounts unavailable` because the ingredient panel reads only `session.recipeSnapshot`. The canonical recipe builder can still derive exact dough amounts from the session's selected pizza style, preset, count, flour, oven, ball weight, hydration and fermentation inputs, but Kitchen does not use that derived result for the `Mix the dough` ingredient panel.

Primary root cause classification: **D - Incorrect Kitchen lookup**.

Secondary contributing factor: **E - Legacy/incomplete session accepted too far**. A session with enough canonical inputs but without a fully materialized `recipeSnapshot` is allowed into Kitchen, and the `Mixing complete` action remains available. A truly incomplete session can also reach the same warning if it already has a timeline.

No evidence was found that the dough formulas, yeast calculations, hydration calculations, timer runtime, timeline generation, API, database or migrations are the cause.

## 2. User-visible failure

Observed production state:

- Route: `/session/kitchen`
- Current task: `Mix the dough`
- UI status: `30 min remaining`
- Primary action: `Mixing complete`
- Ingredient panel: `Ingredient amounts unavailable`
- Missing required visible amounts:
  - Flour
  - Water
  - Salt
  - Yeast

The result is unsafe for the kitchen task: the page asks the user to mix dough while withholding the amounts required to perform that action.

## 3. Reproduction steps

Safe source-level reproduction:

1. Create or load an active Pizza Session with:
   - a timeline whose current todo step is `mix-dough`
   - no `recipeSnapshot`, or a `recipeSnapshot` without `flourAmount`, `waterAmount`, `saltAmount` and `leavenerAmount`
   - otherwise sufficient canonical recipe inputs
2. Open `/session/kitchen`.
3. Kitchen computes `ingredients = doughKitchenIngredientLines(session.recipeSnapshot)`.
4. Because the snapshot is missing or incomplete, `ingredients.length === 0`.
5. The page renders `Ingredient amounts unavailable`.
6. `Mixing complete` remains available because completion uses `completeKitchenTimelineStep(session, currentStep, undefined, now)` and does not check ingredient availability.

Existing focused tests already cover the current behavior:

- `tests/pizza-session-kitchen.test.ts` asserts the Kitchen page contains `Ingredient amounts unavailable`.
- `tests/pizza-session-kitchen.test.ts` asserts `recipeSnapshotIngredientLines(undefined)` returns an empty list.
- `tests/session-recipe.test.ts` proves `buildSessionRecipe` produces a `recipeSnapshot` with positive `flourAmount`, `waterAmount`, `saltAmount` and `leavenerAmount` for valid session inputs.

Focused validation run for this audit:

```bash
npm test -- tests/pizza-session-kitchen.test.ts tests/session-recipe.test.ts
```

Result: 2 files passed, 114 tests passed.

## 4. Relevant session data shape

The relevant persisted session fields are:

- Canonical inputs:
  - `pizzaStyle`
  - `pizzaPreset`
  - `pizzaCount`
  - `doughBallWeight`
  - `ovenType`
  - `flour`
  - `yeastType`
  - `plannedFermentationHours`
  - hydration and temperature overrides where present
- Derived recipe data:
  - `recipeParams`
  - `recipeSnapshot`
- Kitchen progress:
  - `timeline`
  - `stepRuntime`
  - `currentStep`
  - `status`

`recipeSnapshot` is a derived Dough Plan snapshot, not the only source from which the app can calculate a Dough Plan. `lib/session-recipe.ts` can regenerate it through `buildSessionRecipe(session, now)` when the canonical inputs are valid.

## 5. Start-to-Kitchen data-flow trace

### `/session/start`

The start wizard persists the selected pizza-plan inputs and navigates to `/session/recipe`. At the final summary step, it saves a session with `lastRoute: "/session/recipe"` and attempts cloud materialization through `materializeCloudBackedPizzaSession`.

At this boundary, the canonical inputs should exist. The full ingredient snapshot is not the primary object being created here.

### `/session/recipe`

The recipe page calls `generateAndSaveActiveSessionRecipe()`. That helper:

- loads the active session
- calls `buildSessionRecipe(session, now)`
- stores:
  - `currentStep: "recipe"`
  - `lastRoute: "/session/recipe"`
  - `status: "planning"`
  - `recipeParams`
  - `recipeSnapshot`

This is the canonical materialization point for exact dough ingredients.

### `/session/timeline`

The timeline page calls `generateAndSaveActivePizzaSessionTimeline()`. Timeline generation also calls `buildSessionRecipe` for planning and fermentation context, but timeline saving only stores timeline fields. It does not repair or materialize a missing ingredient snapshot.

### `/session/kitchen`

Kitchen calls `getKitchenModeState(session, now)`, which internally calls `buildSessionRecipe(session, now)` for planning display and schedule derivation. However, the ingredient panel does not use that result. It separately reads only `session.recipeSnapshot`.

Earliest broken contract: Kitchen already has access to a path that can derive recipe data for valid sessions, but the actual `Mix the dough` ingredient panel depends only on a stored snapshot that may be absent or partial.

## 6. Kitchen availability check

Current check:

- File: `app/session/kitchen/page.tsx`
- Data source: `doughKitchenIngredientLines(session.recipeSnapshot)`
- Availability condition:
  - `ingredients.length > 0` renders `Dough ingredients`
  - `ingredients.length === 0` renders `Ingredient amounts unavailable`

Helper behavior:

- File: `lib/pizza-session-kitchen.ts`
- `recipeSnapshotIngredientLines(snapshot)` returns an empty array when `snapshot` is missing.
- It only reads amounts from the snapshot:
  - `flourAmount`
  - `waterAmount`
  - `saltAmount`
  - `leavenerAmount`
- `doughKitchenIngredientLines(snapshot)` filters that list to Flour, Water, Salt and Yeast.

The check does not distinguish between:

- a genuinely invalid session
- a recoverable valid session with missing derived snapshot
- a partial snapshot missing only the amount fields
- a temporary hydration state before canonical recovery has finished

## 7. Recipe recovery findings

Recipe is already a recovery path for valid sessions.

`/session/recipe` calls `generateAndSaveActiveSessionRecipe()`, which rebuilds and saves `recipeSnapshot` when `buildSessionRecipe` succeeds. Returning to Kitchen after visiting Recipe should restore the ingredient panel for sessions whose canonical inputs are complete.

Limitations:

- This recovery requires the user to know to open the Dough Plan or Recipe page.
- Kitchen does not offer a targeted `Open Dough Plan` recovery action from the missing-ingredients panel.
- Kitchen progress can continue before recovery occurs.
- A session whose canonical inputs are genuinely incomplete cannot be safely repaired by Recipe without user input.

No duplicate-session creation was found in this path. The helper updates the active session rather than creating a new one.

## 8. Local/cloud continuity findings

The audited code and focused tests indicate the app already has protections around cloud materialization and Kitchen progress sync:

- Start materializes cloud-backed sessions before routing to Recipe.
- Kitchen queues progress updates immediately after step completion.
- Existing cloud tests cover stale writes, cloud-backed session materialization and Kitchen mutation ordering.

No direct evidence was found that a complete local Dough Plan is overwritten by incomplete cloud data in the affected path. The more direct failure is that Kitchen treats the derived snapshot as the only acceptable ingredient source.

Continuity classification:

- Local-only complete session with `recipeSnapshot`: ingredients render.
- Local-only valid session without `recipeSnapshot`: recoverable, but Kitchen currently shows unavailable until Recipe rematerializes or Kitchen is fixed.
- Local-only incomplete session: requires completing/opening Dough Plan.
- Cloud-backed complete row: expected to render when restored with snapshot.
- Cloud-backed partial row: recoverable if canonical inputs survive; otherwise requires Dough Plan completion.
- Missing cloud row during materialization: existing materialization path is relevant, but not the verified primary cause.

## 9. Progression findings

`Mixing complete` remains available when ingredient amounts are missing.

The action calls `completeKitchenTimelineStep(session, currentStep, undefined, now)`. That helper mutates:

- `timeline.steps[*].status`
- `stepRuntime`
- `currentStep`
- `status`

It does not inspect `recipeSnapshot`, canonical recipe validity or ingredient-line availability.

Therefore a user can complete `mix-dough` without seeing a usable Dough Plan and can start the following dough rest. That can leave the session operationally inconsistent even though the timeline and runtime state are internally valid.

Patch 475B should enforce the invariant at the Kitchen interaction boundary: before completing `mix-dough`, Kitchen must either have recoverable ingredient amounts or block completion with a direct recovery path.

## 10. Timer findings

The `30 min remaining` state is not the verified root cause.

Current copy and task instruction indicate the mix step reserves up to 30 minutes, and the following dough rest starts after `Mixing complete`. The screenshot's timer is consistent with an active mix window, not with a mistaken display of ingredient availability.

Bounded finding: timer behavior can coexist with the missing Dough Plan state because step runtime and ingredient availability are currently independent.

## 11. Legacy-session findings

Legacy or partial sessions fall into three categories:

1. Safely recoverable:
   - canonical inputs are present
   - `buildSessionRecipe(session)` succeeds
   - `recipeSnapshot` is missing or partial
   - Kitchen should derive or materialize the snapshot without changing formulas

2. Requires user to open or complete Dough Plan:
   - one or more required canonical inputs are missing
   - Recipe returns a missing reason such as missing path, preset, quantity or flour
   - Kitchen should show a focused recovery action

3. Unrecoverable without starting a new plan:
   - malformed session cannot migrate or does not contain enough plan identity
   - Kitchen should keep the existing safe route-state behavior rather than progressing

Malformed sessions do not appear to crash in the audited helpers; they either migrate through `createPizzaSession` normalization or fall into unavailable/missing-route states.

## 12. Verified root cause

Primary classification: **D - Incorrect Kitchen lookup**.

The required ingredient values can exist as a canonical derived recipe result, but Kitchen's visible ingredient availability check reads only the persisted `recipeSnapshot` field. The same page's Kitchen state path already calls recipe-building logic for schedule/planning, which shows the app has a canonical way to recover amounts for valid inputs.

The missing UI is therefore not a formula failure. It is a boundary mismatch:

- Recipe page: can build and save Dough Plan.
- Timeline page: can use recipe build result for schedule context.
- Kitchen state: can derive recipe planning context.
- Kitchen ingredient panel: only trusts a pre-existing snapshot.

## 13. Secondary contributing factors

- Kitchen permits `mix-dough` progression even when Flour, Water, Salt and Yeast are unavailable.
- The unavailable-state copy says exact amounts require a saved Dough Plan, but does not provide a direct recovery action.
- Timeline saving does not repair a missing `recipeSnapshot`, even though it uses recipe-derived information.
- Existing tests assert that the warning exists, but do not assert the desired invariant that a recoverable session must show ingredient amounts.

## 14. Required invariant

Before Kitchen allows completion of `mix-dough`, it should have a usable canonical Dough Plan for the active session.

Minimum required visible values:

- Flour
- Water
- Salt
- Yeast

For a valid recoverable session, Kitchen should derive or materialize these values from the canonical recipe builder rather than asking the user to infer them. For an unrecoverable session, Kitchen should block the mix-completion action and provide a clear route back to Dough Plan/Recipe.

## 15. Patch 475B implementation scope

Smallest recommended fix:

1. Use `buildSessionRecipe(session, now)` as the canonical recovery source for the Kitchen `Mix the dough` ingredient panel.
2. Prefer a saved `recipeSnapshot` when it is complete and consistent enough for display, but fall back to `buildSessionRecipe` for recoverable sessions.
3. Optionally materialize the recovered `recipeSnapshot` at the earliest safe boundary, likely when Kitchen opens or before `mix-dough` completion.
4. Distinguish loading/recovering state from genuinely missing data.
5. Block `Mixing complete` only when the session cannot produce Flour, Water, Salt and Yeast from either saved snapshot or canonical recipe build.
6. Add a focused recovery action such as `Open Dough Plan` or `Open Dough Plan to restore amounts` for unrecoverable sessions.

Likely files:

- `app/session/kitchen/page.tsx`
- `lib/pizza-session-kitchen.ts`
- possibly `lib/pizza-session-timeline.ts` only if the chosen repair point is timeline materialization
- focused Kitchen/session tests

Canonical helper to preserve:

- `buildSessionRecipe`

Fields not to duplicate:

- Do not add a second ingredient formula or alternate Dough Plan schema.
- Do not create new persisted amount fields outside `recipeSnapshot`.

API and migration expectation:

- No API changes required.
- No database changes required.
- No migrations required.

## 16. Focused test plan for Patch 475B

Required regression tests:

1. Valid complete session with `recipeSnapshot` renders Flour, Water, Salt and Yeast in Kitchen.
2. Recoverable session without `recipeSnapshot` still renders Flour, Water, Salt and Yeast by using `buildSessionRecipe`.
3. Recoverable partial snapshot missing amount fields is repaired or falls back to canonical recipe build.
4. Unrecoverable session with missing canonical inputs does not allow `Mixing complete`.
5. `Mixing complete` remains enabled for valid sessions after ingredient recovery.
6. Dough-rest timer starts only after a valid mix completion.
7. Recipe recovery path rebuilds the same snapshot and preserves Kitchen progress.
8. Returning from Recipe to Kitchen does not create a duplicate session.
9. Local-only recoverable session works.
10. Cloud-backed restored recoverable session works.
11. Partial/stale cloud state does not hide a complete local or derived Dough Plan when canonical inputs are present.
12. Ingredient values match existing `buildSessionRecipe` numerical fixtures.
13. No dough formula, yeast, hydration, fermentation or validation fixture changes.

## 17. Risks and safeguards

Risks:

- Rebuilding the recipe in Kitchen could accidentally change display amounts if it uses a different `now` than the saved recipe. Patch 475B should use the same canonical builder and preserve existing recipe/timeline assumptions.
- Persisting a repaired snapshot at the wrong moment could overwrite user choices. The fix should only persist derived values from the current canonical session inputs.
- Blocking progression too broadly could trap users with valid recoverable sessions. The block should apply only after recovery fails.

Safeguards:

- Keep all calculations in `buildSessionRecipe`.
- Add focused tests around recoverable and unrecoverable sessions.
- Do not change session schema or migrations.
- Do not alter timeline duration semantics.
- Do not change cloud or local storage contracts beyond saving the existing `recipeSnapshot` shape if repair is implemented.

## 18. Confirmation that no production code changed

This patch is audit-only.

Changed file:

- `docs/audits/patch-475a-kitchen-missing-dough-plan-audit.md`

No production code, formulas, session data, API handlers, database files, migrations, navigation, header, footer, real user data, localStorage data or cloud data were modified.
