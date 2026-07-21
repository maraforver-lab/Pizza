# Patch 446D: Account Bake Timer Sound Preference

## Account Placement

Patch 446D adds a signed-in Account card:

`Bake Timer sound`

It appears with the other Account support tools and is not rendered for signed-out users.

## Preference And Fallback

The preference chooses the sound theme used by newly opened Bake Timers. Running timers keep their own local runtime state and can still be muted separately.

The resolver remains:

```text
user preference -> product default -> Classic
```

No saved preference is shown as `Use DoughTools default`. If a previously saved theme is disabled globally, it is no longer selectable and the card clearly explains that new timers will use the current DoughTools default until another theme is chosen.

## Preview Lifecycle

The Account card reuses the shared Patch 446B Web Audio helper:

- preview starts only from a click or tap
- one preview can play at a time
- another preview stops the previous one
- `Stop preview` is available
- preview stops on unmount/navigation
- preview does not save preferences
- preview does not create a Timer or Pizza Session
- preview does not change runtime mute

Unsupported audio fails safely through the shared helper.

## Stale-Write Handling

Saving sends only:

- `bakeTimerSoundTheme`
- `knownUpdatedAt`

The Account preferences API preserves unrelated preferences, including early Kitchen completion. A stale `409` response reloads the latest preferences and sound configuration instead of overwriting newer Account data.

## Signed-Out Behavior

Signed-out Account access remains unchanged. The preference editor is inside the existing signed-in Account workspace.

## Validation

Patch tests cover:

- Account placement
- signed-out exclusion by placement
- enabled production themes only
- deferred themes excluded
- default/fallback copy
- disabled saved preference messaging
- shared preview helper and cleanup
- partial preference save preserving unrelated settings
- stale reload behavior
- responsive card layout without a wide table

## Patch 446E Integration Point

Patch 446E can wire the saved effective sound theme into newly opened Kitchen and standalone Bake Timers. It should use the existing resolver and keep runtime sound on/off separate from the saved Account preference.
