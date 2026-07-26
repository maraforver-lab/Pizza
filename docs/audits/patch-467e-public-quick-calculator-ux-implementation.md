# Patch 467E: Public Quick Calculator UX Implementation

## Summary

Patch 467E replaces the public `/calculator/quick` presentation with the approved responsive hybrid from Patch 467D2.

Patch 469A supersedes the Patch 467E assumption that every guidance level can access every calculation-affecting control. The public calculator now uses level-specific capability gates: Beginner edits only pizza count with recommended defaults, Enthusiast edits practical controls, and Pizza Nerd keeps the full technical calculator. Patch 469A also removes public saved recipes, copy-recipe output and share-link actions in favor of local recipe-image sharing.

The implementation keeps:

- one React calculator state
- one `calculateQuickDough(input)` result path
- one saved-recipe local-storage contract
- one share URL contract
- the existing public route
- the existing Admin prototypes as protected references

No calculator engine, persistence, session, API, database or migration code was changed.

## Previous Public Hierarchy

The previous public page opened with a larger calculator identity, a guidance badge with a `Change` action, an early batch summary, and a worksheet-like control stack before the user reached the main recipe result on mobile.

The result panel also carried too many jobs at once: primary ingredients, teaching copy, formula visualization, next steps, baker's percentages, assumptions, copy, reset and workflow boundary copy.

## Implemented Mobile Hierarchy

At mobile widths the page now follows:

1. Compact page identity.
2. Compact Beginner / Enthusiast / Pizza Nerd guidance tabs.
3. `Live recipe`.
4. `Copy recipe`, `Save recipe`, `Share recipe`.
5. `Adjust the recipe`.
6. Task-named disclosures.
7. Saved recipes.
8. Dough guide learning handoff.
9. Pizza Plan handoff.
10. Trust note.
11. Existing footer.

The ingredient result appears before the first large editable-control section.

## Implemented Desktop Hierarchy

At desktop widths the same component tree uses a two-pane Workbench:

- left pane: editable inputs and disclosures
- right pane: shorter sticky `Live recipe` panel
- saved recipes and handoffs below the primary workspace

The desktop layout does not render a separate calculator implementation hidden from mobile.

## Guidance Behavior

The compact guidance tabs continue to use the canonical experience-level preference helpers.

Changing guidance level:

- preserves all current input values
- preserves numerical output
- changes explanation depth
- changes disclosure default-open states
- does not scroll to another section
- does not change formulas, defaults or saved values

Default-open behavior:

- Beginner: primary recipe and essential controls visible; formula, yeast/temperature, sizing, preferment, technical tools, baker's percentages and assumptions collapsed unless active.
- Enthusiast: formula disclosure open; deeper technical sections collapsed unless active.
- Pizza Nerd: formula, yeast/temperature and baker's percentages open; sizing, preferment, technical tools and assumptions remain collapsed unless active.

Pizza Nerd mobile no longer opens every technical tool by default.

## Result Hierarchy

`Live recipe` shows, in order:

1. Total dough.
2. Dough balls.
3. Dough-ball weight.
4. Flour.
5. Water.
6. Salt.
7. Yeast.

Copy, Save and Share actions appear immediately after the result. Teaching copy, baker's percentages and assumptions appear after the ingredient values.

## Disclosure Behavior

The public flow uses the approved task labels:

- `Adjust hydration, salt and extra dough`
- `Change yeast and temperature`
- `Change pizza size or shape`
- `Use a preferment`
- `Dough-temperature and flour tools`
- `View baker's percentages`
- `View calculation assumptions`

Closed disclosures expose compact active-state summaries such as the current hydration/salt, yeast/temperature, sizing result, preferment state and technical-tool activity.

## Saved Recipes

Saved recipes moved below the primary workspace. The existing browser-local storage key, schema, maximum count, malformed-data handling, load, rename, duplicate and delete behavior remain unchanged.

The result panel now contains the primary `Save recipe` action. The lower saved-recipe section contains recipe naming and recipe management.

## Learning And Pizza Plan Handoffs

After the calculator task:

- `Learn how to make the dough` links to `/guides/dough`.
- `Plan a pizza` links to `/session/start`.

The Pizza Plan copy explicitly states that Pizza Plan starts separately and does not automatically import the Quick Calculator recipe.

## Warning Behavior

This patch adds the approved non-blocking yeast precision note:

`Very small yeast amounts may require a 0.01 g scale.`

No new numerical limits, validation thresholds or blocking warnings were introduced.

## Presentation Components

The public component remains in `components/quick-calculator/QuickDoughCalculator.tsx` and adds focused presentation helpers:

- `QuickCalculatorGuidanceTabs`
- updated `RecipeResultPanel`
- updated `OptionalControlGroup`

No calculation, saved-recipe or share-URL helper was changed.

## Numerical Equivalence

Focused tests continue to compare the Quick Calculator output against the canonical dough calculator and representative advanced states. No expected numerical fixture was changed.

Representative covered states include:

- default recipe
- pan pizza
- custom hydration/salt
- room and cold fermentation mapping
- non-default yeast
- poolish
- biga
- levain
- custom ingredients
- flour blend

## Saved-Recipe Compatibility

Existing focused tests confirm:

- storage key remains `doughtools.quick-calculator.recipes.v1`
- maximum saved-recipe count remains unchanged
- malformed saved data is ignored safely
- old saved Quick Calculator recipes load with advanced defaults
- save, load, rename, duplicate and delete remain local to the Quick Calculator

## Share-URL Compatibility

Existing focused tests confirm:

- share parameter remains `quick`
- valid share URLs restore the same values
- invalid share values normalize safely
- no Pizza Plan or session URL handoff is introduced

## Accessibility

Implemented accessibility protections:

- one clear result landmark
- `aria-live="polite"` on the result panel
- guidance tabs use native buttons with `aria-pressed`
- disclosure summaries remain keyboard accessible
- result action status uses `role="status"` or `role="alert"`
- no duplicate hidden mobile/desktop calculators were added
- saved-recipe delete remains visually destructive

## Browser Measurements

Measured against the local production build with an isolated Chrome profile and temporary `doughtools.experienceLevel` values:

| Viewport | Guidance | Live Recipe top | Yeast row top | Essential controls top | Document height |
| --- | --- | ---: | ---: | ---: | ---: |
| 390x844 | Beginner | 351 px | 1061 px | 1507 px | 5256 px |
| 390x844 | Enthusiast | 351 px | 1061 px | 1559 px | 5717 px |
| 390x844 | Pizza Nerd | 351 px | 1061 px | 1559 px | 6294 px |
| 430x740 | Beginner | 315 px | 1025 px | 1471 px | 5072 px |
| 430x740 | Enthusiast | 315 px | 1025 px | 1499 px | 5509 px |
| 430x740 | Pizza Nerd | 315 px | 1025 px | 1499 px | 6086 px |

Desktop checks at `1280x900` and `1440x900` confirmed the two-pane Workbench, first-viewport inputs and result panel, stable sticky result placement, no horizontal overflow, and no console, hydration or failed-network issues. Guidance tab switching preserved scroll position and identical Live Recipe numbers across Beginner, Enthusiast and Pizza Nerd.

## Deferred Approved Items

No approved calculation-affecting item was deferred.

Potential future warning refinements for unusual hydration or salt remain deferred because this patch does not introduce new thresholds outside the current engine validation and ranges.

## Contract Confirmation

Unchanged:

- `calculateQuickDough`
- canonical dough engine
- formulas
- defaults
- validation ranges
- fermentation mapping
- yeast behavior
- preferment calculations
- advanced-tool calculations
- saved-recipe schema and key
- share URL parameter and format
- Pizza Plan and sessions
- APIs, database and migrations
