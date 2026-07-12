# Patch 309: Home oven behavior audit

Audit baseline: `master` at `4aa28a1256b0db51f71eb87cc100294b584f1652`

Audit branch: `patch/309-home-oven-behavior-audit`

Scope: audit-only. No production behavior was changed. The only code-adjacent change is an audit regression test file that locks the current Home oven behavior so follow-up patches can change it intentionally.

## Executive summary

Home oven selection is stored and preserved correctly through the Pizza Session model, local persistence, cloud restore, recipe generation and Timeline invalidation signature.

The main issue is not lost state. The issue is uneven use of the state:

- Recipe / Dough Plan uses Home oven meaningfully.
- Planning Engine receives `home_oven` and uses it for flour, hydration and broad bake guidance.
- Timeline generation includes `ovenType` in its stale-timeline signature, but the actual service steps still use generic fixed timing.
- Kitchen Mode uses generic preheat and bake copy for both Home oven and Pizza oven.
- Completed-session photo overlay uses a separate hard-coded bake label: Home oven = `5 MIN`, Pizza oven = `90 SEC`.
- Shopping and Review mostly do not surface oven-specific guidance beyond generic oven-related options.

The minimal implementation path for Patch 310 should be to centralize a small Pizza Session bake profile and make Timeline, Kitchen Mode, Review/history/overlay, and any optional shopping equipment guidance read from that single profile.

## Current code state

- Branch during audit: `patch/309-home-oven-behavior-audit`
- Baseline commit: `4aa28a1256b0db51f71eb87cc100294b584f1652`
- Patch 308 was present on the baseline.
- Working tree before audit edits: clean.
- Production source changes in this patch: none.

## Home oven data model and storage path

### Session start

Source: `app/session/start/page.tsx`

The Pizza Session setup UI uses a separate presentation value and stored oven value:

- User-visible style: `home-oven`
- Stored session oven type: `home`
- Pizza oven style: `pizza-oven`
- Stored pizza oven type: `gas`
- Pan/tray support still exists internally as `pan-tray` / `pan`

The start-page mapping is:

```ts
const ovenType = value === "pizza-oven" ? "gas" : value === "pan-tray" ? "pan" : "home";
```

Home oven also receives the current default dough-ball draft of `270 g`; Pizza oven receives `260 g`; Pan/tray receives `650 g`.

### Pizza Session persistence

Sources:

- `lib/pizza-session.ts`
- `lib/pizza-session-storage.ts`
- `lib/cloud-pizza-sessions.ts`
- `lib/cloud-pizza-session-restore.ts`

`PizzaSession` stores:

- `pizzaStyle?: string`
- `ovenType?: string`
- `recipeSnapshot?.oven?: string`
- `recipeSnapshot?.pizzaStyle?: string`

Local persistence stores the full migrated session JSON. Cloud persistence stores the full session under `session_data`, normalizes it through `migratePizzaSession(...)`, and restores it locally through `restoreCloudPizzaSessionToLocal(...)`.

Confirmed behavior:

- Home oven sessions preserve `pizzaStyle: "home-oven"`.
- Home oven sessions preserve `ovenType: "home"`.
- Migration preserves those fields.
- Cloud row normalization and restore use the migrated full session, so Home oven state is preserved there too.

Practical risk: `PizzaSession.ovenType` is currently a loose string, not a closed union. Unexpected values are preserved and later treated as Home oven in Recipe because Recipe only checks for `gas` / `pizza-oven` and otherwise falls back to `home`.

## Recipe / Dough Plan behavior

Source: `lib/session-recipe.ts`

`recipeSettingsFromSession(...)` is the key Pizza Session recipe adapter.

For Home oven:

- `isPizzaOven = false`
- `ovenType = "home"`
- default dough-ball weight = `270 g`
- default fermentation = `24h-cold`
- default hydration = `64%`
- planning oven type = `home_oven`
- `recipeSnapshot.oven = "home"`

For Pizza oven:

- `isPizzaOven = true`
- `ovenType = "gas"`
- default dough-ball weight = `260 g`
- default fermentation = `12h-room`
- default hydration = `64%`
- planning oven type = `pizza_oven`
- `recipeSnapshot.oven = "gas"`

For Pan/tray:

- `isPan = true`
- recipe engine still uses saved-recipes oven type `home`
- default dough-ball weight = `650 g`
- default hydration = `75%`
- default fermentation = `48h-cold`
- `recipeSnapshot.oven = "home"`

Confirmed issue: Home oven does affect recipe defaults, but there is no downstream bake-profile object that carries the Home oven implications into Timeline/Kitchen/Review/overlay consistently.

Additional note: when `pizzaPreset` maps to `neapolitan`, Home oven can still produce `recipeSnapshot.pizzaStyle = "neapolitan"`. That may be intentional because the preset is a pizza type, but it can be confusing because the same session also says `pizzaStyle: "home-oven"`.

## Planning Engine behavior

Sources:

- `lib/planning-types.ts`
- `lib/planning-engine.ts`
- `lib/planning-fermentation-timeline.ts`
- `lib/planning-formula-fit-guidance.ts`
- `lib/planning-flour-guidance.ts`
- `lib/planning-available-flour-recommendation.ts`

The Planning Engine has its own closed oven union:

```ts
type OvenType = "home_oven" | "pizza_oven";
```

Pizza Session maps saved-recipes `home` to Planning Engine `home_oven`, and `gas` to `pizza_oven`.

Home oven currently affects:

- beginner-safe flour category defaults;
- recommended flour scoring;
- hydration guidance;
- flour compatibility guidance;
- formula fit guidance;
- broad bake instruction in the planning fermentation timeline.

`lib/planning-fermentation-timeline.ts` has the clearest bake distinction:

- Pizza oven bake duration: `2` minutes
- Home oven bake duration: `8` minutes
- Home oven instruction: “Bake when the oven is fully preheated and the dough is ready.”

Confirmed issue: this Planning Engine bake distinction is not the source used by the Pizza Session Timeline cards or Kitchen Mode service steps.

## Timeline behavior

Sources:

- `lib/pizza-session-timeline.ts`
- `lib/pizza-session-timeline-display.ts`
- `app/session/timeline/page.tsx`
- `tests/pizza-session-timeline.test.ts`

### Timeline invalidation

`buildPizzaSessionTimelineInputSignature(...)` includes:

- `ovenType`
- `pizzaStyle`
- `pizzaPreset`

This means changing Home oven vs Pizza oven should invalidate stale persisted Timeline snapshots.

### Timeline scheduling

Timeline service steps are fixed-template:

- `preheat-oven`: template offset `-60` min from target
- `prepare-sauce-toppings`: template offset `-45` min from target
- `bake-pizza`: template offset `-10` min from target, rounded by 15-minute Timeline increments to `-15` min in the tested baseline
- `review-result`: `+20` min from target

For same-day display adjustment, `pizza-session-timeline-display.ts` can show:

- `preheat-oven`: safe target −60 min
- `bake-pizza`: target time
- `review-result`: target +20 min

So there is already a distinction between raw generated Timeline timing and adjusted display timing.

Confirmed issue: Home oven and Pizza oven receive the same Timeline preheat and bake offsets in the active Pizza Session Timeline. Home oven does not get a longer bake window, different prep warning, or stone/steel/tray-specific timing from the selected oven type.

Confirmed non-issue: the Timeline does not ignore Home oven when deciding whether a stale Timeline should be regenerated; it includes oven type in the signature.

## Kitchen Mode behavior

Source: `lib/pizza-session-kitchen.ts`

Kitchen Mode currently uses step ID and Timeline state. It does not branch preheat or bake instructions by `session.ovenType`.

Current generic service copy includes:

- Preheat: “Preheat the oven, stone, steel or pizza oven before opening the dough.”
- Bake: “Open, top and bake one pizza at a time. Watch color and rotate if needed.”
- Preheat done condition: “The oven and baking surface are fully hot before opening the pizza.”
- Bake done condition: “The rim is browned, the bottom is baked, and the cheese is melted.”

Confirmed issue: Kitchen Mode has useful general copy, but it cannot tell a Home oven user about stone/steel/tray heat soak, broiler/top heat balance, longer bake windows, or topping restraint in a targeted way. The copy is deliberately generic for all ovens.

## Shopping behavior

Source: `lib/pizza-session-shopping-list.ts`

The shopping helper has a `Gear` group, but current searched source did not show Home oven-specific additions such as stone, steel, tray, parchment, peel, or pan equipment. The list is mainly ingredient-driven.

Finding: if Home oven flow is expected to guide equipment, Shopping currently does not do it. This should be treated as a product decision for Patch 310 or later, not a bug unless Home oven setup promises that equipment will be listed.

## Review and completed-session behavior

Sources:

- `app/session/review/page.tsx`
- `lib/cloud-pizza-sessions.ts`

Review includes generic oven-related learning options:

- “Good oven spring”
- “Hotter oven”
- free-note placeholder mentions “oven heat”

Completed-session summaries show target bake/eat time through `cloudPizzaSessionBakeTimeSummary(...)`, but they do not show the selected oven type or a recommended bake duration.

Finding: Review lets the user write oven learnings, but the selected Home oven context is not shown as structured metadata in review/history summaries.

## Photo overlay / export behavior

Sources:

- `lib/pizza-photo-overlay.ts`
- `components/account/PizzaPhotoOverlayGenerator.tsx`
- `tests/cloud-pizza-sessions.test.ts`

`buildPizzaPhotoOverlayModel(...)` uses its own bake-time helper:

- `gas` / `pizza_oven` → `90 SEC`
- `home` / `home_oven` → `5 MIN`
- `pan` → omitted

Confirmed issue: this is a separate hard-coded bake source that does not match all existing bake guidance:

- `lib/baking.ts` says Home balanced is `6–9 min`.
- `lib/pizza-styles.ts` says New York is `5–8 min`, Roman thin is `4–7 min`, Detroit is `12–16 min`, Sicilian is `14–18 min`.
- Planning fermentation timeline uses Home oven `8` minutes and Pizza oven `2` minutes.
- Pizza Session Timeline schedules bake as a service step rather than a duration.

Additional issue: `PizzaPhotoOverlayGenerator` renders `model.fields.slice(0, 5)`. Since `BAKE` is the sixth possible field after hydration, fermentation, fridge, room and flour, the overlay model can contain `BAKE` while the rendered image may drop it when five earlier fields exist.

## Existing bake recommendation sources

There are at least four separate bake-time/bake-guidance sources:

1. `lib/baking.ts`
   - Home balanced: `250 °C`, `6–9 min`
   - Home pan: `240 °C`, `14–18 min`
   - Gas balanced: `450 °C`, `60–90 s`

2. `lib/pizza-styles.ts`
   - Style-specific bake strings, e.g. New York `260–300 °C · 5–8 min`, Detroit `230–260 °C · 12–16 min`

3. `lib/planning-fermentation-timeline.ts`
   - Home oven broad bake duration `8` min
   - Pizza oven broad bake duration `2` min

4. `lib/pizza-photo-overlay.ts`
   - Home `5 MIN`
   - Pizza oven `90 SEC`

Pizza Session Timeline/Kitchen do not currently consume one shared source for these values.

## Behavior matrix

| Area | Home oven behavior | Pizza oven behavior | Source | Finding |
| --- | --- | --- | --- | --- |
| Setup | `home-oven` maps to `ovenType: "home"` | `pizza-oven` maps to `ovenType: "gas"` | `app/session/start/page.tsx` | Works |
| Local persistence | Preserves `pizzaStyle` and `ovenType` | Preserves `pizzaStyle` and `ovenType` | `lib/pizza-session-storage.ts` | Works |
| Cloud restore | Restores full migrated `session_data` | Restores full migrated `session_data` | `lib/cloud-pizza-session-restore.ts` | Works |
| Recipe | 270 g, 24h cold, home planning input | 260 g, 12h room, pizza oven planning input | `lib/session-recipe.ts` | Works, but defaults are hidden downstream |
| Planning Engine | Uses `home_oven` in flour/formula/bake guidance | Uses `pizza_oven` | planning modules | Works |
| Shopping | No clear Home oven equipment additions | No clear pizza oven gear additions | `lib/pizza-session-shopping-list.ts` | Potential product gap |
| Timeline | Fixed service timings | Same fixed service timings | `lib/pizza-session-timeline.ts` | Confirmed gap |
| Kitchen Mode | Generic oven copy | Same generic copy | `lib/pizza-session-kitchen.ts` | Confirmed gap |
| Review | Generic oven feedback chips | Same generic chips | `app/session/review/page.tsx` | Potential metadata gap |
| Account history | Shows bake/eat time, not oven type | Same | `lib/cloud-pizza-sessions.ts` | Potential metadata gap |
| Photo overlay | Hard-coded `5 MIN` | Hard-coded `90 SEC` | `lib/pizza-photo-overlay.ts` | Confirmed inconsistent source |

## Confirmed defects and improvement opportunities

### High: Pizza Session service timing does not reflect Home oven vs Pizza oven

The selected oven changes recipe defaults and Planning Engine guidance, but Timeline and Kitchen Mode use generic service timing/copy for preheat and bake.

User impact: a Home oven user can receive the same final service schedule as a Pizza oven user, even though home-oven baking typically needs longer heat-soak/bake considerations.

Minimal recommendation: introduce a shared session bake profile and use it in Timeline/Kitchen copy and duration labels.

### High: Overlay bake time is hard-coded separately

Home oven overlay says `5 MIN`; Pizza oven overlay says `90 SEC`. This bypasses other bake guidance sources and does not support pan.

User impact: completed-session share images can show a bake value that does not match the selected style or Session guidance.

Minimal recommendation: replace overlay helper with the shared session bake profile.

### Medium: `PizzaSession.ovenType` is not normalized as a closed union

Unexpected oven values persist and later fall through to Home oven in Recipe.

User impact: legacy or malformed sessions can look valid while silently using Home oven behavior.

Minimal recommendation: add a narrow normalizer/helper for Pizza Session oven presentation. Avoid broad migration unless necessary.

### Medium: There are multiple bake recommendation sources

`lib/baking.ts`, `lib/pizza-styles.ts`, Planning Engine and overlay each define bake guidance separately.

User impact: future UI can drift unless a Session-level source chooses the right value for context.

Minimal recommendation: do not delete the old calculator sources yet, but add a Pizza Session-specific bake profile for session surfaces.

### Medium: Review/history do not show selected oven context as structured data

Review asks about oven learnings but does not display Home oven vs Pizza oven in its structured summary.

User impact: completed bakes are harder to compare by oven setup.

Minimal recommendation: surface selected oven type and optional bake-profile label in completed-session detail/history if product approves.

### Low/Medium: Shopping does not list Home oven equipment

Home oven setup copy mentions tray, stone or steel. Shopping currently appears ingredient-focused.

User impact: beginner Home oven users may not realize equipment matters until Timeline/Kitchen.

Minimal recommendation: treat as optional; add equipment only if Shopping is intended to include non-food gear.

### Low: Overlay can compute `BAKE` but render only first five fields

`model.fields.slice(0, 5)` can drop the `BAKE` field if five earlier fields exist.

User impact: bake value may be missing from share image even when the model contains it.

Minimal recommendation: choose fields by priority instead of raw first-five order.

## Recommended Patch 310 plan

Create a small shared helper, for example `lib/pizza-session-baking-profile.ts`, that accepts a Pizza Session or a normalized session oven/style view and returns:

- normalized oven kind: `home`, `pizza_oven`, `pan`, `unknown`
- user-facing label: `Home oven`, `Pizza oven`, `Pan / tray`
- preheat guidance
- bake duration label
- optional bake temperature label
- topping/moisture caution
- equipment note
- overlay bake label

Then use that helper in:

1. `lib/pizza-session-timeline.ts`
   - Keep step order and completion logic unchanged.
   - Add oven-specific helper copy and duration label if approved.
   - Only change actual schedule offsets if product decides Home oven should schedule a different bake/preheat window.

2. `lib/pizza-session-kitchen.ts`
   - Use oven-specific preheat and bake guidance.
   - Preserve early-start guard and completion behavior.

3. `lib/pizza-photo-overlay.ts`
   - Replace hard-coded `5 MIN` / `90 SEC` with the shared overlay label.
   - Decide pan behavior explicitly.

4. `lib/cloud-pizza-sessions.ts` / account detail UI
   - Optionally show selected oven type in completed-session detail.

5. `lib/pizza-session-shopping-list.ts`
   - Optionally add Home oven gear guidance if Shopping should include equipment.

6. Tests
   - Home oven timeline/kitchen copy.
   - Pizza oven copy remains high-heat.
   - Pan/tray behavior if still supported.
   - Overlay bake label uses the same source as session profile.
   - Invalid oven type falls back safely.
   - No formula/session completion behavior changes.

## Open product decisions before implementation

1. Should Home oven Timeline actually schedule bake earlier/longer, or only explain that the bake takes longer?
2. Should `targetEatTime` mean eating time, bake start, or serving target? Current code uses it as target for Timeline service steps with bake near target.
3. Should Home oven include a stone/steel/tray choice, or remain one broad Home oven bucket?
4. Should pan/tray be restored as a visible session-start path or remain internal/legacy?
5. Should completed-session overlays show one short bake label or style-specific range?

## Audit test coverage added

Added `tests/home-oven-behavior-audit.test.ts` to lock current audited behavior:

- Home oven selection persists and migrates.
- Home oven recipe defaults differ from Pizza oven defaults.
- Timeline preheat/bake offsets are currently generic across Home/Pizza oven.
- Kitchen Mode oven service copy is currently generic.
- Overlay Home oven bake time is currently hard-coded as `5 MIN`.

These tests are intentionally audit anchors, not feature implementation tests.
