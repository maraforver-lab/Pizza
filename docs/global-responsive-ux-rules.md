# DoughTools Global Responsive UX Rules

Version: 1.0  
Purpose: Global product and responsive UX rules for all current and future DoughTools pages.

Use together with: `docs/experience-principles.md`, `docs/design-system.md`, `docs/visual-style-guide.md` and `docs/sitewide-hero-and-imagery-system.md`.

## 1. Core principle

DoughTools uses one shared product logic, but responsive presentation changes by device. Responsive decisions should support the product North Star in `docs/experience-principles.md`: people come to DoughTools for confidence, not calculations.

**Desktop = guided workspace.**  
**Mobile = focused app experience.**  
**Same logic, different layout.**

This means:

- One shared product flow
- One shared state model
- One shared validation model
- One shared calculation model
- One shared route model
- Different responsive presentation for desktop and mobile

Do not create separate mobile business logic, separate mobile routes, or separate mobile wizard flows unless explicitly approved.

## 2. Scope

These rules apply to all current and future DoughTools pages, including but not limited to:

- `/`
- `/session/*`
- `/sauce`
- `/toppings`
- `/costs`
- `/timer`
- `/ovens`
- `/guide`
- `/account`
- future `/learn/*`
- future `/tools/*`
- future `/my-pizzas/*`
- future `/saved-bakes/*`
- future guided pizza-making pages

These are global DoughTools product rules, not only Pizza Session rules.

## 3. Product experience goal

DoughTools should feel like:

- a calm expert workspace on desktop
- a simple guided cooking app on mobile

The user should always understand:

1. What this page is for
2. What matters now
3. What they should do next
4. Where Back goes
5. Where the primary action goes

Visual implementation must use the official palette, semantic aliases, typography roles, icon policy and image rules in `docs/design-system.md` and `docs/visual-style-guide.md`. Marketing surfaces and workspace surfaces may have different visual emphasis, but they must share the same visual foundation.

Page-level hero size, imagery and introduction type must follow `docs/sitewide-hero-and-imagery-system.md`.

## 4. Desktop rule: guided workspace

Desktop may show more context.

Desktop can include:

- richer context
- helper copy
- wider cards
- multi-column layouts
- sidebars where useful
- tables or comparisons where useful
- advanced explanations
- footer / legal / trust links
- secondary navigation if it does not compete with the main task

Desktop must still keep:

- one clear primary action
- Back as secondary
- no competing button menus
- no repeated summary blocks
- no unnecessary tool links in the main flow

Desktop pages may feel like a workspace, but they must still guide the user clearly.

## 5. Mobile rule: focused app experience

Mobile must show only what helps the user act now.

Mobile context:

The user may be:

- in the kitchen
- phone in hand
- dough on hands
- in a hurry
- trying to complete only the next step

Mobile must include:

- current decision or next action
- short helper copy
- large tappable actions
- clear Back / Next rhythm
- compact cards
- readable numbers and times
- no horizontal overflow
- no large sidebars

## 5.1 Active cooking workflow rule

Kitchen Mode is the strongest example of the mobile focused-app rule. Mobile Kitchen Mode must prioritize:

1. the current step
2. the planned time or live timing state
3. the action to take now
4. the completion criterion
5. one dominant completion action
6. a compact preview of what comes next

Longer technique notes, educational exits and advanced experience-level detail should be secondary or disclosed so they do not push the current action below the fold.

Desktop Kitchen Mode may show richer context, but the current action remains dominant.

Educational links that leave an active cooking workflow must provide an explicit validated return path. Browser Back alone is not enough navigation design for active workflows. Return URLs must be same-product internal paths and must not expose session data.

Active-session routes must prioritize current state and the next required action. Desktop may show more context, but it must not repeat actions or explanations merely because more space is available.
- no repeated summaries
- no unnecessary footer inside focused task flows
- no advanced links unless behind a clear “More” or “Advanced” disclosure
- no competing button menus

Mobile must not be a scaled-down desktop page.  
Mobile should feel app-like.

## 6. One logic, two presentations

### Do

- use one shared state model
- use one shared validation model
- use one shared calculation model
- use one shared route flow
- use responsive layout and presentation

### Do not

- create a separate mobile wizard
- create separate mobile business logic
- create different calculation paths for mobile and desktop
- create separate mobile routes unless explicitly approved
- fork persistence or session state by device

### Acceptable

Separate visual layout components are allowed if they share the same state, actions, validation and routes.

Example:

- `DesktopLayout`
- `MobileLayout`

### Not acceptable

Different mobile/desktop product behavior with separate state ownership.

Example to avoid:

- `DesktopWizard`
- `MobileWizard`

unless both are purely visual wrappers around one shared flow.

## 7. Page type classification

Every new page must define its page type before implementation.

### A. Planning page

Purpose: user makes choices or configures a plan.

Examples:

- `/session/start`
- future setup/configuration pages

Desktop:

- may show helper text, side progress, richer option cards

Mobile:

- one decision per screen
- compact progress
- short copy
- large primary action
- Back secondary
- no footer in focused flow

### B. Reference page

Purpose: user reads important amounts, timings, checklist details or guidance.

Examples:

- `/session/recipe`
- `/session/timeline`
- sauce guidance
- gear guide
- oven guide
- future recipe/detail pages

Desktop:

- may show more context, explanations and supporting cards
- footer allowed if not distracting

Mobile:

- show key numbers/timings first
- make important values readable at a glance
- avoid repeated summaries
- avoid large footer in focused reference contexts
- consider “Keep screen awake” if used while cooking

### C. Execution page

Purpose: user is doing something in the kitchen.

Examples:

- `/session/kitchen`
- future dough mode
- future pizza service mode
- timers used during cooking

Desktop:

- may show supporting context, but current action remains dominant

Mobile:

- most app-like experience
- phone in hand, dough on hands, user in a hurry
- show only current step, needed amounts, key instruction and primary action
- huge tap targets
- minimal secondary navigation
- no footer
- consider “Keep screen awake”

### D. Checklist page

Purpose: user checks off items.

Examples:

- `/session/shopping`
- future ingredient checklist
- future gear checklist

Desktop:

- grouped checklist and useful context allowed

Mobile:

- simple app-like checklist
- large tap targets
- Next and Back only unless explicitly needed
- no utility button menu
- no footer in focused task context

### E. Review / learning page

Purpose: user records what happened, saves notes, learns for next time.

Examples:

- `/session/review`
- future saved bakes
- future my pizzas

Desktop:

- may show summary, history, notes and learning context

Mobile:

- simple form or saved-bake cards
- obvious save/edit action
- avoid clutter
- footer optional only if page is browse/read mode, not active flow mode

### F. Content / learning page

Purpose: user reads educational content.

Examples:

- `/guide`
- `/ovens`
- future `/learn/*` pages

Desktop:

- can show table of contents, deeper explanation, footers, related links

Mobile:

- readable article flow
- short sections
- collapsible long details where useful
- sticky primary action only if there is a clear task
- footer may be simplified

### G. Tool page

Purpose: user uses a calculator, timer or decision tool.

Examples:

- `/costs`
- `/timer`
- `/sauce`
- `/toppings`

Desktop:

- may show advanced controls, explanations, side panels, tables

Mobile:

- prioritize the main input and output
- for food calculators, show the unit amount, total amount and key assumption before secondary education or troubleshooting content
- hide or collapse advanced details
- keep primary output visible
- for numeric/reference tools, consider screen-awake if used during cooking
- avoid too many controls at once

### H. Account / admin page

Purpose: user manages account, saved items or settings.

Examples:

- `/account`
- future user settings
- future billing

Desktop:

- fuller layout allowed

Mobile:

- simple stacked settings
- one action group at a time
- footer optional

## 8. Navigation placement rules

Global rule:

Each flow page should have one primary forward action and one clear secondary back/cancel action.

Do not create button menus with many equal-weight actions.

### Primary action

- Desktop: may sit in the main card, hero action, or bottom action row depending on page type
- Mobile: should be clearly visible, large and easy to tap
- Must describe the user’s next meaningful action
- Must follow the CTA language governance in `docs/experience-principles.md`

Examples:

- Plan my next pizza
- Create my pizza plan
- Continue to Shopping
- Continue to Timeline
- Start Kitchen Mode
- Review my pizza
- Finish session
- Mark step as done

### Secondary action

Back should be secondary.

Default label:

- Back

If additional clarity is needed, use small subtext:

- Back to Recipe
- Back to Timeline
- Back to Start

Avoid too many labels such as:

- Review session
- Edit session choices
- Open planner
- Open calculator
- Open doctor

unless the page purpose specifically needs them.

### Flow pages

Flow pages use Back / Next rhythm.

- Primary forward action is visually dominant
- Back never competes with the primary action
- Avoid duplicate primary CTAs
- Avoid secondary tool menus

### Flow action placement rule

On guided flow pages, Back and Next/Continue actions must follow a consistent placement pattern.

Desktop:

- Back is secondary and placed at the bottom-left of the action area.
- The primary forward action is placed at the bottom-right of the action area.
- The primary forward action uses the page-specific label, for example:
  - Create my pizza plan
  - Continue to Shopping
  - Continue to Timeline
  - Start Kitchen Mode
  - Review my pizza
  - Finish session
  - Mark step as done

Mobile:

- The primary forward action is large, visually dominant and easy to tap.
- Back is secondary and visually quieter.
- If actions are side by side, Back stays left and the primary action stays right.
- If actions are stacked because of narrow width, the primary action appears first and Back appears below as secondary.

Do not:

- create page-specific action layouts unless explicitly approved
- show multiple equal-weight forward actions
- place Back as the dominant action
- use “Save and continue later” as a competing action when autosave exists

### Desktop navigation

- Header/global nav allowed
- Footer allowed
- Sidebars allowed if they add context and do not repeat the main content
- Secondary links should be visually subdued

### Mobile navigation

- compact header
- no large desktop sidebar
- no large footer in focused task flows
- primary action near the relevant content or bottom action area
- Back secondary and consistent
- no repeated top and bottom CTA duplication unless explicitly approved

## 9. Footer rules

### Desktop

Normal pages may include footer.

Footer can include legal/trust links:

- Privacy
- Terms
- Contact
- Updates
- Methodology

Footer must not compete with the page’s primary action.

In guided pages, footer should remain visually light.

The canonical site footer is `components/SiteFooter.tsx`, based on the approved homepage footer. If a page already renders a footer, it must use that shared component. If a page has no footer, do not add one automatically for consistency.

No visible route-specific content should appear after the footer. Place sources, methodology notes, final CTAs, account/security notes or product-specific disclosures before the footer.

### Mobile

Focused task pages should not show a large footer by default.

This especially applies to:

- planning flows
- execution pages
- checklist pages
- pages used in kitchen context

Legal/trust links can be available from:

- global menu
- homepage
- non-task pages

Mobile content/learning pages may include a simplified footer if useful.

Do not add a large footer to mobile flow pages unless explicitly requested.

When a mobile page already has a footer, use the same canonical `SiteFooter` responsive behavior rather than creating a route-specific mobile footer.

## 10. Desktop-only and mobile-hidden content rules

These are allowed product instructions.

### “Show this only on desktop.”

Meaning:

- content appears on desktop/tablet wider layouts
- hidden on mobile
- does not affect mobile primary flow

### “Hide this on mobile.”

Meaning:

- content may exist on desktop
- mobile hides it or collapses it behind More/Advanced

### “Mobile should show only the short version.”

Meaning:

- desktop may include long explanation
- mobile gets condensed copy

### “Mobile reference image defines the mobile target.”

Meaning:

- attached image is the mobile presentation direction
- desktop may add context and workspace structure
- same product logic remains shared

Implementation guidance:

Use responsive CSS/classes or shared components.

Do not create different product behavior unless explicitly requested.

## 11. Mobile kitchen-use rule

Mobile users may be in a real cooking environment.

Therefore mobile screens must:

- reduce typing
- reduce choices
- use large tap targets
- avoid dense copy
- make numbers and times readable
- keep the next action obvious
- avoid footer clutter
- avoid unnecessary navigation choices

If a number, amount, timing or instruction is needed while cooking, it must remain easy to read on a small screen.

## 12. Keep screen awake policy

For pages used as live reference or during kitchen execution, future implementation should consider “Keep screen awake”.

Useful pages:

- `/session/recipe` when reading dough amounts
- `/session/timeline` when checking key timings
- `/session/kitchen` during active execution
- `/timer` if used while cooking
- future execution/reference pages

Usually not needed:

- `/session/start`
- `/session/review`
- passive marketing/home sections

Implementation principles:

- Use progressive enhancement only.
- If browser/device supports a wake lock API, it can be used later.
- If unsupported, fail gracefully.
- Never block the user.
- Do not add intrusive permission flows unless required by platform.
- If shown, label should be simple: Keep screen awake

Helper copy:

Useful while following amounts, timers or step-by-step instructions.

## 13. Existing and future page rule

All future DoughTools pages must define before implementation:

- page type
- purpose
- one primary user job
- primary user action
- secondary/back action
- desktop layout rule
- mobile layout rule
- what appears desktop-only
- what is hidden/collapsed on mobile
- footer behavior
- whether keep-screen-awake may be relevant
- whether the page is planning, reference, execution, checklist, review, content, tool or account/admin

New pages should reuse existing DoughTools responsive rules and patterns.

Do not invent a new layout pattern unless explicitly approved.

## 13.1 Content and action budget

Responsive design should not hide an overloaded page. Start by keeping the page focused.

Default public learning pages should generally use:

- one compact hero
- one primary outcome, explanation or interaction
- roughly three to six major content sections
- one compact Related Learning group
- one final primary action
- the canonical footer as the final visible element

Exceptions are allowed for legal pages and complex application workspaces, but they must be intentional and should not create repeated summaries or competing CTAs.

Rules:

- one primary action per decision point
- no duplicate primary actions with the same destination and purpose
- no more than one dominant CTA in the same section or viewport
- Related Learning should normally contain no more than three links
- do not use Related Learning as a sitemap
- utility actions such as Copy, Save, Share, Reset, Back or Export are allowed when they perform distinct functions
- before adding a new visible section, first try merging, shortening, disclosing, linking or omitting the content
- do not turn every fact into a card

## 14. Recommended shared components

Recommended shared patterns:

- `DoughToolsPageShell`
- `ResponsivePageShell`
- `FlowPageShell`
- `MobileAppHeader`
- `DesktopWorkspaceShell`
- `PrimaryActionRow`
- `BackNextActions`
- `OptionCard`
- `CompactProgress`
- `DesktopContextPanel`
- `MobileCollapsedDetails`
- `PassiveSaveIndicator`
- `KeepScreenAwakeToggle`

These do not all need to exist immediately. They define the desired direction for future implementation.

## 15. Reusable instruction for future patches

Use this block in future Codex prompts:

> Follow DoughTools global responsive UX rules.
>
> Desktop = guided workspace.
> Mobile = focused app experience.
>
> Use one shared product logic, state, validation and routes.
> Do not create separate mobile business logic.
> Do not create a separate mobile wizard.
> Mobile should show only the current decision or next action.
> Desktop may show more context.
> Keep one primary action per page.
> Back is secondary.
> Avoid repeated summaries, large mobile footers and competing button menus.

## 16. Visual reference rule

When a visual reference image is provided:

- use it as visual direction only
- do not copy it pixel-perfectly
- do not invent fake data from the image
- do not change business logic to match the image
- preserve the DoughTools design system
- preserve shared product flow and state

If the image is a mobile reference:

- apply it primarily to mobile layout
- desktop may add more context and workspace structure
- do not create separate mobile product logic

## 17. Summary

DoughTools responsive product rule:

Desktop is a calm expert workspace.  
Mobile is a focused cooking app.  
The logic is shared.  
The layout adapts.  
The next action is always clear.
