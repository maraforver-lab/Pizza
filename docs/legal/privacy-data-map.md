# DoughTools privacy data map

Date: 13 July 2026  
Scope: active implementation reviewed for Patch 363.

This is an internal maintainer map. The public Privacy page should stay readable and should not expose internal storage keys or implementation paths.

| Activity | Data | Purpose | Likely legal basis | Source | Recipient | Transfer relevance | Retention / deletion |
|---|---|---|---|---|---|---|---|
| Browser-local planning | Local Pizza Session data, saved recipes, preferences, local tool state | Save and resume planning on the same browser | Requested service / legitimate interest | Browser UI and local storage helpers | Browser/device only | No provider transfer from local storage itself | Until user deletes in product, clears site data, or browser removes it |
| Account authentication | Email, auth identifiers, auth cookies/session data | Create/sign into account and protect account routes | Contract/requested service | Supabase Auth | Supabase | Requires Supabase region/DPA/SCC confirmation | According to account lifecycle and Supabase/auth retention |
| Active cloud Pizza Session | Session data, settings, status, timestamps | Sync active plan for signed-in user | Contract/requested service | `/api/pizza-sessions/active` | Supabase | Requires region/safeguards confirmation | Delete action archives active row; physical deletion/backups require confirmation |
| Completed session history | Completed session data, optional title, review/photo metadata | Show account history and session details | Contract/requested service | `/api/pizza-sessions/history` | Supabase | Requires region/safeguards confirmation | Delete action archives completed row; history display limit is not deletion |
| Party Orders | Organizer event details, public token, allowed pizzas, guest names, comments, choices, edit tokens | Collect guest choices and create Pizza Session totals | Contract/requested service / legitimate interest | Party Order APIs and public guest routes | Supabase | Requires region/safeguards confirmation | Organizer can archive orders and delete individual guest submissions; exact backend retention requires confirmation |
| Pizza-photo upload | Image, filename/type, optimized WebP metadata, moderation/relevance result | Store optional completed-session photo and overlay/export image | User action/consent-like optional feature and requested service | Photo upload API | Supabase Storage, OpenAI | Supabase/OpenAI transfer safeguards require confirmation | Replacement removes old stored path; archive/account deletion/photo backup retention require confirmation |
| Photo safety moderation | Uploaded image content and moderation response | Prevent unsafe photo uploads | Legitimate interest / requested optional feature | `lib/pizza-photo-moderation.ts` | OpenAI | Requires OpenAI region/DPA/SCC confirmation | Rejected image is not stored for feature; provider retention per OpenAI terms requires confirmation |
| Photo pizza relevance | Uploaded image content and relevance response | Keep overlay feature pizza-related | Legitimate interest / requested optional feature | `lib/pizza-photo-relevance.ts` | OpenAI | Requires OpenAI region/DPA/SCC confirmation | Provider retention per OpenAI terms requires confirmation |
| Technical hosting | IP address, request metadata, runtime/build/security logs | Deliver, secure and troubleshoot the site/API | Legitimate interest | Vercel hosting/runtime | Vercel | Requires Vercel region/log retention/safeguards confirmation | According to Vercel/project log settings |
| Support email | Email address, message, attachments | Respond to support/privacy/legal requests | Requested service / legal obligation where applicable | Mailto contact | Email provider | Provider and region unknown | Support retention requires Marcin confirmation |

## Rights handling

Public Privacy copy instructs users to contact `hello@doughtools.app` for access, correction, deletion, restriction, portability, objection, and consent withdrawal where applicable. Identity verification may be required. Backup/provider-log deletion cannot be promised instantly without provider confirmation.

## Deletion/process gaps

- No self-service account deletion flow was found.
- Active/completed Pizza Session delete actions archive records.
- Party Order owner can archive orders and delete individual guest submissions.
- Local browser data can be cleared through product controls where available or browser site-data clearing.
- Account-wide deletion, backup deletion, support email retention, and processor log deletion require operational confirmation.
