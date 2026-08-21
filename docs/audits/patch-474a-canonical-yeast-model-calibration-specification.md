# Patch 474A - Canonical Yeast Model Calibration and Specification

## 1. Executive conclusion

GO.

Patch 474B can implement a defensible V1 canonical yeast model without inventing mathematical behavior during implementation.

The recommended canonical model is:

- one internal fresh/compressed yeast equivalent
- continuous duration in minutes, not presets or fixed increments
- Q10 temperature-rate adjustment
- a room fermentation process for `3:00` through `24:00`
- a documented cold-retard process for `>24:00` through `72:00`
- final conversion from fresh equivalent to fresh, instant dry yeast and active dry yeast

The model deliberately does not preserve the current formulas. Patch 474 found that the current Dough Plan continuous helper gives almost identical yeast for `~24 h room at 22 C` and `~24-25 h cold at 4 C`. The replacement model fixes that root issue by making cold fermentation a different documented physical process instead of reusing the room curve with a different reference temperature.

Key product decision:

```text
0:00-24:00    -> room fermentation recommendation
>24:00-72:00  -> cold fermentation recommendation
```

This boundary is a product recommendation and process switch. It is not a biological discontinuity, preset, anchor, increment or rounding rule.

## 2. Evidence and source registry

| ID | Source | Evidence class | Claim/data used | Specification use |
| --- | --- | --- | --- | --- |
| AVPN-1 | AVPN International Regulations, `https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana` | normative | For 1 L water: `0.1-3 g` fresh beer yeast, dry yeast `1/3` fresh, flour `1600-1800 g`, yeast varies with temperature/humidity | Official Neapolitan yeast range and dry/fresh ratio |
| AVPN-2 | AVPN, "Yeast in the Pizzeria", `https://www.pizzanapoletana.org/en/371-yeast_in_the_pizzeria` | normative/professional | Brewer's yeast dough at room temperature generally matures within `8-24 h`; fresh and dry brewer's yeast are permitted; dry/fresh ratio `1:3` | Room model primary domain and conversion support |
| KA-1 | King Arthur Professional yeast reference, `https://www.kingarthurbaking.com/pro/reference/yeast` | manufacturer/professional | Fresh to active dry multiplier `0.4`; fresh to instant dry multiplier `0.33` | Canonical IDY and ADY conversion factors |
| KA-2 | King Arthur Baking, active dry vs instant, `https://www.kingarthurbaking.com/blog/2022/08/15/active-dry-versus-instant-yeast` | professional practice | Active dry and instant are often interchangeable in home recipes by weight, but instant hydrates/acts differently | UI/conversion uncertainty note; does not override pro conversion |
| AIB-1 | AIB International, "How do yeast, salt, and sugar impact...", `https://blog.aibinternational.com/en/food-first-blog/postid/192/tip-of-the-week-how-do-yeast-salt-and-sugar-impact-finished-bread-and-roll-products` | technical/professional | Salt regulates yeast action through osmotic pressure; yeast creates CO2 and fermentation byproducts | Salt has real effect, but no V1 coefficient |
| BM-1 | BakersMath fermentation calculator methodology, `https://bakersmath.co/fermentation-calculator` | comparison/professional methodology | Q10 model, rate roughly doubles per `10 C`; cold retard `4-6 C` runs much slower than `22 C`; visual cues beat the clock | Temperature-rate method comparison and sanity check |
| WB-1 | Weekend Bakery 24h pizza dough article/table, `https://www.weekendbakery.com/posts/a-pizza-adventure-part-ii-new-24h-dough-recipe/` | professional pizza practice/comparison | 24h fridge-retarded pizza method includes fridge time and a room warm-up; yeast table varies strongly by time and temperature | Cold-process sanity check and room 24h IDY cross-check |
| THP-1 | The Perfect Loaf, dough temperature guidance, `https://www.theperfectloaf.com/the-importance-of-dough-temperature-in-baking/` | professional practice | Dough temperature materially changes fermentation rate | Supports temperature as required input |
| P474 | Patch 474 audit, `docs/audits/patch-474-yeast-fermentation-calculation-audit.md` | internal audit | Current root cause and controlled suspicious values | Baseline comparison and regression targets |

Source hierarchy assessment:

- AVPN is sufficient for official Neapolitan room-fermentation boundaries and broad yeast range.
- AVPN does not provide a complete continuous formula.
- Scientific/professional Q10 temperature-rate modeling is sufficient for deterministic V1 interpolation.
- Cold fermentation beyond 24h is outside the strict AVPN room-temperature range, so the cold model is a DoughTools engineering model informed by professional practice, not an AVPN claim.
- External calculators/tables are used only as calibration checks.

## 3. Room model

### Domain

```text
process: room
duration: 3:00 through 24:00
default temperature: 22 C
calibrated temperature range: 18-26 C
```

Room fermentation is interpreted as dough held at the specified room/dough-environment temperature from mix to bake.

### Calibration points

The room model uses two V1 calibration points at `22 C`, expressed as fresh yeast percentage of flour:

| Duration | Fresh yeast % | Provenance |
| ---: | ---: | --- |
| `8 h` | `0.180%` | AVPN-compatible short traditional room fermentation; near the upper official AVPN fresh-yeast range for `1600-1800 g` flour |
| `24 h` | `0.054%` | AVPN-compatible long room fermentation; aligns with professional pizza-practice tables around `22 C` after IDY-to-fresh conversion |

The `24 h` point is intentionally higher than the current DoughTools `0.04% fresh` anchor. It keeps the room model inside AVPN's official range while avoiding the overly low shared cold/room anchor.

These are DoughTools V1 calibration decisions derived from the evidence above. They are not presented as official AVPN point values, because AVPN provides a permitted yeast range and process domain rather than a continuous calculator formula.

### Equation

Internal fresh yeast percentage is a power-law function of effective fermentation exposure:

```text
roomFreshAt8 = 0.180
roomFreshAt24 = 0.054
roomReferenceTemperatureC = 22
q10 = 2

durationHours = fermentationMinutes / 60

durationExponent =
  ln(roomFreshAt8 / roomFreshAt24) / ln(24 / 8)
  = 1.0959032742893846

roomCoefficient =
  roomFreshAt8 * 8 ^ durationExponent
  = 1.7578093848840328

temperatureRate =
  q10 ^ ((fermentationTemperatureC - roomReferenceTemperatureC) / 10)

effectiveExposureHours =
  durationHours * temperatureRate

freshYeastPercent =
  roomCoefficient * effectiveExposureHours ^ (-durationExponent)
```

Expected direction:

- longer duration -> less yeast
- warmer temperature -> less yeast for the same duration
- colder temperature -> more yeast for the same duration

This is continuous for arbitrary minutes and decimal temperatures inside the supported range.

## 4. Cold model and process semantics

### Domain

```text
process: cold
duration: >24:00 through 72:00
default cold temperature: 4 C
validated cold temperature range: 3-6 C
allowed Pizza Nerd engineering range: 2-8 C with caution outside 3-6 C
```

### DoughTools cold fermentation definition

DoughTools V1 cold fermentation means:

```text
mix
-> 1 h room start at 22 C
-> refrigerated cold hold at selected cold temperature
-> 1 h final room warm-up/proof at 22 C
-> bake
```

The total fermentation duration includes all phases. Normal users do not configure the phases.

For example, `25 h cold @ 4 C` means:

```text
1 h room start
23 h cold hold at 4 C
1 h final room warm-up
```

These phases are documented product assumptions, not hidden behavior.

Rationale:

- Common cold-retarded pizza practice includes some room handling before or after refrigeration.
- The current product needs one practical result, not a full thermal simulation.
- Literal `mix -> refrigerator -> bake` at `4 C` is not a good default model for normal users because real dough does not instantly become `4 C`, and most pizza dough benefits from some room handling before bake.

### Equation

The cold process reuses the same fresh-yeast exposure curve as the room model, but its exposure is the sum of documented phase contributions:

```text
warmStartHours = 1
finalWarmHours = 1
coldHoldHours = durationHours - warmStartHours - finalWarmHours

roomRate = q10 ^ ((22 - 22) / 10) = 1
coldRate = q10 ^ ((fermentationTemperatureC - 22) / 10)

effectiveExposureHours =
  warmStartHours * roomRate
  + coldHoldHours * coldRate
  + finalWarmHours * roomRate

freshYeastPercent =
  roomCoefficient * effectiveExposureHours ^ (-durationExponent)
```

For any cold duration just above 24h, `coldHoldHours` remains positive. At `24 h 01 min`, the cold hold is about `22 h 01 min`.

Expected direction:

- longer total cold process -> less yeast
- colder fridge -> more yeast
- warmer fridge -> less yeast, with caution if outside validated range

## 5. Temperature and duration equations

Canonical rate function:

```text
rateAtTemperature(T) = q10 ^ ((T - 22) / 10)
q10 = 2
```

Why Q10:

- It is a standard biological-rate approximation.
- It creates a continuous deterministic function for arbitrary temperatures.
- It matches the expected direction of fermentation temperature effects.
- It avoids inventing arbitrary rules such as `+1 C = -3% yeast`.

The V1 model uses the same Q10 value for room and cold. This is an engineering simplification. The report explicitly classifies very cold behavior as lower confidence because real dough cooling curves, yeast strain behavior and refrigerator cycling are not fully modeled.

## 6. Hydration and salt decisions

| Input | V1 classification | Decision | Reason |
| --- | --- | --- | --- |
| `hydrationPercent` | B - retained as dough input but no V1 yeast correction | Do not quantitatively modify yeast in V1 | Hydration affects dough behavior and fermentation environment, but the reviewed evidence does not support a reliable coefficient for the normal pizza range without overfitting. |
| `saltPercent` | B - retained as dough input but no V1 yeast correction | Do not quantitatively modify yeast in V1 | AIB and baking literature support that salt regulates/inhibits yeast activity, but no source in this review gives a safe V1 correction coefficient across pizza salt ranges. |

Patch 474B should pass these inputs through the model interface for future compatibility, but V1 must not use invented hydration or salt multipliers.

## 7. Fresh, IDY and ADY conversions

Canonical internal representation:

```text
fresh/compressed yeast equivalent percentage of flour
```

Conversions:

```text
fresh/compressed yeast factor = 1.0
instant dry yeast factor = 1 / 3 = 0.3333333333
active dry yeast factor = 0.4
```

Conversion order:

```text
freshYeastPercent = model result
yeastPercentOfFlour = freshYeastPercent * yeastTypeFactor
yeastGrams = flourGrams * yeastPercentOfFlour / 100
```

Rationale:

- AVPN specifies dry yeast at `1/3` of fresh yeast for the official Neapolitan context.
- King Arthur Professional distinguishes fresh-to-active-dry at `0.4` and fresh-to-instant at `0.33`.
- Active dry and instant dry should not share an ambiguous public label.

UI terminology recommendation for Patch 474B or a UI follow-up:

- Replace ambiguous `Dry yeast` with `Active dry yeast` where the underlying type is `ady`.
- Keep `Instant dry yeast` distinct.
- Keep `Fresh yeast` distinct.

## 8. Continuous-time specification

The engine must accept `fermentationMinutes` as an integer minute count.

Required domain:

```text
room: 180 through 1440 minutes
cold: 1441 through 4320 minutes
```

The model must not round duration before calculation except for final display.

Examples that must be independently calculable:

| Input | Process | Temperature | Fresh yeast % | IDY g at 963g flour | ADY g at 963g flour |
| --- | --- | ---: | ---: | ---: | ---: |
| `23 h 47 min` | room | `21.4 C` | `0.05708%` | `0.183 g` | `0.220 g` |
| `24 h 01 min` | cold | `4.0 C` | `0.17237%` | `0.553 g` | `0.664 g` |
| `37 h 52 min` | cold | `4.3 C` | `0.11021%` | `0.354 g` | `0.425 g` |
| `71 h 59 min` | cold | `5.1 C` | `0.05478%` | `0.176 g` | `0.211 g` |

Any duration examples in this document are validation points only. They are not presets, anchors, increments or allowed-time rules.

## 9. Calibration matrices

All percentages below are baker's percentages of flour.

### Room matrix - fresh yeast %

| Duration | 18 C | 20 C | 22 C | 24 C | 26 C |
| ---: | ---: | ---: | ---: | ---: | ---: |
| `3 h` | `0.71458` | `0.61387` | `0.52734` | `0.45302` | `0.38916` |
| `6 h` | `0.33431` | `0.28719` | `0.24671` | `0.21194` | `0.18207` |
| `8 h` | `0.24391` | `0.20953` | `0.18000` | `0.15463` | `0.13284` |
| `12 h` | `0.15641` | `0.13436` | `0.11542` | `0.09915` | `0.08518` |
| `18 h` | `0.10029` | `0.08616` | `0.07401` | `0.06358` | `0.05462` |
| `23 h` | `0.07667` | `0.06586` | `0.05658` | `0.04860` | `0.04175` |
| `24 h` | `0.07317` | `0.06286` | `0.05400` | `0.04639` | `0.03985` |

### Cold matrix - fresh yeast %

Cold process includes `1 h` room start, cold hold, and `1 h` final warm-up.

| Duration | 3 C | 4 C | 5 C | 6 C |
| ---: | ---: | ---: | ---: | ---: |
| `24 h 01 min` | `0.18252` | `0.17237` | `0.16262` | `0.15329` |
| `25 h` | `0.17607` | `0.16618` | `0.15669` | `0.14762` |
| `36 h` | `0.12559` | `0.11796` | `0.11072` | `0.10384` |
| `48 h` | `0.09506` | `0.08902` | `0.08331` | `0.07792` |
| `60 h` | `0.07614` | `0.07117` | `0.06648` | `0.06208` |
| `72 h` | `0.06332` | `0.05910` | `0.05514` | `0.05143` |

## 10. Approximate 963 g DoughTools reference calculations

Reference composition:

- flour `963 g`
- hydration `64%`
- salt `2.8%`

| Duration | Process | Temp | Fresh % | Fresh g | IDY g | ADY g |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| `8 h` | room | `22 C` | `0.18000%` | `1.733` | `0.578` | `0.693` |
| `12 h` | room | `22 C` | `0.11542%` | `1.112` | `0.371` | `0.445` |
| `18 h` | room | `22 C` | `0.07401%` | `0.713` | `0.238` | `0.285` |
| `23 h` | room | `22 C` | `0.05658%` | `0.545` | `0.182` | `0.218` |
| `24 h` | room | `22 C` | `0.05400%` | `0.520` | `0.173` | `0.208` |
| `25 h` | cold | `4 C` | `0.16618%` | `1.600` | `0.533` | `0.640` |
| `37 h 52 min` | cold | `4 C` | `0.11234%` | `1.082` | `0.361` | `0.433` |
| `36 h` | cold | `4 C` | `0.11796%` | `1.136` | `0.379` | `0.454` |
| `48 h` | cold | `4 C` | `0.08902%` | `0.857` | `0.286` | `0.343` |
| `60 h` | cold | `4 C` | `0.07117%` | `0.685` | `0.228` | `0.274` |
| `72 h` | cold | `4 C` | `0.05910%` | `0.569` | `0.190` | `0.228` |

These are mathematical outputs, not practical scale guidance. Sub-gram quantities can be legitimate. The UI may need measurement guidance, but the engine must not inflate yeast merely because a kitchen scale lacks `0.01 g` resolution.

## 11. 24-hour transition analysis

| Test point | Recommended process | Assumed temperature | Fresh % | ADY g at 963g | Reason |
| --- | --- | ---: | ---: | ---: | --- |
| `23:45` | room | `22 C` | `0.05462%` | `0.210 g` | Still inside room recommendation |
| `24:00` | room | `22 C` | `0.05400%` | `0.208 g` | Last room-recommended minute |
| `24:01` | cold | `4 C` | `0.17237%` | `0.664 g` | Product switches to cold-retard process with warm start + cold hold + final warm-up |
| `24:15` | cold | `4 C` | `0.17086%` | `0.658 g` | Same cold process, slightly more cold time |
| `25:00` | cold | `4 C` | `0.16618%` | `0.640 g` | Longer cold process requires slightly less yeast |

The jump at `24:01` is intentional in this V1 specification because the recommended physical process changes. It is not an accidental formula discontinuity from reusing the same anchor. The UI should explain the recommendation boundary as a process change, not imply that one extra minute biologically transforms the dough.

## 12. Comparison against Patch 474 current values

| Case | Patch 474 current ADY | Proposed V1 ADY | Difference |
| --- | ---: | ---: | --- |
| `23.6 h @ 22 C room` | `0.205 g` | about `0.211 g` | materially similar; current room behavior was not the main defect |
| `24 h @ 22 C room` | `0.200 g` | `0.208 g` | materially similar |
| `24 h @ 4 C cold` | `0.200 g` | not a valid cold point; `24:00` remains room by product rule | avoids ambiguous same-anchor comparison |
| `24 h 01 min @ 4 C cold` | current model would be about `0.200 g` if forced | `0.664 g` | intentionally higher because process is cold-retarded |
| `25 h @ 4 C cold` | `0.192 g` | `0.640 g` | materially higher; fixes Patch 474 root issue |

The proposed model leaves long room fermentation roughly in the same practical range but separates cold-retard yeast requirements from the room curve.

## 13. Complete canonical formula/constants/provenance

### Inputs

```text
flourGrams: positive number
hydrationPercent: retained input, not used in V1 yeast correction
saltPercent: retained input, not used in V1 yeast correction
fermentationMinutes: integer
fermentationTemperatureC: number
fermentationProcess: "room" | "cold"
yeastType: "fresh" | "instant_dry" | "active_dry"
```

### Constants

```text
Q10 = 2
ROOM_REFERENCE_TEMPERATURE_C = 22
ROOM_FRESH_AT_8H_PERCENT = 0.180
ROOM_FRESH_AT_24H_PERCENT = 0.054
DURATION_EXPONENT = 1.0959032742893846
ROOM_COEFFICIENT = 1.7578093848840328
COLD_WARM_START_MINUTES = 60
COLD_FINAL_WARM_MINUTES = 60
COLD_WARM_PHASE_TEMPERATURE_C = 22
FRESH_FACTOR = 1
IDY_FACTOR = 1 / 3
ADY_FACTOR = 0.4
```

### Process selection

```text
if fermentationMinutes <= 1440:
  recommendedProcess = "room"
else:
  recommendedProcess = "cold"
```

Patch 474B may allow an explicit process input only where the product already exposes it. The default recommendation follows this rule.

### Room equation

```text
durationHours = fermentationMinutes / 60
rate = Q10 ^ ((fermentationTemperatureC - 22) / 10)
effectiveExposureHours = durationHours * rate
freshYeastPercent = ROOM_COEFFICIENT * effectiveExposureHours ^ (-DURATION_EXPONENT)
```

### Cold equation

```text
durationHours = fermentationMinutes / 60
warmStartHours = 1
finalWarmHours = 1
coldHoldHours = durationHours - warmStartHours - finalWarmHours
coldRate = Q10 ^ ((fermentationTemperatureC - 22) / 10)
effectiveExposureHours =
  warmStartHours
  + coldHoldHours * coldRate
  + finalWarmHours
freshYeastPercent = ROOM_COEFFICIENT * effectiveExposureHours ^ (-DURATION_EXPONENT)
```

### Yeast conversion

```text
factor =
  fresh: 1
  instant_dry: 1 / 3
  active_dry: 0.4

yeastPercentOfFlour = freshYeastPercent * factor
yeastGrams = flourGrams * yeastPercentOfFlour / 100
```

### Rounding

Engine output:

- preserve at least `6` decimal places for percentages internally
- preserve at least `3` decimal places for grams internally
- do not round duration before calculation

Display output:

- UI may display practical grams to `0.01 g`
- UI may show caution for legitimate sub-gram yeast amounts
- display rounding must not feed back into calculations

## 14. Supported ranges and uncertainties

| Area | V1 support | Uncertainty |
| --- | --- | --- |
| Room duration | `3:00-24:00` | `3-8 h` is outside AVPN traditional maturation range, but needed for product utility |
| Room temperature | calibrated `18-26 C` | Warmer than `26 C` should warn/high-risk; colder than `18 C` should warn/slow |
| Cold duration | `>24:00-72:00` | Cold phases are a practical model, not measured dough core temperature |
| Cold temperature | validated `3-6 C`, allowed `2-8 C` with caution | Refrigerator cycling and dough cooling lag are simplified |
| Hydration | passed through, no yeast correction | Future evidence may support correction |
| Salt | passed through, no yeast correction | Salt effect is real but V1 coefficient is not sufficiently sourced |
| Flour strength | not a yeast amount input | Should remain planning/risk guidance, not V1 yeast percentage |
| Yeast strain/brand | not modeled | User yeast freshness and strain can materially affect results |

## 15. Proposed Patch 474B regression fixtures

Patch 474B should add focused fixtures for:

1. `23 h 01 min @ 22 C room`
2. `23 h 47 min @ 21.4 C room`
3. `24 h 00 min @ 22 C room`
4. `24 h 01 min @ 4 C cold`
5. `25 h 00 min @ 4 C cold`
6. `27 h 13 min @ 4 C cold`
7. `37 h 52 min @ 4.3 C cold`
8. `51 h 06 min @ 4 C cold`
9. `71 h 59 min @ 5.1 C cold`
10. Room temperature monotonicity at constant duration
11. Cold temperature monotonicity at constant duration
12. Duration monotonicity inside room
13. Duration monotonicity inside cold
14. Fresh/IDY/ADY conversion factors
15. No hydration correction in V1
16. No salt correction in V1
17. No fixed interval rounding
18. Dough Plan and Quick Calculator use the same canonical helper
19. Existing saved/session persistence contracts unchanged
20. Current Patch 474 defect no longer reproduced

## 16. Exact Patch 474B implementation scope

Patch 474B should:

- add a canonical pure helper, likely under `lib/yeast-fermentation-model.ts`
- expose typed inputs and outputs
- implement the formulas in this specification exactly
- replace current Dough Plan continuous yeast calculation with the canonical helper
- replace Quick Calculator yeast calculation with the same helper
- preserve ingredient mass balancing around flour, water, salt and yeast
- preserve URL/session/storage contracts unless explicitly approved
- update tests and documentation for changed expected yeast values
- clarify internal yeast type labels and public copy where directly tied to calculations

Patch 474B must not:

- add database/API/persistence changes
- introduce presets or fixed calculation intervals
- add undocumented warm/cold phases
- start a broad Quick Calculator or Dough Plan redesign
- alter hydration/salt defaults or ranges
- change Pizza Plan flow outside the yeast model integration

## 17. GO / NO-GO

GO.

The evidence is sufficient for a V1 implementation because:

- AVPN supports the official room-fermentation range, yeast range and dry/fresh ratio.
- Professional yeast conversion references support fresh/internal conversion to IDY and ADY.
- Q10 temperature-rate modeling is a defensible continuous engineering method for variable temperature.
- The cold process semantics are explicit, documented and based on common cold-retarded pizza workflow rather than hidden assumptions.
- The model covers arbitrary one-minute-resolution durations from `3:00` through `72:00`.
- The formula is complete enough that Patch 474B does not need to invent coefficients.

The model remains an estimate. It should be presented as a dough-planning recommendation, not a guarantee of readiness.
