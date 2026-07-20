# Patch 445D: Easter Final Design

## 1. Patch 445B Specification Used

Patch 445D implements the Easter direction approved in `docs/audits/patch-445b-seven-theme-visual-design-audit.md`.

Patch 445B concluded:

`Foundation architecture is ready for per-theme implementation`

Patch 445D keeps the Patch 445A campaign architecture unchanged and preserves the finalized Valentine appearance from Patch 445C.

## 2. Easter Design Intent

The Easter theme is fresh, light, optimistic, clean and broadly welcoming.

The first implementation is intentionally non-religious. It uses spring-like atmosphere without crosses, church imagery, explicit religious copy, cartoon egg overload or toy-like surfaces.

## 3. Final Palette

| Role | Value |
| --- | --- |
| Page background | `#FFF9DE` |
| Secondary page wash | `#EEF5DC` |
| Primary surface | `#FFFDF5` |
| Muted surface | `#EEF5DC` |
| Elevated surface | `#FFFDF5` |
| Normal border | `#D8E4B8` |
| Strong border | `#B7C98A` |
| Text | `#1F1F1F` through canonical Ink |
| Muted text | `#6B645D` through canonical muted text |
| Accent | `#5F8F3A` |
| Accent hover | `#4F7C30` |
| Soft accent | `rgba(95, 143, 58, .10)` |
| Secondary accent | `#E0B84A` |
| Decorative | `rgba(95, 143, 58, .12)` |
| Secondary decorative | `rgba(224, 184, 74, .10)` |
| Header surface | `rgba(255, 249, 222, .96)` |
| Header border | `rgba(95, 143, 58, .16)` |
| Metadata theme color | `#FFF9DE` |

## 4. Final Token Values

Patch 445D supplies Easter-specific values for the shared public theme token contract:

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

The Easter motif is CSS-only and static.

It uses soft oval and spring-leaf style background gradients rather than literal repeated eggs. There are no external images, icon replacements, SVG additions or route-specific seasonal components.

The motif is decorative, non-interactive, not focusable and not represented in the accessibility tree.

## 6. Cultural And Religious Neutrality

Patch 445D does not introduce:

- religious symbols
- religious copy
- church imagery
- relationship assumptions
- holiday-specific instructions
- playful decoration inside serious forms

The theme communicates spring freshness rather than doctrine or celebration-specific content.

## 7. Page-Category Intensity

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

## 8. Navigation

The global header and mobile full-screen menu keep their existing structure and behavior.

Easter changes affect only safe surfaces, borders and ambient backgrounds:

- mobile menu remains fully opaque
- Account remains visible immediately
- Your Pizza action remains prominent
- Tools and Learn remain scan-friendly
- focus behavior remains unchanged

Pale yellow or green is not used as navigation text.

## 9. Homepage

The homepage receives a fresh spring atmosphere through the global page background and existing themed surfaces.

Preserved:

- copy
- CTA hierarchy
- pizza imagery
- responsive layout
- product positioning

No religious copy, holiday banner or animated spring decoration was added.

## 10. Forms And Authentication

Forms remain trustworthy and neutral.

Preserved:

- visible labels
- validation errors
- selected states
- disabled states
- input borders
- security-page tone

Easter green and yellow are decorative; they do not replace semantic form states.

## 11. Shopping

Shopping remains checklist-first.

Preserved:

- ingredient readability
- checkbox contrast
- category separation
- flour specification
- export controls
- pizza mix behavior
- completion semantics

Seasonal greens are not used as the sole completion signal.

## 12. Timeline

Timeline state semantics are unchanged.

Preserved:

- current step
- future steps
- completed steps
- readiness
- overdue
- scheduled time
- connectors

Spring green is not the sole carrier of any semantic status.

## 13. Kitchen

Kitchen remains execution-first.

No Easter motif is placed behind instructions, countdowns, readiness warnings, completion controls, More guidance or Review CTA.

## 14. Bake Timer

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

Easter does not theme `dt-bake-timer` states and does not replace urgency colors.

## 15. Account And Admin

Account remains calm and operational.

Admin remains neutral for campaign management. Easter preview cards receive the new registry swatches and final design status through the shared registry. Authorization, APIs, scheduling, preview isolation and stale-write handling are unchanged.

## 16. Guides And About

Guides and About receive moderate spring atmosphere through shared page and card surfaces.

Food imagery is not recolored.

## 17. Legal Pages

Privacy and Terms receive only minimal treatment:

- readable page background
- stable Ink text
- accessible link/focus behavior
- no motif inside legal content

## 18. Metadata Theme Color

The Easter metadata theme color is `#FFF9DE`.

Default and Valentine metadata remain unchanged. The remaining seasonal metadata remains foundation-only.

## 19. Motion And Reduced Motion

Patch 445D adds no motion.

There are no falling petals, floating eggs, animated leaves, pulsing backgrounds or looping decorative effects.

## 20. Accessibility Validation

Focused tests verify:

- Ink text meets AA contrast on Easter surfaces
- muted text remains readable on the Easter primary surface
- darker green hover/accent support meets AA contrast on the Easter page background
- Easter does not override semantic status tokens
- Easter does not override Bake Timer urgency selectors

The lighter spring green and yolk-gold are decorative and not used as body text.

## 21. Responsive Validation

The implementation adds no layout boxes, route-specific components, image assets or absolute overlays.

Responsive validation focuses on existing overflow protections, mobile menu opacity and representative page rendering at target mobile and desktop widths.

## 22. Changed Files

- `lib/public-themes.ts`
- `app/globals.css`
- `tests/public-themes.test.ts`
- `docs/audits/patch-445d-easter-final-design.md`

## 23. Regression Boundaries

Unchanged:

- Default
- finalized Valentine
- Summer, Harvest, Halloween and Christmas foundation definitions
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

## 24. Known Limitations

- Patch 445D does not add screenshots.
- Patch 445D does not finish Summer, Harvest, Halloween or Christmas.
- Patch 445D does not apply the Patch 445A migration.
- Page-category intensity remains token-driven rather than route-class driven.
- Manual visual review remains useful for perceived spring motif density.

## 25. Next Implementation Patch

Recommended next action: Patch 445E Summer final design.
