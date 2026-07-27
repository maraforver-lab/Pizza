# Patch 474A: Pizza Styles UX And Decision Flow Audit

## 1. Executive Summary

The current `/styles` page is accurate and visually stronger than it was before Patch 468B. The early seven-style visual comparison now helps users recognize the subject quickly, and the page correctly distinguishes the one currently plan-supported style from learning-only styles.

The main UX issue is that the page still behaves more like a style atlas than a decision tool. A user who arrives with the practical question "Which pizza style should I make, and what does that choice change?" sees many style cards, support badges and details before the page asks what result they want.

Recommendation:

- Keep all seven existing style photos.
- Keep the compact non-photo learning hero model.
- Change the future page hierarchy into a Pizza Style Assistant.
- Move goal-based choice before the full detailed comparison.
- Make support status clear once near the decision point, then repeat only where it changes the next action.
- Keep detailed technique and origin context secondary.
- Preserve all current data, presets, routes, images and Pizza Plan boundaries.

No production code, data, assets, routes, SEO, Pizza Plan behavior or calculations changed in this audit patch.

## 2. Current UX Problems

The page contains useful parts, but their current order makes the user work harder than necessary.

1. The hero says "Choose the pizza style you want to make", but the first practical choice tool is below the full detailed comparison.
2. The visual comparison identifies styles early, but it does not help users choose by goal, oven or result.
3. The detailed comparison appears before the goal guide, so a beginner has to process seven technical cards before seeing the friendliest decision aid.
4. Support status appears often: in the comparison intro, support callout, style cards and goal guide cards. The truth is important, but repetition adds visual noise.
5. The "What changes in practice" section is useful but arrives after the goal guide and detailed comparison, when it could be summarized earlier as the reason style choice matters.
6. Technique notes are correctly collapsed, but the page still has a high section and card count before the final workflow handoff.
7. The final CTA is accurate, but it appears very late on mobile.

## 3. User Intent Analysis

Primary user intent should be:

**Choose a pizza style that fits the user's desired result, oven reality and current DoughTools planning support.**

Intent ranking:

| Intent | Priority | Finding |
| --- | --- | --- |
| Choose a style | Primary | This is the core user job. The page should ask what result the user wants before presenting the full reference set. |
| Compare characteristics | Secondary | Comparison matters, but only after the user has a short list or direction. |
| Learn history or technique | Tertiary | Useful for Pizza Nerd users and SEO depth, but not the first task. |
| Start a supported Pizza Plan | Boundary action | Important, but must be honest: current Pizza Plan support is Neapolitan-style only. |

Ideal journey:

```text
What kind of pizza do I want?
-> Which styles match that goal?
-> Which of those fit my oven and topping plan?
-> What changes in dough, bake and toppings?
-> Can DoughTools plan this style today?
-> Plan the supported pizza or keep learning
```

Current journey:

```text
Page title
-> style thumbnail links
-> seven detailed comparison cards
-> goal guide
-> what changes in practice
-> optional technique notes
-> broad focused links
-> final Plan a pizza CTA
```

The current page answers the right topic, but it delays the user's actual decision.

## 4. Hero Recommendation

Current hero:

`Choose the pizza style you want to make.`

Options reviewed:

| Option | Copy | Strength | Weakness | Recommendation |
| --- | --- | --- | --- | --- |
| A | `Choose the pizza style that fits your oven and goal.` | Best practical orientation; names the two constraints that matter. | Slightly less casual. | Adopt. |
| B | `What kind of pizza do you want to make?` | Friendly and beginner-clear. | Does not expose oven fit or planning limits. | Adopt with modification inside assistant section. |
| C | `Compare pizza styles before you choose.` | Accurate for current page. | Keeps page in comparison/reference mode rather than decision mode. | Do not use as primary hero. |

Recommended future hero:

- Eyebrow: `Pizza Styles`
- Title: `Choose the pizza style that fits your oven and goal.`
- Body: Short explanation that styles change crust, oven fit, bake behavior and topping load.

Do not add a large single-style hero photo. One hero image would imply one canonical style, while the page's job is comparison and selection.

## 5. Pizza Plan Support Boundary

Current source truth:

- `plannerSupportedPizzaStyleIds` is exactly `["neapolitan"]`.
- `pizzaStyleSupportSummary` says DoughTools pizza plans currently support Neapolitan-style pizza for home ovens and pizza ovens.
- `pizza-styles.ts` still contains legacy/preset calculator data for Neapolitan, Contemporary, New York, Roman thin, Detroit and Sicilian.
- `pizza-style-education.ts` contains seven educational style families, including Roman al Taglio as learning-only.

Audit finding:

The current page is truthful but repetitive. Users need the support boundary before they decide whether to plan now, but they do not need a large badge cluster repeated on every surface.

Recommended future model:

1. Show one concise support note near the Style Assistant result:
   `DoughTools can plan Neapolitan-style pizza today. Other styles are learning references.`
2. Keep a compact status label on individual style detail cards.
3. Do not show unsupported-style "Plan" CTAs.
4. Do not pass selected unsupported styles into Pizza Plan.
5. Do not blur the distinction between educational style pages and Pizza Plan generation.

## 6. Visual Comparison Audit

The early `PizzaStyleVisualComparison` is a good improvement from Patch 468B. It reuses all seven existing local WebP assets, keeps thumbnails compact and links to each style anchor.

Decision:

- Retain the early visual comparison.
- Do not turn it into a large hero.
- In the next implementation, place it inside or directly after the goal-first assistant so images help the user decide, not merely browse.

Alternatives:

| Model | Finding | Recommendation |
| --- | --- | --- |
| Keep all seven visible | Good for recognition and completeness. | Retain, but connect to goal choice. |
| Curate only first few styles | Could reduce height, but hides legitimate choices. | Reject for now. |
| Short goal question first | Best answer to the user's practical intent. | Adopt. |
| Comparison strip plus selected detail panel | Strong future interaction if kept simple. | Prototype in 474B if low risk. |

## 7. Detailed Comparison Matrix

| Content | Current location | Must be visible | Show after selection | Collapse | Remove | Reason |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Style image | Early strip and style data | Yes | Yes | No | No | Style is visual; images teach shape, rim and format. |
| Style name | Early strip and cards | Yes | Yes | No | No | Core navigation label. |
| Support status | Intro, cards, goal guide | Yes, once early | Yes | No | No | Needed for honest next action, but current repetition can be reduced. |
| Result/description | Detailed cards | Yes | Yes | No | No | Helps the user choose. |
| Oven fit | Detailed cards | Yes | Yes | No | No | Oven is a primary constraint. |
| Crust and texture | Detailed cards | Yes | Yes | No | No | Core comparison dimension. |
| Thickness and shape | Style data, partly visible through image | Yes | Yes | No | No | Essential for style recognition. |
| Bake behavior | Detailed cards | Yes | Yes | No | No | Explains what changes in practice. |
| Topping load | Detailed cards | Yes | Yes | No | No | Connects to Toppings and prevents bad choices. |
| Best suited for | Detailed cards | Yes | Yes | No | No | Strong decision language. |
| Hydration/default data | Detailed cards | No | Maybe | Yes | No | Useful, but not beginner-first. |
| Preset availability labels | Cards | No | Yes | Maybe | No | Keep truthful, reduce prominence. |
| Detailed technique | Technique notes | No | Maybe | Yes | No | Correct as optional detail. |
| Common confusion | Technique notes | No | Maybe | Yes | No | Useful, but secondary. |
| Historical/origin context | Style data, not prominent | No | Maybe | Yes | No | Good enrichment, not primary decision. |
| Topping names not dough styles note | Detailed comparison | Yes | Maybe | No | No | Prevents a real product misunderstanding. |
| Broad focused-guide links | Lower page | No | No | Maybe | Possibly | Current group behaves like a mini sitemap; should become contextual or shorter. |

## 8. Goal Guide Audit

Current `PizzaStyleGoalGuide` is the closest thing to the right future product direction. It asks practical goal questions:

- soft and fast-baked
- expressive airy rim
- foldable slice
- crispy cheese edges
- extremely thin and crisp
- airy pan pizza
- thick bakery-style square

Finding:

The goal guide should become the main opening decision tool, not a section after the detailed comparison.

Recommendation:

- Promote it into a `PizzaStyleAssistant` section immediately after the hero.
- Use the question `What result do you want?`
- Keep full-card anchor links or selection controls.
- Show the recommended style result and support boundary immediately.
- Keep the visual thumbnails close to the goal options.
- Do not create new style logic or persistence.

## 9. Technique Notes Audit

`PizzaStyleTechniqueNotes` is already collapsed and keyboard accessible through buttons with `aria-expanded`, `aria-controls`, and a region panel.

Recommendation:

- Keep as optional detail.
- Move below the primary comparison or selected style detail.
- For Beginner, keep collapsed and label as extra context.
- For Enthusiast, keep available after the practical comparison.
- For Pizza Nerd, allow richer expansion but do not put it above the choosing task.

## 10. "What Changes In Practice" Audit

The section explains that style affects dough, oven, sauce and toppings. That idea is important, but the current placement makes it feel like another full section after the user has already read the comparison.

Recommendation:

- Keep the concept.
- Summarize it earlier as three compact "what changes" points inside the assistant:
  - Dough and fermentation
  - Oven and bake
  - Sauce and toppings
- Keep links only where they directly support the selected style decision.
- Avoid a second full card group if the same idea is already covered by the selected style detail.

## 11. Lower-Page Audit

Current lower page includes:

- Technique notes
- Focused guides
- Final Plan a pizza CTA
- Footer

Findings:

- The final Plan a pizza CTA is useful and truthful.
- The focused-guide group is broad and partly duplicates the normal Guide ecosystem.
- If kept, related links should be no more than three and directly tied to style choice: Ovens, Toppings and Dough are the strongest.
- Sauce can remain contextual only when the selected style or comparison specifically raises sauce/moisture.

Recommendation:

- Remove or shrink the broad "Use the dedicated guide for the next detail" block in the future implementation.
- Keep one final workflow handoff.
- Keep the footer as the final visible sitewide element.

## 12. Guidance-Level Findings

Guidance level should affect explanation density only. Style facts, support status and Pizza Plan boundaries must remain unchanged.

| Level | Should see first | Should remain available | Should stay secondary |
| --- | --- | --- | --- |
| Beginner | Goal question, recommended style, support boundary, simple oven/result language | All style families through comparison links | Hydration defaults, technical notes, origin/history |
| Enthusiast | Goal question, comparison by oven, bake, texture and topping load | Detailed cards, technique notes, related learning | Formal standards and deep caveats |
| Pizza Nerd | Goal question plus full comparison access | Preset data, flour/hydration/defaults, technique notes, common confusion | Nothing should outrank style decision and support boundary |

Do not create different style data per level. Use the same canonical arrays and change presentation priority.

## 13. Visual And Information-Density Findings

Source and browser inspection found:

- 7 style image thumbnails.
- 7 detailed style comparison cards.
- 7 goal-guide cards.
- 7 technique-note disclosures.
- 3 "What changes in practice" cards.
- 4 focused-guide cards.
- 1 final CTA section.
- Approximately 40 sections/articles/anchor-card surfaces in the rendered page.
- Approximately 28 support or preset-related label instances in the rendered page.
- 14 style anchor links, because style anchors appear in both the visual comparison and goal guide.

The page is accurate, but it asks mobile users to scan many equivalent surfaces. The next patch should reduce repeated status labels and make the first decision more obvious.

No green glow or distracting neon-style effect was found on `/styles`. The visual issue is density, not a single broken visual effect.

## 14. Image Findings

Current assets under `public/pizza-styles/`:

| Asset | Size | Current role | Finding |
| --- | ---: | --- | --- |
| `/pizza-styles/neapolitan.webp` | 154,726 bytes | Style thumbnail and education image | Retain. Clear rim, soft center and restrained topping. |
| `/pizza-styles/contemporary.webp` | 126,934 bytes | Style thumbnail and education image | Retain. Shows taller airy rim. |
| `/pizza-styles/new-york.webp` | 135,724 bytes | Style thumbnail and education image | Retain. Low rim and broad cheese coverage read well. |
| `/pizza-styles/detroit.webp` | 179,866 bytes | Style thumbnail and education image | Retain. Rectangular pan and sauce stripes are clear. |
| `/pizza-styles/roman-thin.webp` | 124,502 bytes | Style thumbnail and education image | Retain. Correctly represents Roman Tonda. |
| `/pizza-styles/roman-al-taglio.webp` | 166,988 bytes | Style thumbnail and education image | Retain. Good tray format and portion cue. |
| `/pizza-styles/sicilian.webp` | 148,010 bytes | Style thumbnail and education image | Retain. Distinct thick square style. |

Recommendations:

- Do not add new images in Patch 474B.
- Do not replace the current assets.
- Keep image alt text instructional.
- Use images as comparison/selection aids, not a single hero.
- Avoid duplicating full-size imagery in both an early assistant and later cards unless Next Image loading evidence remains acceptable.

## 15. Mobile Review

Production review was performed through the in-app browser. The browser viewport override provided a reliable `430x740` mobile viewport. A requested `390x844` override returned a wider runtime viewport in this session, so the 390 row below uses Patch 468B's prior verified local measurement for the same page state where applicable.

| Viewport | Title top | Visual comparison top | First style image top | Detailed comparison top | First page-level Plan CTA top | Total height | Overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 390x844 | not remeasured in this browser session | 500 px | 682 px | 1110 px | not recorded in 468B | not recorded in 468B | none observed in 468B |
| 430x740 | 166 px | 465 px | 647 px | 1101 px | approx. 9942 px for final CTA; global nav CTA at top | 10180 px | none |

Mobile findings:

- The page title and style images appear early enough.
- The full comparison begins around 1100 px, just after the first viewport.
- The practical goal guide begins much later, around 5873 px at 430x740.
- The final page-level Plan CTA is near the bottom.
- No horizontal overflow, console errors or hydration warnings were observed.
- The mobile issue is not image visibility. It is delayed decision support and total page length.

## 16. Desktop Review

Production review at `1440x900` found:

| Measurement | Position |
| --- | ---: |
| Page title top | 190 px |
| Hero bottom | 406 px |
| Visual comparison top | 426 px |
| First style image top | 568 px |
| Detailed comparison top | 805 px |
| Goal guide top | 2747 px |
| Practical differences top | 3423 px |
| Technique notes top | 3961 px |
| First page-level Plan CTA top | 5146 px |
| Total height | 5624 px |

Desktop findings:

- The first viewport shows the page purpose, visual comparison and start of detailed comparison.
- All seven style images are visible in one balanced row.
- The page feels calm visually, but the decision aid is below a large block of comparison content.
- Support status is truthful, but repeated labels make the page feel busier than necessary.
- No horizontal overflow, console errors or hydration warnings were observed.

## 17. Three Redesign Concepts

### Concept A: Pizza Style Assistant

Structure:

```text
Choose a pizza style
-> What result do you want?
-> Recommended style or styles
-> Support boundary
-> Compare selected styles
-> What changes in dough, oven and toppings
-> Optional technique notes
-> Plan supported pizza
```

Evaluation:

- Best match for the core user intent.
- Mobile-friendly because it asks one useful question early.
- Keeps all current data and images.
- Makes the support boundary easier to understand.
- Recommended direction.

### Concept B: Visual Comparison With Selected Detail

Structure:

```text
Choose a style from the image grid
-> Selected style detail panel
-> Compare all styles
-> Technique notes
-> Plan supported pizza
```

Evaluation:

- Strong use of existing images.
- Better than the current static atlas.
- Slightly weaker for beginners because it starts with style names instead of goals.
- Good secondary pattern if Concept A needs a compact selected-detail area.

### Concept C: Pizza Style Reference Guide

Structure:

```text
Compact hero
-> Full visual comparison
-> Full detailed comparison
-> Technique reference
-> Related links
```

Evaluation:

- Similar to the current page.
- Good for users who already know style names.
- Too reference-led for first-time decision making.
- Should remain the lower-page reference mode, not the primary structure.

Selected direction: Concept A, with a compact selected-detail treatment from Concept B if implementation remains simple.

## 18. Recommended Future Structure

Proposed Patch 474B hierarchy:

```text
Compact hero
What result do you want?
Recommended style result
Compact visual style comparison
Compare the important differences
What changes in practice
Optional technique notes
Final Plan a pizza CTA
Footer
```

Implementation principles:

- Presentation-only.
- Preserve `pizzaStyleEducation`.
- Preserve `pizza-styles.ts`.
- Preserve `plannerSupportedPizzaStyleIds`.
- Preserve all seven image assets.
- Preserve anchor routes.
- Preserve `/session/start` boundary.
- No unsupported style Plan CTAs.
- No SEO or indexing changes unless separately requested.

## 19. Future Component Proposal

Possible components:

| Component | Responsibility |
| --- | --- |
| `PizzaStyleAssistant` | Goal-first chooser using existing `pizzaStyleGoalGuide` and `pizzaStyleEducation`. |
| `PizzaStyleRecommendation` | Shows selected/recommended style, support boundary and top comparison facts. |
| `PizzaStyleVisualComparison` | Keep or adapt current image grid as secondary navigation. |
| `PizzaStyleComparison` | Keep as all-style reference, possibly lower and more compact. |
| `PizzaStylePracticeChanges` | Replace current full card group with compact dough/oven/topping consequences. |
| `PizzaStyleTechniqueNotes` | Keep collapsed optional detail. |

Avoid new state if anchors are enough. If a selected style state is added, keep it client-local and presentation-only. Do not write storage, URL parameters or Pizza Plan state in Patch 474B.

## 20. Implementation Roadmap

### Patch 474B: Implement Pizza Style Assistant hierarchy

Scope:

- Presentation-only `/styles` restructuring.
- Goal-first assistant.
- Preserve all current data, images, anchors and support truth.
- Reduce repeated status labels and broad lower-page navigation.
- Keep final Plan a pizza boundary accurate.
- No Pizza Plan, preset, route, SEO, data or asset changes.

### Patch 474C: Production verification

Scope:

- Mobile and desktop verification.
- Accessibility and keyboard checks.
- Anchor navigation checks.
- Image loading and crop checks.
- Support-boundary verification.
- Regression spot-checks for Pizza Plan, Toppings, Sauce and Ovens.

## 21. Validation

Audit actions completed:

- Confirmed starting commit: `26003db34af884cc685ffd28e4d586126e1404ab`.
- Confirmed `master` matched `origin/master` before branching.
- Confirmed tracked working tree was clean before the audit.
- Inspected current `/styles` source and Pizza Styles components.
- Inspected Pizza Style data, support metadata, presets and focused tests.
- Inspected prior Patch 468A and 468B imagery findings.
- Reviewed production `/styles` at `430x740` and `1440x900`.
- Used Patch 468B's prior `390x844` Styles measurement because this browser session did not provide a reliable 390 px override.

Pending before commit:

- `git diff --check`.

No production code, images, calculations, APIs, database files, migrations, routes, header, navigation or footer were modified.
