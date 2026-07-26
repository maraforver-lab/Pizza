# Patch 470B: Dough Guide instructional hierarchy audit

## 1. Executive summary

Patch 470A correctly removed the generic Dough Guide cross-topic block and limited "What should I do first?" to the Prepare step. The current Dough Guide is now more focused, but the remaining hierarchy still asks users to pass through a general page introduction and a four-stage "See the dough process" overview before the active step becomes the primary task.

The content itself is strong. Every dough step has a clear action, readiness criteria, common mistake, recovery advice, step-specific image support, optional level detail and contextual troubleshooting links. The main problem is presentation order and repetition:

- The active step often begins around 875 to 905 px on mobile and around 992 to 1012 px on desktop after the general process overview.
- The primary "Do this now" instruction often begins around 1395 to 1440 px on 390 px mobile for non-Prepare steps.
- Prepare currently shows "What should I do first?", "See the dough process", the active Prepare step image, "Do this now", and the no-plan card. These all contain useful ideas, but together they create a long entry before the user reaches the actual task.
- Later steps still show the global process overview even when the user intentionally opened a specific stage such as Measure, Mix dough, Check readiness or Release dough ball.

Recommended direction for Patch 470C: use a **Step-by-step Kitchen Assistant** structure. Keep the existing step content and images, but make the active step the page's main instructional unit. Demote the global process overview into a compact Prepare-only orientation disclosure or a small progress summary. Keep "What should I do first?" only in Prepare, but make it the Prepare entry action rather than a parallel content block.

No production code, calculations, Pizza Plan logic, sessions, images, routes, navigation, footer, APIs, database or migrations were changed in this audit.

## 2. Current UX problems

### Problem 1: the page teaches the whole process before the selected step

`DoughProcessVisual` is rendered unconditionally before the active step article. It contains four global stages: weigh, mix, develop and make dough balls. This is useful for orientation, but on later steps it delays the user from the task they selected through the URL, sticky navigation or session return link.

Source evidence:

- `components/guide/DoughGuidePageClient.tsx` renders `<DoughProcessVisual />` before the step-navigation and active article.
- Tests currently protect that order in `tests/dough-guide.test.ts` with "adds one concise four-stage dough process visual after the quick answer".

### Problem 2: mobile first action is too low

At 390 x 844, representative browser measurements:

| Step | Process top | Active step top | "Do this now" top | Document height | Finding |
| --- | ---: | ---: | ---: | ---: | --- |
| Prepare | 841 px | 1425 px | 1977 px | 3629 px | Prepare has two overview blocks before the step action. |
| Measure | 321 px | 905 px | 1440 px | 3164 px | The general process overview appears before the selected task. |
| Mix dough | 321 px | 905 px | 1395 px | 3203 px | Current task is below the first viewport. |
| Check readiness | 321 px | 905 px | 1440 px | 5437 px | The most diagnostic step becomes very long. |

At 430 x 740, representative browser measurements:

| Step | Process top | Active step top | "Do this now" top | Finding |
| --- | ---: | ---: | ---: | --- |
| Prepare | 793 px | 1347 px | 1864 px | The first action is well below the first viewport. |
| Measure | 321 px | 875 px | 1440 px | The selected task starts after the process overview. |
| Mix dough | 321 px | 875 px | 1395 px | Current action is delayed by overview and image. |
| Warm dough | 321 px | 875 px | 1412 px | Later handling steps still inherit the global overview. |

### Problem 3: desktop is calm but still overview-first

At 1440 x 900, representative browser measurements:

| Step | Process top | Active step top | "Do this now" top | Finding |
| --- | ---: | ---: | ---: | --- |
| Prepare | 886 px | 1335 px | 1489 px | The Prepare action is below the first viewport. |
| Measure | 543 px | 992 px | 1146 px | The active step begins after the overview. |
| Mix dough | 543 px | 992 px | 1146 px | The desktop visual hero plus overview delay the instruction. |
| Check readiness | 543 px | 992 px | 1146 px | Diagnostic content starts after an unrelated orientation block. |

Desktop has enough width for the sticky step navigation and hero image, but it still reads as a learning-index page first and a step assistant second.

### Problem 4: Prepare has competing first-action concepts

Prepare currently includes:

1. Page hero: "Make the dough".
2. `DoughQuickAnswer`: "What should I do first?"
3. `DoughProcessVisual`: "See the dough process".
4. Active step article: "Prepare ingredients and tools".
5. "Do this now".
6. `PreparePlanSummaryCard`: either active plan facts or "No active pizza plan".

This is understandable as a learning page, but not as a first-action guide. The user asks "what do I do now?", and the answer is split across several nearby blocks.

## 3. Current step-by-step analysis

The source defines 12 canonical Dough Guide steps in `lib/dough-guide.ts`.

| # | Step id | Step title | Current purpose | Current issue |
| ---: | --- | --- | --- | --- |
| 1 | `prepare` | Prepare ingredients and tools | Orient the user and start mise en place. | Correct home for first-action guidance, but too many overview blocks compete before the actual task. |
| 2 | `measure` | Measure the ingredients | Weigh flour, water, salt and yeast. | The task is concrete, but the global process visual appears before it. |
| 3 | `mix-dough` | Mix dough | Combine ingredients until no dry flour remains. | The step-specific image is useful, but the primary action is delayed. |
| 4 | `rest-dough` | Rest dough | Let flour hydrate and dough relax. | Needs simple "wait and observe" hierarchy, not a full process overview first. |
| 5 | `develop-dough` | Develop the dough | Build dough strength without tearing. | Strong step-specific visual support should be near the action. |
| 6 | `bulk-ferment` | Bulk fermentation | Let dough expand and ferment. | Needs active timing/readiness support, not general orientation first. |
| 7 | `divide-dough` | Divide the dough | Cut and weigh dough portions. | Measurement action should be immediate. |
| 8 | `ball-dough` | Ball dough | Shape smooth dough balls. | Visual sequence is valuable, but page height is large because the process overview precedes it. |
| 9 | `proof-dough-balls` | Proof the dough balls | Let dough balls relax and proof. | Needs readiness cues and drying warning early. |
| 10 | `warm-dough` | Bring the dough to working temperature | Move cold dough toward workable temperature. | Should focus on current dough feel and temperature context. |
| 11 | `check-readiness` | Check dough readiness | Diagnose under, ready and overproofed dough. | The step is long because it has readiness states plus comparison imagery. It needs stronger prioritization. |
| 12 | `release-dough-ball` | Release the dough ball for stretching | Remove one dough ball without tearing. | Should act like a final handling action, not repeat global orientation. |

## 4. "See the dough process" recommendation

Current behavior: `DoughProcessVisual` appears on every selected step.

Evaluation:

- It is useful for first-time orientation.
- It uses realistic local images and clear four-stage labels.
- It is too large to appear before every active step.
- It duplicates the sticky step navigation on desktop and delays the current task on mobile.
- It is not required once the user is already inside Measure, Mix, Bulk fermentation or later handling steps.

Final recommendation:

Use option C with a Prepare-only bias:

1. Keep a compact process orientation only on Prepare.
2. Render it as a collapsed or low-height overview, not a full four-card image block by default.
3. On non-Prepare steps, replace it with no global overview. Let the current step title, step number and previous/next controls provide location.
4. If direct deep links need orientation, show a one-line "Step X of 12" context near the active step, not the four-image overview.

This preserves orientation without making every step pay the same reading cost.

## 5. "What should I do first?" recommendation

Current behavior after Patch 470A: visible only on Prepare.

Evaluation:

- The scope is now correct.
- The content is useful: Weigh ingredients, Mix dough, Let ferment, Divide and shape.
- The section still reads like a second overview above the active Prepare step.
- The "Start with weighing" CTA is good, but its surrounding block duplicates the active step's own "Do this now" panel.

Final recommendation:

Keep the component only for Prepare, but merge it conceptually into the Prepare entry:

- Make it a compact "Start here" block inside or directly adjacent to the Prepare step article.
- Keep the four existing Prepare instructions.
- Keep the "Start with weighing" path to `step=measure`.
- Do not show it during fermentation, shaping or later dough-handling stages.
- Do not reserve empty space when hidden.

## 6. Information block evaluation

| Current block | Keep? | Future role | Notes |
| --- | --- | --- | --- |
| Page hero | Keep, compact | Page identity | Good copy and image, but the hero should not dominate later-step deep links. |
| "What should I do first?" | Keep only Prepare | Start-here task summary | Correctly hidden outside Prepare after Patch 470A. Needs tighter integration with Prepare. |
| "See the dough process" | Demote | Prepare-only orientation disclosure | Too heavy before every step. |
| Sticky step navigation | Keep desktop | Progress and direct navigation | Useful, especially after process overview is demoted. |
| Mobile active-step image | Keep but reorder | Visual support for current action | Currently before "Do this now"; future design should place action first or pair image with action. |
| "Do this now" | Keep primary | Current action | Should become the first major card in the active step. |
| Active plan/no-plan card | Keep but compact | Contextual helper | Prepare-only currently. Keep read-only and avoid workflow pressure. |
| "You are ready when" | Keep secondary | Completion criteria | Should follow action directly. |
| "Common mistake" | Keep compact | Warning | Useful but should not have equal visual weight to action and readiness. |
| "How to fix it" | Keep as recovery | Collapsed or secondary | Important, but many users do not need it immediately. |
| Visual sequence/comparison | Keep | Step-specific teaching | Strongest image value on the page. Keep near the exact section it explains. |
| Readiness comparison | Keep for Check readiness | Diagnostic teaching | Valuable but requires density control on mobile. |
| Troubleshooting links | Keep | Recovery route | Should remain contextual, not a broad related-learning list. |
| "Why this matters" | Keep collapsed | Explanation depth | Good disclosure pattern. |
| Level-specific detail | Keep collapsed | Guidance-depth support | Correct use of selected guidance level. |
| Previous/Continue controls | Keep | Linear progression | Mobile ordering is correct: forward action is primary. |

## 7. Mobile findings

Reviewed at 390 x 844 and 430 x 740.

What works:

- No horizontal overflow was observed in representative browser checks.
- The generic cross-topic "What should I learn next?" block is absent.
- "What should I do first?" is absent from non-Prepare steps.
- Step-specific images render and use local Dough Guide assets.
- The active step has clear forward navigation.

What needs improvement:

- On 390 px, Prepare's active article began at 1425 px and "Do this now" at 1977 px.
- On 390 px, Measure and Check readiness both showed the general process visual at 321 px, while "Do this now" began at 1440 px.
- On 430 px, Prepare's active article began at 1347 px and "Do this now" at 1864 px.
- Later steps are easier to understand if opened intentionally, but the current task is still below a full global process overview.
- Check readiness is necessarily longer than other steps, but it needs a stronger diagnostic hierarchy so the comparison does not feel like another large page section after many cards.

Mobile recommendation:

Use this order:

1. Compact page identity and breadcrumb.
2. Current step header: step number, title, one-sentence goal.
3. Current action: "Do this now".
4. Readiness: "You are ready when".
5. Step-specific image or comparison.
6. Mistake and recovery support.
7. Troubleshooting and deeper details.
8. Previous/Continue controls.

The global process overview should not sit above this order except as a compact Prepare-only orientation.

## 8. Desktop findings

Reviewed at 1280 x 900 and 1440 x 900.

What works:

- The page feels calm and credible.
- Desktop has a sticky navigation column.
- The hero image for the active step helps identify the topic.
- No horizontal overflow was observed in representative browser checks.

What needs improvement:

- At 1440 x 900, non-Prepare step articles began around 992 to 1012 px after the general process overview.
- "Do this now" began around 1146 to 1166 px for most later steps.
- The full process overview duplicates navigation and dilutes the active step.
- Desktop has enough room to pair current action and visual support, so the current separate overview-first sequence is not the best use of space.

Desktop recommendation:

Keep the two-column learning workspace, but make the active step article the dominant panel. Use the left column for step navigation and optional compact process context. Use the right/main column for action, readiness, image and recovery.

## 9. Image findings

The Dough Guide image ecosystem is strong and should be retained.

Current assets:

- 12 primary `guide-step-*` WebP images exist for the canonical steps.
- Step-specific `teaching-step-*` WebP images exist for secondary visual learning.
- Tests confirm local typed visual assets, alt text, dimensions and route-specific image paths.
- The strongest image use is the active step visual and the step-specific visual sequence or comparison.

Image hierarchy issue:

- The four-image global process overview is less valuable than the active step image once a user has selected a specific step.
- On mobile, the active step image currently appears before "Do this now", so a large image can delay the action.
- For Check readiness, the comparison imagery is central to the task and should stay close to readiness diagnosis.

Image recommendation:

- Retain all current Dough Guide images.
- Do not add new images in Patch 470C.
- Do not delete old assets in Patch 470C.
- Move or demote only the global overview usage.
- Place step-specific imagery adjacent to the instruction it teaches.
- For most steps, action should precede image on mobile; for Check readiness, readiness/comparison can be elevated because visual diagnosis is the action.

## 10. Three redesign concepts

### Concept A: Step-by-step Kitchen Assistant

Structure:

1. Compact page identity.
2. Active step header.
3. Current action.
4. Readiness criteria.
5. Step visual support.
6. Mistake/recovery support.
7. Optional deeper explanation.
8. Previous/Continue.

Pros:

- Best mobile action-first hierarchy.
- Preserves all current content.
- Works with session return links.
- Makes direct deep links feel intentional.
- Avoids a wizard while still guiding step by step.

Cons:

- Requires careful component extraction to avoid churn.
- Needs tests that assert order semantically rather than by classes.

Recommended: yes.

### Concept B: Recipe Card Model

Structure:

1. Step title.
2. Compact "Goal / Do / Ready / Fix" card.
3. Visual proof below.
4. Optional details.

Pros:

- Very compact.
- Good for quick reference.
- Strong mobile density.

Cons:

- May compress rich learning content too far.
- Can underuse the existing imagery.
- Less appropriate for beginners who need fuller explanations.

Recommended: use as density inspiration, not the full model.

### Concept C: Guided Cooking Mode

Structure:

1. One current task per screen.
2. Sticky completion control.
3. Next task handoff.
4. Optional recovery drawer.

Pros:

- Extremely focused for active kitchen use.
- Could pair well with Kitchen Mode later.

Cons:

- Too workflow-like for a public learning guide.
- Risks implying persisted progress or session state.
- Larger scope than Patch 470C should take.

Recommended: defer. Do not implement as Dough Guide page redesign now.

## 11. Recommended future structure

Patch 470C should implement Concept A with conservative scope.

Recommended page order:

1. Breadcrumb and compact Dough Guide identity.
2. Optional session return link if supplied.
3. Active step module.
4. Prepare-only compact start-here helper.
5. Prepare-only compact process orientation disclosure.
6. Desktop step navigation.
7. Step-specific support and visuals.
8. Previous/Continue.

Recommended active-step module order:

1. Step number and title.
2. One-sentence step summary.
3. "Do this now" as the primary instruction block.
4. "You are ready when".
5. Step visual support.
6. Common mistake.
7. How to fix it, preferably collapsed or visually secondary.
8. Troubleshooting links.
9. "Why this matters" and selected guidance-level details.

Special cases:

- Prepare can include the four first-action instructions and the plan/no-plan context.
- Check readiness can elevate the readiness comparison image because visual diagnosis is the task.
- Ball dough can keep its longer visual sequence but should not start after a global overview.

## 12. Component proposal

Future implementation can stay focused by extracting presentation components around existing data:

- `DoughGuideShell`: page frame, breadcrumb, return links and compact page identity.
- `DoughStepHeader`: step number, title, summary and progress context.
- `DoughStepPrimaryAction`: "Do this now" block.
- `DoughStepReadiness`: "You are ready when" block.
- `DoughStepWarning`: common mistake, styled as a warning.
- `DoughStepRecoveryDisclosure`: "How to fix it" as secondary recovery support.
- `DoughStepVisualSupport`: active step image, visual sequence, visual comparison and readiness comparison routing.
- `DoughStepPlanContext`: Prepare-only active/no-plan context.
- `DoughStepStartHere`: Prepare-only "What should I do first?" content.
- `DoughStepOverviewDisclosure`: Prepare-only compact process overview.
- `DoughStepFooterNavigation`: previous/continue controls.

Implementation guard:

Do not change `lib/dough-guide.ts` content unless a tiny structural prop is needed for presentation. Prefer keeping the canonical step data intact.

## 13. Implementation roadmap

### Patch 470C: Restructure Dough Guide active-step hierarchy

Scope:

- `components/guide/DoughGuidePageClient.tsx`
- Focused Dough Guide tests
- Optional focused documentation note if needed

Implement:

- Demote `DoughProcessVisual` to Prepare-only compact orientation.
- Move active step action above global orientation for all non-Prepare steps.
- Keep "What should I do first?" only in Prepare and tighten it into a start-here helper.
- Reorder current step blocks so action/readiness are first.
- Preserve step data, images, guidance-level logic and session return paths.

Acceptance:

- Non-Prepare steps do not render "What should I do first?".
- Non-Prepare steps do not render the full "See the dough process" block above the active step.
- Mobile shows the current step and "Do this now" much earlier than current measurements.
- No horizontal overflow at 390 x 844 and 430 x 740.
- Existing step IDs and previous/next links still work.

### Patch 470D: Verify Dough Guide hierarchy and release

Scope:

- Production verification only, plus a small fix if a concrete defect is found.

Verify:

- `/guides/dough` at Prepare and all 11 later steps.
- Session return paths from Timeline and Kitchen remain safe.
- Active-plan context remains read-only.
- Guidance-level details still render only selected depth.
- Images remain stable and local.
- No Pizza Plan, calculation, session or database behavior changes.

## 14. Risks and safeguards

Risks:

- Tests currently protect the old `DoughProcessVisual` placement, so they must be updated carefully in Patch 470C.
- Moving image blocks can accidentally weaken visual learning if the active step image becomes too late.
- Collapsing recovery content can hide important troubleshooting if done too aggressively.
- Session-context cards must remain read-only and must not alter Pizza Plan data.

Safeguards:

- Keep all existing step content and image metadata.
- Test semantic order: step title, "Do this now", readiness, visual support, continue link.
- Test Prepare-only rendering for "What should I do first?" and process orientation.
- Test that non-Prepare steps do not reserve hidden overview space.
- Test URL query navigation for all 12 steps.
- Browser-check 390 x 844, 430 x 740, 1280 x 900 and 1440 x 900.

## 15. Validation performed for this audit

Performed:

- Source inspection of `components/guide/DoughGuidePageClient.tsx`.
- Source inspection of `lib/dough-guide.ts`.
- Existing test inspection of `tests/dough-guide.test.ts` and related guide tests.
- Local browser review of `/guides/dough` with representative step query states.
- Viewport review at 390 x 844, 430 x 740, 1280 x 900 and 1440 x 900.
- Image asset inventory for `public/dough-guide`.
- Confirmed generic "What should I learn next?" is absent from Dough Guide.
- Confirmed "What should I do first?" is currently Prepare-only.
- Confirmed no horizontal overflow in representative browser checks.
- Confirmed no console or hydration errors were observed in the browser log sample.

Limitations:

- No active Pizza Plan was created or modified. Active-plan behavior was source-verified through `getDoughGuideSessionContext(getActivePizzaSession())` and existing session-context tests.
- Browser measurement rows with obvious transient zero positions were discarded and not used as evidence.
- This was audit-only; no focused tests, lint or build were run because no production code changed.

## 16. Final recommendation

Dough Guide should become a step-centered learning assistant, not a page that repeats the whole dough process before every step. Patch 470C should keep the current content, images, calculations and session integrations intact, but change the hierarchy so the selected step is always the first major learning unit.

The key product rule is:

**Teach the current dough action first; provide process orientation only when it helps the user start.**
