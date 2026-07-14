# Patch 398: Kitchen mobile density polish

## Summary

Patch 398 compresses the normal Kitchen Mode execution view after Patch 397B.

The patch is presentation-only:

- keeps the active session experience-level color visible
- removes the visible `Guidance: ...` label from compact Kitchen chrome
- adds an accessible compact progress bar
- compresses timing into one primary timing state plus one secondary line
- merges instruction and completion cue into one task block
- omits duplicate completion cue for Mix dough
- changes dough ingredient quantities to practical Kitchen display precision
- changes dough ingredients from per-card tiles to a compact semantic list
- moves pizza menu summary into the secondary action area
- keeps `Change pizza menu`, `View full schedule`, `More guidance`, bake lock and cloud queue behavior intact

No calculations, session schema, persistence contract, cloud queue, auth, Party Orders, SEO, navigation or route behavior changed.

## Screenshot observations

The reviewed Kitchen screenshot showed too much visible scaffolding for a mobile execution surface:

- separate `Kitchen Mode` and `Step 1/9` pills
- visible `Guidance: Beginner` text
- large timing card with several timing concepts
- separate `Do this` and `You are done when` blocks
- standalone pizza-menu summary card
- secondary actions taking too much vertical attention

Patch 398 compresses these into one current-task flow.

## Previous Kitchen hierarchy

```txt
Kitchen Mode pill
Step X/Y pill
Guidance: Beginner badge
Current step
Large planned-time card
Next action row inside timing card
Step guidance heading
Do this card
You are done when card
More guidance
Needed now
Standalone Pizza menu card
Change pizza menu
View full schedule
Sticky primary action
```

## Final Kitchen hierarchy

```txt
level color indicator                  X / Y
thin Kitchen progress bar
Current step
Task title
Primary timing state
Secondary timing line
Next: compact next step
Task instruction
Ready when: cue only when useful
More guidance
Needed now
Compact pizza menu summary + Change pizza menu
View full schedule
Sticky primary action
```

## Experience-level color continuity

`SessionExperienceLevelBadge` now supports a `compact` presentation.

Default behavior remains unchanged for the rest of Pizza Session: the full visible label remains available through the existing component and shared mapping.

Kitchen uses:

```tsx
<SessionExperienceLevelBadge level={session.experienceLevel} compact />
```

The compact Kitchen badge still derives from:

```ts
getExperienceLevelConfig(level)
```

Canonical values remain:

- `beginner`
- `enthusiast`
- `pizza_nerd`

## Accessible level implementation

In compact mode:

- the visible color marker remains
- `data-session-experience-level` remains
- `aria-label="Pizza Session guidance level: ..."` remains
- `Guidance: ...` text is retained as `sr-only`

This removes visible label weight without relying on color alone.

## Progress-bar implementation

Kitchen now renders a semantic progressbar:

```tsx
role="progressbar"
aria-label={`Kitchen progress: ${progressLabel}`}
aria-valuemin={1}
aria-valuemax={kitchenState.totalCount}
aria-valuenow={kitchenState.currentIndex + 1}
```

Progress comes from canonical Kitchen state:

```ts
kitchenState.currentIndex
kitchenState.totalCount
```

The progress bar uses neutral ink coloring, not the experience-level color.

## Task and completion merge logic

The large `Do this` and `You are done when` cards were replaced with one compact task block:

```txt
Instruction
Ready when: completion cue
```

`Ready when` is omitted when it materially repeats the instruction. The current structured rule omits it for `mix-dough`, where the main instruction already tells the user to mix until no dry flour remains and cover the dough.

Safety and operational completion cues remain visible for steps such as rest, bake and oven-related work.

## Timing hierarchy

Kitchen now shows one primary timing state:

- not started: `Ready now`, `Starts in ...` or overdue
- active: `Active for ...`
- overdue: `2 min overdue`
- waiting: countdown
- bake locked: active duration

Secondary timing is short:

- `Planned 02:15`
- `Started 02:06`

The next step is one row:

```txt
Next: Rest dough at 02:45 · Starts in 28 min
```

## Practical quantity formatting

Kitchen ingredient display now rounds gram quantities for execution:

- whole grams for normal quantities
- two decimals retained for sub-gram quantities such as yeast

Example validated:

```txt
Flour       642 g
Water       411 g
Salt         18 g
Dry yeast  0.08 g
```

This is display-only. Recipe snapshot values remain unchanged.

## Ingredient layout

Mix dough no longer renders one card per ingredient. It uses a semantic compact `dl` list with aligned labels and quantities.

## Menu-summary behavior

The standalone Pizza menu card was removed from the main page flow.

The summary now lives with the secondary actions:

```txt
4 pizzas: 4 Margherita
Locked total.
Change pizza menu
View full schedule
```

The editor behavior, locked total, bake lock and cloud queue are unchanged.

## Removed visual containers

Removed from normal Kitchen execution:

- `Kitchen Mode` pill
- large `Step X/Y` pill
- visible `Guidance: ...` badge text
- current-step icon block
- large timing card
- large `Step guidance` header area
- separate `Do this` card
- separate `You are done when` card
- standalone Pizza menu card

## Before and after mobile measurements

Patch 397B measurements from `docs/audits/patch-397b-kitchen-execution-panel.md`:

| State | 390 x 844 | 430 x 740 |
| --- | ---: | ---: |
| Step not started | 2.2 screens | 2.5 |
| Step active | 2.2 | 2.5 |
| Completed / next | 1.8 | 1.9 |
| Bake locked | 2.0 | 2.2 |

Patch 398 measurements:

| State | 390 x 844 | 430 x 740 |
| --- | ---: | ---: |
| Step not started | 1.5 screens | 1.7 |
| Step active | 1.5 | 1.7 |
| Overdue | 1.5 | 1.7 |
| Waiting | 1.3 | 1.5 |
| Completed / next | 1.3 | 1.5 |
| Bake locked | 1.4 | 1.5 |

## Before and after desktop measurements

Patch 397B measurements:

| State | 1280 x 900 | 1440 x 950 |
| --- | ---: | ---: |
| Step not started | 1.7 screens | 1.6 |
| Step active | 1.7 | 1.6 |
| Completed / next | 1.4 | 1.3 |
| Bake locked | 1.6 | 1.5 |

Patch 398 measurements:

| State | 1280 x 900 | 1440 x 950 |
| --- | ---: | ---: |
| Step not started | 1.1 screens | 1.1 |
| Step active | 1.1 | 1.1 |
| Overdue | 1.1 | 1.1 |
| Waiting | 1.1 | 1.1 |
| Completed / next | 1.1 | 1.1 |
| Bake locked | 1.1 | 1.1 |

## Accessibility verification

Verified by source, tests and browser validation:

- compact experience-level indicator has an accessible label
- progressbar has min, max, current value and accessible step text
- progress color is neutral and distinct from experience-level color
- task instruction remains in the main content flow
- completion cue uses visible `Ready when:` text when rendered
- ingredient quantities use paired `dt`/`dd`
- `More guidance` remains native `details` / `summary`
- menu dialog accessibility from Patch 397B remains unchanged
- no generic application Back was reintroduced

## Tests

Focused tests:

```txt
npm.cmd run test -- tests/pizza-session-kitchen.test.ts tests/experience-levels.test.ts tests/session-desktop-components.test.ts tests/pizza-session-shopping-list.test.ts tests/cloud-pizza-sessions.test.ts tests/session-flow-navigation.test.ts
```

Result:

```txt
6 files passed, 154 tests passed
```

Full suite:

```txt
npm.cmd run test
```

Result:

```txt
60 files passed, 1009 tests passed
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

Result:

```txt
Compiled successfully; generated static pages (43/43).
```

Diff check:

```txt
git diff --check
```

Result: passed.

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
- overdue step
- waiting step
- completed / next step
- bake locked

Experience levels:

- Beginner
- Enthusiast
- Pizza Nerd

Validated:

- no horizontal overflow
- no console errors
- visible compact level color remains
- accessible guidance-level label remains
- visible `Guidance: ...` text is absent from compact Kitchen chrome
- semantic progressbar is present
- `More guidance` opens and closes
- menu editor opens and cancels without changing state
- menu save changes `4 Margherita` to `3 Margherita / 1 Diavola`
- reload preserves menu summary
- `View full schedule` reaches `/session/timeline`
- browser Back returns to Kitchen with menu and step state preserved
- bake phase disables `Change pizza menu`
- primary action remains visible

Cross-session-page color continuity is covered by source and regression tests for the shared `SessionExperienceLevelBadge` and `SessionStepHero` usage. The browser fixture used for seeded Kitchen state was intentionally minimal and did not produce reliable badge render coverage for every downstream page, so this report does not claim live browser proof for every page.

## Limitations

- Live signed-in cloud testing was not repeated; this patch did not alter cloud persistence.
- In-app browser read-only evaluation does not expose `localStorage`, so seeded browser validation used bundled Playwright against the local production server.
- Browser validation used deterministic local active-session fixtures, not production user data.

## Protected invariants

Unchanged:

- pizza count
- pizza mix allocation behavior
- menu editor modal behavior
- bake-phase menu lock
- Shopping status preservation
- dough calculations
- sauce calculations
- recipe snapshot source values
- Timeline generation
- Timeline statuses
- Kitchen current step
- completed steps
- `stepRuntime`
- cloud queue
- Patch 395 mutation queueing
- Patch 396 stale-state protection
- session schema
- database schema
- active-session storage keys
- experience-level canonical field
- authentication
- account behavior
- Party Orders
- SEO
- navigation
- deployment configuration

No deployment was performed.
