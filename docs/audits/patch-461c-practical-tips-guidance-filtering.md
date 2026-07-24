# Patch 461C: Practical Tips Guidance Filtering

## Previous Problem

The four Practical pizza tips article routes rendered Beginner, Enthusiast and Pizza Nerd guidance cards together. The content was visible in the page and present in the rendered DOM, so mobile pages became longer and assistive technology could encounter non-selected guidance.

Affected canonical routes:

- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`

## Shared Versus Level-Specific Model

Shared content remains in the article pages and is visible to every user:

- food-safety checks
- quick practical decisions
- comparison cards and topic summaries
- troubleshooting links
- article CTAs and footer

Level-specific content is limited to one selected guidance card:

- Beginner: direct safe action and minimal terminology
- Enthusiast: practical trade-offs and adjustment advice
- Pizza Nerd: concise technical reasoning and process variables

The common-problems quick-fix grid remains shared because the actions are useful to every level. Its heading now avoids labeling shared content as Beginner-only.

## Canonical Preference Implementation

The selected article guidance uses the existing canonical preference helper:

- storage key: `doughtools.experienceLevel`
- reader: `readExperienceLevelPreference`
- accepted values: `beginner`, `enthusiast`, `pizza_nerd`
- missing or invalid values: canonical Beginner fallback

No page-specific preference system, selector or parser was added.

## DOM-Absence Behavior

The article pages no longer render `levelGuidance.map(...)`. They pass their level guidance data to one client presentation component, which renders only the selected item after reading the canonical preference.

Non-selected guidance is not hidden with CSS and is not present in the final selected-level DOM.

## Fallback Behavior

Focused tests cover:

- Beginner selection
- Enthusiast selection
- Pizza Nerd selection
- missing preference fallback
- invalid preference fallback

Missing and invalid preference values select Beginner through the canonical utility.

## Regression Coverage

Focused Practical Tips tests now verify:

- the canonical Practical Tips route remains available
- all four article routes use the selected-level presentation component
- shared content, CTAs and footers remain outside the selected-level filter
- the old all-level `levelGuidance.map(...)` article pattern is gone
- Practical Tips filtering stays isolated from Pizza Plan and calculator behavior
