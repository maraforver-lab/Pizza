export type TrustPageId = "about" | "contact" | "privacy" | "terms" | "methodology";

export type TrustPageSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type TrustPage = {
  id: TrustPageId;
  href: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  intro: string;
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
          "It later grew to include Party Orders because hosting friends created another real problem: collecting guest choices and turning them into dough quantities, shopping and a usable Pizza Session.",
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
    eyebrow: "Privacy Policy",
    title: "How DoughTools handles data.",
    intro:
      "This policy explains the current DoughTools data behavior in plain English.",
    sections: [
      {
        heading: "Local browser storage",
        paragraphs: [
          "Some recipe and tool data may be stored locally in your browser. This includes saved recipes in localStorage, active planning state in localStorage, gear checklist choices in localStorage, cost currency choices in localStorage and locally saved community recipe drafts.",
          "Pizza journal entries and compressed journal photos use the browser’s IndexedDB storage. This means the data is tied to the browser and device where it was saved unless a future feature explicitly moves it elsewhere.",
          "Browser-local data may be lost if you clear site data, reset the browser profile or use a different device.",
        ],
      },
      {
        heading: "Accounts and authentication",
        paragraphs: [
          "DoughTools includes account sign-in functionality. Where account features are used, account-related data may be handled by the configured Supabase authentication provider.",
          "Passwords are handled by Supabase authentication and are not stored in DoughTools application code.",
          "At this stage, saved recipes and journal entries are not described as cloud-synced account data.",
        ],
      },
      {
        heading: "Analytics and tracking",
        paragraphs: [
          "No analytics service is currently described in the application code inspected for this patch. If analytics, advertising pixels or cookie-based tracking are added later, this policy must be updated.",
        ],
      },
      {
        heading: "Export and deletion",
        paragraphs: [
          "Saved recipes can be deleted from the saved recipes section. Journal entries can be deleted from the journal where that feature is available.",
          "Browser-stored data may also be removed by clearing site data in the browser. Account deletion is not currently described as a self-service feature. For privacy-related questions or requests, contact DoughTools at hello@doughtools.app.",
        ],
      },
      {
        heading: "Controller and jurisdiction",
        paragraphs: [
          `Owner/legal entity: ${projectOwner}.`,
          `Contact: ${projectContactEmail}.`,
          `Jurisdiction: ${projectJurisdiction}.`,
        ],
      },
    ],
  },
  terms: {
    id: "terms",
    href: "/terms",
    navLabel: "Terms",
    eyebrow: "Terms of Use",
    title: "Use DoughTools as guidance, not a promise.",
    intro:
      "These terms describe the current product limits in plain English.",
    sections: [
      {
        heading: "Estimates and responsibility",
        paragraphs: [
          "DoughTools provides estimates, calculations and practical guidance for pizza making. The results are planning aids, not promises.",
          "Fermentation depends on flour, temperature, yeast activity, starter strength, dough temperature, handling and oven behavior. Users are responsible for checking food safety, ingredient suitability and whether the process fits their situation.",
        ],
      },
      {
        heading: "No professional assurance",
        paragraphs: [
          "DoughTools is not professional food-safety, legal, medical or commercial advice. No professional or commercial outcome is promised.",
          "If you use the tool for a business or public food service, you are responsible for meeting local rules, safety requirements and labeling obligations.",
        ],
      },
      {
        heading: "User content and sharing",
        paragraphs: [
          "Some current features let users save local recipes, journal entries or share recipe links. Public sharing, community publishing and account-connected storage should be treated only as available where implemented in the current product.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "Use DoughTools at your own discretion. To the extent allowed by applicable law, the site owner is not responsible for failed dough, spoiled ingredients, equipment damage, business losses or indirect losses caused by using the tool.",
        ],
      },
      {
        heading: "Owner, contact and jurisdiction",
        paragraphs: [
          `Owner/legal entity: ${projectOwner}.`,
          `Contact: ${projectContactEmail}.`,
          `Jurisdiction: ${projectJurisdiction}, where applicable.`,
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
    ],
  },
};
