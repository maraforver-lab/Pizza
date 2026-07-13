# DoughTools Visual Style Guide

Version: 1.1  
Purpose: Global visual design rules for all current and future DoughTools pages.  
Use together with: `docs/experience-principles.md`, `docs/global-responsive-ux-rules.md`, and `docs/sitewide-hero-and-imagery-system.md`

This guide defines how DoughTools should look and feel across the product. It is based on the current DoughTools direction, the product North Star in [Experience principles](./experience-principles.md), and the visual reference images reviewed during the UX work.

For page-level hero selection, image role, and route-by-route introduction type, use [Sitewide hero and imagery system](./sitewide-hero-and-imagery-system.md).

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

`docs/experience-principles.md`

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

Use the official DoughTools visual palette from `docs/design-system.md`.

Tailwind tokens and CSS variables must resolve to the same official source values. Legacy names such as `cream`, `leaf`, `--dt-primary` and `--dt-background-warm` are compatibility aliases only. Do not add new arbitrary brand colors or near-duplicate cream, tomato, ink, forest or basil values.

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

- Plan my next pizza
- Create my pizza plan
- Continue to Shopping
- Continue to Timeline
- Start Kitchen Mode
- Review my pizza
- Finish session
- Mark step as done

Primary action should stand out clearly, especially on mobile.

### Secondary action

Use white/neutral cards or outline buttons.

Secondary actions should not compete with the primary action.

Examples:

- Back
- Calculate my dough
- View details
- Advanced details

### Dark action

A dark high-contrast button can be used sparingly for “resume” or active-session continuation, for example:

- Continue my plan

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
- primary CTA: Plan my next pizza
- secondary CTA: See how it works
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

- Plan my next pizza
- Create my pizza plan
- Continue to Shopping
- Continue to Timeline
- Start Kitchen Mode
- Review my pizza
- Finish session
- Mark step as done

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
- Understand flour strength
- View assumptions

Tertiary links should not interrupt the guided flow.

### Avoid button menus

Avoid showing many equal-weight actions together:

- Open planner
- Review dough plan
- Shopping list
- Save later
- Calculate my dough
- Diagnose my dough

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

DoughTools uses one centralized icon system, documented in `docs/design-system.md`.

Future interface icons should use the shared `DoughToolsIcon` component and semantic icon map. The official source is `lucide-react`, with one consistent line-icon family, rounded line endings, inherited `currentColor`, consistent visual weight and accessible labels when the icon is not accompanied by text.

Emoji must not be used as primary functional interface icons. Unicode geometric symbols must not be used as permanent substitutes for recognizable icons. Existing emoji and Unicode icons may remain temporarily until a dedicated migration patch.

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

### DoughTools Photography and AI Image Direction

This section is authoritative for photography, generated imagery and future visual assets.

Overall image character:

- warm
- realistic
- artisan
- practical
- tactile
- kitchen-based
- appetizing without appearing artificial
- premium but not luxury-staged
- imperfect in a believable way

Avoid:

- cold corporate stock photography
- plastic-looking food
- exaggerated HDR
- oversaturated orange tones
- generic SaaS imagery
- cartoon food when realistic photography is expected
- fake restaurant branding
- visible third-party logos
- text embedded inside generated images
- unrealistic utensils, fingers, oven structures or ingredients

Lighting should prefer warm natural side light, window light, believable oven light, soft directional shadows, controlled contrast, warm highlights and realistic darker areas.

Avoid flat front lighting, blue studio lighting, excessive cinematic darkness, blown highlights, unrealistic glowing food and heavy HDR texture.

Preferred materials and environments:

- flour-dusted stone
- wood
- linen
- warm ceramic
- practical stainless steel
- oven brick
- dark oven interiors
- dough boxes
- real kitchen work surfaces

The environment should feel usable, not staged like an expensive restaurant advertisement.

Preferred camera perspectives:

- 30–45 degree food photography
- upper diagonal process views
- close details of dough texture
- believable workspace views
- hands performing a useful action only when people have been explicitly approved
- full composition with safe areas for responsive text overlays

Avoid using top-down views for every image, extreme wide-angle distortion, awkward cropped ingredients and hero subjects placed where mobile cropping will remove them.

Pizza appearance must show believable bake characteristics, natural crust variation, realistic topping distribution, correct style-specific geometry, slightly imperfect artisan results, and authentic flour and char texture.

Do not make every pizza look like the same Neapolitan pizza. Images representing New York, Detroit, Roman, Sicilian or contemporary styles must visually match the specific style.

People policy:

- Do not create or commission any AI-generated image containing a person without first asking Marcin for explicit approval.
- This includes faces, full bodies, partial bodies, visible hands, silhouettes, reflections and background people.
- Do not assume that hands are automatically allowed.
- If people are approved, they must be photorealistic and anatomically credible.
- Avoid generic smiling AI chefs or staged lifestyle models.
- The existing approved authentic founder photograph under `/public/about/` remains the primary founder image.
- Do not alter the founder’s identity, facial structure, body, age or recognizable appearance through AI generation.
- Do not create a synthetic founder replacement.

Responsive asset requirements:

- create separate desktop and mobile compositions when one crop cannot serve both
- define visual safe areas for text
- preserve the primary subject across crops
- avoid essential content near image edges
- store approved assets locally
- use optimized WebP, PNG or JPG
- define explicit dimensions
- use meaningful alt text when informative
- use empty alt text for purely decorative images

Future homepage hero direction:

- show pizza as a strong atmospheric presence, not a small isolated product thumbnail
- communicate both process and result
- support large readable copy
- feel visually rich but not cluttered
- use realistic photography
- avoid generated people unless separately approved
- work in both desktop and mobile compositions
- remain consistent with the light DoughTools application interface

Shopping Pizza Menu photography direction:

- prioritize realistic, comparable and identifiable pizzas over dramatic atmosphere
- use a coherent 30–45 degree menu-led composition family where each pizza remains easy to distinguish
- keep the full or nearly full pizza visible so toppings, sauce, cheese and crust can be compared quickly
- match the represented pizza exactly; do not add random garnish or use one pizza image for multiple identities
- avoid obvious AI patterns such as duplicated toppings, impossible crust geometry, floating ingredients, plastic cheese or repeated compositions with only toppings swapped
- keep text and controls outside informative pizza images; Shopping images confirm the menu choice, while the checklist remains the practical buying tool

Do not create final homepage assets until a dedicated homepage visual patch asks for them.

### Decorative imagery guardrails

Future visual/layout patches may use small decorative pizza, dough or ingredient imagery when it supports the section hierarchy.

Allowed:

- max one decorative image per major card or section unless explicitly approved
- existing local assets first
- small inline SVGs or existing icon styles
- decorative images with empty `alt` text or `aria-hidden`
- meaningful images with short descriptive `alt` text

Not allowed without explicit approval:

- remote runtime image dependencies
- images with embedded text
- images that introduce claims or feature promises
- images that cause mobile overflow
- heavy assets that noticeably increase page weight

If a patch adds a new image asset, document the file and purpose in the patch report.

### Pizza-making photography and instructional imagery

Future UI patches may use high-quality local photo-based pizza imagery across the site when it improves clarity, emotion or task understanding.

Approved site-wide:

- local pizza and dough photography
- realistic or photorealistic food-prep images
- instructional dough-step photos
- warm hero/support images when relevant
- consistent image sequences for tutorials and product flows
- images for Timeline, Kitchen Mode, Guide, Lab, Party Orders and other areas when helpful

The preferred visual world:

- warm Italian-style kitchen atmosphere
- artisan pizza-making mood
- realistic food, dough and prep textures
- flour, dough, wood or stone counters, and warm natural light
- coherent lighting, surface, props and color palette across related images
- mostly hands visible rather than faces for instructional work
- fictional/generic, non-identifiable people only unless explicitly approved

When building instructional pizza dough content, prefer a consistent sequence:

- same hands
- same kitchen
- same dough batch feel
- same camera mood
- each image matches the specific step

Step-image examples:

- weighing ingredients
- mixing dough
- resting covered dough
- cold fermentation
- balling dough
- final rest
- opening or stretching
- topping
- baking
- finished pizza or review

Images must support the task. They should not be random decoration, a stock-photo moodboard, or a replacement for clear UI text.

Asset and implementation rules:

- store approved assets locally under `/public/images/...`
- prefer WebP or optimized PNG/JPG
- avoid oversized files
- no runtime remote image dependencies
- no hotlinked images
- no embedded text inside images
- image layout must be responsive and mobile-safe
- meaningful images need short useful `alt` text
- decorative images should use empty `alt` text or `aria-hidden`
- images must not reduce text contrast or block controls

Avoid:

- cold corporate stock look
- inconsistent hands, locations or lighting in one sequence
- overused Italian clichés
- cartoon emoji look when realistic photos are requested
- recognizable real people without explicit approval and rights
- third-party logos, trademarks or implied endorsements
- copyrighted or stock images without confirmed rights

Image patches should list proposed filenames and purpose before implementation. If images must be generated, use one consistent prompt/style brief and save only approved final assets locally. Prefer a small curated asset set over many unrelated images.

---

## 17a. Visual/layout improvements vs copy changes

Future UI patches may improve visual hierarchy with:

- softer cards
- warm cream backgrounds
- soft green success/status cards
- subtle gradients
- rounded panels
- subtle shadows
- small icons
- small decorative images
- compact key-value rows
- mobile stacked layouts
- desktop two-column layouts

For layout/design patches, do not introduce new user-facing copy unless the patch explicitly asks for it.

Allowed without separate approval:

- reuse existing copy
- move existing copy
- change layout around existing copy
- shorten obviously duplicated copy only when the patch explicitly asks for duplicate-copy cleanup
- change labels only when the patch explicitly asks for consistency

Not allowed without separate approval:

- new explanatory paragraphs
- new section titles
- new CTA labels
- new helper text
- duplicate info boxes
- marketing-style claims
- promises about features
- guidance text that could conflict with calculation or planning logic

If new copy is needed, Codex must list the proposed copy clearly before implementing unless the prompt already includes the exact approved copy.

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
