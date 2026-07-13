# Patch 351 sitewide hero rollout and top-of-page imagery audit

Date: 2026-07-13  
Baseline: `master` after Patch 350  
Baseline commit audited: `265763747b67a7ec212e83a1a29ca4e433742be5`  
Scope: read-only audit documentation and audit tests. No production-rendered code, images, routes, logic or layout changed.

## 1. Executive summary

Patch 347 created the official five-part page-introduction system and the shared implementation file `components/page-hero/PageHeroSystem.tsx`.

Current source truth shows a more nuanced rollout:

- The approved semantic model is present and useful.
- Trust pages are the clearest fully migrated family because `TrustPageLayout` uses the shared `UtilityHeader`.
- `/styles` uses a shared `EditorialLearningHero` through `components/styles/PizzaStyleHero.tsx`.
- Most major product pages visually follow the hero philosophy but still use bespoke page-specific markup.
- Workspaces correctly avoid large decorative top images.
- The most important future work is not “add images everywhere.” It is deciding where shared hero architecture should replace bespoke but visually similar page introductions.

The largest architectural gap is that visual consistency and component migration are currently different things. Several pages look aligned with the hero system but do not actually use the shared hero/header components.

## 2. Audit method

The audit used the current repository as source of truth:

- Enumerated `app/**/page.tsx` routes from the App Router.
- Read `AGENTS.md`, `docs/experience-principles.md`, `docs/design-system.md`, `docs/visual-style-guide.md`, `docs/global-responsive-ux-rules.md`, and `docs/sitewide-hero-and-imagery-system.md`.
- Compared current source against `docs/audits/patch-347-sitewide-hero-audit.md`.
- Inspected `components/page-hero/PageHeroSystem.tsx`.
- Searched page and component sources for shared hero usage, bespoke hero markup, `next/image`, local asset paths, `getImageProps`, background images and route-specific hero components.
- Inspected representative top-image asset dimensions and file sizes from `public/`.
- Added the machine-readable inventory in `docs/audits/patch-351-sitewide-hero-rollout-audit.json` so future patches can diff route status without rebuilding the audit from memory.

No production page was modified.

## 3. Hero-system component inventory

| Component | Semantic type | File | Current direct usage | Notes |
| --- | --- | --- | --- | --- |
| `MarketingHero` | Marketing Hero | `components/page-hero/PageHeroSystem.tsx` | No direct route usage found | Available but homepage and About use bespoke richer layouts. |
| `EditorialLearningHero` | Editorial Learning Hero | `components/page-hero/PageHeroSystem.tsx` | `components/styles/PizzaStyleHero.tsx` | Works for simple learning introductions. Many learning pages still use bespoke markup. |
| `VisualLabHero` | Visual Lab Hero | `components/page-hero/PageHeroSystem.tsx` | No direct route usage found | Costs, toppings and doctor visually behave as labs but do not use this shared component. |
| `WorkspaceHeader` | Compact Workspace Header | `components/page-hero/PageHeroSystem.tsx` | No direct route usage found | Workspace pages use bespoke action-first headers. This is acceptable UX-wise, but not architecturally migrated. |
| `UtilityHeader` | Minimal Utility Header | `components/page-hero/PageHeroSystem.tsx` | `components/TrustPageLayout.tsx` | This is the cleanest current shared rollout. |
| `PizzaStyleHero` | Page-specific wrapper around shared editorial hero | `components/styles/PizzaStyleHero.tsx` | `/styles` | Good example of a small route-specific wrapper using the shared system. |
| `OvenGuideHero` | Page-specific educational hero | `components/ovens/OvenGuideHero.tsx` | `/ovens` | Semantically correct but bespoke; uses a diagram-led approach. |
| `TroubleshootingHero` | Page-specific diagnostic hero | `components/guide/PizzaTroubleshootingGuideClient.tsx` | `/guide/pizza-troubleshooting` | Useful diagnostic diagram, but not shared. |

## 4. Route inventory

The route inventory was derived from `app/**/page.tsx`.

User-facing static and dynamic pages audited:

- `/`
- `/?calculator=1`
- `/?calculator=2`
- `/about`
- `/account`
- `/account/party-orders`
- `/account/party-orders/new`
- `/account/party-orders/[id]`
- `/account/pizza-sessions/[id]`
- `/calculator/quick`
- `/coach`
- `/community`
- `/contact`
- `/costs`
- `/doctor`
- `/gear`
- `/guide`
- `/guide/pizza-troubleshooting`
- `/guides/dough`
- `/history`
- `/journal`
- `/methodology`
- `/order/[publicToken]`
- `/order/[publicToken]/edit/[submissionToken]`
- `/ovens`
- `/plan`
- `/privacy`
- `/sauce`
- `/session/kitchen`
- `/session/recipe`
- `/session/review`
- `/session/shopping`
- `/session/start`
- `/session/timeline`
- `/start`
- `/styles`
- `/terms`
- `/timer`
- `/toppings`
- `/updates`

Technical endpoints excluded from page-hero judgment:

- `app/api/**/route.ts`
- `app/auth/callback/route.ts`
- `app/manifest.ts`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/opengraph-image.tsx`

## 5. Route-by-route audit table

| Route | Family | Current hero/header | Shared system usage | Status | Top image | Image quality | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Marketing | Bespoke homepage Marketing Hero | No shared `MarketingHero` | Partially migrated | Desktop/mobile hero photos | Strong | Keep image; optional future architecture migration only if it can preserve the flagship composition. |
| `/?calculator=1` | Calculator | `HomeCalculatorWorkspace` | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/?calculator=2` | Calculator | `HomeCalculatorWorkspace` | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/about` | Marketing | Bespoke founder-story hero | No shared `MarketingHero` | Partially migrated | Founder photo | Strong | Keep founder photo; no AI replacement. |
| `/guide` | Learning | Bespoke Learning Center hero | No shared `EditorialLearningHero` | Partially migrated | Homepage pizza hero reused | Acceptable | Replace with a more learning-specific topic image in a future patch. |
| `/guides/dough` | Learning | `DoughGuidePageClient` instructional shell | No shared hero component | Partially migrated | Step-specific dough image | Strong | Keep; bespoke sequential guide shell is justified. |
| `/guide/pizza-troubleshooting` | Learning/diagnostic | `TroubleshootingHero` | No shared hero component | Partially migrated | HTML diagnostic diagram | Acceptable | Consider shared diagnostic hero or visual-lab variant later. |
| `/sauce` | Learning/lab | Bespoke Sauce Learning Lab hero | No shared hero component | Partially migrated | `/sauce/neapolitan.webp` | Strong | Keep current image approach. |
| `/styles` | Learning | `PizzaStyleHero` | Uses `EditorialLearningHero` | Fully migrated | None at hero; style cards below | No image | Consider compact style collage only if it improves the atlas entry. |
| `/ovens` | Learning | `OvenGuideHero` | No shared hero component | Partially migrated | Diagram-led heat visual | Strong | Keep diagram approach; optional shared wrapper later. |
| `/history` | Learning | Bespoke image-backed hero | No shared hero component | Legacy | `/pizza-history/naples-street.webp` | Acceptable | Migrate to shared editorial pattern; review overlay readability. |
| `/gear` | Learning | Bespoke header | No shared hero component | Legacy | No top image; gear cards below | No image | Add a compact gear/prep topic image or shared editorial hero. |
| `/toppings` | Visual lab | `ToppingBalanceLab` | No shared `VisualLabHero` | Partially migrated | CSS pizza simulation near top | Strong | Keep simulation-first; optional shared VisualLabHero wrapper. |
| `/costs` | Visual lab | `PizzaCostsPlayfulClient` | No shared `VisualLabHero` | Partially migrated | Comparison/result panel | Strong | Keep diagram/result-first. |
| `/doctor` | Visual lab | Bespoke Dough Doctor page | No shared hero component | Legacy | No top image; diagnostic cards below | No image | Add compact diagnostic visual or migrate to VisualLabHero. |
| `/timer` | Utility/lab | Bespoke timer header | No shared hero component | Workspace exemption | None | No image | Keep image-free. |
| `/calculator/quick` | Calculator | `QuickDoughCalculator` | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free and input-first. |
| `/start` | Workspace | Bespoke start page | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/plan` | Workspace/tool | Bespoke planner | No shared `WorkspaceHeader` | Workspace exemption | None at top; help images lower | No image | Keep control-first; small contextual images only. |
| `/session/start` | Workspace | Bespoke session setup | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/session/recipe` | Workspace | Bespoke recipe reference | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/session/shopping` | Workspace | Bespoke shopping/menu workspace | No shared `WorkspaceHeader` | Workspace exemption | Pizza menu card photos | Strong | Keep card images; no large page hero. |
| `/session/timeline` | Workspace | Bespoke timeline | No shared `WorkspaceHeader` | Workspace exemption | Step images in cards | Acceptable | Keep small contextual images; audit individual step crops later. |
| `/session/kitchen` | Workspace | Bespoke Kitchen Mode | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free; action-first is correct. |
| `/session/review` | Workspace | Bespoke review flow | No shared `WorkspaceHeader` | Workspace exemption | User/session media only when present | No image | Keep no generic image. |
| `/account` | Account | Bespoke account workspace | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/account/pizza-sessions/[id]` | Account detail | Completed session detail | No shared `WorkspaceHeader` | Workspace exemption | User/session media only when present | No image | Keep no generic image. |
| `/account/party-orders` | Account workspace | Party Orders list | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/account/party-orders/new` | Account workspace | Party Order builder | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/account/party-orders/[id]` | Account workspace | Party Order detail | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/order/[publicToken]` | Public workspace | Public Party Order form | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/order/[publicToken]/edit/[submissionToken]` | Public workspace | Public edit form | No shared `WorkspaceHeader` | Workspace exemption | None | No image | Keep image-free. |
| `/journal` | Workspace | Bespoke journal | No shared `WorkspaceHeader` | Workspace exemption | User entry images only | No image | Keep no generic image. |
| `/community` | Workspace | Bespoke community recipe grid | No shared `WorkspaceHeader` | Workspace exemption | Recipe card images | Acceptable | Review after product-role decision. |
| `/coach` | Utility | Bespoke coach page | No shared `UtilityHeader` | Minimal utility exemption | None | No image | Keep image-free or migrate to UtilityHeader. |
| `/contact` | Trust | `TrustPageLayout` | Uses `UtilityHeader` | Fully migrated | None | No image | Keep image-free. |
| `/privacy` | Trust | `TrustPageLayout` | Uses `UtilityHeader` | Fully migrated | None | No image | Keep image-free. |
| `/terms` | Trust | `TrustPageLayout` | Uses `UtilityHeader` | Fully migrated | None | No image | Keep image-free. |
| `/methodology` | Trust | `TrustPageLayout` | Uses `UtilityHeader` | Fully migrated | None | No image | Keep image-free. |
| `/updates` | Utility | Bespoke updates header | No shared `UtilityHeader` | Minimal utility exemption | None | No image | Keep image-free; optional UtilityHeader migration. |

The same data is also stored in `patch-351-sitewide-hero-rollout-audit.json`.

## 6. Marketing routes

Count: 2 primary routes (`/`, `/about`)

- Migrated architecturally: 0
- Partially migrated: 2
- Top images present: 2
- Image issues: none urgent

Marketing pages are visually strong. The homepage has dedicated desktop/mobile imagery and About uses the authentic founder photograph. The only gap is architectural: neither page uses the shared `MarketingHero` component. That may be acceptable because both pages need richer editorial composition than the simple shared component currently supports.

## 7. Editorial learning routes

Count: 8 primary routes (`/guide`, `/guides/dough`, `/guide/pizza-troubleshooting`, `/sauce`, `/styles`, `/ovens`, `/history`, `/gear`)

- Fully migrated: 1 (`/styles`)
- Partially migrated: 5
- Legacy: 2 (`/history`, `/gear`)
- Top images present: 6
- Missing educational imagery: `/gear`, optionally `/styles`
- Weak imagery: none classified as replace-now

The learning family is visually improved but architecturally uneven. `/styles` is the best shared-system example. `/guide`, `/sauce`, `/ovens` and Troubleshooting are polished but bespoke. `/history` and `/gear` should be the first learning routes reviewed if Patch 352 continues the rollout.

## 8. Visual labs

Count: 4 (`/toppings`, `/costs`, `/doctor`, `/timer`)

- Correct visual-lab pattern: `/toppings`, `/costs`
- Still using generic/bespoke header: all four
- Comparison/simulation status: strong for toppings and costs; missing at top for doctor; intentionally absent for timer

Visual labs mostly make the right product choice: comparison/simulation beats hero photography. The architectural gap is that `VisualLabHero` exists but is not directly used.

## 9. Workspaces

Count: 20+ including session pages, calculators, account, Party Orders, public order forms, plan, journal and community.

- All audited workspaces keep controls/actions primary.
- No workspace currently uses a large decorative hero image that blocks the main task.
- Shopping and Timeline use contextual images inside cards, which is appropriate.
- Kitchen Mode, Recipe, Review, Account and Party Orders are correctly image-light.

Future work should not add hero photography to workspaces merely for consistency.

## 10. Utility and trust pages

Count: 6 primary page routes (`/contact`, `/privacy`, `/terms`, `/methodology`, `/updates`, `/coach`)

- Fully migrated: 4 through `TrustPageLayout -> UtilityHeader`
- Minimal utility exemption: `/updates`, `/coach`
- Unnecessary imagery: none
- Missing intentional structure: none urgent

Trust pages are the strongest evidence that the shared system works when the page role is narrow.

## 11. Desktop findings

Source and layout inspection found these desktop patterns:

- Homepage: strong split composition; dedicated desktop asset; CTA and H1 are in a separate text zone.
- About: founder photo is authentic and relevant; page is bespoke by design.
- Learning Center: current image is appetizing but reused from homepage, so it is less concept-specific than the page role suggests.
- Sauce: image and calculator hierarchy are strong.
- Ovens: diagram-led top section is a good fit for heat education.
- History: full-bleed image overlay is the highest desktop readability risk among learning pages.
- Workspaces: first meaningful controls/actions appear early; no large top images push action down.

## 12. Mobile findings

Source inspection against mobile rules found:

- Homepage has a dedicated mobile hero source.
- Most learning pages use stacked content and avoid horizontal image grids at the top.
- Workspaces remain compact and action-first.
- History should be checked visually before any next image rollout because image-backed overlay text is more fragile on narrow screens.
- Learning Center should eventually receive a topic-specific mobile-safe image or visual rather than reusing the homepage image.

## 13. Image-quality findings

Representative asset metadata inspected:

| Asset | Dimensions | Size | Current use |
| --- | ---: | ---: | --- |
| `/images/homepage/doughtools-hero-desktop.webp` | 2400×1500 | 160,352 B | Homepage desktop hero; reused by Learning Center |
| `/images/homepage/doughtools-hero-mobile.webp` | 1200×1600 | 166,368 B | Homepage mobile hero |
| `/about/marcin-arcisz-founder.webp` | 960×1200 | 131,734 B | About founder image |
| `/dough-guide/guide-step-03-mix.webp` | 1200×900 | 77,342 B | Learning Center/Dough Guide context |
| `/sauce/neapolitan.webp` | 960×720 | 103,274 B | Sauce hero |
| `/sauce/marinara.webp` | 960×720 | 177,958 B | Sauce lesson imagery |
| `/toppings/balanced.webp` | 960×960 | 265,124 B | Topping lab reference |
| `/pizza-history/naples-street.webp` | 1600×900 | 183,856 B | History hero |
| `/gear/scale.webp` | 960×720 | 64,592 B | Gear card imagery |

No rights, logo, people or hand issue was found in this code-level audit beyond the already approved real founder photo.

## 14. Patch 347 intent versus current implementation

Patch 347 correctly defined the five semantic types. Current code shows documentation drift in implementation status:

- Patch 347 stated many routes were “classified; no code change required.” That remains mostly true as a semantic/product decision.
- It does not mean those routes use the shared hero components.
- Since Patch 347, later page-specific patches rebuilt or refined several pages while retaining bespoke hero markup.
- The current truth is: shared hero architecture is present, but direct shared-component adoption is limited.

Key drift examples:

- `/styles` is now genuinely shared-component based through `PizzaStyleHero`.
- Trust pages are genuinely shared-component based through `TrustPageLayout`.
- `/guide`, `/sauce`, `/ovens`, Troubleshooting, `/toppings`, `/costs` and homepage are visually aligned but still bespoke.

## 15. Priority findings

### Priority 1 — Clear mismatch

No route currently shows a critical wrong hero type, unreadable primary text, or workspace-blocking hero image in the source audit.

The closest Priority 1 candidate is `/history` because the image-backed overlay pattern is more fragile than the current separated-text system. It should be visually checked before more routes copy this pattern.

### Priority 2 — Incomplete rollout

- `/guide`: image is reused from homepage; should become a learning-specific topic image.
- `/history`: legacy image-backed hero; should migrate to shared editorial pattern or a safer bespoke equivalent.
- `/gear`: no meaningful top image despite being an educational buying/reference page.
- `/doctor`: top is text-first and legacy; diagnostic visual appears only in cards.
- `/toppings` and `/costs`: strong UX but still do not use shared `VisualLabHero`.
- Most workspaces use bespoke compact headers instead of `WorkspaceHeader`.

### Priority 3 — Optional refinement

- `/styles`: shared hero is correct, but a compact style-collage visual could improve first impression.
- `/ovens`: bespoke diagram is correct; a shared wrapper could improve maintenance.
- `/updates` and `/coach`: optional migration to `UtilityHeader`.
- Timeline individual step-image crops could be audited separately.

## 16. Decision shortlist for Marcin

| Route | Current state | Current top image | Recommended visual direction | Needs image decision from Marcin | Suggested next action |
| --- | --- | --- | --- | --- | --- |
| `/guide` | Partially migrated | Homepage hero reused | Learning-specific concept-library image or visual collage | Yes | Replace image |
| `/history` | Legacy | `naples-street.webp` image-backed hero | Safer editorial hero with clearer text zone | Yes | Migrate to shared Editorial Learning Hero |
| `/gear` | Legacy | No top image | Compact gear/prep workspace image | Yes | Add topic image |
| `/doctor` | Legacy | No top image | Diagnostic dough-state visual near top | Yes | Change to Visual Lab Hero |
| `/styles` | Fully migrated | No hero image | Optional style-collage preview | Yes | Keep as is or add compact educational image |
| `/toppings` | Strong bespoke lab | CSS simulation | Keep simulation, optionally wrap in shared VisualLabHero | No | Optional component migration |
| `/costs` | Strong bespoke lab | Comparison panel | Keep diagram/result-first | No | Optional component migration |
| `/ovens` | Strong bespoke learning page | Heat diagram | Keep diagram-led approach | No | Optional shared-wrapper migration |
| `/updates` | Minimal bespoke utility | None | Keep image-free | No | Optional UtilityHeader migration |
| `/coach` | Minimal bespoke utility | None | Keep image-free | No | Optional UtilityHeader migration |

## 17. Routes intentionally left without images

These routes should remain image-free or only use small contextual/user images:

- `/?calculator=1`
- `/?calculator=2`
- `/calculator/quick`
- `/start`
- `/plan`
- `/session/start`
- `/session/recipe`
- `/session/kitchen`
- `/session/review`
- `/account`
- `/account/party-orders`
- `/account/party-orders/new`
- `/account/party-orders/[id]`
- `/account/pizza-sessions/[id]`
- `/order/[publicToken]`
- `/order/[publicToken]/edit/[submissionToken]`
- `/timer`
- `/contact`
- `/privacy`
- `/terms`
- `/methodology`
- `/updates`
- `/coach`

## 18. Routes that could benefit from new imagery

- `/guide`: strongest candidate for new Learning Center imagery.
- `/gear`: topic-specific gear/prep hero or compact visual.
- `/doctor`: diagnostic dough-state visual or compact comparison.
- `/styles`: optional compact style atlas preview.
- `/history`: may keep current imagery but should use safer text/image composition.

## 19. Routes where images should not be added

Do not add large top images to:

- active Pizza Session workspace routes
- Kitchen Mode
- Recipe
- Review
- Account
- Party Orders operational pages
- public order forms
- legal/trust pages
- Quick Calculator
- Timer

For these pages, adding imagery would likely reduce confidence by delaying the current action.

## 20. Audit limitations

- This patch intentionally did not modify production UI or generate screenshots.
- The audit is based on source inspection, asset metadata, current documentation and production build validation.
- Routes requiring authenticated or runtime session state were grouped by shared page/component implementation.
- Visual viewport findings are conservative and should be confirmed again before any future image-replacement patch.
- The audit does not judge image taste beyond relevance, quality risk, mobile intent and alignment with the official DoughTools image rules.

