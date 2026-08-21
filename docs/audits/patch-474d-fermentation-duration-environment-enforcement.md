# Patch 474D: Fermentation Duration / Environment Enforcement

## Summary

Patch 474B installed the canonical yeast model, but the public Quick Calculator still allowed fermentation duration and environment to drift apart in UI state. The visible state could show an invalid combination such as `48 h` with `Room temperature`, while the adapter could map that stale state to the wrong recipe preset.

Patch 474D makes fermentation duration the source of truth for Quick Calculator process selection:

- `6 h`, `12 h`, `24 h` derive `room`
- `48 h` derives `cold`
- invalid stored, shared or in-memory combinations are normalized before calculation
- the UI disables the environment option that is invalid for the selected duration

No canonical yeast formula, coefficient, conversion factor or Dough Plan formula was changed.

## Root Cause

`QuickCalculatorInput` retained both:

- `fermentationDuration`
- `fermentationEnvironment`

The previous mapper trusted `fermentationEnvironment`. If state became `48h + room`, the adapter did not derive the intended cold process from duration. That allowed the UI and calculation path to disagree.

## Implemented Sync Behavior

The shared Quick Calculator module now exposes:

```ts
deriveQuickFermentationEnvironment(duration)
```

Rules:

| Duration | Derived process | Default temperature when process changes |
|---|---:|---:|
| 6 h | room | 22 C |
| 12 h | room | 22 C |
| 24 h | room | 22 C |
| 48 h | cold | 4 C |

`normalizeQuickCalculatorInput()` applies this rule before recipe settings are built. If the incoming environment already matches the derived process, the current temperature is preserved and clamped. If it does not match, temperature resets to the default for the derived process.

The public component uses the same derivation when the duration button changes. Environment buttons remain visible for clarity, but the invalid option is disabled for the selected duration.

## Verification Values

Using the default Quick Calculator batch:

| Case | Process | Temperature | Yeast type | Yeast |
|---|---|---:|---|---:|
| 24 h | room | 22 C | IDY | about 0.116 g |
| 48 h from stale room state | cold | 4 C | IDY | about 0.770 g |
| 48 h from stale room state | cold | 4 C | ADY | about 0.924 g |

Using the Patch 474 audit scale of about `963 g` flour:

| Case | Process | Temperature | Yeast type | Yeast |
|---|---|---:|---|---:|
| 24 h | room | 22 C | ADY | about 0.208 g |
| 48 h | cold | 4 C | IDY | about 1.156 g |
| 48 h | cold | 4 C | ADY | about 1.387 g |

The old invalid behavior could keep a `48 h` UI state on room-scale yeast. The focused regression now asserts that `48 h + stale room` normalizes to `48h-cold` and ADY yeast percent is `0.144%`, not the room-scale `0.0216%`.

## Dough Plan Check

Dough Plan already uses canonical fermentation presets such as `24h-room`, `24h-cold` and `48h-cold`. Its preset string determines the process before entering the canonical yeast engine. No Dough Plan change was required.

## Validation

Focused tests run:

```bash
npm test -- tests/quick-calculator.test.ts tests/yeast-fermentation-model.test.ts tests/dough-calculator.test.ts
```

Result:

- 3 test files passed
- 82 tests passed

Additional validation for lint, build and diff whitespace was run before commit. Browser interaction checks were not available in this environment because the repository does not include Playwright and no browser-control connector was exposed for this turn; the 24 h to 48 h to 24 h state transition was covered through focused source and behavior tests instead.

## Boundaries

Unchanged:

- canonical yeast formulas
- room model constants
- cold model constants
- yeast conversion factors
- Dough Plan formulas
- session persistence
- APIs
- database
- migrations
