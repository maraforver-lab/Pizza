# Patch 363 — Privacy and Terms legal/data-flow audit

Date: 13 July 2026  
Scope: `/privacy`, `/terms`, account/session storage, Party Orders, photos, moderation, local browser storage, processors, trust-page layout.

This audit records the product facts used to refresh the public Privacy and Terms pages. It is a legally grounded implementation audit, not legal advice and not a claim of formal compliance, lawyer review, or regulator approval.

## Product operator

Confirmed from current project trust data:

- Operator name used publicly: Marcin Arcisz
- Service name: DoughTools
- Country: Finland
- Contact email: hello@doughtools.app

Requires Marcin confirmation before treating the public legal pages as final publication copy:

- Legal/controller name if different from Marcin Arcisz
- Postal or registered business address
- Business ID or tax registration, if applicable
- Formal trading name or company form, if any
- Whether the production service is free, commercial, beta, or mixed
- Minimum user age
- Liability-cap decision
- Whether Terms acceptance is or should be logged

The inspected implementation does not include paid subscriptions, checkout, refunds, renewals, withdrawal flow, or payment processing.

## Product and data-flow findings

### Account and authentication

- Source: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `app/account/page.tsx`
- Provider: Supabase
- Data: email address, password handled by Supabase Auth, authentication identifiers, auth cookies/session data.
- Purpose: account sign-up, sign-in, sign-out, authenticated cloud features.
- Public-copy implication: DoughTools app code should not claim to store passwords; Supabase handles authentication.
- Open confirmations: Supabase project region, Supabase DPA/SCC status for the active production account, account deletion timing.

### Active Pizza Session and completed history

- Sources: `lib/pizza-session-storage.ts`, `lib/cloud-pizza-session-client.ts`, `app/api/pizza-sessions/active/route.ts`, `app/api/pizza-sessions/history/route.ts`, `app/api/pizza-sessions/history/[id]/route.ts`
- Local keys include `doughtools:pizza-sessions-v1` and `doughtools:active-pizza-session-id`.
- Cloud marker: `doughtools:cloud-backed-pizza-session-id`.
- Cloud storage: signed-in active/completed Pizza Sessions in Supabase-backed records.
- Data: dough settings, recipe/session data, Timeline/Kitchen/Review data, status, title, timestamps.
- Deletion route: active/completed cloud session delete actions archive rows rather than proving immediate physical erasure from every database copy or backup.
- Public-copy implication: distinguish browser-local session data from signed-in cloud session data; do not promise instant physical deletion from backups.

### Quick Calculator and local tools

- Sources: Quick Calculator storage and local UI code.
- Data: saved Quick Calculator recipes, shareable Quick Calculator input state, preferences.
- Storage: browser-local localStorage/query state; not account-synced in inspected implementation.
- Public-copy implication: local-only data should be described separately from Supabase cloud account features.

### Party Orders

- Sources: `lib/party-orders.ts`, `app/api/party-orders/*`, `app/order/[publicToken]/page.tsx`, `app/order/[publicToken]/edit/[submissionToken]/page.tsx`
- Organizer data: title, pizza date/time, order close time, note, allowed pizzas, status, public token.
- Guest data: guest name, optional comment, pizza selections, quantities, edit token.
- Public link behavior: public-token guest form is not password-protected; anyone with a valid link can access while available.
- Owner actions: create/list/update/archive/close/open Party Orders; delete individual guest submissions.
- Public-copy implication: warn organizers to share links only with intended participants; do not call public links private or password protected.

### Pizza photos and moderation

- Sources: `app/api/pizza-sessions/history/[id]/photo/route.ts`, `lib/pizza-photo-moderation.ts`, `lib/pizza-photo-relevance.ts`, `lib/pizza-session-photo.ts`
- Providers: Supabase Storage, OpenAI.
- Accepted uploads: JPG, PNG, WebP. Original input capped at 5 MB; optimized WebP capped by code at 800 KB.
- Moderation: OpenAI moderation endpoint with `omni-moderation-latest`.
- Relevance: OpenAI Responses API with `gpt-4.1-mini`.
- Storage metadata: path, content type, size, original filename/type, optimized size, dimensions, compression quality, upload timestamp, moderation/relevance results.
- Practical effect of automated checks: rejected photo is not available for the DoughTools photo feature. It is not a legal or similarly significant automated decision about the user.
- Open confirmations: OpenAI processing region/safeguards, photo retention after account deletion, backup/log retention.

### Cookies, local storage, PWA and analytics

- Supabase SSR auth uses cookies through the Next.js/Supabase server client.
- Browser localStorage/sessionStorage is used for local planning, saved recipes, preferences and tool state.
- No advertising pixels, analytics provider, error-monitoring provider, push-notification service, or custom service worker was found in inspected application code.
- The app has a manifest/install prompt but no custom service worker in the inspected implementation.
- Open confirmations: production hosting logs, support mailbox provider, analytics/cookie policy if any production-only integration exists outside the repo.

## Third parties verified from actual use

| Provider | Role | Product areas | Transfer/region status |
|---|---|---|---|
| Supabase | Authentication, database, storage | Account, cloud Pizza Sessions, history, Party Orders, photos | Production region and safeguards require account confirmation |
| Vercel | Hosting, delivery, runtime logs | Website and API routes | Runtime/log region and safeguards require account confirmation |
| OpenAI | Photo safety moderation and pizza relevance checks | Optional signed-in completed-session photo upload | Processing region/safeguards require account confirmation |
| Email provider | Support/privacy communications | Email contact | Provider and retention require Marcin confirmation |

No analytics or error-monitoring provider was verified from active application code.

## Official legal and public sources consulted

- GDPR Regulation (EU) 2016/679: `https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng`
- EU Digital Content and Digital Services Directive (EU) 2019/770: `https://eur-lex.europa.eu/eli/dir/2019/770/oj/eng`
- European Accessibility Act Directive (EU) 2019/882: `https://eur-lex.europa.eu/eli/dir/2019/882/oj/eng`
- Finnish Competition and Consumer Authority consumer guidance: `https://www.kkv.fi/en/consumer-affairs/`
- Finnish Consumer Disputes Board: `https://www.kuluttajariita.fi/en/`
- EU consumer redress site relocation / ODR discontinuation context: `https://consumer-redress.ec.europa.eu/site-relocation_en`
- OpenAI data-processing information: `https://openai.com/policies/data-processing-addendum/`
- Supabase legal/privacy information: `https://supabase.com/privacy`
- Vercel privacy/legal information: `https://vercel.com/legal/privacy-policy`

The public pages paraphrase these sources and avoid raw legal source dumping.

## Accessibility-law assessment

The implementation continues DoughTools’ voluntary accessibility-first product practice. The audit did not confirm:

- formal business size or microenterprise status;
- whether the service falls into an applicable European Accessibility Act service category;
- whether any exemption applies;
- whether a statutory accessibility statement is legally required.

Do not publish a legal accessibility-compliance claim until those points are confirmed. Accessibility remains a product commitment regardless of formal applicability.

## Public wording decisions

- Use plain language first, then legal detail.
- Do not state “fully GDPR compliant.”
- Do not state “lawyer reviewed.”
- Do not state “regulator approved.”
- Do not invent address, business ID, minimum age, paid terms, liability cap, or processor regions.
- Use “describes how DoughTools currently operates” and “requires confirmation” where appropriate.

## Matters requiring Marcin confirmation

- Controller legal name and address
- Business ID/company form
- Commercial/free/beta status for public launch
- Minimum user age
- Supabase, Vercel and OpenAI production regions and transfer safeguards
- Signed processor DPAs/SCCs and active subprocessor disclosures
- Technical/security log retention
- Support-email provider and retention
- Account deletion process and timing
- Photo retention after archive/account deletion
- Backup retention
- Any production-only analytics/cookies/error monitoring outside the repo
- Dispute-resolution participation position
- Liability-cap decision
- Whether Terms acceptance should be explicitly logged

## Lawyer-review recommendations

Professional legal review is recommended before relying on the pages for public launch, especially for:

- controller identity and required business disclosures;
- GDPR legal bases and legitimate-interest balancing;
- processor and transfer disclosures;
- consumer-rights/service-change wording;
- liability limitations;
- dispute-resolution wording;
- children/minimum-age policy;
- accessibility-law applicability.
