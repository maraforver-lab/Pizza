# Patch 371A: GDPR data inventory and deletion architecture

## Executive summary

This audit maps DoughTools data connected to a signed-in user and defines a safe implementation path for self-service export, current-device clearing, cloud-data deletion, and account deletion.

The current product already separates several important boundaries:

- Supabase Auth owns login identity, email, sessions, and password state.
- `public.pizza_sessions` stores cloud-backed pizza plans, including active and completed plans.
- `public.account_preferences` stores per-account preferences, including Bake Timer sound preference.
- `public.party_orders`, `public.party_order_submissions`, and `public.party_order_items` store owner-managed party orders and guest submissions.
- Supabase Storage bucket `pizza-session-photos` stores uploaded review photos under an owner-scoped path.
- Device-local data is stored in `localStorage`, `sessionStorage`, and Supabase auth cookies/storage. No first-party IndexedDB usage was found.

The highest-risk deletion dependency is review photo cleanup: deleting `pizza_sessions` does not automatically delete Supabase Storage objects. The second highest-risk dependency is shared Party Order data: organizer deletion can cascade guest submissions, but guest submissions must not be deleted blindly from unrelated organizers. Admin-created public configuration also needs special handling because some rows reference `auth.users`.

No production code, database schema, RLS policy, storage policy, privacy copy, or production data was changed in this audit.

## Sources inspected

Routes and code paths inspected:

- Supabase auth clients and helpers: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/route.ts`
- Account UI and settings: `app/account/page.tsx`, `app/account/settings/page.tsx`, `components/account/**`
- Account preference logic: `lib/account-preferences.ts`, `app/api/account/preferences/**`
- Pizza Session storage and cloud sync: `lib/pizza-session-storage.ts`, `lib/cloud-pizza-session-client.ts`, `app/api/pizza-sessions/**`
- Review photo upload and removal paths: `app/api/pizza-sessions/[id]/photo/**`, `lib/pizza-session-photos.ts`
- Party Orders: `app/api/party-orders/**`, `app/api/public-party-orders/**`, `lib/party-orders/**`
- Bake Timer local runtime storage: `lib/use-bake-timer.ts`, `components/session/KitchenBakeTimerPanel.tsx`
- Local recipe and preference storage: `lib/saved-recipes.ts`, `lib/quick-calculator/quick-calculator-storage.ts`, `lib/local-bake-results.ts`, `lib/experience-levels.ts`
- Trust and Privacy copy: `lib/trust-pages.ts`
- Supabase migrations under `supabase/migrations/**`

## Current authentication boundary

Current signed-in identity is proven by a Supabase session. Server code reads the session through the Supabase SSR cookie flow or route helper and uses the authenticated user id for ownership checks.

Current pattern:

```text
user signs in
-> Supabase Auth issues session
-> browser/server receives auth cookies/session
-> API routes call Supabase auth helpers
-> route receives user.id
-> RLS and explicit filters constrain rows by owner fields
```

Important identifiers:

- Auth user id: `auth.users.id`
- Cookie/session access token managed by Supabase
- Owner columns such as `user_id`
- Storage object first folder segment matching `auth.uid()`

No self-service GDPR feature should trust client state, local storage, Account preferences, query parameters, or decoded browser-only claims. Export and deletion endpoints must require a valid Supabase session. Account deletion requires a trusted server-side operation that can delete the Supabase Auth user without exposing service-role credentials to the browser.

## Data inventory

### Supabase Auth

System: Supabase Auth.

Likely user data:

- user id
- email address
- identity provider metadata
- password/authentication state
- confirmed/created timestamps
- active sessions/refresh tokens

Ownership field: Auth user id.

Deletion dependency: App-owned cloud data should be deleted or made safe before deleting the Auth user. Some app tables cascade from `auth.users`; relying only on cascade is not enough because Storage objects and external logs do not cascade.

Export: include the current user's account identifier, email, provider/identity summary where available, and account creation/confirmation timestamps where safely accessible.

Delete with account: delete Auth user through a trusted server-only Supabase Admin operation after app data deletion succeeds.

Retention limitation: Supabase backups, auth logs, and security logs may remain according to provider retention and should be disclosed separately from live data deletion.

### `public.account_preferences`

Migration sources:

- `20260715120000_create_account_preferences.sql`
- `20260721130000_create_bake_timer_sound_theme_settings.sql`
- `20260721140000_release_novelty_bake_timer_sound_themes.sql`
- `20260722130000_fix_account_preferences_authenticated_grants.sql`
- `20260722131000_tighten_account_preferences_authenticated_grants.sql`

Fields:

- `user_id`
- `allow_early_timed_step_completion`
- `bake_timer_sound_theme`
- `created_at`
- `updated_at`

Ownership field: `user_id`.

Current access model: RLS is owner-scoped with authenticated users allowed to select, insert, and update only their own preference row.

Export: include the current user's preference row.

Device clear: not applicable, except local UI state can be cleared.

Delete with account: remove this row during cloud-data deletion, or allow Auth cascade after account deletion. Because current grants do not include user DELETE, self-service deletion should happen through a trusted server endpoint or service role.

### `public.pizza_sessions`

Migration source:

- `20260704183000_create_pizza_sessions.sql` and later session migrations.

Fields include:

- `id`
- `user_id`
- `status`
- `title`
- `current_step`
- `session_data`
- `created_at`
- `updated_at`
- `completed_at`

The `session_data` JSON contains pizza-plan details and may contain Review data, completion state, and photo metadata.

Ownership field: `user_id`.

Current access model: RLS policies allow a user to select, insert, and update their own rows. API routes also filter by `user_id`.

Export: include all cloud rows owned by the user, including active, completed, and archived rows if retained. Include `session_data` as stored, because it is the complete cloud representation of the pizza plan.

Delete with account: delete all rows owned by the user, after collecting photo paths and removing corresponding Storage objects.

Failure risk: deleting rows before collecting Storage paths can orphan photos. The deletion service should gather paths first.

### Review photos and `pizza-session-photos` Storage bucket

Migration source:

- `20260705113000_create_pizza_session_photos_bucket.sql`

Bucket:

- `pizza-session-photos`
- private bucket
- 5 MB file size limit
- allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

Ownership model: Storage policies require the first folder segment of the object name to match `auth.uid()`.

Known object pattern: photo paths are user-scoped and tied to a pizza session, for example an owner folder followed by a session-specific segment and image file name.

Export:

- include photo metadata from `pizza_sessions.session_data`
- provide photo files or short-lived signed download links generated server-side
- do not expose permanent public URLs

Delete with account:

- list and delete all objects under the user's Storage prefix
- also delete any exact paths referenced by owned `pizza_sessions.session_data`
- then delete `pizza_sessions`

Orphan cleanup requirement: add a recovery job or idempotent deletion retry because Storage and database deletion are not one transaction.

External processing: photo upload uses server-side moderation/relevance checks. Provider request logs and derived safety metadata may be retained externally according to provider policies.

### Party Orders

Migration sources:

- `20260705200000_create_party_orders.sql`
- `20260705210000_create_party_order_submissions.sql`
- `20260706093000_allow_archived_party_orders.sql`
- `20260707103000_allow_owner_delete_party_order_submissions.sql`
- `20260718123000_add_party_order_time_zone.sql`

Tables:

- `public.party_orders`
- `public.party_order_submissions`
- `public.party_order_items`

Owner table fields include:

- `party_orders.user_id`
- `public_token`
- `title`
- `pizza_datetime`
- `orders_close_at`
- `time_zone`
- `guest_note`
- `allowed_pizza_ids`
- `status`
- timestamps

Guest submission fields include:

- `guest_name`
- `guest_comment`
- submission timestamps
- item snapshots and quantities
- edit-token based public retrieval in later migrations

Ownership field:

- organizer ownership is `party_orders.user_id`
- guest submissions are owned by the party order relationship, not by an authenticated guest account

Current access model:

- organizers can read their own party orders and submissions
- public RPCs allow guests to submit and retrieve limited order/submission data by public token or edit token
- owner delete of submissions is allowed by a later migration

Export:

- include party orders owned by the current user
- include guest submissions and items attached to those owned party orders
- treat public tokens and edit tokens as sensitive access tokens

Delete with account:

- deleting organizer-owned `party_orders` cascades submissions and items
- this is expected for the organizer's account deletion, but the UI must warn that guest submissions attached to that party order will also be removed

Do not delete blindly:

- a signed-in user who appears only as a guest in another person's party order cannot be reliably found by Auth id
- guest names and comments must not be deleted by matching names or emails
- unrelated organizers' party orders must remain untouched

### `public.user_roles`

Migration source:

- `20260720120000_create_user_roles_and_admin_hook.sql`

Fields:

- `user_id`
- `role`
- `created_at`
- `updated_at`
- `updated_by`

Ownership/dependency:

- `user_id` references `auth.users(id)` with cascade
- `updated_by` references `auth.users(id)` with set null

Export: include the current user's app role as account metadata if exported by the account export endpoint.

Delete with account: Auth deletion cascades the user's role row. Role assignment history is not a user-editable preference and must not be exposed as a role-management feature.

### Admin-managed public configuration with user references

Relevant future/product configuration tables include:

- `public.theme_campaigns`
- `public.bake_timer_sound_theme_settings`

`theme_campaigns` contains `created_by` and `updated_by` references to `auth.users`. These rows are public product configuration, not private user content. However, an admin account deletion can be blocked or complicated if these foreign keys are not nullable or not reassigned.

`bake_timer_sound_theme_settings.updated_by` is nullable and uses `on delete set null`.

Export:

- ordinary user export should not include public product configuration
- admin export may include a summary of product configuration changes tied to their user id if required later

Delete with account:

- before deleting an admin Auth user, either reassign/anonymize `theme_campaigns.created_by` and `theme_campaigns.updated_by`, or define an approved retention policy for admin-authored public configuration
- do not delete public theme campaigns or sound settings just because the admin account is deleted

## Device-local data inventory

The current codebase stores several pieces of data in the browser. These are current-device data and are not deleted from other devices by cloud account deletion.

Known keys:

- `doughtools:pizza-sessions-v1` - local pizza plans
- `doughtools:active-pizza-session-id` - active local pizza-plan pointer
- `doughtools:cloud-backed-pizza-session-id` - local mapping between a local plan and a cloud session
- `doughtools.kitchen-bake-timer.v1:<sessionId>` - Kitchen Bake Timer runtime snapshot
- `doughtools.bake-timer.sound-enabled.v1` - runtime Bake Timer sound toggle
- `doughtools:dough-plan-auto-saved-snapshot-key` - session storage snapshot used during save-to-account flow
- `doughtools-saved-recipes-v1` - local saved calculator recipes
- `doughtools.quick-calculator.recipes.v1` - local Quick dough calculator recipes
- `doughtools:bake-results` - local bake results
- `doughtools.experienceLevel` - local user experience level
- `doughtools-currency` - local cost/currency preference

Privacy copy also mentions install-prompt state, gear checklist choices, and older local planning state. If those features still exist, Patch 371B should centralize and verify their exact current keys before implementing a clear-device action.

IndexedDB: no first-party IndexedDB usage was found during inspection.

Cookies and auth storage:

- Supabase auth cookies/session storage are used for signed-in state
- a local-device clearing action can clear app local storage and session storage
- signing out should clear the active Supabase session for the device
- a client-only clear action must not be described as deleting cloud data

## External services and logs

External systems that may retain user-related metadata:

- Supabase Auth, Database, Storage, and logs
- Vercel hosting, serverless, analytics/logging metadata if enabled
- OpenAI photo moderation/relevance processing for uploaded review photos
- support email provider for privacy/contact requests

These systems may retain operational logs, security logs, backups, and request metadata according to provider policies. A self-service deletion flow can delete live app data and the Auth account, but it cannot guarantee immediate deletion from backups or provider logs.

The Privacy Policy should eventually distinguish:

- live app data deletion
- current-device clearing
- Auth account deletion
- backup/log retention limits
- support-request handling

## Export architecture

Export should be a signed-in, server-generated operation with no public token or guessed identifier.

Recommended export contents:

- Auth account summary: user id, email, provider summary, created/confirmed timestamps where safely available
- Account preferences
- User role value
- All owned `pizza_sessions`, including `session_data`
- Review photo metadata and short-lived signed photo download links, or a bundled export format when practical
- Owned Party Orders
- Guest submissions and items attached to owned Party Orders
- Sensitive access tokens such as party public tokens or edit tokens only inside the authenticated export, clearly marked as sensitive
- Current-device local data only when the export is initiated in the browser and the user chooses to include local data

Do not include:

- other users' pizza sessions
- other users' account preferences
- unrelated guest submissions from other organizers
- Supabase Auth internals not intended for the end user
- raw provider logs
- service-role details

## Current-device clearing architecture

Current-device clearing should be separate from cloud deletion.

Clear only from the current browser/device:

- local pizza plans and active pointer
- cloud-backed local pointer
- Kitchen Bake Timer runtime snapshots
- runtime Bake Timer sound setting
- auto-save session snapshot
- local saved calculator recipes
- local Quick dough calculator recipes
- local bake results
- experience level
- currency preference
- any verified install prompt or checklist keys
- optional Supabase sign-out/session clearing when the user chooses to sign out

Do not delete from cloud:

- account preferences
- cloud pizza plans
- review photos
- Party Orders
- Auth account

The UI must avoid language such as "delete my account" for current-device clearing.

## Cloud-data deletion architecture

Cloud-data deletion should remove app-owned data while leaving the Auth account until the final account-deletion step.

Recommended deletion targets:

- Storage objects in `pizza-session-photos` for the user's prefix and referenced photo paths
- `public.pizza_sessions` rows for the user
- `public.party_orders` rows for the user, cascading submissions and items
- `public.account_preferences` row for the user
- optional user role row only as part of Auth/account deletion, not as a user-editable role reset

Do not delete:

- public product configuration created by an admin account
- other users' Party Orders or guest submissions
- provider logs/backups
- anonymous guest submissions owned by another organizer

## Full account deletion architecture

Full account deletion should be a trusted server-side flow:

1. Require a valid signed-in Supabase session.
2. Require an explicit confirmation step, such as typing a confirmation phrase.
3. Optionally require recent authentication where Supabase supports it.
4. Build an operation plan listing counts only, not private row contents.
5. Gather owned photo paths from `pizza_sessions.session_data` and Storage prefix.
6. Delete Storage objects first. If this fails, stop before deleting database rows so the operation can retry with intact references.
7. Delete owned Party Orders, allowing submissions and items to cascade.
8. Delete owned Pizza Sessions.
9. Delete Account preferences.
10. Handle admin-authored public configuration references by reassigning or anonymizing metadata according to a future migration.
11. Delete the Auth user through a server-only Supabase Admin operation.
12. Clear current-device local data and sign out.
13. Return a completion result that does not expose identifiers.

Failure recovery:

- The operation must be idempotent.
- Counts and deletion phases should be resumable.
- Storage deletion failures should not leave the user thinking account deletion completed.
- If Auth deletion succeeds but app cleanup partially failed, service-role cleanup by user id must still be possible from logs or an internal operation record. The operation record must not store private content.

## Authorization requirements

All GDPR endpoints must:

- require a valid signed-in user
- use the current session user id, not a request body user id
- never accept an arbitrary `userId` from the browser
- never use Account preferences, localStorage, or query parameters as authorization
- use owner-scoped RLS where possible
- use a server-only elevated client only for operations that RLS/user grants cannot perform, such as Auth user deletion and cross-resource Storage cleanup
- avoid exposing service-role credentials in browser bundles, HTML, logs, or API responses
- return counts and generic status rather than row contents in deletion previews

Admin users do not automatically receive access to private user deletion/export data. GDPR self-service is for the current user's own account.

## Shared and guest data rules

Party Orders need explicit user-facing language:

- If the signed-in organizer deletes their account, their Party Orders and guest submissions attached to those Party Orders may be deleted.
- If a person submitted as a guest to another organizer's Party Order, that data is not connected to a DoughTools Auth account and must not be deleted by name matching.
- Guest edit tokens and public tokens are sensitive and should be handled as access tokens.

Review photos need explicit cleanup:

- Removing a photo from a review should delete the prior Storage object.
- Deleting a pizza plan or account should delete referenced Storage objects.
- A periodic orphan cleanup may be needed for Storage objects with no matching `pizza_sessions` reference.

Admin-created public configuration needs explicit handling:

- An admin account deletion must not delete public theme campaigns or sound-theme settings.
- The application should avoid blocking account deletion on non-null product-config author references by using a future anonymization or reassignment strategy.

## Retention and backup limitations

Current privacy copy already says archive/delete actions may not prove physical erasure from every table or backup. The self-service deletion design should keep that distinction.

Recommended disclosure boundaries:

- Live app rows can be deleted from production tables.
- Storage objects can be deleted from the production bucket.
- Auth accounts can be deleted from Supabase Auth.
- Backups, provider logs, security logs, support emails, and abuse-prevention records may remain for a limited period under provider or legal retention.
- Public product configuration authored by an admin may retain anonymized operational history.

## Safe deletion order

Recommended order for account deletion:

1. Authenticate current user and verify confirmation.
2. Build deletion preview counts.
3. Detect admin-authored public configuration references.
4. Gather Storage photo paths.
5. Delete Storage objects.
6. Delete organizer-owned Party Orders.
7. Delete owned Pizza Sessions.
8. Delete Account preferences.
9. Delete or allow cascade of role row.
10. Delete Supabase Auth user.
11. Clear current-device storage and auth session.
12. Return generic completion.

If any step before Auth deletion fails, stop and allow retry. If Auth deletion fails after app data deletion, show a clear retry path and do not recreate app data.

## Patch 371B-371F implementation sequence

### Patch 371B: Current-device data clearing

Small scope:

- create a central local-data key registry
- add a current-device clear action in Account or Settings
- clear only local/session storage keys owned by DoughTools
- optionally sign out when the user chooses
- add tests proving cloud APIs are not called

This patch should not delete cloud rows or Auth accounts.

### Patch 371C: User data export

Small scope:

- add a signed-in export endpoint and Account/Settings action
- export Auth account summary, account preferences, role, pizza plans, owned Party Orders, submissions/items, and photo metadata
- add safe photo download handling with signed URLs or documented deferred file bundle
- include optional current-device data when initiated in the browser
- add authorization tests for signed-out and cross-user attempts

### Patch 371D: Cloud app-data deletion

Small scope:

- add a signed-in cloud-data deletion preview and execution endpoint
- delete Storage photos, owned Party Orders, owned Pizza Sessions, and Account preferences
- leave Auth account active
- preserve other users' data and public product configuration
- add idempotency and failure tests

### Patch 371E: Full Auth account deletion

Small scope:

- add server-only Supabase Admin deletion after Patch 371D cleanup
- require explicit confirmation and recent-session checks where possible
- handle admin-authored public configuration references
- clear current-device data and sign out
- add tests proving no service key reaches the browser

### Patch 371F: Privacy and account-control polish

Small scope:

- update Privacy Policy and Account/Settings copy to reflect export, local clear, cloud deletion, account deletion, and backup limitations
- add final end-to-end regression tests
- add operational runbook for failed deletion recovery and orphan photo cleanup

## Known limitations

- Exact Supabase/Vercel/OpenAI log and backup retention periods must be confirmed from provider settings or contracts before final privacy wording.
- Current code inspection found no first-party IndexedDB usage, but Patch 371B should keep a registry-based approach so future local stores are not missed.
- Admin-authored public configuration references require careful migration planning before allowing self-service deletion for admin accounts.
- Exporting photo binaries may need a separate file-bundle implementation if signed URLs are not considered sufficient.

## Conclusion

The recommended architecture is a staged self-service privacy system: first current-device clearing, then signed-in export, then app cloud-data deletion, then Auth account deletion, followed by privacy-policy and operations polish. The deletion path must treat Storage photos, Party Order guest submissions, and admin-authored public configuration as special dependencies rather than relying only on database cascades.
