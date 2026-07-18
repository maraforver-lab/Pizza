# Patch 435A: Party Order Time Persistence and Invitation QR Export Audit

Audit date: 2026-07-18
Audited starting commit: `d9b14c33ee46036dc33fee7c5afe453b13e9a92e`
Audit branch: `patch/435a-party-order-time-qr-audit`

This is an audit-only patch. No Party Order application code, tests, API routes, database migrations, QR generation, export code, Pizza Session behavior, auth, SEO, cloud rows or deployment configuration were changed.

Patch 435B implementation addendum: the timezone serialization defect described here was addressed in `docs/audits/patch-435b-party-order-browser-timezone.md` by storing an owner browser IANA timezone with each Party Order and converting owner wall-clock input to UTC before API persistence. The QR export readiness defect remains separate and was not changed by Patch 435B.

Patch 435C implementation addendum: the QR export readiness defect described here was addressed in `docs/audits/patch-435c-party-order-qr-export-readiness.md` by waiting for the hidden export QR image to load, decode and report non-zero natural dimensions before `html-to-image` capture. Party Order timezone storage and display behavior from Patch 435B was preserved.

## 1. Executive Summary

Two independent Party Order defects are present.

Defect 1 is a timezone serialization defect. Party Order create/edit forms use `datetime-local` inputs and send values such as `2026-07-10T18:00` directly to the API. The API validates that string with `new Date(...)` but preserves the original timezone-less value. Supabase stores it in `timestamptz` columns. In a UTC database/session context, the selected Helsinki wall-clock time `18:00` is stored as the absolute instant `18:00Z`, even though the intended instant for Helsinki summer time is `15:00Z`. Owner and invitation client rendering then formats that stored instant back in the browser timezone and shows `21:00`.

Defect 2 is an invitation export readiness/rendering defect. The visible invitation QR and the exported invitation use separate DOM paths. The export path receives the same QR PNG data URL, but it captures a hidden off-screen export DOM with `html-to-image` without waiting for the hidden QR image element to load or decode. The library also skips re-embedding data URL images, so the export can race ahead with a cloned image that has a `src` but no decoded pixels. The QR URL itself is correct; the failure is in the export render/capture lifecycle.

The two defects do not share a root cause. The time issue is data serialization and display timezone policy. The QR issue is client-side export rendering readiness. They should be fixed in two narrow implementation patches.

## 2. User-Visible Reproductions

The current prompt referenced earlier Party Order screenshots showing a saved bake time changing and a downloaded invitation image missing its QR code. Those specific Party Order image files were not present among this turn's local attachments; the audit therefore uses the supplied defect descriptions plus source-level proof and deterministic local time simulations.

Reproduction A, time shift:

1. Owner opens a Party Order and edits `Pizza date/time`.
2. Owner selects a local wall-clock value, for example `2026-07-10 18:00` in `Europe/Helsinki`.
3. The form sends `pizzaDateTime: "2026-07-10T18:00"`.
4. The API writes that timezone-less value to a `timestamptz` column.
5. The stored instant is interpreted as `2026-07-10T18:00:00+00:00`.
6. The owner client formats that instant in Helsinki and displays `Fri 10 Jul, 21:00`.

Reproduction B, QR missing from exported image:

1. Owner opens a Party Order detail page.
2. The visible invitation card eventually shows a QR code.
3. Owner clicks `Download invitation image`.
4. `html-to-image` captures a hidden export DOM, not the visible card.
5. The hidden export DOM contains a QR `<img>` only after `qrCodeDataUrl` exists, but the export function does not wait for that hidden image to decode.
6. The resulting image can omit the QR even though the visible preview shows it.

## 3. Party Order Time Data Model

Core fields:

| Field | Source | Type | Purpose | Timezone contract |
| --- | --- | --- | --- | --- |
| `pizza_datetime` | `public.party_orders` | `timestamptz not null` | pizza bake/eating time | Absolute instant; owner wall-clock timezone is not stored |
| `orders_close_at` | `public.party_orders` | `timestamptz not null` | guest order deadline | Absolute instant; owner wall-clock timezone is not stored |
| `created_at` | `public.party_orders` | `timestamptz not null default timezone('utc', now())` | row creation | UTC server time |
| `updated_at` | `public.party_orders` | `timestamptz not null default timezone('utc', now())` | row update | UTC server time |

Evidence:

- `supabase/migrations/20260705200000_create_party_orders.sql` defines `pizza_datetime timestamptz not null` and `orders_close_at timestamptz not null`.
- `supabase/migrations/20260705203000_create_public_party_order_lookup.sql` returns both fields as `timestamptz`.
- `supabase/migrations/20260707110000_add_party_order_submission_edit_tokens.sql` returns both fields as `timestamptz` from the guest edit lookup.
- `lib/party-orders.ts` models both fields as strings and does not store a timezone or local wall-clock field.

The database model can represent an instant correctly, but it cannot explain which local timezone the owner intended unless the application always applies one explicit timezone before writing and reading.

## 4. Client Input Parsing

Create form:

- `components/account/PartyOrderCreateForm.tsx` stores `pizzaDateTime` and `ordersCloseAt` as raw strings from `type="datetime-local"`.
- The POST payload sends `title`, `pizzaDateTime`, `ordersCloseAt`, `guestNote` and `allowedPizzaIds`.
- No `new Date(...).toISOString()` or explicit timezone conversion happens before the request.

Edit form:

- `components/account/PartyOrderSettingsEditForm.tsx` converts a stored string to `datetime-local` with `dateTimeLocalValue(...)`.
- `dateTimeLocalValue(...)` uses `new Date(value)`, then local getters: `getFullYear()`, `getMonth()`, `getDate()`, `getHours()`, `getMinutes()`.
- The edited value is again sent as a raw `datetime-local` string such as `2026-07-10T18:00`.

This creates an asymmetric path:

- existing ISO instant -> browser-local `datetime-local`
- user-selected `datetime-local` -> raw timezone-less API payload

## 5. API Serialization

Create API:

- `app/api/party-orders/route.ts` reads JSON.
- It calls `validatePartyOrderInput(body)`.
- It inserts `validation.value.pizza_datetime` and `validation.value.orders_close_at` directly into Supabase.

Update API:

- `app/api/party-orders/[id]/route.ts` reads JSON.
- Detail updates call the same `validatePartyOrderInput(body)`.
- It updates `pizza_datetime` and `orders_close_at` directly with validation values.

Validation:

- `lib/party-orders.ts` accepts snake_case or camelCase fields.
- `validDateTime(value)` checks only that `new Date(value).getTime()` is finite.
- It returns the original string unchanged.

There is no canonical Party Order date-time parser, no explicit `Europe/Helsinki` conversion, and no offset requirement at the API boundary.

## 6. Database Column Types

| Table | Column | Type | Notes |
| --- | --- | --- | --- |
| `party_orders` | `pizza_datetime` | `timestamptz` | stores an absolute instant |
| `party_orders` | `orders_close_at` | `timestamptz` | stores an absolute instant |
| `party_orders` | `created_at` | `timestamptz` | default UTC |
| `party_orders` | `updated_at` | `timestamptz` | default UTC |
| `party_order_submissions` | `created_at` | `timestamptz` | default UTC |
| `party_order_submissions` | `updated_at` | `timestamptz` | default UTC |

The DB has no `time_zone`, `local_date`, `local_time` or separate owner wall-clock fields.

## 7. Selected -> Payload -> Stored -> Displayed Trace

Assumption for this audit: owner chooses Party Order times in `Europe/Helsinki`, as requested. A UTC Supabase/session interpretation of a timezone-less `timestamptz` input is used for the stored-value trace because production Supabase commonly operates in UTC and the migrations use UTC defaults.

| Scenario | Selected value | Client payload | Stored value | API response | Owner display | Guest display | Export display |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Summer date at 18:00 | `2026-07-10 18:00` Helsinki | `2026-07-10T18:00` | `2026-07-10T18:00:00+00:00` | UTC instant string from Supabase | `Fri 10 Jul, 21:00` in Helsinki | depends on server runtime; likely `Fri 10 Jul, 18:00` on UTC Vercel | `Fri 10 Jul, 21:00` in Helsinki browser |
| Winter date at 18:00 | `2026-01-10 18:00` Helsinki | `2026-01-10T18:00` | `2026-01-10T18:00:00+00:00` | UTC instant string | `Sat 10 Jan, 20:00` | likely `Sat 10 Jan, 18:00` on UTC server | `Sat 10 Jan, 20:00` |
| 09:30 | `2026-07-10 09:30` Helsinki | `2026-07-10T09:30` | `2026-07-10T09:30:00+00:00` | UTC instant string | `Fri 10 Jul, 12:30` | likely `Fri 10 Jul, 09:30` on UTC server | `Fri 10 Jul, 12:30` |
| 23:30 near midnight | `2026-07-10 23:30` Helsinki | `2026-07-10T23:30` | `2026-07-10T23:30:00+00:00` | UTC instant string | `Sat 11 Jul, 02:30` | likely `Fri 10 Jul, 23:30` on UTC server | `Sat 11 Jul, 02:30` |
| DST transition date | `2026-03-29 03:30` local input | `2026-03-29T03:30` | `2026-03-29T03:30:00+00:00` if accepted as UTC | UTC instant string | local display can normalize or jump because this wall time is in a DST gap | server-dependent | browser-dependent |

For the main observed case, the first wrong value appears when the timezone-less `datetime-local` string is persisted as a `timestamptz` instant without converting from the intended Helsinki wall time. The visible owner-page shift appears immediately after the API response is normalized into `event` state and rendered by `partyOrderDateTimeLabel(...)`.

## 8. Timezone/DST Findings

Confirmed:

- The error is DST-dependent, not a single fixed offset.
- Helsinki summer dates shift by +3 hours if a raw local `18:00` is stored as `18:00Z`.
- Helsinki winter dates shift by +2 hours.
- Near-midnight values can change calendar day after display.
- DST gap and overlap dates are not explicitly handled.
- Owner/detail and invitation components format in the browser timezone.
- Public guest pages format in the server runtime timezone because `app/order/[publicToken]/page.tsx` is a Server Component.
- `partyOrderDateTimeLabel(...)` does not pass a `timeZone` option to `Intl.DateTimeFormat`.

Disproven or not primary:

- Stale state is not needed to explain the time shift. The POST/PATCH response can already contain the misinterpreted instant.
- The Party Order -> Pizza Session handoff does not create the time shift itself. It passes `event.pizza_datetime` into `createPizzaSession(...)` as `targetEatTime`; if the Party Order value is already wrong, the session inherits the wrong target.
- The invitation export path does not change saved time. It only formats whatever `event.pizza_datetime` currently contains.

## 9. Owner/Public/Export Consistency

Shared formatter:

- `partyOrderDateTimeLabel(value)` in `lib/party-orders.ts` is used by owner detail, owner list, public guest page, guest edit page, invitation preview, export component, prep summary text and Party Order -> Pizza Session handoff display.

Inconsistent execution contexts:

- Client components such as `PartyOrderDetail`, `PartyOrderSettingsEditForm` and `PartyOrderInvitationCard` format in the browser timezone.
- Public route Server Components format in the server timezone.
- Tests currently reflect the local test runner timezone; for example a stored `2026-07-10T18:00:00.000Z` is expected to appear as `Fri 10 Jul, 21:00` in the existing invitation text test.

The source is shared, but the timezone is implicit. Therefore the same stored value can display differently between owner, guest and export surfaces.

## 10. QR Generation Architecture

QR source:

- `components/account/PartyOrderInvitationCard.tsx` imports `QRCode` from `qrcode`.
- `publicGuestUrl` is derived from the owner detail `shareLink`, normalized by `normalizePublicGuestUrl(...)`.
- `QRCode.toDataURL(publicGuestUrl, { errorCorrectionLevel: "M", margin: 4, width: 640, color: ... })` creates a PNG data URL.
- The QR target is the canonical public guest URL, for example `/order/<public-token>` on the current origin.

QR output type:

- PNG data URL.
- Rendered as an `<img src={qrCodeDataUrl}>`.
- The visible DOM also includes `data-qr-url={publicGuestUrl}` for the visible QR wrapper.

No SVG or canvas QR output is used by the app code today.

## 11. Visible Invitation Render Path

Visible path:

1. `PartyOrderDetail` computes `shareLink` from `location.origin` and `event.public_token`.
2. `PartyOrderInvitationCard` normalizes `shareLink` into `publicGuestUrl`.
3. `QRCode.toDataURL(publicGuestUrl)` resolves.
4. `qrCodeDataUrl` state updates.
5. The visible invitation card renders an `<img>` inside the visible QR container.

The visible QR encodes the correct public URL and does not use the shortened display link.

## 12. Export Render Path

Export path:

1. `PartyOrderInvitationCard` also renders a hidden off-screen export DOM:
   - `pointer-events-none fixed left-[-12000px] top-0`
   - `aria-hidden="true"`
   - `<div ref={exportCardRef}>`
2. The hidden DOM renders `PartyOrderInvitationExportCard`.
3. That export component is separate from the visible card and has fixed dimensions `1080 x 1350`.
4. The export component renders another `<img src={qrCodeDataUrl}>`.
5. `downloadPartyOrderInvitationImage(exportCardRef.current)` calls `html-to-image` `toPng(...)`.
6. `downloadPartyOrderInvitationPdf(exportCardRef.current)` calls `html-to-image` `toJpeg(...)`, then wraps the JPEG in a generated PDF.

The PNG and PDF exports share the same DOM capture vulnerability. PDF export is not a separate layout renderer; it is image export plus PDF wrapping.

## 13. Exact QR Omission Root Cause

The QR is not absent from the export component source. The export component includes a QR `<img>` when `qrCodeDataUrl` is present.

The proven defect is an async export readiness gap:

- The download buttons are disabled until `qrCodeDataUrl` exists.
- They are not disabled until the hidden export `<img>` has loaded or decoded.
- `html-to-image` skips fetch/re-embedding for data URL images because they are already data URLs.
- In `html-to-image` `embed-images`, data URL `<img>` elements return early and do not go through the promise that assigns `onload`/`decode`.
- Therefore the export can serialize/capture the hidden DOM before the QR image has decoded into pixels.
- The visible QR can still be present because its own image load completed, while the hidden export image did not.

Rejected root causes:

- The QR target URL is not the displayed shortened URL; source checks ensure `QRCode.toDataURL(publicGuestUrl)` and not `displayedShareLink`.
- The QR is not an unsupported SVG produced by the app.
- The QR is not a cross-origin image or blob URL.
- The QR is not intentionally hidden by export CSS.
- The QR is not obviously clipped by fixed export dimensions; the export QR container is within the `1080 x 1350` card and uses a `286 x 286` image inside a `356px` grid column.

## 14. QR URL Integrity

Visible and exported QR data both come from `publicGuestUrl`.

Sanitized example:

- Owner detail public URL: `https://example.test/order/<public-token>`
- Visible QR input: `https://example.test/order/<public-token>`
- Export QR input: same `publicGuestUrl`
- Text preview link: shortened for display only by `displayShareLink(...)`

No owner-only route is encoded by the QR generation code.

## 15. Relationship Between the Defects

Answers:

1. The timezone defect cannot cause the QR to disappear. It can make the invitation time wrong, but QR generation depends on `publicGuestUrl`, not `pizza_datetime`.
2. The QR export defect cannot affect saved time. It happens after render in a client-side image export helper.
3. Both defects use the Party Order invitation view model, but they fail in different layers.
4. The time defect is data serialization plus implicit timezone formatting.
5. The QR defect is export rendering readiness in a hidden DOM capture path.
6. They should be fixed separately: Patch 435B for time persistence/display, Patch 435C for invitation QR export reliability.

## 16. Test Coverage and Gaps

Existing tests:

| Area | Current coverage | Classification | Gap |
| --- | --- | --- | --- |
| Party Order input validation | `tests/party-orders.test.ts` validates ISO strings and required fields | Unit behavior | Does not cover `datetime-local` raw strings or timezone conversion |
| DB model | Source-string checks for migrations | Source-string | Does not assert timezone contract |
| Owner/public binding | Source-string checks for `partyOrderDateTimeLabel(...)` usage | Source-string | Does not render owner/public under different timezones |
| Invitation text | Behavior test expects formatted output from stored ISO instant | Unit behavior | Locks current implicit timezone behavior rather than intended wall-clock behavior |
| Party Order -> Pizza Session handoff | Unit/source checks | Unit + source-string | Does not prove selected Party Order wall-clock survives |
| QR generation | Source-string checks for `QRCode.toDataURL(publicGuestUrl)` | Source-string | Does not render the QR or inspect exported pixels |
| Invitation PNG export | Source-string checks for `downloadPartyOrderInvitationImage` and `toPng` | Source-string | Does not wait for assets or verify QR in output |
| PDF export | Source-string checks for `toJpeg` and PDF wrapper | Source-string | Does not verify QR or image content |

Missing tests for implementation patches:

- `datetime-local` Helsinki summer/winter/DST parsing.
- API create/update payloads with raw local values.
- Owner detail display after save and reload.
- Public page display with an explicit timezone.
- Invitation/export display with the same time.
- Party Order -> Pizza Session target time handoff.
- QR export waits for hidden image decode or uses a deterministic QR rendering path.
- Pixel or DOM-export validation that the QR region is nonblank.

## 17. Data and User-Impact Risks

Time risk:

- Existing production rows may already contain wrong instants for the owner's intended local wall-clock time.
- Without an explicit stored timezone, automatic correction of historical rows is unsafe because the original intended timezone is unknown.
- Future saves continue to shift by the active DST offset.
- Public page and owner page may disagree when server and browser timezones differ.
- Party Order -> Pizza Session handoff inherits the wrong target time.

QR risk:

- Users may share downloaded invitations that do not contain the scannable QR.
- The plain public link and copy actions still work.
- The exported PDF may also omit the QR because it captures the same image path before PDF wrapping.

## 18. Recommended Implementation Scope

Patch 435B: Fix Party Order time contract.

- Introduce one canonical Party Order date-time helper.
- Decide and encode the current product timezone, at minimum `Europe/Helsinki`.
- Convert `datetime-local` wall-clock values to the correct UTC instant before POST/PATCH.
- Format Party Order times with an explicit `timeZone` option everywhere.
- Ensure edit forms round-trip through the same explicit timezone.
- Preserve `timestamptz` storage for current fixed-timezone behavior.
- Do not attempt automatic migration of old rows unless a product-approved correction policy exists.

Patch 435C: Fix invitation QR export.

- Add export readiness for the hidden QR image, such as waiting for `complete`/`decode()` on the export DOM QR image before `html-to-image`.
- Alternatively render QR in an export-safe deterministic form, for example inline SVG serialized in the export DOM or a canvas/data URL explicitly awaited by the export helper.
- Keep visible and exported QR targets tied to the same `publicGuestUrl`.
- Add image export regression tests that inspect the QR container/output region.

## 19. One or Two Implementation Patches

Two implementation patches are recommended.

Rationale:

- The time fix affects persistence, API payload semantics, display formatting and Party Order -> Pizza Session target-time correctness.
- The QR fix affects only invitation export readiness/rendering.
- Combining them would make validation harder and increase rollback risk.

## 20. Migration Requirement

Immediate current-product fix:

- No required database schema migration if DoughTools declares `Europe/Helsinki` as the explicit Party Order timezone and stores correct UTC instants in existing `timestamptz` columns.

Historical rows:

- Do not mass-update existing rows without product confirmation, because the original intended timezone is not stored.
- A one-time owner-visible correction or no-op policy may be needed for already-shifted Party Orders.

Future multi-timezone product:

- A migration would be required to add either `time_zone` or separate local date/time fields.
- That is outside the smallest fix for the confirmed production defect.

## 21. Regression Risks

Time patch risks:

- Changing date parsing can affect order deadline validation.
- Party Order -> Pizza Session handoff target time must remain the same intended local wall-clock.
- Public guest order open/closed checks must compare real instants, not formatted labels.
- Existing wrong rows cannot be silently corrected.

QR patch risks:

- Waiting for image decode must not deadlock on browsers without `decode()`.
- Export should continue to work for image and PDF.
- Export dimensions must remain `1080 x 1350`.
- The hidden export DOM must not become visible or focusable.

## Final Conclusion

Multiple independent Party Order defects: Timezone serialization defect and Async QR readiness defect.
