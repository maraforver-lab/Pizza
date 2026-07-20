# Patch 445C: Valentine Final Design

## 1. Patch 445B Specification Used

Patch 445C implements the Valentine direction approved in `docs/audits/patch-445b-seven-theme-visual-design-audit.md`.

The governing conclusion was:

`Foundation architecture is ready for per-theme implementation`

The implementation keeps the Patch 445A campaign architecture unchanged. It only finalizes the `valentine` registry metadata, Valentine-owned theme tokens, a restrained CSS background motif and focused visual-contract tests.

## 2. Final Valentine Palette

| Role | Value |
| --- | --- |
| Page background | `#FFF3F1` |
| Secondary page wash | `#F7E1DD` |
| Primary surface | `#FFFBFA` |
| Muted surface | `#F7E1DD` |
| Elevated surface | `#FFFBFA` |
| Normal border | `#EBC8C1` |
| Strong border | `#D9AAA0` |
| Text | `#1F1F1F` through the canonical Ink token |
| Muted text | `#6B645D` through the canonical muted token |
| Non-semantic accent | `#D94238` |
| Accent hover | `#C7352E` |
| Soft accent | `rgba(217, 66, 56, .09)` |
| Secondary accent | `#7A2D2C` |
| Header surface | `rgba(255, 243, 241, .96)` |
| Header border | `rgba(122, 45, 44, .14)` |
| Decorative | `rgba(217, 66, 56, .11)` |
| Secondary decorative | `rgba(122, 45, 44, .08)` |
| Metadata theme color | `#FFF3F1` |

## 3. Final Token Values

Patch 445C extends the root seasonal token contract with safe defaults and supplies Valentine-specific values for:

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

Focus remains tied to the canonical DoughTools focus color. Semantic status colors are not themed.

## 4. Motif Implementation

The Valentine motif is CSS-only and uses sparse radial gradients on the page background.

It suggests paired circular forms and a shared-table rhythm without adding literal heart icons, external images, SVG assets or route-specific markup.

The motif is:

- non-interactive
- not focusable
- not present in the accessibility tree
- outside component layout
- restrained enough for dense workflow pages
- static, with no motion or reduced-motion dependency

## 5. Page-Category Intensity

The implementation follows Patch 445B's intensity matrix:

- Homepage, guides and About receive the strongest effect through the global page atmosphere and existing themed `bg-cream`/`border-flour` treatment.
- Session Start, Recipe, Shopping, Timeline, Review, Account, Party Orders and Admin receive restrained surface and border tint.
- Kitchen, Bake Timer, standalone Bake Timer, Privacy and Terms receive only the minimal page/surface treatment already available through shared tokens.

No route layout, information architecture or page copy changed.

## 6. Navigation Treatment

The global header and mobile menu continue using the existing structure.

Valentine changes affect navigation through safe surface and border tokens only:

- mobile menu remains opaque
- Account remains first in the mobile menu
- Continue/Start Pizza remains the primary mobile action
- Tools remain visible
- Learn disclosure behavior is unchanged
- focus rings remain the canonical DoughTools focus style

No seasonal decoration is inserted behind navigation labels.

## 7. Homepage Treatment

The homepage receives a warmer rose-cream atmosphere through global background gradients and themed `bg-cream`/`border-flour` surfaces.

Preserved:

- copy
- CTA hierarchy
- pizza imagery
- product section order
- responsive layout

No romantic copy, relationship assumptions or greeting-card banner was introduced.

## 8. Forms And Planning Pages

Forms remain neutral and trustworthy.

Preserved:

- label visibility
- input borders
- validation styling
- selected states
- disabled states
- account/admin operational clarity

Valentine red is not used as an error replacement. The final accent is decorative, while body text stays Ink.

## 9. Shopping

Shopping keeps the checklist-first hierarchy.

Preserved:

- checklist state
- ingredient grouping
- flour specification
- export controls
- pizza mix behavior
- completion semantics

No completion state was recolored into Valentine red.

## 10. Timeline

Timeline state semantics are unchanged.

Preserved:

- current-step emphasis
- future/completed distinctions
- readiness
- overdue
- scheduled time
- connectors

Valentine tokens only affect ambient surfaces and borders.

## 11. Kitchen

Kitchen remains execution-first.

No motif or decoration is added behind:

- current instructions
- countdowns
- timing information
- readiness warnings
- completion controls
- More guidance
- Review CTA

The page receives only the minimal shared background/surface treatment.

## 12. Bake Timer

Bake Timer behavior remains fully authoritative.

Preserved:

- large countdown
- progress ring
- final 20 seconds
- final 10 seconds
- 3-2-1 cadence
- overtime
- flame
- alarm controls
- sound toggle
- reduced-motion behavior
- local-only runtime state

Patch 445C does not theme `dt-bake-timer` states and does not override semantic urgency colors.

## 13. Account And Admin

Account remains calm and trustworthy.

Admin remains operational and neutral. Valentine preview cards receive the updated registry swatches and final design status through the shared theme registry. Admin authorization, APIs, campaign scheduling, stale-write handling and preview isolation are unchanged.

## 14. Guides And About

Guides and About receive moderate Valentine atmosphere through the global page treatment and existing shared surfaces.

Food imagery is not recolored. No copy changes were made.

## 15. Legal Pages

Privacy and Terms receive only minimal theme treatment:

- readable neutral page background
- stable Ink text
- safe borders and links through existing shared styling
- no decorative motif inside legal content

## 16. Metadata Theme Color

The Valentine metadata theme color is `#FFF3F1`.

Default and all other theme metadata colors remain unchanged.

## 17. Motion And Reduced Motion

Patch 445C adds no animation.

The motif is static. Existing Bake Timer motion and reduced-motion behavior remain unchanged.

## 18. Accessibility Validation

Focused tests verify:

- Ink text meets AA contrast on Valentine surfaces
- muted text remains readable on the Valentine primary surface
- burgundy secondary accent meets AA contrast on the Valentine page background
- Valentine does not override semantic status tokens
- Valentine does not override Bake Timer urgency selectors

The rose accent is treated as decorative/non-semantic and is not used as body text.

## 19. Responsive Validation

The implementation does not add layout boxes, absolute overlays, new assets or route-specific markup.

Responsive risk is therefore limited to shared token tinting. Focused navigation and responsive tests validate that the mobile menu and existing overflow protections remain intact.

## 20. Changed Files

- `lib/public-themes.ts`
- `app/globals.css`
- `tests/public-themes.test.ts`
- `docs/audits/patch-445c-valentine-final-design.md`

## 21. Regression Boundaries

Unchanged:

- canonical theme IDs
- campaign table
- migrations
- RLS
- admin authorization
- activation APIs
- scheduling APIs
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

## 22. Known Limitations

- Patch 445C does not add screenshot assets.
- Patch 445C does not introduce page-category route classes; intensity is achieved through shared token behavior.
- Patch 445C does not finish Easter, Summer, Harvest, Halloween or Christmas.
- Patch 445C does not apply the Patch 445A migration.
- Manual browser review is still useful for perceptual motif density and food image accuracy.

## 23. Next Implementation Patch

Recommended next action: Patch 445D Easter final design.
