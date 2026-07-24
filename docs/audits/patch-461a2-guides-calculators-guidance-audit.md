# Patch 461A2: Guides and Calculators Guidance-Level Audit

## 1. Executive Summary

Patch 461A2 audited the public Guide and calculator surfaces identified by Patch 461A1. It used source inspection, relevant test inspection and isolated browser contexts with temporary `doughtools.experienceLevel` values.

Summary:

- Guide/learning routes inspected: 15
- Calculator routes inspected: 2
- Level-sensitive routes confirmed to render one selected level correctly in final DOM: 5
- Routes confirmed to render multiple level-specific educational sections: 4
- Inconsistent preference-reader patterns in this scope: 3 direct components use a literal `"beginner"` initial state before reading the canonical preference.
- Critical issues: 0
- High issues: 4
- Medium issues: 3
- Low issues: 3

The strongest current implementation is in the modern client-rendered learning tools:

- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/calculator/quick`

These use the canonical preference system and, after hydration, render only the selected level's inspected educational text. Shared actions, results and practical facts remained visible.

The largest defect is the Practical pizza tips article pattern. Four static article routes render all three Beginner, Enthusiast and Pizza Nerd guidance cards through `levelGuidance.map`, without reading the canonical preference. That exposes non-selected educational content in the DOM and visible page.

No production code, tests, copy, routes, images, calculations, data, migrations or preferences were changed.

## 2. Confirmed Guide Routes

Guide and public learning routes inspected:

| Route | Source | Status |
| --- | --- | --- |
| `/guide` | `app/guide/page.tsx` | Browser and source inspected |
| `/guides/dough` | `app/guides/dough/page.tsx`, `components/guide/DoughGuidePageClient.tsx` | Browser and source inspected |
| `/sauce` | `app/sauce/page.tsx`, `components/sauce/*`, `lib/sauce-page-guidance.ts` | Browser and source inspected |
| `/toppings` | `app/toppings/page.tsx`, `components/toppings/ToppingBalanceLab.tsx` | Browser and source inspected |
| `/ovens` | `app/ovens/page.tsx`, `components/ovens/OvensQuickAnswer.tsx` | Browser and source inspected |
| `/guide/pizza-troubleshooting` | `app/guide/pizza-troubleshooting/page.tsx`, `components/guide/PizzaTroubleshootingGuideClient.tsx`, `lib/pizza-troubleshooting.ts` | Browser and source inspected |
| `/guide/practical-pizza-tips` | `app/guide/practical-pizza-tips/page.tsx` | Browser and source inspected |
| `/guide/practical-pizza-tips/leftover-dough` | article page | Browser and source inspected |
| `/guide/practical-pizza-tips/fermentation-length` | article page | Browser and source inspected; all-level issue source-confirmed |
| `/guide/practical-pizza-tips/containers-and-lids` | article page | Browser and source inspected; all-level issue source-confirmed |
| `/guide/practical-pizza-tips/common-problems` | article page | Browser and source inspected; all-level issue source-confirmed |
| `/styles` | `app/styles/page.tsx` | Browser and source inspected |
| `/gear` | `app/gear/page.tsx` | Browser verified redirect to `/ovens` |
| `/doctor` | `app/doctor/page.tsx` | Browser verified redirect to `/guide/pizza-troubleshooting` |
| `/coach` | `app/coach/page.tsx` | Browser verified redirect to `/guide/pizza-troubleshooting` |

## 3. Confirmed Calculator Routes

| Route | Source | Status |
| --- | --- | --- |
| `/calculator/quick` | `app/calculator/quick/page.tsx`, `components/quick-calculator/QuickDoughCalculator.tsx`, `lib/quick-calculator/*` | Browser and source inspected |
| `/costs` | `app/costs/page.tsx`, `components/costs/PizzaCostsPlayfulClient.tsx`, `lib/cost-calculator.ts` | Browser and source inspected |

`/calculator/quick` is level-sensitive in presentation only. `/costs` is currently a shared calculator and does not read the guidance preference.

## 4. Guide Hub Findings

Route: `/guide`

Finding:

- Does not read `doughtools.experienceLevel`.
- Does not render Beginner, Enthusiast or Pizza Nerd descriptions.
- Provides shared guide navigation for Dough, Sauce, Toppings, Ovens, Practical pizza tips and troubleshooting.
- Browser checks at 430 px with `pizza_nerd` set found no guidance-level labels, no preference-key text and no overflow.

Classification:

- Shared Guide hub. Correct not to personalize for now.

Recommended future check:

- In a content-depth pass, consider whether Beginner users need a more direct first action. This is hierarchy/content design, not a guidance-level foundation defect.

## 5. Page-By-Page Guide Matrix

| Route | Level-sensitive | Preference reader | Browser DOM result | Shared content result | Issue |
| --- | --- | --- | --- | --- | --- |
| `/guide` | No | None | No selected-level content expected | Shared guide links visible | None |
| `/guides/dough` | Yes | `readExperienceLevelPreference` in `DoughGuidePageClient` | Beginner, Enthusiast and Pizza Nerd states each rendered only selected inspected text | Quick answer and visual process remained visible | Low: literal `"beginner"` initial state |
| `/sauce` | Yes | `readExperienceLevelPreference` in Sauce components | Each selected quick answer rendered; non-selected inspected copy absent from DOM | Calculator, totals and practical sections remained visible | None |
| `/toppings` | Yes | `readExperienceLevelPreference` in `ToppingBalanceLab` | Each selected quick answer rendered; non-selected inspected copy absent from DOM | practical rules and teaching sections remained visible | Low: literal `"beginner"` initial state |
| `/ovens` | Yes | `readExperienceLevelPreference` in `OvensQuickAnswer` | Each selected bake-management copy rendered; non-selected inspected copy absent from DOM | setup paths and oven facts remained visible | None |
| `/guide/pizza-troubleshooting` | Presentation helper accepts level, route does not read preference | None on page | No preference-driven DOM found | shared troubleshooting finder visible | None in this scope |
| `/guide/practical-pizza-tips` | No | None | No level-specific article content expected | five topic cards remain visible | None |
| `/styles` | No | None | No level-specific DOM found | shared style comparison and guide links visible | None |
| `/gear` | Redirect | Redirect to `/ovens` | Lands on Ovens and therefore inherits Ovens behavior | OK | None |
| `/doctor` | Redirect | Redirect to troubleshooting | Lands on shared troubleshooting | OK | None |
| `/coach` | Redirect | Redirect to troubleshooting | Lands on shared troubleshooting | OK | None |

## 6. Practical Tips Article Matrix

All four article routes use the same static pattern:

```tsx
<div aria-label="... guidance by experience level">
  {levelGuidance.map((item) => (
    <LevelGuidanceCard key={item.level} item={item} />
  ))}
</div>
```

They import `EXPERIENCE_LEVELS`, `getExperienceLevelCornerAccentStyle` and `type ExperienceLevel`, but do not import or call `readExperienceLevelPreference`.

| Route | Current behavior | DOM result | Severity | Correction needed |
| --- | --- | --- | --- | --- |
| `/guide/practical-pizza-tips/leftover-dough` | Renders Beginner, Enthusiast and Pizza Nerd cards together | Browser confirmed non-selected article copy visible and in DOM for each tested level | High | Replace all-level cards with one selected-level card using canonical preference reader; keep food-safety checks shared |
| `/guide/practical-pizza-tips/fermentation-length` | Renders all three cards from source pattern | Source-confirmed all-level DOM exposure; browser route verified page renders and no overflow | High | Same pattern fix; keep 12/24/48/72 comparison shared |
| `/guide/practical-pizza-tips/containers-and-lids` | Renders all three cards from source pattern | Source-confirmed all-level DOM exposure; browser route verified page renders and no overflow | High | Same pattern fix; keep container basics and safety shared |
| `/guide/practical-pizza-tips/common-problems` | Renders all three cards and also has a shared Beginner fixes section | Source-confirmed all-level card pattern; browser confirmed `Beginner fixes for the current pizza` visible for non-Beginner levels | High | Separate shared quick-fix content from level-specific guidance; render one selected-level card |

Important nuance:

- The shared safety blocks are correctly always visible and should remain shared.
- Several "Beginner fixes" on common-problems are practical universal quick fixes. Patch 461A4 should decide whether to rename that shared section or move it into selected-level content.

## 7. Page-By-Page Calculator Matrix

| Route | Level-sensitive | Preference reader | Calculation result behavior | DOM result | Issue |
| --- | --- | --- | --- | --- | --- |
| `/calculator/quick` | Yes | `readExperienceLevelPreference` and `writeExperienceLevelPreference` in `QuickDoughCalculator` | Source separates formula helpers from presentation; browser confirmed results visible for all levels | Selected inspected teaching text only; non-selected inspected copy absent | Low: literal `"beginner"` initial state; tests should add DOM absence |
| `/costs` | No | None | Shared cost calculation only | No guidance labels or preference text found | None |

No calculator was found where guidance level changes formula, numerical output, saved value, default or unit.

## 8. Beginner Findings

Browser-verified selected Beginner states:

- `/guides/dough`: Beginner quick answer rendered, non-selected Enthusiast/Pizza Nerd inspected copy absent.
- `/sauce`: Beginner quick answer rendered, non-selected inspected copy absent.
- `/toppings`: Beginner quick answer rendered, non-selected inspected copy absent.
- `/ovens`: Beginner bake-management copy rendered, non-selected inspected copy absent.
- `/calculator/quick`: Beginner calculator guidance rendered, non-selected inspected copy absent.

Practical Tips article exception:

- `/guide/practical-pizza-tips/leftover-dough` visibly rendered Enthusiast and Pizza Nerd article guidance even with Beginner selected.
- Other article routes use the same all-level source pattern and need the same correction.

## 9. Enthusiast Findings

Browser-verified selected Enthusiast states:

- `/guides/dough`, `/sauce`, `/toppings`, `/ovens` and `/calculator/quick` rendered the selected Enthusiast inspected copy.
- Non-selected inspected Beginner and Pizza Nerd copy was absent from the final DOM on these routes.
- Shared facts/actions remained visible.

Practical Tips article exception:

- Source pattern renders all three level cards regardless of preference.
- `/guide/practical-pizza-tips/common-problems` also shows `Beginner fixes for the current pizza` for Enthusiast users. This may be shared practical content, but the label conflicts with selected-level behavior.

## 10. Pizza Nerd Findings

Browser-verified selected Pizza Nerd states:

- `/guides/dough`, `/sauce`, `/toppings`, `/ovens` and `/calculator/quick` rendered inspected Pizza Nerd copy.
- Non-selected inspected Beginner and Enthusiast copy was absent from the final DOM on those routes.
- Quick Calculator gives materially deeper formula context and did not alter calculation outputs.

Practical Tips article exception:

- Source pattern renders Beginner and Enthusiast cards together with Pizza Nerd content.

## 11. Missing-Value Findings

Representative missing-preference checks:

| Route | Result |
| --- | --- |
| `/sauce` | No stored value; Beginner quick answer rendered; Enthusiast and Pizza Nerd inspected copy absent |
| `/calculator/quick` | No stored value; Beginner calculator guidance rendered; Enthusiast and Pizza Nerd inspected copy absent |

This matches Patch 461A1's canonical fallback of `beginner`.

## 12. Invalid-Value Findings

Representative invalid preference value: `wizard`

| Route | Result |
| --- | --- |
| `/sauce` | Stored value normalized to `beginner`; Beginner rendered; invalid text absent |
| `/calculator/quick` | Stored value normalized to `beginner`; Beginner rendered; invalid text absent |

No crash, invalid label, multiple-level render or calculation change was observed in these representative checks.

## 13. DOM and Hydration Findings

Final DOM:

- Correct selected-level-only final DOM observed for `/guides/dough`, `/sauce`, `/toppings`, `/ovens` and `/calculator/quick`.
- No CSS-only hiding of inspected selected-level copy was detected on those routes.
- Practical Tips article routes expose all-level content in normal visible DOM because they are static server pages.

Hydration:

- The browser checks waited for hydration/effect completion before final DOM inspection.
- Source confirms some selected-level pages initialize as Beginner before reading storage:
  - `components/guide/DoughGuidePageClient.tsx`
  - `components/toppings/ToppingBalanceLab.tsx`
  - `components/quick-calculator/QuickDoughCalculator.tsx`
- `components/sauce/*` and `components/ovens/OvensQuickAnswer.tsx` use `getDefaultExperienceLevel()`, but still depend on `useEffect` to read storage.
- No visible flash was captured in the automated checks, but the architecture can still initially render Beginner before the stored level is applied. This should be consolidated with 461A1's foundation findings.

Accessibility:

- Practical Tips all-level cards are visible and not `aria-hidden`, so non-selected guidance is exposed to assistive technology.
- No hidden duplicate nodes were detected for inspected selected-level routes.

## 14. Mobile Findings

Browser checks used 390 x 844 and 430 x 740.

Findings:

- No horizontal overflow was observed on checked Guide and calculator routes.
- `/guides/dough`, `/sauce`, `/toppings`, `/ovens` and `/calculator/quick` kept one selected level at mobile widths.
- The Practical Tips article pages remain mobile-readable but become longer because all three level cards are shown.
- `/guide`, `/guide/pizza-troubleshooting`, `/guide/practical-pizza-tips`, `/costs` and `/styles` did not expose all-level guidance labels in the checked mobile state.

## 15. Desktop Findings

Browser checks used 1280 x 900.

Findings:

- `/guides/dough`, `/sauce`, `/toppings`, `/ovens` and `/calculator/quick` did not use desktop width to expose all three level explanations.
- Calculator outputs on `/calculator/quick` remained prominent in all selected states.
- Practical Tips article pages likely become all-level comparison grids on desktop because the static `levelGuidance.map` output remains visible.

## 16. Terminology Findings

Within Guides and calculators:

- User-facing level labels are consistently `Beginner`, `Enthusiast`, `Pizza Nerd`.
- The UI uses both `Experience level` and `Guidance level`:
  - `Experience level` appears in preference-selection UI.
  - `Guidance mode:` appears in badges.
  - `Guidance level` appears in Quick Calculator controls.
- This is understandable, but Patch 461A4 should decide whether user-facing wording should standardize on `Guidance level` outside historical preference labels.
- `Guide`, `Pizza guides`, `Quick answer`, `Plan a pizza`, `Home oven` and `Pizza oven` were consistent in this scope.
- `/sauce` still has some `Pizza Sauce` capitalization in related links, while sitewide copy often prefers `Pizza guides` style. Low priority.

## 17. Test-Coverage Matrix

| Route | Existing tests | Beginner | Enthusiast | Pizza Nerd | Missing/invalid | Non-selected DOM absence | Shared content/calculation unchanged |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/guide` | `guide-learning-center.test.ts` | N/A | N/A | N/A | N/A | Not needed | Partial |
| `/guides/dough` | `dough-guide.test.ts` | Partial | Partial | Partial | Not direct | Source-level only | Partial |
| `/sauce` | `pizza-sauce-calculator.test.ts` | Yes | Yes | Yes | Helper-level | Partial/source | Yes |
| `/toppings` | `topping-balance-lab.test.ts` | Partial | Partial | Partial | Not direct | Source-level only | Partial |
| `/ovens` | `ovens.test.ts` | Source-level | Source-level | Source-level | Not direct | Source-level only | Planner timing preserved |
| `/guide/pizza-troubleshooting` | `pizza-troubleshooting-guide.test.ts` | Helper-level | Helper-level | Helper-level | Yes helper | Page asserts no preference reader | Topic data unchanged |
| `/guide/practical-pizza-tips` | `practical-pizza-tips.test.ts` | N/A | N/A | N/A | N/A | Not needed | Partial |
| Practical Tips articles | `practical-pizza-tips.test.ts` | Current tests expect all-level pattern | Current tests expect all-level pattern | Current tests expect all-level pattern | No | No; tests conflict with new rule | Safety shared tested indirectly |
| `/calculator/quick` | `quick-calculator.test.ts`, `calculator-progressive-disclosure.test.ts` | Yes | Yes | Yes | Partial | Partial/source | Yes |
| `/costs` | `cost-calculator.test.ts` | N/A | N/A | N/A | N/A | Not needed | Yes |
| `/styles` | not found as level-specific | N/A | N/A | N/A | N/A | Not needed | Partial through route/source |

Main test gaps:

- Add browser/DOM-level absence tests for selected-level pages.
- Add missing and invalid preference tests at at least one Guide and one calculator route.
- Update Practical Tips tests after the all-level article pattern is corrected.

## 18. Issue Counts

Critical: 0

High: 4

- Four Practical Tips article routes render all level-specific cards.

Medium: 3

- Hydration architecture can initially render Beginner before stored preference is read on selected-level client components.
- Practical Tips article test expectations currently reinforce the all-level article pattern.
- User-facing terminology alternates between `Experience level`, `Guidance level` and `Guidance mode`.

Low: 3

- Literal `"beginner"` initial state in three audited direct-reader components.
- DOM-absence test coverage is incomplete.
- `/sauce` related-link capitalization uses `Pizza Sauce` in one Guide context.

## 19. Pages Confirmed to Require No Changes

No guidance-level filtering changes are currently required for:

- `/guide`
- `/guide/pizza-troubleshooting`
- `/guide/practical-pizza-tips`
- `/styles`
- `/gear`
- `/doctor`
- `/coach`
- `/costs`

No implementation changes are required for selected-level filtering on:

- `/guides/dough`
- `/sauce`
- `/toppings`
- `/ovens`
- `/calculator/quick`

Those selected-level routes still need later test hardening and possible fallback/hydration consolidation from Patch 461A1.

## 20. Prioritized Corrections for Later Implementation

1. Replace Practical Tips article all-level card rendering with canonical selected-level rendering.
   - Affected: leftover dough, fermentation length, containers and lids, common problems.
   - Keep safety and universally useful quick actions shared.
2. Consolidate selected-level client initialization.
   - Prefer `getDefaultExperienceLevel()` over literal `"beginner"`.
   - Consider a small shared hook if it removes repeated read-on-effect boilerplate.
3. Add focused DOM-absence and fallback tests.
   - Cover one Guide, one calculator and one Practical Tips article after correction.

## 21. Exact Handoff Scope for Patch 461A3

Patch 461A3 should audit only workflow, account, admin, legal and public shared-link behavior:

- `/session/start`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`
- `/account`
- `/account/settings`
- `/account/settings/preferences`
- `/account/settings/privacy`
- `/account/settings/security`
- `/account/party-orders` routes
- `/account/pizza-sessions/:id`
- `/order/:publicToken`
- `/order/:publicToken/edit/:submissionToken`
- `/timer`
- `/tools/bake-timer`
- `/admin` routes
- `/privacy`, `/terms`, `/methodology`, `/contact`, `/updates`, `/history`, `/about`
- relevant account, auth, session and party-order route handlers by source/test inspection

It should not repeat the Guide/calculator browser matrix unless a shared component changed before that audit starts.

## 22. Findings for Patch 461A4 Consolidation

Carry forward:

- Practical Tips article all-level rendering is the only High issue found in Guides/calculators.
- Modern Dough, Sauce, Toppings, Ovens and Quick Calculator selected-level filtering is fundamentally correct in final DOM.
- Missing and invalid preference fallback behaved correctly on representative Guide/calculator routes.
- Hydration/default handling and storage-exception resilience belong in the consolidated foundation implementation plan.
- Test coverage needs to move from source-string checks toward DOM absence and fallback behavior.

## Validation Performed

- Complete Guide/calculator source inspection for the routes listed above.
- Relevant component inspection for Dough, Sauce, Toppings, Ovens, Quick Calculator, cost calculator and troubleshooting.
- Existing relevant test inspection.
- Isolated Beginner, Enthusiast and Pizza Nerd browser checks for selected-level Guide/calculator routes.
- Representative missing-value and invalid-value checks for `/sauce` and `/calculator/quick`.
- Final DOM inspection for selected and non-selected inspected copy.
- Mobile checks at 390 x 844 and 430 x 740.
- Desktop checks at 1280 x 900.

Browser verification limitations:

- Protected workflow, account, admin, legal and shared-link pages were intentionally deferred to Patch 461A3.
- Practical Tips article all-level behavior is source-confirmed for all four article routes; browser evidence was strongest for leftover dough and supported by the shared source pattern for the remaining three.
- Hydration flash was evaluated from source architecture and final DOM checks; no frame-by-frame visual flash capture was produced in this audit.
