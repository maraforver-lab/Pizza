# Patch 461B: Guidance Logic Separation

## Previous defects

- `/session/start` used guidance level to decide whether dough ball weight and yeast type controls were available.
- `/session/start` also applied simplified Beginner and Enthusiast defaults for `doughBallWeight` and `yeastType`.
- `/session/recipe` exposed persisted hydration and fermentation-temperature overrides only inside Pizza Nerd controls.

## New invariant

`One canonical Pizza Plan logic, different instructional depth.`

Beginner, Enthusiast and Pizza Nerd now use the same calculation inputs, persisted values, override behavior and recipe regeneration logic. Guidance level may only change helper copy.

## Controls made level-independent

- Dough ball weight
- Yeast type
- Hydration override
- Fermentation temperature override

The Start page keeps dough ball weight and yeast type in a shared `Advanced dough settings` disclosure. The Recipe page shows shared `Advanced dough settings` for hydration and fermentation temperature.

## Formula and default confirmation

No dough formulas, validation ranges, canonical recipe defaults, yeast conversion rules, persistence keys, storage schema or migrations were changed.

Existing saved Pizza Plans remain authoritative. Opening an existing plan no longer applies a guidance-level defaults patch to `doughBallWeight` or `yeastType`.

## Regression coverage

Focused tests now cover:

- identical default `doughBallWeight` and `yeastType` behavior across all three guidance levels
- shared access to calculation-affecting Start controls
- guidance-level-only changes preserving saved calculation inputs
- shared Recipe override controls
- hydration and temperature override persistence outside Pizza Nerd
- identical recipe output for identical override values across all three levels
- unchanged validation ranges and PizzaSession persistence compatibility
