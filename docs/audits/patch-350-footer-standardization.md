# Patch 350 footer standardization audit

Date: 2026-07-13  
Baseline: latest synchronized `master` after Patch 349.

## Canonical source before the patch

The approved canonical footer existed as page-local markup in `app/page.tsx`.
It contained:

- brand message: “Made for better pizza nights.”
- supporting copy: “Learn the craft, plan the evening, and keep the next useful page within reach.”
- Learn, Product and Company link groups
- responsive desktop/tablet/mobile grid behavior
- semantic footer landmark

Patch 350 extracted that markup into `components/SiteFooter.tsx` without changing the approved information architecture.

## AppSignature handling

`components/AppSignature.tsx` previously acted as the footer on many pages. Those page-footer uses were replaced with `SiteFooter`.

The version/build/update strip was not moved into the canonical footer because the approved homepage footer intentionally does not include build metadata. Public update history remains available through `/updates`.

`AppSignature` remains in the repository for compatibility or future diagnostic use, but no user-facing page footer uses it after this patch.

## Route audit

| Route or route family | Had footer before | Previous implementation | Post-footer content before | Action | Final result |
| --- | --- | --- | --- | --- | --- |
| `/` | yes | page-local homepage footer | no | extract and reuse | canonical `SiteFooter` |
| `/?calculator=1` / calculator workspace | yes | `AppSignature` footer in `HomeCalculatorWorkspace` | no | replace | canonical `SiteFooter` |
| `/?calculator=2` / guided calculator workspace | yes | `AppSignature` footer in `HomeCalculatorWorkspace` | no | replace | canonical `SiteFooter` |
| `/about` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/account` | yes | `AppSignature` footer after account content | no | replace | canonical `SiteFooter` |
| `/coach` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/community` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/contact` | yes | `AppSignature` through `TrustPageLayout` | no | replace shared layout footer | canonical `SiteFooter` |
| `/costs` | yes | `AppSignature` in `PizzaCostsPlayfulClient` | no | replace | canonical `SiteFooter` |
| `/doctor` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/gear` | yes | `AppSignature` inside sources section | no | move footer after sources section and replace | canonical `SiteFooter` |
| `/guide` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/history` | yes | `AppSignature` inside sources section | no | move footer after sources section and replace | canonical `SiteFooter` |
| `/journal` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/methodology` | yes | `AppSignature` through `TrustPageLayout` | no | replace shared layout footer | canonical `SiteFooter` |
| `/ovens` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/plan` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/privacy` | yes | `AppSignature` through `TrustPageLayout` | no | replace shared layout footer | canonical `SiteFooter` |
| `/sauce` | yes | `AppSignature` footer after sources | no | replace | canonical `SiteFooter` |
| `/start` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/styles` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/terms` | yes | `AppSignature` through `TrustPageLayout` | no | replace shared layout footer | canonical `SiteFooter` |
| `/timer` | yes | `AppSignature` footer with dark urgent variant | no | replace | canonical `SiteFooter` |
| `/toppings` | yes | `AppSignature` in `ToppingBalanceLab` | no | replace | canonical `SiteFooter` |
| `/updates` | yes | `AppSignature` footer | no | replace | canonical `SiteFooter` |
| `/account/party-orders` | no | none | n/a | unchanged | no footer |
| `/account/party-orders/new` | no | none | n/a | unchanged | no footer |
| `/account/party-orders/[id]` | no | none | n/a | unchanged | no footer |
| `/account/pizza-sessions/[id]` | no | none | n/a | unchanged | no footer |
| `/calculator/quick` | no | none | n/a | unchanged | no footer |
| `/guide/pizza-troubleshooting` | no | none | n/a | unchanged | no footer |
| `/guides/dough` | no | none | n/a | unchanged | no footer |
| `/order/[publicToken]` | no | none | n/a | unchanged | no footer |
| `/order/[publicToken]/edit/[submissionToken]` | no | none | n/a | unchanged | no footer |
| `/session/kitchen` | no | none | n/a | unchanged | no footer |
| `/session/recipe` | no | none | n/a | unchanged | no footer |
| `/session/review` | no | none | n/a | unchanged | no footer |
| `/session/shopping` | no | none | n/a | unchanged | no footer |
| `/session/start` | no | none | n/a | unchanged | no footer |
| `/session/timeline` | no | none | n/a | unchanged | no footer |

## Non-page footer retained

`components/session/ShoppingListExportCard.tsx` contains a `<footer>` inside an exported shopping image/card. It is not a page footer, does not use `AppSignature`, and remains unchanged.

## Final rules verified

- Pages that already rendered a footer now render `SiteFooter`.
- Pages without a footer were not given one.
- The canonical footer owns the shared link groups and visual structure.
- Route-specific notes and source sections remain before the footer.
- No visible document-flow page content should appear after `SiteFooter`.
