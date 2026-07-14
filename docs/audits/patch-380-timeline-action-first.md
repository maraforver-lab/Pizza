# Patch 380 - Timeline action-first audit

## Scope

Patch 380 simplified `/session/timeline` into a single action-first schedule. It did not change timeline generation, recipe calculations, shopping calculations, session schema, auth, SEO, persistence contracts, cloud sync endpoints or Kitchen Mode runtime helpers.

Changed production surface:

- `app/session/timeline/page.tsx`
- `docs/global-responsive-ux-rules.md`
- Timeline/session navigation source tests

## Previous Timeline Structure

Before this patch, `/session/timeline` repeated the same job across several visible surfaces:

- hero and current-action card;
- visible planning timing summary;
- visible timing highlights / "What happens when";
- image-heavy full timeline cards;
- a shopping checkpoint card with its own review CTA;
- a bottom action row that repeated the same primary Kitchen Mode action;
- inline guide and troubleshooting links mixed into operational areas.

The duplicate Kitchen Mode source was the top current-action button and the bottom `BottomActionBar` primary button. Both called `handleNextAction` and both used the same `nextAction.cta` / `nextAction.href` path, so the duplication was presentation-only, not separate behavior.

## Final Timeline Hierarchy

The new page order is:

1. One compact hero/current-action summary.
2. One primary `Start Kitchen Mode` button in the current-action card.
3. One ordered operational schedule.
4. Secondary Back navigation.
5. Optional guidance disclosure after the operational schedule.
6. Existing early-start timing modal when the preserved guard triggers.

The top summary contains the target time, live schedule status, Kitchen Mode availability, current action timing, step progress and the next action preview. The schedule header no longer repeats the target time.

## Removed Or Consolidated Content

Removed from the active page:

- planning timing summary section;
- timing highlights / "What happens when" section;
- per-step image panels and Timeline-specific image mapping;
- bottom duplicate primary action row;
- inline Dough Guide link in the primary action card;
- inline bake troubleshooting link inside the schedule;
- shopping checkpoint CTA and explanatory copy.

Optional Dough Guide and baking troubleshooting links now live in a secondary disclosure after the schedule.

## Footer Check

`/session/timeline` does not render the canonical `SiteFooter`, and Patch 380 did not add one. Browser validation found `footerCount: 0` and no `Made with DoughTools` footer text on Timeline.

## Logic Preservation

Preserved code paths:

- `generateAndSaveActivePizzaSessionTimeline`;
- `generatePizzaSessionTimeline`;
- `timelineStepsForPlanningSummaryDisplay`;
- `applyPizzaSessionStepRuntime`;
- `startPizzaSessionTimelineStep`;
- `formatTimelineLiveTiming`;
- `shouldWarnBeforeEarlyTimelineStart`;
- `CloudPizzaSessionSync`;
- route prerequisite handling through `SessionRouteState`.

The early-start guard remains on `handleNextAction`, before navigation into Kitchen Mode.

## Browser Validation

Validated locally on the production build (`next start`) using an anonymous session created through `/session/start`, then continued through `/session/recipe`, `/session/shopping` and `/session/timeline`.

Patch 377 baseline screen counts for `/session/timeline`:

- 390 x 844: 5.7 screens
- 430 x 740: 6.0 screens
- 1280 x 900: 4.7 screens
- 1440 x 950: 4.5 screens

Patch 380 measured screen counts:

- 390 x 844: 3.72 screens
- 430 x 740: 4.16 screens
- 1280 x 900: 2.91 screens
- 1440 x 950: 2.75 screens

Observed in all measured viewports:

- horizontal overflow: false;
- visible `Start Kitchen Mode` actions: 1;
- old section text present: none of `Timeline planning summary`, `Timing highlights`, `What happens when`, `Full timeline`;
- Timeline footer landmarks: 0;
- secondary Back link: 1;
- optional guidance disclosure button: 1.

Disclosure validation at 390 x 844:

- optional panel opened successfully;
- panel links: `See how to mix the dough`, `See baking troubleshooting`;
- `Start Kitchen Mode` remained a single visible action;
- primary action appeared before the ordered schedule.

## Tests

Focused tests passed:

- `tests/pizza-session-timeline.test.ts`
- `tests/session-flow-navigation.test.ts`
- `tests/pizza-session-shopping-list.test.ts`
- `tests/pizza-session-kitchen.test.ts`
- `tests/cloud-pizza-sessions.test.ts`
- `tests/site-footer.test.ts`

Result: 6 files passed, 190 tests passed.

Full suite passed: 59 files passed, 966 tests passed.

Lint passed: `npm run lint`.

Build passed: `npm run build`.
