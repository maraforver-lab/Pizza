# Continuous yeast model v1 audit/design

Patch 152 was an audit/design pass only. Patch 153 adds the first isolated helper described here without changing production recipe formulas, ingredient amounts, Pizza Session behavior, storage, routes, or UI.

Patch 153 helper:

- `lib/continuous-yeast-model.ts`
- primary function: `calculateContinuousYeastRecommendation(input)`
- tests: `tests/continuous-yeast-model.test.ts`
- production integration: not yet wired into `calculateDoughIngredients()`

## Current production model

Production ingredient grams are calculated in `lib/dough-calculator.ts` by `calculateDoughIngredients(settings)`.

Current inputs that affect commercial yeast amount:

- total dough target from pizza count, dough ball weight, and waste percentage
- hydration and salt, because they affect flour weight
- yeast type: `cy`, `ady`, `idy`
- fermentation preset: `6h-room`, `12h-room`, `24h-room`, `24h-cold`, `48h-cold`
- temperature

Current inputs that do not directly affect production yeast grams:

- actual available time until bake
- selected or recommended Planning Engine fermentation setup
- long-horizon start recommendation
- room/fridge split beyond the single `settings.temperature`
- Planning Engine yeast guidance

Current production formula:

```ts
effectiveHours = presetHours * Math.pow(2, (temperature - 22) / 10)
freshYeastPercent = 0.14335 * (12 / Math.max(effectiveHours, 0.25))
yeastPercent = freshYeastPercent * yeastTypeFactor
```

Current production yeast type factors:

- fresh/compressed yeast (`cy`): `1`
- active dry yeast (`ady`): `0.52`
- instant dry yeast (`idy`): `0.414`

Sourdough starter types (`ssd`, `lsd`) are handled separately as starter mass and should not be mixed into a commercial yeast model without a separate sourdough design.

## Current preset comparison

Representative settings:

- 6 pizzas
- 260 g dough ball
- 3% waste
- 64% hydration
- 2.8% salt
- instant dry yeast
- room presets at 22 °C
- cold presets at 4 °C

| Preset | Temperature | Effective hours in current formula | Fresh yeast equivalent % | IDY % of flour | IDY grams |
|---|---:|---:|---:|---:|---:|
| 6h room | 22 °C | 6.00 h | 0.28670% | 0.11869% | 1.143 g |
| 12h room | 22 °C | 12.00 h | 0.14335% | 0.05935% | 0.571 g |
| 24h room | 22 °C | 24.00 h | 0.07168% | 0.02967% | 0.286 g |
| 24h cold | 4 °C | 6.89 h | 0.24959% | 0.10333% | 0.995 g |
| 48h cold | 4 °C | 13.78 h | 0.12479% | 0.05166% | 0.498 g |

Important audit finding: the current production model changes yeast by preset and temperature, but it does not accept continuous fermentation hours such as 8 h, 10 h, 26.5 h, 40 h, or 68 h. Pizza Session currently derives a preset and temperature, then calls the same canonical calculator.

## Pizza Session behavior

`lib/session-recipe.ts` builds a `RecipeSettings` object and keeps `calculateDoughIngredients()` as the source of ingredient grams.

Current Pizza Session preset selection is broad:

- pizza oven sessions use `12h-room`
- pan sessions use `48h-cold`
- other home oven sessions use `24h-cold`

The Pizza Session planning notes and timeline use Planning Engine output as advisory context. That guidance can compare the current recipe yeast amount against a planning recommendation, but it does not alter the displayed ingredient amount.

## Calculator v1/v2 behavior

The standalone calculators still use the canonical ingredient calculator for gram amounts. Planning controls and planning outputs can show advisory yeast risk, but the production ingredient amount remains based on `RecipeSettings` rather than a continuous fermentation-hour input.

## Existing Planning Engine yeast model

`lib/planning-yeast-model.ts` already provides a planning-only recommendation using fresh yeast equivalent internally.

Current planning conversion factors:

- instant dry yeast equivalent: fresh yeast / 3
- active dry yeast equivalent: fresh yeast * 0.42

Current planning model shape:

- returns percentages, not production grams
- uses broad stepwise windows
- adjusts for room temperature
- lowers confidence for unknown flour or warm fridge
- returns low-confidence placeholder yeast for over-72-hour windows if called directly

This is useful as an advisory model, but it should be tightened before becoming a production gram formula. In particular, future production behavior should not directly scale yeast over horizons beyond 72 h.

## Proposed v1 continuous model

Introduce a new pure helper before changing production ingredient amounts.

Implemented helper shape:

```ts
type ContinuousYeastInput = {
  flourGrams: number;
  fermentationHours: number;
  fermentationMode: "room" | "cold";
  temperatureC: number;
  yeastType: "fresh_yeast" | "instant_dry_yeast" | "active_dry_yeast";
};
```

Suggested result:

```ts
type ContinuousYeastResult = {
  status: "ok" | "too_short" | "long_horizon_required" | "not_enough_information";
  fermentationHoursUsed: number | null;
  freshYeastPercent: number | null;
  selectedYeastPercent: number | null;
  selectedYeastGrams: number | null;
  riskLevel: "low" | "caution" | "high_risk" | "not_enough_information";
  cautions: string[];
  assumptions: string[];
};
```

### Direct scaling range

Direct yeast scaling should apply only from 3 h to 72 h before bake.

- `< 3 h`: return `too_short`; do not pretend this is a normal fermentation window.
- `3 h to 72 h`: calculate direct yeast recommendation.
- `> 72 h`: return `long_horizon_required`; use long-horizon planning and calculate yeast only for the selected/recommended 24 h, 48 h, or 72 h fermentation plan.

This is the key safety rule for future implementation.

## Suggested formula approach

Use fresh yeast equivalent as the internal base, then convert to the selected yeast type.

Use log-linear interpolation between conservative anchor points rather than preset jumps. Exact anchor values should be locked by tests before production integration, but a reasonable v1 design is:

| Direct fermentation window | Fresh yeast equivalent reference |
|---:|---:|
| 3 h | about 0.30% |
| 6 h | about 0.20% |
| 12 h | about 0.10% |
| 24 h | about 0.04% |
| 48 h | about 0.02% |
| 72 h | about 0.0125% |

Expected monotonic behavior:

- shorter time means more yeast
- longer time means less yeast
- 40 h cold fermentation lands between 24 h cold and 48 h cold
- 72 h cold fermentation uses less yeast than 48 h and carries caution

## Temperature handling

Temperature should adjust confidence and recommended yeast cautiously. Do not claim exact fermentation science.

Suggested v1 behavior:

- Room reference: about 22 °C
- Fridge reference: about 4 °C
- Warm room: reduce recommended yeast and add risk/caution for long room exposure
- Cool room: allow slightly more yeast or warn that fermentation may move slowly
- Warm fridge: do not simply treat it as safer because yeast is lower; add caution/high-risk for long cold fermentation
- Very cold fridge: warn that cold fermentation may move slower than expected

Any Q10-style factor should be clamped so the model cannot produce absurd home-scale values.

## Yeast type conversion

Patch 152 found a conversion mismatch:

- current production IDY factor is `0.414` of fresh yeast
- current planning model IDY factor is `1 / 3`
- current production ADY factor is `0.52`
- current planning model ADY factor is `0.42`

Patch 153 decision: the isolated continuous helper uses the current production-compatible commercial yeast factors:

- fresh yeast: `1`
- instant dry yeast: `0.414`
- active dry yeast: `0.52`

Reason: this keeps the helper safe for future side-by-side comparison with current production grams and avoids silently mixing planning-only conversion factors into production-adjacent logic. The existing planning model can be aligned later in a deliberately scoped patch.

## Clamps and warning states

Recommended v1 clamps/warnings:

- below 3 h: no normal yeast recommendation
- above 72 h: no direct yeast calculation from full horizon
- very small home-scale yeast amount: show measurement caution
- very high yeast percent: show over-fermentation caution
- warm room with long room fermentation: caution/high risk
- warm fridge with 24-72 h cold fermentation: caution/high risk
- sourdough: out of scope for this commercial yeast helper unless separately designed

## Long-horizon behavior over 72 h

For bake targets farther than 72 h away, do not calculate yeast for the full horizon.

Example:

- 10 days until bake should not become a 240 h yeast calculation.
- Long-horizon planning should say the user does not need to start today.
- Recommend a closer 24 h, 48 h, or 72 h cold fermentation plan.
- Calculate yeast only for that chosen/recommended fermentation window, capped at 72 h.

## Recommended implementation strategy after Patch 153

Patch 153 has completed the first two steps:

1. Add `lib/continuous-yeast-model.ts` as a pure helper with tests only.
2. Do not replace `calculateDoughIngredients()`.

Recommended next steps:

1. Add a clear adapter from long-horizon recommendations to a chosen 24 h / 48 h / 72 h yeast basis.
2. Compare helper output to existing recipe yeast in planning guidance first.
3. Align or deliberately separate Planning Engine yeast conversion factors from the production-compatible helper.
4. In a later patch, add an explicit production integration path so ingredient amount changes are deliberate and testable.

Avoid silently changing existing saved recipe or Pizza Session ingredient amounts until the continuous model has its own baseline tests.

## Patch 153 test matrix

Minimum test matrix:

- direct 3 h, 6 h, 12 h, 24 h, 40 h, 48 h, and 72 h windows return finite values
- 40 h cold is between 24 h cold and 48 h cold
- 72 h cold is lower than 48 h and includes caution
- `< 3 h` returns `too_short`
- `> 72 h` returns `long_horizon_required`
- 8-10 day bake horizon uses a 24 h / 48 h / 72 h selected plan, not the full horizon
- warm room lowers yeast recommendation or raises risk versus normal room
- cool room raises yeast recommendation or warns about slow fermentation
- warm fridge adds caution for long cold plans
- CY, IDY, and ADY conversions are stable
- clamps prevent zero/negative/absurd grams
- current `calculateDoughIngredients()` baselines remain unchanged because Patch 153 does not import or call the helper from production recipe calculation
- Pizza Session and Calculator v1/v2 behave consistently when given the same selected continuous yeast basis
- sourdough remains conservative or out of scope

## Risks

- Changing `calculateDoughIngredients()` directly would alter user-visible ingredient amounts across saved recipes, calculators, and Pizza Session.
- Current production temperature behavior makes cold presets produce more yeast than an intuitive long cold model might; changing it is a real formula change.
- `RecipeSettings.fermentation` currently stores only fixed presets, not actual fermentation hours.
- Pizza Session currently derives broad presets from oven/setup, not actual bake-target horizon.
- Planning guidance and production grams can disagree until production integration is deliberate.
- Yeast type conversion tables differ between production and planning code.
- Home-scale yeast amounts below about 0.1 g can be hard to measure reliably.

## Files inspected

- `lib/dough-calculator.ts`
- `lib/saved-recipes.ts`
- `lib/session-recipe.ts`
- `lib/planning-engine.ts`
- `lib/planning-yeast-model.ts`
- `lib/planning-yeast-guidance.ts`
- `tests/dough-calculator.test.ts`
- `tests/session-recipe.test.ts`
- `tests/planning-engine.test.ts`
- `docs/calculation-baseline.md`
