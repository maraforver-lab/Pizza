# Patch 472A: Toppings UX, Information Hierarchy and Learning Flow Audit

## 1. Executive Summary

The current `/toppings` page has strong raw material: realistic topping images, useful sauce and cheese calculations, meaningful moisture guidance, URL-safe state, and a practical final Pizza Plan handoff. The main UX problem is not content quality; it is priority.

The page currently behaves like three pages stacked together:

1. an editorial lesson about topping restraint,
2. a visual experiment/lab,
3. a detailed technical explanation of topping load, area, sauce, cheese, moisture and oven behavior.

The recommended future direction is **Concept A: Topping Assistant**.

Primary user intent should be:

> Choose toppings that bake well by balancing amount, moisture and coverage.

That means the page should lead with a compact answer, then a practical topping-balance tool, then deeper explanations only after the user has seen and adjusted the result.

The next implementation patch should be presentation-only. It should preserve topping calculations, URL state, presets, image assets, Pizza Plan integration and route behavior.

## 2. Current Problems

| Problem | Evidence | Impact |
| --- | --- | --- |
| Hero is too heavy for a visual lab | The page opens with a dark full-width hero and the headline `See what too much looks like.` | The first message is interesting but does not immediately say what the user can do. |
| The page asks the user to read before acting | `Central lesson`, Quick Answer, practical hierarchy and multiple image/lesson blocks appear before the deeper lab. | Mobile users scroll through several explanations before reaching practical controls. |
| The practical tool is framed as "existing deeper guidance" | Lab eyebrow says `Existing deeper guidance and references`. | The most useful interaction sounds secondary or legacy. |
| Central lesson competes with the tool | The dark hero contains a separate `Central lesson` panel. | The page has two opening messages before the user sees the practical choice. |
| Too many large cards | Quick Answer, practical hierarchy, lab result cards, controls, topped-area explanation, lessons, dark combined-load panel, reference gallery, related guides and final CTA all use substantial card surfaces. | The page feels overloaded rather than guided. |
| Generic next-topic navigation appears late | The page ends with `What should I learn next?` cards for Sauce and Ovens. | This pulls the user away after a toppings task instead of completing the current journey. |
| Guidance level changes copy, not overall density | Source renders selected-level Quick Answer and overload copy, but most deep sections are visible at every level. | Beginner still receives a dense page. |
| Client-only empty initial render risk | `ToppingBalanceLab` returns an empty `<main>` until client `ready` becomes true. | In the local in-app browser review, the route showed header plus empty main; this made pixel measurement unavailable and exposes a no-JS/slow-hydration weakness. |

## 3. User Intent Analysis

People do not mainly come to the Toppings page to read a broad essay. They are likely trying to answer:

1. What toppings should I use?
2. How much is too much?
3. Will this combination make the pizza wet or heavy?
4. What should I change before I bake?
5. Can I use this when making my pizza?

The best priority is a combination, but with a clear ordering:

1. **Balance toppings and moisture.**
2. Choose toppings that fit the pizza.
3. Learn the principles after the practical result is visible.
4. Use calculations as support, not the opening thesis.

Recommended user journey:

```text
I want toppings
->
Use a simple rule
->
Build or choose a topping set
->
Check amount, coverage and moisture
->
Adjust sauce, cheese, wet toppings or load
->
Plan a pizza
```

Current journey:

```text
Hero curiosity
->
Central lesson
->
Quick Answer
->
Balanced set guidance
->
Cheese/moisture/bake/finish lessons
->
Overload warning
->
Interactive lab
->
Area explanation
->
More lessons
->
Combined load
->
Oven interaction
->
Reference gallery
->
Related guides
->
Plan a pizza
```

The current journey has too many teaching stops before the main action.

## 4. Hero Recommendation

Current headline:

> See what too much looks like.

Assessment:

| Direction | Beginner clarity | Enthusiast usefulness | SEO usefulness | Visual strength | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Current: `See what too much looks like.` | Medium-low | Medium | Low | High curiosity | Replace. It is memorable but too narrow and negative. |
| Option A: `Build toppings that bake well.` | High | High | High | Medium-high | Recommended. It states the outcome and connects toppings to bake success. |
| Option B: `Choose toppings that fit your pizza.` | High | Medium | High | Medium | Good secondary copy, but less specific about moisture and bake behavior. |
| Option C: `See how topping choices change your pizza.` | Medium | High | Medium | High | Useful for a lab-first page, but less direct for beginners. |

Final recommendation:

Use **`Build toppings that bake well.`**

Supporting copy should explain that the page helps balance topping amount, sauce, cheese and moisture before baking.

The hero should become a compact Visual Lab introduction, not a dark marketing-style hero. The page already has strong realistic imagery inside the tool; the hero does not need to carry all visual weight.

## 5. Central Lesson Recommendation

Current central lesson:

> More toppings do not automatically create a better pizza. Balance comes from coverage, topped area, moisture, cheese behavior and oven heat working together.

Recommendation:

Move this idea into the compact Quick Answer or a short principle immediately before the balance tool. Do not keep it as a large hero-side card.

Disposition:

| Option | Decision | Reason |
| --- | --- | --- |
| Hero message | Reject | It is too abstract for the first screen and competes with the action. |
| Quick Answer | Adopt | It works as the core practical principle after the page promise. |
| Collapsed explanation | Partial | Deeper terms like topped area and oven heat can move into disclosures. |
| Removed | Reject | The idea is correct and valuable. The presentation is the problem. |

## 6. Quick Answer Recommendation

Current Quick Answer:

`How should I choose toppings?`

This should become the main opening teaching section after the compact page identity. It should be shorter and more action-oriented:

- one answer sentence,
- three compact rules,
- one primary action leading into the balance tool.

Recommended structure:

```text
Quick answer
How should I choose toppings?

Use one main flavour, keep visible space between ingredients,
and control wet toppings before they reach the oven.

1. Choose one main flavour
2. Leave visible sauce and open space
3. Drain or pre-cook wet ingredients

[Build my topping balance]
```

Mobile placement:

Quick Answer should fit high in the first screen and should not become another tall card wall.

## 7. Calculator Recommendation

The experiment/calculator is the most valuable feature because it turns the lesson into a decision. It should appear immediately after the Quick Answer and become the main page experience.

Recommended role:

- Not a hidden "deeper guidance" section.
- Not a pure calculator table.
- A **Topping Balance Checker** that shows the current visual result, amount/momentum, moisture risk and next adjustment.

Recommended placement:

| Viewport | Placement |
| --- | --- |
| Mobile | After compact Quick Answer, before detailed explanations. Result/visual first, then practical controls. |
| Desktop | In the first viewport with compact answer and controls/result visible together. |

The calculation model should remain unchanged:

- `calculateToppingBalance`,
- `parseToppingBalanceSearch`,
- `buildToppingBalanceSearch`,
- `toppingBalanceDefaultState`,
- preset state behavior,
- URL history updates.

## 8. Content Visibility Matrix

| Content | Current location | Recommendation | Reason |
| --- | --- | --- | --- |
| Page title/promise | Large dark hero | Must be visible, but compact | The user needs the task promise early. |
| `Central lesson` | Hero side card | Merge into Quick Answer | Correct idea, excessive opening weight. |
| `Start the experiment` | Hero CTA | Replace with one action: `Build my topping balance` | The page should use one dominant next action. |
| `See the balanced example` | Hero secondary button | Move into presets/tool | It changes lab state, not page-level navigation. |
| Quick Answer | Before practical hierarchy | Must be visible | This is the right opening learning unit. |
| Primary recommendation: "Less is usually better..." | Quick Answer card | Must be visible, shortened if needed | It is the clearest beginner rule. |
| Balanced topping set image | Practical hierarchy | Must be visible near tool | Strong teaching image, but should support the assistant flow. |
| Cheese and moisture | Practical hierarchy | Must be visible or compact | Essential topping success factor. |
| Before baking / after baking | Practical hierarchy | Collapse or compact below tool | Useful but not first-action critical. |
| Overloaded pizza warning | Dark section before lab | Move into balance result | It belongs when the user sees a heavy/wet state. |
| `Build and compare the topping load` lab | Mid-page | Must become main experience | This is the practical decision engine. |
| Presets | Lab controls | Must be visible | Good way to learn by comparison. |
| Pizza dimensions | Lab controls | Visible for Enthusiast/Pizza Nerd, collapsed for Beginner | Useful but not every beginner's first question. |
| Sauce and cheese controls | Lab controls | Must be visible | Core balance variables. |
| Drainage controls | Lab controls | Must be visible | Moisture control is central. |
| Additional topping load | Lab controls | Must be visible | Main experiment input. |
| Usable topped area/sauce density/cheese density/moisture cards | Lab result | Collapse or reduce by level | Important but too technical for every level. |
| `What to adjust next` | Lab result | Must be prominent | Best actionable output. |
| Topped area explanation | Lower card | Collapse under calculation details | Useful for Pizza Nerd; not early beginner content. |
| Sauce/Cheese/Drainage lesson cards | Lower section | Merge or collapse | Duplicates concepts already in Quick Answer/tool. |
| Combined load dark section | Lower section | Collapse or remove if result covers it | Repeats the main point after the tool. |
| Oven interaction | Lower section | Keep compact | Useful but secondary; link to Ovens only if needed. |
| Reference gallery | Lower section | Keep as optional visual reference | Valuable images, but it should not compete with the assistant. |
| Related guides: Sauce/Ovens | Near footer | Remove generic block | Related links are useful inline, not as a mini sitemap. |
| Final `Plan a pizza` CTA | Near footer | Keep compact | Correct workflow handoff. |

## 9. Guidance-Level Findings

Current source behavior:

- `experienceLevel` is read via `readExperienceLevelPreference`.
- `ToppingsQuickAnswer` uses selected-level copy.
- `OVERLOADED_PIZZA_COPY` uses selected-level copy.
- The lab, detailed metric cards, area explanation, lessons, combined load, oven interaction, reference gallery and related guide block remain broadly visible for every level.

Recommended model:

### Beginner

Show:

- compact page promise,
- Quick Answer,
- visual balance result,
- presets,
- sauce/cheese/topping-load basics,
- simple moisture warning,
- `What to adjust next`,
- compact `Plan a pizza`.

Hide or collapse:

- density values,
- topped-area formula,
- oven-transfer explanations,
- detailed reference gallery,
- technical vocabulary unless requested.

### Enthusiast

Show:

- Beginner content,
- practical controls,
- sauce and cheese ranges,
- moisture/drainage reasoning,
- compact comparison examples.

Collapse:

- formulas,
- detailed area math,
- deep oven/heat-transfer detail.

### Pizza Nerd

Show or make easily available:

- density values,
- usable topped area,
- combined load,
- thresholds,
- reference gallery,
- URL/state clarity.

Do not let technical data outrank the visual result or adjustment recommendation.

## 10. Visual Findings

The page uses the correct DoughTools palette and realistic imagery, but the composition is too heavy:

- dark hero,
- multiple large rounded cards,
- repeated shadows,
- several full-width teaching panels,
- dark overload and combined-load blocks,
- late related-learning block,
- final bright CTA.

The green glow/shadow effect appears to be intentional accent styling rather than a functional bug. However, it currently adds to the "too many highlighted things" problem. Future implementation should reduce accent intensity and reserve green/tomato states for real status, selected presets or actionable recommendations.

Button audit:

| Current button | Recommendation |
| --- | --- |
| `Start the experiment` | Replace with `Build my topping balance`; one primary action. |
| `See the balanced example` | Move into the preset controls; do not keep as hero-level secondary action. |

## 11. Image Findings

Existing Toppings imagery is strong and should be retained.

Inventoried local assets:

| Asset group | Paths | Finding |
| --- | --- | --- |
| Main comparison | `public/toppings/too-light.webp`, `balanced.webp`, `too-heavy.webp` | Useful comparison assets. Retain. |
| Diavola visual states | `public/toppings/diavola/*.webp` | Strong realistic lab imagery for too little, balanced, too much, wet overload and heavy load. Retain. |
| Example pizzas | `public/toppings/examples/*.webp` | Useful for selected pizza examples. Retain. |
| Teaching images | `public/toppings/teaching/*.webp` | Useful but currently contributes to long pre-lab teaching. Move/compact. |
| Reference images | `public/toppings/references/*.webp` | Excellent for sauce, cheese and mozzarella distinctions. Keep as optional reference gallery. |

Image recommendation:

- Do not add new images for Patch 472B.
- Do not replace current images.
- Reposition existing imagery so the first practical visual appears with the balance assistant.
- Keep reference images below or inside optional reference sections.

If later image work is considered, the only possible brief is a tighter mobile-first comparison strip showing balanced vs overloaded coverage, but current assets already cover that need.

## 12. Lower-Page Findings

Lower-page content has value but too much of it repeats the same principle:

- The area explanation is useful but technical.
- Sauce, cheese and drainage lessons repeat topics already taught by Quick Answer and controls.
- Combined load restates the lab output.
- Oven interaction is useful, but should be compact and secondary.
- Reference gallery is valuable as a visual dictionary.
- Related guides are too generic for the current task.

Recommendation:

Remove the generic `What should I learn next?` block in the implementation patch. Keep only contextual inline links where they directly support the current toppings decision, such as a short Sauce link near sauce/moisture content or an Ovens link in the oven interaction note.

## 13. Three Redesign Concepts

### Concept A - Topping Assistant

```text
Choose toppings

Quick rules

Build your pizza

Balance check

Continue
```

Evaluation:

- Best beginner clarity.
- Fits mobile-first use.
- Keeps the calculator as a helper, not a spreadsheet.
- Preserves learning while making it task-led.

Decision: **Recommended.**

### Concept B - Topping Lab

```text
Experiment

Change cheese/toppings

See balance result

Adjust
```

Evaluation:

- Strong for Enthusiast and Pizza Nerd.
- Risks feeling too experimental for beginners.
- Could over-prioritize controls and metrics over practical pizza-making.

Decision: Adopt parts inside Concept A.

### Concept C - Topping Guide

```text
Learn principles

Examples

Calculator

Application
```

Evaluation:

- Good for SEO and reading.
- Too passive for the current product need.
- Repeats the current issue of teaching before acting.

Decision: Reject as the primary structure.

## 14. Recommended Future Structure

Recommended Patch 472B page structure:

```text
Compact Visual Lab header
Build toppings that bake well.
Short promise and one action

Quick Answer
3 practical rules

Topping Assistant
Left/top: visual result and status
Right/below: presets and practical controls
What to adjust next

Optional guidance
Cheese and moisture
Before/after baking
Oven interaction

Reference visuals
Sauce / cheese / mozzarella examples

Compact Pizza Plan handoff
```

Desktop first viewport should show:

- title,
- Quick Answer or first rule,
- visual result,
- presets/controls,
- adjustment recommendation.

Mobile first viewport should show:

- compact title,
- quick rule,
- primary action or beginning of balance assistant.

## 15. Implementation Roadmap

### Patch 472B - Implement Approved Toppings UX Structure

Scope:

- presentation only,
- `/toppings`,
- Toppings components,
- focused responsive and semantic tests.

Required preservation:

- `calculateToppingBalance`,
- `parseToppingBalanceSearch`,
- `buildToppingBalanceSearch`,
- URL state,
- preset values,
- Pizza Plan link,
- existing local images,
- header, navigation and footer.

Implementation acceptance criteria:

1. Hero becomes compact and action-oriented.
2. Headline uses `Build toppings that bake well.`
3. Central lesson is merged into Quick Answer or a compact principle.
4. Quick Answer appears as the main opening section.
5. Balance assistant appears before long explanations.
6. Generic related-guide block is removed.
7. Beginner sees a shorter, clearer page.
8. Enthusiast gets practical adjustment context.
9. Pizza Nerd can still reach technical details.
10. Existing calculations and URL behavior remain unchanged.
11. Existing images remain local and useful.
12. No horizontal overflow at 390, 430, 1280 or 1440 widths.

Suggested future components:

| Component | Responsibility |
| --- | --- |
| `ToppingPageIntro` | Compact Visual Lab header and primary action. |
| `ToppingQuickAnswer` | Selected-level answer and three practical rules. |
| `ToppingAssistant` | Main result, image, status, presets and controls. |
| `ToppingBalanceResult` | Visual status, key metrics and next adjustment. |
| `ToppingControlPanel` | Sauce, cheese, drainage, topping load and geometry controls. |
| `ToppingDetailDisclosure` | Technical explanations and reference images by level. |
| `ToppingPlanHandoff` | Compact final Pizza Plan CTA. |

Avoid splitting state or duplicating calculations.

### Patch 472C - Production Verification

Scope:

- production verification only,
- `/toppings`,
- desktop and mobile,
- accessibility,
- responsive behavior,
- calculation/URL/Pizza Plan boundaries.

Required checks:

- default page,
- Beginner, Enthusiast and Pizza Nerd,
- balanced and overloaded presets,
- URL state restoration,
- mobile no-overflow,
- desktop first viewport,
- image loading,
- console/hydration errors,
- final `Plan a pizza` route.

## Validation Notes

Source inspection completed for:

- `app/toppings/page.tsx`,
- `app/toppings/layout.tsx`,
- `components/toppings/ToppingBalanceLab.tsx`,
- `lib/topping-balance-lab.ts`,
- `lib/topping-calculator.ts`,
- `lib/experience-levels.ts`,
- `tests/topping-balance-lab.test.ts`,
- `docs/experience-principles.md`,
- `docs/global-responsive-ux-rules.md`,
- `docs/visual-style-guide.md`,
- `docs/design-system.md`,
- `docs/sitewide-hero-and-imagery-system.md`.

Image inventory completed for `public/toppings/**`.

Browser review was attempted at 390x844, 430x740, 1280x900 and 1440x900 on local `/toppings`. The in-app browser returned the shared header and an empty `<main>` because the Toppings client component server-renders an empty main until client readiness. Console logs were empty and horizontal overflow was false for the empty shell. Detailed hierarchy findings therefore come from source inspection, existing tests and route structure, with the blank pre-hydration state recorded as a finding for Patch 472B to consider.

No production code, calculations, URL behavior, Pizza Plan integration, APIs, database files or migrations were changed.
