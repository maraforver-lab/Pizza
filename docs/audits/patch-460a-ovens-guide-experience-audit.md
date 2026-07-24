# Patch 460A: Ovens Guide Experience And Teaching Imagery Audit

Starting commit: `85006d28624be9fa8ee0295dae58e67176206c8b`

Scope: audit-only. Inspected the canonical Ovens guide route, directly related Ovens components/content, local Ovens image assets, focused Ovens tests and responsive rendering. No production code, Pizza Plan workflow, oven-selection flow, Bake Timer, Kitchen, APIs, database, header, navigation or footer were changed.

## Canonical Route

The canonical route is `/ovens`, not `/guides/ovens`.

Primary files checked:

- `app/ovens/page.tsx`
- `components/ovens/OvenGuideHero.tsx`
- `lib/oven-education.ts`
- `lib/pizza-session-bake-profile.ts`
- `tests/ovens.test.ts`
- `docs/research/pizza-oven-sources.md`
- `public/ovens/**`

## Executive Conclusion

`/ovens` is already a compact and useful baking guide compared with the earlier encyclopedia-style page. It answers the broad Home oven versus Pizza oven decision, keeps product truth aligned with the two supported Pizza Plan oven choices, avoids brands and rankings, and includes practical surface, troubleshooting, safety and equipment guidance.

The main gap is teaching clarity. The page still relies heavily on text for actions that are easier to learn visually: rack placement, floor readiness, launching, turning, doneness, top-versus-bottom heat balance and surface recovery. It also renders all three Home oven guidance levels together instead of showing only the selected guidance level, which adds mobile reading load and differs from the current DoughTools learning pattern.

The safest follow-up is not a redesign from scratch. Keep the existing route and product boundaries, then add a focused quick-answer layer, selected-level guidance and local realistic teaching images.

## Current Page Structure

Current route order observed in source and browser review:

1. Breadcrumbs.
2. Hero: `Home oven or pizza oven?`
3. Broad Home oven / Pizza oven comparison.
4. Ordered bake instructions for Pizza oven and Home oven.
5. Home-oven level guidance.
6. Stone, steel and tray guidance.
7. Compact troubleshooting: pale base, burnt base/pale top, top burns first, later pizzas get worse.
8. Pizza plan effect.
9. Safety checks.
10. Disclosed equipment guide.
11. Final `Plan a pizza` CTA.
12. Shared footer.

Browser review confirmed no horizontal overflow at `390x844`, `430x740`, `1280x900` or `1440x900`.

## What Already Works

| Area | Status | Evidence |
| --- | --- | --- |
| Canonical route | Keep | `/ovens` is the route in `app/ovens/page.tsx` and SEO tests. |
| Product truth | Keep | `pizzaSessionOvenSupportSummary` correctly says Pizza Plans use two broad choices: Home oven and Pizza oven. |
| Shared timing source | Keep | `/ovens` reads `getPizzaSessionBakeProfile(...)`; it does not define new planner timing. |
| Broad oven comparison | Keep, improve hierarchy | Heat, preheat, placement, bake time and expected result are visible. |
| Home oven guidance | Keep, make selected-level | Temperature, rack placement, surface readiness and broiler/grill caution are present. |
| Surface comparison | Keep | Steel, stone and tray are clear and concise. |
| Troubleshooting | Keep, make more visual | The page teaches top/bottom mismatch and recovery patterns. |
| Safety | Keep | Manual, outdoor-only oven and cooling guidance are visible before the final CTA. |
| Equipment disclosure | Keep as supporting detail | It is useful but should not become the main learning experience. |
| Header/nav/footer boundaries | Keep | The page uses shared navigation and `SiteFooter`; no route-specific content appears after the footer. |

## Principal UX Problems

1. The first practical decision arrives slightly late on mobile. At `390x844`, the first major comparison heading starts around `724 px`, after the hero and image. The page is not broken, but a beginner does not get a direct "do this first" answer immediately.

2. Home oven guidance renders all three levels at once. `app/ovens/page.tsx` defines `homeOvenLevelGuidance` and renders Beginner, Enthusiast and Pizza Nerd together. Current tests explicitly assert all three labels. This conflicts with the intended model: show only the selected guidance level in user-facing educational sections.

3. The page describes actions instead of showing them. Important real-world skills are text-only: launching, turning, judging floor readiness, checking the bottom, recognizing a pale top/burnt base imbalance and pacing multiple pizzas.

4. Home oven has one broad bucket while the learning need is setup-specific. The guide mentions tray, stone and steel, but it does not present them as clear practical setup paths. A user with a tray, stone or steel needs slightly different expectations.

5. Dedicated pizza oven guidance is accurate but abstract. It mentions floor readiness, placement and rotation, but there is no visual example of a balanced launch spot, flame/top-heat distance, or turning sequence.

6. The equipment images support recognition, not baking decisions. The SVG thumbnails help identify tools, but they do not teach the key oven actions.

## Culinary And Technical Findings

| Topic | Current Coverage | Finding |
| --- | --- | --- |
| Oven setup | Home oven and Pizza oven are distinguished clearly. | Good broad foundation; needs setup paths for pizza oven, home steel, home stone and tray. |
| Target temperature | Home oven says `highest reliable oven temperature`; Pizza oven uses a high-heat profile. | Safe wording; beginner quick answer should explain the practical starting point without changing planner defaults. |
| Preheat readiness | Strong coverage: surface readiness is separated from oven air. | Keep. Add a visual IR/floor-readiness example later. |
| Stone vs steel vs tray | Present and balanced. | Keep; expand only enough to show setup differences. |
| Pizza oven floor | Floor readiness and recovery are mentioned. | Needs clearer visual teaching. |
| Launching | Launch onto a balanced floor spot is present. | Missing action-level detail and image support. |
| Turning/moving | Rotate guidance exists. | Missing visual rhythm and "move away from strongest heat" example. |
| Doneness | Rim, bottom and cheese are named. | Needs bottom/readiness visual. |
| Wet or overloaded pizzas | Mentioned through troubleshooting and Pizza Plan effect. | Useful; can link to toppings instead of expanding here. |
| Safety | Conservative and well supported by research notes. | Keep visible to all users. |

Source support remains appropriate: `docs/research/pizza-oven-sources.md` backs outdoor safety, manufacturer-manual caution, steel/stone behavior, surface readiness, IR thermometer use and common user failure patterns.

## Guidance-Level Findings

The intended model should be:

- Beginner: one safe default setup and immediate practical actions.
- Enthusiast: adjustment guidance based on what happened in the bake.
- Pizza Nerd: concise explanation of air temperature, surface temperature, heat transfer and recovery.

Current issue:

- All three level blocks render together in `app/ovens/page.tsx`.
- The page does not appear to read the current shared guidance-level selector for this section.
- Pizza oven guidance does not have equivalent selected-level depth.

Recommendation: future implementation should reuse the existing sitewide guidance-level pattern and render only one selected-level explanation. Do not create a separate user-level setting for `/ovens`.

## Mobile Findings

Viewport checks:

| Viewport | Result |
| --- | --- |
| `390x844` | No horizontal overflow. First comparison around `724 px`. Page height about `8244 px` with footer. |
| `430x740` | No horizontal overflow. First comparison around `730 px`. Page height about `7782 px` with footer. |

Mobile is readable, but not yet action-first. The user sees the hero and broad comparison before a direct "use this setup" answer. The all-level Home oven block increases scroll length and cognitive load. The equipment disclosure is acceptable as secondary content, but should not be expanded into a gear-led experience.

Mobile recommendation:

- Add a compact quick answer early.
- Show one selected-level guidance block.
- Use small image-led examples for launch, placement, heat balance and doneness.
- Keep equipment disclosed and secondary.

## Desktop Findings

Viewport checks:

| Viewport | Result |
| --- | --- |
| `1280x900` | No horizontal overflow. Two-column comparison and instruction sections work. Page height about `4614 px`. |
| `1440x900` | No horizontal overflow. Two-column layout is balanced. Page height about `4494 px`. |

Desktop has enough width to support practical comparison layouts. The current two-column cards are clean, but the page could teach better with side-by-side oven setup cards and realistic image/copy pairings. Avoid rebuilding the retired encyclopedia-style page.

## Repetition To Remove Or Reduce

- Preheat appears in the comparison, ordered steps and Pizza Plan effect. Keep the concept, but give each occurrence a distinct job: quick answer, setup instruction, then product consequence.
- Stone/steel/tray appear in placement, Home oven steps and surface guidance. Keep the dedicated surface section as the main explanation and shorten earlier mentions.
- Troubleshooting and heat balance should remain compact; avoid repeating the same "preheat longer / reduce wet toppings" message across multiple cards.

## Missing Practical Guidance

The page should more clearly answer:

- "What setup should I use today?" for dedicated pizza oven, home oven with steel, home oven with stone and home oven with tray.
- Where the surface goes in a home oven and why upper-middle/upper-third is a starting point, not a universal rule.
- How to tell whether the oven floor, stone or steel is ready.
- How to launch onto a hot surface without overloading the pizza or burning excess flour.
- When and how to rotate or move the pizza.
- How to read the bottom, rim and cheese together.
- How to pace multiple pizzas when the surface cools.

## Image Inventory

| File | Dimensions | Size | What It Teaches | Realism | Accuracy | Visibility | Recommendation |
| --- | ---: | ---: | --- | --- | --- | --- | --- |
| `public/ovens/home-vs-pizza-oven.webp` | `1756x896` | `97,732 bytes` | Home oven and pizza oven outputs/setups compared side by side. | Realistic | Credible broad comparison. | Hero, visible. | Retain; useful hero, not enough for action teaching. |
| `public/ovens/equipment/cooling-rack-cutting-board.svg` | `viewBox 0 0 320 240` | `676 bytes` | Cooling/serving tool recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail; not a teaching image. |
| `public/ovens/equipment/cover-storage.svg` | `viewBox 0 0 320 240` | `736 bytes` | Outdoor oven cover/storage recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/digital-scale.svg` | `viewBox 0 0 320 240` | `813 bytes` | Scale recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/dough-scraper.svg` | `viewBox 0 0 320 240` | `794 bytes` | Scraper recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/fire-blanket-heat-gloves.svg` | `viewBox 0 0 320 240` | `797 bytes` | Heat and fire-safety gear recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain; safety image gap still needs realistic handling visual. |
| `public/ovens/equipment/infrared-thermometer.svg` | `viewBox 0 0 320 240` | `814 bytes` | IR thermometer recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain; add real surface-check teaching image later. |
| `public/ovens/equipment/launching-peel.svg` | `viewBox 0 0 320 240` | `707 bytes` | Launch peel recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain; add real launch teaching image later. |
| `public/ovens/equipment/lidded-proofing-box.svg` | `viewBox 0 0 320 240` | `918 bytes` | Dough box recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/opening-flour-tray.svg` | `viewBox 0 0 320 240` | `673 bytes` | Flour tray recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain; warn against excess launch flour in copy. |
| `public/ovens/equipment/stable-prep-table.svg` | `viewBox 0 0 320 240` | `800 bytes` | Prep-table organization. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/stone-brush-scraper.svg` | `viewBox 0 0 320 240` | `729 bytes` | Surface cleaning tool recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |
| `public/ovens/equipment/turning-peel.svg` | `viewBox 0 0 320 240` | `655 bytes` | Turning peel recognition. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain; add real turning visual later. |
| `public/ovens/equipment/wheel-pizza-scissors.svg` | `viewBox 0 0 320 240` | `837 bytes` | Cutting tools. | Stylized, not realistic. | Credible object cue. | Equipment disclosure. | Retain as equipment thumbnail. |

Image conclusion: existing Ovens assets are local and safe. The single realistic hero image is useful, but the page lacks realistic teaching images for the actual baking decisions. The SVGs are acceptable equipment recognition assets, not substitutes for process visuals.

## Image-Gap Plan

Future images should be optimized local WebP assets under `public/ovens/teaching/`. Do not use external URLs, branded ovens, visible people, hands, logos or manufacturer-specific controls.

| Missing image | Teaching purpose | Oven type | Scene composition and crop | Suggested filename | Placement |
| --- | --- | --- | --- | --- | --- |
| Dedicated pizza oven preheat/floor readiness | Show that the floor matters, not only flame. | Pizza oven | Pizza oven floor with clear hot deck area and restrained flame; no hands. | `pizza-oven-floor-ready.webp` | Quick setup or preheat section. |
| Home oven steel rack setup | Show steel on upper-middle/upper-third rack. | Home oven with steel | Open home oven with steel on upper rack position, empty surface. | `home-oven-steel-upper-rack.webp` | Home steel setup card. |
| Home oven stone rack setup | Show stone as gentler surface and rack placement. | Home oven with stone | Home oven stone on upper-middle rack, clean neutral crop. | `home-oven-stone-upper-middle.webp` | Home stone setup card. |
| Tray fallback | Show a tray as a valid accessible fallback. | Home oven tray | Sheet tray or inverted tray in home oven, not a decorative pizza shot. | `home-oven-tray-fallback.webp` | Tray setup card. |
| Launch onto hot surface | Teach peel-to-surface alignment and empty hot surface. | Both | Topped pizza on peel at mouth of oven/surface, no hands, no brand. | `launch-onto-hot-surface.webp` | Launch/manage bake section. |
| Turning/moving pizza | Show controlled rotation without a dense action sequence. | Pizza oven | Pizza rotated partway through bake using visible turning peel, no hands. | `pizza-oven-turning.webp` | Pizza oven management section. |
| Surface temperature check | Teach IR thermometer use against the same floor spot. | Both | IR thermometer pointed at stone/steel/floor with readable but not branded display. | `surface-temperature-check.webp` | Preheat readiness section. |
| Bottom doneness comparison | Show pale, balanced and burnt bottom states. | Both | Three underside slices or pizza bases side by side. | `bottom-doneness-comparison.webp` | Doneness/troubleshooting section. |
| Pale top / burnt bottom | Teach top-versus-bottom imbalance. | Home oven with steel | One pizza with dark base cue and pale top cue in split comparison. | `burnt-base-pale-top.webp` | Troubleshooting card. |
| Burnt top / pale base | Teach too much top heat or weak surface. | Pizza oven/home broiler | Split comparison of scorched rim/top and pale underside. | `burnt-top-pale-base.webp` | Troubleshooting card. |
| Surface recovery between pizzas | Show first pizza vs later pale pizza or cooling floor spot. | Both | Two-bake comparison or hot/cool launch zone visual. | `surface-recovery-between-pizzas.webp` | Multiple-pizza/recovery section. |
| Safe hot-tool handling | Reinforce heat gloves/cooling without showing people. | Both | Gloves beside hot tray/stone with clear cooling space. | `hot-surface-safety.webp` | Safety section. |

## Recommended Final Hierarchy

1. Hero: retain current title and local hero image, shorten supporting copy if needed.
2. Quick answer: `What should I do with my oven now?`
3. Selected-level guidance only:
   - Beginner: choose one setup, preheat fully, bake one pizza, adjust from result.
   - Enthusiast: adjust top/bottom heat, surface choice and recovery.
   - Pizza Nerd: air temperature, surface temperature, heat transfer and recovery.
4. Choose your oven setup:
   - Dedicated pizza oven.
   - Home oven with steel.
   - Home oven with stone.
   - Home oven with tray.
5. Preheat and confirm surface readiness.
6. Launch and manage the bake.
7. Know when the pizza is done.
8. Fix heat problems from the baked result.
9. Bake multiple pizzas and let the surface recover.
10. Safety checks.
11. Compact equipment disclosure.
12. Final `Plan a pizza` CTA.
13. Footer.

## Decision Table

| Decision | Item | Rationale |
| --- | --- | --- |
| Keep | `/ovens` canonical route | Current route is established and tested. |
| Keep | Home oven / Pizza oven product-support truth | Avoids implying unsupported planner presets. |
| Improve | Mobile first answer | Add one early practical answer before broad comparison. |
| Improve | Guidance levels | Render only the selected level. |
| Merge | Repeated preheat/surface wording | Keep one action-oriented path and one short product consequence note. |
| Move | Some equipment emphasis | Keep equipment after core bake decisions. |
| Add | Setup-specific cards | Users need steel, stone, tray and pizza oven paths explained as setups. |
| Add | Realistic teaching images | Current process-critical skills are not visually taught. |
| Remove | Nothing in current route needs immediate removal | The page is concise enough; improvements should replace or shorten as they add clarity. |

## Recommended Implementation Patches

### Patch 460B: Add Ovens quick answer and selected-level guidance

Scope:

- `/ovens` presentation and focused tests only.
- Add a compact early quick answer.
- Reuse existing guidance-level state.
- Render only one selected-level explanation.
- Preserve current timings, product support, route, header, navigation and footer.

### Patch 460C: Clarify practical oven setup paths

Scope:

- `/ovens` content hierarchy and focused tests only.
- Add setup cards for dedicated pizza oven, home steel, home stone and home tray.
- Tighten preheat, rack placement, launch, turning, doneness and recovery sections.
- Avoid changing Pizza Plan oven choices or formulas.

### Patch 460D: Add Ovens teaching imagery

Scope:

- Ovens-specific local WebP assets and presentation tests.
- Add the minimum realistic teaching images needed for setup, launch, turning, doneness, heat-balance and safety.
- Keep existing hero and equipment SVGs unless a future implementation image replaces their role directly.

## Browser Review Notes

| Viewport | Route | Findings |
| --- | --- | --- |
| `390x844` | `/ovens` | No horizontal overflow. Hero and comparison are readable. First major comparison appears around `724 px`. Page is long but clean. |
| `430x740` | `/ovens` | No horizontal overflow. Similar mobile flow; first useful comparison around `730 px`. |
| `1280x900` | `/ovens` | No horizontal overflow. Two-column comparison works. Desktop could support richer visual comparisons without clutter. |
| `1440x900` | `/ovens` | No horizontal overflow. Layout remains balanced; content still text-led. |

## Validation

Ran inspection only, per audit scope:

- Focused source inspection of `/ovens`, Ovens components, Ovens tests and research notes.
- Complete local image asset inventory for `public/ovens/**`.
- Visual inspection of `public/ovens/home-vs-pizza-oven.webp`.
- Browser review of `https://www.doughtools.app/ovens` at `390x844`, `430x740`, `1280x900` and `1440x900`.
- `git diff --check`.

No tests, lint, build, migrations or deployment were run or performed for this audit-only patch.
