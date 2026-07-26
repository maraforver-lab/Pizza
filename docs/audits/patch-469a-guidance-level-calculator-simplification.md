# Patch 469A: Guidance-Level Quick Calculator Simplification

## Summary

Patch 469A changes the public `/calculator/quick` presentation model from "same controls, different explanation depth" to a level-sensitive capability model. The calculator engine remains unchanged: all ingredient amounts still come from `calculateQuickDough`, with the existing defaults, ranges, fermentation mapping, yeast logic, sizing logic and preferment logic.

The public calculator no longer exposes saved-recipe management, copy-to-clipboard recipe output or share-link creation as result actions. The single result action is now `Share recipe`, which generates a local 1080 x 1350 PNG recipe image and uses native file sharing where available, with a Save image preview fallback.

## Previous UX Problem

Patch 467E made the calculator result-first, but Beginner still had access to every technical calculation control through disclosures. That made the level selector feel like presentation density rather than a real product choice. Saved recipes and copy/share-link actions also made the page heavier than the intended quick utility.

## Capability Matrix

| Area | Beginner | Enthusiast | Pizza Nerd |
| --- | --- | --- | --- |
| Pizza count | Editable | Editable | Editable |
| Dough-ball weight | Recommended default only | Editable | Editable |
| Fermentation duration | Recommended default only | Editable | Editable |
| Room/cold fermentation | Recommended default only | Editable | Editable |
| Hydration | Recommended default only | Editable | Editable |
| Salt | Recommended default only | Editable | Editable |
| Extra dough | Recommended default only | Editable | Editable |
| Yeast type | Recommended default only | Editable | Editable |
| Exact fermentation temperature | Hidden/defaulted | Hidden/defaulted | Editable |
| Pizza size and shape | Hidden/defaulted | Hidden/defaulted | Editable |
| Preferments | Hidden/defaulted | Hidden/defaulted | Editable |
| Dough-temperature tools | Hidden/defaulted | Hidden/defaulted | Editable |
| Yeast converter and reverse fermentation | Hidden/defaulted | Hidden/defaulted | Editable |
| Custom ingredients | Hidden/defaulted | Hidden/defaulted | Editable |
| Flour blend | Hidden/defaulted | Hidden/defaulted | Editable |
| Baker's percentages | Hidden | Hidden | Visible in technical disclosure |
| Calculation assumptions | Hidden | Hidden | Visible in technical disclosure |

## Beginner Recommended Defaults

Beginner preserves only `pizzaCount`. Every other input is reset to `quickCalculatorDefaults` before calculation whenever the selected level is Beginner. This prevents hidden technical values from changing Beginner output.

Beginner visible content is:

- compact page identity
- guidance selector
- note: `Choose how many pizzas you want to make. DoughTools uses a reliable recommended recipe.`
- Live Recipe
- number-of-pizzas control
- `Share recipe`
- compact Dough Guide and Pizza Plan handoffs
- footer

## Downward-Level Confirmation

Moving upward preserves all current supported values and reveals additional controls.

Moving downward checks whether hidden unavailable settings are active:

- Pizza Nerd or Enthusiast to Beginner shows `Use Beginner recommended settings?`.
- Pizza Nerd to Enthusiast shows `Use Enthusiast practical settings?`.

Confirmation preserves pizza count. Beginner resets every unavailable value to canonical defaults. Enthusiast preserves practical values and resets only Pizza Nerd-only values. The reset is explicit; no hidden value is silently left active.

## Saved-Recipe Removal

Public saved-recipe UI and handlers were removed:

- `Save recipe`
- saved-recipe name input
- Saved Calculator Recipes
- Load
- Rename
- Duplicate
- Delete
- empty saved-recipe state

The public component no longer imports the saved-recipe storage key or saved-recipe read/write helpers. Existing browser localStorage under `doughtools.quick-calculator.recipes.v1` is not cleared, migrated or deleted.

## Recipe Image Sharing

`Share recipe` creates a local canvas-rendered PNG:

- size: 1080 x 1350 px
- format: PNG
- branding: DoughTools mark, `Dough recipe`, `Planned with DoughTools`, `doughtools.app`
- recipe values: dough-ball summary, total dough, flour, water, salt, yeast, fermentation summary
- hydration included for Enthusiast and Pizza Nerd

The image is generated from the current `calculateQuickDough(input)` result, so displayed recipe values and shared image values use the same result object.

No account information, saved-recipe name, browser controls, remote assets, API calls, database writes or Pizza Plan/session data are included.

## Native Sharing and Fallback

When file sharing is supported, the component creates a local `File` and calls `navigator.share`.

If native sharing is unavailable or does not resolve promptly in browser automation, the component opens a polished preview with:

- generated recipe image
- `Save image`
- `Close`

The fallback downloads the same generated data URL locally. The image is never uploaded.

## Mobile Measurements

Final local production-build browser checks used Chrome at `390x844` and `430x740`.

| Viewport | Level | Live Recipe top | Ingredient list top | Pizza-count top | Share top | Document height |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 390x844 | Beginner | 375 px | 562 px | 1164 px | 909 px | 2108 px |
| 390x844 | Enthusiast | 327 px | 514 px | 1124 px | 869 px | 3215 px |
| 390x844 | Pizza Nerd | 327 px | 514 px | 1124 px | 869 px | 4473 px |
| 430x740 | Beginner | 315 px | 502 px | 1104 px | 849 px | 2028 px |
| 430x740 | Enthusiast | 291 px | 478 px | 1088 px | 833 px | 3103 px |
| 430x740 | Pizza Nerd | 291 px | 478 px | 1088 px | 833 px | 4316 px |

Mobile checks found no horizontal overflow, no saved-recipe UI, no copy/reset UI and no console or hydration errors on the current-build run. Beginner stayed below the preferred 2600 px document-height target.

## Desktop Layouts

At `1280x900` and `1440x900`:

- Beginner uses a compact two-area layout with the recipe and pizza count only; no empty technical Workbench column.
- Enthusiast uses the practical Workbench with formula and yeast controls available, without exact temperature, sizing, preferment or technical tools.
- Pizza Nerd uses the complete technical Workbench with advanced groups available and deep groups collapsed unless active.

Desktop checks found the result and controls in the first viewport, no horizontal overflow and no console or hydration errors. Browser automation recorded aborted RSC prefetches from link preloading only; no application request failure affected the calculator route.

## Numerical Equivalence

Focused tests confirmed the calculator still calls the existing pure dough calculator path and did not duplicate formula logic. Existing numerical fixtures remained unchanged for:

- default recipe
- pizza count and dough-ball weight changes
- room and cold fermentation
- non-default yeast
- round, pan and custom sizing
- poolish, biga and levain
- custom ingredients
- flour blend
- baker's percentages and preferment split

Guidance switching preserves supported values. Lowering guidance resets unavailable active settings only after confirmation so hidden values cannot affect Beginner output.

## Accessibility Results

The implementation keeps:

- native buttons for guidance selection with selected semantics
- visible labels on controls
- keyboard-accessible disclosures
- `aria-live="polite"` for recipe result updates
- status/alert messaging for share state
- modal dialog semantics for reset confirmation and image preview
- full text labels for handoffs and share fallback actions

No image-only navigation or nested interactive controls were introduced.

## Superseded Requirements

Patch 469A supersedes the Patch 467D2/467E requirement that every level can access every calculation-affecting control. The approved behavior is now:

- Beginner: pizza count only, with recommended defaults.
- Enthusiast: practical controls only.
- Pizza Nerd: complete calculator capability.

Patch 469A also supersedes the previous public saved-recipe, copy-recipe and share-link result-action requirements.

## Remaining Release Scope

Patch 469A was not deployed. A later release patch should verify production behavior for:

- guidance-level capability differences
- downward reset confirmation
- image sharing and fallback
- absence of saved-recipe/copy/share-link UI
- no API, account, session, cloud or database writes
