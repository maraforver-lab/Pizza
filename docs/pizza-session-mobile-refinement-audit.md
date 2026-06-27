# Pizza Session mobile refinement audit

Version: 1.0  
Patch: 71 — Pizza Session mobile refinement audit  
Date: 2026-06-27

## Scope

This audit reviews the complete Pizza Session V2 journey after Patches 64–70:

1. `/session/start` — Steps 1–5: setup
2. `/session/recipe` — Step 6: dough plan
3. `/session/timeline` — Step 7: timeline
4. `/session/shopping` — Step 8: shopping list
5. `/session/kitchen` — Step 9: Kitchen Mode
6. `/session/review` — Step 10: review

This is an audit and planning document only. It does not change formulas, calculations, storage, routing, auth, SEO, pricing, or the Pizza Session journey flow.

## Audit basis

The audit is based on:

- `AGENTS.md`
- `docs/global-responsive-ux-rules.md`
- `docs/visual-style-guide.md`
- `docs/design-system.md`
- `docs/pizza-session-v2-journey.md`
- current source for all `/session/*` pages
- local production build behavior from the current Patch 70 baseline

Core rule:

- Desktop = guided workspace.
- Mobile = focused app experience.
- Same logic, different layout.

## Executive summary

Pizza Session V2 now has the correct route chain and page roles. The main remaining issue is not missing functionality; it is presentation density and responsive consistency.

The biggest desktop opportunity is to make the pages feel like a cohesive guided workspace without repeating context or creating dashboard-like side content.

The biggest mobile opportunity is to reduce first-viewport clutter, compress cards, shorten helper copy, and keep the current action visible earlier.

Patch 72 should refine desktop structure and consistency. Patch 73 should refine mobile density and first-viewport behavior. Patch 74 should extract shared layout/card/action primitives so future session pages do not keep rebuilding one-off patterns.

---

# Page audit: `/session/start`

## A. Purpose

Purpose: collect the first five setup decisions:

1. how the user will bake
2. pizza style
3. target pizza time
4. pizza count
5. flour

Then hand off to `/session/recipe`.

Current clarity: Good. The page clearly communicates setup and shows the full V2 journey. It also explains that setup is only steps 1–5.

Risk: the page is the most visually complex part of the session. On desktop this is mostly acceptable. On mobile, the journey/progress context risks consuming too much early screen space.

## B. Desktop

Desktop currently shows:

- DoughTools header
- desktop sidebar with logo, V2 intro, guidance badge, saved locally badge
- journey progress percentage
- full 10-step journey rail
- local-first reassurance card
- main question card
- option cards
- BottomActionBar
- saved locally indicator near the primary action

Desktop should keep:

- guided workspace structure
- full journey rail
- current setup decision in the main area
- selected-card text state
- local-first copy
- Back bottom-left / primary bottom-right rhythm

Desktop should remove:

- duplicate DoughTools branding between top header and sidebar if it feels repetitive
- duplicate “Saved locally” labels if they compete with action area
- excess progress labels that repeat the same meaning

Desktop could improve:

- make the left rail visually calmer and less tall
- make setup steps 1–5 visually distinct from later steps 6–10
- add a clearer “you are in setup” label near the main card
- reduce sidebar copy once the user is past Step 1

## C. Mobile

Mobile currently shows:

- compact top header
- Step X of 10
- guidance mode badge
- 10-dot progress indicator
- helper text: “Setup choices now, dough plan next.”
- current question
- helper copy
- option cards
- BottomActionBar

Mobile should keep:

- compact header
- one progress indicator
- current question
- compact option cards
- selected state with text
- primary action prominent
- Back secondary

Mobile should hide completely:

- desktop sidebar
- full 10-step journey rail
- large explanatory setup copy
- repeated saved-locally labels

Mobile should collapse:

- Pizza Nerd/enthusiast helper copy if it becomes long
- any “why this matters” text into a short disclosure

Mobile should simplify:

- progress label and progress dots should not both feel dominant
- option cards should stay compact and avoid excessive vertical padding
- Step 3 date/time grids should avoid pushing Continue too far below the fold

## D. First viewport at 390px

Approximate first viewport shows:

- DoughTools compact header
- Step X of 10 label
- guidance mode badge
- progress dots
- short setup helper
- current question
- helper copy
- first option cards

Flag: important content can require scrolling on option-heavy steps, especially Step 2 and Step 3. Continue may be below the first viewport on smaller devices.

## E. Cards

Audit:

- card boundaries are clear
- selected state is obvious
- tap targets appear large enough
- icon size is moderate
- mobile cards stack vertically

Flags:

- Step 2 can feel long because five pizza choices are stacked
- Step 3 uses several quick-choice buttons and can feel dense
- selected indicator plus “Selected” text is accessible but can add height

## F. Typography

Audit:

- headings are clear
- helper text is readable
- desktop typography feels aligned with V2

Flags:

- mobile helper text could be shorter
- sidebar explanatory copy is useful on desktop but should not leak into mobile
- Pizza Nerd copy can become long on Step 3

## G. Navigation

Audit:

- uses `BottomActionBar`
- desktop rhythm is correct
- mobile primary appears first because of shared BottomActionBar ordering

Flags:

- “Saved locally ✓” sits near the action area and may feel like a third action/status item
- disabled Back on first step is acceptable, but visually it still occupies a primary navigation row

## H. Information architecture

The page is doing the most work in the journey, but that is expected. The only duplicated information is progress/context.

Flag duplication:

- header logo plus sidebar logo
- saved-locally badge plus saved-locally action note
- Step/progress percentage plus 10-dot indicator

## I. Desktop-only opportunities

- Keep full journey rail desktop-only.
- Keep “setup is steps 1–5” explanation desktop-only.
- Add richer helper copy only in desktop sidebar.
- Allow desktop to show future steps as context.

## J. Mobile-only opportunities

- Shorten page intro to one line.
- Keep only one compact progress indicator.
- Consider sticky or near-bottom action placement for long option steps.
- Compress option cards further on Step 2 and Step 3.

## K. Consistency score

- Navigation: Good
- Visual consistency: Good
- Mobile friendliness: Needs work
- Desktop clarity: Good
- Overall: Good

## Improvement checklist

- [ ] Reduce duplicate saved-locally indicators.
- [ ] Make mobile Step 3 date/time choices more compact.
- [ ] Make mobile Continue easier to reach on option-heavy steps.
- [ ] Clarify desktop sidebar hierarchy between setup steps and later V2 steps.
- [ ] Consider hiding percent text on mobile if dots already communicate progress.

---

# Page audit: `/session/recipe`

## A. Purpose

Purpose: show what to prepare before starting dough and show the dough amounts.

Current clarity: Excellent. The page now has the right order:

1. hero/context
2. Before you start
3. Dough amounts
4. Next step
5. BottomActionBar

## B. Desktop

Desktop currently shows:

- compact V2 hero
- Step 6 context
- guidance badge
- desktop-only side context card
- Before you start card
- Dough amounts card
- Next step card
- BottomActionBar
- local-first copy

Desktop should keep:

- Before you start before Dough amounts
- ingredient/tool checklist
- readable dough amount cards
- desktop context panel
- Back to `/session/start`
- Continue to Timeline to `/session/timeline`

Desktop should remove:

- none immediately

Desktop could improve:

- use a more consistent “Step 6: Dough plan” desktop context component shared with timeline/shopping/kitchen/review
- make amount cards visually more kitchen-readable at a glance
- consider a future “Keep screen awake” placeholder only after shared support exists

## C. Mobile

Mobile currently shows:

- Step 6 context
- title and helper
- Before you start
- Dough amounts
- Next step
- BottomActionBar

Mobile should keep:

- no sidebar
- no summary chips
- checklist-first order
- readable amount values
- one primary action

Mobile should hide completely:

- desktop context card
- any extra summary chips
- footer clutter

Mobile should collapse:

- long helper copy
- precision note if it competes with amount cards

Mobile should simplify:

- reduce hero vertical space if amount cards fall too far down
- consider tighter checklist spacing

## D. First viewport at 390px

Approximate first viewport shows:

- Step 6 context pills
- guidance badge
- title: “Your dough plan is ready.”
- helper copy
- saved locally text
- beginning of Before you start

Flag: dough amounts likely require scrolling. This is acceptable because the required order intentionally places preparation before amounts, but the first amount values should not be too far below the fold.

## E. Cards

Audit:

- preparation card is readable
- dough amount cards are clear
- mobile card stacking is safe

Flags:

- amount cards could be visually stronger on mobile because users may read them in the kitchen
- checklist cards may use more vertical space than needed

## F. Typography

Audit:

- heading hierarchy is clear
- amount values are readable

Flags:

- hero title could be slightly smaller on very small mobile screens
- helper copy can be trimmed on mobile

## G. Navigation

Audit:

- `BottomActionBar` used
- Back destination is `/session/start`
- primary destination is `/session/timeline`
- layout follows Back/primary rhythm

Flags: none.

## H. Information architecture

Good. The page is focused and no longer behaves like a session summary or dashboard.

Flag duplication: none major.

## I. Desktop-only opportunities

- Show slightly richer “why these amounts matter” helper on desktop.
- Add a desktop-only “Step 6 leads to timeline” explanation.
- Future: precision scale note can be more explanatory on desktop.

## J. Mobile-only opportunities

- Keep checklist and amount cards tight.
- Consider two-column micro cards only if readability remains strong.
- Move less important local-first note below the main action if vertical space becomes tight.

## K. Consistency score

- Navigation: Excellent
- Visual consistency: Excellent
- Mobile friendliness: Good
- Desktop clarity: Excellent
- Overall: Excellent

## Improvement checklist

- [ ] Slightly compress mobile hero.
- [ ] Increase visual strength of dough amount values on mobile.
- [ ] Consider shared StepContext component.
- [ ] Keep screen-awake future opportunity documented but not implemented.

---

# Page audit: `/session/timeline`

## A. Purpose

Purpose: answer “When do I need to do what?”

Current clarity: Good. The page is clearly a timing reference and includes Next Up, Critical Moments, Full Timeline, shopping checkpoint and BottomActionBar.

Risk: it is the densest reference page. Mobile may feel long before the user reaches the full schedule.

## B. Desktop

Desktop currently shows:

- compact V2 hero
- Step 7 context
- desktop context card explaining timeline vs Kitchen Mode
- Next Up card
- Critical moments section
- Full timeline
- shopping checkpoint in sequence
- Timing assumptions
- BottomActionBar
- local-first note

Desktop should keep:

- Next Up dominant
- Critical Moments
- Full Timeline
- shopping checkpoint
- desktop context distinguishing timeline from Kitchen Mode
- Back to `/session/recipe`
- primary action based on next state

Desktop should remove:

- none immediately

Desktop could improve:

- reduce visual competition between Next Up and Critical Moments
- make Take dough out stand out more consistently
- move Timing assumptions into a collapsible or desktop-only support block
- align timeline rows with a reusable TimelineCard pattern

## C. Mobile

Mobile currently shows:

- Step 7 context
- title and helper
- Next Up
- Critical moments
- Full Timeline
- Timing assumptions
- BottomActionBar
- local-first note

Mobile should keep:

- Step 7 context
- Next Up early
- primary action
- Critical moments
- shopping checkpoint
- full timeline accessible by scroll

Mobile should hide completely:

- desktop explanatory context card
- any large footer

Mobile should collapse:

- Timing assumptions
- long timeline notes
- quiet-hour explanation if not urgent

Mobile should simplify:

- make Next Up and primary action visible earlier
- shorten Full Timeline row descriptions
- use compact rows for non-current steps

## D. First viewport at 390px

Approximate first viewport shows:

- Step 7 context
- title: “Your pizza timeline”
- helper copy
- saved locally text
- start of Next Up card

Flag: primary next action is in BottomActionBar near the bottom of the page, so on mobile the user may see the recommendation before seeing the actual action. Patch 73 should consider mobile-specific action surfacing without duplicating desktop CTAs.

## E. Cards

Audit:

- cards are clear and warm
- Full Timeline rows are readable
- shopping checkpoint is visible

Flags:

- timeline rows may be too tall on mobile
- emoji icons can vary visually by platform
- Critical Moment cards plus timeline rows can feel repetitive

## F. Typography

Audit:

- heading hierarchy is strong
- timeline labels are readable

Flags:

- helper copy repeats that this is for planning and Kitchen Mode is for doing
- Full Timeline descriptions may be too long for mobile

## G. Navigation

Audit:

- `BottomActionBar` used
- Back destination is `/session/recipe`
- primary destination changes by next state
- desktop rhythm is correct

Flags:

- mobile primary action may be too far below page content
- recommended action is displayed in Next Up but not itself clickable there

## H. Information architecture

The page does the right job but has three planning layers:

1. Next Up
2. Critical Moments
3. Full Timeline

This is correct for desktop. Mobile should make layers more compact.

Flag duplication:

- Critical Moments and Full Timeline repeat some steps.
- Next Up recommended action and BottomActionBar primary action repeat meaning but not placement.

## I. Desktop-only opportunities

- Keep Timing assumptions visible desktop-only.
- Add richer schedule explanation desktop-only.
- Use a two-column desktop layout with context and timeline if it does not become a dashboard.

## J. Mobile-only opportunities

- Collapse Timing assumptions.
- Compact Full Timeline rows.
- Keep Next Up primary action visible earlier.
- Collapse non-critical timeline notes behind “Details”.

## K. Consistency score

- Navigation: Good
- Visual consistency: Good
- Mobile friendliness: Needs work
- Desktop clarity: Good
- Overall: Good

## Improvement checklist

- [ ] Make mobile primary action reachable immediately after Next Up.
- [ ] Collapse Timing assumptions on mobile.
- [ ] Reduce Full Timeline row height on mobile.
- [ ] Make Take dough out visually prominent without alarm styling.
- [ ] Consider reusable `TimelineStepCard`.

---

# Page audit: `/session/shopping`

## A. Purpose

Purpose: answer “What do I need before Kitchen Mode?”

Current clarity: Good. It is clearly a checklist page, not ecommerce.

Risk: item rows and group sections are functional but can be further tuned for mobile shop/kitchen use.

## B. Desktop

Desktop currently shows:

- compact V2 hero
- Step 8 context
- grouped checklist
- item rows with name, amount, Need/Have, checkbox
- Next Up card
- BottomActionBar

Desktop should keep:

- grouped checklist
- text-visible Need/Have state
- checkbox interaction
- Next Up to Kitchen Mode
- Back to `/session/timeline`
- Next to `/session/kitchen`

Desktop should remove:

- none immediately

Desktop could improve:

- allow group columns on wide desktop if it improves scanning
- add a desktop-only status summary such as “Need X / Have Y” if implemented carefully
- improve item amount alignment

## C. Mobile

Mobile currently shows:

- Step 8 context
- hero title
- checklist groups
- item rows with amount under label
- Need/Have text
- checkbox
- Next Up
- BottomActionBar

Mobile should keep:

- simple checklist
- large rows
- text-visible status
- checkbox/tap target
- no cart/checkout feel
- Next prominent

Mobile should hide completely:

- any footer
- any ecommerce/cart language
- any extra utility stack

Mobile should collapse:

- long group descriptions
- local-first note if it takes space before action

Mobile should simplify:

- reduce hero vertical space
- keep checklist visible earlier
- make rows more thumb-friendly

## D. First viewport at 390px

Approximate first viewport shows:

- Step 8 context
- title: “Your shopping list”
- helper copy
- saved locally / pizza count text
- checklist group heading
- first checklist items

Flag: generally acceptable. The checklist starts early enough, but hero copy can be shorter.

## E. Cards

Audit:

- groups are clear
- rows have large tap targets
- checkboxes are visible

Flags:

- group wrapper is large but okay
- amount text can become visually secondary on mobile
- row spacing may be slightly tall for long shopping lists

## F. Typography

Audit:

- item names readable
- status text clear

Flags:

- hero body is a bit long for mobile
- group heading + subheading may be more explanation than mobile needs

## G. Navigation

Audit:

- `BottomActionBar` used
- Back `/session/timeline`
- Next `/session/kitchen`
- correct action rhythm

Flags: none major.

## H. Information architecture

Good. It stays checklist-focused and does not become ecommerce.

Flag duplication:

- Next Up card and BottomActionBar both point toward Kitchen Mode, but the card is explanatory and action remains in BottomActionBar. This is acceptable.

## I. Desktop-only opportunities

- Status summary.
- “Need only” filter as a future desktop enhancement, not Patch 72 unless explicitly requested.
- Group columns if visual density improves.

## J. Mobile-only opportunities

- Shorter hero.
- Sticky or near-bottom Next if list becomes long.
- Compact group headers.
- Bigger checkbox hit area if testing shows misses.

## K. Consistency score

- Navigation: Excellent
- Visual consistency: Good
- Mobile friendliness: Good
- Desktop clarity: Good
- Overall: Good

## Improvement checklist

- [ ] Shorten mobile hero copy.
- [ ] Make first checklist group visible earlier.
- [ ] Improve mobile item row density.
- [ ] Consider desktop-only Need/Have summary.
- [ ] Preserve non-ecommerce language.

---

# Page audit: `/session/kitchen`

## A. Purpose

Purpose: answer “What do I do now?”

Current clarity: Excellent. It is execution-focused and uses the next unfinished timeline step.

Risk: for non-mix steps, the “Needed now” section may be absent. This is acceptable, but mobile rhythm should still feel complete.

## B. Desktop

Desktop currently shows:

- compact V2 hero
- Step 9 context
- mode label
- progress/done state
- current task card
- needed-now ingredients for Mix dough when recipe snapshot exists
- service-mode needed-now context
- instruction card
- BottomActionBar
- local-first note

Desktop should keep:

- current task dominance
- real next unfinished step
- Mark step as done
- no full timeline
- no dashboard/tool menu
- recipeSnapshot ingredient amounts only for Mix dough
- Back to `/session/shopping`
- completion to `/session/review`

Desktop should remove:

- none immediately

Desktop could improve:

- make the current task card visually stronger than the hero
- show completion/progress in a calmer compact way
- use a future Keep screen awake control once shared support exists

## C. Mobile

Mobile currently shows:

- Step 9 context
- Kitchen Mode title
- mode/progress
- current task
- needed-now/instruction
- Mark step as done
- Back
- local-first note

Mobile should keep:

- current task early
- needed values readable
- large Mark step as done
- Back secondary
- no footer/sidebar/full timeline

Mobile should hide completely:

- any full timeline
- footer
- utility links
- repeated summaries

Mobile should collapse:

- extra explanatory “why this matters” text for non-beginner modes if it grows
- local-first note if it competes with action

Mobile should simplify:

- reduce hero if current task falls too low
- make current task and primary action the dominant first-scroll experience

## D. First viewport at 390px

Approximate first viewport shows:

- Step 9 context
- Kitchen Mode title
- guidance/mode labels
- current task
- task time
- instruction start

Flag: good. For active execution, current task appears early. Mark step as done may require a little scrolling depending on step content.

## E. Cards

Audit:

- current task card is focused
- ingredient cards readable
- instruction card clear

Flags:

- current task card could be larger/stronger than surrounding cards
- repeated status pills may be visually busy on mobile

## F. Typography

Audit:

- task headings are large
- instruction is readable
- amount values are readable

Flags:

- hero heading plus task heading can feel like two competing titles
- helper copy should remain very short on mobile

## G. Navigation

Audit:

- `BottomActionBar` used
- Back `/session/shopping`
- primary `Mark step as done →`
- completion primary `Review your pizza →`
- action rhythm correct

Flags: none major.

## H. Information architecture

Excellent. Kitchen Mode no longer behaves like timeline/dashboard.

Flag duplication:

- Step 9 context and current task status both carry mode/progress. This may be acceptable but can be visually reduced on mobile.

## I. Desktop-only opportunities

- Show a compact progress strip or task queue preview only on desktop, if it does not become a full timeline.
- Add short mode explanation desktop-only.
- Future Keep screen awake control.

## J. Mobile-only opportunities

- Hide secondary mode badges after initial context.
- Keep current task and Mark done above local-first note.
- Collapse long instructions for Pizza Nerd mode if needed.

## K. Consistency score

- Navigation: Excellent
- Visual consistency: Excellent
- Mobile friendliness: Good
- Desktop clarity: Excellent
- Overall: Excellent

## Improvement checklist

- [ ] Make current task visually dominate more than hero on mobile.
- [ ] Reduce status pill count on mobile.
- [ ] Keep Mark step as done reachable earlier.
- [ ] Add future Keep screen awake only after shared component exists.

---

# Page audit: `/session/review`

## A. Purpose

Purpose: answer “How did your pizza turn out?”

Current clarity: Good. The page is now review/learning-focused after Patch 70.

Risk: it is still a form, so mobile should be tuned to make rating and save feel light rather than paperwork-like.

## B. Desktop

Desktop currently shows:

- compact V2 hero
- Step 10 context
- Review and notes card
- rating options
- what worked field
- what to improve field
- next time field
- free notes field
- BottomActionBar before save
- after-save action group
- local-only note

Desktop should keep:

- rating first
- review fields in learning order
- Back to `/session/kitchen`
- Save review
- after-save actions
- no session summary sidebar
- no footer clutter

Desktop should remove:

- none immediately

Desktop could improve:

- make the form feel less long by grouping fields into two desktop columns
- add a subtle desktop-only prompt example area
- make after-save action hierarchy more visually distinct

## C. Mobile

Mobile currently shows:

- Step 10 context
- Review title
- helper copy
- rating
- textareas
- Save review
- Back
- after-save actions

Mobile should keep:

- rating first
- clear field labels
- Save review prominent
- Back secondary
- no summary/sidebar/footer

Mobile should hide completely:

- desktop form helper examples if added later
- footer
- summary
- photo/share UI

Mobile should collapse:

- free notes if the first three fields feel sufficient
- longer placeholder examples

Mobile should simplify:

- reduce hero height
- make rating options easy to tap
- keep Save review accessible after form fields

## D. First viewport at 390px

Approximate first viewport shows:

- Step 10 context
- title: “Review your pizza”
- helper copy
- review form heading
- overall result rating start

Flag: acceptable. The user sees rating early, but Save review is necessarily below the form.

## E. Cards

Audit:

- single main form card is calm
- rating buttons are large enough
- textareas are readable

Flags:

- four textareas may feel heavy on mobile
- placeholders may be long if visible

## F. Typography

Audit:

- labels are clear
- hero title is clear

Flags:

- review intro combines “How did your pizza turn out?” with level-specific intro, which can be a little long
- mobile could use shorter helper copy

## G. Navigation

Audit:

- `BottomActionBar` used before save
- Back `/session/kitchen`
- primary Save review
- after-save actions replace standard action bar

Flags:

- after-save has three actions; hierarchy is clear enough because Start new session is primary

## H. Information architecture

Good. It no longer behaves like a session summary page or journal system.

Flag duplication: none major.

## I. Desktop-only opportunities

- Two-column form after rating.
- Desktop-only examples for review prompts.
- Desktop-only “what to compare next time” guidance.

## J. Mobile-only opportunities

- Consider collapsing Free notes.
- Reduce placeholder length.
- Stack rating options as 5 compact buttons or a two-row grid.
- Keep after-save actions simple.

## K. Consistency score

- Navigation: Excellent
- Visual consistency: Good
- Mobile friendliness: Good
- Desktop clarity: Good
- Overall: Good

## Improvement checklist

- [ ] Shorten mobile review helper copy.
- [ ] Consider collapsing Free notes.
- [ ] Tune rating button layout at 390px.
- [ ] Strengthen after-save primary action hierarchy.

---

# Desktop recommendations

## Top 10 desktop improvements

1. Standardize a shared StepContext/hero pattern for Steps 6–10.
2. Make `/session/start` desktop sidebar calmer and less repetitive.
3. Distinguish setup steps 1–5 from later steps 6–10 more clearly in the desktop rail.
4. Create a reusable `TimelineStepCard` pattern for `/session/timeline`.
5. Create a reusable `ChecklistGroup` / `ChecklistItem` pattern for `/session/shopping`.
6. Consider desktop-only support panels only where they add context, not summaries.
7. Improve amount/time visual hierarchy on reference pages.
8. Make after-save actions on `/session/review` visually hierarchical.
9. Keep local-first copy passive and visually consistent.
10. Avoid duplicating status/pills when a page already has a clear hero.

# Mobile recommendations

## Top 10 mobile improvements

1. Reduce first-viewport clutter on `/session/start`.
2. Keep only one dominant progress expression on mobile.
3. Make `/session/start` Step 3 date/time choices more compact.
4. Keep primary actions visible earlier after Next Up on `/session/timeline`.
5. Collapse Timing assumptions on `/session/timeline`.
6. Compact timeline rows on mobile.
7. Shorten hero copy on `/session/shopping`.
8. Make current task dominate above hero context on `/session/kitchen`.
9. Consider collapsing Free notes on `/session/review`.
10. Keep local-first notes below the action on mobile when space is tight.

# Consistency recommendations

## Top 10 consistency improvements

1. Use `BottomActionBar` consistently on all active flow pages.
2. Create shared `SessionStepHero` or `V2StepContext` component.
3. Use one consistent local-first note pattern.
4. Standardize StatusPill density across Steps 6–10.
5. Standardize Back labels as `Back`.
6. Keep one primary forward action per page.
7. Keep no-footer rule for focused mobile session pages.
8. Use consistent card radius, padding and section spacing.
9. Standardize empty states across session pages.
10. Keep desktop-only context panels visually subordinate.

---

# Recommended Patch 72 tasks: Desktop refinement

Goal: make desktop Pizza Session pages feel like one guided workspace without changing logic.

Exact pages:

- `/session/start`
- `/session/recipe`
- `/session/timeline`
- `/session/shopping`
- `/session/kitchen`
- `/session/review`

Exact components/patterns:

- `components/design-system.tsx`
- future `SessionStepHero`
- future `DesktopSessionContextPanel`
- future `TimelineStepCard`
- future `ChecklistGroup`

Exact improvements:

1. Standardize Step 6–10 hero/context structure.
2. Reduce duplicated status pills.
3. Calm `/session/start` desktop sidebar.
4. Improve desktop hierarchy for `/session/timeline` Next Up, Critical Moments and Full Timeline.
5. Improve desktop checklist scanning on `/session/shopping`.
6. Strengthen `/session/review` after-save hierarchy.
7. Keep all route destinations unchanged.
8. Do not change calculations, storage or session flow.

# Recommended Patch 73 tasks: Mobile refinement

Goal: make mobile Pizza Session feel like a compact cooking app.

Exact pages:

- `/session/start`
- `/session/recipe`
- `/session/timeline`
- `/session/shopping`
- `/session/kitchen`
- `/session/review`

Exact components/patterns:

- `BottomActionBar`
- mobile progress indicator
- option cards
- timeline rows
- checklist rows
- review form fields

Exact improvements:

1. Reduce `/session/start` first-viewport clutter.
2. Compress Step 2 and Step 3 option/date/time controls.
3. Keep `/session/timeline` primary action available immediately after Next Up.
4. Collapse `/session/timeline` Timing assumptions on mobile.
5. Compact Full Timeline rows.
6. Shorten `/session/shopping` hero.
7. Improve `/session/kitchen` current-task dominance.
8. Reduce status pill count on mobile where redundant.
9. Consider collapsing `/session/review` Free notes.
10. Confirm 390px no-overflow on every session route.

# Recommended Patch 74 tasks: Shared session layout components

Goal: extract reusable primitives after desktop/mobile refinements reveal stable patterns.

Exact pages:

- all `/session/*` pages

Exact components:

- `components/design-system.tsx`
- new `components/session/SessionStepHero.tsx`
- new `components/session/SessionEmptyState.tsx`
- new `components/session/SessionLocalOnlyNote.tsx`
- new `components/session/SessionStatusPills.tsx`
- new `components/session/TimelineStepCard.tsx`
- new `components/session/ChecklistItem.tsx`

Exact improvements:

1. Extract shared V2 step hero.
2. Extract session empty state.
3. Extract local-only note.
4. Extract timeline card.
5. Extract checklist row.
6. Extract consistent review saved state if useful.
7. Keep shared logic unchanged.
8. Add component-focused tests only where practical.

---

# Safe implementation notes

Do not change in Patch 72–74 unless explicitly requested:

- dough formulas
- calculator logic
- session recipe calculation logic
- timeline calculation logic
- shopping-list calculation logic
- Kitchen Mode completion logic
- review save logic
- persistence schema
- auth
- SEO / noindex behavior
- payments / pricing
- Pizza Session route chain

# Final audit conclusion

Pizza Session V2 is structurally complete. The refinement phase should focus on presentation discipline:

- desktop: clearer workspace hierarchy
- mobile: less vertical weight and faster access to the current action
- consistency: fewer one-off page patterns

No major product redesign is recommended before this refinement pass.
