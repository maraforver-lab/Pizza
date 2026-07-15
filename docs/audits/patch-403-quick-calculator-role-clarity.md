# Patch 403: Quick Calculator Role Clarity

## 1. Patch 399 decision

Patch 399 classified `/calculator/quick` as `KEEP, BUT DEMOTE`.

The route remains valuable because it provides fast standalone dough calculation, advanced dough controls, preferments, local saved quick recipes and shareable calculator state. The risk was product-role ambiguity: the page could look like a second version of the full Pizza Session rather than a focused utility.

Patch 403 keeps the route standalone and clarifies that it calculates dough amounts without creating a full Pizza Session.

Starting commit: `223513915bbc16b611acc55362e387c8727ba605`

Branch: `patch/403-clarify-quick-calculator-role`

## 2. Standalone utility role

Final role:

```text
Quick Calculator calculates dough amounts quickly without creating a Pizza Session.
```

It still supports:

- anonymous direct access
- global/utility experience-level preference
- pizza count
- dough-ball weight
- hydration
- salt
- fermentation inputs
- yeast type
- preferments
- advanced dough tools
- saved local calculator state
- share URL restore

It still does not provide:

- Shopping
- Timeline
- Kitchen Mode
- Review
- active-session persistence
- cloud-backed continuation
- automatic calculator-to-session handoff

## 3. Previous page hierarchy

Before this patch, the page hierarchy was functionally correct but less explicit:

```text
Hero
├── Quick Dough Calculator
├── "Enter dough values, get ingredient amounts..."
├── guidance level selector
├── core calculator controls
├── result summary
├── formula controls
├── preferments and advanced tools
└── saved quick recipes / share
```

The hero said the tool did not save or start a workflow, but it did not name Pizza Session as the full-product destination. The saved area used "quick recipe" language, which could sound closer to a saved session or full plan than a local calculator preset.

## 4. Previous product-role ambiguity

The ambiguity was editorial and hierarchical, not functional:

- Quick Calculator already avoided session creation.
- Share URLs already restored only calculator inputs.
- Local saved quick recipes already stayed in browser storage.
- No safe handoff contract to Pizza Session existed.
- The page did not clearly say that Pizza Session is the destination for shopping, scheduling, Kitchen Mode and Review.

## 5. Final hero and relationship statement

The hero now states the relationship once:

```text
Get dough amounts fast. Use Pizza Session when you also need shopping, scheduling, Kitchen Mode and Review.
```

This keeps the page job compact and avoids repeating a product comparison in multiple places.

The page still has one `h1`:

```text
Quick Dough Calculator
```

## 6. Core versus advanced controls

Core controls remain directly available. This patch did not remove or change any calculator input because the current controls are part of the route's standalone value.

Advanced controls remain available through the existing level-aware disclosure and advanced sections. The source and browser checks confirmed that Beginner, Enthusiast and Pizza Nerd modes still expose the expected advanced and preferment controls according to the current Quick Calculator contract.

## 7. Progressive-disclosure changes

No disclosure behavior was changed in this patch.

Existing progressive-disclosure behavior remains protected by:

```text
tests/calculator-progressive-disclosure.test.ts
tests/quick-calculator.test.ts
```

The patch keeps the current utility/global preference contract for `/calculator/quick`; it does not make Quick Calculator inherit an active Pizza Session's level.

## 8. Result hierarchy

The calculated result remains in the existing result area. No formula output, rounding rule or result-card logic was changed.

Protected result behavior includes:

- total dough
- per-ball amount
- flour
- water
- salt
- yeast
- preferment breakdowns where applicable
- advanced dough tool results

## 9. Saved quick recipe terminology

The saved section now describes saved local items as calculator presets:

```text
Save, reload or share this calculator preset
Saved calculator presets
Saved calculator preset
Calculator preset saved locally.
```

The underlying storage contract was not changed:

```text
doughtools.quick-calculator.recipes.v1
```

The button label `Save recipe` remains unchanged because it is the existing direct utility action and keeps current test and user expectations intact.

## 10. Share behavior

Share behavior was not changed.

The route still uses:

```text
quickCalculatorInputFromSearch(window.location.search)
buildQuickCalculatorShareUrl(result.input)
```

Shared links restore calculator inputs and do not create or replace an active Pizza Session.

## 11. Pizza Session CTA behavior

The page now has one route-specific secondary Pizza Session CTA:

```text
Need the full process?
Plan a Pizza Session
Open the guided setup from scratch. It does not automatically import this calculator preset.
```

Target:

```text
/session/start
```

The CTA is intentionally secondary and does not invent a handoff. It opens the canonical guided setup from scratch. Unsupported calculator state is not forwarded.

The canonical footer still contains its normal `/session/start` product link; that is footer navigation, not a second page-level Quick Calculator prompt.

## 12. Mobile before/after

Patch 399 baseline:

| Viewport | Before screen count | Before controls | Notes |
| --- | ---: | ---: | --- |
| 390 x 844 | 7.3 | 107 | Functional but expert-oriented |
| 430 x 740 | 8.2 | 107 | Functional but control dense |

Patch 403 validation:

| Viewport | Level | After screen count | Controls | Overflow | Console errors |
| --- | --- | ---: | ---: | --- | --- |
| 390 x 844 | Beginner | 7.5 | 103 | No | 0 |
| 390 x 844 | Enthusiast | 8.3 | 103 | No | 0 |
| 390 x 844 | Pizza Nerd | 11.9 | 103 | No | 0 |
| 430 x 740 | Beginner | 8.5 | 103 | No | 0 |
| 430 x 740 | Enthusiast | 9.3 | 103 | No | 0 |
| 430 x 740 | Pizza Nerd | 13.4 | 103 | No | 0 |

The largest screen-count increase appears in Pizza Nerd because that mode intentionally exposes more expert controls. Patch 403 did not hide expert functionality to make the page shorter. The clarity improvement is the reduced product ambiguity and single route-specific Pizza Session prompt.

## 13. Desktop before/after

Patch 399 baseline:

| Viewport | Before screen count | Before controls | Notes |
| --- | ---: | ---: | --- |
| 1280 x 900 | 3.7 | 108 | Strong desktop utility |
| 1440 x 950 | 3.5 | 108 | Strong desktop utility |

Patch 403 validation:

| Viewport | Level | After screen count | Controls | Overflow | Console errors |
| --- | --- | ---: | ---: | --- | --- |
| 1280 x 900 | Beginner | 4.0 | 103 | No | 0 |
| 1280 x 900 | Enthusiast | 4.1 | 103 | No | 0 |
| 1280 x 900 | Pizza Nerd | 5.7 | 103 | No | 0 |
| 1440 x 950 | Beginner | 3.8 | 103 | No | 0 |
| 1440 x 950 | Enthusiast | 3.9 | 103 | No | 0 |
| 1440 x 950 | Pizza Nerd | 5.4 | 103 | No | 0 |

Desktop remains a focused utility surface. The new CTA appears after save/share management and does not compete with calculation controls or result output.

## 14. Accessibility

Accessibility checks:

- one `h1`
- secondary Pizza Session CTA has normal link semantics
- CTA copy states the non-handoff behavior in visible text
- existing disclosures remain native/keyboard-accessible
- saved preset controls remain labelled
- no horizontal overflow at required mobile or desktop viewports
- canonical footer remains present

No new icon-only controls, custom disclosure widgets or color-only status indicators were introduced.

## 15. Tests

Focused tests:

```text
npm run test -- tests/quick-calculator.test.ts tests/calculator-progressive-disclosure.test.ts tests/cta-language.test.ts tests/navigation.test.ts tests/seo-config.test.ts tests/homepage.test.ts tests/site-footer.test.ts tests/start-pizza-session-wizard.test.ts
```

Result:

```text
8 files passed
180 tests passed
```

Full suite:

```text
npm run test
```

Result:

```text
61 files passed
1017 tests passed
```

Lint:

```text
npm run lint
```

Result: passed.

Build:

```text
npm run build
```

Result: passed.

Build route output:

```text
/calculator/quick  17.7 kB  124 kB first load JS
```

## 16. Browser validation

Browser validation used the production build served locally at `http://127.0.0.1:3000` and headless Chrome through CDP.

Validated viewports:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Validated levels:

- Beginner
- Enthusiast
- Pizza Nerd

Scenarios:

- direct `/calculator/quick` load
- one `h1`
- relationship statement appears once
- one route-specific `[data-quick-session-cta]` prompt
- CTA target is `/session/start`
- no legacy `/start` link
- footer remains present
- Beginner, Enthusiast and Pizza Nerd guidance visible through the existing utility contract
- advanced and preferment controls remain available
- flour, water, salt and yeast result content remains present
- pizza count and hydration inputs can be changed
- saved calculator preset writes local Quick Calculator storage
- share control remains available
- no active-session storage key is created by the Quick Calculator page interactions
- no horizontal overflow
- no console errors

Summary:

```text
12 / 12 scenarios passed
```

## 17. Limitations

- Browser validation used local headless Chrome through CDP because the in-app browser tool was not available in this run.
- No live signed-in cloud account was needed or used because Quick Calculator remains local-only and this patch does not touch cloud persistence.
- The browser check verified that Quick Calculator interactions did not create a local active-session key, but it did not perform a live signed-in account round trip because no session handoff exists.
- This patch intentionally did not reduce expert Pizza Nerd control depth; preserving expert functionality was part of the product requirement.

## 18. Protected invariants

Confirmed unchanged:

- dough formulas
- preferment formulas
- yeast calculations
- hydration calculations
- salt calculations
- fermentation calculations
- flour logic
- temperature logic
- experience-level canonical values
- query/share schema
- saved quick recipe schema
- saved quick recipe storage key
- Pizza Session schema
- Pizza Session creation behavior
- Pizza Session replacement/conflict behavior
- persistence
- auth
- account behavior
- Party Orders
- Shopping
- Timeline
- Kitchen
- Review
- navigation
- footer
- sitemap
- SEO indexing behavior
- deployment configuration

No deployment was performed.
