# Persistence baseline

Temporary Patch 02 regression document for DoughTools local data safety.

## Saved recipes

Saved recipes currently use browser `localStorage` with this key:

```text
doughtools-saved-recipes-v1
```

Automated tests mock `localStorage` and verify:

- Current saved recipe objects can be stored and loaded.
- Malformed JSON returns an empty list instead of throwing.
- Non-array stored data returns an empty list.
- Legacy fixtures with previous language fields still load safely.
- Recipes without optional `pizzaStyleId` still load safely.
- All yeast type fixtures still load safely.

The storage loader currently performs permissive parsing. It does not migrate or validate every nested property. Patch 02 documents this behavior without changing it.

Patch 29 improves the value copy and workflow links around saved recipes, but it does not change this storage key, saved recipe object shape, loader behavior or deletion behavior.

## Shared recipe URLs

Shared recipe URLs are covered by tests for:

- Serialization of active recipe settings.
- Parsing of all active recipe settings.
- Missing optional `pizzaStyle`.
- Ignoring legacy language query values such as `lang` and `toppingsLang`.
- Rejecting invalid numeric ranges and invalid option values.

## Local BakeResults

Patch 12 adds private local BakeResult storage with this dedicated `localStorage` key:

```text
doughtools:bake-results
```

This storage is separate from saved recipes and does not upload BakeResults to Supabase.

The loader validates stored objects with the BakeResult migration helpers. Malformed storage data returns a safe empty list, and saved BakeResults are forced to private visibility.

## Experience level preference

Patch 16 adds a local-only experience-level preference with this dedicated `localStorage` key:

```text
doughtools.experienceLevel
```

Allowed canonical values are `beginner`, `enthusiast` and `pizza_nerd`. Legacy values are normalized safely: `intermediate` becomes `enthusiast`, and `advanced` becomes `pizza_nerd`. Missing, malformed or unknown values fall back to `beginner` / Beginner.

This preference is browser-local for now. It is not synced to Supabase, does not require login, does not change calculations, and does not alter saved recipe or BakeResult storage. A future account-based profile could move this setting into a user profile after separate schema and privacy review.

## Pizza Sessions

Patch 31 adds a local-first Pizza Session foundation with these dedicated `localStorage` keys:

```text
doughtools:pizza-sessions-v1
doughtools:active-pizza-session-id
```

Pizza Sessions are separate from saved recipes and local BakeResults. They are browser-local for now, are not uploaded to Supabase, and do not change the saved recipe storage key.

Malformed Pizza Session storage returns safe defaults instead of crashing the app. Completed or archived sessions are not treated as the active session by the active-session helper.

## Local data not covered by this patch

- Existing real user browser data.
- Photo blob storage and compression behavior.
- Supabase account/auth persistence.
- Production browser storage quota behavior.
