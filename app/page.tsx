import Link from "next/link";
import Image from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
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
      </div>
    </main>
  );
}
