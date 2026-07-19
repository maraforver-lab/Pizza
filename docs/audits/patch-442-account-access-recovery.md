# Patch 442: Account Access And Recovery

## Executive Summary

Patch 442 completes the core Account access loop:

- authenticated users can sign out with Supabase local-session scope
- password sign-in has a `Forgot password?` entry point
- `/auth/forgot-password` sends neutral password-reset instructions
- `/auth/callback` remains the single PKCE callback route and safely redirects recovery links to `/auth/update-password`
- `/auth/update-password` validates the recovered/authenticated session before showing the password form
- signed-in users can request a confirmed email-address change from Account

No Pizza Session, Party Order, formula, cloud-session, GDPR deletion, Storage cleanup or database-retention behavior was changed.

## Patch Number Preflight

Patch 442 was unused before implementation:

- no `patch/442-*` branch was present
- no `docs/audits/patch-442-*` document was present
- current master before the branch was `dfa30ebaf6da8f6f50ed27c78dfe4ce77399523f`

The resolved branch is:

`patch/442-account-access-recovery`

The resolved commit message is:

`Patch 442: Complete account access and recovery`

## Architecture Inspected

Inspected:

- `app/account/page.tsx`
- `app/auth/callback/route.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `components/GlobalToolNavigation.tsx`
- account preference and session/cloud-sync APIs
- account, cloud-session and Party Order tests
- Supabase migrations and ownership filters
- `package.json`

Installed auth dependencies:

- `@supabase/supabase-js`: `^2.108.2`
- `@supabase/ssr`: `^0.12.0`

No middleware file is currently present.

## Selected Recovery Architecture

The repository already had a canonical PKCE-style callback:

`/auth/callback`

That route uses:

`supabase.auth.exchangeCodeForSession(code)`

Patch 442 therefore uses Case A from the patch brief:

`/auth/forgot-password`
-> Supabase reset email
-> `/auth/callback?next=/auth/update-password`
-> `/auth/update-password`

This avoids adding a competing `/auth/confirm` or implicit-fragment recovery flow.

## Redirect Safety

`lib/account-access.ts` now owns:

- `safeInternalAuthPath(...)`
- `authCallbackRedirectTo(...)`
- `appendAuthResult(...)`

The callback accepts only safe internal `next` paths. External URLs, protocol-relative URLs and malformed backslash-prefixed paths fall back to `/account`.

The callback appends `confirmed=1` to successful internal destinations. Recovery callback errors redirect to:

`/auth/update-password?authError=recovery`

Generic confirmation errors continue to return to:

`/account?authError=confirmation`

## Sign Out Contract

The Account sign-out action now calls:

`supabase.auth.signOut({ scope: "local" })`

The page:

- shows a loading state
- prevents duplicate clicks while busy
- keeps the user visible until Supabase confirms success
- shows a recoverable error if sign-out fails
- sets authenticated UI to anonymous only after success
- refreshes the app after success

No DoughTools local-first storage clearing was added. The patch does not call `localStorage.clear()`, `clearActivePizzaSession()`, or local Pizza Session deletion from sign-out.

## Forgot Password

`/auth/forgot-password` includes:

- visible email label
- email input
- submit action
- loading state
- invalid-format handling
- neutral success copy
- rate-limit/service-error handling
- link back to sign in
- accessible async status messaging

Submitted email is trimmed for harmless surrounding whitespace only. It is not lowercased or otherwise rewritten.

For a valid request, the success state says:

`If an account exists for this email address, we’ve sent password reset instructions.`

That copy does not reveal whether the account exists.

## Update Password

`/auth/update-password` includes these states:

- resolving recovery session
- invalid or expired link
- valid authenticated session
- validation failure
- submitting
- provider failure
- success

The password form is not shown until `supabase.auth.getSession()` confirms an authenticated session. The page also listens for `PASSWORD_RECOVERY`, `SIGNED_IN` and `USER_UPDATED` events for compatibility with Supabase browser recovery events.

The form calls:

`supabase.auth.updateUser({ password })`

No service-role API, prompt, alert, URL token persistence, password table, password hash table or reset-token table was added.

## Email Change

Account now has an `Email address` section for signed-in users.

It shows:

- current confirmed email
- optional pending email when Supabase exposes it
- `Change email address`
- new-email field
- save and cancel actions
- loading, success and error states

The update call is:

`supabase.auth.updateUser({ email: validation.email }, { emailRedirectTo })`

The `emailRedirectTo` value uses the same callback route:

`/auth/callback?next=/account`

The UI explains that the currently confirmed email remains active until Supabase completes the change. It does not optimistically replace the displayed confirmed email.

## Identity And Ownership Audit

Application-owned cloud data is scoped to the immutable Supabase user id:

- `pizza_sessions.user_id`
- `party_orders.user_id`
- owner-only Party Order submission routes through the owning Party Order
- `account_preferences.user_id`

API queries use `user.id` / `auth.uid()`, not mutable email addresses, for ownership. No migration was required for email-change safety.

## Database Migration Status

No database migration was added.

Patch 442 does not add:

- account-management table
- password table
- password-reset table
- email-change table
- plaintext password storage
- password hash storage
- reset-token storage

## Site URL And Redirect Allow List

Repository behavior is environment-driven through `NEXT_PUBLIC_SITE_URL` and request origin. Existing documentation references both `https://doughtools.app` and `https://www.doughtools.app`; the patch brief states the expected canonical production origin as:

`https://www.doughtools.app`

The implemented email redirects use the current request origin and the canonical callback path. For the expected production origin, Supabase Redirect URLs should include:

`https://www.doughtools.app/auth/callback`

For local development:

`http://localhost:3000/auth/callback`

`/auth/update-password` is not the direct reset-email redirect in the selected architecture. It is the internal `next` destination after `/auth/callback` exchanges the one-time code.

If the production app also serves the apex domain intentionally, the matching apex callback URL should be configured explicitly as a separate allowed URL:

`https://doughtools.app/auth/callback`

Do not use a broad wildcard unless the project has a documented preview-domain policy.

## Email Template Checklist

Dashboard verification is still required for:

- Reset password
- Change email address
- Confirm signup
- Password changed security notification
- Email address changed security notification

The reset, signup and email-change flows should send users through the callback URL that Supabase receives through `redirectTo` / `emailRedirectTo`.

Templates must not hardcode a route that bypasses the selected callback architecture. Verify the actual template variables in Supabase Dashboard, especially:

- `ConfirmationURL`
- `TokenHash`
- `RedirectTo`
- `SiteURL`
- `NewEmail`
- `OldEmail`

No real tokens, links or user emails are documented here.

## SMTP Status

Repository source does not contain production SMTP configuration. Supabase Dashboard access is required to verify:

- custom SMTP provider
- sender domain
- sender address
- SPF
- DKIM
- DMARC
- reset-email delivery
- email-change delivery
- spam-folder behavior
- link tracking disabled for auth emails

The Supabase default mailer should not be treated as the long-term production delivery mechanism.

## Accessibility And UX

New account-access surfaces use:

- visible labels
- semantic form controls
- disabled loading states
- accessible async status messaging
- no color-only status
- practical mobile tap targets
- no browser-native `alert`, `prompt` or confirm dialogs
- concise English user copy

## Tests

Added focused coverage in:

`tests/account-access-recovery.test.ts`

Updated:

`tests/account-responsive-workspace.test.ts`

Coverage includes:

- safe internal redirect helper
- recovery callback URL builder
- email/password validation
- local-scope sign-out
- no broad DoughTools storage clearing from sign-out
- Forgot password link and reset method
- PKCE callback route selection
- update-password session resolution and `updateUser({ password })`
- email-change `updateUser({ email })`
- UUID/user-id data ownership

## Manual Acceptance

Live email-flow acceptance was not completed in this local patch because it requires:

- Supabase Dashboard access
- real test account
- real reset email delivery
- real email-change confirmations

Manual acceptance still required:

1. Request password reset with a test account.
2. Open the real reset email.
3. Confirm `/auth/callback` exchanges the code.
4. Set a new password.
5. Confirm old password fails and new password works.
6. Request an email change.
7. Complete all required email confirmations.
8. Confirm user UUID and existing cloud data remain connected.
9. Sign out and confirm local Pizza data remains on device.

## Protected Invariants

Unchanged:

- Pizza Session calculations
- dough formulas
- fermentation logic
- Recipe, Shopping, Timeline, Kitchen and Review behavior
- Bake Timer behavior
- Party Orders
- cloud-session authority
- active-session lifecycle
- GDPR deletion behavior
- deployment configuration
