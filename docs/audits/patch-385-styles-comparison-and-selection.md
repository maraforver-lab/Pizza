# Patch 385: Styles comparison and selection guide

Branch: `patch/385-styles-comparison-selection`

Audited starting commit: `227ade6c`

Scope: `/styles`, its direct presentation components, focused style tests and this audit report. No Pizza Session calculations, style presets, session schema, persistence, authentication, pricing, Party Orders, SEO metadata or unrelated routes were changed.

## Previous page hierarchy

The previous `/styles` page was an atlas-first learning route:

1. Hero with two anchor CTAs.
2. "A pizza style is more than its toppings" theory section.
3. Planner support note.
4. Large visual style gallery with modal detail views.
5. Secondary architecture comparison.
6. Goal guide with another planning CTA and Learning Center link.
7. Broad related-learning group with six links.
8. Final planning CTA.
9. Canonical footer.

This kept useful information, but the first practical style comparison arrived late on mobile and the page showed multiple planning prompts.

## Previous friction

Mobile friction:

- first useful comparison began around 2,343-2,422 px down the page;
- seven large gallery cards consumed most of the route;
- support status, goal guidance and comparison were separate sections;
- three route-level `Plan my next pizza` links were present before considering footer navigation;
- optional style depth lived in modal dialogs rather than progressive disclosure in the page flow.

Desktop friction:

- the page used desktop width for a gallery wall more than a decision comparison;
- comparison content came after style cards;
- related links behaved like a miniature sitemap.

## Supported styles inventoried

Style education source:

- `lib/pizza-style-education.ts`
- educational IDs: `neapolitan`, `contemporary-neapolitan`, `new-york`, `detroit`, `roman-tonda`, `roman-al-taglio`, `sicilian`

Legacy/calculator style preset source:

- `lib/pizza-styles.ts`
- preset IDs: `neapolitan`, `contemporary`, `new-york`, `roman-thin`, `detroit`, `sicilian`

Pizza Session start source:

- `app/session/start/page.tsx`
- current oven/path choices: `Pizza oven`, `Home oven`
- current dough-style assumption: `Neapolitan-style`

Menu preset source:

- `lib/pizza-catalog.ts`
- menu/topping presets: `Margherita`, `Marinara`, `Diavola`, `Funghi`, `Prosciutto`, `Quattro Formaggi`

## First-class vs learning-only classification

First-class Pizza Session dough style:

- `Neapolitan-style`

First-class Pizza Session oven/path choices:

- `Pizza oven`
- `Home oven`

Learning-only style families on `/styles`:

- `Contemporary Neapolitan`
- `New York`
- `Detroit`
- `Roman Tonda`
- `Roman al Taglio / Teglia`
- `Sicilian / Italian-American Sicilian`

Menu presets rather than dough styles:

- `Margherita`
- `Marinara`
- `Diavola`
- `Funghi`
- `Prosciutto`
- `Quattro Formaggi`

## Terminology clarification

Patch 385 separates dough/bake style from topping identity. `/styles` now explicitly states that menu names are not dough styles and that topping/menu presets are used later for Shopping quantities.

This avoids presenting Marinara, Margherita or Quattro Formaggi as though they define hydration, fermentation, oven behavior or dough architecture.

## Canonical style sources

The page uses:

- style names, support status and qualitative learning copy from `lib/pizza-style-education.ts`;
- hydration, fermentation, flour and bake labels from `lib/pizza-styles.ts` when a matching preset exists;
- flour strength labels from `lib/flours.ts`;
- menu preset names from `lib/pizza-catalog.ts`;
- Pizza Session support wording from the existing `pizzaStyleSupportSummary` contract, with a shorter visible summary in the comparison.

No new `/styles`-local hydration, bake-temperature, bake-time or sauce quantity constants were added.

## Final comparison dimensions

Each visible style comparison now prioritizes:

- result;
- oven and bake;
- dough character;
- sauce and toppings;
- best use case;
- support status.

The comparison is stacked cards and definition rows, not a horizontally scrolling table.

## Final page hierarchy

The final `/styles` page is:

1. Compact hero.
2. Primary style comparison.
3. Quick "Which style fits your goal?" guide.
4. Practical differences: dough, oven, sauce/toppings.
5. Optional technique notes with accessible disclosure controls.
6. Compact focused-guide links.
7. One route-level final CTA: `Plan my next pizza` -> `/session/start`.
8. Canonical `SiteFooter`.

## Removed or consolidated

Removed from active `/styles` rendering:

- hero anchor CTAs;
- the separate theory section;
- the separate planner-support section;
- the large active style gallery and modal-detail experience;
- the repeated goal-guide planning CTA;
- the Learning Center return button;
- the six-link card-wall related-learning component.

Consolidated:

- support status and menu terminology into the top comparison;
- broad comparison and gallery traits into the primary style comparison;
- detailed style explanations into collapsed technique notes;
- related learning into compact focused-guide rows.

## Dough, Sauce and Ovens link strategy

The page links to focused routes instead of duplicating their instruction:

- Dough technique -> `/guides/dough`
- Sauce method and quantity -> `/sauce`
- Oven setup and bake behavior -> `/ovens`
- Troubleshooting -> `/guide/pizza-troubleshooting`

The final product action remains `/session/start`.

## Consistency with Pizza Session

Patch 385 preserves the current Pizza Session behavior:

- `/session/start` still renders without a style preselection query contract;
- the page does not invent style-specific start links;
- it does not claim that New York, Detroit, Roman or Sicilian can be directly planned in Pizza Session;
- it states that Pizza Session currently plans Neapolitan-style pizza for home ovens and pizza ovens;
- Shopping menu presets remain topping/menu behavior, not dough-style selectors.

## Measurements

Measured from local production builds.

Before Patch 385:

| Viewport | Page height | Approx screens | Major sections | Style cards | Route-level planning CTAs | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 390 x 844 | 12,230 px | 14.5 | 8 | 7 | 3 | First comparison at 2,422 px. |
| 430 x 740 | 12,022 px | 16.2 | 8 | 7 | 3 | First comparison at 2,343 px. |
| 1280 x 900 | 6,026 px | 6.7 | 8 | 7 | 3 | Gallery-first desktop layout. |
| 1440 x 950 | 6,002 px | 6.3 | 8 | 7 | 3 | Gallery-first desktop layout. |

After Patch 385:

| Viewport | Page height | Approx screens | Major sections | Style cards | Route-level planning CTAs | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 390 x 844 | 10,311 px | 12.2 | 7 | 7 | 1 | Comparison begins at 512 px. |
| 430 x 740 | 9,540 px | 12.9 | 7 | 7 | 1 | Comparison begins at 477 px. |
| 1280 x 900 | 5,257 px | 5.8 | 7 | 7 | 1 | Comparison begins at 438 px. |
| 1440 x 950 | 5,257 px | 5.5 | 7 | 7 | 1 | Comparison begins at 438 px. |

The page remains substantial because all seven style families stay discoverable, but the decision comparison now starts immediately after the hero and the page is shorter across all requested viewports.

## Browser validation

Validated from production build with `next start` on `/styles`.

Viewports:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Observed in all viewports:

- all seven style families are visible;
- primary comparison appears immediately after the hero;
- no horizontal overflow;
- no clipped text or values observed;
- route-level final CTA points to `/session/start`;
- no internal `/start` links;
- canonical footer is visible;
- disclosure controls expose `aria-expanded` and `aria-controls`;
- console errors: none.

Retained links returned HTTP 200:

- `/styles`
- `/guides/dough`
- `/sauce`
- `/ovens`
- `/guide/pizza-troubleshooting`
- `/session/start`

## Accessibility validation

Preserved or improved:

- one clear `h1`;
- comparison uses semantic `dl` rows;
- style anchors remain visible and meaningful;
- optional notes use buttons with `aria-expanded`, `aria-controls`, `role="region"` and `hidden`;
- links have descriptive names;
- status is conveyed by text badges, not color alone;
- focus-visible styles remain on links and disclosure buttons.

## SEO validation

Existing `/styles` metadata remains aligned with the revised page:

- pizza styles;
- Neapolitan, New York, Detroit, Roman and Sicilian;
- pizza crust, dough, oven, sauce and baking-method comparisons;
- current DoughTools planning support.

No global indexing policy or SEO metadata was changed.

## Tests and validation

Focused tests:

- `npm run test -- tests/pizza-styles.test.ts`
- `npm run test -- tests/cta-language.test.ts tests/navigation.test.ts tests/learning-architecture.test.ts`

Final full-suite, lint, build and diff validation were run after this report was added.

Final results:

- Focused style tests: 1 file passed, 11 tests passed.
- Focused CTA/navigation/learning tests: 3 files passed, 25 tests passed.
- Full suite: 59 files passed, 979 tests passed.
- Lint: `npm run lint` passed.
- Build: `npm run build` passed.
- Diff check: `git diff --check` passed with Windows LF-to-CRLF warnings only.

## Unresolved inconsistencies

The product still has multiple style-related concepts:

- Pizza Session path choices are oven-oriented (`Home oven`, `Pizza oven`);
- Pizza Session dough style is currently Neapolitan-style;
- legacy recipe/calculator presets include New York, Roman thin, Detroit and Sicilian;
- Quick Calculator has its own sizing presets;
- Shopping uses menu/topping presets.

Patch 385 documents and clarifies those differences on `/styles` without refactoring the underlying data model.

## Deferred work

- A future style-governance patch could centralize public style presentation metadata across `/styles`, Quick Calculator and Recipe summaries.
- A future Pizza Session planning patch could add a tested style preselection contract if the product begins supporting more than Neapolitan-style session planning.
- Existing `PizzaStyleAtlas` remains in the repository but is no longer rendered by `/styles`; deleting or repurposing it can be handled as a later cleanup if no other planned style-gallery surface needs it.

## Scope confirmation

Confirmed unchanged by diff review:

- Pizza Session calculations;
- style presets in `lib/pizza-styles.ts`;
- session schema;
- persistence and cloud sync;
- authentication;
- pricing;
- Party Orders;
- `/session/start`;
- Recipe;
- Shopping;
- Timeline;
- Kitchen Mode;
- Review;
- `/guide`;
- `/sauce`;
- `/ovens`;
- Dough Guide;
- Quick Calculator;
- SEO metadata.
