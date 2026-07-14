# DoughTools accessibility baseline

Patch 24 records the first focused accessibility pass for the core DoughTools user experience.

This is not a full WCAG audit. It is a practical baseline for a form-heavy pizza workflow product.

## Routes reviewed

Core routes reviewed during this pass:

- `/`
- `/session/start`
- `/plan`
- `/doctor`
- `/guide`
- `/updates`
- `/account`

Supporting routes checked for launch-safety continuity:

- `/robots.txt`
- `/sitemap.xml`

## Labels and accessible names

Future controls should have either:

1. visible text that clearly names the action, or
2. a programmatic name such as `aria-label` when the visible control is compact.

Do not rely on placeholder text alone.

Examples that need clear names:

- plus and minus stepper controls
- star rating buttons
- compact menu buttons
- icon-like status controls
- selectable pizza or dough-state cards

## Focus visibility

Interactive controls should keep visible keyboard focus.

Use the existing DoughTools style language:

- `focus:outline-none`
- `focus-visible:ring-2`
- an offset that keeps the ring visible on cream, white or dark panels

Do not remove focus styles to make buttons look cleaner.

## Focus order

Prefer natural DOM order.

Do not add positive `tabIndex` values unless there is a reviewed accessibility reason.

Important user journeys:

1. homepage hero
2. Pizza Session start
3. calculator settings
4. recipe result
5. planner
6. Troubleshooting

## Color-not-alone rule

Selected states, experience levels and status messages must not rely on color alone.

For experience levels:

- show the visible text label: Beginner, Enthusiast or Pizza Nerd
- keep the marker paired with text
- expose selected state with `aria-pressed` or another appropriate semantic state
- show a visible “Selected” style or text where practical

For Troubleshooting:

- use text labels for each dough situation
- do not rely only on green checkmarks or red X marks

## Touch targets

Mobile controls should be large enough to use while cooking.

Use generous heights where possible:

- navigation: about 48 px or more
- CTAs: about 44–48 px or more
- stepper buttons: large square targets
- card actions: full-width or easy-to-hit buttons on mobile

## Link purpose

Links and CTAs should make sense out of context.

Prefer:

- `Calculate your dough`
- `Plan this bake`
- `Open troubleshooting`
- `Start with home oven pizza`

Avoid:

- `here`
- `click`
- `more`

## Current limitations

This pass used static inspection, automated tests, production build checks and a light manual browser pass.

It did not include:

- a full screen-reader audit
- a full WCAG conformance audit
- automated axe/pa11y tooling
- assistive-technology testing on iOS or Android

Those should be separate future patches if DoughTools prepares for a broader public launch.

## What this patch did not change

Patch 24 did not change:

- dough formulas
- yeast calculations
- planner timing logic
- Troubleshooting guide content
- saved recipe behavior
- shared recipe URL behavior
- BakeResult storage
- Supabase/auth behavior
- analytics or tracking
- SEO indexing permissions
