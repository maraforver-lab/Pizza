# Patch 445H: Christmas Final Design

## 1. Patch 445B Specification Used

Patch 445H implements the Christmas direction approved in `docs/audits/patch-445b-seven-theme-visual-design-audit.md`.

Patch 445B concluded:

`Foundation architecture is ready for per-theme implementation`

Patch 445H keeps the Patch 445A campaign architecture unchanged and preserves all earlier finalized themes.

## 2. Christmas Design Intent

The Christmas theme is warm, festive, generous, calm, winter-evening inspired and recognizably DoughTools.

It avoids blinking lights, falling snow, religious symbols, large festive banners, gift-shop styling, novelty typography, animated particles and normal UI that resembles error or success states.

## 3. Final Palette

| Role | Value |
| --- | --- |
| Page background | `#F8F1E6` |
| Secondary page wash | `#E9DDCA` |
| Primary surface | `#FFF9F0` |
| Muted surface | `#EADFCE` |
| Elevated surface | `#FFF9F0` |
| Normal border | `#D9C8AD` |
| Strong border | `#BFA781` |
| Text | `#1F1F1F` through canonical Ink |
| Muted text | `#6B645D` through canonical muted text |
| Accent | `#8F2626` |
| Accent hover | `#6F1D1D` |
| Soft accent | `rgba(143, 38, 38, .09)` |
| Secondary accent | `#0F3D2E` |
| Decorative | `rgba(232, 201, 138, .22)` |
| Secondary decorative | `rgba(15, 61, 46, .10)` |
| Header surface | `rgba(248, 241, 230, .96)` |
| Header border | `rgba(15, 61, 46, .16)` |
| Metadata theme color | `#F8F1E6` |

## 4. Final Token Values

Patch 445H supplies Christmas-specific values for the shared public theme token contract:

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

The Christmas motif is CSS-only and static.

It uses warm-light dots, a restrained red ribbon line and soft forest atmosphere in the page background. It does not add trees, Santa imagery, reindeer, presents, religious symbols, falling snow, blinking lights, external assets, SVG additions or route-specific seasonal components.

The motif is decorative, non-interactive, not focusable and not represented in the accessibility tree.

## 6. Festive And Winter-Evening Direction

The final direction gives DoughTools a warm winter-evening atmosphere without changing it into a holiday shop or seasonal landing page.

## 7. Cultural And Religious Neutrality

Patch 445H does not introduce religious symbols, religious copy, assumptions about celebration, or holiday instructions. The theme uses broadly festive light and color cues only.

## 8. Semantic Red And Green Separation

Christmas red and green are decorative. They do not replace:

- error
- destructive
- warning
- overdue
- success
- completion
- ready
- Bake Timer final-ten
- Bake Timer overtime

Tests verify that Christmas preview swatches do not reuse canonical tomato error red or basil success green.

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

Christmas changes affect only safe surfaces, borders and ambient backgrounds:

- mobile menu remains fully opaque
- Account remains visible immediately
- Your Pizza action remains prominent
- Tools and Learn remain scan-friendly
- focus behavior remains unchanged

Red is not used as a destructive replacement and green is not used as a completion-only cue.

## 11. Homepage

The homepage receives warm festive atmosphere through the global background and existing themed surfaces.

Preserved:

- copy
- CTA hierarchy
- pizza imagery
- responsive layout
- product positioning

No holiday copy, large banner, blinking lights or snow effect was added.

## 12. Forms And Authentication

Forms remain trustworthy and neutral.

Preserved:

- visible labels
- validation errors
- selected states
- disabled states
- input borders
- security-page tone

Christmas red and green are decorative; they do not replace semantic form states.

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

No festive motif is added inside dense checklist rows and food imagery is not recolored.

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

Christmas red and green do not replace overdue, warning, completion or ready states.

## 15. Kitchen

Kitchen remains execution-first.

No Christmas motif is placed behind instructions, countdowns, readiness warnings, completion controls, More guidance or Review CTA.

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

Christmas does not theme `dt-bake-timer` states and does not replace urgency colors. Normal timer presentation cannot be confused with final-ten or overtime.

## 17. Account And Admin

Account remains calm and operational.

Admin remains neutral for campaign management. Christmas preview cards receive the new registry swatches and final design status through the shared registry. Authorization, APIs, scheduling, preview isolation and stale-write handling are unchanged.

## 18. Guides And About

Guides and About receive moderate Christmas atmosphere through shared page and card surfaces.

Food imagery is not recolored and no religious or holiday copy was added.

## 19. Legal Pages

Privacy and Terms receive only minimal treatment:

- readable page background
- stable Ink text
- accessible link/focus behavior
- no motif inside legal content

## 20. Metadata Theme Color

The Christmas metadata theme color is `#F8F1E6`.

Default and all earlier finalized theme metadata remain unchanged.

## 21. Motion And Reduced Motion

Patch 445H adds no motion.

There is no falling snow, blinking light, pulsing star, moving branch, particle loop, animated ribbon or parallax.

## 22. Accessibility Validation

Focused tests verify:

- Ink text meets AA contrast on Christmas surfaces
- muted text remains readable on the Christmas primary surface
- darker hover accent and forest accent meet AA contrast on the Christmas page background
- Christmas does not override semantic status tokens
- Christmas does not override Bake Timer urgency selectors

The decorative red and green are not used as body text or sole semantic signals.

## 23. Responsive Validation

The implementation adds no layout boxes, route-specific components, image assets or absolute overlays.

Responsive validation focuses on existing overflow protections, mobile menu opacity and representative page rendering at target mobile and desktop widths.

## 24. Changed Files

- `lib/public-themes.ts`
- `app/globals.css`
- `tests/public-themes.test.ts`
- `docs/audits/patch-445h-christmas-final-design.md`

## 25. Regression Boundaries

Unchanged:

- Default
- finalized Valentine
- finalized Easter
- finalized Summer
- finalized Harvest
- finalized Halloween
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

- Patch 445H does not add screenshots.
- Patch 445H does not apply the Patch 445A migration.
- Page-category intensity remains token-driven rather than route-class driven.
- Manual visual review remains useful for perceived festive density.

## 27. Next Implementation Patch

Recommended next action: Patch 445I cross-theme consistency and contrast audit.
