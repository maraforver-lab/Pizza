# Patch 450D: Home oven guidance completeness audit

Branch: `patch/450d-home-oven-guidance-audit`

Audited starting commit: `ab0feca57165c66d04b634df6dd07c2f8f61a5fa`

Scope: audit-only. Inspected `/ovens`, the current home-oven bake profile, Patch 384 documentation and directly related baking/troubleshooting guide content. No production UI, tests, routes, database, APIs, formulas or session logic were changed.

## Executive summary

Current home-oven guidance is much stronger than the original pre-Patch-384 state. Patch 384 already converted `/ovens` from a broad comparison page into a practical baking guide that covers the main Patch 312-era needs: home-oven preheat, stone/steel/tray behavior, bake-time expectations, broiler/grill caution, safety and the difference between Home oven and Pizza oven.

The backlog item should not be rebuilt from scratch. The remaining issue is smaller: the page is almost complete, but two beginner-facing details are still too abstract to close the practical guidance item cleanly:

- home-oven temperature is currently described as `highest practical heat`, which is safe but not concrete enough for beginners;
- rack placement is mentioned, but the page does not give a simple starting placement such as where to put a steel/stone/tray before adjusting from the baked result.

Conclusion: **incomplete, create one small targeted follow-up patch.**

## What Patch 384 Already Covers

Patch 384 created the current `/ovens` hierarchy and documented the result in `docs/audits/patch-384-ovens-practical-baking-guide.md`.

It already covers:

- `/ovens` reads the shared Pizza Session bake profile rather than page-local timing constants.
- Home oven preheat uses the shared `75` minute pizza-plan window.
- Home oven bake duration uses the shared `about 5 min` planning default.
- Home oven and Pizza oven are shown side by side across heat, preheat, placement, bake time and expected result.
- Home oven steps explicitly say to preheat the baking surface, not only oven air.
- Stone, steel and tray have a compact comparison.
- Broiler/grill use is allowed only when safe and when the top is lagging.
- Troubleshooting/feedback covers pale base, burnt base with pale top, top burning first and heat loss between pizzas.
- Safety guidance remains visible before the final CTA.
- The page explains that the pizza plan uses Home oven or Pizza oven for the preheat window, bake guidance and Kitchen instructions.

Relevant current source:

- `lib/pizza-session-bake-profile.ts:30` to `lib/pizza-session-bake-profile.ts:42` defines Home oven as `75` minutes preheat, `5 * 60` seconds bake, `about 5 min`, `highest practical heat`, stone/steel/tray surface guidance and rotation guidance.
- `app/ovens/page.tsx:14` to `app/ovens/page.tsx:38` maps the shared Home oven and Pizza oven profiles into the comparison cards.
- `app/ovens/page.tsx:56` to `app/ovens/page.tsx:61` defines the four Home oven bake steps.
- `app/ovens/page.tsx:63` to `app/ovens/page.tsx:76` defines Stone, Steel and Tray guidance.
- `app/ovens/page.tsx:78` to `app/ovens/page.tsx:99` defines practical bake-feedback items.
- `app/ovens/page.tsx:101` to `app/ovens/page.tsx:113` defines pizza-plan effect and safety copy.

## Completeness Check

| Need | Current coverage | Assessment |
| --- | --- | --- |
| Recommended preheating time | Shared profile and `/ovens` say `75 min pizza-plan preheat window`. | Complete. |
| Stone versus steel | Dedicated Stone, Steel and Tray section explains heat transfer differences. | Complete enough. |
| Rack placement | Comparison says to choose rack position for top/bottom balance; feedback says use a higher rack when bottom heat outruns top heat. | Partially covered; missing a beginner default. |
| Realistic home-oven temperature | Shared profile says `highest practical heat`; `/ovens` asks what temperature it can realistically reach. | Partially covered; safe but too vague. |
| Realistic bake time | Shared profile says `about 5 min`; `/ovens` says this is a planning default and visual doneness wins. | Complete enough for Pizza Session default; a range may read better. |
| Grill or broiler use | Home oven step says use broiler or grill help only when safe and when top is lagging. | Complete enough, with safety caveat. |
| Practical preparation sequence | Four Home oven steps cover preheat, surface, rotation/broiler and visual doneness. | Mostly complete; could be more actionable with rack/temp defaults. |
| Safety considerations | Safety checks are visible and concise; equipment section also covers hot tools and fire protection. | Complete enough. |
| Home oven vs Pizza oven differences | Comparison cards and session-effect copy clearly separate heat, bake rhythm, moisture tolerance and workflow. | Complete. |

## Genuine Gaps

### 1. Home-oven temperature is too abstract

`highest practical heat` is accurate across many ovens, but a beginner may not know whether that means 230 C, 250 C, 275 C or broiler mode. The page should keep the safe "your oven may vary" framing, but it needs one concrete practical anchor.

Recommended wording:

> Use the highest normal bake setting your oven and equipment safely allow, commonly around 250-275 C / 480-525 F. Preheat the stone or steel for the full pizza-plan window.

This should stay guidance copy only. It should not change formulas, schedule, bake timer defaults or the canonical `temperatureLabel` unless the product wants the shared profile to carry both a short label and a longer helper.

### 2. Rack placement lacks a starting point

The current copy says to choose rack position for top/bottom balance, and troubleshooting says to move to a higher rack if the base burns before the top. That is useful after a failed bake, but beginners need a starting setup.

Recommended wording:

> Start with the stone or steel in the upper half of the oven when top heat is weak. Move lower only if the base needs more heat, or higher if the base browns before the top.

If the app wants to avoid over-prescribing, this can be presented as a "starting point" rather than a rule.

### 3. Broiler/grill advice is safe but thin

The current page correctly says to use broiler or grill help only when safe and when the top is lagging. It does not say when to turn it on or how to avoid burning. This is not a major gap, but one sentence would make the advice more usable.

Recommended wording:

> If your oven manual allows it, use the broiler/grill near the end of the bake for top color, and watch constantly.

### 4. Practical sequence could be easier to scan

The Home oven four-step list is correct, but it mixes canonical timing, surface choice, rotation, broiler/grill and doneness in dense sentences. A beginner would benefit from one compact "Home oven setup" mini-list or tighter phrasing inside the existing card.

This should be a copy/presentation improvement, not a new section-heavy redesign.

## Repeated Or Unclear Content

- Preheat appears in the comparison card, the Home oven ordered steps and the session-effect section. This is acceptable because each use has a different job: comparison, action and product consequence.
- Stone/steel/tray appears in placement, the Home oven steps and the dedicated surface section. This is also acceptable, but the first two mentions are broad while the surface section carries the actual useful explanation.
- The word "planning default" is accurate, but beginner copy may read more clearly if paired with "start here, then judge the pizza visually."
- The page does not over-repeat safety content. The safety block is compact and well placed.

## Beginner Readability

Strong points:

- The page asks beginner questions directly: what temperature, how long to preheat, where the pizza goes and how long it bakes.
- Home oven and Pizza oven are separate cards, not a dense table.
- The ordered Home oven steps are readable on mobile.
- Stone, steel and tray are explained without adding new product choices.
- Troubleshooting uses visible outcomes instead of technical oven theory.

Weak points:

- "Highest practical heat" is beginner-safe but not beginner-specific.
- "Choose rack position for top/bottom balance" assumes the user already understands how rack height changes top and bottom heat.
- Broiler/grill guidance is safe, but not enough to tell a user how to use it without guessing.

## Important Advice Hidden Too Deeply

The important home-oven advice is not hidden in the current page hierarchy. It appears before the equipment disclosure and before the final CTA:

1. comparison cards;
2. ordered bake instructions;
3. Stone, Steel and Tray;
4. bake-feedback troubleshooting;
5. pizza-plan effect and safety.

The equipment block is disclosed, but that is appropriate because equipment is supporting detail rather than core home-oven cooking guidance.

## Recommended Presentation Improvements

Minimum viable follow-up should update only `/ovens` copy and focused tests:

- Make the Home oven heat value more concrete while preserving safety:
  - `Highest safe setting, often 250-275 C / 480-525 F`
- Add a rack-placement starting point:
  - `Start in the upper half for better top heat; move lower if the base needs more heat.`
- Tighten the Home oven ordered steps so the sequence reads:
  1. Set the rack and surface.
  2. Preheat fully.
  3. Bake one pizza and rotate.
  4. Use broiler/grill only if safe and only near the end.
  5. Judge rim, bottom and cheese.
- Keep the existing Stone, Steel and Tray section.
- Do not add another large guide block.
- Do not change canonical bake duration, timeline scheduling, Kitchen progression or bake timer behavior.

## Backlog Decision

The original broad Patch 312 practical guidance concern is mostly addressed by Patch 384 and later `/ovens` improvements. However, the home-oven guidance is not quite complete for beginners because the two most operational setup choices, temperature and rack placement, remain too abstract.

Decision: **do not close the backlog item yet.**

Recommended next patch: **Patch 450E: Clarify home-oven temperature and rack setup.**

Minimum Patch 450E scope:

- Change only `/ovens` Home oven copy and focused Ovens tests.
- Add concrete but safe temperature wording.
- Add a clear rack-placement starting point.
- Clarify broiler/grill timing in one sentence.
- Preserve existing layout, route behavior, shared bake profile semantics, session logic and equipment section.
- No database migration, no deployment.

## Known Non-Gaps

- No need to rebuild Patch 312 from scratch.
- No need to add a separate home-oven page.
- No need to add a new home-oven timer duration.
- No need to change Pizza Session schedule or `targetEatTime` semantics.
- No need to add stone/steel/tray as a new Pizza Session choice in this follow-up.
- No need to change Kitchen or Bake Timer in order to complete this `/ovens` guidance cleanup.
