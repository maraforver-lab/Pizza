# Patch 467B: Quick Calculator Visual Prototypes

## Summary

Patch 467B adds three Admin-only visual prototypes for the Quick Dough Calculator:

- Instant Recipe
- Guided Builder
- Calculator Workbench

The public `/calculator/quick` route remains unchanged. The prototypes are presentation-only and exist so the admin can compare mobile-first, guided and workbench-style approaches before any public redesign.

## Prototype Access

The prototypes are allowlisted at:

- `/admin/quick-calculator-preview/instant`
- `/admin/quick-calculator-preview/guided`
- `/admin/quick-calculator-preview/workbench`

The existing `/admin` layout applies Admin authorization. Unknown prototype IDs return safe not-found behavior. The preview route uses noindex metadata and is excluded from sitemap generation.

## Calculation Boundary

The prototypes use a thin read-only adapter that calls the canonical Quick Calculator engine:

- `calculateQuickDough`
- `quickCalculatorDefaults`
- existing fermentation defaults

No formula, yeast, hydration, sizing or recipe calculation is duplicated in the prototype presentation.

## Shared Sample

All three prototypes start from the same sample:

- 4 pizzas
- 260 g dough balls
- 24 h cold fermentation
- default hydration
- default salt
- instant dry yeast

Editable prototype controls are in-memory only:

- pizza count
- dough-ball weight
- fermentation duration
- room or cold fermentation
- hydration
- salt

## Guidance Behavior

Each prototype has a local guidance selector for Beginner, Enthusiast and Pizza Nerd presentation. Changing the selector changes only the explanation copy. It does not change numeric inputs, calculated output, saved state or public user preference.

Only the selected guidance explanation is rendered. The prototypes do not render all three explanations together.

## Non-Persistence Guarantees

The prototypes do not:

- write localStorage or sessionStorage
- create saved recipes
- create share URLs
- call API routes
- create Pizza Plans or sessions
- write account, database or cloud data

Copy, Save and Share controls are visual prototype actions only.

## Admin Listing

The protected Admin page now includes a compact `Quick Calculator prototypes` section with:

- concept name
- purpose
- `PROTOTYPE` status
- Preview action

No publish, restore, retire, delete, database switching or public selector behavior is introduced.

## Deferred Decisions

Future implementation work should choose a public direction based on prototype review. The expected decision is still likely a hybrid: Instant Recipe for mobile result-first hierarchy and Calculator Workbench for desktop efficiency. Any public redesign must preserve the canonical calculation engine and existing storage/share contracts unless a separate persistence patch explicitly changes them.
