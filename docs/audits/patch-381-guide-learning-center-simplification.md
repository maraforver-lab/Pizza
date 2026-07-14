# Patch 381 - Guide Learning Center simplification

## Scope

Patch 381 simplifies `/guide` into a compact Pizza Learning Center. The patch improves discovery of the existing canonical Dough Guide and Sauce guide without copying their instructions, formulas, quantities or route-specific logic into `/guide`.

Changed production surface:

- `app/guide/page.tsx`
- global Guide navigation copy
- navigation and page source tests

This patch did not change `/guides/dough`, `/sauce`, dough calculations, sauce calculations, session persistence, session schema, auth, SEO metadata or Pizza Session route behavior.

## Previous Structure

The previous `/guide` page acted like a broad dough glossary and orientation page:

1. Hero with multiple learning promises.
2. Problem-led entry cards.
3. Guided learning path band.
4. Large dough concept catalogue.
5. Hydration comparison panel.
6. Go-deeper cards.
7. Final planning CTA.
8. Canonical site footer.

This repeated dough-learning intent across the hero, cards, concept sections and bottom prompts. It also made the canonical Dough Guide and Sauce page less prominent than guide-local explanatory content.

## New Structure

The new `/guide` page order is:

1. One compact Pizza Learning Center hero.
2. Primary choices: `How to make pizza dough` and `How to make pizza sauce`.
3. Supporting guides: Ovens, Styles and Troubleshooting.
4. Compact topic shortcuts for retained legacy anchors.
5. One final CTA: `Plan my next pizza` -> `/session/start`.
6. Canonical `SiteFooter`.

## Removed Or Consolidated

Removed from `/guide`:

- the route-specific experience-level selector;
- repeated problem-entry cards;
- the guided learning path band;
- the dough concept catalogue;
- guide-local hydration comparison content;
- duplicate deeper-learning cards;
- old guide-only copy that recreated dough-learning material already covered by `/guides/dough`;
- generic repeated `Open guide` link text.

The page now links to canonical learning routes instead of restating their content.

## Dough And Sauce Discoverability

Dough and Sauce are now the first choices immediately after the hero:

- `How to make pizza dough` -> `/guides/dough`
- `How to make pizza sauce` -> `/sauce`

The Dough card uses only a short outcome description: the user learns how to make the dough and understand fermentation. The Sauce card uses only a short outcome description: the user learns sauce preparation and can see the right sauce amount for one pizza or a full batch.

No guide-specific dough amounts, sauce amounts, formulas or constants were added.

## Retained Learning Routes

The following existing routes remain discoverable from the Learning Center:

- `/guides/dough`
- `/sauce`
- `/ovens`
- `/styles`
- `/guide/pizza-troubleshooting`
- `/session/start`

All retained route links returned HTTP 200 in production-build browser validation.

## Topic Anchors

The requested legacy anchors were kept as visible compact topic cards:

- `/guide#hydration`
- `/guide#fermentation`
- `/guide#flour-strength`
- `/guide#oven-heat`

Each anchor scrolls to a visible card with a short, user-readable orientation. They are not hidden empty anchors.

`/guide#gluten-development` was also retained as a compact visible card because existing troubleshooting content still links to it. Keeping it prevents an internal hash link from landing on an unrelated page position while avoiding a return to the old long glossary.

## Navigation Rename

Global Guide navigation copy now names the guide index `Learning Center` and describes it as the place to find the dough, sauce, oven, style and troubleshooting guides.

Browser validation opened the Guide navigation in both mobile and desktop viewports and confirmed a `Learning Center` link to `/guide`.

## Page Length

Source route length:

- Before Patch 381: 509 lines in `app/guide/page.tsx`.
- After Patch 381: 180 lines.

Measured production-build screen counts after Patch 381:

- 390 x 844: 4.41 screens.
- 430 x 740: 4.87 screens.
- 1280 x 900: 2.42 screens.
- 1440 x 950: 2.30 screens.

The page is materially shorter in both source structure and rendered height.

## Browser Validation

Validated locally on the production build with `next start`.

Viewports checked:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Observed in all measured viewports:

- `How to make pizza dough` and `How to make pizza sauce` are the primary choices immediately after the hero.
- Both primary cards start within the first viewport.
- Ovens, Styles and Troubleshooting remain discoverable.
- The final CTA is `Plan my next pizza` and points to `/session/start`.
- The canonical footer is rendered.
- Horizontal overflow is false.
- Guide navigation exposes `Learning Center` on mobile and desktop.
- Removed long guide content is absent.

Route validation returned HTTP 200 for:

- `/guides/dough`
- `/sauce`
- `/ovens`
- `/styles`
- `/guide/pizza-troubleshooting`
- `/session/start`

Topic anchor validation at 390 x 844:

- `hydration`: exists, visible, near viewport after hash navigation.
- `fermentation`: exists, visible, near viewport after hash navigation.
- `flour-strength`: exists, visible, near viewport after hash navigation.
- `oven-heat`: exists, visible, near viewport after hash navigation.
- `gluten-development`: exists, visible, near viewport after hash navigation.

## Tests And Build

Focused tests passed:

- `tests/guide-learning-center.test.ts`
- `tests/learning-architecture.test.ts`
- `tests/navigation.test.ts`
- `tests/homepage.test.ts`
- `tests/dough-guide.test.ts`
- `tests/pizza-sauce-calculator.test.ts`
- `tests/site-footer.test.ts`
- `tests/pizza-troubleshooting-guide.test.ts`

Focused result: 8 files passed, 166 tests passed.

Full suite passed after final audit file creation: 59 files passed, 966 tests passed.

Lint passed: `npm run lint`.

Build passed: `npm run build`.

`git diff --check` passed with repository line-ending warnings only.

## Scope Confirmation

Confirmed unchanged by scope and diff review:

- `/guides/dough` page content
- `/sauce` page content
- dough calculations
- sauce calculations
- session calculations
- session persistence
- session schema
- auth
- SEO behavior
- Pizza Session route logic
