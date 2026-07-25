# Patch 463B3: Promote refined Homepage

## Decision

Patch 463B3 promotes the existing `refined` Homepage presentation to the single live public Homepage. The `stable` and `simplified` implementations remain in code for comparison, preview and rollback.

## Final registry state

| ID | Name | Status | Role |
| --- | --- | --- | --- |
| `refined` | Refined homepage | `live` | Public Homepage rendered at `/`. |
| `simplified` | Simplified homepage | `draft` | Admin-only concept preview. |
| `stable` | Current homepage | `archived` | Previous production Homepage preserved as rollback. |

Exactly one version is live. Draft and archived versions are previewable only through the protected Admin preview route.

## Public rendering behavior

Public `/` resolves the registered live Homepage on the server and renders `HomepageRefined` in the initial page output. There is no public version selector, query switching, cookie switching, local storage switching or guidance-level-based Homepage switching.

The public Homepage must not expose draft version IDs, Admin metadata or preview links.

## Safe fallback

The version resolver keeps `stable` as the safe fallback if the registry ever fails to resolve exactly one valid live version. The fallback must never select a draft version and must never leave the public Homepage empty.

## Admin behavior

The protected Admin Homepage versions list displays all three versions in product order:

1. `LIVE` - Refined homepage
2. `DRAFT` - Simplified homepage
3. `ARCHIVED` - Current homepage

Preview remains the only available action. Publish, Restore, Retire, Delete, Edit and Duplicate remain deferred.

## Preview, sitemap and indexing

All Homepage previews remain under the existing Admin-only route. Preview pages stay `noindex, nofollow` and are absent from sitemap, public navigation and footer discovery. The public Homepage canonical remains the root URL.

## Rollback procedure

Rollback should be a small code patch:

1. Change `stable` back to `live`.
2. Change `refined` to `archived` or `draft`, depending on the product decision.
3. Keep exactly one live version.
4. Run the focused Homepage registry, public route, Admin preview, sitemap and build checks.
5. Deploy the resulting commit.

Do not introduce runtime switching or a database flag as part of emergency rollback unless a separate architecture patch approves it.

## Deferred SEO audit

After the public Homepage has been observed in production, run a separate SEO/indexing review before changing any indexing policy. This patch does not enable indexing or submit sitemap changes.

## Product logic protection

This promotion does not change Pizza Plan, session workflow, recipe generation, calculations, formulas, defaults, validation ranges, Quick Calculator, Guides, Shopping, Timeline, Kitchen Mode, Review, Bake Timer, APIs, database, migrations, header, navigation or footer.
