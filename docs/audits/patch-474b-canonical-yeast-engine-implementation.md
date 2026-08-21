# Patch 474B - Canonical Yeast Engine Implementation

## Summary

Patch 474B implements the Patch 474A canonical yeast and fermentation model as a shared production calculation helper.

The implementation replaces the old commercial-yeast calculation paths that allowed room and cold fermentation to converge on nearly identical yeast values around 24 hours. Dough Plan and Quick Calculator now both derive commercial fresh yeast, instant dry yeast and active dry yeast from the same canonical engine.

No database, API, migration, persistence or deployment change was made.

## Files changed

- `lib/yeast-fermentation-model.ts`
- `lib/dough-calculator.ts`
- `lib/continuous-yeast-model.ts`
- `lib/quick-calculator/advanced-dough-tools.ts`
- `lib/yeast-types.ts`
- `lib/planning-yeast-guidance.ts`
- `lib/planning-yeast-model.ts`
- `app/session/start/page.tsx`
- `docs/continuous-yeast-model-v1.md`
- `tests/yeast-fermentation-model.test.ts`
- `tests/continuous-yeast-model.test.ts`
- `tests/dough-calculator.test.ts`
- `tests/quick-calculator.test.ts`
- `tests/session-recipe.test.ts`
- `tests/start-pizza-session-wizard.test.ts`
- `tests/pizza-session-kitchen.test.ts`

## Old architecture

Before this patch, DoughTools had multiple yeast calculation paths:

- `lib/dough-calculator.ts` used a production-compatible fresh yeast anchor and conversion factors.
- `lib/session-recipe.ts` applied the continuous yeast helper after the base ingredient calculation for Dough Plan recipes.
- Quick Calculator inherited some values from `calculateDoughIngredients`, while advanced tools kept separate conversion and reverse-fermentation logic.
- Planning guidance used its own fresh-equivalent multipliers.

Patch 474 identified the main defect: the current model used the same 24-hour fresh-equivalent anchor for room and cold fermentation, so `~24 h @ 22 C` and `~24-25 h @ 4 C` could produce effectively the same displayed yeast amount.

## New canonical architecture

The new shared engine lives in:

```text
lib/yeast-fermentation-model.ts
```

It exposes:

- `calculateCanonicalYeastRequirement`
- `recommendedFermentationProcessForMinutes`
- `canonicalYeastTypeFromRecipeYeastType`
- canonical constants and typed process/yeast inputs

Commercial yeast calculations now route through this helper:

- Dough Plan ingredients use `calculateDoughIngredients`, which calls the canonical helper for `cy`, `idy` and `ady`.
- Quick Calculator already uses `calculateDoughIngredients`, so identical inputs now produce identical ingredient results.
- `lib/continuous-yeast-model.ts` remains as a compatibility adapter, but delegates yeast math to the canonical helper.
- Quick advanced yeast conversion and reverse-fermentation target calculations now use canonical conversion factors and canonical yeast results.

## Implemented formulas and constants

### Room fermentation

Domain:

```text
3:00-24:00
default temperature: 22 C
process: room
```

Constants:

```text
Q10 = 2
ROOM_REFERENCE_TEMPERATURE_C = 22
ROOM_FRESH_AT_8H_PERCENT = 0.180
ROOM_FRESH_AT_24H_PERCENT = 0.054
DURATION_EXPONENT = 1.0959032742893846
ROOM_COEFFICIENT = 1.7578093848840328
```

Formula:

```text
durationHours = fermentationMinutes / 60
rate = Q10 ^ ((fermentationTemperatureC - 22) / 10)
effectiveExposureHours = durationHours * rate
freshYeastPercent = ROOM_COEFFICIENT * effectiveExposureHours ^ (-DURATION_EXPONENT)
```

### Cold fermentation

Domain:

```text
24:00-72:00 for explicit cold-process calculations
recommended product switch: >24:00
default temperature: 4 C
process: cold
```

Cold process semantics:

```text
1 h room start -> cold hold -> 2 h final room proof -> bake
```

The selected total fermentation time includes those phases. The V1 calculation does not ask normal users to configure phase durations.

Canonical 4 C IDY anchors:

```text
24 h -> 0.220% IDY
48 h -> 0.120% IDY
72 h -> 0.075% IDY
```

Arbitrary times use log-linear interpolation between the surrounding anchors.

Temperature correction:

```text
coldTemperatureMultiplier = 4 ^ ((4 - fermentationTemperatureC) / 10)
instantDryYeastPercent = baseColdIdyPercentAt4C * coldTemperatureMultiplier
```

The cold model intentionally does not use the room `Q10 = 2` curve.

### Yeast conversion

Canonical fresh-equivalent conversion factors:

```text
fresh = 1.0
instant_dry = 1 / 3
active_dry = 0.4
```

The public recipe yeast codes remain compatible:

```text
cy  -> fresh
idy -> instant_dry
ady -> active_dry
```

The visible label for `ady` was clarified from `Dry yeast` to `Active dry yeast` where that code is presented directly.

## Compatibility decisions

No persisted recipe, session, URL or database contract was migrated.

Existing recipe yeast codes are adapted at the canonical-engine boundary. Stored values such as `ady` remain valid.

Sourdough starter yeast types (`ssd`, `lsd`) remain on the existing starter-equivalence calculation because Patch 474A specified a canonical commercial yeast model for fresh, IDY and ADY. That legacy branch is intentionally isolated in `lib/dough-calculator.ts` and is not used for commercial yeast.

The explicit `24h-cold` preset remains calculable as a cold process for backward compatibility, while the product recommendation helper still maps exactly `24:00` to room and `24:01` to cold.

## Regression fixtures

Reference dough:

```text
flour: 963 g
hydration: 64%
salt: 2.8%
```

| Case | Process | Temperature | Yeast type | Percent | Grams |
| --- | --- | ---: | --- | ---: | ---: |
| `24 h` | room | `22 C` | fresh | `0.054%` | `0.520 g` |
| `24 h` | room | `22 C` | ADY | `0.0216%` | `0.208 g` |
| `24 h 01 min` | cold | `4 C` | IDY | `0.21991%` | `2.118 g` |
| `25 h` | cold | `4 C` | IDY | `0.21451%` | `2.066 g` |
| `48 h` | cold | `4 C` | IDY | `0.12000%` | `1.156 g` |
| `72 h` | cold | `4 C` | IDY | `0.07500%` | `0.722 g` |
| `37 h 52 min` | cold | `4.3 C` | IDY | `0.14868%` | `1.432 g` |

These are calculation test points only. They are not presets or allowed increments.

## Before and after key values

Patch 474 recorded current values around the suspicious cases:

| Case | Old displayed result | Patch 474B result |
| --- | ---: | ---: |
| `23.6 h @ 22 C room`, ADY | `~0.205 g` | governed by room curve near `0.211 g` ADY for `963 g` flour |
| `24 h @ 22 C room`, ADY | `~0.200 g` | `0.208 g` ADY |
| `24 h @ 4 C cold`, ADY | `~0.200 g` | explicit cold process: `~2.54 g` ADY |
| `25 h @ 4 C cold`, IDY | old model equivalent was materially lower | `2.066 g` IDY |

The major intentional change is cold fermentation. Cold retards now use a separate refrigerated-dough calibration with a practical reliability margin instead of the obsolete shared room/cold anchor.

## Validation results

Focused and affected regression validation completed:

```text
npm test -- tests/yeast-fermentation-model.test.ts tests/continuous-yeast-model.test.ts tests/dough-calculator.test.ts tests/quick-calculator.test.ts tests/session-recipe.test.ts tests/pizza-session-scenario-qa.test.ts tests/start-pizza-session-wizard.test.ts tests/pizza-session-kitchen.test.ts tests/calculator-progressive-disclosure.test.ts tests/planning-engine.test.ts tests/recipe-workflow.test.ts tests/trust-pages.test.ts
```

Result:

```text
12 test files passed
389 tests passed
```

Additional completion validation:

```text
npm run lint                     passed
npm run build                    passed
git diff --check                 passed
```

The full suite was also attempted after updating the affected yeast/calculation fixtures. It still has three unrelated source-text assertion failures in `tests/cloud-pizza-sessions.test.ts`, `tests/cta-language.test.ts` and `tests/learning-architecture.test.ts`. None of those failures involve yeast calculation, Dough Plan ingredient math, Quick Calculator math or the files changed by Patch 474B.

## Known limitations

- The V1 canonical model does not apply hydration or salt corrections. Those values are retained as engine inputs for future extension and diagnostics.
- The V1 cold model documents a practical staged process but does not simulate biological activity separately for each phase.
- Existing sourdough starter calculations remain legacy-compatible and are outside the commercial yeast model implemented here.
- The UI has not been broadly redesigned; only the ambiguous active-dry label was clarified where necessary.
