# Calculation baseline

Regression document for DoughTools calculation safety.

This document records the current calculation behavior as a baseline. It does not claim that every formula is universal pizza science; it locks the current behavior so later feature work can detect accidental changes.

## Covered by automated tests

- Direct dough ingredient totals in `lib/dough-calculator.ts`.
- Fresh/compressed yeast (`cy`), active dry yeast (`ady`) and instant dry yeast (`idy`) output stability.
- Stiff sourdough starter (`ssd`) and liquid sourdough starter (`lsd`) output consistency.
- Minimum and maximum URL-style numeric boundaries.
- Pizza style defaults from `lib/pizza-styles.ts`.
- Flour database consistency from `lib/flours.ts`.

## Reference recipe

Current baseline settings:

- 6 pizzas
- 260 g dough ball
- 3% waste
- 64% hydration
- 2.8% salt
- Instant dry yeast
- 24 h cold fermentation
- 4 °C
- Caputo Pizzeria
- Classic Neapolitan

Current expected output:

- Total dough: about 1606.8 g
- Flour: about 962.04 g
- Water: about 615.71 g
- Salt: about 26.94 g
- Yeast/leavener: about 2.12 g

The test suite compares floating-point values with tolerances instead of exact string formatting, because the UI may round display values separately.

## Sourdough assumptions

The current calculation treats:

- `ssd` as a stiff starter at 50% hydration.
- `lsd` as a liquid starter at 100% hydration.

Tests verify that starter flour and starter water are included when checking the final baker's hydration.

## Known non-goals in Patch 474B

- No formula changes beyond the approved Patch 474A canonical commercial yeast model.
- No recalibration beyond the approved Patch 474A specification.
- No UI wording or layout changes.
- No route changes.
- No deployment or indexing changes.
