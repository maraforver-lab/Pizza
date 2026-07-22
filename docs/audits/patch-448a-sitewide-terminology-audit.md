# Patch 448A: Sitewide Terminology Audit

## Executive summary

DoughTools is mostly understandable, but several user-facing concepts are named differently depending on where the user is in the product. The most confusing pattern is that user tasks are sometimes described in plain language (`Plan my new pizza`, `Start making a pizza`, `Continue making your pizza`) and sometimes in product or architecture language (`Pizza Session`, `Kitchen Mode`, `Dough Plan`, `Recipe`). The product should keep the internal architecture intact, but present one consistent English vocabulary to users.

Recommended direction:

- Use action-first labels for buttons.
- Use stage names for headings.
- Reserve product names such as `DoughTools`, `Party Orders` and `Bake timer` for real product surfaces.
- Avoid exposing `Pizza Session` as a primary user-facing action label except in Account history where it names a saved object.
- Keep `Dough Plan` distinct from the broader `pizza plan`, because it is the calculated dough stage, but stop alternating it with `Recipe` as a stage name.

## Scope inspected

Inspected user-facing wording across these routes and components:

- Homepage: `app/page.tsx`, `lib/homepage.ts`, `components/HomepageSessionActions.tsx`
- Desktop and mobile navigation: `components/GlobalToolNavigation.tsx`
- Footer: `components/SiteFooter.tsx`
- Account and sign-in: `app/account/page.tsx`, `components/account/*`
- Start Pizza Session: `app/session/start/page.tsx`
- Recipe / Dough Plan: `app/session/recipe/page.tsx`
- Shopping: `app/session/shopping/page.tsx`, `components/session/ShoppingListExportCard.tsx`, `lib/pizza-session-shopping-list.ts`
- Timeline and Kitchen: `app/session/timeline/page.tsx`, `app/session/kitchen/page.tsx`, `lib/pizza-session-timeline.ts`
- Bake Timer: `components/session/KitchenBakeTimerPanel.tsx`, `components/tools/StandaloneBakeTimerTool.tsx`, `app/tools/bake-timer/page.tsx`
- Review: `app/session/review/page.tsx`
- Guides and learning pages: `app/guide/page.tsx`, `app/guides/dough/page.tsx`, `app/sauce/page.tsx`, `app/ovens/page.tsx`, `app/styles/page.tsx`, `app/toppings/page.tsx`
- Party Orders: `components/account/PartyOrder*.tsx`, `components/party-orders/*`, `app/order/[publicToken]/**`
- Footer and public support pages: `app/about/page.tsx`, `app/updates/page.tsx`, `app/contact/page.tsx`, `app/costs/page.tsx`, `app/methodology/page.tsx`

## Current inconsistent terms

### Starting or planning a pizza

Current terms:

- `Plan my next pizza` in desktop navigation and footer: `components/GlobalToolNavigation.tsx`, `components/SiteFooter.tsx`
- `Plan my new pizza` on homepage primary CTA: `components/HomepageSessionActions.tsx`, `lib/homepage.ts`
- `Start making a pizza` in mobile menu: `components/GlobalToolNavigation.tsx`
- `Create my pizza plan` in Session Start sticky CTA: `app/session/start/page.tsx`
- `Start a new pizza`, `Set up a new pizza`, `Start a new plan`, `Start a new Pizza Session`: `components/HomepageSessionActions.tsx`, `app/session/start/page.tsx`, Account and Party Order handoff components

Problem:

The same user intent is described as planning, making, creating, starting and setting up. Beginners may not know whether these are different flows.

Recommendation:

- Primary new-flow action: `Plan a pizza`
- If an active pizza exists: `Start a new pizza plan`
- Final setup CTA: `Create my pizza plan`
- Avoid `Start making a pizza` for the planning entry point because the user is not yet cooking.

### Recipe and Dough Plan

Current terms:

- Stage label `Dough Plan` in session sidebar and Recipe page: `components/session/SessionProgressSidebar.tsx`, `app/session/recipe/page.tsx`
- Eyebrow `Pizza Session recipe`: `app/session/recipe/page.tsx`
- Homepage product card uses title `Dough Plan` and label `Recipe`: `app/page.tsx`
- Shopping copy references `from Dough Plan`: `lib/pizza-session-shopping-list.ts`

Problem:

`Recipe` and `Dough Plan` overlap. `Recipe` sounds like the whole pizza recipe, while the page is mainly calculated dough, fermentation and ingredient guidance.

Recommendation:

- Stage name: `Dough Plan`
- Supporting phrase: `dough recipe` only when referring to the actual formula
- Avoid using `Recipe` as the primary stage label.
- Keep route `/session/recipe` unchanged.

### Shopping

Current terms:

- `Shopping`, `Shopping list`, `Pizza Shopping List`, `Choose pizzas & Shopping`: session pages and export card
- `Pizza mix`, `Pizza selection`, `Menu`: Shopping and export surfaces
- `Dough ingredients`, `Sauce`, `Cheese`, `Toppings`, `Tools`: shopping groups

Problem:

`Shopping` alone is a section name, while `Shopping list` is the user object. `Pizza mix` and `Menu` both describe selected pizza types.

Recommendation:

- Stage name: `Shopping list`
- Pizza allocation control: `Pizza selection`
- Export title: `Pizza shopping list`
- Use `Tools` only for shopping equipment, and keep global `Tools` for standalone utilities by context.

### Timeline and preparation schedule

Current terms:

- `Timeline` in nav/sidebar/stage pages
- `time plan` on homepage
- `Preparation reminder` in Shopping export
- `planned`, `scheduled`, `starts`, `ready`, `overdue` in Timeline/Kitchen surfaces

Problem:

`Timeline` is concise but a bit abstract. `Preparation schedule` explains the job better, but may be longer for mobile.

Recommendation:

- Primary stage label: `Timeline`
- Explanatory copy: `preparation timeline`
- Avoid `time plan` as a product noun.

### Kitchen and cooking

Current terms:

- `Kitchen Mode` in desktop nav/sidebar, homepage, guides and historical tests
- `Kitchen` in mobile descriptions and route names
- CTAs such as `Start Kitchen Mode`, `Start cooking`, `Done baking? Review session`
- Timeline step labels: `Mix dough`, `Prepare sauce and toppings`, `Bake pizzas`, `Review result`

Problem:

`Kitchen Mode` is an internal-feeling product term. It can remain as a branded mode name in detailed context, but primary actions should say what the user does.

Recommendation:

- Stage label: `Kitchen`
- Entry CTA: `Start cooking`
- In-step CTAs: `Start making the dough`, `Oven preheated`, `Done baking? Review session`
- Use `Kitchen Mode` only in explanatory secondary copy if needed.

### Bake Timer

Current terms:

- `Bake timer` in mobile menu and standalone page
- `Bake Timer` in Admin/Account sound settings
- `Pizza Bake Timer` in older homepage secondary tools: `lib/homepage.ts`
- `Open full-screen bake timer`, `Open timer`: Kitchen and standalone timer surfaces

Problem:

Capitalization and product naming vary. `Pizza Bake Timer` is redundant beside `Bake timer`.

Recommendation:

- User-facing product/tool label: `Bake timer`
- Settings section: `Bake timer sound`
- CTA: `Open bake timer`
- Keep internal component names unchanged.

### Finish and Review

Current terms:

- `Review`, `Review result`, `Review session`
- `Improve` as homepage journey stage and sidebar phase
- `Done baking? Review session`
- Account history uses completed Pizza Sessions language

Problem:

`Review` is clear as a stage. `Improve` is a good outcome idea but less direct as navigation.

Recommendation:

- Stage label: `Review`
- Final Bake CTA: `Done baking? Review session`
- Homepage journey can use `Review` instead of `Improve` unless the section is explicitly educational.

### Guides and learning

Current terms:

- Desktop: `Learning Center`, `Dough Guide`, `Pizza Sauce`, `Ovens`, `Pizza Styles`, `Troubleshooting`
- Mobile: `Learn to make better pizza`, with labels such as `How to make pizza dough`
- Footer: `Learning Center`, `Dough Guide`, `Pizza Sauce`, `Ovens`, `Pizza Styles`, `Troubleshooting`
- Guide page eyebrow: `Pizza Learning Center`

Problem:

Mobile labels are clearer than desktop/footer labels. The footer exposes the old taxonomy and makes `Learning Center` feel like another item beside the actual guides.

Recommendation:

- Top-level nav: `Learn`
- Learning landing: `Pizza guides`
- Guide labels:
  - `Make pizza dough`
  - `Make pizza sauce`
  - `Choose your oven`
  - `Choose your pizza style`
  - `Fix pizza problems`
- Footer section title: `Learn`
- Footer landing link: `All pizza guides`

### Party Orders

Current terms:

- `Party Orders`, `Party Order`, `Create a Party Order`
- `Create a pizza party`
- `Create Pizza Session from this order`
- `Use this Party Order plan`, `Replace and create Party Order plan`

Problem:

The Party Order product name is useful, but the handoff back into planning exposes `Pizza Session` and mixes `order`, `party`, `setup` and `plan`.

Recommendation:

- Product label: `Party Orders`
- Creation CTA: `Create party order`
- Handoff CTA: `Create pizza plan from this order`
- Conflict CTA: `Use this party order plan`
- Avoid `Create Pizza Session from this order` in primary UI.

### Account and saved work

Current terms:

- `Pizza Session`, `active pizza plan`, `saved pizza sessions`, `completed sessions`, `recent bakes`
- Signed-out Account intro says `Active Pizza Sessions can now be saved...`
- Signed-in intro says `active pizza plan`, `recent bakes`, `party orders`
- Account Active card says `Continue Pizza Session`

Problem:

Account is the one place where saved object names matter, but the current copy mixes object names and user tasks.

Recommendation:

- Account section: `Your pizza plan`
- Continue CTA: `Continue pizza plan`
- History: `Completed pizzas`
- Technical object term: keep `Pizza Session` in secondary or diagnostic copy only when needed.

## User-confusing or overly technical wording

- `Pizza Session`: useful internally, but too technical for primary navigation, homepage CTAs and Party Order handoff.
- `Kitchen Mode`: branded/internal; less clear than `Kitchen` or `Start cooking`.
- `Dough Plan`: acceptable as a stage, but confusing when paired with `Recipe` on the same card.
- `Pizza Session effect`: appears in guides such as `app/ovens/page.tsx`; better as `How this affects your pizza plan`.
- `Fast standalone dough amounts without a Pizza Session`: technically accurate but beginner-hostile; better as `Calculate dough amounts without starting a full pizza plan`.
- `Create Pizza Session`: appears in About and Party Order handoff; better as `Create pizza plan`.
- Account page contains unused Finnish and Swedish copy objects while the product rule is English-only; the visible UI is English, but the dead localized copy increases maintenance risk.

## Recommended canonical English vocabulary

| Concept | Canonical user-facing term | Notes |
| --- | --- | --- |
| New guided flow | `Plan a pizza` | Primary entry point across nav, homepage and footer. |
| Saved active work | `pizza plan` | Use in Account, conflict dialogs and resume CTAs. |
| Internal object | `Pizza Session` | Keep for code, APIs and rare secondary Account/history copy. |
| Calculated dough page | `Dough Plan` | Stage name. Avoid pairing with `Recipe` as a label. |
| Formula itself | `dough recipe` | Use only for the actual dough formula. |
| Pizza allocation | `Pizza selection` | Replace `pizza mix` in visible controls where possible. |
| Shopping stage | `Shopping list` | Clear noun. |
| Timing stage | `Timeline` | Support with `preparation timeline`. |
| Cooking stage | `Kitchen` | CTA should be `Start cooking`. |
| Branded cooking mode | `Kitchen Mode` | Secondary/explanatory only. |
| Standalone timer | `Bake timer` | Sentence case for user-facing label. |
| Final stage | `Review` | CTA: `Done baking? Review session`. |
| Learning area | `Pizza guides` | Top-level nav can be `Learn`. |
| Party ordering product | `Party Orders` | Keep as product feature name. |

## Mapping from current terms to recommended terms

| Current term | Recommended term |
| --- | --- |
| `Plan my next pizza` | `Plan a pizza` |
| `Plan my new pizza` | `Plan a pizza` |
| `Start making a pizza` | `Plan a pizza` or `Start a new pizza plan` depending context |
| `Create my pizza plan` | Keep for final Session Start CTA |
| `Start a new Pizza Session` | `Start a new pizza plan` |
| `Continue Pizza Session` | `Continue pizza plan` |
| `Pizza Session effect` | `How this affects your pizza plan` |
| `Pizza Session recipe` | `Dough Plan` |
| `Recipe` as stage label | `Dough Plan` |
| `Choose pizzas & Shopping` | `Pizza selection and shopping list` |
| `Shopping` as stage | `Shopping list` |
| `Pizza mix` | `Pizza selection` |
| `Timeline` in copy paragraphs | `preparation timeline` |
| `Kitchen Mode` as CTA/stage | `Kitchen` or `Start cooking` |
| `Pizza Bake Timer` | `Bake timer` |
| `Learning Center` | `Pizza guides` or `Learn` |
| `Dough Guide` | `Make pizza dough` |
| `Pizza Sauce` | `Make pizza sauce` |
| `Ovens` | `Choose your oven` |
| `Pizza Styles` | `Choose your pizza style` |
| `Troubleshooting` | `Fix pizza problems` |
| `Create Pizza Session from this order` | `Create pizza plan from this order` |

## Clear primary navigation labels

Recommended desktop navigation:

1. `Plan a pizza`
2. `Learn`
3. `Quick calculator`
4. `About`
5. `Account`

Recommended mobile navigation:

- `MY ACCOUNT`: `Sign in` or `My account`
- `YOUR PIZZA`: `Continue pizza plan` or `Plan a pizza`
- `TOOLS`: `Bake timer`, `Quick dough calculator`
- `LEARN`: `Learn to make better pizza`
- `ABOUT`: `About DoughTools`

Keep mobile descriptions short:

- `Bake timer`: `Time one pizza without starting a pizza plan.`
- `Quick dough calculator`: `Calculate dough amounts without starting a full pizza plan.`

## Recommended Homepage and footer terminology

Homepage:

- Primary CTA: `Plan a pizza`
- Active-state CTA: `Continue pizza plan`
- Secondary active-state CTA: `Start a new pizza plan`
- Product moment labels:
  - `Dough Plan`
  - `Shopping list`
  - `Timeline`
  - `Kitchen`
  - `Review`
- Replace `More than a dough calculator` supporting copy only where it uses `Pizza Session`.

Footer:

- Product group:
  - `Plan a pizza`
  - `Bake timer`
  - `Quick calculator`
  - `Party Orders`
  - `Pizza costs`
- Learn group:
  - `All pizza guides`
  - `Make pizza dough`
  - `Make pizza sauce`
  - `Choose your oven`
  - `Choose your pizza style`
  - `Fix pizza problems`

## Terms that must remain distinct

- `pizza plan` and `Party Order`: a pizza plan is the guided cooking workflow; a Party Order is a guest-order collection tool.
- `Dough Plan` and `Shopping list`: the Dough Plan calculates dough and related ingredient amounts; the Shopping list turns the selected pizzas into buyable items.
- `Timeline` and `Kitchen`: Timeline is planning and timing; Kitchen is the live cooking surface.
- `Bake timer` and `Kitchen`: the timer is a tool; Kitchen is the step-by-step cooking mode.
- `Review` and `Completed pizzas`: Review is the current workflow stage; completed pizzas are saved history in Account.
- `sound preference` and runtime mute: Account preference chooses a default sound theme; timer mute is per-open timer behavior.

## Prioritized implementation patches

### Patch 448B: Navigation and footer terminology

Small UI copy patch. Align desktop navigation, mobile menu and footer with the canonical labels. Keep routes and structure unchanged.

Focus:

- `components/GlobalToolNavigation.tsx`
- `components/SiteFooter.tsx`
- navigation tests

### Patch 448C: Homepage CTA and product-stage terminology

Small homepage copy patch. Align homepage CTAs and product cards with `Plan a pizza`, `Dough Plan`, `Shopping list`, `Timeline`, `Kitchen`, `Review`.

Focus:

- `app/page.tsx`
- `lib/homepage.ts`
- `components/HomepageSessionActions.tsx`

### Patch 448D: Session flow stage labels

Focused session copy patch. Keep logic unchanged while aligning sidebar, Start, Recipe, Shopping, Timeline, Kitchen and Review copy.

Focus:

- `components/session/SessionProgressSidebar.tsx`
- `app/session/start/page.tsx`
- `app/session/recipe/page.tsx`
- `app/session/shopping/page.tsx`
- `app/session/timeline/page.tsx`
- `app/session/kitchen/page.tsx`
- `app/session/review/page.tsx`

### Patch 448E: Account and Party Order handoff terminology

Reduce visible `Pizza Session` in Account and Party Order handoff where a user action is clearer.

Focus:

- `app/account/page.tsx`
- `components/account/AccountActivePizzaSessionCard.tsx`
- `components/account/AccountPizzaSessionHistory.tsx`
- `components/account/PartyOrderSessionHandoff.tsx`
- `components/account/PartyOrdersList.tsx`

### Patch 448F: Learning page labels

Align learning landing, desktop menu labels and guide CTAs with the clearer mobile labels.

Focus:

- `app/guide/page.tsx`
- `app/guides/dough/page.tsx`
- `app/sauce/page.tsx`
- `app/ovens/page.tsx`
- `app/styles/page.tsx`
- `app/toppings/page.tsx`

### Patch 448G: English-only cleanup

Remove unused Finnish/Swedish Account copy constants if they are not part of a real localization system, and confirm all visible product copy remains English-only.

Focus:

- `app/account/page.tsx`
- focused Account tests

## Validation

This audit inspected every major public and signed-in route category listed in the prompt. No production UI, route, API, database, session logic or translation behavior was changed.

Required validation for this documentation-only patch:

- `git diff --check`
