# Patch 435B: Party Order Browser Timezone Implementation

Implementation date: 2026-07-18
Starting commit: `9680215c63c63f557bd87462cb97487efbdb5183`
Branch: `patch/435b-party-order-browser-timezone`

## Summary

Patch 435B fixes the Party Order time-shift defect identified in Patch 435A. Party Order owner wall-clock values are now converted exactly once from the owner's browser IANA timezone into UTC instants before they reach the API. The stored Party Order timezone is then used for owner, guest, invitation, export and edit displays.

No timezone picker, profile setting or manual timezone preference was added.

## Root Cause

Before this patch, `datetime-local` values such as `2026-07-10T18:00` were sent directly to the API without an owner timezone. Supabase stored those timezone-less values in `timestamptz` fields, causing the intended local wall-clock time to be interpreted as a different absolute instant.

The visible bug was not a formatting-only issue. The stored instant itself could be wrong when the input value lacked timezone context.

## Storage Contract

`pizza_datetime` remains the UTC instant for the Party Order pizza time.

`orders_close_at` remains the UTC instant for the guest ordering deadline.

`time_zone` is the stored owner IANA timezone for interpreting those instants in Party Order UI and exports.

Legacy rows are backfilled to `Europe/Helsinki` without changing `pizza_datetime` or `orders_close_at`.

## Browser Timezone Detection

New Party Orders use:

`Intl.DateTimeFormat().resolvedOptions().timeZone`

The detected value is normalized through `Intl.DateTimeFormat(..., { timeZone })`. If detection fails, the create flow preserves the form and shows:

`We couldn’t detect your time zone. Refresh the page and try again.`

Existing Party Orders never redetect timezone during edit. The edit form renders and converts wall-clock values using the persisted `event.time_zone`.

## Conversion Rules

The shared helper in `lib/party-order-time.ts` converts a local date/time pair and IANA timezone into an ISO UTC instant.

Covered behavior:

- Helsinki summer and winter offsets
- Warsaw, New York and Tokyo example zones
- wall-clock values near midnight and UTC date boundaries
- nonexistent spring-forward times are rejected
- ambiguous fall-back times are resolved deterministically to the earlier matching instant

The DST rejection message is:

`This time does not exist because the clocks change that day. Choose another time.`

## API and Database

`validatePartyOrderInput(...)` now accepts only UTC instants for `pizzaDateTime` and `ordersCloseAt`, and requires a valid `timeZone`.

The owner list/create API and detail/update API include `time_zone` through `PARTY_ORDER_SELECT`.

The new migration:

`supabase/migrations/20260718123000_add_party_order_time_zone.sql`

adds `time_zone`, backfills legacy rows, sets a default and not-null constraint, and recreates the public Party Order lookup RPCs so public guest and edit pages receive the stored timezone.

Raw Supabase error messages are no longer returned from the owner Party Order list/create/detail update paths touched by this patch.

## Display Surfaces

The stored Party Order timezone is used by:

- Account Party Orders list
- Account Party Order detail
- Party Order settings edit form
- invitation preview
- invitation PNG/PDF export DOM
- plain-text invitation copy
- prep summary copy
- public guest page
- public guest edit page
- Party Order to Pizza Session handoff display

The Pizza Session handoff still passes the existing UTC `pizza_datetime` instant into `targetEatTime`. It does not convert the Party Order back into a timezone-less wall-clock string.

## Out Of Scope

The Patch 435A QR export readiness/rendering defect is intentionally not fixed here. It remains the expected Patch 435C scope.

No Party Order route behavior, guest submission logic, Pizza Session calculations, persistence model, auth model, SEO, Party Orders QR logic or deployment configuration was intentionally changed beyond the timezone storage/display contract.

## Validation

Focused Party Order tests:

- `npm run test -- tests/party-orders.test.ts`
- 39 tests passed

Full suite:

- `npm run test`
- 64 files passed, 1071 tests passed

Lint:

- `npm run lint`
- passed

Production build:

- `npm run build`
- passed

Browser validation:

- Production server: `next start -p 3025`
- Viewports checked: 390 x 844, 430 x 740, 1280 x 900
- The in-app browser was signed out, so `/account/party-orders/new` redirected to `/account`. The authenticated owner create/edit form could not be exercised without account credentials.
- Auth redirect rendered without horizontal overflow and without console errors at all checked viewports.
- Timezone conversion, stored-timezone editing, DST rejection and public/owner/export display contracts were validated through focused behavior and source tests.

## Protected Invariants

- Party Order pizza and deadline instants remain stored as UTC instants.
- Existing legacy rows are not shifted during backfill.
- New rows store owner browser timezone automatically.
- Existing rows retain their persisted timezone across edit.
- Handoff to Pizza Session preserves the UTC instant.
- No timezone selector, timezone setting or manual user preference was introduced.
- QR export readiness remains unchanged for Patch 435C.
