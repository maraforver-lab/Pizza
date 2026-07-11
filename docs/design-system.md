# DoughTools Design System

Version: 1.0  
Purpose: implementation guidance for reusable DoughTools layout, visual and interaction patterns.

Use with:

- [Global responsive UX rules](./global-responsive-ux-rules.md)
- [Visual style guide](./visual-style-guide.md)
- [Shared layout visual reference](./design-reference/doughtools-shared-layout-reference.png)

The visual reference is directional. It defines the desired DoughTools feeling and hierarchy, not a pixel-perfect template.

## A. Purpose

The design system is the implementation layer for DoughTools UX and visual rules. It explains how future pages should translate the product principles into reusable layout components, cards, buttons, action rows and tokens.

This system exists so new pages do not invent one-off layouts. It should keep DoughTools warm, practical, premium and easy to use while preserving the product rule:

**Desktop = guided workspace.**  
**Mobile = focused app experience.**  
**Same logic, different layout.**

## B. Design principles

- Use one shared product logic, state, validation and route model.
- Change responsive presentation, not business behavior.
- Desktop can show richer context and workspace structure.
- Mobile must feel like a compact kitchen-use app flow.
- Each page should have one clear primary action.
- Back is secondary.
- Avoid repeated summaries.
- Avoid competing button menus.
- Avoid generic SaaS blue styling.
- Avoid unrelated custom layouts unless explicitly approved.
- Avoid overused Italian clichés; DoughTools should feel authentic, not theme-park Italian.

## C. Visual tokens

Preferred shared token direction:

| Role | Token | Value |
| --- | --- | --- |
| Primary | `--dt-primary` | `#0F3D2E` |
| Primary dark | `--dt-primary-dark` | `#09291F` |
| Warm background | `--dt-background-warm` | `#FFF8F1` |
| Flour | `--dt-flour` | `#F1E6D8` |
| Card | `--dt-card` | `#FFFFFF` |
| Tomato | `--dt-tomato` | `#E94B2E` |
| Orange | `--dt-orange` | `#F2A541` |
| Basil | `--dt-basil` | `#3BA66B` |
| Main text | `--dt-text-main` | `#1F1F1F` |
| Muted text | `--dt-text-muted` | `#6B645D` |

Use existing project tokens where already defined. Do not introduce conflicting color systems. These tokens are the preferred shared direction for future implementation and can be mapped into Tailwind only when that becomes useful.

## D. Shared layout components

### PageShell

Purpose: outer page background, width safety and global tone.

- Desktop: can frame a full workspace with header, content and footer.
- Mobile: must avoid horizontal overflow and keep content close to the current task.
- Use for normal pages and future route-level layouts.
- Do not use to hide business logic or fork mobile/desktop behavior.

### PageHero

Purpose: explain what the page is and what the user should do first.

- Desktop: may use two columns and supporting media.
- Mobile: stack content and keep the primary action visible early.
- Use when a page needs orientation.
- Do not turn every flow step into a marketing hero.

### PageSection

Purpose: consistent spacing and heading hierarchy for page sections.

- Desktop: can include body copy and child grids.
- Mobile: keep headings short and sections scannable.
- Use for reusable page blocks.
- Do not nest many PageSections inside each other.

### ContentGrid

Purpose: responsive groups of cards.

- Desktop: two, three or four columns depending on content.
- Mobile: one column by default.
- Use for tool links, feature cards and step previews.
- Do not use for active one-decision mobile flow cards if a single-column control list is clearer.

### BottomActionBar

Purpose: consistent Back / primary action placement.

- Desktop: Back bottom-left, primary forward action bottom-right.
- Mobile: primary action appears first and strongest; Back is below or quieter.
- Use on guided flow pages.
- Do not add multiple equal-weight forward actions.

### MobileFlowShell

Purpose: future focused mobile task wrapper.

- Desktop: not applicable except as a responsive branch inside one shared page.
- Mobile: compact header, progress, current decision and action.
- Use for kitchen-use flows.
- Do not create separate mobile business logic.

### DesktopWorkspaceShell

Purpose: future desktop wrapper with side context and main workspace.

- Desktop: may include helper panels, progress and footer.
- Mobile: collapses to focused single-column content.
- Use for guided planning/reference pages.
- Do not repeat the same summary in both side panel and main panel.

### AppFooter

Purpose: consistent legal/trust/footer links.

- Desktop: allowed on normal pages.
- Mobile: avoid large footers in focused task flows.
- Use on learning, content and browse pages.
- Do not place footer links where they compete with the main task.

## E. Shared UI components

### Card

General reusable content block with warm white background, rounded corners, subtle border and optional soft shadow.

Accessibility: use semantic headings inside the card and avoid making an entire card clickable unless it has a clear accessible name.

### TipCard

Small supporting guidance or reassurance block.

Interaction: passive by default. Do not make tips compete with the primary action.

### StepCard

Shows a numbered or ordered step.

Interaction: useful for journeys, timelines and previews. Selected/current states must include text, not color only.

### FeatureCard

Explains a product benefit or tool capability.

Use short copy and avoid turning feature cards into a large homepage dashboard.

### OptionCard

Selectable card for user choices.

Interaction rules:

- selected state must be obvious
- use `aria-pressed` or an equivalent accessible state
- minimum touch target should be at least 44px
- mobile should usually stack option cards vertically

### SummaryCard

Compact summary of selected values.

Use only when it helps orientation. Avoid repeated summary blocks on the same page.

### TimelineCard

Represents a step in a pizza timeline.

Show time, action and status clearly. Active/passive distinction should be visible through text or labels, not color only.

### ChecklistItem

Used for shopping or preparation checklists.

Status must be text-visible, not color-only.

### PrimaryButton

The strongest action. Use for the next meaningful step.

### SecondaryButton

Back, cancel or light alternative. Never competes with the primary button.

### IconButton

Compact utility action only. Never replace a main CTA with an icon-only button.

### StatusPill

Small state label such as saved locally, done, current, private or guidance mode.

### PassiveSaveIndicator

Shows autosave/local-save status without becoming an action.

### PlanningGuidanceCard

Reusable wrapper for planning guidance groups such as Dough Plan status, watch/advice, and context values.

Use for:

- plan status / risk conclusion
- what to adjust first
- compact planning context rows

Rules:

- reuse approved existing copy
- do not add duplicate explanation blocks
- keep values generated by existing planning logic
- mobile stacks naturally
- desktop may use a compact two-column layout

### PlanningStatusCard

Top-level status/risk card for a planning guidance section.

Use existing status/risk copy and tone classes. Do not change risk meaning or invent new status language inside visual-only patches.

### PlanningWatchCard

Small advice/watch card for the existing next adjustment or warning copy.

Use existing `What to adjust first`-style content. Do not add new recommendations unless a product patch explicitly changes planning guidance.

### PlanningDetailsList and PlanningDetailRow

Compact key-value rows for generated planning context such as available time, start window, W-value, yeast, and fermentation place/temperature.

Rules:

- values must come from existing helpers/state
- no hidden duplicate text for mobile
- no placeholder-looking values unless already part of the existing state
- preserve semantic `dl` / `dt` / `dd` structure

## F. Button rules

### PrimaryButton

- one per main action area
- visually strongest
- used for the next meaningful action
- warm orange or approved dark-green primary action style
- label must be specific, for example `Continue to Timeline →`

### SecondaryButton

- Back / cancel / light alternative
- visually quieter
- never competes with primary

### IconButton

- compact utility actions only
- requires accessible label
- not a replacement for main CTA

### Desktop action placement

- Back is secondary and placed bottom-left.
- Primary forward action is bottom-right.

### Mobile action placement

- Primary action is prominent and easy to tap.
- Back is secondary.
- If side-by-side: Back left, primary right.
- If stacked: primary first, Back below.

## G. Card rules

- rounded corners
- warm white background
- subtle border
- soft shadow only when useful
- clear heading
- short supporting copy
- selected state must be obvious
- avoid excessive nested cards
- avoid repeated summary cards

## H. Page shell rules

### Desktop

- may include header
- may include footer
- may include side context
- must not repeat the same summary in multiple places
- must keep one primary action clear

### Mobile

- compact app-like header
- no large sidebar
- no large footer in focused task flows
- current decision or next action first
- large tap targets
- no horizontal overflow

## I. Imagery rules

- Use warm, appetizing pizza and dough imagery.
- Images should support the story, not overwhelm the task.
- Avoid generic stock-feeling SaaS visuals.
- Avoid overused Italian clichés.
- Keep imagery consistent with DoughTools: real, warm, practical and made for pizza lovers.

### Photo imagery direction

DoughTools may use high-quality pizza-themed photography or photorealistic generated imagery when it improves understanding, orientation or emotional warmth.

Approved uses:

- local photo-style pizza images
- realistic or lightly stylized food-prep images
- instructional step photos for dough and baking workflows
- warm hero/support images when relevant to the page
- consistent image sequences for tutorials, Timeline, Kitchen Mode, Guide, Lab, Party Orders and other product areas

Photography should feel like one coherent DoughTools visual world:

- warm Italian-style kitchen atmosphere
- artisan pizza-making mood
- flour, dough, wood or stone counters, warm natural light
- realistic food texture and practical prep context
- warm cream, green and tomato UI palette should still fit the image

Instructional dough-step imagery may show the same fictional/generic hands or person context across the sequence. Prefer mostly hands visible rather than faces. For example, a sequence can imply the same experienced pizza maker in the same kitchen, with the same hands, dough batch, lighting and camera mood.

Images must help the user understand the task. They should not be random decoration or disconnected food moodboards.

Asset rules:

- store approved images locally under `/public/images/...`
- prefer optimized WebP, PNG or JPG
- avoid oversized files
- do not hotlink or fetch remote marketing images at runtime
- do not embed text inside images
- make images responsive and mobile-safe
- use meaningful `alt` text only when the image communicates content
- decorative images should use empty `alt` text or `aria-hidden`
- never let an image block understanding of text or controls

Avoid:

- cold corporate stock imagery
- cartoon emoji look when realistic photos are requested
- inconsistent hands, locations or lighting inside one instructional sequence
- recognizable real people unless explicitly approved and rights are clear
- third-party logos, trademarks or implied endorsements
- copyrighted or stock images without confirmed rights

For future image patches, first list proposed filenames and purpose. If images must be generated, keep one consistent prompt/style brief and save only approved final assets locally. Prefer a small curated asset set over many unrelated images.

## J. Future page checklist

Every new page should define:

- page type
- purpose
- primary action
- secondary action
- desktop layout
- mobile layout
- what is desktop-only
- what is hidden or collapsed on mobile
- footer behavior
- whether keep-screen-awake may be relevant
- which shared components are used

## K. Implementation rule

Before creating a new component or layout, Codex should:

1. search for an existing shared component
2. reuse it if possible
3. extend it if needed
4. create a new component only when the pattern is genuinely new
5. document the new pattern if it should be reused

Patch 64 creates the first lightweight implementation layer in `components/design-system.tsx`. Future patches should adopt it gradually and only where it improves consistency without changing product behavior.

## L. Minimal implementation example

Patch 64 does not migrate a production page. That is intentional: this patch creates the foundation without changing product flow or route behavior.

A future page or section can start with this shape:

```tsx
<PageShell>
  <PageHero
    eyebrow="Pizza-making made simple"
    title="Better decisions. Better pizza."
    body="Guide the user toward one clear next action."
    actions={<PrimaryButton href="/session/start">Start Pizza Session →</PrimaryButton>}
  />

  <PageSection title="Your pizza journey">
    <ContentGrid columns="four">
      <StepCard step={1}>Plan</StepCard>
      <StepCard step={2}>Dough</StepCard>
      <StepCard step={3}>Prepare</StepCard>
      <StepCard step={4}>Bake</StepCard>
    </ContentGrid>
  </PageSection>
</PageShell>
```

Use this as a structural example only. Future patches should adapt copy, imagery and component choice to the actual page purpose.
