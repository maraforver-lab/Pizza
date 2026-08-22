# Patch 477 - Dough Start & Fermentation Choice Audit

## 1. Executive Conclusion

Patch 477 is a GO for implementation.

The missing `Start now` path is not a canonical yeast-engine limitation. The current engine can calculate arbitrary one-minute fermentation durations through the supported 3-72 h range, including `31 h 54 min @ 4 C` cold fermentation.

The defect is in Dough Plan state and UI semantics:

- `/session/start` captures a broad dough-start preference: `now`, `later`, or `recommend`.
- `/session/recipe` later exposes a cold fermentation length selector, but that selector is duration-only and cold-only.
- `plannedFermentationHours` can represent `24`, `48`, `72`, or a rounded available cold duration, but it cannot distinguish `24 h room` from `24 h cold`.
- Once a user is in a `later` / `24 h cold` state, the recipe page has no equivalent `Start now` reselection path, so the available window can collapse to 24 h even when the original bake target is ~31.9 h away.

Patch 477A should add an explicit Dough Plan fermentation-choice model that preserves the current canonical yeast formulas while making these choices representable:

1. `Start now` - actual remaining time, cold when `> 24 h`.
2. `24 h room` - exact 24 h, room, 22 C default.
3. `24 h cold` - exact 24 h, cold, 4 C default.

## 2. Current Architecture

### Session setup

Files inspected:

- `app/session/start/page.tsx`
- `lib/pizza-session.ts`
- `lib/pizza-session-storage.ts`

The setup flow stores:

| Field | Current role |
| --- | --- |
| `targetEatTime` / `targetBakeTime` | Bake/eat target used as the timeline anchor. |
| `doughStartMode` | Broad preference: `now`, `later`, or `recommend`. |
| `doughEarliestStartTime` | Only retained when `doughStartMode === "later"`. |
| `plannedFermentationHours` | Optional selected duration, currently normalized to `24-72`. |
| `fermentationTemperatureCOverride` | One scalar override, accepted from `2-26 C`, then interpreted by the active fermentation mode. |

`createPizzaSession()` intentionally removes `doughEarliestStartTime` unless `doughStartMode` is `later`, so there is no current persisted "start-now anchor" field.

### Dough Plan recipe calculation

Files inspected:

- `lib/session-recipe.ts`
- `app/session/recipe/page.tsx`
- `lib/session-fermentation-display.ts`
- `lib/continuous-yeast-model.ts`
- `lib/yeast-fermentation-model.ts`

The production Dough Plan path is:

```text
PizzaSession
-> recipeSettingsFromSession()
-> calculateDoughIngredients() baseline
-> planningInfoFromSessionRecipe()
-> buildSessionContinuousYeast()
-> calculateContinuousYeastRecommendation()
-> calculateCanonicalYeastRequirement()
-> recipeIngredientsWithYeastPercent()
-> recipeSnapshot / recipeParams
```

`buildSessionContinuousYeast()` resolves the start time with:

```text
if doughStartMode === "now": now
if doughStartMode === "later": valid doughEarliestStartTime else now
if recommend/default: now
```

It then computes:

```text
availableFermentationHours = hoursBetween(start, target)
selectedFermentationHours = valid plannedFermentationHours only when mode is cold
fermentationHours = selectedFermentationHours ?? availableFermentationHours
```

The active process is currently derived from planning:

```text
recommendedMode = planningInfo.result.fermentationSetupRecommendation?.recommendedFermentationMode
mode = recommendedMode === "room" ? "room" : "cold"
```

This means `hybrid`, `cold`, and other non-room states are routed to canonical cold yeast.

### Timeline

Files inspected:

- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-timeline-display.ts`
- `tests/pizza-session-timeline.test.ts`

Timeline already has useful primitives:

- `doughStartMode === "now"` can anchor a timeline at the current planning time.
- `timeline.anchorTime` keeps that start-now timeline stable after reopening later workflow steps.
- `plannedFermentationHours` changes the generated start time by calculating `target - plannedHours`.

However, timeline currently infers process from `plannedFermentationHours` as cold:

```text
if plannedFermentationHours is finite -> fermentationMode = "cold"
```

So the timeline cannot represent `24 h room` as a selected 24 h plan without an explicit process field.

## 3. Root Cause of Missing Start Now

The root cause is a state/reselection gap on `/session/recipe`, not a yeast-calculation gap.

Current recipe-page selector:

```text
fermentationDurationOptions(availableHours)
-> [] if available < 24 or > 72
-> unique [24, 48, 72, roundedAvailable] filtered to <= available
```

The rendered buttons are all labeled:

```text
{duration} cold
```

Observed `~31.9 h available -> only 24 h cold` can occur when the saved session has already been narrowed to a `later` 24 h plan:

```text
doughStartMode = "later"
doughEarliestStartTime = bake target - 24 h
plannedFermentationHours = 24
```

In that state, `buildSessionContinuousYeast()` computes `availableFermentationHours` from the later start to the target, so it becomes exactly 24 h. The selector then only has one valid option: `24 h cold`.

There is no recipe-page control to return to:

```text
doughStartMode = "now"
plannedFermentationHours = undefined
full remaining window
```

The current UI therefore traps a user in the narrowed 24 h start-later state unless they go back to setup and edit dough availability.

## 4. Current State and Persistence Behavior

No database schema change is involved in the current local Pizza Session model. Local sessions are stored in `localStorage` under `doughtools:pizza-sessions-v1`.

Current relevant normalization:

| Behavior | Source | Result |
| --- | --- | --- |
| `doughStartMode` supports `now`, `later`, `recommend` | `lib/pizza-session.ts` | Existing field is valid. |
| `doughEarliestStartTime` kept only for `later` | `createPizzaSession()` | Cannot store start-now anchor here. |
| `plannedFermentationHours` supports `24-72` | `plannedFermentationHoursValue()` | Supports exact 24 and arbitrary decimal hours in range. |
| `fermentationTemperatureCOverride` supports `2-26` | `fermentationTemperatureCOverrideValue()` | One field must be interpreted by current process. |
| No explicit fermentation process override exists | current model | `24 h room` and `24 h cold` cannot both be represented. |

Current cloud/API paths were inspected only at the boundary level. Session payloads appear to carry session-shaped JSON data, but Patch 477A should verify cloud serialization tests before adding any optional field.

## 5. Three-Choice Feasibility

Example: available window `31 h 54 min`.

| Choice | Current representation | Feasible today? | Gap |
| --- | --- | --- | --- |
| Start now | `doughStartMode: "now"`, no `plannedFermentationHours` | Partly | Recipe uses current `now` each time, not a locked start timestamp. |
| 24 h room | `plannedFermentationHours: 24` plus process room | No | No field stores explicit process for a selected duration. |
| 24 h cold | `doughStartMode: "later"`, `doughEarliestStartTime: target - 24 h`, `plannedFermentationHours: 24` | Yes | This is the current dominant selected state. |

All three are feasible without changing canonical yeast formulas, APIs, database tables, or migrations. They are not all feasible with the current persisted session fields alone.

Smallest clean state addition for Patch 477A:

```ts
type PizzaSessionFermentationChoice =
  | "start_now"
  | "twenty_four_hour_room"
  | "twenty_four_hour_cold";

type PizzaSession = {
  fermentationChoice?: PizzaSessionFermentationChoice;
  plannedFermentationMode?: "room" | "cold";
  doughStartAnchorTime?: string;
}
```

Implementation may choose a slightly different naming scheme, but it must add explicit process semantics. `plannedFermentationHours` alone is insufficient.

## 6. Exact Start-Now Semantics

Start now should mean:

```text
Use the actual time from the dough-start action to the planned bake/eat target.
```

For `31 h 54 min` remaining:

```text
fermentation duration = 31 h 54 min
process = cold because duration > 24 h
temperature = 4 C default unless a valid cold override exists
canonical engine receives fermentationMinutes = 1914
```

Patch 477A should lock the start-now timestamp at selection time, not recompute it on every recipe-page render.

Recommended state:

```text
fermentationChoice = "start_now"
doughStartMode = "now"
doughStartAnchorTime = selectedNowIso
plannedFermentationHours = undefined
plannedFermentationMode = derived from duration at selection time
```

Why lock the timestamp:

- Current recipe calculation uses `now`, so reopening the recipe later changes yeast grams.
- Timeline already uses `anchorTime` for `now`, but that anchor is created at timeline generation, not at Dough Plan selection.
- Recipe, Timeline, Shopping, and Kitchen need the same fermentation basis.

The selected start-now duration should be recomputed from:

```text
targetTime - doughStartAnchorTime
```

not from:

```text
targetTime - current page-open time
```

## 7. 24 h Room Semantics

`24 h room` is an explicit user choice, not the default recommendation rule.

Required engine inputs:

```text
fermentationMinutes = 1440
fermentationProcess = "room"
fermentationTemperatureC = 22
start time = bake target - 24 h
```

Recommended state:

```text
fermentationChoice = "twenty_four_hour_room"
doughStartMode = "later"
doughEarliestStartTime = target - 24 h
plannedFermentationHours = 24
plannedFermentationMode = "room"
fermentationTemperatureCOverride = undefined unless Pizza Nerd sets a valid room value
```

The canonical yeast model already allows `24 h room`. The missing piece is preserving explicit room process when duration is exactly 24 h.

## 8. 24 h Cold Semantics

`24 h cold` is also an explicit user choice.

Required engine inputs:

```text
fermentationMinutes = 1440
fermentationProcess = "cold"
fermentationTemperatureC = 4
start time = bake target - 24 h
```

Recommended state:

```text
fermentationChoice = "twenty_four_hour_cold"
doughStartMode = "later"
doughEarliestStartTime = target - 24 h
plannedFermentationHours = 24
plannedFermentationMode = "cold"
fermentationTemperatureCOverride = undefined unless Pizza Nerd sets a valid cold value
```

This is close to current behavior, except the current model only implies cold from `plannedFermentationHours` and does not store the process explicitly.

## 9. Canonical Yeast Inputs and Results

Reference dough:

```text
flour = 963 g
hydration = 64%
salt = 2.8%
```

Current Dough Plan default yeast type is Active dry yeast (`ady`), but implementation fixtures should test Fresh, IDY, and ADY.

| Choice | Duration | Process | Temp | Fresh % | IDY % | ADY % | Fresh g | IDY g | ADY g |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Start now | 31 h 54 min | cold | 4 C | 0.540622 | 0.180207 | 0.216249 | 5.206 | 1.735 | 2.082 |
| 24 h room | 24 h | room | 22 C | 0.054000 | 0.018000 | 0.021600 | 0.520 | 0.173 | 0.208 |
| 24 h cold | 24 h | cold | 4 C | 0.660000 | 0.220000 | 0.264000 | 6.356 | 2.119 | 2.542 |

Additional boundary fixtures:

| Case | Process | Temp | IDY g | ADY g |
| --- | --- | ---: | ---: | ---: |
| 23 h | room | 22 C | 0.182 | 0.218 |
| 24 h 01 min | cold | 4 C | 2.118 | 2.541 |
| 26 h | cold | 4 C | 2.014 | 2.417 |
| 48 h | cold | 4 C | 1.156 | 1.387 |
| 71 h 59 min | cold | 4 C | 0.722 | 0.867 |
| 72 h | cold | 4 C | 0.722 | 0.867 |

Temperature sensitivity for `31 h 54 min` cold:

| Temp | IDY g | ADY g |
| ---: | ---: | ---: |
| 3 C | 1.993 | 2.392 |
| 4 C | 1.735 | 2.082 |
| 5 C | 1.511 | 1.813 |
| 6 C | 1.315 | 1.578 |

These values are calculated from the current Patch 474B canonical engine constants and formulas. They are fixed-flour regression references; total-dough recipe balancing will produce slightly different flour grams and yeast grams in full product fixtures.

## 10. Timeline Implications

Current timeline can schedule from either:

- the current time for `doughStartMode: "now"`;
- `doughEarliestStartTime` for `doughStartMode: "later"`;
- `target - plannedFermentationHours` when a selected cold duration exists.

Patch 477A must align Timeline with the selected engine process:

| Choice | Mix dough | Fermentation step | Final proof/warm-up | Bake |
| --- | --- | --- | --- | --- |
| Start now, >24 h | At locked start-now timestamp | Cold fermentation after initial room start | Existing final room rest behavior | Target time |
| 24 h room | Target - 24 h | Room temperature ferment | Final room rest, not cold warm-up | Target time |
| 24 h cold | Target - 24 h | Cold fermentation after initial room start | Existing final room rest/warm-up | Target time |

No hidden mismatch is acceptable:

```text
recipe = cold
timeline = room
```

or:

```text
recipe = room
timeline = cold
```

Current `resolveSessionTimelineFermentationMode()` must stop treating every `plannedFermentationHours` value as cold once `plannedFermentationMode` exists.

Timeline times may remain rounded for user-facing schedule display, but canonical yeast duration must use the exact selected minutes.

## 11. Pizza Nerd Behavior

Expected behavior after Patch 477A:

| Choice | Exposed temperature control | Valid range | Default |
| --- | --- | ---: | ---: |
| Start now, cold | Refrigerator temperature | 2-8 C | 4 C |
| Start now, room | Room temperature | 18-26 C | 22 C |
| 24 h room | Room temperature | 18-26 C | 22 C |
| 24 h cold | Refrigerator temperature | 2-8 C | 4 C |

Changing temperature must not change `plannedFermentationMode`.

When switching process:

- If the existing scalar `fermentationTemperatureCOverride` is invalid for the new process, ignore it and use the process default.
- If Patch 477A wants to restore previous per-process values, do that in component state unless a separate persisted model is deliberately added.
- Do not silently convert `24 h room` into `24 h cold` because the temperature value changed.

## 12. Boundary Availability Matrix

Recommended availability:

| Available window | Start now | 24 h room | 24 h cold | Notes |
| ---: | --- | --- | --- | --- |
| 23 h | Yes, room | No | No | Not enough time for exact 24 h choices. |
| 24 h | Yes, room | Yes | Yes | Explicit 24 h cold is allowed even though default recommendation at 24 h is room. |
| 24 h 01 min | Yes, cold | Yes | Yes | Product recommendation switches Start now to cold because full duration is >24 h. |
| 26 h | Yes, cold | Yes | Yes | All three choices are meaningful. |
| 31 h 54 min | Yes, cold | Yes | Yes | Primary observed target. |
| 48 h | Yes, cold | Yes | Yes | Full-window start-now is directly supported by canonical cold model. |
| 71 h 59 min | Yes, cold | Yes | Yes | Full-window start-now is still inside direct support. |
| 72 h | Yes, cold, caution | Yes | Yes | Upper direct-scaling boundary. |
| >72 h | No direct full-window Start now | Yes | Yes | Keep or adapt existing long-horizon later-start planning; direct yeast for full window is out of range. |

For `>72 h`, Patch 477A should not calculate full-horizon yeast. It may retain the existing 24/48/72 h long-horizon cold options, but it should still avoid trapping the user without a clear later-start choice. Whether to include `24 h room` in the over-72 h long-horizon UI is a product choice; it is technically feasible if explicit process state is added.

## 13. Reselection and State Behavior

Current reselection problem:

```text
User selects 24 h cold
-> session has later start and plannedFermentationHours = 24
-> recipe recomputes available window from later start
-> selector only sees 24 h
-> Start now/full available window is not visible
```

Required future switching:

| Switch | Required state update |
| --- | --- |
| Start now -> 24 h room | Set `doughStartMode: "later"`, `doughEarliestStartTime: target - 24h`, `plannedFermentationHours: 24`, `plannedFermentationMode: "room"`, clear invalid cold temp override. |
| Start now -> 24 h cold | Set `doughStartMode: "later"`, `doughEarliestStartTime: target - 24h`, `plannedFermentationHours: 24`, `plannedFermentationMode: "cold"`, clear invalid room temp override. |
| 24 h room -> 24 h cold | Preserve target and duration, change explicit process and default temperature. |
| 24 h cold -> 24 h room | Preserve target and duration, change explicit process and default temperature. |
| 24 h room/cold -> Start now | Set `doughStartMode: "now"`, lock `doughStartAnchorTime`, clear fixed planned duration, derive process from actual full duration. |

The selector should be built from the original target and actual current/anchored start context, not only from the narrowed later-start duration.

## 14. Recommended Mobile UX

Current heading:

```text
Choose your fermentation length
```

This is incomplete because the decision is start time plus fermentation process.

Recommended mobile-first heading:

```text
When do you want to make the dough?
```

Recommended options for a `31 h 54 min` window:

```text
Start now
31 h 54 min available
Cold fermentation · 4 C

Start later - 24 h room
Start at [target - 24 h]
Room temperature · 22 C

Start later - 24 h cold
Start at [target - 24 h]
Cold fermentation · 4 C
```

Keep the content compact:

- one selected state;
- no advanced technical explanation before ingredients;
- exact duration visible for Start now;
- process and temperature visible for every choice;
- one-tap reselection;
- no hidden state that continues affecting yeast after a choice is no longer selected.

## 15. Exact Implementation Scope for Patch 477A

Patch 477A should be a focused production fix.

Recommended scope:

1. Add explicit session-level fermentation choice/process state.
2. Lock a start-now timestamp when selecting Start now from Dough Plan.
3. Replace the recipe-page cold duration selector with a start/fermentation choice selector.
4. Update `buildSessionContinuousYeast()` to derive:
   - exact duration minutes;
   - explicit process;
   - process-appropriate default temperature.
5. Update `buildSessionFermentationDisplay()` so `24 h room` and `24 h cold` display distinctly.
6. Update timeline process inference so selected 24 h room produces room fermentation steps.
7. Preserve canonical yeast formulas and constants exactly.
8. Preserve local/cloud storage keys and database schema.
9. Add tests for:
   - `31 h 54 min` Start now exact duration;
   - `24 h room`;
   - `24 h cold`;
   - reselection from 24 h cold back to Start now;
   - timeline recipe/process agreement;
   - Pizza Nerd temperature process stability;
   - over-72 h no direct full-window yeast.

Files likely affected in Patch 477A:

- `lib/pizza-session.ts`
- `lib/session-recipe.ts`
- `lib/session-fermentation-display.ts`
- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-timeline-display.ts`
- `app/session/recipe/page.tsx`
- focused tests under `tests/session-recipe.test.ts`, `tests/session-fermentation-display.test.ts`, and `tests/pizza-session-timeline.test.ts`

Do not touch:

- `lib/yeast-fermentation-model.ts`
- `lib/continuous-yeast-model.ts`
- database migrations
- APIs
- Google indexing settings

## 16. Regression Fixtures

Use fixed-flour canonical engine fixtures:

| Fixture | Flour | Duration | Process | Temp | Yeast type | Expected grams |
| --- | ---: | ---: | --- | ---: | --- | ---: |
| Start now full window | 963 g | 31 h 54 min | cold | 4 C | ADY | 2.082 g |
| Start now full window | 963 g | 31 h 54 min | cold | 4 C | IDY | 1.735 g |
| Explicit 24 h room | 963 g | 24 h | room | 22 C | ADY | 0.208 g |
| Explicit 24 h cold | 963 g | 24 h | cold | 4 C | ADY | 2.542 g |
| Boundary after 24 h | 963 g | 24 h 01 min | cold | 4 C | ADY | 2.541 g |
| Long direct cold | 963 g | 48 h | cold | 4 C | ADY | 1.387 g |
| Upper direct cold | 963 g | 72 h | cold | 4 C | ADY | 0.867 g |

Full Dough Plan fixture should also verify product balancing:

```text
recipe.continuousYeast.recommendation.yeastAmountGrams
is close to
recipe.ingredients.leavener
```

and should not assert against fixed 963 g if total dough balancing changes the flour mass.

## 17. GO / NO-GO

GO.

Rationale:

- The canonical yeast engine already supports the required room/cold processes, exact minute durations and temperature-sensitive calculations.
- Existing session model already has most scheduling primitives.
- Existing timeline model already supports anchored start-now behavior.
- The implementation does not require formula changes, migrations, API changes or deployment architecture changes.

Condition for GO:

Patch 477A must add explicit fermentation-process state. Reusing `plannedFermentationHours` alone would be a NO-GO because it cannot represent `24 h room` and `24 h cold` safely.
