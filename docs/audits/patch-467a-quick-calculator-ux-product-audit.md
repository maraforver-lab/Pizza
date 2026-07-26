# Patch 467A: Quick Calculator UX and Product Audit

## 1. Executive Summary

The public Quick Dough Calculator at `/calculator/quick` is technically strong and product-safe. It uses the shared dough engine, keeps saved recipes local to the browser, restores calculator state from an isolated `quick` query parameter, and does not create Pizza Plan, session, Shopping, Timeline, Kitchen, Review, account, API, database or cloud data.

The main product problem is not mathematical. The problem is hierarchy. The calculator currently contains a complete expert workbench, a teaching result panel, a guidance-level control, local recipe management, sharing and a Pizza Plan handoff on one page. Desktop works reasonably because the sticky result panel stays visible. Mobile is much weaker: at 390x844 the main result panel starts around 3,595 px from the top for Beginner, 4,053 px for Enthusiast and 4,107 px for Pizza Nerd. The first viewport shows page identity and pizza/sizing controls, but not the actual ingredient recipe.

The strongest direction is a hybrid of Concept A and Concept C:

- mobile should become an "Instant Recipe" experience with a compact live result capsule before the full controls
- desktop should remain a "Calculator Workbench" with a clearer input/result split
- advanced controls, preferments, temperature tools and saved recipes should remain available, but should not compete with the first recipe result

Recommended follow-up:

1. Patch 467B: build three Admin-only visual prototypes.
2. Patch 467C: compare prototypes and approve one final specification.
3. Patch 467D: implement the approved public UX while preserving the current engine and persistence contract.

## 2. Current Feature Inventory

| Feature | Current source | Classification | Notes |
| --- | --- | --- | --- |
| Route shell | `app/calculator/quick/page.tsx` | navigation or learning handoff | Thin route that renders `QuickDoughCalculator`. |
| Shared calculation | `lib/quick-calculator/quick-dough-calculator.ts` | core calculation engine | Calls `calculateDoughIngredients`; no duplicate dough formula. |
| Pizza style preset | `quickPizzaStylePresets` | contextual input | Neapolitan, New York, Roman round, Detroit, Sicilian, Custom. |
| Sizing mode | `QuickPizzaSizingMode` | core quick-calculation input | Ball weight, diameter, pan dimensions, custom dough weight. |
| Pizza or pan count | `pizzaCount` | core quick-calculation input | 1 to 50. |
| Dough-ball weight | `doughBallWeightGrams` | core quick-calculation input | 100 to 1000 g. |
| Round diameter | `diameterCm` | contextual input | Visible only in round sizing mode. |
| Thickness factor | `thicknessFactor` | advanced/contextual input | Used to derive round dough weight. |
| Pan width and length | `panWidthCm`, `panLengthCm` | contextual input | Visible only in pan sizing mode. |
| Dough loading | `doughLoadingGramsPerSquareCm` | advanced/contextual input | Used to derive pan dough weight. |
| Custom dough weight | `customDoughWeightGrams` | contextual input | Visible only in custom sizing mode. |
| Hydration | `hydrationPercent` | advanced input for Beginner, normal input for Enthusiast/Pizza Nerd | Calculation-affecting. |
| Salt | `saltPercent` | advanced input for Beginner, normal input for Enthusiast/Pizza Nerd | Calculation-affecting. |
| Extra dough | `wastePercent` | advanced input | Calculation-affecting. |
| Fermentation duration | `fermentationDuration` | core quick-calculation input | 6h, 12h, 24h, 48h. |
| Fermentation environment | `fermentationEnvironment` | core quick-calculation input | Room or cold; updates default temperature. |
| Fermentation temperature | `fermentationTemperatureCelsius` | contextual/advanced input | Calculation-affecting through recipe settings. |
| Yeast type | `yeastType` | contextual/advanced input | Instant dry, active dry, fresh, stiff starter, liquid starter. |
| Preferment method | `prefermentMethod` | advanced input | Direct, poolish, biga, levain. |
| Preferment flour/hydration/inoculation | preferment fields | advanced input | Visible after preferment selection. |
| Target dough temperature and water temperature tools | `advanced-dough-tools.ts` | support information and advanced input | Does not change ingredient formula. |
| Yeast converter | `convertQuickYeast` | support information | Commercial yeast conversion only. |
| Reverse fermentation | `calculateQuickReverseFermentation` | support information | Estimates target yeast, separate from main formula. |
| Custom ingredients | oil, sugar, malt fields | advanced input and calculated output | Optional, local to Quick Calculator. |
| Flour blend | flour blend fields | support information | Splits flour grams, does not change base formula. |
| Total dough | `result.ingredients.total` | calculated output | Primary result. |
| Dough balls | `result.input.pizzaCount` | calculated output | Primary result. |
| Dough ball weight | `result.sizing.doughWeightPerPieceGrams` | calculated output | Primary result. |
| Flour, water, salt, yeast | `ingredientRows` | calculated output | Main product output. |
| Baker's percentages | `bakerPercentages` | educational/technical output | Open by default for non-simple result detail. |
| Preferment split | `preferment` | educational/technical output | Open only when method is not direct. |
| Working assumptions | result details | educational/support output | Always available in result panel. |
| What these numbers mean | `quickResultTeachingCopy` | educational output | Selected guidance-level copy only. |
| What to do next | `quickResultNextSteps` | educational output | Static shared next steps plus Dough guide link. |
| Copy recipe | `buildQuickRecipePlainText` | sharing action | Clipboard only. |
| Reset calculator | local state reset | recipe-management action | Does not clear saved recipes. |
| Save recipe | `saveQuickCalculatorRecipe` | recipe-management action | Browser-local only. |
| Load recipe | `loadSavedRecipe` | recipe-management action | Loads saved local preset into current calculator. |
| Rename recipe | `renameQuickCalculatorSavedRecipe` | recipe-management action | Browser-local only. |
| Duplicate recipe | `duplicateQuickCalculatorSavedRecipe` | recipe-management action | Browser-local only. |
| Delete recipe | `deleteQuickCalculatorSavedRecipe` | recipe-management action | Browser-local only. |
| Copy share link | `buildQuickCalculatorShareUrl` | sharing action | Uses `/calculator/quick?quick=...`. |
| Pizza Plan CTA | `/session/start` | navigation handoff | Explicitly says the preset is not imported. |
| Guidance preference | `doughtools.experienceLevel` | educational-depth control | Changes presentation, not calculation. |

## 3. Current Information Architecture

Current source order:

1. Page shell and hero.
2. Small batch summary.
3. Pizza and batch controls.
4. Formula controls or Beginner disclosure.
5. Fermentation controls.
6. Preferment controls.
7. Sticky result panel on desktop, stacked result panel on mobile.
8. Advanced dough tools or disclosure.
9. Local save/share management.
10. Pizza Plan handoff.
11. Guidance preference section.
12. Footer.

Current functional order is not the same as the user's likely task order. A first-time user wants a recipe result quickly, but on mobile the actual ingredient list appears after several large control groups.

Information that must be visible immediately:

- page identity
- the default recipe is already calculated
- essential editable choices: quantity, portion size, time and fermentation environment
- total dough, per-ball weight and ingredient amounts

Information that can move behind clearer disclosures:

- pizza style presets beyond the selected default
- sizing alternatives after the chosen mode
- hydration, salt and extra dough for Beginner
- preferments
- water-temperature tools
- yeast converter
- reverse fermentation
- custom ingredients
- flour blend
- local recipe library
- full technical assumptions

## 4. Mobile Audit

Browser coverage:

| Viewport | Level | Document height | Result panel top | Save/share top | Horizontal overflow | Selected-level result |
| --- | --- | ---: | ---: | ---: | --- | --- |
| 390x844 | Beginner | 7,827 px | 3,595 px | 6,060 px | No | Beginner copy only |
| 430x740 | Beginner | 7,627 px | 3,563 px | 5,932 px | No | Beginner copy only |
| 390x844 | Enthusiast | 8,414 px | 4,053 px | 6,646 px | No | Enthusiast copy only |
| 430x740 | Enthusiast | 8,214 px | 3,997 px | 6,518 px | No | Enthusiast copy only |
| 390x844 | Pizza Nerd | 11,474 px | 4,107 px | 9,707 px | No | Pizza Nerd copy only |
| 430x740 | Pizza Nerd | 11,246 px | 4,083 px | 9,527 px | No | Pizza Nerd copy only |

Mobile strengths:

- no horizontal overflow at 390 or 430 px
- numeric controls are large enough to tap
- option buttons are clear
- selected guidance copy is correctly filtered
- shared URL state restores and normalizes values
- invalid URL values normalize safely

Mobile problems:

- the actual ingredient result is too far down the page
- the first viewport does not feel faster than PizzApp+
- the page starts like a configuration worksheet, not a quick calculator
- the hero summary shows "Batch" and "Total dough", but not flour, water, salt or yeast
- Pizza Nerd mobile becomes very long because every advanced section is visible or expanded by default
- save/share is too late for reusable utility behavior
- guidance preference lives at the bottom, but the top "Change" button scrolls the user down to it
- first-use users must understand pizza style, sizing mode and derived dough size before seeing the full recipe

## 5. Desktop Audit

Browser coverage:

| Viewport | Level | Document height | Result panel top | Save/share top | Horizontal overflow |
| --- | --- | ---: | ---: | ---: | --- |
| 1280x900 | Beginner | 3,558 px | 370 px | 2,392 px | No |
| 1440x900 | Beginner | 3,558 px | 370 px | 2,392 px | No |
| 1280x900 | Enthusiast | 3,684 px | 370 px | 2,518 px | No |
| 1440x900 | Enthusiast | 3,684 px | 370 px | 2,518 px | No |
| 1280x900 | Pizza Nerd | 5,151 px | 370 px | 3,985 px | No |
| 1440x900 | Pizza Nerd | 5,151 px | 370 px | 3,985 px | No |

Desktop strengths:

- sticky dark result panel makes the recipe feel important
- first desktop viewport shows inputs and results together
- wide layout has enough room for style and sizing comparisons
- technical details are useful for Pizza Nerd users
- no dashboard-level horizontal overflow was observed

Desktop problems:

- the result panel tries to be a recipe, teacher, formula card, technical detail drawer and action area all at once
- input groups and result panel are both visually heavy
- 17 headings/buttons/legends were visible in the first desktop viewport, which makes the workspace feel busy
- the recipe-management section is disconnected from the result it saves
- the guidance selector is not where a returning calculator user expects to manage depth

## 6. First-Viewport Findings

At 390x844 Beginner, before scrolling the user sees:

- `Quick Dough Calculator`
- guidance badge and `Change`
- `What are you making?`
- `Pizza style`
- Neapolitan and New York option cards

They do not see:

- flour amount
- water amount
- salt amount
- yeast amount
- copy/share/save controls
- what to do next

At 1280x900 Beginner, before scrolling the user sees:

- the page title
- style and sizing controls
- the sticky result panel with total dough and ingredient amounts

First-viewport conclusion:

- desktop already approximates a useful workspace
- mobile needs a live recipe capsule or result-first summary near the top
- the guidance selector should not be one of the most prominent early interactions

## 7. Task-Based Usability Findings

### Task A: Fast Common Recipe

Target: 4 pizzas, 260 g each, 24-hour cold fermentation, default hydration and salt.

Current result:

- default state already matches the task: 4 pizzas, 260 g, 64% hydration, 2.8% salt, 24h cold
- build and browser check confirm the default result: total dough 1,071 g, flour 642 g, water 411 g, salt 18 g, instant dry yeast 0.66 g
- desktop time to usable result is near-immediate because result is visible in the first viewport
- mobile time to usable result is slowed by result placement around 3,600 px down the page

### Task B: Change One Practical Variable

Hydration, fermentation temperature and yeast type are accessible. For Beginner, hydration sits behind `Formula details`; yeast type and fermentation temperature sit behind `Fermentation details`. This preserves capability, but the user may not understand that changing hydration or yeast is optional rather than required.

The current labels are accurate. The opportunity is to make the disclosure labels more task-based:

- `Adjust hydration and salt`
- `Change yeast and temperature`

### Task C: Pan Pizza

The pan sizing model is useful and technically flexible. It asks for width, length and dough loading. For a beginner, `dough loading` is not self-explanatory. Pan mode should display a practical translation, for example "thinner" to "thicker" or "lighter pan" to "taller pan", while preserving the existing grams per square centimetre control.

### Task D: Reuse a Recipe

Source inspection confirms save, load, rename, duplicate, delete and share. The browser confirmed save/share section exists and is very low on the page.

Main issue:

- recipe management is treated as a late page section instead of a companion to the result

Recommended future pattern:

- put `Copy recipe`, `Save`, and `Share` near the result
- keep recipe library below or in a drawer
- require confirmation only for delete, if future UX adds risk reduction

## 8. Guidance-Level Findings

Confirmed invariant:

- Beginner, Enthusiast and Pizza Nerd use the same inputs and results
- guidance level changes visible groups, collapsed groups, result detail and teaching copy
- selected-level teaching copy is rendered without non-selected teaching copy
- invalid and missing preferences fall back through canonical utilities

Level differences:

| Level | Current behavior | Good | Problem |
| --- | --- | --- | --- |
| Beginner | Batch and fermentation visible; formula and advanced tools collapsed | fewer decisions | result is still too late on mobile |
| Enthusiast | Formula visible; advanced tools collapsed | practical control | mobile becomes longer without enough early result payoff |
| Pizza Nerd | All variables exposed; technical result detail | efficient for experts on desktop | too long for mobile and save/share falls extremely late |

Recommendation:

- Keep global guidance preference.
- In the calculator, show a compact current-level control, not a large preference block.
- Never hide calculation-affecting capability permanently.
- Let guidance level change explanation density, default-open disclosures and technical details only.

## 9. Progressive-Disclosure Findings

Current disclosure pattern:

- Beginner: formula, fermentation details and advanced tools use `details`.
- Enthusiast: formula visible, advanced tools collapsed.
- Pizza Nerd: advanced tools visible.
- Result details use `details` for baker's percentages, preferment split and working assumptions.

Better disclosure labels:

| Current area | Better label | Recommended state |
| --- | --- | --- |
| Formula details | Adjust hydration, salt and extra dough | collapsed for Beginner, visible for Enthusiast and Pizza Nerd |
| Fermentation details | Change yeast and temperature | collapsed for Beginner and Enthusiast, visible for Pizza Nerd |
| Preferment | Use a preferment | collapsed or compact until selected |
| Advanced dough tools | Dough-temperature, yeast and flour tools | collapsed for Beginner and Enthusiast, visible in workbench mode for Pizza Nerd |
| Baker's percentages | View baker's percentages | collapsed for Beginner, compact for Enthusiast, visible for Pizza Nerd |
| Working assumptions | View calculation assumptions | collapsed for all, with warning badge if unusual values are active |

Do not remove capabilities. Remove equal visual weight.

## 10. Result-Panel Findings

Current result strengths:

- `Total dough`, `Dough balls`, `Dough ball weight` are prominent
- ingredient rows are readable
- yeast amount is precise
- formula and next steps were improved by Patch 458D
- copy/reset actions are clear

Current result weaknesses:

- mobile placement undermines all of the above
- result panel contains too many different jobs
- `What these numbers mean`, `Your dough formula`, `What to do next`, baker's percentages and assumptions all compete with ingredient amounts
- save/share is not attached to the result

Recommended result hierarchy:

### Beginner

1. Total dough.
2. Dough balls and dough ball weight.
3. Flour, water, salt, yeast.
4. One practical sentence: "Weigh these ingredients, mix until no dry flour remains, then ferment as planned."
5. Copy, Save, Share.
6. Link to Dough guide.

### Enthusiast

1. Same ingredient hierarchy.
2. Fermentation assumption.
3. Hydration and yeast interpretation.
4. Compact baker's percentages.
5. Copy, Save, Share.

### Pizza Nerd

1. Same ingredient hierarchy.
2. Baker's percentages and yeast percent.
3. Preferment split and assumptions if active.
4. Temperature tools and formula helpers close to related controls.
5. Copy, Save, Share.

## 11. Save, Load and Share Findings

Storage and URL contract:

- saved recipes key: `doughtools.quick-calculator.recipes.v1`
- share parameter: `quick`
- max saved recipes: 20
- malformed saved data is ignored
- query share state is normalized through `normalizeQuickCalculatorInput`

Browser checks:

- shared URL restored a custom state: 2 pizzas, 300 g, 70% hydration, active dry yeast, 12h room
- invalid URL values normalized safely to clamped defaults
- no account, session or cloud writes occur

UX findings:

- Save/share being after advanced tools makes reuse feel secondary
- copy recipe is inside the result panel, but share link is far below it
- saved recipe list uses inline rename fields, which is powerful but can make each saved item look editable all the time
- duplicate and delete are available with equal proximity to load

Recommendation:

- result-level actions: Copy, Save, Share
- recipe library: Load, Rename, Duplicate, Delete
- consider a compact saved-recipes drawer or side tray in prototypes

## 12. Accessibility Findings

Strengths:

- real buttons, inputs, selects and details/summary elements
- visible focus styles are present in source
- selected option buttons use `aria-pressed`
- guidance option radios use native inputs on mobile
- result panel uses `aria-live="polite"`
- no color-only level filtering was observed

Issues or risks:

- many buttons are repeated plus/minus controls, which increases focus-stop count
- full page focus order is long before save/share actions
- dark result panel contains many nested sections; screen-reader users may need a clearer result landmark hierarchy
- `details` content is present in DOM even when collapsed, which is normal HTML behavior but means the audit should not treat "DOM presence" as the same as selected-level exposure
- guidance "Change" can scroll the user far down the page

Accessibility recommendation:

- add a compact result landmark near the top on mobile
- keep disclosures specific and descriptive
- ensure future visual prototypes measure keyboard focus count for Task A and Task D

## 13. Performance Findings

Build output for unchanged current source:

- `/calculator/quick`: 18.7 kB route size, 124 kB first load JS
- focused Quick Calculator tests: 2 files, 61 tests passed
- production build completed successfully
- browser console: no warnings or errors captured during local checks

Performance risks are primarily UX performance rather than bundle size:

- mobile page height exceeds 7,800 px for Beginner and 11,400 px for Pizza Nerd
- repeated heavy cards create scroll work
- sticky result is helpful on desktop but cannot solve mobile
- save/share is too far away for repeat use

## 14. PizzApp+ Benchmark

Sources:

- [PizzApp+ on the Apple App Store](https://apps.apple.com/us/app/pizzapp/id1228158792)
- [PizzApp+ on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=fisico.pizzapp)

Verified public facts:

- PizzApp+ is a free dough calculator app.
- The official store description says it computes ingredients for selected dough features and suggests yeast amount.
- The official store description says it can save, reload and share recipes.
- Google Play listed an Aug 24, 2025 update during this audit.
- Apple App Store listed 185 ratings and 4.4 stars during this audit.
- A visible App Store review praised speed and requested finer dough-ball increments, editable yeast percentages and advanced settings around biga/poolish.

Inferred product strengths:

- raw calculation speed
- compactness
- familiar native app flow
- low decision count for repeat users
- saved recipe reuse
- yeast-by-time-and-temperature reputation among pizza makers

Likely weaknesses DoughTools can beat:

- little practical teaching after the numbers
- advanced settings discoverability can be a pain point
- settings and recipe reuse are powerful but not necessarily explanatory
- result may be efficient without telling a beginner what to do next

Important caution:

- Do not copy PizzApp+ layout, copy or visual assets.
- The point is to beat its speed while adding DoughTools' practical teaching and privacy-respecting web behavior.

## 15. Other Competitor Benchmark

| Competitor | Source | Strengths to learn from | Weaknesses to avoid |
| --- | --- | --- | --- |
| Pizzapp Lab | [App Store](https://apps.apple.com/us/app/pizzapp-lab/id6757201566) | positions calculator as a recipe journal; notes and iteration are central | diary/product scope can become heavier than a quick calculation |
| Ooni App calculator | [Ooni help center](https://ooni.com/pages/help-center?a=How-to-use-the-Ooni-App-dough-calculator---id--OPXZQvqyS1CkmHs4CIQKtQ) | strong brand trust, oven ecosystem, practical app framing | calculator is inside a broader product ecosystem and may not be the fastest standalone web answer |
| Stadler Made calculator | [Stadler Made](https://www.stadlermade.com/pizza-calculator/) | save calculation, notes, pictures, community, pan calc and advanced tools | account/member prompts and many surrounding product surfaces can interrupt the calculation job |
| PizzaCreator | [PizzaCreator](https://www.pizzacreator.net/) | many controls, advanced mode, dimension sizing, flour brand | first screen is a dense control sheet; little beginner guidance |
| Jordo's Pizza Calculator | [Pizza Dough Calculator](https://jordospizzacalculator.com/) | clear marketing claim, styles, poolish/biga/sourdough, timeline story, no signup claim | long page around calculator; affiliate/guide content can distract from immediate calculation |
| PizzaBlab | [PizzaBlab calculator](https://www.pizzablab.com/calculators/pizza-dough-calculator/) | explicit yeast prediction by time and temperature | article-like framing can delay direct calculator use |

Benchmark conclusion:

- PizzApp+ is the speed benchmark.
- PizzaCreator and Stadler are breadth benchmarks.
- Pizzapp Lab is the reuse/journal benchmark.
- Ooni is the trust/ecosystem benchmark.
- DoughTools should combine speed, practical next steps and transparent local-first behavior without becoming a bloated planner.

## 16. DoughTools Differentiation

DoughTools can be meaningfully better by being:

- as fast as a compact calculator for the first ingredient result
- clearer than PizzApp+ about what the numbers mean
- calmer than control-dense web calculators
- more privacy-respecting than account-first tools
- better connected to dough, sauce, toppings and ovens learning
- explicit that Quick Calculator does not create Pizza Plan data
- strong for repeat users without overwhelming first-time users
- honest about assumptions, temperature and yeast without hiding controls

The differentiator should be:

> instant numbers plus practical confidence.

Not:

> more controls than everyone else.

## 17. Improvement Ideas

| # | Area | User problem | Proposed solution | Intended user | Mobile impact | Desktop impact | Complexity | UX impact | Recommendation |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | first-use clarity | result is below the fold on mobile | add live result capsule under hero | all | high | medium | medium | high | pursue |
| 2 | first-use clarity | user may not know defaults already work | label default as "ready to use" | Beginner | high | medium | low | high | pursue |
| 3 | first-use clarity | page starts with style choices, not recipe | place essential result before style grid on mobile | Beginner | high | low | medium | high | prototype |
| 4 | first-use clarity | pizza style choice can feel mandatory | show selected style as a row with "change style" | Beginner | high | medium | medium | high | prototype |
| 5 | mobile ergonomics | too many option cards early | convert style and sizing to compact rows or segmented controls | all | high | medium | medium | high | pursue |
| 6 | mobile ergonomics | plus/minus controls create many focus stops | consider compact steppers with direct value first | all | medium | low | medium | medium | prototype |
| 7 | mobile ergonomics | result and inputs are far apart | sticky bottom result summary while editing | all | high | low | medium | high | prototype |
| 8 | mobile ergonomics | save/share too late | put Copy, Save, Share beside first result | returning users | high | medium | medium | high | pursue |
| 9 | desktop workspace | result panel has too many jobs | split result into primary numbers and secondary tabs/disclosures | all | medium | high | medium | high | pursue |
| 10 | desktop workspace | both columns compete | lighten input cards and keep result as primary output | all | low | high | medium | high | pursue |
| 11 | progressive disclosure | generic "Optional controls" repeats | use specific disclosure labels | all | high | high | low | high | pursue |
| 12 | progressive disclosure | advanced open state changes by level but not by task | add active-setting indicators | Enthusiast/Pizza Nerd | medium | high | medium | medium | prototype |
| 13 | result hierarchy | yeast is not visually special enough | highlight yeast row with precision note | all | high | high | low | high | pursue |
| 14 | result hierarchy | formula teaching competes with ingredients | move formula visualization below ingredient list | Beginner | high | medium | low | medium | pursue |
| 15 | result hierarchy | next steps too generic | level-aware next step: weigh, mix, ferment | all | medium | medium | low | medium | pursue |
| 16 | fermentation | room/cold temperature override is hidden for Beginner | show compact current temp line with "change" | all | high | medium | medium | high | prototype |
| 17 | fermentation | users may not know 24h cold means fridge temp | add fridge/room plain-language helper | Beginner | medium | medium | low | medium | pursue |
| 18 | fermentation | yeast amount precision can feel suspicious | explain tiny yeast scale need near yeast row | Beginner | medium | medium | low | medium | pursue |
| 19 | sizing | pan `dough loading` is technical | add practical thickness language beside g/cm2 | Beginner/Enthusiast | high | medium | low | high | pursue |
| 20 | sizing | custom mode can be unclear | label it "I already know the dough weight" | all | medium | medium | low | medium | pursue |
| 21 | guidance | guidance selector is too prominent in hero | use compact level pill with secondary menu | all | high | medium | low | high | pursue |
| 22 | guidance | level change scrolls to bottom | open a local popover/sheet instead | all | high | medium | medium | high | prototype |
| 23 | save/share | saved recipes are hard to find on mobile | move library into "Saved recipes" drawer | returning users | high | medium | medium | high | prototype |
| 24 | save/share | delete is close to load/duplicate | add confirmation or separate destructive action | returning users | medium | medium | low | medium | pursue |
| 25 | save/share | share URL is hidden under management | expose "Share this recipe" in result actions | all | high | medium | low | high | pursue |
| 26 | warnings | invalid URL values silently normalize | show small "some shared values were adjusted" notice | all | medium | medium | medium | medium | prototype |
| 27 | warnings | extreme values lack practical caution | add non-color-only warning rows near affected controls | all | medium | medium | medium | high | prototype |
| 28 | warnings | tiny yeast amount can be hard to weigh | warn below precision threshold | Beginner/Enthusiast | medium | medium | low | high | pursue |
| 29 | learning | Dough guide link is useful but late | keep one contextual "how to make this dough" link near result | Beginner | high | medium | low | medium | pursue |
| 30 | learning | Pizza Plan handoff might imply import | preserve explicit "does not import preset" copy | all | medium | medium | low | high | pursue |
| 31 | accessibility | too many focus stops | measure focus count and group repeated controls | keyboard users | high | high | medium | high | prototype |
| 32 | accessibility | result has many nested regions | create a clearer result landmark and heading order | screen-reader users | medium | medium | medium | high | pursue |
| 33 | accessibility | color-selected cards need text state | keep aria-pressed and add selected labels where needed | all | medium | medium | low | medium | pursue |
| 34 | performance | mobile scroll height is too long | reduce card count and collapse technical sections | all | high | medium | medium | high | pursue |
| 35 | performance | result panel repeats summaries | remove duplicate summaries from primary flow | all | medium | medium | low | medium | pursue |
| 36 | privacy/trust | local-only behavior is late | move "local only, no session created" trust note near save/share | all | medium | medium | low | medium | pursue |
| 37 | privacy/trust | share URL contains full calculator state | explain share link content in one line | all | medium | medium | low | medium | pursue |
| 38 | desktop workspace | Pizza Nerd needs efficient scanning | add workbench density mode only as presentation | Pizza Nerd | low | high | medium | medium | prototype |

## 18. Concept A: Instant Recipe

Purpose:

- beat PizzApp+ on first useful result
- make the default recipe immediately useful
- keep advanced access but put it below the first output

Mobile first viewport:

- compact title
- `4 pizzas x 260 g`
- live result capsule: total dough, flour, water, salt, yeast
- primary editable rows: pizzas, dough-ball weight, fermentation
- `Copy`, `Save`, `Share`

Mobile scroll sequence:

1. Result capsule.
2. Essential controls.
3. Adjust formula.
4. Change sizing style.
5. Use a preferment.
6. Advanced dough tools.
7. Saved recipes.
8. Learning handoff and footer.

Desktop layout:

- left: compact essential controls
- right: primary result panel
- lower: advanced disclosures and saved recipes

Strengths:

- fastest mobile result
- easiest for Beginner
- strongest PizzApp+ response
- keeps current engine intact

Weaknesses:

- repeat expert users may want more controls visible immediately
- result capsule must avoid becoming a second result panel

Risks:

- accidentally duplicating result logic in two components
- sticky mobile capsule becoming intrusive

## 19. Concept B: Guided Builder

Purpose:

- help uncertain users answer one practical question at a time
- turn technical fields into a short guided flow

Flow:

1. Pizza and quantity.
2. Time and temperature.
3. Formula and method.
4. Recipe result.

Mobile:

- app-like stages
- persistent mini result preview after first stage
- Back preserves all values
- advanced settings in stage-specific drawers

Desktop:

- not a giant wizard
- left stage navigation, center current group, right live result

Strengths:

- best for true beginners
- clearer decision order
- good accessibility if focus is well-managed

Weaknesses:

- slower than PizzApp+ for repeat users
- more implementation risk
- could feel too much like Pizza Plan

Risks:

- accidentally creating a second workflow
- overstepping the "Quick" role
- hiding too much behind steps

## 20. Concept C: Calculator Workbench

Purpose:

- support repeat users, Enthusiasts and Pizza Nerds
- make inputs and results feel like one professional workspace

Desktop:

- refined two-pane workspace
- primary result stays sticky and shorter
- editable sections show active-setting indicators
- technical details sit near related controls
- saved recipe library is a side tray or bottom drawer

Mobile:

- stacked sections with an input/result switcher or sticky result capsule
- essential controls first, then grouped editing areas
- advanced tools remain accessible but not expanded unless selected level or active values require it

Strengths:

- most consistent with current architecture
- excellent for returning users
- lower risk than a guided builder

Weaknesses:

- weaker first-time handholding than Concept B
- must be carefully compacted to avoid current mobile length

Risks:

- can remain too expert-oriented if the result is not moved earlier on mobile

## 21. Responsive Wireframes

### Concept A: Instant Recipe

390x844:

```text
[Header]
Quick Dough Calculator
Get dough amounts fast.

[LIVE RECIPE]
Total dough 1071 g
Flour 642 | Water 411
Salt 18 | Yeast 0.66
[Copy] [Save] [Share]

Pizzas        [-] 4 [+]
Dough ball    [-] 260 g [+]
Fermentation  24h cold [Change]

[Adjust hydration and salt]
[Use diameter, pan size or custom weight]
[Use a preferment]
[Dough-temperature and yeast tools]
[Saved recipes]
[Learn dough] [Plan a pizza]
[Footer]
```

430x740:

```text
[Header]
Quick Dough Calculator
[Result capsule: Total, balls, yeast]
[Pizzas] [Ball weight]
[Fermentation row]
[Formula disclosure]
[Sizing disclosure]
[Actions]
[Advanced]
[Saved]
[Footer]
```

1280x900:

```text
[Header]
Quick Dough Calculator       [Result: primary ingredients]
[Essential controls]         [Copy Save Share]
[Formula disclosure]         [What these numbers mean]
[Sizing disclosure]          [Technical details collapsed]
[Preferment disclosure]
[Advanced tools]
[Saved recipes]
[Footer]
```

1440x900:

```text
[Header]
[Title + compact guidance]     [Recipe result panel, sticky]
[Essential controls grid]      [Ingredient amounts]
[Formula + fermentation]       [Copy Save Share]
[Sizing + preferment]          [Next step]
[Advanced tools full width]
[Saved recipes drawer/section]
[Footer]
```

### Concept B: Guided Builder

390x844:

```text
[Header]
Quick Dough Calculator
Step 1 of 4: Pizza and quantity
[Mini result: 4 x 260 g]

[Pizza style row]
[Pizzas stepper]
[Dough-ball weight]
[Next: Time and temperature]
[Result preview]
[Footer after result]
```

430x740:

```text
[Header]
[Progress: 1 Pizza -> 2 Time -> 3 Formula -> 4 Result]
[Current question]
[Controls]
[Mini result]
[Back] [Next]
```

1280x900:

```text
[Header]
[Stage list] [Current stage controls] [Live result]
             [Optional controls]      [Copy Save Share]
             [Result explanation]
[Footer]
```

1440x900:

```text
[Header]
[Compact progress rail] [Wide current stage] [Sticky result]
[Saved recipes compact link]
[Advanced drawer]
[Footer]
```

### Concept C: Calculator Workbench

390x844:

```text
[Header]
Quick Dough Calculator
[Sticky mini result: total + yeast]

[What are you making?]
[How many?]
[When will it ferment?]
[Result panel]
[Formula]
[Sizing]
[Preferment]
[Advanced tools]
[Saved recipes]
[Footer]
```

430x740:

```text
[Header]
[Title]
[Mini result capsule]
[Input sections as compact rows]
[Full result]
[Save/share]
[Advanced accordions]
[Footer]
```

1280x900:

```text
[Header]
[Title + compact level]       [Short sticky result]
[Batch controls]              [Ingredients]
[Formula controls]            [Copy Save Share]
[Fermentation controls]       [Assumptions collapsed]
[Preferment controls]
[Advanced tools]
[Saved recipe tray]
[Footer]
```

1440x900:

```text
[Header]
[Workspace title]             [Result rail]
[Inputs: batch/formula/time]  [Ingredients + actions]
[Method and sizing]           [Technical drawer]
[Advanced workbench]
[Saved recipes]
[Footer]
```

## 22. Concept Comparison Matrix

Scores: 1 weak, 5 strong.

| Criterion | Concept A | Why A | Concept B | Why B | Concept C | Why C |
| --- | ---: | --- | ---: | --- | ---: | --- |
| Time to first result | 5 | result-first | 3 | staged | 4 | mini result plus workspace |
| Beginner clarity | 4 | quick and direct | 5 | guided questions | 3 | still calculator-like |
| Returning-user speed | 5 | fewest obstacles | 3 | stage flow slows experts | 5 | direct control |
| Pizza Nerd efficiency | 3 | advanced below | 3 | too guided | 5 | expert workbench |
| Mobile one-hand use | 5 | compact rows | 4 | stage actions | 3 | depends on compression |
| Desktop efficiency | 4 | good but simple | 3 | wizard risk | 5 | strongest desktop |
| Control discoverability | 4 | named disclosures | 4 | staged controls | 4 | grouped sections |
| Result readability | 5 | primary result | 4 | result preview plus final | 4 | strong but denser |
| Save/load usability | 4 | near result | 3 | late unless designed carefully | 4 | side tray works |
| Accessibility | 4 | fewer focus stops | 4 | clear stages | 3 | many controls |
| Implementation risk | 4 | moderate UI refactor | 2 | largest behavior-feel change | 4 | closest to current |
| Maintainability | 4 | clear hierarchy | 3 | stage orchestration | 4 | maps to current components |
| Ability to outperform PizzApp+ | 5 | speed plus teaching | 3 | slower than app | 4 | better for experts |
| DoughTools consistency | 4 | action-first | 4 | guided confidence | 4 | desktop workspace |
| Risk of accidental engine changes | 4 | can use adapter | 3 | flow state risk | 5 | closest to current |

Do not pick by total alone. Concept A wins the public first-use problem. Concept C protects expert efficiency and implementation safety.

## 23. Recommended Final Direction

Recommended direction:

> Hybrid: Concept A for mobile first-result hierarchy, Concept C for desktop workbench.

Exact mobile hierarchy:

1. Header and compact page title.
2. Live recipe capsule with total dough, flour, water, salt and yeast.
3. Copy, Save and Share.
4. Essential controls: quantity, portion size, fermentation time/environment.
5. Contextual controls: sizing mode, style, pan dimensions, diameter.
6. Advanced controls: hydration/salt, yeast/temperature, preferment, dough-temperature tools, custom ingredients, flour blend.
7. Saved recipe library.
8. Dough guide and explicit Pizza Plan handoff.
9. Footer.

Exact desktop hierarchy:

1. Compact workspace heading and current guidance pill.
2. Left/main input workspace.
3. Right sticky result rail with ingredient amounts and actions.
4. Technical details attached to result rail or related input group.
5. Advanced tools full-width below primary task.
6. Saved recipe library below or in side tray.
7. Pizza Plan handoff.
8. Footer.

Essential controls:

- pizza or pan count
- dough-ball weight or current sizing method
- fermentation duration
- fermentation environment

Contextual controls:

- pizza style
- sizing mode
- diameter
- pan width and length
- custom dough weight
- fermentation temperature
- yeast type

Advanced controls:

- hydration
- salt
- extra dough
- preferment configuration
- target dough temperature and water estimate
- yeast converter
- reverse fermentation
- custom ingredients
- flour blend

Result order:

1. Total dough.
2. Dough balls and dough ball weight.
3. Flour.
4. Water.
5. Salt.
6. Yeast/leavener.
7. Active optional ingredients.
8. Fermentation assumption.
9. Level-aware explanation.
10. Technical details.

Warning model:

- show warnings near affected control and summarized near result
- do not rely on color alone
- explain correction, not only problem
- tiny yeast and extreme hydration/salt values should receive practical notes

Why this is easier than PizzApp+:

- users get ingredient results immediately, without navigating into advanced settings
- default path explains what to do next
- advanced users keep access to the current breadth
- saving and sharing remain local-first and explicit

Why it remains useful for Pizza Nerd:

- all current controls remain available
- technical details remain close to the result
- desktop workbench can expose more without forcing the mobile page to become a dense sheet

## 24. Protected Technical Boundaries

| File | Responsibility | May a visual patch modify it? | Required regression tests if touched |
| --- | --- | --- | --- |
| `lib/dough-calculator.ts` | canonical ingredient calculation | No | full dough calculation regression suite |
| `lib/quick-calculator/quick-dough-calculator.ts` | Quick input normalization, recipe mapping, result construction | No for UI-only work | `tests/quick-calculator.test.ts`, formula equivalence, default and invalid normalization |
| `lib/quick-calculator/pizza-sizing.ts` | style presets and sizing math | No for UI-only work | sizing mode tests, pan/round/custom calculations |
| `lib/quick-calculator/quick-preferments.ts` | direct/poolish/biga/levain split | No for UI-only work | preferment split tests |
| `lib/quick-calculator/advanced-dough-tools.ts` | water temperature, yeast conversion, reverse fermentation, optional ingredient tools | No for UI-only work | advanced tool tests |
| `lib/quick-calculator/quick-calculator-storage.ts` | saved recipe format and share URL contract | No unless a persistence patch is approved | saved/load/rename/duplicate/delete/share round-trip tests |
| `lib/experience-levels.ts` | canonical guidance preference | No unless guidance foundation patch | missing/invalid/storage-denial tests |
| `components/quick-calculator/QuickDoughCalculator.tsx` | current presentation and local UI state | Yes, primary visual scope | focused UI tests plus all Quick Calculator core tests |
| `app/calculator/quick/page.tsx` | route shell and metadata binding | Usually no | route metadata and rendering tests |

## 25. Maximum Three Follow-Up Patches

### Patch 467B: Build three Admin-only Quick Calculator visual prototypes

Scope:

- Admin-only preview routes or a protected prototype surface
- three read-only visual prototypes for Concept A, B and C
- existing calculation result may be represented by fixture data or a read-only adapter if explicitly approved

Exclusions:

- public route change
- engine or persistence changes
- indexing
- database
- Pizza Plan handoff behavior

Acceptance criteria:

- all three concepts visible to Admin
- no public exposure
- no changed calculator output
- responsive previews at 390, 430, 1280 and 1440 widths

### Patch 467C: Compare prototypes and approve one final specification

Scope:

- browser comparison of the three prototypes
- task comparison for Task A-D
- final selected concept or explicit hybrid
- detailed implementation spec

Exclusions:

- no public implementation
- no engine changes

Acceptance criteria:

- one approved final hierarchy
- exact protected boundaries
- final test plan

### Patch 467D: Implement the approved Quick Calculator UX

Scope:

- public `/calculator/quick` presentation
- focused UI tests
- browser validation

Exclusions:

- formulas
- saved recipe schema
- share URL schema
- Pizza Plan/session/workflow data
- APIs/database

Acceptance criteria:

- same numerical outputs for all existing test cases
- same saved recipe and share URL behavior
- mobile result visible early
- desktop workbench remains efficient
- selected guidance behavior remains correct
- no horizontal overflow

## Validation Performed

- Confirmed starting commit: `20ca7049e3ccd6b6527b16f9637cbf1e807b9d4d`.
- Inspected `app/calculator/quick/page.tsx`.
- Inspected `components/quick-calculator/QuickDoughCalculator.tsx`.
- Inspected `lib/quick-calculator/quick-dough-calculator.ts`.
- Inspected `lib/quick-calculator/quick-calculator-storage.ts`.
- Inspected `lib/quick-calculator/pizza-sizing.ts`.
- Inspected `lib/quick-calculator/quick-preferments.ts`.
- Inspected `lib/quick-calculator/advanced-dough-tools.ts`.
- Inspected `lib/experience-levels.ts`.
- Inspected `docs/calculator-progressive-disclosure.md`.
- Inspected Patch 458A, 461A2, 461A4, 403 and 353 audit references related to Quick Calculator.
- Ran focused Quick Calculator tests: `tests/quick-calculator.test.ts` and `tests/calculator-progressive-disclosure.test.ts`, 61 tests passed.
- Ran production build from unchanged source; `/calculator/quick` built at 18.7 kB route size and 124 kB first load JS.
- Browser-audited `/calculator/quick` at 390x844, 430x740, 1280x900 and 1440x900 for Beginner, Enthusiast and Pizza Nerd on an isolated local origin.
- Browser-checked shared URL and invalid URL normalization.
- Browser console check found no warnings or errors.
- Researched current competitor sources with primary/direct sources where available.

## Scope Protection Confirmation

This patch changes only this audit document. It does not change:

- Quick Calculator production code
- calculations
- formulas
- defaults
- validation ranges
- saved recipe format
- shared URL format
- Pizza Plan
- sessions
- Guides
- Account
- Homepage
- navigation
- footer
- APIs
- database
- migrations
- indexing policy
- `supabase/.temp/`
