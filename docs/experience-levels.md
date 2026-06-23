# Experience Levels foundation

DoughTools will eventually adapt how much guidance, explanation and technical detail it shows based on the user’s selected experience level.

This is not a premium feature, an account role or a separate version of the site. The same DoughTools product should serve every level, and users must always be able to change the level.

## Levels

| Level | Label | Purpose |
| --- | --- | --- |
| `beginner` | Beginner | New pizza makers who want simple guidance and fewer visible decisions. |
| `enthusiast` | Enthusiast | Users who understand the basics and want more learning, control and context. |
| `pizza_nerd` | Pizza Nerd | Advanced users who want every useful variable, technical detail and optimization path. |

The default level is:

```text
beginner
```

## Local-only preference in Patch 16

Patch 16 stores the selected level locally in the browser with this key:

```text
doughtools:experience-level
```

Malformed, unknown, missing or unavailable values fall back to `beginner`.

The preference is safe for server rendering: helper functions do not require `window` to exist and do not crash when localStorage is unavailable.

## Future profile field

A later authenticated-profile version may sync this value to a user profile field:

```text
experience_level
```

Allowed values should be:

```text
beginner
enthusiast
pizza_nerd
```

Supabase sync is not included in Patch 16 because it would require profile schema decisions, migration handling and account-data behavior that should be reviewed separately.

## What Patch 16 implements

- `lib/experience-levels.ts`
- default `beginner` behavior
- localStorage helpers for `doughtools:experience-level`
- Account page selector
- local badge/accent treatment
- helper functions for future content complexity decisions
- tests for normalization, storage behavior and helper logic

## What Patch 17 applies

Patch 17 applies the selected level to the homepage and calculator guidance copy only.

- Beginner copy explains the safest next action and keeps the wording simple.
- Enthusiast copy adds learning context around hydration, flour, fermentation and repeatable improvement.
- Pizza Nerd copy adds technical notes such as baker’s percentages, starter assumptions and dough-temperature caveats.

The level affects:

- homepage hero guidance
- workflow helper copy
- calculator intro copy
- flour-helper explanation
- recipe-result explanation
- local “Save this bake” helper copy

Patch 17 does not change calculations, recipe defaults, input ranges, saved recipes, Journal data, BakeResult storage, routes or navigation.

## What Patch 18 applies

Patch 18 applies the selected level to Planner, Guide and Dough Doctor guidance copy.

- Beginner guidance focuses on the next practical action and avoids unnecessary variables.
- Enthusiast guidance adds learning context around fermentation balance, flour strength, hydration, dough handling and saved observations.
- Pizza Nerd guidance adds technical notes about dough temperature, yeast or starter activity, baker’s percentages, gluten development and process assumptions.

The level affects:

- Planner intro and timeline helper copy
- Planner timing-estimate explanation
- Guide intro, basics note, settings note and accuracy note
- Dough Doctor intro, recipe-confirmation copy, diagnosis detail notes and caveat copy

Patch 18 does not change planner timing logic, Dough Doctor diagnostic logic, calculations, saved recipes, Journal data, BakeResult storage, routes, navigation or tool availability.

Experience level remains local-only for now.

Future patches may apply the same pattern to sauce, toppings, gear, costs and methodology content.

## What Patch 16 does not implement

- no broad content hiding across the site
- no Supabase profile sync
- no database migration
- no account requirement
- no premium or payment behavior
- no route or navigation changes
- no removed pages or tools

## Rules for future patches

- Do not remove features by experience level.
- Do not change main navigation by experience level.
- Do not hide whole tools.
- Beginner should simplify visible detail, not remove capability.
- Enthusiast should show beginner guidance plus more learning context.
- Pizza Nerd should show all relevant technical detail.
- Users can always change the level.
