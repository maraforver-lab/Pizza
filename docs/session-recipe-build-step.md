# Session recipe build step

Patch 35 adds a dedicated Pizza Session recipe step.

Route:

```text
/session/recipe
```

The route turns the active local Pizza Session choices into a clear dough plan before the user continues to timeline and shopping.

## What the recipe snapshot means

The recipe snapshot is a copy of the dough setup generated for the active session at that moment.

It is saved into the Pizza Session so later steps can refer to the same dough numbers instead of recalculating from uncertain UI state.

The snapshot may include:

- pizza count
- dough-ball weight
- waste percentage
- hydration
- salt
- yeast type
- fermentation choice
- flour
- oven
- pizza style
- pizza preset
- total dough
- flour, water, salt and yeast amounts

## Stored fields

Patch 35 can store these fields into the active Pizza Session:

- `recipeParams`
- `recipeSnapshot`
- `currentStep: "recipe"`
- refreshed `updatedAt`
- refreshed `lastSavedAt`

It preserves the existing session id, target time, baking path, pizza preset, quantity, oven, flour, timeline and shopping list unless another route intentionally updates those fields.

## Relationship to the existing calculator

The existing full calculator remains available and unchanged.

The session recipe step builds calculator-compatible recipe parameters from the active Pizza Session where safe. It reuses the existing DoughTools calculation helpers and does not introduce new formula logic.

Users can open the full calculator from `/session/recipe` with the generated query parameters.

## Local-first behavior

The recipe snapshot is saved locally in the browser as part of the Pizza Session.

It is not:

- uploaded to Supabase
- synced to an account
- shared publicly
- used for analytics or tracking

If the user clears browser site data, local Pizza Sessions and recipe snapshots may be lost.

## Missing-data behavior

If there is no active session, `/session/recipe` shows a safe empty state and links back to `/session/start`.

If required choices are missing, the route shows a specific safe state and links back to the session starter. It does not invent unsupported values or crash.

Required choices for the first session recipe build are:

- baking path
- pizza preset
- pizza count
- flour choice

## Experience-level behavior

The recipe route uses the existing experience-level model.

- Beginner copy stays short and action-focused.
- Enthusiast copy explains repeatability and why dough variables matter.
- Pizza Nerd copy shows calculator-compatible parameters and assumptions where useful.

The route remains one shared page. It does not create separate beginner or advanced routes.

## Wizard UX cleanup

Patch 35 clarifies the Start Pizza Session wizard:

1. The first step is the baking path, not a pizza preset.
2. Pizza preset is a separate step.
3. The time step now explains that the current timeline feature plans backwards from the chosen time.
4. Card-choice steps require a clear selected value before continuing.

This keeps the guided session flow focused on the next decision instead of copying long tool-page explanations.

## Future improvements

Future patches can build on this foundation:

- stronger preset defaults
- multi-preset party mode
- Kitchen Mode integration
- richer recipe comparison
- tighter shopping-list quantity integration
- post-bake review handoff

