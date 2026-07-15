# Pizza Session autosave and resume

Pizza Session persistence is local-first for signed-out users. For signed-in users, the active cloud Pizza Session is authoritative and browser-local state is a materialized cache of that cloud-backed session.

## Explicit creation event

A Pizza Session draft is stored only after an explicit creation action, currently the final `Create my pizza plan` setup action on `/session/start`, or an explicit Party Orders handoff.

Opening `/session/start` without an active session renders the normal planning form with an in-memory draft. It must not create an empty ghost session, active session ID or cloud record.

For signed-in users, `Create my pizza plan` must materialize the newly created active session in cloud before navigating to `/session/recipe`. Background autosave may be fire-and-forget, but explicit session creation is not.

## Local and cloud authority

The browser-local session is the operational source only while the user is signed out.

For a signed-in user:

- an existing active cloud Pizza Session wins over an unrelated local active session
- the cloud session is restored locally before Session routes render or mutate data
- a local anonymous session is promoted to cloud when no active cloud session exists
- a newer local cache may be preserved only when it is the same logical cloud-backed session
- unrelated local and cloud sessions are never reconciled by timestamp alone

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

After the local save succeeds, authenticated users mirror the same Pizza Session payload to the cloud using the existing active-session API. Once signed in, cloud authority decides the canonical active logical session and local storage follows that decision.

The Supabase row has its own row ID, but the stable Pizza Session identity remains `session_data.id` and matches the local session ID. The local cloud marker stores the relationship between the local session ID and the cloud row ID.

Cloud save failure never blocks the signed-out local workflow. Signed-in route entry must not continue an unrelated local session when the active cloud session cannot be verified.

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

If an active local session exists while signed out, `/session/start` resumes that session instead of creating a new one. If the user is signed in, `/session/start` first resolves the canonical active cloud session or promotes the local session when no cloud active session exists.

Starting a genuinely new plan while another plan is active still requires an explicit replace choice. The current one-active-session product model is preserved.

## Local/cloud conflicts

When the same signed-in user has a local active session and a different cloud active session, the cloud active session wins. DoughTools restores the cloud session locally and does not overwrite it with the unrelated local session.

The unrelated local session is not merged automatically and must not remain the active session for signed-in Session routes.

The cloud API also rejects an immediate save if it would overwrite a different active session in the account.

## Offline and retry behavior

Offline or failed cloud writes keep a signed-out local draft valid. For signed-in users, cloud lookup or promotion failure should be shown as a recoverable account-sync problem instead of silently continuing a different local active session.

The UI does not show a persistent `Saved locally` line below the primary action. Normal successful autosave is quiet.

## Compatibility

New progress fields are optional. Older sessions without `lastRoute` continue using the existing `currentStep` resume mapping.

Completed and archived sessions are still excluded from active-session resume.

## Completion and deletion

Review completion must complete the same canonical cloud-backed session used by the Session routes. Account deletion behavior remains responsible for clearing the active-session pointer and cloud marker where appropriate.

This model does not add multiple active sessions, a manual save button, a database migration, or new calculation behavior.
