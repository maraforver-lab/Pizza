# Patch 459A - Toppings guide experience audit

Starting commit: `31579e37744739d5b5c299770b4355153e3f48db`

Original audit baseline: `b4c990155a987eaad75943cd8ee2c357b8c6c7fd`

Scope inspected:

- Route: `/toppings`
- Source files: `app/toppings/page.tsx`, `components/toppings/ToppingBalanceLab.tsx`, `lib/topping-balance-lab.ts`, `docs/research/topping-balance-sources.md`, `tests/topping-balance-lab.test.ts`
- Local assets: `public/toppings/**`

No production code, route, calculator, Pizza Plan workflow, header, navigation or footer changes were made.

## Executive Conclusion

`/toppings` is already a strong visual topping-balance lab. It teaches that sauce, cheese, extra toppings, topped area, mozzarella drainage and oven heat interact. The existing local images are realistic, useful and correctly people-free.

The main issue is that the page is not yet a beginner-first toppings guide. It answers "what happens if I add too much?" better than "which toppings should I use, how much should I use, and how do I apply them?" On mobile the page is very long, and the first practical answer is buried inside an experiment rather than stated as a quick starting rule.

Recommended direction: keep the existing lab and calculations, but add a compact beginner quick answer, reorganize repeated lesson sections into a shorter teaching hierarchy, and add a focused realistic visual sequence for topping application and overload examples.

## Current Page Structure

1. Hero: `See what too much looks like.`
2. Interactive lab: `Build and compare the topping load.`
3. Visual example with current result and realistic pizza image
4. Text-only too little / balanced / too much comparison
5. Current metrics: area, sauce density, cheese density, moisture risk
6. Controls: presets, pizza dimensions, sauce and cheese, cheese type, drainage, extra topping load
7. Topped area explanation
8. Three lesson cards: sauce, cheese, drainage
9. Combined load section
10. Oven interaction section
11. Reference image gallery
12. Common mistakes grid
13. Final `Plan a pizza` CTA
14. `SiteFooter`

## Strengths

- The core concept is excellent: the page teaches topping balance as a combined load rather than a single gram number.
- The lab is practical and interactive without touching Pizza Plan state.
- Topped-area density is useful because it explains why pizza size and clear rim change the amount of topping that feels balanced.
- Presets for `Too little`, `Balanced`, `Too much`, `Wet overload` and `Heavy topping load` are good teaching anchors.
- Realistic local images exist for Diavola states, balanced Margherita, balanced Marinara, sauce amount, cheese amount and mozzarella drainage.
- Source notes in `docs/research/topping-balance-sources.md` correctly frame grams as learning anchors rather than universal truths.
- Browser review found no horizontal overflow at the required viewports.
- The footer remains the final visible page element.

## Main Problems

1. The first-time user does not get a direct answer early enough.
   The hero says "See what too much looks like," but a beginner still needs a quick rule such as: start with one main topping, leave gaps, drain wet ingredients, keep sauce and cheese restrained, and add finishing toppings after baking when appropriate.

2. The page is more lab than guide.
   It is excellent for experimenting, but weaker at teaching the actual workflow: choose toppings, prepare wet toppings, apply sauce, apply cheese, place toppings, bake, finish.

3. Three guidance levels are not implemented on this page.
   The page does not render all three levels at once, but it also does not render selected Beginner / Enthusiast / Pizza Nerd educational variants. Source inspection found no shared experience-level preference usage in `ToppingBalanceLab`.

4. Topping application is missing.
   The page explains amounts and moisture, but does not clearly show or explain how to place toppings on the pizza: gaps, center restraint, rim clearance, heavy items distribution, or finishing toppings after bake.

5. "Which toppings should I use?" is underanswered.
   The page has cheese and load controls, but it does not give a simple beginner topping selection model such as dry/cured toppings are easier, wet vegetables need preparation, delicate greens often finish after baking, and one or two toppings is the safest starting point.

## Unnecessary Repetition

- `Too little`, `Balanced` and `Too much` repeat across presets, the text comparison cards, sauce lesson and cheese lesson. The repetition is understandable, but the page could teach this once visually and reuse a shorter explanation later.
- Moisture risk appears in the visual result, density cards, drainage lesson, combined load section, oven interaction and common mistakes. The concept is important, but mobile users meet the same idea many times before reaching application guidance.
- The common mistakes grid is valuable but broad; several items overlap with earlier sauce, cheese and moisture sections.

## Missing Information

- A beginner-safe default topping strategy.
- A clear distinction between bake-with toppings and finish-after-bake toppings.
- Direct examples of easy dry toppings versus higher-risk wet toppings.
- Practical topping preparation: pre-cook or drain mushrooms, blot mozzarella, avoid raw watery vegetables in heavy amounts.
- Application order and placement: sauce thinly, cheese in islands, toppings spaced, center kept light, rim left clear.
- How topping quantity changes bake result in plain beginner language before the lab.
- Guidance-level variants for Beginner, Enthusiast and Pizza Nerd.

## Mobile Findings

Browser review:

| Viewport | Scroll height | Approx. screens | Horizontal overflow | Observation |
| --- | ---: | ---: | --- | --- |
| 390x844 | 12,983 px | 15.38 | no | Very long. Visual result appears before controls, but the page still feels like a lab before a simple answer. |
| 430x740 | 12,431 px | 16.80 | no | Same issue; strong content but high cognitive load. |

Mobile-specific issues:

- The first practical action is not early enough. The user sees the hero and lab before a simple "start here" topping rule.
- Controls plus visual output are useful, but the controls section is a long stack.
- The reference gallery is late, so the strongest controlled teaching images are far down the page.
- The current mobile flow asks the user to experiment before it teaches the topping workflow.

Mobile-specific strengths:

- No horizontal overflow found.
- The current visual result appears before the control stack.
- Touch targets are generally comfortable.
- Lazy image loading works after scrolling.

## Desktop Findings

Browser review:

| Viewport | Scroll height | Approx. screens | Horizontal overflow | Observation |
| --- | ---: | ---: | --- | --- |
| 1280x900 | 6,375 px | 7.08 | no | The two-column lab layout works well. Below it, the page becomes a long sequence of large teaching blocks. |
| 1440x900 | 6,384 px | 7.09 | no | Spacious and readable, but still feels like a lab plus encyclopedia rather than a tight guide. |

Desktop-specific strengths:

- The lab's two-column layout is strong.
- The visual result and controls align well.
- The large reference images are useful at desktop width.

Desktop-specific issues:

- The area, lessons, combined load, oven interaction, gallery and mistakes sections create a long second half.
- Desktop could use richer comparison, but the richer comparison should be curated rather than every concept becoming a large card.

## Guidance-Level Findings

Current behavior:

- The page does not show `Beginner`, `Enthusiast` or `Pizza Nerd` educational sections.
- It therefore does not expose all three levels at once.
- It also does not adapt educational depth to the selected guidance level.

Recommended behavior:

- Beginner: one safe starting model, direct topping choices, clear amount and placement rules.
- Enthusiast: practical adjustments for moisture, cheese type, oven style and topping preparation.
- Pizza Nerd: density, topped area, combined moisture budget, oven evaporation and load trade-offs.

Do not create three duplicate pages. Use one shared page with selected-level copy around the existing lab.

## Complete Image Inventory

All files under `public/toppings/` were inspected. The active page uses the Diavola state series, the balanced Margherita and Marinara examples, and the controlled sauce, cheese and mozzarella references. The three root-level images remain local legacy assets and are not currently referenced by `/toppings`.

| File | Current use | What it teaches | Realistic | Accurate | Decision |
| --- | --- | --- | --- | --- | --- |
| `public/toppings/too-light.webp` | Legacy asset, not currently referenced by `/toppings` | Sparse topping coverage can look underbuilt | Yes | Directionally accurate, but mixed variables make it less precise than the active Diavola series | Retain in repo; do not use for new teaching unless no better asset exists |
| `public/toppings/balanced.webp` | Legacy asset, not currently referenced by `/toppings` | A restrained mixed-topping pizza | Yes | Useful balanced impression, but mushrooms make it unsuitable as a controlled cheese or sauce variable | Retain in repo; avoid using as a controlled reference |
| `public/toppings/too-heavy.webp` | Legacy asset, not currently referenced by `/toppings` | Overload and visual clutter | Yes | Accurate as a broad overload example, but changes several variables at once | Retain in repo; use only as a broad overload fallback |
| `public/toppings/diavola/diavola-too-little.webp` | Active Diavola visual state | Too little sauce, cheese and salami coverage | Yes | Accurate and useful for a sparse Diavola comparison | Retain |
| `public/toppings/diavola/diavola-balanced.webp` | Active default visual and Diavola thumbnail | Recommended Diavola coverage with visible sauce, cheese and salami spacing | Yes | Accurate and the strongest current general reference | Retain |
| `public/toppings/diavola/diavola-too-much.webp` | Active Diavola visual state | Excess sauce, cheese and salami coverage | Yes | Accurate for overload, though it changes several topping variables together | Retain |
| `public/toppings/diavola/diavola-wet-overload.webp` | Active Diavola visual state | Wet-looking cheese and visible moisture risk | Yes | Accurate for moisture risk, but it does not teach preparation before topping | Retain; supplement later with wet-ingredient prep images |
| `public/toppings/diavola/diavola-heavy-load.webp` | Active Diavola visual state | Dense salami and heavy topping load | Yes | Accurate for heavy pre-bake load | Retain |
| `public/toppings/examples/margherita-balanced.webp` | Active balanced example | Classic restrained tomato, fior di latte and basil | Yes | Accurate as a balanced finished-style reference | Retain |
| `public/toppings/examples/marinara-balanced.webp` | Active balanced example | Cheese-free tomato, garlic, oregano and oil restraint | Yes | Accurate as a balanced no-cheese reference | Retain |
| `public/toppings/references/sauce-light.webp` | Active reference gallery | Too little sauce coverage | Yes | Accurate controlled sauce reference | Retain |
| `public/toppings/references/sauce-balanced.webp` | Active reference gallery and reused by Sauce page | Thin, even sauce with clear rim | Yes | Accurate controlled sauce reference | Retain |
| `public/toppings/references/sauce-heavy.webp` | Active reference gallery and reused by Sauce page | Deep sauce layer and wet pools | Yes | Accurate controlled sauce reference | Retain |
| `public/toppings/references/cheese-light.webp` | Active reference gallery | Sparse cheese coverage | Yes | Accurate controlled cheese reference | Retain |
| `public/toppings/references/cheese-balanced.webp` | Active reference gallery | Restrained cheese islands with sauce still visible | Yes | Accurate controlled cheese reference | Retain |
| `public/toppings/references/cheese-heavy.webp` | Active reference gallery | Near-continuous cheese blanket | Yes | Accurate controlled cheese reference | Retain |
| `public/toppings/references/mozzarella-wet.webp` | Active reference gallery | Wet fresh mozzarella before baking | Yes | Accurate, practical and important | Retain |
| `public/toppings/references/mozzarella-drained.webp` | Active reference gallery | Drained fresh mozzarella before baking | Yes | Accurate, practical and important | Retain |

Image quality findings:

- The active images are realistic, local WebP assets and do not rely on external URLs.
- The Diavola series is the best existing good-versus-overload teaching set.
- The sauce, cheese and mozzarella references are strong controlled assets, but they appear late and usually one-at-a-time.
- The current asset set teaches amount and moisture better than it teaches the hand action of topping a pizza.
- No existing asset should be removed as part of the next implementation patches; the gaps are mostly presentation and missing teaching moments.

## Image-Gap Plan

Future image work should create only optimized local WebP assets. Images should remain people-free, hand-free, realistic, top-down or near top-down, and matched in lighting and crop to the current `public/toppings/` set.

| Missing teaching image | Current coverage | Recommended future asset |
| --- | --- | --- |
| Too little / recommended / too much topping | Diavola states exist, but the page shows mostly one active state at a time | Reuse the Diavola three-state series in a persistent comparison block before or near the lab; no new asset required unless another pizza style is needed |
| Correct cheese quantity and distribution | `cheese-light`, `cheese-balanced` and `cheese-heavy` exist | Reuse as an early compact cheese comparison; no new asset required |
| Wet versus properly drained mozzarella | `mozzarella-wet` and `mozzarella-drained` exist | Reuse earlier in the page; no new asset required |
| Balanced versus overloaded pizza | Diavola balanced, too-much, wet-overload and heavy-load exist | Reuse as a direct comparison; optionally add one non-Diavola overload WebP later if the page needs a less meat-focused example |
| Toppings placed before baking | Weak current coverage | Create `public/toppings/process/toppings-before-bake.webp`: sauce and cheese applied, a few toppings spaced with gaps and a clean rim |
| Finishing ingredients added after baking | Missing | Create `public/toppings/process/finish-after-bake.webp`: baked pizza with fresh basil/arugula/oil added after bake, no hands or people |
| Ingredients that should be pre-cooked | Missing | Create `public/toppings/process/precooked-wet-toppings.webp`: prepared mushrooms or vegetables shown dry and reduced beside raw watery equivalent |
| Even topping distribution with clear crust border | Weak current coverage | Create `public/toppings/process/even-topping-distribution.webp`: top-down pizza showing light center, spaced toppings and visible 1-2 cm crust border |

## Recommended Final Hierarchy

1. Hero
   - Keep the visual-lab identity, but make the promise slightly more beginner-practical.

2. Quick answer: `How should I top a pizza?`
   - One selected guidance-level answer.
   - Beginner default: use one or two toppings, leave gaps, drain wet ingredients, keep the center light.

3. Compact topping workflow
   - Choose toppings.
   - Prepare wet toppings.
   - Apply sauce and cheese.
   - Place toppings with gaps.
   - Finish after baking when needed.

4. Visual amount comparison
   - Too little / recommended / too much using existing or new realistic images.

5. Existing interactive topping balance lab
   - Keep formulas and controls unchanged.
   - Consider moving the controls and result under a clearer "Experiment with your pizza" heading.

6. Moisture and oven explanation
   - Merge sauce, cheese, drainage, combined load and oven interaction into a shorter progressive section.

7. Common mistakes
   - Keep, but reduce to the most actionable mistakes and link to troubleshooting for deeper diagnosis.

8. Final CTA and footer

## Decision Table

| Area | Decision | Reason |
| --- | --- | --- |
| Interactive lab calculation | Keep | It is unique, useful and already tested. |
| Diavola visual state series | Keep | Strongest current visual teaching asset. |
| Sauce/cheese/mozzarella reference gallery | Improve / move | Useful images, but currently late and one-at-a-time. |
| Topped area explanation | Keep but shorten | Valuable concept, but can be tied more directly to application amount. |
| Sauce/cheese/drainage lesson cards | Merge | They repeat the same too little / balanced / too much pattern. |
| Combined load and oven interaction | Merge | Important, but should become a shorter moisture-budget section. |
| Common mistakes grid | Shorten | Useful but too broad after several earlier sections. |
| Guidance-level support | Add | Current page does not adapt to Beginner / Enthusiast / Pizza Nerd. |
| Topping application visuals | Add | Biggest missing teaching moment. |
| Finishing toppings guidance | Add | Common real-world decision not currently visible. |

## Recommended Follow-Up Patches

### Patch 459B - Add Toppings quick answer and selected-level guidance

Objective: make `/toppings` immediately understandable before the lab.

Scope:

- Add a compact quick answer near the top.
- Use selected guidance-level copy only.
- Do not change calculations or lab controls.
- Keep mobile action-first.

### Patch 459C - Add topping application and amount visuals

Objective: add missing realistic teaching images and place them near the top.

Scope:

- Reuse existing Diavola and cheese/sauce assets where possible.
- Add only minimum missing local assets for topping placement, wet topping preparation and finishing toppings.
- Include too little / recommended / too much as a compact persistent visual comparison.

### Patch 459D - Shorten and reorganize lower Toppings sections

Objective: reduce repetition after the lab.

Scope:

- Merge sauce, cheese, drainage, combined load and oven interaction into one shorter progressive section.
- Shorten common mistakes.
- Preserve final CTA, footer, route and lab behavior.

## Browser Review Notes

Routes and viewports checked:

- `/toppings` at 390x844
- `/toppings` at 430x740
- `/toppings` at 1280x900
- `/toppings` at 1440x900

Findings:

- No horizontal overflow found.
- No console errors observed during the checked page loads.
- Default visual and reference images lazy-load correctly after scrolling.
- Preset checks loaded the Diavola `Too much` and `Wet overload` visual states.
- The Cheese gallery tab loaded the controlled cheese reference image.
- The page is long: about 15-17 screens on mobile and about 7 screens on desktop.

## Final Assessment

`/toppings` should not be rebuilt. It has a strong technical and visual foundation. The next work should turn it from a very good lab into a clearer teaching guide by adding a quick answer, selected-level guidance and practical topping-application visuals, then trimming repeated lower-page explanations.
