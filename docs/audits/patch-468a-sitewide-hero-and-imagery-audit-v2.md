# Patch 468A: Sitewide Hero And Imagery Audit V2

## 1. Executive Summary

This audit rechecked the current DoughTools product after the Homepage, Guide ecosystem, Practical Tips, Quick Calculator, Account and guidance-level work.

The current hero and image system is mostly directionally correct. The strongest pages are the current live Homepage, Dough, Toppings and Ovens: their imagery has a specific job and does not block the primary user task. The weakest pattern is not a lack of photos everywhere. The real opportunities are targeted instructional and comparison visuals on pages where an image can teach a decision faster than copy.

Primary conclusions:

- Retain the current live Homepage hero photo. It is the only route where a strong appetite-led photo hero is clearly justified.
- Do not roll photography across every public page. Calculators, workflow pages, account pages, authentication, Admin, legal and most utility pages should keep compact non-photo headers.
- Keep Dough, Toppings and Ovens image-led inside the teaching content, not necessarily with larger page heroes.
- Sauce has useful in-content images, but the sauce application sequence is partly diagrammatic/CSS-based and is the strongest candidate for one future realistic instructional upgrade.
- Pizza Styles has seven local style images in source assets, but the checked first screen rendered no visible style image. The route should either deliberately remain text-first or use a compact comparison strip/card imagery.
- Practical Tips articles are readable but visually plain. Add article-specific photos only where they teach storage, container fill, fermentation readiness or common defects.
- Privacy, Terms and Updates currently use or reuse hero photography. Those images add less task value than they cost in first-viewport space; future work should demote or remove them on mobile.
- No horizontal overflow was observed on browser-reviewed public visual routes at 390x844, 430x740, 1280x900 or 1440x900.
- No governance change is required in `docs/sitewide-hero-and-imagery-system.md`; the current rules already support the decisions below.

Recommended follow-up should stay small:

1. Patch 468B: marketing and learning-entry introduction cleanup.
2. Patch 468C: targeted instructional imagery for learning pages.
3. Patch 468D: image performance, crop, alt-text and asset-hygiene verification.

## 2. Method And Sources

Read and inspected:

- `docs/sitewide-hero-and-imagery-system.md`
- `docs/audits/patch-347-sitewide-hero-audit.md`
- `docs/visual-style-guide.md`
- `docs/design-system.md`
- `docs/global-responsive-ux-rules.md`
- `docs/experience-principles.md`
- current Homepage, Guide ecosystem and Quick Calculator audit/release documents
- `lib/seo-config.ts`
- `app/**/page.tsx`, `app/**/layout.tsx`, route handlers and redirect pages
- shared hero/header, Homepage, Guide, Sauce, Toppings, Ovens, Trust and session components
- public assets under `public/`

Browser review used local production rendering from the current branch at:

- 390x844
- 430x740
- 1280x900
- 1440x900

Guidance-sensitive representative checks included Beginner, Enthusiast and Pizza Nerd local-storage values for:

- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/calculator/quick`

Authenticated/private pages were source-reviewed and checked in signed-out or guard-state where safe. Authenticated visual states are marked unavailable where no safe signed-in state was used.

## 3. Current Route Inventory

### Public Indexable Routes

Confirmed from `lib/seo-config.ts`:

| Route | Class | Current role |
| --- | --- | --- |
| `/` | public marketing | Live Homepage, currently `refined` version |
| `/about` | public marketing | Founder story and product trust |
| `/contact` | trust/system | Contact and support |
| `/privacy` | trust/legal | Privacy notice |
| `/terms` | trust/legal | Terms of use |
| `/methodology` | trust/technical learning | Calculation methodology |
| `/guide` | public learning | Guide hub |
| `/session/start` | public workflow | Pizza Plan entry |
| `/guides/dough` | public learning | Dough guide |
| `/guide/pizza-troubleshooting` | public learning/diagnostic | Troubleshooting finder |
| `/guide/practical-pizza-tips` | public learning | Practical Tips index |
| `/guide/practical-pizza-tips/leftover-dough` | public learning | Tip article |
| `/guide/practical-pizza-tips/fermentation-length` | public learning | Tip article |
| `/guide/practical-pizza-tips/containers-and-lids` | public learning | Tip article |
| `/guide/practical-pizza-tips/common-problems` | public learning | Tip article |
| `/styles` | public learning | Pizza Styles guide |
| `/ovens` | public learning | Ovens guide |
| `/sauce` | public learning/utility | Sauce guide and calculator |
| `/toppings` | public visual lab | Topping balance guide/lab |
| `/calculator/quick` | public utility | Quick Dough Calculator |
| `/timer` | public utility | Pizza bake timer |
| `/tools/bake-timer` | public utility | Standalone bake timer |
| `/costs` | public visual lab/utility | Pizza cost calculator |
| `/updates` | public trust/product | Product updates |

### Additional User-Facing Routes

| Route | Class | Current role |
| --- | --- | --- |
| `/account` | account/private workspace | Sign-in, account state and local/account entry |
| `/account/forgot-password` | authentication/system | Recovery request |
| `/account/reset-password` | authentication/system | Password reset |
| `/account/settings` | account/private workspace | Settings hub |
| `/account/settings/preferences` | account/private workspace | Preferences including guidance level |
| `/account/settings/privacy` | account/private workspace/trust | Account privacy/data tools |
| `/account/settings/security` | account/private workspace/security | Security actions |
| `/account/party-orders` | public-token/account workflow | Party Order owner list |
| `/account/party-orders/new` | account workflow | Create Party Order |
| `/account/party-orders/[id]` | account workflow | Party Order owner detail |
| `/account/pizza-sessions/[id]` | account/private workspace | Saved pizza session detail |
| `/admin` | Admin/private preview | Admin tools |
| `/admin/appearance` | Admin/private preview | Appearance/theme admin |
| `/admin/bake-timer-sounds` | Admin/private preview | Timer sound admin |
| `/admin/homepage-preview/[version]` | Admin/private preview | Homepage version preview |
| `/admin/quick-calculator-preview/[prototype]` | Admin/private preview | Calculator prototype preview |
| `/order/[publicToken]` | public token-based workflow | Party Order guest form |
| `/order/[publicToken]/edit/[submissionToken]` | public token-based workflow | Guest submission edit |
| `/session/recipe` | public workflow | Recipe/Dough Plan |
| `/session/shopping` | public workflow | Shopping list |
| `/session/timeline` | public workflow | Timeline |
| `/session/kitchen` | public workflow | Kitchen Mode |
| `/session/review` | public workflow | Review |

### Redirect Or Legacy Routes

Confirmed from source:

| Route | Destination | Decision |
| --- | --- | --- |
| `/history` | `/about` | Redirect route; use destination hero decision. |
| `/doctor` | `/guide/pizza-troubleshooting` | Redirect route; use destination diagnostic decision. |
| `/coach` | `/guide/pizza-troubleshooting` | Redirect route; use destination diagnostic decision. |
| `/plan` | `/session/start` | Redirect route; use destination workspace decision. |
| `/start` | `/session/start` | Redirect route; use destination workspace decision. |
| `/gear` | `/ovens#other-equipment` | Redirect route; use destination Ovens decision. |

### Excluded Technical Endpoints

These are not page-introduction surfaces:

- `app/api/**`
- `/auth/callback`
- `/manifest.webmanifest`
- `/robots.txt`
- `/sitemap.xml`
- `/opengraph-image`
- pizza-session photo upload/moderation endpoints

## 4. Current Asset Inventory

187 image/icon assets were inventoried under `public/`.

| Asset family | Count | Formats | Current reference pattern | Finding | Decision |
| --- | ---: | --- | --- | --- | --- |
| `public/images/homepage/` | 2 | WebP | Homepage live/draft/stable, Updates reuse | Strong for Homepage; reused on Updates where the job is weaker. | Retain for Homepage; avoid broader reuse. |
| `public/about/` | 1 | WebP | About founder story | Authentic founder image; only currently approved human photo. | Retain. |
| `public/dough-guide/guide-step-*` | 12 | WebP | Dough guide primary step images | Clear action-teaching sequence. | Retain. |
| `public/dough-guide/teaching-step-*` | 24 | WebP | Dough guide process and detail visuals | Strongest instructional family, mostly useful. | Retain; review duplicates later. |
| `public/dough-guide/old numbered assets` | 9 | WebP | No current source references found for several older `01-*` to `09-*` assets | Likely legacy or superseded. | Verify before cleanup; do not delete in this patch. |
| `public/dough-guide/visual-*.svg` | 15 | SVG | No current source references found | Superseded by realistic process images in many places. | Verify before cleanup. |
| `public/flours/` | 5 | PNG | Flour/tooling references | Product-pack images, not general hero candidates. | Retain only where flour-specific UI needs them. |
| `public/images/shopping/` | 6 | WebP | Shopping cards, Homepage stable/About reuse | Useful in workflow cards, not page heroes. | Retain in-card. |
| `public/images/timeline/` | 4 | WebP | Timeline/Homepage stable/About reuse | Useful in timeline/workflow explanations. | Retain in-content only. |
| `public/images/troubleshooting/` | 40 | WebP | Troubleshooting topics | High teaching value for symptom diagnosis. | Retain and expose when user selects symptom. |
| `public/images/trust/` | 4 | WebP | Privacy/Terms heroes | Polished but low job value for legal pages; pushes section links down on mobile. | Consider demotion/removal on mobile. |
| `public/ovens/home-vs-pizza-oven.webp` | 1 | WebP | Ovens hero | Useful topic identifier and comparison. | Retain. |
| `public/ovens/teaching/` | 9 | WebP | Ovens setup and troubleshooting | Strong teaching imagery. | Retain; add diagrams only where rack/heat flow needs precision. |
| `public/ovens/equipment/` | 13 | SVG | Equipment list | Useful icon-like thumbnails; visually different from realistic teaching photos. | Retain, do not promote to hero. |
| `public/pizza-styles/` | 7 | WebP | Style education metadata | Good style-specific assets; first-screen browser review did not show a visible image. | Reuse in a compact style comparison. |
| `public/sauce/` | 4 | WebP | Sauce guide/tomato style assets | Useful but not fully covering application texture/action. | Retain; one replacement/addition may help. |
| `public/toppings/` | 22 | WebP | Toppings guide/lab | Very strong comparison and teaching set. | Retain; avoid adding clutter. |
| `public/icon.svg`, `pizza-pattern.svg`, `pizza-guide-hero.svg` | 3 | SVG | App icon/decorative legacy assets | Fine as system assets; not primary hero imagery. | Retain unless future cleanup proves unused. |

Asset concerns:

- Several old Dough assets are likely superseded by newer `guide-step-*` and `teaching-step-*` images.
- Updates reuses the Homepage hero image; this creates unnecessary visual duplication and weakens the Homepage asset's specificity.
- Privacy and Terms hero images are high quality but questionable under the current Type E minimal utility/trust guidance.
- No remote production image URLs were found in the audited visual source paths.

## 5. Existing Hero-System Assessment

The five introduction types in `docs/sitewide-hero-and-imagery-system.md` remain valid:

- Type A: Marketing Hero.
- Type B: Editorial Learning Hero.
- Type C: Visual Lab Hero.
- Type D: Compact Workspace Header.
- Type E: Minimal Utility and Trust Header.

No governance edit is required. The current system already says the right thing: choose imagery by user job, keep task pages compact, use photography when it improves appetite or understanding, and avoid decorative imagery.

The current product should apply those rules more strictly on legal/trust/product-update pages and more deliberately on article-level teaching pages.

## 6. Marketing Pages

### `/`

Current state:

- Live Homepage is the `refined` version.
- Hero uses `/images/homepage/doughtools-hero-desktop.webp`.
- At 390x844, `Plan a pizza` measured around 379 px from the document top, and the hero image began around 507 px.
- At 1280x900, the hero image began around 63 px and was visually dominant.
- No horizontal overflow was observed.

Decision:

- Retain current hero photo.
- Do not add more Homepage photos in the primary flow.
- Keep mobile order as text and CTA before image; image still appears early enough to add appetite without delaying action.
- Future work should only verify crop/LCP after the live Homepage stabilizes.

### `/about`

Current state:

- Uses approved founder photo `/about/marcin-arcisz-founder.webp` and multiple supporting story images.
- Desktop image quality is strong and trust-building.
- Mobile first CTA to `Plan a pizza` is far below the first viewport, but that is acceptable for a story page.

Decision:

- Retain founder photo and story images.
- Do not add new photos.
- Do not use this founder image elsewhere as generic site trust decoration.

## 7. Learning Pages

| Route | Current imagery | Assessment | Recommendation |
| --- | --- | --- | --- |
| `/guide` | No photos; icon-led dark hero and learning path cards | Clear and compact after 462B; photo is not required. | Retain non-photo header; prototype one small learning composition only if future user review finds the hub emotionally flat. |
| `/guides/dough` | Process and step images | Strong teaching system; first useful action appears before deeper images on mobile. | Retain; no separate hero photo. |
| `/sauce` | Tomato/sauce and sauce amount images below calculator | Practical, but sauce identity image appears late. | Retain current header; consider one realistic application/texture image below Quick Answer, not a large hero. |
| `/toppings` | Teaching and comparison images | Best current visual lab pattern; images teach amount, moisture and distribution. | Retain; do not add broad hero photo. |
| `/ovens` | Home/pizza oven comparison hero plus setup images | Strong topic identifier and teaching images. | Retain; add diagrams only where rack position or heat path needs precision. |
| `/styles` | Style assets exist; no visible first-screen images in checked state | The route feels less visual than its subject. | Add compact comparison imagery using existing style assets; avoid one misleading hero photo. |
| `/guide/practical-pizza-tips` | No images | Compact landing works; images may make it heavy. | Retain image-free landing or add only tiny topic thumbnails if route discovery suffers. |
| Practical Tips articles | No images | Readable but visually plain; some topics would benefit from instruction photos. | Add targeted in-content photos for leftover dough, containers and fermentation states. |
| `/guide/pizza-troubleshooting` | Diagnostic images after problem selection | Correct action-first diagnostic structure. | Retain no-photo intro; make symptom images easier to reach where useful. |

## 8. Visual Labs

| Route | Current state | Decision |
| --- | --- | --- |
| `/toppings` | Interactive visual lab with real comparison images | Retain visual-lab model; images belong in lab, not above it as decoration. |
| `/costs` | Cost tool with compact non-photo header | Intentionally image-free. Results and inputs should dominate. |
| `/calculator/quick` | Result-first calculator with no imagery | Intentionally image-free. This is a workspace. |
| `/timer` and `/tools/bake-timer` | Timer tools with no imagery | Intentionally image-free. Current timer state is the content. |

## 9. Workspaces

Pizza Plan and session routes should use Type D compact workspace headers. The current state follows this principle.

| Route group | Image decision | Reason |
| --- | --- | --- |
| `/session/start` | Intentionally no hero image | Oven/style choices and setup controls are the task. |
| `/session/recipe` | Intentionally no hero image | Recipe quantities and override controls must be first. |
| `/session/shopping` | Retain pizza images inside menu cards | Images identify pizza variants without blocking the shopping task. |
| `/session/timeline` | Retain step imagery only if tied to current timeline context | Current timing/action should dominate. |
| `/session/kitchen` | Intentionally no hero image | Active kitchen action and safety controls are primary. |
| `/session/review` | Intentionally no hero image | Review data and photo upload/review controls are primary. |
| `/order/[publicToken]` and edit route | Intentionally no hero image | Guest submission controls and status should be immediate. |

Authenticated active-session states were not visually inspected with real cloud data. Source inspection shows the image use is already in workflow content, not route-level heroes.

## 10. Account And Private Routes

Account, Settings and Admin pages should remain Type D or Type E depending on the page:

- `/account`
- `/account/settings`
- `/account/settings/preferences`
- `/account/settings/privacy`
- `/account/settings/security`
- `/account/forgot-password`
- `/account/reset-password`
- `/account/party-orders`
- `/account/party-orders/new`
- `/account/party-orders/[id]`
- `/account/pizza-sessions/[id]`
- `/admin`
- `/admin/appearance`
- `/admin/bake-timer-sounds`
- `/admin/homepage-preview/[version]`
- `/admin/quick-calculator-preview/[prototype]`

Decision:

- Do not introduce photo heroes.
- Keep icons, status cards and task controls.
- For Party Orders, in-content QR/invitation visuals are appropriate; a hero photo is not.
- Admin previews may show the page being previewed, but Admin wrapper chrome should remain utilitarian and noindexed.

## 11. Trust, Legal And Auth Routes

| Route | Current imagery | Finding | Recommendation |
| --- | --- | --- | --- |
| `/privacy` | `/images/trust/privacy-hero-desktop.webp`, mobile variant | Looks polished but pushes first section link to about 1083 px at 390x844. | Demote/remove photo on mobile; Type E minimal header is stronger. |
| `/terms` | `/images/trust/terms-hero-desktop.webp`, mobile variant | Similar issue; legal content needs clarity more than mood. | Demote/remove photo on mobile; retain only if reduced below header. |
| `/contact` | No image | Appropriate. | Retain no image. |
| `/methodology` | No image | Appropriate; formulas and explanation matter. | Retain no image or use small diagrams only if a later formula explanation needs one. |
| `/updates` | Reuses Homepage hero image | Weak image job and duplicates Homepage visual identity. | Remove or replace with compact non-photo product-update header. |
| `/auth/callback` | No visual page | Correct. | Excluded from hero scoring. |

## 12. First-Viewport Measurements

Approximate local production-render measurements:

| Route | 390x844 first useful content/action | 390 first image | 1280x900 first useful content/action | 1280 first image | Finding |
| --- | ---: | ---: | ---: | ---: | --- |
| `/` | CTA 379 px | 507 px | CTA 687 px | 63 px | Strong marketing hero; action early enough. |
| `/about` | first major CTA 4053 px | 685 px | first major CTA 3149 px | 101 px | Story page; photo supports trust. |
| `/guide` | first guide card 1503 px | none | first guide card 1075 px | none | Header is clear but first actionable guide appears after intro. |
| `/guides/dough` | `Start with weighing` 766 px | 909 px | `Start with weighing` 795 px | 135 px | Good first action; desktop image supports process. |
| `/sauce` | nav/action noise at top; sauce task follows intro | 5316 px | nav/action noise at top; sauce task follows intro | 2912 px | Sauce images appear late because calculator comes first. Good for task, weaker for immediate sauce identity. |
| `/toppings` | nav/action noise at top; lab action follows intro | 1990 px | nav/action noise at top | 933 px | Dense page but visual lab remains structured. |
| `/ovens` | nav/action noise at top | 438 px | nav/action noise at top | 163 px | Hero image supports topic early. |
| `/styles` | nav/action noise at top | none | nav/action noise at top | none | Style page lacks early visual comparison. |
| `/guide/practical-pizza-tips` | topic cards around first viewport | none | topic cards in first viewport | none | Compact and acceptable. |
| `/guide/pizza-troubleshooting` | `Find my problem` 358 px | none | `Find my problem` 378 px | none | Correct diagnostic priority. |
| `/calculator/quick` | guidance/result area 258 px | none | guidance/result area 218 px | none | Correct image-free utility. |
| `/costs` | first input 463 px | none | first input 515 px | none | Correct image-free utility. |
| `/timer` | timer/control content near top | none | timer/control content near top | none | Correct image-free timer. |
| `/session/start` | choice control 210 px | none | choice control 250 px | none | Correct workspace header. |
| `/privacy` | first section link 1083 px | 613 px | first section link 613 px | 110 px | Trust image delays content on mobile. |
| `/terms` | first section link 1027 px | 557 px | first section link 589 px | 110 px | Trust image delays content on mobile. |
| `/methodology` | first content/action 532 px | none | first content/action 532 px | none | Correct text-first method page. |
| `/updates` | first content/action 466 px | about 102 px desktop | 466 px | 102 px | Homepage image reuse weakens specificity. |

No horizontal overflow was detected in the measured routes at the required viewports.

## 13. Mobile Findings

Works:

- Homepage keeps the primary CTA before the image.
- Quick Calculator remains image-free and result-first.
- Session Start puts actionable choices inside the first viewport.
- Troubleshooting starts with diagnostic action, not a decorative image.
- Dough, Toppings and Ovens use images as teaching content rather than generic decoration.

Needs attention:

- Privacy and Terms mobile hero images push legal section access too low.
- Guide hub first actionable guide cards appear after the dark hero and explanation; this is acceptable but should not grow.
- Sauce images appear far below the top because the calculator correctly comes first. If sauce needs immediate visual identity, use a small in-content image near Quick Answer rather than a taller hero.
- Style guide would benefit from early style comparison thumbnails if implemented compactly.
- Practical Tips articles could use small targeted images without turning into long visual articles.

## 14. Desktop Findings

Works:

- Homepage desktop hero is strong and food-led.
- Ovens desktop hero and setup images are coherent after the readability fix.
- Toppings uses desktop width for comparisons rather than a generic hero.
- Quick Calculator desktop behaves like a Workbench and should remain image-free.

Needs attention:

- Guide hub still relies on icon/card hierarchy. That is not broken, but a small editorial visual may help if user review says it feels too index-like.
- Style guide desktop does not visually show pizza-style differences early enough.
- Privacy/Terms desktop photos look polished but are not needed for legal comprehension.
- Updates should not reuse the Homepage food hero.

## 15. Photography Opportunities

Best photography candidates:

- Homepage: retain current photo, no new image.
- Sauce: realistic sauce texture/application close-up below Quick Answer or in application section.
- Practical Tips articles: leftover dough storage, container fill/lid fit, fermentation readiness.
- Troubleshooting: selected symptom images are already strong; consider a compact diagnostic image grid only if it does not delay the finder.
- Pizza Styles: use existing style photos as comparison, not a single hero.

Avoid photography:

- Quick Calculator.
- Costs.
- Timers.
- Session workflow headers.
- Account, Admin, auth and legal pages.
- Generic guide hub hero unless it shows learning/process rather than finished pizza.

## 16. Diagram Opportunities

Diagrams are better than photos for:

- Oven rack position and heat path.
- Baking steel vs stone vs tray setup differences.
- Heat balance between top and bottom bake.
- Dough fermentation timeline or room/cold decision diagrams in method pages.
- Calculator formula assumptions, if ever added visually.

Do not add diagrams where current realistic images already teach the action clearly.

## 17. Comparison-Image Opportunities

Comparison visuals are highest value for:

- Toppings amount: too little, recommended, too much.
- Sauce amount and sauce texture: thin, recommended, flooded.
- Dough readiness: underproofed, ready, overproofed.
- Fermentation length: 12 h, 24 h, 48 h, 72 h outcome expectations.
- Pizza Styles: side-by-side style cards.
- Troubleshooting: symptom examples.

## 18. Routes That Should Remain Image-Free

Recommended intentionally image-free:

- `/calculator/quick`
- `/costs`
- `/timer`
- `/tools/bake-timer`
- `/session/start`
- `/session/recipe`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account`
- `/account/*`
- `/admin`
- `/admin/*`
- `/contact`
- `/methodology` unless a small diagram is needed
- `/privacy` and `/terms` headers
- `/order/[publicToken]`
- `/order/[publicToken]/edit/[submissionToken]`
- technical endpoints

Reason: these pages need trust, state, controls, legal meaning or current action. Images can appear inside content only when they teach a concrete step.

## 19. Asset Reuse And Cleanup Findings

Retain/reuse:

- `/images/homepage/doughtools-hero-desktop.webp` for the Homepage only.
- `/images/homepage/doughtools-hero-mobile.webp` for stable/rollback Homepage preview only if still needed.
- `/about/marcin-arcisz-founder.webp` for About.
- `/dough-guide/guide-step-*` and `/dough-guide/teaching-step-*`.
- `/toppings/**` current comparison and teaching images.
- `/ovens/teaching/**` current teaching images.
- `/pizza-styles/**` if Style comparison images are made visible.
- `/images/troubleshooting/**` for selected diagnostic content.
- `/images/shopping/**` only inside shopping/menu/workflow contexts.
- `/images/timeline/**` only inside timeline/workflow contexts.

Cleanup candidates:

- Older `public/dough-guide/01-*` to `09-*` files.
- `public/dough-guide/visual-*.svg` if no current source, docs, tests or external references remain.
- `/images/trust/*` if Privacy/Terms are moved to minimal headers.
- Updates use of Homepage hero.

## 20. Performance Findings

Current risk:

- Homepage hero: medium LCP risk by design, justified by marketing role. It uses local WebP and priority loading.
- Privacy/Terms heroes: medium mobile performance and usefulness risk because legal content does not need a photo hero.
- Updates hero reuse: low to medium risk, mostly unnecessary bytes/visual duplication.
- Toppings/Ovens/Dough: low to medium risk because images teach content and are mostly below the first task.
- Large image-heavy guides should continue using lazy loading below the fold and explicit dimensions/sizes.

Future image requirements:

- Local WebP or approved optimized format.
- Explicit dimensions.
- Accurate `sizes`.
- `priority` only for true above-the-fold major images.
- Lazy loading below the fold.
- No remote production image URLs.
- No carousels, video heroes, parallax or duplicated desktop/mobile downloads.

## 21. Accessibility Findings

Good patterns:

- Most image components use `next/image` with explicit alt text.
- Teaching images generally name the instructional state.
- Image-heavy guide pages also include text explanation, so meaning is not image-only.
- No horizontal overflow was observed in checked routes.

Risks:

- Legal/trust images may be announced before practical legal navigation without adding meaning.
- Reused Homepage image alt can become misleading when used on non-Homepage pages such as Updates.
- Teaching comparisons need alt text that explains the distinction, not just the object.
- Diagrams must not convey state only by color.
- Linked image cards need meaningful accessible names from visible text, not only image alt.

Alt-text rule for future teaching assets:

> Describe the instructional distinction: "Drained mozzarella in a bowl with no visible pooling water" is better than "Mozzarella."

## 22. At Least 40 Concrete Ideas

| # | Route/system area | User problem | Proposed solution | Image job | Mobile impact | Desktop impact | Complexity | UX impact | Recommendation |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` | Homepage already has strong appetite imagery | Retain current hero photo and avoid extra Homepage imagery | Inspire appetite | Keeps action early | Preserves premium first impression | low | high | pursue |
| 2 | `/` | Mobile photo could overgrow if future changes add content | Keep CTA before image and cap mobile hero image height | Appetite without delay | Stronger first-screen clarity | no change | low | medium | pursue |
| 3 | `/about` | Founder trust works because image is authentic | Retain founder photo only on About | Trust | No extra visual debt | Strong story credibility | low | high | pursue |
| 4 | `/about` | Supporting images make page long | Do not add more story photos | Reduce clutter | Shorter story path | More focused narrative | low | medium | pursue |
| 5 | `/guide` | Hub can feel icon-led and procedural | Prototype one compact learning-process composition only if needed | Support navigation | Could orient beginners | Adds editorial identity | medium | medium | prototype |
| 6 | `/guide` | Generic pizza photo would duplicate Homepage | Keep no-photo header by default | Avoid decoration | Faster guide access | Distinct from Homepage | low | high | pursue |
| 7 | `/guides/dough` | Separate hero could delay first action | Keep process visuals below Quick Answer | Teach action | First action stays early | Strong process scan | low | high | pursue |
| 8 | `/guides/dough` | Older dough assets create maintenance noise | Verify unused old assets before deleting | Asset hygiene | none | none | medium | medium | defer |
| 9 | `/guides/dough` | Fermentation readiness is hard for beginners | Retain and possibly improve readiness comparison images | Teach state | Better diagnosis | Better comparison | medium | high | pursue |
| 10 | `/sauce` | Sauce page does not visually identify sauce early | Add small realistic sauce texture/application image below Quick Answer if needed | Identify and teach | More immediate topic signal | Supports explanation | medium | medium | prototype |
| 11 | `/sauce` | CSS application visual is less realistic than other guides | Replace or supplement with realistic spiral application sequence | Teach action | Clearer spoon technique | Better visual consistency | high | high | pursue |
| 12 | `/sauce` | Tomato choice can be abstract | Retain tomato/sauce image and caption near Buy the tomatoes | Teach ingredient choice | Helps beginners | Supports comparison | low | medium | pursue |
| 13 | `/toppings` | Page is dense already | Do not add a generic topping hero | Avoid clutter | Prevents long mobile page | Keeps lab primary | low | high | pursue |
| 14 | `/toppings` | Amount errors are visual | Retain too little/recommended/too much comparisons | Teach quantity | Strong immediate learning | Strong lab comparison | low | high | pursue |
| 15 | `/toppings` | Wet toppings can be misunderstood | Keep wet/drained mozzarella references visible where relevant | Teach moisture | Better action clarity | Better comparison | low | high | pursue |
| 16 | `/ovens` | Oven setup needs physical orientation | Retain existing setup photos | Teach placement | More concrete setup | Strong guide quality | low | high | pursue |
| 17 | `/ovens` | Rack/top heat may need precision | Add restrained rack-position/heat-path diagram | Teach concept | Compact if inline | Clear desktop comparison | medium | high | prototype |
| 18 | `/ovens` | Appliance product shots risk brand feel | Avoid branded oven hero photos | Avoid promotion | Keeps neutral guidance | Keeps product-agnostic tone | low | high | pursue |
| 19 | `/styles` | Users need to see style differences | Use existing style images in a compact comparison strip | Identify topic | Better early recognition | Richer comparison | medium | high | pursue |
| 20 | `/styles` | One hero could imply one style is canonical | Avoid single style hero | Avoid misleading | Better neutrality | Better comparison | low | high | pursue |
| 21 | `/guide/practical-pizza-tips` | Landing is short and useful | Keep no hero image | Preserve compactness | Faster topic selection | Less clutter | low | medium | pursue |
| 22 | `/guide/practical-pizza-tips` | Topic cards are text-only | Consider tiny topic thumbnails only if discoverability drops | Support navigation | Adds visual anchors | Adds scan cues | medium | low | defer |
| 23 | `/guide/practical-pizza-tips/leftover-dough` | Storage/freezing steps are visual | Add wrapped frozen dough and thawed ready dough images | Teach storage state | Practical confidence | Strong article support | medium | high | pursue |
| 24 | `/guide/practical-pizza-tips/fermentation-length` | Time effects are abstract | Add under/ready/over or 12/24/48/72 comparison | Teach readiness | Faster pattern recognition | Good comparison table companion | high | high | prototype |
| 25 | `/guide/practical-pizza-tips/containers-and-lids` | Container headspace is hard to picture | Add container fill-level and lid-fit photo | Teach setup | Clear action | Clear reference | medium | high | pursue |
| 26 | `/guide/practical-pizza-tips/common-problems` | Problems are easier with examples | Link to or reuse troubleshooting symptom images | Diagnose | Better scanning | Better troubleshooting handoff | medium | medium | pursue |
| 27 | `/guide/pizza-troubleshooting` | Initial finder must remain fast | Keep intro image-free | Prioritize diagnosis | Action first | Action first | low | high | pursue |
| 28 | `/guide/pizza-troubleshooting` | Selected symptom visuals are valuable | Keep image tied to chosen problem, not hero | Teach diagnosis | Avoids overload | Focused evidence | low | high | pursue |
| 29 | `/calculator/quick` | Photos would delay result | Keep image-free compact header | Workspace clarity | Maintains result-first flow | Maintains Workbench | low | high | pursue |
| 30 | `/costs` | User needs inputs/results | Keep image-free | Workspace clarity | Faster control access | Cleaner utility | low | high | pursue |
| 31 | `/timer` | Timer state is the page | Keep image-free | Action clarity | Keeps controls first | Keeps utility clear | low | high | pursue |
| 32 | `/tools/bake-timer` | Same timer job | Keep image-free | Action clarity | Keeps controls first | Keeps utility clear | low | high | pursue |
| 33 | `/session/start` | User must choose settings | Keep photo-free header | Workflow clarity | Choice visible early | Compact workspace | low | high | pursue |
| 34 | `/session/shopping` | Pizza type recognition helps | Retain in-card pizza images | Identify items | Better shopping choices | Better export cards | low | medium | pursue |
| 35 | `/session/timeline` | Current action matters | Use images only on step details if needed | Teach step | Avoid delay | Contextual help | medium | low | defer |
| 36 | `/session/kitchen` | Active task and safety matter | Keep route header image-free | Action/safety | Faster controls | Cleaner kitchen mode | low | high | pursue |
| 37 | `/privacy` | Image delays legal navigation | Remove/demote mobile hero photo | Trust clarity | Major first-viewport gain | Still readable | medium | medium | pursue |
| 38 | `/terms` | Image delays legal navigation | Remove/demote mobile hero photo | Trust clarity | Major first-viewport gain | Still readable | medium | medium | pursue |
| 39 | `/updates` | Homepage photo reuse is off-topic | Replace with compact no-photo update header | Consistency | Less duplicate visual | Better product context | low | medium | pursue |
| 40 | `/methodology` | Formula text may feel dense | Add only diagrams for formulas if future evidence warrants | Explain concept | Optional help | Helpful for technical users | medium | low | defer |
| 41 | `/account/*` | Account pages need precision | Keep photo-free; use icons/status only | Workspace clarity | Faster tasks | Cleaner account | low | high | pursue |
| 42 | `/admin/*` | Admin pages are role/task based | Keep no imagery except previewed page content | Scope clarity | no clutter | no clutter | low | high | pursue |
| 43 | `/order/*` | Guests need form clarity | Keep no hero photo; use invitation/QR visuals only in content | Action clarity | Form first | Form first | low | high | pursue |
| 44 | Image system | Reused generic pizza photos can make pages templated | Route-specific image job checklist before adding assets | Governance | Less mobile clutter | Better consistency | low | high | pursue |
| 45 | Performance | More images can harm LCP | Require explicit dimensions, sizes and lazy loading below fold | Performance | Lower data cost | Stable layout | low | high | pursue |
| 46 | Accessibility | Teaching images need clear distinctions | Require instructional alt drafts in image briefs | Accessibility | Better screen-reader value | Better compliance | low | high | pursue |

## 23. Complete Route Decision Matrix

| Route | User job | Current intro type | Current image | Current problem | Recommended intro type | Hero recommendation | In-content imagery recommendation | Desktop decision | Mobile decision | Existing asset reuse | New asset required | Priority | Follow-up patch |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Understand product and start planning | Type A | Homepage WebP | None material | Type A | retain | no extra images | retain crop | retain CTA before image | yes | no | high | 468D verify only |
| `/about` | Trust founder/product story | Type A | founder and story images | page is long but story-led | Type A | retain | retain story images | retain | retain | yes | no | medium | none |
| `/contact` | Contact/support | Type E | none | none | Type E | intentionally none | icons only if needed | retain | retain | no | no | low | none |
| `/privacy` | Understand data policy | Type E with photo | trust hero | image delays mobile content | Type E | remove/demote current image | none | compact text header | omit/demote image | maybe remove | no | medium | 468B |
| `/terms` | Understand terms | Type E with photo | trust hero | image delays mobile content | Type E | remove/demote current image | none | compact text header | omit/demote image | maybe remove | no | medium | 468B |
| `/methodology` | Understand calculations | Type E/technical | none | dense but appropriate | Type E | intentionally none | optional diagrams later | retain | retain | no | deferred | low | none |
| `/guide` | Choose learning route | Type B icon-led | none | first card lower than ideal, but not broken | Type B | retain non-photo | optional small learning composition | keep system-led | keep compact | icons | no | medium | 468B |
| `/guides/dough` | Learn dough process | Type B | dough process images | legacy asset sprawl | Type B | no separate hero | retain process/step images | retain | retain | yes | no | high | 468D cleanup |
| `/sauce` | Choose sauce and calculate amount | Type B/D hybrid | sauce/topping refs below calculator | sauce identity image appears late | Type B with utility | no large hero | add realistic application image if needed | keep calculator early | keep calculator early | yes | possible | high | 468C |
| `/toppings` | Balance toppings visually | Type C | many topping images | page is dense | Type C | no generic hero | retain comparison images | retain lab | retain compact lab | yes | no | high | 468C verify |
| `/ovens` | Choose oven setup | Type B | oven comparison and setup images | diagrams may teach rack/heat better | Type B | retain current comparison | add diagram if needed | retain | retain | yes | possible diagram | high | 468C |
| `/styles` | Compare pizza styles | Type B | style assets not visible early | visual subject underused | Type B | no single hero | add style comparison strip | use existing style photos | compact thumbnails | yes | no | high | 468C |
| `/guide/practical-pizza-tips` | Choose tip topic | Type B compact | none | plain but clear | Type B | intentionally none | optional tiny thumbnails | retain compact | retain compact | no | deferred | medium | 468C optional |
| `/guide/practical-pizza-tips/leftover-dough` | Store/reuse dough | Type B compact | none | storage states need visuals | Type B | no hero | add storage/thaw images | in-content | in-content small | no | yes | high | 468C |
| `/guide/practical-pizza-tips/fermentation-length` | Pick fermentation duration | Type B compact | none | time differences abstract | Type B | no hero | add readiness comparison | in-content comparison | compact comparison | maybe dough refs | possible | high | 468C |
| `/guide/practical-pizza-tips/containers-and-lids` | Use containers/lids | Type B compact | none | headspace/lid fit visual missing | Type B | no hero | add container fill photo | in-content | compact | no | yes | high | 468C |
| `/guide/practical-pizza-tips/common-problems` | Solve common problems | Type B compact | none | can borrow symptom visuals | Type B | no hero | reuse troubleshooting images | desktop cards | mobile thumbnails | yes | no | medium | 468C |
| `/guide/pizza-troubleshooting` | Diagnose problem | Type C/diagnostic | selected symptom images | intro no image, correctly | Type C | intentionally none | retain symptom images | finder first | finder first | yes | no | high | none |
| `/calculator/quick` | Calculate dough | Type D | none | none | Type D | intentionally none | none | Workbench | result-first | no | no | high | none |
| `/costs` | Compare costs | Type C/D | none | none | Type D | intentionally none | diagram only if future need | retain | retain | no | no | low | none |
| `/timer` | Run bake timer | Type D | none | none | Type D | intentionally none | none | retain | retain | no | no | low | none |
| `/tools/bake-timer` | Run bake timer | Type D | none | none | Type D | intentionally none | none | retain | retain | no | no | low | none |
| `/session/start` | Start Pizza Plan | Type D | none | none | Type D | intentionally none | none | retain | retain | no | no | high | none |
| `/session/recipe` | View/edit recipe | Type D | none | authenticated active state unavailable | Type D | intentionally none | dough images only in contextual links | source-verify | source-verify | possible | no | high | none |
| `/session/shopping` | Shop ingredients | Type D | pizza card images | none | Type D | intentionally none | retain pizza card images | retain | retain | yes | no | medium | none |
| `/session/timeline` | Follow prep schedule | Type D | timeline step images/source | active state unavailable | Type D | intentionally none | retain step images if visible | source-verify | source-verify | yes | no | medium | none |
| `/session/kitchen` | Execute active step | Type D | none | active state unavailable | Type D | intentionally none | contextual step imagery only | source-verify | source-verify | possible | no | high | none |
| `/session/review` | Review/save bake | Type D | user photo handling only | active state unavailable | Type D | intentionally none | user-uploaded review photo only | source-verify | source-verify | user data | no | medium | none |
| `/account` | Account access/state | Type D/E | none | signed-in state unavailable | Type D | intentionally none | icons/status only | retain | retain | no | no | high | none |
| `/account/forgot-password` | Recover access | Type E | none | none | Type E | intentionally none | none | retain | retain | no | no | high | none |
| `/account/reset-password` | Reset password | Type E | none | token state unavailable | Type E | intentionally none | none | retain | retain | no | no | high | none |
| `/account/settings` | Manage settings | Type D | none | signed-in state unavailable | Type D | intentionally none | icons/status only | retain | retain | no | no | high | none |
| `/account/settings/preferences` | Manage preferences | Type D | none | signed-in state unavailable | Type D | intentionally none | none | retain | retain | no | no | high | none |
| `/account/settings/privacy` | Manage data/privacy | Type D/E | none | signed-in state unavailable | Type E | intentionally none | none | retain | retain | no | no | high | none |
| `/account/settings/security` | Manage security | Type D/E | none | signed-in state unavailable | Type E | intentionally none | none | retain | retain | no | no | high | none |
| `/account/party-orders` | Manage party orders | Type D | invitation visuals source | signed-in state unavailable | Type D | intentionally none | retain invitation/QR visuals | source-verify | source-verify | yes | no | medium | none |
| `/account/party-orders/new` | Create party order | Type D | none | signed-in state unavailable | Type D | intentionally none | none | retain | retain | no | no | medium | none |
| `/account/party-orders/[id]` | Manage order | Type D | invitation visuals source | dynamic state unavailable | Type D | intentionally none | retain invitation/QR visuals | source-verify | source-verify | yes | no | medium | none |
| `/account/pizza-sessions/[id]` | View saved session | Type D | user photo/source | dynamic state unavailable | Type D | intentionally none | user photo only | source-verify | source-verify | user data | no | medium | none |
| `/order/[publicToken]` | Guest order submit | Type D | none | invalid-token state only | Type D | intentionally none | none | source/guard | source/guard | no | no | high | none |
| `/order/[publicToken]/edit/[submissionToken]` | Guest order edit | Type D | none | invalid-token state only | Type D | intentionally none | none | source/guard | source/guard | no | no | high | none |
| `/admin` | Admin hub | Type D/E | none | none | Type D | intentionally none | preview content only | retain | retain | no | no | high | none |
| `/admin/appearance` | Admin appearance | Type D | none | authenticated state unavailable | Type D | intentionally none | none | retain | retain | no | no | high | none |
| `/admin/bake-timer-sounds` | Admin timer sounds | Type D | none | authenticated state unavailable | Type D | intentionally none | none | retain | retain | no | no | high | none |
| `/admin/homepage-preview/[version]` | Preview Homepage | Admin preview | preview content includes Homepage image | correct | Admin preview | wrapper no image | preview only | retain | retain | yes | no | high | none |
| `/admin/quick-calculator-preview/[prototype]` | Preview prototypes | Admin preview | none | correct | Admin preview | intentionally none | none | retain | retain | no | no | high | none |
| `/updates` | Read product updates | Type A-ish reuse | Homepage hero | image job weak | Type E/product | remove/demote | none | compact | compact | no | no | medium | 468B |
| `/history` | Redirect to About | redirect | destination images | no independent page | redirect | destination decision | destination decision | redirect | redirect | yes | no | low | none |
| `/doctor` | Redirect to Troubleshooting | redirect | destination | no independent page | redirect | destination decision | destination decision | redirect | redirect | yes | no | low | none |
| `/coach` | Redirect to Troubleshooting | redirect | destination | no independent page | redirect | destination decision | destination decision | redirect | redirect | yes | no | low | none |
| `/plan` | Redirect to Session Start | redirect | none | no independent page | redirect | destination decision | destination decision | redirect | redirect | no | no | low | none |
| `/start` | Redirect to Session Start | redirect | none | no independent page | redirect | destination decision | destination decision | redirect | redirect | no | no | low | none |
| `/gear` | Redirect to Ovens equipment | redirect | destination | no independent page | redirect | destination decision | destination decision | redirect | redirect | yes | no | low | none |

## 24. Prioritised Implementation Groups

### Group 1: High-Value Appetite And First Impression

Routes:

- `/`
- `/about`
- `/guide`
- `/updates`
- `/privacy`
- `/terms`

Decision:

- Retain Homepage and About photography.
- Keep Guide hub mostly system-led.
- Remove/demote unnecessary trust/update photography before adding anything new.

### Group 2: High-Value Teaching Imagery

Routes:

- `/sauce`
- `/styles`
- Practical Tips articles
- `/ovens`
- `/toppings`
- `/guide/pizza-troubleshooting`
- `/guides/dough`

Decision:

- Implement only topic-specific instructional or comparison assets.
- Prefer existing Toppings/Ovens/Dough assets where sufficient.
- Add new assets only for sauce application, style comparison, dough storage/container/fermentation article moments and selected diagrams.

### Group 3: In-Workflow Instructional Imagery

Routes:

- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- Party Orders invitation/export surfaces

Decision:

- Keep workflow headers photo-free.
- Retain images only inside task cards, current-action panels or exports.
- Do not add hero photos.

### Group 4: Intentionally Image-Free

Routes:

- calculators
- timers
- session headers
- account/auth/security
- legal/trust headers after cleanup
- Admin
- public token forms
- technical endpoints

Decision:

- No photo hero.
- Use icons, diagrams or status components only where they directly support the task.

## 25. Image Briefs For Recommended Assets

### Brief 1: Sauce Application Realistic Sequence

| Field | Brief |
| --- | --- |
| Route | `/sauce` |
| Placement | `Make and apply the sauce`, below or beside application steps |
| Image job | Teach spoon application, spiral spreading and clean crust border |
| Subject | Stretched dough with tomato sauce placed in centre, then thin spiral spread |
| Required visible elements | round dough, centre sauce, spiral motion marks, clean 1-2 cm border, thin centre |
| Forbidden elements | people, hands, arms, faces, logos, text baked into image |
| Format | realistic photography-style WebP, possibly 2-4 panel comparison |
| Lighting/background | warm natural kitchen light, neutral work surface |
| Desktop aspect ratio | 4:3 or 3:2 |
| Mobile crop | 4:3, subject centered |
| Suggested path | `/sauce/teaching/sauce-application-spiral.webp` |
| Alt draft | `Thin tomato sauce spread in a spiral on stretched pizza dough with a clean crust border.` |
| Loading | lazy, below first result/calculator |
| Separate mobile asset | no, if crop is centered |
| Existing reuse | current `/toppings/references/sauce-balanced.webp` can stay as comparison but does not show sequence |
| Performance risk | low |

### Brief 2: Sauce Texture Comparison

| Field | Brief |
| --- | --- |
| Route | `/sauce` |
| Placement | Buy tomatoes or make sauce section |
| Image job | Show lightly crushed/blended texture versus overly watery sauce |
| Subject | two small bowls of tomato sauce, one spoonable and one watery |
| Required visible elements | visible tomato texture, liquid pooling distinction |
| Forbidden elements | hands, people, logos, text |
| Format | realistic comparison photo |
| Desktop aspect ratio | 16:9 or two 1:1 panels |
| Mobile crop | stacked 1:1 panels |
| Suggested path | `/sauce/teaching/sauce-texture-comparison.webp` |
| Alt draft | `Comparison of lightly crushed pizza sauce and watery sauce with visible liquid pooling.` |
| Loading | lazy |
| Existing reuse | `/sauce/neapolitan.webp` covers sauce identity but not texture comparison |
| Performance risk | low |

### Brief 3: Pizza Styles Comparison Strip

| Field | Brief |
| --- | --- |
| Route | `/styles` |
| Placement | Near intro, below the first practical explanation |
| Image job | Identify visual differences between styles |
| Subject | existing Neapolitan, New York, Detroit, Roman, Sicilian style images in compact comparison |
| Required visible elements | distinct crust shape, slice/pan differences, crumb or top pattern where possible |
| Forbidden elements | new unrelated hero, people, logos |
| Format | reuse existing local WebP images |
| Desktop aspect ratio | five or seven cards, 4:3 thumbnails |
| Mobile crop | horizontal-free stacked or 2-column compact thumbnails |
| Suggested path | no new path required |
| Alt draft | each style image keeps style-specific alt, e.g. `Detroit-style pizza with thick rectangular crust.` |
| Loading | lazy unless placed above fold; only first row may be eager |
| Separate mobile asset | no |
| Existing reuse | `/pizza-styles/*.webp` |
| Performance risk | medium if too many eager images; keep lazy |

### Brief 4: Leftover Dough Storage

| Field | Brief |
| --- | --- |
| Route | `/guide/practical-pizza-tips/leftover-dough` |
| Placement | Storage and freezing section |
| Image job | Teach safe covered storage and thawed-ready state |
| Subject | dough ball in clean covered container, frozen dough wrapped, thawed dough relaxed |
| Required visible elements | covered container, label/date area without text, relaxed thawed dough |
| Forbidden elements | hands, people, logos, branded containers, text baked into image |
| Format | realistic photography-style WebP, two or three panels |
| Desktop aspect ratio | 3:2 |
| Mobile crop | 4:3 centered panels |
| Suggested path | `/guide/practical-pizza-tips/teaching/leftover-dough-storage.webp` |
| Alt draft | `Covered leftover dough and thawed relaxed dough ready to use after storage.` |
| Loading | lazy |
| Existing reuse | none |
| Performance risk | low |

### Brief 5: Fermentation Length Readiness

| Field | Brief |
| --- | --- |
| Route | `/guide/practical-pizza-tips/fermentation-length` |
| Placement | Duration comparison section |
| Image job | Show how fermentation time changes gas and dough readiness |
| Subject | dough balls at underdeveloped, ready and over-fermented states |
| Required visible elements | volume difference, gas bubbles/softness, spread/weak state |
| Forbidden elements | hands, people, logos, text labels baked into image |
| Format | realistic comparison photo |
| Desktop aspect ratio | 3 panels in a row, 16:9 group |
| Mobile crop | stacked or 1-column panels |
| Suggested path | `/guide/practical-pizza-tips/teaching/fermentation-readiness-comparison.webp` |
| Alt draft | `Dough balls comparing under-fermented, ready and over-fermented structure.` |
| Loading | lazy |
| Existing reuse | Dough readiness assets may be reused if article context fits |
| Performance risk | low |

### Brief 6: Container Fill And Lid Fit

| Field | Brief |
| --- | --- |
| Route | `/guide/practical-pizza-tips/containers-and-lids` |
| Placement | Container choice/use section |
| Image job | Teach headspace and covered storage |
| Subject | dough container with appropriate fill level and secure lid |
| Required visible elements | headspace, dough ball, lid fit, no dried surface |
| Forbidden elements | hands, people, logos, branded storage products |
| Format | realistic photography-style WebP |
| Desktop aspect ratio | 4:3 |
| Mobile crop | 4:3 centered |
| Suggested path | `/guide/practical-pizza-tips/teaching/container-fill-lid-fit.webp` |
| Alt draft | `Dough ball in a covered container with enough headspace for fermentation.` |
| Loading | lazy |
| Existing reuse | none |
| Performance risk | low |

### Brief 7: Ovens Rack And Heat Path Diagram

| Field | Brief |
| --- | --- |
| Route | `/ovens` |
| Placement | Setup paths, near steel/stone/tray positioning |
| Image job | Explain rack position and top/bottom heat relationship |
| Subject | simplified home oven cross-section with rack and baking surface |
| Required visible elements | rack levels, steel/stone/tray, top heat, bottom heat, pizza position |
| Forbidden elements | branded appliance, detailed product model, color-only meaning |
| Format | diagram/SVG or simple WebP diagram |
| Desktop aspect ratio | 16:9 |
| Mobile crop | 4:3 or full-width compact diagram |
| Suggested path | `/ovens/teaching/oven-rack-heat-path.svg` |
| Alt draft | `Diagram showing pizza surface position between bottom heat and top heat in a home oven.` |
| Loading | lazy |
| Existing reuse | current photos show setup but not heat path |
| Performance risk | low |

### Brief 8: Practical Tips Common Problems Reuse Grid

| Field | Brief |
| --- | --- |
| Route | `/guide/practical-pizza-tips/common-problems` |
| Placement | Problem cards |
| Image job | Make common problems identifiable |
| Subject | selected existing troubleshooting images for sticky dough, watery sauce, burnt base, wet toppings |
| Required visible elements | clear symptom, not generic finished pizza |
| Forbidden elements | new generic photos |
| Format | reuse existing WebP |
| Desktop aspect ratio | 4:3 thumbnails |
| Mobile crop | small thumbnails beside or above text |
| Suggested path | no new path required |
| Alt draft | use existing symptom-specific instructional alt text |
| Loading | lazy |
| Existing reuse | `/images/troubleshooting/*.webp` |
| Performance risk | low to medium depending count |

### Brief 9: Trust Page Header Demotion

| Field | Brief |
| --- | --- |
| Route | `/privacy`, `/terms` |
| Placement | Header cleanup |
| Image job | None required |
| Subject | remove/demote current hero photo, do not replace |
| Required visible elements | legal heading, summary, section links |
| Forbidden elements | decorative legal photography |
| Format | no new asset |
| Desktop aspect ratio | none |
| Mobile crop | none |
| Suggested path | no new path |
| Alt draft | no alt, no image |
| Loading | none |
| Existing reuse | current `/images/trust/*` may become unused after verification |
| Performance risk | improves |

### Brief 10: Updates Header Cleanup

| Field | Brief |
| --- | --- |
| Route | `/updates` |
| Placement | Page header |
| Image job | None required |
| Subject | remove Homepage hero reuse |
| Required visible elements | update title and current release context |
| Forbidden elements | reused generic Homepage food photo |
| Format | no new asset |
| Desktop aspect ratio | none |
| Mobile crop | none |
| Suggested path | no new path |
| Alt draft | none |
| Loading | none |
| Existing reuse | do not reuse Homepage hero here |
| Performance risk | improves |

### Brief 11: Troubleshooting Optional Defect Collage

| Field | Brief |
| --- | --- |
| Route | `/guide/pizza-troubleshooting` |
| Placement | Optional below finder, not hero |
| Image job | Show that diagnostics are visual without delaying search |
| Subject | small grid of existing defect images |
| Required visible elements | distinct symptoms: wet center, burnt base, sticky dough, watery mozzarella |
| Forbidden elements | generic appetising pizza, hands, people |
| Format | reuse existing WebP thumbnails |
| Desktop aspect ratio | 4-card grid |
| Mobile crop | optional compact thumbnails; omit if it delays finder |
| Suggested path | no new path required |
| Alt draft | each image uses symptom-specific alt |
| Loading | lazy |
| Existing reuse | `/images/troubleshooting/*.webp` |
| Performance risk | medium if too many thumbnails |

### Brief 12: Dough Asset Hygiene Verification

| Field | Brief |
| --- | --- |
| Route | `/guides/dough` and asset system |
| Placement | No new placement |
| Image job | Cleanup only |
| Subject | verify legacy numbered WebP and SVG assets are unused |
| Required visible elements | none |
| Forbidden elements | deleting without source/docs/test/external reference check |
| Format | no new asset |
| Desktop aspect ratio | none |
| Mobile crop | none |
| Suggested path | no new path |
| Alt draft | none |
| Loading | none |
| Existing reuse | keep referenced `guide-step-*` and `teaching-step-*` |
| Performance risk | none |

## 26. Follow-Up Roadmap

### Patch 468B: Marketing And Learning-Entry Introduction Cleanup

Scope:

- Homepage verification only if a concrete crop or LCP issue is found.
- `/guide` header/first-action hierarchy only if owner review wants more visual orientation.
- `/privacy`, `/terms`, `/updates` header cleanup.
- No tool, workflow, API, calculation, Account or Guide content changes.

Acceptance:

- Homepage hero retained.
- Guide hub remains compact and learning-led.
- Privacy/Terms/Updates no longer spend mobile first-viewport space on low-job-value imagery.
- No new images required unless a Guide hub visual is separately approved.

### Patch 468C: Targeted Instructional Imagery Implementation

Scope:

- `/sauce` application/texture image.
- `/styles` existing style image comparison.
- Practical Tips article images.
- Optional Ovens rack/heat-path diagram.
- Optional Troubleshooting thumbnail reuse.

Acceptance:

- Every new or reused image teaches a specific decision.
- No people, hands, arms, silhouettes, third-party logos or baked-in text unless explicitly approved.
- Mobile remains compact and action-first.
- No calculator/workflow logic changes.

### Patch 468D: Imagery Performance And Consistency Verification

Scope:

- responsive crop verification
- alt-text verification
- dimensions/sizes/loading review
- asset duplication review
- confirmed unused asset cleanup only if safe
- production visual verification after 468B/468C if deployed

Acceptance:

- No broken images.
- No horizontal overflow.
- No unnecessary duplicate image downloads.
- Above-fold images have justified priority.
- Teaching images have instructional alt text.

## 27. Validation Performed

- Confirmed current branch and starting commit before audit.
- Confirmed `master` matched `origin/master` before audit work.
- Confirmed tracked worktree was clean before audit work.
- Inspected route tree from `app/**`.
- Inspected `lib/seo-config.ts` sitemap/public route configuration.
- Inspected current Homepage registry and live Homepage implementation.
- Inspected shared Guide, Sauce, Toppings, Ovens, Trust, Quick Calculator and session image/header usage.
- Inventoried 187 image/icon assets under `public/`.
- Browser-reviewed representative current public visual routes at 390x844, 430x740, 1280x900 and 1440x900.
- Browser-reviewed representative guidance-sensitive routes under Beginner, Enthusiast and Pizza Nerd local-storage states.
- Source-reviewed authenticated/private/dynamic routes where safe visual state was unavailable.
- Verified every user-facing route has an explicit decision in the route matrix.
- Verified every recommended new or replacement visual has an implementation brief.
- Generated 46 concrete ideas.

## 28. Scope Protection

Production code, page copy, CSS, images, assets, routes, calculations, sessions, Account, Guides, Homepage, navigation, footer, APIs, database and migrations were not changed by this audit.

`supabase/.temp/` was not touched.
