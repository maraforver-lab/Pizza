# Patch 443: Standalone Bake Timer

## 1. Purpose

Patch 443 makes the mature full-screen Bake Timer available as an independent tool. The user can time one pizza without creating, opening or mutating a Pizza Session.

## 2. Mobile Menu Integration

The mobile Tools section now lists:

1. Bake timer -> `/tools/bake-timer`
2. Quick dough calculator -> `/calculator/quick`

The Bake timer item uses the copy:

- Bake timer
- Time one pizza without starting a Pizza Session.

The link is mobile-only in the global header. Desktop navigation remains unchanged.

## 3. Standalone Route

New route:

- `/tools/bake-timer`

The route renders a standalone tool page with the global site header and canonical footer. It does not require authentication, does not resolve an active Pizza Session and does not redirect to Session Start.

## 4. Oven Selection

The standalone page first shows two oven choices:

- Pizza oven: 1 min 30 sec
- Home oven: 5 min

Both defaults come from `getPizzaSessionBakeProfile(...)`, the same bake-profile source used by Kitchen. The standalone page does not define a second bake-duration model.

## 5. Shared Timer Architecture

`components/session/KitchenBakeTimerPanel.tsx` now exports:

- `BakeTimerPanel`: shared full-screen timer and launcher implementation
- `KitchenBakeTimerPanel`: Kitchen wrapper that supplies the Kitchen session storage key

The shared implementation still uses:

- `lib/bake-timer.ts`
- `lib/use-bake-timer.ts`
- current sound cue scheduling
- current phase and overtime logic
- current reduced-motion classes

No duplicate timer state machine, sound scheduler, progress ring or overtime control was added.

## 6. Kitchen Versus Standalone Contexts

Kitchen context:

- Supplies `storageKey={kitchenBakeTimerStorageKey(sessionId)}`
- Preserves the existing Bake-step launcher
- Preserves the Review CTA outside the timer
- Preserves no automatic Kitchen completion
- Preserves no per-second cloud/session writes

Standalone context:

- Uses `BakeTimerPanel` with no `storageKey`
- Opens the timer immediately after oven selection
- Closes back to the oven-selection page
- Does not render `Done baking? Review session`
- Does not render Kitchen completion controls
- Does not import active-session, cloud or Pizza Session storage helpers

## 7. Local-Only State Guarantee

Runtime timer state is local to the mounted component when used standalone. The standalone timer does not write to:

- PizzaSession
- active-session pointer
- Timeline
- stepRuntime
- Account preferences
- Supabase
- cloud save queue
- Party Orders

The existing sound on/off preference remains the only shared local UI preference from the existing timer system.

## 8. Sound And Visual Behavior

The standalone route reuses the existing Patch 440/441 behavior:

- normal periodic cues
- final-20 and final-10 urgency
- stronger final 3-2-1 cadence
- expiry sound
- continuous overtime pulse
- flame icon in overtime
- recurring overtime alarm
- sound toggle
- Stop alarm
- Start next pizza

No sound themes or external audio files were added.

## 9. Accessibility

Oven choices are real buttons with clear names and visible focus rings. The timer remains a modal dialog with:

- accessible dialog name and description
- focus movement into the dialog
- Escape close behavior
- focus trapping
- close and sound controls with accessible labels
- reduced-motion support

Closing the standalone timer returns focus to the selected oven option.

## 10. Patch 442 Extension Point

Patch 442 added the mobile Tools extension point before Quick dough calculator. Patch 443 uses that placement and keeps the Tools structure stable for future additions.

## 11. Future Sound-Theme Extension Point

The standalone route does not add sound themes. The shared `BakeTimerPanel` keeps sound behavior centralized through `useBakeTimer`, so a future sound-theme input can be added at the hook/component boundary without rebuilding the standalone page.

## 12. Test Coverage

Coverage was added for:

- mobile Tools ordering
- standalone route and metadata
- no auth/session/cloud dependency in the standalone tool
- canonical Pizza oven and Home oven defaults
- shared Kitchen/standalone timer architecture
- timer pause/resume, adjustments, final-ten, overtime, alarm stop and next-pizza behavior
- SEO route registration
- Patch 442 navigation regression

## 13. Migration

No database migration is required. No Supabase schema, RLS, auth, cloud persistence or Pizza Session schema changes were made.
