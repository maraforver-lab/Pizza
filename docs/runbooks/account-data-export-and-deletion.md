# Account Data Export and Deletion Runbook

Patch 371F documents the current self-service GDPR support for signed-in DoughTools users. This runbook is operational guidance for support and production verification; it is not a separate product workflow.

## Export Verification

1. Sign in as the affected user through the normal Account flow.
2. Open `/account/settings`.
3. Use `Download my data`.
4. Confirm the downloaded JSON has:
   - `formatVersion`
   - `exportedAt`
   - account identity metadata
   - account preferences
   - owned pizza plans
   - Review photo metadata
   - owned Party Orders
   - related guest submissions and items for those owned orders
   - account role
5. Confirm the export does not include passwords, login tokens, raw Storage credentials, signed photo URLs, Party Order public or edit tokens, or rows belonging to another user.

Never accept a user ID from the browser or support notes as proof of identity. The export API derives the user from the authenticated server-side session.

## Deletion Order

Self-service full account deletion runs in this order:

1. authenticate the current server-side user
2. check the authoritative role and block admin accounts
3. collect owned Review photo Storage paths from owned pizza plans
4. delete owned Review photo objects from `pizza-session-photos`
5. delete owner-scoped DoughTools cloud application data through the 371C deletion helper
6. delete the Supabase Auth user only after required cleanup succeeds
7. revoke the current session where possible
8. clear known DoughTools-owned local app data in the current browser

The browser cleanup must remove only known DoughTools keys. Do not use `localStorage.clear()`, `sessionStorage.clear()`, cookie wiping, or browser-profile cleanup as a support instruction.

## Admin Self-Deletion Block

Admin-role accounts cannot use self-service deletion. The product returns a safe blocked message because admin accounts may have public product configuration references such as theme campaigns or sound settings.

Support handling for an admin deletion request:

1. verify the request through the normal authenticated/support process
2. review public product configuration references
3. decide whether admin ownership must be reassigned or preserved
4. perform any approved manual operation using trusted Supabase Dashboard or CLI access
5. record what was done without exposing private user data

Do not create a public admin deletion endpoint.

## Partial-Failure Handling

Deletion must not claim success unless all critical stages finish.

- If Storage cleanup fails, app-data deletion and Auth deletion must not proceed.
- If app-data deletion fails, Auth deletion must not proceed.
- If Auth deletion fails after Storage and app data succeeded, support may retry the deletion operation while the Auth account still exists.
- API responses should expose safe stage metadata only, not raw private Storage paths, tokens, emails or unrelated user rows.

Safe retry procedure:

1. ask the user to retry from `/account/settings` if they remain signed in
2. if they cannot retry, use support verification before any manual action
3. inspect only category counts and owned-object existence needed to resolve the failure
4. avoid deleting by guessed user ID, email text search, guest name, Party Order title, or photo filename

## Storage Orphan Checks

For a failed deletion involving Review photos:

1. identify owned photo paths only from the user’s own `pizza_sessions.session_data.photo.path`
2. confirm paths use the expected owner prefix
3. remove only those owned objects from the `pizza-session-photos` bucket
4. never remove bucket objects by filename pattern alone
5. after cleanup, retry or complete the app-data/Auth deletion sequence as appropriate

## Support Handling for Failed Requests

When a user reports a failed export or deletion:

1. do not ask them to send passwords, access tokens, refresh tokens, full database IDs, or private Party Order links
2. ask for the visible product error and approximate time
3. verify whether the user is signed in and whether the account is an admin account
4. check server logs only for operational error category, not private payload contents
5. if manual intervention is required, use the smallest trusted Supabase operation needed
6. document the outcome and tell the user whether retry, completion, or further verification is needed

## Never Do This

- Do not delete by user ID guesswork.
- Do not delete by email string search without verified identity and a trusted admin process.
- Do not delete Party Order guest data by guest name matching.
- Do not delete public admin configuration solely because `created_by` references a user.
- Do not print or share service-role keys, access tokens, refresh tokens, signed Storage URLs, public Party Order tokens, edit tokens, or raw private row contents.
- Do not modify RLS, migrations, or Auth users directly from the browser.
