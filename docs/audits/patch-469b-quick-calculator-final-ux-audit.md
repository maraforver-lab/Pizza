# Patch 469B: Final Quick Calculator UX Audit

## 1. Executive Summary

Patch 469B audited the public `/calculator/quick` experience after Patch 469A. The audit covered Beginner, Enthusiast and Pizza Nerd states at `390x844`, `430x740`, `1280x900` and `1440x900`.

Final recommendation: **Approved for release**.

The redesigned calculator now matches the intended level model:

- Beginner behaves like a simple pizza dough assistant.
- Enthusiast behaves like a practical home-pizza workbench.
- Pizza Nerd behaves like a professional technical workspace.

No calculator engine, formula, default, validation, storage, session, API, database or Pizza Plan code was changed for this audit.

## 2. Beginner Evaluation

Product question: can a beginner understand "I choose how many pizzas I want, and DoughTools gives me the dough recipe"?

Result: **Yes**.

What works:

- The first screen is calm and task-specific.
- The only editable recipe control is `Number of pizzas`.
- Technical controls are absent, not merely pushed lower.
- The Live Recipe is immediately understandable: dough balls, total dough, flour, water, salt and yeast are visible before any editing task.
- The guidance note clearly explains the model: `Choose how many pizzas you want to make. DoughTools uses a reliable recommended recipe.`
- The next steps are compact and useful: Dough Guide and Pizza Plan handoffs remain secondary.

Beginner feels like a recipe assistant rather than a calculator. There is no visible hydration, yeast-type selector, fermentation selector, sizing system, preferment, baker's percentage table or assumptions disclosure.

Non-blocking observation:

- On mobile, `Share recipe` appears before the pizza-count control. This is acceptable because the recipe is already valid at default settings, but a future polish pass could test whether beginners expect the count control before sharing.

## 3. Enthusiast Evaluation

Product question: can an experienced home pizza maker quickly adjust hydration, fermentation, salt, dough weight and yeast?

Result: **Yes**.

What works:

- Dough-ball weight is visible beside pizza count.
- Fermentation duration and room/cold controls are visible.
- Hydration, salt and extra dough are open by default.
- Yeast type is available through `Change yeast and temperature`.
- Exact technical temperature is intentionally not exposed.
- Size/shape systems, preferments, flour tools, dough-temperature tools, baker's percentages and assumptions remain hidden.

Enthusiast is meaningfully distinct from both Beginner and Pizza Nerd. It is not just Beginner with more copy, and it does not expose the advanced workspace.

Non-blocking observation:

- The `Change yeast and temperature` summary mentions temperature even though Enthusiast cannot edit exact temperature. The intro clarifies this: `Set yeast type without exposing technical temperature controls.` This is acceptable, but wording could be tightened later if owner review finds it distracting.

## 4. Pizza Nerd Evaluation

Product question: can an advanced user access preferments, temperature tools, flour tools, custom ingredients, percentages and assumptions?

Result: **Yes**.

What works:

- Hydration/salt/extra dough is open.
- Yeast and exact fermentation temperature is open.
- Baker's percentages are open.
- Pizza size and shape, preferments, dough-temperature/flour tools and calculation assumptions are available through clear disclosures.
- Deep groups are collapsed unless active, so mobile remains usable.
- Technical values stay below the Live Recipe hierarchy and do not outrank ingredient amounts.

Pizza Nerd feels like a professional workspace without becoming chaotic. The result remains visually dominant, and the technical workspace is organized by task.

Non-blocking observation:

- The mobile Pizza Nerd page is naturally long (`4400-4606 px`), but the length is caused by deliberately available technical capability. It is not a blocker because deep sections remain grouped and named.

## 5. Share Recipe Evaluation

Result: **Approved**.

The share image implementation creates a local `1080 x 1350` PNG containing:

- DoughTools branding
- `Dough recipe`
- dough-ball summary
- total dough
- flour
- water
- salt
- yeast
- fermentation summary
- optional hydration for Enthusiast and Pizza Nerd
- `Planned with DoughTools`
- `doughtools.app`

Browser result:

- In the in-app browser, `Share recipe` returned `Recipe image shared.`
- No console errors or hydration warnings occurred.
- No upload, API write, account write, session write or database write was observed in source or tests.

Fallback limitation:

- The in-app browser supported native sharing, so the fallback preview could not be visually forced in that browser without changing code or browser capability. Fallback behavior is covered by source inspection and focused tests from Patch 469A: preview dialog, generated image, `Save image` and `Close`.

UX assessment:

- The generated image is substantially more shareable than plain text because it has a focused portrait layout, branded framing and the key dough quantities in one readable object.
- It feels like a DoughTools product feature rather than a generic browser share.

## 6. Saved Recipe Removal Verification

Result: **Passed**.

Verified absent in all audited states:

- `Save recipe`
- Saved Calculator Recipes
- saved-recipe empty state
- Load/Rename/Duplicate/Delete recipe actions
- Copy recipe
- share-link copy action
- Reset calculator

Source verification:

- Public `QuickDoughCalculator` no longer imports the saved-recipe storage key.
- Public `QuickDoughCalculator` no longer imports saved-recipe read/write helpers.
- Existing legacy storage helpers remain in the repository for compatibility and tests.
- Existing localStorage data is not cleared, migrated or deleted.

## 7. Guidance Switching Results

Tested path:

1. Beginner
2. Enthusiast
3. Set pizza count to `6`
4. Set dough-ball weight to `280 g`
5. Pizza Nerd
6. Activate Poolish
7. Move down to Enthusiast
8. Confirm practical reset
9. Move down to Beginner
10. Confirm recommended reset

Results:

- Beginner to Enthusiast preserved pizza count.
- Enthusiast to Pizza Nerd preserved pizza count and dough-ball weight.
- Activating Poolish in Pizza Nerd triggered the Enthusiast confirmation on downgrade.
- `Use practical settings` removed the Poolish-only setting and preserved pizza count, dough-ball weight and practical values.
- Downgrading to Beginner triggered `Use Beginner recommended settings?`.
- `Use recommended settings` preserved pizza count `6`, reset dough-ball weight to `260 g`, removed hidden technical values and recalculated total dough.
- No silent hidden values affected Beginner after confirmation.

Observed values:

| State | Pizza count | Dough-ball summary | Total dough | Hidden technical state |
| --- | ---: | --- | --- | --- |
| Edited Enthusiast | 6 | 6 dough balls x 280 g | 1,730 g | none |
| Pizza Nerd + Poolish | 6 | 6 dough balls x 280 g | 1,730 g | Poolish active |
| After Enthusiast confirmation | 6 | 6 dough balls x 280 g | 1,730 g | Poolish reset |
| After Beginner confirmation | 6 | 6 dough balls x 260 g | 1,607 g | unavailable controls absent |

## 8. Mobile Measurements

Measured against local production rendering.

| Viewport | Level | Page title top | Guidance top | Live Recipe top | Ingredient top | Pizza-count top | Share top | Height |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 390x844 | Beginner | 105 px | 193 px | 374 px | 598 px | 1199 px | 945 px | 2162 px |
| 390x844 | Enthusiast | 105 px | 253 px | 326 px | 550 px | 1159 px | 905 px | 3308 px |
| 390x844 | Pizza Nerd | 105 px | 253 px | 326 px | 550 px | 1159 px | 905 px | 4606 px |
| 430x740 | Beginner | 105 px | 193 px | 350 px | 537 px | 1137 px | 883 px | 2080 px |
| 430x740 | Enthusiast | 105 px | 253 px | 326 px | 513 px | 1121 px | 867 px | 3170 px |
| 430x740 | Pizza Nerd | 105 px | 253 px | 326 px | 513 px | 1121 px | 867 px | 4400 px |

Compared with the old pre-469A Beginner baseline of roughly `5000+ px`, current Beginner height is:

- `2162 px` at `390x844`, about a `57%` reduction versus 5000 px.
- `2080 px` at `430x740`, about a `58%` reduction versus 5000 px.

Mobile findings:

- No horizontal overflow.
- No tiny clipped controls observed.
- Beginner has no technical overload.
- Buttons are large enough to tap.
- Share recipe is visible and usable.
- Beginner meets the intended "short, clear, non-technical" target.

## 9. Desktop Findings

Measured against local production rendering.

| Viewport | Level | Page title top | Guidance top | Live Recipe top | Ingredient top | Pizza-count top | Share top | Height |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1280x900 | Beginner | 113 px | 177 px | 334 px | 527 px | 484 px | 874 px | 1327 px |
| 1280x900 | Enthusiast | 113 px | 213 px | 286 px | 519 px | 436 px | 874 px | 1722 px |
| 1280x900 | Pizza Nerd | 113 px | 213 px | 286 px | 519 px | 436 px | 874 px | 2719 px |
| 1440x900 | Beginner | 113 px | 177 px | 334 px | 527 px | 484 px | 874 px | 1327 px |
| 1440x900 | Enthusiast | 113 px | 213 px | 286 px | 519 px | 436 px | 874 px | 1722 px |
| 1440x900 | Pizza Nerd | 113 px | 213 px | 286 px | 519 px | 436 px | 874 px | 2719 px |

Desktop findings:

- Beginner has no empty technical workspace; recipe and count control dominate.
- Enthusiast is a practical workbench with usable density.
- Pizza Nerd exposes a complete technical workspace without cramped columns.
- The result panel remains visually important.
- No horizontal overflow.
- No unnecessary page-level imagery or asset loading.

## 10. Accessibility Findings

Result: **Pass with minor future polish optional**.

Verified:

- Guidance selector uses native buttons with `aria-pressed`.
- Selected guidance state is conveyed in text and semantics, not color alone.
- Numeric controls have labels and increase/decrease accessible names.
- Disclosures are keyboard reachable through native `details/summary`.
- Share status uses status/alert behavior.
- Confirmation modal and share preview modal use dialog semantics.
- Image preview includes descriptive alt text.
- No visible action depends only on color.

Optional polish:

- Some compound option buttons concatenate heading and description in accessible text, for example `Room temperatureRoom temperature · 22 C`. This is not blocking, but future polish could tune accessible labels for cleaner screen-reader output.

## 11. Performance Findings

Result: **Pass**.

Findings:

- No page imagery is loaded for the calculator.
- Share image generation is local and only starts after clicking `Share recipe`.
- No large dependency or remote image service was introduced.
- No layout shift was visible during route load.
- No console errors or hydration warnings were observed in the final browser matrix.
- Native sharing completed without blocking initial page load.

## 12. Remaining Issues

Blocking UX issues: **none**.

Optional polish:

- Consider whether Beginner should show the pizza-count control before `Share recipe`, even though the current recipe is valid immediately.
- Consider slightly clearer Enthusiast wording for `Change yeast and temperature`, since Enthusiast changes yeast but not exact temperature.
- Consider refining compound accessible names for option buttons.
- Visually verify fallback preview in a browser/environment where native file sharing is unavailable.

## 13. Final Recommendation

**Approved for release.**

Patch 469A meets the approved product direction. The calculator now changes interface and available controls by guidance level, preserves canonical calculation logic, removes saved-recipe clutter, replaces copy/share-link actions with a more polished recipe-image sharing feature and keeps the public page mobile-readable.

No redesign or correction patch is required before release. Optional polish can be deferred until after production review.
