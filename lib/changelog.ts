export type UpdateCategory =
  | "Product"
  | "Navigation"
  | "Calculator safety"
  | "Trust & legal"
  | "SEO & launch safety"
  | "Local saved bakes"
  | "Technical foundation";

export type UpdateEntry = {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: UpdateCategory;
  highlights: string[];
  details: string[];
  userImpact: string;
  technicalNote?: string;
  isPublic: boolean;
  patchNumbers: number[];
  relatedPatchNumbers?: number[];
  href: string;
};

export type PatchHistoryEntry = {
  patch: number;
  title: string;
  category: UpdateCategory;
  summary: string;
  highlights: string[];
  details: string[];
  userImpact: string;
  technicalNote?: string;
};

export const MAX_VISIBLE_UPDATES = 20;

export const updates: UpdateEntry[] = [
  {
    id: "foundation-update-2026-06-23",
    title: "DoughTools foundation update",
    date: "2026-06-23",
    summary:
      "DoughTools now has a clearer English-only workflow, safer calculations, better navigation, trust pages, noindex-safe launch configuration and local saved bakes.",
    category: "Product",
    highlights: [
      "Cleaner English-only interface",
      "Better navigation around the pizza-making workflow",
      "Clearer homepage and calculator journey",
      "Calculation and saved-recipe safety tests",
      "New About, Privacy, Terms and Methodology pages",
      "Safe SEO and noindex launch configuration",
      "Local-only saved bakes in the Journal",
      "Production-domain noindex launch preparation",
    ],
    details: [
      "The active interface has been stabilized around one English workflow.",
      "The calculator, planner, guide pages, trust pages and saved-bake foundation now share a clearer product direction.",
      "The site remains protected by noindex while launch checks continue.",
    ],
    userImpact:
      "Users get a calmer, safer pizza-making workspace with better navigation, clearer trust information and local saved-bake foundations.",
    technicalNote:
      "This public update summarizes foundation work only; it does not enable indexing, cloud sync, photo upload, public bake pages or share cards.",
    isPublic: true,
    patchNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    relatedPatchNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    href: "/updates",
  },
];

export const RECENT_UPDATE_NOTICE_VISIBLE_MS = 30_000;

function dateSortValue(value: string): number {
  const day = utcDayFromDateOnly(value);
  return day ?? Number.NEGATIVE_INFINITY;
}

export function sortUpdatesNewestFirst<T extends Pick<UpdateEntry, "date">>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => dateSortValue(b.date) - dateSortValue(a.date));
}

export function getVisibleUpdates<T extends Pick<UpdateEntry, "date">>(
  items: readonly T[],
  max = MAX_VISIBLE_UPDATES,
): T[] {
  if (max <= 0) return [];
  return sortUpdatesNewestFirst(items).slice(0, max);
}

export const patchHistory: PatchHistoryEntry[] = [
  {
    patch: 1,
    title: "English-only stabilization",
    category: "Product",
    summary: "DoughTools was stabilized around one active English interface.",
    highlights: [
      "Active UI copy is English-only",
      "Visible language selectors were removed",
      "Browser-language switching was disabled",
    ],
    details: [
      "The early multilingual layer made the product harder to maintain while the core workflow was still changing.",
      "Patch 01 removed visible language switching and safely ignored old stored language values.",
      "This reduced development complexity and made later patches easier to review.",
    ],
    userImpact: "The app behaves more predictably while the main pizza-making workflow is still being refined.",
  },
  {
    patch: 2,
    title: "Calculation and persistence safety net",
    category: "Calculator safety",
    summary: "A test safety net was added around dough math and saved recipe behavior.",
    highlights: [
      "Vitest test coverage added",
      "Core dough calculation regression cases protected",
      "Saved recipes, legacy data and shared recipe URLs checked",
    ],
    details: [
      "The calculator needed a stable base before more product features were layered on top.",
      "Patch 02 added automated checks for the important dough-calculation path and persistence edge cases.",
      "It also protected shared recipe URL parsing so recipe links remain reliable.",
    ],
    userImpact: "Future improvements can be made with less risk of accidentally breaking existing recipes.",
  },
  {
    patch: 3,
    title: "Navigation and primary workflow",
    category: "Navigation",
    summary: "Navigation was grouped around the way people actually make pizza.",
    highlights: [
      "Workflow-based navigation groups",
      "Desktop and mobile navigation improved",
      "Dough Calculator kept as the primary entry point",
    ],
    details: [
      "As the app gained more tools, the navigation needed to stop feeling like a long list of experiments.",
      "Patch 03 grouped tools into a clearer pizza-making workflow for planning, learning and saving results.",
      "The calculator remained the main starting point so existing users would not lose their familiar path.",
    ],
    userImpact: "Users can find the next useful tool more easily without guessing where each feature lives.",
  },
  {
    patch: 4,
    title: "Homepage and primary user journey",
    category: "Product",
    summary: "The homepage was rewritten to explain the main DoughTools journey.",
    highlights: [
      "Value proposition clarified",
      "Workflow steps added",
      "Fermentation Planner positioned as the next step",
    ],
    details: [
      "The homepage needed to explain that DoughTools is more than a single dough calculator.",
      "Patch 04 made the page point from recipe calculation into planning and preparation.",
      "The result is a clearer first impression for new home pizza makers.",
    ],
    userImpact: "New visitors can understand what the product does before diving into the calculator.",
  },
  {
    patch: 5,
    title: "Trust, legal and methodology pages",
    category: "Trust & legal",
    summary: "Core trust pages were added before public launch work continued.",
    highlights: [
      "About, Contact, Privacy, Terms and Methodology pages added",
      "Calculation methodology explained",
      "Public copy cleaned up for accuracy",
    ],
    details: [
      "Patch 05 added the support pages users expect from a serious public tool.",
      "The methodology page explains the baker’s percentage logic and known limitations in plain language.",
      "Privacy and terms copy avoid fake company details and unsupported promises.",
    ],
    userImpact: "Users can better understand what the app does, how estimates work and how data is described.",
  },
  {
    patch: 6,
    title: "SEO launch safety",
    category: "SEO & launch safety",
    summary: "A safe SEO foundation was added without opening the site to indexing.",
    highlights: [
      "Central SEO configuration added",
      "Noindex kept active by default",
      "Sitemap, robots and canonical behavior documented",
    ],
    details: [
      "Patch 06 prepared the site structure for a future public launch while keeping it protected.",
      "Private or account-related routes were excluded from sitemap behavior where appropriate.",
      "The configuration keeps indexing disabled unless intentionally changed later.",
    ],
    userImpact: "The project can be tested on the production domain without accidentally inviting search engines too early.",
  },
  {
    patch: 7,
    title: "Launch placeholders cleanup",
    category: "Trust & legal",
    summary: "Visible launch placeholders were replaced with real project details.",
    highlights: [
      "Contact email added",
      "Owner/legal entity added",
      "Jurisdiction set to Finland",
    ],
    details: [
      "Patch 07 replaced placeholder legal and contact copy that made the site feel unfinished.",
      "It added the real contact email, owner name and Finnish jurisdiction where relevant.",
      "The copy remained careful and did not invent company registration details, addresses or guarantees.",
    ],
    userImpact: "Trust pages feel more complete and users have a real contact path.",
  },
  {
    patch: 8,
    title: "Visual and mobile polish",
    category: "Product",
    summary: "The public interface received a focused mobile and copy polish pass.",
    highlights: [
      "Mobile readability improved",
      "Footer and overflow safeguards checked",
      "Public copy cleaned up",
    ],
    details: [
      "Patch 08 focused on the parts of the app that make it feel finished on smaller screens.",
      "Footer links, long text and public-facing copy were checked for readability and accuracy.",
      "The goal was polish, not a redesign.",
    ],
    userImpact: "The app feels more stable and readable on phones, where many pizza makers will actually use it.",
  },
  {
    patch: 9,
    title: "Production-domain verification docs",
    category: "SEO & launch safety",
    summary: "Production-domain and Vercel verification steps were documented safely.",
    highlights: [
      "Production domain documented",
      "Safe environment values documented",
      ".env.example added",
    ],
    details: [
      "Patch 09 documented how to verify the production domain and Vercel configuration.",
      "It captured safe environment settings such as the public site URL and indexing flag.",
      "No indexing was enabled as part of the documentation work.",
    ],
    userImpact: "Launch checks can be repeated more confidently without relying on memory.",
  },
  {
    patch: 10,
    title: "Manual launch rehearsal checklist",
    category: "SEO & launch safety",
    summary: "A manual checklist was added for rehearsing a safe launch.",
    highlights: [
      "Before-deployment checks documented",
      "Post-deployment noindex checks included",
      "Rollback plan written down",
    ],
    details: [
      "Patch 10 created a launch rehearsal checklist for a controlled noindex deployment.",
      "It includes what to check in Vercel, what to verify after deployment and what not to do yet.",
      "The checklist explicitly keeps indexing closed until a later deliberate decision.",
    ],
    userImpact: "There is a safer operational path for future launches and rollbacks.",
  },
  {
    patch: 11,
    title: "BakeResult data model",
    category: "Technical foundation",
    summary: "A private-by-default data model for future completed bakes was added.",
    highlights: [
      "RecipeSnapshot and BakeResult models added",
      "Private visibility set as the default",
      "Future-ready foundation for saved bakes and share cards",
    ],
    details: [
      "Patch 11 introduced versioned models for completed pizza bakes without connecting them to the UI yet.",
      "Recipe snapshots are copied so future saved bakes can preserve the recipe used at the time.",
      "Public and unlisted states exist only as future-ready model values, not as active publishing features.",
    ],
    userImpact: "The app gained a safer technical foundation for tracking real baking results later.",
    technicalNote: "This patch did not add UI, storage integration, photo upload, sharing or public bake pages.",
  },
  {
    patch: 12,
    title: "Local saved bakes",
    category: "Local saved bakes",
    summary: "Users can save completed bakes locally on the current device.",
    highlights: [
      "Save this bake added to the calculator result area",
      "Saved bakes shown in the Journal",
      "Local deletion supported",
    ],
    details: [
      "Patch 12 connected the BakeResult model to a small local-only workflow.",
      "Saved bakes use the dedicated browser localStorage key doughtools:bake-results.",
      "The Journal shows saved bakes separately from the existing photo journal.",
    ],
    userImpact: "Users can keep a private local record of a bake without creating a public page or uploading data.",
    technicalNote: "This patch did not add photo upload, share cards, cloud sync, Supabase storage or public visibility controls.",
  },
  {
    patch: 13,
    title: "Updates changelog and recent notice",
    category: "Product",
    summary: "A public updates page and temporary recent-update notice were added.",
    highlights: [
      "/updates rebuilt as a readable changelog",
      "Site-wide New update notice added",
      "5-day recency rule added",
    ],
    details: [
      "Patch 13 introduced centralized changelog data and a public Updates page.",
      "The notice points users to the changelog when a recent public update exists.",
      "The notice does not use tracking, cookies or localStorage dismissal behavior.",
    ],
    userImpact: "Users can see what changed without needing to understand Git commits or internal patch notes.",
  },
  {
    patch: 14,
    title: "Update ordering and timed banner",
    category: "Product",
    summary: "Updates now render newest-first and the recent-update notice auto-hides.",
    highlights: [
      "Newest-first release ordering",
      "Recent-update banner hides after 30 seconds",
      "5-day recency rule preserved",
    ],
    details: [
      "Patch 14 made the Updates page show the newest release entries first.",
      "The site-wide notice now disappears automatically after 30 seconds on page load.",
      "The banner remains non-modal, non-blocking and does not store dismissal state.",
    ],
    userImpact: "The Updates page reads more naturally, and the temporary banner stays helpful without getting in the way.",
  },
];

export const publicUpdatesNewestFirst = sortUpdatesNewestFirst(updates.filter((update) => update.isPublic));

export const patchHistoryNewestFirst = [...patchHistory].sort((a, b) => b.patch - a.patch);

export const visiblePublicUpdates = getVisibleUpdates(updates.filter((update) => update.isPublic));

export const visiblePatchHistory = patchHistoryNewestFirst.slice(0, MAX_VISIBLE_UPDATES);

export const latestPublicUpdate = publicUpdatesNewestFirst[0];

export const newUpdateNotice = {
  label: "New update",
  copy: "See what changed in DoughTools",
  href: "/updates",
} as const;

function utcDayFromDateOnly(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return undefined;

  return Math.floor(date.getTime() / 86_400_000);
}

function utcDayFromDate(value: Date): number | undefined {
  const time = value.getTime();
  if (!Number.isFinite(time)) return undefined;
  return Math.floor(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) / 86_400_000);
}

export function isUpdateRecent(updateDate: string | undefined, now: Date = new Date(), maxAgeDays = 5) {
  if (!updateDate) return false;
  const updateDay = utcDayFromDateOnly(updateDate);
  const nowDay = utcDayFromDate(now);
  if (updateDay === undefined || nowDay === undefined) return false;

  const ageDays = nowDay - updateDay;
  return ageDays >= 0 && ageDays <= maxAgeDays;
}
