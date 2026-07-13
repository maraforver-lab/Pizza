# Patch 372 CTA language inventory

Date: 2026-07-13

Scope: public pages, tool pages, active Pizza Session workflow, empty/recovery states, account continuation cards, and shared homepage/tool copy.

## Canonical action groups

| Meaning | Canonical label | Representative destinations/actions | Notes |
| --- | --- | --- | --- |
| Public entry into guided planning | `Plan my next pizza` | `/session/start` | Replaces first-touch `Start Pizza Session` and `Explore Pizza Sessions`. |
| Explicit start-flow creation | `Create my pizza plan` | summary submit to `/session/recipe` | Describes creating the plan, not merely opening a session. |
| Continue active local plan | `Continue my plan` | `pizzaSessionContinueHref(session)` | Used for a known current plan. |
| Recover account plan | `Continue saved plan` | cloud restore choice | Used when the user must choose an account-backed plan. |
| Start over from recovery/conflict | `Start a new plan` | `/session/start?new=1&replace=1` | Distinct from continuing an existing plan. |
| Workflow progression | `Continue to Shopping`, `Continue to Timeline`, `Start Kitchen Mode`, `Review my pizza`, `Finish session` | `/session/shopping`, `/session/timeline`, `/session/kitchen`, `/session/review`, review submit | Labels name the next stage or completion action. |
| Tool calculation | `Calculate my dough`, `Calculate my sauce`, `Estimate my pizza cost`, `Build my topping balance`, `Diagnose my dough`, `Start the timer` | tool pages and homepage tool cards | Tool CTAs describe the actual operation. |
| Learning | topic-specific labels | `Compare pizza styles`, `Understand dough basics`, `What to check next` | Avoids vague `Explore`, `Learn more`, and `Read more` where the subject is knowable. |
| Utility | `Copy`, `Save`, `Share`, `Export`, `Reset`, `Back`, `Delete`, `Archive`, `Retry` | local controls | Kept precise and visually secondary when not the main workflow action. |

## Duplicate surfaces resolved

- Homepage workspace had both the hero primary `/session/start` CTA and a second adjacent `/session/start` card labelled `Start Pizza Session`; the duplicate card was removed.
- About linked to `/session/start` as `Explore Pizza Sessions`; it now uses the public planning CTA.
- Session start alternated between `Continue current pizza plan`, `Continue cloud plan`, and `Build my Dough Plan`; labels now distinguish create, continue local, continue saved, and start over while preserving the restored Patch 370 start form.
- Timeline used several labels for the same handoff into Kitchen Mode; the forward handoff now reads `Start Kitchen Mode`.

## Route behavior

No route destinations, calculations, persistence, authentication, APIs, or session progression logic were changed.
