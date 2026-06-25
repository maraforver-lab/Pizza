import Link from "next/link";
import Image from "next/image";
import AppSignature from "@/components/AppSignature";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasCalculatorRequest(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return false;
  return Object.keys(params).length > 0;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;

  if (hasCalculatorRequest(params)) {
    return <HomeCalculatorWorkspace />;
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-ink/10 bg-white/80 px-4 py-3 shadow-sm">
          <AppSignature />
          <nav className="hidden items-center gap-2 text-xs font-extrabold text-ink/65 lg:flex" aria-label="Homepage shortcuts">
            <Link href={homepageContent.hero.secondaryCta.href} className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Calculator</Link>
            <Link href="/plan" className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Planner</Link>
            <Link href="/doctor" className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Dough Doctor</Link>
            <Link href="/guide" className="rounded-full px-3 py-2 transition hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Guide</Link>
            <Link href="/account" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-ink shadow-sm transition hover:border-tomato/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Account</Link>
          </nav>
        </header>

        <section className="grid gap-8 overflow-hidden rounded-[2rem] bg-white p-6 shadow-card sm:p-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:p-10" aria-labelledby="homepage-hero-heading">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{homepageContent.hero.eyebrow}</p>
            <h1 id="homepage-hero-heading" className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[.92] text-ink sm:text-6xl lg:text-7xl">
              {homepageContent.hero.h1}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/65 sm:text-lg">
              {homepageContent.hero.intro}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={homepageContent.hero.primaryCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-6 py-3 text-sm font-extrabold text-white shadow-sm transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {homepageContent.hero.primaryCta.label} →
              </Link>
              <Link
                href={homepageContent.hero.secondaryCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-cream px-6 py-3 text-sm font-extrabold text-ink transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {homepageContent.hero.secondaryCta.label}
              </Link>
              <Link
                href={homepageContent.hero.learnCta.href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl px-6 py-3 text-sm font-extrabold text-ink/60 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {homepageContent.hero.learnCta.label}
              </Link>
            </div>
            <p className="mt-4 text-xs leading-5 text-ink/45">
              Your session is saved locally in this browser/device. No cloud sync. No tracking.
            </p>
          </div>

          <div className="relative hidden min-h-[20rem] overflow-hidden rounded-[1.75rem] bg-cream lg:block" aria-label="Pizza visual">
            <Image
              src="/pizza-styles/neapolitan.webp"
              alt="Neapolitan pizza with tomato, mozzarella and basil"
              fill
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/35 via-transparent to-transparent" />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_.85fr]" aria-label="Guidance and active session">
          <HomepageGuidanceLevelSection />
          <ContinuePizzaSessionCard className="h-full" />
        </section>

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="homepage-flow-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Your pizza session in 8 steps</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {homepageContent.workflow.map((step, index) => (
              <article key={step.title} className="rounded-[1.25rem] bg-cream/60 p-4 text-center">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-leaf/15 text-sm font-extrabold text-leaf">{index + 1}</span>
                <h3 className="mt-3 text-sm font-extrabold text-ink">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-ink/55">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4" aria-label="Local-first trust points">
          {homepageContent.trust.map((item) => (
            <div key={item} className="rounded-[1.25rem] bg-leaf/[.07] p-4">
              <span className="text-xl text-leaf" aria-hidden="true">◇</span>
              <p className="mt-2 text-sm font-extrabold text-ink">{item}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="homepage-tools-heading">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">All tools at your fingertips</p>
            <h2 id="homepage-tools-heading" className="sr-only">Secondary DoughTools tools</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              The guided session is the main path. Individual tools remain available when you already know what you need.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {homepageContent.coreTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm font-extrabold text-ink/70 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
              {homepageContent.secondaryTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="text-xs font-bold text-ink/55 transition hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {tool.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <InstallAppPrompt />
      </div>
    </main>
  );
}
