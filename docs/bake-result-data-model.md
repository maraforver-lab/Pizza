# BakeResult data model

Patch 11 introduces a safe data-model foundation for future completed pizza bakes.

The future product loop is:

```text
calculate recipe → bake pizza → save bake result → add photo later → generate share card later → optionally publish a public setup later
```

This patch does not implement that visible workflow. It only adds versioned types, pure helpers, tests and documentation.

## Why BakeResult exists

Current DoughTools recipes describe a planned pizza. A completed bake needs a separate object because the final result may include what actually happened: oven behavior, timing, ratings, notes, future photo references and share-card choices.

`BakeResult` represents one completed bake.

## RecipeSnapshot immutability

`RecipeSnapshot` captures the recipe and calculated dough amounts at the moment of the bake.

It must not keep a live reference to the current calculator state. If the calculator changes later, the saved bake should still describe the original bake.

The helper `createRecipeSnapshot(...)` copies the current `RecipeSettings` and `RecipeIngredients` into a frozen snapshot.

## Snapshot responsibilities

- `RecipeSnapshot`: dough recipe, flour, fermentation, oven type and calculated ingredient amounts.
- `PreparationSnapshot`: optional sauce, cheese, topping and planner notes.
- `BakingSnapshot`: optional oven temperature, bake time, turn schedule and timer notes.
- `ResultSnapshot`: optional ratings, result notes, problem tags and future photo reference.
- `SharePreferences`: future share-card field visibility choices.

Preparation, baking and result snapshots are optional. A future UI can save a minimal bake first and add detail later.

## Schema versioning

`BakeResult` includes:

```text
schemaVersion: 1
```

The migration helper currently accepts the current schema version as a no-op and safely rejects malformed data or unknown future versions.

This avoids changing current saved recipes or journal entries.

## Private by default

`BakeResult.visibility` defaults to:

```text
private
```

Supported values are:

- `private`
- `unlisted`
- `public`

`unlisted` and `public` are future-ready only. Patch 11 does not create public routes, public pages or publishing behavior.

## Share-card support later

`SharePreferences` prepares for future share cards by allowing field-level choices such as hydration, fermentation, flour, bake time and rating visibility.

Defaults are conservative:

- core recipe context may be visible
- oven temperature, bake time and rating are hidden by default
- branding remains visible by default

No share-card UI or image generation is implemented in this patch.

## Privacy considerations

The model is private by default and does not write to Supabase, localStorage or IndexedDB in this patch.

Future photo support should store a reference rather than embedding large image data directly in `BakeResult`.

Future public bake pages must use immutable snapshots so that published or shared bakes do not change when the user edits a recipe later.

## What this patch does not implement

Patch 11 does not:

- change the current UI
- add a post-bake flow
- upload or store images
- generate share cards
- add public bake pages
- add Supabase tables
- change saved recipe storage
- change journal storage
- change IndexedDB version
- migrate existing user data
- change calculations
