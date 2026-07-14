# Patch 378: Mobile Shopping checklist-first implementation report

Audited starting commit: `6a2eae1d953da61b57cfcf866cdec04575dbb6ca`

Working branch: `patch/378-mobile-shopping-checklist-first`

Date: 2026-07-14

## Summary

Patch 378 makes `/session/shopping` a checklist-first Pizza Session step. The route now shows the ingredient checklist and calculated quantities before optional pizza mix editing and export controls.

The patch preserves shopping-list generation, recipe-derived quantities, pizza mix allocation logic, active-session local persistence, cloud sync hooks, route guards, Recipe/Timeline behavior and export data. It does not change formulas, schemas, authentication, pricing, SEO, Party Orders, `/session/start`, Timeline, Kitchen Mode or Review.

## Previous Shopping structure

Before this patch, Shopping rendered in this order:

1. page hero titled `Shopping & Pizza Menu`
2. full pizza menu allocation section with image cards and plus/minus controls
3. ingredient checklist
4. `Before Timeline` explanatory section
5. shopping image export section
6. bottom action bar
7. hidden export-card render target

Important footer clarification:

- The pre-Patch 378 `/session/shopping` route did not import or render the canonical `SiteFooter` component.
- Patch 377's footer finding came from a footer landmark exposed by the hidden `ShoppingListExportCard` render target, not from the public canonical site footer.
- The pre-Patch 378 source at `6a2eae1d` rendered `ShoppingListExportCard` inside a visually hidden fixed container, and that component used a semantic `<footer>` element for export-card branding.

Patch 377 measured the previous active Shopping page at:

- about 6.4 screens at 390 x 844
- about 7.3 screens at 430 x 740
- about 3.3 screens at 1280 x 900
- about 3.1 screens at 1440 x 950
- 15 visible buttons and 8 controls in the measured active state

## Principal mobile friction

The mobile page asked the user to edit pizza composition before showing the practical shopping checklist. That made the route feel like a configuration workspace rather than a preparation checklist.

The main friction points were:

- checklist was not the first useful content
- pizza mix cards and quantity controls dominated the top of the route
- export appeared as a full visible section
- the `Before Timeline` section repeated the next-step instruction
- the primary next step was later than necessary
- the hidden export-rendering component created a semantic footer landmark inside this focused session step

## What changed

The Shopping hierarchy is now:

1. compact hero: `Your shopping list`
2. shopping checklist with quantities and progress
3. `BottomActionBar` with secondary `Back` and primary `Continue to Timeline`
4. optional shopping tools
5. pizza mix disclosure
6. export disclosure
7. hidden export-card render target

The checklist now includes the selected pizza mix summary in its helper copy, so the user can understand the current menu without opening the editor.

The `Before Timeline` section was removed because the bottom action bar already provides the Timeline transition.

## What was deliberately preserved

Preserved behavior and data:

- `generateAndSaveActiveShoppingList`
- `generatePizzaSessionShoppingList`
- `normalizePizzaMixForCount`
- `adjustPizzaMixAllocation`
- `updateShoppingItemStatus`
- recipe snapshot ingredient amounts
- pizza count and pizza mix totals
- local active-session updates
- cloud sync component on the route
- missing-session and missing-prerequisite guards
- hidden `ShoppingListExportCard`
- shopping image export helper and filename
- Back target: `/session/recipe`
- forward target: `/session/timeline`

No schema change was needed.

## Secondary controls

Pizza mix editing remains available through an accessible disclosure:

- button: `Edit pizza mix`
- expanded label: `Hide pizza mix controls`
- controlled panel: `pizza-menu-controls-panel`
- ARIA state: `aria-expanded={menuControlsOpen}`

Export remains available through an accessible disclosure:

- button: `Show export`
- expanded label: `Hide export`
- controlled panel: `shopping-image-export-panel`
- ARIA state: `aria-expanded={exportPanelOpen}`

Both disclosures are closed by default. Opening or closing them does not reset active-session state.

## Footer governance

`/session/shopping` did not import or render the canonical `SiteFooter` before this patch, and it still does not after this patch.

Patch 378 did not remove a canonical `SiteFooter` from the production Shopping route. Instead, it removed the semantic `<footer>` landmark from the hidden `ShoppingListExportCard` render target and replaced it with a branded `div` marked with `data-export-footer`. This keeps export branding visually intact for generated images while avoiding a footer landmark inside the active Shopping page.

Public pages that should retain `SiteFooter` are still covered by `tests/site-footer.test.ts`.

## Tests added or updated

Updated:

- `tests/pizza-session-shopping-list.test.ts`
- `tests/session-flow-navigation.test.ts`
- `tests/site-footer.test.ts`

Coverage added or adjusted:

- Shopping source order is checklist-first.
- `BottomActionBar` appears before optional shopping tools.
- pizza mix editing is behind an ARIA disclosure.
- export is behind an ARIA disclosure.
- Shopping no longer expects the old `Shopping & Pizza Menu` hero.
- Shopping no longer expects the removed `Before Timeline` section.
- export branding no longer creates a page footer landmark.
- no-footer governance still applies to session routes.
- public footer-bearing routes still use the canonical `SiteFooter`.

## Browser validation

Browser validation used a newly created anonymous Pizza Session through:

`/session/start?new=1&replace=1` -> `/session/recipe` -> `/session/shopping`

Validated:

- checklist appears before secondary tools
- quantities render from the generated active session
- checkbox state updates and persists after reload
- pizza mix disclosure opens
- increasing Diavola updates the summary and shopping quantities
- export disclosure opens
- export download action remains available
- Back href remains `/session/recipe`
- Continue href remains `/session/timeline`
- direct Timeline route renders from the same active session
- no `SiteFooter`
- no footer landmark
- no horizontal overflow

Browser limitation:

The in-app browser Playwright click on the `Continue to Timeline` link timed out even though the link was unique and had `href="/session/timeline"`. Automated navigation tests verify the href contract, and direct navigation to `/session/timeline` with the same active session rendered the Timeline successfully with Back pointing to `/session/shopping`.

Signed-in limitation:

The browser session was signed out. Cloud-backed visual continuation was not exercised in browser. Existing and updated automated tests cover cloud sync presence and active-session cloud behavior.

## Viewport validation

Measured after implementation:

| Viewport | Screens | Overflow | Footer | Checklist before primary | Primary before secondary | Visible buttons |
| --- | ---: | --- | --- | --- | --- | ---: |
| 390 x 844 | 2.7 | no | no | yes | yes | 4 |
| 430 x 740 | 3.1 | no | no | yes | yes | 4 |
| 1280 x 900 | 2.1 | no | no | yes | yes | 4 |
| 1440 x 950 | 2.0 | no | no | yes | yes | 4 |

The mobile page is materially shorter than the Patch 377 baseline:

- 390 x 844: about 6.4 screens -> about 2.7 screens
- 430 x 740: about 7.3 screens -> about 3.1 screens

The desktop page also became shorter while retaining a workspace hierarchy:

- 1280 x 900: about 3.3 screens -> about 2.1 screens
- 1440 x 950: about 3.1 screens -> about 2.0 screens

## Deferred issues

Deferred to later patches:

- `/start` and `/session/start` information-architecture consolidation
- Timeline `Start Kitchen Mode` repetition
- Recipe account-save and Pizza Nerd control hierarchy
- Review empty-state recovery
- Quick Calculator control density
- learning page reduction
- Sauce, Styles and Ovens editorial cleanup
- broader CTA standardization
- signed-in account UX audit
- Party Order handoff visual audit

## Acceptance status

Patch 378 meets the implementation intent:

- `/session/shopping` is checklist-first.
- Ingredient calculations and quantities are unchanged.
- Checklist persistence still works.
- The canonical site footer still does not render on Shopping.
- Footer landmarks are absent from the active Shopping page.
- Menu adjustment remains available but secondary.
- Export remains available but secondary.
- `Back` remains secondary.
- `Continue to Timeline` remains the primary forward action.
- Mobile page length and action weight are materially reduced.
- Desktop remains a useful workspace.
- Active-session guards remain intact.
- No unrelated route behavior was intentionally changed.
