# Patch 476A: DoughTools Pizza Identity, Social Preview and App Icons

Type: branding metadata + icon implementation
Starting commit: `6df96e2baebb26638ed2238f2785f3230ad38323`
Branch: `patch/476a-pizza-identity-social-icons`
Production deployment: not performed

## Summary

Patch 476A replaces the old SVG-only app identity and generated `/opengraph-image` social preview with one pizza-first DoughTools identity system.

The new app mark is an original top-down pizza illustration inside the DoughTools tomato-red badge style used by the current homepage:

- irregular handmade round shape
- visible crust/cornicione
- tomato-red center
- mozzarella patches
- a small number of pepperoni-style rounds
- visible char spots
- warm cream, red, orange and crust palette
- no text inside the icon
- no people, hands, third-party marks or external artwork

The icon was visually checked at `512`, `192`, `180`, `96`, `48`, `32` and `16` px. At favicon size the mark relies on the crust/tomato silhouette and a few large toppings rather than fine illustration detail.

## Assets Created or Replaced

| Path | Purpose | Dimensions / format | Size |
|---|---|---:|---:|
| `public/icon.svg` | canonical vector app/browser mark | SVG, 512 viewBox | 2,778 bytes |
| `public/favicon.svg` | explicit vector favicon | SVG, 512 viewBox | 2,778 bytes |
| `public/brand/doughtools-pizza-mark.svg` | master reusable pizza mark | SVG, 512 viewBox | 2,778 bytes |
| `public/favicon.ico` | broad browser favicon fallback | ICO, 16/32/48 | 7,798 bytes |
| `public/apple-touch-icon.png` | iOS home-screen icon | PNG, 180x180 | 26,096 bytes |
| `public/icons/icon-192.png` | Android/PWA icon | PNG, 192x192 | 28,365 bytes |
| `public/icons/icon-512.png` | Android/PWA icon | PNG, 512x512 | 79,412 bytes |
| `public/icons/maskable-512.png` | Android maskable icon | PNG, 512x512 | 73,094 bytes |
| `public/social/doughtools-og-v1.png` | global social preview | PNG, 1200x630 | 398,052 bytes |

No remote images, copied brand artwork, emoji or AI-generated people imagery were introduced.

## Icon Architecture

The canonical vector mark is `public/icon.svg`. `favicon.svg` and `brand/doughtools-pizza-mark.svg` intentionally use the same SVG content so the site does not have multiple competing icon identities.

Root metadata now exposes:

- `/favicon.ico`
- `/favicon.svg`
- `/icon.svg`
- `/apple-touch-icon.png`

The manifest now exposes:

- `/icons/icon-192.png`
- `/icons/icon-512.png`
- `/icons/maskable-512.png`
- `/icon.svg`

This fixes the Patch 476 finding that iOS and Android installation had to rely primarily on `/icon.svg`.

## Social Image Architecture

Global social metadata now uses:

```text
/social/doughtools-og-v1.png
```

The filename is versioned so a future social preview can be cache-busted by changing the path rather than reusing the old immutable `/opengraph-image` route.

The global Open Graph image is `1200x630` and uses:

- DoughTools wordmark text
- `Make better pizza with one clear plan.`
- `Choose your pizza, timing and oven. Get one clear recipe, shopping list, schedule and baking plan.`
- the new pizza badge
- the existing real homepage pizza photo from `public/images/homepage/doughtools-hero-desktop.webp`
- a cream and dark-green DoughTools card treatment matching the current homepage

The previous `app/opengraph-image.tsx` generated route was removed from canonical use and deleted.

## Metadata Changes

`lib/seo-config.ts` now defines shared constants:

- `SOCIAL_IMAGE_PATH`
- `SOCIAL_IMAGE_WIDTH`
- `SOCIAL_IMAGE_HEIGHT`
- `SOCIAL_IMAGE_ALT`

`metadataForRoute()` and legacy metadata use the shared social image constants. When `NEXT_PUBLIC_SITE_URL` is configured with a safe production URL, Open Graph and Twitter image URLs resolve to an absolute production URL.

Homepage metadata copy was tightened to:

```text
Choose your pizza, timing and oven. Get one clear recipe, shopping list, schedule and baking plan.
```

Route-specific social images remain deferred.

## Indexing Protection

Google indexing remains disabled. Patch 476A does not change `ALLOW_INDEXING`, robots launch protection, Search Console configuration or sitemap submission behavior.

The private/noindex route registry now explicitly includes:

- `/api`
- `/order`
- `/session/recipe`
- `/session/shopping`
- `/session/timeline`
- `/session/kitchen`
- `/session/review`

`next.config.ts` also applies explicit `X-Robots-Tag: noindex, nofollow, noarchive` headers for these private/workflow/token/API route classes when public indexing is eventually enabled.

Metadata-only noindex layouts were added for:

- `app/order/[publicToken]/layout.tsx`
- `app/session/recipe/layout.tsx`
- `app/session/shopping/layout.tsx`
- `app/session/timeline/layout.tsx`
- `app/session/kitchen/layout.tsx`
- `app/session/review/layout.tsx`

No public indexing was enabled.

## Documentation Updates

`docs/seo-indexation.md` was updated to match the current public route inventory and explicit private/noindex route classes.

`docs/install-app-pwa.md` was updated so it no longer describes 192/512 PNG icons as future work.

## Validation

Focused tests:

```text
npm test -- tests/metadata-identity-assets.test.ts tests/seo-config.test.ts tests/install-app-pwa.test.ts
```

Result: `3 passed`, `34 passed`.

Launch-safety tests:

```text
npm test -- tests/performance-baseline.test.ts tests/security-launch-baseline.test.ts
```

Result: `2 passed`, `15 passed`.

Lint:

```text
npm run lint
```

Result: passed.

Build:

```text
npm run build
```

Result: passed.

```text
git diff --check
```

Result: passed with line-ending normalization warnings only.

## Production Verification Plan

No deployment is part of Patch 476A. When this patch is merged and deployed later, verify:

- `/favicon.ico`
- `/favicon.svg`
- `/apple-touch-icon.png`
- `/icons/icon-192.png`
- `/icons/icon-512.png`
- `/icons/maskable-512.png`
- `/social/doughtools-og-v1.png`
- homepage Open Graph and Twitter metadata
- `/manifest.webmanifest`
- `robots.txt`
- `X-Robots-Tag`
- no cookie banner, analytics, Search Console or indexing change

WhatsApp may cache older previews. The production correctness check should verify the HTML metadata and the image URL first, then treat stale WhatsApp display as a platform cache issue only if production metadata is correct.
