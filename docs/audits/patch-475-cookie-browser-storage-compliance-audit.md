# Patch 475: Cookie and Browser Storage Compliance Audit

Starting commit: `4602f12814a64abacd80156c95ff749d5cee4d20`  
Branch: `patch/475-cookie-browser-storage-compliance-audit`  
Type: read-only compliance audit  
Decision: `A - no consent banner is currently required`

## 1. Executive Summary

DoughTools currently uses browser storage for first-party product features: local Pizza Sessions, saved recipes, guidance preferences, bake timers, local bake results, and signed-in Supabase authentication.

No advertising cookies, analytics pixels, marketing identifiers, social embeds, payment scripts, custom service worker storage, IndexedDB use, Cache Storage use, or third-party runtime font/CDN requests were found in the inspected code or anonymous production runtime checks.

Anonymous production checks on `/`, `/calculator/quick`, `/session/start`, and signed-out `/account` produced:

- cookies: none
- `localStorage`: empty
- `sessionStorage`: empty
- `document.cookie`: empty
- third-party resource requests: none observed in the inspected anonymous page loads

The current compliance conclusion is:

**No sitewide cookie consent banner is currently required**, because the inspected application does not set non-essential analytics or marketing cookies/storage before consent and the identified first-party storage supports requested product features. DoughTools still needs a clearer public cookie/browser-storage notice and a more exact inventory in the Privacy Policy.

Signed-in Supabase auth-cookie behavior was audited from source and vendor documentation, not from an authenticated production browser session. Exact deployed cookie names and expiry should be confirmed during a future authenticated verification pass.

## 2. Legal and Regulatory Baseline

This audit uses an EU/EEA and Finnish baseline.

Primary sources:

- Traficom cookie guidance: <https://kyberturvallisuuskeskus.fi/en/our-activities/regulation-and-supervision/cookies>
- ePrivacy Directive Article 5(3): <https://eur-lex.europa.eu/eli/dir/2002/58/oj>
- EDPB Guidelines 05/2020 on consent: <https://www.edpb.europa.eu/documents/guideline/guidelines-052020-on-consent-under-regulation-2016679_en>
- EDPB Guidelines 2/2023 on the technical scope of Article 5(3): <https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en>
- Supabase Auth JavaScript and SSR documentation:
  - <https://supabase.com/docs/reference/javascript/auth>
  - <https://supabase.com/docs/guides/auth/server-side>
  - <https://supabase.com/docs/guides/auth/server-side/advanced-guide>

Baseline interpretation:

- Cookies and similar technologies include cookies, localStorage, sessionStorage, and comparable terminal-equipment storage/access.
- Consent is required unless the storage/access is solely for message transmission or strictly necessary to provide a user-requested service.
- Continued browsing, pre-ticked boxes, browser default settings, or unclear opt-out patterns are not valid consent.
- If optional categories are ever introduced, refusal and withdrawal must be as easy as consent and the change must actually stop/remove relevant optional storage.
- Legitimate interest under GDPR does not replace cookie/ePrivacy consent where consent is required for terminal-equipment access.

## 3. Methodology

Source inspection covered:

- `app/**`
- `components/**`
- `lib/**`
- `package.json`
- Supabase client/server wrappers
- account local-data cleanup
- privacy/trust-page copy
- direct uses of `localStorage`, `sessionStorage`, `document.cookie`, `cookies()`, auth persistence, analytics strings, service workers, cache APIs, and third-party scripts

Production runtime checks covered:

- anonymous first visit to `https://www.doughtools.app/`
- anonymous `/calculator/quick`
- anonymous `/session/start`
- signed-out `/account`
- resource-origin inspection on anonymous pages

Authenticated account navigation, logout, and signed-in token refresh were not performed because no safe authenticated production session was available. Those findings are source-derived and marked accordingly.

## 4. Browser Storage Inventory

| Storage item | Technology | Source file(s) | Created when | Purpose | Contents | Retention | Party/provider | Consent classification | Consent required now? | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `sb-<project-ref>-auth-token` and possible chunked variants | First-party cookie via Supabase SSR | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `@supabase/ssr` | Signed-in auth/session refresh | Keep account routes and authenticated APIs working | Supabase auth session tokens | Supabase/JWT/session dependent; exact production expiry not runtime-confirmed | DoughTools/Supabase | Strictly necessary auth | No | Source-derived; signed-out runtime created no cookie |
| Supabase PKCE/code-verifier storage under auth storage key | Supabase auth storage/cookie mechanism | `@supabase/auth-js`, `@supabase/ssr` | OAuth or auth-code flow if used | Complete sign-in flow | Temporary verifier/session material | Short-lived/auth-flow dependent | DoughTools/Supabase | Strictly necessary auth | No | No production signed-in/OAuth runtime observed |
| `doughtools:pizza-sessions-v1` | `localStorage` | `lib/pizza-session-storage.ts` | User creates or persists local Pizza Session | Local Pizza Plan/session continuity | Pizza Session data | Until user deletes, account cleanup, or browser clears | First-party | Strictly necessary for requested local session feature | No | May contain recipe/session details |
| `doughtools:active-pizza-session-id` | `localStorage` | `lib/pizza-session-storage.ts` | User has an active local session | Resume active local plan | Session id | Until completion/archive/delete/clear | First-party | Strictly necessary | No | Pointer only |
| `doughtools:cloud-backed-pizza-session-id` | `localStorage` | `lib/cloud-pizza-session-client.ts` | Signed-in cloud-backed session link exists | Relate local active session to cloud copy | Local/cloud session marker | Until replaced/cleared | First-party/Supabase-assisted | Strictly necessary for user-requested account save/sync | No | Does not itself write cloud data without user workflow |
| `doughtools:dough-plan-auto-saved-snapshot-key` | `sessionStorage` | `components/session/SavePizzaSessionToAccount.tsx` | Account save/autosave flow | Prevent duplicate save of same snapshot in one browser session | Snapshot key string | Browser tab/session | First-party | Strictly necessary | No | Session-only |
| `doughtools-saved-recipes-v1` | `localStorage` | `lib/saved-recipes.ts` | User saves calculator/recipe data where available | Browser-local saved recipes | Recipe settings, ingredient values, names, timestamps/ids | Until deleted or cleared | First-party | Strictly necessary for requested save feature | No | Disclosure should say local only |
| `doughtools.quick-calculator.recipes.v1` | `localStorage` | `lib/quick-calculator/quick-calculator-storage.ts` | Legacy/admin/source-supported Quick Calculator save behavior | Browser-local Quick Calculator recipes | Saved Quick Calculator recipes, max 20 | Until deleted or cleared | First-party | Strictly necessary if save feature is exposed/requested | No | Public UI may no longer expose all old save controls, but code contract remains |
| `doughtools:bake-results` | `localStorage` | `lib/local-bake-results.ts` | User saves local bake/review result | Local private bake history | Bake result/review data | Until deleted/cleared/account cleanup | First-party | Strictly necessary for requested local result feature | No | Privacy copy should mention local-only persistence |
| `doughtools.kitchen-bake-timer.v1:<sessionId>` | `localStorage` | `lib/use-bake-timer.ts`, `components/session/KitchenBakeTimerPanel.tsx` | User starts/uses Kitchen bake timer | Continue timer state across reloads | Timer snapshot | Until timer reset/completion/session cleanup/clear | First-party | Strictly necessary for requested timer continuity | No | Prefix-based cleanup exists |
| `doughtools.bake-timer.sound-enabled.v1` | `localStorage` | `lib/use-bake-timer.ts` | User changes bake-timer sound preference | Remember sound setting | Boolean string | Until changed/cleared/account cleanup | First-party | Functional/preference | Consent assessment required; no banner currently required | User-initiated preference, not tracking |
| `doughtools.experienceLevel` | `localStorage` | `lib/experience-levels.ts` | User changes guidance level | Remember guidance preference | Experience-level value | Until changed/cleared/account cleanup | First-party | Functional/preference | Consent assessment required; no banner currently required | User-requested personalization |
| `doughtools-currency` | `localStorage` | `components/costs/PizzaCostsPlayfulClient.tsx` | User changes currency in Costs tool | Remember currency preference | Currency code | Until changed/cleared/account cleanup | First-party | Functional/preference | Consent assessment required; no banner currently required | User-requested preference |
| `quick` URL parameter | URL/query string, not browser storage | `lib/quick-calculator/**` | User creates/opens shared Quick Calculator URL | Restore shared calculator settings | Encoded calculator settings | Browser history / shared URL | First-party/user-shared | Not cookie/storage consent item | No | Privacy notice should still explain settings in shared links |

No `IndexedDB`, custom Cache Storage, custom service worker registration, push subscription storage, advertising identifiers, payment identifiers, or analytics identifiers were found in inspected source.

## 5. Cookie Inventory

No cookies were set in anonymous production checks.

Expected signed-in cookies:

- Supabase SSR auth cookie pattern: `sb-<project-ref>-auth-token`
- possible chunked cookie names where token payload exceeds cookie-size limits

Purpose:

- authenticated account state
- secure server-side route/API authorization
- token refresh/session continuity

Classification:

- strictly necessary for account/auth functionality

Open verification item:

- confirm exact production cookie names, expiry, path, SameSite, Secure, and chunking behavior with a safe signed-in session.

## 6. LocalStorage and SessionStorage Findings

DoughTools uses localStorage/sessionStorage as a local-first product store, not as an analytics or advertising layer.

The strongest central inventory is in `components/account/account-local-data-cleanup.ts`, which already lists known local keys and prefixes cleared during account local-data cleanup.

Important minimization findings:

- Local Pizza Sessions and bake results can contain meaningful user-entered cooking/session data.
- Saved recipes and sessions persist until explicit deletion, account cleanup in the current browser, or browser clearing.
- Account deletion cleanup affects known data in the current browser only; it cannot clear other browsers/devices.
- Quick Calculator and recipe share URLs can expose settings through the URL when a user shares or saves the link.

No automatic localStorage/sessionStorage writes were observed on anonymous first visit or the checked public routes.

## 7. Supabase Auth Architecture

Source files:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/service-role.ts`
- `lib/public-theme-campaigns.ts`
- `lib/cloud-pizza-session-client.ts`

Findings:

- Browser auth uses `createBrowserClient` from `@supabase/ssr`.
- Server auth uses `createServerClient` from `@supabase/ssr` with Next cookies.
- Service-role and public-theme server clients disable session persistence.
- Route-level Supabase server client supports bearer tokens and disables session persistence for that client.
- Supabase documentation states browser auth persists sessions by default; Supabase SSR uses cookies for server/browser session continuity.
- Signed-out production runtime created no Supabase cookies or localStorage session.

Assessment:

- Auth cookies are strictly necessary when the user signs in.
- Exact deployed cookie details need authenticated runtime confirmation.
- No auth-cookie consent banner is required for necessary account authentication.

## 8. Third-Party and Provider Inventory

| Provider / technology | Browser-visible storage found? | Role | Classification | Notes |
|---|---:|---|---|---|
| Vercel | No page cookie/storage observed | Hosting/CDN/runtime/logging | Necessary service delivery | Server/provider logs still need Privacy Policy coverage |
| Supabase | Signed-in cookies source-derived; none observed signed out | Auth, database, storage | Necessary for account/cloud features | Exact signed-in cookie metadata to verify |
| OpenAI | No browser storage | Server-side pizza photo moderation/relevance for optional feature | Processor/subprocessor disclosure | Calls are server-side; not a cookie-banner item |
| Google Fonts / Next fonts | No external runtime request observed | Fonts bundled by Next | Not a third-party runtime storage item | `next/font/google` package source does not imply browser request |
| Analytics/marketing vendors | None found | Not present | Not applicable | No GA, Plausible, PostHog, ad pixels, social pixels found |
| Payment providers | None found | Not present | Not applicable | No payment scripts found |
| Error monitoring | None found | Not present | Not applicable | No Sentry or equivalent found |
| Social embeds | None found | Not present | Not applicable | No embed storage found |

## 9. Runtime Flow Findings

| Flow | Runtime status | Cookies | localStorage | sessionStorage | Notes |
|---|---|---:|---:|---:|---|
| First anonymous visit | Observed in production | none | empty | empty | No third-party resource origins observed |
| Quick Calculator anonymous visit | Observed in production | none | empty | empty | No storage created by page load |
| Pizza Plan/session start anonymous visit | Observed in production | none | empty | empty | No storage created by page load |
| Account route signed out | Observed in production | none | empty | empty | Signed-out guard state only |
| Create/save Pizza Session | Source-derived | no cookie expected unless signed in | writes local session keys | possible autosave session key in account save flow | Requires user action |
| Sign in / signed-in navigation | Source-derived | Supabase auth cookies expected | no custom auth localStorage found in app code | none identified | Needs safe authenticated runtime check |
| Logout | Source-derived | Supabase auth cookies should clear/update | local product data not automatically cleared unless account cleanup flow used | session key may clear with tab/session | Needs safe authenticated runtime check |

## 10. Consent Classification

Strictly necessary:

- Supabase auth cookies for signed-in account access
- local Pizza Session persistence after the user starts or saves a plan
- active session id pointer
- cloud-backed session marker for account save/sync continuity
- account save duplicate-snapshot sessionStorage guard
- browser-local saved recipes when a save feature is explicitly requested
- browser-local bake results when explicitly saved
- Kitchen bake timer snapshot while using the timer

Functional/preferences, assessment required:

- guidance level preference: `doughtools.experienceLevel`
- Costs currency preference: `doughtools-currency`
- bake-timer sound preference: `doughtools.bake-timer.sound-enabled.v1`

Analytics:

- none found

Marketing:

- none found

Unknown / requires future runtime confirmation:

- exact Supabase auth cookie names, attributes, chunking, and expiry in signed-in production
- provider-side log retention details for Vercel/Supabase/OpenAI

## 11. Pre-Consent and Gating Assessment

No non-essential cookies or browser storage were observed before consent on the checked anonymous production routes.

No analytics or marketing scripts were found that would require prior consent gating.

Functional preference storage appears user-initiated. The current risk is transparency/governance, not a blocked pre-consent tracking defect.

If DoughTools later adds analytics, advertising, A/B testing, heatmaps, social embeds, or automatic preference storage before user action, those must be gated before loading or writing.

## 12. Banner Requirement Decision

Decision: **A - no consent banner is currently required.**

Reason:

- no analytics/marketing cookies or identifiers found
- no non-essential third-party storage observed before consent
- first-party storage supports requested product functions or user-selected preferences
- anonymous page loads do not set storage
- signed-in auth cookies are necessary for account functionality

Required anyway:

- clearer Cookie and Browser Storage notice
- updated Privacy Policy inventory
- exact signed-in Supabase cookie metadata once verified
- clear explanation that browser-local data remains on the device until deleted or cleared

## 13. Policy and Notice Gaps

Current Privacy Policy already states that:

- localStorage/sessionStorage are used for local app features
- Supabase SSR auth uses cookies
- no advertising cookies, analytics pixels, or nonessential tracking scripts were found
- Vercel/Supabase/OpenAI may process technical data needed to run the service

Gaps:

- no complete public inventory of storage keys/categories
- no exact Supabase cookie names/attributes/durations
- no clear category split: necessary vs preference vs analytics vs marketing
- no dedicated Cookie/Browser Storage notice linked from the footer
- no explicit statement that anonymous first page loads currently set no cookies/storage
- no exact explanation of shared URL settings and browser history exposure
- no provider log retention details for hosting/auth/photo-checking processors

## 14. Consent Record and Future Preference Architecture

Current state:

- no consent record is required because no consent-requiring optional category is active.

If future optional categories are added, use a first-party consent record such as:

- key: `doughtools.cookie-consent.v1`
- fields: policy version, consent timestamp, categories accepted/rejected, last changed timestamp
- storage: localStorage is sufficient for local browser consent state unless legal/account requirements require server-side consent history

Future banner/settings requirements:

- no optional scripts load before consent
- reject all is as easy as accept all
- change/withdraw path is always available
- category toggles are off by default except strictly necessary
- withdrawal removes or overwrites affected optional identifiers where technically possible
- settings UI explains local-only consent state and device/browser scope

## 15. Security, Privacy, and Minimization Risks

| Finding | Category | Severity | Confidence | Recommendation |
|---|---|---:|---:|---|
| Local session/recipe/bake data can persist indefinitely | Privacy/minimization | Medium | High | Disclose clearly; consider explicit local data controls outside account deletion |
| Signed-in Supabase cookie metadata not runtime-confirmed | Documentation gap | Medium | Medium | Verify with safe signed-in production session before final policy wording |
| Functional preference keys lack public inventory | Transparency gap | Low | High | Add Cookie/Storage notice |
| Account deletion cleanup is current-browser only | Transparency gap | Medium | High | Ensure account deletion copy stays explicit |
| Share URLs expose calculator settings through links/browser history | Privacy transparency | Low | High | Keep share UI/privacy copy clear |
| Provider log retention details are not fully documented | Processor transparency | Low | Medium | Confirm Vercel/Supabase/OpenAI retention and update policy |

No evidence was found of advertising tracking, analytics tracking, third-party marketing identifiers, or hidden optional browser identifiers.

## 16. Recommended Patch 475A Scope

Recommended next patch: **Patch 475A - Cookie and Browser Storage Notice**

Scope:

- Add or update a concise public Cookie and Browser Storage notice.
- Update Privacy Policy with:
  - storage categories
  - key/cookie inventory
  - purposes
  - retention
  - provider involvement
  - no analytics/marketing statement
  - shared URL settings disclosure
- Add a footer link to the notice if product policy requires it.
- Confirm Supabase auth cookie names/attributes/durations with a safe signed-in test account if available.
- Do not add a consent banner unless new consent-requiring technology is introduced.
- Do not add analytics/marketing.
- Do not change storage behavior unless a separate product/privacy decision approves local data controls.

## 17. GO / NO-GO

Result: **GO for a transparency-only Patch 475A.**

Rationale:

- actual current storage categories are identified
- no consent-gated analytics/marketing category is present
- necessary and preference storage are classified
- pre-consent anonymous behavior was checked in production
- policy/notice gaps are specific enough for implementation

Not GO for:

- adding analytics
- adding marketing pixels
- adding a generic CMP/banner without a consent-requiring category
- claiming exact Supabase cookie attributes without signed-in runtime verification

## 18. Files Inspected and Validation

Key inspected files:

- `components/account/account-local-data-cleanup.ts`
- `components/costs/PizzaCostsPlayfulClient.tsx`
- `components/session/SavePizzaSessionToAccount.tsx`
- `components/session/KitchenBakeTimerPanel.tsx`
- `lib/saved-recipes.ts`
- `lib/quick-calculator/quick-calculator-storage.ts`
- `lib/experience-levels.ts`
- `lib/local-bake-results.ts`
- `lib/pizza-session-storage.ts`
- `lib/cloud-pizza-session-client.ts`
- `lib/use-bake-timer.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/service-role.ts`
- `lib/public-theme-campaigns.ts`
- `lib/trust-pages.ts`
- `package.json`
- `app/layout.tsx`

Validation performed for the audit:

- source search for storage, cookie, service-worker, analytics, marketing, and third-party patterns
- production anonymous runtime checks for cookies and browser storage
- production signed-out account route check
- production resource-origin inspection
- vendor documentation review for Supabase Auth/SSR

No production code, UI, formulas, API, database, migrations, or deployment behavior was changed.
