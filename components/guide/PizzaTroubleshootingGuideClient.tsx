"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RelatedLearning, { LearningBreadcrumbs, type LearningLink } from "@/components/learning/RelatedLearning";
import ContextualReturn from "@/components/navigation/ContextualReturn";
import { DoughToolsIcon } from "@/components/icons";
import {
  findPizzaTroubleshootingProblem,
  getPizzaTroubleshootingCategoryForProblem,
  pizzaTroubleshootingTopicIds,
  searchPizzaTroubleshootingProblems,
  troubleshootingCategories,
  troubleshootingCategoryMeta,
  troubleshootingSections,
  type PizzaTroubleshootingCategoryId,
  type PizzaTroubleshootingProblem,
  type PizzaTroubleshootingSearchResult,
  type PizzaTroubleshootingTopicId,
} from "@/lib/pizza-troubleshooting";
import { getSafeContextualReturnPath } from "@/lib/contextual-return";

type PizzaTroubleshootingGuideClientProps = {
  activeTopicId?: string;
  returnPath?: string | null;
  contextualReturnPath?: string | string[] | null;
};

const troubleshootingSteps = [
  "Start with what you can see or feel.",
  "Compare it with the closest symptom.",
  "Try the smallest safe correction.",
  "Change one variable at a time.",
  "Record what improved on the next bake.",
] as const;

const categoryLearningLinks: Record<PizzaTroubleshootingCategoryId, LearningLink[]> = {
  "dough-fermentation": [
    { href: "/guides/dough", title: "Dough guides", description: "Review mixing, resting, proofing and dough readiness.", icon: "wheat" },
    { href: "/guide#fermentation", title: "Fermentation", description: "Understand time, temperature and dough structure.", icon: "timer" },
    { href: "/guide#flour-strength", title: "Flour strength", description: "See why flour affects support and extensibility.", icon: "scale" },
  ],
  shaping: [
    { href: "/guides/dough?step=release-dough-ball", title: "Dough release", description: "Prepare the ball before opening and stretching.", icon: "mixing-bowl" },
    { href: "/guide#gluten-development", title: "Gluten development", description: "Connect elasticity, rest and extensibility.", icon: "wheat" },
    { href: "/styles", title: "Choose your pizza", description: "Match shaping expectations to the style.", icon: "pizza" },
  ],
  launching: [
    { href: "/ovens#other-equipment", title: "Other equipment", description: "Check peels, flour, heat tools and safe station setup.", icon: "shopping-basket" },
    { href: "/guides/dough", title: "Dough guides", description: "Check release, handling and topping timing.", icon: "mixing-bowl" },
    { href: "/ovens", title: "Baking guides", description: "Connect launch speed with oven heat and recovery.", icon: "oven" },
  ],
  baking: [
    { href: "/ovens", title: "Baking guides", description: "Understand top heat, bottom heat, preheat and recovery.", icon: "oven" },
    { href: "/styles", title: "Choose your pizza", description: "Choose a style that fits your oven.", icon: "pizza" },
    { href: "/sauce", title: "Sauce", description: "Control moisture for the bake you are using.", icon: "water" },
  ],
  toppings: [
    { href: "/toppings", title: "Topping guides", description: "Balance moisture, cheese and topping load.", icon: "pizza" },
    { href: "/sauce", title: "Sauce", description: "Use sauce amount and texture that fit the pizza.", icon: "water" },
    { href: "/ovens", title: "Baking guides", description: "Match topping load to heat and bake time.", icon: "oven" },
  ],
};

function firstItems(items: string[], count: number) {
  return items.slice(0, Math.min(items.length, count));
}

function BulletList({ items, ordered = false }: { items: readonly string[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className="mt-3 grid gap-2 text-sm leading-6 text-ink/65">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3">
          <span
            className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tomato/10 text-[11px] font-extrabold text-tomato"
            aria-hidden="true"
          >
            {ordered ? index + 1 : "•"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </List>
  );
}

function buildProblemHref(problemId: PizzaTroubleshootingTopicId, returnPath?: string | null, contextualReturnPath?: string | string[] | null) {
  const params = new URLSearchParams();
  params.set("problem", problemId);

  if (returnPath) params.set("from", returnPath);

  const safeContextualReturnPath = getSafeContextualReturnPath(contextualReturnPath);
  if (safeContextualReturnPath) params.set("returnTo", safeContextualReturnPath);

  return `/guide/pizza-troubleshooting?${params.toString()}#problem-detail`;
}

function TroubleshootingHero() {
  return (
    <section className="rounded-[2rem] border border-ink/10 bg-forest-dark p-5 text-white shadow-raised sm:p-7 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.72fr)] lg:items-center lg:gap-8">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Practical pizza tips</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[.95] sm:text-6xl">
          What went wrong with your pizza?
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/74 sm:text-base">
          Choose the symptom that looks closest to yours. Start with what you see, make one change at a time, and learn what to adjust on the next bake.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#problem-finder"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Find my problem
          </a>
          <a
            href="#category-index"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-oven-gold focus-visible:ring-offset-2 focus-visible:ring-offset-forest-dark"
          >
            Browse all categories
          </a>
        </div>
      </div>
      <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[.07] p-4 lg:mt-0" role="img" aria-label="Diagnostic diagram showing symptoms leading to a fix now action and next bake learning.">
        <div className="grid gap-3">
          {[
            ["What you see", "Symptom", "warning"],
            ["What to do now", "Fix now", "check"],
            ["What to change", "Next bake", "restore"],
          ].map(([label, value, icon], index) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-ink">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-tomato/10 text-tomato" aria-hidden="true">
                <DoughToolsIcon name={icon as "warning" | "check" | "restore"} size={24} />
              </span>
              <span>
                <span className="block text-[11px] font-extrabold uppercase tracking-[.18em] text-ink/42">{label}</span>
                <span className="mt-1 block text-lg font-extrabold">{value}</span>
              </span>
              {index < 2 && <span className="ml-auto text-tomato" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategorySelector({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: PizzaTroubleshootingCategoryId | null;
  onSelect: (categoryId: PizzaTroubleshootingCategoryId | null) => void;
}) {
  return (
    <section id="category-index" className="scroll-mt-24 rounded-[1.75rem] border border-ink/10 bg-white/76 p-4 shadow-card sm:p-5" aria-labelledby="category-index-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Problem areas</p>
          <h2 id="category-index-title" className="mt-2 font-display text-2xl font-semibold text-ink">What looks wrong?</h2>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          All problems
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {troubleshootingCategories.map((category) => {
          const meta = troubleshootingCategoryMeta[category.id];
          const count = troubleshootingSections.find((section) => section.id === category.id)?.problems.length ?? 0;
          const selected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(category.id)}
              className={`min-h-36 rounded-[1.35rem] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                selected ? "border-tomato/40 bg-tomato/10 ring-2 ring-tomato/20" : "border-ink/10 bg-flour/65 hover:border-tomato/25 hover:bg-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-tomato shadow-sm" aria-hidden="true">
                  <DoughToolsIcon name={meta.icon} size={24} />
                </span>
                <span className="text-sm font-extrabold text-ink">{category.title}</span>
              </span>
              <span className="mt-3 block text-xs leading-5 text-ink/58">{meta.plainDescription}</span>
              <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-ink/45">
                {count} problems
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProblemSearch({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-white p-4 shadow-card sm:p-5">
      <label htmlFor="troubleshooting-search" className="text-sm font-extrabold text-ink">
        Describe the problem
      </label>
      <p className="mt-1 text-xs leading-5 text-ink/52">
        Try “dough is sticky,” “base is pale,” “pizza will not launch,” “cheese is watery,” or “crust is dense.”
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          id="troubleshooting-search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="base is pale"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border border-ink/10 bg-flour/60 px-4 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-tomato/40 focus:ring-2 focus:ring-tomato/20"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Clear search
          </button>
        )}
      </div>
    </div>
  );
}

function ProblemCard({
  result,
  active,
  onSelect,
}: {
  result: PizzaTroubleshootingSearchResult;
  active: boolean;
  onSelect: (problemId: PizzaTroubleshootingTopicId) => void;
}) {
  const { problem, section } = result;
  return (
    <article
      id={`topic-${problem.id}`}
      className={`rounded-[1.5rem] border bg-white p-4 shadow-card transition ${
        active ? "border-tomato/45 ring-2 ring-tomato/25" : "border-ink/10 hover:border-tomato/25"
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
        <figure className="overflow-hidden rounded-[1.15rem] border border-ink/10 bg-flour">
          <Image
            src={problem.image.src}
            alt={problem.image.alt}
            width={problem.image.width}
            height={problem.image.height}
            sizes="(max-width: 640px) 100vw, 160px"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </figure>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-tomato">{section.title}</p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-ink [overflow-wrap:anywhere]">{problem.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/62">{problem.shortSymptom}</p>
          {problem.quickCheck && (
            <p className="mt-3 rounded-2xl bg-leaf/[.08] p-3 text-sm font-bold leading-6 text-ink/70">
              Quick check: {problem.quickCheck}
            </p>
          )}
          <button
            type="button"
            onClick={() => onSelect(problem.id)}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white shadow-card transition hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
          >
            Diagnose this problem
          </button>
        </div>
      </div>
    </article>
  );
}

function RelatedProblemChips({
  problem,
  returnPath,
  contextualReturnPath,
  onSelect,
}: {
  problem: PizzaTroubleshootingProblem;
  returnPath?: string | null;
  contextualReturnPath?: string | string[] | null;
  onSelect: (problemId: PizzaTroubleshootingTopicId) => void;
}) {
  const related = firstItems(problem.relatedTopicIds ?? [], 4)
    .map((topicId) => findPizzaTroubleshootingProblem(topicId))
    .filter(Boolean) as PizzaTroubleshootingSearchResult[];

  if (!related.length) return null;

  return (
    <nav className="rounded-[1.5rem] border border-ink/10 bg-flour/70 p-4" aria-label={`Related troubleshooting for ${problem.title}`}>
      <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Related problems</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {related.map(({ problem: relatedProblem, section }) => (
          <Link
            key={relatedProblem.id}
            href={buildProblemHref(relatedProblem.id, returnPath, contextualReturnPath)}
            onClick={() => onSelect(relatedProblem.id)}
            className="rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/62 transition hover:border-tomato/25 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            {relatedProblem.title}
            <span className="sr-only">, {section.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function DiagnosticComparison({ problem }: { problem: PizzaTroubleshootingProblem }) {
  if (problem.image.kind !== "comparison" || !problem.image.comparisonLabels) return null;

  return (
    <dl className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 sm:grid-cols-2">
      <div className="rounded-[1.15rem] bg-tomato/5 p-4">
        <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Problem</dt>
        <dd className="mt-2 text-sm leading-6 text-ink/64">{problem.image.comparisonLabels.problem}</dd>
      </div>
      <div className="rounded-[1.15rem] bg-leaf/[.08] p-4">
        <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Better result</dt>
        <dd className="mt-2 text-sm leading-6 text-ink/64">{problem.image.comparisonLabels.better}</dd>
      </div>
    </dl>
  );
}

function ProblemDetail({
  result,
  returnPath,
  contextualReturnPath,
  onSelectRelated,
}: {
  result: PizzaTroubleshootingSearchResult;
  returnPath?: string | null;
  contextualReturnPath?: string | string[] | null;
  onSelectRelated: (problemId: PizzaTroubleshootingTopicId) => void;
}) {
  const { problem, section } = result;
  const primaryCauses = firstItems(problem.likelyCauses, 3);
  const secondaryCauses = problem.likelyCauses.slice(primaryCauses.length);
  const prevention = firstItems(problem.preventNextTime, 4);
  const morePrevention = problem.preventNextTime.slice(prevention.length);
  const relatedLearning = categoryLearningLinks[section.id];

  return (
    <article
      id="problem-detail"
      className="scroll-mt-24 rounded-[2rem] border border-tomato/25 bg-white p-5 shadow-raised sm:p-7"
      aria-labelledby="problem-detail-title"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-tomato/10 px-3 py-1.5 text-xs font-extrabold text-tomato">{section.title}</span>
        <span className="rounded-full bg-leaf/[.08] px-3 py-1.5 text-xs font-extrabold text-leaf">Focused diagnosis</span>
      </div>
      <h2 id="problem-detail-title" tabIndex={-1} className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
        {problem.title}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-ink/66">{problem.shortSymptom}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1fr)] lg:items-start">
        <figure className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-flour">
          <Image
            src={problem.image.src}
            alt={problem.image.alt}
            width={problem.image.width}
            height={problem.image.height}
            sizes="(max-width: 1024px) 100vw, 560px"
            className="aspect-[3/2] h-full w-full object-cover"
            priority={false}
          />
          {problem.image.caption && (
            <figcaption className="border-t border-ink/10 bg-white/76 px-4 py-3 text-xs leading-5 text-ink/55">
              {problem.image.caption}
            </figcaption>
          )}
        </figure>

        <div className="grid gap-4">
          {problem.quickCheck && (
            <section className="rounded-[1.5rem] border border-leaf/20 bg-leaf/[.08] p-4">
              <h3 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Quick check</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/72">{problem.quickCheck}</p>
            </section>
          )}
          <section className="rounded-[1.5rem] border border-tomato/20 bg-tomato/5 p-4">
            <h3 className="font-display text-2xl font-semibold text-ink">What to do now</h3>
            <BulletList items={firstItems(problem.fixNow, 5)} ordered />
          </section>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-ink/10 bg-flour/70 p-4">
          <h3 className="font-display text-2xl font-semibold text-ink">Why this probably happened</h3>
          <p className="mt-2 text-sm leading-6 text-ink/55">Most likely causes:</p>
          <BulletList items={primaryCauses} />
        </section>
        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-4">
          <h3 className="font-display text-2xl font-semibold text-ink">How to tell</h3>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Compare the visible symptom with timing, temperature, handling and topping load. If two causes look possible, change the smallest safe variable first.
          </p>
          {problem.symptomDetails && <p className="mt-3 text-sm leading-6 text-ink/62">{problem.symptomDetails}</p>}
        </section>
      </div>

      <div className="mt-5">
        <DiagnosticComparison problem={problem} />
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-ink/10 bg-leaf/[.08] p-4">
        <h3 className="font-display text-2xl font-semibold text-ink">Change this next time</h3>
        <BulletList items={prevention} />
      </section>

      {(secondaryCauses.length > 0 || morePrevention.length > 0 || problem.fixNow.length > 5) && (
        <details className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white/80 p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-ink/68 marker:text-tomato">
            More detail for this diagnosis
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {secondaryCauses.length > 0 && (
              <section className="rounded-[1.15rem] bg-flour/70 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Also possible</h4>
                <BulletList items={secondaryCauses} />
              </section>
            )}
            {problem.fixNow.length > 5 && (
              <section className="rounded-[1.15rem] bg-tomato/5 p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Extra immediate actions</h4>
                <BulletList items={problem.fixNow.slice(5)} />
              </section>
            )}
            {morePrevention.length > 0 && (
              <section className="rounded-[1.15rem] bg-leaf/[.08] p-4">
                <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">More prevention</h4>
                <BulletList items={morePrevention} />
              </section>
            )}
          </div>
        </details>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1fr)]">
        <RelatedProblemChips
          problem={problem}
          returnPath={returnPath}
          contextualReturnPath={contextualReturnPath}
          onSelect={onSelectRelated}
        />
        <RelatedLearning
          eyebrow="Pizza guides"
          title="Understand the variable behind it"
          intro="Use the closest learning topic before changing the next bake."
          links={relatedLearning}
        />
      </div>
    </article>
  );
}

export function PizzaTroubleshootingGuideClient({ activeTopicId, returnPath, contextualReturnPath }: PizzaTroubleshootingGuideClientProps) {
  const initialCategory = getPizzaTroubleshootingCategoryForProblem(activeTopicId);
  const [selectedCategory, setSelectedCategory] = useState<PizzaTroubleshootingCategoryId | null>(initialCategory);
  const [selectedProblemId, setSelectedProblemId] = useState<PizzaTroubleshootingTopicId | null>(
    findPizzaTroubleshootingProblem(activeTopicId)?.problem.id ?? null,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (selectedProblemId) return;
    const hash = window.location.hash.replace("#", "");
    if (troubleshootingCategories.some((category) => category.id === hash)) {
      setSelectedCategory(hash as PizzaTroubleshootingCategoryId);
    }
  }, [selectedProblemId]);

  useEffect(() => {
    if (!selectedProblemId) return;
    window.setTimeout(() => {
      document.getElementById("problem-detail-title")?.focus({ preventScroll: true });
    }, 0);
  }, [selectedProblemId]);

  const results = useMemo(
    () => searchPizzaTroubleshootingProblems(query, selectedCategory),
    [query, selectedCategory],
  );

  const selectedResult = selectedProblemId ? findPizzaTroubleshootingProblem(selectedProblemId) : undefined;
  const hasActiveFilter = query.trim().length > 0 || Boolean(selectedCategory);
  const filteredResults = hasActiveFilter ? results : [];
  const visibleResults = filteredResults.length > 0 ? filteredResults : selectedResult ? [selectedResult] : [];
  const selectedSection = selectedCategory ? troubleshootingSections.find((section) => section.id === selectedCategory) : null;

  function selectCategory(categoryId: PizzaTroubleshootingCategoryId | null) {
    setSelectedCategory(categoryId);
    setSelectedProblemId(null);
    if (categoryId) {
      window.history.pushState(null, "", `#${categoryId}`);
    } else {
      window.history.pushState(null, "", "/guide/pizza-troubleshooting");
    }
  }

  function selectProblem(problemId: PizzaTroubleshootingTopicId) {
    const categoryId = getPizzaTroubleshootingCategoryForProblem(problemId);
    setSelectedProblemId(problemId);
    setSelectedCategory(categoryId);
    window.history.pushState(null, "", buildProblemHref(problemId, returnPath, contextualReturnPath));
    window.setTimeout(() => document.getElementById("problem-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <main className="guide-page min-h-screen overflow-x-clip px-4 py-5 text-ink sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-3">
            <ContextualReturn returnTo={contextualReturnPath} />
            <LearningBreadcrumbs current="Practical pizza tips" />
          </div>
          {returnPath && (
            <Link
              href={returnPath}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            >
              Back to Dough guides
            </Link>
          )}
        </header>

        <TroubleshootingHero />

        <section id="problem-finder" className="mt-8 scroll-mt-24 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.36fr)] lg:items-start" aria-labelledby="problem-finder-title">
          <div className="grid gap-5">
            <div className="rounded-[1.75rem] border border-ink/10 bg-white/76 p-5 shadow-card">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Problem finder</p>
              <h2 id="problem-finder-title" className="mt-2 font-display text-3xl font-semibold">Start with what you can see.</h2>
              <p className="mt-3 text-sm leading-6 text-ink/60">
                Search in plain language or choose the closest symptom area. The page shows compact cards first, then one focused diagnosis.
              </p>
            </div>
            <ProblemSearch value={query} onChange={setQuery} onClear={() => setQuery("")} />
            <CategorySelector selectedCategory={selectedCategory} onSelect={selectCategory} />
          </div>
          <aside className="rounded-[1.75rem] border border-ink/10 bg-flour/70 p-5 shadow-card lg:sticky lg:top-24" aria-labelledby="how-to-troubleshoot-title">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">How to troubleshoot</p>
            <h2 id="how-to-troubleshoot-title" className="mt-2 font-display text-2xl font-semibold">Make one careful change.</h2>
            <BulletList items={troubleshootingSteps} ordered />
          </aside>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,.36fr)] lg:items-start" aria-labelledby="diagnostic-results-title">
          <div className="grid gap-4">
            <div className="flex flex-col gap-2 rounded-[1.5rem] border border-ink/10 bg-white/76 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Diagnostic results</p>
                <h2 id="diagnostic-results-title" className="mt-1 font-display text-2xl font-semibold">
                  {selectedSection ? selectedSection.title : query ? "Matching problems" : "Choose a category or search"}
                </h2>
              </div>
              <p className="text-sm font-bold text-ink/52" aria-live="polite">
                {visibleResults.length} {visibleResults.length === 1 ? "problem" : "problems"}
              </p>
            </div>

            {!hasActiveFilter && !selectedResult ? (
              <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card">
                <h3 className="font-display text-2xl font-semibold">Choose a symptom area or search above.</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  This keeps the guide focused so you do not have to scroll through all 43 problems at once.
                </p>
              </div>
            ) : visibleResults.length > 0 ? (
              visibleResults.map((result) => (
                <ProblemCard
                  key={result.problem.id}
                  result={result}
                  active={result.problem.id === selectedProblemId}
                  onSelect={selectProblem}
                />
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card">
                <h3 className="font-display text-2xl font-semibold">No exact match found.</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Try describing what you see, such as “pale base,” “sticky dough,” or “wet center.”
                </p>
              </div>
            )}
          </div>

          <aside className="hidden rounded-[1.75rem] border border-ink/10 bg-white/72 p-5 shadow-card lg:block lg:sticky lg:top-24" aria-labelledby="diagnostic-context-title">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Context</p>
            <h2 id="diagnostic-context-title" className="mt-2 font-display text-2xl font-semibold">Troubleshooting works best by narrowing the symptom.</h2>
            <p className="mt-3 text-sm leading-6 text-ink/58">
              Fix-now actions are deliberately shown before technical detail because many users open this page while dough or pizza is already in progress.
            </p>
            <div className="mt-4 rounded-2xl bg-flour/70 p-4">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Coverage</p>
              <p className="mt-1 text-2xl font-extrabold">{pizzaTroubleshootingTopicIds.length} problems</p>
              <p className="mt-1 text-xs leading-5 text-ink/52">across five symptom areas</p>
            </div>
          </aside>
        </section>

        {selectedResult && (
          <div className="mt-8">
            <ProblemDetail
              result={selectedResult}
              returnPath={returnPath}
              contextualReturnPath={contextualReturnPath}
              onSelectRelated={selectProblem}
            />
          </div>
        )}

        <div className="mt-8">
          <RelatedLearning
            title="Practical pizza tips after the diagnosis"
            intro="Most pizza problems connect back to dough handling, sauce moisture, topping load or oven heat."
            links={[
              { href: "/sauce", title: "Sauce", description: "Control sauce texture and moisture.", icon: "water" },
              { href: "/toppings", title: "Topping guides", description: "Balance cheese, moisture and topping load.", icon: "pizza" },
              { href: "/ovens", title: "Baking guides", description: "Understand heat balance and bake profiles.", icon: "oven" },
            ]}
            cta={{
              href: "/session/start",
              title: "Plan a pizza",
              description: "Use what you diagnosed in a real plan.",
              icon: "calendar",
            }}
          />
        </div>
      </div>
    </main>
  );
}
