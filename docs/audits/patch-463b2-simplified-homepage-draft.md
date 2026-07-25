# Patch 463B2: Simplified Homepage Draft

## Summary

Patch 463B2 adds a second code-based Homepage version named `simplified` while keeping the current production Homepage on the `stable` live version.

## Version Registry

- `stable`: live, `Current homepage`, existing production Homepage.
- `simplified`: draft, `Simplified homepage`, `A clearer Make versus Learn Homepage concept.`

Exactly one Homepage version remains live.

## Draft Structure

The simplified draft uses this hierarchy:

1. Hero
2. Make versus Learn
3. How DoughTools works
4. Supporting tools
5. Final `Plan a pizza` CTA
6. Existing footer

## Public Route Behavior

The public `/` route still resolves the live Homepage version through the registry and therefore continues to render `stable`.

The simplified version is available only through the protected Admin Homepage preview route when an admin session is present.

## Scope Notes

- No Pizza Plan workflow behavior changed.
- No calculations changed.
- No routes, APIs, database objects or migrations changed.
- No header, navigation or footer files changed.
- No images were added; the draft reuses the existing local Homepage hero image.
