# Patch 377: Mobile-first product flow audit

Audited starting commit: `28e74c7297523030be2985eca2b5169447e5dcf4`

Audit branch: `patch/377-mobile-first-product-audit`

Audit date: 2026-07-14

Scope: documentation and audit only. This report does not change production code, tests, styling, route behavior, persistence, formulas, authentication, SEO, pricing or deployment state.

## 1. Executive summary

DoughTools has a strong core product direction: the best user journey is now a Pizza Session that moves from planning to recipe, shopping, timeline, kitchen mode and review. Patch 370 restored the right product contract for `/session/start`: a user can draft a new plan in memory, persist only after explicit creation, and avoid silently replacing an existing active session. Patch 373 and Patch 374 then strengthened active-session cloud sync and Kitchen Mode progress persistence.

The main product issue is not missing capability. It is that the site still carries several older entry points, broad learning pages and secondary tools around the newer Pizza Session flow. On mobile, this makes DoughTools feel larger and more explanatory than it needs to be at the exact moments where the user needs a focused cooking assistant.

Overall assessment:

- Product model: strong, but not yet fully expressed as the sitewide information architecture.
- Mobile core flow: usable and mostly stable, with no horizontal overflow observed in tested viewports, but Shopping and Timeline remain too long and action-heavy.
- Desktop core flow: better able to absorb the extra context, but still benefits from clearer hierarchy and fewer repeated prompts.
- Public and learning pages: useful, but several pages repeat the same product promise through hero copy, helper text, cards, section descriptions and footer prompts.
- Best next implementation patch: simplify the mobile Shopping step first, because it is the most overloaded active-session route before the user reaches Timeline and Kitchen Mode.

Top three findings:

1. The canonical planning entry is fragmented across `/`, `/start`, `/session/start`, Quick Calculator, footer links and learning CTAs. `/session/start` should remain the real product start, while `/start` should be clarified, merged or demoted.
2. The active mobile flow still exposes too much secondary context. Recipe shows account-save and advanced controls, Shopping is 6.4-7.3 screens on tested mobile sizes and includes a footer, and Timeline repeats `Start Kitchen Mode` while adding several guide links.
3. The public learning and tool surface is broad enough that the product can feel like a content library plus utilities instead of one guided pizza workflow. Several pages should be shortened, merged or repositioned around the Pizza Session.

## 2. Audit method and tested states

References followed:

- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/visual-style-guide.md`
- `docs/design-system.md`
- `docs/sitewide-hero-and-imagery-system.md`
- `docs/pizza-session-autosave-and-resume.md`

Commands and inspections used:

- route inventory from `app/**/page.tsx`
- source searches for CTA labels, active-session links, shared navigation and footer behavior
- browser audit through the local development server
- anonymous Pizza Session creation through `/session/start`
- active-session route inspection for Recipe, Shopping, Timeline, Kitchen and Review
- source and test inspection for cloud sync, active-session persistence, session-start conflict behavior and Party Order handoff

Measured viewports:

| Viewport requested | Effective CSS width | Use |
| --- | ---: | --- |
| 390 x 844 | 375 px | primary mobile audit |
| 430 x 740 | 415 px | short mobile audit |
| 1280 x 900 | 1265 px | desktop workspace audit |
| 1440 x 950 | 1425 px | wide desktop audit |

Primary live scenario tested:

- anonymous user
- `/session/start`
- pizza oven path
- 4 pizzas, 260 g each
- target bake time: 2026-07-15 18:00
- cold fermentation choice: 31.4 h
- dry yeast
- active session then inspected through `/session/recipe`, `/session/shopping`, `/session/timeline`, `/session/kitchen` and `/session/review`

States inspected through source and tests:

- active cloud session continuation
- local active session persistence
- start-form in-memory draft behavior
- explicit create behavior
- local/cloud conflict recovery
- session route empty/prerequisite guards
- Kitchen Mode step progress persistence
- Party Order to Pizza Session handoff

States not fully verified visually:

- signed-in browser state, because the audit browser was signed out
- every Home oven, Beginner, Enthusiast and Pizza Nerd permutation in browser
- live cloud writes against a signed-in production-like account
- dynamic public order pages requiring real public tokens

## 3. Current product model

The clearest product model is:

1. Plan: choose the pizza goal and constraints.
2. Recipe: receive a dough plan and make final fermentation or advanced adjustments.
3. Shopping: translate the plan into buyable ingredients.
4. Timeline: know what to do and when.
5. Kitchen: follow one step at a time.
6. Review: record what happened and improve the next bake.

This model matches the Experience Principles well. It supports mobile as a focused app experience and desktop as a guided workspace without needing separate business logic.

The site around that model is still uneven. Public pages, Quick Calculator, Start Here, learning guides and older tool routes all continue to act like first-class paths. Some of those routes are useful, but their relationship to Pizza Session is not always obvious. The user can understand DoughTools as a session planner, a calculator, a guide library, a topping lab, a sauce calculator, a party-order tool or a set of learning resources depending on which entry point they encounter first.

Recommended canonical product statement:

> DoughTools helps you plan one pizza session, shop for it, cook it on time and review what to improve next.

Any page that cannot clearly support one of those jobs should be shortened, folded into learning, or moved behind a secondary route.

## 4. Route inventory and page-value assessment

Scale: 1 is weak or risky, 5 is strong. `Info` means information density, where 5 means overloaded. `Rep` means visible repetition risk, where 5 means high repetition. `Comp` means complexity, where 5 means high complexity. `Conf` means audit confidence.

| Route | Job | Value | Clarity | Structure | Mobile | Next | Info | Consistency | Conf | Rep | Comp | Assessment |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `/` | Discover and enter product | 5 | 5 | 4 | 3 | 5 | 3 | 5 | 5 | 2 | 3 | Strong homepage, but long on mobile at about 13.3 screens. |
| `/start` | Start Here / older entry | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | Overlaps with `/session/start`; clarify or merge. |
| `/session/start` | Create Pizza Session | 5 | 5 | 4 | 4 | 5 | 3 | 5 | 5 | 2 | 3 | Correct canonical start. Preserve Patch 370 behavior. |
| `/session/recipe` | Confirm dough plan | 5 | 5 | 4 | 3 | 5 | 3 | 5 | 4 | 3 | 3 | Strong, but account-save and advanced controls add mobile weight. |
| `/session/shopping` | Prepare shopping list | 5 | 5 | 3 | 2 | 4 | 4 | 4 | 4 | 3 | 4 | Highest-priority simplification target. Footer appears in focused flow. |
| `/session/timeline` | Prepare schedule | 5 | 5 | 3 | 3 | 5 | 4 | 4 | 4 | 3 | 4 | Useful, but top and bottom `Start Kitchen Mode` repeat. |
| `/session/kitchen` | Execute current step | 5 | 5 | 4 | 4 | 4 | 2 | 4 | 4 | 2 | 2 | Best expression of focused app mode. CTA labels need governance pass. |
| `/session/review` | Review result | 4 | 3 | 3 | 3 | 2 | 2 | 4 | 3 | 1 | 2 | Direct empty state is thin and needs clearer recovery. |
| `/calculator/quick` | Quick dough calculation | 4 | 4 | 3 | 2 | 3 | 4 | 3 | 4 | 3 | 5 | Useful, but control density is high on mobile. |
| `/guide` | Learn fundamentals | 4 | 4 | 3 | 2 | 3 | 5 | 4 | 4 | 4 | 5 | Very long learning hub; reduce or split intent. |
| `/guides/dough` | Dough learning support | 5 | 5 | 4 | 4 | 4 | 3 | 5 | 5 | 2 | 3 | Strong focused guide. Keep compact. |
| `/guide/pizza-troubleshooting` | Diagnose bake issues | 5 | 5 | 4 | 3 | 4 | 4 | 5 | 5 | 3 | 4 | Useful, should stay connected to session review. |
| `/sauce` | Calculate and choose sauce | 4 | 4 | 3 | 2 | 4 | 5 | 4 | 4 | 3 | 5 | Useful but long; keep tool first and trim repeated explanation. |
| `/styles` | Compare pizza styles | 4 | 4 | 3 | 2 | 3 | 5 | 4 | 4 | 3 | 5 | Good learning value, but long and list-heavy on mobile. |
| `/ovens` | Choose oven approach | 4 | 4 | 3 | 2 | 4 | 5 | 4 | 4 | 3 | 5 | Useful, but should point more directly into session setup. |
| `/toppings` | Balance toppings | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 4 | Client-heavy route required further visual verification. |
| `/costs` | Estimate cost | 3 | 3 | 3 | 3 | 2 | 4 | 3 | 2 | 3 | 4 | Useful as a secondary utility, not a primary product path. |
| `/gear` | Gear guidance | 3 | 3 | 3 | 3 | 2 | 4 | 3 | 2 | 3 | 4 | Likely supporting content; avoid competing with ovens/styles. |
| `/history` | Pizza history | 2 | 3 | 3 | 3 | 1 | 4 | 3 | 2 | 3 | 3 | Lowest product urgency. Keep if brand/editorial value is intentional. |
| `/doctor` | Troubleshoot dough | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 4 | May overlap with troubleshooting guide and review. |
| `/plan` | Older planning tool | 3 | 2 | 3 | 3 | 2 | 4 | 2 | 2 | 4 | 4 | Strong consolidation candidate after session flow stabilizes. |
| `/timer` | Timing utility | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 3 | Could become part of Kitchen Mode instead of a separate path. |
| `/coach` | Coaching route | 2 | 2 | 3 | 3 | 2 | 3 | 2 | 2 | 2 | 3 | Needs product-role decision. |
| `/account` | Account hub | 4 | 4 | 4 | 4 | 4 | 2 | 4 | 4 | 1 | 2 | Good signed-out state; signed-in visual state not verified. |
| `/account/pizza-sessions/[id]` | Session history detail | 4 | 4 | 3 | 3 | 3 | 3 | 4 | 2 | 2 | 3 | Source/test inspected only. |
| `/account/party-orders` | Manage party orders | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 4 | Valuable but should remain separate from normal session start. |
| `/account/party-orders/new` | Create party order | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 4 | Source inspected only. |
| `/account/party-orders/[id]` | Party order detail | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 4 | Handoff to Pizza Session is useful but copy should be tight. |
| `/order/[publicToken]` | Guest order form | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 3 | Requires live token for full visual audit. |
| `/order/[publicToken]/edit/[submissionToken]` | Guest edit form | 4 | 4 | 3 | 3 | 4 | 3 | 4 | 2 | 2 | 3 | Requires live token for full visual audit. |
| `/about` | Brand support | 3 | 4 | 4 | 4 | 3 | 3 | 5 | 4 | 2 | 2 | Fine as supporting page. |
| `/updates` | Product updates | 2 | 4 | 3 | 3 | 2 | 3 | 4 | 3 | 2 | 3 | Supporting page. |
| `/methodology` | Explain assumptions | 3 | 4 | 3 | 3 | 2 | 4 | 4 | 4 | 2 | 4 | Important for trust, but keep out of core mobile flow. |
| `/privacy` | Legal | 4 | 5 | 4 | 3 | 3 | 4 | 4 | 4 | 2 | 4 | Fine. |
| `/terms` | Legal | 4 | 5 | 4 | 3 | 3 | 4 | 4 | 4 | 2 | 4 | Fine. |
| `/contact` | Support | 3 | 5 | 4 | 4 | 4 | 1 | 4 | 4 | 1 | 1 | Fine. |
| `/auth/callback` | Auth recovery | 4 | 4 | 3 | 3 | 3 | 2 | 4 | 2 | 1 | 2 | Utility route; source-only audit. |

Supporting API and metadata routes were inventoried but not scored as pages:

- `/api/party-orders`
- `/api/party-orders/[id]`
- `/api/party-orders/[id]/session-handoff`
- `/api/party-orders/[id]/submissions/[submissionId]`
- `/api/party-orders/public/[publicToken]/submissions`
- `/api/party-orders/public/[publicToken]/submissions/[editToken]`
- `/api/pizza-sessions/active`
- `/api/pizza-sessions/history`
- `/api/pizza-sessions/history/[id]`
- `/api/pizza-sessions/history/[id]/photo`
- `/manifest.webmanifest`
- `/opengraph-image`
- `/robots.txt`
- `/sitemap.xml`

## 5. End-to-end Plan my next pizza audit

The strongest end-to-end path is:

`/` -> `/session/start` -> `/session/recipe` -> `/session/shopping` -> `/session/timeline` -> `/session/kitchen` -> `/session/review`

Observed active-session route metrics:

| Route | 390 x 844 | 430 x 740 | 1280 x 900 | 1440 x 950 | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| `/session/recipe` | 2.5 screens | 2.7 screens | 1.9 screens | 1.8 screens | Good next action, moderate mobile context. |
| `/session/shopping` | 6.4 screens | 7.3 screens | 3.3 screens | 3.1 screens | Longest mobile friction point; footer present. |
| `/session/timeline` | 5.7 screens | 6.0 screens | 4.7 screens | 4.5 screens | Useful but long; repeats Kitchen Mode action. |
| `/session/kitchen` | 1.9 screens | 2.2 screens | 1.5 screens | 1.4 screens | Best focused mode. |
| `/session/review` | 1.1 screens | 1.1 screens | 1.1 screens | 1.1 screens | Direct empty state lacks enough guidance. |

Positive observations:

- `/session/start` can create an active session without requiring an existing session.
- Recipe, Shopping, Timeline and Kitchen all render without horizontal overflow in tested mobile viewports.
- Back and forward actions are present in the main active-session steps.
- Kitchen Mode is appropriately compact and step-focused.
- Recipe shows useful calculated values and supports advanced adjustment without breaking the active session.

Friction points:

- Shopping is too long for a focused mobile prep step and includes too many controls before the next action.
- Shopping renders the site footer, which conflicts with focused-flow guidance.
- Timeline repeats `Start Kitchen Mode` near the top and bottom, and also offers several guide links before the user reaches Kitchen Mode.
- Recipe includes account-save and advanced controls inline; these are useful but compete with the main mobile job.
- Review direct-entry empty state says there is nothing to review, but does not fully explain prerequisite state or offer a full route recovery set.

## 6. Cross-step logic and consistency findings

The session logic now largely follows the desired contract:

- `/session/start` does not require an active session.
- creating a new plan is explicit through `Create my pizza plan`.
- existing active sessions are not silently replaced.
- downstream routes preserve prerequisite protections.
- cloud sync and history behavior are covered by existing tests.
- Kitchen Mode step transitions are persisted through the active-session update path.

Consistency issues remain mostly editorial and navigational:

- CTA labels are generally close to governance, but not fully standardized. Examples include `Start mixing now` in Kitchen Mode and `Open Kitchen Mode` from Review empty state.
- Recipe, Shopping and Timeline all mix workflow actions with account, export or learning actions.
- The product has both `/start` and `/session/start`, and both can read as a first step.
- The footer and navigation still expose secondary tools that can distract from the primary session flow.
- Public learning pages often end with CTAs that send users into planning, while the header and footer also offer several other tool paths.

## 7. Mobile UX findings

Mobile strengths:

- No horizontal overflow was observed in the tested active-session routes.
- Kitchen Mode expresses the focused mobile app principle well.
- Primary forward actions exist in the session path and are usually easy to find.
- The session flow can work anonymously, which keeps first-use friction low.

Mobile risks:

- `/session/shopping` is too tall: 6.4 to 7.3 screens in tested mobile sizes.
- `/session/timeline` is also long: 5.7 to 6.0 screens in tested mobile sizes.
- `/session/shopping` has 15 buttons and 8 controls in the measured active state.
- `/calculator/quick` has very high control density on mobile, with 62 buttons and 23 controls observed.
- `/guide`, `/sauce`, `/styles` and `/ovens` are each about 12 to 15 mobile screens in measured states.
- Contextual guide links inside the active flow are useful, but on mobile they should not compete with the current route's primary action.

Mobile recommendation:

Treat the active session as a task surface, not a content page. Recipe can expose details progressively, Shopping should become checklist-first, Timeline should prioritize the next scheduled action, and Kitchen Mode should remain the compact model for downstream steps.

## 8. Desktop UX findings

Desktop strengths:

- Desktop can absorb the extra supporting context better than mobile.
- Recipe, Shopping and Timeline read more like a guided workspace on desktop.
- Advanced controls and account-save prompts are less disruptive on wider screens.
- The active session route structure supports the same logic across viewports.

Desktop risks:

- `/session/timeline` remains long even on desktop at about 4.5 to 4.7 screens.
- Public learning pages remain lengthy on desktop as well, often 5.7 to 7.6 screens.
- Desktop should show more context, but the current implementation sometimes shows more routes, links and repeated prompts than the user needs for the active job.

Desktop recommendation:

Keep the richer workspace model, but use desktop capacity for comparison, status and optional detail rather than repeating the same instruction in hero, helper, cards and closing CTA.

## 9. Information reduction opportunities

Highest-value reductions:

1. `/session/shopping`
   - Remove the site footer from the focused session route.
   - Put the shopping checklist first.
   - Move image export, detailed pizza mix controls and secondary explanations behind disclosure or lower-priority UI.
   - Keep `Continue to Timeline` stable and easy to reach.

2. `/session/timeline`
   - Keep one dominant `Start Kitchen Mode` decision point.
   - Reduce guide links or group them as optional troubleshooting.
   - Prioritize the next required action and current schedule state.

3. `/session/recipe`
   - Keep the calculated dough plan primary.
   - Make account-save and Pizza Nerd controls less competing on mobile.
   - Preserve the ability to adjust fermentation and advanced values.

4. `/start`
   - Decide whether it is still needed as a separate route.
   - If retained, make it a compact orientation page that clearly hands off to `/session/start`.
   - Avoid duplicating the homepage and session-start pitch.

5. Learning pages
   - Compress `/guide`, `/sauce`, `/styles` and `/ovens`.
   - Keep one hero, one primary outcome, three to six major sections and a compact related-learning group.
   - Avoid repeating the same "plan better pizza" promise in multiple page sections.

## 10. Repetition findings

Repeated ideas found across the site:

- Plan my next pizza / start a pizza plan appears in homepage hero, `/start`, `/session/start`, footer Product links and learning CTAs.
- Learning pages often explain their value in hero copy, introductory text, section descriptions and final CTA.
- Timeline offers the same Kitchen Mode destination more than once.
- Shopping presents plan-derived quantities, menu controls, export action and next-step navigation in one route, which creates repeated "prepare for cooking" cues.
- Account-save messaging is valuable, but can feel repeated when paired with session persistence, history and account pages.

Repetition rule to apply:

If a page already tells the user what job it does in the hero, the next section should start the job rather than restating the promise. Supporting explanation should answer a new question, reveal state, or help the user choose.

## 11. State, recovery and accessibility findings

State and recovery:

- Patch 370 behavior appears preserved in source and observed anonymous flow.
- Patch 373 cloud sync behavior is covered by tests, but was not visually verified signed-in.
- Patch 374 Kitchen Mode transition persistence is covered by tests and source.
- Review direct-entry empty state needs clearer recovery. It should explain whether the user needs to cook, complete steps or open an active session.
- Downstream prerequisite guards remain important and should not be removed when simplifying page copy.

Accessibility and responsive observations:

- No horizontal overflow was observed in tested active-session routes.
- Primary actions are generally available, but repeated or secondary actions can weaken focus.
- Mobile button/control count is high on Shopping and Quick Calculator.
- Footer presence on Shopping adds extra links after a focused route and creates additional tab stops.
- Dynamic client-heavy routes such as `/toppings`, `/costs`, `/gear`, `/history`, `/doctor`, `/plan` and `/timer` showed short loading or low-content states during rapid measurement. They need a slower visual pass before major decisions.

## 12. Prioritised issue register

| Priority | Area | Issue | Evidence | Recommended action |
| --- | --- | --- | --- | --- |
| P1 | `/session/shopping` | Focused flow is too long and includes footer. | 6.4-7.3 mobile screens; footer present. | Simplify mobile Shopping, remove footer from focused route. |
| P1 | Information architecture | `/start` and `/session/start` both act like entry routes. | Source and navigation inspection. | Make `/session/start` canonical; demote, merge or clarify `/start`. |
| P1 | Active flow | Timeline repeats `Start Kitchen Mode`. | Browser snapshot and metrics. | Keep one dominant Kitchen Mode transition. |
| P2 | Recipe | Advanced and account-save controls compete with main job on mobile. | Active recipe snapshot. | Progressive disclosure or lower-priority placement on mobile. |
| P2 | Review | Empty state is too thin for recovery. | Direct route shows "Nothing to review yet" with limited options. | Add prerequisite-aware recovery without weakening guards. |
| P2 | Learning pages | Several public pages are 12-15 mobile screens. | Browser metrics for `/guide`, `/sauce`, `/styles`, `/ovens`. | Reduce sections and repeated explanations. |
| P2 | Quick Calculator | Control density is very high. | 62 buttons and 23 controls observed. | Group controls and clarify relationship to Pizza Session. |
| P3 | Secondary tools | `/plan`, `/doctor`, `/timer`, `/costs`, `/gear`, `/history`, `/coach` need role decisions. | Route inventory and source inspection. | Categorize as support, merge, retire or keep intentionally. |
| P3 | CTA language | Some labels differ from governance. | `Start mixing now`, `Open Kitchen Mode`, export labels. | Run focused CTA audit after flow simplification. |
| P3 | Signed-in states | Visual cloud/account audit incomplete. | Browser signed out. | Re-run with signed-in browser session. |

## 13. Phased improvement roadmap

Phase 1: protect and simplify the active mobile flow.

- Simplify `/session/shopping`.
- Remove focused-flow footer from Shopping.
- Keep `Continue to Timeline` visible and stable.
- Preserve recipe formulas, shopping logic, session persistence and cloud sync.
- Add or update regression tests around Shopping route rendering and downstream navigation.

Phase 2: clarify the session entry model.

- Make `/session/start` the canonical product start.
- Decide whether `/start` redirects, becomes a very short orientation page, or is folded into the homepage.
- Preserve Patch 370 behavior exactly.

Phase 3: reduce public learning repetition.

- Shorten `/guide`, `/sauce`, `/styles` and `/ovens`.
- Keep each page to one primary job and one final primary action.
- Limit related learning to curated links.

Phase 4: classify secondary tools.

- Decide whether `/plan`, `/doctor`, `/timer`, `/costs`, `/gear`, `/history` and `/coach` are core, support, legacy or editorial.
- Merge or demote routes that duplicate Pizza Session jobs.

Phase 5: signed-in and cloud visual audit.

- Re-run active-session creation, continuation, save-to-account and account history in a signed-in browser.
- Verify Party Order handoff into Pizza Session using realistic test data.

## 14. Recommended first implementation patch

Recommended next patch:

`Patch 378: Simplify mobile Shopping into a checklist-first session step`

Goal:

Make `/session/shopping` behave like a focused preparation step on mobile while preserving all existing calculations, quantities, persistence and downstream route behavior.

Suggested scope:

- remove the canonical footer from `/session/shopping`
- keep the ingredient checklist and key quantities first
- move image export behind a secondary action
- reduce visible pizza-menu adjustment controls on mobile or place them behind disclosure
- keep `Back` secondary and `Continue to Timeline` primary
- preserve active-session prerequisite protections
- preserve cloud and local active-session sync behavior
- add regression tests for the route rendering without a footer and for the primary transition
- validate mobile and desktop viewports

Why this first:

Shopping is the largest active-flow friction point before the user reaches the schedule and kitchen. It can be improved without changing the product model, formulas, `/session/start` behavior, account behavior or public learning architecture.

## 15. Deferred findings

Defer these until after the Shopping simplification:

- `/start` consolidation with `/session/start`
- full CTA standardization across public pages
- learning page content reductions
- secondary tool retirement or consolidation
- signed-in cloud visual audit
- Party Order guest-token visual audit
- Quick Calculator control-density redesign
- Review route expansion

These are valuable, but each touches broader information architecture or product behavior decisions than the first Shopping patch needs.

## 16. Limitations and items requiring further verification

Limitations:

- The browser audit was anonymous. Signed-in and cloud states were inspected through source and tests, not visually exercised.
- Home oven, Beginner, Enthusiast and Pizza Nerd variants were inspected through source/tests and partial wizard observation, but not fully completed as separate browser sessions.
- Dynamic guest order routes require real public tokens and were not fully rendered.
- Some client-heavy routes showed loading or low-content states during rapid measurement. Those pages need slower, route-specific visual audits before irreversible product decisions.
- This audit did not run a production deployment and did not inspect production analytics.

Items requiring further verification:

- signed-in `Save to account` behavior in browser
- cloud active-session conflict recovery in browser
- account history detail pages with realistic saved sessions
- Party Order handoff with a real multi-guest order
- Home oven and pizza oven route differences through the full flow
- Beginner, Enthusiast and Pizza Nerd copy/control differences through the full flow
- same-day versus long-fermentation planning across Recipe, Timeline and Kitchen

Final audit judgment:

DoughTools is ready for targeted simplification rather than broad redesign. The strongest move is to keep the Pizza Session model intact, reduce mobile friction inside the active flow first, and then make public pages and older tools clearly serve that model.
