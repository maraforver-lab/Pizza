# Patch 468B Existing Hero And Imagery Cleanup

## Summary

Patch 468B implemented the first low-risk recommendations from the Patch 468A hero and imagery audit using only existing assets.

Changed routes:

- `/privacy`
- `/terms`
- `/updates`
- `/styles`

Unchanged control route:

- `/guide`

No image asset was added, generated, downloaded, modified or deleted.

## Previous Problems

- `/privacy` and `/terms` used large page-level trust photos that delayed legal summary and navigation content on mobile.
- `/updates` reused the Homepage hero image even though the image did not identify release notes or update status.
- `/styles` already had seven accurate local style photos, but the first screen did not surface style imagery early.
- The Guide hub was already approved as a non-photo learning entry and did not need another image.

## Privacy And Terms

Privacy and Terms now use the compact `TrustPageLayout` header path because their `heroImage` metadata was removed from `lib/trust-pages.ts`.

Preserved:

- eyebrow
- page title
- introduction
- effective and updated dates
- summary cards
- `On this page`
- legal text
- public source links
- contact-email links
- footer

The shared layout still retains an explicit image-capable branch for a future Trust page with an approved image, but pages without images no longer reserve an empty second column or request image files.

## Updates

`/updates` no longer imports `next/image` or `updatesHeroImage`, and `lib/product-updates.ts` no longer exports the obsolete Homepage hero metadata.

Preserved:

- `DoughTools updates`
- current heading and introduction
- `Plan a pizza`
- `Why DoughTools exists`
- empty-update state
- future-updates explanation
- `0 published updates`
- footer

The route is now a compact image-free product-update page instead of a Homepage-like hero page.

## Pizza Styles

`/styles` now renders `PizzaStyleVisualComparison` after `PizzaStyleHero` and before the detailed `PizzaStyleComparison`.

The visual comparison reuses all seven existing local style images from `pizzaStyleEducation`:

- Neapolitan
- Contemporary Neapolitan
- New York
- Detroit
- Roman Tonda
- Roman al Taglio
- Sicilian

Each item is a compact anchor link to the existing detailed comparison section for that style. The component uses the canonical metadata for image path, dimensions, alt text and style names. It does not introduce a large single-style hero, duplicate style data, remote assets, priority loading, carousel behavior or baked-in image text.

## Mobile Measurements

Measured in local production rendering on the built app.

| Route | Viewport | Header bottom | First summary/card top | `On this page` top | Notes |
|---|---:|---:|---:|---:|---|
| `/privacy` | 390x844 | 649 px | 673 px | 1589 px | No hero image; summary begins in first viewport. |
| `/privacy` | 430x740 | 593 px | 617 px | 1465 px | No hero image; summary begins in first viewport. |
| `/terms` | 390x844 | 565 px | 589 px | 1461 px | No hero image; summary begins in first viewport. |
| `/terms` | 430x740 | 565 px | 589 px | 1437 px | No hero image; summary begins in first viewport. |

| Route | Viewport | Header bottom | First content top | Notes |
|---|---:|---:|---|
| `/updates` | 390x844 | 521 px | 645 px | No Homepage image; empty state starts earlier than a photo-led header. |
| `/updates` | 430x740 | 521 px | 645 px | No reserved image column or image request. |

| Route | Viewport | Visual comparison top | First image top | Detailed comparison top | Early introduction height |
|---|---:|---:|---:|---:|---:|
| `/styles` | 390x844 | 500 px | 682 px | 1110 px | 1110 px |
| `/styles` | 430x740 | 465 px | 647 px | 1101 px | 1101 px |

Mobile results:

- No horizontal overflow on `/privacy`, `/terms`, `/updates`, `/styles` or `/guide`.
- `/styles` renders seven visible style images and seven anchor links.
- The 390 px Styles layout keeps a compact three-column thumbnail grid with readable labels.
- No console errors or hydration warnings were observed in browser checks.

## Desktop Results

Checked at 1280x900 and 1440x900.

- `/privacy` and `/terms` use compact single-column legal headers with summary cards directly below.
- `/updates` uses a compact image-free header with CTAs visible and no empty image column.
- `/styles` shows the visual comparison early; all style images are balanced and no one style is presented as canonical.
- `/guide` remains non-photo and does not reuse the Homepage hero image.
- No horizontal overflow, broken image state, console errors or hydration warnings were observed.

## Image Requests And Performance

Current rendered image evidence:

- `/privacy`: 0 image elements, 0 trust hero requests.
- `/terms`: 0 image elements, 0 trust hero requests.
- `/updates`: 0 image elements, 0 Homepage hero requests.
- `/styles`: 7 rendered `next/image` elements using existing `/pizza-styles/*.webp` assets.
- `/guide`: 0 image elements in the checked introduction, and no Homepage hero reuse.

Performance effect:

- Removed page-level image downloads from Privacy, Terms and Updates.
- Added only existing optimized local style thumbnails to Styles.
- No `priority` loading was added to the seven style thumbnails.
- No remote images, carousel, video, parallax or duplicated mobile/desktop assets were introduced.

## Accessibility

- Privacy and Terms retain valid page titles, dates, summary cards and section navigation.
- Removed Trust and Updates images are no longer announced because they are no longer rendered.
- Styles thumbnail links have meaningful accessible names and visible text labels.
- Style image alt text remains the canonical instructional alt from `pizzaStyleEducation`.
- Focus order follows the visible layout: hero, visual comparison, detailed comparison.
- No meaning depends only on image content or color.

## Assets Left In Place

The underlying removed hero image files remain in `public/` for a later verified cleanup decision:

- `/images/trust/privacy-hero-desktop.webp`
- `/images/trust/privacy-hero-mobile.webp`
- `/images/trust/terms-hero-desktop.webp`
- `/images/trust/terms-hero-mobile.webp`
- `/images/homepage/doughtools-hero-desktop.webp`

No asset deletion belongs in this patch.

## Guide Hub Decision

`/guide` was inspected as the unchanged control route. It remains a compact, non-photo Guide entry and still does not reuse the Homepage hero image. No Guide hub change was needed.

## Remaining Patch 468C Image Briefs

Patch 468C should continue from the Patch 468A briefs for higher-value instructional imagery, especially:

- Sauce topic-identification or sauce-application imagery.
- Toppings moisture and overload comparisons.
- Ovens rack-position or heat-behavior diagrams where photography is less instructional.
- Practical Pizza Tips article-specific teaching images.
- Troubleshooting symptom examples where diagnosis benefits from realistic comparison imagery.

