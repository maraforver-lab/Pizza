# Patch 458A: Dough guide experience audit

## Scope inspected

- Route: `/guides/dough`
- Related public calculator route: `/calculator/quick`
- Files: `app/guides/dough/page.tsx`, `components/guide/DoughGuidePageClient.tsx`, `lib/dough-guide.ts`, `lib/dough-guide-links.ts`, `components/quick-calculator/QuickDoughCalculator.tsx`
- Related tests and evidence: `tests/dough-guide.test.ts`, `tests/dough-guide-links.test.ts`, `tests/dough-calculator.test.ts`
- Local visual assets: `public/dough-guide/`
- Browser review: `/guides/dough` and `/calculator/quick` at 390x844, 430x740 and 1280x900

This audit did not inspect `/session/recipe`, Pizza Plan formulas, Timeline, Kitchen, header, navigation or footer.

## Executive conclusion

The public Dough guide is already a strong step-by-step learning experience. It has a clear sequence, realistic local images, action-first step cards, readiness checks, troubleshooting links and selected guidance-level detail. It should not be rebuilt.

The main weakness is that the page starts as a twelve-step guide rather than with a short practical answer for the user who asks, "What should I do first?" Mobile users especially reach the active action only after the hero, step title and image. The calculator is powerful and visually stable, but it reads more like an expert tool than a teaching tool because the result panel does not explain what the ingredient amounts mean in dough-handling terms.

The safest path is three small implementation patches: first improve the Dough guide opening hierarchy, then organize existing visuals into clearer process teaching, then improve the public calculator result explanation without touching math.

## What already works

- The guide is centered on the approved user-facing term `Make the dough`.
- The twelve stable steps cover the full dough path: prepare, measure, mix, rest, develop, bulk ferment, divide, ball, proof, warm, check readiness and release.
- Each step already puts practical action before theory through `Do this now`, `You are ready when`, `Common mistake` and `How to fix it`.
- Only the selected guidance level is exposed in the rendered guide detail. The component reads the shared experience-level preference and displays one selected guidance block rather than rendering all three levels together.
- Step navigation is deterministic and query-string based, so individual dough actions can be linked from other pages.
- The guide has useful local realistic images for all twelve primary steps.
- Secondary teaching visuals already cover important dough states, including mixing before/after, rest before/after, bulk before/after, balling sequence, proofing states, warm/tight/relaxed and readiness comparison.
- Troubleshooting links are contextual and level-aware.
- Browser review found no horizontal overflow on `/guides/dough` at 390x844, 430x740 or 1280x900.
- The public Quick Dough Calculator keeps important result values visible in a sticky desktop result panel and uses progressive disclosure for advanced controls.

## Main usability and content problems

- The guide does not give a concise quick answer before the step system. A beginner lands on a full process rather than a short "start here" answer.
- Mobile is technically responsive but not yet action-first enough. On the balling step at 390x844, the primary `Do this now` card begins near the bottom of the first viewport after the hero, step title and image.
- The first screen emphasizes the guide concept and current step image more than the immediate practical task.
- The twelve-step navigation is excellent on desktop, but on mobile the user must move through long pages without a compact process overview.
- The content is accurate, but several repeated patterns compete for attention: step summary, action, readiness, mistake, fix, visual sequence, troubleshooting, theory disclosure and level disclosure.
- The realistic images are valuable but are attached to individual steps rather than presented as one compact process map that helps users understand the whole dough journey.
- The guide teaches readiness well near the end, but earlier steps do not preview the most important final visual goal: a relaxed dough ball that can stretch without tearing.
- The public calculator has prominent ingredient results, but it does not yet explain how those numbers translate into practical dough behavior such as stickiness, strength, fermentation speed and dough-ball size.

## Repetition or missing practical guidance

Repeated patterns that are useful but should stay compact:

- Covering dough to prevent drying appears in several steps. It is important, but the guide could use one early rule and step-specific reminders.
- Stickiness appears in measuring, mixing, rest, handling and troubleshooting. The advice is valid, but the quick path should explain when stickiness is normal versus when it is a problem.
- Clock versus dough condition appears in fermentation, proofing, warming and readiness. This should remain, but a compact "condition beats clock" principle near the beginning would help.
- Troubleshooting links are useful but can visually add another card layer after already dense step content.

Missing or underemphasized practical guidance:

- A short "If you only remember three things" quick answer for beginners.
- A compact process overview showing the full path from dry ingredients to ready dough ball.
- A clear early explanation that dough changes from rough to smooth through hydration, rest, time and gentle handling.
- A practical bridge from calculator outputs to dough handling: dough-ball weight, hydration, salt and fermentation are visible, but their meaning is not yet taught at the result point.

## Beginner findings

Beginner content is friendly and mostly action-oriented. It correctly reassures users that rough or sticky dough can be normal and that resting matters.

The main beginner issue is cognitive load. The page currently asks the beginner to understand a twelve-step system before giving a one-screen answer. Beginner mode should keep the current step pattern, but the page opening should answer:

- Use a scale.
- Mix until no dry flour remains.
- Keep dough covered.
- Follow the plan, but judge readiness by dough condition.
- Stop before tearing or over-tightening the dough.

Beginner detail should stay short. Technical terms such as hydration, baker's percentages, fermentation method and gluten should be introduced only when the user asks for more detail or reaches the relevant step.

## Enthusiast findings

Enthusiast guidance adds useful practical adjustment advice: rest sticky dough before adding flour, use temperature and dough condition together, protect gas, avoid over-tightening and use flour as a release tool.

The main improvement is to make the adjustment logic easier to compare:

- Sticky dough: rest, scrape, wet hands, reduce extra flour.
- Tight dough: rest longer, warm if cold, avoid force.
- Weak or spreading dough: handle gently, shorten warm time, check fermentation.
- Dry skin: cover earlier and avoid exposed containers.

This should be presented as practical diagnosis, not as another long theory section.

## Pizza Nerd findings

Pizza Nerd guidance is technically useful and appropriately more specific. It covers hydration, gluten development, extensibility, fermentation, gas retention, surface integrity and temperature.

The risk is repetition and equal visual weight. Nerd detail should stay available, but it should not compete with the immediate action on mobile. It works best as optional depth after the action and visual evidence.

Nerd content should focus on decisions that change handling:

- hydration changes stickiness and extensibility
- salt and fermentation influence strength and timing
- cold and room fermentation change speed and handling window
- balling affects final proof geometry
- readiness is a combined signal, not one poke test

## Mobile recommendations

- Keep one column.
- Put a short quick answer immediately after the hero.
- Put the current practical action before large secondary teaching sections.
- Keep the primary step image, but avoid letting it push the action too far down on key steps.
- Keep disclosures collapsed by default.
- Use compact process navigation or a simple current-step progress row instead of requiring the full desktop step rail.
- Keep troubleshooting links, but make them secondary after the step action, readiness and visual.
- Continue using `overflow-x-clip`; browser review found no horizontal overflow in the inspected sizes.

## Desktop recommendations

- Keep the desktop sticky step rail.
- Use the wider workspace for comparison and process learning.
- Show a compact process overview near the top so the user understands where the current step fits.
- Keep realistic images large enough to teach texture and state.
- Let the active step remain dominant; side content should support rather than compete.
- Use desktop for comparisons that are useful: rough vs mixed, underproofed vs ready vs overproofed, tight vs relaxed, good balling stop point.

## Calculator teaching assessment

The public Quick Dough Calculator is powerful and should remain separate from Pizza Plan. Its formula behavior should not change.

What works:

- Key values such as batch size, total dough, flour, water, salt and yeast are prominent.
- Result details are sticky on desktop.
- Beginner mode folds away more advanced formula controls.
- Advanced tools are optional rather than forced.

What needs improvement:

- The result panel explains the numbers, but not enough of their practical meaning.
- `Total dough` is prominent, but dough-ball weight and hydration need a clearer "what this means for handling" explanation.
- Beginner users need a simple result story: how much dough per pizza, what to mix, and what to expect.
- Enthusiasts need adjustment cues: wetter dough, stronger flour, longer fermentation, room versus cold.
- Pizza Nerd users can use baker's percentages, but the connection between input changes and dough behavior could be more explicit.

Recommended calculator role:

- Keep the calculator as the place for exact quantities.
- Add a compact teaching block near the result that explains dough-ball size, hydration and fermentation in practical language.
- Do not move calculator education into Pizza Plan.
- Do not change formulas, defaults, APIs or saved presets.

## Useful realistic image opportunities

The repo already has enough local realistic dough-guide assets for the next implementation patch. Reuse these before adding new assets:

- `guide-step-03-mix.webp` and `teaching-step-03-mix-before-after.webp` for rough-to-combined mixing.
- `teaching-step-04-rest-before-after.webp` for why rest changes texture.
- `teaching-step-05-develop.webp` for controlled structure.
- `teaching-step-06-bulk-before-after.webp` for gas and fermentation development.
- `teaching-step-08-ball-01-gather.webp` through `teaching-step-08-ball-05-stop.webp` for balling.
- `teaching-step-09-proof-states.webp` for proofing states.
- `teaching-step-10-warm-tight-relaxed.webp` for cold/tight versus workable dough.
- `teaching-step-11-underproofed.webp`, `teaching-step-11-ready.webp` and `teaching-step-11-overproofed.webp` for readiness.
- `teaching-step-12-release-scraper.webp` for scraper-assisted release.

The highest-value visual opportunity is not adding more images. It is arranging existing images into clearer compact teaching sequences.

## Decision table

| Area | Decision | Reason |
| --- | --- | --- |
| Twelve-step guide structure | Keep | It matches the dough process and is already linked from session-adjacent contexts. |
| `Do this now` / readiness / mistake / fix pattern | Keep | This is the strongest beginner-friendly part of the guide. |
| Selected guidance-level disclosure | Keep | It avoids showing all three levels at once and preserves shared preference behavior. |
| Hero opening | Improve | It introduces the guide, but does not yet answer the beginner's first practical question. |
| Mobile first screen | Improve | The current action can sit too low on longer steps. |
| Step visuals | Improve | Existing images are strong, but they need a clearer process overview and comparison role. |
| Troubleshooting links | Keep but shorten visually | They are useful but should remain secondary to the current action. |
| Calculator result panel | Improve | Results are prominent, but users need clearer explanation of what the amounts mean. |
| Calculator math and defaults | Keep unchanged | No problem identified in this audit scope. |
| Additional realistic assets | Defer | Existing local dough assets are sufficient for the next improvements. |

## Recommended final information hierarchy

For `/guides/dough`:

1. Hero: `Make the dough`
2. Quick answer: the shortest practical dough-making rule set for the selected level
3. Compact process overview: prepare, mix, rest/develop, ferment, ball, proof, readiness
4. Active step workspace:
   - Step title and summary
   - Do this now
   - Primary visual
   - You are ready when
   - Common mistake and fix
   - Optional selected-level detail
   - Troubleshooting link when relevant
5. Previous/next step controls

For `/calculator/quick` as the related public dough calculator:

1. Inputs remain unchanged.
2. Result panel keeps exact quantities.
3. Add a compact "what this result means" teaching block.
4. Keep advanced result detail behind existing disclosure patterns.

## Maximum three implementation patches

### Patch 458B: Add Dough guide quick answer and mobile hierarchy

Objective: add a concise selected-level quick answer near the top of `/guides/dough` and make the first mobile screen more action-first.

Scope:

- `/guides/dough` presentation only
- selected-level copy only
- focused Dough guide tests

No formula, route, Pizza Plan, header, navigation or footer changes.

### Patch 458C: Organize Dough guide process visuals

Objective: reuse the existing local realistic images to create a compact process overview and clearer step-specific visual teaching.

Scope:

- existing Dough guide visual presentation
- local image usage already in `public/dough-guide/`
- focused responsive and image tests

Do not add new image-generation work unless a genuine asset gap remains after reusing the current images.

### Patch 458D: Improve public Dough calculator result teaching

Objective: make `/calculator/quick` explain what the ingredient result means without changing calculator math.

Scope:

- Quick Dough Calculator result presentation
- selected-level teaching copy
- focused calculator presentation tests

Preserve formulas, defaults, APIs, saved presets and Pizza Plan workflow.

## Validation performed

- Focused source inspection of Dough guide route, client component, guide data, guide links and public Quick Dough Calculator.
- Focused test-file inspection of current Dough guide and calculator expectations.
- Browser review at 390x844, 430x740 and 1280x900 for `/guides/dough` and `/calculator/quick`.
- Browser review found no horizontal overflow on inspected routes and viewports.
- `git diff --check` to be run after this audit file is created.
