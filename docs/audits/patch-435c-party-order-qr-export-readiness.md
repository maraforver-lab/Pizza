# Patch 435C: Party Order QR Export Readiness

Implementation date: 2026-07-18
Starting commit: `c7127a14553eed7251a3a3df73d3686707184fa8`
Branch: `patch/435c-party-order-qr-export-readiness`

## 1. Patch 435A QR Finding

Patch 435A identified the missing QR code in downloaded Party Order invitation images as an export-readiness defect.

The QR URL and QR data URL were already correct. The unreliable part was the capture sequence: `html-to-image` could capture the hidden export DOM before the hidden QR `<img>` had loaded and decoded.

## 2. Visible QR Render Path

`components/account/PartyOrderInvitationCard.tsx` derives one normalized public guest URL from the Party Order share link.

That same URL is used for:

- `QRCode.toDataURL(publicGuestUrl, ...)`
- the visible invitation preview QR
- the hidden export QR
- the public guest page link
- copied invitation text

The visible preview QR now carries `data-party-order-preview-qr="true"`, explicit `width` and `height` attributes, and `data-qr-url={publicGuestUrl}`.

## 3. Hidden Export Render Path

The hidden export card remains off-screen rather than `display: none`.

The export QR image now carries:

- `data-party-order-export-qr="true"`
- `data-qr-url={publicGuestUrl}`
- explicit `width={286}` and `height={286}`
- the same `src={qrCodeDataUrl}` as the visible preview

This gives the export helper a deterministic element to wait on before image capture.

## 4. Previous Readiness Gap

Before Patch 435C, the download action only checked that:

`qrCodeDataUrl` existed.

That was not enough. React could have rendered the hidden export DOM with an `<img src="data:image/png...">` whose pixels were not loaded or decoded yet. `html-to-image` could then clone and capture the DOM before the QR pixels were ready.

## 5. Image Load/Decode Helper

`lib/party-order-invitation-export.ts` now exposes:

- `waitForImageReady(image, timeoutMs?)`
- `waitForPartyOrderInvitationExportReady(element)`
- `capturePartyOrderInvitationImageDataUrl(...)`
- `capturePartyOrderInvitationJpegDataUrl(...)`

`waitForImageReady(...)`:

- rejects when the image element is missing
- resolves already-complete images only when natural dimensions are non-zero
- waits for `load` when needed
- rejects on `error`
- awaits `decode()` when supported
- falls back safely when `decode()` is unavailable
- uses a bounded timeout
- removes event listeners and timeout handles
- rejects if natural dimensions remain zero

## 6. Export Sequencing

The image export now follows:

1. user presses download
2. duplicate export clicks are blocked with an in-flight ref
3. QR data URL must exist
4. hidden export DOM must contain the export QR image
5. export QR must load, decode and have non-zero dimensions
6. document fonts are awaited when available
7. one render frame is awaited
8. `html-to-image` capture runs
9. the image or PDF download starts
10. action state is restored

The existing PDF export path was not newly added, but it also captures the invitation as an image. It now uses the same readiness sequence.

## 7. Timeout and Failure Behavior

If QR readiness fails, the component does not download a partial invitation.

The recoverable user-facing message is:

`We couldn’t prepare the QR code for the invitation image. Try again.`

The error does not expose public tokens, data URLs, element selectors, stack traces or library internals.

The user can retry. A retry performs a fresh readiness check.

## 8. QR Source Integrity

The QR source remains the public Party Order URL:

`/order/<publicToken>`

It does not encode Account or owner-only routes. The helper `getPartyOrderPublicGuestUrl(...)` derives the canonical route from the current origin and token.

The visible preview and export DOM both use the same `publicGuestUrl` and `qrCodeDataUrl`.

## 9. Layout Safeguards

The export QR:

- stays square
- keeps the existing 640px generated QR data URL source
- renders as a 286 x 286 image inside the export card
- remains inside the captured 1080 x 1350 invitation bounds
- preserves the existing quiet zone from QR generation margin

The invitation layout was not redesigned.

## 10. Test Coverage

Focused Party Order tests cover:

- canonical public guest URL derivation
- QR source integrity
- image-ready immediate success
- unloaded image `load`
- supported `decode()`
- missing `decode()` fallback
- image `error`
- zero natural dimensions
- timeout rejection
- listener cleanup
- retry after failure
- capture after load/decode only
- capture options and dimensions
- component source wiring for export and preview QR images
- duplicate-click guard
- recoverable QR error copy
- Patch 435B timezone/export consistency source wiring

## 11. Migration Requirement

No Supabase migration is required for Patch 435C.

The patch does not modify Party Order schema, RLS, RPCs, public tokens, database timestamps, timezone detection, timezone conversion or Party Order edit behavior.

## 12. Validation

Focused tests:

- `npm run test -- tests/party-orders.test.ts`
- Passed: 1 file, 46 tests.

Full suite:

- `npm run test`
- Passed: 64 files, 1078 tests.

Lint:

- `npm run lint`
- Passed.

Production build:

- `npm run build`
- Passed with Next.js production build.

Browser/export validation:

- Limited by the available browser/auth environment.
- Production server validation was attempted at the local build URL. The in-app browser reached the Account sign-in page at `390 x 844`, with no horizontal overflow, but no authenticated Party Order owner session or existing owner Party Order was available in that browser.
- Because the export buttons are only available in the authenticated owner detail view, real downloaded invitation image validation could not be completed without signing in or fabricating cloud data. No manual cloud row mutation was used.
- QR export behavior is covered by focused behavior tests for image load/decode readiness, capture sequencing, retry, duplicate-click prevention, canonical public URL usage, explicit QR dimensions and timezone/export source wiring.

## 13. Protected Invariants

- Patch 435B timezone behavior is unchanged.
- Party Order owner editing is unchanged except for export readiness UI state.
- Party Order guest submissions are unchanged.
- Party Order public tokens are unchanged.
- Party Order to Pizza Session handoff is unchanged.
- Active-session replacement lifecycle is unchanged.
- Pizza Session calculations, Timeline, Kitchen, Account, auth, RLS and SEO are unchanged.
