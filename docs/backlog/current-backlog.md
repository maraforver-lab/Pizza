# DoughTools Current Backlog

Last updated: 2026-07-24

Source baseline: `master` at `94c39a6b589b269f65986a10138ebaed498b6293`.

This document is the current concise backlog status. It replaces scattered duplicate backlog notes for the areas listed below.

## Completed And Removable From Backlog

- Guide improvement cleanup: complete. Patch 450G confirms redundant guide cross-links were removed, `Choose toppings` is visible in Pizza guides navigation, oven equipment cards have local thumbnails, the About trust strip is removed, and the home-oven guidance follow-up is complete.
- Home oven guidance: complete. Patch 450G confirms Patch 450F is present, the visible universal 75-minute preheat claim was removed, and Beginner, Enthusiast and Pizza Nerd guidance now exists.
- GDPR self-service implementation: complete in repository. Patches 371A-371F added the inventory, export, app-data deletion, full deletion orchestration, Settings UI and final privacy/runbook documentation.
- Account and Settings redesign: complete in repository. Patches 453A-453C and 454A-454I established the Settings structure, readable export, responsive polish, approved Account workspace, approved Settings concept, Settings UI alignment, and simplified App and device row.
- Terminology cleanup: complete for the recent planned pass. Patches 448A-448G standardized navigation, Homepage, session flow, Account, Party Orders, Pizza guides and remaining user-facing terminology.
- Supabase CLI temp noise: complete. Patch 449A0 ignores `supabase/.temp/`.

## Open Development Work

- Practical pizza tips landing polish: needs minor polish. Patch 452E marks the content complete enough to release, but the landing page still uses the outdated `Upcoming topics` label even though the topics are implemented.
- Mobile Start -> Dough Plan -> Shopping simplification: needs status check. Existing mobile session audit identifies density and first-viewport issues, but the current focused Start, Dough Plan and Shopping state should be re-audited before implementation.
- Homepage timing flow: needs design/audit. Existing homepage cleanup made the page session-first, but no current document confirms the desired timing-flow presentation is complete.
- Quick Calculator responsive work: needs status check. Existing calculator progressive-disclosure documentation lists mobile usability and result-card polish as future work; current completion is not confirmed by the inspected docs.

## Production-Only Manual Verification

- Account and Settings signed-in production visual checks: needs status check. Recent release prompts required authenticated viewport checks; if no valid signed-in session was available during release, these remain manual.
- GDPR self-service production verification: needs status check. Export and deletion should be checked with a safe non-admin test account and an admin account for the self-deletion block. Do not use a valuable real account for destructive testing.
- Practical pizza tips production release verification: needs status check after the minor landing polish is complete.

## Recommended Next Three Patches

1. Mobile Start -> Dough Plan -> Shopping audit.
2. Homepage timing-flow design/audit.
3. Quick Calculator completeness and responsive check.
