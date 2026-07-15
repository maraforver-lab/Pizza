# Patch 425: Signed-In Plan Creation After Cloud Authority

Date: 2026-07-15
Branch: `patch/425-signed-in-plan-creation-cloud-authority`
Starting commit: `8d437762922b`

## Issue

Patch 424B correctly made cloud the authority for signed-in active Pizza Sessions. The Session Start final action still used the older fire-and-forget cloud save:

1. save the new session locally
2. mark it active locally
3. queue cloud save asynchronously
4. navigate immediately to `/session/recipe`

That ordering allowed the Recipe route's canonical resolver to run before the new account row existed. For a signed-in user, the resolver could then reject or clear the local-only active session because cloud had no active row yet.

## Fix

Session creation now uses an explicit materialization path:

- `Create my pizza plan` saves the local session and active pointer.
- It then awaits `materializeCloudBackedPizzaSession(saved)`.
- Signed-out users continue when the helper returns the existing unauthenticated local-only result.
- Signed-in users continue only after the active cloud row is created or verified.
- The button shows `Creating pizza plan...` while this is happening.
- Cloud failures show a recoverable account-save error instead of navigating to Recipe with a non-authoritative local session.

## Helper

Added:

- `materializeCloudBackedPizzaSession(session)`

The helper wraps the existing cloud save queue, preserves existing stale-write and cloud-backed marker behavior, and returns either:

- `cloud-backed` with the saved cloud row
- `local-only` for unauthenticated users

It does not create a parallel cloud-sync system.

## Cleanup

The explicit replacement path now calls the cloud-backed pointer cleanup before clearing the active local pointer, so stale cloud-backed local cache is archived and cleared correctly.

## Protected Behavior

No changes were made to formulas, Recipe generation, Shopping quantities, Timeline generation, Kitchen runtime logic, session schema, authentication schema, Party Orders, SEO or navigation.

## Validation

Validation covered:

- signed-in creation source path ordering
- cloud materialization helper contract
- Session Start final action state
- canonical resolver behavior from Patch 424B
- full automated suite
- lint
- production build
- `git diff --check`
