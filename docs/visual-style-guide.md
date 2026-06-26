# DoughTools Visual Style Guide

Version: 1.1  
Purpose: Global visual design rules for all current and future DoughTools pages.  
Use together with: `docs/global-responsive-ux-rules.md`

This guide defines how DoughTools should look and feel across the product. It is based on the current DoughTools direction and the visual reference images reviewed during the UX work.

---

## 1. Core visual principle

DoughTools should feel:

- calm
- warm
- practical
- expert
- beginner-friendly
- kitchen-usable
- focused on the next useful action

DoughTools should not feel:

- like a generic SaaS dashboard
- like a technical calculator first
- like a cluttered tool menu
- like a playful pizza game
- like every page has a different visual system
- like a page full of equal-weight buttons

Short rule:

**Calm expert guidance, not noisy control panels.**

---

## 2. Relationship to responsive UX rules

Use this guide together with:

`docs/global-responsive-ux-rules.md`

Shared product rule:

**Desktop = guided workspace.**  
**Mobile = focused app experience.**  
**Same logic, different layout.**

The responsive rules define how pages behave.  
This visual style guide defines how pages look.

---

## 3. Default vs exception rule

This guide defines the default visual system.

It is not a prison.

Marcin may explicitly decide to change a button style, layout pattern, color treatment, card style or navigation placement.

When that happens:

1. The exception must be intentional.
2. The prompt should state that this is an approved exception.
3. The reason should be clear.
4. The change should not silently create a new visual system.
5. If the exception becomes a reusable pattern, update this style guide.

Example approved exception instruction:

> This is an intentional exception to the current button pattern. Use a stronger sticky mobile CTA on this page because it is an active kitchen execution screen.

If no explicit exception is given, Codex should follow this guide.

---

## 4. Visual direction from reference images

The reviewed references point to one coherent DoughTools direction:

### Website / desktop feel

- large calm hero sections
- warm cream background
- strong editorial headline
- real pizza image or warm pizza illustration used as a hero anchor
- clear primary CTA
- secondary CTA visually quieter
- guidance-level cards
- active-session card
- step-by-step journey preview
- trust/privacy cards
- footer visible and calm

### Mobile feel

- app-like screens
- compact header
- no large desktop sidebar
- strong current step or next action
- simple progress
- large tappable CTA
- compact option cards
- little or no footer in focused task flows
- short copy
- numbers and timings easy to read
- no repeated summaries

### Session pages

- one main job per page
- clear page title
- one primary next action
- Back secondary
- no utility button menus
- summary only when it helps orientation
- do not repeat the same summary in multiple places
- Kitchen Mode and similar pages should feel especially focused

---

## 5. Brand feel

DoughTools is a practical pizza-making workspace.

The visual mood:

- warm cream backgrounds
- soft white cards
- rounded corners
- warm orange action color
- subtle green for success/ready states
- amber/orange for important timing or warnings
- dark warm text
- muted warm gray secondary text
- calm spacing
- no harsh neon colors
- no overly playful illustrations

The interface should feel like a helpful pizza coach, not a spreadsheet and not a gimmick.

---

## 6. Color direction

Use the existing project color scale where possible.

If tokens already exist in Tailwind/config/CSS, prefer those.  
Do not invent new color families unless explicitly approved.

Recommended color roles:

### Background

Use warm neutral backgrounds:

- warm cream
- soft beige
- off-white

Purpose:

- reduce harshness
- feel kitchen-friendly
- support warm food context

### Cards

Use:

- white
- warm white
- very light cream

Cards should feel calm and readable.

### Primary action

Use warm orange for primary CTAs.

Primary action examples:

- Start Pizza Session →
- Continue →
- Build my dough plan →
- Continue to Timeline →
- Open shopping list →
- Start dough work →
- Next step →
- Mark step as done →
- Save review →

Primary action should stand out clearly, especially on mobile.

### Secondary action

Use white/neutral cards or outline buttons.

Secondary actions should not compete with the primary action.

Examples:

- Back
- Open calculator
- View details
- Advanced details

### Dark action

A dark high-contrast button can be used sparingly for “resume” or active-session continuation, for example:

- Continue session →

Do not use dark buttons randomly. They should signal strong continuation or active-state emphasis.

### Success / done / ready

Use soft green.

Examples:

- selected Beginner guidance mode
- saved locally
- done states
- completion
- ready states
- active-session confirmation

Do not overuse green for primary CTAs unless explicitly approved.

### Important timing / warning

Use warm amber/orange.

Examples:

- Take dough out
- Preheat oven
- Don’t miss this
- important timing moments

Warnings should feel helpful, not alarming.

### Text

Use:

- dark brown / charcoal for primary text
- warm gray for secondary text
- muted text for metadata

Avoid pure black if a softer dark tone is already available.

---

## 7. Typography

Typography should be clear, short and confident.

Headings:

- short
- action-oriented
- editorial but practical
- no jargon for Level 1 users

Good:

- Plan and bake better pizza without guessing.
- Your dough plan is ready.
- When do you want pizza?
- Next up
- Before you start
- Your pizza timeline

Avoid:

- Technical planner configuration
- Advanced fermentation computation
- Complete calculation overview

Helper copy:

- desktop can be slightly longer
- mobile must be short
- one or two lines preferred on mobile

Level 1 language should avoid technical terms unless necessary.

Use plain terms first:

- pizza style instead of preset where possible
- when instead of target datetime
- how many instead of quantity configuration
- flour instead of flour profile

---

## 8. Layout rhythm

### Desktop

Desktop can use a guided workspace layout:

- top navigation
- large hero area
- 2-column or wide cards
- optional context panels
- footer
- more explanatory text
- calm whitespace

Desktop should still avoid:

- repeated summary sections
- equal-weight action menus
- cluttered utility links
- unnecessary dashboards

### Mobile

Mobile should feel like a focused app:

- compact top bar
- current step or next action first
- short copy
- large tappable CTA
- Back secondary
- no large footer in focused flows
- no desktop sidebar
- no repeated summaries
- no horizontal overflow

---

## 9. Page section hierarchy

Use a consistent hierarchy:

1. Page title / purpose
2. Current key information or next action
3. Supporting content
4. Primary action
5. Secondary/back action
6. Optional advanced or supporting links

Do not lead with metadata, duplicated summaries or utility links.

---

## 10. Homepage visual rules

Homepage should communicate the promise quickly.

Recommended structure:

1. Clear promise
2. Primary action
3. Trust/local-save reassurance
4. Guidance level selector
5. Active session, only if one exists
6. Why DoughTools helps
7. Secondary tools
8. Footer on desktop

Hero:

- large headline
- warm pizza image or illustration
- primary CTA: Start Pizza Session →
- secondary CTA: Open calculator
- local/private reassurance

Desktop:

- may show the large hero and more supporting content
- can show secondary tools and footer

Mobile:

- should show the promise, primary CTA and guidance/active-session essentials
- secondary content should be shortened or moved lower
- avoid overloading the first screen

---

## 11. Card style

Default card style:

- rounded corners
- warm white background
- subtle border
- soft shadow if needed
- calm spacing
- clear title
- short description
- optional icon
- clear selected/active state

Avoid:

- dense dashboard panels
- too many nested cards
- repeated summary cards
- decorative cards without function

---

## 12. Option cards

Option cards are used for choices such as:

- baking path
- pizza style
- flour
- quick time
- quantity
- guidance level

Desktop:

- two-column grids are allowed where readable
- larger cards are allowed
- descriptions may be longer

Mobile:

- prefer stacked cards for text-heavy options
- compact 2-column grid is allowed only when labels are short and visual
- tap targets must be large
- selected state must be obvious
- no horizontal overflow

Selected state:

- orange or green accent depending on semantic purpose
- subtle background tint
- check indicator or selected radio marker
- accessible state must not rely only on color

Guidance level cards:

- Beginner can use soft green
- Enthusiast can use warm orange
- Pizza Nerd can use pink/red accent
- selected card must be clear but calm

---

## 13. Buttons

### Primary button

Use for the main next action only.

Rules:

- visually strongest button on the page
- warm orange by default
- clear action label
- large enough for mobile
- never one of many equal-weight buttons

Examples:

- Start Pizza Session →
- Continue →
- Build my dough plan →
- Continue to Timeline →
- Open shopping list →
- Start dough work →
- Next step →
- Mark step as done →
- Save review →

### Secondary button

Use for Back, cancel, or light review actions.

Rules:

- visually quieter than primary
- not orange-filled unless explicitly approved
- should not compete with primary CTA

Default label:

- Back

Optional subtext:

- Back to Recipe
- Back to Timeline
- Back to Start

### Tertiary links

Use sparingly.

Examples:

- Advanced details
- Learn more
- View assumptions

Tertiary links should not interrupt the guided flow.

### Avoid button menus

Avoid showing many equal-weight actions together:

- Open planner
- Review dough plan
- Shopping list
- Save later
- Open calculator
- Open doctor

When several utilities are needed, place them behind:

- More
- Advanced
- Details

or move them to desktop-only context.

---

## 14. Back / Next rhythm

Flow pages should have a consistent rhythm:

- Back = secondary
- Next/Continue = primary

Desktop:

- Back can sit left
- primary action can sit right
- bottom action row is acceptable

Mobile:

- primary action should be large and easy to tap
- Back should be visibly secondary
- avoid duplicate top and bottom primary buttons unless explicitly approved

Flow action visual rule:

- Back is secondary.
- Primary forward action is visually strongest.
- Desktop: Back left, primary right.
- Mobile: primary prominent, Back secondary.

The user should always understand:

- where Back goes
- what the next action does
- what page or mode comes next

---

## 15. Navigation style

### Desktop navigation

Desktop may include:

- global nav
- footer
- sidebar/context panel
- supporting links

But navigation must not distract from the main page action.

### Mobile navigation

Focused mobile task pages should avoid:

- large footer
- large sidebar
- repeated page nav
- many utility links

Mobile navigation should be compact and app-like.

For flow pages:

- compact header
- clear progress/context
- primary CTA
- Back secondary

---

## 16. Footer visual rule

Desktop footer:

- light
- calm
- legal/trust links
- visually separate from primary workflow
- does not compete with page CTA

Mobile footer:

- no large footer in focused task flows
- simplified footer allowed on content/learning pages
- legal/trust links can live in menu or non-task pages

---

## 17. Icons and illustrations

Icons should help recognition.

Use icons for:

- pizza styles
- oven/baking path
- flour types
- timeline moments
- shopping categories
- kitchen steps
- trust/privacy/local-save states

Icon style:

- simple
- consistent
- line or soft filled style
- not overly playful
- not mixed randomly

Do not add heavy icon dependencies unless explicitly approved.

If no icon system exists, use:

- existing icons/assets
- lightweight inline SVGs
- very limited emoji-like markers only if already consistent with the product

Illustrations:

- optional
- should support clarity
- should not dominate the task
- should not make the page feel childish

Food/pizza hero imagery:

- realistic or tasteful illustration is allowed
- should look appetizing and calm
- should not make the UI noisy
- should not override the content hierarchy

---

## 18. Spacing and density

Desktop:

- more whitespace is acceptable
- larger cards allowed
- multi-column layout allowed
- helper copy may be visible

Mobile:

- compact but not cramped
- no horizontal overflow
- reduce vertical waste
- keep current action visible
- avoid long helper paragraphs
- use stacked sections
- use collapsible details for advanced content

---

## 19. Data and numbers

When showing amounts, times or key outputs:

- make numbers visually prominent
- use cards or clean rows
- avoid tiny text for values the user must use in the kitchen
- label units clearly
- avoid repeating the same data in several places

Examples:

- flour grams
- water grams
- salt grams
- yeast grams
- dough ball size
- target time
- preheat time
- take dough out time

Mobile:

- numbers must remain readable at a glance
- avoid dense tables
- use stacked cards/rows

Desktop:

- comparison tables or wider cards are acceptable

---

## 20. Mobile kitchen mode visual rules

Pages used in the kitchen must be especially focused.

Applies especially to:

- `/session/recipe`
- `/session/timeline`
- `/session/kitchen`
- `/timer`
- future execution/reference pages

Mobile kitchen-use screens must:

- make numbers readable
- make time readable
- make current instruction readable
- use large tap targets
- avoid clutter
- avoid footer
- avoid advanced links
- support quick progress
- consider Keep screen awake in future implementation

Visual priority:

1. Current step or current important data
2. Needed amount/time/instruction
3. Primary action
4. Secondary Back or safe navigation

---

## 21. Status and timing indicators

Use status labels only when they help.

Examples:

- Next
- Upcoming
- Done
- Target time
- Important
- Don’t miss this
- Saved locally

Avoid too many badges on one card.

Critical timing states should be visually clear:

- Take dough out
- Preheat oven
- Bake pizza
- Put dough in fridge

Use calm emphasis, not emergency styling, unless the user is actually late or at risk of missing the moment.

---

## 22. Tables and dense data

Desktop:

- tables can be used if they improve comparison
- advanced values can be shown in cards or tables

Mobile:

- avoid large tables
- use stacked rows
- show the most important output first
- put advanced data behind details/accordion

---

## 23. Advanced information

Advanced information should not dominate Level 1 flows.

Default:

- hide advanced details
- collapse formula/debug data
- use “Advanced details” or “Pizza Nerd details”

Desktop can show more advanced context when useful.

Mobile should hide or collapse advanced information by default.

---

## 24. Shopping and cart-like UI

Shopping pages should feel practical, not like ecommerce checkout unless explicitly approved.

Desktop:

- grouped checklist
- optional cart/summary panel if useful
- filters such as All / Need / Have can be used
- “View cart” or “Need to buy” summary can be used if the product direction requires it

Mobile:

- simple checklist first
- large checkboxes/tap targets
- clear item quantities
- primary action should move forward
- avoid too many utility actions
- no cluttered cart/checkout feel unless intentionally designed

Shopping is a preparation step, not a retail checkout.

---

## 25. Visual reference images

When Marcin provides a visual reference image:

Use it for:

- mood
- layout direction
- hierarchy
- spacing
- card rhythm
- mobile interaction feel
- icon/style inspiration

Do not:

- copy pixel-perfectly
- invent data from the image
- create a static mock page
- introduce a new visual system
- change calculations or business logic to match the image

If the image is a mobile reference:

- mobile should follow it closely
- desktop may add more context and workspace structure
- product logic remains shared

If the image conflicts with this style guide:

- follow the guide unless Marcin explicitly approves the exception

---

## 26. How to request future changes

Good instruction examples:

> Add this section only on desktop. On mobile, show only a compact teaser. Follow the visual style guide.

> Make the mobile version app-like and compact. Desktop may show more explanation.

> Keep the same color scale and button rhythm. Do not invent a new style.

> This is an approved exception: make this mobile CTA sticky because the user needs it during kitchen execution.

> Use this photo/reference for direction, but keep DoughTools colors, cards and button hierarchy.

---

## 27. Reusable Codex instruction block

Use this in future Codex prompts:

> Follow DoughTools visual style guide and global responsive UX rules.
>
> Keep the existing DoughTools color scale, card style, button hierarchy, spacing and typography.
> Do not invent a new visual system.
> Desktop may show more context.
> Mobile must be compact, app-like and focused on the current decision or next action.
> Keep one primary action per page.
> Back is secondary.
> Avoid repeated summaries, large mobile footers and competing button menus.
> If a visual reference image is attached, use it as direction only and preserve DoughTools style.

---

## 28. Summary

DoughTools visual rule:

Warm, calm and practical.  
Helpful like an expert.  
Simple like an app when used on mobile.  
Never noisy.  
Never a generic dashboard.  
Never many equal buttons.  
The next action is always obvious.
