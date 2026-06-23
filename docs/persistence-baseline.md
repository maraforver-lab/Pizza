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

## Shared recipe URLs

Shared recipe URLs are covered by tests for:

- Serialization of active recipe settings.
- Parsing of all active recipe settings.
- Missing optional `pizzaStyle`.
- Ignoring legacy language query values such as `lang` and `toppingsLang`.
- Rejecting invalid numeric ranges and invalid option values.

## Pizza journal

Pizza journal entries currently use IndexedDB through `window.indexedDB` in `lib/pizza-journal.ts`. Patch 02 adds lightweight tests for the pure entry shape and ID generation only.

Full IndexedDB regression tests are intentionally not included yet because the project does not currently include a browser-like IndexedDB test environment. Before changing journal storage behavior, add either:

- a focused fake IndexedDB dependency for unit tests, or
- a browser integration test that runs against real IndexedDB.

## Local data not covered by this patch

- Existing real user browser data.
- Photo blob storage and compression behavior.
- Supabase account/auth persistence.
- Production browser storage quota behavior.
