import type { Metadata } from "next";
import Link from "next/link";
import {
  findPizzaTroubleshootingProblem,
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
  troubleshootingSections,
  type PizzaTroubleshootingProblem,
  type PizzaTroubleshootingSection,
} from "@/lib/pizza-troubleshooting";

export const metadata: Metadata = {
  title: "Pizza Troubleshooting Guide | DoughTools",
  description:
    "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
};

type TroubleshootingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function VisualPanel({ visual, index }: { visual: PizzaTroubleshootingSection["visual"]; index: number }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] border border-white/80 bg-[#f3e8d7] shadow-card" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.9),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(233,75,46,.2),transparent_22%),radial-gradient(circle_at_65%_78%,rgba(59,166,107,.18),transparent_28%)]" />
      <div className="absolute -left-8 bottom-5 h-28 w-28 rounded-full border-[18px] border-white/60 bg-orange/20" />
      <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-tomato/15" />
      <div className="absolute right-8 top-8 grid h-14 w-14 rotate-12 place-items-center rounded-[1.1rem] bg-white/75 text-xl shadow-sm">
        {index === 0 ? "🌾" : index === 1 ? "🍕" : index === 2 ? "🍅" : "🔥"}
      </div>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/80 p-4 backdrop-blur">
        <span className={`mb-3 block h-1.5 w-16 rounded-full ${visual.accent}`} />
        <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-ink/40">{visual.motif}</p>
        <p className="mt-1 font-display text-2xl font-semibold text-ink">{visual.label}</p>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/60">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato/70" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ProblemCard({
  problem,
  active,
}: {
  problem: PizzaTroubleshootingProblem;
  active: boolean;
}) {
  return (
    <article
      id={`topic-${problem.id}`}
      tabIndex={active ? -1 : undefined}
      aria-current={active ? "true" : undefined}
      className={`scroll-mt-24 rounded-[1.5rem] border bg-white/85 p-5 shadow-card backdrop-blur transition sm:p-6 ${
        active ? "border-tomato/45 ring-2 ring-tomato/25" : "border-white/80"
      }`}
    >
      {active && (
        <p className="mb-3 inline-flex rounded-full bg-tomato px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-white">
          Selected troubleshooting topic
        </p>
      )}
      <h3 className="font-display text-2xl font-semibold text-ink">{problem.title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-cream/70 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">What you see</h4>
          <p className="mt-2 text-sm leading-6 text-ink/65">{problem.whatYouSee}</p>
        </div>
        <div className="rounded-2xl bg-[#fff7ed]/80 p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Likely causes</h4>
          <BulletList items={problem.likelyCauses} />
        </div>
        <div className="rounded-2xl bg-white p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Fix it now</h4>
          <BulletList items={problem.fixNow} />
        </div>
        <div className="rounded-2xl bg-leaf/[.08] p-4">
          <h4 className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Prevent it next time</h4>
          <BulletList items={problem.preventNextTime} />
        </div>
      </div>
    </article>
  );
}

export default async function PizzaTroubleshootingGuidePage({ searchParams }: TroubleshootingPageProps) {
  const params = await searchParams;
  const requestedTopic = firstParam(params?.topic);
  const activeTopicId = isPizzaTroubleshootingTopicId(requestedTopic) ? requestedTopic : undefined;
  const activeTopic = findPizzaTroubleshootingProblem(activeTopicId);
  const returnPath = getSafeDoughGuideReturnPath(params?.from);

  return (
    <main className="guide-page min-h-screen overflow-x-clip px-4 py-5 text-ink sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/guide" className="flex items-center gap-2 text-sm font-bold text-ink/65 transition hover:text-ink">
            <span aria-hidden="true">←</span>
            Back to Guide
          </Link>
          {returnPath && (
            <Link href={returnPath} className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Back to Dough Guide
            </Link>
          )}
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-card backdrop-blur sm:p-10 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-8">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">DoughTools guide</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[.95] tracking-tight sm:text-6xl">
              Pizza Troubleshooting Guide
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-ink/60 sm:text-base">
              Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.
            </p>
            <p className="mt-4 max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm leading-6 text-ink/65">
              Pizza usually goes wrong for a reason: timing, temperature, hydration, flour strength, toppings or oven setup.
              This guide helps you diagnose common problems and choose a practical next step.
            </p>
            {activeTopic && (
              <p className="mt-4 max-w-2xl rounded-2xl border border-tomato/20 bg-[#fff7ed] p-4 text-sm font-extrabold leading-6 text-ink/70">
                Opened topic: {activeTopic.problem.title}. The matching card is highlighted below.
              </p>
            )}
          </div>
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[#f1e2cd] shadow-card lg:mt-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(255,255,255,.86),transparent_24%),radial-gradient(circle_at_74%_22%,rgba(233,75,46,.25),transparent_22%),radial-gradient(circle_at_50%_76%,rgba(59,166,107,.16),transparent_30%)]" />
            <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-tomato/75 shadow-lg" />
            <div className="absolute right-10 top-16 h-16 w-16 rounded-full bg-leaf/70 shadow-lg" />
            <div className="absolute bottom-8 left-10 right-10 rounded-[2rem] border-[18px] border-[#d9a85c]/45 bg-white/35 p-10 backdrop-blur-sm" />
            <div className="absolute bottom-8 right-8 rounded-2xl bg-ink px-5 py-4 text-white shadow-card">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-white/45">Troubleshoot</p>
              <p className="font-display text-3xl font-semibold">10 common problems</p>
            </div>
          </div>
        </section>

        <nav className="sticky top-2 z-20 -mx-1 my-8 overflow-x-auto rounded-2xl border border-white/80 bg-cream/90 p-1.5 shadow-lg shadow-ink/5 backdrop-blur" aria-label="Troubleshooting sections">
          <div className="flex min-w-max gap-1">
            {troubleshootingSections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-xl px-3 py-2 text-xs font-bold text-ink/55 transition hover:bg-white hover:text-ink">
                <span className="mr-1 text-tomato">{index + 1}.</span>
                {section.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          {troubleshootingSections.map((section, sectionIndex) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
                <div className="lg:sticky lg:top-24">
                  <VisualPanel visual={section.visual} index={sectionIndex} />
                  <div className="mt-4 rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Section {sectionIndex + 1}</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold">{section.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-ink/60">{section.intro}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {section.problems.map((problem) => (
                    <ProblemCard key={problem.id} problem={problem} active={problem.id === activeTopicId} />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
