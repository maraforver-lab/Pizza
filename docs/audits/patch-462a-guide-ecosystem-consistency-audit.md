# Patch 462A: Guide ecosystem consistency audit

## Executive summary

DoughTools now mostly feels like one pizza learning system rather than a set of unrelated pages. The strongest evidence is the repeated teaching pattern on the main guides: a practical answer first, selected guidance depth for Beginner, Enthusiast and Pizza Nerd users, realistic teaching images where the action benefits from visuals, and a final `Plan a pizza` handoff.

The remaining inconsistencies are not deep product defects. They are ecosystem polish issues:

- the Guide hub still behaves more like an older index than a clear learning path;
- cross-guide links are useful but uneven;
- CTA wording is not fully systematic;
- some labels still use older or narrower terms such as `Pizza Sauce`, `Dough Guide`, `Oven Guide`, `Upcoming topics` and plain `Troubleshooting`;
- the image system is strong on Dough, Toppings and Ovens, good on Sauce, light on Practical Tips and absent on the style guide.

Recommended next work should stay small: clarify the hub, standardize cross-guide links and CTAs, then clean up visual consistency and unused guide assets.

## Confirmed guide route map

| Route | Source | Current role | Notes |
| --- | --- | --- | --- |
| `/guide` | `app/guide/page.tsx` | Guide hub | Links to the main guide ecosystem. |
| `/guides/dough` | `app/guides/dough/page.tsx`, `components/guide/DoughGuidePageClient.tsx` | Dough guide | 12-step dough process with quick answer and visuals. |
| `/sauce` | `app/sauce/page.tsx`, `components/sauce/*` | Sauce guide and calculator | Sauce choice, calculator and practical application guidance. |
| `/toppings` | `app/toppings/page.tsx`, `components/toppings/ToppingBalanceLab.tsx` | Toppings guide and teaching lab | Topping balance, moisture and examples. |
| `/ovens` | `app/ovens/page.tsx`, `components/ovens/*` | Baking and oven setup guide | Oven choice, setup paths, equipment and troubleshooting. |
| `/styles` | `app/styles/page.tsx`, `components/styles/*`, `lib/pizza-style-education.ts` | Pizza style learning guide | Public guide linked from the hub as `Choose your pizza`. |
| `/guide/practical-pizza-tips` | `app/guide/practical-pizza-tips/page.tsx` | Practical Tips index | Five topic cards. |
| `/guide/practical-pizza-tips/leftover-dough` | `app/guide/practical-pizza-tips/leftover-dough/page.tsx` | Practical Tips article | Leftover dough, freezing and thawing. |
| `/guide/practical-pizza-tips/fermentation-length` | `app/guide/practical-pizza-tips/fermentation-length/page.tsx` | Practical Tips article | Fermentation length choices. |
| `/guide/practical-pizza-tips/containers-and-lids` | `app/guide/practical-pizza-tips/containers-and-lids/page.tsx` | Practical Tips article | Container and lid use. |
| `/guide/practical-pizza-tips/common-problems` | `app/guide/practical-pizza-tips/common-problems/page.tsx` | Practical Tips article | Compact problem guidance with troubleshooting handoff. |
| `/guide/pizza-troubleshooting` | `app/guide/pizza-troubleshooting/page.tsx`, `components/guide/PizzaTroubleshootingGuideClient.tsx` | Troubleshooting guide | Symptom finder and focused diagnosis. |

## Current Guide ecosystem diagram

```text
/guide
  -> /guides/dough
  -> /sauce
  -> /toppings
  -> /ovens
  -> /styles
  -> /guide/practical-pizza-tips
       -> /leftover-dough
       -> /fermentation-length
       -> /containers-and-lids
       -> /common-problems
  -> /guide/pizza-troubleshooting

Main learning flow that the current content implies:
Dough -> Sauce -> Toppings -> Ovens -> Practical Tips -> Plan a pizza

Current hub presentation:
Dough and Sauce are primary, while Toppings, Ovens, Styles, Practical Tips and Troubleshooting are secondary.
```

## What already works

- Dough, Sauce, Toppings and Ovens now start with an action-oriented practical answer instead of leading with theory.
- The main guides use canonical selected-level guidance. Browser checks with isolated `doughtools.experienceLevel` values confirmed only one selected guidance level on Dough, Sauce, Ovens and Practical Tips article routes.
- Shared facts remain shared: calculations, safety guidance, step structure, setup paths and final planning handoffs are not hidden by guidance level in the inspected guide sources.
- The visual language is recognizably DoughTools: rounded cards, warm palette, realistic food/process images, compact mobile behavior and a consistent final `Plan a pizza` CTA.
- The focused troubleshooting guide works as a practical problem finder rather than a passive article.
- `components/learning/PublicPageEnding.tsx` enforces a useful constraint: no more than three related-learning links and no duplicate destination between related links and the action CTA.

## Guide hub findings

The hub is functional but not yet as clear as the improved guide pages it points to.

| Finding | Evidence | Impact | Recommendation |
| --- | --- | --- | --- |
| The hub feels like an index, not a learning path. | `app/guide/page.tsx` splits guides into `primaryGuides`, `secondaryGuides` and `topicShortcuts`. | A beginner can choose a page, but the natural order is not obvious. | Show a simple learning path without forcing users through it. |
| Dough and Sauce are privileged as the only `Start here` guides. | H2: `Dough guides and sauce guides`; secondary section: `Choose the guide you need next.` | Toppings and Ovens are now substantial teaching guides, but the hub still frames them as supporting material. | Keep Dough and Sauce prominent, but present Toppings and Ovens as part of the same pizza-building sequence. |
| Topic shortcuts keep old anchors alive but add cognitive load. | `Hydration`, `Fermentation`, `Flour strength`, `Gluten development`, `Oven heat` appear as a five-card shortcut block. | Useful for legacy links, but on mobile it adds a second navigation model after the guide cards. | Keep anchors if needed, but make them visually secondary or collapsed behind "Quick orientation". |
| The hub hero image is homepage-oriented. | `/images/homepage/doughtools-hero-desktop.webp` is reused on `/guide`. | It looks polished, but does not specifically communicate the guide ecosystem. | Consider a future guide-specific hero image only if a visual cleanup patch needs one. |

## Individual guide findings

### Dough

Strengths:

- The first useful action is clear: `What should I do first?`, four compact process actions and `Start with weighing`.
- `See the dough process` gives one concise visual process before the full 12-step guide.
- The 12-step guide keeps rich realistic images and step-specific detail.
- Selected-level content is rendered through `getDoughGuideLevelDetails(activeStep, experienceLevel)`, not a three-level grid.

Issues:

- The guide does not provide a simple end-of-guide learning handoff to Sauce. It has step navigation and troubleshooting links, but less cross-guide continuity than Sauce, Toppings and Ovens.
- Dough has many legacy local assets in `public/dough-guide/` that are not referenced by source searches, including older numbered `.webp` files and `visual-*.svg` assets. They may be harmless, but they make the image ecosystem harder to maintain.

### Sauce

Strengths:

- The current order is strong: Quick answer, calculator, tomatoes, application, moisture, storage, sources, plan CTA.
- The calculator makes `Total sauce` and `Sauce per pizza` prominent and explains the result.
- Sauce content naturally introduces its relationship to toppings and oven moisture.
- Browser checks showed no horizontal overflow at 390, 430, 1280 or 1440 widths.

Issues:

- The page has no related-learning links in `PublicPageEnding`; only the final `Plan a pizza` CTA is configured in `app/sauce/page.tsx`.
- The application sequence is useful but partly CSS/composition-based rather than a full realistic image sequence, so it is less visually consistent with the Toppings and Ovens teaching assets.

### Toppings

Strengths:

- The practical hierarchy is very clear: quick answer, rules, balanced set, cheese and moisture, before baking, after baking, overload.
- Four new teaching images clearly support the decisions users need to make.
- The interactive lab remains available as deeper guidance without leading the page.
- Browser checks showed no horizontal overflow at all requested widths.

Issues:

- The page is the densest of the main guides because it combines a guide and interactive lab. The current order mostly handles this, but future CTA/link cleanup should avoid adding more blocks.
- It links back to Sauce through the selected example relationship, but the next natural learning step to Ovens is not as explicit as it could be.

### Ovens

Strengths:

- Patch 460F fixed the prior readability issue: setup paths now read vertically rather than as narrow columns.
- Home oven with steel, stone, tray and pizza oven setup paths are clearly separated.
- Realistic teaching images support surface position, launch, turning, temperature, doneness, heat balance and recovery.
- Safety remains visible and shared.

Issues:

- Ovens links to Dough and Toppings near the final CTA, but does not clearly hand off to Practical Tips even though Practical Tips now covers follow-up edge cases.
- Equipment thumbnails are local and recognizable, but they are SVG illustrations rather than realistic photography-style assets. They are useful, but visually different from the teaching images on the same page.

### Practical Tips

Strengths:

- The index is simple and compact after the previous simplification.
- Articles use `PracticalTipsLevelGuidance`, which now renders one selected level instead of showing all three levels.
- Safety blocks remain shared and visible.

Issues:

- The index still says `Upcoming topics`, even though the topics are now live links. This is stale user-facing terminology in `app/guide/practical-pizza-tips/page.tsx`.
- `Leftover dough` and `Freezing and thawing` are two cards that point to the same article route. This is not broken, but it can feel like duplicate navigation.
- Practical Tips has no local realistic teaching images. That is acceptable for short tips, but it makes the section feel less visually connected to Dough, Sauce, Toppings and Ovens.
- `PracticalTipsLevelGuidance` initially renders an empty placeholder until hydration selects the level. The final DOM is correct, but a future hardening pass may want a server-safe Beginner fallback if visible layout jump is observed.

### Styles

Strengths:

- The page explains style differences without entering Pizza Plan workflow too early.
- It clearly notes that pizza plans currently support Neapolitan-style assumptions.

Issues:

- Related-learning labels in `lib/pizza-style-education.ts` and `app/styles/page.tsx` use older names: `Dough Guide`, `Pizza Sauce`, `Oven Guide`, `Toppings` and `Troubleshooting`.
- The page currently renders no visible style images in browser checks, despite style image metadata existing in `lib/pizza-style-education.ts`. If the style guide remains part of the guide ecosystem, it should either visibly use the existing style images or be intentionally text-first.

### Troubleshooting

Strengths:

- The problem finder is action-first: symptom, current fix, next-bake correction.
- It links diagnosis back to learning areas and keeps `Plan a pizza` as the workflow handoff.
- It correctly does not use guidance-level personalization for the main finder, which should remain stable during problem solving.

Issues:

- The breadcrumb and hero frame troubleshooting as `Practical pizza tips`, while the hub calls it `Fix pizza problems`. Both are understandable, but the relationship should be clarified.
- `RelatedLearning` is passed six links in `PizzaTroubleshootingGuideClient.tsx`, while `PublicPageEnding` caps related links at three. This is not the same component, but it creates an inconsistent related-learning density model.
- Link labels include `Pizza Sauce` rather than `Sauce guides`.

## Cross-guide navigation findings

Current links are helpful but inconsistent.

| Desired relationship | Current state | Recommendation |
| --- | --- | --- |
| Dough -> Sauce | Not a clear final next-guide link. Dough focuses on step navigation and troubleshooting. | Add one curated related-learning link or final next-guide link to Sauce. |
| Dough -> Ovens | Available indirectly through hub and troubleshooting. | Keep secondary only; do not overload Dough. |
| Sauce -> Toppings | Mentioned in content, but no related-learning card at page end. | Add a curated `Choose toppings` related link. |
| Toppings -> Ovens | Ovens appear conceptually in content, but not as a clear next learning link. | Add one `Choose your oven` or `Baking guides` link in the existing ending model. |
| Ovens -> Practical Tips | Not explicit. | Add one Practical Tips link for follow-up troubleshooting/storage/timing decisions. |
| Practical Tips -> main guides | Some articles return to the index or troubleshooting; main-guide links are not systematic. | Add only targeted links where they resolve the current tip. |
| Guides -> Plan a pizza | Present on hub and main guides. | Keep as the one workflow handoff. |

Simple model:

```text
Guide hub: choose a learning topic.
Individual guide: teach the current topic, then offer one to three curated related guides.
Final CTA: Plan a pizza only when the user is ready to use the learning in the workflow.
Troubleshooting: diagnose first, then link to the variable behind the problem.
```

## CTA findings

Recommended CTA vocabulary:

| Situation | Use | Avoid |
| --- | --- | --- |
| Enter the Pizza Plan workflow | `Plan a pizza` | `Start`, `Create plan`, `Start Session` |
| Open a learning route from a card | `Open guide` or `Open [topic]` | Repeating long titles such as `Open How to make pizza dough` |
| Continue within a multi-step guide | `Continue to [step]` | Generic `Continue` |
| Launch a focused diagnostic tool | `Find my problem`, `Diagnose this problem` | `Learn more` |
| Return to a guide index | `Return to Pizza guides` or `See all Practical pizza tips` | Multiple synonyms on nearby pages |
| Interactive lab | `Start the experiment` is acceptable | Using it for non-interactive pages |

Current inconsistent examples:

- `Open How to make pizza dough` is generated by the Guide hub card title.
- `Pizza Sauce` appears in Styles and Troubleshooting related links.
- `Troubleshooting` appears where the canonical public label is usually `Fix pizza problems`.
- `Upcoming topics` appears on a live Practical Tips index.

## Terminology findings

| Term area | Current state | Recommended correction |
| --- | --- | --- |
| Guide hub cards | `How to make pizza dough`, `How to make pizza sauce` | Align with navigation terms: `Make the dough`, `Make the sauce`, or category labels `Dough guides`, `Sauce guides`. |
| Sauce links | `Pizza Sauce` in Styles and Troubleshooting | Use `Sauce guides` or `Make the sauce` depending on context. |
| Ovens links | `Oven Guide`, `Baking guides`, `Choose your oven` | Pick one display rule: page/category label can be `Baking guides`; action can be `Choose your oven`. |
| Toppings links | `Toppings`, `Topping guides`, `Choose toppings` | Use `Choose toppings` for action; `Topping guides` for category labels. |
| Practical Tips index | `Upcoming topics` | Change to `Practical topics` or another live-state label. |
| Troubleshooting | `Fix pizza problems`, `Troubleshooting`, `Practical pizza tips` | Keep `Fix pizza problems` for nav/card action and use `Troubleshooting` only where the diagnostic function is explicit. |

## Guidance-level consistency findings

Observed selected-level behavior after the 461 fixes is good across the guide ecosystem.

Browser checks with isolated storage values at 390 px confirmed:

- `/guides/dough`: Beginner, Enthusiast and Pizza Nerd each showed only that label in the user-facing level card.
- `/sauce`: Beginner, Enthusiast and Pizza Nerd each showed only that label in the level-aware sections.
- `/ovens`: Beginner, Enthusiast and Pizza Nerd each showed only that label in bake-management guidance.
- Practical Tips article routes rendered exactly one `data-practical-tip-selected-level` card matching the stored value.

Source checks confirmed:

- `components/guide/DoughGuidePageClient.tsx` uses `readExperienceLevelPreference()` and selected `getDoughGuideLevelDetails`.
- `components/sauce/SauceQuickAnswer.tsx`, `SauceCalculator.tsx` and `SaucePracticalGuidance.tsx` use the canonical reader and selected maps.
- `components/toppings/ToppingBalanceLab.tsx` uses the canonical reader and selected quick/practical guidance.
- `components/ovens/OvensQuickAnswer.tsx` uses the canonical reader and selected bake-management guidance.
- `components/guide/PracticalTipsLevelGuidance.tsx` renders one selected card after hydration.
- `/guide` and `/guide/pizza-troubleshooting` correctly avoid guidance-level personalization for their shared hub/finder roles.

Exception to watch:

- Practical Tips selected guidance is client-selected after hydration. The final DOM is correct, but the initial placeholder is empty.

## Image ecosystem findings

| Area | Inventory | Teaching value | Consistency finding |
| --- | --- | --- | --- |
| Guide hub | 1 homepage-style hero image | Polished, but broad | Good visual quality, not guide-specific. |
| Dough | 12 primary step images, 4 quick process images, many secondary step visuals, plus older likely unused assets | Strong | Most complete visual system; needs asset hygiene later. |
| Sauce | 3 rendered images plus a CSS/composition application visual | Good | Practical, but less fully photographic than Toppings/Ovens. |
| Toppings | 8 rendered images, including four teaching images and comparison examples | Strong | Best current example of image-led decision teaching. |
| Ovens | 9 realistic teaching images, 1 comparison hero, 13 equipment SVG thumbnails | Strong for setup; mixed for equipment | Teaching images are realistic; equipment thumbnails are useful but illustrative SVGs. |
| Styles | 0 visible images in browser review | Low | Source includes style image metadata, but the page rendered text-only in the checked states. |
| Practical Tips | 0 images | Low to acceptable | Short practical tips can be text-first, but the section feels visually lighter than the main guides. |
| Troubleshooting | Images are shown after a problem is selected; initial finder has no large image | Appropriate | Initial page stays focused; diagnosis images are tied to symptoms. |

No 4xx/5xx image responses were observed during progressive-scroll checks of the image-heavy guide pages. Some Next.js route prefetch `_rsc` requests were aborted during navigation, which is normal browser prefetch behavior and not evidence of broken guide content.

Unused or cleanup candidates:

- Source search did not find current references to older `public/dough-guide/01-*`, `02-*`, `03-*`, `04-*`, `05-*`, `06-*`, `07-*`, `08-*`, `09-*` or `visual-*.svg` assets.
- Do not delete them as part of 462A. A later asset-cleanup patch should verify no metadata, docs, snapshots or external references still need them.

## Mobile findings

Checked at 390x844 and 430x740.

Works:

- No horizontal overflow was detected on the checked guide routes.
- Dough, Sauce, Toppings and Ovens surface practical content early.
- Practical Tips index is compact.
- Ovens setup paths no longer compress five long steps into narrow columns.
- Troubleshooting starts with symptom search and category selection rather than a long list of all problems.

Needs polish:

- Guide hub mobile ordering does not make the full learning path obvious.
- Topic shortcuts add another card group after the guide cards; this may be useful for old anchors but is not a first-time learning path.
- Toppings is long because it includes an interactive lab; it remains structured, but future additions should be resisted.
- Practical Tips articles are readable but visually plain next to the richer main guides.

## Desktop findings

Checked at 1280x900 and 1440x900.

Works:

- Individual guide pages have clear hierarchy and no dashboard-like all-level comparison.
- Toppings and Ovens use desktop width for teaching comparisons without forcing narrow text columns.
- Sauce keeps calculator results visually primary.
- Dough preserves step navigation and process visuals without crowding the first screen.

Needs polish:

- Guide hub uses desktop width mostly for cards rather than a coherent route/path model.
- The five-card topic shortcut grid can feel like a mini-index inside the index.
- Troubleshooting uses a broader `RelatedLearning` set than the stricter `PublicPageEnding` model.
- Styles page feels less visually mature than the improved Dough/Sauce/Toppings/Ovens pages.

## Exact things that should NOT be changed

- Do not change Pizza Plan workflow, `/session/*`, calculations, saved values, APIs, database, migrations or guidance-level storage.
- Do not change header, top navigation or footer implementation as part of guide ecosystem polish.
- Do not reintroduce all three guidance levels on a single guide page.
- Do not turn the Guide hub into a workflow wizard.
- Do not add more than three related-learning links to `PublicPageEnding`.
- Do not remove current realistic teaching images from Dough, Sauce, Toppings or Ovens.
- Do not add images to every Practical Tips article merely for parity; only add visuals where they teach a decision or action.
- Do not delete older image assets without a dedicated usage and reference check.

## Prioritized improvement list

1. Clarify the Guide hub so it explains Guides, the natural learning path and the difference between learning and planning.
2. Standardize cross-guide related links and CTA wording.
3. Replace stale terminology: `Upcoming topics`, `Pizza Sauce`, `Dough Guide`, `Oven Guide`, plain `Troubleshooting` where the approved term is clearer.
4. Decide whether `/styles` should visibly use style images or remain intentionally text-first.
5. Check and clean unused legacy Dough guide images in a tightly scoped asset patch.
6. Consider one or two Practical Tips images only if they teach specific storage, container or problem decisions.

## Maximum three implementation patches

### Patch 462B: Clarify Guide hub discovery

Scope:

- `app/guide/page.tsx`
- focused Guide hub tests

Objective:

- Make the hub present one clear learning system: Dough, Sauce, Toppings, Ovens, Practical Tips, Fix pizza problems and Plan a pizza.
- Replace stale or awkward hub labels.
- Keep route destinations, header, navigation and footer unchanged.

Acceptance:

- A beginner can see where to start and what each guide teaches.
- The hub distinguishes `Pizza guides` from `Plan a pizza`.
- No workflow logic changes.

### Patch 462C: Standardize cross-guide links and CTAs

Scope:

- Existing related-learning/end sections in Dough, Sauce, Toppings, Ovens, Styles, Practical Tips and Troubleshooting
- directly related focused tests

Objective:

- Add only curated next-guide links where the current guide naturally leads.
- Standardize CTA wording: `Plan a pizza` for workflow handoff, `Open guide`/topic-specific actions for learning, diagnostic action labels for troubleshooting.
- Keep `PublicPageEnding` limits intact.

Acceptance:

- No guide dead-ends unnecessarily.
- No guide becomes a miniature sitemap.
- CTA wording is predictable.

### Patch 462D: Clean guide visual consistency and asset hygiene

Scope:

- Guide-specific image presentation and asset usage only
- source and test checks for image references

Objective:

- Verify unused Dough legacy assets and remove only confirmed dead assets if safe.
- Decide whether Style guide should render existing style images.
- Decide whether Practical Tips needs targeted teaching images.
- Preserve all current teaching images that users rely on.

Acceptance:

- Image inventory is easier to maintain.
- Images remain realistic and action-teaching where important.
- No decorative or unrelated image additions.

## Validation performed

- Confirmed route tree from `app/**/page.tsx`.
- Inspected Guide hub, Dough, Sauce, Toppings, Ovens, Styles, Practical Tips and Troubleshooting source files.
- Inspected guide-related image directories under `public/dough-guide`, `public/sauce`, `public/toppings` and `public/ovens`.
- Inspected guidance-level reader usage in guide components.
- Browser-reviewed Guide routes at 390x844, 430x740, 1280x900 and 1440x900.
- Performed isolated level checks for Beginner, Enthusiast and Pizza Nerd on representative level-sensitive guide pages without altering the developer's stored preference.
- Ran `git diff --check`.
