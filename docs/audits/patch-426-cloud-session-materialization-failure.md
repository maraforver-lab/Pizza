# Patch 426: Cloud Session Materialization Failure

Branch: `patch/426-cloud-session-materialization-failure`

Starting commit: `e8b185a204b1`

## Executive Summary

Patch 425 correctly made signed-in Session Start wait for cloud materialization before opening Recipe. The remaining failure was in the active-session API authentication boundary: the browser knew the user was signed in, but `/api/pizza-sessions/active` could still resolve no server-side user when the request depended only on Supabase SSR cookies.

Patch 426 keeps Patch 424B cloud authority intact and fixes the API identity path. Active-session cloud requests now carry the authenticated browser access token, and the server route can authenticate either the existing SSR cookie session or that bearer token before applying user-owned RLS queries.

No service-role bypass was added. Inserts and updates still run as the authenticated user.

## Root Cause

The signed-in materialization path was:

1. Session Start created a local `PizzaSession`.
2. `materializeCloudBackedPizzaSession(...)` called the active-session save queue.
3. `saveCloudActivePizzaSession(...)` verified the browser Supabase session.
4. The actual `POST /api/pizza-sessions/active` request did not forward the access token.
5. The API route called `getSupabaseServerClient().auth.getUser()` and depended on Supabase SSR cookies only.
6. In the failing signed-in mobile state, the route could not resolve the user, so cloud materialization failed and Patch 425 correctly blocked Recipe navigation.

This was an API/auth-context failure before a canonical cloud-backed active session could be created.

## Fix

- Added a shared browser request-header helper for active Pizza Session API requests.
- Added `Authorization: Bearer <access_token>` to signed-in active-session POST/PATCH/GET promotion flows where a token exists.
- Added a server route client resolver that first tries the existing cookie session and then falls back to a bearer-token Supabase client.
- Updated `/api/pizza-sessions/active` GET/POST/PATCH/DELETE to use the route resolver.
- Updated Account active-session delete to use the same active-session request headers.
- Kept RLS and authenticated-user ownership checks unchanged.

## Authority Contract Preserved

Signed-out users remain local-only.

Signed-in users still use the active cloud row as canonical. A different unrelated local session cannot overwrite an existing active cloud session, and cloud materialization must succeed before Recipe opens after explicit signed-in creation.

The fix does not compare unrelated sessions by timestamp, does not bypass Patch 424B, and does not add service-role writes.

## Database and RLS

No database migration was required.

The existing `pizza_sessions` RLS model remains valid:

- rows are scoped by `user_id`
- insert/update/read still require the authenticated user
- the API uses the Supabase publishable key with either SSR cookie auth or the browser bearer token

## Tests

Focused validation added or updated:

- active-session route source now uses the shared route auth resolver
- server resolver supports cookie auth and bearer auth
- Session Start materialization POST uses authenticated browser request headers
- canonical active-session resolver passes auth headers to cloud GET and local-promotion POST
- Account active-session delete uses the same active-session header helper
- homepage resolver behavior test verifies `Authorization: Bearer ...` is forwarded for cloud lookup and local promotion

Focused command:

```text
npm run test -- tests/homepage-active-session.test.ts tests/cloud-pizza-sessions.test.ts
```

Result:

```text
2 test files passed, 60 tests passed
```

## Protected Invariants

- no cloud-authority weakening
- no signed-out behavior change
- no session schema change
- no Pizza Session calculation change
- no persistence model redesign
- no database migration
- no auth service-role bypass
- no Party Orders change
- no deployment

## Manual Verification Notes

Live signed-in mobile validation should now exercise the same transaction that Patch 425 exposed:

1. sign in
2. complete Session Start
3. press `Create my pizza plan`
4. expect cloud materialization to succeed
5. expect Recipe to open
6. expect Account to show the same active Pizza Session

Retry should remain idempotent because the active-session route still resolves and updates the same in-progress row for the same logical session.
