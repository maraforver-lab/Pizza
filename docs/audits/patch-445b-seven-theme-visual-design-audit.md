# Patch 445B: Seven-Theme Visual Design Audit

## 1. Executive Summary

Patch 445A successfully created the technical foundation for seven public appearance themes: `default`, `valentine`, `easter`, `summer`, `harvest`, `halloween`, and `christmas`. Patch 445B defines the final visual direction for those themes before any per-theme implementation work begins.

The main finding: the foundation architecture is ready for per-theme implementation. The current 445A palettes are deliberately restrained and technically safe, but every seasonal theme still needs final palette tuning, motif rules, density limits, contrast checks, and page-category guidance before it should be considered visually complete.

The theme system must preserve DoughTools as a practical pizza planning and cooking workspace. Seasonal design may alter atmosphere, but it must not alter product logic, hierarchy, navigation, calculations, Pizza Session data, Timeline behavior, Kitchen progression, Bake Timer controls, Account behavior, admin permissions, form behavior, or semantic state meanings.

## 2. Patch 445A Architecture Reviewed

Reviewed source:

- `lib/public-themes.ts`
- `app/globals.css`
- `app/layout.tsx`
- `lib/public-theme-campaigns.ts`
- `lib/admin-theme-api.ts`
- `/admin/appearance`
- `/api/admin/themes`
- `supabase/migrations/20260721120000_create_public_theme_campaigns.sql`
- `docs/audits/patch-445a-seven-theme-architecture.md`

Confirmed 445A state:

- exactly seven canonical IDs exist
- unknown IDs normalize to Default
- root marker is server-rendered through `data-public-theme`
- metadata theme color is tied to the active registry definition
- database stores campaign IDs and timing only
- no arbitrary CSS, HTML, JavaScript, image URL, audio URL, or JSON payload is stored
- admin APIs are protected through the Patch 444B authoritative admin guard
- preview is local to Admin UI
- 445A migration exists locally as `20260721120000`, and migration history shows it has not been applied remotely

## 3. Canonical DoughTools Visual Identity

DoughTools is recognizable because it combines:

- warm cream page atmosphere
- soft white or warm-white cards
- rounded but practical card geometry
- Inter for operational UI
- Newsreader for editorial and high-emphasis headings
- tomato primary action color
- forest continuation and brand tones
- warm dark text
- muted supporting text
- clear focus rings
- line icons from the semantic DoughTools icon system
- practical food imagery, especially real pizza and dough imagery
- mobile-focused task clarity
- desktop guided workspace structure

Seasonal themes must feel like DoughTools wearing a seasonal jacket, not like a different product.

## 4. Immutable, Themeable, Context-Restricted Matrix

| Property | Classification | Rule |
| --- | --- | --- |
| Typography families | Immutable | Inter and Newsreader remain unchanged. |
| Component geometry | Immutable | Radius, control shape, cards, action bars and modal structure remain stable. |
| Information hierarchy | Immutable | Page order, primary action rhythm and route jobs do not change. |
| Touch target size | Immutable | Seasonal themes cannot shrink controls. |
| Focus rings | Immutable | Focus must remain visible and consistent. |
| Semantic error/success/warning colors | Immutable | Do not remap semantic state colors to seasonal accents. |
| Bake Timer urgency states | Immutable | Final ten, overtime and alarm states override seasonal decoration. |
| Page background tint | Themeable | May vary by theme when contrast remains safe. |
| Card surface tint | Themeable | May vary subtly; dense workflow cards stay light. |
| Neutral border tint | Themeable | May vary; do not reduce card separation. |
| Non-semantic accent | Themeable | May vary for decoration and non-critical emphasis. |
| Header surface | Themeable | May vary softly while keeping nav readable. |
| Metadata theme color | Themeable | May vary per active theme. |
| Motifs | Context-restricted | Allowed more on marketing/learning pages, restrained on product workflows. |
| Decorative backgrounds | Context-restricted | Moderate on homepage/guides, minimal in Kitchen, Bake Timer, Account and legal pages. |
| Seasonal illustrations | Context-restricted | Possible later on marketing pages only; not inside active workflows. |

## 5. Final Token Contract

Patch 445A defines a minimal foundation. Later implementation patches should extend toward this final token contract without changing the campaign architecture.

| Token | Purpose | Allowed usage | Prohibited usage | Fallback | Dense pages |
| --- | --- | --- | --- | --- | --- |
| `--theme-page-background` | Main page background | Body, page shells, large neutral areas | Text or control state | Default warm background | Yes, but restrained |
| `--theme-page-background-secondary` | Secondary page wash | Marketing sections, guide bands | Critical controls | Flour | Optional |
| `--theme-surface` | Primary card surface | Cards, panels, modals | Semantic alerts | White | Must stay high contrast |
| `--theme-surface-muted` | Muted card fill | Secondary cards, inactive panels | Primary controls | Flour | Use sparingly |
| `--theme-surface-elevated` | Raised overlays | Mobile menu, dialogs | Dense row backgrounds | White | Keep near white |
| `--theme-border` | Default neutral border | Cards, inputs, list separators | Error borders | Flour | Must remain visible |
| `--theme-border-strong` | Strong neutral border | Active cards, section framing | Destructive emphasis | Muted warm gray | Optional |
| `--theme-text` | Optional themed text base | Only if contrast validated | Replacing semantic text broadly | Ink | Usually unchanged |
| `--theme-text-muted` | Optional muted text | Supporting text after contrast validation | Disabled or error text | Muted | Usually unchanged |
| `--theme-accent` | Non-semantic seasonal accent | Eyebrows, decorative chips, theme previews | Error, warning, destructive, Bake Timer urgency | Tomato | Limited |
| `--theme-accent-hover` | Hover accent | Non-semantic hover | Semantic hover | Forest or theme accent | Limited |
| `--theme-accent-soft` | Soft accent background | Callouts, preview swatches | Status cards | Transparent seasonal tint | Limited |
| `--theme-accent-secondary` | Secondary atmosphere | Background radial, motif | Primary action meaning | Forest | Limited |
| `--theme-header-surface` | Header/menu surface | Global nav, mobile menu | Translucent unreadable overlays | Warm background | Must be opaque on mobile |
| `--theme-header-border` | Header separator | Nav border, menu divider | Warning/error border | Flour | Yes |
| `--theme-decorative` | Primary motif tint | CSS-only decoration | Behind inputs, timers, instructions | Tomato tint | Rare |
| `--theme-decorative-secondary` | Secondary motif tint | Large desktop empty margins | Mobile dense screens | Forest tint | Rare |
| `--theme-focus` | Optional focus theme | Only if AA and visually strong | Weak seasonal focus | Tomato | Prefer unchanged |

Recommendation: 445C-445H may add these variables in CSS. Avoid theme overrides for semantic status colors unless a specific contrast defect requires a local correction.

## 6. Contrast And Accessibility Requirements

Measurable requirements:

- normal text meets WCAG AA, 4.5:1 minimum
- large text meets WCAG AA, 3:1 minimum
- controls remain distinguishable from surfaces
- focus indicators remain visible against every theme background
- disabled controls remain identifiable without relying only on opacity
- links remain recognizable through text style and focus/hover, not color alone
- status states include text or icon signals, not only color
- decorative motifs are CSS-only or marked decorative
- reduced-motion removes non-essential seasonal movement
- no flashing, strobing or rapidly alternating backgrounds
- Kitchen and Bake Timer countdowns stay unobstructed

Contrast risk table:

| Theme | Likely contrast risk | Affected surfaces | Required correction |
| --- | --- | --- | --- |
| Default | Low | Current production surfaces | Preserve current contrast; do not redesign. |
| Valentine | Medium | Rose muted surfaces and red text if overused | Keep text Ink; use rose only as surface tint and non-semantic accent. |
| Easter | Medium-high | Yellow surfaces, pale green borders | Darken green accent and keep cards near white on dense pages. |
| Summer | Medium-high | Pale blue and sun-yellow combinations | Avoid blue text on pale blue; use teal only for accent and keep text Ink. |
| Harvest | Medium | Brown/orange if used as large background | Keep craft warmth in border/motif; avoid brown cards for workflows. |
| Halloween | High | Dark page background near dark text or tomato urgency | Use dark only in marketing margins/header accents; workflow cards stay light. |
| Christmas | Medium | Red/green competition and red urgency confusion | Keep semantic red reserved; use deep red decor sparingly. |

## 7. Default Specification

Default is the canonical year-round DoughTools identity.

Final palette:

- page background: `#FFF8F1`
- surface: `#FFFFFF`
- surface muted: `#F1E6D8`
- primary action: `#E94B2E`
- brand/secondary: `#0F3D2E`
- text: `#1F1F1F`
- muted text: `#6B645D`
- metadata theme color: `#FFF8F1`

Rules:

- preserve current production background, card, button and typography language
- do not add seasonal motifs
- keep tomato primary actions
- keep forest brand and continuation behavior
- use current focus-ring treatment
- keep existing homepage image treatment
- Default is fallback for no campaign, future campaign, expired campaign, disabled campaign, invalid data, database failure, and explicit Default activation

## 8. Valentine Specification

Mood: warm, human, inviting, restrained, shared-pizza atmosphere.

Final direction:

- page background: warm cream with a faint rose wash, candidate `#FFF3F1`
- surface: near white, candidate `#FFFBFA`
- muted surface: pale rose flour, candidate `#F7E1DD`
- border: muted rose clay, candidate `#EBC8C1`
- accent: tomato-red softened toward rose, candidate `#D94238`
- secondary accent: warm burgundy-brown, candidate `#7A2D2C`
- metadata theme color: `#FFF3F1`

Motif:

- primary: abstract paired circles or shared-slice rhythm
- secondary: a subtle curved heart-like line, never literal repeated hearts

Page behavior:

- marketing pages may use faint paired-circle backgrounds
- Session and Kitchen pages use only surface and border tint
- mobile sticky actions remain tomato/forest hierarchy
- no romantic copy changes

Prohibited:

- greeting-card aesthetic
- dominant heart symbols
- excessive pink
- relationship-status assumptions
- red surfaces behind error text

## 9. Easter Specification

Mood: fresh spring, light, optimistic, clean, culturally broad.

Final direction:

- page background: warm light yellow, candidate `#FFF9DE`
- surface: clean warm white, candidate `#FFFDF5`
- muted surface: pale green flour, candidate `#EEF5DC`
- border: green-beige, candidate `#D8E4B8`
- accent: fresh but dark enough green, candidate `#5F8F3A`
- secondary accent: soft yolk-gold, candidate `#E0B84A`
- metadata theme color: `#FFF9DE`

Motif:

- primary: soft oval forms
- secondary: small leaf or flour-grain dots

Page behavior:

- guide and homepage pages may use light oval/leaf motifs
- product workflows keep controls white and text dark
- validation and error states remain unchanged

Prohibited:

- religious symbolism
- cartoon egg overload
- pale green text for body copy
- low-contrast yellow buttons

## 10. Summer Specification

Mood: sunlight, terrace, Mediterranean warmth, fresh and open.

Final direction:

- page background: sun-warm cream, candidate `#FFF4D8`
- surface: warm white, candidate `#FFF9EC`
- muted surface: very pale sky, candidate `#E7F4F6`
- border: soft blue-gray, candidate `#C9E2E7`
- accent: sun gold-orange, candidate `#D88A24`
- secondary accent: Mediterranean teal, candidate `#126D7A`
- metadata theme color: `#FFF4D8`

Motif:

- primary: subtle sun arc
- secondary: restrained tile rhythm

Page behavior:

- desktop margins may use soft arcs
- mobile must preserve outdoor legibility with strong text contrast
- no pale-blue text on pale-blue surfaces
- guide/homepage image frames may receive a warm sun edge

Prohibited:

- beach cliches
- large non-pizza scenic backgrounds
- washed-out controls
- motifs behind checklists or timers

## 11. Harvest Specification

Mood: ingredients, autumn, grain, warmth, craft.

Final direction:

- page background: warm grain, candidate `#FFF0DC`
- surface: flour white, candidate `#FFF9F1`
- muted surface: pale wheat, candidate `#F0DFC2`
- border: toasted flour, candidate `#DEC290`
- accent: roasted orange, candidate `#B96324`
- secondary accent: olive, candidate `#65723A`
- metadata theme color: `#FFF0DC`

Motif:

- primary: wheat or grain lines
- secondary: light flour texture

Page behavior:

- use craft warmth in borders and neutral surfaces
- keep Halloween visually distinct by avoiding purple/charcoal
- Shopping may use grain separators sparingly
- Kitchen remains mostly Default-like

Prohibited:

- pumpkin faces
- spooky motifs
- black-purple combinations
- heavy brown card fills

## 12. Halloween Specification

Mood: playful seasonal night, warm oven/fire association, restrained theatrical atmosphere.

Final direction:

- page background: warm charcoal only in marketing frame areas, candidate `#241A16`
- workflow page background: warm cream with charcoal accents, candidate `#FFF4E8`
- surface: warm off-white, candidate `#FFF8EF`
- muted surface: dark accent surface only for marketing panels, candidate `#35251F`
- border: ember brown, candidate `#70442F`
- accent: pumpkin orange, candidate `#E96F24`
- secondary accent: restrained purple, candidate `#5B3A6B`
- metadata theme color: `#241A16` for browser chrome only if header contrast is safe; otherwise `#FFF4E8`

Motif:

- primary: small flame or pumpkin curve
- secondary: night arc or warm oven glow

Page behavior:

- homepage may use charcoal margins and ember accents
- Kitchen, Timeline, Shopping and Bake Timer stay light-surface first
- overtime red/flame remains semantic and must not look decorative
- normal Bake Timer must not appear urgent

Prohibited:

- gore
- frightening imagery
- jump scares
- flashing/strobing
- hard-to-read black workflow screens
- purple warning/error states

## 13. Christmas Specification

Mood: warm, festive, generous, winter evening, restrained.

Final direction:

- page background: warm cream, candidate `#F8F1E6`
- surface: candle-warm white, candidate `#FFF9F0`
- muted surface: soft winter flour, candidate `#E9DDCA`
- border: warm beige, candidate `#D8C4A5`
- accent: deep festive red, candidate `#8F2626`
- secondary accent: forest green, candidate `#0F3D2E`
- decorative accent: oven-gold, candidate `#E8C98A`
- metadata theme color: `#F8F1E6`

Motif:

- primary: warm-light dots
- secondary: subtle branch or ribbon line

Page behavior:

- homepage and About may use warm-light accents
- execution screens use minimal border/surface tint
- red decoration must not compete with error/overtime red
- green remains brand-like and calm

Prohibited:

- blinking lights
- snow covering controls
- religious symbols or copy in first version
- large festive banners on Kitchen/Bake Timer

## 14. Page-Category Intensity Matrix

| Page category | Theme intensity | Decorations allowed | Notes |
| --- | --- | --- | --- |
| Homepage | Moderate | Background motifs, image frame tint, section accents | Keep pizza imagery primary. |
| Guides | Moderate | Callout motifs, heading accents, subtle article backgrounds | Do not crowd educational diagrams. |
| About | Moderate | Founder image frame tint, warm seasonal callouts | Reserve user-count area for Patch 447. |
| Authentication | Low | Header and card tint only | Security actions stay serious. |
| Session Start | Low | Surface and border tint | Controls and choices stay dominant. |
| Recipe | Low | Surface and border tint | Ingredient data remains scan-first. |
| Shopping | Low | Dividers and card tint | Checklist semantics stay primary. |
| Timeline | Low | Neutral timeline surfaces, light accents | Readiness/overdue states unchanged. |
| Kitchen | Minimal | Background tint only | No motifs behind task data. |
| Bake Timer | Minimal | Optional ready-state accent only | Urgency system overrides theme. |
| Review | Low | Surface tint and celebratory restraint | Do not obscure photo/review content. |
| Account | Low | Trustworthy card tint | Private session data remains calm. |
| Party Orders | Low | Surface tint only | Guest/order information stays clear. |
| Admin | Low/preview only | Theme cards may show swatches/motifs | Operational controls stay neutral. |
| Privacy/Terms | Minimal | Page background only | Long legal text must be plain and readable. |

## 15. Mobile Rules

Target viewports: 390 x 844 and 430 x 740.

All themes:

- keep mobile task-first
- use opaque mobile menu surface
- preserve safe-area padding
- avoid horizontal overflow
- keep sticky actions readable and tappable
- keep card density at or below current Default density
- avoid large motifs above active task controls
- keep background decoration behind the page, not inside controls
- reduced motion removes non-essential movement

Per-theme mobile notes:

- Valentine: only faint rose surface tint; no repeated hearts.
- Easter: ensure yellow background does not wash out white cards.
- Summer: high-brightness outdoor readability is required; use strong dark text.
- Harvest: avoid heavy brown mobile cards.
- Halloween: dark atmosphere must not become a dark mobile app; workflows stay light.
- Christmas: decorative red/green must not compete with CTAs or status states.

## 16. Desktop Rules

Target viewports: 1280 x 900 and larger.

All themes:

- use empty margin space for atmosphere before changing content panels
- keep max-widths and page sections stable
- avoid oversized seasonal hero treatment on product pages
- allow stronger decoration only on marketing/learning pages
- dense workspaces stay card-first and predictable
- header remains readable over any seasonal background

Desktop can carry more motif than mobile, but only outside the main task column.

## 17. Navigation

Desktop navigation:

- header surface may use `--theme-header-surface`
- active item must remain obvious through contrast and structure
- hover/focus use current focus ring behavior
- icons remain semantic line icons
- no new seasonal navigation items

Mobile navigation:

- remains full-screen and opaque
- Account and Your Pizza actions remain visible without scrolling
- Tools section remains clear, including Bake timer and Quick dough calculator
- Learn disclosure stays compact
- seasonal motifs are not allowed inside the menu body except perhaps a faint top/bottom background wash

## 18. Homepage

Theme behavior:

- headline contrast must remain strong
- primary CTA remains the obvious next action
- pizza imagery stays accurate and desirable
- seasonal motif can appear in section backgrounds, not as unrelated hero replacement
- image frames may be tinted subtly
- maximum decoration intensity: moderate

Per-theme homepage motifs:

- Valentine: paired-circle shared-table rhythm
- Easter: spring oval/leaf accents
- Summer: sun arc or tile rhythm in margins
- Harvest: grain lines near section separators
- Halloween: ember glow in dark frame areas only
- Christmas: warm-light dots or restrained ribbon lines

Do not rewrite homepage copy in visual patches.

## 19. Session Start And Recipe

Rules:

- option cards stay easy to scan
- selected states remain structural, not only color
- validation errors use semantic error treatment
- recommendation cards remain readable
- sticky mobile actions remain dominant
- Pizza Nerd controls stay legible
- seasonal accents stay subordinate to choices and calculations

Implementation target:

- theme backgrounds and borders may vary
- primary action color should usually remain tomato unless contrast correction requires local treatment
- form inputs remain near white

## 20. Shopping

Shopping is checklist-first on mobile.

Rules:

- checklist rows use high-contrast surfaces
- completed state remains semantic and text/icon-supported
- category dividers remain readable
- flour specification card is not hidden behind decoration
- export controls remain neutral
- pizza imagery should not be recolored in ways that make toppings inaccurate

Do not theme completion colors in a way that conflicts with semantics.

## 21. Timeline

Rules:

- current-step emphasis remains stronger than seasonal accent
- future steps remain quiet
- completed state remains semantic and text/icon-supported
- time labels retain contrast
- readiness and overdue cards retain semantic colors
- timeline connectors may use neutral theme border only

Theme accents must not obscure scheduled time, readiness, overdue state, or current action.

## 22. Kitchen

Kitchen is an execution workspace.

Rules:

- minimal seasonal intensity
- main task card stays light and calm
- countdowns and planned times are never placed over motifs
- completion controls retain current hierarchy
- wait/readiness indicators retain semantic meaning
- More guidance disclosure remains secondary
- background decoration is allowed only outside the main task surface

Decorative exclusions:

- no motifs behind countdown numbers
- no motifs behind task instructions
- no motifs behind completion buttons
- no seasonal icons replacing step icons
- no dark Halloween Kitchen screen

## 23. Bake Timer

The Bake Timer urgency system is authoritative.

Rules:

- normal timer may use only a mild seasonal surface or header accent
- final 20 seconds, final 10 seconds, final 3-2-1, overtime, flame, Stop alarm, and sound toggle preserve their current semantic contrast
- overtime red and flame must never be confused with Halloween decoration
- Christmas red must not look like a perpetual urgency state
- decorative elements disappear or become static when the full-screen timer is active
- reduced-motion behavior remains intact

Theme-specific timer constraints:

- Halloween: normal timer ring cannot use urgency red as a decorative baseline.
- Christmas: deep red is not used for normal timer digits.
- Summer/Easter: pale backgrounds cannot reduce timer number contrast.

## 24. Account And Admin

Account:

- calm and trustworthy
- preference cards remain neutral
- destructive actions stay semantically distinct
- private session information remains clear
- admin entry remains visibly separate but not alarmist

Admin:

- operational surfaces remain neutral
- theme preview cards may show swatches and small motifs
- activation state, schedule fields, conflicts, errors and confirmation dialogs remain visually neutral
- admin UI must not feel like public marketing

## 25. Authentication

Applies to sign-in, forgot password, update password and email-change flows.

Rules:

- security copy remains serious and legible
- error/success surfaces retain semantic styling
- form labels and inputs stay plain
- seasonal treatment limited to page background, card border and possibly small header tint
- no playful motifs inside password or email-change forms

## 26. Guides And About

These pages may use moderate seasonal expression.

Guides:

- article background may tint softly
- heading accents may use theme accent
- callout cards may use theme soft surfaces
- table of contents remains readable
- instructional images are not recolored

About:

- founder image frame may receive a subtle seasonal border
- public user-count area is reserved for Patch 447; do not implement or assume it
- About remains personal and grounded, not a seasonal landing page

## 27. Privacy And Terms

Use minimal seasonal styling.

Rules:

- neutral readable background
- stable text color
- clear link treatment
- plain headings
- no distracting motif inside long legal text
- no seasonal copy changes

## 28. Motif System

| Theme | Primary motif | Secondary motif | Allowed placement | Maximum density | Asset approach |
| --- | --- | --- | --- | --- | --- |
| Default | None | Pizza pattern where already used | Existing guide pages only | Current | Existing assets |
| Valentine | Paired circles/shared slice rhythm | Subtle curved line | Homepage, guide callouts, admin preview | Sparse | CSS-first |
| Easter | Soft ovals | Leaf/flour-dot pattern | Homepage margins, guide callouts | Sparse-medium | CSS-first |
| Summer | Sun arc | Tile rhythm | Desktop margins, homepage bands | Medium on marketing only | CSS-first |
| Harvest | Wheat/grain lines | Flour texture | Section separators, guide callouts | Sparse | CSS-first; possible small SVG later |
| Halloween | Flame/pumpkin curve | Night/oven glow | Marketing frame, admin preview | Sparse | CSS-first; no spooky imagery |
| Christmas | Warm-light dots | Branch/ribbon line | Homepage/About margins, admin preview | Sparse | CSS-first; possible small SVG later |

All motifs:

- pointer-events none
- decorative only
- no accessibility tree content
- reduced-motion safe
- absent from active timers and dense controls

## 29. Icon Policy

Themes may:

- tint decorative icons when they are not functional
- add small decorative seasonal icons only in marketing/admin preview contexts
- tint empty-state icons softly if meaning remains clear

Themes must not:

- replace functional icons with seasonal symbols
- alter warning, delete, close, account, timer, back, forward or success icons into ambiguous forms
- use emoji as primary functional icons
- mix icon families

Examples:

- close remains close
- timer remains timer
- account remains account
- warning remains warning
- delete remains delete

## 30. Motion Policy

Common rule:

- no auto-playing large motion
- no flashing
- no strobing
- no movement behind active forms
- no continuous snow, hearts, leaves or particles on dense pages
- reduced-motion removes all non-essential animation

If future motion is added:

- purpose must be orientation or delight on non-dense pages
- duration should be under 600 ms
- repetition should be one-shot or user-triggered
- allowed pages: homepage, guides, admin preview only
- reduced-motion fallback: static motif

Bake Timer motion is governed by timer urgency rules, not seasonal theme rules.

## 31. Imagery Policy

Current assets:

- real homepage pizza/dough WebP imagery
- dough guide WebP and SVG instructional visuals
- shopping pizza images
- timeline step images
- troubleshooting WebP library
- trust page hero images
- flour product PNGs
- logo SVG and pizza pattern SVG

Rules:

- seasonal themes may tint image frames, not food pixels
- image overlays are allowed only as transparent frame/background treatment, not over the food itself
- do not alter pizza photos in a way that changes food color accuracy
- new seasonal assets are not required for 445C-445H unless a theme cannot be expressed with CSS motifs
- future assets must be local, licensed/provenance-documented, optimized WebP/SVG, responsive, and small enough not to harm page load
- no AI-generated people, hands or silhouettes without explicit approval

## 32. Metadata Theme Colors

| Theme | Theme color | Rationale | Contrast/browser risk |
| --- | --- | --- | --- |
| Default | `#FFF8F1` | Current warm browser chrome and fallback. | Low. |
| Valentine | `#FFF3F1` | Warm rose cream without strong pink chrome. | Low. |
| Easter | `#FFF9DE` | Light spring warmth. | Low, but ensure white surfaces remain distinct. |
| Summer | `#FFF4D8` | Sun-warm cream for browser chrome. | Low. |
| Harvest | `#FFF0DC` | Grain warmth without heavy brown chrome. | Low-medium. |
| Halloween | `#241A16` or `#FFF4E8` | Dark chrome can signal Halloween; use light fallback if header contrast suffers. | Medium-high on mobile; validate installed mode. |
| Christmas | `#F8F1E6` | Warm festive neutral rather than red/green browser chrome. | Low. |

Theme color must not affect application logic.

## 33. Patch 445A Foundation-Gap Analysis

| Theme | Current foundation | Final target | Main gap | Proposed implementation patch |
| --- | --- | --- | --- | --- |
| Default | Acceptable foundation | Preserve current production identity | No structural gap | 445I only if consistency issue appears |
| Valentine | Warm rose foundation | Warmer cream, paired-circle motif, less pink risk | Needs motif and palette refinement | 445C |
| Easter | Pale yellow/green foundation | More contrast-safe green and cleaner surfaces | Needs accent darkening and motif definition | 445D |
| Summer | Sun/sky foundation | Stronger teal and outdoor legibility | Needs contrast correction and sun/tile motif | 445E |
| Harvest | Warm orange/olive foundation | Grain warmth distinct from Halloween | Needs wheat/flour motif and brown restraint | 445F |
| Halloween | Dark foundation | Light workflow surfaces plus restrained dark marketing frame | Needs token correction for dense pages and urgency separation | 445G |
| Christmas | Warm red/green foundation | Festive neutral with red used sparingly | Needs red semantic separation and motif | 445H |

No architecture correction is required before per-theme visual patches.

## 34. Patch 445C-445I Scopes

### Patch 445C - Valentine

May modify:

- Valentine registry metadata where needed
- Valentine theme CSS variables
- Valentine CSS-only decoration
- Valentine visual tests and documentation

Must not alter campaign architecture, APIs, database, scheduling, admin authorization, or public resolver.

### Patch 445D - Easter

Same boundary for Easter. Primary work: contrast-safe spring palette and non-religious oval/leaf motif.

### Patch 445E - Summer

Same boundary for Summer. Primary work: outdoor-readable palette, sun/tile motif and high-brightness mobile checks.

### Patch 445F - Harvest

Same boundary for Harvest. Primary work: grain/flour motif and clear separation from Halloween.

### Patch 445G - Halloween

Same boundary for Halloween. Primary work: light workflow policy, dark marketing frame, urgency-state separation and no unsafe motion.

### Patch 445H - Christmas

Same boundary for Christmas. Primary work: restrained festive warmth, red semantic separation and warm-light/branch motif.

### Patch 445I - Cross-theme consistency audit and correction

Covers:

- contrast
- token consistency
- responsive behavior
- metadata
- dense workflow clarity
- reduced motion
- all-theme screenshots
- regression cleanup

Default changes should be limited to preserving canonical identity.

## 35. Recommended Implementation Order

Recommended order:

1. Patch 445G - Halloween
2. Patch 445H - Christmas
3. Patch 445F - Harvest
4. Patch 445C - Valentine
5. Patch 445D - Easter
6. Patch 445E - Summer
7. Patch 445I - Cross-theme consistency audit and correction

Reasoning: the current date is July 21, 2026. Halloween, Christmas and Harvest are the nearest seasonal business opportunities. Halloween also has the highest risk because it touches dark surfaces and timer urgency semantics, so it should be solved before lower-risk light themes. Valentine, Easter and Summer can follow once the high-risk seasonal boundaries are proven.

## 36. Visual Validation Matrix

Mandatory screenshots for every final theme:

| Viewport | Pages/states |
| --- | --- |
| 390 x 844 | homepage, mobile menu collapsed/expanded, Session Start, Recipe, Shopping, Timeline, Kitchen, Bake Timer normal/final-ten/overtime, Account, Admin appearance |
| 430 x 740 | same core mobile pages, with sticky actions and menu scroll |
| 1280 x 900 | homepage, guide, About, Session Start, Shopping, Timeline, Kitchen, Bake Timer, Account, Admin appearance |

Mandatory states:

- default/resting state
- hover/focus where desktop applicable
- validation error
- success/ready
- disabled
- loading
- reduced motion

Automated assertions may cover:

- root marker
- metadata theme color
- no horizontal overflow
- text presence
- admin preview isolation
- semantic classes unchanged
- reduced-motion CSS present

Manual/visual review remains required for:

- food image accuracy
- seasonal motif density
- perceived contrast
- mobile kitchen usability
- Halloween and Christmas urgency-color separation

## 37. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Seasonal visuals overpower workflow | Use page-category intensity matrix; keep Kitchen/Bake Timer minimal. |
| Halloween dark mode reduces readability | Use light workflow surfaces; dark only in marketing frames. |
| Red Christmas/Valentine accents conflict with errors/overtime | Keep semantic red unchanged and decorative red sparse. |
| Easter/Summer pale palettes reduce contrast | Darken accents and keep text Ink. |
| Motifs cause mobile clutter | Motifs absent from dense mobile task cards. |
| Food images look inaccurate | Tint frames only, not image pixels. |
| Admin preview mistaken for public activation | Keep explicit Preview mode banner and Exit preview. |
| Theme implementation accidentally changes architecture | Per-theme patches may touch only registry metadata, CSS variables, decoration and visual tests. |

## 38. Known Limitations

- Patch 445B does not include screenshots.
- Patch 445B does not run visual contrast tooling against rendered pages.
- Patch 445B does not implement final CSS.
- Patch 445B does not add seasonal assets.
- Patch 445B does not apply the 445A migration.
- Patch 445B does not decide Patch 447 user-count presentation beyond reserving About space.
- The current 445A foundation does not yet include every final token listed in this audit.

## 39. Final Recommendation

Proceed to per-theme implementation patches without changing the Patch 445A campaign architecture. Start with Halloween because it is both seasonally near and visually highest-risk, then Christmas, Harvest, Valentine, Easter, Summer and the cross-theme consistency audit.

Foundation architecture is ready for per-theme implementation
