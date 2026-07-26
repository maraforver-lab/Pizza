# Patch 467B/467C: Quick Calculator Visual Prototypes

## Summary

The Admin-only Quick Dough Calculator prototypes now compare three visual directions with the calculator visible immediately:

- Instant Recipe
- Guided Builder
- Calculator Workbench

Patch 467B created the protected prototypes. Patch 467C refined the first pass because it was too intro-heavy: the old version placed a large prototype explanation card and a tall guidance selector before the actual calculator. That delayed the result and made the prototypes feel like landing pages instead of calculator concepts.

## Current Status

Prototype comparison is complete.

- Final hybrid approved: mobile uses the Instant Recipe result-first hierarchy; desktop uses the refined Calculator Workbench.
- Guided Builder is rejected as a public calculator mode.
- Guided Builder terminology and question order may inform public section grouping.
- Public implementation is deferred to Patch 467E.
- The approved implementation specification is `docs/audits/patch-467d2-approved-quick-calculator-responsive-spec.md`.

## Calculator-First Hierarchy

Every prototype preview now follows this order:

1. Compact Admin prototype bar.
2. Compact prototype title row.
3. Compact Beginner / Enthusiast / Pizza Nerd selector.
4. Prototype calculator.
5. Short prototype notes.
6. Prototype boundary notes.

The calculator starts substantially earlier, and the prototype explanation is below the working surface.

## Compact Guidance Tabs

The large guidance card was replaced with a small segmented control:

- Beginner
- Enthusiast
- Pizza Nerd

Changing the selection changes explanation depth only. Numeric input, canonical defaults and calculated output remain identical.

## Patch 467D1 Guidance-Level Prototype Model

Patch 467D1 keeps one calculator engine and tests guidance level as progressive disclosure in the Admin prototypes only.

Presentation depth:

- Beginner: the immediate path shows pizza count, dough-ball weight, fermentation duration and fermentation environment. Hydration, extra dough, yeast type, fermentation temperature, preferment controls, dough-temperature tools, flour tools and advanced calculations remain available behind clearly labelled disclosures.
- Enthusiast: the immediate path adds hydration, salt, yeast type and fermentation temperature. Preferment controls, dough-temperature tools, flour tools and advanced calculations remain available behind disclosures.
- Pizza Nerd: all technical groups are visible by default, including preferments, baker percentages, dough temperature, water temperature, flour tools and advanced calculations.

Disclosure labels:

- Adjust dough texture
- Change fermentation details
- Use advanced dough methods
- Technical dough tools

The labels describe the user job rather than using vague "Advanced" or "More" language.

Result hierarchy for all levels:

1. Total dough.
2. Dough balls.
3. Dough-ball weight.
4. Flour.
5. Water.
6. Salt.
7. Yeast.

Rationale:

- Beginner gets the shortest successful path without losing access to any calculation input.
- Enthusiast gets practical recipe controls without the full technical workspace upfront.
- Pizza Nerd gets the complete workbench.
- Switching the guidance selector changes presentation only; the same input object and `calculateQuickDough` call produce the same numerical result.

## Instant Recipe Refinement

Instant Recipe now demonstrates the strongest result-first direction.

Mobile order:

1. Live ingredient result.
2. Copy / Save / Share prototype actions.
3. Pizza count.
4. Dough-ball weight.
5. Fermentation controls.
6. Compact disclosures.

Desktop uses a clear two-column structure with editable controls on the left and the live recipe/result actions on the right.

## Guided Builder Refinement

Guided Builder now opens directly into the staged tool:

1. Pizza.
2. Time.
3. Formula.
4. Result.

The stage navigation, current-stage controls and mini live result appear before prototype notes. The flow remains a visual prototype only and does not become a Pizza Plan workflow.

## Workbench Grouping Redesign

Calculator Workbench was simplified from a cramped matrix into a calmer workspace:

- Batch
- Fermentation
- Formula

The four explanatory peer cards from the first pass were removed. The right pane now holds the live recipe, prototype actions and technical summary so desktop remains scannable and mobile does not collapse into narrow vertical cards.

## Prototype Access

The prototypes remain allowlisted at:

- `/admin/quick-calculator-preview/instant`
- `/admin/quick-calculator-preview/guided`
- `/admin/quick-calculator-preview/workbench`

The existing `/admin` layout applies Admin authorization. Unknown prototype IDs return safe not-found behavior. The preview route uses noindex metadata and remains excluded from sitemap generation.

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
- extra dough
- yeast type
- fermentation temperature
- preferment method and preferment percentages
- dough temperature and water-temperature estimate inputs
- yeast conversion and reverse-fermentation tools
- optional oil, sugar, malt and flour-blend tools

## Non-Persistence Guarantees

The prototypes do not:

- write localStorage or sessionStorage
- create saved recipes
- create share URLs
- call API routes
- create Pizza Plans or sessions
- write account, database or cloud data

Copy, Save and Share controls are visual prototype actions only.

## Final Comparison Decision

The comparison questions are resolved:

- Instant Recipe is the mobile foundation.
- Calculator Workbench is the desktop foundation.
- Guided Builder is not a public wizard.
- The final public direction is a responsive hybrid of Instant Recipe on mobile and Workbench on desktop.

Any public implementation must preserve the canonical calculation engine and existing saved-recipe/share contracts unless a separate persistence patch explicitly changes them.
