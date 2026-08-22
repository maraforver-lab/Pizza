# Patch 479A - Final Pre-index SEO and Search Intent Audit

Date: 2026-08-22
Starting commit: `9477286a5c77d238e9c203c23aa8a55d716f199e`
Branch: `patch/479a-final-pre-index-seo-audit`
Type: audit only

## 1. Executive Verdict

Verdict: **NO-GO for opening Google indexing immediately. GO after Patch 479B if the P0 items below are fixed and production verification confirms that the intended route policy is active.**

The current technical indexing protection is still correctly conservative:

- `lib/seo-config.ts` gates indexability behind `ALLOW_INDEXING === "true"`, a configured production `NEXT_PUBLIC_SITE_URL`, and non-preview Vercel environment.
- `robotsMetadata()` returns noindex/nofollow while indexing is disabled.
- `robotsPolicy()` disallows `/` while indexing is disabled.
- `next.config.ts` adds `X-Robots-Tag: noindex, nofollow, noarchive` globally while indexing is disabled.
- Private account, admin, API, auth, order-token and downstream session routes have explicit noindex/header protection when indexing is enabled.

The main launch risk is not whether Google can be blocked today. It can. The risk is that the current `publicSeoRoutes` list is doing too many jobs: metadata registry, sitemap source, and implied future indexable route set. If `ALLOW_INDEXING=true` is enabled without splitting that policy, Google would receive some pages that should not be first-wave search landing pages.

Route decisions for the 24 routes currently in `publicSeoRoutes`:

- **INDEX READY:** 9
- **FIX BEFORE INDEX:** 8
- **KEEP NOINDEX:** 7

Private, account, admin, API, token and downstream session routes remain **KEEP NOINDEX by class** and are not counted in the 24-route public metadata matrix.

P0 before indexing:

1. Split "public metadata exists" from "allowed in sitemap and indexable." The current sitemap uses every `publicSeoRoutes` entry, including `/session/start`, `/updates`, legal/contact pages and duplicate bake-timer routes.
2. Prepare `/calculator/quick` as the owner of calculator search intent before indexing. It is the highest-value query target, but current metadata and crawlable context are too generic for "pizza dough calculator", "pizza yeast calculator" and related searches.
3. Resolve duplicate bake timer URLs: `/timer` and `/tools/bake-timer` currently compete for the same low-priority utility intent.

## 2. Public and Indexable Route Inventory

### Current Source of Truth

Current metadata, robots and sitemap behavior are centralized in:

- `lib/seo-config.ts`
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `next.config.ts`

Current `publicSeoRoutes` contains 24 routes. When indexing is disabled, these routes still receive noindex metadata and a global X-Robots header. When indexing is enabled, `metadataForRoute()` would make them index/follow, and `sitemapEntries()` would include all of them.

### Intended Public Search Pages

These pages can provide standalone value from Google after the P0/P1 corrections noted in this audit:

- `/`
- `/about`
- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/fermentation-length`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`
- `/calculator/quick`
- `/methodology`
- `/sauce`
- `/toppings`
- `/ovens`
- `/styles`
- `/costs`

Some of these are not ready yet. They belong in the search strategy, but Patch 479B should improve or explicitly defer them before indexing is opened.

### Application, Private and Process Pages

These should not become organic search landing pages simply because they are public, reachable or useful inside the product:

- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account` and account subroutes
- `/admin` and admin preview routes
- `/auth`, `/login`, `/signup`
- `/order/[publicToken]` and `/order/[publicToken]/edit/[submissionToken]`
- `/api/*`
- `/preview/*`, `/debug/*`

`/session/start` is currently listed in `publicSeoRoutes`, which is acceptable for metadata but not for first-wave sitemap/index inclusion.

### Redirect and Technical Routes

These are not search landing pages:

- `/coach` -> `/guide/pizza-troubleshooting`
- `/doctor` -> `/guide/pizza-troubleshooting`
- `/gear` -> `/ovens#other-equipment`
- `/history` -> `/about`
- `/plan` -> `/session/start`
- `/start` -> `/session/start`

## 3. Route-by-route Readiness Matrix

Current indexability state for every row: **blocked while `ALLOW_INDEXING` is not enabled**. The decision column describes the intended future state for public launch.

| Route | Current title | Current H1 / visible lead | Primary search intent | Sitemap now | Decision | Reason | Patch 479B action |
|---|---|---|---|---:|---|---|---|
| `/` | Make better pizza with one clear plan | DoughTools | Make better pizza with one clear plan. | DoughTools brand, pizza planning | Yes | INDEX READY | Current title, H1 and positioning are aligned after Patch 478A. | Keep, verify canonical/OG in production before indexing. |
| `/about` | About DoughTools | DoughTools | Built from real pizza nights. | Brand trust, founder/product purpose | Yes | INDEX READY | Useful trust context, not competing with product pages. | Keep indexable with low priority. |
| `/guide` | Pizza Guide and Glossary | DoughTools | Learn pizza one choice at a time. | Pizza guide, pizza glossary, learning hub | Yes | INDEX READY | Good hub for crawlable learning routes. | Keep, add structured breadcrumbs only if implemented consistently. |
| `/guides/dough` | Pizza Dough Guide | DoughTools | Dynamic active dough-guide step | Pizza dough guide, how to make pizza dough | Yes | INDEX READY | Substantial guided dough content and strong product fit. | Keep, verify H1/initial state is crawler-understandable. |
| `/guide/pizza-troubleshooting` | Pizza Troubleshooting Guide: Dough, Stretching, Baking and Toppings | DoughTools | What went wrong with your pizza? | Pizza troubleshooting, dough/topping/baking problems | Yes | INDEX READY | Strong problem-solving content and internal links. | Keep. |
| `/guide/practical-pizza-tips` | Practical Pizza Tips | DoughTools | Practical pizza tips | Practical pizza tips hub | Yes | INDEX READY | Useful hub for article cluster. | Keep, improve footer/internal links in P1. |
| `/guide/practical-pizza-tips/leftover-dough` | Leftover Pizza Dough Storage Guide | DoughTools | Leftover dough | Leftover pizza dough, freezing/thawing | Yes | INDEX READY | Specific, useful standalone content. | Keep. |
| `/guide/practical-pizza-tips/containers-and-lids` | Pizza Dough Container and Lid Guide | DoughTools | Dough container and lid use | Dough containers, proofing containers | Yes | INDEX READY | Specific practical article. | Keep. |
| `/guide/practical-pizza-tips/common-problems` | Common Pizza Dough, Sauce and Baking Problems | DoughTools | Common dough, sauce and baking problems | Common pizza problems | Yes | INDEX READY | Useful broad diagnostic page; overlaps troubleshooting but has a practical tips angle. | Keep, ensure canonical distinction from `/guide/pizza-troubleshooting`. |
| `/guide/practical-pizza-tips/fermentation-length` | Pizza Dough Fermentation Length Guide | DoughTools | Choosing fermentation length | Pizza fermentation, 24 hour pizza dough, cold fermented pizza dough | Yes | FIX BEFORE INDEX | High-value intent, but it should more explicitly own room vs cold fermentation and link to calculator/methodology. | Strengthen metadata, headings, internal links and crawlable explanation. |
| `/calculator/quick` | Quick Dough Calculator | DoughTools | Quick Dough Calculator | Pizza dough calculator, pizza yeast calculator, hydration calculator | Yes | FIX BEFORE INDEX | Highest commercial/useful query target, but metadata is too generic and page context may be too app-like for first-time search users. | Add crawlable compact intro/FAQ, clearer title/description, WebApplication structured data if visible content supports it. |
| `/methodology` | Calculation Methodology | DoughTools | How the dough calculation works. | Pizza dough calculator methodology, yeast formula, hydration formula | Yes | FIX BEFORE INDEX | Valuable proof layer after Patch 474B, but current title is generic and should connect to calculator trust. | Improve metadata/sections around yeast, fermentation, hydration and references without bloating. |
| `/sauce` | Pizza Sauce Recipe and Calculator | DoughTools | Pizza sauce, measured clearly. | Pizza sauce recipe, pizza sauce calculator | Yes | FIX BEFORE INDEX | Good intent match, but needs clear decision whether it is a recipe page, calculator page, or both for schema and metadata. | Clarify title/description and evaluate Recipe schema only if visible recipe content qualifies. |
| `/toppings` | Pizza Topping Balance Lab: Sauce, Cheese and Moisture | DoughTools | Build toppings that bake well. | Pizza toppings, topping balance, mozzarella moisture | Yes | FIX BEFORE INDEX | Good unique content, but "lab" intent may be less search-clear than "topping guide" for broad queries. | Refine metadata and internal links, preserve tool UX. |
| `/ovens` | Home Oven vs Pizza Oven: Heat, Baking and Pizza Results | DoughTools | Get better pizza from the oven you already have. | Pizza oven, home oven pizza, baking steel/stone | Yes | FIX BEFORE INDEX | Strong page after Oven Assistant work, but it should own "get better pizza from your oven" rather than generic equipment catalogue queries. | Refine metadata and add contextual links to styles/dough/sauce where useful. |
| `/styles` | Pizza Style Guide: Neapolitan, New York, Detroit, Roman and Sicilian | DoughTools | Choose the pizza style that fits your oven and goal. | Pizza styles, Neapolitan vs New York vs Detroit | Yes | FIX BEFORE INDEX | Strong visual comparison, but broad style terms may require clearer crawlable text and canonical scope. | Refine metadata and headings around style comparison and supported planning. |
| `/costs` | Home Pizza vs Restaurant Pizza Cost Calculator | DoughTools | What does your pizza night cost? | Home pizza cost calculator | Yes | FIX BEFORE INDEX | Useful but peripheral to pre-index pizza craft cluster. | Either keep noindex for launch or add clearer standalone context later. |
| `/session/start` | Plan a Pizza | DoughTools | Start a new pizza plan? / Set up your pizza plan. | Product workflow, not search landing | Yes | KEEP NOINDEX | Application entry and transient planning state. It can be linked from indexed pages, but should not be a search result target. | Remove from indexable sitemap set or keep explicit noindex when indexing opens. |
| `/timer` | Pizza Bake Timer | DoughTools | Dynamic timer heading | Pizza bake timer | Yes | KEEP NOINDEX | Duplicates `/tools/bake-timer` and has query/state behavior. | Pick one canonical timer URL before indexing. |
| `/tools/bake-timer` | Bake Timer | DoughTools | Bake timer | Pizza bake timer | Yes | KEEP NOINDEX | Duplicates `/timer`; one low-depth timer route is enough. | Pick canonical, noindex/redirect the other. |
| `/updates` | Updates | DoughTools | Product updates, when they are ready to share. | Product changelog | Yes | KEEP NOINDEX | Currently thin/empty-state oriented; weak search value. | Remove from sitemap/indexable set until real update archive exists. |
| `/contact` | Contact | DoughTools | Questions, corrections and feedback. | Contact/support | Yes | KEEP NOINDEX | Important for users, not an organic acquisition page. | Keep linked in footer, omit from first-wave sitemap. |
| `/privacy` | Privacy Notice | DoughTools | Your data, explained clearly. | Privacy policy | Yes | KEEP NOINDEX | Required transparency page; not a pizza search landing page. | Keep accessible, omit from first-wave sitemap unless policy requires indexing. |
| `/terms` | Terms of Use | DoughTools | Clear rules for using DoughTools. | Terms | Yes | KEEP NOINDEX | Required legal page; not a pizza search landing page. | Keep accessible, omit from first-wave sitemap unless policy requires indexing. |

## 4. Search-intent and Query Architecture

Recommended ownership:

| Intent cluster | Example queries | Owner route | Supporting routes | Notes |
|---|---|---|---|---|
| Brand and product | DoughTools, pizza planning app | `/` | `/about`, `/guide` | Homepage owns the product promise. |
| Full pizza planning | pizza planning, pizza night planning | `/` initially; later a public product explainer if needed | `/session/start` linked but noindex | Do not make the app workflow itself the SEO landing page. |
| Pizza dough calculator | pizza dough calculator, pizza calculator, dough ball calculator | `/calculator/quick` | `/methodology`, `/guides/dough` | Current title "Quick Dough Calculator" is too narrow/generic for launch. |
| Yeast calculator | pizza yeast calculator, yeast amount for pizza dough | `/calculator/quick` | `/methodology`, `/guide/practical-pizza-tips/fermentation-length` | Must explain yeast/time/temp relationship crawlably. |
| Hydration and baker's percentages | pizza dough hydration, baker's percentages pizza | `/guide` or `/methodology` | `/calculator/quick`, `/guides/dough` | Decide whether glossary or methodology owns this. Do not split equally. |
| Pizza dough recipe | pizza dough recipe, homemade pizza dough | `/guides/dough` | `/calculator/quick`, `/guide/practical-pizza-tips/fermentation-length` | Dough guide should own process; calculator owns custom quantities. |
| Fermentation | pizza fermentation, 24 hour pizza dough, cold fermented pizza dough | `/guide/practical-pizza-tips/fermentation-length` | `/methodology`, `/calculator/quick`, `/guides/dough` | High-value gap before indexing: page should explicitly answer room vs cold timing. |
| Sauce | pizza sauce, pizza sauce recipe, pizza sauce amount | `/sauce` | `/methodology`, `/toppings` | Clarify calculator plus recipe role. |
| Toppings | pizza toppings, topping balance, wet toppings | `/toppings` | `/guide/pizza-troubleshooting`, `/sauce` | Good unique DoughTools angle is bake balance, not generic topping lists. |
| Oven and baking | pizza oven, home oven pizza, baking steel, pizza stone | `/ovens` | `/styles`, `/guide/pizza-troubleshooting` | Own practical oven path, not equipment shopping catalogue. |
| Pizza styles | pizza styles, Neapolitan vs New York pizza, Detroit pizza | `/styles` | `/ovens`, `/session/start` | Broad terms are competitive; focus on choosing style for oven/goal. |
| Troubleshooting | pizza dough sticky, pizza base burnt, watery pizza center | `/guide/pizza-troubleshooting` | practical tips articles, `/sauce`, `/toppings`, `/ovens` | Strong cluster already exists. |
| Cost | homemade pizza cost, pizza cost calculator | `/costs` | `/` | Useful but not core launch cluster. |
| Bake timer | pizza bake timer | one of `/timer` or `/tools/bake-timer` | `/ovens` | Resolve duplicate before indexing. |

Main search-intent gaps:

- No strong crawlable "pizza dough calculator" landing explanation exists around `/calculator/quick`.
- No dedicated "pizza yeast calculator" explanation exists, despite the canonical yeast engine now being a product strength.
- The fermentation article is close to owning "24 hour pizza dough" and "cold fermented pizza dough", but it should more directly answer those terms before indexing.
- Hydration and baker's percentage education exists, but ownership is split between `/guide`, `/methodology` and calculator UI.

## 5. Calculator SEO Assessment

`/calculator/quick` is the highest-value pre-index page but is not yet the strongest landing page it could be.

What is correct:

- It has route metadata and noindex-safe launch configuration.
- It is linked from global navigation and footer.
- It calculates dough quantities without requiring a full pizza plan.
- It uses the canonical yeast model introduced by Patch 474B.
- It has a clear H1: `Quick Dough Calculator`.

Current SEO weaknesses:

- Title is too generic for likely search intent. It does not say "pizza dough calculator" or "yeast".
- Description says "ingredient amounts" but does not surface hydration, yeast, fermentation time, temperature or dough balls.
- A crawler and first-time visitor may not get enough static explanation before the interactive app surface.
- Important model trust exists in `/methodology`, but the calculator page does not strongly connect the result to that methodology.
- If stateful query URLs are shared, canonical behavior strips query parameters, but route-level noindex for query state is intentionally not implemented yet. This is acceptable only if canonical handling remains stable and the base URL is the indexed target.

Patch 479B should add a compact, non-disruptive search context layer to `/calculator/quick`:

- One plain section explaining what the calculator does.
- A short list of key inputs: pizzas, dough ball weight, hydration, salt, yeast type, fermentation time and temperature.
- A short result explanation: flour, water, salt, yeast, total dough and fermentation summary.
- A contextual link to `/methodology`.
- Metadata updated to target "pizza dough calculator" without keyword stuffing.

Do not turn the calculator into a long article before the tool.

## 6. Technical SEO Findings

### Robots and Indexability

Current behavior is correct for pre-index:

- `ALLOW_INDEXING` defaults to disabled unless explicitly set.
- Missing or unsafe `NEXT_PUBLIC_SITE_URL` prevents indexing.
- Vercel preview environments cannot enable indexing.
- Global X-Robots header blocks all pages when indexing is disabled.
- Private path X-Robots headers remain when indexing is enabled.

Required before launch:

- Keep these protections.
- Add a separate indexable-route policy so enabling indexing does not automatically index every route that has public metadata.

### Sitemap

Current sitemap source: `sitemapEntries()` maps all `publicSeoRoutes`.

Risk:

- `/session/start`, `/updates`, `/contact`, `/privacy`, `/terms`, `/timer` and `/tools/bake-timer` are in the sitemap candidate set.
- This is acceptable while robots blocks all crawling, but not ideal for launch.

Recommendation:

- Introduce a first-wave `indexableSeoRoutes` or equivalent route classification.
- Sitemap should include only pages with `INDEX READY` or explicitly approved `FIX BEFORE INDEX` pages after their fixes.

### Canonicals and Host

Current behavior:

- `normalizeSiteUrl()` rejects localhost, `.local` and `.vercel.app`.
- `canonicalUrl()` removes query strings and hashes.
- `metadataForRoute()` emits canonical and OG URL only when a safe production site URL is configured.

Recommendation:

- Use `https://www.doughtools.app` as the canonical production host.
- Continue stripping query parameters for calculator/tool base routes.
- Keep Vercel deployment URLs out of canonical metadata.

### Metadata Uniqueness

Strengths:

- Every current `publicSeoRoutes` entry has title and description.
- Homepage metadata matches the approved current message.
- OG/Twitter metadata is centrally generated and uses the current `doughtools-og-v1.png`.

Issues:

- `/calculator/quick` title is too weak for its strategic query.
- `/timer` and `/tools/bake-timer` are duplicative.
- `/updates` is thin and not search-useful yet.
- Some learning/tool titles use product labels ("Lab", "Quick") where search intent may need plainer words.

### Structured Data

Current state:

- No JSON-LD or Schema.org structured data was found in `app`, `components`, `lib` or tests.
- Visible breadcrumb UI exists in learning components, but not `BreadcrumbList` schema.

Recommended future schema, only where supported by visible content:

- `WebSite` and `Organization` on the root layout/homepage.
- `BreadcrumbList` for learning pages.
- `WebApplication` or `SoftwareApplication` for `/calculator/quick` if the page includes visible tool description and functionality.
- `Article` for practical tips and troubleshooting articles where the page behaves like an article.
- `Recipe` only where the visible page contains a genuine recipe with ingredients/instructions that match schema requirements. `/sauce` may qualify after review; calculator pages generally should not fake recipe schema.

## 7. Internal-linking Findings

What is correct:

- Global navigation links to `/session/start`, `/calculator/quick`, `/guide`, `/guides/dough`, `/sauce`, `/toppings`, `/ovens`, `/styles`, `/guide/practical-pizza-tips`, `/guide/pizza-troubleshooting` and `/about`.
- Footer links core learning pages, planner, calculator, costs and legal/company pages.
- Troubleshooting includes contextual links to dough, sauce, toppings, ovens and styles.

Gaps:

- Footer Learn group omits `/toppings` and `/guide/practical-pizza-tips`.
- Footer Product group links `/session/start`, which should remain a product handoff but not necessarily an indexed landing page.
- Practical tips article pages are mainly reached through the practical tips hub; add selective contextual links from dough/calculator/fermentation pages where relevant.
- `/methodology` is footer-linked but not strongly linked from calculator result contexts.
- `/calculator/quick` should receive stronger contextual links from dough, fermentation and methodology pages.

Recommendation:

- Patch 479B should add only high-signal internal links:
  - Dough guide -> Quick Calculator where a custom recipe is useful.
  - Fermentation article -> Quick Calculator and Methodology.
  - Quick Calculator -> Methodology and Dough Guide.
  - Sauce/Toppings/Ovens -> related troubleshooting only where directly relevant.

## 8. Content-quality Findings

Strong pages:

- Homepage has clear product positioning.
- Dough guide has substantial step-by-step educational value.
- Troubleshooting has practical symptom-led depth.
- Practical tips articles are specific and useful.
- Ovens, Toppings and Styles have been recently restructured around user decisions instead of catalogues.

Weak or launch-risk pages:

- `/calculator/quick`: useful tool, but not enough search-facing explanation.
- `/methodology`: valuable proof layer, but should better expose the canonical yeast/fermentation work for trust.
- `/sauce`: useful, but SEO role between recipe/calculator needs clearer schema-safe framing.
- `/costs`: useful but less aligned with immediate pizza craft launch queries.
- `/updates`: thin until real updates exist.
- `/timer` and `/tools/bake-timer`: duplicate utility pages.

Thin-content risk:

- Legal/contact/update pages are useful for users, but not valuable first-wave pizza search pages.
- Workflow pages can be useful app destinations but poor search results because they depend on state, choices and continuation.

## 9. Decisions Summary

### INDEX READY

- `/`
- `/about`
- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/guide/practical-pizza-tips/leftover-dough`
- `/guide/practical-pizza-tips/containers-and-lids`
- `/guide/practical-pizza-tips/common-problems`

### FIX BEFORE INDEX

- `/calculator/quick`
- `/methodology`
- `/guide/practical-pizza-tips/fermentation-length`
- `/sauce`
- `/toppings`
- `/ovens`
- `/styles`
- `/costs`

### KEEP NOINDEX

- `/session/start`
- `/timer`
- `/tools/bake-timer`
- `/updates`
- `/contact`
- `/privacy`
- `/terms`

Private/process/token/admin/API route classes remain noindex regardless of public launch.

## 10. P0 / P1 / P2 Actions

### P0 - Must Fix Before Indexing

1. **Split indexable route policy from public metadata.**
   - Current issue: `publicSeoRoutes` drives sitemap and future indexable behavior.
   - Required result: sitemap contains only approved indexable routes; workflow/private/thin/duplicate pages remain noindex or omitted.

2. **Prepare `/calculator/quick` for calculator search intent.**
   - Current issue: the best product SEO opportunity has generic metadata and limited crawlable explanation.
   - Required result: title/description and compact visible context support pizza dough calculator, yeast, hydration and fermentation intent.

3. **Resolve bake-timer duplicate URLs.**
   - Current issue: `/timer` and `/tools/bake-timer` overlap.
   - Required result: one canonical route, the other noindex or redirect-only.

### P1 - Strongly Recommended Before or Around Launch

1. Strengthen `/guide/practical-pizza-tips/fermentation-length` for room vs cold fermentation, 24 hour pizza dough and long fermentation queries.
2. Improve `/methodology` as a trust page for the canonical yeast and dough calculation model.
3. Refine metadata for `/sauce`, `/toppings`, `/ovens` and `/styles` to match plain search intent while preserving page UX.
4. Add selective internal links from learning pages to relevant tools and methodology.
5. Add `WebSite`, `Organization`, `BreadcrumbList` and article/tool schema only where visible content supports it.

### P2 - Post-launch Growth Opportunities

1. Dedicated crawlable yeast-calculator explainer if `/calculator/quick` cannot carry that intent cleanly.
2. Dedicated hydration guide if the glossary/methodology split remains unclear.
3. More specific oven setup articles for home oven steel/stone and pizza oven heat management.
4. Search-focused but product-aligned practical guides for "24 hour pizza dough" and "cold fermented pizza dough" if the fermentation article needs deeper coverage.
5. Image SEO review after indexing is enabled and impressions are available.

## 11. Recommended Scope for Patch 479B

Patch 479B should be a controlled pre-index implementation patch, not a broad SEO rewrite.

Recommended scope:

1. Create explicit route indexing classifications:
   - `indexableSeoRoutes`
   - `publicNoindexRoutes` or equivalent
   - preserve existing private noindex routes
2. Update sitemap generation to include only approved indexable routes.
3. Keep `/session/start`, legal/contact/update pages and duplicate timer routes out of the first-wave sitemap/index set.
4. Improve `/calculator/quick` metadata and add a compact crawlable explanation section before or near the calculator without delaying task access.
5. Update `/guide/practical-pizza-tips/fermentation-length` metadata and internal links so it owns fermentation timing intent.
6. Resolve `/timer` vs `/tools/bake-timer`.
7. Add minimal, valid structured data only for:
   - `WebSite`
   - `Organization`
   - `BreadcrumbList` for learning pages if implementation is shared and tested
   - `WebApplication` for `/calculator/quick` only if visible content supports it
8. Add focused tests for:
   - sitemap route inclusion/exclusion
   - noindex protection on public noindex/process routes
   - calculator metadata
   - duplicate timer canonical/noindex behavior
   - indexing disabled/enabled gates

Patch 479B should not enable Google indexing. It should make the code ready for a separate controlled indexing-enable step.

## 12. GO / NO-GO After Patch 479B

Recommendation: **GO for opening Google indexing after Patch 479B** if all of these are true:

- Sitemap includes only approved first-wave indexable pages.
- `/session/start`, account, session, auth, order-token, admin, API and duplicate/thin utility routes remain noindex or omitted.
- `/calculator/quick` clearly owns pizza dough calculator intent.
- `/guide/practical-pizza-tips/fermentation-length` clearly owns fermentation timing intent.
- `/timer` and `/tools/bake-timer` no longer compete.
- Production canonical host is `https://www.doughtools.app`.
- Production verification confirms robots, metadata, X-Robots and sitemap are exactly as intended.

If Patch 479B does not split route policy and sitemap behavior, the recommendation remains **NO-GO**.

## Audit-only Validation Notes

This patch intentionally changes only this audit document.

Inspected:

- `lib/seo-config.ts`
- `next.config.ts`
- `app/layout.tsx`
- `app/robots.ts`
- `app/sitemap.ts`
- `app/manifest.ts`
- public route layouts/pages under `app/`
- global navigation and footer components
- route redirects
- tests that assert SEO/indexing behavior

No production code, config, assets, metadata, robots rules, sitemap behavior, formulas, UI, database, migrations or deployment settings were changed.
