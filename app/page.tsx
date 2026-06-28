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
    <main className="min-h-screen overflow-hidden bg-[#f2e6d6] text-ink">
      <section
        className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
        aria-labelledby="homepage-hero-heading"
      >
        <Image
          src="/pizza-styles/neapolitan.webp"
          alt="Neapolitan pizza with tomato, mozzarella and basil"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(246,238,224,0.98)_0%,rgba(246,238,224,0.9)_31%,rgba(246,238,224,0.56)_52%,rgba(246,238,224,0.12)_78%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#f2e6d6] to-transparent" />

        <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(22rem,0.68fr)] lg:items-start">
          <div className="flex min-h-[34rem] flex-col justify-center py-8 lg:py-12">
            <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
              {homepageContent.hero.eyebrow}
            </p>
            <h1 id="homepage-hero-heading" className="mt-5 max-w-[44rem] font-display text-6xl font-semibold leading-[.9] tracking-[-.035em] text-ink sm:text-7xl lg:text-8xl">
              {homepageContent.hero.h1}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink/70 sm:text-lg">
              {homepageContent.hero.intro}
            </p>
            <div className="mt-7">
              <Link
                href={homepageContent.hero.primaryCta.href}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-tomato px-7 py-3 text-base font-extrabold text-white shadow-lg shadow-tomato/20 transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {homepageContent.hero.primaryCta.label} →
              </Link>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-5 text-ink/45">
              Your session is saved locally in this browser/device. No cloud sync. No tracking.
            </p>

            <div className="mt-10 max-w-3xl">
              <HomepageGuidanceLevelSection />
            </div>
          </div>

          <div className="flex flex-col gap-5 pt-2 lg:pt-6">
            <ContinuePizzaSessionCard variant="hero" className="lg:ml-auto lg:w-[28rem]" />
            <div className="relative min-h-64 overflow-hidden rounded-[2rem] border border-white/40 bg-white/20 shadow-card backdrop-blur-sm lg:hidden" aria-label="Pizza visual">
              <Image
                src="/pizza-styles/neapolitan.webp"
                alt="Neapolitan pizza with tomato, mozzarella and basil"
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
