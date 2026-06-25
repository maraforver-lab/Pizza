# Session shopping list

Patch 34 adds the first local Pizza Session shopping list at `/session/shopping`.

The goal is intentionally practical: choose a familiar pizza preset and generate a grouped list for the active session. It is not a custom ingredient database yet.

## Preset approach

The first presets are:

- Margherita
- Marinara
- Diavola
- Funghi
- Pepperoni / Salami
- Simple cheese pizza

Each preset has a short description, best-use guidance, experience-level helper copy and grouped ingredients.

## Shopping groups

Shopping list items are grouped as:

- Dough
- Sauce
- Cheese
- Toppings
- Optional gear

The underlying session model uses the existing `Gear` group and the UI presents it as “Optional gear”.

## Item statuses

Each item can be marked as:

- Need to buy
- Already have
- Bought

Changing a status only updates the active Pizza Session in local browser storage.

## Local-first storage

Patch 34 stores the generated shopping list inside the active Pizza Session in:

`doughtools:pizza-sessions-v1`

It also keeps using:

`doughtools:active-pizza-session-id`

The shopping list is local-only for now:

- no Supabase upload
- no cloud sync
- no account sync
- no analytics or tracking
- no public route
- no public sharing

If the user clears browser site data, local Pizza Sessions and their shopping lists may be lost.

## What this patch does not implement

Patch 34 intentionally does not add:

- free-text ingredients
- a custom topping editor
- exact topping gram formulas
- a full ingredient database
- online grocery integrations
- reminders
- notifications
- public shopping-list links
- cloud-synced lists

More exact sauce, cheese and topping amounts can be handled in future Sauce Lab and Toppings Tool improvements.

## Future improvements

Future patches can build on this foundation by adding:

- optional custom items
- better topping amount suggestions
- cheese and sauce links based on the selected preset
- printable lists
- household inventory helpers
- account-backed sync, only if explicitly implemented later
