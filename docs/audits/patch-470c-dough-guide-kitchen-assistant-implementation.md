# Patch 470C: Dough Guide Kitchen Assistant implementation

## Summary

Patch 470C implements the Patch 470B recommendation: the Dough Guide now behaves as a step-centered Kitchen Assistant. The selected step is the primary workspace, and the page answers these questions first:

- Where am I?
- What do I do now?
- How do I know I am ready?
- What mistake should I avoid?
- What comes next?

This patch changes presentation and hierarchy only. It does not change dough calculations, step definitions, URLs, Pizza Plan logic, session storage, images, APIs, database, migrations, navigation or footer.

## Previous hierarchy

Before this patch, the route rendered:

1. Breadcrumbs and return link.
2. Large "Make the dough" hero.
3. Prepare-only "What should I do first?" card.
4. Global "See the dough process" image gallery on every step.
5. Active step article.
6. Current action, readiness, mistake, recovery and optional details.

The content was useful, but the active step was delayed. Patch 470B measured many non-Prepare mobile steps with the active article around 875-905 px and the action around 1395-1440 px.

## Implemented hierarchy

The current route now renders:

1. Breadcrumbs and optional session return link.
2. Compact Dough Guide page identity.
3. Step workspace immediately.
4. Desktop step navigation in a left sidebar.
5. Mobile step navigation in a compact disclosure after the instruction content.

Every step uses the same primary sequence:

1. `Step X of 12`
2. Step title
3. Concise purpose sentence
4. `What to do now`
5. The relevant step image
6. Compact Pizza Plan context where available
7. `You are ready when`
8. `Common mistake`
9. `How to avoid it`
10. Step-specific visual learning
11. Troubleshooting links
12. `Why this matters` disclosure
13. Selected guidance-level disclosure
14. Previous/next actions

## Prepare-only orientation

The old large `See the dough process` gallery was removed from the normal flow. Prepare now has one compact orientation element:

`Your dough journey`

It shows:

- Prepare
- Mix
- Ferment
- Divide
- Ball
- Proof
- Stretch

Later steps do not render the process overview and do not reserve empty space for it.

## Content-block mapping

| Previous content | New role |
| --- | --- |
| `Do this now` | Renamed to `What to do now` and made the primary instruction block. |
| Active step image | Moved into the primary instruction block, after the ordered action list on mobile and beside it on desktop. |
| `You are ready when` | Kept immediately after action and image. |
| `Common mistake` | Kept as a compact warning block. |
| `How to fix it` | Presented as compact `How to avoid it` recovery guidance. |
| `Why this matters` | Kept as a collapsed disclosure. |
| Selected level detail | Kept as a collapsed guidance-level disclosure. |
| Step visual sequence/comparison | Kept after the primary action/readiness/mistake sequence. |
| Troubleshooting links | Kept as contextual recovery links. |
| Previous/next actions | Kept with the next action visually dominant. |

The separate "What should I do first?" / Start Here block was not retained, because it duplicated the new action-first Prepare hierarchy. The next-step CTA still takes Prepare users to Measure.

## Pizza Plan context

Pizza Plan integration remains read-only.

No active plan:

- Prepare shows a compact `No Pizza Plan active` row.
- The `Plan a pizza` link remains available.
- The row does not sit between the step title and the primary action.

Active plan:

- Existing session context is still read through `getActivePizzaSession()`.
- Existing read-only helpers provide compact context through `getDoughGuideStepPersonalization()` and `getDoughGuideStepFlourGuidance()`.
- The guide does not write session state, complete steps, update calculations or change stored Pizza Plan values.

Active-plan visual browser verification was not performed with a real stored session. The active-plan behavior is covered by the existing focused test fixtures and source inspection.

## Desktop structure

At desktop sizes, the page is a two-column workspace:

- left: compact sticky step navigation
- right: selected step workspace

The large hero and global process gallery are gone. The active step title and the primary action are in the first viewport for representative later steps.

Representative desktop measurements:

| Viewport | Step | Step title top | `What to do now` top | Primary action visible in first viewport | Workspace width |
| --- | --- | ---: | ---: | ---: | ---: |
| 1280 x 900 | Measure | 252 px | 356 px | 100% | 1217 px |
| 1280 x 900 | Mix dough | 252 px | 356 px | 100% | 1217 px |
| 1280 x 900 | Bulk fermentation | 252 px | 356 px | 100% | 1217 px |
| 1280 x 900 | Check readiness | 252 px | 356 px | 100% | 1217 px |
| 1440 x 900 | Prepare | 373 px | 477 px | 100% | 1280 px |
| 1440 x 900 | Measure | 252 px | 356 px | 100% | 1280 px |
| 1440 x 900 | Check readiness | 252 px | 356 px | 100% | 1280 px |

No horizontal overflow was observed in the representative desktop checks.

## Mobile structure

At mobile sizes, the page is one-column and action-first:

1. Compact page identity
2. Current step
3. `What to do now`
4. Step image
5. Plan context when present
6. Readiness
7. Mistake and recovery
8. Deeper visual teaching
9. Optional disclosures and next action
10. `All dough steps` disclosure

Representative mobile measurements:

| Viewport | Step | Step title top | `What to do now` top | First image top | Ready top | Next action top | Total document height |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 390 x 844 | Prepare | 509 px | 700 px | 984 px | 1505 px | 2543 px | 2693 px |
| 390 x 844 | Measure | 252 px | 426 px | 685 px | 989 px | 2304 px | 2514 px |
| 390 x 844 | Mix dough | 252 px | 381 px | 720 px | 1024 px | 2343 px | 2554 px |
| 390 x 844 | Bulk fermentation | 252 px | 381 px | 640 px | 944 px | 2339 px | 2550 px |
| 390 x 844 | Ball dough | 252 px | 381 px | 624 px | 928 px | 3454 px | 3664 px |
| 390 x 844 | Check readiness | 252 px | 426 px | 661 px | 965 px | 4577 px | 4787 px |
| 390 x 844 | Release dough ball | 252 px | 426 px | 741 px | 1045 px | 2336 px | 2542 px |
| 430 x 740 | Prepare | 509 px | 655 px | 915 px | 1466 px | 2487 px | 2638 px |
| 430 x 740 | Measure | 252 px | 426 px | 685 px | 1019 px | 2342 px | 2552 px |
| 430 x 740 | Mix dough | 252 px | 381 px | 720 px | 1054 px | 2377 px | 2587 px |
| 430 x 740 | Check readiness | 252 px | 426 px | 637 px | 971 px | 4569 px | 4779 px |

No horizontal overflow was observed. The old `See the dough process` text and the old `What should I do first?` text were absent.

## Image placement

No image assets were added, modified or deleted.

The existing primary step image now belongs to `What to do now`. On desktop it can sit beside the action list. On mobile it appears directly after the action list. Step-specific visual sequence and comparison images remain below the action/readiness/mistake/recovery sequence.

This keeps the most relevant image close to the instruction it explains without using the four process images as a general gallery on every step.

## Accessibility results

Implemented:

- The selected step title is the single `h1`.
- `What to do now`, `You are ready when`, `Common mistake` and `How to avoid it` use semantic section headings.
- Immediate actions remain an ordered list.
- Readiness criteria remain a list.
- The warning block includes explicit text, not only colour.
- Disclosures keep `aria-expanded` and `aria-controls`.
- Step navigation keeps `aria-current="step"`.
- Mobile step navigation is behind a native `details` / `summary` control after the instruction content.
- Previous and next actions keep clear labels.
- Existing image alt text is preserved.

## Regression results

Automated validation performed during implementation:

- Focused Dough Guide test: `npm test -- tests/dough-guide.test.ts` — 58 passed.

Browser validation performed locally:

- Representative sweep at 390 x 844, 430 x 740, 1280 x 900 and 1440 x 900.
- Checked Prepare, Measure, Mix dough, Bulk fermentation, Ball dough, Check readiness and Release dough ball.
- No horizontal overflow observed.
- No console or hydration warnings observed in the browser log sample.
- No broken image state observed during the inspected routes.

Remaining validation for this patch:

- Additional focused integration/guidance/image/responsive tests.
- `npm run lint`
- `npm run build`
- `git diff --check`

## Content intentionally retained

Retained:

- All 12 canonical step ids and URLs.
- All step definitions and factual copy in `lib/dough-guide.ts`.
- All primary and secondary Dough Guide images.
- Previous/next query-string navigation.
- Timeline/Kitchen return-link handling.
- Troubleshooting links.
- Guidance-level details.
- Active-session read-only context helpers.

## Numerical and integration boundaries

Unchanged:

- Dough calculations
- Quick Calculator
- Pizza Plan logic
- Session routes
- Kitchen Mode
- account/auth
- other Guides
- Homepage
- header
- navigation
- footer
- APIs
- database
- migrations
- indexing policy
- image assets

No deployment was performed.

## Remaining release scope for Patch 470D

Patch 470D should be release verification only:

- Deploy current master after merge.
- Verify `/guides/dough` in production at the same four viewports.
- Verify all 12 steps, with close attention to Prepare, Check readiness and Release dough ball.
- Verify session return links from Timeline and Kitchen remain safe.
- Verify no process gallery returns on later steps.
- Verify no production session, calculation, image asset, API, database, migration or indexing behavior changed.
