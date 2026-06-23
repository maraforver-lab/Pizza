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
  isPublic: boolean;
  patchNumbers: number[];
  href: string;
};

export type PatchHistoryEntry = {
  patch: number;
  title: string;
  category: UpdateCategory;
  summary: string;
};

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
    isPublic: true,
    patchNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    href: "/updates",
  },
];

export const patchHistory: PatchHistoryEntry[] = [
  {
    patch: 1,
    title: "English-only stabilization",
    category: "Product",
    summary: "The active interface was simplified to English and browser-language switching was disabled.",
  },
  {
    patch: 2,
    title: "Calculation and persistence safety net",
    category: "Calculator safety",
    summary: "Regression tests were added for dough calculations, saved recipes, legacy data and shared recipe URLs.",
  },
  {
    patch: 3,
    title: "Navigation and primary workflow",
    category: "Navigation",
    summary: "Navigation was grouped around the pizza-making workflow while keeping the Dough Calculator as the primary entry.",
  },
  {
    patch: 4,
    title: "Homepage and primary user journey",
    category: "Product",
    summary: "The homepage now explains the product journey more clearly and points users from the calculator into planning.",
  },
  {
    patch: 5,
    title: "Trust, legal and methodology pages",
    category: "Trust & legal",
    summary: "About, Contact, Privacy, Terms and Methodology pages were added with practical, transparent wording.",
  },
  {
    patch: 6,
    title: "SEO launch safety",
    category: "SEO & launch safety",
    summary: "Central SEO configuration was added while keeping noindex active and private routes out of the sitemap.",
  },
  {
    patch: 7,
    title: "Launch placeholders cleanup",
    category: "Trust & legal",
    summary: "Contact, owner and jurisdiction placeholders were replaced with real project details.",
  },
  {
    patch: 8,
    title: "Visual and mobile polish",
    category: "Product",
    summary: "Mobile/footer polish and public copy cleanup made the site feel less like a prototype.",
  },
  {
    patch: 9,
    title: "Production-domain verification docs",
    category: "SEO & launch safety",
    summary: "Production-domain and Vercel verification steps were documented without enabling indexing.",
  },
  {
    patch: 10,
    title: "Manual launch rehearsal checklist",
    category: "SEO & launch safety",
    summary: "A manual launch checklist documented deployment checks, noindex verification and rollback steps.",
  },
  {
    patch: 11,
    title: "BakeResult data model",
    category: "Technical foundation",
    summary: "RecipeSnapshot, BakeResult and SharePreferences were introduced with private-by-default visibility.",
  },
  {
    patch: 12,
    title: "Local saved bakes",
    category: "Local saved bakes",
    summary: "A local-only Save this bake flow was added, with saved bakes stored privately on the device.",
  },
];

export const latestPublicUpdate = updates.find((update) => update.isPublic);

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
