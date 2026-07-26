# Patch 473A: Ovens UX, Information Hierarchy And Decision Flow Audit

Starting commit: `9b480f8f3ec7579f3a9340fd739930fe2e7b01b9`

Scope: audit-only. Inspected `/ovens`, Ovens route code, Ovens components, Ovens data structures, local Ovens assets, focused Ovens tests, current design rules and local browser rendering at `390x844`, `430x740`, `1280x900` and `1440x900`. No production code, image assets, calculations, Pizza Plan integration, sessions, APIs, database, migrations, navigation or footer were changed.

## 1. Executive Summary

The current Ovens page is much better than the older equipment-catalogue version. It avoids brand/model recommendations, uses local teaching images, keeps Pizza Plan truth aligned with the two supported oven choices, and now presents setup paths as readable vertical processes instead of the former narrow five-column layout.

The remaining UX issue is not missing content. It is priority. The page still starts as a broad Home oven versus Pizza oven comparison, then a large Quick Answer, then a selected bake-management explanation, and only then the concrete setup paths. In measured local rendering, the first setup path begins at:

| Viewport | First setup path top | First setup image top | Document height |
| --- | ---: | ---: | ---: |
| `390x844` | `2836 px` | `3030 px` | `15081 px` |
| `430x740` | `2754 px` | `2948 px` | `14655 px` |
| `1280x900` | `1957 px` | `2071 px` | `9349 px` |
| `1440x900` | `1961 px` | `2075 px` | `9303 px` |

That means a beginner sees helpful orientation, but the practical "this is your oven path" moment arrives late. The page can still feel like it is answering "what oven categories and tools exist?" before it answers "how do I get better pizza from the oven I have?"

Primary user intent should be:

> Improve an existing oven setup, with a short oven-path choice as the first decision.

Recommended future direction: **Concept A - Oven Assistant**. The page should start by asking what oven or baking surface the user has, then show the matching setup path, expected result, bake guidance and only then supporting equipment/reference material.

## 2. Current UX Problems

### What works now

- The route is the canonical public Ovens guide: `/ovens`.
- The hero image is useful and topic-specific: `public/ovens/home-vs-pizza-oven.webp`.
- Quick Answer gives concise Home oven and Pizza oven starting advice.
- Guidance-level rendering is selected-level only in `components/ovens/OvensQuickAnswer.tsx`.
- Four setup paths exist and preserve the five step labels:
  - Home oven with baking steel
  - Home oven with pizza stone
  - Home oven with baking tray
  - Pizza oven
- The setup paths now use a readable vertical process with images near the relevant action.
- Troubleshooting, multiple-pizza recovery, Pizza Plan effect and safety content are useful.
- Equipment is disclosed rather than fully open by default.
- No horizontal overflow or console warnings were observed in local browser review.

### What still feels wrong

1. The first practical path is late.
   The setup section starts below `2500 px` on mobile and around `1750 px` on desktop. The first actual setup card starts around `2800 px` on mobile and `1960 px` on desktop.

2. The hero asks a comparison question, not an action question.
   `Home oven or pizza oven?` is clear but frames the page around comparison. The stronger user job is "help me bake better with my oven."

3. Quick Answer is large enough to become a second hero.
   At `390x844`, the Quick Answer section runs from `708 px` to `2547 px`. It includes the broad answer and the selected bake-management block before the setup paths begin.

4. The page contains 21 `details` elements, 20 open by default.
   Most are the setup process rows. They are readable, but on mobile this creates a long always-open learning page rather than a focused app-like path.

5. Equipment remains visually present as a large late reference.
   It is disclosed, which is good, but the page still contains 13 equipment thumbnails and detailed gear copy. This is useful reference material but should not become the conceptual frame.

6. Lower-page related learning is generic.
   `What should I learn next?` links to Dough and Practical Tips after the oven task. This is not broken, but it is less contextual than a page that finishes with "use this oven choice in a Pizza Plan" and maybe one troubleshooting continuation.

## 3. User Intent Analysis

Core audit question:

> What does a person actually come to the Ovens page to accomplish?

Options:

| Intent | Fit | Finding |
| --- | --- | --- |
| A. Choose an oven | Medium | Some users compare Home oven and Pizza oven, but DoughTools should not become a purchasing guide. |
| B. Improve an existing oven setup | High | This is the strongest practical job. Most users already have a home oven, steel, stone, tray or pizza oven and need better results. |
| C. Learn baking differences | Medium-high | Important, but it should support the setup decision instead of leading as abstract education. |
| D. Choose equipment | Low-medium | Equipment matters, but if it leads the page the route feels like a gear catalogue. |
| E. Combination with priority | Best | The page should combine learning and planning, but with "improve my oven setup" as the priority. |

Recommended primary intent:

> Help users get better pizza from the oven setup they actually have.

Ideal user journey:

```text
What oven or baking surface do I use?
Then what result should I expect?
Then what setup improves it?
Then how should I preheat, launch, manage and judge the bake?
Then how does this connect to Pizza Plan?
```

Current journey:

```text
Home oven or pizza oven?
Broad comparison image and hero copy
Quick Answer
Home oven and Pizza oven quick cards
Selected bake-management explanation
Choose your oven setup
Four setup paths
Surface readiness and doneness images
Troubleshooting
Multi-pizza recovery
Pizza Plan effect
Safety
Equipment reference
Related learning
Plan a pizza
```

Difference:

- The current flow is educational and correct, but it asks the user to read through orientation before choosing their actual path.
- The future flow should let the user identify their oven path first, then teach inside that chosen path.

## 4. Hero Recommendation

Current hero:

```text
Home oven or pizza oven?
```

Assessment:

- Beginner clarity: medium. The distinction is obvious, but it does not say the page will improve the setup the user already owns.
- Enthusiast usefulness: medium. It points to comparison, not adjustment.
- SEO usefulness: high. Home oven versus pizza oven is a useful search framing.
- DoughTools fit: medium. DoughTools should guide confident action, not just category comparison.

Hero alternatives:

| Option | Headline | Beginner clarity | Enthusiast usefulness | SEO usefulness | Fit |
| --- | --- | --- | --- | --- | --- |
| A | `Choose the right oven setup for your pizza.` | High | Medium | High | Good, but can imply shopping or setup selection before user context. |
| B | `Get better pizza from the oven you already have.` | Highest | High | Medium-high | Best match for confidence and practical improvement. |
| C | `Pizza oven or home oven? Understand the difference.` | Medium | Medium | High | Strong comparison framing, weaker action framing. |

Recommendation:

Use Option B for the future implementation:

```text
Get better pizza from the oven you already have.
```

Supporting copy should immediately clarify that users can choose their setup and follow the matching preheat, position, launch, bake-management and doneness guidance.

The current hero image should be retained, but the hero should be more compact on mobile. The image can remain near the top because it identifies the topic and does not appear decorative. Do not replace it with branded appliance photography.

## 5. Oven Path Recommendation

The page should begin with an oven-path choice.

Recommended entry component:

```text
What oven do you use?

Home oven
Best if you use a tray, stone or steel.

Pizza oven
Best if you bake with a hot floor and flame or strong top heat.

Other setup
Use the closest path, then adjust from the result.
```

Why this should become the main entry point:

- It matches the user's real first question.
- It prevents a beginner from reading every setup as equally relevant.
- It makes mobile feel like a focused learning app.
- It keeps the page product-agnostic and avoids equipment shopping.
- It can preserve all four current setup paths without changing oven logic.

Important constraint:

This should be a presentation aid, not new business logic. The route should still use the same content, timings and Pizza Plan boundaries. If the assistant filters/highlights setup paths, it must not create hidden unsupported Pizza Plan oven types.

Recommended treatment:

- Desktop: compact path selector plus selected/recommended setup path in the same first workspace.
- Mobile: stacked path cards, then the matching setup path immediately.
- No URL-state requirement unless separately approved.
- No separate mobile logic.
- No five-column carousel.

## 6. Equipment Section Recommendation

Current equipment structure:

- `Other equipment`
- summary counts for Essential, Useful and Optional
- one closed `Show more equipment` disclosure
- 13 equipment items with SVG thumbnails and detailed use notes

This is safer than the old gear page, but equipment still has enough mass to revive the catalogue feeling if moved earlier or expanded.

Recommendation:

Use **small supporting cards or a collapsed reference section**, not large cards.

| Item/group | Current role | Recommendation | Reason |
| --- | --- | --- | --- |
| Oven type | Hero and setup paths | Must understand, move into first path decision | The oven itself is the primary decision. |
| Baking surface: steel | Setup path | Must understand for Home oven path | It changes bottom heat and top/bottom balance. |
| Baking surface: stone | Setup path | Must understand for Home oven path | It changes preheat and gentler heat transfer. |
| Baking surface: tray | Setup path | Must understand for simple Home oven path | It sets realistic expectations without requiring gear. |
| Temperature capability | Quick Answer and troubleshooting | Must understand, keep inside path guidance | It affects result and moisture tolerance. |
| Rack position | Setup step and images | Must understand, needs clearer first-path framing | Key Home oven improvement lever. |
| Thermometer | Equipment plus surface readiness image | Useful later or enthusiast support | Important for pizza ovens and some home setups, but not every beginner's first action. |
| Launching peel | Equipment and launch steps | Useful when using stone, steel or pizza oven | Contextual to launch path, not a broad gear card first. |
| Turning peel | Useful equipment | Useful later | Only needed for fast pizza-oven workflow. |
| Digital scale | Essential equipment | Keep as supporting reference | Important to pizza-making overall, but not oven-specific enough to lead this page. |
| Lidded proofing box | Essential equipment | Move out of main oven mental model | Useful dough prep, but not an oven decision. |
| Dough scraper | Essential equipment | Move out of main oven mental model | Useful dough handling, not oven setup. |
| Heat gloves/fire blanket | Essential equipment | Keep as safety support | Safety is important, but should stay compact and appliance-manual led. |
| Prep table/opening-flour tray/cutting tools/cooling rack | Useful equipment | Keep collapsed | Useful station improvements, not core oven guidance. |
| Cover/storage/stone brush | Optional equipment | Keep collapsed or remove from main Ovens route if page length is reduced | Maintenance details can live in reference. |

Future implementation should keep `#other-equipment` alive because `/gear` redirects to `/ovens#other-equipment`, but the section should remain explicitly secondary.

## 7. Guidance-Level Findings

Current implementation:

- `OvensQuickAnswer` reads `doughtools.experienceLevel`.
- It renders one selected guidance block from `bakeManagementByLevel`.
- It does not render all three levels at once.
- Static setup paths remain shared across levels.

Source-reviewed guidance:

| Level | Current selected copy model | Fit |
| --- | --- | --- |
| Beginner | Watch the pizza; check base, rim and adjust one thing at a time. | Good practical baseline. |
| Enthusiast | Balance rack position, surface heat, flame distance and turning frequency. | Good adjustment framing. |
| Pizza Nerd | Treat the bake as conductive/radiant/convective heat balance. | Good technical framing. |

Remaining issue:

Guidance level changes the bake-management explanation only. The rest of the page stays fully expanded and identical. That preserves shared facts, but it does not meaningfully reduce mobile cognitive load for Beginner.

Recommended future model:

- Beginner:
  - Show path choice, simple expected result, the selected setup's five steps and a compact "how to know it worked."
  - Hide or collapse equipment and deep heat explanation.
- Enthusiast:
  - Show path choice, setup steps, surface choice, top/bottom adjustment and troubleshooting.
  - Keep equipment available but secondary.
- Pizza Nerd:
  - Show path choice, setup steps, heat transfer explanation, recovery, surface readiness and detailed troubleshooting.
  - Keep technical explanations behind clear headings so ingredients and actions do not get buried.

Do not change bake recommendations, timings, calculations or Pizza Plan behavior.

## 8. Image Findings

Current asset inventory:

| Asset group | Count | Format | Dimensions | Finding |
| --- | ---: | --- | --- | --- |
| Ovens hero | 1 | WebP | `1756x896` | Useful comparison/topic identifier. Retain. |
| Teaching images | 9 | WebP | `1200x1000` each | Strong instructional value. Retain and keep near steps. |
| Equipment thumbnails | 13 | SVG | `viewBox 0 0 320 240` | Good recognition cues, not teaching images. Keep secondary. |

Current images:

| Image | Current job | Recommendation |
| --- | --- | --- |
| `home-vs-pizza-oven.webp` | Identifies Home oven versus Pizza oven | Retain; do not make larger. |
| `home-oven-steel-position.webp` | Teaches steel position | Retain; use inside Home oven path. |
| `home-oven-stone-position.webp` | Teaches stone position | Retain; use inside Home oven path. |
| `home-oven-tray-position.webp` | Teaches tray position | Retain; use inside Home oven path. |
| `pizza-oven-launch-position.webp` | Teaches pizza-oven launch position | Retain; use inside Pizza oven path. |
| `pizza-oven-turning.webp` | Teaches turning | Retain; keep close to manage-bake step. |
| `oven-surface-temperature-check.webp` | Teaches surface readiness | Retain; consider moving closer to preheat/readiness decision. |
| `pizza-bottom-doneness-comparison.webp` | Teaches readiness/doneness | Retain; consider moving closer to "Know when it is ready." |
| `pizza-heat-balance-comparison.webp` | Teaches top/bottom diagnosis | Retain; keep in troubleshooting or heat-balance explanation. |
| `oven-surface-recovery-between-pizzas.webp` | Teaches recovery between pizzas | Retain; keep in multi-pizza section. |
| Equipment SVGs | Identify tools | Retain only inside collapsed reference; do not promote. |

Image gap:

The existing photos show setup and outcome, but they do not fully explain heat path. Patch 468A already proposed a compact rack/heat-path diagram. That still makes sense, but it should be implemented only if the future Oven Assistant still needs it after layout simplification.

Image brief for future diagram, if needed:

| Field | Brief |
| --- | --- |
| Route | `/ovens` |
| Placement | Home oven path, near rack position/top-bottom heat explanation |
| Image job | Explain rack position and top/bottom heat relationship |
| Subject | Simplified home oven cross-section with upper rack, baking surface, bottom heat and top heat |
| Required visible elements | Oven cavity, rack, steel/stone/tray, top heat, bottom heat, pizza surface |
| Forbidden elements | Brand logos, appliance model details, people, hands, embedded text-heavy labels |
| Type | Diagram/SVG, not photography |
| Desktop aspect ratio | `16:9` |
| Mobile crop | Full-width compact `4:3` or `16:9`, no horizontal scroll |
| Suggested path | `/ovens/teaching/oven-rack-heat-path.svg` |
| Alt draft | `Diagram showing pizza surface position between bottom heat and top heat in a home oven.` |
| Loading | Lazy |
| Existing reuse | Current photos show placement, but not heat path |

No new photography is required for Patch 473B.

## 9. Lower-Page Findings

### `What should I learn next?`

Current:

- Dough
- Practical Tips

Assessment:

- The links are not wrong.
- Dough is relevant before opening, launching and baking.
- Practical Tips is useful after troubleshooting.
- But the block is generic and appears before the final Pizza Plan handoff.
- Recent Dough and Toppings work has moved away from generic cross-topic endings when they interrupt the current learning goal.

Recommendation:

Remove or collapse the generic `What should I learn next?` block in Patch 473B. If kept, make it a small contextual continuation after the final oven task, not a large navigation section.

Preferred lower flow:

```text
Use this oven choice in your plan
Plan a pizza

Need to diagnose a bake result?
Open troubleshooting
```

### `Plan with the oven you actually have`

Current:

- Strong final action.
- Correctly explains Home oven or Pizza oven choice affects preheat, bake guidance and kitchen instructions.
- Appears after related learning and after equipment.

Recommendation:

Keep the concept and move it earlier or make it the clear final page ending immediately after core oven guidance and troubleshooting. It should not be visually subordinate to generic related-guide links.

## 10. Visual Findings

Browser measurements:

| Viewport | Hero top/bottom/height | Quick Answer top/bottom | Setup intro top | First setup top | Equipment top | Related top | Final CTA top | Overflow | Console |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `390x844` | `117 / 684 / 567` | `708 / 2547` | `2579` | `2836` | `12940` | `13484` | `14030` | none | none |
| `430x740` | `117 / 690 / 573` | `714 / 2501` | `2533` | `2754` | `12622` | `13142` | `13688` | none | none |
| `1280x900` | `129 / 690 / 561` | `714 / 1720` | `1752` | `1957` | `8097` | `8424` | `8772` | none | none |
| `1440x900` | `129 / 718 / 589` | `742 / 1724` | `1756` | `1961` | `8092` | `8379` | `8727` | none | none |

First viewport observations:

- Mobile `390x844`: first viewport contains global nav, hero, hero image, Quick Answer heading. It does not reach Home/Pizza quick cards until near the fold and does not reach setup paths.
- Mobile `430x740`: first viewport contains global nav, hero and Quick Answer eyebrow, but not the Quick Answer heading fully.
- Desktop: first viewport contains hero and the top of Quick Answer cards. It does not reach the setup paths.

Visual hierarchy findings:

- The hero image is useful and not decorative, but the hero section is tall on mobile.
- Quick Answer is useful but too tall to sit before the main path choice.
- Setup path cards are readable and professional; keep the vertical process pattern.
- On mobile, every setup step is open by default. This preserves content but causes long scrolling and makes the page feel less like a focused assistant.
- Equipment is correctly disclosed, but the expanded content is massive and visually gear-led.
- The final `PublicPageEnding` uses a large related-learning block before the Plan action, which dilutes the route's current task.
- Color, contrast and spacing are generally consistent with DoughTools. No neon/glow bug was observed.

What should appear in the first viewport:

Desktop:

```text
Compact page purpose
What oven do you use?
Home oven / Pizza oven / Other setup
Beginning of recommended setup path
```

Mobile:

```text
Compact title
What oven do you use?
Selected or first recommended path
First action: Preheat
```

## 11. Three Redesign Concepts

### Concept A - Oven Assistant

Structure:

```text
Get better pizza from the oven you already have.

What oven do you use?
Home oven
Pizza oven
Other setup

Recommended setup
Five-step bake path
Troubleshoot the result
Use this oven in Pizza Plan
Equipment reference
```

Strengths:

- Best match for user intent.
- Mobile-first and action-first.
- Keeps all existing setup content.
- Reduces catalogue feel.
- Fits DoughTools learning philosophy: solve the current problem, then explain.

Risks:

- Needs careful handling so `Other setup` does not imply unsupported Pizza Plan presets.
- Needs responsive disclosure logic so content is not hidden from screen readers or keyboard users.

Verdict: Recommended.

### Concept B - Oven Comparison

Structure:

```text
Compare oven types
Heat
Time
Result
Choose setup
```

Strengths:

- Strong for SEO and general learning.
- Helpful for users considering a pizza oven.
- Current hero already supports this.

Risks:

- Keeps the page in comparison mode too long.
- Can drift back toward equipment categories.
- Less useful for the user who needs to bake tonight with a home oven.

Verdict: Useful secondary content, not the main structure.

### Concept C - Oven Guide

Structure:

```text
Understand your oven
Improve setup
Bake better
```

Strengths:

- Broad educational structure.
- Simple, stable and less interactive.
- Easy to preserve current content.

Risks:

- Still feels like a guide article rather than a decision tool.
- Does not force the first oven-path decision.
- May keep too much explanation before action.

Verdict: Better than a catalogue, but weaker than Oven Assistant.

## 12. Recommended Future Structure

Selected concept: **Concept A - Oven Assistant**.

Recommended Patch 473B structure:

```text
1. Compact hero
   Title: Get better pizza from the oven you already have.
   Short copy: choose your oven setup, then follow the matching bake path.
   Retain current comparison image, but keep it compact.

2. Oven path selector
   What oven do you use?
   Home oven
   Pizza oven
   Other setup

3. Recommended setup workspace
   If Home oven: show steel, stone and tray as practical surface choices.
   If Pizza oven: show pizza oven path.
   If Other setup: explain closest-path choice without creating a planner preset.

4. Five-step process
   Preheat
   Position
   Launch
   Manage the bake
   Know when it is ready

5. Practical result checks
   Surface readiness
   Bottom doneness
   Top/bottom heat balance
   Recovery between pizzas

6. Troubleshooting
   Keep compact. Link to deeper troubleshooting only as needed.

7. Pizza Plan handoff
   Use the same oven choice when you plan.
   Plan a pizza.

8. Equipment reference
   Keep `#other-equipment` alive.
   Keep collapsed and secondary.

9. Footer
```

Content to preserve:

- Four setup paths.
- Five setup step labels.
- Current oven recommendations.
- Current preheat, bake and rotation values.
- Existing teaching images.
- Quick Answer meaning, but not necessarily as a large separate block.
- Troubleshooting.
- Multiple-pizza recovery.
- Pizza Plan effect.
- Safety checks.
- Final Plan a pizza action.

Content to move or reduce:

- Move generic Home/Pizza comparison lower or merge into path selector.
- Move selected bake-management copy into the selected path or result-check section.
- Move equipment after the core baking guidance.
- Remove or collapse generic related learning.

Content not to add:

- Brand/model recommendations.
- Purchase rankings.
- Large appliance product photos.
- New Pizza Plan oven presets.
- New calculations or timing logic.

Future component proposal:

| Component | Responsibility |
| --- | --- |
| `OvenAssistantHero` | Compact page purpose and existing comparison image. |
| `OvenPathSelector` | Lets user identify Home oven, Pizza oven or Other setup as presentation state. |
| `OvenSetupGuide` | Renders the relevant setup path and preserves the five-step process. |
| `OvenSurfaceChoice` | Handles steel, stone and tray as Home oven surface decisions. |
| `OvenBakeChecks` | Groups readiness, doneness, heat balance and recovery images. |
| `OvenTroubleshootingSummary` | Keeps uneven-bake fixes compact and contextual. |
| `OvenEquipmentReference` | Keeps `#other-equipment` and gear content collapsed and secondary. |
| `OvenPlanHandoff` | Connects the selected oven path to `/session/start` without changing Pizza Plan behavior. |

Avoid over-abstracting. If Patch 473B can safely use fewer components, that is preferable.

## 13. Implementation Roadmap

### Patch 473B - Implementation of approved Ovens UX structure

Scope:

- Presentation only.
- Preserve oven logic.
- Preserve Pizza Plan integration.
- Preserve existing data, timings and images.
- Keep `/gear` redirect anchor compatibility with `#other-equipment`.
- Make Ovens feel like a decision tool, not an equipment catalogue.

Recommended acceptance criteria:

1. New hero direction appears.
2. First decision asks what oven/setup the user uses.
3. Practical setup path appears earlier on desktop and mobile.
4. Four setup paths remain available.
5. Five step labels remain unchanged.
6. Existing Ovens teaching images remain.
7. Equipment remains secondary and collapsed.
8. Generic `What should I learn next?` block is removed or reduced.
9. Final Pizza Plan handoff remains clear.
10. Oven calculations, bake recommendations, Pizza Plan integration and sessions remain unchanged.

### Patch 473C - Production verification

Scope:

- Deploy and verify `/ovens`.
- Check desktop and mobile.
- Check accessibility.
- Check responsive behavior.
- Check images and anchors.
- Confirm no Pizza Plan/session/database/API behavior changed.

## Validation Notes

Performed for this audit:

- Source inspection:
  - `app/ovens/page.tsx`
  - `app/ovens/layout.tsx`
  - `components/ovens/OvenGuideHero.tsx`
  - `components/ovens/OvensQuickAnswer.tsx`
  - related Ovens components
  - `lib/oven-education.ts`
  - `lib/ovens.ts`
  - focused Ovens tests
  - design and imagery governance docs
- Route inspection:
  - `/ovens` local production rendering at `http://localhost:3100/ovens`
- Image inventory:
  - all assets under `public/ovens/`
- Browser review:
  - `390x844`
  - `430x740`
  - `1280x900`
  - `1440x900`
- Browser findings:
  - no horizontal overflow
  - no console errors or warnings observed
  - images rendered
  - setup paths are readable but late
  - page is long on mobile

Guidance-level note:

The Ovens page reads the shared experience-level preference but does not expose a route-local guidance selector. Browser measurement used the current rendered state, while the Beginner, Enthusiast and Pizza Nerd variants were audited from `components/ovens/OvensQuickAnswer.tsx`.

No deployment was performed.
