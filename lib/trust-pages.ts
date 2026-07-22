import {
  publicPizzaSauceSources,
  publicToppingBalanceSources,
  type PublicResearchSource,
} from "@/lib/public-research-sources";

export type TrustPageId = "about" | "contact" | "privacy" | "terms" | "methodology";

export type TrustPageSection = {
  heading: string;
  id?: string;
  paragraphs?: string[];
  bullets?: string[];
  sources?: PublicResearchSource[];
};

export type TrustPageHeroImage = {
  alt: string;
  height: number;
  mobileHeight?: number;
  mobileSrc?: string;
  mobileWidth?: number;
  src: string;
  width: number;
};

export type TrustPageSummaryItem = {
  body: string;
  href: string;
  title: string;
};

export type TrustPage = {
  id: TrustPageId;
  href: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
  effectiveFrom?: string;
  heroImage?: TrustPageHeroImage;
  lastUpdated?: string;
  summary?: TrustPageSummaryItem[];
  sections: TrustPageSection[];
};

export const projectContactEmail = "hello@doughtools.app";
export const projectOwner = "Marcin Arcisz";
export const projectJurisdiction = "Finland";

export const trustFooterLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/methodology", label: "Methodology" },
] as const;

export const trustPages: Record<TrustPageId, TrustPage> = {
  about: {
    id: "about",
    href: "/about",
    navLabel: "About",
    eyebrow: "About DoughTools",
    title: "Built from real pizza nights.",
    intro:
      "DoughTools was created by Marcin Arcisz, a home pizza maker who wanted one clearer way to connect dough planning, guest choices, shopping, timing and the actual pizza night.",
    sections: [
      {
        heading: "A tool first built for real pizza nights",
        paragraphs: [
          "DoughTools began with practical pizza-making questions: when to start, how much yeast to use, whether to ferment at room temperature or in the refrigerator, and which flour can handle the plan.",
          "It later grew to include Party Orders because hosting friends created another real problem: collecting guest choices and turning them into dough quantities, shopping and a usable pizza plan.",
        ],
      },
      {
        heading: "What the product values",
        bullets: [
          "Good pizza begins with a plan, but the dough must still be observed.",
          "Guest choices should connect naturally to preparation, shopping and timing.",
          "Calculations should be visible and understandable.",
          "Pizza making should remain enjoyable.",
        ],
      },
      {
        heading: "Owner details",
        paragraphs: [`DoughTools is built by ${projectOwner}, a home pizza maker and Pizza Napoletana enthusiast in ${projectJurisdiction}.`],
      },
    ],
  },
  contact: {
    id: "contact",
    href: "/contact",
    navLabel: "Contact",
    eyebrow: "Contact",
    title: "Questions, corrections and feedback.",
    intro:
      "Use this page for DoughTools support questions, bug reports, calculation feedback and privacy-related requests.",
    sections: [
      {
        heading: "Contact address",
        paragraphs: [`You can contact DoughTools at ${projectContactEmail}.`],
      },
      {
        heading: "Useful reasons to get in touch",
        bullets: [
          "Bug reports or broken page links.",
          "Calculation feedback and edge cases that look wrong.",
          "Privacy requests or account-related questions.",
          "Business or collaboration inquiries, if appropriate before launch.",
        ],
      },
      {
        heading: "What not to send",
        paragraphs: [
          "Do not send passwords, payment data, sensitive personal information or private photos unless they are necessary for your request.",
        ],
      },
    ],
  },
  privacy: {
    id: "privacy",
    href: "/privacy",
    navLabel: "Privacy",
    eyebrow: "Privacy",
    title: "Your data, explained clearly.",
    intro:
      "DoughTools uses browser-local storage, optional accounts, and selected service providers to run the pizza-planning experience. This page describes how DoughTools currently operates, what is stored, why it is used, and the choices you have.",
    lastUpdated: "13 July 2026",
    effectiveFrom: "13 July 2026",
    heroImage: {
      src: "/images/trust/privacy-hero-desktop.webp",
      mobileSrc: "/images/trust/privacy-hero-mobile.webp",
      alt: "A calm pizza-planning workspace with blank cards, a closed notebook, and a blurred planning screen.",
      width: 1600,
      height: 900,
      mobileWidth: 900,
      mobileHeight: 1125,
    },
    summary: [
      {
        title: "Local-first where possible",
        body: "Many planning tools save data only in your browser unless you choose an account feature.",
        href: "#local-only-data",
      },
      {
        title: "Account sync is optional",
        body: "Signed-in pizza plan, history, Party Order, and photo features use Supabase-backed cloud storage.",
        href: "#account-and-cloud-data",
      },
      {
        title: "Photos are checked before upload",
        body: "Uploaded pizza photos are checked for safety and pizza relevance before they are stored.",
        href: "#pizza-photos-and-moderation",
      },
      {
        title: "You can ask for help or deletion",
        body: `Use ${projectContactEmail} for access, deletion, correction, or privacy questions.`,
        href: "#contact-and-supervisory-authority",
      },
    ],
    sections: [
      {
        heading: "Privacy at a glance",
        id: "privacy-at-a-glance",
        paragraphs: [
          "DoughTools tries to keep simple planning and calculator data local to your browser where that is enough. Account features are different: when you sign in, selected pizza plan, history, Party Order, and photo data can be saved to Supabase so you can use account features.",
          "DoughTools does not include advertising pixels or analytics tracking in the inspected code. Hosting, authentication, database, storage, and photo-checking providers still process technical data needed to run the service.",
        ],
      },
      {
        heading: "Who controls your data",
        id: "who-controls-your-data",
        paragraphs: [
          `DoughTools is currently operated by ${projectOwner} in ${projectJurisdiction}. For privacy requests, use ${projectContactEmail}.`,
          "The current product repository confirms the owner name, country, and email contact. A postal address, business ID, hosting/database region choices, and any formal company/trading details still require Marcin’s confirmation before this notice should be treated as final legal publication copy.",
        ],
      },
      {
        heading: "What data DoughTools processes",
        id: "what-data-doughtools-processes",
        bullets: [
          "Account data: email address, Supabase authentication identifiers, and authentication-session data.",
          "Pizza plan data: dough settings, timing, shopping, Timeline, Kitchen, Review notes, completed-plan titles, and related plan metadata.",
          "Browser-local data: active local sessions, saved calculator recipes, experience-level preference, local bake results, cost currency, install-prompt state, gear checklist choices, and similar local-only tool state.",
          "Party Orders: organizer event details, public guest link token, guest names, guest comments, pizza choices, edit tokens, status, and timestamps.",
          "Pizza photos: optional uploaded image, original filename and type metadata, optimized image metadata, moderation/relevance results, and Supabase Storage path.",
          "Technical data: request metadata, IP address, device/browser information, security logs, and hosting/provider logs generated when the site or APIs are used.",
          "Support communications: email address, message content, and attachments if you contact DoughTools by email.",
        ],
      },
      {
        heading: "Why and on what legal basis",
        id: "why-and-on-what-legal-basis",
        paragraphs: [
          "DoughTools uses personal data to provide the service you request, keep account features working, secure the service, prevent abuse, respond to support and privacy requests, and maintain records where required.",
          "The main GDPR legal bases described by this notice are: performance of the requested service or contract for account, pizza plan, Party Order, and support features; legitimate interests for security, abuse prevention, service reliability, and basic technical logging; consent or your optional action where the interface asks you to upload a photo or start an optional feature; and legal obligation where applicable law requires records or responses.",
          "Where DoughTools relies on legitimate interests, the interest is to keep a small pizza-planning service secure, reliable, and usable without collecting more data than needed. You may object to processing based on legitimate interests by contacting DoughTools.",
        ],
      },
      {
        heading: "Local-only data",
        id: "local-only-data",
        paragraphs: [
          "Some data stays in your browser unless you separately choose an account or cloud feature. This includes local pizza plan storage, saved Quick Calculator recipes, saved calculator recipes in the main calculator, experience-level preference, local bake results, gear checklist choices, cost currency, install-prompt state, and older local planning state.",
          "Local browser data is stored on the device and browser profile you use. It may be deleted by the relevant in-product delete/reset control where available or by clearing site data in your browser. DoughTools cannot recover browser-local data after you clear it.",
        ],
      },
      {
        heading: "Account and cloud data",
        id: "account-and-cloud-data",
        paragraphs: [
          "If you create an account, Supabase handles authentication. DoughTools application code does not store your password. Signed-in users can save active pizza plans, completed plan history, completed-plan titles, Party Orders, and optional pizza photos in Supabase-backed cloud storage.",
          "Active and completed pizza plan records can be archived through the current account UI. In the inspected implementation, those delete actions mark records as archived instead of proving physical erasure from every table or backup. Privacy deletion requests should be sent to DoughTools so account-level cleanup can be handled deliberately.",
          "Saved Quick Calculator recipes and many older calculator saved recipes remain local-only in the browser and are not currently described as account-synced data.",
        ],
      },
      {
        heading: "Pizza photos and moderation",
        id: "pizza-photos-and-moderation",
        paragraphs: [
          "Pizza photos are optional and available only for signed-in completed pizza plans. Before a photo is stored, DoughTools checks the uploaded image with OpenAI for safety moderation and pizza relevance. If the check fails, the photo is not stored for the overlay feature.",
          "Accepted photos are uploaded to the Supabase Storage bucket used for pizza-session photos. DoughTools stores metadata such as the storage path, upload time, content type, file size, original filename, original content type, optimized size, image dimensions, compression quality, and related session data.",
          "The moderation and relevance checks are practical feature checks. They do not create legal or similarly significant automated decisions about you; a rejected image simply cannot be used for the DoughTools photo feature.",
        ],
      },
      {
        heading: "Party Orders and public links",
        id: "party-orders-and-public-links",
        paragraphs: [
          "Party Orders let a signed-in organizer create a public guest link. Anyone with the link may be able to open the guest form while orders are open, so the link should be shared only with intended participants.",
          "Guest submissions can include a guest name, optional comment, pizza choices, quantities, and an edit token. The organizer can view guest orders, close or reopen orders before the deadline, archive the Party Order, use the totals to create a pizza plan, and delete individual guest submissions from the organizer view.",
          "Guests should not submit sensitive information, allergy details, medical information, or private data in Party Order names or comments. Allergies and dietary safety should be verified directly outside DoughTools.",
        ],
      },
      {
        heading: "Cookies, local storage, and similar technologies",
        id: "cookies-local-storage-and-similar-technologies",
        paragraphs: [
          "The inspected code uses browser localStorage and sessionStorage for local app features. Supabase server-side authentication uses cookies through the Next.js/Supabase SSR client so signed-in account routes and APIs can work.",
          "No advertising cookies, analytics pixels, or nonessential tracking scripts were found in the inspected application code. Vercel and Supabase may still process necessary technical request and authentication data to deliver and secure the service.",
          "DoughTools includes a web app manifest and install prompt support, but the inspected app does not register a custom service worker or use push notifications.",
        ],
      },
      {
        heading: "Service providers and recipients",
        id: "service-providers-and-recipients",
        bullets: [
          "Supabase: authentication, database, and storage for account, pizza plan, Party Order, and pizza-photo features.",
          "Vercel: hosting, delivery, build/runtime infrastructure, and technical logs for the website and API routes.",
          "OpenAI: optional pizza-photo safety moderation and pizza-relevance analysis when a signed-in user uploads a pizza photo.",
          "Email providers: if you email DoughTools, your email provider and the DoughTools mailbox provider process the message outside the application itself.",
        ],
      },
      {
        heading: "International data transfers",
        id: "international-data-transfers",
        paragraphs: [
          "The inspected code does not prove the exact Supabase project region, Vercel runtime/log region, OpenAI processing region, or support-mailbox provider. Those details require Marcin confirmation.",
          "Because the verified providers may process data outside Finland or the European Economic Area, DoughTools should rely on the provider’s data-processing terms, subprocessor disclosures, and applicable transfer safeguards such as Standard Contractual Clauses or adequacy decisions where relevant. The exact active safeguards must be confirmed against the configured production accounts.",
        ],
      },
      {
        heading: "Retention and deletion",
        id: "retention-and-deletion",
        paragraphs: [
          "Browser-local data remains until you delete it in the product where a delete/reset control exists, clear site data, switch browser profiles, or the browser removes it.",
          "Cloud pizza plans, completed history, Party Orders, guest submissions, and photos remain until you archive/delete them through available product controls, until account-level deletion is handled by request, or until DoughTools applies a future retention rule. Current code limits completed-plan list display to recent entries, but that display limit is not a deletion period.",
          "Uploaded pizza photos are replaced when a new photo is uploaded for the same completed session. The previous stored photo path is removed from Supabase Storage during replacement. Backup retention, support-email retention, exact log retention, and account deletion timing require Marcin/provider confirmation.",
        ],
      },
      {
        heading: "Security",
        id: "security",
        paragraphs: [
          "DoughTools uses authenticated account access for account-only features, Supabase row ownership checks through application queries and database policies, private signed URLs for stored pizza photos, public-token separation for Party Orders, and AI checks before photo upload.",
          "No online service can guarantee absolute security. You should keep your account password safe, avoid sharing Party Order edit links publicly, and avoid submitting sensitive information into free-text fields.",
        ],
      },
      {
        heading: "Your data-protection rights",
        id: "your-data-protection-rights",
        paragraphs: [
          "Depending on the situation, you may have rights to access, correct, delete, restrict, receive a copy of, or object to the use of your personal data. You may also withdraw consent where processing is based on consent.",
          `To make a request, contact ${projectContactEmail}. DoughTools may need enough information to verify that the request relates to you or your account. Deletion from backups or processor logs may follow the provider’s normal retention cycle rather than happening instantly.`,
          "You can also contact the Finnish Data Protection Ombudsman if you believe your data-protection rights have not been handled properly.",
        ],
      },
      {
        heading: "Children",
        id: "children",
        paragraphs: [
          "DoughTools is not directed to children. The product does not currently publish a confirmed minimum user age. Account creation, Party Orders, and photo uploads should be used only by people who can lawfully use an online service in their location, or with appropriate parent or guardian involvement.",
          "Do not submit a child’s personal data, photo, allergy information, or other sensitive information through DoughTools unless you have the right to do so and it is necessary for the feature you are using.",
        ],
      },
      {
        heading: "Changes to this notice",
        id: "changes-to-this-notice",
        paragraphs: [
          "DoughTools may update this notice when the product, providers, storage behavior, or legal requirements change. Material privacy changes should be reflected clearly rather than hidden in vague wording.",
        ],
      },
      {
        heading: "Contact and supervisory authority",
        id: "contact-and-supervisory-authority",
        paragraphs: [
          `Privacy contact: ${projectContactEmail}.`,
          "Supervisory authority: Office of the Data Protection Ombudsman, Finland. Use the authority’s official public website for current contact details and complaint guidance.",
        ],
      },
      {
        heading: "Effective date and last updated",
        id: "effective-date-and-last-updated",
        paragraphs: [
          "Effective from: 13 July 2026.",
          "Last updated: 13 July 2026.",
          "This page is a legally grounded product notice based on the inspected DoughTools implementation and official sources. It does not claim lawyer review, regulator approval, or guaranteed compliance.",
        ],
      },
    ],
  },
  terms: {
    id: "terms",
    href: "/terms",
    navLabel: "Terms",
    eyebrow: "Terms",
    title: "Clear rules for using DoughTools.",
    intro:
      "These Terms explain how the service may be used, what DoughTools provides, and the responsibilities that apply to accounts, photos, pizza plans, and Party Orders.",
    lastUpdated: "13 July 2026",
    effectiveFrom: "13 July 2026",
    heroImage: {
      src: "/images/trust/terms-hero-desktop.webp",
      mobileSrc: "/images/trust/terms-hero-mobile.webp",
      alt: "An orderly pizza-making workspace with blank planning cards, a closed notebook, and a finished pizza.",
      width: 1600,
      height: 900,
      mobileWidth: 900,
      mobileHeight: 1125,
    },
    summary: [
      {
        title: "DoughTools helps you plan and learn",
        body: "The service provides calculators, pizza plans, learning pages, Party Orders, and review tools.",
        href: "#what-doughtools-provides",
      },
      {
        title: "Calculations are estimates",
        body: "Ingredients, ovens, flour, yeast, temperature, and handling vary in real kitchens.",
        href: "#calculations-recipes-and-educational-information",
      },
      {
        title: "Use public links responsibly",
        body: "Party Order guest links and edit links can be used by people who receive them.",
        href: "#party-orders-and-public-guest-links",
      },
      {
        title: "Consumer rights are preserved",
        body: "These Terms do not remove mandatory rights that applicable law gives you.",
        href: "#liability-and-mandatory-consumer-rights",
      },
    ],
    sections: [
      {
        heading: "Terms at a glance",
        id: "terms-at-a-glance",
        paragraphs: [
          "DoughTools is a pizza-planning and learning companion. It helps you calculate, plan, shop, follow a timeline, use Kitchen, review bakes, manage Party Orders, and learn pizza-making topics.",
          "The service is guidance, not a guarantee. Dough behavior, oven performance, food safety, allergies, and equipment use still depend on your ingredients, environment, choices, and judgment.",
        ],
      },
      {
        heading: "Who provides DoughTools",
        id: "who-provides-doughtools",
        paragraphs: [
          `DoughTools is currently operated by ${projectOwner} in ${projectJurisdiction}. Contact: ${projectContactEmail}.`,
          "The current service is offered without a user fee in the inspected implementation. Paid features, subscriptions, renewals, refunds, or withdrawal rights are not currently implemented and would need separate product terms before launch.",
          "Postal address, business ID, formal company/trading status, liability-cap decisions, and dispute-procedure commitments still require Marcin confirmation and legal review.",
        ],
      },
      {
        heading: "Accepting the Terms",
        id: "accepting-the-terms",
        paragraphs: [
          "By using DoughTools, you agree to use it responsibly and in line with these Terms. If you do not agree, do not use the service.",
          "The inspected implementation does not show a separate logged Terms-acceptance checkbox or acceptance timestamp. If DoughTools later requires explicit acceptance for accounts or material changes, that should be implemented as a separate product decision.",
        ],
      },
      {
        heading: "Who may use the service",
        id: "who-may-use-the-service",
        paragraphs: [
          "DoughTools is not directed to children. The product does not currently publish a confirmed minimum user age. If you cannot lawfully use an online service or make cooking decisions in your location, use DoughTools only with appropriate parent or guardian involvement.",
          "If you use DoughTools for a business, public event, catering, or commercial food service, you are responsible for all local food, hygiene, labelling, allergen, consumer, tax, and safety rules that apply to that activity.",
        ],
      },
      {
        heading: "What DoughTools provides",
        id: "what-doughtools-provides",
        paragraphs: [
          "DoughTools currently includes pizza calculators, the standalone Quick Dough Calculator, pizza planning, Dough Plan and Shopping list views, Timeline, Kitchen, Review, account history, Party Orders, photo overlay features, and Pizza guides such as Dough guides, Sauce guides, Baking guides, Choose your pizza, Topping guides, and Practical pizza tips.",
          "Some features are local-only and stored in your browser. Some require an account. Some are educational or experimental and may change as DoughTools improves.",
        ],
      },
      {
        heading: "Accounts",
        id: "accounts",
        paragraphs: [
          "You are responsible for using an accurate email address, keeping your password safe, and not sharing account credentials. Supabase handles password authentication; DoughTools application code does not store your password.",
          "Account features may save pizza plans, completed history, Party Orders, and pizza photos in the cloud. If you use a shared device, remember that browser-local DoughTools data may remain visible in that browser unless you clear it.",
        ],
      },
      {
        heading: "Local and cloud storage",
        id: "local-and-cloud-storage",
        paragraphs: [
          "Browser-local data is tied to the browser and device. Clearing site data, changing browser profiles, or using another device may remove or hide local recipes, local sessions, and local preferences.",
          "Cloud-backed account data is available only where implemented and signed in. DoughTools may archive active or completed sessions through account controls rather than proving immediate physical deletion from every database copy or backup.",
        ],
      },
      {
        heading: "User responsibilities",
        id: "user-responsibilities",
        bullets: [
          "Use the service lawfully and do not try to bypass authentication, public-link protections, or rate/security controls.",
          "Enter accurate planning inputs if you want useful calculations.",
          "Do not submit sensitive personal information, allergy data, payment details, passwords, or other unnecessary private data into free-text fields.",
          "Follow food-safety guidance, ingredient labels, and equipment manufacturer instructions.",
          "Verify allergies and dietary requirements directly with guests; DoughTools does not verify them.",
        ],
      },
      {
        heading: "User content and photos",
        id: "user-content-and-photos",
        paragraphs: [
          "You retain ownership of content you submit, such as pizza photos, review notes, Party Order names/comments, and saved planning details. You grant DoughTools only the limited permission needed to store, process, display, moderate, and use that content for the feature you requested.",
          "You must have the rights needed to upload or submit the content. Do not upload unlawful content, sensitive personal information, images of people without rights or consent, or content that is not appropriate for a pizza-planning service.",
          "DoughTools may reject a photo if safety moderation or pizza-relevance checks fail. DoughTools will not use uploaded pizza photos for public marketing without separate permission.",
        ],
      },
      {
        heading: "Party Orders and public guest links",
        id: "party-orders-and-public-guest-links",
        paragraphs: [
          "A Party Order organizer creates a public guest link. The link is not a password-protected private area; anyone who receives or guesses a valid link may be able to access the guest form while it is open.",
          "Guests are responsible for entering accurate choices. Organizers are responsible for sharing links only with intended participants, checking final counts, handling allergies and dietary safety directly, and deciding whether to close, archive, or use Party Order totals in a pizza plan.",
          "DoughTools does not guarantee guest attendance, payment, dietary accuracy, or that a guest will not forward a link.",
        ],
      },
      {
        heading: "Calculations, recipes, and educational information",
        id: "calculations-recipes-and-educational-information",
        paragraphs: [
          "DoughTools provides estimates and educational guidance based on the inputs, formulas, assumptions, and current product logic. It is not professional culinary, medical, nutritional, safety, legal, or commercial advice.",
          "Ingredients, flour strength, yeast activity, room temperature, refrigerator temperature, dough temperature, oven heat, humidity, handling, and equipment all vary. You remain responsible for judging whether dough is ready, whether food is safe, and whether equipment is being used properly.",
          "Equipment manufacturer instructions and authoritative food-safety guidance take priority over DoughTools guidance.",
        ],
      },
      {
        heading: "Availability, changes, and beta status",
        id: "availability-changes-and-beta-status",
        paragraphs: [
          "DoughTools may improve, fix, add, remove, or change features for valid reasons such as security, reliability, legal requirements, product quality, or a clearer pizza-planning experience.",
          "DoughTools does not promise uninterrupted availability or that every current feature will remain forever. Material changes that affect users should be communicated appropriately with the timing, reason, and effect where required by law.",
          "If paid services are introduced later, they must have clear pricing, duration, cancellation, defect/conformity, refund, and withdrawal information before users are asked to pay.",
        ],
      },
      {
        heading: "Intellectual property",
        id: "intellectual-property",
        paragraphs: [
          "DoughTools owns or licenses the service design, text, interface, calculations presentation, images, and brand materials. You may use the service for personal pizza planning and learning, but you may not copy, resell, scrape, or present DoughTools as your own product.",
          "You keep ownership of your own uploaded or submitted content, subject to the limited operating licence described in these Terms.",
        ],
      },
      {
        heading: "Third-party services and links",
        id: "third-party-services-and-links",
        paragraphs: [
          "DoughTools relies on providers such as Supabase, Vercel, and OpenAI for parts of the service. Third-party services have their own terms, privacy notices, availability, and security practices.",
          "Learning pages may link to public sources or related pages. External links are provided for context and do not mean DoughTools controls or endorses everything on those sites.",
        ],
      },
      {
        heading: "Suspension and termination",
        id: "suspension-and-termination",
        paragraphs: [
          "DoughTools may suspend or restrict access when reasonably necessary to protect the service, users, legal compliance, security, or the integrity of account, Party Order, or photo features.",
          "Examples include abuse, attempted unauthorized access, unlawful content, harmful uploads, misuse of public links, or behavior that interferes with the service. Restrictions should be proportionate to the issue.",
        ],
      },
      {
        heading: "Liability and mandatory consumer rights",
        id: "liability-and-mandatory-consumer-rights",
        paragraphs: [
          "DoughTools is provided as a practical planning and learning service. It does not guarantee pizza quality, dough readiness, exact fermentation, uninterrupted availability, or that every result will match your kitchen conditions.",
          "To the extent permitted by law, DoughTools is not responsible for indirect losses, business losses, failed recipes, spoiled ingredients, equipment damage caused by misuse, or problems caused by incorrect user-entered data.",
          "Nothing in these Terms limits liability for intentional or grossly negligent conduct, or removes mandatory consumer rights that cannot legally be excluded. No monetary liability cap is stated because that requires a separate commercial/legal decision.",
        ],
      },
      {
        heading: "Changes to Terms",
        id: "changes-to-terms",
        paragraphs: [
          "DoughTools may update these Terms when the product, law, providers, or business model changes. Material changes should be communicated with a clear reason, timing, and effect where required.",
          "If a future change requires explicit acceptance, DoughTools should implement that acceptance as a separate product flow rather than treating the date on this page as proof of consent.",
        ],
      },
      {
        heading: "Governing law and dispute resolution",
        id: "governing-law-and-dispute-resolution",
        paragraphs: [
          "These Terms are intended to be governed by Finnish law, without removing mandatory consumer protections that may apply in your country of residence.",
          `If there is a problem, contact DoughTools first at ${projectContactEmail}. Consumers may also seek guidance from the Finnish Consumer Advisory Services. Where legally applicable, the Finnish Consumer Disputes Board may be available as an out-of-court dispute route, although its decisions are recommendations and its process has language requirements.`,
          "DoughTools does not link to the discontinued EU Online Dispute Resolution platform. The EU ODR platform was discontinued on 20 July 2025.",
        ],
      },
      {
        heading: "Contact",
        id: "contact",
        paragraphs: [
          `Questions about these Terms can be sent to ${projectContactEmail}.`,
        ],
      },
      {
        heading: "Effective date and last updated",
        id: "effective-date-and-last-updated",
        paragraphs: [
          "Effective from: 13 July 2026.",
          "Last updated: 13 July 2026.",
          "These Terms are a legally grounded product draft based on the inspected DoughTools implementation and official sources. They do not claim lawyer review, regulator approval, or guaranteed legal compliance.",
        ],
      },
    ],
  },
  methodology: {
    id: "methodology",
    href: "/methodology",
    navLabel: "Methodology",
    eyebrow: "Calculation Methodology",
    title: "How the dough calculation works.",
    intro:
      "DoughTools uses transparent baker’s percentages and a simple fermentation estimate. The calculation is useful for planning, but real dough still depends on flour, temperature and handling.",
    sections: [
      {
        heading: "Baker’s percentages",
        paragraphs: [
          "The dough formula is based on flour weight. Hydration means water as a percentage of flour. Salt is also calculated as a percentage of flour.",
          "The app starts from the target total dough: number of pizzas × dough-ball weight, plus the selected waste percentage.",
        ],
      },
      {
        heading: "Flour, water and salt",
        paragraphs: [
          "For commercial yeast dough, the flour amount is solved from the total dough weight after accounting for hydration, salt and the yeast percentage. Water is then flour × hydration percentage. Salt is flour × salt percentage.",
          "The waste percentage increases the total batch size before the flour, water, salt and leavening are split out.",
        ],
      },
      {
        heading: "Yeast estimate",
        paragraphs: [
          "The yeast estimate is calibrated around a compressed-yeast reference and adjusts for fermentation time and temperature. The current model uses an activity estimate where fermentation activity changes with temperature.",
          "Commercial yeast types are converted with the current factors used by the calculator: compressed yeast, active dry yeast and instant dry yeast.",
        ],
      },
      {
        heading: "Sourdough starter assumptions",
        paragraphs: [
          "The calculator also supports stiff sourdough starter at 50% hydration and liquid sourdough starter at 100% hydration. Starter flour and starter water are counted back into the total flour and water balance.",
          "Starter strength varies widely, so these sourdough amounts should be treated as starting estimates rather than exact fermentation predictions.",
        ],
      },
      {
        heading: "Rounding and real-world limits",
        bullets: [
          "Ingredient results are displayed with practical rounding.",
          "Tiny yeast amounts may require a precision scale.",
          "Flour strength, actual dough temperature, room temperature swings, refrigerator temperature and handling can all change the result.",
          "The app does not promise fermentation readiness or final pizza quality.",
        ],
      },
      {
        heading: "Reference regression case",
        paragraphs: [
          "The protected baseline case is: 6 pizzas, 260 g dough ball, 3% waste, 64% hydration, 2.8% salt, instant dry yeast, 24-hour cold fermentation and 4°C.",
          "Expected result: total dough 1606.8 g, flour 962.71 g, water 616.14 g, salt 26.96 g and yeast 0.99 g.",
        ],
      },
      {
        heading: "Pizza sauce sources and methodology",
        id: "pizza-sauce",
        paragraphs: [
          "Traditional Neapolitan sauce guidance is based on AVPN regulations and preparation guidance. Practical home-oven and recipe adaptations are clearly labelled as DoughTools recommendations or expert-informed adaptations.",
          "Sauce quantities, salt ratios, garlic levels and reduction settings are educational starting points. Tomato brands, cheese moisture, oven heat and personal preference still matter.",
        ],
        sources: publicPizzaSauceSources,
      },
      {
        heading: "Topping balance sources and methodology",
        id: "topping-balance",
        paragraphs: [
          "The Topping Balance Lab uses DoughTools’ existing topping calculator as the product baseline, then adds visual guidance for topped area, sauce density, cheese density, mozzarella drainage and combined moisture load.",
          "The visual guidance is practical and comparative. It is not a universal rule for every pizza style, oven or ingredient brand.",
        ],
        sources: publicToppingBalanceSources,
      },
    ],
  },
};
