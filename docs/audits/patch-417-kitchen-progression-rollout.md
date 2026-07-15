# Patch 417: Kitchen Progression Rollout

## Summary

Patch 417 allows the complete Kitchen workflow to be tested immediately while the Patch 416 account-preference storage is waiting for production Supabase rollout.

The preference table, API, Account toggle and normalization code remain in place. Enforcement is temporarily disabled through the explicit source constant:

`EARLY_COMPLETION_PREFERENCE_ENFORCED = false`

## Temporary Contract

Before readiness, these timed biological steps are actionable for every user:

- Rest dough
- Fermentation
- Ball rest / final proof

Pressing the action before readiness opens the existing warning dialog. `Keep waiting`, Escape and backdrop close keep the current step active. `Mark complete early` uses the normal Kitchen completion path and records `actualCompletedAt`.

At or after readiness, every user completes normally without the dialog.

## Preference Rollout

The Account setting still saves the user preference:

`allowEarlyTimedStepCompletion`

During this temporary rollout, the setting does not block or enable Kitchen progression. It is ready for a later narrow patch that flips enforcement after:

1. the Supabase migration is applied
2. the production preferences API is verified
3. cross-device Account preference behavior is verified

## Completion Bug Fix

The Kitchen completion handler now uses one explicit completion timestamp for:

- `completeKitchenTimelineStep(...)`
- updating the visible Kitchen clock
- queued cloud progress sync payload

This keeps ready or overdue fermentation completion deterministic. Completing an overdue room-temperature fermentation records `stepRuntime["room-ferment"].actualCompletedAt`, updates the saved timeline status and immediately advances the current Kitchen step to Ball dough.

## Preserved Behavior

Patch 417 does not change:

- Patch 414B effective schedule rules
- biological planned durations
- original Timeline timestamps
- Patch 415 mobile Rest hierarchy
- PizzaSession schema
- dough formulas
- bake timer behavior
- Review flow
- Party Orders
- auth or SEO behavior

## Validation Notes

Regression coverage was added for:

- temporary rollout constant and preference code remaining in place
- early-completion warning controls
- overdue room fermentation advancing to Ball dough
- runtime completion persistence for the fermentation step
- cloud queue ordering after Kitchen mutation
