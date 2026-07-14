# Patch 391B: Retire legacy Plan route

## Summary

Patch 391B retired the legacy `/plan` route as an independent public planner. It keeps the compatibility URL alive as a server-side redirect to `/session/start`, removes active production links to `/plan`, removes Plan-only route code and schedule helpers, and keeps the modern Pizza Session workflow unchanged.

Patch 391A source of truth:

- Audit commit: `e010d954`
- Audit document: `docs/audits/patch-391a-plan-dependency-audit.md`
- Conclusion: Conclusion B, `/plan` is removable but specified shared modules must remain.

## Patch 391A dependency conclusion applied

Patch 391A confirmed:

- no Pizza Session route imports Plan-specific code
- no session schema or persistence contract depends on Plan
- `/session/timeline` uses `lib/pizza-session-timeline.ts`, not legacy `lib/pizza-schedule.ts`
- Plan uses shared calculation modules but does not own them
- Plan localStorage state is isolated to `doughtools-active-plan-v1`
- active production links to `/plan` remained and had to be replaced before retirement

No Plan UI, local state, completed-step state or schedule model was migrated into Timeline.

## Redirect implementation

`app/plan/page.tsx` now contains only:

```ts
import { permanentRedirect } from "next/navigation";

export default function PlanRedirectPage() {
  permanentRedirect("/session/start");
}
```

This is a server-side Next.js redirect. It does not use `useEffect`, does not render an intermediate page, does not create a Pizza Session and does not forward unsupported legacy query parameters.

Legacy query handling:

- `/plan` redirects to `/session/start`
- `/plan?...` also redirects to `/session/start`
- legacy recipe query parameters are discarded intentionally
- no hidden recipe-to-session migration was added
- no active session is silently created or replaced

## Plan-specific code removed

Removed:

- old `app/plan/page.tsx` client UI
- `app/plan/layout.tsx`
- Plan-specific legacy metadata layout
- local `ScheduleMode`, `dateInputValue`, `durationText`, `completed` state and `toggleStep`
- reads and writes for `doughtools-active-plan-v1`
- `lib/pizza-schedule.ts`
- `lib/dough-instructions.ts`
- `lib/beginner-guide.ts`

The deleted helper modules were confirmed Plan-only in production. Their remaining consumers were Plan-specific tests or historical references, which were updated or removed.

## Shared modules retained

Retained:

- `lib/recipe-url.ts`
- `lib/dough-calculator.ts`
- `lib/baking.ts`
- `lib/flours.ts`
- `lib/saved-recipes.ts`
- `lib/planning-engine.ts` and related planning modules
- `lib/pizza-session-timeline.ts`
- active Pizza Session persistence and cloud-sync modules
- `components/SiteFooter.tsx`
- `components/ExperienceLevelSelector.tsx`
- shared Dough Guide image assets

## `lib/pizza-schedule.ts` decision

Decision: deleted.

Reason:

- production consumers after `/plan` redirect: none
- Pizza Session Timeline uses `lib/pizza-session-timeline.ts`
- `scheduleInstructions` and `nextScheduledStep` had no active product route consumer
- tests that used it only protected the retired Plan schedule model

`lib/dough-instructions.ts` and `lib/beginner-guide.ts` were also deleted after the same verification. Dough Guide uses `lib/dough-guide.ts`, `lib/dough-step-images.ts` and session-context helpers instead.

## Link replacements

| Surface | Old target | New target | Rationale |
| --- | --- | --- | --- |
| Shared navigation | `/plan` | removed from navigation | `/plan` is no longer a first-class product destination. |
| Homepage core tool | `/plan` | `/session/start` | General planning belongs at the canonical Pizza Session entry. |
| Calculator top tool link | `/plan?{recipeQuery}` | `/session/start` | No tested recipe-to-session query handoff exists, so query is not forwarded. |
| Calculator "Plan next" callout | `/plan?{recipeQuery}` | `/session/start` | Starts the canonical guided flow without legacy state migration. |
| Saved recipe action | `/plan?{savedRecipeQuery}` | `/session/start` | Saved recipe cards must not generate unsupported legacy Plan URLs. |
| Recipe workflow primary action | `/plan?{recipeQuery}` | `/session/start` | Pizza Session is the modern next step; query preservation is disabled for this action. |
| Timer back link | `/plan${query}` | `/session/start` | Timer is not guaranteed to be tied to an active Pizza Session, so `/session/kitchen` would be unsafe. |

Timer back-link target: `/session/start`.

## SEO cleanup

Changed:

- removed `/plan` from `legacyNoindexRoutes`
- removed `/plan` from `statefulQueryParamRoutes`
- kept `/plan` out of `publicSeoRoutes`
- kept `/plan` out of sitemap output
- preserved `/session/start` public metadata and sitemap inclusion
- updated current SEO docs so `/plan` is described as redirect-only

`/coach` remains the remaining legacy noindex route.

## Storage retirement

`doughtools-active-plan-v1` is no longer read or written by production code.

No migration was added. No global cleanup script was added. Old browser data may remain unused in localStorage and is intentionally not copied into Pizza Session state.

## Validation

Focused tests:

- `npm test -- tests/legacy-route-indexing.test.ts tests/navigation.test.ts tests/homepage.test.ts tests/recipe-workflow.test.ts tests/saved-recipe-account-value.test.ts tests/seo-config.test.ts tests/accessibility-baseline.test.ts tests/dough-guide.test.ts tests/education-experience-copy.test.ts tests/pizza-session-timeline.test.ts tests/start-pizza-session-wizard.test.ts`
- Result: passed, 11 files, 257 tests

Full test suite:

- `npm test`
- Result: passed, 60 files, 993 tests

Lint:

- `npm run lint`
- Result: passed

Build:

- `npm run build`
- Result: passed
- Build output included `/plan` as a redirect-only route at 212 B and generated 43 static pages.

`git diff --check`:

- `git diff --check`
- Result: passed

Browser validation:

- Production build validated through the local Next.js server.
- Viewports: 390 x 844, 430 x 740, 1280 x 900, 1440 x 950.
- `/plan` redirected to `/session/start`.
- `/plan?balls=4&hydration=64&timer=90` redirected to `/session/start` without forwarding unsupported legacy query parameters.
- Browser Back from `/about -> /plan?... -> /session/start` returned to `/about` and did not loop.
- `/session/start` loaded with the expected setup form and did not silently create or replace a session.
- Homepage planning links pointed to `/session/start` and no homepage link pointed to `/plan`.
- Calculator entry states exposed no `/plan` link; the full calculator result state exposed `/session/start` actions and no legacy Plan URL.
- Timer linked back to `/session/start` and did not expose `/plan`.
- `/session/timeline` still loaded directly.
- No horizontal overflow was observed at the required viewports.
- No browser console errors were observed during the validation pass.

## Source cleanup searches

Final production searches verify:

- no production `href="/plan"`
- no production `href: "/plan"`
- no production `/plan?` handoff
- no production `recipeWorkflowQueryHref("/plan", ...)`
- no production `doughtools-active-plan-v1`
- no production `scheduleInstructions`
- no production `nextScheduledStep`
- no production `buildDoughInstructions`
- no production `beginnerHelpFor`
- no production imports of deleted Plan-only helper modules

Historical audits, tests that assert absence, and current docs explaining the redirect may still mention `/plan`.

## Functional invariants

Confirmed by scope and focused tests:

- `/session/start` UI and creation safeguards were not changed
- `/session/timeline` source was not changed
- Pizza Session timeline generation and persistence tests still pass
- dough and recipe calculation modules were not changed
- session schema was not changed
- authentication was not changed
- Party Orders were not changed
- cloud sync modules were not changed
- deployment configuration was not changed

## Final note

No Plan behavior was migrated because Patch 391A showed the current Pizza Session does not depend on legacy Plan UI, local state, completed-step state, localStorage or schedule helpers.
