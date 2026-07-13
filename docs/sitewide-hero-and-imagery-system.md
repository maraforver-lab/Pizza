# DoughTools sitewide hero and imagery system

Version: 1.0  
Purpose: authoritative page-level hero and imagery selection guidance for DoughTools.

Use this document with:

- [Experience principles](./experience-principles.md)
- [Design system](./design-system.md)
- [Visual style guide](./visual-style-guide.md)
- [Global responsive UX rules](./global-responsive-ux-rules.md)
- [Patch 347 route audit](./audits/patch-347-sitewide-hero-audit.md)

This document decides what kind of page introduction a route should use. It does not define product logic, calculations, routing, storage, authentication, SEO policy or feature behavior.

## North Star

Every page introduction should answer the user’s real first question.

- Marketing pages: why should I want this?
- Learning pages: what am I about to understand?
- Visual labs: what variable am I exploring?
- Workspaces: what should I do now?
- Utility pages: what information can I trust here?

Text readability always wins over visual drama. A page with no useful image should intentionally use no image.

## Official hero/header types

### Type A — Marketing Hero

Use when the page must create desire, trust or emotional interest.

Primary routes:

- `/`
- `/about`

Characteristics:

- outcome-led headline
- strongest approved photography
- one primary CTA
- quiet secondary CTA when useful
- food/result before interface
- text and image separated or safely composed
- no generic SaaS screenshot dominance

Image rule:

The visitor should want the pizza before evaluating the software. The authentic founder photo may be used only on About or founder-story contexts and must not be synthetically replaced.

### Type B — Editorial Learning Hero

Use when the page teaches a topic.

Examples:

- `/guide`
- `/guides/dough`
- `/guide/pizza-troubleshooting`
- `/sauce`
- `/ovens`
- `/styles`
- `/history`
- `/gear`

Characteristics:

- breadcrumb or clear learning context
- concise promise
- topic-specific visual when useful
- maximum two actions
- content begins soon
- image identifies the topic instead of decorating the page

Image rule:

A sauce page needs tomato/sauce imagery. An oven page needs heat or bake-profile context. A troubleshooting page needs visible defect or diagnostic imagery. A generic pizza photo is not enough.

### Type C — Visual Lab Hero

Use when the user learns by comparing, manipulating or experimenting.

Examples:

- `/toppings`
- `/costs`
- `/doctor`
- `/timer` when used as an active timing utility

Characteristics:

- compact explanation
- controls and result near the fold
- visual comparison or simulation before long copy
- no large decorative photo before the tool
- desktop may use a visual stage
- mobile stacks inputs then result

Image rule:

A diagram, receipt motif, comparison card or CSS/SVG visual can be better than photography.

### Type D — Compact Workspace Header

Use when the user arrives to perform a task.

Examples:

- advanced calculator workspace on `/`
- `/calculator/quick`
- `/start`
- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account`
- `/account/party-orders`
- public Party Order forms
- `/plan`

Characteristics:

- compact title
- current state and next action first
- controls begin immediately
- no large photograph
- desktop may show supporting context
- mobile behaves like a focused app screen

Image rule:

Images are allowed inside the workspace when they identify pizza choices or instructional steps. They should not become a page-level hero that delays action.

### Type E — Minimal Utility and Trust Header

Use for legal, informational, release, contact, authentication or narrow utility pages.

Examples:

- `/privacy`
- `/terms`
- `/contact`
- `/methodology`
- `/updates`
- auth callback and error states

Characteristics:

- compact heading
- high readability
- minimal decoration
- optional icon or restrained pattern
- no unnecessary pizza photography
- content begins immediately

Image rule:

No image is often the correct decision. Trust pages should feel credible, not promotional. When a legal or trust page uses imagery, it must be calm, people-free, hand-free, logo-free, text-free, and clearly support trust or transparency rather than marketing drama.

## Shared component guidance

Patch 347 introduced shared representations for the five types in:

`components/page-hero/PageHeroSystem.tsx`

Use these components when they match the page semantics:

- `MarketingHero`
- `EditorialLearningHero`
- `VisualLabHero`
- `WorkspaceHeader`
- `UtilityHeader`

Do not create one giant hero component with many unrelated boolean props. Page-specific content, imagery and product logic should remain page-specific.

## Image decision rules

Every meaningful page image must have one job:

- inspire appetite
- teach a concept
- identify a topic
- explain a comparison
- support navigation or current state

Do not add photography merely to fill space.

Do not generate or introduce people, hands, arms, silhouettes, human shadows or human reflections without explicit approval. The existing founder photograph is the only approved human image in the current sitewide system.

## Desktop and mobile art direction

Desktop may show wider scene context. Mobile must preserve the subject, readable text and early CTA/control access.

When an image-backed hero cannot guarantee readable text across crops, separate text and image into different zones. Prefer separation over heavy overlays.

## Performance and accessibility rules

- Local assets only for production imagery.
- Explicit dimensions for major images.
- Priority only for above-the-fold major images.
- Lazy-load lower imagery.
- No background video, carousels, continuous parallax or remote image service.
- Meaningful alt text for informative images.
- Empty alt for decorative images.
- No text baked into images.
- No status communicated only through image or color.
