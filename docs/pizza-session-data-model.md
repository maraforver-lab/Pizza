# Pizza Session data model

Patch 31 introduces the local-first Pizza Session foundation.

A Pizza Session represents one planned pizza bake from idea to final result. It is the future container for style choice, timing, quantity, oven, flour, dough recipe, timeline, shopping list, prep steps, baking, notes and review.

Patch 31 created the data model, local storage helpers and a small Continue Session foundation.

Patch 32 adds the first guided `/session/start` wizard on top of this model. The wizard creates or recovers a local active Pizza Session and autosaves the first planning choices: style, target time, quantity, oven and flour.

Patch 33 adds the first `/session/timeline` route. The route generates a local session timeline from the saved target time, stores it in the active Pizza Session and keeps the next-step indicator local to the same browser.

## Schema version

Pizza Sessions use:

```text
schemaVersion: 1
```

The model is intentionally versioned so future patches can add timeline, shopping list, kitchen mode, photo or review fields without guessing how old stored data should behave.

## Storage keys

Patch 31 uses two dedicated browser `localStorage` keys:

```text
doughtools:pizza-sessions-v1
doughtools:active-pizza-session-id
```

These keys are separate from:

- saved recipes: `doughtools-saved-recipes-v1`
- local BakeResults: `doughtools:bake-results`
- experience level: `doughtools.experienceLevel`
- Journal IndexedDB database: `doughtools-journal`

## Statuses

Allowed session statuses:

- `draft`
- `planning`
- `preparing`
- `baking`
- `reviewing`
- `completed`
- `archived`

Completed and archived sessions are stored but are not returned as the active session by default.

## Current steps

Allowed current steps:

- `style`
- `time`
- `quantity`
- `oven`
- `flour`
- `recipe`
- `timeline`
- `shopping`
- `prep`
- `bake`
- `review`

The current step is used by the Continue Session foundation to decide where the user should resume when a reliable existing route is available.

When `currentStep` is `timeline`, Continue Session resumes at `/session/timeline`.

## Autosave foundation

This patch does not add a background timer or autosave loop.

It does add helper behavior for future autosave:

- `createdAt` is preserved.
- `updatedAt` is refreshed when a session is saved or updated.
- `lastSavedAt` is refreshed when a session is saved or updated.
- `lastOpenedAt` exists in the model for future resume flows.
- active session id can be stored, read and cleared.
- malformed stored data returns safe defaults.

## Recipe context

`createSessionFromRecipeParams` can create a planning session from existing recipe query parameters. It preserves supported recipe values in:

- `recipeParams`
- `recipeSnapshot`

This does not change the recipe query format and does not change any calculator formulas.

## Session timeline

Patch 33 uses the optional `timeline` field.

The timeline can contain:

- `generatedAt`
- `targetEatTime`
- scheduling assumptions
- step cards with labels, descriptions, scheduled times, status and level-aware notes

The first generated timeline is a practical backward schedule, not a guarantee. It is designed to answer what to do next and when to start each preparation step.

Timeline step status is local-only. Marking a step done updates the active browser session and does not send anything to Supabase or any external service.

## Local-first limitations

Pizza Sessions are currently local to the browser on this device.

They are not:

- synced to an account
- uploaded to Supabase
- available across devices
- backed up in the cloud
- connected to push notifications or email reminders

If the user clears browser site data, local Pizza Sessions may be lost.

## What this patch does not implement

Patch 31 does not add:

- account-connected timeline sync
- shopping list generator
- Kitchen Mode
- review/result cards
- image upload
- cloud sync
- account-connected session persistence
- service worker or offline mode
- analytics or tracking
- Google indexing changes

## Future work

Future patches can build on this foundation:

- timeline generation and editing
- shopping list generation
- Kitchen Mode for step-by-step preparation
- review/result cards
- optional account sync after a separate schema and privacy review

