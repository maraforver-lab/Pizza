# Session Timeline

Patch 33 adds the first local Pizza Session timeline at `/session/timeline`.

The route turns the session target time into a practical backward-planned schedule. It is meant to answer one question clearly:

> What should the user do next?

## What the timeline uses

The timeline reads the active local Pizza Session from:

- `doughtools:pizza-sessions-v1`
- `doughtools:active-pizza-session-id`

It uses the session fields that already exist:

- `targetEatTime` or `targetBakeTime`
- `pizzaStyle`
- `pizzaCount`
- `ovenType`
- `flour`
- `experienceLevel`
- optional recipe parameters

The timeline is saved back into the same local Pizza Session under the `timeline` field.

## Generated steps

The first version generates these practical steps:

1. Mix dough
2. Rest dough
3. Cold ferment
4. Ball dough
5. Room temperature rest
6. Preheat oven
7. Prepare sauce and toppings
8. Bake pizza
9. Review result

Each step can include:

- `id`
- `label`
- `description`
- `scheduledAt`
- `status`
- helper copy
- Beginner note
- Enthusiast note
- Pizza Nerd note

## Backward scheduling assumptions

If `targetEatTime` exists, DoughTools works backward from that time using conservative default offsets.

The schedule is intentionally practical rather than scientifically exact. Real timing can shift because of:

- dough temperature
- room temperature
- fridge temperature
- flour strength
- yeast activity
- dough-ball size
- oven preheat and recovery

The current assumptions are returned by the timeline helper and shown on the route.

## Missing target time behavior

If the active session has no `targetEatTime` or `targetBakeTime`, `/session/timeline` shows a safe missing-time state and links back to `/session/start`.

It does not crash, create fake times or guess a bake time.

## Local storage behavior

The timeline is local-first and saved locally.

It is saved in the browser on this device as part of the active Pizza Session. It is not uploaded to Supabase and it is not synced across devices.

If the user clears browser site data, the local session timeline can be lost.

## Mark done behavior

Patch 33 includes a small local “Mark done” action.

Marking a step done:

- updates only the local Pizza Session
- preserves the session id
- preserves the target time and session choices
- keeps `currentStep` as `timeline`
- moves the next-step indicator to the next todo step

It does not notify the user, send data to a server or update any external calendar.

## Copy/export behavior

Patch 33 includes a plain-text copy action for the schedule where the browser Clipboard API is available.

It does not add:

- public sharing
- social sharing
- calendar sync
- `.ics` download
- push notifications
- email reminders

## Experience-level behavior

The same route adapts helper copy using the existing experience level system.

- Beginner: simple “do this next” language.
- Enthusiast: short practical why-it-matters notes.
- Pizza Nerd: assumptions, constraints and tradeoffs.

The canonical values stay unchanged:

- `beginner`
- `enthusiast`
- `pizza_nerd`

The storage key stays unchanged:

- `doughtools.experienceLevel`

## Intentionally not implemented

Patch 33 does not implement:

- push notifications
- email reminders
- full calendar sync
- Kitchen Mode
- shopping list generation
- cloud sync
- cross-device sync
- account session sync
- analytics or tracking
- Google indexing changes

Those require separate product and safety decisions.
