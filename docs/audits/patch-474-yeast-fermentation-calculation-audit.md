# Patch 474 - Yeast and Fermentation Calculation Audit

## 1. Executive summary

This audit traced the current DoughTools dough yeast calculation from user/session inputs through ingredient display without changing production behavior.

Main finding: the suspicious Dough Plan value around `0.20 g` dry yeast is real and reproducible. For the controlled Dough Plan scale of about `963 g` flour, `64%` hydration and `2.8%` salt:

| Case | Current Dough Plan model result |
| --- | ---: |
| `23.6 h` room fermentation at `22 C`, active dry yeast | `0.205 g`, displayed `0.20 g` |
| `25 h` cold fermentation at `4 C`, active dry yeast | `0.192 g`, displayed `0.19 g` |
| `24 h` room fermentation at `22 C`, active dry yeast | `0.200 g`, displayed `0.20 g` |
| `24 h` cold fermentation at `4 C`, active dry yeast | `0.200 g`, displayed `0.20 g` |

Temperature is an input to the final yeast calculation in both the canonical calculator and the Dough Plan continuous model. The issue is not disconnected UI state. The root cause is that the Dough Plan continuous yeast helper uses the same `24 h -> 0.04% fresh yeast equivalent` anchor for room and cold fermentation. Mode only changes the temperature adjustment reference and cautions. At the reference temperatures, `24 h room @ 22 C` and `24 h cold @ 4 C` both apply a factor of `1`, so they produce identical yeast percentages.

This is a high-confidence fermentation-model defect for literal cold fermentation. It is not a rounding-only defect, although two-decimal display makes nearby values look more identical.

Recommended next patch: Patch 474A should redesign/calibrate the production Dough Plan yeast model for room, cold and hybrid semantics, add regression tests for `23-24 h room` versus `24-25 h cold`, and clarify yeast-type labels and fermentation assumptions. It should not copy a single external calculator formula.

## 2. Current architecture

### Canonical recipe calculator

Source: `lib/dough-calculator.ts`.

`calculateDoughIngredients(settings)` is the canonical ingredient calculator used by:

- public Quick Calculator through `calculateQuickDough()`
- saved recipe calculations
- baseline recipe URL behavior
- Dough Plan as the initial/base ingredient calculation before the session adapter may replace yeast with continuous yeast output

### Quick Calculator path

Source: `lib/quick-calculator/quick-dough-calculator.ts`.

Path:

`QuickCalculatorInput -> normalizeQuickCalculatorInput -> quickCalculatorInputToRecipeSettings -> calculateDoughIngredients -> QuickCalculatorResult -> UI display`

The Quick Calculator maps:

- `6h`, room -> `6h-room`
- `12h`, room -> `12h-room`
- `24h`, room -> `24h-room`
- `24h`, cold -> `24h-cold`
- `48h`, cold -> `48h-cold`

It passes `fermentationTemperatureCelsius` directly into `RecipeSettings.temperature`.

### Dough Plan session path

Source: `lib/session-recipe.ts` and `app/session/recipe/page.tsx`.

Path:

`PizzaSession -> recipeSettingsFromSession -> calculateDoughIngredients(base settings) -> planningInfoFromSessionRecipe -> buildSessionContinuousYeast -> calculateContinuousYeastRecommendation -> recipeIngredientsWithYeastPercent -> calculateContinuousYeastRecommendation(final flour) -> Dough Plan UI`

Important behavior:

- Session default yeast type is `ady`, rendered as `Dry yeast`.
- Base settings still use `calculateDoughIngredients()`.
- If a valid continuous yeast recommendation exists, Dough Plan replaces base yeast with the continuous helper's `yeastPercentOfFlour`.
- Continuous yeast is not saved as a separate persisted field; it is derived.

## 3. Exact current formulas

### Canonical calculator formula

Source: `lib/dough-calculator.ts`.

```text
presetHours = {
  "6h-room": 6,
  "12h-room": 12,
  "24h-room": 24,
  "24h-cold": 24,
  "48h-cold": 48
}

total = pizzas * ballWeight * (1 + waste / 100)

effectiveHours =
  presetHours[fermentation] * 2 ^ ((temperature - 22) / 10)

freshYeastPercent =
  0.14335 * (12 / max(effectiveHours, 0.25))

commercialFactor = {
  cy: 1,
  ady: 0.52,
  idy: 0.414
}

yeastPercent = freshYeastPercent * commercialFactor[yeastType]

flour =
  total / (1 + hydration / 100 + salt / 100 + yeastPercent / 100)

water = flour * hydration / 100
salt = flour * salt / 100
yeast = flour * yeastPercent / 100
```

Sourdough starter types use a separate starter-mass branch:

- `ssd`: reference starter percent `11`, starter hydration `50%`
- `lsd`: reference starter percent `8.39`, starter hydration `100%`
- starter percent scales by `freshYeastPercent / 0.14335`

### Continuous Dough Plan yeast formula

Source: `lib/continuous-yeast-model.ts`.

```text
direct calculation window = 3 h to 72 h
over 72 h = long_horizon_required

fresh yeast anchors:
3 h  -> 0.3%
6 h  -> 0.2%
12 h -> 0.1%
24 h -> 0.04%
48 h -> 0.02%
72 h -> 0.0125%
```

For non-anchor durations, fresh yeast percent is log-interpolated between anchors.

```text
position =
  (ln(hours) - ln(lower.hours)) /
  (ln(upper.hours) - ln(lower.hours))

freshYeastPercent =
  exp(ln(lower.percent) + position * (ln(upper.percent) - ln(lower.percent)))
```

Temperature adjustment:

```text
room mode:
  reference = 22 C
  if temperature > 22:
    factor = max(0.6, 1 - (temperature - 22) * 0.04)
  else:
    factor = min(1.5, 1 + (22 - temperature) * 0.05)

cold mode:
  reference = 4 C
  if temperature > 4:
    factor = max(0.75, 1 - (temperature - 4) * 0.03)
  else:
    factor = min(1.25, 1 + (4 - temperature) * 0.06)
```

Commercial yeast factors:

```text
fresh_yeast = 1
instant_dry_yeast = 0.414
active_dry_yeast = 0.52
```

Final continuous formula:

```text
freshYeastEquivalentPercent =
  round5(baseFreshYeastPercent * temperatureFactor)

yeastPercentOfFlour =
  round5(freshYeastEquivalentPercent * conversionFactor)

yeastAmountGrams =
  round3(flourGrams * yeastPercentOfFlour / 100)
```

In `buildSessionContinuousYeast`, Dough Plan recalculates the flour amount after the first continuous yeast percentage, then calls the continuous helper again so the final recommendation and final ingredient grams align.

## 4. Constants and mappings

| Constant or mapping | Value | Source |
| --- | --- | --- |
| Canonical fermentation presets | `6h-room`, `12h-room`, `24h-room`, `24h-cold`, `48h-cold` | `lib/dough-calculator.ts` |
| Canonical temperature reference | `22 C` in `effectiveHours` exponent | `lib/dough-calculator.ts` |
| Canonical fresh yeast base | `0.14335%` at `12 h` effective time | `lib/dough-calculator.ts` |
| Canonical dry yeast factors | `ady 0.52`, `idy 0.414` | `lib/dough-calculator.ts` |
| Session default yeast type | `ady` | `lib/yeast-types.ts` |
| Session label for `ady` | `Dry yeast` | `lib/yeast-types.ts` |
| Quick Calculator default yeast type | `idy` | `lib/quick-calculator/quick-dough-calculator.ts` |
| Quick Calculator default fermentation | `24h cold`, `4 C` | `lib/quick-calculator/quick-dough-calculator.ts` |
| Continuous yeast direct window | `3 h` to `72 h` | `lib/continuous-yeast-model.ts` |
| Continuous cold temperature reference | `4 C` | `lib/continuous-yeast-model.ts` |
| Continuous room temperature reference | `22 C` | `lib/continuous-yeast-model.ts` |
| Dough Plan cold selected hours guard | valid only `24 h` to `72 h` and not greater than available window | `lib/session-recipe.ts` |
| Dough Plan cold temperature guard | valid `2 C` to `8 C`, fallback `4 C` | `lib/session-recipe.ts` |
| Dough Plan room temperature guard | valid `18 C` to `26 C`, fallback `22 C` | `lib/session-recipe.ts` |
| Display rounding in Dough Plan | `<10 g` uses `toFixed(2)` | `app/session/recipe/page.tsx` |

## 5. Input-to-output calculation trace

### Dough Plan trace

1. User creates or opens a Pizza Session.
2. `recipeSettingsFromSession()` creates `RecipeSettings`:
   - pizza count from session
   - ball weight from session/default
   - waste `3%`
   - hydration default `64%` unless overridden
   - salt `2.8%`
   - yeast type normalized from session, default `ady`
   - base fermentation preset from oven/style: gas uses `12h-room`, home uses `24h-cold`, pan uses `48h-cold`
   - temperature override validated by base mode
3. `calculateDoughIngredients(settings)` builds base ingredients.
4. `planningInfoFromSessionRecipe()` calls planning engine with available time and selected fermentation mode.
5. `buildSessionContinuousYeast()`:
   - resolves start time from `doughStartMode`
   - computes `availableFermentationHours`
   - reads planning recommended mode
   - maps only exact `room` to room; every other recommendation becomes cold
   - uses selected planned cold hours only when valid
   - validates temperature for the final selected mode
6. `calculateContinuousYeastRecommendation()` returns `yeastPercentOfFlour`.
7. `recipeIngredientsWithYeastPercent()` recalculates flour and ingredient grams using that percentage.
8. `calculateContinuousYeastRecommendation()` runs a second time with final flour for aligned reporting.
9. Dough Plan renders `result.ingredients.leavener` through `formatGram()`.

### Quick Calculator trace

1. User edits Quick Calculator fields.
2. `normalizeQuickCalculatorInput()` clamps input values.
3. `quickCalculatorInputToRecipeSettings()` maps duration/environment to one canonical fermentation preset.
4. `calculateDoughIngredients()` calculates ingredient grams.
5. UI renders `result.ingredients.leavener`.

## 6. Controlled test matrix

Controlled base:

- `6` dough balls
- `260 g` per ball
- `3%` waste
- total dough `1606.8 g`
- hydration `64%`
- salt `2.8%`
- session yeast type `ady` / `Dry yeast`
- final flour around `963 g`

These values match the suspicious flour/salt scale.

The matrix below uses the Dough Plan continuous helper because that is the source of the observed `0.20 g Dry yeast` value.

| Scenario | Fermentation | Temperature | Mode | Fresh yeast % | ADY % of flour | Flour g | Yeast g unrounded | Display |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| A | `8 h` | `22 C` | room | `0.15000%` | `0.07800%` | `962.859` | `0.751` | `0.75 g` |
| B | `12 h` | `22 C` | room | `0.10000%` | `0.05200%` | `963.009` | `0.501` | `0.50 g` |
| C | `23 h` | `22 C` | room | `0.04231%` | `0.02200%` | `963.182` | `0.212` | `0.21 g` |
| C2 | `23.6 h` | `22 C` | room | `0.04090%` | `0.02127%` | `963.187` | `0.205` | `0.20 g` |
| D | `24 h` | `22 C` | room | `0.04000%` | `0.02080%` | `963.189` | `0.200` | `0.20 g` |
| E | `24 h` | `4 C` | cold | `0.04000%` | `0.02080%` | `963.189` | `0.200` | `0.20 g` |
| F | `25 h` | `4 C` | cold | `0.03840%` | `0.01997%` | `963.194` | `0.192` | `0.19 g` |
| G | `48 h` | `4 C` | cold | `0.02000%` | `0.01040%` | `963.249` | `0.100` | `0.10 g` |
| H | `72 h` | `4 C` | cold | `0.01250%` | `0.00650%` | `963.272` | `0.063` | `0.06 g` |

## 7. 23 h at 22 C result

For `23 h` room fermentation at `22 C`:

```text
baseFreshYeastPercent = log interpolation between:
  12 h -> 0.1%
  24 h -> 0.04%

baseFreshYeastPercent = 0.04231%
room temperature factor at 22 C = 1
freshYeastEquivalentPercent = 0.04231%
activeDryYeastFactor = 0.52
yeastPercentOfFlour = 0.02200%
flour = 963.182 g
yeast = 963.182 * 0.02200 / 100 = 0.212 g
display = 0.21 g
```

For the observed `23.6 h` room case:

```text
freshYeastEquivalentPercent = 0.04090%
yeastPercentOfFlour = 0.02127%
flour = 963.187 g
yeast = 0.205 g
display = 0.20 g
```

## 8. 25 h at 4 C result

For `25 h` cold fermentation at `4 C`:

```text
baseFreshYeastPercent = log interpolation between:
  24 h -> 0.04%
  48 h -> 0.02%

baseFreshYeastPercent = 0.03840%
cold temperature factor at 4 C = 1
freshYeastEquivalentPercent = 0.03840%
activeDryYeastFactor = 0.52
yeastPercentOfFlour = 0.01997%
flour = 963.194 g
yeast = 963.194 * 0.01997 / 100 = 0.192 g
display = 0.19 g
```

This is almost the same displayed amount as `23.6 h` room because both sit close to the `24 h -> 0.04% fresh yeast` anchor.

## 9. Temperature sensitivity results

### Dough Plan continuous model

For `24 h`, about `963 g` flour, ADY:

| Temperature | Mode used in test | Factor model | ADY % | Yeast g | Display | Notes |
| ---: | --- | --- | ---: | ---: | ---: | --- |
| `4 C` | cold | cold ref factor `1.00` | `0.02080%` | `0.200` | `0.20 g` | no caution |
| `8 C` | cold | cold factor `0.88` | `0.01830%` | `0.176` | `0.18 g` | warm fridge caution |
| `12 C` | cold | cold factor `0.76` | `0.01581%` | `0.152` | `0.15 g` | warm fridge caution |
| `18 C` | room | room factor `1.20` | `0.02496%` | `0.240` | `0.24 g` | cool room caution |
| `22 C` | room | room ref factor `1.00` | `0.02080%` | `0.200` | `0.20 g` | long room caution |
| `25 C` | room | room factor `0.88` | `0.01830%` | `0.176` | `0.18 g` | warm room caution |

Temperature affects the model. However, the model is calibrated separately around `22 C` for room and `4 C` for cold, and both references use the same base anchor.

### Canonical calculator model

For `24h-cold`, about `963 g` flour, ADY:

| Temperature | Effective hours | Fresh yeast % | ADY % | Yeast g | Display |
| ---: | ---: | ---: | ---: | ---: | ---: |
| `4 C` | `6.892` | `0.24959%` | `0.12979%` | `1.249` | `1.25 g` |
| `8 C` | `9.094` | `0.18915%` | `0.09836%` | `0.947` | `0.95 g` |
| `12 C` | `12.000` | `0.14335%` | `0.07454%` | `0.718` | `0.72 g` |
| `18 C` | `18.189` | `0.09458%` | `0.04918%` | `0.474` | `0.47 g` |
| `22 C` | `24.000` | `0.07168%` | `0.03727%` | `0.359` | `0.36 g` |
| `25 C` | `29.547` | `0.05822%` | `0.03027%` | `0.292` | `0.29 g` |

The canonical calculator responds strongly to temperature. The Dough Plan continuous replacement responds less strongly and has the mode-anchor problem described above.

## 10. Duration sensitivity results

### Room at `22 C`, continuous ADY model

| Duration | Fresh yeast % | ADY % | Yeast g | Display |
| ---: | ---: | ---: | ---: | ---: |
| `3 h` | `0.30000%` | `0.15600%` | `1.501` | `1.50 g` |
| `6 h` | `0.20000%` | `0.10400%` | `1.001` | `1.00 g` |
| `8 h` | `0.15000%` | `0.07800%` | `0.751` | `0.75 g` |
| `12 h` | `0.10000%` | `0.05200%` | `0.501` | `0.50 g` |
| `18 h` | `0.05851%` | `0.03043%` | `0.293` | `0.29 g` |
| `23 h` | `0.04231%` | `0.02200%` | `0.212` | `0.21 g` |
| `23.6 h` | `0.04090%` | `0.02127%` | `0.205` | `0.20 g` |
| `24 h` | `0.04000%` | `0.02080%` | `0.200` | `0.20 g` |

The duration curve is monotonic and smooth. Two-decimal display creates visible flatness near 24 hours.

### Cold at `4 C`, continuous ADY model

| Duration | Fresh yeast % | ADY % | Yeast g | Display |
| ---: | ---: | ---: | ---: | ---: |
| `24 h` | `0.04000%` | `0.02080%` | `0.200` | `0.20 g` |
| `25 h` | `0.03840%` | `0.01997%` | `0.192` | `0.19 g` |
| `36 h` | `0.02667%` | `0.01387%` | `0.134` | `0.13 g` |
| `48 h` | `0.02000%` | `0.01040%` | `0.100` | `0.10 g` |
| `72 h` | `0.01250%` | `0.00650%` | `0.063` | `0.06 g` |

The duration curve is monotonic, but the cold baseline appears unrealistically low if interpreted as literal refrigerator-only fermentation.

## 11. Yeast-type handling

Current supported commercial yeast types:

| Code | UI label/context | Current factor from fresh yeast |
| --- | --- | ---: |
| `cy` | Fresh yeast | `1.000` |
| `ady` | Session: `Dry yeast` | `0.520` |
| `idy` | Quick Calculator: `Instant dry yeast` | `0.414` |

Sourdough starter types:

| Code | Label/context | Handling |
| --- | --- | --- |
| `ssd` | Stiff sourdough starter | starter mass, 50% hydration |
| `lsd` | Liquid sourdough starter | starter mass, 100% hydration |

External conversion references vary:

- King Arthur Professional references fresh-to-active-dry conversion around fresh multiplied by `0.4`.
- Lesaffre states instant dry yeast dosage is commonly three to four times lower than pressed/fresh yeast.
- King Arthur consumer guidance also sometimes treats instant and active dry as interchangeable 1:1 by weight in home recipes, which shows that home-baking substitution guidance and formula engineering are not identical.

The current `ady 0.52` and `idy 0.414` factors are not the root cause of the suspicious cold value. Lowering ADY toward `0.4` would make the observed `0.20 g` lower, not higher. Still, the `Dry yeast` label should be clarified because the code means active dry yeast, while Quick Calculator separately exposes instant dry yeast.

## 12. External validation

External sources were used for comparison only. No single external calculator should be treated as the correct DoughTools formula.

### Technical/fermentation principle

- The Perfect Loaf's dough temperature guidance emphasizes that warmer dough ferments faster and colder dough ferments more slowly; temperature variation materially changes fermentation timing and risk.
- Lesaffre explains yeast format differences: active dry yeast requires rehydration for optimal performance, instant yeast does not, and instant dry yeast is dosed materially lower than pressed/fresh yeast.
- Scientific yeast literature broadly supports strong temperature dependence for `Saccharomyces cerevisiae`, though exact dough performance depends on dough composition, strain, salt, hydration, handling and desired endpoint.

### Pizza-making practice comparison

Weekend Bakery's 24h pizza dough table gives instant dry yeast percentages by temperature and time. It lists much higher yeast percentages for refrigerator temperatures than for room temperatures, for example `4 C / 24 h = 0.640% IDY` and `22 C / 24 h = 0.018% IDY`.

That table is not ground truth for DoughTools, but it illustrates the key issue: common pizza-practice tables usually treat `24 h at 4 C` as needing materially more yeast than `24 h at 22 C`, unless the process includes meaningful warm time or other unmodeled assumptions.

## 13. Analysis of the `0.20 g` result

For about `963 g` flour:

```text
0.20 g active dry yeast / 963 g flour = 0.0208% ADY
```

If converted using current DoughTools factors:

```text
fresh equivalent = 0.0208% / 0.52 = 0.04%
instant dry equivalent = 0.04% * 0.414 = 0.01656%
instant dry grams = 963 * 0.01656 / 100 = 0.159 g
```

Assessment:

- For `23.6 h at 22 C`, this is defensible under a low-yeast, long room-fermentation pizza assumption. It is close to some pizza-practice room-temperature tables after yeast-type conversion.
- For `25 h at 4 C`, this is not well supported if the process literally means refrigerator-only fermentation at `4 C` with no warm start, no cooling transition and no final room proof. External practice references and the basic temperature principle suggest cold fermentation should require a different baseline than room fermentation.
- The current implementation does not encode warm start, cooling lag or final proof phases. Therefore those assumptions cannot be used to defend the value unless they are explicitly designed into a later model.

## 14. Identified defects and risks

| Finding | Classification | Severity | Confidence | Evidence |
| --- | --- | --- | --- | --- |
| Continuous Dough Plan model gives identical base yeast for `24 h room @ 22 C` and `24 h cold @ 4 C` | Fermentation-model defect | High | High | Same `24 h -> 0.04%` anchor, factor `1` at both references |
| Cold temperature is only a within-cold adjustment, not a cold-vs-room baseline | Temperature-model defect | High | High | `getTemperatureAdjustment()` uses separate references but same base anchors |
| `25 h cold @ 4 C` is almost equal to `23.6 h room @ 22 C` | Fermentation-model defect | High | High | Local matrix: `0.192 g` vs `0.205 g` ADY |
| Dough Plan can switch from room to cold recommendation at the 24 h boundary | Documentation/terminology risk | Medium | High | Planning setup recommends room under 24 h and cold from 24 h when fridge is normal |
| Dough Plan label `Dry yeast` hides that the code uses active dry yeast | Documentation/terminology defect | Medium | High | `DEFAULT_SESSION_YEAST_TYPE = "ady"` and label is `Dry yeast` |
| Display rounding can make close values look identical | UI/display/rounding defect | Low | High | `0.205 g` displays `0.20 g`; `0.200 g` displays `0.20 g` |
| Canonical Quick Calculator and session Dough Plan can use materially different yeast models | Documentation/architecture risk | Medium | High | Quick uses `calculateDoughIngredients`; Dough Plan may replace with continuous helper |
| Temperature state is not disconnected | No defect / expected behavior | n/a | High | Temperature is passed into both `calculateDoughIngredients` and `calculateContinuousYeastRecommendation` |
| Yeast conversion factors differ from some external references | Yeast conversion risk | Low | Medium | Current factors are documented as production-compatible; external guidance varies |

## 15. Root-cause assessment

Primary root cause:

```text
The continuous Dough Plan yeast model has one shared time-to-fresh-yeast anchor curve for both room and cold fermentation.
```

Mode-specific temperature factors are applied after that shared anchor curve. At the reference temperatures:

```text
24 h room @ 22 C:
  base fresh yeast = 0.04%
  room temperature factor = 1
  final fresh equivalent = 0.04%

24 h cold @ 4 C:
  base fresh yeast = 0.04%
  cold temperature factor = 1
  final fresh equivalent = 0.04%
```

So the same flour amount and yeast type produce the same yeast amount.

Secondary root causes:

- The model does not define whether cold fermentation includes room-temperature start, cooling transition, final warm-up, or literal full-time refrigerator storage.
- Session wording can imply a literal `25 h cold fermentation at 4 C`, while the formula behaves as if cold and room share the same time baseline.
- The active dry yeast label is too generic.

## 16. Recommended correction strategy

Patch 474A should be an implementation patch with formula governance, not a quick constant tweak.

Recommended scope:

1. Define product semantics for:
   - room fermentation
   - cold fermentation
   - hybrid fermentation if supported
   - room start/cooling transition/final proof, if any
2. Decide whether Dough Plan and Quick Calculator should use:
   - one shared production yeast model, or
   - explicitly separate models with UI disclosure
3. Recalibrate cold fermentation anchors separately from room anchors.
4. Add regression fixtures for:
   - `23.6 h room @ 22 C`
   - `24 h room @ 22 C`
   - `24 h cold @ 4 C`
   - `25 h cold @ 4 C`
   - `48 h cold @ 4 C`
   - temperature sensitivity within room and cold ranges
5. Clarify `Dry yeast` as `Active dry yeast` where the code uses `ady`.
6. Decide whether sub-gram yeast display should include practical measurement guidance without changing calculations.
7. Keep existing saved/session contracts intact unless explicitly approved.

### Mandatory continuous-time requirement

Patch 474A must not convert fermentation duration into a new preset system or fixed-increment calculation grid.

Any specific duration used in this audit or in a later specification, for example `27 h 15 min`, is only a representative test example. It is not:

- a preset
- an allowed increment
- an interval
- an anchor
- a rounding target
- a product rule

The future canonical yeast engine must accept any valid fermentation duration at one-minute resolution throughout its supported range. Examples such as `23 h 01 min`, `23 h 47 min`, `24 h 00 min`, `24 h 01 min`, `27 h 13 min`, `37 h 52 min`, `51 h 06 min` and `71 h 59 min` must be independently calculable.

Calibration tables may contain selected representative times, but those points must not define the only calculable times. The implementation specification must define a continuous mathematical function or interpolation method that produces deterministic yeast requirements for every valid minute. Do not introduce `15` minute, `30` minute, hourly or other fixed calculation increments.

Avoid:

- copying Weekend Bakery, PizzApp or any single calculator formula
- silently changing Quick Calculator and Dough Plan differently
- adding unmodeled warm/cold phases only in copy

## 17. Proposed later implementation patch

Suggested patch:

```text
Patch 474A - Correct Dough Plan yeast fermentation model
```

Acceptance criteria should include:

- A documented fermentation semantics decision.
- A unified or explicitly separated yeast model decision.
- Cold fermentation no longer shares the same 24h base yeast anchor as room fermentation unless deliberately justified.
- Existing formula changes are covered by focused before/after fixtures.
- The `23.6 h room @ 22 C` and `25 h cold @ 4 C` cases are no longer accidentally equivalent unless an approved model explicitly explains why.
- Active dry, instant dry and fresh yeast conversion behavior is documented and tested.
- No Pizza Plan/session persistence, API, database or migration behavior changes unless explicitly scoped.

## Files inspected

- `AGENTS.md`
- `lib/dough-calculator.ts`
- `lib/continuous-yeast-model.ts`
- `lib/planning-yeast-model.ts`
- `lib/planning-fermentation-setup.ts`
- `lib/planning-input.ts`
- `lib/session-recipe.ts`
- `lib/session-fermentation-display.ts`
- `lib/yeast-types.ts`
- `lib/saved-recipes.ts`
- `lib/quick-calculator/quick-dough-calculator.ts`
- `components/quick-calculator/QuickDoughCalculator.tsx`
- `app/session/recipe/page.tsx`
- `app/calculator/quick/page.tsx`
- `tests/dough-calculator.test.ts`
- `tests/continuous-yeast-model.test.ts`
- `tests/session-recipe.test.ts`
- `tests/quick-calculator.test.ts`
- `docs/continuous-yeast-model-v1.md`
- `docs/calculation-baseline.md`
- `docs/audits/patch-469a-guidance-level-calculator-simplification.md`
- `docs/audits/patch-469b-quick-calculator-final-ux-audit.md`
- `docs/audits/patch-469c-quick-calculator-release-verification.md`

## Validation performed

- Temporary audit-only Vitest matrix using current production functions.
- Focused tests:
  - `npm test -- tests/patch-474-audit-matrix.test.ts`
  - `npm test -- --reporter=verbose tests/patch-474-audit-matrix.test.ts`
- Temporary audit test was removed before committing.
- Final validation for committed audit:
  - `git diff --check`

