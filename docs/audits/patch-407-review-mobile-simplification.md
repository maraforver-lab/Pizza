# Patch 407: Review mobile simplification

## Summary

Patch 407 simplifies the mobile Pizza Session Review page so the first visible job is the actual review: rate the pizza, record what worked, record what to improve, add optional notes, then optionally add photo/share context before finishing the session.

This is a presentation and ordering patch only.

## Screenshot-Based Scope

The mobile screenshot showed that Review still competed with secondary content before the user reached the feedback form:

- visible `Guidance: ...` label in the hero
- full photo/share explanation above the review fields
- full diagnosis and troubleshooting block above the review fields
- the review task starting lower than necessary

The patch keeps the same route, state and completion behavior while making the mobile hierarchy more direct.

## Mobile Elements Hidden

On mobile, the visible `Guidance: Beginner`, `Guidance: Enthusiast` or `Guidance: Pizza Nerd` text is hidden by using the compact `SessionExperienceLevelBadge` presentation in the Review hero.

The diagnosis section is hidden on mobile:

- `Did something go wrong?`
- `Diagnose your pizza`
- `Diagnose your pizza` action
- `Toppings troubleshooting`

The diagnosis links are not removed and remain visible on desktop.

## Photo/Share Reorder

The desktop photo/share explainer remains in its previous position before the review form.

On mobile, photo/share is moved after:

1. Overall result
2. What worked well?
3. What would you improve?
4. Free notes

The mobile treatment is a compact closed disclosure:

- `Add a photo and share`
- `Save and share your finished pizza after the review.`

Opening or closing the disclosure does not write review state.

## Desktop Preservation

Desktop continues to show:

- the full visible guidance label
- the full photo/share explanation
- the diagnosis section
- both troubleshooting links

The desktop Review form and completion action remain in the same route and card structure.

## Experience-Level Accessibility

`SessionStepHero` now supports a `levelCompactOnMobile` prop.

When enabled, the hero renders:

- compact color badge on mobile
- full visible guidance badge on desktop
- the shared accessible label from `SessionExperienceLevelBadge`, such as `Pizza Session guidance level: Beginner`

The level color and label still come from the shared Patch 394/398 experience-level mapping.

## Tests

Focused tests verify:

- Review uses compact mobile level presentation
- mobile diagnosis blocks are hidden with responsive classes
- desktop diagnosis and troubleshooting links remain in source
- mobile photo/share disclosure appears after the feedback fields
- Review form questions remain present
- `Finish session` remains the completion action
- save, cloud completion and routing code remain unchanged

## Browser Validation

Production browser validation covered:

- `390 x 844`
- `430 x 740`
- `1280 x 900`

Checks:

- mobile diagnosis section hidden
- desktop diagnosis section visible
- mobile photo/share appears after review fields
- compact disclosure opens
- `Finish session` remains visible and primary
- no horizontal overflow
- no console errors
- no hydration errors

## Protected Invariants

Patch 407 did not change:

- review answers or schema
- rating values
- improvement tags
- free notes
- photo moderation
- photo relevance checks
- image export
- account photo memory
- session completion
- history creation
- active-session clearing
- cloud sync
- auth
- Party Orders
- calculations
- navigation
- SEO
- deployment configuration
