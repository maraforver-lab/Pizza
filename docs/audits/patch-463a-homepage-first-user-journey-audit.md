# Patch 463A: Homepage and first-time user journey audit

## Executive summary

The current Homepage is visually strong and communicates the core promise: better pizza comes from planning before baking. The primary action, `Plan a pizza`, is clear on mobile and desktop, and the desktop hero feels premium and food-led.

The main issue is not quality; it is focus. The page tries to prove the same planning promise through many large sections before giving a first-time user a simple choice between making a pizza now, learning first, or using a quick utility. On mobile the page is especially long: the first action is visible early, but the first inspiring food image and the learning path arrive too late.

Conclusion: create one small follow-up implementation patch to simplify the Homepage hierarchy before polishing imagery or secondary discovery. Do not change Pizza Plan logic, session behavior, navigation, footer, or calculator math.

## Files and routes inspected

Route:

- `/`

Source files:

- `app/page.tsx`
- `components/HomepageSessionActions.tsx`
- `components/HomepageGuidanceLevelSection.tsx`
- `lib/homepage.ts`
- `lib/navigation.ts`
- `tests/homepage.test.ts`
- `tests/homepage-active-session.test.ts`
- `docs/experience-principles.md`
- `docs/global-responsive-ux-rules.md`
- `docs/visual-style-guide.md`
- `docs/sitewide-hero-and-imagery-system.md`

Browser review:

- Production `/` was reviewed at 390x844, 430x740, 1280x900 and 1440x900 because local development startup did not become responsive without running a build, which this audit patch explicitly forbids.
- No horizontal overflow was observed in the reviewed production viewports.
- Local source inspection was used for current-master structure and route behavior.

## Current Homepage structure

1. Hero: `Better pizza starts before the oven.`
2. Primary action: `Plan a pizza`
3. Secondary action: `See how it works`
4. Value chips: `Know when to start`, `Know what to buy`, `Know what to do next`
5. `What changes`
6. `Why DoughTools exists`
7. `How it works`
8. `More than a dough calculator`
9. `See DoughTools in action`
10. `The result`
11. `Guidance for every level`
12. Founder story
13. Final `Ready to plan a pizza?` CTA
14. Shared footer

## What already works

- The hero promise is strong and outcome-led.
- `Plan a pizza` is the correct dominant first action.
- The active-plan behavior is useful: returning users can see `Continue your pizza plan`.
- The hero image is realistic, local and strong on desktop.
- Global navigation exposes the main entry points: `Plan a pizza`, `Pizza guides`, `Quick dough calculator`, `About` and `Account`.
- Homepage copy uses the current approved terminology.
- The page does not modify Pizza Plan data, calculations, routes, authentication, APIs or persistence.

## First-time user journey findings

| Question | Current answer | Finding |
| --- | --- | --- |
| What is DoughTools? | A pizza planning companion that creates recipe, shopping, Timeline, Kitchen and Review steps. | Clear. |
| Who is it for? | Implied home pizza makers. | Good, but could be more explicit in supporting copy. |
| What should I click first? | `Plan a pizza`. | Clear and correct. |
| What if I want to learn first? | Mainly available through global navigation. | Needs clearer body-level discovery. |
| Is this a guide, calculator or workflow? | The Homepage presents all three concepts across the page. | Too much for a first visit. |
| Is the next step safe? | The page implies planning first and keeps logic elsewhere. | Correct. |

## Biggest UX problems

### 1. The page is too long for the first decision

The Homepage has about ten major content sections before the footer. On the reviewed mobile production page, the document height was over 11,000 pixels. The page repeatedly explains planning, guessing and next actions across `What changes`, `Why DoughTools exists`, `How it works`, `More than a dough calculator`, `See DoughTools in action` and `The result`.

Impact: a first-time user can still click `Plan a pizza`, but the learning path and product model become harder to scan than they need to be.

Severity: High.

### 2. Learning and making are not separated clearly enough

The product has two important public jobs:

- make a pizza with a `Pizza plan`
- learn the craft through `Pizza guides`

The hero correctly favors `Plan a pizza`, but the body does not quickly explain this split. `Pizza guides` exists in the navigation and content model, but the currently rendered Homepage body does not make it a clear early path.

Impact: users who are unsure whether to start planning or learn first may miss the Guide ecosystem.

Severity: High.

### 3. Mobile delays the visual reward

At 390x844, the mobile hero image appears only as a lower sliver of the first viewport. At 430x740, the image starts below the first viewport. The text and CTA are clear, but the page sells the product less emotionally on small screens than on desktop.

Impact: mobile users get the task, but not as much immediate appetite or confidence.

Severity: Medium.

### 4. Secondary entry points compete indirectly

The header exposes `Pizza guides` and `Quick dough calculator`, the hero offers `See how it works`, and lower sections introduce guidance levels, product moments and founder story. Each is individually reasonable, but together they make the first-time path less decisive.

Impact: the first action remains clear, but the secondary journey is not as clean as it could be.

Severity: Medium.

### 5. Guidance level is useful but appears late and feels like setup

`Guidance for every level` explains an important product principle: same calculations, different explanation. On the Homepage, though, it appears after several proof sections. It may be better after a shorter Make/Learn explanation or reserved mainly for Settings and Guide surfaces.

Impact: low risk, but currently adds another concept before the user has started.

Severity: Low.

## Mobile findings

- The hero text and `Plan a pizza` action are visible early.
- No horizontal overflow was observed at 390x844 or 430x740.
- The first viewport is text-heavy, and the hero image is delayed.
- The page length creates a heavy scroll experience for a first-time user.
- The current order explains the product several times before exposing a compact learning path in the page body.
- Mobile should prefer: promise, primary action, Make/Learn split, compact workflow, then lower supporting proof.

## Desktop findings

- The desktop hero at 1440x900 is strong, premium and visually balanced.
- The first viewport gives a clear headline, primary action and food image.
- Desktop has enough width for richer proof, but the current sequence still feels like several large landing-page arguments rather than one guided entry point.
- The page could preserve its visual quality while removing or merging repeated sections.

## CTA findings

Keep:

- `Plan a pizza` for entering the Pizza Plan workflow.
- `Continue your pizza plan` for active plans.
- `See how it works` as a quiet secondary hero action if the next section is simplified.

Improve:

- Add an early body-level `Pizza guides` learning path.
- Keep `Quick dough calculator` as a utility, not a competing primary path.
- Avoid adding more CTA synonyms.

## Terminology findings

Current user-facing terminology is mostly consistent:

- `Plan a pizza`
- `Pizza plan`
- `Pizza guides`
- `Quick dough calculator`
- `Timeline`
- `Kitchen`
- `Review`

Do not revert to older CTA terms such as `Plan my next pizza`, `Create my pizza plan`, or `Pizza Session`.

## Imagery findings

Keep:

- Current local Homepage hero images.
- Existing food-led visual direction.

Improve later:

- Adjust mobile hero presentation so food/result imagery contributes earlier without pushing the CTA down.
- Do not add decorative imagery or unrelated interface screenshots.
- Do not add AI-generated people, hands or silhouettes.

## Recommended final hierarchy

1. Hero
   - `Better pizza starts before the oven.`
   - `Plan a pizza`
   - quiet `See how it works`
   - local food/result image visible earlier on mobile where possible

2. Make or learn
   - `Plan a pizza`: create a guided pizza plan
   - `Pizza guides`: learn dough, sauce, toppings and baking
   - `Quick dough calculator`: quick utility, visually secondary

3. How DoughTools guides pizza night
   - compact version of Plan a pizza, Shopping list, Timeline, Kitchen and Review

4. Learn the reasons
   - curated links to Dough, Sauce, Toppings, Ovens and Practical Tips

5. Trust and fit
   - local-first/resume reassurance and guidance-level principle, shortened

6. Final `Plan a pizza` CTA

7. Shared footer

## Decision table

| Area | Decision | Notes |
| --- | --- | --- |
| Hero headline | Keep | Strong and outcome-led. |
| Primary CTA | Keep | `Plan a pizza` is correct. |
| Active-plan handling | Keep | Useful returning-user behavior. |
| Hero image | Improve | Keep asset; improve mobile timing/crop in a later patch. |
| `What changes` | Merge | Useful idea, but overlaps with workflow proof. |
| `Why DoughTools exists` | Merge | Good message, currently repeats guesswork framing. |
| `How it works` | Keep and shorten | Best place to explain the workflow. |
| `More than a dough calculator` | Merge | Useful distinction, but should not need a large section. |
| Product moments | Merge or shorten | Helpful proof, but too much page weight. |
| `The result` | Merge | Strong line, but repeats hero outcome. |
| Guidance level | Move or shorten | Useful product rule; should not feel like required setup. |
| Founder story | Shorten or move lower | Valuable trust, but secondary to first action. |
| Guide discovery | Add | Needs early body-level Make/Learn distinction. |

## What should not change

- Pizza Plan workflow, routes, calculations, validation or persistence.
- Session start, recipe, Shopping, Timeline, Kitchen or Review behavior.
- Global header, top navigation or footer.
- Account, authentication, privacy, APIs, database or migrations.
- Quick calculator formulas.
- Guide page content.
- Current approved terminology.

## Maximum three follow-up patches

### Patch 463B: Simplify Homepage hierarchy and add Make/Learn split

Scope:

- `app/page.tsx`
- `lib/homepage.ts` only if content constants need cleanup
- focused Homepage tests

Goal:

- reduce repeated proof sections
- add an early `Make or learn` section
- make `Pizza guides` discoverable without competing with `Plan a pizza`

Exclusions:

- no navigation, footer, workflow, session or calculator changes

### Patch 463C: Polish mobile Homepage hero

Scope:

- Homepage hero layout and responsive image presentation
- focused Homepage responsive tests

Goal:

- keep CTA early
- bring the food/result image into the mobile first impression more effectively
- avoid horizontal overflow and oversized cards

Exclusions:

- no new images unless explicitly approved
- no copy overhaul

### Patch 463D: Tighten Homepage guide and utility entry points

Scope:

- lower Homepage learning/utility cards
- focused Homepage and route-link tests

Goal:

- clarify `Pizza guides` versus `Quick dough calculator`
- keep `Plan a pizza` as the dominant workflow handoff
- remove duplicate CTA language

Exclusions:

- no Guide page redesign
- no calculator logic changes

## Validation performed

- Source inspection of Homepage route, Homepage action components, guidance-level selector, navigation data and focused Homepage tests.
- Production browser review of `/` at 390x844, 430x740, 1280x900 and 1440x900.
- Confirmed no horizontal overflow in reviewed production viewports.
- Confirmed desktop first viewport has strong hero, primary action and food image.
- Confirmed mobile first viewport has the primary action early, with image delayed below or near the fold.
- Local development browser review was attempted, but the development server did not become responsive without running a build. Build was not run because this patch is audit-only.

## Final conclusion

The Homepage can be improved without a redesign. Keep the visual direction and primary `Plan a pizza` action, then reduce repeated sections and expose a simple first-time choice:

- make a pizza now
- learn with Pizza guides
- use the quick calculator only when that is the job

The backlog should create one small implementation patch first: simplify the Homepage hierarchy and add the Make/Learn split. Mobile hero polish and lower entry-point cleanup can follow if still needed.
