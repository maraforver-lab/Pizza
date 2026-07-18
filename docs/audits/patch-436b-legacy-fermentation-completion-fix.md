# Patch 436B: Legacy Fermentation Completion Fix

## 1. Patch 436A Finding

Patch 436A found that generic overdue handling was not the root failure. A same-id overdue `room-ferment` step already completed and advanced to `ball-dough`.

The real risk was identity drift between:

- the displayed Kitchen step produced by timeline display normalization
- the persisted Timeline step stored in `PizzaSession.timeline.steps`

When those ids differed, Kitchen passed the displayed id into the persisted Timeline completion helper. The old helper required an exact persisted id match and returned `undefined` when none existed, leaving the user on the same fermentation screen with no clear recovery.

## 2. Exact ID Mismatch

Confirmed mismatch class:

- persisted Timeline contains `room-ferment`
- Kitchen display normalizes the active step to `cold-ferment`
- user presses `Fermentation complete`
- old completion lookup searches persisted Timeline for `cold-ferment`
- lookup fails because only `room-ferment` exists

The inverse can also occur:

- persisted Timeline contains `cold-ferment`
- Kitchen display normalizes the active step to `room-ferment`

## 3. Current And Legacy Fermentation IDs

The repository currently recognizes this fermentation family:

- `cold-ferment`
- `room-ferment`
- `ferment-dough`

The resolver also treats legacy label-based fermentation rows as family candidates when their labels identify fermentation, for example `Ferment dough` and room-temperature fermentation labels.

## 4. Persisted-Step Resolution Algorithm

Patch 436B adds `resolvePersistedKitchenStepId(...)`.

Resolution order:

1. Exact persisted step id match.
2. For fermentation only, exact normalized fermentation id match.
3. Unique incomplete persisted fermentation-family step.
4. Unique ready or overdue incomplete persisted fermentation-family step.
5. Unique family step as an idempotent stale-click fallback.
6. Typed safe failure.

The resolver does not rewrite stored Timeline ids. It maps the current displayed Kitchen step to the correct persisted Timeline row only for completion.

## 5. Ambiguity Protection

If multiple incomplete fermentation candidates remain, the helper returns:

```ts
{ ok: false, reason: "ambiguous_fermentation_step" }
```

It does not choose based only on label text or arbitrary order. This prevents one click from completing the wrong biological phase.

## 6. Typed Completion Result

`completeKitchenTimelineStep(...)` now returns:

```ts
type KitchenStepCompletionResult =
  | {
      ok: true;
      session: PizzaSession;
      completedStepId: string;
      nextStepId: string | null;
    }
  | {
      ok: false;
      reason:
        | "step_not_found"
        | "ambiguous_fermentation_step"
        | "persistence_failed";
    };
```

The old silent `undefined` path is removed from Kitchen completion.

## 7. UI Error Behavior

If completion cannot safely resolve or persist a step, Kitchen keeps the session intact and shows:

> We couldn’t complete this step. Your progress is still safe. Try again.

The retry action calls the same completion path. Internal ids and storage details are not exposed to the user.

## 8. Local And Cloud Persistence

Successful completion still uses the existing local `updatePizzaSession(...)` path and the existing Kitchen cloud queue:

```text
complete persisted step
-> update stepRuntime for the persisted id
-> update local active session
-> queueCloudActivePizzaSessionSave(updated)
```

No new cloud API, no new cloud row identity, and no schema migration were added. Patch 424B cloud authority and stale-write protections remain the authority boundary.

## 9. Backward Compatibility

The fix supports:

- current exact `room-ferment`
- current exact `cold-ferment`
- displayed `cold-ferment` with persisted `room-ferment`
- displayed `room-ferment` with persisted `cold-ferment`
- missing legacy `actualStartedAt`
- incomplete legacy `stepRuntime`
- repeated stale clicks after a successful completion

Stored planned timestamps and biological durations remain unchanged.

## 10. Test Coverage

Added or updated behavior coverage for:

- exact room fermentation completion
- exact cold fermentation completion
- overdue exact-match fermentation
- displayed-cold / persisted-room mismatch
- displayed-room / persisted-cold mismatch
- persisted id receives `actualCompletedAt`
- Ball dough becomes next
- planned timing remains unchanged
- local active session storage receives the update
- repeated stale click remains idempotent
- ambiguous legacy fermentation candidates fail safely
- Kitchen UI recoverable error copy
- cloud queue source ordering after typed result

Focused and full validation were run for this patch before merge.

## 11. Known Limitations

- The fix does not migrate or normalize persisted Timeline ids.
- The browser validation uses local active-session fixtures for legacy id mismatch states. It does not mutate production cloud rows.
- Ambiguous legacy data requires user retry/recovery rather than automatic completion.

## 12. Protected Invariants

Unchanged:

- Patch 414B effective Kitchen scheduling
- Patch 417 early-completion warning behavior
- Patch 424B cloud authority
- Patch 434B no-archive active replacement
- Patch 437 experience-level fixes
- planned fermentation durations
- Timeline generation
- target pizza time
- Recipe, Shopping, Review
- Account history
- account preferences
- Party Orders
- auth and SEO
- pizza formulas
