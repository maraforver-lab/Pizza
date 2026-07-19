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

## Exact Supabase Dashboard Configuration

This section reflects the exact implementation in Patch 442.

### URL Configuration

Expected production Site URL from the patch brief:

`https://www.doughtools.app`

The repository still derives runtime canonical URLs from `NEXT_PUBLIC_SITE_URL` and request origin. Existing older docs also mention the apex `https://doughtools.app`; decide in Dashboard whether apex is also a supported production entry.

The password-recovery request code passes this exact `redirectTo` shape to Supabase:

`<current-origin>/auth/callback?next=%2Fauth%2Fupdate-password`

Therefore the expected production reset redirect generated by the code is:

`https://www.doughtools.app/auth/callback?next=%2Fauth%2Fupdate-password`

The email-change and signup flows pass this exact callback shape:

`<current-origin>/auth/callback?next=%2Faccount`

Therefore the expected production account-confirmation/email-change redirect generated by the code is:

`https://www.doughtools.app/auth/callback?next=%2Faccount`

Supabase redirect allow-list entries should include the callback route used by those generated URLs:

`https://www.doughtools.app/auth/callback`

If the Dashboard requires matching the query-bearing value exactly, add these exact generated variants as well:

- `https://www.doughtools.app/auth/callback?next=%2Fauth%2Fupdate-password`
- `https://www.doughtools.app/auth/callback?next=%2Faccount`

For local development, the generated URLs are:

- `http://localhost:3000/auth/callback?next=%2Fauth%2Fupdate-password`
- `http://localhost:3000/auth/callback?next=%2Faccount`

The local redirect allow-list should include:

`http://localhost:3000/auth/callback`

If exact query matching is required, add:

- `http://localhost:3000/auth/callback?next=%2Fauth%2Fupdate-password`
- `http://localhost:3000/auth/callback?next=%2Faccount`

`/auth/update-password` is not the direct Supabase email redirect in the selected architecture. It is the internal `next` destination after `/auth/callback` exchanges the one-time code.

No Vercel preview redirect is currently required by repository code or product instructions. Do not add broad preview wildcards unless a separate preview-login policy is approved.

If the apex production domain is intentionally supported, add the same callback entries for `https://doughtools.app` explicitly rather than using a broad wildcard.

### Email Provider Settings

Production requires custom SMTP. The recommended initial DoughTools setup is:

- provider: Resend
- sending subdomain: `auth.doughtools.app`
- sender address: `no-reply@auth.doughtools.app`
- sender name: `DoughTools`

This patch does not create a Resend account, DNS records, SMTP credentials or repository secrets.

Dashboard/DNS verification still required:

- SPF
- DKIM
- DMARC
- reset-email delivery
- email-change delivery
- spam-folder behavior
- link tracking disabled for authentication emails

The Supabase default mailer should not be treated as the long-term production delivery mechanism.

### Email Templates

Review these Supabase templates:

- Reset password
- Change email address
- Password changed security notification
- Email address changed security notification

For Reset password and Change email address templates, the link should use:

`{{ .ConfirmationURL }}`

Reason: the application supplies `redirectTo` / `emailRedirectTo`, and Supabase should generate the one-time confirmation URL that lands on `/auth/callback?...` with the auth code it needs to exchange.

Do not hardcode `/auth/update-password` into the reset template. That would bypass the selected callback architecture.

Do not place raw tokens, test-user emails or real links in repository documentation.

### Auth Settings

Verify in Supabase Dashboard:

- email/password authentication is enabled
- email confirmations are configured as intended
- Secure Email Change is enabled
- security notifications are enabled where available
- redirect URLs above are allow-listed
- custom SMTP is enabled
- suitable email rate limits are configured

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

## Manual Acceptance Checklist

Live email-flow acceptance was not completed in this local patch because it requires:

- Supabase Dashboard access
- real test account
- real reset email delivery
- real email-change confirmations

### Password Recovery

1. Start the app locally.
2. Request a reset for a dedicated test account.
3. Receive the actual recovery email.
4. Open the recovery link on the same computer.
5. Confirm that it passes through `/auth/callback`.
6. Confirm that `/auth/update-password` opens with a valid recovery session.
7. Set a new password.
8. Confirm the old password no longer works.
9. Confirm the new password works.

### Email Change

1. Sign in with the test account.
2. Request a change to a second test email.
3. Receive all confirmations required by Secure Email Change.
4. Complete both confirmations when required.
5. Confirm the Account page shows the new confirmed email.
6. Confirm the Supabase user UUID did not change.
7. Confirm existing cloud Pizza Sessions remain available.

### Sign Out

1. Create or open local Pizza Session data.
2. Sign out.
3. Confirm private account information disappears.
4. Confirm local Pizza Session data remains available.
5. Confirm cloud writes stop while signed out.

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
