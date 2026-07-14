# Patch 28 core recipe workflow handoff

Patch 28 connects the calculated dough recipe more clearly to the rest of the DoughTools workflow.

The goal is to make DoughTools feel like one pizza-making workspace instead of separate pages.

## Workflow goal

The intended core flow is:

```text
Calculator / recipe result
→ Planner
→ Sauce
→ Toppings
→ Timer
→ Troubleshooting
→ Save / Account
```

The calculator still creates the same dough numbers. Patch 28 only clarifies what to do after those numbers are ready.

## Supported handoffs

The recipe result now shows a next-step area:

```text
Next steps for this recipe
```

The section links to:

- Planner
- Sauce
- Toppings
- Timer
- Troubleshooting

It also reminds the user that the recipe can be saved locally with the existing Save recipe behavior.

## Recipe context preservation

The following tool links preserve the existing recipe query context:

- `/plan`
- `/sauce`
- `/toppings`
- `/timer`
- `/guide/pizza-troubleshooting`

The query is built from the existing `recipeParams(settings)` convention. Patch 28 does not rename query parameters and does not invent unsupported parameters.

The preserved context can include:

- pizza count
- dough ball weight
- waste percentage
- hydration
- salt
- yeast type
- fermentation option
- temperature
- style goal
- oven type
- flour profile
- pizza style

Account behavior is not changed. Patch 28 does not add account recipe sync, cloud sync or Supabase storage.

## Experience-level behavior

The next-step copy adapts lightly to the existing experience-level system:

| Level | Behavior |
| --- | --- |
| Beginner | Keeps the next move simple and emphasizes Planner first. |
| Enthusiast | Explains why Planner, Sauce, Toppings and Timer matter together. |
| Pizza Nerd | Mentions query continuity and repeatable variables. |

The canonical values remain:

- `beginner`
- `enthusiast`
- `pizza_nerd`

The storage key remains:

```text
doughtools.experienceLevel
```

## What was intentionally not changed

Patch 28 does not change:

- dough formulas
- yeast calculations
- recipe URL parsing
- planner timing logic
- Troubleshooting guide content
- sauce, toppings or timer formulas
- saved recipe persistence
- BakeResult storage
- authentication
- Supabase behavior
- analytics or tracking
- SEO indexing/noindex behavior
- Patch 27 security headers

## Future improvements

Possible later patches:

- stronger save recipe UX
- sauce/toppings/timer deeper recipe integration
- account/cloud sync only after a separate privacy and auth decision
- privacy-first funnel measurement only after a separate analytics decision

