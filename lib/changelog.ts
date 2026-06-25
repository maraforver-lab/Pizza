export type UpdateCategory =
  | "Product"
  | "Navigation"
  | "Calculator safety"
  | "Trust & legal"
  | "SEO & launch safety"
  | "Local saved bakes"
  | "Personalization"
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
    id: "homepage-minimal-ux-lockdown-2026-06-25",
    title: "Homepage minimal UX lockdown",
    date: "2026-06-25",
    summary:
      "The homepage was reduced to a minimal beta front door focused on Start Pizza Session.",
    category: "Product",
    highlights: [
      "Removed visible homepage navigation clutter",
      "Start Pizza Session is the only hero action",
      "Open calculator and old secondary homepage links were removed from the visible homepage",
      "Guidance level and Continue Session remain",
      "Existing tools and routes were not deleted",
      "No formulas, storage, tracking, cloud sync, payments, security or SEO behavior changed",
    ],
    details: [
      "Patch 40 locks the homepage down to the minimal beta front door.",
      "The visible homepage now keeps the brand header, hero, Start Pizza Session, local-first note, guidance level and real active-session continuation only.",
      "Old navigation and secondary tool entry points remain available by direct route, but no longer compete with the first homepage action.",
    ],
    userImpact:
      "Users see one clear first action instead of a page that feels like a toolbox.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [40],
    relatedPatchNumbers: [37, 38, 39, 40],
    href: "/updates",
  },
  {
    id: "homepage-session-first-visual-cleanup-2026-06-25",
    title: "Homepage session-first visual cleanup",
    date: "2026-06-25",
    summary:
      "The homepage now follows a cleaner session-first layout with Start Pizza Session as the primary path.",
    category: "Product",
    highlights: [
      "Start Pizza Session is the main homepage action",
      "Open calculator remains available as a secondary action",
      "Guidance level and Continue Session stay visible but controlled",
      "The homepage explains the DoughTools session path more clearly",
      "Existing tools and routes remain available",
      "No formulas, storage, tracking, cloud sync or indexing behavior changed",
    ],
    details: [
      "Patch 39 aligns the homepage with the approved session-first visual direction.",
      "The page now focuses on the main user journey instead of showing a crowded tool dashboard.",
      "Existing calculators, tools and session routes remain available through clear secondary links.",
    ],
    userImpact:
      "Users get a clearer first impression and one obvious way to begin a pizza session.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [39],
    relatedPatchNumbers: [37, 38, 39],
    href: "/updates",
  },
  {
    id: "session-review-bake-notes-2026-06-25",
    title: "Session review and bake notes",
    date: "2026-06-25",
    summary:
      "Pizza sessions can now end with a local review, rating and improvement notes.",
    category: "Product",
    highlights: [
      "New session review route",
      "Rating, notes, what worked and improvement fields",
      "Completed sessions are no longer treated as active sessions",
      "Kitchen Mode can hand off to review",
      "Beginner, Enthusiast and Pizza Nerd review guidance stays consistent",
      "No photo upload, cloud sync, tracking or indexing behavior added",
    ],
    details: [
      "Patch 38 adds the first review step to the Pizza Session flow.",
      "Users can finish a session by saving a rating, notes and what to improve next time.",
      "The review remains local to the browser and prepares future photo, result-card and richer Journal features.",
    ],
    userImpact:
      "Users can learn from each bake instead of losing what they discovered.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [38],
    relatedPatchNumbers: [31, 32, 33, 34, 35, 36, 38],
    href: "/updates",
  },
  {
    id: "session-first-homepage-cleanup-2026-06-25",
    title: "Session-first homepage cleanup",
    date: "2026-06-25",
    summary:
      "The homepage now focuses on one clear Start Pizza Session path instead of showing many separate tool sections at once.",
    category: "Product",
    highlights: [
      "Start Pizza Session becomes the clear homepage action",
      "Homepage copy now explains what DoughTools does and why it helps",
      "Session flow is summarized simply: choose, dough plan, timeline, shopping, kitchen steps",
      "Old calculator, save, share and workshop-heavy homepage blocks were removed from the primary flow",
      "Existing tools and routes remain available",
      "No formulas, storage, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 37 simplifies the homepage so new users understand the guided Pizza Session path first.",
      "Existing DoughTools tools remain available, but the homepage no longer acts as a crowded dashboard of every feature.",
      "Recipe results, save and share actions, My Recipes and deeper tools are kept in their more appropriate workflow contexts.",
    ],
    userImpact:
      "Users get a clearer first impression and one obvious place to start.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [37],
    relatedPatchNumbers: [31, 32, 33, 34, 35, 36, 37],
    href: "/updates",
  },
  {
    id: "session-kitchen-mode-2026-06-25",
    title: "Session Kitchen Mode",
    date: "2026-06-25",
    summary:
      "Pizza sessions can now guide the user through the saved timeline one kitchen task at a time.",
    category: "Product",
    highlights: [
      "New session kitchen route",
      "Current task view based on the active Pizza Session timeline",
      "Mark done saves timeline progress locally",
      "Mix dough can show saved recipe snapshot ingredient amounts",
      "Next task preview and links back to Timeline, Shopping List and Calculator",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No formula, cloud sync, reminder, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 36 adds a focused Kitchen Mode step to the local Pizza Session workflow.",
      "The route reads the saved timeline, shows the first todo task and advances progress when the user marks a task done.",
      "Recipe snapshot values are displayed where available, especially for the Mix dough step, without recalculating or changing formulas.",
      "Existing timeline, shopping, calculator, timer and journal routes remain available.",
    ],
    userImpact:
      "Users can move from planning into a calmer cooking view that answers what to do now while keeping progress local to the browser.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [36],
    relatedPatchNumbers: [31, 32, 33, 34, 35, 36],
    href: "/updates",
  },
  {
    id: "session-recipe-build-step-2026-06-25",
    title: "Session recipe build step",
    date: "2026-06-25",
    summary:
      "Pizza sessions can now turn the user’s choices into a clear dough plan before timeline and shopping.",
    category: "Product",
    highlights: [
      "New session recipe route",
      "Dough plan generated from active Pizza Session choices",
      "Recipe snapshot saved locally into the active session",
      "Wizard copy clarified for baking path and pizza preset choices",
      "Clear next actions to Timeline, Shopping List and Calculator",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No formula, cloud sync, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 35 adds a dedicated dough plan step to the Pizza Session flow.",
      "The session wizard now separates baking path from pizza preset choice, making the first decisions clearer.",
      "The recipe step stores calculator-compatible recipe parameters and a recipe snapshot in the local session where safe.",
      "Existing calculators and formulas remain unchanged.",
    ],
    userImpact:
      "Users can see how much dough to make before moving to the timeline, shopping list and kitchen steps.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [35],
    relatedPatchNumbers: [31, 32, 33, 34, 35],
    href: "/updates",
  },
  {
    id: "session-shopping-list-presets-2026-06-25",
    title: "Session shopping list generator",
    date: "2026-06-25",
    summary:
      "Pizza sessions can now create a practical shopping list from a selected pizza preset.",
    category: "Product",
    highlights: [
      "New session shopping route",
      "Pizza preset cards such as Margherita, Marinara and Diavola",
      "Grouped shopping list for dough, sauce, cheese, toppings and gear",
      "Already have, need to buy and bought item states",
      "Local-first shopping list saved into the active session",
      "No custom ingredient database, tracking, cloud sync or indexing behavior added",
    ],
    details: [
      "Patch 34 adds a preset-based shopping list step to the local Pizza Session workflow.",
      "Users can choose a familiar pizza style, review grouped ingredients and mark items by shopping status.",
      "The feature stays intentionally practical: exact topping formulas and custom ingredient editing can come later.",
    ],
    userImpact:
      "Users can turn a planned pizza session into a simple shopping checklist without leaving the local-first workflow.",
    technicalNote:
      "This patch did not change dough formulas, planner timing logic, Dough Doctor diagnosis logic, saved recipe storage, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [34],
    relatedPatchNumbers: [31, 32, 33, 34],
    href: "/updates",
  },
  {
    id: "session-timeline-backward-schedule-2026-06-25",
    title: "Session timeline and backward schedule",
    date: "2026-06-25",
    summary:
      "Pizza sessions can now generate a practical timeline from the planned bake or eat time.",
    category: "Product",
    highlights: [
      "New session timeline route",
      "Backward-planned pizza preparation steps",
      "Active session timeline saved locally",
      "Next-step guidance added",
      "Beginner, Enthusiast and Pizza Nerd timing guidance stays consistent",
      "No reminders, tracking, cloud sync or indexing behavior added",
    ],
    details: [
      "Patch 33 turns the target time from the Start Pizza Session wizard into a practical pizza timeline.",
      "The timeline gives users a clearer view of what to do next, when to prepare dough, when to preheat and when to bake.",
      "Timing remains a practical guide and can be refined in later Planner and Kitchen Mode patches.",
    ],
    userImpact:
      "Users can move from “I want pizza at this time” to a concrete preparation schedule without guessing the order of tasks.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [33],
    relatedPatchNumbers: [31, 32, 33],
    href: "/updates",
  },
  {
    id: "start-pizza-session-wizard-2026-06-25",
    title: "Start Pizza Session wizard",
    date: "2026-06-25",
    summary:
      "A guided Start Pizza Session flow now helps users begin a pizza bake one step at a time.",
    category: "Product",
    highlights: [
      "New guided Pizza Session start flow",
      "Style, time, quantity, oven and flour decisions saved locally",
      "Progress is autosaved to the active browser session",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No cloud sync, reminders, tracking or indexing behavior added",
    ],
    details: [
      "Patch 32 uses the local Pizza Session model from Patch 31 to create the first guided session wizard.",
      "Users can start a planned pizza bake, make the first key decisions and return later on the same browser.",
      "The wizard prepares the next timeline, shopping list and kitchen mode patches without changing existing calculators or formulas.",
    ],
    userImpact:
      "Users can start with one clear decision at a time instead of choosing from separate tools immediately.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [32],
    relatedPatchNumbers: [22, 31, 32],
    href: "/updates",
  },
  {
    id: "pizza-session-data-model-autosave-2026-06-25",
    title: "Pizza Session data model and autosave foundation",
    date: "2026-06-25",
    summary:
      "A local-first Pizza Session foundation was added so future guided pizza sessions can be saved and continued.",
    category: "Technical foundation",
    highlights: [
      "Versioned Pizza Session model added",
      "Local browser storage helpers added",
      "Active session tracking foundation added",
      "Last saved and continue-session behavior prepared",
      "No cloud sync, tracking, reminders or indexing behavior added",
    ],
    details: [
      "Patch 31 introduces the underlying data model for a pizza session: one planned bake from idea to recipe, timeline, preparation, baking and review.",
      "Sessions are stored locally in the browser for now, with schema versioning and safe recovery from malformed stored data.",
      "This prepares the next guided session wizard without changing existing calculators, recipes, saved recipe storage or account behavior.",
    ],
    userImpact:
      "DoughTools is now technically prepared to let users continue a pizza session later on the same device.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [31],
    relatedPatchNumbers: [12, 29, 30, 31],
    href: "/updates",
  },
  {
    id: "install-add-to-home-screen-2026-06-25",
    title: "Install DoughTools / Add to Home Screen",
    date: "2026-06-25",
    summary:
      "DoughTools now gives users a clearer way to install the site or add it to their home screen.",
    category: "Product",
    highlights: [
      "Install and Add to Home Screen guidance added",
      "Web app manifest reviewed and improved",
      "Supported browsers can show an install prompt",
      "iOS and unsupported browsers get manual home-screen instructions",
      "No tracking, push notifications, offline mode or Google indexing added",
    ],
    details: [
      "Patch 30 adds a small install experience so users can keep DoughTools easier to access while planning and baking pizza.",
      "The feature uses browser-supported install behavior where available and shows honest fallback instructions elsewhere.",
      "The update keeps the existing local-first workflow and does not change calculations, saved recipes or account behavior.",
    ],
    userImpact:
      "Users can return to DoughTools more easily from their phone or desktop without searching for the site again.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [30],
    relatedPatchNumbers: [27, 29, 30],
    href: "/updates",
  },
  {
    id: "saved-recipe-account-value-ux-2026-06-25",
    title: "Saved recipe and account value UX",
    date: "2026-06-25",
    summary:
      "Saved recipes now explain their value more clearly and account copy is more honest about local browser storage.",
    category: "Product",
    highlights: [
      "Recipe result area explains why saving a recipe helps",
      "Saved recipe cards expose next actions for Planner, Sauce, Toppings, Timer, Dough Doctor and Journal",
      "Account page explains the current local-first storage model",
      "Beginner, Enthusiast and Pizza Nerd saved-recipe guidance is clearer",
      "No formulas, account sync, storage format, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 29 clarifies that a saved recipe preserves the exact calculator setup for reuse, planning, troubleshooting and comparison.",
      "Saved recipe cards now make the existing workflow easier to continue from a saved setup without changing the saved recipe data model.",
      "Account copy now states that saved recipes, local BakeResults and Journal photos remain browser-local for now.",
    ],
    userImpact:
      "Users can better understand why saving a recipe matters and can reuse a successful setup across the DoughTools workflow.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, planner timing logic, Dough Doctor diagnosis logic, saved recipe storage format, Journal IndexedDB, Supabase behavior, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [29],
    relatedPatchNumbers: [12, 16, 19, 28, 29],
    href: "/updates",
  },
  {
    id: "core-recipe-workflow-handoff-2026-06-24",
    title: "Core recipe workflow handoff",
    date: "2026-06-24",
    summary:
      "Recipe results now guide users more clearly into the next DoughTools steps.",
    category: "Product",
    highlights: [
      "Clearer next-step area after calculating dough",
      "Planner, Sauce, Toppings, Timer and Dough Doctor actions are easier to find",
      "Recipe context is preserved where supported",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No formulas, storage, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 28 strengthens the handoff from recipe results into the rest of the DoughTools workflow.",
      "Users can move from dough numbers to planning, sauce, toppings, timing and troubleshooting with clearer actions.",
      "Existing query-link behavior is preserved and no unsupported tool parameters are invented.",
    ],
    userImpact:
      "Users can understand what to do after getting a recipe instead of stopping at the ingredient numbers.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [28],
    relatedPatchNumbers: [22, 26, 27, 28],
    href: "/updates",
  },
  {
    id: "security-launch-baseline-2026-06-24",
    title: "Security headers and launch safety baseline",
    date: "2026-06-24",
    summary:
      "A security and launch-safety baseline was added before broader public launch work.",
    category: "SEO & launch safety",
    highlights: [
      "Security response headers reviewed",
      "Safer baseline headers added",
      "Pre-launch indexing protection preserved",
      "Production verification checklist documented",
      "No analytics, tracking or payment behavior added",
    ],
    details: [
      "Patch 27 reviews DoughTools security headers and adds a conservative launch-safety baseline where safe.",
      "The patch documents which headers are active, which choices were deferred, and what must be checked after deployment.",
      "Google indexing remains disabled and no Search Console or analytics integrations were added.",
    ],
    userImpact:
      "DoughTools gets a stronger technical safety baseline while the pizza workflow and calculations remain unchanged.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [27],
    relatedPatchNumbers: [23, 25, 26, 27],
    href: "/updates",
  },
  {
    id: "calculator-progressive-disclosure-2026-06-24",
    title: "Calculator progressive disclosure",
    date: "2026-06-24",
    summary:
      "The calculator now adapts its control depth more clearly for Beginner, Enthusiast and Pizza Nerd users.",
    category: "Personalization",
    highlights: [
      "Beginner users see a simpler calculator path first",
      "Advanced settings are still available without overwhelming the first view",
      "Enthusiast users get more practical explanation",
      "Pizza Nerd users keep access to full technical depth",
      "Recipe result next steps are clearer",
    ],
    details: [
      "Patch 26 organizes calculator controls and guidance around the existing experience-level system.",
      "Beginner mode focuses on essential choices and a clearer next step after calculation.",
      "Enthusiast and Pizza Nerd modes preserve deeper settings, explanations and technical detail.",
      "Existing formulas, recipe math, query links and saved recipe behavior remain unchanged.",
    ],
    userImpact:
      "New users can get a recipe with less confusion, while experienced users still keep control over the full dough setup.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [26],
    relatedPatchNumbers: [21, 22, 24, 25, 26],
    href: "/updates",
  },
  {
    id: "performance-rendering-baseline-2026-06-24",
    title: "Performance and rendering baseline",
    date: "2026-06-24",
    summary:
      "A performance baseline was added for core DoughTools routes before broader launch work and calculator UX changes.",
    category: "Technical foundation",
    highlights: [
      "Core route build and production-mode checks documented",
      "Rendering and client-heavy risk areas reviewed",
      "Initial route performance budget proposed",
      "Optimization backlog created without changing product behavior",
      "Google indexing remains disabled",
    ],
    details: [
      "Patch 25 documents how the homepage, Start Here, Planner, Dough Doctor, Guide, Updates and Account routes build and serve in production mode.",
      "The patch records what can and cannot be concluded from local build and route checks.",
      "It creates a practical baseline for future performance work without changing calculations, saved data, indexing or tracking behavior.",
      "The findings should guide the next calculator progressive disclosure patch so the beginner experience improves without unnecessary performance cost.",
    ],
    userImpact:
      "The app has a clearer technical quality baseline, helping future improvements focus on the parts of the workflow that matter most.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [25],
    relatedPatchNumbers: [23, 24, 25],
    href: "/updates",
  },
  {
    id: "accessibility-core-ux-2026-06-24",
    title: "Accessibility pass for core UX",
    date: "2026-06-24",
    summary:
      "Core DoughTools screens were reviewed and improved for clearer labels, keyboard focus and accessible controls.",
    category: "Product",
    highlights: [
      "Clearer accessible names for key controls",
      "Better label and focus handling across core workflows",
      "Experience level and Start Here cards remain understandable without relying on color alone",
      "Mobile and keyboard usability checks added to the baseline",
    ],
    details: [
      "Patch 24 improves the accessibility baseline for the homepage, Start Here, navigation and core tool pages.",
      "The pass focuses on form labels, control names, focus visibility, link purpose and color-not-alone behavior.",
      "The update keeps the existing workflow intact and does not change calculations or indexing permissions.",
    ],
    userImpact:
      "DoughTools is easier to use with a keyboard, screen reader, or mobile device, and important choices are clearer for more users.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
    isPublic: true,
    patchNumbers: [24],
    relatedPatchNumbers: [20, 21, 22, 23, 24],
    href: "/updates",
  },
  {
    id: "seo-indexation-canonical-baseline-2026-06-24",
    title: "SEO indexation and canonical baseline",
    date: "2026-06-24",
    summary:
      "DoughTools now has a clearer search-indexing baseline for public pages, Start Here and shareable tool links.",
    category: "SEO & launch safety",
    highlights: [
      "Cleaner canonical URL policy",
      "Sitemap and robots baseline reviewed",
      "Start Here included as a public discovery page",
      "Query-param tool URLs kept shareable without being treated as sitemap pages",
      "Search Console verification checklist documented",
    ],
    details: [
      "Patch 23 defines which routes should be discoverable in search and which user-state or query-param URLs should stay out of the sitemap.",
      "Clean public routes use stable canonical URLs.",
      "Shareable tool links remain supported, but the SEO policy reduces duplicate-content risk from recipe parameters.",
      "Manual Search Console steps were documented for production verification.",
    ],
    userImpact:
      "Users can still share recipe and planning links, while new visitors should have a cleaner path to discover DoughTools through search.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics or payment behavior.",
    isPublic: true,
    patchNumbers: [23],
    relatedPatchNumbers: [6, 9, 10, 22, 23],
    href: "/updates",
  },
  {
    id: "beginner-start-here-path-2026-06-24",
    title: "Beginner Start Here pizza path",
    date: "2026-06-24",
    summary:
      "A new Start Here path helps beginners choose a simple first pizza workflow before adjusting detailed settings.",
    category: "Product",
    highlights: [
      "New Start Here entry point",
      "Home oven, pizza oven and pan / tray pizza starter paths",
      "Clearer beginner-first flow into the calculator and planner",
      "Level-aware explanations for Beginner, Enthusiast and Pizza Nerd users",
    ],
    details: [
      "Patch 22 adds a simple front door for users who want to make pizza without choosing every technical parameter first.",
      "Each starter path explains what it is best for, why it works, what not to worry about yet and what to do next.",
      "The page connects the simpler starting path back into the existing DoughTools calculator, Planner and Dough Doctor workflow.",
    ],
    userImpact:
      "New users can start with a practical pizza goal instead of beginning with every calculator setting.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
    isPublic: true,
    patchNumbers: [22],
    relatedPatchNumbers: [20, 21, 22],
    href: "/updates",
  },
  {
    id: "experience-level-system-alignment-2026-06-24",
    title: "Experience level system alignment",
    date: "2026-06-24",
    summary:
      "The guidance levels were aligned into a clearer Beginner, Enthusiast and Pizza Nerd system.",
    category: "Personalization",
    highlights: [
      "Beginner, Enthusiast and Pizza Nerd level model",
      "Safer migration from older level values",
      "Clearer badges, accents and level descriptions",
      "Documentation for how each depth mode should behave",
    ],
    details: [
      "Patch 21 standardizes the experience-level names, internal values, visual markers and guidance principles.",
      "Existing browser-stored values from the earlier selector are migrated safely.",
      "The system now defines how DoughTools should simplify, explain or expose detail across future tools.",
    ],
    userImpact:
      "Users get a clearer choice between a simple path, practical control and full technical depth.",
    technicalNote:
      "This patch did not change dough formulas, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
    isPublic: true,
    patchNumbers: [21],
    relatedPatchNumbers: [16, 17, 18, 19, 20, 21],
    href: "/updates",
  },
  {
    id: "homepage-onboarding-refinement-2026-06-24",
    title: "Homepage onboarding refinement",
    date: "2026-06-24",
    summary:
      "The homepage now explains the DoughTools workflow more clearly for first-time visitors.",
    category: "Product",
    highlights: [
      "Clearer first-visit explanation",
      "Stronger choose level → calculate dough → plan → troubleshoot journey",
      "Better connection between the calculator and guidance tools",
    ],
    details: [
      "Patch 20 refined the homepage copy and structure so users understand that DoughTools is more than a calculator.",
      "The onboarding flow now explains how experience levels, dough calculation, planning and troubleshooting work together.",
      "Mobile-first scanning was improved without changing the core tools.",
    ],
    userImpact:
      "New visitors can understand faster how to start and why choosing a guidance level helps.",
    technicalNote:
      "This patch did not change dough formulas, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
    isPublic: true,
    patchNumbers: [20],
    relatedPatchNumbers: [17, 18, 19, 20],
    href: "/updates",
  },
  {
    id: "experience-guidance-update-2026-06-24",
    title: "Experience guidance update",
    date: "2026-06-24",
    summary:
      "DoughTools now lets users choose a guidance level and shows recent production updates in the public update history.",
    category: "Personalization",
    highlights: [
      "Beginner, Home Pizza Maker and Advanced guidance levels",
      "Visible level selector on the homepage",
      "Planner, Guide and Dough Doctor show the selected guidance mode",
      "Recent Patch 15–Patch 19 history is now visible",
    ],
    details: [
      "The selected level is stored locally in the browser using doughtools.experienceLevel.",
      "Home Pizza Maker is the safe default when no valid level has been selected.",
      "The update history has been synchronized so recent production patches are visible.",
    ],
    userImpact:
      "Users can make DoughTools feel simpler or more technical without creating an account or changing the core recipe math.",
    technicalNote:
      "This update does not add account-based profiles, cloud sync, payments, public bake pages, indexing or share cards.",
    isPublic: true,
    patchNumbers: [19],
    relatedPatchNumbers: [15, 16, 17, 18, 19],
    href: "/updates",
  },
  {
    id: "foundation-update-2026-06-23",
    title: "DoughTools foundation update",
    date: "2026-06-23",
    summary:
      "DoughTools gained a clearer English-only workflow, safer calculations, better navigation, trust pages, noindex-safe launch configuration and local saved bakes.",
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
    patch: 40,
    title: "Homepage minimal UX lockdown",
    category: "Product",
    summary:
      "The homepage was reduced to a minimal beta front door focused on Start Pizza Session.",
    highlights: [
      "Removed visible homepage navigation clutter",
      "Start Pizza Session is the only hero action",
      "Open calculator and old secondary homepage links were removed from the visible homepage",
      "Guidance level and Continue Session remain",
      "Existing tools and routes were not deleted",
      "No formulas, storage, tracking, cloud sync, payments, security or SEO behavior changed",
    ],
    details: [
      "Patch 40 locks the homepage down to the minimal beta front door.",
      "The visible homepage now keeps the brand header, hero, Start Pizza Session, local-first note, guidance level and real active-session continuation only.",
      "Old navigation and secondary tool entry points remain available by direct route, but no longer compete with the first homepage action.",
    ],
    userImpact:
      "Users see one clear first action instead of a page that feels like a toolbox.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 39,
    title: "Homepage session-first visual cleanup",
    category: "Product",
    summary:
      "The homepage now follows a cleaner session-first layout with Start Pizza Session as the primary path.",
    highlights: [
      "Start Pizza Session is the main homepage action",
      "Open calculator remains available as a secondary action",
      "Guidance level and Continue Session stay visible but controlled",
      "The homepage explains the DoughTools session path more clearly",
      "Existing tools and routes remain available",
      "No formulas, storage, tracking, cloud sync or indexing behavior changed",
    ],
    details: [
      "Patch 39 aligns the homepage with the approved session-first visual direction.",
      "The page now focuses on the main user journey instead of showing a crowded tool dashboard.",
      "Existing calculators, tools and session routes remain available through clear secondary links.",
    ],
    userImpact:
      "Users get a clearer first impression and one obvious way to begin a pizza session.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
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
  {
    patch: 15,
    title: "Detailed scalable updates page",
    category: "Product",
    summary: "The Updates page was made richer and ready for many future releases.",
    highlights: [
      "More detailed release entries",
      "Newest 20 update cards shown at most",
      "Older update data kept in the changelog data",
    ],
    details: [
      "Patch 15 expanded the changelog structure with clearer highlights, details and user impact.",
      "The visible Updates page now uses a bounded newest-first list instead of assuming there will only be a small number of patches.",
      "The update notice behavior from the previous patch was preserved.",
    ],
    userImpact: "Users can read a clearer update history, and the page can keep growing without becoming overwhelming.",
    technicalNote: "This patch did not change calculations, storage, authentication, indexing or product routes.",
  },
  {
    patch: 16,
    title: "Experience Levels foundation",
    category: "Personalization",
    summary: "A local-only foundation was added for adapting guidance by user experience level.",
    highlights: [
      "Three-level experience model introduced",
      "Local browser preference support added",
      "Documentation and tests added for level behavior",
    ],
    details: [
      "Patch 16 created the shared data structure for experience-aware guidance.",
      "The preference is browser-local and safe for server rendering.",
      "It prepared the app for simpler or more detailed explanations without changing the core tools.",
    ],
    userImpact: "DoughTools gained the foundation to explain pizza-making at different depths.",
    technicalNote: "This patch did not add account-based profiles, Supabase persistence or paid tiers.",
  },
  {
    patch: 17,
    title: "Experience levels on homepage and calculator",
    category: "Personalization",
    summary: "Homepage and calculator guidance started using the experience-level foundation.",
    highlights: [
      "Homepage guidance copy became level-aware",
      "Calculator result guidance became level-aware",
      "Recipe math and tool availability stayed unchanged",
    ],
    details: [
      "Patch 17 connected the shared experience-level copy to the main recipe journey.",
      "The calculator can show friendlier or more technical guidance around the same recipe numbers.",
      "The change focused on explanation, not formula changes.",
    ],
    userImpact: "Users get guidance that better matches how much pizza-making detail they want to see.",
    technicalNote: "No calculation formulas, saved recipes, routes, indexing or storage behavior were changed.",
  },
  {
    patch: 18,
    title: "Experience levels on planner, guide and Dough Doctor",
    category: "Personalization",
    summary: "Planner, Guide and Dough Doctor guidance became level-aware.",
    highlights: [
      "Planner level-aware guidance",
      "Guide/Help level-aware educational copy",
      "Dough Doctor level-aware diagnostic explanations",
    ],
    details: [
      "Patch 18 applied the experience-level copy structure to the planning and learning surfaces.",
      "The Dough Doctor now has guidance copy that can be simpler or more technical based on the selected mode.",
      "Tests and documentation were updated for the shared education copy.",
    ],
    userImpact: "The same recipe and troubleshooting tools can now explain themselves with the right amount of detail.",
    technicalNote: "Planner timing logic, diagnosis logic, calculations, persistence and routes were not changed.",
  },
  {
    patch: 19,
    title: "Experience Level Selector and update history sync",
    category: "Personalization",
    summary: "A visible guidance-level selector was added and recent production updates were synchronized.",
    highlights: [
      "Beginner, Home Pizza Maker and Advanced selector added",
      "Homepage shows the three pizza-making levels as selectable cards",
      "Planner, Guide and Dough Doctor show the selected guidance mode",
    ],
    details: [
      "Patch 19 stores the selected guidance level locally with doughtools.experienceLevel.",
      "Home Pizza Maker is used as the safe default before hydration or when stored data is invalid.",
      "The public update history now includes Patch 15 through Patch 19.",
    ],
    userImpact: "Users can immediately choose whether DoughTools should be more step-by-step, practical or technical.",
    technicalNote: "This patch did not add authentication, Supabase, payments, public profiles, cloud sync or a major redesign.",
  },
  {
    patch: 20,
    title: "Homepage onboarding refinement",
    category: "Product",
    summary: "The homepage now explains the DoughTools workflow more clearly for first-time visitors.",
    highlights: [
      "Clearer first-visit explanation",
      "Stronger choose level → calculate dough → plan → troubleshoot journey",
      "Better connection between the calculator and guidance tools",
    ],
    details: [
      "Patch 20 refined the homepage copy and structure so users understand that DoughTools is more than a calculator.",
      "The onboarding flow now explains how experience levels, dough calculation, planning and troubleshooting work together.",
      "Mobile-first scanning was improved without changing the core tools.",
    ],
    userImpact: "New visitors can understand faster how to start and why choosing a guidance level helps.",
    technicalNote:
      "This patch did not change dough formulas, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
  },
  {
    patch: 21,
    title: "Experience level system alignment",
    category: "Personalization",
    summary: "The guidance levels were aligned into a clearer Beginner, Enthusiast and Pizza Nerd system.",
    highlights: [
      "Beginner, Enthusiast and Pizza Nerd level model",
      "Safer migration from older level values",
      "Clearer badges, accents and level descriptions",
      "Documentation for how each depth mode should behave",
    ],
    details: [
      "Patch 21 standardizes the experience-level names, internal values, visual markers and guidance principles.",
      "Existing browser-stored values from the earlier selector are migrated safely.",
      "The system now defines how DoughTools should simplify, explain or expose detail across future tools.",
    ],
    userImpact: "Users get a clearer choice between a simple path, practical control and full technical depth.",
    technicalNote:
      "This patch did not change dough formulas, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
  },
  {
    patch: 22,
    title: "Beginner Start Here pizza path",
    category: "Product",
    summary:
      "A new Start Here path helps beginners choose a simple first pizza workflow before adjusting detailed settings.",
    highlights: [
      "New Start Here entry point",
      "Home oven, pizza oven and pan / tray pizza starter paths",
      "Clearer beginner-first flow into the calculator and planner",
      "Level-aware explanations for Beginner, Enthusiast and Pizza Nerd users",
    ],
    details: [
      "Patch 22 adds a simple front door for users who want to make pizza without choosing every technical parameter first.",
      "Each starter path explains what it is best for, why it works, what not to worry about yet and what to do next.",
      "The page connects the simpler starting path back into the existing DoughTools calculator, Planner and Dough Doctor workflow.",
    ],
    userImpact:
      "New users can start with a practical pizza goal instead of beginning with every calculator setting.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, indexing or payment behavior.",
  },
  {
    patch: 23,
    title: "SEO indexation and canonical baseline",
    category: "SEO & launch safety",
    summary:
      "DoughTools now has a clearer search-indexing baseline for public pages, Start Here and shareable tool links.",
    highlights: [
      "Cleaner canonical URL policy",
      "Sitemap and robots baseline reviewed",
      "Start Here included as a public discovery page",
      "Query-param tool URLs kept shareable without being treated as sitemap pages",
      "Search Console verification checklist documented",
    ],
    details: [
      "Patch 23 defines which routes should be discoverable in search and which user-state or query-param URLs should stay out of the sitemap.",
      "Clean public routes use stable canonical URLs.",
      "Shareable tool links remain supported, but the SEO policy reduces duplicate-content risk from recipe parameters.",
      "Manual Search Console steps were documented for production verification.",
    ],
    userImpact:
      "Users can still share recipe and planning links, while new visitors should have a cleaner path to discover DoughTools through search.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics or payment behavior.",
  },
  {
    patch: 24,
    title: "Accessibility pass for core UX",
    category: "Product",
    summary:
      "Core DoughTools screens were reviewed and improved for clearer labels, keyboard focus and accessible controls.",
    highlights: [
      "Clearer accessible names for key controls",
      "Better label and focus handling across core workflows",
      "Experience level and Start Here cards remain understandable without relying on color alone",
      "Mobile and keyboard usability checks added to the baseline",
    ],
    details: [
      "Patch 24 improves the accessibility baseline for the homepage, Start Here, navigation and core tool pages.",
      "The pass focuses on form labels, control names, focus visibility, link purpose and color-not-alone behavior.",
      "The update keeps the existing workflow intact and does not change calculations or indexing permissions.",
    ],
    userImpact:
      "DoughTools is easier to use with a keyboard, screen reader, or mobile device, and important choices are clearer for more users.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
  },
  {
    patch: 25,
    title: "Performance and rendering baseline",
    category: "Technical foundation",
    summary:
      "A performance baseline was added for core DoughTools routes before broader launch work and calculator UX changes.",
    highlights: [
      "Core route build and production-mode checks documented",
      "Rendering and client-heavy risk areas reviewed",
      "Initial route performance budget proposed",
      "Optimization backlog created without changing product behavior",
      "Google indexing remains disabled",
    ],
    details: [
      "Patch 25 documents how the homepage, Start Here, Planner, Dough Doctor, Guide, Updates and Account routes build and serve in production mode.",
      "The patch records what can and cannot be concluded from local build and route checks.",
      "It creates a practical baseline for future performance work without changing calculations, saved data, indexing or tracking behavior.",
      "The findings should guide the next calculator progressive disclosure patch so the beginner experience improves without unnecessary performance cost.",
    ],
    userImpact:
      "The app has a clearer technical quality baseline, helping future improvements focus on the parts of the workflow that matter most.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
  },
  {
    patch: 26,
    title: "Calculator progressive disclosure",
    category: "Personalization",
    summary:
      "The calculator now adapts its control depth more clearly for Beginner, Enthusiast and Pizza Nerd users.",
    highlights: [
      "Beginner users see a simpler calculator path first",
      "Advanced settings are still available without overwhelming the first view",
      "Enthusiast users get more practical explanation",
      "Pizza Nerd users keep access to full technical depth",
      "Recipe result next steps are clearer",
    ],
    details: [
      "Patch 26 organizes calculator controls and guidance around the existing experience-level system.",
      "Beginner mode focuses on essential choices and a clearer next step after calculation.",
      "Enthusiast and Pizza Nerd modes preserve deeper settings, explanations and technical detail.",
      "Existing formulas, recipe math, query links and saved recipe behavior remain unchanged.",
    ],
    userImpact:
      "New users can get a recipe with less confusion, while experienced users still keep control over the full dough setup.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
  },
  {
    patch: 27,
    title: "Security headers and launch safety baseline",
    category: "SEO & launch safety",
    summary:
      "A security and launch-safety baseline was added before broader public launch work.",
    highlights: [
      "Security response headers reviewed",
      "Safer baseline headers added",
      "Pre-launch indexing protection preserved",
      "Production verification checklist documented",
      "No analytics, tracking or payment behavior added",
    ],
    details: [
      "Patch 27 reviews DoughTools security headers and adds a conservative launch-safety baseline where safe.",
      "The patch documents which headers are active, which choices were deferred, and what must be checked after deployment.",
      "Google indexing remains disabled and no Search Console or analytics integrations were added.",
    ],
    userImpact:
      "DoughTools gets a stronger technical safety baseline while the pizza workflow and calculations remain unchanged.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments or SEO indexing permissions.",
  },
  {
    patch: 28,
    title: "Core recipe workflow handoff",
    category: "Product",
    summary:
      "Recipe results now guide users more clearly into the next DoughTools steps.",
    highlights: [
      "Clearer next-step area after calculating dough",
      "Planner, Sauce, Toppings, Timer and Dough Doctor actions are easier to find",
      "Recipe context is preserved where supported",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No formulas, storage, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 28 strengthens the handoff from recipe results into the rest of the DoughTools workflow.",
      "Users can move from dough numbers to planning, sauce, toppings, timing and troubleshooting with clearer actions.",
      "Existing query-link behavior is preserved and no unsupported tool parameters are invented.",
    ],
    userImpact:
      "Users can understand what to do after getting a recipe instead of stopping at the ingredient numbers.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipes, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 29,
    title: "Saved recipe and account value UX",
    category: "Product",
    summary:
      "Saved recipes became more clearly connected to repeatability, workflow handoff and account expectations.",
    highlights: [
      "Calculator result area explains why saving a recipe helps",
      "Saved recipes now surface Planner, Sauce, Toppings, Timer, Dough Doctor and Journal next actions",
      "Account page explains browser-local recipe storage more honestly",
      "Beginner, Enthusiast and Pizza Nerd saved-recipe copy is more useful",
      "No account recipe sync or storage migration was added",
    ],
    details: [
      "Patch 29 builds on Patch 28 by making saved recipes part of the practical workflow rather than a passive list.",
      "Saved recipe cards now use existing recipe query helpers to preserve recipe context when opening supported tools.",
      "Account copy now makes clear that saved recipes, local BakeResults and Journal photos are local to the browser for now.",
    ],
    userImpact:
      "Users can repeat recipes that worked, compare changes over time and understand what account sign-in does and does not store today.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, planner timing logic, Dough Doctor diagnosis logic, saved recipe storage format, Journal IndexedDB, Supabase behavior, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 30,
    title: "Install DoughTools / Add to Home Screen",
    category: "Product",
    summary:
      "DoughTools now offers a clearer install and home-screen path for quicker access while cooking.",
    highlights: [
      "Install/Add to Home Screen guidance added",
      "Manifest name, scope and description were reviewed",
      "Supported browsers can use the browser install prompt",
      "iOS and unsupported browsers get manual Share → Add to Home Screen instructions",
      "No tracking, push notifications, offline mode or indexing change was added",
    ],
    details: [
      "Patch 30 adds a small install card on the homepage and account page without interrupting the calculator workflow.",
      "The install component stores the browser install prompt only in component state and never tracks the user's choice.",
      "The fallback copy explains manual home-screen installation honestly instead of promising automatic installation.",
    ],
    userImpact:
      "Users can keep DoughTools easier to reach on a phone or desktop while recipes, saved bakes and account behavior stay local-first.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, calculator progressive disclosure, core recipe workflow handoff, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 31,
    title: "Pizza Session data model and autosave foundation",
    category: "Technical foundation",
    summary:
      "A versioned local-first Pizza Session model now prepares DoughTools for future guided session flows.",
    highlights: [
      "Versioned Pizza Session model added",
      "Dedicated localStorage keys added for sessions and active session id",
      "Active session helpers can recover an unfinished local session",
      "Continue Session card foundation added without fake sessions",
      "No cloud sync, tracking, reminders or indexing change was added",
    ],
    details: [
      "Patch 31 defines Pizza Session as one planned bake from idea to recipe, timeline, preparation, baking and review.",
      "Session helpers safely read, save, update, complete, archive and recover local sessions while preserving createdAt.",
      "Malformed localStorage data falls back safely, and completed or archived sessions are not treated as active by default.",
    ],
    userImpact:
      "DoughTools can now build toward a real continue-later pizza session experience on the same device.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, calculator progressive disclosure, core recipe workflow handoff, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, Journal IndexedDB, authentication, analytics, payments, security headers, install/PWA behavior or SEO indexing permissions.",
  },
  {
    patch: 32,
    title: "Start Pizza Session wizard",
    category: "Product",
    summary:
      "A guided Start Pizza Session flow now helps users begin a pizza bake one step at a time.",
    highlights: [
      "New guided Pizza Session start flow",
      "Style, time, quantity, oven and flour decisions saved locally",
      "Progress is autosaved to the active browser session",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No cloud sync, reminders, tracking or indexing behavior added",
    ],
    details: [
      "Patch 32 uses the local Pizza Session model from Patch 31 to create the first guided session wizard.",
      "Users can start a planned pizza bake, make the first key decisions and return later on the same browser.",
      "The wizard prepares the next timeline, shopping list and kitchen mode patches without changing existing calculators or formulas.",
    ],
    userImpact:
      "Users can start with one clear decision at a time instead of choosing from separate tools immediately.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 33,
    title: "Session timeline and backward schedule",
    category: "Product",
    summary:
      "Pizza sessions can now generate a practical timeline from the planned bake or eat time.",
    highlights: [
      "New session timeline route",
      "Backward-planned pizza preparation steps",
      "Active session timeline saved locally",
      "Next-step guidance added",
      "Beginner, Enthusiast and Pizza Nerd timing guidance stays consistent",
      "No reminders, tracking, cloud sync or indexing behavior added",
    ],
    details: [
      "Patch 33 turns the target time from the Start Pizza Session wizard into a practical pizza timeline.",
      "The timeline gives users a clearer view of what to do next, when to prepare dough, when to preheat and when to bake.",
      "Timing remains a practical guide and can be refined in later Planner and Kitchen Mode patches.",
    ],
    userImpact:
      "Users can move from “I want pizza at this time” to a concrete preparation schedule without guessing the order of tasks.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 34,
    title: "Session shopping list generator",
    category: "Product",
    summary:
      "Pizza sessions can now create a practical shopping list from a selected pizza preset.",
    highlights: [
      "New session shopping route",
      "Pizza preset cards such as Margherita, Marinara and Diavola",
      "Grouped shopping list for dough, sauce, cheese, toppings and gear",
      "Already have, need to buy and bought item states",
      "Local-first shopping list saved into the active session",
      "No custom ingredient database, tracking, cloud sync or indexing behavior added",
    ],
    details: [
      "Patch 34 adds a practical preset-based shopping list step to the local Pizza Session workflow.",
      "The first presets cover Margherita, Marinara, Diavola, Funghi, Pepperoni / Salami and Simple cheese pizza.",
      "The shopping list is grouped by dough, sauce, cheese, toppings and optional gear, and item status changes are saved into the active session.",
    ],
    userImpact:
      "Users can move from session planning and timeline into a simple grocery checklist without guessing the basic ingredients.",
    technicalNote:
      "This patch did not change dough formulas, planner timing logic, Dough Doctor diagnosis logic, saved recipe storage, Journal IndexedDB, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 36,
    title: "Session Kitchen Mode",
    category: "Product",
    summary:
      "Pizza sessions can now guide the user through the saved timeline one kitchen task at a time.",
    highlights: [
      "New session kitchen route",
      "Current task view based on the first todo timeline step",
      "Mark done saves progress into the active local Pizza Session",
      "Mix dough task can show saved recipe snapshot ingredient amounts",
      "Links to Timeline, Shopping List, Timer and Journal stay available",
      "No formula, cloud sync, reminder, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 36 adds `/session/kitchen` as the execution view after recipe, timeline and shopping planning.",
      "Kitchen Mode reads the active session timeline, uses the first todo task as the current task and relies on the recipe snapshot and experience level instead of creating a separate task system.",
      "Marking a task done updates the timeline status, timestamps and current session step locally in the same browser session.",
      "Missing active sessions, missing timelines and missing recipe snapshots show safe recovery links instead of crashing or inventing data.",
    ],
    userImpact:
      "Users get a calmer kitchen view that tells them what to do now and what comes next while preserving the existing tools.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 37,
    title: "Session-first homepage cleanup",
    category: "Product",
    summary:
      "The homepage now focuses on one clear Start Pizza Session path instead of showing many separate tool sections at once.",
    highlights: [
      "Start Pizza Session becomes the clear homepage action",
      "Homepage copy now explains what DoughTools does and why it helps",
      "Session flow is summarized simply: choose, dough plan, timeline, shopping, kitchen steps",
      "Old calculator, save, share and workshop-heavy homepage blocks were removed from the primary flow",
      "Existing tools and routes remain available",
      "No formulas, storage, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 37 simplifies the homepage so new users understand the guided Pizza Session path first.",
      "Existing DoughTools tools remain available, but the homepage no longer acts as a crowded dashboard of every feature.",
      "Recipe results, save and share actions, My Recipes and deeper tools are kept in their more appropriate workflow contexts.",
    ],
    userImpact:
      "Users get a clearer first impression and one obvious place to start.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, Pizza Session storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 38,
    title: "Session review and bake notes",
    category: "Product",
    summary:
      "Pizza sessions can now end with a local review, rating and improvement notes.",
    highlights: [
      "New session review route",
      "Rating, notes, what worked and improvement fields",
      "Completed sessions are no longer treated as active sessions",
      "Kitchen Mode can hand off to review",
      "Beginner, Enthusiast and Pizza Nerd review guidance stays consistent",
      "No photo upload, cloud sync, tracking or indexing behavior added",
    ],
    details: [
      "Patch 38 adds the first review step to the Pizza Session flow.",
      "Users can finish a session by saving a rating, notes and what to improve next time.",
      "The review remains local to the browser and prepares future photo, result-card and richer Journal features.",
    ],
    userImpact:
      "Users can learn from each bake instead of losing what they discovered.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
  },
  {
    patch: 35,
    title: "Session recipe build step",
    category: "Product",
    summary:
      "Pizza sessions can now turn the user’s choices into a clear dough plan before timeline and shopping.",
    highlights: [
      "New session recipe route",
      "Dough plan generated from active Pizza Session choices",
      "Recipe snapshot saved locally into the active session",
      "Wizard copy clarified for baking path and pizza preset choices",
      "Clear next actions to Timeline, Shopping List and Calculator",
      "Beginner, Enthusiast and Pizza Nerd guidance stays consistent",
      "No formula, cloud sync, tracking or indexing behavior changed",
    ],
    details: [
      "Patch 35 adds a dedicated dough plan step to the Pizza Session flow.",
      "The session wizard now separates baking path from pizza preset choice, making the first decisions clearer.",
      "The recipe step stores calculator-compatible recipe parameters and a recipe snapshot in the local session where safe.",
      "Existing calculators and formulas remain unchanged.",
    ],
    userImpact:
      "Users can see how much dough to make before moving to the timeline, shopping list and kitchen steps.",
    technicalNote:
      "This patch did not change dough formulas, yeast calculations, saved recipe storage, planner timing logic, Dough Doctor diagnosis logic, authentication, analytics, payments, security headers or SEO indexing permissions.",
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
