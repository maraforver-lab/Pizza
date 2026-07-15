# Patch 424B: Cloud-Authoritative Active Sessions

Implementation date: 2026-07-15
Branch: `patch/424b-cloud-authoritative-active-sessions`
Starting commit: `4331a8c4aedef6482e8230766c64893c3b115ba4`

## Summary

Patch 424B implements the authority contract recommended by Patch 424A: signed-out users keep the existing local active-session behavior, while signed-in users use the account cloud row as the canonical active Pizza Session.

The patch replaces the homepage-only active-session resolver with a shared canonical resolver used by homepage CTAs, Account active-session UI, Session Start, and every active Pizza Session route before those routes render or mutate session data.

## Authority Contract

Signed-out users:

- local active Pizza Session storage remains authoritative
- no cloud lookup is required
- anonymous session creation and continuation remain unchanged

Signed-in users:

- an existing active cloud session wins over an unrelated local session
- local storage is treated as a cache or materialized copy of the active cloud row
- unrelated local sessions are not uploaded over an existing active cloud session
- a local anonymous active session is promoted only when no active cloud session exists
- the same logical cloud-backed session may use newer local cache data, preserving existing stale-write protections

## Shared Resolver

New source:

- `lib/canonical-active-pizza-session.ts`

Key exports:

- `resolveCanonicalActivePizzaSession(...)`
- `chooseCanonicalActivePizzaSession(...)`
- `deriveActiveSessionResumeRoute(...)`

Resolver behavior:

| State | Result |
| --- | --- |
| Signed out, local active | local active session is returned |
| Signed out, no local active | empty state points to `/session/start` |
| Signed in, active cloud row | cloud row is restored locally and returned |
| Signed in, cloud row plus same local session | newer local cache may be returned for that same logical session |
| Signed in, no cloud row plus anonymous local session | local session is promoted to cloud once |
| Signed in, no cloud row plus stale cloud-backed local cache | stale local cache is cleared through the existing cloud-backed pointer cleanup |
| Signed in, cloud/API failure | error state is returned so routes do not continue an unrelated local session as canonical |

## Updated Surfaces

Homepage:

- `components/HomepageSessionActions.tsx` now uses the shared resolver
- signed-in loading state prevents a temporary `Plan my new pizza` action
- active sessions show `Continue my pizza`
- starting a new pizza while a session exists requires confirmation

Account:

- `components/account/AccountActivePizzaSessionCard.tsx` resolves through the same canonical path
- cloud session rows remain the account source of truth

Continue card:

- `components/ContinuePizzaSessionCard.tsx` uses the shared resolver and canonical resume-route helper

Active Pizza Session routes:

- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`

Each route resolves the canonical active session before reading, deriving, or mutating route state.

## Review Completion

Review now re-checks the canonical active session before finishing. If the signed-in canonical session changed or cannot be verified, Review blocks completion with a recoverable message.

For signed-in canonical sessions, Review must complete the cloud-backed active row with `complete: true`. The page does not silently treat a local-only completion as successful account history.

The normal active-session cloud sync component is skipped after the session enters `completed` state so the explicit completion path remains authoritative.

## Documentation Update

`docs/pizza-session-autosave-and-resume.md` now records the signed-in rule:

> cloud is authoritative; local state is a cache of the same logical account-backed session.

It also documents anonymous local behavior, promotion, conflict handling, Review completion, and failure handling.

## Validation

Validation completed for:

- focused active-session authority tests
- homepage, Account, session route, Review, Shopping, Timeline and Kitchen focused tests
- full automated test suite
- lint
- production build
- `git diff --check`

## Protected Invariants

No formulas, dough calculations, timeline generation, Kitchen timing, session schema, authentication schema, Party Orders, SEO, navigation, or deployment configuration were changed.
