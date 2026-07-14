# Patch 383 - Sauce quantity consistency

## Scope

Patch 383 aligns sauce quantity semantics across `/sauce`, Pizza Session Recipe and Pizza Session Shopping without changing dough formulas, session schema, persistence, authentication, pricing, Party Orders or unrelated routes.

Starting production commit: `43f22185`.

## Terminology

| Term | Meaning |
| --- | --- |
| Sauce per pizza | Finished sauce applied to one pizza |
| Finished sauce total | Sauce applied across all pizzas |
| Preparation total | Finished sauce plus explicit reserve |
| Raw tomato requirement | Input needed to prepare the sauce |
| Shopping purchase quantity | Practical package-rounded amount to buy |

## Previous Sauce Quantity Sources

| Source | Previous quantity behavior | Status after Patch 383 |
| --- | --- | --- |
| `lib/pizza-sauce-calculator.ts` | `/sauce` canonical method defaults: Classic Neapolitan 70 g, Marinara 80 g, Home-oven cooked 80 g. It also applied reserve and can rounding. | Retained and extended as the canonical sauce quantity source. |
| `components/sauce/SauceCalculator.tsx` | Displayed `Total sauce` using the old `finishedSauceGrams` field, which included reserve. | Displays `Finished total` before reserve and explicitly states preparation total with reserve. |
| `lib/pizza-session-shopping-list.ts` | Hard-coded Shopping estimates: Margherita 60 g, Marinara 70 g, Diavola/Funghi/Prosciutto 55 g, Quattro Formaggi no sauce. | Uses `calculateSessionPizzaSauce()` from `lib/pizza-sauce-calculator.ts`. |
| `app/session/recipe/page.tsx` | Showed dough quantities only. No visible sauce quantity. | Adds one separate sauce summary card when the session pizza mix includes tomato sauce. |
| `components/session/ShoppingListExportCard.tsx` | Rendered the already generated Shopping item amounts. | Unchanged; inherits the corrected Shopping item amounts. |
| `formatShoppingListPlainText()` | Exported the already generated Shopping item amounts. | Unchanged; inherits the corrected Shopping item amounts. |
| Party Orders | Collected pizza choices and created Pizza Session `pizzaMix`; did not calculate sauce. | Unchanged; downstream Shopping calculates sauce from the handed-off `pizzaMix`. |
| `lib/pizza-sauce.ts` | Legacy helper with separate style names and no current imports found by repository search. | Left untouched as out-of-scope legacy code. |
| `lib/topping-calculator.ts` and `lib/topping-balance-lab.ts` | Topping Lab visual/reference sauce loads such as 75 g, 85 g, 120 g and scenario presets. | Documented as separate visual-lab assumptions; not changed. |
| `components/costs/PizzaCostsPlayfulClient.tsx` and cost tests | Cost calculator assumption `sauceGrams: 80` for economics estimates. | Documented as a cost-estimate input; not changed. |
| `lib/bake-result.ts` | Optional saved bake note fields `sauceStyle` and `sauceAmount`. | Documented as user/bake metadata; not changed. |

## Audit Answers

1. Canonical Sauce tool amounts are Classic Neapolitan 70 g, Marinara 80 g and Home-oven cooked 80 g per pizza.
2. Pizza Session now maps equivalent assumptions to those amounts: pizza-oven Margherita -> Classic Neapolitan, home-oven Margherita -> Home-oven cooked, Marinara menu pizza -> Marinara.
3. The amount does not currently vary by diameter or dough-ball size because the current product has no sauce diameter model.
4. Oven type affects Margherita in Pizza Session: home-oven sessions use the Home-oven cooked 80 g profile.
5. Shopping displays the finished sauce the user will apply to pizzas.
6. Shopping purchase quantity is rounded up to 400 g cans from the raw/preparation requirement, so it covers reserve and package rounding.
7. `/sauce` includes reserve in `preparationSauceGrams` and raw tomato/can calculations, but `finishedSauceGrams` now means the amount applied to pizzas.
8. Recipe now shows one compact sauce summary: use total, preparation total with reserve, and Shopping purchase units.
9. `Marinara` in `/sauce` is a sauce method/profile; `marinara` in Pizza Session is a cheese-free menu pizza. Patch 383 maps that menu pizza to the same Marinara sauce method because the assumptions are equivalent.
10. Previously different numbers represented a mix of true differences and semantic drift. After the patch, 55 g remains only for topping-heavy Session pizzas, while equivalent method assumptions share one source.

## Canonical Source Selected

Patch 383 extends `lib/pizza-sauce-calculator.ts` rather than creating a second sauce module.

New canonical exports:

- `sessionSauceProfileForPizza()`
- `calculateSessionPizzaSauce()`
- `formatSauceCanPurchase()`
- `SESSION_SAUCE_RESERVE_PERCENT`
- `SESSION_SAUCE_CAN_SIZE_GRAMS`

The existing `/sauce` exports remain the method source:

- `defaultSauceGramsForMethod()`
- `calculatePizzaSauce()`
- `formatGrams()`

## Sauce-Per-Pizza Contract

| Scenario | Sauce per pizza | Finished total | Preparation total | Raw tomato requirement | Shopping purchase |
| --- | ---: | ---: | ---: | ---: | --- |
| 1 Classic Neapolitan | 70 g | 70 g | 77 g | 77 g | 1 x 400 g can |
| 4 Classic Neapolitan | 70 g | 280 g | 308 g | 308 g | 1 x 400 g can |
| 4 Marinara | 80 g | 320 g | 352 g | 352 g | 1 x 400 g can |
| 4 Home-oven cooked | 80 g | 320 g | 352 g | 414 g | 2 x 400 g cans |
| 30 Classic Neapolitan | 70 g | 2,100 g | 2,310 g | 2,310 g | 6 x 400 g cans |

## Session Pizza Mapping

| Pizza Session pizza | Sauce mapping | Reason |
| --- | --- | --- |
| Margherita, pizza oven | Classic Neapolitan, 70 g | Equivalent high-heat tomato/cheese assumption. |
| Margherita, home oven | Home-oven cooked, 80 g | Existing session oven data supports the home-oven sauce method. |
| Marinara | Marinara, 80 g | Cheese-free tomato-forward pizza maps to the Sauce Marinara method. |
| Diavola | Restrained tomato session profile, 55 g | Topping-heavy pizza keeps sauce lower to avoid overload. |
| Funghi | Restrained tomato session profile, 55 g | Mushroom moisture makes the lighter sauce layer intentional. |
| Prosciutto | Restrained tomato session profile, 55 g | Topping composition is intentionally lighter than a sauce-forward pizza. |
| Quattro Formaggi | No tomato sauce | Cheese-forward white pizza. |

## Before And After Consistency

Before Patch 383:

| Scenario | `/sauce` equivalent | Shopping |
| --- | ---: | ---: |
| 4 Classic/Margherita pizza-oven | 280 g finished, 308 g prep | 240 g estimate |
| 4 Marinara | 320 g finished, 352 g prep | 280 g estimate |
| 4 Home-oven Margherita | 320 g finished, 414 g raw tomato | 240 g estimate |
| 4 Diavola | no equivalent Sauce method | 220 g estimate |

After Patch 383:

| Scenario | `/sauce` equivalent | Recipe | Shopping |
| --- | ---: | ---: | --- |
| 4 Classic/Margherita pizza-oven | 280 g finished, 308 g prep | 280 g use, 308 g prep | 280 g to use, buy 1 x 400 g can |
| 4 Marinara | 320 g finished, 352 g prep | 320 g use, 352 g prep | 320 g to use, buy 1 x 400 g can |
| 4 Home-oven Margherita | 320 g finished, 414 g raw tomato | 320 g use, 352 g prep | 320 g to use, buy 2 x 400 g cans |
| 4 Diavola | intentional Session-only profile | 220 g use, 242 g prep | 220 g to use, buy 1 x 400 g can |

## Code Changed

- `lib/pizza-sauce-calculator.ts`
- `components/sauce/SauceCalculator.tsx`
- `lib/pizza-session-shopping-list.ts`
- `app/session/recipe/page.tsx`
- `tests/pizza-sauce-calculator.test.ts`
- `tests/pizza-session-shopping-list.test.ts`
- `tests/session-recipe.test.ts`
- `docs/audits/patch-383-sauce-quantity-consistency.md`

## Tests Added Or Updated

Focused tests added or updated for:

- canonical method amounts;
- finished total vs preparation total;
- reserve behavior;
- home-oven raw tomato/reduction behavior;
- can purchase rounding;
- Session pizza sauce mapping;
- mixed pizza sauce totals;
- Shopping labels that separate `to use` from `buy`;
- Recipe's separate sauce summary;
- plain-text Shopping export using the same amount string;
- Party Order handoff continuing to provide only pizza mix and count.

Focused result before final validation:

- `npm run test -- tests/pizza-sauce-calculator.test.ts tests/pizza-session-shopping-list.test.ts tests/session-recipe.test.ts tests/party-orders.test.ts`
- Result: 4 files passed, 151 tests passed.

## Browser Validation

Production build was served locally at `http://localhost:3011` and validated with headless Chrome through Playwright using the installed Chrome executable.

Validated viewports:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Result:

| Viewport | `/sauce` | Recipe | Shopping | Reload stability | Export | Overflow | Console errors |
| --- | --- | --- | --- | --- | --- | --- | ---: |
| 390 x 844 | passed | passed | passed | passed | passed | passed | 0 |
| 430 x 740 | passed | passed | passed | passed | passed | passed | 0 |
| 1280 x 900 | passed | passed | passed | passed | passed | passed | 0 |
| 1440 x 950 | passed | passed | passed | passed | passed | passed | 0 |

Validated scenarios:

- `/sauce` default Classic Neapolitan: 70 g per pizza, 280 g finished total.
- `/sauce` Marinara: 80 g per pizza, 320 g finished total.
- `/sauce` Home-oven cooked: 80 g per pizza, 352 g preparation total with reserve for 4 pizzas.
- Pizza Session classic 4-pizza plan: Recipe 280 g use / 308 g prep / buy 1 x 400 g can; Shopping 280 g to use / buy 1 x 400 g can.
- Pizza Session home-oven 4-pizza plan: Recipe 320 g use / 352 g prep / buy 2 x 400 g cans; Shopping 320 g to use / buy 2 x 400 g cans.
- Pizza Session 12-pizza plan: Recipe 840 g use / 924 g prep / buy 3 x 400 g cans; Shopping 840 g to use / buy 3 x 400 g cans.
- Shopping export card uses the same Shopping sauce quantity strings.
- Values remained stable after route reload.

## Final Validation

Completed before merge:

| Check | Result |
| --- | --- |
| Focused sauce/session/shopping/export/cloud/party/footer tests | passed: 7 files, 220 tests |
| Full test suite | passed: 59 files, 977 tests |
| Lint | passed |
| Build | passed |
| `git diff --check` | passed with CRLF working-copy warnings only |
| Browser validation | passed at all required viewports |
| Final diff and scope inspection | completed before commit |

## Unresolved Limitations

- Pizza Session still does not expose a user-facing sauce-method choice. Patch 383 maps from existing oven and pizza menu data only.
- Pizza size is not part of the Sauce/Session sauce quantity model. Users can still adjust Sauce per pizza manually on `/sauce`.
- Topping Lab and Cost Calculator keep separate assumptions because they answer different product questions.
- `lib/pizza-sauce.ts` appears unused but was not removed because this patch is not a dead-code cleanup.

## Deferred Findings

- A future ingredient architecture patch could model pizza diameter and sauce density across Sauce, Toppings and Pizza Session.
- A future cleanup patch could remove or migrate the unused `lib/pizza-sauce.ts` helper after a dedicated import audit.
- A future Session patch could make the sauce method an explicit user choice if product research shows that is useful.

## Non-Changed Areas

Confirmed unchanged in scope:

- dough formulas;
- dough calculation helpers;
- Pizza Session schema;
- persistence and autosave contract;
- authentication;
- pricing;
- Party Order behavior;
- SEO route policy;
- Timeline;
- Kitchen Mode;
- Review;
- `/session/start`;
- unrelated learning and marketing routes.
