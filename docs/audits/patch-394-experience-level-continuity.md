# Patch 394: Experience-level continuity

## Summary

Patch 393 found a display-only continuity gap: the persisted `PizzaSession.experienceLevel` stayed stable, but active Pizza Session pages did not consistently show a visible level label. The mismatch began at `/session/recipe`, where the active session value was correct but the page relied on a subtle corner accent instead of visible text.

Patch 394 keeps the existing canonical data contract and adds one shared visible Pizza Session guidance badge.

No formulas, calculations, session schema, database schema, cloud persistence, authentication, Party Orders, SEO, navigation or Kitchen progress behavior changed.

## Patch 393 finding

Canonical field:

```text
PizzaSession.experienceLevel
```

Canonical values:

```text
beginner
enthusiast
pizza_nerd
```

Canonical display labels:

```text
beginner -> Beginner
enthusiast -> Enthusiast
pizza_nerd -> Pizza Nerd
```

Patch 393 classified the issue as a confirmed display-level continuity gap, not a persisted-data bug.

## Previous source-precedence problem

Source inspection showed that downstream active-session routes already used `session.experienceLevel`. The problem was visual precedence:

- `/session/start` had the current level in state but no compact visible session badge.
- `SessionStepHero` accepted `level` but only applied the shared corner accent.
- Recipe, Shopping, Timeline and Review passed `level={session.experienceLevel}` but `hideMeta` suppressed all visible hero metadata.
- Kitchen rendered level-specific guidance and a desktop-only mode card, but no always-visible mobile badge.
- This made Kitchen look more explicit than earlier steps, which could make the selected level appear to change or disappear.

## Exact mismatch beginning at Recipe

`/session/recipe` was the first post-creation route where the user could no longer see a clear `Beginner`, `Enthusiast` or `Pizza Nerd` label.

The route already used:

```tsx
level={session.experienceLevel}
```

and Pizza Nerd controls were already gated by:

```tsx
session.experienceLevel === "pizza_nerd"
```

The fix therefore did not change Recipe data flow. It made the existing session value visible through the shared hero.

## Canonical normalization helper

Patch 394 kept the existing shared helper module:

```text
lib/experience-levels.ts
```

The shared route badge uses:

```tsx
getExperienceLevelConfig(level)
```

This keeps one mapping for:

- canonical value
- display label
- badge classes
- marker class
- legacy fallback through `normalizeExperienceLevel`

No route-specific label mapping was added.

## Final source-precedence contract

| Context | Primary source | Allowed fallback |
| --- | --- | --- |
| New session draft | Explicit draft selection | Global preference, then `beginner` |
| Existing active session | `PizzaSession.experienceLevel` | Shared legacy-session fallback |
| Cloud-restored active session | Restored `PizzaSession.experienceLevel` | Shared legacy fallback |
| Recipe | Active session | Shared legacy fallback |
| Shopping | Active session | Shared legacy fallback |
| Timeline | Active session | Shared legacy fallback |
| Kitchen | Active session | Shared legacy fallback |
| Review | Active or completed session | Shared legacy fallback |
| Quick Calculator | Quick Calculator/global preference | Existing utility contract |
| Account preference UI | Browser-local global preference | Existing account default |

No active-session route prefers the global preference over the active session value.

## Route-by-route changes

| Route | Change |
| --- | --- |
| `/session/start` | Adds the shared session guidance badge beside the current setup question. Existing active sessions still set the badge from the active session value. New drafts still initialize from the global preference. |
| `/session/recipe` | Receives the shared badge through `SessionStepHero`. Existing Recipe controls and guidance continue reading `session.experienceLevel`. |
| `/session/shopping` | Receives the shared badge through `SessionStepHero`. Patch 378 checklist-first hierarchy is unchanged. |
| `/session/timeline` | Receives the shared badge through `SessionStepHero`. Patch 380 action-first hierarchy is unchanged. |
| `/session/kitchen` | Adds the shared badge to the always-visible Kitchen task header while preserving the existing level-specific guidance and desktop card. Kitchen progress, `timeline` and `stepRuntime` are unchanged. |
| `/session/review` | Receives the shared badge through `SessionStepHero` when the route is reviewable. Completion payload behavior is unchanged. |
| Account history/detail | No new displayed level field was added. Existing completed-session storage already preserves the session object; this patch does not expand history UI. |

## Visual indicator mapping

New shared component:

```text
components/session/SessionExperienceLevelBadge.tsx
```

It renders:

- text label: `Guidance: Beginner`, `Guidance: Enthusiast` or `Guidance: Pizza Nerd`
- `aria-label`: `Pizza Session guidance level: {label}`
- `data-session-experience-level`: canonical id
- color dot from `markerClassName`
- badge classes from `badgeClassName`

It does not render the emoji `marker` as the primary functional indicator. Level identity is visible as text and is not color-only.

## Global preference versus active-session rule

`docs/experience-levels.md` now records the governance rule:

> An active Pizza Session owns its experience level through `PizzaSession.experienceLevel`.

The global `doughtools.experienceLevel` preference may initialize a future session draft, but it must not override the current active session once that session exists.

## Legacy-session fallback

Missing, invalid or legacy values continue through the existing shared fallback:

```text
missing/invalid -> beginner
intermediate -> enthusiast
advanced -> pizza_nerd
```

This fallback is applied by `normalizeExperienceLevel` and `getExperienceLevelConfig`. Rendering a page does not silently mutate a legacy session.

## Tests

Focused tests:

```text
npm.cmd run test -- tests/experience-levels.test.ts tests/session-desktop-components.test.ts tests/start-pizza-session-wizard.test.ts tests/session-recipe.test.ts tests/pizza-session-shopping-list.test.ts tests/pizza-session-timeline.test.ts tests/pizza-session-kitchen.test.ts tests/pizza-session-review.test.ts tests/cloud-pizza-sessions.test.ts tests/account-responsive-workspace.test.ts tests/quick-calculator.test.ts tests/homepage.test.ts
```

Result:

```text
12 files passed
383 tests passed
```

Full suite:

```text
npm.cmd run test
```

Result:

```text
60 files passed
998 tests passed
```

Lint:

```text
npm.cmd run lint
```

Result:

```text
Passed
```

Build:

```text
npm.cmd run build
```

Result:

```text
Passed
Next.js generated 43 static pages
```

## Browser validation

Validation used a production build with `next start` on `127.0.0.1:3000`.

Viewports:

- 390 x 844
- 430 x 740
- 1280 x 900
- 1440 x 950

Levels:

- Beginner
- Enthusiast
- Pizza Nerd

For each level and viewport, browser automation:

1. selected the level through the homepage UI
2. created a Pizza Session through `/session/start`
3. validated the visible badge and stored session value on:
   - `/session/recipe`
   - `/session/shopping`
   - `/session/timeline`
   - `/session/kitchen`
   - `/session/review`
4. reloaded each route
5. used browser back and forward navigation
6. checked for horizontal overflow
7. checked for console and page errors

Review validation used the same UI-created active session and materialized only `currentStep: "review"` / `status: "reviewing"` in local storage to reach the reviewable state. No application code, schema or persistence behavior was changed.

Browser result:

```text
390x844 Beginner: ok
390x844 Enthusiast: ok
390x844 Pizza Nerd: ok
430x740 Beginner: ok
430x740 Enthusiast: ok
430x740 Pizza Nerd: ok
1280x900 Beginner: ok
1280x900 Enthusiast: ok
1280x900 Pizza Nerd: ok
1440x950 Beginner: ok
1440x950 Enthusiast: ok
1440x950 Pizza Nerd: ok
```

## Preference-conflict validation

Scenario:

1. Create an active Pizza Nerd session.
2. Return to the homepage.
3. Change the global preference to Beginner.
4. Open `/session/recipe`.

Result:

- visible badge remained `Guidance: Pizza Nerd`
- stored active session value remained `pizza_nerd`

This confirms that the global preference initializes future sessions but does not override the existing active session.

## Cloud validation status

Automated cloud fixture coverage passed through `tests/cloud-pizza-sessions.test.ts`.

Verified by tests/source:

- cloud restore preserves `experienceLevel`
- restored sessions use the shared migration path
- active session routes read the restored session object

Live signed-in cross-device validation was not performed in this patch. Patch 393 already classified Kitchen cloud behavior as a separate Patch 395 concern.

## Final confirmation

Patch 394 preserves visible experience-level continuity across the active Pizza Session without redesigning the level system.

Confirmed unchanged:

- dough calculations
- recipe calculations
- sauce calculations
- shopping quantities
- Timeline schedule calculation
- Kitchen progress
- `stepRuntime`
- cloud sync behavior
- local persistence schema
- database schema
- authentication
- account behavior
- Party Orders
- SEO
- navigation
- deployment state
