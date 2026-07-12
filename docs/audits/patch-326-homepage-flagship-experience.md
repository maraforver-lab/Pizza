# Patch 326 — Homepage flagship experience QA

Patch 326 reframes the homepage as the front door to the full DoughTools Pizza Session experience rather than a calculator-first landing page.

## Scope

- Homepage presentation only.
- No Pizza Session, calculation, account, authentication, API, Timeline, Kitchen Mode, Party Orders or experience-level logic changed.
- Existing calculator query behavior remains available through the homepage route for `/?calculator=1`, `/?calculator=2` and recipe query URLs.

## UX changes

- Hero now leads with “Your pizza, planned properly.” and “Better pizza starts before the oven.”
- The primary action remains `Start Pizza Session`.
- The secondary action remains `See how it works`.
- The hero now makes the value explicit with:
  - Know when to start
  - Know what to buy
  - Know what to do next
- The page narrative now flows through:
  - One plan. Every step.
  - More than a dough calculator.
  - See DoughTools in action.
  - Guidance for every level.
  - Founder story.
  - Final Pizza Session CTA.

## Visual and responsive QA

Reviewed the homepage at:

- 320 px
- 390 px
- 430 px
- 768 px
- 1024 px
- 1280 px
- 1440 px
- 1920 px

Confirmed:

- No document/body horizontal overflow.
- Hero image loads at all checked widths.
- Primary and secondary CTA hierarchy remains clear.
- The section rhythm alternates between light, dark/editorial and product-focused surfaces.
- The page no longer reads as “just a calculator.”

## Asset and performance notes

- Reused existing approved local homepage and product imagery.
- No remote images.
- No AI-generated images.
- No new hero assets.
- No additional runtime dependencies.
