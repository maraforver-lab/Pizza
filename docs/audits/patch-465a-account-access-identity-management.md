# Patch 465A Account Access and Identity Management

## Summary

Patch 465A adds the missing Supabase Auth account-access flows without adding application auth tables, migrations, Pizza Plan changes, or GDPR deletion changes.

## Previous Missing Flows

- Signed-out users had no `Forgot password?` path from the sign-in form.
- Password-reset links had no dedicated completion page.
- Account Settings Security linked back to `/account` for “Change email or password” instead of offering real signed-in controls.
- Email-address changes were not available from the Security settings page.

## Final Routes

- `/account` keeps sign in, sign up, sign out state handling, and now links to forgot password only in Sign in mode.
- `/account/forgot-password` sends a Supabase Auth reset email.
- `/account/reset-password` completes password update after a recovery callback creates a Supabase session.
- `/account/settings/security` shows current email, email-change, password-change, and sign-out sections.
- `/auth/callback` still exchanges Supabase codes and now routes recovery callbacks to the reset-password page.

## Forgot-Password Request Flow

The forgot-password page asks only for an email address and calls `supabase.auth.resetPasswordForEmail(...)` through the existing browser client. The redirect target is built from `location.origin` and returns through:

`/auth/callback?next=/account/reset-password`

After submission the UI uses a generic success message:

`If an account exists for that email, a password-reset link has been sent.`

The email is trimmed, not placed in the URL, not stored in local storage, and not logged.

## Recovery Callback Flow

The callback route continues to reject external `next` destinations by allowing only relative paths that do not start with `//`. Recovery callbacks are redirected internally to `/account/reset-password?recovery=1` after Supabase code exchange succeeds. Failed recovery callbacks return to a safe invalid-link state.

The callback does not render auth codes, tokens, provider metadata, or raw error messages.

## Signed-In Password Change Flow

The Security page uses the existing Supabase browser client and `supabase.auth.updateUser({ password })`. The form requires at least 8 characters, matching confirmation, duplicate-submit prevention, accessible status output, and clears password fields after success.

This flow does not sign the user out unless Supabase session state changes independently, and it does not delete local Pizza Plan or recipe data.

## Email-Change Confirmation Flow

The Security page shows the current account email and a separate new-email form. It trims and normalizes the new email, blocks unchanged submissions, then calls Supabase Auth with the new email and an internal callback return to `/account/settings/security`.

The UI states that confirmation instructions are sent and that the current email remains active until confirmation completes.

## Enumeration Protection

The reset-request success state does not reveal whether an account exists, whether it is confirmed, or which provider it uses. Account-access errors are mapped to safe operational messages instead of raw provider details.

## Redirect Safety

Required Supabase redirect allowlist entries:

- `https://www.doughtools.app/auth/callback`
- Local development callback origins used for development, such as `http://localhost:3000/auth/callback`

No Vercel preview URL is hard-coded into application logic. Preview or additional deployment domains should be added explicitly in Supabase only when intentionally supported.

## Local-Data Preservation

Forgot password, password reset, password change, email change, and sign out do not clear browser-local pizza plans, recipes, notes, or preferences. Sign out remains a Supabase session action only.

GDPR deletion remains separate under Privacy and data.

## Schema and Data Boundaries

No database schema, Supabase migration, custom password table, custom email table, or application token store was introduced.

Pizza Plan, recipes, calculations, formulas, sessions, account export, account deletion, header, navigation, and footer are outside this patch.

## Production Verification Steps

1. Confirm `/account` shows `Forgot password?` only in Sign in mode.
2. Confirm `/account/forgot-password` sends a generic reset-link success message.
3. Confirm a valid Supabase recovery email returns through `/auth/callback` to `/account/reset-password`.
4. Confirm an invalid or expired reset visit shows the safe invalid-link state.
5. Confirm `/account/settings/security` shows current email, email-change, password-change, and sign-out sections for a signed-in user.
6. Confirm sign out does not run GDPR deletion or local-data cleanup.
7. Confirm Supabase redirect allowlist includes production and local callback origins before claiming release readiness.
