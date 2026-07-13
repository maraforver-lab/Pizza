# DoughTools Terms product map

Date: 13 July 2026  
Purpose: map public Terms statements to inspected product behavior for Patch 363.

| Terms topic | Public statement | Product evidence / implementation boundary |
|---|---|---|
| Provider | DoughTools is operated by Marcin Arcisz in Finland, contactable at `hello@doughtools.app` | Current trust-page data exposes owner/country/email. Formal legal entity/address/business ID require confirmation. |
| Current commercial status | Current inspected implementation has no user fee | No checkout, subscription, payment, renewal, refund, or withdrawal flow was found. Do not promise permanent free service. |
| Accounts | Users must keep credentials secure; Supabase handles authentication | Account page uses Supabase Auth. DoughTools app code does not store raw passwords. |
| Local/cloud distinction | Some features are local-only, account features may use cloud storage | Local storage helpers and Supabase-backed cloud session APIs are both present. |
| Service features | Calculators, Quick Calculator, Pizza Session, Shopping, Timeline, Kitchen Mode, Review, Party Orders, photos, learning pages | Current routes/components provide these feature areas. |
| User content | User keeps ownership and grants only a narrow operational licence | Needed for photo display/storage, Party Order comments, review notes and feature operation. No broad marketing licence is supported. |
| Photos | Photos may be rejected by safety or pizza-relevance checks | Photo upload route calls OpenAI moderation/relevance before Supabase Storage upload. |
| Party Orders | Public links are not password-protected; organizer is responsible for sharing and checking totals | Public token routes exist without auth; owner can manage order state. |
| Calculations | Estimates/guidance, not guarantees | Product is sensitive to user inputs, flour, yeast, temperature, ovens and handling. No logic guarantees pizza quality. |
| Food/equipment safety | Users remain responsible for food safety and equipment instructions | Product offers guidance only; no appliance-control or food-safety verification exists. |
| Changes | DoughTools may improve/change features for valid reasons and should communicate material changes | Product is under active patch development; no paid service-change flow exists. |
| Liability | Balanced limitation preserving mandatory consumer rights, no monetary cap | No commercial/legal decision for a liability cap exists. Avoid absolute “as-is/no liability ever” language. |
| Disputes | Finnish law intended; mandatory consumer rights preserved; contact first; KKV/Consumer Disputes Board may be relevant | Official Finnish consumer sources support consumer advisory/dispute-board route. EU ODR platform should not be linked because it is discontinued. |
| Terms acceptance | No logged explicit Terms-acceptance checkbox/timestamp found | Public Terms mention this and recommend a future explicit flow if required. |

## Product logic intentionally unchanged

Patch 363 changes copy, layout, images, SEO descriptions, and internal documentation only. It must not alter:

- authentication implementation;
- Supabase configuration;
- Vercel configuration;
- OpenAI calls;
- storage behavior;
- photo moderation;
- Party Orders;
- Pizza Session;
- calculations;
- account behavior;
- APIs;
- database schema;
- routes;
- navigation destinations;
- canonical footer design.
