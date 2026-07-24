# Patch 461A3: Workflow and Utility Guidance-Level Audit

## Executive summary

This audit covers non-Guide and non-calculator application pages. Guide and calculator defects from Patch 461A2 are not repeated here.

The non-Guide surface mostly follows the right boundary: account, admin, legal, Party Orders, public shared links, timer pages, and empty/error states do not personalize behavior by pizza experience level. The main workflow does render only one selected session level where it shows level-aware copy.

The material exception is the Pizza Plan setup and Dough Plan path. `experienceLevel` currently gates calculation-affecting controls and applies simplified defaults:

- `/session/start` hides dough-ball weight and yeast-type controls unless the session is `pizza_nerd`.
- `/session/start` applies `doughBallWeight: 260` and `DEFAULT_SESSION_YEAST_TYPE` for Beginner and Enthusiast sessions through `simpleDoughDefaultsPatchForLevel`.
- `/session/recipe` hides hydration and fermentation-temperature override controls unless the session is `pizza_nerd`.
- Those hidden controls can change saved session data and regenerated recipe output.

That violates the Patch 461A3 rule that guidance level may change explanation depth but must not change calculations, recipe quantities, saved session data, or workflow capabilities.

## Confirmed routes audited

Source-inspected canonical non-Guide routes:

1. `/`
2. `/about`
3. `/account`
4. `/account/party-orders`
5. `/account/party-orders/new`
6. `/account/party-orders/[id]`
7. `/account/pizza-sessions/[id]`
8. `/account/settings`
9. `/account/settings/preferences`
10. `/account/settings/privacy`
11. `/account/settings/security`
12. `/admin`
13. `/admin/appearance`
14. `/admin/bake-timer-sounds`
15. `/auth/callback`
16. `/contact`
17. `/history`
18. `/methodology`
19. `/order/[publicToken]`
20. `/order/[publicToken]/edit/[submissionToken]`
21. `/plan`
22. `/privacy`
23. `/session/kitchen`
24. `/session/recipe`
25. `/session/review`
26. `/session/shopping`
27. `/session/start`
28. `/session/timeline`
29. `/start`
30. `/terms`
31. `/timer`
32. `/tools/bake-timer`
33. `/updates`
34. representative 404 and no-session states

Related API/source paths inspected where they affect account, deletion, export, Party Orders, admin or authentication behavior:

- `app/api/account/export/route.ts`
- `app/api/account/data/route.ts`
- `app/api/account/delete/route.ts`
- `app/api/account/preferences/route.ts`
- `app/api/admin/**`
- `app/api/party-orders/**`
- `lib/account-data-export.ts`
- `lib/account-data-deletion.ts`
- `lib/account-full-deletion.ts`
- `lib/pizza-session.ts`
- `lib/pizza-session-kitchen.ts`
- `lib/pizza-session-timeline.ts`

## Final A/B/C/D route classification matrix

| Route | Class | Current level use | Future correction |
| --- | --- | --- | --- |
| `/` | C | Reads preference in homepage calculator workspace and selector; static all-level explanation exists. | Keep selected-level calculator copy; consider whether static all-level marketing copy should remain shared product explanation. |
| `/about` | B | Does not read preference; describes all three levels as product philosophy. | No guidance-level change required. |
| `/account` | B | Does not read preference. | No guidance-level change required. |
| `/account/party-orders` | B | No preference reader; auth-owned account workflow. | No guidance-level change required. |
| `/account/party-orders/new` | B | No preference reader; owner action form. | No guidance-level change required. |
| `/account/party-orders/[id]` | B | No preference reader; owner detail route. | No guidance-level change required. |
| `/account/pizza-sessions/[id]` | B | No preference reader; completed-plan detail. | No guidance-level change required unless detail page later embeds selected guidance. |
| `/account/settings` | B | No preference reader; hub only. | No guidance-level change required. |
| `/account/settings/preferences` | B | Contains canonical selector through `AccountGuidancePreference`. | Correct use as a setting, not personalized page behavior. |
| `/account/settings/privacy` | D | No preference reader. | Correct. Privacy/export/deletion meaning must stay identical. |
| `/account/settings/security` | D | No preference reader. | Correct. Security meaning must stay identical. |
| `/admin` | D | No preference reader; role-based content. | Correct. |
| `/admin/appearance` | D | No preference reader; role-based content. | Correct. |
| `/admin/bake-timer-sounds` | D | No preference reader; role-based content. | Correct. |
| `/auth/callback` | D | No preference reader; auth code exchange only. | Correct. |
| `/contact` | B | No preference reader. | No guidance-level change required. |
| `/history` | B | Redirects/serves About content; no preference reader. | No guidance-level change required. |
| `/methodology` | B | No preference reader; shared calculation disclosure. | No guidance-level change required. |
| `/order/[publicToken]` | D | No preference reader; public token RPC. | Correct. Public guest behavior must remain independent of local skill setting. |
| `/order/[publicToken]/edit/[submissionToken]` | D | No preference reader; public token RPC. | Correct. |
| `/plan` | C | Permanent redirect to `/session/start`. | Same correction scope as `/session/start`. |
| `/privacy` | D | No preference reader; shared legal text. | Correct. |
| `/session/kitchen` | C | Uses `session.experienceLevel` for optional Kitchen guidance. | Keep selected guidance secondary; no timer or completion logic variance found. |
| `/session/recipe` | C | Uses `session.experienceLevel`; Pizza Nerd controls affect hydration and temperature overrides. | Critical correction needed: separate explanation depth from calculation-affecting control availability. |
| `/session/review` | C | Uses `SessionStepHero` badge; review controls shared. | No immediate correction found. |
| `/session/shopping` | C | Uses `SessionStepHero` badge only; list behavior shared. | No immediate correction found. |
| `/session/start` | C | Reads preference to seed session; hides controls and applies defaults by level. | Critical correction needed: same calculation-capable setup path for all levels, with simpler explanations for Beginner. |
| `/session/timeline` | C | Uses selected level for desktop notes and exported plain-text guidance label. | Validate notes stay selected-only; calculations shared. |
| `/start` | C | Permanent redirect to `/session/start`. | Same correction scope as `/session/start`. |
| `/terms` | D | No preference reader; shared legal text. | Correct. |
| `/timer` | B | No preference reader; standalone timer logic only. | No guidance-level change required. |
| `/tools/bake-timer` | B | No preference reader; shared timer component. | No guidance-level change required. |
| `/updates` | B | No preference reader. | No guidance-level change required. |
| 404/no-session/no-active states | B/D by route | No preference reader in representative browser checks. | Correct; recovery actions stay identical. |

Counts: A 0, B 16, C 10, D 8.

## Homepage findings

Files:

- `app/page.tsx`
- `components/HomepageGuidanceLevelSection.tsx`
- `components/HomeCalculatorWorkspace.tsx`
- `lib/homepage-experience-copy.ts`
- `tests/homepage.test.ts`

Findings:

- The homepage reads `doughtools.experienceLevel` in `HomepageGuidanceLevelSection` and `HomeCalculatorWorkspace`.
- The selected-level calculator copy is selected from `getHomepageExperienceCopy(experienceLevel)`.
- Browser checks at 390x844, 430x740 and 1280x900 showed no horizontal overflow.
- The homepage final body includes static text for all three labels in the "Guidance for every level" section. This is product explanation, not alternate selected-level workflow instructions.
- Missing deeper audit item for Patch 461A4: decide whether homepage static all-level explanation should be kept as shared onboarding copy or simplified.

Severity: Low.

## Session workflow findings

Workflow steps audited:

1. Start
2. Dough Plan
3. Shopping
4. Timeline
5. Kitchen
6. Review

Shared invariants observed:

- Active session pages derive workflow state from the active local/cloud session, not from fresh preference reads after session creation.
- `tests/start-pizza-session-wizard.test.ts` asserts that stale local preference does not overwrite an existing session level.
- Empty/no-session states do not render all three levels and keep identical recovery actions.

Critical findings:

- `app/session/start/page.tsx` uses `readExperienceLevelPreference()` to create `createPlanningDraftSession(preferredLevel, requestedStep)`.
- `app/session/start/page.tsx` uses `simpleDoughDefaultsPatchForLevel(sessionLevel, supportedSession)`.
- `simpleDoughDefaultsPatchForLevel` returns `{ doughBallWeight: 260, yeastType: DEFAULT_SESSION_YEAST_TYPE }` for Beginner and Enthusiast, but returns `{}` for Pizza Nerd.
- `app/session/start/page.tsx` hides dough-ball weight and yeast-type controls behind `showPizzaNerdDoughControls`.
- `app/session/recipe/page.tsx` hides hydration and fermentation-temperature controls behind `session.experienceLevel === "pizza_nerd"`.
- `tests/session-recipe.test.ts` confirms Pizza Nerd hydration and temperature overrides can recalculate ingredients and persist into the active session and recipe snapshot.

This means guidance level currently changes more than instructional depth. It changes access to calculation-affecting controls and can affect saved recipe data.

Severity: Critical.

## Shopping findings

Files:

- `app/session/shopping/page.tsx`
- `tests/pizza-session-shopping-list.test.ts`

Findings:

- Shopping receives `session.experienceLevel` only for the `SessionStepHero` badge/accent.
- Shopping quantities and bought/not-bought checkbox behavior are shared.
- The shopping list groups and item quantities come from the session result, not from a fresh local-storage read.
- Browser no-session route `/session/shopping` showed no level labels and no overflow at 390x844.

Classification: C because it is a workflow page with a level badge, but current shopping behavior is effectively shared.

Severity: Low test gap only.

## Timeline findings

Files:

- `app/session/timeline/page.tsx`
- `lib/pizza-session-timeline.ts`
- `tests/pizza-session-timeline.test.ts`

Findings:

- Timeline receives `session.experienceLevel` in `SessionStepHero`.
- Desktop timeline rows call `getTimelineNote(step, session.experienceLevel)`.
- Exported plain text includes `Guidance: ${getExperienceLevelConfig(session.experienceLevel).label}`.
- No source evidence that timing, scheduling, status, quiet-hours warnings or step state changes by level.
- No-session browser route showed shared fallback with no level labels.

Severity: Medium test gap. Existing tests verify plain-text label but do not appear to prove non-selected note absence or invalid/missing level behavior for the route.

## Kitchen Mode findings

Files:

- `app/session/kitchen/page.tsx`
- `lib/pizza-session-kitchen.ts`
- `components/session/KitchenBakeTimerPanel.tsx`
- `tests/pizza-session-kitchen.test.ts`
- `tests/kitchen-bake-timer.test.ts`

Findings:

- Kitchen uses `getKitchenExperienceGuidance(currentStep, session.experienceLevel, session)`.
- `getKitchenExperienceGuidance` normalizes level through `normalizeExperienceLevel`.
- The rendered "More guidance" disclosure uses only one `experience` object and one selected guidance object.
- Required task controls, timers, progress and completion logic do not branch on guidance level in inspected source.
- `tests/pizza-session-kitchen.test.ts` verifies Beginner, Enthusiast and Pizza Nerd labels and safe fallback for missing, unknown and legacy values.
- Browser no-session route showed no level labels and no overflow at 390x844.

Severity: Low. Add route-level DOM absence tests later if desired.

## Review findings

Files:

- `app/session/review/page.tsx`
- `lib/pizza-session-review.ts`
- `tests/pizza-session-review.test.ts`

Findings:

- Review passes `session.experienceLevel` to `SessionStepHero`.
- Review form controls, rating, notes, photo handoff and session completion are shared.
- No source evidence that guidance level changes stored review values or completion behavior.
- Browser no-session route showed shared fallback with no level labels.

Severity: Low test gap only.

## Bake Timer findings

Files:

- `app/timer/page.tsx`
- `app/tools/bake-timer/page.tsx`
- `components/tools/StandaloneBakeTimerTool.tsx`
- `components/session/KitchenBakeTimerPanel.tsx`
- `lib/use-bake-timer.ts`
- `tests/standalone-bake-timer.test.ts`
- `tests/kitchen-bake-timer.test.ts`

Findings:

- Standalone timer pages do not read the experience-level preference.
- Kitchen timer receives session and bake-profile timing, not experience-level timing.
- No source evidence that guidance level changes duration, countdown behavior, sounds, overtime, alert cadence, mute behavior or controls.
- Browser checks for `/tools/bake-timer` at 390x844, 430x740 and 1280x900 showed no level labels and no horizontal overflow.
- Legacy `/timer` contains non-English copy objects but renders `copy.en`; this is not a guidance-level defect.

Severity: None for guidance behavior.

## Account and settings findings

Files:

- `app/account/page.tsx`
- `app/account/settings/page.tsx`
- `app/account/settings/preferences/page.tsx`
- `app/account/settings/privacy/page.tsx`
- `app/account/settings/security/page.tsx`
- `components/account/AccountGuidancePreference.tsx`
- `components/ExperienceLevelSelector.tsx`
- `components/account/account-local-data-cleanup.ts`
- account/export/deletion tests

Findings:

- Account overview does not read guidance preference.
- Settings hub does not read guidance preference.
- Preferences page intentionally exposes `AccountGuidancePreference`.
- `AccountGuidancePreference` reads `readExperienceLevelPreference()` and writes through `ExperienceLevelSelector`.
- The selector writes canonical values with `writeExperienceLevelPreference`.
- Privacy/export/delete/security pages do not vary by level.
- Delete-account local cleanup deliberately removes `doughtools.experienceLevel`, which is appropriate local-device data cleanup after account deletion.
- Browser checks of signed-out `/account` and `/account/settings` with `pizza_nerd` stored showed no level-specific account behavior and no horizontal overflow.

Severity: None for account/security/privacy behavior.

## Authentication and identity findings

Files:

- `app/account/page.tsx`
- `app/auth/callback/route.ts`
- `components/account/AccountSecurityControls.tsx`

Findings:

- Authentication, signup, login, confirmation redirect and account-security controls do not read guidance preference.
- Auth callback validates a relative `next` URL and redirects to `/account` on failure.
- No source evidence of level-based auth or identity behavior.

Severity: None.

## Privacy, GDPR and legal findings

Files:

- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/methodology/page.tsx`
- `components/TrustPageLayout.tsx`
- `lib/trust-pages.ts`
- `app/api/account/export/route.ts`
- `app/api/account/data/route.ts`
- `app/api/account/delete/route.ts`

Findings:

- Legal and privacy pages do not read guidance preference.
- Export and deletion APIs derive identity from the server session and do not accept client-supplied user IDs.
- Admin self-deletion block is role-based, not guidance-level based.
- Browser checks of `/privacy`, `/terms` and `/methodology` with `pizza_nerd` stored showed shared content and no overflow.

Severity: None.

## Party Orders and public-link findings

Files:

- `app/account/party-orders/page.tsx`
- `app/account/party-orders/new/page.tsx`
- `app/account/party-orders/[id]/page.tsx`
- `app/order/[publicToken]/page.tsx`
- `app/order/[publicToken]/edit/[submissionToken]/page.tsx`
- `components/account/PartyOrder*`
- `components/party-orders/PublicPartyOrderForm.tsx`
- `components/party-orders/PublicPartyOrderEditForm.tsx`
- `tests/party-orders.test.ts`

Findings:

- Owner Party Order pages require signed-in user and do not read guidance preference.
- Public Party Order routes load by RPC token and do not read local preference.
- Public invalid-token browser check returned the standard 404 state without level labels.
- No source evidence that guest options, submissions, exports or session handoff vary by guidance level.

Severity: None.

## Admin findings

Files:

- `app/admin/page.tsx`
- `app/admin/appearance/page.tsx`
- `app/admin/bake-timer-sounds/page.tsx`
- `components/admin/AdminAppearanceClient.tsx`
- `components/admin/AdminBakeTimerSoundsClient.tsx`
- `lib/auth/admin.ts`
- `tests/admin-roles.test.ts`
- `tests/admin-bake-timer-sounds.test.ts`

Findings:

- Admin routes are role-based and do not read guidance preference.
- Anonymous browser check of `/admin` redirected to `/account`.
- No source evidence that admin controls, permissions or visible settings change by guidance level.

Severity: None.

## Error and fallback-state findings

Browser-checked representative states:

- `/order/not-a-real-token`: standard 404.
- `/session/recipe`: "No active pizza plan".
- `/session/shopping`: "No shopping list yet".
- `/session/timeline`: "No timeline yet".
- `/session/kitchen`: "Kitchen is not ready yet".
- `/session/review`: "Nothing to review yet".
- `/account/party-orders`: redirect to `/account` when signed out.
- `/admin`: redirect to `/account` when signed out.

Findings:

- These states did not render all three levels.
- Recovery actions remained identical.
- No horizontal overflow was observed at 390x844.

Severity: None.

## Beginner findings

Browser evidence:

- `/session/start?new=1&replace=1&step=quantity` with `beginner` rendered "Guidance: Beginner".
- Enthusiast and Pizza Nerd labels were absent from the body.
- Dough-ball weight and yeast-type controls were absent.
- No horizontal overflow at 390x844, 430x740 or 1280x900.

Issue:

- Beginner gets simplified defaults and lacks access to calculation-affecting setup controls. This is not just simpler copy.

## Enthusiast findings

Browser evidence:

- `/session/start?new=1&replace=1&step=quantity` with `enthusiast` rendered "Guidance: Enthusiast".
- Beginner and Pizza Nerd labels were absent from the body.
- Dough-ball weight and yeast-type controls were absent.
- No horizontal overflow at 390x844, 430x740 or 1280x900.

Issue:

- Enthusiast also gets simplified defaults and lacks access to calculation-affecting setup controls.

## Pizza Nerd findings

Browser evidence:

- `/session/start?new=1&replace=1&step=quantity` with `pizza_nerd` rendered "Guidance: Pizza Nerd".
- Beginner and Enthusiast labels were absent from the body.
- Dough-ball weight and yeast-type controls were present.
- No horizontal overflow at 390x844, 430x740 or 1280x900.

Issue:

- Pizza Nerd is currently the only level with access to some calculation-affecting controls.

## Missing and invalid preference findings

Representative route: `/session/start?new=1&replace=1&step=quantity` at 390x844.

Missing key:

- `localStorage.removeItem("doughtools.experienceLevel")` produced Beginner UI.
- Browser local storage remained `null` after the route rendered.
- No crash, no all-level render, no horizontal overflow.

Invalid key:

- `localStorage.setItem("doughtools.experienceLevel", "wizard")` produced Beginner UI.
- Browser local storage normalized to `beginner`.
- No crash, no invalid text, no all-level render, no horizontal overflow.

Source note:

- Patch 461A1 already identified that `readExperienceLevelPreference` does not catch local-storage exceptions. That foundation risk remains for 461A4.

## DOM and hydration findings

Browser and source observations:

- `/session/start` final DOM rendered only the selected guidance label for the checked states.
- `/tools/bake-timer`, `/account/settings` signed-out state and `/privacy` rendered no guidance labels even with `pizza_nerd` stored.
- Homepage and About intentionally include all three labels as shared product explanation, not as hidden selected-level alternatives.
- No visible hydration flash was observed in the smoke checks.
- Source still initializes several client components with Beginner before `useEffect` reads local storage, so fast pre-hydration Beginner flash remains a possible foundation risk already recorded by Patch 461A1.

## Mobile findings

Checked at 390x844 and 430x740:

- `/session/start?new=1&replace=1&step=quantity`
- `/tools/bake-timer`
- `/account/settings`
- `/privacy`
- representative no-session states

Findings:

- No horizontal overflow observed.
- Session Start current action stayed visible early.
- Standalone Bake Timer controls remained accessible.
- Account Settings signed-out state remained compact.
- Legal text remained shared and readable.

Limitation:

- Authenticated account, full active session, admin and valid Party Order routes were source/test inspected, not fully browser-verified with live data.

## Desktop findings

Checked at 1280x900:

- `/`
- `/session/start?new=1&replace=1&step=quantity`
- `/tools/bake-timer`
- `/account/settings`
- `/privacy`

Findings:

- No horizontal overflow observed.
- Desktop width did not expose all session levels on `/session/start`.
- Homepage and About all-level labels are shared explanatory content, not selected-level alternatives.
- Account/legal/admin routes remain shared or role-based.

## Test-coverage matrix

| Route group | Existing coverage observed | Gaps |
| --- | --- | --- |
| Foundation | `tests/experience-levels.test.ts`, `tests/accessibility-baseline.test.ts` cover storage key, fallback, labels. | Storage exception behavior not covered. |
| Homepage | `tests/homepage.test.ts` covers default Beginner, selected card state, Pizza Nerd copy depth. | No DOM absence/browser hydration assertions for homepage selected calculator copy. |
| Session Start | `tests/start-pizza-session-wizard.test.ts` covers preference seeding, session-level persistence, Pizza Nerd-only controls and simple defaults. | Existing tests codify the critical level-gated calculation behavior rather than preventing it. |
| Dough Plan | `tests/session-recipe.test.ts` covers Pizza Nerd-only controls, recalculation and persistence. | Existing tests codify the critical level-gated calculation behavior rather than preventing it. |
| Shopping | `tests/pizza-session-shopping-list.test.ts` checks hero receives level. | No route-level invariant test proving quantities unchanged by level. |
| Timeline | `tests/pizza-session-timeline.test.ts` covers plain-text guidance label. | Limited non-selected DOM absence coverage. |
| Kitchen | `tests/pizza-session-kitchen.test.ts`, `tests/kitchen-bake-timer.test.ts` cover selected guidance and timer behavior. | Route-level browser DOM absence coverage could be stronger. |
| Review | `tests/pizza-session-review.test.ts` checks hero badge use. | No explicit review-value invariance by level. |
| Bake Timer | `tests/standalone-bake-timer.test.ts`, `tests/kitchen-bake-timer.test.ts` cover shared timer behavior. | No specific assertion that no experience-level reader exists. |
| Account/Settings | `tests/account-settings-information-architecture.test.ts`, account export/deletion tests, account preference tests. | No explicit assertion that privacy/security pages ignore guidance level. |
| Auth/Admin/Legal | `tests/admin-roles.test.ts`, `tests/trust-pages.test.ts`, export/deletion tests. | No explicit guidance-level invariance tests for these route groups. |
| Party Orders | `tests/party-orders.test.ts` covers owner and guest flows. | No explicit assertion that public guest routes ignore guidance preference. |

## Severity counts

- Critical: 2
  - `/session/start` level-gated defaults and calculation-affecting setup controls.
  - `/session/recipe` Pizza Nerd-only hydration and temperature controls that can alter saved recipe data.
- High: 0
- Medium: 2
  - Timeline selected-note behavior lacks strong DOM/fallback coverage.
  - Foundation local-storage exception risk from Patch 461A1 affects workflow readers.
- Low: 6
  - Homepage all-level product explanation needs final policy decision.
  - Shopping lacks quantity-invariance tests by level.
  - Review lacks stored-value-invariance tests by level.
  - Account privacy/security pages lack explicit non-use tests.
  - Party Order public pages lack explicit non-use tests.
  - Timer routes lack explicit non-use tests.

## Pages confirmed to require no changes

No guidance-level implementation change is required for:

- `/account`
- `/account/party-orders`
- `/account/party-orders/new`
- `/account/party-orders/[id]`
- `/account/pizza-sessions/[id]`
- `/account/settings`
- `/account/settings/privacy`
- `/account/settings/security`
- `/admin`
- `/admin/appearance`
- `/admin/bake-timer-sounds`
- `/auth/callback`
- `/contact`
- `/methodology`
- `/order/[publicToken]`
- `/order/[publicToken]/edit/[submissionToken]`
- `/privacy`
- `/terms`
- `/timer`
- `/tools/bake-timer`
- `/updates`
- representative 404/no-session states

Pages that need policy clarification rather than immediate implementation:

- `/`
- `/about`
- `/history` because it serves/redirects to About

Pages requiring future correction:

- `/session/start`
- `/session/recipe`

Pages requiring only test-hardening unless Patch 461A4 finds broader issues:

- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`

## Prioritized findings for Patch 461A4

1. Consolidate A1, A2 and A3 into one final defect list.
2. Mark `/session/start` and `/session/recipe` as the top workflow defects because guidance level currently gates calculation-affecting controls/defaults.
3. Include A2 Practical Tips all-level article rendering as the top educational DOM defect.
4. Include A1 local-storage exception handling as the foundation defect.
5. Decide whether homepage/About all-level explanatory copy is acceptable shared product explanation or should be simplified.
6. Recommend test coverage that locks calculations, saved values, timer behavior, account/security/legal behavior and public Party Order behavior across levels.

## Browser-verification limitations

Browser checks used local dev server at commit `018f2905a64b9b386015d951fc27edafe7abc322` with isolated browser contexts.

Browser-verified routes:

- `/`
- `/session/start?new=1&replace=1&step=quantity`
- `/tools/bake-timer`
- `/account`
- `/account/settings`
- `/account/party-orders` signed-out redirect
- `/admin` signed-out redirect
- `/order/not-a-real-token`
- `/session/recipe` no-session
- `/session/shopping` no-session
- `/session/timeline` no-session
- `/session/kitchen` no-session
- `/session/review` no-session
- `/privacy`
- `/terms`
- `/methodology`
- `/about`
- `/contact`
- `/history`
- `/updates`
- `/start`
- `/plan`
- `/timer`

Not browser-verified with live authenticated data:

- signed-in Account workspace content
- signed-in Settings child content beyond signed-out guard state
- admin authenticated pages
- valid Party Order public token pages
- full active Pizza Plan workflow after creating a durable cloud-backed session
- completed pizza-plan detail

Those paths were source- and test-inspected only, to avoid creating cloud data or using private account state during an audit-only patch.

Temporary browser storage was isolated per context and discarded after checks. Developer/browser persistent preference state was not changed.
