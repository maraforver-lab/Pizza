# Experience Levels

DoughTools adapts how much guidance, explanation and technical detail it shows based on the user’s selected experience level.

This is not a premium feature, an account role or a separate version of the site. The same DoughTools product serves every level, and users can change the level whenever they want.

## Canonical levels

| Canonical value | User-facing label | Description |
| --- | --- | --- |
| `beginner` | Beginner | I’m new to pizza-making and want a clear path. |
| `enthusiast` | Enthusiast | I know the basics and want better control. |
| `pizza_nerd` | Pizza Nerd | I want all the variables and technical details. |

The safe default level is:

```text
beginner
```

This means DoughTools falls back to Beginner when no level has been selected, localStorage is empty, localStorage contains an invalid value, or a server-rendered fallback is needed before hydration.

## Local-only preference

The selected level is stored locally in the browser with this existing key:

```text
doughtools.experienceLevel
```

Patch 21 keeps the same storage key for compatibility and migrates older values safely:

```text
beginner -> beginner
intermediate -> enthusiast
advanced -> pizza_nerd
```

The preference is safe for server rendering: helper functions do not require `window` to exist and do not crash when localStorage is unavailable.

The current implementation is browser-local only. It is not synced to Supabase and does not require a user account.

## Future profile field

A later authenticated-profile version may sync this value to a user profile field such as:

```text
experience_level
```

Allowed future profile values should be:

```text
beginner
enthusiast
pizza_nerd
```

Account-based persistence is not included yet because it requires profile schema decisions, migration handling and account-data behavior that should be reviewed separately.

## Depth contract

### Beginner

- show essentials first
- use safe defaults
- avoid jargon overload
- give the next action clearly
- allow deeper detail to be opened later
- do not remove access to advanced tools

Beginner guidance should feel clear, calm, practical and reassuring.

### Enthusiast

- show Beginner content plus practical explanations
- explain cause and effect
- include hydration, fermentation, flour, timing and oven behavior where relevant
- help the user adjust with confidence

Enthusiast guidance should be practical, curious and cause-and-effect oriented.

### Pizza Nerd

- show all available variables and technical detail
- include assumptions, constraints and tradeoffs
- include baker’s percentages and formula notes where relevant
- avoid unnecessary simplification

Pizza Nerd guidance should be precise, technical and transparent without turning the interface into a warning state.

## Visual identity rules

Experience levels should use subtle visual differences only:

- selected card border
- selected state background
- badge marker
- small accent
- short text label

Level identity must not rely on color alone. Every selector, badge or status should include visible text such as `Beginner`, `Enthusiast` or `Pizza Nerd`.

Recommended visual language:

| Level | Accent | Marker strategy | Tone |
| --- | --- | --- | --- |
| Beginner | Green | Green status marker or sprout-like marker | Simple and approachable |
| Enthusiast | Orange | Orange heat or activity marker | Warm and practical |
| Pizza Nerd | Dark red | Technical/lab marker that does not look like an error | Precise and transparent |

Do not add a new icon package for this system. Use the shared metadata in `lib/experience-levels.ts` so future pages do not duplicate labels, accents or marker decisions.

## Patch history

Patch 16 created the original experience-level foundation.

Patch 17 applied the selected level to the homepage and calculator guidance copy.

Patch 18 applied the selected level to Planner, Guide and Dough Doctor guidance copy.

Patch 19 added a reusable visible selector and placed it on:

- Homepage
- Planner
- Guide/Help
- Dough Doctor

Patch 20 refined the homepage onboarding around the level-aware workflow.

Patch 21 aligns the system around the canonical Beginner, Enthusiast and Pizza Nerd model, including metadata, migration behavior, visual language and this depth contract.

Patch 22 adds `/start` as the main beginner-friendly entry layer. Start Here uses the same depth contract: Beginner users get a simple first path, Enthusiast users get practical why-notes, and Pizza Nerd users get deeper assumptions, constraints and tradeoffs.

## Rules for future patches

- Do not remove features by experience level.
- Do not change main navigation by experience level.
- Do not hide whole tools.
- Beginner should simplify visible detail, not remove capability.
- Enthusiast should show Beginner guidance plus practical learning context.
- Pizza Nerd should show all relevant technical detail.
- Users can always change the level.
- Future features should follow the depth contract above.
