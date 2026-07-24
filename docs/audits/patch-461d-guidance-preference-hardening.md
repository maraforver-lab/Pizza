# Patch 461D: Guidance Preference Hardening

## Canonical Preference

- Storage key: `doughtools.experienceLevel`
- Accepted stored values: `beginner`, `enthusiast`, `pizza_nerd`
- User-facing labels: `Beginner`, `Enthusiast`, `Pizza Nerd`
- Canonical fallback: `beginner`

The canonical implementation remains `lib/experience-levels.ts`. Missing values, invalid values and legacy values are normalized through the same helper path. Reading the preference now returns a normalized value without writing back to storage, so rendering a page cannot mutate local preference state.

## Storage Failure Behavior

Browser storage access is now guarded. If `window.localStorage` access, `getItem`, `setItem` or `removeItem` throws, the app falls back to `beginner` for reads and keeps the selected in-memory UI state for writes. Clearing local preference data remains best-effort and does not block account cleanup flows.

## Duplicate Implementations Removed

The remaining hard-coded `useState<ExperienceLevel>("beginner")` initializers identified in the 461 audits were replaced with `getDefaultExperienceLevel()` in the level-sensitive client surfaces that already use the canonical preference reader:

- `/session/start`
- homepage calculator workspace
- Dough guide client
- Quick Dough Calculator
- Toppings guide calculator

No page-specific storage parser or alternate normalization system was introduced.

## Routes Corrected

- `/session/start`
- `/`
- `/guides/dough`
- `/calculator/quick`
- `/toppings`

These changes only centralize fallback behavior. They do not change Pizza Plan formulas, calculator formulas, defaults, saved values, routes, page hierarchy or guide content.

## Protected Routes Left Unchanged

The implementation did not add guidance-level personalization to protected or inappropriate route groups from the 461A4 plan, including account security, privacy and deletion flows, authentication, legal pages, admin permissions, Party Orders, public guest links, Bake Timer mechanics or Kitchen behavior.

## Regression Coverage Added

Focused tests now cover:

- valid, missing, invalid and legacy preference normalization
- storage-unavailable fallback
- invalid stored text never becoming a visible level label
- preference reads not mutating stored values
- corrected level-sensitive surfaces using the canonical default helper
- Practical Tips invalid preference fallback without storage mutation

Existing 461B Pizza Plan equivalence tests and 461C Practical Tips selected-level tests remain the regression boundary for unchanged workflow and article filtering behavior.
