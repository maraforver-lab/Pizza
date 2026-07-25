# Patch 463B2B: Refined Homepage polish

## Summary

The `refined` Homepage draft was selected for polish because it already has the right structure: image-led hero, compact Make/Learn choice, connected product process, secondary supporting tools and one final workflow handoff. This patch keeps that hierarchy and improves tactility, icon presence and scan quality without creating a new version.

## Icon Refinement

Icons still use only the shared `DoughToolsIcon` system. The Make/Learn, process and supporting-tool icon containers are slightly larger with clearer warm surfaces and subtle borders. Icons remain secondary to text and do not replace headings or action labels.

## Make/Learn Interaction

The Make pizza and Learn pizza cards remain full semantic links with the same destinations:

- Make pizza: `/session/start`
- Learn pizza: `/guide`

Hover and `focus-visible` states are clearer through border, background and restrained shadow changes. The cards do not contain nested buttons or click handlers, and the interaction does not depend on the arrow alone.

## Process Connector

The four `How DoughTools works` stages remain:

1. Plan
2. Prepare
3. Bake
4. Review

Desktop now has a thin decorative connector behind the process icons. It is hidden from assistive technology and does not change the ordered-list semantics. Mobile keeps the vertical reading order without a horizontal connector or carousel.

## Supporting Tools

The four supporting tools remain unchanged in scope and route:

- Quick Calculator: `/calculator/quick`
- Pizza Styles: `/styles`
- Practical Tips: `/guide/practical-pizza-tips`
- Troubleshooting: `/guide/pizza-troubleshooting`

Cards remain full semantic links. The action labels stay explicit (`Open calculator` and `Explore guide`) and are visually clearer, while arrows remain only supporting indicators.

## Final CTA

The final `Ready to make your next pizza?` section remains present with the same copy and `/session/start` CTA. Vertical padding was reduced so it reads as a strong closing handoff rather than a second full hero.

## Hero Preservation

The refined hero was intentionally preserved:

- same headline
- same supporting copy
- same CTA hierarchy
- same image asset
- same desktop image dominance
- same mobile text-before-image order

No new imagery, hero layout, background-image treatment or copy was introduced.

## Mobile And Desktop Behavior

Mobile remains a compact single-column flow with readable Make/Learn cards, vertical process rows and a two-column supporting-tool grid. Desktop keeps the image-led hero, compact choice cards, horizontal process and secondary tool grid.

## Registry Status

Homepage versions remain:

- `stable` — live
- `simplified` — draft
- `refined` — draft

Public `/` remains on `stable`. No public selector, query switching, cookie switching, local-storage switching or user-specific Homepage selection was introduced.

## Product Logic

No product logic changed. This polish does not touch Pizza Plan, session routes, recipe generation, calculations, formulas, defaults, validation, persistence, Quick Calculator, Guides, APIs, database, migrations, authentication, authorization, header, navigation or footer.
