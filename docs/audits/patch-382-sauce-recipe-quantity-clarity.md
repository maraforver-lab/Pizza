# Patch 382 - Sauce recipe and quantity clarity

## Scope

Patch 382 makes `/sauce` a recipe-first quantity tool. The patch changes the Sauce page, the Sauce calculator presentation, Sauce SEO metadata, focused Sauce tests and one durable responsive UX rule for food calculators.

This patch does not change Pizza Session schema, persistence, authentication, pricing, Party Orders, Quick Calculator, Recipe, Shopping, Timeline, Kitchen Mode, `/guide`, `/guides/dough`, `/styles`, `/ovens` or unrelated routes.

## Previous Page Hierarchy

The previous `/sauce` page used this hierarchy:

1. Hero with `Calculate the right amount. Choose the right sauce.`
2. Large calculator with controls before the primary result on mobile.
3. Practical recommendation section.
4. Tomato choice card wall.
5. Sauce method card wall.
6. Oven adjustment card wall.
7. Troubleshooting card grid.
8. Advanced detail disclosures.
9. Related learning and final Pizza Session CTA.
10. Canonical footer.

Patch 377 measured `/sauce` as one of the long public tool routes. The route had useful content, but mobile users had to move through a long article/tool hybrid before the page felt complete.

## Previous Friction

Mobile friction:

- many controls appeared before the user had finished reading the core answer;
- recipe preparation was not named as `How to make pizza sauce`;
- tomato, method and oven explanations were separate full sections;
- the page repeated sauce purpose across hero, recommendation and card walls;
- two `/session/start` links existed on the full page including footer, though only one page-level final CTA was before the footer.

Desktop friction:

- the page was 7+ screens on the measured desktop viewports;
- small guidance topics occupied full-width sections;
- several sauce concepts had equal visual weight even when they were secondary to quantity and recipe use.

## Canonical Sauce Amount Source

The `/sauce` route uses `lib/pizza-sauce-calculator.ts` as the canonical Sauce tool source:

- `defaultSauceCalculatorInput()`
- `defaultSauceGramsForMethod()`
- `calculatePizzaSauce()`
- `formatGrams()`

Default Sauce tool starting amounts:

- Classic Neapolitan: 70 g per pizza.
- Marinara: 80 g per pizza.
- Home-oven cooked sauce: 80 g per pizza.

No new independent Sauce page amount constant was introduced.

`lib/pizza-sauce.ts` still exists as an unused legacy helper. Repository search found no current imports of its `calculateSauce()` function. It was not removed in this patch because the task did not require dead-code cleanup.

## Sauce-Per-Pizza Assumptions

The visible recommendation is a starting point, not a strict rule. The page states that it assumes:

- a typical 30-32 cm pizza;
- the selected sauce style;
- restrained practical coverage;
- a small preparation reserve for bowl, spoon and spreading variation;
- adjustment when pizza size, oven heat, cheese moisture or style changes.

The page does not add a diameter input because the existing Sauce calculator has no canonical diameter model. Size variation remains an adjustment through the existing `Sauce per pizza` control.

## Style And Size Behavior

Style behavior comes from `defaultSauceGramsForMethod()`:

- Classic Neapolitan starts lower at 70 g.
- Marinara and Home-oven cooked start at 80 g.
- The user can change the per-pizza value from 30 g to 140 g.

Size behavior is not calculated from a diameter formula in the current Sauce tool. The page now says the amount should be raised for larger, thicker, pan-style or sauce-forward pizzas and reduced for lighter coverage or moisture-sensitive bakes.

## Total Calculation Behavior

The Sauce tool still calculates:

`pizza count x sauce grams per pizza = base target`

Then it applies the selected preparation reserve:

`base target x (1 + reserve percent) = finished sauce total`

Home-oven cooked sauce also calculates starting tomato quantity from the selected reduction:

`starting tomato mass = required finished sauce / (1 - reduction fraction)`

Rounding remains in `calculatePizzaSauce()` and `formatGrams()`. The page now shows one canonical visible `Total sauce` result near the top.

## Recipe Method Retained

The calculator now renders a dynamic `How to make pizza sauce` ordered list near the amount result.

Retained methods:

- Classic Neapolitan raw sauce.
- Marinara.
- Home-oven cooked sauce.

The steps use the existing ingredient and method model. The patch does not invent a universal sauce recipe or remove existing method behavior.

## Recipe And Quantity Connection

The result connects the batch to use on the pizza:

- visible `Sauce per pizza`;
- visible `Pizzas`;
- visible `Total sauce`;
- recipe note that the finished batch covers selected pizzas plus reserve;
- per-pizza application step;
- batch ingredient list from the calculated result.

The page does not add a separate recipe-yield system. The reliable yield remains the calculated finished sauce total.

## Removed Or Consolidated

Removed from active `/sauce`:

- separate tomato choice card wall;
- separate method card wall;
- separate oven adjustment card wall;
- old practical recommendation section;
- large `SauceMistakeCard` component;
- hero anchor CTA `Calculate my sauce`.

Consolidated into compact sections:

- amount and recipe in `SauceCalculator`;
- style, size and oven advice in `Adjust the sauce`;
- watery/thick/wet/flat corrections in `Texture and troubleshooting`;
- tomato, salt and storage notes in `Useful details without a second recipe`.

## Final Page Hierarchy

The final `/sauce` page order is:

1. Compact hero.
2. Sauce calculator with early amount summary and recipe steps.
3. Adjust the sauce.
4. Texture and troubleshooting.
5. Useful notes and source link.
6. Related learning and one final `Plan my next pizza` CTA.
7. Canonical `SiteFooter`.

## Consistency With Pizza Session And Shopping

Consistency checks:

- `/sauce` uses `lib/pizza-sauce-calculator.ts`.
- Pizza Session Shopping uses `lib/pizza-session-shopping-list.ts` topping estimates.
- Shopping estimates are preset-specific: Margherita 60 g, Marinara 70 g, Diavola/Funghi/Prosciutto 55 g, and no tomato sauce for Quattro Formaggi.
- The Sauce tool defaults are method-specific: 70 g or 80 g depending on method.

These are not the same assumption model. No broad ingredient architecture change was made. The Patch 382 report records this as a deferred product alignment question rather than forcing Shopping to inherit the standalone Sauce calculator.

## Before And After Measurements

Measured with local production build and Chrome.

Before Patch 382:

| Viewport | Height | Screens | Visible controls | Headings |
| --- | ---: | ---: | ---: | ---: |
| 390 x 844 | 12,364 px | 14.65 | 32 | 14 |
| 430 x 740 | 12,014 px | 16.24 | 32 | 14 |
| 1280 x 900 | 6,818 px | 7.58 | 28 | 14 |
| 1440 x 950 | 6,818 px | 7.18 | 28 | 14 |

After Patch 382:

| Viewport | Height | Screens | Visible controls | Notes |
| --- | ---: | ---: | ---: | --- |
| 390 x 844 | 7,852 px | 9.30 | 29 | no overflow |
| 430 x 740 | 7,500 px | 10.14 | 29 | no overflow |
| 1280 x 900 | 4,536 px | 5.04 | 29 | no overflow |
| 1440 x 950 | 4,536 px | 4.77 | 29 | no overflow |

Source size:

- `app/sauce/page.tsx`: 350 lines -> 203 lines.
- `components/sauce/SauceCalculator.tsx`: 375 lines -> 427 lines.
- Net patch removes more page-level article weight than it adds to the functional recipe calculator.

## Browser Validation

Production build was validated at:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Observed in all viewports:

- Sauce per pizza visible near the top.
- Pizzas visible near the top.
- Total sauce visible near the top.
- `How to make pizza sauce` is present near the calculator result.
- No horizontal overflow.
- Controls are not clipped.
- Canonical footer remains present.
- One page-level `Plan my next pizza` CTA appears before the footer.
- Old separate tomato/method/oven card-wall headings are absent.
- Console errors: none.

Interactive states checked:

- default: 4 pizzas, 70 g per pizza, 308 g total with reserve;
- one pizza: 77 g total;
- several pizzas: 12 pizzas, 924 g total;
- maximum clamp: 30 pizzas, 2,310 g total;
- minimum clamp: 1 pizza, 77 g total;
- Marinara: 80 g per pizza;
- Home-oven cooked: 80 g per pizza;
- reload returns to default component state.

Disclosures checked:

- `Adjust tomato, salt and batch details` opens and closes.
- `Sauce too watery` opens and closes.

Retained route links returned HTTP 200:

- `/ovens`
- `/toppings`
- `/guide/pizza-troubleshooting`
- `/methodology#pizza-sauce`
- `/session/start`

## Accessibility Validation

Preserved or improved:

- one clear H1;
- logical H2/H3 hierarchy;
- form labels for pizza count, sauce per pizza, salt and tomato controls;
- keyboard-operable native buttons, inputs, selects and details summaries;
- visible focus styles;
- `aria-live="polite"` on calculated result area;
- `aria-pressed` on selectable option buttons;
- ordered list for recipe steps;
- text labels for calculated values and units;
- result does not rely on color alone.

Native `<details>` disclosures are used for advanced controls and troubleshooting. They preserve keyboard operation and platform accessibility behavior without custom state code.

## SEO Validation

SEO intent is preserved around:

- pizza sauce;
- how to make pizza sauce;
- pizza sauce amount;
- sauce per pizza;
- pizza sauce recipe.

Updated canonical SEO metadata:

- title: `Pizza Sauce Recipe and Calculator | DoughTools`
- description: `Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.`

No global indexing behavior changed.

## Tests And Build

Focused Sauce tests passed:

- `tests/pizza-sauce-calculator.test.ts`

Result: 1 file passed, 24 tests passed.

Related focused tests passed:

- `tests/pizza-sauce-calculator.test.ts`
- `tests/cta-language.test.ts`
- `tests/learning-architecture.test.ts`
- `tests/navigation.test.ts`
- `tests/homepage.test.ts`
- `tests/site-footer.test.ts`
- `tests/public-source-disclosure.test.ts`
- `tests/pizza-session-shopping-list.test.ts`

Result: 8 files passed, 125 tests passed.

Lint passed: `npm run lint`.

Build passed: `npm run build`.

Full-suite and final diff validation were run after this report was added.

## Durable Rule Added

Added to `docs/global-responsive-ux-rules.md` under Tool pages:

> for food calculators, show the unit amount, total amount and key assumption before secondary education or troubleshooting content

## Deferred Findings

- Sauce tool and Pizza Session Shopping use different assumption models. They are both covered by tests, but a future product patch could decide whether Shopping should expose or reuse the Sauce tool method model.
- `lib/pizza-sauce.ts` appears unused. It was not removed in this patch.
- The Sauce tool still has no diameter-based formula. Size variation is handled manually through the per-pizza amount control.
