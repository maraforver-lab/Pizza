# Patch 397B: Kitchen execution panel

## Summary

Patch 397B implements the Patch 397A recommendation: Kitchen Mode is now a focused execution panel.

The implementation:

- removes the normal application `Back` action from the normal Kitchen execution state
- keeps browser Back untouched
- adds named secondary actions: `Change pizza menu` and `View full schedule`
- renames `Need more help?` to `More guidance`
- removes the desktop-only experience-mode explanation card
- adds a compact menu summary
- adds a compact locked-count pizza-menu editor before bake phase
- preserves Kitchen progress, Timeline, `stepRuntime`, session identity and cloud continuity when the menu changes
- preserves Shopping checklist status by stable ingredient identity when quantities regenerate
- explicitly queues the updated session snapshot to cloud after confirmed menu changes

No pizza-count changes, dough recalculation, Timeline recalculation, schema migration, auth, Party Order, SEO or deployment changes were introduced.

## Patch 397A decisions implemented

Patch 397A decided:

- Kitchen default content should keep only execution-essential content visible by default.
- Detailed level guidance should remain optional.
- Application Back should be replaced by named secondary actions.
- Menu editing should use Shopping's fixed-total allocation logic, but not Shopping's save helper because it changes `currentStep` to `shopping`.
- Menu editing should lock once bake phase starts.

All of those decisions were implemented.

## Previous Kitchen hierarchy

Before:

```txt
Kitchen Mode / Step / Experience
Now
Current step
Desktop mode explanation card
Timing card
Next preview
Step guidance
Do this
You are done when
Need more help?
Needed now / service reminders
Back
Primary action
```

Problems:

- `Back` was ambiguous.
- Desktop had a non-operational experience-mode explanation card.
- Pizza menu changes required leaving Kitchen.
- Menu data was not summarized in Kitchen.

## Final mobile hierarchy

```txt
Kitchen Mode / Step / Experience
Current step
Timing / live state
Next preview
Do this
You are done when
More guidance
Needed now
Pizza menu summary
Change pizza menu
View full schedule
Primary step action
```

The primary action remains sticky through the existing `BottomActionBar`.

## Final desktop hierarchy

Desktop uses the same state and route logic as mobile. It keeps the current task dominant and uses width for spacing, not extra explanatory copy.

Default desktop now removes the previous mode-explanation card. Schedule and menu edits are named secondary actions.

## Removed or changed content

- Removed normal application `Back` from the normal Kitchen state.
- Removed route-source/referrer Back helpers from Kitchen.
- Removed the desktop-only mode explanation card and `levelModeLabel`.
- Renamed `Need more help?` to `More guidance`.
- Shortened `Step X of Y` to `Step X/Y`.
- Changed `Now` eyebrow to `Current step`.
- Replaced service-mode `Pizza count:` line with a compact Pizza menu summary.

Recovery and completion states still keep explicit recovery or Review actions.

## Disclosure behavior

`More guidance` remains native `<details>/<summary>`.

Behavior:

- closed by default
- no local session write on open/close
- no cloud queue on open/close
- current-step content only
- experience-level-specific guidance preserved
- learning links remain inside disclosure
- no nested accordion

## Application Back replacement

Normal Kitchen no longer renders a generic `Back` action.

Replacement actions:

- `View full schedule` -> `/session/timeline`
- `Change pizza menu` -> local Kitchen menu editor

Browser Back remains untouched.

Patch 396 behavior was preserved: opening Timeline from Kitchen did not rebase Kitchen progress in browser validation.

## Menu editor structure

Editor model:

- modal dialog with `role="dialog"` and `aria-modal="true"`
- accessible name: `Change pizza menu`
- Escape closes without saving
- Cancel closes without saving
- focus moves into the dialog and returns to the trigger
- Tab cycles within the dialog
- count controls have accessible names such as `Increase Diavola count`
- no pizza images, dough settings, fermentation settings, oven settings, export UI or Shopping card wall

Visible editor content:

- locked total
- one row per supported pizza type
- decrement / quantity / increment controls
- selected total status
- Cancel
- Save changes

## Locked-total invariant

Canonical total:

```ts
session.pizzaCount ?? session.recipeSnapshot?.balls
```

The editor displays:

```txt
Total pizzas are locked for this session.
```

The editor uses:

- `normalizePizzaMixForCount`
- `adjustPizzaMixAllocation`

The total cannot increase or decrease. Reallocation moves count between pizza types.

## Bake-phase lock

Menu editing locks when:

- `session.currentStep === "bake"`
- current Kitchen step is `bake-pizza`
- `stepRuntime["bake-pizza"]` has started or completed
- Timeline marks `bake-pizza` done

Locked copy:

```txt
Menu is locked once baking starts.
```

No per-pizza baked tracking was added.

## Canonical helper reuse

Reused:

- `PIZZA_MIX_OPTIONS`
- `normalizePizzaMixForCount`
- `adjustPizzaMixAllocation`
- `generatePizzaSessionShoppingList`
- `queueCloudActivePizzaSessionSave`

Added:

- `savePizzaSessionMenuMix`

This helper regenerates menu-derived Shopping data without changing `currentStep` to `shopping`.

## Atomic persistence path

On `Save changes`:

1. resolve latest active local session
2. verify the same session ID
3. verify menu is not locked by bake phase
4. normalize draft allocation to the locked total
5. regenerate Shopping data
6. preserve Kitchen `currentStep`, `status`, Timeline, `stepRuntime`, experience level and session ID
7. write one updated session locally
8. explicitly queue `queueCloudActivePizzaSessionSave(updatedSession)`
9. update React state
10. close editor

Cancel and Escape write nothing and queue nothing.

## Shopping checkbox preservation

Shopping item status preservation now uses stable ingredient identity:

- exact item ID
- fallback key after the generated preset prefix, such as `sauce:tomato-sauce`

Behavior covered by tests:

- checked tomato remains checked when quantity changes
- checked mozzarella remains checked when mix changes but mozzarella remains required
- new topping appears unchecked
- removed topping disappears
- Kitchen-safe menu save preserves active Kitchen phase

## Kitchen progress preservation

Menu save preserves:

- `currentStep`
- `status`
- `timeline`
- `stepRuntime`
- experience level
- session ID
- pizza count
- recipe snapshot values

Browser validation confirmed menu and Kitchen phase survived reload, `View full schedule`, and browser Back.

## Cloud queue behavior

Confirmed menu changes call the established Kitchen mutation queue path:

```ts
queueKitchenProgressSync(updatedSession)
```

That function calls:

```ts
queueCloudActivePizzaSessionSave(updated)
```

Patch 395 and Patch 396 queue safeguards remain unchanged.

## Governance update

Updated `docs/global-responsive-ux-rules.md` with one canonical rule:

```txt
Kitchen Mode is an execution panel. It shows the current action first, keeps detailed guidance optional, and exposes schedule or menu changes only through named secondary actions.
```

## Before and after measurements

Patch 397A before measurements:

| State | 390 x 844 | 430 x 740 | 1280 x 900 | 1440 x 950 |
| --- | ---: | ---: | ---: | ---: |
| Step not started | 2.0 screens | 2.3 | 1.5 | 1.5 |
| Step active | 2.1 | 2.3 | 1.6 | 1.5 |
| Completed / next | 1.6 | 1.7 | 1.3 | 1.2 |
| Final bake | 1.8 | 2.0 | 1.5 | 1.4 |

Patch 397B after measurements:

| State | 390 x 844 | 430 x 740 | 1280 x 900 | 1440 x 950 |
| --- | ---: | ---: | ---: | ---: |
| Step not started | 2.2 screens | 2.5 | 1.7 | 1.6 |
| Step active | 2.2 | 2.5 | 1.7 | 1.6 |
| Completed / next | 1.8 | 1.9 | 1.4 | 1.3 |
| Bake locked | 2.0 | 2.2 | 1.6 | 1.5 |

The page is not shorter because Patch 397B adds the required menu summary and editor trigger. The hierarchy is clearer: normal `Back` is gone, menu/schedule jobs are named, and the desktop-only explanatory card is removed.

After validation also confirmed:

- no horizontal overflow
- no console errors
- primary action remains visible in the first viewport due to the sticky action bar
- normal Kitchen state has no generic `Back`
- `More guidance` remains available and closed by default

## Browser validation

Production build and local production server were used.

Viewports:

- `390 x 844`
- `430 x 740`
- `1280 x 900`
- `1440 x 950`

States:

- step not started
- active step
- completed/next step
- bake locked

Interactions:

- opened and closed `More guidance`
- opened menu editor
- canceled editor and verified no mix change
- reopened editor
- reallocated `4 Margherita` to `3 Margherita / 1 Diavola`
- saved changes
- reloaded Kitchen and verified summary persisted
- opened `View full schedule`
- browser Back to Kitchen
- verified menu and `currentStep: "prep"` remained
- verified bake phase disables `Change pizza menu`

Result:

- no horizontal overflow
- no console errors
- no hydration errors observed
- no redirect loop
- no clipped count controls observed

Shopping/browser note:

- Shopping page showed the updated mixed menu and Spicy salami quantity.
- The visible export panel text only exposes export controls; the offscreen render card text is not available through the panel's visible `innerText`. Source and tests confirm the export component uses the same updated `shoppingList` prop.

## Tests

Focused tests:

```txt
npm.cmd run test -- tests/pizza-session-kitchen.test.ts tests/pizza-session-shopping-list.test.ts tests/cloud-pizza-sessions.test.ts
```

Result:

```txt
3 files passed, 123 tests passed
```

Lint:

```txt
npm.cmd run lint
```

Result: passed.

Build:

```txt
npm.cmd run build
```

Result: passed.

Full suite:

```txt
npm.cmd run test
```

Result:

```txt
60 files passed, 1009 tests passed
```

Final lint:

```txt
npm.cmd run lint
```

Result: passed.

Final build:

```txt
npm.cmd run build
```

Result:

```txt
Compiled successfully; generated static pages (43/43).
```

Diff check:

```txt
git diff --check
```

Result: passed.

## Limitations

- Live signed-in Supabase cross-device testing was not available.
- Cloud behavior was validated through deterministic source/tests and queue-path coverage, not a live database row.
- The menu editor does not add per-pizza baked tracking.
- Export card visual text is not directly visible through the export panel DOM, but it uses the same `shoppingList` data.

## Protected invariants

Unchanged:

- pizza count
- dough formulas
- sauce formulas
- hydration
- yeast
- flour
- fermentation
- target times
- Timeline schedule generation
- `stepRuntime` schema
- session schema
- auth
- account semantics
- Party Orders
- SEO
- deployment configuration

No deployment was performed.
