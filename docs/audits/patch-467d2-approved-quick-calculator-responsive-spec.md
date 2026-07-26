# Patch 467D2: Approved Quick Calculator Responsive Specification

## 1. Executive Summary

The approved public Quick Calculator direction is one responsive calculator, not three public modes.

Core promise:

> Instant numbers plus practical confidence.

Approved hybrid:

- Mobile uses the Instant Recipe result-first hierarchy.
- Desktop uses a refined Calculator Workbench.
- Guided Builder is rejected as a public wizard, but its question order and plain-language grouping inform the final structure.

This specification is implementation-ready for Patch 467E. It does not change production code, the public `/calculator/quick` route, the Admin prototypes, formulas, defaults, validation ranges, saved recipes, share URLs, Pizza Plan, sessions, APIs, database or migrations.

## 2. Final Responsive Architecture

Required model:

```text
One calculator state
One canonical engine
One saved-recipe contract
One share-URL contract
Different responsive presentation
```

Mobile and desktop may use different ordering, density and default-open disclosures. They must read from and write to the same local React calculator state. They must call the same canonical `calculateQuickDough` result path.

Do not implement:

- a separate mobile calculator engine
- a separate desktop calculator engine
- public calculator versions
- a public prototype selector
- a Guided Builder wizard
- URL, cookie, localStorage or account-based calculator mode switching

## 3. Exact Mobile Hierarchy

At `390x844` and `430x740`, use this order:

1. Global header.
2. Compact page identity.
3. Compact guidance-level tabs.
4. Live Recipe result.
5. Copy / Save / Share.
6. Essential controls.
7. Contextual and advanced disclosures.
8. Saved recipes.
9. Learning handoff.
10. Explicit Pizza Plan handoff.
11. Trust note.
12. Footer.

### Compact Page Identity

Use:

- Eyebrow: `Quick calculator`
- Heading: `Quick Dough Calculator`
- Supporting line: `Get the dough amounts you need, then adjust only what matters.`

Keep this compact. Do not add a large marketing hero or image.

### Guidance Tabs

Show one compact segmented control:

- Beginner
- Enthusiast
- Pizza Nerd

Requirements:

- all three options visible
- one selected option
- no separate large guidance card
- no `Change level` button
- no page scrolling on level change
- changing level preserves every current input value
- changing level preserves numerical output
- tabs affect explanation density and disclosure defaults only

A small inline label may say:

`Changes guidance depth only.`

Do not give this label its own large card.

### Live Recipe

The result must appear before editable controls on mobile.

Show, in this order:

1. Total dough.
2. Dough balls.
3. Dough-ball weight.
4. Flour.
5. Water.
6. Salt.
7. Yeast.

Also show one compact assumption line using current values, for example:

`64% hydration · 24 h cold`

Yeast must remain precise and easy to locate. Do not put teaching copy, baker's percentages or technical assumptions before the main ingredient quantities.

### Result Actions

Place directly below Live Recipe:

- Copy
- Save
- Share

These are primary utility actions, but they must not compete visually with ingredient values. Saved recipes remain browser-local. Share retains the current canonical URL contract.

### Essential Controls

Use one clear section rather than multiple nested cards.

Heading:

`Adjust the recipe`

Immediately visible controls:

- number of pizzas or pans
- dough-ball weight or current selected sizing result
- fermentation duration
- Room temperature or Cold fermentation

Mobile layout requirements:

- fermentation duration options use a compact 2x2 grid
- Room temperature and Cold fermentation use two equal options where width permits
- numeric fields remain directly editable
- plus/minus controls remain accessible
- no awkward unit wrapping
- selected options include visible text state, not color alone

## 4. Contextual and Advanced Mobile Controls

Use clearly named disclosures.

Approved disclosure labels:

1. `Adjust hydration, salt and extra dough`
2. `Change yeast and temperature`
3. `Change pizza size or shape`
4. `Use a preferment`
5. `Dough-temperature and flour tools`
6. `View baker's percentages`
7. `View calculation assumptions`

Avoid these labels when used alone:

- `More`
- `Optional controls`
- `Advanced`
- `Details`

### Mobile Default States By Guidance Level

Beginner:

- Visible: Live Recipe, essential controls.
- Collapsed: hydration/salt/extra dough, yeast/temperature, sizing alternatives, preferment, technical tools, baker's percentages, assumptions.
- Requirement: Beginner must still be able to open every calculation-affecting control.

Enthusiast:

- Visible or open: essential controls, hydration/salt/extra dough.
- Collapsed: yeast/temperature, sizing alternatives unless currently active, preferment unless active, technical tools, assumptions.
- Baker's percentages may use a compact collapsed summary.

Pizza Nerd:

- Visible or open: essential controls, hydration/salt/extra dough, yeast/temperature, compact baker's percentages.
- Collapsed unless active: sizing alternatives, preferment, dough-temperature and flour tools, calculation assumptions.

Critical decision:

Pizza Nerd must not automatically expand every technical tool on mobile.

Active non-default settings should be indicated on the closed disclosure, for example:

- `Poolish active`
- `Custom flour blend`
- `Target dough temperature 24 C`

## 5. Mobile Control Specifications

### Yeast Type

Preserve all existing yeast options.

Use a compact accessible interaction such as:

- native select control
- compact radio list inside the disclosure
- two-column choice grid when labels remain readable

Do not require five large full-width cards in the main flow.

### Fermentation Temperature

Show the current effective temperature even while the disclosure is closed.

Example:

`Cold fermentation · 4 C`

Action:

`Change yeast and temperature`

### Pan Pizza

Preserve the canonical `g/cm2` value.

Also provide practical language such as:

- thinner
- balanced
- thicker

This is explanatory only. It must not replace or alter the actual numeric value.

### Custom Sizing

Use user-facing wording:

`I already know the dough weight`

Preserve the underlying current custom sizing mode.

## 6. Exact Desktop Hierarchy

At `1280x900` and `1440x900`, use a two-pane Workbench.

Top:

1. Compact page identity.
2. Compact guidance tabs.
3. Two-pane workspace.

Do not show a large hero.

Left pane primary groups:

1. Batch.
2. Fermentation.
3. Formula.

Secondary disclosures below:

- Change pizza size or shape
- Use a preferment
- Dough-temperature and flour tools

Right pane:

Use a short sticky result panel containing:

1. Total dough.
2. Dough balls.
3. Dough-ball weight.
4. Flour.
5. Water.
6. Salt.
7. Yeast.
8. Copy / Save / Share.
9. Compact guidance-specific interpretation.
10. Compact technical summary where appropriate.

Do not make the result panel perform every job simultaneously. Move long teaching content and extensive assumptions below the primary result or into disclosures.

Desktop saved recipes may be:

- a compact drawer or tray
- a full-width section below the main workspace

Do not place a dense always-open recipe library inside the primary result panel.

## 7. Desktop Guidance Behavior

Beginner:

- Left pane: Batch visible; Fermentation visible; Formula collapsed behind `Adjust hydration, salt and extra dough`; secondary technical groups collapsed.
- Right pane: primary ingredient result; one concise practical instruction; actions.

Enthusiast:

- Left pane: Batch visible; Fermentation visible; Formula visible; deeper tools collapsed unless active.
- Right pane: primary result; fermentation assumption; compact baker's percentages; actions.

Pizza Nerd:

- Left pane: Batch visible; Fermentation visible; Formula visible; technical groups clearly available; active groups open where useful.
- Right pane: primary result remains first; baker's percentages; yeast percentage; preferment split when active; compact assumptions; actions.

Do not allow technical data to visually outrank ingredient amounts.

## 8. Guided Builder Disposition

Adopt from Guided Builder:

- logical question order
- user-facing section names
- one current task per control group
- preserved values while opening or closing settings
- clear transitions between Pizza, Time, Formula and Result concepts

Reject from Guided Builder:

- visible four-stage wizard
- required Next/Back progression
- stage sidebar
- delayed full result
- separate public calculator mode

Reason:

The wizard consumes too much mobile space, slows returning users and resembles Pizza Plan rather than a quick utility. Its terminology is useful; its public structure is not.

## 9. Universal Result Hierarchy

Lock this rule:

Ingredient values always appear before:

- teaching content
- formula visualization
- baker's percentages
- preferment split
- assumptions
- learning links
- Pizza Plan handoff
- trust copy

Beginner result support:

`Weigh the ingredients, mix until no dry flour remains, then ferment as selected.`

Enthusiast result support:

- selected hydration
- fermentation assumption
- concise cause-and-effect guidance

Pizza Nerd result support:

- baker's percentages
- precise yeast percentage
- active preferment or temperature assumptions

All levels receive identical numerical results from identical inputs.

## 10. Warnings and Validation

Use non-color-only warnings for:

- unusually high or low hydration
- extreme salt values
- extremely small yeast quantities
- adjusted or clamped shared URL values
- active non-default technical settings

Every warning must include:

1. What is unusual.
2. Why it matters.
3. What the user can do.

Do not add new numerical limits in the UX patch. Use current engine validation and ranges.

## 11. Save, Load and Share

Result actions:

- Copy
- Save
- Share

Saved recipes area:

- Load
- Rename
- Duplicate
- Delete

Delete must be visually separated as destructive.

Preserve:

- current local-storage key
- current maximum recipe count
- current schema
- current malformed-data handling
- current share parameter
- current normalization behavior

Do not introduce account or cloud recipe storage.

## 12. Learning And Workflow Handoffs

After the calculator task, show:

- Primary learning link: `Learn how to make the dough`
- Target: `/guides/dough`

Separate optional workflow handoff:

- `Plan a pizza`

Explain accurately that opening Pizza Plan does not silently import the Quick Calculator preset unless a future separately approved integration implements that behavior.

Do not create a Pizza Plan automatically.

## 13. Privacy And Trust

Place one compact note near Save and Share:

`Saved recipes stay in this browser. Sharing creates a link containing these calculator settings.`

At the lower page boundary, retain:

`Quick Calculator does not create a Pizza Plan or account record.`

Do not repeat these statements in multiple large cards.

## 14. Remove From The Primary Public Flow

Avoid or remove:

- prototype banners
- prototype notes
- prototype boundary cards
- three public calculator versions
- Guided Builder wizard navigation
- large guidance explanation block
- Change level scroll behavior
- repeated batch summaries
- nested cards that do not add hierarchy
- every Pizza Nerd tool expanded by default on mobile
- equal visual weight for all controls and outputs
- long technical copy before ingredient amounts

## 15. Preserve Unchanged

Preserve:

- `calculateQuickDough`
- canonical dough engine
- numerical formulas
- defaults
- validation ranges
- pizza sizing behavior
- fermentation mapping
- yeast behavior
- preferment calculations
- advanced tools
- saved recipe schema
- local-storage contract
- share URL contract
- query normalization
- selected guidance-level invariant
- no session creation
- no API or database writes

## 16. Disposition Of All 38 Patch 467A Ideas

| # | Patch 467A idea | Disposition | Reason |
| ---: | --- | --- | --- |
| 1 | Add live result capsule under hero | Adopt in public implementation | Mobile must show the ingredient result before controls. |
| 2 | Label default as ready to use | Adopt with modification | Communicate ready-to-use through compact copy near result, not a badge-heavy hero. |
| 3 | Place essential result before style grid on mobile | Adopt in public implementation | This is the core Instant Recipe mobile decision. |
| 4 | Show selected style as row with change style | Adopt with modification | Style and sizing become compact contextual controls, not early card grids. |
| 5 | Convert style and sizing to compact rows or segmented controls | Adopt in public implementation | Reduces mobile height and keeps controls accessible. |
| 6 | Compact steppers with direct value first | Adopt with modification | Keep direct editable values and accessible plus/minus controls; exact stepper UI can follow existing component patterns. |
| 7 | Sticky bottom result summary while editing | Defer | Avoid intrusive persistent bars until the result-first layout is tested publicly. |
| 8 | Put Copy, Save, Share beside first result | Adopt in public implementation | Result actions belong directly under Live Recipe. |
| 9 | Split result into primary numbers and secondary tabs/disclosures | Adopt in public implementation | Desktop result rail must stop doing every job at once. |
| 10 | Lighten input cards and keep result primary | Adopt in public implementation | Supports desktop Workbench hierarchy. |
| 11 | Use specific disclosure labels | Adopt in public implementation | The approved labels are locked in this spec. |
| 12 | Add active-setting indicators | Adopt in public implementation | Closed disclosures must show active non-default settings. |
| 13 | Highlight yeast row with precision note | Adopt in public implementation | Yeast must stay precise and easy to locate. |
| 14 | Move formula visualization below ingredient list | Adopt in public implementation | Ingredient values outrank teaching content universally. |
| 15 | Level-aware next step: weigh, mix, ferment | Adopt in public implementation | Beginner support sentence is specified. |
| 16 | Show compact current temperature line with change | Adopt in public implementation | Closed fermentation disclosure should show effective temperature. |
| 17 | Add fridge/room plain-language helper | Adopt in public implementation | Helps Beginner understand cold and room fermentation without changing values. |
| 18 | Explain tiny yeast scale need near yeast row | Adopt in public implementation | Covered by tiny yeast warning and yeast emphasis. |
| 19 | Add practical pan thickness language beside g/cm2 | Adopt in public implementation | Practical labels explain, but do not replace, the numeric value. |
| 20 | Label custom mode "I already know the dough weight" | Adopt in public implementation | Locked as user-facing wording. |
| 21 | Compact guidance control | Adopt with modification | Use compact tabs rather than a pill with secondary menu so all levels remain visible. |
| 22 | Prevent level change scroll-to-bottom behavior | Adopt in public implementation | Tabs must not scroll the page and must preserve values. |
| 23 | Saved recipes drawer | Adopt with modification | Drawer/tray or lower section is approved; implementation can choose the safer pattern. |
| 24 | Separate destructive delete action | Adopt in public implementation | Delete must be visually separated as destructive. |
| 25 | Expose Share in result actions | Adopt in public implementation | Share belongs near Copy and Save. |
| 26 | Notice for adjusted shared values | Adopt in public implementation | Use current normalization; add non-color-only notice. |
| 27 | Non-color-only warning rows near affected controls | Adopt in public implementation | Warning model is specified without changing numeric limits. |
| 28 | Tiny yeast warning | Adopt in public implementation | Required when quantities are difficult to weigh. |
| 29 | Contextual Dough guide link near result | Adopt with modification | Place after calculator task as the primary learning handoff. |
| 30 | Preserve "does not import preset" Pizza Plan copy | Adopt in public implementation | Prevents false workflow expectations. |
| 31 | Measure focus count and group repeated controls | Adopt with modification | Implementation must reduce excessive focus stops; exact measurement belongs to 467E validation. |
| 32 | Clearer result landmark and heading order | Adopt in public implementation | Required for the Live Recipe and sticky result panel. |
| 33 | Keep aria-pressed and selected text states | Adopt in public implementation | Selected controls cannot rely on color alone. |
| 34 | Reduce card count and collapse technical sections | Adopt in public implementation | Core mobile height reduction requirement. |
| 35 | Remove duplicate summaries from primary flow | Adopt in public implementation | Reduces repetition and result-panel overload. |
| 36 | Move local-only trust note near save/share | Adopt in public implementation | Trust note belongs beside save/share behavior. |
| 37 | Explain share link content in one line | Adopt in public implementation | Required privacy/trust copy. |
| 38 | Add workbench density mode only as presentation | Reject | No separate public density mode; desktop Workbench can be dense through responsive presentation only. |

Disposition counts:

- Adopt in public implementation: 29
- Adopt with modification: 7
- Defer: 1
- Reject: 1
- Total: 38

## 17. Approved Wireframes

### Mobile Beginner

```text
[Global header]

Quick calculator
Quick Dough Calculator
Get the dough amounts you need, then adjust only what matters.

[Beginner] [Enthusiast] [Pizza Nerd]
Changes guidance depth only.

[Live Recipe]
Total dough
Dough balls | Dough-ball weight
Flour | Water
Salt  | Yeast
64% hydration · 24 h cold
Weigh the ingredients, mix until no dry flour remains, then ferment as selected.

[Copy] [Save] [Share]
Saved recipes stay in this browser. Sharing creates a link containing these calculator settings.

Adjust the recipe
[Pizzas stepper]
[Dough-ball weight stepper]
[6 h] [12 h]
[24 h] [48 h]
[Room temperature] [Cold fermentation]

[Adjust hydration, salt and extra dough]
[Change yeast and temperature]  Cold fermentation · 4 C
[Change pizza size or shape]
[Use a preferment]
[Dough-temperature and flour tools]
[View baker's percentages]
[View calculation assumptions]

[Saved recipes]
[Learn how to make the dough]
[Plan a pizza]
Quick Calculator does not create a Pizza Plan or account record.
[Footer]
```

### Mobile Enthusiast

```text
[Global header]

Quick calculator
Quick Dough Calculator
Get the dough amounts you need, then adjust only what matters.

[Beginner] [Enthusiast selected] [Pizza Nerd]
Changes guidance depth only.

[Live Recipe]
Total dough
Dough balls | Dough-ball weight
Flour | Water
Salt  | Yeast
64% hydration · 24 h cold
Hydration and fermentation notes appear after ingredient values.

[Copy] [Save] [Share]

Adjust the recipe
[Pizzas]
[Dough-ball weight]
[Duration 2x2]
[Room temperature] [Cold fermentation]

Adjust hydration, salt and extra dough
[Hydration] [Salt] [Extra dough]

[Change yeast and temperature]  Instant dry yeast · 4 C
[Change pizza size or shape]
[Use a preferment]
[Dough-temperature and flour tools]
[View baker's percentages] compact summary
[View calculation assumptions]

[Saved recipes]
[Learn how to make the dough]
[Plan a pizza]
[Trust note]
[Footer]
```

### Mobile Pizza Nerd

```text
[Global header]

Quick calculator
Quick Dough Calculator
Get the dough amounts you need, then adjust only what matters.

[Beginner] [Enthusiast] [Pizza Nerd selected]
Changes guidance depth only.

[Live Recipe]
Total dough
Dough balls | Dough-ball weight
Flour | Water
Salt  | Yeast
64% hydration · 24 h cold

[Copy] [Save] [Share]

Adjust the recipe
[Pizzas]
[Dough-ball weight]
[Duration 2x2]
[Room temperature] [Cold fermentation]

Adjust hydration, salt and extra dough
[Hydration] [Salt] [Extra dough]

Change yeast and temperature
[Yeast compact control] [Fermentation temperature]

View baker's percentages
[Flour 100% | Water | Salt | Yeast]

[Change pizza size or shape] active indicator if non-default
[Use a preferment] Poolish active if selected
[Dough-temperature and flour tools] Target dough temperature 24 C if active
[View calculation assumptions]

[Saved recipes]
[Learn how to make the dough]
[Plan a pizza]
[Trust note]
[Footer]
```

### Desktop Beginner

```text
[Global header]

Quick calculator
Quick Dough Calculator
Get the dough amounts you need, then adjust only what matters.
[Beginner selected] [Enthusiast] [Pizza Nerd]

[Two-pane Workbench]

Left pane:
  Batch
    [Pizzas] [Dough-ball weight]
  Fermentation
    [6 h] [12 h] [24 h] [48 h]
    [Room temperature] [Cold fermentation]
  [Adjust hydration, salt and extra dough]
  [Change pizza size or shape]
  [Use a preferment]
  [Dough-temperature and flour tools]

Right sticky result:
  Total dough
  Dough balls
  Dough-ball weight
  Flour
  Water
  Salt
  Yeast
  [Copy] [Save] [Share]
  Weigh the ingredients, mix until no dry flour remains, then ferment as selected.

[Saved recipes drawer or full-width section]
[Learn how to make the dough]
[Plan a pizza]
[Trust note]
[Footer]
```

### Desktop Enthusiast

```text
[Global header]

[Compact page identity] [Guidance tabs]

[Two-pane Workbench]

Left pane:
  Batch
    [Pizzas] [Dough-ball weight]
  Fermentation
    [Duration] [Environment]
  Formula
    [Hydration] [Salt] [Extra dough]
  [Change yeast and temperature]
  [Change pizza size or shape]
  [Use a preferment]
  [Dough-temperature and flour tools]

Right sticky result:
  Total dough
  Dough balls
  Dough-ball weight
  Flour
  Water
  Salt
  Yeast
  [Copy] [Save] [Share]
  Fermentation assumption
  Compact baker's percentages

[Saved recipes]
[Learn how to make the dough]
[Plan a pizza]
[Footer]
```

### Desktop Pizza Nerd

```text
[Global header]

[Compact page identity] [Guidance tabs]

[Two-pane Workbench]

Left pane:
  Batch
    [Pizzas] [Sizing result]
  Fermentation
    [Duration] [Environment] [Yeast type] [Temperature]
  Formula
    [Hydration] [Salt] [Extra dough]
  Change pizza size or shape
    [Style] [Sizing mode] [Diameter/pan/custom controls]
  Use a preferment
    [Direct/Poolish/Biga/Levain] [Preferment fields when active]
  Dough-temperature and flour tools
    [Target dough temp] [Water temp estimate] [Yeast converter] [Flour blend]

Right sticky result:
  Total dough
  Dough balls
  Dough-ball weight
  Flour
  Water
  Salt
  Yeast
  [Copy] [Save] [Share]
  Baker's percentages
  Yeast percentage
  Preferment split when active
  Compact assumptions

[Saved recipes tray or lower section]
[Learn how to make the dough]
[Plan a pizza]
[Footer]
```

## 18. Component Implementation Plan

Patch 467E may refactor the existing public component into smaller presentation pieces if that reduces risk. Recommended responsibilities:

- `QuickCalculatorHeader`: compact page identity and explanatory line.
- `QuickCalculatorGuidanceTabs`: compact Beginner / Enthusiast / Pizza Nerd selector.
- `QuickCalculatorLiveRecipe`: primary result landmark and ingredient hierarchy.
- `QuickCalculatorResultActions`: Copy / Save / Share near result.
- `QuickCalculatorEssentialControls`: quantity, sizing result, duration and environment.
- `QuickCalculatorDisclosure`: named contextual and technical disclosure wrapper with active-setting indicators.
- `QuickCalculatorSavedRecipes`: browser-local saved recipe library or drawer.
- `QuickCalculatorLearningHandoff`: Dough guide link, Pizza Plan handoff and trust note.

These names are not mandatory. Use fewer abstractions if the existing `QuickDoughCalculator` can be safely refactored without duplication.

Implementation must avoid:

- duplicated calculator state
- duplicated result calculation
- separate mobile and desktop engines
- separate saved-recipe handlers
- separate share URL generators
- public prototype routing

## 19. Acceptance Criteria For Patch 467E

1. At `390x844`, the ingredient result is visible before the first large control section.
2. At `430x740`, total dough and all four principal ingredients are available near the top without thousands of pixels of scrolling.
3. Copy, Save and Share appear immediately after the primary result.
4. Beginner can access every calculation-affecting control.
5. Guidance changes do not change numerical output.
6. Guidance changes do not clear input values.
7. Pizza Nerd mobile does not auto-expand every technical group.
8. Desktop shows inputs and primary results in the first viewport.
9. No horizontal overflow occurs.
10. Existing saved recipes still load unchanged.
11. Existing share URLs still restore unchanged.
12. Invalid share values still normalize safely.
13. No Pizza Plan or session is created.
14. No database or API write is introduced.
15. Current engine regression tests remain unchanged and pass.

## 20. Follow-Up Patches

### Patch 467E: Implement approved public Quick Calculator UX

Scope:

- implement the approved responsive hybrid
- preserve engine and persistence boundaries
- replace public presentation only
- keep Admin prototypes available temporarily for comparison
- do not deploy until validation passes and owner approval is obtained

Exclusions:

- calculator engine
- formulas
- defaults
- validation ranges
- saved recipe schema
- share URL schema
- Pizza Plan
- sessions
- APIs
- database
- migrations

### Patch 467F: Release and production verification

Scope:

- deploy the approved implementation
- verify mobile and desktop
- verify saved recipes and share URLs
- verify all guidance levels
- verify no session or cloud writes
- retire or archive Admin prototypes only after the public version is approved

Exclusions:

- new UX implementation
- formula changes
- persistence changes
- migrations

Do not begin Patch 467E in this patch.

## 21. Validation For This Specification

Documentation-only validation required:

- verify referenced source files exist
- verify Patch 467A and 467B audit references
- verify all 38 ideas receive a disposition
- verify the document contains all six final wireframes
- `git diff --check`

No tests, lint, build, deployment or migrations are required for this documentation-only patch.

## 22. Protected Boundary Confirmation

This specification preserves:

- public `/calculator/quick`
- Admin prototype implementation
- `calculateQuickDough`
- formulas
- defaults
- validation ranges
- saved recipes
- share URLs
- Pizza Plan
- sessions
- APIs
- database
- migrations
- `supabase/.temp/`
