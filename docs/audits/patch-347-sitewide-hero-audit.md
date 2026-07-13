# Patch 347 sitewide hero and imagery audit

Date: 2026-07-13  
Baseline: latest `master` after Patch 346 and Patch 345.  
Scope: read-only route and visual inventory followed by low-risk shared hero/header standardization.

## Summary

Patch 347 classifies every user-facing route into one of five official introduction types:

- Type A — Marketing Hero
- Type B — Editorial Learning Hero
- Type C — Visual Lab Hero
- Type D — Compact Workspace Header
- Type E — Minimal Utility and Trust Header

No new images were generated. No people or hands were introduced. The authentic founder photograph remains unchanged and is only retained for About.

## Route inventory and visual decisions

| Route | Page title / group | Purpose | Current image usage | Desktop issue | Mobile issue | Approved type | Action | Final implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Homepage | Marketing front door | Homepage hero WebP desktop/mobile and product visuals | Already purpose-built after recent homepage work | Mobile crop already has dedicated asset | Type A — Marketing Hero | Retain | Classified; no code change required |
| `/?calculator=1` | Calculator v1 view | Advanced calculator workspace on homepage route | No separate page-level imagery beyond homepage/workspace context | Inputs and calculator controls should dominate | Controls remain primary | Type D — Compact Workspace Header | Intentionally no separate image | Query variant grouped under `/`; no code change required |
| `/?calculator=2` | Calculator v2 view | Advanced calculator workspace on homepage route | No separate page-level imagery beyond homepage/workspace context | Inputs and calculator controls should dominate | Controls remain primary | Type D — Compact Workspace Header | Intentionally no separate image | Query variant grouped under `/`; no code change required |
| `/about` | Founder story | Marketing trust and founder narrative | Authentic founder photo plus editorial story imagery | Strong approved founder treatment | Existing responsive story layout | Type A — Marketing Hero | Retain | Classified; founder photo unchanged |
| `/guide` | Pizza Learning Center | Educational hub | Concept diagrams/icons; no single generic photo dependency | Works as Learning Center index | Cards stack naturally | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/guides/dough` | Dough Guide | Sequential dough instruction | Step-specific hero and teaching images | Topic-specific, already optimized | Active step image placement preserved | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/guide/pizza-troubleshooting` | Troubleshooting Guide | Visual diagnosis | Topic-specific troubleshooting WebP images | Diagnostic imagery supports content | Cards and images stack | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/sauce` | Pizza Sauce Learning Lab | Educational guide + calculator | Sauce method WebP images | Sauce page is the quality reference | Calculator remains early | Type B — Editorial Learning Hero with lab section | Retain | Classified; no code change required |
| `/ovens` | Ovens guide | Heat and bake-profile learning | Mostly icon/diagram-led, no forced photo hero | Brand-neutral guide needs clarity over photo | Compact sections acceptable | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/styles` | Pizza Styles | Visual educational atlas | Style-specific pizza WebP images | Topic-specific cards suitable | Style cards stack | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/history` | Pizza History | Educational story | Historical section imagery | Learning narrative supports visuals | Content remains readable | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/gear` | Gear guide | Educational buying/reference guide | Gear-specific WebP images | Product/topic imagery is relevant | Cards stack | Type B — Editorial Learning Hero | Retain | Classified; no code change required |
| `/toppings` | Topping Balance Lab | Visual lab | Too-light/balanced/too-heavy WebP images | Lab imagery teaches variable | Mobile lab flow is focused | Type C — Visual Lab Hero | Retain | Classified; no code change required |
| `/costs` | Pizza Costs | Visual lab / playful tool | UI comparison motif, no photography | Correctly tool-first after Patch 346 | Stacked mobile comparison | Type C — Visual Lab Hero | Retain | Classified; no code change required |
| `/doctor` | Dough Doctor | Diagnostic utility/lab | Dough defect WebP images | Diagnostic images are topic-specific | Mobile diagnostic cards stack | Type C — Visual Lab Hero | Retain | Classified; no code change required |
| `/timer` | Pizza Timer | Active timing utility | No major hero image | Timer state should dominate | App-like timing page | Type C / Type D hybrid | Intentionally no image | Classified; no code change required |
| `/calculator/quick` | Quick Dough Calculator | Standalone workspace tool | No large page-level imagery | Controls and result should appear early | Mobile input/result focus | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/start` | Starting path | Planning entry | No large hero image required | Entry actions should stay early | Focused option flow | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/plan` | Fermentation planner | Planning/reference workspace | No large page-level image | Inputs/results should dominate | Focused planning controls | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/session/start` | Pizza Session start | Guided setup workspace | No large photo hero | Current choice must dominate | Mobile one-decision flow | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/session/recipe` | Recipe | Session reference workspace | No large hero; recipe cards | Recipe amounts should dominate | Key values first | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/session/shopping` | Shopping & Pizza Menu | Session workspace | Pizza menu card photos | Images useful inside cards, not hero | One card per row | Type D — Compact Workspace Header | Retain in-card images | Classified; no code change required |
| `/session/timeline` | Timeline | Session timing workspace | Timeline step images inside list | Current action is dominant | Runtime action remains first | Type D — Compact Workspace Header | Retain in-step images | Classified; no code change required |
| `/session/kitchen` | Kitchen Mode | Execution workspace | No large hero; active step content | Current step and action dominate | Most app-like page | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/session/review` | Review | Session wrap-up workspace | Photo overlay/export may appear later | Review action dominates | Form remains focused | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/account` | Account | Auth/account workspace | No large photo hero | Account state first | Compact preferences | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/account/pizza-sessions/[id]` | Completed session detail | Account detail workspace | Session/photo output only where relevant | Detail content first | Compact details | Type D — Compact Workspace Header | Intentionally no image | Dynamic route grouped; no code change required |
| `/account/party-orders` | Party Orders | Account workspace | No large image | Orders list first | Compact list | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/account/party-orders/new` | New Party Order | Account creation workspace | No large image | Form first | Form-first | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/account/party-orders/[id]` | Party Order detail | Account detail workspace | No large image | Review/actions first | Compact status | Type D — Compact Workspace Header | Intentionally no image | Dynamic route grouped; no code change required |
| `/order/[publicToken]` | Public Party Order | Public form workspace | No large image | Pizza choices/form first | Mobile form-first | Type D — Compact Workspace Header | Intentionally no image | Dynamic route grouped; no code change required |
| `/order/[publicToken]/edit/[submissionToken]` | Edit public order | Public edit workspace | No large image | Form first | Mobile form-first | Type D — Compact Workspace Header | Intentionally no image | Dynamic route grouped; no code change required |
| `/journal` | Journal | Personal workspace | No large image | Entries/actions first | List-first | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/community` | Community | Product/community workspace | No large image | Drafts/content first | Compact | Type D — Compact Workspace Header | Intentionally no image | Classified; no code change required |
| `/coach` | Coach | Narrow utility/workspace | No large image | Tool copy first | Compact | Type D / Type E | Intentionally no image | Classified; no code change required |
| `/privacy` | Privacy | Trust/legal | No image | Trust text should dominate | Readability first | Type E — Minimal Utility Header | Intentionally no image | Uses shared UtilityHeader through TrustPageLayout |
| `/terms` | Terms | Trust/legal | No image | Trust text should dominate | Readability first | Type E — Minimal Utility Header | Intentionally no image | Uses shared UtilityHeader through TrustPageLayout |
| `/contact` | Contact | Trust/contact | No image | Contact path first | Readability first | Type E — Minimal Utility Header | Intentionally no image | Uses shared UtilityHeader through TrustPageLayout |
| `/methodology` | Methodology | Trust/transparency | No image | Explanation first | Readability first | Type E — Minimal Utility Header | Intentionally no image | Uses shared UtilityHeader through TrustPageLayout |
| `/updates` | Updates | Utility/changelog | No required image; update cards | Changelog first | Cards stack | Type E — Minimal Utility Header | Intentionally no image | Classified; no code change required |
| `/auth/callback` | Auth callback | Authentication utility | No page hero | Redirect/status only | Minimal | Type E — Minimal Utility Header | Intentionally no image | Dynamic/system route grouped; no code change required |
| `/_not-found` | Not found | Error utility | No major image | Recovery action first | Minimal | Type E — Minimal Utility Header | Intentionally no image | Framework route classified |
| `/manifest.webmanifest` | Manifest | Technical asset | No visual page | Not visual | Not visual | Not user-facing page hero | N/A | Excluded from hero implementation |
| `/robots.txt` | Robots | Technical asset | No visual page | Not visual | Not visual | Not user-facing page hero | N/A | Excluded from hero implementation |
| `/sitemap.xml` | Sitemap | Technical asset | No visual page | Not visual | Not visual | Not user-facing page hero | N/A | Excluded from hero implementation |
| `/opengraph-image` | OG image endpoint | Generated social image | Image output only | Not page hero | Not page hero | Technical visual endpoint | Retain | Excluded from page hero implementation |

## Image audit summary

### Retained image families

- `public/images/homepage/`: retained for Marketing Hero; dedicated desktop/mobile assets already exist.
- `public/about/marcin-arcisz-founder.webp`: retained; authentic founder image unchanged.
- `public/dough-guide/guide-step-*`: retained for Dough Guide primary instruction imagery.
- `public/dough-guide/teaching-step-*`: retained for secondary teaching imagery.
- `public/images/troubleshooting/`: retained for diagnostic learning topics.
- `public/sauce/`: retained for Sauce Learning Lab methods.
- `public/pizza-styles/`: retained for style atlas cards.
- `public/gear/`: retained for gear-specific learning cards.
- `public/toppings/`: retained for visual lab comparison states.
- `public/images/shopping/`: retained inside Shopping workspace pizza menu cards, not elevated into page hero.
- `public/images/timeline/`: retained inside Timeline steps, not elevated into page hero.
- `public/dough-doctor/`: retained for Dough Doctor diagnostic states.

### Replaced, recropped, removed or added images

None in Patch 347. The current asset set is sufficiently topic-specific for this patch’s system rollout, and creating new imagery would increase risk without solving a verified weakness.

## Implementation decisions

- Created `docs/sitewide-hero-and-imagery-system.md` as the authoritative source.
- Created shared hero/header components under `components/page-hero/`.
- Applied `UtilityHeader` to `TrustPageLayout`, covering Contact, Privacy, Terms and Methodology with the official Type E pattern.
- Preserved homepage, About, Learning Center, Sauce, Ovens, Styles, Troubleshooting, Dough Guide, Toppings, Costs, workspaces, account and party-order layouts because their current imagery and headers already match the approved type better than a broad risky rewrite.
- No route destinations, breadcrumbs, footer architecture, SEO canonical behavior, calculations, storage, authentication or APIs changed.
