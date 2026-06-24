# Experience Levels

DoughTools adapts how much guidance, explanation and technical detail it shows based on the user’s selected experience level.

This is not a premium feature, an account role or a separate version of the site. The same DoughTools product serves every level, and users can change the level whenever they want.

## Levels

| Internal value | User-facing label | Description |
| --- | --- | --- |
| `beginner` | Beginner | I want clear step-by-step help. |
| `intermediate` | Home Pizza Maker | I already make pizza and want better control. |
| `advanced` | Advanced | I want deeper technical guidance. |

The safe default level is:

```text
intermediate
```

This means DoughTools falls back to Home Pizza Maker when no level has been selected, localStorage is empty, localStorage contains an invalid value, or a server-rendered fallback is needed before hydration.

## Local-only preference

Patch 19 stores the selected level locally in the browser with this key:

```text
doughtools.experienceLevel
```

The preference is safe for server rendering: helper functions do not require `window` to exist and do not crash when localStorage is unavailable.

The current implementation is browser-local only. It is not synced to Supabase and does not require a user account.

## Future profile field

A later authenticated-profile version may sync this value to a user profile field such as:

```text
experience_level
```

Allowed values should be:

```text
beginner
intermediate
advanced
```

Account-based persistence is not included yet because it requires profile schema decisions, migration handling and account-data behavior that should be reviewed separately.

## What the patches implement

Patch 16 created the foundation:

- `lib/experience-levels.ts`
- localStorage helpers
- Account page selector
- local badge/accent treatment
- helper functions for future content complexity decisions
- tests for normalization, storage behavior and helper logic

Patch 17 applied the selected level to the homepage and calculator guidance copy.

Patch 18 applied the selected level to Planner, Guide and Dough Doctor guidance copy.

Patch 19 adds a reusable visible selector and places it on:

- Homepage
- Planner
- Guide/Help
- Dough Doctor

Patch 19 also synchronizes the update history so recent production patches are visible.

Patch 20 refines the homepage onboarding around the same model:

- the hero copy explains that DoughTools adapts guidance to the selected level
- the first workflow now starts with choosing a level
- the main CTA path connects level choice, dough calculation, planning and troubleshooting

Patch 20 does not change the level values, persistence key or behavior rules.

## Copy behavior by level

- Beginner copy focuses on the next practical action and avoids unnecessary variables.
- Home Pizza Maker copy adds learning context around hydration, flour, fermentation, dough handling and saved observations.
- Advanced copy adds deeper technical notes about dough temperature, yeast or starter activity, baker’s percentages, gluten development and process assumptions.

The level affects explanation and emphasis. It does not change recipe calculations, planner timing logic, Dough Doctor diagnostic logic, saved recipes, Journal data, BakeResult storage, routes, navigation or tool availability.

## Rules for future patches

- Do not remove features by experience level.
- Do not change main navigation by experience level.
- Do not hide whole tools.
- Beginner should simplify visible detail, not remove capability.
- Home Pizza Maker should show beginner guidance plus practical learning context.
- Advanced should show all relevant technical detail.
- Users can always change the level.
