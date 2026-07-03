# Pizza Session V2 Journey

Version: 1.0  
Purpose: canonical journey map for the guided DoughTools Pizza Session flow.

Pizza Session V2 keeps one shared product logic, state model, validation model and route chain.

Core rule:

**Desktop = guided workspace.**  
**Mobile = focused app experience.**  
**Same logic, different layout.**

`/session/start` is the setup phase for journey steps 1–5. It collects the first decisions and then hands the user to `/session/recipe` for the dough plan.

## Canonical journey

| Step | Journey step | Route | Purpose | User question | Primary action | Back action | Page type |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Oven setup | `/session/start` | Choose oven setup | Choose your oven | Continue → | Back | Planning page |
| 2 | Pizza style | `/session/start` | Choose dough style | Choose your pizza style | Continue → | Back | Planning page |
| 3 | When to eat | `/session/start` | Choose target pizza time | When do you want pizza? | Continue → | Back | Planning page |
| 4 | How many | `/session/start` | Choose pizza count | How many pizzas? | Continue → | Back | Planning page |
| 5 | Flour situation | `/session/start` | Choose flour situation or W-value range | Do you already have flour? | Continue → | Back | Planning page |
| 6 | Dough plan | `/session/recipe` | Show preparation and dough amounts | What dough should I make? | Continue to Shopping → | Back | Reference page |
| 7 | Choose pizzas & shopping | `/session/shopping` | Choose toppings and check ingredients | What pizzas and ingredients do I need? | Continue to Timeline → | Back | Checklist page |
| 8 | Timeline | `/session/timeline` | Show schedule overview and critical moments | When should I do each step? | Start dough → | Back | Reference page |
| 9 | Kitchen mode | `/session/kitchen` | Guided execution | What should I do now? | Mark step as done → | Back | Execution page |
| 10 | Review | `/session/review` | Save learning and notes | How did the pizza turn out? | Save review → | Back | Review / learning page |

## Setup phase rule

The first five steps happen inside `/session/start`:

1. Oven setup
2. Pizza style
3. When to eat
4. How many
5. Flour situation

After those choices are complete, `/session/start` shows a compact transition:

- Heading: `Your setup is ready.`
- Body: `Next, we’ll build your dough plan.`
- Primary action: `Build my dough plan →`
- Destination: `/session/recipe`

This transition is not a separate route. It is the handoff into journey step 6.

## Desktop behavior

Desktop should feel like a guided workspace:

- compact DoughTools header
- compact journey/progress panel
- clear current decision card
- compact option cards
- passive saved-locally indicator
- Back bottom-left
- Continue / Build my dough plan bottom-right

Desktop may show the full journey rail because there is room for context.

## Mobile behavior

Mobile should feel like a focused app flow:

- compact header
- one progress indicator
- current question first
- short helper text
- compact tappable option cards
- primary action prominent
- Back secondary
- no sidebar
- no large footer
- no horizontal overflow

Mobile should not show a large 10-card journey rail.

## Compatibility rules

Preserve:

- existing Pizza Session storage keys
- existing autosave behavior
- existing saved session compatibility
- existing target time compatibility
- existing flour fallback behavior
- existing route chain
  - `/session/recipe` hands off to `/session/shopping`
  - `/session/shopping` hands off to `/session/timeline`
  - `/session/timeline` hands off to `/session/kitchen`

Do not change:

- dough formulas
- calculator logic
- session recipe calculation logic
- timeline calculation logic
- shopping-list calculation logic
- Kitchen Mode logic
- review save logic
- auth
- SEO / noindex behavior
- pricing or payments
