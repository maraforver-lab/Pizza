# DoughTools third-party processor map

Date: 13 July 2026  
Scope: providers verified from current application code for Patch 363.

This internal file records processor disclosures that support `/privacy` and `/terms`. Production account settings must still be confirmed before legal publication.

| Provider | Role | Data categories | Region status | DPA/SCC status | Public link | Verification status |
|---|---|---|---|---|---|---|
| Supabase | Authentication, database, storage | Account email/auth IDs, cloud Pizza Session data, completed history, Party Orders, guest submissions, photo storage metadata | Requires project/account confirmation | Requires account/legal confirmation | `https://supabase.com/privacy` | Verified from imports, auth clients, API routes and storage helpers |
| Vercel | Hosting, delivery, API runtime, technical logs | IP/request metadata, runtime logs, deployment/build metadata | Requires project/account confirmation | Requires account/legal confirmation | `https://vercel.com/legal/privacy-policy` | Verified by Next/Vercel application structure; production config not confirmed |
| OpenAI | Pizza-photo safety moderation and pizza relevance analysis | Optional uploaded pizza image and moderation/relevance response | Requires account/legal confirmation | Requires account/legal confirmation | `https://openai.com/policies/data-processing-addendum/` | Verified from moderation and relevance helper code |
| Email provider | Support/privacy email handling | Email address, message content, attachments | Unknown | Unknown | To be confirmed | Public contact uses mailto; provider not identifiable from repo |

## Providers not verified from active code

- Advertising provider: none found.
- Analytics provider: none found.
- Error-monitoring provider: none found.
- Payment provider: none found.
- Push-notification provider: none found.
- Custom service-worker provider: none found.

Do not list a processor publicly merely because it appears in package dependencies. Public disclosure should be based on active production use.

## Transfer safeguards needing confirmation

Before public launch, confirm for Supabase, Vercel, OpenAI and the email provider:

- configured production region;
- subprocessor list;
- data-processing agreement status;
- Standard Contractual Clauses or other transfer mechanism where relevant;
- log retention;
- backup retention;
- support access and support data handling.
