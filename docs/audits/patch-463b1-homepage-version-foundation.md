# Patch 463B1: Homepage version foundation

## Why this foundation exists

Patch 463A found that the current Homepage is strong but too long for a first-time user. The next Homepage work needs a safe way to build and preview an alternative UX/UI version without risking the current public Homepage.

This patch creates that foundation only. It does not redesign the Homepage, publish a new version, or change Pizza Plan behavior.

## Product model

Homepage versions are code-based presentation components. They are maintained by developers, reviewed in code, tested in the repository and deployed with the application.

They are not:

- a CMS
- a page builder
- a visual editor
- arbitrary Admin-authored content
- a database-driven Homepage system
- a feature-flag service

This keeps the Homepage tied to the same design system, responsive rules, accessibility rules and test workflow as the rest of DoughTools.

## Initial version

The registry contains one version:

| Field | Value |
| --- | --- |
| ID | `stable` |
| Name | `Current homepage` |
| Status | `live` |
| Description | `The existing production Homepage.` |
| Preview available | yes |

The extracted component is `HomepageStable`. It is the current public Homepage presentation moved into a named stable component without visual redesign.

## Registry architecture

The canonical registry lives in `lib/homepage-versions.tsx`.

It provides:

- a strict allowlist of Homepage version IDs
- a typed `HomepageVersionId` union
- one registered component per version
- lifecycle metadata
- preview availability metadata
- safe lookup for preview routes
- an invariant that exactly one version is `live`

Unknown IDs return `null` through registry lookup. They do not dynamically import, render arbitrary files or fall back silently in Admin preview.

## Public rendering behavior

The public route `/` remains the only public Homepage route. It still preserves the existing calculator query behavior, then renders the registered live `stable` version through the shared renderer.

The public route does not choose a Homepage version from:

- local storage
- cookies
- URL query parameters
- guidance-level preference
- account preference
- browser state
- database state

No public version selector is rendered.

## Admin tools location

The existing `/admin` page now includes a compact `Homepage versions` section.

It shows:

- `Homepage versions`
- `1 version`
- `LIVE`
- `Current homepage`
- `The existing production Homepage.`
- a single `Preview` link

It also explains:

`Preview and manage Homepage presentation versions without changing Pizza Plan or calculation logic.`

The section does not show inactive actions such as Publish, Restore, Retire, Delete, Duplicate or Edit.

## Admin-only preview behavior

The preview route is:

`/admin/homepage-preview/[version]`

It is protected by the existing `/admin` layout, which calls the canonical `requireAdmin()` guard. No second admin-role system was introduced.

The preview:

- accepts only allowlisted version IDs
- renders only registered Homepage components
- rejects unknown IDs with the normal not-found behavior
- shows a banner above the previewed Homepage
- identifies the version name and status
- links back to the Homepage versions area
- never changes the public live Homepage

The banner text is:

`Admin preview — not the public Homepage`

The banner is outside `HomepageStable`, so the stable component remains representative of the public design.

## Authorization behavior

Admin authorization remains unchanged:

- unauthenticated users are redirected through the existing admin guard
- non-admin users receive the existing not-found behavior
- unauthorized users do not receive registry metadata from the preview route
- the Account admin entry remains visible only after the existing admin-status check confirms the admin role

## Indexing protection

The preview route is under `/admin`, which is private and absent from public discovery. The route also exports noindex metadata.

The preview is:

- `noindex`
- `nofollow`
- absent from sitemap entries
- absent from global navigation
- absent from footer links
- absent from Guide navigation
- inaccessible without Admin authorization

The public Homepage canonical URL remains:

`https://www.doughtools.app/`

No version-specific public canonical URL was introduced.

## Safe unknown-ID behavior

Unknown version IDs are rejected through the registry lookup:

- `isHomepageVersionId("stable")` is true
- non-allowlisted strings are false
- `getHomepageVersion("unknown")` returns `null`
- the Admin preview route calls `notFound()` for unknown or unavailable versions

Unknown preview IDs do not render the stable Homepage silently.

## Deferred to Patch 463B2

Patch 463B2 should create the simplified Homepage V2 as a code component and register it as a draft.

Expected scope:

- new `HomepageV2` presentation component
- draft registry entry
- approved Make/Learn UX/UI
- stable remains live
- admin preview can show the draft

Out of scope for 463B2:

- publishing
- restoring
- retiring
- database-backed switching
- Pizza Plan logic

## Deferred to Patch 463B3

Patch 463B3 should add controlled publishing and restoration.

Expected scope:

- safe live-version persistence
- Publish
- Restore
- Retire
- validation that switching does not require code changes to Pizza Plan
- rollback path to stable

Out of scope for 463B3:

- arbitrary page editing
- visual content editor
- open-ended CMS features

## Future retire and cleanup model

After a Homepage version is retired and no longer needed, a future cleanup patch may physically remove:

- retired component files
- tests specific only to the retired version
- assets used only by the retired version
- obsolete registry entries

This should happen only after a version is no longer needed for rollback.

## Logic untouched

This foundation does not change:

- Pizza Plan
- `/session/start`
- `/session/recipe`
- recipe generation
- dough, sauce, topping or oven calculations
- Quick Calculator
- formulas
- defaults
- validation ranges
- session persistence
- cloud synchronization
- Shopping
- Timeline
- Kitchen
- Review
- Bake Timer
- account data
- authentication architecture
- authorization rules
- APIs
- database
- migrations

The public Homepage presentation remains the extracted `stable` version.
