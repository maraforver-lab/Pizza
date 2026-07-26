# Patch 471B: Sauce Desktop Workspace Scaling

## Problem After Patch 471A

Patch 471A corrected the Sauce page hierarchy and imagery, but the desktop layout still split the main workflow across too many vertical bands. At 1440x900 the user could see the page opening and calculator title, but the full path from choosing sauce to preparing the batch required extra scrolling.

The workflow goal is:

```text
Choose sauce -> calculate amount -> prepare sauce
```

## Layout Change

Patch 471B keeps the same content and calculations, but changes the Sauce calculator presentation into one connected workspace.

Desktop workspace:

- Left column: compact result summary, sauce style, pizza count, sauce amount, coverage preset and secondary batch controls.
- Right column: recipe and batch, preparation amount, ingredients and recipe steps.
- Lower section: amount explanation, too little / recommended / too much comparison and selected-level teaching.

Mobile keeps a stacked task order:

- calculator title
- result
- controls
- recipe
- explanation

## Desktop Result

The previous four large equal result cards were replaced by one compact result summary:

- total sauce
- sauce per pizza
- pizza count
- reserve
- preparation amount

The values still come from `calculatePizzaSauce`.

## Mobile Result

Mobile remains readable and stacked. The result appears before the controls, the controls remain directly editable, and the recipe follows before deeper explanation.

## Measurements

Local and production browser checks were performed at:

- 390x844
- 430x740
- 1280x900
- 1440x900

Local measured positions after the layout change:

| Viewport | Title top | Result top | Controls top | Recipe top |
| --- | ---: | ---: | ---: | ---: |
| 1280x900 | 157 px | 678 px | 859 px | 633 px |
| 1440x900 | 157 px | 678 px | 859 px | 633 px |
| 390x844 | 165 px | 1131 px | 1393 px | 2440 px |
| 430x740 | 165 px | 1161 px | 1407 px | 2434 px |

The desktop workspace now shows the recipe column and result summary in the first viewport, with the primary controls beginning at the lower edge of the first viewport instead of after a second large scroll.

## Validation

Required validation:

- focused Sauce tests
- lint
- build
- browser checks
- `git diff --check`

## Protected Boundaries

Unchanged:

- Sauce formulas
- Sauce defaults
- calculation engine
- guidance preference logic
- Pizza Plan integration
- session behavior
- APIs
- database
- migrations
- image assets
- other Guide pages
