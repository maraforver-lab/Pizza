# Patch 352 — Topping Balance Lab manual QA

Date: 2026-07-13  
Branch: `patch/352-toppings-manual-qa-and-realistic-visuals`  
Baseline: `f99b99c4` (`Patch 351: Audit sitewide hero rollout`)

## Scope

This audit covers `/toppings` and the representative shared URL:

`/toppings?pizzaShape=round&rim=2&diameter=32&cheese=fior-di-latte&drain=4-8h&cheeseGrams=88&sauceGrams=75`

The audit focuses on:

- shared URL preservation
- mobile and desktop interaction behavior
- responsive layout and overflow
- current-result visibility
- reference-image usefulness
- footer placement
- accessibility and keyboard-sensitive controls

## Pre-change local browser measurements

Rendered locally in Chrome against `http://127.0.0.1:3000/toppings` with the representative URL.

| Width | Scroll height | Horizontal overflow | Controls top | Visual result top | Result cards top | Reference module top | Footer top |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 320 px | 15,755 px | none | 1,238 px | 3,020 px | 3,652 px | 4,186 px | 14,498 px |
| 390 px | 14,467 px | none | 1,065 px | 2,694 px | 3,396 px | 3,910 px | 13,584 px |
| 430 px | 14,087 px | none | 1,037 px | 2,666 px | 3,348 px | 3,862 px | 13,220 px |
| 768 px | 12,806 px | none | 931 px | 2,544 px | 3,426 px | 3,687 px | 12,025 px |
| 1024 px | 7,555 px | none | 797 px | 797 px | 1,566 px | 1,847 px | 7,002 px |
| 1280 px | 7,081 px | none | 797 px | 797 px | 1,551 px | 1,734 px | 6,528 px |
| 1440 px | 7,086 px | none | 797 px | 797 px | 1,551 px | 1,734 px | 6,533 px |
| 1920 px | 7,086 px | none | 797 px | 797 px | 1,551 px | 1,734 px | 6,533 px |

## Confirmed findings before implementation

### Finding 1 — Preset selection performs a full page navigation

Severity: high

Evidence:

- `components/toppings/ToppingBalanceLab.tsx` calls `window.location.assign(nextUrl)` for `"push"` URL writes.
- The CDP click run on the `Too much` preset navigated the inspected target strongly enough to interrupt the runtime evaluation.

User impact:

- Preset selection loses app-like interaction continuity.
- Browser history is updated through a full reload instead of local state.
- Focus and scroll can be lost during experimentation.

Recommendation:

- Replace `window.location.assign` with `history.pushState`.
- Keep `replaceState` for continuous control edits.
- Listen for `popstate` so browser back and forward restore the matching shared URL state.

### Finding 2 — Mobile hides the visual result below all controls

Severity: medium

Evidence:

- At 320 px, the interactive lab starts at 910 px, controls start at 1,238 px, and the visual result starts at 3,020 px.
- At 390 px, controls start at 1,065 px and the visual result starts at 2,694 px.

User impact:

- The page says “watch the coverage,” but on mobile the user changes several controls before seeing any visual feedback.
- This makes the lab feel more like a form than an interactive visual teaching tool.

Recommendation:

- On compact widths, show a compact current-result visual/summary before the control stack.
- Keep the desktop workspace two-column with controls and visual aligned.
- Preserve one state model and one calculation path.

### Finding 3 — Numeric fields clamp while the user is still typing

Severity: medium

Evidence:

- `NumberControl` calls `Number(event.target.value)` and immediately clamps on every `onChange`.
- An empty field becomes `0`, so the user cannot naturally clear and retype a value without the UI forcing a value mid-edit.

User impact:

- Keyboard entry feels jumpy, especially on mobile numeric keyboards.
- Editing multi-digit values is more error-prone than using the plus/minus controls.

Recommendation:

- Keep plus/minus controls immediate.
- Allow temporary draft text in the input.
- Commit/clamp on blur, Enter, or valid numeric entry without overwriting partial input.

### Finding 4 — Reference images are not a controlled teaching series

Severity: medium

Evidence:

- Existing `public/toppings/too-light.webp`, `balanced.webp`, and `too-heavy.webp` are single mixed examples.
- Current research notes explicitly say they are not a controlled single-variable study.

User impact:

- The section supports the lesson, but it does not clearly show sauce light/balanced/heavy, cheese light/balanced/heavy, or mozzarella moisture state as separate variables.

Recommendation:

- Add a local realistic reference series:
  - sauce light / balanced / heavy
  - cheese light / balanced / heavy
  - fior di latte wet / drained
- Keep images people-free, hand-free, local, optimized and text-free.
- Use responsive presentation so mobile does not require tiny side-by-side comparisons.

### Finding 5 — Footer placement is final and not followed by content

Severity: none

Evidence:

- `SiteFooter` renders as the final element of the page.

Recommendation:

- Preserve this behavior.

## Regression boundaries

Patch 352 must not change:

- topping area formulas
- topping load thresholds
- cheese, sauce, drainage, moisture or oven meaning
- valid query parameter names
- existing shared URL compatibility
- Pizza Session, Shopping, Timeline, Kitchen Mode, Sauce, Style or Oven logic

## Post-change verification

Rendered locally in Chrome after the Patch 352 implementation.

| Width | Scroll height | Horizontal overflow | Visual result top | Controls top | Reference module top | Footer top |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 320 px | 15,510 px | none | 1,238 px | 2,987 px | 9,150 px | 14,253 px |
| 390 px | 14,090 px | none | 1,065 px | 2,836 px | 8,498 px | 13,207 px |
| 430 px | 13,586 px | none | 1,037 px | 2,764 px | 8,306 px | 12,719 px |
| 768 px | 11,555 px | none | 931 px | 2,529 px | 7,129 px | 10,774 px |
| 1024 px | 7,747 px | none | 797 px | 797 px | 4,447 px | 7,194 px |
| 1280 px | 7,282 px | none | 797 px | 797 px | 4,099 px | 6,729 px |
| 1440 px | 7,291 px | none | 797 px | 797 px | 4,099 px | 6,738 px |
| 1920 px | 7,291 px | none | 797 px | 797 px | 4,099 px | 6,738 px |

### Confirmed fixes

- Preset selection no longer reloads the page. A Chrome CDP click on the `Too much` preset kept the same `performance.timeOrigin`, updated the URL query with `pushState`, and changed the visible result from `Practical starting balance` to `Heavy but still adjustable`.
- Browser back/forward compatibility is preserved by the existing `popstate` listener and the new non-reloading history writes.
- Mobile now shows the current visual result before the full control stack. At 390 px, the visual result moved from 2,694 px to 1,065 px.
- Numeric inputs now keep a temporary editable draft and clamp on blur/Enter while plus/minus controls remain immediate.
- The reference section now uses one large responsive image at a time instead of requiring three tiny mobile comparison images.
- Footer remains the final page element.

### Asset QA

Added active local reference assets under `public/toppings/references/`:

| File | Dimensions | Size | QA note |
| --- | ---: | ---: | --- |
| `sauce-light.webp` | 960×960 | 172,994 B | sparse tomato coverage |
| `sauce-balanced.webp` | 960×960 | 232,582 B | even tomato coverage |
| `sauce-heavy.webp` | 960×960 | 211,944 B | deep tomato layer and wet pools |
| `cheese-light.webp` | 960×960 | 187,884 B | sparse fior di latte islands |
| `cheese-balanced.webp` | 960×960 | 150,434 B | restrained fior di latte islands |
| `cheese-heavy.webp` | 960×960 | 104,270 B | near-continuous cheese blanket |
| `mozzarella-wet.webp` | 960×960 | 64,260 B | visible wet fresh mozzarella |
| `mozzarella-drained.webp` | 960×960 | 63,986 B | drained fresh mozzarella |

The approved final reference assets are local WebP files and contain no people, hands, faces, arms, silhouettes, human reflections, logos, packaging or embedded text.
