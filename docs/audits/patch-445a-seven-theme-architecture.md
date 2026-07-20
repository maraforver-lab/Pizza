# Patch 445A: Seven-Theme Appearance Architecture

## Purpose

Patch 445A adds the secure administration foundation for public DoughTools appearance themes. It creates a fixed seven-theme registry, protected campaign storage, server-side active-theme resolution, admin-only management APIs, and a protected `/admin/appearance` workspace.

This patch intentionally ships foundation-level visual differentiation only. It does not finish the full artistic design for every seasonal theme.

## Seven Canonical Themes

The canonical IDs are exactly:

- `default`
- `valentine`
- `easter`
- `summer`
- `harvest`
- `halloween`
- `christmas`

The registry in `lib/public-themes.ts` is the single source for labels, descriptions, root classes, preview swatches, metadata theme color, validation, admin cards, and later visual-design work. Unknown IDs normalize to `default`.

## Preliminary Concepts

- Default: the current year-round DoughTools identity and fallback.
- Valentine: warm red with a restrained rose tint.
- Easter: light spring yellow with fresh green.
- Summer: sunlit warmth with a pale sky-blue accent.
- Harvest: warm orange, earthy brown, and restrained olive.
- Halloween: dark orange, restrained purple, and warm charcoal.
- Christmas: deep red, forest green, and warm cream.

All non-default themes are marked `foundation`. Default remains the canonical production design.

## Registry Design

The database stores only theme IDs and campaign timing. It does not store raw CSS, Tailwind classes, HTML, JavaScript, image URLs, audio URLs, or arbitrary JSON. All visual definitions remain version-controlled application code.

## Database Model

The migration `supabase/migrations/20260721120000_create_public_theme_campaigns.sql` creates `public.theme_campaigns`:

- `id`
- `theme_id`
- `enabled`
- `starts_at`
- `ends_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `version`

The check constraint allows only the seven canonical IDs. `ends_at` must be null or later than `starts_at`.

## RLS And Authorization

RLS is enabled on `public.theme_campaigns`. Direct table access is revoked from `public`, `anon`, and `authenticated`. Public users and basic users cannot select, insert, update, or delete campaign rows directly.

Admin APIs use the Patch 444B authoritative server guard. The migration also defines security-definer RPC helpers that re-check `current_user_is_admin()` before returning or mutating campaign data. The admin UI never exposes Auth rows, emails, private sessions, Party Orders, Review notes, photos, or Account preferences.

## Scheduling Semantics

Campaign times use `timestamptz`.

- start is inclusive
- end is exclusive
- null end means indefinite
- disabled campaigns do not apply
- future campaigns do not apply before start
- expired campaigns do not apply

Default is represented by absence of an active seasonal campaign. Activating Default disables enabled seasonal campaigns.

## Overlap Policy

Patch 445A prevents overlapping enabled non-default campaigns. Overlap returns a typed conflict so admin must disable, delete, or edit the conflicting campaign. No priority stack is introduced.

## Resolver And Cache

`getActivePublicTheme()` is the canonical server resolver. It calls a restricted `get_active_public_theme()` RPC that returns only the active theme ID, validates it through the registry, and falls back to Default on missing configuration, query failure, invalid IDs, future campaigns, expired campaigns, or disabled campaigns.

The resolver uses a short 60-second cache and `revalidateTag` invalidation after admin mutations. There is no cron job in this patch.

## Root Marker And CSS Variables

The active theme is applied server-side at the document root:

```html
<html data-public-theme="summer" class="theme-summer">
```

The foundation CSS layer changes safe variables only:

- page background
- surface tint
- muted surface
- border tint
- accent variables
- decorative background tint
- metadata theme color

It does not change layout, calculations, navigation, Pizza Session data, Kitchen progression, Bake Timer behavior, semantic errors, or focus behavior.

## Metadata Theme Color

`generateViewport()` reads the active public theme and returns its `themeColor`. Default preserves the previous DoughTools warm background color.

## Admin UI

`/admin/appearance` inherits the protected `/admin` layout. It shows:

- current public theme
- next scheduled campaign
- seven theme cards
- browser timezone label
- a schedule form
- compact campaign list

The Admin dashboard links to the Appearance workspace.

## Preview Isolation

Preview is local to the Admin page. It uses allowlisted theme IDs, displays a visible preview banner, and does not write campaigns, Account preferences, localStorage, or public configuration. It does not survive a full reload by design.

## UTC And Local Time

Admin enters local date/time values. The client converts them to ISO UTC before sending the API request. The UI displays campaign times in the browser timezone and labels that timezone explicitly.

## Stale Writes

Campaigns carry `version`. PATCH requests require the expected version, and successful updates increment `version`. Stale writes return `409`.

## Privacy Boundary

Theme administration manages public product configuration only. It does not add product UI or APIs for browsing private user content. Private-user RLS for Pizza Sessions, Account preferences, Party Orders, photos, and Review content is unchanged.

## Accessibility And Responsive Behavior

The admin page uses text labels in addition to color for status, real form labels, visible focus styles, readable cards, and mobile-stacked actions. Foundation themes avoid flashing, autoplaying animation, and layout changes. Reduced-motion behavior remains controlled by existing global rules.

## Production Rollout Order

Future rollout:

1. review migration
2. apply migration to Supabase
3. verify table and RLS
4. deploy matching application commit
5. sign in as admin
6. open `/admin/appearance`
7. preview every foundation theme
8. confirm preview is not public
9. activate one safe theme
10. verify public pages
11. return to Default
12. schedule a short test campaign
13. verify activation
14. verify expiry
15. remove the test campaign
16. confirm no private data exposure

Patch 445A does not apply the migration and does not deploy.

## Rollback

Application rollback returns the UI to the previous Default-only appearance. Database rollback can drop `theme_campaigns` and the theme RPC helpers after confirming no deployed app version depends on them. Activating Default is the safe product-level rollback for public appearance.

## Test Coverage

Patch 445A adds focused coverage for:

- exact seven-theme registry
- safe registry content
- migration constraints and RLS contract
- server resolver fallback behavior
- admin API authorization and validation source
- protected Appearance UI
- root theme marker and metadata theme color
- SEO exclusion for `/admin/appearance`
- privacy boundaries and out-of-scope user counts/sound themes

## Patch 445B Boundary

Patch 445B should be an audit/design specification only. It should define final palettes, contrast targets, root variables, header treatment, page background, card treatment, border treatment, motifs, icon usage, mobile behavior, desktop behavior, dense workflow behavior, homepage treatment, Kitchen treatment, Bake Timer treatment, Account/Admin treatment, and prohibited effects for each theme.

Patch 445A makes that possible without changing the campaign table, scheduling APIs, admin authorization, or active-theme resolver.

## Later Visual Patch Roadmap

- Patch 445B: seven-theme visual design audit
- Patch 445C: Valentine final design
- Patch 445D: Easter final design
- Patch 445E: Summer final design
- Patch 445F: Harvest final design
- Patch 445G: Halloween final design
- Patch 445H: Christmas final design
- Patch 445I: cross-theme consistency, contrast and responsive audit

## Patch 446 Sound-Theme Integration Point

The theme registry is deliberately separate from Bake Timer sound themes. Patch 446 can add sound-theme availability and user preferences without changing public theme campaign storage.
