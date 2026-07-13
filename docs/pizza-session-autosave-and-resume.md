# Pizza Session autosave and resume

Pizza Session persistence is local-first from the moment the user explicitly creates a plan.

## Explicit creation event

A Pizza Session draft is stored only after an explicit creation action, currently the final `Create my pizza plan` setup action on `/session/start`, or an explicit Party Orders handoff.

Opening `/session/start` without an active session renders the normal planning form with an in-memory draft. It must not create an empty ghost session, active session ID or cloud record.

## Local-first principle

The browser-local session is the operational source for the current device.

When the plan is explicitly created, DoughTools stores:

- one stable Pizza Session ID
- draft/planning status
- created, updated and saved timestamps
- the current setup step
- the last safe Session route
- available setup values
- the existing session schema version

Setup changes for an already active plan are saved through the existing Pizza Session storage helpers. Setup choices made before the explicit creation action stay in memory until the plan is created.

## Cloud mirror for signed-in users

After the local save succeeds, authenticated users mirror the same Pizza Session payload to the cloud using the existing active-session API.

The Supabase row has its own row ID, but the stable Pizza Session identity remains `session_data.id` and matches the local session ID. The local cloud marker stores the relationship between the local session ID and the cloud row ID.

Cloud save failure never blocks the local workflow. The user can continue planning from the local draft.

## Progress route and resume

Each setup step stores a safe `lastRoute`, such as:

- `/session/start?step=path`
- `/session/start?step=preset`
- `/session/start?step=time`
- `/session/start?step=quantity`
- `/session/start?step=flour`
- `/session/recipe`

Resume links use only an allowlisted Session route. Invalid or missing routes fall back to the existing step-based continuation behavior.

## Existing active sessions

If an active local session exists, `/session/start` resumes that session instead of creating a new one.

Starting a genuinely new plan while another plan is active still requires an explicit replace choice. The current one-active-session product model is preserved.

## Local/cloud conflicts

When the same signed-in user has a local active session and a different cloud active session, DoughTools does not silently choose or overwrite either plan.

The user must choose between:

- continuing this device’s plan
- continuing the cloud plan

The cloud API also rejects an immediate save if it would overwrite a different active session in the account.

## Offline and retry behavior

Offline or failed cloud writes keep the local draft valid. Existing cloud sync components retry on later saves or page visits when the account connection is available.

The UI does not show a persistent `Saved locally` line below the primary action. Normal successful autosave is quiet.

## Compatibility

New progress fields are optional. Older sessions without `lastRoute` continue using the existing `currentStep` resume mapping.

Completed and archived sessions are still excluded from active-session resume.

## Completion and deletion

Existing Review completion and Account deletion behavior remain responsible for clearing the active-session pointer and cloud marker where appropriate.

This model does not add multiple active sessions, a manual save button, a database migration, or new calculation behavior.
