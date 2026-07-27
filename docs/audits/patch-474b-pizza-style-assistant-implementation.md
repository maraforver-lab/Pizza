# Patch 474B: Pizza Style Assistant Implementation

## Starting Commit

`b0a3771f56b8c7595ff19423b3facba0adf53189`

## Previous Hierarchy

The old `/styles` flow was:

```text
Compact hero
-> visual comparison
-> seven detailed comparison cards
-> goal guide
-> what changes in practice
-> technique notes
-> broad focused-guide links
-> final Plan a pizza CTA
```

This was accurate, but it behaved like a long style atlas before it helped the user decide which style matched their goal.

## Implemented Assistant Hierarchy

The new flow is:

```text
Compact hero
-> Pizza Style Assistant
-> all-style image browse
-> compact comparison
-> collapsed technique differences
-> compact Pizza Plan handoff
-> footer
```

The assistant asks the practical question first, then narrows the page to styles that fit the selected goal.

## Goal Choices

The assistant includes six practical choices:

- Soft and airy
- Crisp and foldable
- Thin and crisp
- Pan pizza
- Large sharing pizza
- Easiest home-oven fit

The choices use button-based radio semantics with `role="radiogroup"`, `role="radio"` and `aria-checked`. Selection is local presentation state only. It does not write storage, update URL state, call APIs, create sessions or alter Pizza Plan state.

## Recommendation Behavior

Each selected goal shows a compact set of relevant existing styles. Recommendations use canonical `pizzaStyleEducationById` data for the style facts and image metadata, with a small presentation mapping for goal-to-style grouping.

Examples:

- Soft and airy recommends Neapolitan and Contemporary Neapolitan.
- Crisp and foldable recommends New York.
- Pan pizza recommends Detroit, Roman al Taglio and Sicilian.
- Easiest home-oven fit recommends New York, Detroit and Roman Tonda.

## Support Boundary

A single support notice appears near the assistant:

`DoughTools Pizza Plans currently support Neapolitan-style pizza. Other styles are learning references unless specifically marked otherwise.`

Style-specific badges remain compact:

- `Supported in Pizza Plan`
- `Learning guide`

Unsupported styles show an explanatory learning-reference message instead of a misleading Plan-this-style action.

## Comparison Simplification

The full comparison remains, but the primary visible fields are now the choice-making fields:

- image
- support status
- style name
- oven fit
- crust and texture
- shape or thickness
- bake behavior
- best suited for

Deeper detail is retained behind disclosures:

- dough reference
- preset hydration or fermentation data
- flour strength
- sauce and cheese detail
- topping load
- common confusion

No canonical style facts or preset data changed.

## Collapsed Technical Content

`PizzaStyleTechniqueNotes` now sits behind one collapsed `Explore technique differences` disclosure. Individual style technique panels remain keyboard-accessible with `aria-expanded`, `aria-controls` and region panels.

## Pizza Plan Handoff

The supported action is explicit:

`Plan a Neapolitan-style pizza`

Target:

`/session/start`

Unsupported styles remain learning references and do not create sessions or pass unsupported state into Pizza Plan.

## Desktop Result

Local `1440x900` browser check:

- approved heading top: 190 px
- assistant top: 426 px
- recommendation heading top: 479 px
- selected detail top: 838 px
- all-style browse top: 1641 px
- compact comparison top: 2020 px
- technique disclosure top: 4308 px
- no horizontal overflow
- no console errors or hydration warnings

The first viewport shows the page purpose, goal selector and beginning of recommendations.

## Mobile Result

Local `390x844` browser check:

- approved heading top: 166 px
- assistant top: 500 px
- recommendation heading top: 1419 px
- selected detail top: 2414 px
- all-style browse top: 3811 px
- compact comparison top: 4415 px
- no horizontal overflow
- no console errors or hydration warnings

The mobile page now asks for the goal before the all-style browse and before the full comparison. Unsupported selection was checked with Pan pizza, which selected Detroit and showed the learning-reference boundary instead of a misleading planning action.

## Focused Validation

Completed:

- `npm test -- tests/pizza-styles.test.ts`
- `npm run lint`
- `npm run build`

Pending after documentation:

- `git diff --check`

## Production Result

Production verification is performed after the patch commit, fast-forward merge, push and Vercel deployment. The final report records the live production result.

## Boundary Confirmation

Unchanged:

- canonical Pizza Style data
- Pizza Style IDs
- existing style image assets
- legacy style preset calculations
- dough formulas
- Pizza Plan logic
- Quick Calculator
- Sauce
- Toppings
- Ovens
- Dough Guide
- sessions
- APIs
- database
- migrations
- global header
- navigation
- footer
- indexing policy
