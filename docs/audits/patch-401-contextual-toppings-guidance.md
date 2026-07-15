# Patch 401: Contextual Toppings Guidance

## Executive summary

Patch 401 keeps `/toppings` as an independent supporting utility and adds only contextual links from Pizza Session where topping balance is directly relevant.

The implementation adds:

- one secondary Shopping link near the optional pizza mix tools;
- one Kitchen link inside the closed-by-default `More guidance` disclosure for the `prepare-sauce-toppings` step only.

No Toppings calculator UI, formulas or state were embedded into Pizza Session.

## Patch 399 decision

Patch 399 recommended `/toppings` as:

```txt
INTEGRATE, KEEP ROUTE
```

Rationale:

- `/toppings` has unique standalone value as a topping balance and moisture lab.
- It should remain public and indexable.
- It should not become part of the core Pizza Session state.
- Its value should be surfaced contextually rather than promoted as a required Session stage.

## Standalone Toppings role

Preserved:

- direct `/toppings` route;
- standalone use without active Pizza Session, account, cloud state, Shopping data or Kitchen state;
- Topping Balance Lab calculations;
- query-state parsing and URL updates;
- local visual assets;
- sitemap and indexing state;
- existing related links and route metadata.

No `/toppings` production files were changed in this patch.

## Shopping placement

Shopping now includes one contextual link:

```txt
Check topping balance
```

Target:

```txt
/toppings
```

Placement:

- inside the existing optional shopping tools area;
- within the pizza mix card near `Edit pizza mix`;
- after the checklist and after the `Continue to Timeline` workflow action;
- visually secondary through the shared tertiary button variant.

This preserves Patch 378's checklist-first structure.

## Kitchen step selection

The relevant Kitchen step is:

```txt
prepare-sauce-toppings
```

The link is not shown for Mix dough, rest, fermentation, balling, room-temperature rest, preheat or bake-pizza.

## Kitchen guidance placement

Kitchen now includes one contextual link inside the existing closed-by-default:

```txt
More guidance
```

Visible label:

```txt
Check topping balance
```

Supporting copy:

```txt
Review sauce, cheese and topping amounts if the pizza may become too wet or heavily loaded.
```

No default Kitchen density was added, and the Kitchen primary action remains unchanged.

## Query-context decision

The Topping Balance Lab has stable query state for its own lab controls, including geometry, sauce, cheese, drain state and topping load.

Patch 401 does not pass Pizza Session context because:

- Shopping and Kitchen do not currently have a tested handoff contract to those exact query values;
- pizza mix and Shopping data do not map one-to-one to Topping Balance Lab inputs;
- inventing parameters would create a new integration contract outside this patch;
- the requested scope is lightweight contextual access.

Both contextual links therefore use clean:

```txt
/toppings
```

## Same-tab behavior

Both links use normal Next.js internal links in the same tab.

No `target="_blank"` was added. Browser Back is expected to return the user to Shopping or Kitchen with the existing active-session continuity protections.

## Session-continuity protections

Opening the link does not call:

- `queueCloudActivePizzaSessionSave`
- `queueKitchenProgressSync`
- `completeKitchenTimelineStep`
- `startPizzaSessionTimelineStep`
- `setSession`
- `updateShoppingItemStatus`
- pizza mix save helpers

No active-session state, Timeline, `stepRuntime`, Kitchen progress, Shopping checklist state, pizza mix, cloud queue or schema field is modified by the link.

## Tests

Focused tests:

- `npm run test -- tests/pizza-session-shopping-list.test.ts tests/pizza-session-kitchen.test.ts tests/topping-balance-lab.test.ts tests/session-flow-navigation.test.ts tests/seo-config.test.ts`
- Result: passed, 5 files and 132 tests.

Full suite, lint, build and final diff check are recorded after final validation.

Final validation:

- Focused tests: passed, 5 files and 132 tests.
- Full suite: `npm run test` passed, 61 files and 1016 tests.
- Lint: `npm run lint` passed.
- Build: `npm run build` passed.
- `git diff --check`: passed.

## Browser validation

Browser validation is recorded after production-build verification.

Required checks:

- Shopping checklist appears first;
- Shopping link is secondary and opens `/toppings`;
- browser Back returns to Shopping with checkbox state intact;
- Kitchen link appears only in `More guidance` for `prepare-sauce-toppings`;
- Kitchen unrelated steps do not show the link;
- `/toppings` works without an active session;
- no horizontal overflow, console errors or hydration errors.

Results from production build with local production server:

- `390 × 844`: Shopping link secondary and after checklist; `/toppings` opened; browser Back restored Shopping and checked item state; Kitchen `prepare-sauce-toppings` link appeared only after opening `More guidance`; browser Back restored Kitchen current step; no horizontal overflow.
- `430 × 740`: same checks passed.
- `1280 × 900`: same checks passed.
- `1440 × 950`: same checks passed.
- Unrelated Kitchen steps checked: `mix-dough`, `cold-ferment`, `ball-dough`, `preheat-oven`, `bake-pizza`; Toppings link was absent.
- Standalone `/toppings` rendered without an active session.
- Active-session API writes from link navigation: `0`.
- Console/runtime issues: `0`.

## Limitations

No new query handoff was added. A future patch may add tested query context if the Topping Balance Lab and Pizza Session define a deliberate shared contract.

## Protected invariants

Patch 401 did not change:

- topping calculations;
- sauce calculations;
- Shopping quantities;
- Shopping checklist persistence;
- Shopping export;
- pizza mix allocation logic;
- Recipe;
- Timeline;
- Kitchen progression;
- Kitchen timer;
- `stepRuntime`;
- cloud sync;
- session schema;
- local persistence;
- auth;
- account;
- Party Orders;
- SEO;
- sitemap;
- global navigation;
- deployment configuration.
