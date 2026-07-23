# Patch 455A: Mobile Menu Scroll Regression Audit

## Summary

The mobile Menu overlay is implemented as a viewport-sized fixed dialog, but the current scroll-lock effect changes `body` and `html` overflow after the page has already been scrolled. In browser reproduction, opening the menu after scrolling immediately reset `window.scrollY` to `0` while the menu was open, then restored to an offset that was several hundred pixels above the original position after close.

In the Codex in-app browser the menu remained visible, but the measured scroll jump matches the reported production failure family: on affected mobile browsers, especially visual-viewport-sensitive mobile browsers, changing `documentElement` and `body` overflow without freezing the body at the current offset can move the layout viewport to the top of the document before or during overlay paint. That can make the menu appear anchored to the top-document state instead of the user's current viewport, so opening Menu after scrolling down can look like nothing visible happened.

This is a scroll-lock and viewport anchoring regression, not a navigation information-architecture problem.

## Affected Files

- `components/GlobalToolNavigation.tsx`
  - mobile menu state and refs
  - scroll-lock effect
  - sticky header container
  - fixed mobile menu overlay
  - internal mobile menu scroll area
- `tests/navigation.test.ts`
  - current source-level assertions for mobile menu overlay and scroll lock
- `tests/responsive-visual-audit.test.ts`
  - current source-level viewport-safety assertions

## Relevant Current Implementation

- Header: `sticky top-0 z-[60] overflow-visible`
- Mobile overlay: `fixed inset-0 z-[100] h-[100dvh] overflow-hidden`
- Menu body: `overflow-y-auto overscroll-contain`
- Scroll lock:
  - stores `window.scrollY`
  - sets `document.body.style.overflow = "hidden"`
  - sets `document.body.style.touchAction = "none"`
  - sets `document.documentElement.style.overflow = "hidden"`
  - restores overflow values
  - calls `window.scrollTo(0, scrollY)` on close

The risky part is locking both `body` and `documentElement` overflow while relying on `window.scrollTo(0, scrollY)` afterward. The page is not actually frozen at its existing visual position while the menu is open.

## Browser Reproduction

Local route tested: `http://127.0.0.1:3001`

Viewports:

- `390 x 844`
- `430 x 740`

Routes:

- Homepage: `/`
- About: `/about`
- long Guide page: `/guide/pizza-troubleshooting`

Procedure for each route:

1. Open Menu at the top.
2. Close it.
3. Scroll far down.
4. Open Menu again.
5. Measure overlay rect, viewport coverage and scroll position.

Results:

| Route | Viewport | Top open | Open after scroll | Scroll behavior |
| --- | --- | --- | --- | --- |
| `/` | `390 x 844` | overlay visible, rect top `0`, bottom `844` | overlay visible, center covered | before open `scrollY 5064`, while open `scrollY 0`, after close `scrollY 4672` |
| `/about` | `390 x 844` | overlay visible, rect top `0`, bottom `844` | overlay visible, center covered | before open `scrollY 5064`, while open `scrollY 0`, after close `scrollY 4672` |
| `/guide/pizza-troubleshooting` | `390 x 844` | overlay visible, rect top `0`, bottom `844` | overlay visible, center covered | before open `scrollY 3305.6`, while open `scrollY 0`, after close `scrollY 2913.6` |
| `/` | `430 x 740` | overlay visible, rect top `0`, bottom `740` | overlay visible, center covered | before open `scrollY 4440`, while open `scrollY 0`, after close `scrollY 4100` |
| `/about` | `430 x 740` | overlay visible, rect top `0`, bottom `740` | overlay visible, center covered | before open `scrollY 4440`, while open `scrollY 0`, after close `scrollY 4100` |
| `/guide/pizza-troubleshooting` | `430 x 740` | overlay visible, rect top `0`, bottom `740` | overlay visible, center covered | before open `scrollY 3205.6`, while open `scrollY 0`, after close `scrollY 2865.6` |

Observed locally:

- The menu did render over the viewport in the in-app browser.
- Opening Menu after scrolling reset the document scroll position to the top while open.
- Closing Menu did not restore the exact original scroll position.
- No horizontal overflow was observed in the measured overlay rect.

Reported production symptom:

- Menu panel is not visible when opened after scrolling down a long page.

Audit conclusion:

- The local reproduction did not show complete invisibility, but it did reproduce the underlying broken behavior: opening the menu mutates page scroll position instead of preserving the current viewport.
- The likely production-visible failure is the same root cause manifesting more severely on the user's mobile browser.

## Exact Root Cause

`components/GlobalToolNavigation.tsx` uses an overflow-only scroll lock on both `body` and `html`:

```ts
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";
document.documentElement.style.overflow = "hidden";
```

This allows the browser to recalculate the document and visual viewport while the overlay is being opened. The code then tries to repair the position after close with:

```ts
window.scrollTo(0, scrollY);
```

That repair is too late for the open state and is not exact in the measured browsers. The menu overlay should not depend on a post-close scroll restore to preserve the user's viewport.

## Smallest Safe Fix

Do not redesign navigation.

Patch 455B should change only the mobile menu scroll-lock behavior and the directly related tests:

1. When the mobile menu opens, capture `window.scrollY`.
2. Freeze the page at that visual offset while the fixed overlay is open, for example by applying a body lock equivalent to:
   - `position: fixed`
   - `top: -${scrollY}px`
   - `left: 0`
   - `right: 0`
   - `width: 100%`
   - preserve existing inline values and restore them on close
3. Avoid relying on `document.documentElement.style.overflow = "hidden"` as the primary lock.
4. Keep the overlay `fixed inset-0` and its internal `overflow-y-auto overscroll-contain` scroll area.
5. On close, remove the fixed body lock and restore exactly to the captured scroll position.
6. Add a focused regression test or browser-focused assertion that opening Menu after scroll does not set `window.scrollY` to `0` while the menu is open and restores the original scroll position on close.

If body locking conflicts with the sticky header in implementation, the next-smallest safe alternative is to render the mobile overlay from a top-level fixed portal while preserving the same menu content and behavior.

## Acceptance Criteria For Patch 455B

- Menu is visible at any scroll position on Homepage, About and a long Guide page.
- Opening Menu after scroll does not jump the page to the top.
- Closing Menu restores the exact previous scroll position, within normal browser rounding tolerance.
- Menu remains `aria-modal="true"` and keyboard focus continues to move to Close menu.
- Internal menu items remain scrollable when needed.
- Body/page scroll remains locked while the menu is open.
- No horizontal overflow appears at `390 x 844` or `430 x 740`.
- Desktop navigation remains unchanged.

## Behavior That Must Remain Unchanged

- Existing mobile menu labels, sections and order.
- Account visibility and signed-in/signed-out behavior.
- Continue/Plan pizza mobile action behavior.
- Pizza guides disclosure behavior.
- Close button behavior.
- Escape key close behavior.
- Focus trap behavior.
- Desktop Pizza guides dropdown.
- Header route structure and navigation destinations.

## Recommended Patch 455B Scope

Patch 455B should be a small implementation patch:

- update the mobile menu scroll-lock effect in `components/GlobalToolNavigation.tsx`
- update focused navigation/responsive tests for the new scroll-lock contract
- run focused mobile navigation tests, focused browser reproduction, lint/build only if rendering changes require them, and `git diff --check`

No route, copy, menu structure, desktop navigation, footer or page-content change is needed.
