# Patch 402: Simplify playful pizza costs

Audit date: 2026-07-15

Branch: `patch/402-simplify-playful-costs`

Starting master commit: `accd87567f74b13a5ae641a14a75b16b4e7adad5`

## 1. Intended Standalone Role

`/costs` remains a standalone public insight tool. It helps a user estimate a pizza-night cost, compare it with takeaway, and understand which assumptions drive the result.

The page does not require a Pizza Session, account, active session, cloud row, Shopping list, Party Order or Kitchen state. It stays anonymous and local to the page.

## 2. Previous Page Structure

The previous page behaved like a fuller cost workspace:

1. branded header with route-local links to Toppings and Learning
2. hero with "Pizza Night Economics", "Just for fun" and a scroll-to-input button
3. visible currency selector
4. separate pizza-count and diner controls
5. visible ingredient-assumption panel
6. visible restaurant-equivalent panel
7. sticky summary result
8. full home-cost breakdown
9. two explanatory insight cards
10. final CTA plus secondary "try another comparison" action
11. related-learning card
12. canonical footer

## 3. Previous Complexity

Source comparison:

| Measure | Before | After |
| --- | ---: | ---: |
| Component lines | 598 | 546 |
| Top-level page sections in source | 9 | 6 |
| Default visible numeric controls | about 13 | 3 |
| Native disclosures | 1 | 1 |
| `/session/start` links | 1 | 1 |

The old default mobile view asked for too many accounting-style assumptions before the user could focus on the core comparison. It also exposed related learning and repeated explanatory cards that were not necessary for this utility's primary job.

## 4. Cost Assumptions Inspected

Inspected:

- `app/costs/page.tsx`
- `app/costs/layout.tsx`
- `components/costs/PizzaCostsPlayfulClient.tsx`
- `lib/cost-calculator.ts`
- `lib/cost-comparison.ts`
- SEO configuration for `/costs`
- Costs tests
- Patch 399 utility-role audit

The retained assumptions are:

- pizza count
- dough-ball weight
- hydration
- salt
- flour price per kg
- sauce grams and price per kg
- cheese grams and price per kg
- other toppings grams and price per kg
- oil, basil and seasoning per pizza
- oven energy per session
- packaging per pizza
- waste percentage
- takeaway price per pizza
- currency label

The page still states that currency is only a label and does not fetch live ingredient prices, restaurant prices, exchange rates or location data.

## 5. Formulas Preserved Or Corrected

No calculation formula was changed.

The page still calls:

- `calculatePizzaCost(values)`
- `getCostComparisonSummary({ homeTotal: result.total, restaurantTotal: result.revenue })`

The only calculation-facing presentation change is that the primary "Homemade estimate per pizza" control adjusts existing ingredient price assumptions together while continuing to use the existing cost formula. Raw formula modules were not changed.

The default takeaway comparison now starts with an editable illustrative value so the page can show the comparison immediately. It is labelled as an estimate, not a current market price.

## 6. Inputs Retained

Visible by default:

- `Number of pizzas`
- `Homemade estimate per pizza`
- `Takeaway price per pizza`
- currency selector

Behind `How these estimates work`:

- all detailed dough, topping, energy, packaging and waste assumptions

## 7. Inputs Removed Or Demoted

Removed from the default visible flow:

- diners
- dough-ball weight
- hydration
- salt
- flour price
- sauce amount and price
- cheese amount and price
- other topping amount and price
- oil, basil and seasoning
- oven energy
- packaging
- waste

These were not deleted from the model. The useful detailed controls are now available inside one optional assumptions disclosure.

## 8. Final Result Hierarchy

The final page hierarchy is:

1. compact hero
2. three primary inputs and currency
3. immediate homemade-versus-takeaway result
4. one playful insight
5. concise homemade cost breakdown
6. one assumptions disclosure
7. one final Pizza Session CTA
8. canonical footer

## 9. Playful Insight Retained

The page now shows one playful comparison:

`One takeaway pizza buys about X homemade pizzas.`

This keeps the page light without adding several competing "savings" or guilt-oriented claims.

## 10. Assumptions Disclosure

The assumptions section uses a native closed `<details>` / `<summary>` control:

`How these estimates work`

It contains the concise method explanation, full line-item breakdown and detailed assumption controls. It is keyboard-operable and not nested.

## 11. Mobile Before And After

Validated viewports:

| Viewport | Before source estimate | After browser result |
| --- | --- | --- |
| 390x844 | about 7.1 screens from Patch 399 audit | 4.4 screens, 7.0 screens with assumptions open |
| 430x740 | about 7+ screens from old structure | 4.9 screens, 7.8 screens with assumptions open |

Mobile now shows only three primary numeric inputs by default and keeps the detailed assumptions closed. No horizontal overflow or clipped values appeared.

## 12. Desktop Before And After

Validated viewports:

| Viewport | Before Patch 399 audit | After browser result |
| --- | ---: | ---: |
| 1280x900 | 3.3 screens | 2.2 screens, 3.8 screens with assumptions open |
| 1440x950 | 3.2 screens | 2.1 screens, 3.6 screens with assumptions open |

Desktop uses side-by-side input and result columns, then a compact insight/breakdown row. It does not add extra desktop-only explanation.

## 13. Accessibility

Verified:

- one `h1`
- labelled numeric inputs
- plus/minus buttons with `aria-label`
- result region with `aria-live="polite"`
- visual comparison with textual totals
- comparison does not depend only on color
- native disclosure semantics
- focusable final CTA

## 14. SEO

No SEO configuration, sitemap entry or indexing policy changed.

The route still preserves search intent around:

- homemade pizza cost
- cost per pizza
- pizza night cost
- homemade versus restaurant or takeaway pizza
- pizza ingredient cost

## 15. Tests

Focused tests:

`npm run test -- tests/cost-calculator.test.ts tests/cta-language.test.ts tests/homepage.test.ts tests/navigation.test.ts tests/seo-config.test.ts tests/site-footer.test.ts tests/start-pizza-session-wizard.test.ts`

Result: 7 files passed, 132 tests passed.

Full suite:

`npm run test`

Result: 61 files passed, 1017 tests passed.

Lint:

`npm run lint`

Result: passed.

Build:

`npm run build`

Result: passed. `/costs` built as a static route, 9.63 kB route size and 120 kB first load JS.

## 16. Browser Validation

Production server: `next start` on `localhost:3000`.

Browser method: headless Chrome via DevTools Protocol. The in-app browser runtime was attempted first, but setup failed with `Cannot redefine property: process`, so CDP was used for the required validation.

Validated viewports:

- 390x844
- 430x740
- 1280x900
- 1440x950

Validated states:

- default
- one pizza
- multiple pizzas
- low homemade-cost assumption
- high homemade-cost assumption
- low takeaway price
- high takeaway price
- assumptions disclosure open
- reload
- final CTA to `/session/start`

Results:

- route loaded directly without account or session
- `h1` was stable: `What does your pizza night cost?`
- default disclosure was closed
- result values updated when primary inputs changed
- no horizontal overflow
- no console errors
- no hydration errors
- canonical footer rendered
- final CTA navigated to `/session/start`
- no Shopping, Party Order, account-save or financial-report language appeared

## 17. Limitations

No live external price source was checked or added. Currency remains a label only.

Browser validation used local headless Chrome rather than the in-app browser because the browser runtime setup failed in this environment. The validation still exercised the production build, real DOM and interactive input updates.

## 18. Protected Invariants

Confirmed unchanged:

- Shopping integration: none added
- Party Order integration: none added
- Pizza Session state: none added
- account integration: none added
- cloud persistence: none added
- session schema: unchanged
- authentication: unchanged
- formula modules: unchanged
- sitemap and SEO behavior: unchanged
- unrelated routes: unchanged
- deployment state: unchanged
