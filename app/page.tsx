import Link from "next/link";
import Image from "next/image";
import ContinuePizzaSessionCard from "@/components/ContinuePizzaSessionCard";
import HomeCalculatorWorkspace from "@/components/HomeCalculatorWorkspace";
import HomepageGuidanceLevelSection from "@/components/HomepageGuidanceLevelSection";
import { homepageContent } from "@/lib/homepage";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function calculatorViewFor(params: Record<string, string | string[] | undefined> | undefined) {
  if (!params) return null;

  const keys = Object.keys(params);
  if (keys.length === 0) return null;
  if (keys.length === 1 && params.calculator !== undefined) return "entry";

  return "full";
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const calculatorView = calculatorViewFor(params);

  if (calculatorView) {
    return <HomeCalculatorWorkspace variant={calculatorView} />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f2e6d6] text-ink">
      <section
        className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-8 lg:pt-14"
        aria-labelledby="homepage-hero-heading"
      >
        {/* Patch 103: supplied Image 3 is the desktop background asset. */}
        <Image
          src="/images/homepage/hero-desktop-bg.png"
          alt="Pizza with basil, mozzarella and tomato sauce on a flour-dusted table"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 hidden object-cover object-center md:block"
        />
        {/* Patch 103: supplied Image 4 is the mobile background asset. */}
        <Image
          src="/images/homepage/hero-mobile-bg.png"
          alt="Pizza with basil, mozzarella and tomato sauce on a flour-dusted table"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-top md:hidden"
        />
        <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(246,238,224,0.98)_0%,rgba(246,238,224,0.86)_32%,rgba(246,238,224,0.20)_57%,rgba(246,238,224,0)_75%)] md:block" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(246,238,224,0.96)_0%,rgba(246,238,224,0.82)_32%,rgba(246,238,224,0.10)_58%,rgba(246,238,224,0.92)_100%)] md:hidden" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#f2e6d6] to-transparent" />

        <div className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[92rem]">
          <div className="max-w-2xl pt-6 sm:pt-10 lg:pt-20">
            <p className="text-xs font-extrabold uppercase tracking-[.34em] text-tomato">
              {homepageContent.hero.eyebrow}
            </p>
            <h1 id="homepage-hero-heading" className="mt-5 max-w-[44rem] font-display text-6xl font-semibold leading-[.9] tracking-[-.035em] text-ink sm:text-7xl lg:text-8xl xl:text-[6.5rem]">
              {homepageContent.hero.h1}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink/75 sm:text-xl">
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
          </div>

          <ContinuePizzaSessionCard variant="hero" className="mt-[35vh] sm:mt-12 lg:absolute lg:right-12 lg:top-12 lg:mt-0 lg:w-[34rem] xl:right-20" />

          <div className="mt-10 max-w-3xl lg:absolute lg:bottom-10 lg:left-10 lg:mt-0 lg:w-[39rem] xl:left-20">
            <HomepageGuidanceLevelSection />
          </div>
        </div>
      </section>
    </main>
  );
}
