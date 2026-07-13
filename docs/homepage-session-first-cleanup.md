# Homepage session-first cleanup

Patch 37 simplifies the DoughTools homepage so the first screen answers three questions:

1. What is DoughTools?
2. Why does it help?
3. What should the user do first?

The answer is now intentionally clear: start a local Pizza Session.

## Primary path

The homepage primary action is:

- Start Pizza Session → `/session/start`

That path leads the user through the existing session flow:

1. Choose a baking path and pizza preset.
2. Build a dough plan at `/session/recipe`.
3. Plan the schedule at `/session/timeline`.
4. Build the shopping list at `/session/shopping`.
5. Work through Kitchen Mode at `/session/kitchen`.

## What was removed from the homepage primary flow

The homepage no longer acts as a large dashboard of every DoughTools feature.

The following blocks were removed from the normal landing experience:

- the large dough calculator block
- the recipe result card
- save recipe controls
- save bake controls
- share image / WhatsApp / copy recipe link controls
- the large fermentation planner banner
- the large core workflow tools grid
- the large workshop discovery chip section
- the My recipes block

The underlying functionality was not deleted.

## Where the functionality still lives

- Dough recipe numbers belong in the full calculator view and in `/session/recipe`.
- Timeline planning belongs in `/session/timeline` and `/plan`.
- Shopping, sauce and toppings belong in `/session/shopping`, `/sauce` and `/toppings`.
- Kitchen doing steps belong in `/session/kitchen`.
- Saved recipes remain part of the calculator/account workflow.
- Saved bakes remain local browser data and future review flows.
- Sharing/result-card ideas remain future work, not the homepage primary flow.
- Learning and troubleshooting remain available through Guide, Dough Doctor and the tool navigation.

The full calculator workspace is still available when a recipe query is opened, and through the secondary homepage link:

- `/?calculator=1`

This preserves existing shared recipe URLs without making the calculator the first thing new users see.

## Continue Session behavior

The homepage can show the existing Continue Pizza Session card only when a real active local Pizza Session exists.

If there is no active session, no fake or placeholder session card is shown.

## Local-first limits

Pizza Sessions are currently saved in this browser on this device.

Patch 37 does not add:

- cloud sync
- cross-device sync
- account-connected session storage
- analytics or tracking
- Google indexing

## Accessibility and mobile intent

The new homepage keeps:

- one clear H1
- visible text labels for links and calls to action
- keyboard-focus styles
- touch-friendly CTA sizing
- compact secondary tool links
- no color-only meaning

The mobile goal is that one primary action is obvious before the user sees any deeper tools.

## Future homepage improvements

Future patches can consider:

- a lighter signed-in/account-aware entry point
- a My Pizzas area outside the homepage primary path
- a reviewed result-card flow after Kitchen Mode
- stronger “what happens next” preview from an active Pizza Session
- a more compact calculator landing route if a dedicated calculator route is approved

## Safety notes

Patch 37 does not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage keys, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers, install/PWA behavior or SEO indexing permissions.
