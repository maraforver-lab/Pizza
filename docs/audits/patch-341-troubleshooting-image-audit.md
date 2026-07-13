# Patch 341 troubleshooting image audit

Date: 2026-07-13  
Scope: `/guide/pizza-troubleshooting` diagnostic imagery.

## Summary

All current troubleshooting images are local WebP assets under `public/images/troubleshooting/`.
They are already mapped one-to-one to the 43 troubleshooting problems and all referenced assets exist.
Patch 341 does not add generated imagery and does not add people, hands, faces, arms, silhouettes, logos, watermarks or embedded text.

The main image problem in the previous implementation was not asset absence; it was presentation:
all images appeared inside a long, repetitive 43-problem article stack. Patch 341 keeps the approved
diagnostic assets and changes the reveal pattern so images support compact symptom cards and one focused
diagnosis at a time.

## Audit decisions

| Asset | Problem represented | Current use | Recommendation | Notes |
| --- | --- | --- | --- | --- |
| `base-burns-underneath.webp` | Base burns underneath | Baking diagnosis | Retain | Clear underside-burn symptom; comparison text remains HTML. |
| `center-raw-or-doughy.webp` | Center stays raw or doughy | Baking diagnosis | Retain | Useful cut-center diagnostic. |
| `cheese-burns-too-early.webp` | Cheese burns before pizza is ready | Topping diagnosis | Retain | Distinguishes top/topping heat problem. |
| `cheese-releases-oil.webp` | Cheese releases oil | Topping diagnosis | Retain | Clear greasy-pool symptom. |
| `crust-burns-middle-doughy.webp` | Crust burns but middle is doughy | Baking diagnosis | Retain | Useful heat-imbalance comparison. |
| `dough-balls-spread-flat.webp` | Dough balls spread flat | Dough fermentation diagnosis | Retain | Shows structure loss without needing hands. |
| `dough-collapses-after-rising.webp` | Dough collapses after rising | Dough fermentation diagnosis | Retain | Distinguishes collapse from simple low rise. |
| `dough-dry-skin.webp` | Dough develops a dry skin | Dough fermentation diagnosis | Retain | Clear surface defect. |
| `dough-not-rising.webp` | Dough is not rising | Dough fermentation diagnosis | Retain | Useful low-rise comparison. |
| `dough-overproofed.webp` | Dough is overproofed | Dough fermentation diagnosis | Retain | Clear overproofed-state comparison. |
| `dough-springs-back.webp` | Dough springs back | Shaping diagnosis | Retain | Symptom is supported by copy; no replacement needed. |
| `dough-sticks-to-work-surface.webp` | Dough sticks to work surface | Shaping diagnosis | Retain | Practical stuck-dough surface context. |
| `dough-stretches-unevenly.webp` | Dough stretches unevenly | Shaping diagnosis | Retain | Shows uneven thickness/shape. |
| `dough-tears-moving-to-peel.webp` | Dough tears while moving to peel | Shaping diagnosis | Retain | Diagnostic transfer tear. |
| `dough-tears.webp` | Dough tears or gets holes | Shaping diagnosis | Retain | Clear hole/tear symptom. |
| `dough-too-cold.webp` | Dough is too cold to stretch | Dough fermentation diagnosis | Retain | Copy clarifies cold/tight condition. |
| `dough-too-sticky.webp` | Dough is too sticky | Dough fermentation diagnosis | Retain | Clear sticky/smearing symptom. |
| `dough-too-warm.webp` | Dough is too warm and loose | Dough fermentation diagnosis | Retain | Clear warm/slack condition. |
| `dough-underproofed.webp` | Dough is underproofed | Dough fermentation diagnosis | Retain | Useful readiness comparison. |
| `gummy-layer-under-toppings.webp` | Gummy layer under toppings | Baking diagnosis | Retain | Good cut-slice diagnostic. |
| `home-oven-pale-soft.webp` | Home oven pizza is pale or soft | Baking diagnosis | Retain | Clear home-oven outcome. |
| `launch-takes-too-long.webp` | Launch takes too long | Launching diagnosis | Retain | Better as context plus fix-now copy; no new image needed. |
| `mozzarella-releases-water.webp` | Fresh mozzarella releases water | Topping diagnosis | Retain | Clear milky moisture symptom. |
| `oven-loses-heat-between-pizzas.webp` | Oven loses heat between pizzas | Baking diagnosis | Retain | Useful first/later pizza comparison. |
| `pizza-bakes-unevenly.webp` | Pizza bakes unevenly | Baking diagnosis | Retain | Clear uneven-bake symptom. |
| `pizza-center-too-thin.webp` | Center becomes too thin | Shaping diagnosis | Retain | Shows center-thickness issue. |
| `pizza-folds-during-launch.webp` | Pizza folds during launch | Launching diagnosis | Retain | Clear folded-launch failure. |
| `pizza-loses-round-shape.webp` | Pizza loses round shape | Shaping diagnosis | Retain | Clear shape loss. |
| `pizza-overloaded-with-toppings.webp` | Pizza overloaded with toppings | Topping diagnosis | Retain | Clear heavy-load symptom. |
| `pizza-soggy-middle.webp` | Pizza is soggy in the middle | Baking diagnosis | Retain | Clear wet-center problem. |
| `pizza-sticks-to-peel.webp` | Pizza sticks to peel | Launching diagnosis | Retain | Clear stuck-launch symptom. |
| `pizza-stretches-on-peel.webp` | Pizza stretches on peel | Launching diagnosis | Retain | Clear deforming-on-peel symptom. |
| `rim-does-not-rise.webp` | Rim does not rise | Baking diagnosis | Retain | Clear low-rim comparison. |
| `rim-flattened-during-shaping.webp` | Rim flattened during shaping | Shaping diagnosis | Retain | Clear edge-compression symptom. |
| `rim-scorched-by-sauce-or-cheese.webp` | Rim scorched by sauce or cheese | Topping diagnosis | Retain | Clear localized rim scorch. |
| `sauce-makes-center-watery.webp` | Sauce makes center watery | Topping diagnosis | Retain | Clear sauce-moisture symptom. |
| `too-much-flour-under-pizza.webp` | Too much flour or semolina burns underneath | Launching diagnosis | Retain | Clear scorched-dust underside issue. |
| `top-burns-before-bottom.webp` | Top burns before bottom is ready | Baking diagnosis | Retain | Clear top/bottom imbalance. |
| `toppings-cook-unevenly.webp` | Toppings cook unevenly | Topping diagnosis | Retain | Clear topping-size/moisture mismatch. |
| `toppings-release-water.webp` | Toppings release too much water | Topping diagnosis | Retain | Clear pooled-moisture symptom. |
| `toppings-slide-after-baking.webp` | Toppings slide off after baking | Topping diagnosis | Retain | Clear post-bake sliding issue. |
| `toppings-slide-during-launch.webp` | Toppings slide during launch | Launching diagnosis | Retain | Clear launch-specific slide issue. |
| `weak-gluten-structure.webp` | Weak gluten structure | Dough fermentation diagnosis | Retain | Clear weak-structure comparison. |

## Follow-up candidates

No replacement is required for Patch 341. If a future dedicated image-only patch is desired,
the weakest candidates to inspect visually again are launch-timing and cold/warm dough state images,
because those concepts can be abstract and may benefit from CSS diagrams or more controlled before/after comparisons.
