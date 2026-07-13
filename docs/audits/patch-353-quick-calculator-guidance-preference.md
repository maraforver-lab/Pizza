# Patch 353 — Quick Calculator guidance preference audit

## Baseline measurement before implementation

Measured `/calculator/quick` on the pre-patch branch at a 390 px viewport using the local dev build.

- Page scroll height: 6,404 px
- Horizontal overflow: none
- Original guidance selector position: top 542 px, height 602 px, bottom 1,144 px
- First essential calculator controls position: top 1,168 px
- Result panel position: top 4,538 px
- Save/share section position: top 5,656 px
- Site footer: not present on the page before this patch

## Confirmed issue

The large guidance-level selector appeared before the main calculator workspace. On mobile-sized viewports it consumed roughly 602 px of vertical space before the user reached the actual inputs.

## Patch decision

Move guidance-level editing into a compact page-end preference while keeping a small top status and a Change control near the hero. This keeps the current mode visible without making guidance selection compete with the calculator itself.
