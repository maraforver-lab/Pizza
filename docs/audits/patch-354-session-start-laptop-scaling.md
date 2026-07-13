# Patch 354 — Session Start laptop scaling audit

## Baseline measurement before implementation

Measured `/session/start?step=time` with the local development build before changing the page.

| Viewport | Scroll height | Sidebar height | Main card height | Day choices top | Time choices top | Sidebar note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1366 × 768 | 1,084 px | 975 px | 975 px | 280 px | 388 px | 136 px tall |
| 1280 × 800 | 1,084 px | 975 px | 975 px | 280 px | 388 px | 136 px tall |
| 1024 × 768 | 1,084 px | 975 px | 975 px | 280 px | 388 px | 136 px tall |
| 390 × 844 | 1,760 px | hidden | 1,535 px | 446 px | 678 px | hidden with sidebar |

## Confirmed issue

The desktop/laptop layout used enough vertical space that both the sidebar and main setup card extended well below a typical laptop viewport. The local-save sidebar note added 136 px of height and appeared after the journey list.

## Post-implementation measurement

Measured the same route after the compact-height layout changes.

| Viewport | Scroll height | Sidebar height | Main card height | Day choices top | Time choices top | Sidebar note |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1366 × 768 | 829 px | 716 px | 716 px | 220 px | 318 px | removed |
| 1280 × 800 | 878 px | 716 px | 773 px | 220 px | 318 px | removed |
| 1024 × 768 | 898 px | 716 px | 793 px | 220 px | 318 px | removed |
| 390 × 844 | 1,760 px | hidden | 1,535 px | 446 px | 678 px | removed |

No horizontal overflow was detected in the measured viewports.
