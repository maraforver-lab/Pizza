# Patch 463B2B: Simplified Homepage Refinement

## Mobile Preview Problems

The first simplified Homepage draft had the right information architecture, but the mobile presentation was still heavier than intended:

- Make and Learn were large cards with nested CTA-style buttons.
- The process used four separate card surfaces instead of one connected sequence.
- Supporting tools used full-width cards with repeated CTA text.
- The hero and final CTA were both dark sections with generous spacing, making the page feel longer than necessary.

## Sections Compacted

- Hero spacing was tightened while preserving the existing realistic pizza image.
- Make versus Learn now uses two compact full-card links, with Make visually primary and Learn secondary.
- How DoughTools works is one connected process component.
- Supporting tools are compact linked cards in a mobile two-column grid and desktop four-column grid.
- The final CTA keeps its strong role but uses less vertical padding.

## CTA Repetition Removed

The only prominent `Plan a pizza` buttons are now:

1. Hero
2. Final CTA

The Make row links to the Pizza Plan entry route without adding a third primary button. The Learn row links to `/guide` without adding another large `Explore guides` button.

## Final Mobile Hierarchy

1. Hero with headline, short copy, primary and secondary actions, and the existing image close to the copy.
2. Compact Make and Learn path rows.
3. Connected vertical process.
4. Compact two-column supporting tools.
5. Final `Plan a pizza` CTA.
6. Existing footer.

## Final Desktop Hierarchy

1. Balanced hero with the existing image.
2. Two compact path cards.
3. One horizontal connected process.
4. Four compact supporting tool cards.
5. Final CTA.
6. Existing footer.

## Page-Height Reduction

Local rendering checks showed the simplified draft page height dropped by about one quarter to one third on mobile:

- 390x844: approximately 27% shorter.
- 430x740: approximately 28% shorter.

## Icon Usage

The draft continues to use only the shared `DoughToolsIcon` system. Icons remain secondary to text, use one icon per path, process step or tool card, and are hidden from assistive technology when decorative.

## Version Status

- `stable` remains the only live Homepage version.
- `simplified` remains a draft Homepage version.
- Public `/` continues to render the stable Homepage.

## Product Logic

No Pizza Plan, calculator, formula, session, API, database, migration, Guide, header, navigation or footer behavior changed.

## Remaining Work Before Publish/Restore/Retire

- Validate the refined draft in the protected production Admin preview with an authenticated administrator session.
- Decide whether the simplified draft should replace or coexist with the stable Homepage.
- Add lifecycle controls only in a separate approved patch if publishing, restoring, retiring or deleting Homepage versions becomes a product requirement.
