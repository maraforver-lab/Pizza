# Patch 399: Remaining Utility Route Role Audit

## 1. Executive summary

Patch 399 audited the four remaining standalone utility routes after the legacy-route cleanup and Kitchen Mode density work:

- `/calculator/quick`
- `/toppings`
- `/costs`
- `/timer`

Audited branch: `patch/399-remaining-utility-role-audit`

Audited starting commit: `b71234909908db5113c297da74e192b08152d9eb`

Audit date: 2026-07-15

This patch is documentation-only. It did not change production code, tests, route behavior, navigation, sitemap, metadata, formulas, persistence, schemas, authentication, Party Orders, Kitchen Mode or deployment state.

High-level decision:

| Route | Recommendation | Summary |
| --- | --- | --- |
| `/calculator/quick` | KEEP, BUT DEMOTE | Valuable standalone expert calculator with saved quick recipes and share URLs. Keep indexed, but clarify it is secondary to Pizza Session and reduce first-class product exposure. |
| `/toppings` | INTEGRATE, KEEP ROUTE | Unique topping balance and moisture lab. Keep route, but make it contextual from Sauce, Shopping, Ovens and Troubleshooting rather than a primary product concept. |
| `/costs` | KEEP, BUT DEMOTE | Useful editable cost estimator, but lower fit with the cooking workflow and trust risk from user-entered/static assumptions. Keep as secondary utility; consider later Shopping or Party Order integration. |
| `/timer` | INTEGRATE, KEEP ROUTE | Unique browser timer, sound, wake-lock, overtime and inspection-light behavior. Integrate core bake-timer value into Kitchen later while retaining standalone utility. |

Recommended first implementation patch: Patch 400 should integrate Timer capability into Kitchen bake context while preserving `/timer` as a small standalone utility.

## 2. Audit scope and method

The audit used the current repository as source of truth. It inspected:

- `app/calculator/quick/**`
- `components/quick-calculator/**`
- `lib/quick-calculator/**`
- `app/toppings/**`
- `components/toppings/**`
- `lib/topping-balance-lab.ts`
- `lib/topping-calculator.ts`
- `app/costs/**`
- `components/costs/**`
- `lib/cost-calculator.ts`
- `lib/cost-comparison.ts`
- `app/timer/**`
- navigation, homepage, footer and workflow link sources
- SEO and sitemap configuration
- route-link references
- test references
- production build output
- browser validation at 390x844, 430x740, 1280x900 and 1440x950

Validation performed:

- route inventory: 36 `app/**/page.tsx` routes
- public sitemap route inventory: 18 `publicSeoRoutes`
- repository-wide utility link search
- direct and reverse dependency searches
- sitemap and metadata inspection
- test inventory
- `npm run build`
- production-server browser validation
- query/share/local-state spot checks

## 3. Current product architecture

Current canonical Pizza Session spine:

```text
/session/start
-> /session/recipe
-> /session/shopping
-> /session/timeline
-> /session/kitchen
-> /session/review
```

Current canonical learning system:

```text
/guide
├── /guides/dough
├── /guide/pizza-troubleshooting
├── /sauce
├── /styles
└── /ovens
```

Remaining utility page tree:

```text
Supporting Utilities
├── /calculator/quick
│   ├── QuickDoughCalculator
│   ├── quick dough engine
│   ├── sizing presets
│   ├── preferment presets
│   ├── advanced dough tools
│   ├── saved quick recipes
│   └── share URL state
├── /toppings
│   ├── ToppingBalanceLab
│   ├── topping balance engine
│   ├── topping load compatibility logic
│   ├── visual WebP references
│   └── share URL state
├── /costs
│   ├── PizzaCostsPlayfulClient
│   ├── cost calculator
│   ├── cost comparison summary
│   ├── editable ingredient assumptions
│   └── currency preference
└── /timer
    ├── standalone timer UI
    ├── style default durations
    ├── query-derived recipe context
    ├── wake lock
    ├── audio and vibration cues
    ├── overtime state
    └── inspection light / torch fallback
```

## 4. Current navigation exposure

Current exposure table:

| Route | Header / mobile global nav | Shared navigation model | Footer | Homepage | Contextual links | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| `/calculator/quick` | Tools dropdown | No direct item; main dough calculator is `/?calculator=1` | Product group | Not in homepage coreTools | Mostly footer/header only | Yes |
| `/toppings` | Tools dropdown | Make pizza group | No | Core tools | Sauce, Ovens, Troubleshooting, Costs, calculator workflow, saved recipe workflow | Yes |
| `/costs` | No | More tools group | Product group | Secondary tools | Home calculator cost pills, Costs page links to Toppings/Sauce | Yes |
| `/timer` | No | Make pizza group | No | Core tools | Recipe workflow, saved recipe workflow, HomeCalculatorWorkspace | Yes |

Navigation findings:

- `/toppings` and `/timer` are exposed as "Make pizza" concepts in `lib/navigation.ts`, which can compete with the canonical Pizza Session spine.
- The actual global header Tools dropdown exposes only `/calculator/quick` and `/toppings`.
- `/calculator/quick` appears in the footer as Product even though it is secondary to Pizza Session.
- `/costs` is in the footer Product group and the shared navigation "More tools" group, but it has weaker journey fit than the core workflow.
- `/timer` is not in the footer or global Tools dropdown, but it remains in homepage and recipe handoff surfaces.
- `/costs` reads recipe query data, but `statefulQueryParamRoutes` does not include `/costs`; this is acceptable today because canonical URLs strip query params, but it should be considered in any future SEO cleanup.

Recommended future navigation model:

- Primary navigation: `Plan my next pizza`, `Learning Center`, `Account`.
- Secondary Tools: `Quick Dough Calculator` and possibly `Timer` after Kitchen integration, with copy that makes them supporting utilities.
- Contextual actions:
  - Toppings from Shopping, Sauce, Ovens and Troubleshooting.
  - Timer from Kitchen bake steps and standalone utility entry.
  - Costs from Shopping or Party Orders if integrated.
- Footer: trust/legal/support, Learning Center, Plan my next pizza, account/order links, and at most one or two durable utility links.

## 5. Quick Calculator audit

### Exact job

`/calculator/quick` lets a user calculate dough amounts without creating a Pizza Session. It is a fast standalone dough calculator for users who want direct control over dough size, fermentation, preferments and advanced dough variables.

It deliberately does not provide:

- Shopping list
- Timeline
- Kitchen Mode
- Review
- active-session persistence
- cloud-backed Pizza Session workflow

### Implementation inventory

Owned or route-specific:

- `app/calculator/quick/page.tsx`
- `components/quick-calculator/QuickDoughCalculator.tsx`
- `lib/quick-calculator/quick-dough-calculator.ts`
- `lib/quick-calculator/quick-calculator-storage.ts`
- `lib/quick-calculator/pizza-sizing.ts`
- `lib/quick-calculator/quick-preferments.ts`
- `lib/quick-calculator/advanced-dough-tools.ts`

Shared dependencies:

- `lib/dough-calculator.ts`
- `lib/experience-levels.ts`
- `lib/saved-recipes.ts` types
- `components/EditableNumberInput.tsx`
- `components/SiteFooter.tsx`

Unique capabilities:

- standalone dough calculation using shared dough formula
- saved quick recipes in `doughtools.quick-calculator.recipes.v1`
- JSON share URL in `quick` query param
- sizing modes: ball weight, diameter, pan size, custom dough weight
- preferment controls: direct, poolish, biga, levain
- advanced tools: target dough temperature, water temperature, yeast conversion, reverse fermentation, custom oil/sugar/malt, flour blend
- level-specific disclosure using the global/utility experience preference

### Product role

Quick Calculator has high standalone value and distinct search intent. It is not a complete product flow, and it can be mistaken for the main DoughTools product if exposed too prominently.

Decision: KEEP, BUT DEMOTE.

Rationale:

- User value: high for advanced or repeat users.
- Technical value: high; it protects distinct calculation, save and share behavior.
- Pizza Session fit: supporting, not core.
- SEO value: meaningful for "quick dough calculator" intent.
- Navigation risk: medium; it should not become the main product entry.

SEO recommendation: keep indexed and in sitemap. Keep stateful query canonicalization. Reduce primary/product navigation prominence later.

Recommended next patch: Patch 403 should clarify Quick Calculator positioning and reduce product-level exposure without touching formulas.

## 6. Toppings audit

### Exact job

`/toppings` is a visual topping balance lab. It helps users understand how sauce amount, cheese amount, cheese moisture, usable topped area and topping load affect bake outcome.

It is not a Shopping checklist, menu editor or session topping allocator.

### Implementation inventory

Owned or route-specific:

- `app/toppings/page.tsx`
- `app/toppings/layout.tsx`
- `components/toppings/ToppingBalanceLab.tsx`
- `lib/topping-balance-lab.ts`
- `public/toppings/**` WebP references

Shared dependencies:

- `lib/topping-calculator.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts` types
- `components/SiteFooter.tsx`
- `components/learning/RelatedLearning.tsx`
- `components/icons`

Unique capabilities:

- `calculateToppingBalance`
- usable-area and rim-aware density display
- sauce, cheese, extra topping and combined-load classification
- mozzarella drain-state moisture model
- educational presets: too little, balanced, too much, wet overload, heavy toppings
- shareable query state
- visual reference image set for sauce, cheese, moisture and pizza examples
- compatibility parsing for older `toppings=` query load

### Capability comparison

| Capability | Toppings | Sauce | Shopping | Ovens | Troubleshooting |
| --- | --- | --- | --- | --- | --- |
| Sauce quantity | Partial density context | Yes, canonical sauce amounts | Session quantities | No | Symptom context |
| Cheese/topping load | Yes | No | Shopping ingredients only | No | Problem examples |
| Moisture diagnosis | Yes | Sauce moisture only | No | Oven moisture context | Yes, symptom-based |
| Visual reference images | Yes | Limited | No | No | Yes, issue-specific |
| Session ingredient checklist | No | No | Yes | No | No |
| Oven-specific topping risk | Partial | No | No | Yes, practical guidance | Yes |

### Product role

Toppings is unique, but its value is more contextual learning/support than a first-class product destination. It is currently overexposed relative to the canonical workflow.

Decision: INTEGRATE, KEEP ROUTE.

Rationale:

- User value: high for learning restraint and moisture balance.
- Technical value: high; visual assets and calculations are unique.
- Pizza Session fit: best as support during Shopping/menu decisions, Sauce, Ovens and Troubleshooting.
- SEO value: meaningful for topping balance/moisture intent.
- Navigation risk: medium to high if treated as equal to Pizza Session.

SEO recommendation: keep indexed and in sitemap for now. Consider keeping indexed even after demotion because search intent is distinct.

Recommended next patch: Patch 402 should demote global exposure and add tighter contextual entry points from Shopping/Sauce/Ovens/Troubleshooting if product wants it.

## 7. Costs audit

### Exact job

`/costs` estimates pizza-night cost and compares homemade pizza with a user-entered restaurant equivalent.

Actual inputs:

- pizza count
- diners
- dough ball weight
- hydration and salt
- flour price
- sauce grams and price
- cheese grams and price
- topping grams and price
- extras per pizza
- oven energy per session
- packaging per pizza
- waste percent
- restaurant price per pizza
- currency preference: EUR or USD

Actual outputs:

- cost line breakdown
- total home cost
- per-pizza and per-diner cost
- restaurant total
- difference
- neutral comparison state
- implied margin/profit when selling price is used as restaurant price

### Implementation inventory

Owned or route-specific:

- `app/costs/page.tsx`
- `app/costs/layout.tsx`
- `components/costs/PizzaCostsPlayfulClient.tsx`
- `lib/cost-calculator.ts`
- `lib/cost-comparison.ts`
- `doughtools-currency` localStorage preference

Shared dependencies:

- `lib/recipe-url.ts`
- `components/EditableNumberInput.tsx`
- `components/design-system`
- `components/icons`
- `components/SiteFooter.tsx`

Unique capabilities:

- editable cost model
- home versus restaurant comparison
- currency label selection without exchange-rate conversion
- per-pizza and per-diner cost
- neutral copy for home-cheaper, restaurant-cheaper, similar and missing-restaurant states

### Placement matrix

| Placement | Fit | Evidence | Risk |
| --- | --- | --- | --- |
| Standalone utility | Medium | Search intent and playful comparison are distinct. | Can feel disconnected from Pizza Session. |
| Shopping integration | Medium to high | Ingredient quantities naturally connect to shopping. | Requires pricing model decisions and session UI restraint. |
| Party Orders integration | Medium | Event cost and per-diner cost may matter for hosted orders. | Could imply commercial pricing/account features. |
| Removal | Low | There is tested unique logic and user-editable assumptions. | Would discard a distinct utility without proving low value. |

### Trustworthiness

The route is transparent that it is a simple estimate. It does not fetch external prices, apply exchange rates, use a restaurant API or infer location. This makes it safe as a self-entered estimate, but not authoritative enough to deserve high product prominence.

Decision: KEEP, BUT DEMOTE.

Rationale:

- User value: medium.
- Technical value: medium; formula is isolated and tested.
- Pizza Session fit: weak to medium.
- SEO value: distinct "home pizza cost vs restaurant" intent.
- Navigation risk: medium; it is a secondary decision tool, not a core product step.

SEO recommendation: keep indexed and in sitemap for now. Reassess after analytics or Search Console evidence; noindex is not justified by source evidence alone.

Recommended next patch: Patch 401 should decide whether a compact Shopping cost estimate or Party Order budget view is worth building. Keep `/costs` unchanged until then.

## 8. Timer audit

### Exact job

`/timer` provides a standalone bake timer for pizza baking. It is the only remaining utility with significant browser-device behavior.

Unique capabilities:

- countdown timer
- style-based default durations
- `timer` query override
- overtime state capped at +1:30
- audio beeps for final countdown and overtime
- vibration cue where available
- screen wake lock request
- visibility-change wake-lock retry
- inspection light:
  - Android rear torch attempt through `getUserMedia` and `applyConstraints({ torch: true })`
  - iOS/unsupported fallback to bright white screen
- full-screen white inspection mode

### Implementation inventory

Owned or route-specific:

- `app/timer/page.tsx`
- `app/timer/layout.tsx`
- style default duration map
- timer local component state
- wake-lock, audio, vibration and inspection-light handlers

Shared dependencies:

- `lib/pizza-styles.ts`
- `lib/recipe-url.ts`
- `lib/saved-recipes.ts` types
- `components/SiteFooter.tsx`

### Kitchen Mode comparison

| Capability | Timer | Kitchen Mode | Missing from Kitchen | Integration value |
| --- | --- | --- | --- | --- |
| Bake countdown | Yes | Kitchen has bake step context, not this standalone timer UI | Likely yes | High |
| Wake lock | Yes | No direct evidence in Kitchen audit scope | Yes | High |
| Audio cue | Yes | No direct evidence in Kitchen audit scope | Yes | Medium/high |
| Overtime | Yes | Kitchen has progress state, not timer overtime | Yes | High |
| Inspection light | Yes | No | Yes | Medium |
| Step context | No | Yes | Timer lacks session context | High if integrated |
| Cloud progress | No | Yes | Timer is local-only | High if Kitchen owns timer state |
| Session awareness | Query recipe only | Yes | Standalone timer lacks active session | High |

Decision: INTEGRATE, KEEP ROUTE.

Rationale:

- User value: high during baking.
- Technical value: high because of browser APIs.
- Pizza Session fit: high during Kitchen bake steps, but standalone route remains useful for users who only need a timer.
- SEO value: modest but real.
- Migration risk: medium/high; browser APIs and permissions must not bloat Kitchen or destabilize progress persistence.

SEO recommendation: keep indexed and in sitemap until Kitchen integration is implemented and validated. After integration, reassess whether standalone `/timer` should stay indexable or become a smaller noindex utility.

Recommended next patch: Patch 400 should integrate a compact bake timer into Kitchen bake steps while preserving standalone `/timer`.

## 9. Utility dependency graphs

### `/calculator/quick`

```text
/calculator/quick
├── app/calculator/quick/page.tsx
├── components/quick-calculator/QuickDoughCalculator.tsx
├── lib/quick-calculator/quick-dough-calculator.ts
│   ├── calculateDoughIngredients from lib/dough-calculator.ts
│   ├── quick sizing
│   ├── preferments
│   └── advanced dough tools
├── lib/quick-calculator/quick-calculator-storage.ts
│   ├── doughtools.quick-calculator.recipes.v1
│   └── quick query parameter
└── tests/quick-calculator.test.ts
```

Risk: medium. The route is isolated, but it calls the shared dough calculator and has durable saved/share contracts.

### `/toppings`

```text
/toppings
├── app/toppings/page.tsx
├── app/toppings/layout.tsx
├── components/toppings/ToppingBalanceLab.tsx
├── lib/topping-balance-lab.ts
│   └── calculateToppingLoad from lib/topping-calculator.ts
├── public/toppings/**
└── tests/topping-balance-lab.test.ts
```

Risk: medium. Route-specific lab code is isolated, but visual assets and balance calculations are useful support content.

### `/costs`

```text
/costs
├── app/costs/page.tsx
├── app/costs/layout.tsx
├── components/costs/PizzaCostsPlayfulClient.tsx
├── lib/cost-calculator.ts
├── lib/cost-comparison.ts
├── doughtools-currency localStorage
└── tests/cost-calculator.test.ts
```

Risk: low to medium. The route is isolated and tested, but any integration with Shopping or Party Orders would require careful product framing.

### `/timer`

```text
/timer
├── app/timer/page.tsx
├── app/timer/layout.tsx
├── recipe URL parsing
├── pizza style defaults
├── wake lock
├── audio and vibration
├── torch / screen light
└── source-string coverage in navigation, footer, SEO and legacy-route tests
```

Risk: medium/high. Logic is isolated, but browser API behavior is valuable and fragile.

## 10. Capability comparisons

### Utility decision table

| Route | Exact job | Unique logic | Core overlap | Recommended role | Navigation | SEO | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/calculator/quick` | Calculate dough quickly without a session | Save/share, preferments, sizing modes, advanced dough tools | Medium; can look like alternative to Session Start | KEEP, BUT DEMOTE | Secondary Tools/footer only, not primary product | Keep indexed + sitemap | High |
| `/toppings` | Teach topping load, moisture and balance | Balance engine, visual assets, share state | Medium; supports Shopping/Sauce/Ovens | INTEGRATE, KEEP ROUTE | Contextual, reduce first-class exposure | Keep indexed + sitemap | High |
| `/costs` | Estimate home pizza cost versus restaurant | Editable cost model, comparison states | Low; adjacent to Shopping/Party Orders | KEEP, BUT DEMOTE | Footer/contextual only | Keep indexed for now | Medium/high |
| `/timer` | Time a bake with device feedback | Wake lock, audio, vibration, overtime, torch/screen light | Medium/high with Kitchen bake step | INTEGRATE, KEEP ROUTE | Contextual from Kitchen and secondary utility | Keep indexed for now | High |

### Scoring

1 = weak, unclear or risky. 3 = useful but needs a role decision. 5 = clearly valuable and well placed.

| Route | User value | Uniqueness | Pizza Session fit | Mobile usefulness | Desktop usefulness | SEO value | Maintenance cost | Overlap risk | Migration risk | Confidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/calculator/quick` | 5 | 5 | 3 | 3 | 5 | 4 | 4 | 3 | 3 | 5 |
| `/toppings` | 4 | 5 | 3 | 3 | 4 | 4 | 4 | 3 | 3 | 5 |
| `/costs` | 3 | 3 | 2 | 3 | 4 | 3 | 2 | 2 | 3 | 4 |
| `/timer` | 4 | 5 | 4 | 5 | 3 | 3 | 4 | 4 | 4 | 5 |

## 11. Mobile findings

Production browser validation:

| Route | 390x844 screen count | 430x740 screen count | Controls | Overflow | Console errors | Notes |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `/calculator/quick` | 7.3 | 8.2 | 107 | No | No | Very control dense; works, but mobile feels expert-oriented. |
| `/toppings` | 15.1 | 16.6 | 62 | No | No | Longest utility; visual lab is valuable but too large for casual mobile lookup. |
| `/costs` | 7.1 | 8.0 | 78 | No | No | Inputs work, but the cost model is a workspace rather than a quick mobile answer. |
| `/timer` | 2.9 | 3.1 | 31 | No | No | Best mobile fit; start/pause worked; wake-lock fallback state visible. |

Mobile conclusion:

- Timer has the clearest mobile job and should be considered for Kitchen bake integration first.
- Toppings is useful but too long to be a primary mobile destination.
- Quick Calculator and Costs are usable but control-heavy; they should be secondary tools.

## 12. Desktop findings

Production browser validation:

| Route | 1280x900 screen count | 1440x950 screen count | Controls | Overflow | Console errors | Notes |
| --- | ---: | ---: | ---: | --- | --- | --- |
| `/calculator/quick` | 3.7 | 3.5 | 108 | No | No | Strong desktop utility; enough room for expert controls. |
| `/toppings` | 7.1 | 6.7 | 63 | No | No | Strong visual lab, but still long. |
| `/costs` | 3.3 | 3.2 | 79 | No | No | Works as a desktop estimation workspace. |
| `/timer` | 2.1 | 1.9 | 32 | No | No | Functional but less desktop-specific than mobile/Kitchen use. |

Desktop conclusion:

- Quick Calculator and Costs are strongest on desktop.
- Toppings benefits from width but remains content-heavy.
- Timer is useful on desktop but its highest value is while cooking, especially mobile/tablet.

## 13. SEO and sitemap findings

Current SEO state:

| Route | Metadata | Sitemap | Robots/indexing policy | Stateful query policy | Search intent |
| --- | --- | --- | --- | --- | --- |
| `/calculator/quick` | `metadataForRoute("/calculator/quick")` | Yes | Indexable when indexing is enabled | Yes | Quick pizza dough calculator |
| `/toppings` | `metadataForRoute("/toppings")` | Yes | Indexable when indexing is enabled | Yes | Pizza topping balance / moisture |
| `/costs` | `metadataForRoute("/costs")` | Yes | Indexable when indexing is enabled | No | Home pizza vs restaurant cost |
| `/timer` | `metadataForRoute("/timer")` | Yes | Indexable when indexing is enabled | Yes | Pizza bake timer |

Findings:

- All four utilities are currently public SEO routes and sitemap entries.
- Query-param tool URLs canonicalize to clean base routes.
- `/costs` accepts recipe query values but is not listed in `statefulQueryParamRoutes`; future SEO cleanup should decide whether that is intentional.
- No route currently deserves immediate removal from sitemap based on source evidence alone.
- Navigation demotion and SEO indexing should be separated; a route can stay indexed while being less prominent in product navigation.

## 14. Navigation findings

Overexposure risks:

- `/toppings` appears in header Tools, shared Make pizza navigation, homepage core tools, Sauce/Ovens/Troubleshooting links and workflow handoffs.
- `/timer` appears in shared Make pizza navigation, homepage core tools and recipe workflow handoffs, even though Kitchen is now the canonical cooking surface.
- `/costs` appears in footer Product, homepage secondary tools and shared More tools navigation despite being an adjacent estimator.
- `/calculator/quick` is footer Product and header Tools, but it is not the canonical planning entry.

Hidden or under-contextualized value:

- Timer's strongest value is not exposed from Kitchen bake context yet.
- Costs has possible Shopping/Party Order value, but is currently separate.
- Toppings is heavily linked from learning pages, but less integrated into active Shopping/menu decisions.

## 15. Maintenance-cost analysis

| Route | Maintenance cost | Drivers |
| --- | --- | --- |
| `/calculator/quick` | High | Many inputs, save/share schema, preferments, advanced tools, experience preference, calculation correctness. |
| `/toppings` | High | Visual assets, query compatibility, density/moisture thresholds, long educational page. |
| `/costs` | Medium | Isolated formula, editable assumptions, currency labels, trust copy. |
| `/timer` | Medium/high | Browser wake lock, audio, vibration, camera/torch permissions, background behavior. |

No utility should be retired by deleting its route-only folder without first preserving or explicitly rejecting its unique capability.

## 16. Utility decision table

| Route | Recommendation | User rationale | Technical rationale | SEO rationale | Migration risk | Recommended patch |
| --- | --- | --- | --- | --- | --- | --- |
| `/calculator/quick` | KEEP, BUT DEMOTE | Fast dough answer for users who do not need a full plan. | Distinct saved/share and advanced calculation wrapper around shared dough engine. | Keep indexed for calculator intent. | Medium; saved quick recipes and share URLs must remain. | Patch 403 |
| `/toppings` | INTEGRATE, KEEP ROUTE | Helps users avoid wet/overloaded pizza. | Unique lab and assets should be preserved. | Keep indexed for topping balance intent. | Medium; integration must not overload Shopping. | Patch 402 |
| `/costs` | KEEP, BUT DEMOTE | Useful estimate, but not a core cooking step. | Isolated and tested. Possible Shopping/Party Order future. | Keep indexed until usage data proves weak value. | Medium; pricing assumptions need product decision. | Patch 401 |
| `/timer` | INTEGRATE, KEEP ROUTE | Most valuable during baking/Kitchen use. | Browser APIs are unique and must be protected. | Keep indexed for now. | Medium/high; Kitchen persistence and UI must stay stable. | Patch 400 |

## 17. Capability-preservation table

| Route | Capability | Must preserve | Existing replacement | Migration required |
| --- | --- | --- | --- | --- |
| `/calculator/quick` | Quick dough amount calculation | Yes | Pizza Session recipe is slower and workflow-bound | No immediate migration |
| `/calculator/quick` | Saved quick recipes | Yes | No Pizza Session equivalent for quick-only local recipes | Preserve route contract |
| `/calculator/quick` | Share URLs | Yes | Recipe URL params are different | Preserve route contract |
| `/toppings` | Topping density/moisture analysis | Yes | Troubleshooting has symptoms, not calculator/lab | Contextual integration later |
| `/toppings` | Visual references | Yes | Troubleshooting has different issue images | Preserve assets |
| `/costs` | Cost estimate and comparison | Yes, if route retained | No Shopping/Party Order cost model today | Investigate integration |
| `/timer` | Wake lock | Yes | No confirmed Kitchen replacement | Integrate later |
| `/timer` | Audio/vibration/overtime | Yes | No confirmed Kitchen replacement | Integrate later |
| `/timer` | Inspection light | Yes, or explicitly reject | No Kitchen replacement | Consider optional integration |

## 18. Recommended future utility architecture

```text
Core Product
└── Pizza Session
    ├── Start
    ├── Recipe
    ├── Shopping
    │   └── Optional contextual cost estimate (future decision)
    ├── Timeline
    ├── Kitchen
    │   └── Integrated bake timer (Patch 400 candidate)
    └── Review

Learning
├── Learning Center
├── Dough Guide
├── Sauce
├── Styles
├── Ovens
├── Troubleshooting
└── Topping Balance Lab (contextual supporting lab)

Supporting Utilities
├── Quick Dough Calculator
├── Standalone Timer
└── Costs (secondary estimator)

Contextual Features
├── Topping balance from Shopping/Sauce/Ovens/Troubleshooting
├── Bake timer inside Kitchen bake step
├── Cost estimate from Shopping or Party Orders if validated
└── Quick Calculator links back to Pizza Session without pretending to be the main flow
```

## 19. Prioritized issue register

| Priority | Issue | Evidence | Recommendation |
| --- | --- | --- | --- |
| P1 | Timer capability is outside Kitchen even though baking now belongs to Kitchen Mode. | `/timer` owns wake lock/audio/overtime/light; Kitchen is canonical cooking surface. | Patch 400: integrate bake timer capability into Kitchen bake context while keeping `/timer`. |
| P2 | Toppings is overexposed for a supporting lab. | Header Tools, Make pizza group, homepage core tools, workflow handoffs and learning links. | Patch 402: make Toppings contextual and reduce first-class exposure. |
| P3 | Costs is a secondary estimator but appears as Product/footer and sitemap utility. | Footer Product, homepage secondary tools, public sitemap. | Patch 401: decide Shopping/Party Orders integration or footer-only role. |
| P4 | Quick Calculator may compete with Session Start if labelled as a primary tool. | Header Tools and footer Product, high-control standalone calculator. | Patch 403: clarify secondary/expert positioning and route copy. |
| P5 | Utility SEO and navigation are coupled today. | All four are sitemap entries, but navigation roles differ. | Patch 404: final navigation/footer/sitemap alignment after utility decisions. |

## 20. Follow-up patch roadmap

Patch 400: Timer and Kitchen integration audit/fix

- Scope: Add or design compact Kitchen bake-timer capability while preserving `/timer`.
- Protect: Kitchen progress, cloud sync, stepRuntime, Patch 395/396 behavior, timer browser APIs.
- Tests: Kitchen bake step, timer start/pause/overtime, wake-lock fallback source tests, mobile browser validation.

Patch 401: Costs role decision

- Scope: Decide whether Costs stays standalone-only, gets a Shopping estimate, gets Party Order budget support or gets demoted further.
- Protect: cost formulas, Party Orders, Shopping quantities.
- Tests: cost formulas, query input, currency preference, selected target route.

Patch 402: Toppings contextual exposure

- Scope: Reduce first-class navigation exposure and add precise contextual links if needed.
- Protect: `calculateToppingBalance`, visual assets, query compatibility.
- Tests: navigation, Sauce/Ovens/Troubleshooting/Shopping links, SEO unchanged unless explicitly scoped.

Patch 403: Quick Calculator positioning

- Scope: Clarify Quick Calculator as secondary/expert utility and make its handoff to Pizza Session clearer.
- Protect: saved quick recipes, share URLs, dough formulas.
- Tests: quick calculator, saved/share, navigation/footer.

Patch 404: Final utility navigation and sitemap alignment

- Scope: Align header, footer, homepage, sitemap and indexation after utility decisions.
- Protect: canonical Pizza Session spine and Learning Center.
- Tests: navigation, SEO, sitemap, redirects.

## 21. Risks and limitations

- No live analytics, Search Console data or real user path data was available. SEO and navigation recommendations are source- and UX-evidence based.
- Browser validation used local production build and headless Chromium. It did not request camera/torch permission for safety; torch behavior was source-audited.
- Signed-in account and Party Order workflows were source-audited only where relevant to utility links; no database state was changed.
- Quick Calculator saved recipe behavior was spot-checked with localStorage seeding, but no production storage migration was tested because none is proposed.
- Costs pricing trust depends on user-entered assumptions; no external price validation exists.
- Timer query style parsing was spot-checked with a timer override. Future integration should verify exact recipe-query keys before reusing timer context in Kitchen.

## 22. Final recommendation

The remaining utilities should not be retired as a group. Each has a distinct role:

- Quick Calculator is the expert/fast dough utility.
- Toppings is a supporting learning and balance lab.
- Costs is a secondary estimate workspace.
- Timer is an execution utility whose core value belongs closer to Kitchen.

The product would become clearer if these utilities were separated into:

- one primary Pizza Session product spine,
- a compact Learning system,
- a small secondary Tools layer,
- contextual utility affordances shown only where they help the current task.

Do not implement all recommendations in one patch. Start with Patch 400 for Timer/Kitchen because it has the strongest active-session fit and the clearest mobile value.
