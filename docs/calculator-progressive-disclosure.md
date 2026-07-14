# Calculator progressive disclosure

Patch 26 makes the DoughTools calculator calmer for Beginner users while keeping the full dough setup available for Enthusiast and Pizza Nerd users.

This patch changes presentation and guidance only. It does not change dough formulas, yeast calculations, saved recipes, shared recipe URLs, planner timing, troubleshooting content, indexing, analytics or tracking.

## Why this exists

The Pizza Session start flow gives beginners a simpler first path. The calculator also needs to respect that same idea: a new user should not meet every technical parameter before they understand the basic recipe.

The goal is:

- Beginner success
- Enthusiast understanding
- Pizza Nerd control

## Experience levels

The calculator uses the existing experience-level system:

| Canonical value | User-facing label | Calculator behavior |
| --- | --- | --- |
| `beginner` | Beginner | Essential choices first, safe defaults, advanced controls behind a real disclosure button. |
| `enthusiast` | Enthusiast | Essential and recommended settings are visible, with practical cause-and-effect guidance. |
| `pizza_nerd` | Pizza Nerd | All available dough controls are visible by default with technical notes and assumptions. |

The storage key remains:

```text
doughtools.experienceLevel
```

The default remains `beginner`.

## Control groups

The calculator groups existing fields into three presentation groups.

### Essential choices

- pizza style
- fermentation time and environment
- pizza count
- oven type

These are the first choices shown to Beginner users.

### Recommended settings

- flour profile
- baking recommendation
- recommended ball weight
- flour strength

These are visible by default for Enthusiast and Pizza Nerd users. Beginner users can open more settings to see them.

### Advanced settings

- dough ball weight
- hydration
- salt
- extra for waste
- leavening type
- fermentation preset
- room or fridge temperature

These controls are not removed. Beginner and Enthusiast users can open them with an accessible disclosure. Pizza Nerd users see them by default.

## Query parameter preservation

Shared recipe URLs continue to populate calculator state.

Advanced values are not discarded when the Beginner view is collapsed. If technical values differ from the suggested defaults, the calculator shows that more settings are active and keeps the disclosure available.

Existing route/query conventions are preserved for:

- Planner
- Troubleshooting
- Sauce
- Toppings
- Timer

## Result guidance

The recipe result now gives clearer next steps:

- plan fermentation and baking
- diagnose dough if something looks wrong
- continue to sauce and toppings
- use the timer while baking
- save the recipe or local bake result using existing behavior

No new public sharing, cloud sync, photo upload, or account-based recipe storage was added.

## Accessibility rules

The progressive disclosure uses:

- a real `button`
- `aria-expanded`
- `aria-controls`
- visible focus styles
- visible selected state
- labels and copy that do not rely on color alone

This patch must not undo the Patch 24 accessibility baseline.

## Performance considerations

Patch 25 documented that the homepage is already an interactive client component with meaningful First Load JS.

Patch 26 therefore avoids:

- new heavy dependencies
- new route-level state systems
- new icon libraries
- analytics or tracking
- moving unrelated tools into the homepage first load

The new model is a small TypeScript helper and small UI changes inside the existing calculator.

## Future improvements

Useful next steps:

- stronger sauce/toppings/timer handoff copy
- saved recipe UX polish
- simpler result card layout for very small screens
- full mobile usability pass with real devices
- Lighthouse/lab performance checks after the UI stabilizes
- later field measurement only after a privacy-first analytics decision
