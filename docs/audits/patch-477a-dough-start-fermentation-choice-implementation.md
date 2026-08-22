# Patch 477A - Dough Start and Fermentation Choice Implementation

## Summary

Patch 477A implements the Patch 477 Dough Plan fermentation-choice model without changing canonical yeast formulas.

The previous `/session/recipe` UI exposed a duration-only cold fermentation selector. A saved `later` / `24 h cold` state narrowed the recipe basis to 24 h, so the selector could lose the original full-window `Start now` option.

## New Explicit State

`PizzaSession` now supports optional explicit Dough Plan state:

- `fermentationChoice`: `start_now`, `twenty_four_hour_room`, or `twenty_four_hour_cold`
- `plannedFermentationMode`: `room` or `cold`
- `doughStartAnchorTime`: stable timestamp for the original choice window

Legacy `plannedFermentationHours` remains supported. No storage key, API, database table, or migration changed.

## Availability Rules

The selector uses the anchored choice window, not only the currently selected later-start duration:

| Available window | Choices |
| ---: | --- |
| `<24 h` | `Start now` |
| `24-72 h` | `Start now`, `24 h room`, `24 h cold` |
| `>72 h` | Existing long-horizon later-start planning |

`Start now` uses room fermentation through exactly 24 h and cold fermentation after 24 h.

## Behavior

- `Start now`: locks `doughStartAnchorTime`, clears fixed duration, and sends the exact anchored duration to the canonical yeast path.
- `24 h room`: sets `doughStartMode: "later"`, `doughEarliestStartTime: target - 24 h`, `plannedFermentationHours: 24`, and `plannedFermentationMode: "room"`.
- `24 h cold`: uses the same 24 h later start with `plannedFermentationMode: "cold"`.

Switching between choices resets invalid temperature overrides and preserves the bake target.

## Timeline Integration

Timeline generation now includes `fermentationChoice` and `plannedFermentationMode` in its input signature. Explicit `24 h room` produces room-fermentation timeline steps; explicit `24 h cold` produces cold-fermentation steps.

## Canonical Yeast Integration

The implementation routes recipe yeast through the existing canonical continuous yeast path. It does not change:

- `lib/yeast-fermentation-model.ts`
- `lib/continuous-yeast-model.ts`
- canonical constants
- conversion factors
- fermentation formulas

Reference fixtures for 963 g flour:

| Choice | Process | Duration | Yeast |
| --- | --- | ---: | ---: |
| Start now | cold | 31 h 54 min | IDY 1.735 g / ADY 2.082 g |
| 24 h room | room | 24 h | ADY 0.208 g |
| 24 h cold | cold | 24 h | ADY 2.542 g |

## Compatibility

Existing sessions with only `plannedFermentationHours` still load. Legacy selected duration remains cold unless `plannedFermentationMode` explicitly says room. Existing local/cloud session JSON remains session-shaped and schema-compatible.

## Validation

Focused validation added coverage for:

- boundary choice availability
- explicit choice normalization
- `31 h 54 min` exact start-now duration
- explicit `24 h room`
- explicit `24 h cold`
- legacy narrowed `24 h cold` choice-window recovery
- fermentation display labels
- timeline recipe/process agreement
- canonical yeast reference values

Commands run:

- `npm test -- tests/pizza-session.test.ts tests/session-recipe.test.ts tests/session-fermentation-display.test.ts tests/pizza-session-timeline.test.ts tests/yeast-fermentation-model.test.ts`
- `npm test -- tests/pizza-session.test.ts tests/session-recipe.test.ts tests/session-fermentation-display.test.ts tests/pizza-session-timeline.test.ts tests/yeast-fermentation-model.test.ts tests/start-pizza-session-wizard.test.ts tests/pizza-session-kitchen.test.ts tests/pizza-session-shopping-list.test.ts tests/pizza-session-scenario-qa.test.ts tests/dough-guide.test.ts`
- `npm run lint`
- `npm run build`
- `git diff --check`

An exploratory run including `tests/cloud-pizza-sessions.test.ts` showed an Account page copy assertion expecting `Your DoughTools workspace.` with a period. This patch does not touch Account code or cloud persistence contracts, so that assertion was treated as outside the Patch 477A validation scope.

No deployment was performed.
