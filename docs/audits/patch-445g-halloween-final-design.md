# Patch 445G: Halloween Final Design

## 1. Patch 445B Specification Used

Patch 445G implements the Halloween direction approved in `docs/audits/patch-445b-seven-theme-visual-design-audit.md`.

Patch 445B concluded:

`Foundation architecture is ready for per-theme implementation`

Patch 445G keeps the Patch 445A campaign architecture unchanged and preserves the finalized Valentine, Easter, Summer and Harvest appearances from Patches 445C through 445F.

## 2. Halloween Design Intent

The Halloween theme is playful, theatrical, warm, night-inspired and oven/fire-adjacent while remaining restrained.

It avoids gore, horror, jump scares, flashing, strobing, novelty typography, hard-to-read black workflow surfaces and haunted-house treatment.

## 3. Final Palette

| Role | Value |
| --- | --- |
| Workflow page background | `#FFF4E8` |
| Night atmosphere / secondary page wash | `#241A16` |
| Primary surface | `#FFF8EF` |
| Muted surface | `#F3DFCF` |
| Elevated surface | `#FFF8EF` |
| Normal border | `#70442F` |
| Strong border | `#5F3828` |
| Text | `#1F1F1F` through canonical Ink |
| Muted text | `#6B645D` through canonical muted text |
| Accent | `#E96F24` |
| Accent hover | `#B94F12` |
| Soft accent | `rgba(233, 111, 36, .10)` |
| Secondary accent | `#5B3A6B` |
| Decorative | `rgba(233, 111, 36, .13)` |
| Secondary decorative | `rgba(91, 58, 107, .12)` |
| Header surface | `rgba(255, 244, 232, .96)` |
| Header border | `rgba(112, 68, 47, .18)` |
| Metadata theme color | `#241A16` |

## 4. Final Token Values

Patch 445G supplies Halloween-specific values for the shared public theme token contract:

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

The Halloween motif is CSS-only and static.

It uses warm night arcs, restrained ember-orange atmosphere and muted purple decoration in the page background. It does not add bats, ghosts, skulls, frightening faces, animated webs, external assets, SVG additions or route-specific seasonal components.

The motif is decorative, non-interactive, not focusable and not represented in the accessibility tree.

## 6. Playful And Theatrical Direction

The final direction gives DoughTools a seasonal-night atmosphere without turning the product into a game or haunted interface. Workflow cards remain light and readable.

## 7. Safety And Content Restrictions

Patch 445G introduces no:

- gore
- horror imagery
- jump scares
- flashing
- strobing
- frightening symbols
- novelty typography
- large black workflow screens
- decorative flames inside the normal timer state

## 8. Halloween Versus Harvest Separation

Halloween uses warm night atmosphere, charcoal metadata chrome, ember-orange and muted purple. Harvest remains grain, flour, ingredients, olive and light autumn craft.

Tests verify:

- different metadata colors
- different preview swatches
- different primary and secondary accents
- Harvest contains no spooky labeling
- Halloween contains no grain or flour identity

## 9. Page-Category Intensity

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

## 10. Navigation

The global header and mobile full-screen menu keep their existing structure and behavior.

Halloween changes affect only safe surfaces, borders and ambient backgrounds:

- mobile menu remains fully opaque
- Account remains visible immediately
- Your Pizza action remains prominent
- Tools and Learn remain scan-friendly
- focus behavior remains unchanged

Orange is not used as a warning replacement and purple is not used as the sole current-state signal.

## 11. Homepage

The homepage receives a playful seasonal-night atmosphere through the global background and existing themed surfaces.

Preserved:

- copy
- CTA hierarchy
- pizza imagery
- responsive layout
- product positioning

No scary copy, large banner, jump-scare content or animation was added.

## 12. Forms And Authentication

Forms remain trustworthy and neutral.

Preserved:

- visible labels
- validation errors
- selected states
- disabled states
- input borders
- security-page tone

Halloween orange, purple and charcoal are decorative; they do not replace semantic form states.

## 13. Shopping

Shopping remains checklist-first.

Preserved:

- ingredient readability
- checkbox contrast
- category separation
- flour specification
- export controls
- pizza mix behavior
- completion semantics

No spooky motif is added inside dense checklist rows and food imagery is not darkened.

## 14. Timeline

Timeline state semantics are unchanged.

Preserved:

- current step
- future steps
- completed steps
- readiness
- overdue
- scheduled time
- connectors

Halloween orange does not replace warning, overdue or timing urgency.

## 15. Kitchen

Kitchen remains execution-first.

No Halloween motif is placed behind instructions, countdowns, readiness warnings, completion controls, More guidance or Review CTA.

## 16. Bake Timer

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

Halloween does not theme `dt-bake-timer` states and does not replace urgency colors. The normal Halloween theme does not introduce decorative flame content that could be confused with overtime.

## 17. Account And Admin

Account remains calm and operational.

Admin remains neutral for campaign management. Halloween preview cards receive the new registry swatches and final design status through the shared registry. Authorization, APIs, scheduling, preview isolation and stale-write handling are unchanged.

## 18. Guides And About

Guides and About receive moderate Halloween atmosphere through shared page and card surfaces.

Food imagery is not recolored and no scary copy was added.

## 19. Legal Pages

Privacy and Terms receive only minimal treatment:

- readable page background
- stable Ink text
- accessible link/focus behavior
- no motif inside legal content

## 20. Metadata Theme Color

The Halloween metadata theme color is `#241A16`.

Default, Valentine, Easter, Summer and Harvest metadata remain unchanged. Christmas remains foundation-only.

## 21. Motion And Reduced Motion

Patch 445G adds no motion.

There are no floating bats, moving ghosts, pulsing pumpkins, flickering lights, strobing, moving webs, animated flames, particles or parallax.

## 22. Accessibility Validation

Focused tests verify:

- Ink text meets AA contrast on Halloween workflow surfaces
- muted text remains readable on the Halloween primary surface
- darker hover accent and purple support meet AA contrast on the Halloween workflow background
- Halloween does not override semantic status tokens
- Halloween does not override Bake Timer urgency selectors

The ember-orange accent is decorative/non-semantic and not used as body text.

## 23. Responsive Validation

The implementation adds no layout boxes, route-specific components, image assets or absolute overlays.

Responsive validation focuses on existing overflow protections, mobile menu opacity and representative page rendering at target mobile and desktop widths.

## 24. Changed Files

- `lib/public-themes.ts`
- `app/globals.css`
- `tests/public-themes.test.ts`
- `docs/audits/patch-445g-halloween-final-design.md`

## 25. Regression Boundaries

Unchanged:

- Default
- finalized Valentine
- finalized Easter
- finalized Summer
- finalized Harvest
- Christmas foundation definition
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

## 26. Known Limitations

- Patch 445G does not add screenshots.
- Patch 445G does not finish Christmas.
- Patch 445G does not apply the Patch 445A migration.
- Page-category intensity remains token-driven rather than route-class driven.
- Manual visual review remains useful for perceived seasonal density and timer-state clarity.

## 27. Next Implementation Patch

Recommended next action: Patch 445H Christmas final design.
