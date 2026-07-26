# Patch 471A: Sauce First Viewport and Realistic Application Imagery

## Summary

Patch 471A simplified the public Sauce guide so the first viewport focuses on the user's main job: choose a sauce style, calculate the amount and understand how to apply it. The page keeps the existing calculator engine, sauce defaults and Pizza Plan boundary unchanged.

## Previous UX Problem

- The page opened with a large standalone Quick answer before the calculator.
- The calculator result competed with explanatory content instead of leading the task.
- The application sequence used abstract CSS shapes labeled Dough, Centre, Spiral and Border.
- The lower page contained a full Sources and methodology block plus generic Dough and Toppings next-topic cards.
- Mobile users had to scroll through too much page structure before reaching the useful calculator result.

## Implemented Structure

1. Compact Sauce page identity.
2. One realistic Sauce application image near the opening.
3. Result-first Sauce calculator.
4. Practical controls for sauce style, pizza count, sauce per pizza and coverage preset.
5. Compact amount guidance after the result and controls.
6. Practical recipe and batch details.
7. Realistic application imagery in the exact application section.
8. Tomato buying, moisture troubleshooting and storage guidance.
9. One compact Plan a pizza handoff.
10. Existing footer.

## Calculator Behavior

The calculator still uses `calculatePizzaSauce` and the same defaults from `lib/pizza-sauce-calculator.ts`.

The visible result hierarchy now leads with:

- Total sauce
- Sauce per pizza
- Pizzas
- Reserve amount

The current Quick answer is integrated into the calculator header through the existing guidance-level model. Beginner, Enthusiast and Pizza Nerd still change explanation depth only.

## Realistic Application Imagery

Four local WebP assets were added under `public/sauce/application/`:

- `dough-ready.webp`
- `sauce-in-centre.webp`
- `spread-in-spiral.webp`
- `clean-border.webp`

They replace the abstract CSS application graphic and appear near the application instructions. The opening page image reuses `clean-border.webp` because it best communicates the finished target state.

## Removed Sections

The page no longer renders:

- the standalone oversized Quick answer block
- `Sources and methodology`
- `What should I learn next?`
- generic Dough and Toppings related-guide cards

The `/methodology` route and underlying research notes remain unchanged.

## Boundaries Preserved

- Sauce calculation formulas unchanged.
- Sauce defaults unchanged.
- Pizza Plan and session behavior unchanged.
- No API, database or migration changes.
- Header, navigation and footer unchanged.
- No deployment was performed as part of the implementation patch.

## Validation Notes

Validation covers focused Sauce tests, lint, build, browser checks at 390x844 and 1440x900, and `git diff --check`.
