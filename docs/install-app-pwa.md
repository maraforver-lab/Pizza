# Install DoughTools / Add to Home Screen

Patch 30 adds a small install experience for DoughTools.

The goal is practical: make DoughTools easier to reopen while planning, baking and reviewing a pizza session. It does not turn the site into a native app, and it does not change how recipes or bake results are stored.

## What this feature does

- Provides a visible install/add-to-home-screen card on the homepage.
- Provides the same local-device guidance on the Account page.
- Uses the browser-supported `beforeinstallprompt` event where available.
- Shows an `Install DoughTools` button only when the browser exposes an install prompt.
- Shows manual instructions for iOS/iPadOS and unsupported browsers:
  - Open the page in the browser.
  - Tap Share.
  - Choose Add to Home Screen.
- Detects standalone/app display mode so the card does not keep asking when the site is already running like an installed app.
- Keeps the existing local-first product framing.

## What this feature does not do

- No offline mode is added.
- No service worker is added.
- No push notifications are added.
- No analytics, tracking, cookies or install-choice telemetry are added.
- No cloud sync is added.
- No Supabase schema or account behavior changes are added.
- No Google indexing is enabled.
- No Search Console verification or sitemap submission behavior is added.

## Manifest status

DoughTools uses the Next.js App Router manifest at:

- `app/manifest.ts`

Important manifest fields:

- `name`: `DoughTools`
- `short_name`: `DoughTools`
- `description`: `Practical pizza-making workspace for dough, planning, baking and improvement.`
- `start_url`: `/`
- `scope`: `/`
- `display`: `standalone`
- `background_color`: `#f6f3ea`
- `theme_color`: `#f6f3ea`

## Icon status

Patch 30 keeps the existing project-owned icon:

- `public/icon.svg`

This is enough for a conservative manifest foundation. Future polish can add dedicated 192×192 and 512×512 PNG icons and platform-specific screenshots, but that is intentionally not part of this patch.

## Browser behavior

Chromium-based browsers may expose a browser install prompt through `beforeinstallprompt`. DoughTools can only show the install button when the browser provides that event.

iOS/iPadOS and unsupported browsers may not provide a JavaScript install prompt. In those cases DoughTools shows manual home-screen instructions instead.

## Privacy and launch safety

The install feature is local UI only. It does not send install choices anywhere and does not change recipe, saved bake, journal, account or Supabase behavior.

Google indexing remains disabled by the existing pre-launch configuration until the project owner explicitly decides otherwise.

## Future work

Possible future improvements:

- richer 192×192 and 512×512 app icons
- optional screenshots for install surfaces
- optional service-worker/offline fallback after a separate safety review
- session autosave integration
- smarter install prompt timing after the user completes a useful action

