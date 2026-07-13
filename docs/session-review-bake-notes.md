# Session review and bake notes

Patch 38 adds `/session/review`.

The review step finishes the local Pizza Session flow by answering:

> How did this pizza session go, and what should I change next time?

## Route

```text
/session/review
```

The route reads the active Pizza Session from the existing browser storage keys:

```text
doughtools:pizza-sessions-v1
doughtools:active-pizza-session-id
```

If no active session exists, the page shows a safe empty state and links back to `/session/start`.

Completed and archived sessions are not treated as active sessions.

## Review fields

Patch 38 stores simple text-based review data in the existing Pizza Session model:

- `rating`
- `notes`
- `review.whatWorked`
- `review.improveNextTime`

The first version is intentionally text-only.

It does not add:

- photo upload
- image compression
- result cards
- public sharing
- social sharing
- cloud sync
- account sync

## Completion behavior

The `Complete session` action:

- saves the current review fields
- sets `status` to `completed`
- sets `currentStep` to `review`
- updates `updatedAt`
- updates `lastSavedAt`
- clears the active Pizza Session id
- preserves the session record
- preserves recipe snapshot, timeline, shopping list and existing session fields

The completed session is stored locally but no longer appears as the active Continue Session card.

## Kitchen Mode handoff

Kitchen Mode now links to `/session/review` when the current step is the Review result step or when all timeline tasks are done.

Kitchen Mode behavior is otherwise unchanged.

## Experience-level behavior

The route uses the existing experience levels:

- `beginner`
- `enthusiast`
- `pizza_nerd`

Beginner copy asks simple questions about what went well and what to change.

Enthusiast copy focuses on timing, dough feel, oven behavior, toppings and repeatability.

Pizza Nerd copy prompts for variables such as hydration, fermentation time, flour, oven heat, topping load and bake time.

There is one shared review page, not three separate review routes.

## Local-first behavior

Review notes are saved in this browser on this device.

Patch 38 does not upload review data to Supabase and does not add cross-device sync.

If the user clears browser site data, local Pizza Sessions and their review notes may be lost.

## Future improvements

Future patches can build on this foundation with:

- photo compression
- local result photos
- result cards
- bake comparison
- optional cloud sync after a separate privacy and schema review

## Safety notes

Patch 38 does not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage keys, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers, install/PWA behavior or SEO indexing permissions.
