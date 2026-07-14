# Patch 384: Ovens practical baking guide

Branch: `patch/384-ovens-practical-baking-guide`

Audited starting commit: `07ac2d43`

Scope: `/ovens`, its hero component, focused oven tests and this audit report. No dough calculations, fermentation logic, Pizza Session schema, persistence, authentication, pricing, Party Orders or unrelated routes were changed.

## Previous page hierarchy

The previous `/ovens` page already used the simplified post-Patch 377 structure, but it still read like several overlapping guide blocks:

1. Hero with two anchor CTAs.
2. Product-support note.
3. Two broad oven cards.
4. Quick comparison list.
5. "What changes" factor cards.
6. Setup and preheat section.
7. Home-oven surface cards.
8. Six common mistake cards.
9. Goal decision section.
10. Safety note.
11. Final planning CTA.
12. Canonical footer.

Measured before:

| Viewport | Page height | Approx screens | Notes |
| --- | ---: | ---: | --- |
| 390 x 844 | 10134 px | 12.0 | Comparison began at 1041 px. |
| 430 x 740 | 9564 px | 12.9 | Comparison began at 1047 px. |
| 1280 x 900 | 5135 px | 5.7 | Comparison began at 864 px. |
| 1440 x 950 | 5087 px | 5.4 | Comparison began at 892 px. |

## Final page hierarchy

The new page answers the requested questions in order:

1. Compact hero.
2. Practical comparison: heat, preheat, placement, bake time and expected result.
3. Pizza oven and Home oven ordered bake instructions.
4. Stone, steel and tray guidance.
5. Compact troubleshooting/optimisation.
6. Pizza Session effect.
7. Safety checks.
8. One route-level final CTA to `/session/start`.
9. Canonical `SiteFooter`.

Measured after:

| Viewport | Page height | Approx screens | Notes |
| --- | ---: | ---: | --- |
| 390 x 844 | 6603 px | 7.8 | Comparison begins at 708 px. |
| 430 x 740 | 6333 px | 8.6 | Comparison begins at 714 px. |
| 1280 x 900 | 3613 px | 4.0 | Comparison begins at 714 px. |
| 1440 x 950 | 3557 px | 3.7 | Comparison begins at 742 px. |

## Oven values and sources inspected

Canonical Pizza Session bake-profile source:

- `lib/pizza-session-bake-profile.ts`
- Home oven: `75` minute preheat window, `about 5 min` bake label, `5 MIN` export overlay.
- Pizza oven: `60` minute preheat window, `60-90 sec` bake label, `90 SEC` export overlay.
- Surface guidance comes from the same profile where available.

Other inspected sources:

- `/session/start`: supported choices remain Home oven and Pizza oven.
- `lib/session-recipe.ts`: maps session oven choice into recipe/planning inputs.
- `lib/pizza-session-timeline.ts`: uses shared bake profile for oven-specific preheat scheduling/copy.
- `lib/pizza-session-kitchen.ts`: uses shared bake profile for oven-specific preheat and bake presentation.
- `lib/pizza-photo-overlay.ts`: export overlay uses `resolvePizzaSessionBakeProfile(...)`.
- `lib/baking.ts` and `lib/pizza-styles.ts`: broader recipe/style recommendations still contain style-specific practical ranges.
- `docs/research/pizza-oven-sources.md` and `docs/audits/patch-309-home-oven-behavior-audit.md`.

## Planning defaults vs practical ranges

Patch 384 keeps the page aligned with Pizza Session when assumptions match by reading `getPizzaSessionBakeProfile(...)` directly. The page labels these as planning defaults and tells users to judge doneness by rim, bottom and cheese.

Existing broader bake values remain documented as different assumptions:

- `lib/baking.ts` has Home balanced `6-9 min`, Home pan `14-18 min`, Gas balanced `60-90 s`.
- `lib/planning-fermentation-timeline.ts` has broad bake durations of Home `8` min and Pizza oven `2` min for isolated planning education.
- `lib/pizza-styles.ts` has style-specific ranges such as New York, Roman thin, Detroit and Sicilian.

These were not aligned in this patch because they represent broader recipe/style assumptions rather than the active Pizza Session bake-profile display source.

## Sections removed or consolidated

- Removed hero anchor CTAs so the first useful comparison appears immediately after the hero.
- Consolidated product-support note into the top comparison section.
- Replaced separate oven cards plus comparison rows with one comparison card per supported setup.
- Replaced "What changes", goal decision and repeated warning content with a compact Pizza Session effect section.
- Reduced six common-mistake cards to four practical feedback items plus one troubleshooting link.
- Kept safety guidance compact and before the footer.

## Pizza oven guidance

The page now shows pizza-oven guidance as ordered steps:

- preheat for the shared `60` minute Pizza Session window;
- judge floor readiness, not only flame;
- launch onto a balanced floor spot;
- rotate during the `60-90 sec` planning window;
- remove when rim, bottom and cheese are done.

## Home oven guidance

The page now gives Home oven equal weight:

- preheat for the shared `75` minute Pizza Session window;
- heat the surface, not just oven air;
- use stone, steel or tray without implying specialist equipment is mandatory;
- rotate once or twice for hot spots;
- use broiler/grill help only when safe for the user's oven;
- treat `about 5 min` as the Pizza Session planning default, not a universal guarantee.

## Stone, steel and tray behaviour

The page keeps a compact comparison:

- Steel: faster bottom heat and stronger browning.
- Stone: gentler transfer and balanced bottom heat.
- Tray: accessible fallback with a longer, less pizza-oven-like result.

No new session selections were added.

## Consistency with Pizza Session surfaces

- `/session/start` remains unchanged and still exposes Home oven and Pizza oven.
- Timeline and Kitchen Mode continue to read shared bake-profile values.
- Review and cloud export code were not changed.
- Export overlay remains tied to `resolvePizzaSessionBakeProfile(...)`.
- `/ovens` now reads the same shared bake-profile helper instead of defining page-specific oven timing constants.

## Accessibility and SEO validation

- One `h1` remains in the hero.
- Ordered instructions use semantic `<ol>`.
- The comparison is stacked cards, not a horizontally scrolling table.
- Units are visible in the text labels.
- Links remain descriptive.
- The canonical footer remains visible and no route-specific content appears after it.
- Existing `/ovens` SEO metadata was already aligned with the revised intent and was not changed.

## Browser validation

Validated from the production build with `next start` on `/ovens`:

| Viewport | Horizontal overflow | Footer | Key comparison visible | Final CTA |
| --- | --- | --- | --- | --- |
| 390 x 844 | No | Yes | Yes | `/session/start` |
| 430 x 740 | No | Yes | Yes | `/session/start` |
| 1280 x 900 | No | Yes | Yes | `/session/start` |
| 1440 x 950 | No | Yes | Yes | `/session/start` |

Visible checks passed for heat, preheat, placement, bake duration, expected result and Pizza Session effect. No `/start` links were present.

Retained link routes returned `200`:

- `/session/start`
- `/guides/dough`
- `/toppings`
- `/guide/pizza-troubleshooting`
- `/ovens`

Pizza Session browser scenario:

- Created a default Pizza oven session through `/session/start` in the production build.
- Confirmed `/session/timeline` rendered without errors.
- Confirmed `/session/kitchen` rendered without errors.
- Confirmed Timeline did not leak Home oven `stone, steel or tray` helper copy into the Pizza oven scenario.

Home oven downstream validation was covered by focused regression tests because the browser automation read-only page context could not seed localStorage directly for a second isolated session scenario.

## Tests and validation

Focused tests run during implementation:

- `npm run test -- tests/ovens.test.ts`
- `npm run test -- tests/cta-language.test.ts tests/navigation.test.ts tests/learning-architecture.test.ts`
- `npm run test -- tests/home-oven-behavior-audit.test.ts tests/pizza-session-timeline.test.ts tests/pizza-session-kitchen.test.ts tests/cloud-pizza-sessions.test.ts`
- `npm run test -- tests/session-recipe.test.ts tests/pizza-session-shopping-list.test.ts tests/pizza-session-review.test.ts tests/bake-result.test.ts tests/cloud-pizza-sessions.test.ts tests/pizza-session-timeline.test.ts tests/pizza-session-kitchen.test.ts tests/ovens.test.ts`

Final validation:

- Focused oven tests: 11 passed.
- Focused Recipe/Shopping/Review/export/Timeline/Kitchen/Ovens tests: 258 passed.
- Full suite: 59 files passed, 977 tests passed.
- Lint: `npm run lint` passed.
- Build: `npm run build` passed.
- Diff check: `git diff --check` passed with Windows LF-to-CRLF warnings only.

## Unresolved inconsistencies

The product still has multiple oven-duration concepts for different contexts:

- active Pizza Session display profile;
- isolated planning fermentation timeline;
- recipe/style bake ranges;
- style atlas strings.

Patch 384 documents this relationship and does not broaden the refactor because changing those sources would touch formulas, style assumptions or schedule behaviour outside this patch.

## Deferred work

- A future oven-data governance patch could name the relationship between session planning defaults, recipe ranges and style-specific bake labels more formally.
- If the product later restores visible pan/tray session selection, `/ovens` should add a first-class pan comparison from the same canonical source.
