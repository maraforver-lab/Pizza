# Start Pizza Session wizard

Patch 32 adds the first guided Start Pizza Session wizard.

Route:

```text
/session/start
```

The wizard is a local-first planning flow for one pizza bake. It uses the Pizza Session model from Patch 31 and saves progress in the browser after each step.

## Steps

The first version intentionally keeps the flow small:

1. Pizza style
2. Target eat or bake time
3. Pizza quantity
4. Oven
5. Flour
6. Summary and next action

The goal is not to replace the calculator. The goal is to collect the first practical decisions before sending the user into recipe calculation or timeline planning.

## Autosave behavior

The wizard uses the existing Patch 31 localStorage keys:

```text
doughtools:pizza-sessions-v1
doughtools:active-pizza-session-id
```

When the wizard opens, it reads the active Pizza Session. If there is no active unfinished session, it creates a new planning session and stores that session id as active.

Each step updates:

- selected pizza style
- target time
- pizza count
- oven
- flour
- current step
- updatedAt
- lastSavedAt

Completed or archived sessions are not automatically reused as active sessions.

## Local-first limitations

Pizza Sessions are currently saved in this browser on this device.

This patch does not add:

- cloud sync
- account-connected session sync
- cross-device sync
- push notifications
- email reminders
- analytics or tracking

If the user clears browser site data, local Pizza Sessions may be lost.

## Experience-level behavior

The wizard uses the existing experience-level system:

- Beginner
- Enthusiast
- Pizza Nerd

It keeps one shared wizard and changes only the helper copy:

- Beginner copy stays calm and avoids unnecessary technical language.
- Enthusiast copy explains why each choice matters.
- Pizza Nerd copy notes assumptions and where deeper variables will be handled later.

The existing storage key remains unchanged:

```text
doughtools.experienceLevel
```

## What is intentionally not implemented yet

Patch 32 does not implement:

- full fermentation timeline generation
- shopping list generation
- kitchen mode
- review/result cards
- photo upload
- share cards
- public session pages
- cloud sync
- reminders

Future patches can build those features on top of the saved Pizza Session model.

## Launch safety

Patch 32 does not change:

- dough formulas
- yeast calculations
- saved recipe storage
- planner timing logic
- Dough Doctor diagnosis logic
- Supabase authentication
- security headers
- Google indexing/noindex behavior
- install/PWA behavior
