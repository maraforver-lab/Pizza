# Patch 457A - Sauce page UX, content and culinary guidance audit

## Executive conclusion

The current `/sauce` page is a strong sauce quantity tool, but it is not yet the clearest beginner-first sauce guide. It answers "How much sauce do I need?" early and accurately through `components/sauce/SauceCalculator.tsx`, using the canonical sauce model in `lib/pizza-sauce-calculator.ts`. It is also much shorter than the older article-heavy version described in Patch 382.

The main gap is order of help. A first-time user needs to choose a sauce method, decide cooked versus uncooked, understand which tomatoes to buy, and then calculate quantity. The page currently opens with the calculator before a decision guide. On mobile, the calculator's recipe/result column appears before the method controls, so a beginner can read the Classic Neapolitan answer before understanding that the page also supports Marinara and home-oven cooked sauce. Tomato buying guidance and salt details are behind the advanced disclosure.

Recommended direction: keep the calculator and the concise page length, but add a short "quick answer" decision layer above it; clarify the three sauce methods; move essential tomato, application and storage guidance out of hidden or low-priority sections; merge repeated moisture guidance; and remove redundant link/CTA weight. Do not change sauce formulas in the first implementation pass.

## Files and routes inspected

| Area | File or route |
| --- | --- |
| Public route | `/sauce` |
| Page source | `app/sauce/page.tsx` |
| Calculator component | `components/sauce/SauceCalculator.tsx` |
| Calculator logic | `lib/pizza-sauce-calculator.ts` |
| Legacy sauce helper | `lib/pizza-sauce.ts` |
| Focused tests | `tests/pizza-sauce-calculator.test.ts` |
| Research notes | `docs/research/pizza-sauce-sources.md` |
| Prior sauce audit | `docs/audits/patch-382-sauce-recipe-quantity-clarity.md` |
| Prior quantity audit | `docs/audits/patch-383-sauce-quantity-consistency.md` |

## Browser inspection

Local browser review used `http://127.0.0.1:3007/sauce`.

| Viewport | Document height | Screens | Horizontal overflow | Images | Primary observation |
| --- | ---: | ---: | --- | ---: | --- |
| 390 x 844 | 7,970 px | 9.44 | no | 0 | Long but usable; essential decision guidance is not first. |
| 430 x 740 | 7,694 px | 10.40 | no | 0 | Same order issue; user reaches secondary guidance late. |
| 1280 x 900 | 4,524 px | 5.03 | no | 0 | Calculator layout uses desktop width well, but dominates before decision support. |
| 1440 x 900 | 4,524 px | 5.03 | no | 0 | Same as 1280; page is compact enough, hierarchy needs sharper intent. |

Off-screen seasonal decoration SVGs were present in the active themed render, but `documentElement.scrollWidth` remained below viewport width at every inspected size. No production code was changed.

## Current page structure

1. Global header and navigation.
2. Breadcrumb and compact hero:
   - `Make the sauce, then measure it clearly.`
   - copy focused on recommended sauce per pizza, total batch and recipe steps.
3. `SauceCalculator`.
4. `Adjust the sauce`:
   - bigger or thicker pizza
   - fast high-heat bake
   - home oven or longer bake
5. `Texture and troubleshooting`:
   - four collapsed details for watery, thick, wet center and flat sauce.
   - CTA to pizza troubleshooting.
6. `Useful details without a second recipe`:
   - tomato solids
   - salt and acidity
   - storage
   - source/methodology link.
7. Related learning and final `Plan a pizza` CTA through `PublicPageEnding`.
8. Shared footer.

Several sections named in the patch prompt are not standalone sections in the current implementation. Classic Neapolitan, Marinara, home-oven cooked sauce, tomato selection, ingredient roles, sauce application and storage mostly live inside the calculator, advanced disclosure, notes cards or source link.

## What is already strong and should remain

- The calculator gives a clear amount answer near the top: sauce per pizza, pizza count and finished total.
- `lib/pizza-sauce-calculator.ts` is the right canonical source for sauce amounts and should remain untouched unless a later patch explicitly changes calculations.
- The page is shorter and more focused than the older pre-Patch-382 version.
- The dynamic recipe steps connect amount to actual preparation.
- Default amounts are tested and consistent with Patch 383:
  - Classic Neapolitan: 70 g per pizza.
  - Marinara: 80 g per pizza.
  - Home-oven cooked: 80 g per pizza.
- The page correctly links methodology and source support instead of pretending every home-oven adaptation is traditional regulation.
- Troubleshooting uses native `<details>`, which keeps secondary detail collapsible and keyboard-accessible.
- There is no horizontal overflow at the required viewports.

## Mobile findings

- The page is usable but still feels long on phone: about 9.4 screens at 390 x 844 and 10.4 screens at 430 x 740.
- The first screen answers quantity better than sauce choice. A beginner who asks "Which sauce should I make?" does not get a direct answer before the calculator.
- The calculator result/recipe column appears before the controls on mobile. That makes the default Classic answer visible before the user has chosen method, tomato type, coverage or pizza count.
- The sauce method options are visible near the top, but they are not framed as a decision: "raw high-heat tomato", "pizza marinara", and "home-oven cooked/reduced".
- Tomato buying guidance is too hidden. The string `Tomato type` is not in visible body text until the advanced disclosure is opened, and the notes section only mentions tomato solids late in the page.
- Storage appears late and is too small for a food-safety topic.
- The four troubleshooting details are compact, but moisture advice appears in both `Adjust the sauce` and troubleshooting, which increases cognitive load.
- Related learning plus final CTA plus footer make the final part feel heavier than the core page needs.

## Desktop findings

- Desktop width is used reasonably well. The calculator's two-column layout gives controls and output enough room.
- The hero plus calculator consumes the correct amount of attention for a tool page, but the page lacks a pre-calculator decision summary.
- The H1 wraps to three lines on wide desktop because of constrained width. It is not broken, but the headline could be more direct.
- The calculator card is visually dominant. That is good for quantity, less good for sauce-method selection.
- The later three-card sections are easy to scan but repeat some ideas that could be folded into a tighter "avoid wet or burnt pizza" block.
- There are no sauce images. This avoids decorative clutter, but the page does not visually teach sauce texture or application amount.

## Culinary-content findings

### Sauce choice and cooked versus uncooked

Current content supports three methods, but the method names assume some pizza knowledge. A beginner may not know that `Marinara` means a cheese-free tomato pizza with garlic, oregano and oil, not a jarred pasta sauce. The page should explicitly distinguish:

- Margherita tomato base: simple tomato and salt, with basil and oil added as toppings.
- Pizza Marinara: tomato, garlic, oregano and oil, normally no cheese.
- Home-oven cooked sauce: a practical DoughTools adaptation for lower heat or longer bakes.

Source support:

- `docs/research/pizza-sauce-sources.md` cites AVPN regulations and recipe guidance for high-heat Neapolitan preparation and tomato as a topping rather than long-cooked pasta sauce.
- The same research notes cite AVPN "Marinara and her sisters" and Ooni AVPN-standard Marinara guidance for tomato, garlic, oregano and oil.
- The research notes label home-oven cooked sauce as DoughTools practical interpretation, not as AVPN tradition.

### Tomato selection

The calculator supports San Marzano, whole peeled, crushed, passata and fresh tomato. That is useful, but the buying guidance is not visible enough. A beginner should see a simple hierarchy before or beside the calculator:

1. Start with good canned whole peeled tomatoes or San Marzano-style tomatoes when available.
2. Use crushed tomato or passata when texture and brand quality are reliable.
3. Use fresh tomatoes only when they are ripe and flavorful.
4. Avoid watery, heavily seasoned or sweetened products as the default.

Source support: `docs/research/pizza-sauce-sources.md` supports tomato type as a guidance and salt-ratio input, while labeling product quality and home adaptations as DoughTools practical interpretation.

### Salt and quantity

The calculator's grams and salt percentages are useful, but salt precision should stay practical. For beginners, show the starting amount and remind them to taste carefully, especially with salty cheese or cured toppings. Keep percentage detail available for enthusiasts and Pizza Nerds.

Source support:

- `docs/audits/patch-382-sauce-recipe-quantity-clarity.md` documents the calculator as the canonical amount source for `/sauce`.
- `docs/audits/patch-383-sauce-quantity-consistency.md` documents finished sauce total, preparation total, raw tomato requirement and shopping purchase quantity.
- `tests/pizza-sauce-calculator.test.ts` verifies method defaults, reserve behavior, salt ratios and can rounding.

### Basil, oil, garlic, oregano, sugar and tomato paste

Current calculator behavior is directionally right:

- Classic Neapolitan keeps basil and oil as topping guidance, not blended into the sauce.
- Marinara adds garlic, oregano and oil.
- Home-oven cooked sauce can include practical seasonings.

The page should add clearer qualification:

- Sugar should not be a default fix. It may mask weak or too-acidic tomatoes, but better tomato selection and careful salt balance should come first.
- Tomato paste should not be a default pizza-sauce shortcut. It can help thicken a weak home-oven sauce, but too much can taste cooked, sweet or heavy.
- Garlic and oregano belong naturally to Marinara and optional home-oven profiles, not the default Margherita tomato base.

Source support: AVPN and Ooni Marinara notes in `docs/research/pizza-sauce-sources.md` support garlic and oregano for Marinara. The absence of sugar/tomato paste as default traditional guidance should be handled as DoughTools practical interpretation, not as an invented rule.

### Moisture and wet or burnt pizza

Current advice is useful but scattered. The page should more directly connect sauce texture, amount, cheese moisture, topping moisture, oven heat and baking surface. The beginner version should be simple:

- drain watery tomatoes;
- use less sauce when toppings or cheese are wet;
- leave the rim clear;
- preheat the baking surface properly;
- for home ovens, use a slightly tighter sauce and watch top/bottom heat balance.

Source support: `docs/research/pizza-sauce-sources.md` supports high-heat Neapolitan context and DoughTools practical home-oven interpretation. Patch 450F home-oven guidance is outside this audit's scope, but the sauce page can link to `/ovens` instead of duplicating oven setup.

### Storage and food safety

The current storage note is too small. It correctly warns that cooked sauce must cool before refrigeration and that unsafe sauce should be discarded, but storage belongs in a more visible final safety section.

Source support: `docs/research/pizza-sauce-sources.md` cites USDA leftovers guidance for prompt refrigeration, safe handling, 3-4 days refrigerated leftovers and 3-4 months frozen leftovers. If the page uses those times, it should clearly label them as general leftover guidance and avoid implying that all homemade sauce has identical safety history.

## User-journey answers

| Question | Current answer quality | Finding |
| --- | --- | --- |
| Which sauce should I make? | Partial | Three methods exist, but no top-level decision guide explains who should choose which. |
| Should I cook it or leave it uncooked? | Partial | Raw versus cooked appears in method labels and home-oven copy, but the distinction should be direct before the calculator. |
| Which tomatoes should I buy? | Weak | Tomato type is mostly hidden in advanced controls; visible `Tomato solids` note is late and not a buying guide. |
| How much sauce do I need? | Strong | Calculator answers this early and clearly. |
| How do I prepare it? | Strong | Dynamic recipe steps are useful and connected to the batch. |
| How much goes on one pizza? | Strong | `Use X g on each pizza` is explicit. Add a short spreading/application note. |
| How do I avoid a wet or burnt pizza? | Partial | Good corrections exist but are split between adjustment and troubleshooting sections. |
| How should I store the sauce? | Partial | Present, but late and too small for safety. |

## Beginner, Enthusiast and Pizza Nerd requirements

### Beginner

Needs one clear route through the page:

- choose the method by oven and pizza style;
- buy reliable canned whole peeled tomatoes unless they know a better product;
- use the calculator defaults;
- follow short preparation steps;
- apply the grams per pizza lightly;
- avoid watery toppings and unsafe storage.

Avoid burdening beginners with salt-percentage ranges, reduction math, can rounding and advanced tomato comparisons before the first recipe.

### Enthusiast

Needs practical decision support:

- compare raw high-heat sauce, Marinara and home-oven cooked sauce;
- understand tomato texture differences;
- adjust salt, reserve and coverage;
- fix watery center, flat flavor and thick sauce;
- calibrate sauce amount to oven, cheese and toppings.

### Pizza Nerd

Needs concise technical depth without taking over the page:

- finished total versus preparation total versus raw tomato requirement;
- reduction percentage and home-oven moisture management;
- salt ranges by tomato type;
- tomato solids and passata/crushed/whole peeled trade-offs;
- sauce load as part of top-bottom heat balance.

One shared page should progressively reveal this depth. Do not create three duplicate sauce pages.

## Decision table

| Decision | Current element | Recommendation | Reason | Where useful information remains |
| --- | --- | --- | --- | --- |
| Keep | `SauceCalculator` and formulas | Keep | It is the page's strongest tool and is already tested. | Same component and `lib/pizza-sauce-calculator.ts`. |
| Keep | Dynamic `How to make pizza sauce` steps | Keep and lightly clarify | They connect amount to action. | Calculator output. |
| Keep | Source and methodology link | Keep | Sauce claims need clear provenance. | Short source note near the end. |
| Improve | Hero | Make it decision-first, not only amount-first | H1 is clear but not the user's first sauce decision. | Hero plus quick answer block. |
| Improve | Method labels | Clarify Classic, Pizza Marinara and Home-oven cooked | Reduces beginner confusion around Marinara and cooked sauce. | Calculator method buttons and quick answer. |
| Improve | Tomato guidance | Move essential buying guidance out of hidden controls | Buying tomatoes is a core user question. | New tomato buying mini-section or quick answer. |
| Improve | Storage | Make food-safety guidance visible | Current note is too small for safety. | End-of-page safety section. |
| Merge | `Adjust the sauce` and `Texture and troubleshooting` | Merge into one practical "avoid wet or burnt pizza" section | Both discuss moisture/oven/topping corrections. | Combined section with concise problem/action rows. |
| Merge | `Tomato solids`, `Salt and acidity`, `Storage` notes | Split into tomato buying and storage/safety; fold salt into calculator helper | Notes are useful but too low-priority and mixed. | New tomato and storage sections; calculator detail disclosure. |
| Move | Sauce method decision | Move above calculator | User should choose method before calculating. | Quick answer section before calculator. |
| Move | Tomato type choice | Move visible summary above or inside top calculator area | Advanced disclosure hides buying decision. | Compact visible tomato buying guidance plus existing select. |
| Remove | Separate `Adjust the sauce` card section as its own full section | Remove as standalone | It duplicates troubleshooting and stretches page length. | Its useful content moves to quick answer and avoid-wet/burnt section. |
| Remove | Standalone `Useful details without a second recipe` section | Remove as standalone | It mixes unrelated details and appears late. | Tomato solids moves to tomato buying; salt moves to calculator helper; storage moves to storage/safety. |
| Remove | Duplicate troubleshooting CTA pressure | Keep either compact troubleshooting link or related card, not both | The page currently links troubleshooting once inside the section and again in related learning. | Keep one curated related link or one inline CTA. |
| Remove | Broad related-learning block if page remains long | Reduce to one or two contextual links | Sauce page already has final CTA and footer. | Keep `/ovens` and `/toppings`, or move troubleshooting link into the problem section. |
| Add | Quick answer method selector/decision block | Add | Answers sauce choice, cooked/uncooked and pizza type immediately. | New top section before calculator. |
| Add | Tomato buying hierarchy | Add | Answers what to buy before advanced controls. | New concise section, supported by source notes. |
| Add | Sauce application note | Add | Gives "how much on one pizza" plus how to spread it. | Calculator output or short section. |
| Add | Visible storage and food-safety section | Add | Food safety should not be buried. | New compact section near the end. |

## Exact sections to remove

These are recommendations for later implementation, not changes made in this audit.

1. Remove `Adjust the sauce` as a standalone section.
   - Keep the useful content by moving:
     - `Bigger or thicker pizza` into calculator helper copy.
     - `Fast high-heat bake` into the quick answer and method guidance.
     - `Home oven or longer bake` into the cooked-sauce decision.

2. Remove `Useful details without a second recipe` as a standalone section.
   - Keep the useful content by moving:
     - `Tomato solids` into a visible tomato buying/texture block.
     - `Salt and acidity` into calculator detail helper text.
     - `Storage` into a dedicated storage and food-safety block.

3. Remove one duplicate troubleshooting path.
   - Either keep the inline `Open deeper troubleshooting` CTA and remove the related-learning card that links to the same route, or keep the related-learning card and remove the inline CTA.
   - Prefer keeping the inline CTA because it appears where the problem is being diagnosed.

4. Remove or shrink the current related-learning block if the page gains the recommended quick answer and storage blocks.
   - Keep the final `Plan a pizza` action.
   - Keep methodology link.
   - Keep only the most relevant learning links, likely `/ovens` and `/toppings`.

## Exact sections to merge or shorten

1. Merge sauce amount adjustment and troubleshooting into `Avoid a wet or burnt pizza`.
   - Include problem/action rows:
     - watery tomato -> drain or reduce;
     - wet center -> reduce sauce and drain toppings;
     - burnt base with pale top -> use less sauce or adjust heat through oven guidance;
     - flat flavor -> improve tomato, salt carefully, avoid default sugar.

2. Shorten method explanations.
   - Each method needs one purpose, one preparation style and one "best for" line.
   - Keep deeper details in calculator disclosures or methodology.

3. Shorten repeated moisture language.
   - Mention moisture once in method selection, once in troubleshooting.
   - Avoid repeating "cheese moisture, topping moisture, oven heat" in multiple card groups.

## Exact information to add

1. A top quick answer:
   - If using a fast pizza oven or very hot steel: use Classic raw tomato base.
   - If making pizza marinara: use tomato, garlic, oregano and oil; usually no cheese.
   - If baking in a home oven or fighting wet centers: use a gently cooked/reduced sauce.

2. A tomato buying hierarchy:
   - good canned whole peeled or San Marzano-style first;
   - crushed/passata when quality is reliable;
   - fresh only when ripe and flavorful;
   - avoid watery, over-seasoned or sweetened products as the default.

3. A short application rule:
   - measure the grams per pizza;
   - spread thinly from the center outward;
   - leave the rim clean;
   - use less sauce for wet toppings or longer bakes.

4. Storage and food safety:
   - refrigerate promptly in a clean covered container;
   - cool cooked sauce before refrigerating;
   - freeze if not using soon;
   - discard sauce with unsafe handling history, mold, off smell or visible spoilage;
   - if exact storage times are shown, cite them as general USDA leftover guidance.

5. Optional nerd detail:
   - finished total, preparation total and raw tomato requirement mean different things.
   - reduction percentage matters only for cooked sauce.

## Recommended final information hierarchy

1. Hero:
   - Direct promise: choose the sauce method, calculate the amount and make it safely.
   - Primary action can scroll to calculator or simply let the calculator follow.

2. Quick answer:
   - Three method cards:
     - Classic raw tomato base
     - Pizza Marinara
     - Home-oven cooked sauce
   - Each card: best for, cook/uncooked, key ingredients.

3. Sauce calculator:
   - Keep current formulas.
   - Show method choice, pizzas and per-pizza amount before the recipe output on mobile.
   - Keep finished total, preparation reserve and ingredients.

4. Buy the tomatoes:
   - concise hierarchy and texture notes.

5. Make and apply the sauce:
   - preserve dynamic recipe steps.
   - add one spreading/application note.

6. Avoid a wet or burnt pizza:
   - merged correction section.

7. Store safely:
   - compact but visible.

8. Sources and methodology:
   - source link and short provenance note.

9. Final action:
   - `Plan a pizza`.

10. Footer.

## Proposed calculator position and role

The calculator should remain high on the page, but it should follow a compact decision guide. Its role should be:

- calculate per-pizza and batch amount;
- provide the method-specific recipe;
- expose advanced controls for tomato type, salt, reserve and reduction;
- remain the canonical quantity tool.

It should not carry the full responsibility for teaching sauce choice, tomato buying and food safety.

## Recommended mobile layout

1. Hero.
2. Quick answer method cards in a compact stacked group.
3. Calculator controls first:
   - method;
   - pizzas;
   - sauce per pizza;
   - coverage.
4. Calculator result and recipe.
5. Tomato buying.
6. Avoid wet/burnt pizza.
7. Storage/safety.
8. One small related-learning row, final CTA and footer.

Target: keep the revised page near the current length even after adding decision guidance by removing the standalone adjustment and notes sections.

## Recommended desktop layout

1. Hero with concise text.
2. Three quick-answer cards across the page.
3. Calculator in the current two-column layout.
4. Two-column content below:
   - tomato buying and application;
   - avoid wet/burnt pizza and storage.
5. Compact source/methodology note.
6. Final CTA and footer.

Desktop should avoid rebuilding the page as an encyclopedia. Use width for comparison and scanning, not for more sections.

## Research support for material recommendations

| Recommendation | Supporting repository source |
| --- | --- |
| Keep high-heat raw tomato guidance for Neapolitan-style pizza | `docs/research/pizza-sauce-sources.md`, AVPN regulations and AVPN recipe notes. |
| Clarify Marinara as tomato, oil, garlic and oregano | `docs/research/pizza-sauce-sources.md`, AVPN Marinara notes and Ooni AVPN-standard Marinara notes. |
| Label home-oven cooked sauce as an adaptation | `docs/research/pizza-sauce-sources.md`, DoughTools practical interpretation. |
| Keep calculator defaults and amount semantics | `docs/audits/patch-382-sauce-recipe-quantity-clarity.md`, `docs/audits/patch-383-sauce-quantity-consistency.md`, `tests/pizza-sauce-calculator.test.ts`. |
| Keep grams as primary and cans/cloves/leaves as helpers | `docs/research/pizza-sauce-sources.md`, DoughTools practical interpretation; Patch 382 audit. |
| Make storage/leftover safety more visible | `docs/research/pizza-sauce-sources.md`, USDA leftovers and food safety notes. |

## Prioritized implementation plan

Maximum three implementation patches:

### Patch 457B - Reorder Sauce page around a quick answer

Objective: make `/sauce` answer sauce choice, cooked versus uncooked and tomato buying before the calculator without changing formulas.

Scope:

- add quick answer method cards;
- add visible tomato buying guidance;
- merge/remove standalone `Adjust the sauce` and `Useful details` sections;
- keep calculator behavior unchanged;
- update focused Sauce page tests.

### Patch 457C - Polish Sauce calculator decision flow

Objective: make the calculator easier to use after the quick answer.

Scope:

- clarify method labels and helper copy;
- ensure mobile users see method controls before the default recipe result;
- keep advanced tomato/salt/reduction controls available;
- preserve all formula tests and canonical amount behavior.

### Patch 457D - Add final sauce application, safety and source polish

Objective: finish the guide layer without expanding the page into an encyclopedia.

Scope:

- add compact sauce application guidance;
- add visible storage and food-safety guidance;
- reduce duplicate troubleshooting and related-learning links;
- keep source/methodology connection accurate;
- run focused browser checks for mobile and desktop.

## Acceptance criteria for future implementation

1. A beginner can choose a sauce method before using the calculator.
2. Raw versus cooked sauce is explicit.
3. Marinara is clearly a pizza style/profile, not generic pasta sauce.
4. Tomato buying guidance is visible without opening advanced controls.
5. Calculator formulas and amount semantics remain unchanged unless separately approved.
6. Moisture troubleshooting appears once in a compact practical sequence.
7. Storage and food-safety guidance is visible.
8. Page length does not grow beyond the current practical range.
9. Mobile keeps no horizontal overflow.
10. Desktop uses width for scanning, not extra encyclopedia content.

## Final audit recommendation

Proceed with Patch 457B first. The safest first step is copy and hierarchy work around the existing calculator. Avoid calculator logic changes until the page clearly answers the beginner journey in the right order.
