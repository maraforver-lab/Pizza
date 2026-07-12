# Patch 311: Site-wide responsive visual audit

Baseline: `master` at `6c75eb4417c2768238442e1afe57e99a8fb6ada0`

Branch: `patch/311-site-wide-responsive-visual-audit`

Scope: focused responsive visual audit and confirmed layout fixes only. No business logic, calculations, routes, persistence, APIs, database schema, or product flow behavior were changed.

## Routes and surfaces audited

Audit coverage was code-assisted across the current route structure, with focused checks on:

- Public/home surfaces: `/`, `/calculator/quick`, `/guide`, `/guides/dough`, `/guide/pizza-troubleshooting`, `/about`, legal/static pages.
- Pizza Session flow: `/session/start`, `/session/recipe`, `/session/shopping`, `/session/timeline`, `/session/kitchen`, `/session/review`.
- Account surfaces: `/account`, completed session history/detail, active session card, Party Orders list/detail/new.
- Public Party Order: guest order and guest edit forms.
- Navigation: desktop/mobile header, Guide dropdown, Tools dropdown.
- Dialogs and overlays: Kitchen Mode early-step confirmation and pizza photo overlay code paths.

Viewport matrix considered:

- Mobile: 320, 360, 375, 390, 430 px.
- Tablet/desktop: 768, 1024, 1280, 1440 px.
- Additional risk states: long user titles, long party names, long guest/pizza names, decimal and three-digit numeric values, dialogs at short viewport heights, and dropdown viewport containment.

## Findings fixed

### High: Calculator v2 numeric unit overlay could crowd values

File fixed:

- `components/HomeCalculatorWorkspace.tsx`

The older Calculator v2 `NumberField` still used an absolute unit suffix over the input. This had the same family of risk as Patch 310: three-digit or decimal values could compete with `%`, `g`, or `°C`.

Fix:

- Converted the control to a flexible grid.
- Kept stepper buttons fixed-width.
- Gave value and unit separate layout areas.
- Added `tabular-nums`.
- Removed the absolute suffix overlay and `pr-12` dependency.

### High: Kitchen Mode early-step confirmation dialog could exceed short mobile viewports

File fixed:

- `app/session/kitchen/page.tsx`

The early-completion dialog had a fixed centered card with no internal max-height handling.

Fix:

- Added vertical viewport padding to the overlay.
- Added `max-h-[calc(100vh-3rem)]` and `overflow-y-auto` to the dialog card.
- Preserved the existing confirmation behavior, labels and completion logic.

### Medium: Long completed-session titles and summaries could stretch Account cards

File fixed:

- `components/account/AccountPizzaSessionHistory.tsx`

Custom completed-session titles can be user-generated and up to 80 characters. Long unbroken text needed safer wrapping.

Fix:

- Added `min-w-0` and `[overflow-wrap:anywhere]` to title/status/summary areas.
- Preserved edit/delete/view actions and account behavior.

### Medium: Long Party Order names, guest names and pizza names could overflow cards

Files fixed:

- `components/account/PartyOrdersList.tsx`
- `components/account/PartyOrderDetail.tsx`
- `components/party-orders/PublicPartyOrderForm.tsx`
- `components/party-orders/PublicPartyOrderEditForm.tsx`

Party Order data includes user-provided event titles, guest names, comments and pizza names/summaries. These now wrap safely inside cards.

Fix:

- Added `min-w-0` and `[overflow-wrap:anywhere]` to long-content containers.
- Preserved submission/edit/delete/status behavior.

### Medium: Troubleshooting topic cards needed safer long-title and related-link wrapping

File fixed:

- `components/guide/PizzaTroubleshootingGuideClient.tsx`

Troubleshooting topic titles, quick checks, captions and related-topic pills can become long as the content library grows.

Fix:

- Added safe wrapping to topic headings, quick-check copy, captions and related-topic links.
- Preserved topic IDs, images, categories, level presentation and navigation.

### Medium: Shopping checklist item labels and amounts needed long-content protection

File fixed:

- `app/session/shopping/page.tsx`

Shopping list item labels and generated amounts now wrap safely inside the responsive checklist row.

Fix:

- Added safe wrapping to item labels and desktop amount column.
- Preserved checklist state and toggle behavior.

## Confirmed existing protections

- Global navigation already uses viewport-safe dropdown width: `w-[min(18rem,calc(100vw-1.5rem))]`.
- Mobile Guide/Tools dropdowns use fixed compact positioning inside viewport.
- Dough Guide and Troubleshooting top-level pages already use `overflow-x-clip` at page level rather than a global overflow hiding hack.
- Quick Calculator numeric controls were already fixed in Patch 310 and remained protected.
- Timeline and Dough Guide card structures already use `min-w-0` in key grid/flex children.

## Deferred / intentionally not changed

- Home oven session-specific guidance remains Patch 312 scope.
- No visual redesign was attempted.
- No calculator formula or sizing behavior changed.
- No Party Order, Pizza Session, Review, Shopping, Timeline or Kitchen business logic changed.
- No image replacement or content rewrite was included.
- No broad refactor of legacy public tool pages was attempted beyond the confirmed Calculator v2 numeric-control fix.

## Remaining manual risks

- A real-device/browser pass can still catch visual issues that static source and test coverage cannot, especially at 200% zoom and with browser-specific font metrics.
- Some legacy public pages are dense single-file components; future feature work should continue migrating repeated control patterns into shared responsive components.
- Very long translated strings could still require page-specific tuning if additional locales or copy are expanded.

## Tests added

Added `tests/responsive-visual-audit.test.ts` covering:

- Calculator numeric controls do not overlay units on values.
- Long account and Party Order content wraps inside cards.
- Dialogs, dropdowns, troubleshooting cards and shopping rows have viewport-safe structure.
- No global `overflow-x: hidden` hack was introduced.
- Navigation routes and core business-logic boundaries remain unchanged.

Focused validation covered Quick Calculator, cloud session history, shopping list and Kitchen Mode tests in addition to the new responsive audit test.
