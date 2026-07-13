# Saved recipe and account value UX

Patch 29 clarifies why saving recipes matters in DoughTools.

## What changed

- The calculator result area now explains that saving a recipe preserves the current dough setup for later reuse.
- Saved recipe cards now expose next actions for the same setup:
  - Use again
  - Planner
  - Sauce
  - Toppings
  - Timer
  - Dough Doctor
- The Account page now explains the current local-first product model more clearly.

## Storage behavior

Saved recipes continue to use the existing browser `localStorage` key:

```text
doughtools-saved-recipes-v1
```

Patch 29 does not change the saved recipe data format, does not migrate existing recipes, and does not change the saved recipe storage key.

## Account behavior

Account sign-in remains authentication only for now.

Saved recipes and local BakeResults are not uploaded to Supabase by this patch. Users should understand that local browser data can be lost if site data is cleared or if they use a different device.

## Experience-level copy

Saved recipe value is explained differently by guidance level:

- Beginner: repeat the same pizza without remembering every number.
- Enthusiast: compare fermentation, flour, hydration and results.
- Pizza Nerd: preserve variables for controlled testing and troubleshooting.

## What this patch does not implement

Patch 29 does not add:

- account recipe sync
- cloud recipe storage
- Supabase recipe tables
- public recipe publishing
- share cards
- photo upload
- payments
- analytics
- indexing changes

## Future direction

A future patch can connect saved recipes to account-based storage only after a separate privacy, schema and migration review.
