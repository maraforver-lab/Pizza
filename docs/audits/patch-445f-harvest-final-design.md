# Patch 445F: Harvest Final Design

## 1. Patch 445B Specification Used

Patch 445F implements the Harvest direction approved in `docs/audits/patch-445b-seven-theme-visual-design-audit.md`.

Patch 445B concluded:

`Foundation architecture is ready for per-theme implementation`

Patch 445F keeps the Patch 445A campaign architecture unchanged and preserves the finalized Valentine, Easter and Summer appearances from Patches 445C, 445D and 445E.

## 2. Harvest Design Intent

The Harvest theme is warm, crafted, ingredient-focused, autumnal and grounded.

It connects visually to grain, flour and food preparation while keeping DoughTools practical. It avoids spooky imagery, black-purple combinations, jack-o'-lantern motifs, muddy brown-on-brown contrast and rustic clutter.

## 3. Final Palette

| Role | Value |
| --- | --- |
| Page background | `#FFF0DC` |
| Secondary page wash | `#F0DFC2` |
| Primary surface | `#FFF9F1` |
| Muted surface | `#F0DFC2` |
| Elevated surface | `#FFF9F1` |
| Normal border | `#DEC290` |
| Strong border | `#C9A76B` |
| Text | `#1F1F1F` through canonical Ink |
| Muted text | `#6B645D` through canonical muted text |
| Accent | `#B96324` |
| Accent hover | `#8F4618` |
| Soft accent | `rgba(185, 99, 36, .10)` |
| Secondary accent | `#65723A` |
| Decorative | `rgba(185, 99, 36, .11)` |
| Secondary decorative | `rgba(101, 114, 58, .10)` |
| Header surface | `rgba(255, 240, 220, .96)` |
| Header border | `rgba(101, 114, 58, .16)` |
| Metadata theme color | `#FFF0DC` |

## 4. Final Token Values

Patch 445F supplies Harvest-specific values for the shared public theme token contract:

- `--theme-page-background`
- `--theme-page-background-secondary`
- `--theme-surface`
- `--theme-surface-muted`
- `--theme-surface-elevated`
- `--theme-border`
- `--theme-border-strong`
- `--theme-text`
- `--theme-text-muted`
- `--theme-accent`
- `--theme-accent-hover`
- `--theme-accent-soft`
- `--theme-accent-secondary`
- `--theme-decorative`
- `--theme-decorative-secondary`
- `--theme-header-surface`
- `--theme-header-border`

Semantic status colors remain unchanged.

## 5. Motif Implementation

The Harvest motif is CSS-only and static.

It uses a restrained grain-line geometry with soft flour/olive atmospheric dots. There are no pumpkin faces, bats, ghost shapes, spooky flames, external images, SVG additions or route-specific seasonal components.

The motif is decorative, non-interactive, not focusable and not represented in the accessibility tree.

## 6. Grain, Flour And Ingredient Direction

The final direction is expressed through warm grain surfaces, toasted flour borders, roasted-orange accent and restrained olive atmosphere. The theme feels connected to dough craft and ingredients rather than Halloween.

## 7. Harvest Versus Halloween Separation

Harvest remains light and ingredient-focused. Halloween remains foundation-only with a dark charcoal metadata color, pumpkin-orange accent and restrained purple secondary accent.

Tests verify:

- different metadata colors
- different preview swatches
- different primary and secondary accents
- no spooky Harvest labels
- no purple or dark Halloween motif inside Harvest tokens

## 8. Page-Category Intensity

Moderate expression:

- homepage
- Guides
- About

Restrained expression:

- authentication
- Session Start
- Recipe
- Shopping
- Timeline
- Review
- Account
- Party Orders
- Admin

Minimal expression:

- Kitchen
- full-screen Bake Timer
- standalone Bake Timer active state
- Privacy
- Terms

No layout or copy changes were made.

## 9. Navigation

The global header and mobile full-screen menu keep their existing structure and behavior.

Harvest changes affect only safe surfaces, borders and ambient backgrounds:

- mobile menu remains fully opaque
- Account remains visible immediately
- Your Pizza action remains prominent
- Tools and Learn remain scan-friendly
- focus behavior remains unchanged

Orange is not used as a warning replacement and olive is not used as a completion-only cue.

## 10. Homepage

The homepage receives warm ingredient-focused atmosphere through the global background and existing themed surfaces.

Preserved:

- copy
- CTA hierarchy
- pizza imagery
- responsive layout
- product positioning

No farming copy, Halloween copy, seasonal banner or animated leaves were added.

## 11. Forms And Authentication

Forms remain trustworthy and neutral.

Preserved:

- visible labels
- validation errors
- selected states
- disabled states
- input borders
- security-page tone

Harvest orange, brown and olive are decorative; they do not replace semantic form states.

## 12. Shopping

Shopping remains checklist-first while naturally benefiting from the ingredient-focused Harvest atmosphere.

Preserved:

- ingredient readability
- checkbox contrast
- category separation
- flour specification
- export controls
- pizza mix behavior
- completion semantics

No decorative imagery is added inside dense checklist rows.

## 13. Timeline

Timeline state semantics are unchanged.

Preserved:

- current step
- future steps
- completed steps
- readiness
- overdue
- scheduled time
- connectors

Harvest orange does not replace warning or overdue states, and olive is not the sole carrier of completion.

## 14. Kitchen

Kitchen remains execution-first.

No Harvest motif is placed behind instructions, countdowns, readiness warnings, completion controls, More guidance or Review CTA.

## 15. Bake Timer

Bake Timer urgency remains authoritative.

Preserved:

- countdown
- progress ring
- final 20 seconds
- final 10 seconds
- 3-2-1
- overtime
- flame
- sound toggle
- alarm controls
- reduced-motion behavior
- local-only runtime

Harvest does not theme `dt-bake-timer` states and does not replace urgency colors.

## 16. Account And Admin

Account remains calm and operational.

Admin remains neutral for campaign management. Harvest preview cards receive the new registry swatches and final design status through the shared registry. Authorization, APIs, scheduling, preview isolation and stale-write handling are unchanged.

## 17. Guides And About

Guides and About receive moderate Harvest atmosphere through shared page and card surfaces.

Food imagery is not recolored and no agricultural or seasonal copy was added.

## 18. Legal Pages

Privacy and Terms receive only minimal treatment:

- readable page background
- stable Ink text
- accessible link/focus behavior
- no motif inside legal content

## 19. Metadata Theme Color

The Harvest metadata theme color is `#FFF0DC`.

Default, Valentine, Easter and Summer metadata remain unchanged. Halloween and Christmas remain foundation-only.

## 20. Motion And Reduced Motion

Patch 445F adds no motion.

There are no falling leaves, moving wheat, flour particles, pulsing backgrounds or looping decorative effects.

## 21. Accessibility Validation

Focused tests verify:

- Ink text meets AA contrast on Harvest surfaces
- muted text remains readable on the Harvest primary surface
- darker hover accent and olive support meet AA contrast on the Harvest page background
- Harvest does not override semantic status tokens
- Harvest does not override Bake Timer urgency selectors

The roasted-orange accent and olive are decorative/non-semantic and not used as body text.

## 22. Responsive Validation

The implementation adds no layout boxes, route-specific components, image assets or absolute overlays.

Responsive validation focuses on existing overflow protections, mobile menu opacity and representative page rendering at target mobile and desktop widths.

## 23. Changed Files

- `lib/public-themes.ts`
- `app/globals.css`
- `tests/public-themes.test.ts`
- `docs/audits/patch-445f-harvest-final-design.md`

## 24. Regression Boundaries

Unchanged:

- Default
- finalized Valentine
- finalized Easter
- finalized Summer
- Halloween and Christmas foundation definitions
- canonical theme IDs
- campaign storage
- migrations
- RLS
- admin authorization
- activation APIs
- scheduling
- resolver semantics
- Account preferences
- Pizza Session data
- formulas
- Timeline logic
- Kitchen progression
- Bake Timer state machine
- Bake Timer sounds
- Party Orders
- navigation structure

## 25. Known Limitations

- Patch 445F does not add screenshots.
- Patch 445F does not finish Halloween or Christmas.
- Patch 445F does not apply the Patch 445A migration.
- Page-category intensity remains token-driven rather than route-class driven.
- Manual visual review remains useful for perceived grain motif density.

## 26. Next Implementation Patch

Recommended next action: Patch 445G Halloween final design.
